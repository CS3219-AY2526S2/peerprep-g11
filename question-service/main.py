import jwt
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from dotenv import load_dotenv
from fastapi import Cookie, Depends, FastAPI, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pymongo import AsyncMongoClient, ReturnDocument, ASCENDING
from pymongo.errors import PyMongoError
from schema import QuestionSchema, RetrieveDeleteSchema, BulkDeleteSchema
from typing import Annotated
from utils import create_slug

# Load constants from environment values
load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI")
PORT = int(os.getenv("PORT"))
SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"
auth = HTTPBearer(auto_error=False)

# Init mongodb client
client = AsyncMongoClient(MONGODB_URI)
db = client['question-service']
collection = db['questions']

# Make the slug column be index for faster search
@asynccontextmanager
async def lifespan(app):
    await collection.create_index(
        [('slug', ASCENDING)],
        unique=True,\
        background=True)
    yield

async def verify_jwt(token: Annotated[str | None, Cookie()] = None, 
                     bearer: Annotated[HTTPAuthorizationCredentials, Depends(auth)] = None):
    jwt_token = token

    if not token and bearer:
        jwt_token = bearer.credentials

    if not jwt_token:
        raise HTTPException(
            status_code=401, 
            detail="Unauthenticated. Missing cookie or bearer token."
        )
    
    try:
        payload = jwt.decode(jwt_token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail=f"Invalid token.")
    
async def verify_admin_access(payload: dict = Depends(verify_jwt)):
    if 'role' not in payload:
        raise HTTPException(
            status_code=401, 
            detail="User role not found."
        )
    elif payload['role'] != "admin":
        raise HTTPException(
            status_code=403, 
            detail="Operation restricted to administrators."
        )
    
    return payload

# Initialize the application and bearer authentication
app = FastAPI(lifespan=lifespan, dependencies=[Depends(verify_jwt)])

@app.get('/')
async def home():
    '''
    The root page of the service.
    '''
    return "Peerprep Questions Service"

# ============================================
#             User access APIs
# ============================================

@app.get('/questions/all')
async def get_all_questions():
    '''
    Retrieves all questions in the database.
    '''
    projection = {
        'title': 1,
        'slug': 1,
        'topics': 1,
        'difficulty': 1,
        'status': 1
    }
    
    try:
        cursor = collection.find({}, projection)
        results = await cursor.to_list(length=100)
    except PyMongoError as e:
        raise HTTPException(status_code=503, detail="Database unavailable, please try again later") from e

    for r in results:
        r['_id'] = str(r['_id'])
    return results

@app.get('/questions/topics')
async def get_all_topics():
    '''
    Retrieves all distinct topics in the database.
    '''
    try:
        raw_topics = await collection.distinct('topics')
    except PyMongoError as e:
        raise HTTPException(status_code=503, detail="Database unavailable, please try again later") from e

    topics = sorted(
        {
            topic.strip()
            for topic in raw_topics
            if isinstance(topic, str) and topic.strip()
        },
        key=str.lower,
    )
    return {'topics': topics}

@app.get('/questions/{question_slug}')
async def get_question(question_slug: str):
    '''
    Retrieves a question by exact title.
    Returns 404 if the question is not found.
    '''
    filter = {'slug': question_slug}
    try:
        question = await collection.find_one(filter)
    except PyMongoError as e:
        raise HTTPException(status_code=503, detail="Database unavailable, please try again later") from e
    
    if not question:
        raise HTTPException(status_code=404, detail=f"Question {question_slug} not found")

    question['_id'] = str(question['_id'])
    return question

@app.get('/questions/topic/{topic}')
async def get_question_by_topic(topic: str, difficulty: str):
    '''
    Retrieves a question by topic and dffficulty
    '''
    filter = {
        'topics': {'$in': [topic]},
        'difficulty': difficulty
    }
    projection = {
        '_id': 0,
        'status': 0,
        'created_at': 0,
        'updated_at': 0
    }

    try:
        cursor = collection.find(filter, projection)
        results = await cursor.to_list()
    except PyMongoError as e:
        raise HTTPException(status_code=503, detail="Database unavailable, please try again later") from e

    return results

# ============================================
#             Admin access APIs
# ============================================

@app.post('/questions/upsert', status_code=201)
async def add_question(question: QuestionSchema, admin: dict = Depends(verify_admin_access)):
    '''
    Upsert (update/insert) a question to the database.
    Admin access only.

    - If no document with exact title exists, inserts a new one.
    - If matching title is found, updates the content and updated_at.
    '''

    data = question.model_dump()
    title = data['title']
    slug = create_slug(title)
    now = datetime.now(timezone.utc).isoformat()

    filter = {'title': title, 'slug': slug}
    set_fields = {key: value for key, value in data.items() if key != 'title'}
    set_fields['updated_at'] = now
    update = {
        '$set': set_fields,
        '$setOnInsert': {'created_at': now, 'title': title, 'slug': slug, 'status': "Pending"}
    }

    try:
        result = await collection.find_one_and_update(filter, update, upsert=True, return_document=ReturnDocument.AFTER)
    except PyMongoError as e:
        raise HTTPException(status_code=503, detail="Database unavailable, please try again later") from e
    
    is_inserted = result['created_at'] == now
    result = {'created_at': result['created_at'],
              'updated_at': now,
              'title': title,
              'slug': slug}
    if is_inserted:
        result['message'] = "Question added."
        return result
    
    result['message'] = "Question updated."
    return result

@app.delete('/questions/delete')
async def delete_question(question: RetrieveDeleteSchema, admin: dict = Depends(verify_admin_access)):
    '''
    Deletes a question by its exact slug.
    Returns 404 if the question is not found.
    Admin access only.
    '''
    title = question.title
    filter = {'slug': create_slug(title)}

    try:
        result = await collection.delete_one(filter)
    except PyMongoError as e:
        raise HTTPException(status_code=503, detail="Database unavailable, please try again later") from e
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Question {question.slug} not found")
    
    return {'message': "Deleted", 'title': question.slug}


@app.post('/questions/bulk-delete')
async def bulk_delete_questions(payload: BulkDeleteSchema, admin: dict = Depends(verify_admin_access)):
    '''
    Deletes multiple questions by slug.
    Returns 404 without deleting anything if any requested slug does not exist.
    '''
    requested_slugs = payload.slugs
    filter = {'slug': {'$in': requested_slugs}}
    projection = {'title': 1, 'slug': 1}

    try:
        matched = await collection.find(filter, projection).to_list(length=len(requested_slugs))
    except PyMongoError as e:
        raise HTTPException(status_code=503, detail="Database unavailable, please try again later") from e

    matched_by_slug = {question['slug']: question for question in matched}
    missing_slugs = [slug for slug in requested_slugs if slug not in matched_by_slug]

    if missing_slugs:
        raise HTTPException(
            status_code=404,
            detail={
                'message': 'Some questions were not found',
                'missingSlugs': missing_slugs,
            },
        )

    deleted = [
        {'slug': matched_by_slug[slug]['slug'], 'title': matched_by_slug[slug]['title']}
        for slug in requested_slugs
    ]

    try:
        result = await collection.delete_many(filter)
    except PyMongoError as e:
        raise HTTPException(status_code=503, detail="Database unavailable, please try again later") from e

    return {'deletedCount': result.deleted_count, 'deleted': deleted}

@app.get('/health', dependencies=[])
async def health_check():
    try:
        await client.admin.command("ping")
    except PyMongoError as e:
        raise HTTPException(status_code=503, detail="Database unavailable, please try again later") from e
    
    return {'status': "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
