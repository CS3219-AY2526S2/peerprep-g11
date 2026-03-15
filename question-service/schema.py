from pydantic import BaseModel, field_validator

class QuestionSchema(BaseModel):
    title: str
    difficulty: str
    topics: list[str]
    description: str
    examples: list[dict]
    constraints: list[str]

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
            raise ValueError('Need at least one topic')
        
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
    