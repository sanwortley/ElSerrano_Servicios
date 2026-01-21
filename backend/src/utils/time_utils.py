from datetime import datetime, timedelta, timezone

ARG_OFFSET = timedelta(hours=-3)
ARG_TZ = timezone(ARG_OFFSET)

def get_now_arg():
    return datetime.now(ARG_TZ).replace(tzinfo=None) # Naive for DB consistency

def format_arg(dt: datetime):
    if not dt:
        return ""
    # Add offset and return formatted
    return (dt + ARG_OFFSET).strftime("%d/%m/%Y %H:%M")
