import string
from pydantic import BaseModel, field_validator

class QuestionSchema(BaseModel):
    title: str
    difficulty: str
    topics: list[str]
    description: str
    examples: list[dict]
    constraints: list[str]

    @field_validator('title', mode='before')
    @classmethod
    def validate_difficulty(cls, title):
        if not title:
            raise ValueError('Title need at least one character')
        elif not all(c in string.ascii_letters for c in title):
            raise ValueError('Invalid characters in title')
        
        return title

    @field_validator('difficulty', mode='before')
    @classmethod
    def validate_difficulty(cls, v):
        if v and v not in ('Easy', 'Medium', 'Hard'):
            raise ValueError('Invalid difficulty for question')
        
        return v
    
    @field_validator('topics', mode='before')
    @classmethod
    def validate_topics(cls, topics):
        if len(topics) < 1:
            raise ValueError('Need at least one topic')
        
        return topics
    
    @field_validator('examples', mode='before')
    @classmethod
    def validate_examples(cls, examples):
        if not examples:
            raise ValueError('Need at least one example')
        
        for example in examples:
            if 'input' not in example or 'output' not in example:
                raise ValueError('Must include both input and output for examples')
            
        return examples
    
    @field_validator('constraints', mode='before')
    @classmethod
    def validate_constraints(cls, constraints):
        if not constraints:
            raise ValueError('Need at least one constraint')
        
        return constraints
    

class RetrieveDeleteSchema(BaseModel):
    slug: str


class BulkDeleteSchema(BaseModel):
    slugs: list[str]

    @field_validator('slugs', mode='before')
    @classmethod
    def validate_slugs(cls, slugs):
        if not slugs:
            raise ValueError('Need at least one slug')

        cleaned = []
        seen = set()
        for slug in slugs:
            if not slug or not isinstance(slug, str):
                raise ValueError('Each slug must be a non-empty string')

            if slug not in seen:
                cleaned.append(slug)
                seen.add(slug)

        return cleaned
    

class AttemptSchema(BaseModel):
    session_id: str
    user_ids: list[str]
    slug: str
    language: str
    code: str

    @field_validator('user_ids', mode='before')
    @classmethod
    def validate_user_ids(cls, user_ids):
        if len(user_ids) != 2:
            raise ValueError('Unexpected numbers of users found')
        
        for id in user_ids:
            if not all(c in string.hexdigits for c in id):
                raise ValueError("Invalid user id")
            
        return user_ids
    

class RetrieveHistoryListSchema(BaseModel):
    user_id: str

    @field_validator('user_id', mode='before')
    @classmethod
    def validate_user_id(cls, user_id):
        if len(user_id) != 24 or not all(c in string.hexdigits for c in user_id):
            raise ValueError('Invalid user id') 
        
        return user_id
    
