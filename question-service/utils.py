import re
from datetime import datetime, timezone

def create_slug(title: str):
    '''
    Creates a slug from provided title.
    '''
    title = title.lower().strip()
    title = re.sub(r'[^\w\s-]', '', title) # Remove special chars
    title = re.sub(r'[\s_-]+', '-', title) # Replace spaces/underscores with hyphens
    return title

def normalize_topic(topic: str):
    '''
    Normalizes topic values for API responses and lookups.
    '''
    return topic.strip()

def create_timestamp() -> str:
    '''
    Creates a timestamp
    '''
    return datetime.now(timezone.utc).isoformat()