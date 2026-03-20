
import json
import hashlib
import httpx
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from shapely.geometry import shape, Point
from src.config import settings
from src.models.geo import GeocodeCache, Zona

async def get_lat_lng(address: str, db: AsyncSession):
    # Normalize
    address_norm = address.strip().lower()
    query_hash = hashlib.sha256(address_norm.encode("utf-8")).hexdigest()

    # Check Cache
    stmt = select(GeocodeCache).where(GeocodeCache.query_hash == query_hash)
    result = await db.execute(stmt)
    cached = result.scalar_one_or_none()
    
    if cached:
        return cached.lat, cached.lng

    # Fetch from Nominatim
    async with httpx.AsyncClient() as client:
        try:
            url = "https://nominatim.openstreetmap.org/search"
            headers = {"User-Agent": settings.NOMINATIM_USER_AGENT or "ElSerrano-App"}
            
            # Build a cleaner query
            clean_query = address
            if "córdoba" not in clean_query.lower():
                clean_query += ", Córdoba"
            if "argentina" not in clean_query.lower():
                clean_query += ", Argentina"

            # Use viewbox to bias results towards the operative region (Calamuchita/Córdoba)
            params = {
                "q": clean_query,
                "format": "json",
                "limit": 10, # Get more results to find one in-zone
                "viewbox": "-65.0,-32.5,-63.0,-30.5",
                "bounded": 0
            }
            response = await client.get(url, params=params, headers=headers)
            data = response.json()
            
            if data and len(data) > 0:
                # Try to find the best candidate that falls inside a zone
                stmt = select(Zona).where(Zona.activo == True)
                res = await db.execute(stmt)
                zones = res.scalars().all()
                zone_shapes = []
                for z in zones:
                    try: zone_shapes.append(shape(json.loads(z.polygon_geojson)))
                    except: continue

                selected_candidate = data[0] # Fallback to first if none in zone
                for item in data:
                    c_lat = float(item["lat"])
                    c_lng = float(item["lon"])
                    c_point = Point(c_lng, c_lat)
                    
                    found_in_zone = False
                    for s in zone_shapes:
                        if s.buffer(0.0001).contains(c_point):
                            found_in_zone = True
                            break
                    
                    if found_in_zone:
                        selected_candidate = item
                        break

                lat = float(selected_candidate["lat"])
                lng = float(selected_candidate["lon"])
                
                # Save to cache
                new_cache = GeocodeCache(
                    query_hash=query_hash,
                    direccion_normalizada=address_norm,
                    lat=lat,
                    lng=lng,
                    raw_json=selected_candidate
                )
                db.add(new_cache)
                await db.commit()
                
                return lat, lng
        except Exception as e:
            print(f"Geocoding error for {address}: {e}")
            return None, None
            
    return None, None


async def find_zone_for_point(lat: float, lng: float, db: AsyncSession, detailed: bool = False):
    point = Point(lng, lat) # Shapely uses (x, y) = (lng, lat)
    
    # Get all active zones
    stmt = select(Zona).where(Zona.activo == True)
    result = await db.execute(stmt)
    zones = result.scalars().all()
    
    # Use a small buffer (approx 5 meters in degrees) to handle precision issues
    # 0.00005 is roughly 5 meters
    PRECISION_BUFFER = 0.00005

    closest_zone = None
    min_distance_meters = float('inf')

    for zone in zones:
        try:
            poly_geojson = json.loads(zone.polygon_geojson)
            poly_shape = shape(poly_geojson)
            
            # Use buffer for more robust intersection at edges
            if poly_shape.buffer(PRECISION_BUFFER).contains(point):
                if detailed:
                    return zone.id, None
                return zone.id
            
            # Distance calculation for debugging
            # Shapely distance is in degrees. Approx 1 deg = 111,000 meters
            dist_deg = poly_shape.distance(point)
            dist_meters = dist_deg * 111000 # Rough approx
            if dist_meters < min_distance_meters:
                min_distance_meters = dist_meters
                closest_zone = zone.nombre

        except Exception as e:
            print(f"Error checking zone {zone.id}: {e}")
            continue
            
    if detailed:
        debug_info = {
            "closest_zone": closest_zone,
            "distance_meters": int(min_distance_meters) if min_distance_meters != float('inf') else None
        }
        return None, debug_info

    return None

async def get_locality_boundary(locality_name: str):
    """
    Fetches the GeoJSON boundary for a locality from Nominatim.
    Prioritizes actual boundaries (Polygons) over points.
    """
    async with httpx.AsyncClient() as client:
        try:
            url = "https://nominatim.openstreetmap.org/search"
            headers = {"User-Agent": settings.NOMINATIM_USER_AGENT or "ElSerrano-App"}
            full_query = f"{locality_name}, Córdoba, Argentina"
            params = {
                "q": full_query,
                "format": "json",
                "polygon_geojson": 1,
                "limit": 20 # Increased limit to find the right boundary among many results
            }
            response = await client.get(url, params=params, headers=headers)
            data = response.json()
            
            if data:
                # 1. Search for ADMINISTRATIVE BOUNDARIES (Polygons)
                # We want places like city, town, village, or administrative boundaries
                for item in data:
                    item_class = item.get("class", "").lower()
                    item_type = item.get("type", "").lower()
                    geojson = item.get("geojson", {})
                    
                    if geojson.get("type") in ["Polygon", "MultiPolygon"]:
                        # High priority: boundaries and place levels
                        if item_class == "boundary" or item_class == "place":
                            return {
                                "display_name": item["display_name"],
                                "geojson": geojson,
                                "type": geojson["type"]
                            }

                # 2. Secondary search for any other Polygon (not a person/business if possible)
                for item in data:
                    item_class = item.get("class", "").lower()
                    geojson = item.get("geojson", {})
                    if geojson.get("type") in ["Polygon", "MultiPolygon"]:
                        # Avoid known building/commercial classes if better options might exist
                        if item_class not in ["tourism", "building", "commercial", "industrial"]:
                            return {
                                "display_name": item["display_name"],
                                "geojson": geojson,
                                "type": geojson["type"]
                            }
                
                # 3. Fallback to first result but warn if it's a point
                return {
                    "display_name": data[0]["display_name"],
                    "geojson": data[0].get("geojson"),
                    "type": data[0].get("geojson", {}).get("type", "Unknown")
                }
        except Exception as e:
            print(f"Error fetching boundary for {locality_name}: {e}")
            return None
    return None

async def search_addresses(query: str, db: AsyncSession):
    """
    Returns multiple address candidates for a given query, filtered by operative zones.
    """
    async with httpx.AsyncClient() as client:
        try:
            url = "https://nominatim.openstreetmap.org/search"
            headers = {"User-Agent": settings.NOMINATIM_USER_AGENT or "ElSerrano-App"}
            
            params = {
                "q": query,
                "format": "json",
                "limit": 40, # High limit because we filter heavily
                "addressdetails": 1,
                "viewbox": "-65.0,-32.5,-63.0,-30.5", 
                "bounded": 0 
            }
            if "córdoba" not in query.lower():
                params["q"] += ", Córdoba, Argentina"

            response = await client.get(url, params=params, headers=headers)
            data = response.json()
            
            # Get all active zones from DB
            stmt = select(Zona).where(Zona.activo == True)
            res_zones = await db.execute(stmt)
            zones = res_zones.scalars().all()
            
            zone_shapes = []
            for z in zones:
                try:
                    zone_shapes.append(shape(json.loads(z.polygon_geojson)))
                except:
                    continue

            suggestions = []
            import re
            query_number = None
            num_match = re.search(r'\b(\d+)\b', query)
            if num_match:
                query_number = num_match.group(1)

            for item in data:
                lat = float(item["lat"])
                lng = float(item["lon"])
                point = Point(lng, lat)
                
                # Check if point is inside ANY of our zones (with buffer)
                is_inside = False
                for s in zone_shapes:
                    if s.buffer(0.0001).contains(point): # 10m buffer for suggestions
                        is_inside = True
                        break
                
                if not is_inside:
                    continue # Filter out locations outside zones

                addr = item.get("address", {})
                house_number = addr.get("house_number")
                road = addr.get("road") or addr.get("pedestrian") or addr.get("cycleway") or addr.get("path")
                
                display_name = item["display_name"]
                if query_number and not house_number:
                    if road and road.lower() in display_name.lower() and query_number not in display_name:
                        display_name = f"{road} {query_number}, {display_name.split(road, 1)[-1].strip(', ')}"

                suggestions.append({
                    "display_name": display_name,
                    "lat": lat,
                    "lng": lng,
                    "city": addr.get("city") or addr.get("town") or addr.get("village") or addr.get("suburb") or addr.get("neighbourhood")
                })
            return suggestions
        except Exception as e:
            print(f"Error searching addresses for {query}: {e}")
            return []
            
    return []
async def reverse_geocode(lat: float, lng: float):
    """
    Translates coordinates into a human-readable address.
    """
    async with httpx.AsyncClient() as client:
        try:
            url = "https://nominatim.openstreetmap.org/reverse"
            headers = {"User-Agent": settings.NOMINATIM_USER_AGENT or "ElSerrano-App"}
            params = {
                "lat": lat,
                "lon": lng,
                "format": "json",
                "addressdetails": 1
            }
            response = await client.get(url, params=params, headers=headers)
            data = response.json()
            if data and "display_name" in data:
                return {
                    "display_name": data["display_name"],
                    "address": data.get("address", {})
                }
        except Exception as e:
            print(f"Reverse geocoding error: {e}")
            return None
    return None
