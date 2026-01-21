
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
            headers = {"User-Agent": settings.NOMINATIM_USER_AGENT}
            params = {"q": address, "format": "json", "limit": 1}
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
            print(f"Geocoding error: {e}")
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
