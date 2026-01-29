
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
                "limit": 1,
                "viewbox": "-65.0,-32.5,-63.0,-30.5",
                "bounded": 0
            }
            response = await client.get(url, params=params, headers=headers)
            data = response.json()
            
            if data and len(data) > 0:
                lat = float(data[0]["lat"])
                lng = float(data[0]["lon"])
                
                # Save to cache
                new_cache = GeocodeCache(
                    query_hash=query_hash,
                    direccion_normalizada=address_norm,
                    lat=lat,
                    lng=lng,
                    raw_json=data[0]
                )
                db.add(new_cache)
                await db.commit()
                
                return lat, lng
        except Exception as e:
            print(f"Geocoding error for {address}: {e}")
            return None, None
            
    return None, None


async def find_zone_for_point(lat: float, lng: float, db: AsyncSession):
    point = Point(lng, lat) # Shapely uses (x, y) = (lng, lat)
    
    # Get all active zones
    stmt = select(Zona).where(Zona.activo == True)
    result = await db.execute(stmt)
    zones = result.scalars().all()
    
    for zone in zones:
        try:
            poly_geojson = json.loads(zone.polygon_geojson)
            poly_shape = shape(poly_geojson)
            if poly_shape.contains(point):
                return zone.id
        except Exception as e:
            print(f"Error checking zone {zone.id}: {e}")
            continue
            
    return None

async def get_locality_boundary(locality_name: str):
    """
    Fetches the GeoJSON boundary for a locality from Nominatim.
    """
    async with httpx.AsyncClient() as client:
        try:
            url = "https://nominatim.openstreetmap.org/search"
            headers = {"User-Agent": settings.NOMINATIM_USER_AGENT or "ElSerrano-App"}
            # Search filter for Córdoba, Argentina to be more precise
            full_query = f"{locality_name}, Córdoba, Argentina"
            params = {
                "q": full_query,
                "format": "json",
                "polygon_geojson": 1,
                "limit": 1
            }
            response = await client.get(url, params=params, headers=headers)
            data = response.json()
            
            if data and len(data) > 0:
                return {
                    "display_name": data[0]["display_name"],
                    "geojson": data[0].get("geojson")
                }
        except Exception as e:
            print(f"Error fetching boundary for {locality_name}: {e}")
            return None
            
    return None

async def search_addresses(query: str):
    """
    Returns multiple address candidates for a given query.
    """
    async with httpx.AsyncClient() as client:
        try:
            url = "https://nominatim.openstreetmap.org/search"
            headers = {"User-Agent": settings.NOMINATIM_USER_AGENT or "ElSerrano-App"}
            # We broaden the search slightly to ensure we get regional results
            # Try to get more results and bias them towards the region
            params = {
                "q": query,
                "format": "json",
                "limit": 10,
                "addressdetails": 1,
                "viewbox": "-65.0,-32.5,-63.0,-30.5", # Bounding box roughly for Córdoba region
                "bounded": 0 # Bias but don't strictly bound if no results found
            }
            # Add regional hints to string if not present
            if "córdoba" not in query.lower():
                params["q"] += ", Córdoba, Argentina"

            response = await client.get(url, params=params, headers=headers)
            data = response.json()
            
            suggestions = []
            import re
            # Extract number from query if present (e.g., "Street 123" -> 123)
            query_number = None
            num_match = re.search(r'\b(\d+)\b', query)
            if num_match:
                query_number = num_match.group(1)

            for item in data:
                addr = item.get("address", {})
                house_number = addr.get("house_number")
                road = addr.get("road") or addr.get("pedestrian") or addr.get("cycleway") or addr.get("path")
                
                # If OSM didn't find the house number but the user typed one, 
                # and we found the right road, let's "inject" it for better UX
                display_name = item["display_name"]
                if query_number and not house_number:
                    # If the display name doesn't have the number but we have the road
                    if road and road.lower() in display_name.lower() and query_number not in display_name:
                        # Prepend or insert number after road
                        display_name = f"{road} {query_number}, {display_name.split(road, 1)[-1].strip(', ')}"

                suggestions.append({
                    "display_name": display_name,
                    "lat": float(item["lat"]),
                    "lng": float(item["lon"]),
                    "city": addr.get("city") or addr.get("town") or addr.get("village") or addr.get("suburb") or addr.get("neighbourhood")
                })
            return suggestions
        except Exception as e:
            print(f"Error searching addresses for {query}: {e}")
            return []
            
    return []
