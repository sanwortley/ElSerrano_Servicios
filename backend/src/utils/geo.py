import json
import hashlib
import httpx
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
try:
    from shapely.geometry import shape, Point
    SHAPELY_AVAILABLE = True
except (ImportError, OSError, Exception):
    print("Warning: shapely or libgeos not found. Custom zone detection fallback will be disabled.")
    SHAPELY_AVAILABLE = False
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

    # Custom Zonas check: if the address matches a Barrio Privado/Zona
    stmt_zones = select(Zona).where(Zona.activo == True)
    res_zones = await db.execute(stmt_zones)
    zones = res_zones.scalars().all()
    
    query_norm_text = ' '.join([w for w in address_norm.replace("barrio", "").replace("privado", "").replace("lote", "").replace("country", "").replace(",", "").split() if not w.isnumeric()])
    if len(query_norm_text) > 3:
        for z in zones:
            z_norm = z.nombre.lower().replace("barrio", "").replace("privado", "").replace("country", "").strip()
            if len(z_norm) > 3 and z_norm in query_norm_text:
                try:
                    s = shape(json.loads(z.polygon_geojson))
                    centroid = s.centroid
                    new_cache = GeocodeCache(
                        query_hash=query_hash,
                        direccion_normalizada=address_norm,
                        lat=centroid.y,
                        lng=centroid.x,
                        raw_json={"source": "zona_centroid", "zone": z.nombre}
                    )
                    db.add(new_cache)
                    await db.commit()
                    return centroid.y, centroid.x
                except Exception as e:
                    pass

    # Fetch from Google Maps or Nominatim
    async with httpx.AsyncClient() as client:
        try:
            if settings.GOOGLE_MAPS_API_KEY:
                # GOOGLE MAPS GEOCODING
                url = "https://maps.googleapis.com/maps/api/geocode/json"
                params = {
                    "address": address,
                    "key": settings.GOOGLE_MAPS_API_KEY,
                    "region": "ar",
                    "language": "es"
                }
                # Add location bias for Cordoba/Calamuchita
                params["location"] = "-32.1,-64.5"
                params["radius"] = "80000" # 80km

                response = await client.get(url, params=params)
                data = response.json()
                
                if data.get("status") == "OK" and data.get("results"):
                    selected_candidate = data["results"][0]
                    lat = selected_candidate["geometry"]["location"]["lat"]
                    lng = selected_candidate["geometry"]["location"]["lng"]
                    
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
            
            # FALLBACK TO NOMINATIM
            url = "https://nominatim.openstreetmap.org/search"
            headers = {"User-Agent": settings.NOMINATIM_USER_AGENT or "ElSerrano-App"}
            
            # ... (build query)
            clean_query = address
            if "córdoba" not in clean_query.lower(): clean_query += ", Córdoba"
            if "argentina" not in clean_query.lower(): clean_query += ", Argentina"

            params = { "q": clean_query, "format": "json", "limit": 10, "viewbox": "-65.0,-32.5,-63.0,-30.5", "bounded": 0 }
            response = await client.get(url, params=params, headers=headers)
            data = response.json()
            
            if data and len(data) > 0:
                selected_candidate = data[0]
                if SHAPELY_AVAILABLE:
                    # Try to find the best candidate that falls inside a zone
                    stmt = select(Zona).where(Zona.activo == True)
                    res = await db.execute(stmt)
                    zones = res.scalars().all()
                    zone_shapes = []
                    for z in zones:
                        try: zone_shapes.append(shape(json.loads(z.polygon_geojson)))
                        except: continue

                    for item in data:
                        c_lat, c_lng = float(item["lat"]), float(item["lon"])
                        c_point = Point(c_lng, c_lat)
                        if any(s.buffer(0.0001).contains(c_point) for s in zone_shapes):
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
            # 1. OPTIONAL GOOGLE PLACES AUTOCOMPLETE
            if settings.GOOGLE_MAPS_API_KEY:
                url = "https://maps.googleapis.com/maps/api/place/autocomplete/json"
                params = {
                    "input": query,
                    "key": settings.GOOGLE_MAPS_API_KEY,
                    "location": "-32.1,-64.5", # Calamuchita bias
                    "radius": "80000",
                    "components": "country:ar",
                    "language": "es"
                }
                response = await client.get(url, params=params)
                data = response.json()
                
                if data.get("status") == "OK":
                    google_suggestions = []
                    for p in data["predictions"]:
                        # For each prediction, we need to geocode it to get Lat/Lng
                        # In a real app we might defer this until selection, but the current UI expects it.
                        google_suggestions.append({
                            "display_name": p["description"],
                            "place_id": p["place_id"],
                            "city": next((t for t in p.get("terms", []) if "Cordoba" in t.get("value", "")), "Córdoba"),
                            "is_google": True
                        })
                    
                    # Resolve Lat/Lng for Google suggestions (limited to first 5 for speed)
                    final_google = []
                    for gs in google_suggestions[:5]:
                        g_url = "https://maps.googleapis.com/maps/api/geocode/json"
                        g_res = await client.get(g_url, params={"place_id": gs["place_id"], "key": settings.GOOGLE_MAPS_API_KEY})
                        g_data = g_res.json()
                        if g_data.get("status") == "OK":
                            loc = g_data["results"][0]["geometry"]["location"]
                            gs["lat"] = loc["lat"]
                            gs["lng"] = loc["lng"]
                            final_google.append(gs)
                    
                    if final_google:
                        return final_google

            # 2. NOMINATIM FALLBACK
            url = "https://nominatim.openstreetmap.org/search"
            headers = {"User-Agent": settings.NOMINATIM_USER_AGENT or "ElSerrano-App"}
            
            params = { "q": query, "format": "json", "limit": 40, "addressdetails": 1, "viewbox": "-65.0,-32.5,-63.0,-30.5", "bounded": 0 }
            if "córdoba" not in query.lower(): params["q"] += ", Córdoba, Argentina"

            response = await client.get(url, params=params, headers=headers)
            data = response.json()
            
            suggestions = []
            if SHAPELY_AVAILABLE:
                # ... (Rest of Nominatim filtering logic with shapely)
                stmt = select(Zona).where(Zona.activo == True)
                res_zones = await db.execute(stmt)
                zones = res_zones.scalars().all()
                
                zone_shapes = []
                for z in zones:
                    try: zone_shapes.append((z, shape(json.loads(z.polygon_geojson))))
                    except: continue

                import re
                query_number = None
                num_match = re.search(r'\b(\d+)\b', query)
                if num_match: query_number = num_match.group(1)

                # Custom Zonas check
                query_norm = query.lower().replace("barrio", "").replace("privado", "").replace("lote", "").replace("country", "").replace(",", "").strip()
                query_norm_text = ' '.join([w for w in query_norm.split() if not w.isnumeric()])
                if len(query_norm_text) > 3:
                    for z, s in zone_shapes:
                        z_norm = z.nombre.lower().replace("barrio", "").replace("privado", "").replace("country", "").strip()
                        if len(z_norm) > 3 and z_norm in query_norm_text:
                            centroid = s.centroid
                            display_name = f"{z.nombre}"
                            if query_number: display_name = f"Lote {query_number}, {z.nombre}"
                            suggestions.append({
                                "display_name": f"{display_name} (Barrio Privado)",
                                "lat": centroid.y, "lng": centroid.x, "city": "ZONA EL SERRANO"
                            })

                for item in data:
                    lat, lng = float(item["lat"]), float(item["lon"])
                    point = Point(lng, lat)
                    if any(s.buffer(0.0001).contains(point) for z, s in zone_shapes):
                        addr = item.get("address", {})
                        display_name = item["display_name"]
                        suggestions.append({ "display_name": display_name, "lat": lat, "lng": lng, "city": addr.get("city") or addr.get("town") or "Córdoba" })
            else:
                # Simple fallback if shapely is missing
                for item in data[:10]:
                    addr = item.get("address", {})
                    suggestions.append({ 
                        "display_name": item["display_name"], 
                        "lat": float(item["lat"]), "lng": float(item["lon"]), 
                        "city": addr.get("city") or addr.get("town") or "Córdoba" 
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
            if settings.GOOGLE_MAPS_API_KEY:
                url = "https://maps.googleapis.com/maps/api/geocode/json"
                params = {
                    "latlng": f"{lat},{lng}",
                    "key": settings.GOOGLE_MAPS_API_KEY,
                    "language": "es"
                }
                response = await client.get(url, params=params)
                data = response.json()
                if data.get("status") == "OK" and data.get("results"):
                    best = data["results"][0]
                    return {
                        "display_name": best["formatted_address"],
                        "address": { "full": best["formatted_address"] } # Simplified structure
                    }

            # NOMINATIM FALLBACK
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
