import re

def create_slug(title: str):
    '''
    Creates a slug from provided title.
    '''
    title = title.lower().strip()
    title = re.sub(r'[^\w\s-]', '', title) # Remove special chars
    title = re.sub(r'[\s_-]+', '-', title) # Replace spaces/underscores with hyphens
    return title