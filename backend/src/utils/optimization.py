import math

def calculate_distance(lat1, lng1, lat2, lng2):
    # Haversine or simple Euclidean for small areas?
    # Simple Euclidean on lat/lng is okay for local sorting if not crossing poles/dates.
    return math.sqrt((lat1 - lat2)**2 + (lng1 - lng2)**2)

def sort_by_nearest_neighbor(items):
    """
    Items must have .lat and .lng attributes.
    Returns sorted list.
    """
    if not items:
        return []

    # Filter items with valid lat/lng
    valid_items = [i for i in items if i.lat is not None and i.lng is not None]
    invalid_items = [i for i in items if i.lat is None or i.lng is None] # Append at end
    
    if not valid_items:
        return invalid_items

    # Start with the first one in the list (or could be central depot)
    # Ideally we'd have a depot location. Without it, just take the first one.
    sorted_items = [valid_items.pop(0)]
    
    while valid_items:
        current = sorted_items[-1]
        # Find closest
        closest_idx = -1
        min_dist = float('inf')
        
        for i, item in enumerate(valid_items):
            dist = calculate_distance(current.lat, current.lng, item.lat, item.lng)
            if dist < min_dist:
                min_dist = dist
                closest_idx = i
        
        sorted_items.append(valid_items.pop(closest_idx))
        
    return sorted_items + invalid_items
