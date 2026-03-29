import jwt
import os
import re
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from dotenv import load_dotenv
from fastapi import Cookie, Depends, FastAPI, HTTPException, Query, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pymongo import AsyncMongoClient, ReturnDocument, ASCENDING
from pymongo.errors import PyMongoError
from schema import QuestionSchema, RetrieveDeleteSchema, BulkDeleteSchema
from typing import Annotated
from utils import create_slug, normalize_topic

# Load constants from environment values
load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI")
PORT = int(os.getenv("PORT"))
SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"
EXEMPT_ROUTES = ["/", "/health", "/questions"]
VALID_DIFFICULTIES = ('Easy', 'Medium', 'Hard')
DIFFICULTY_ORDER = {difficulty: index for index, difficulty in enumerate(VALID_DIFFICULTIES)}
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

async def verify_jwt(request: Request, token: Annotated[str | None, Cookie()] = None, 
                     bearer: Annotated[HTTPAuthorizationCredentials, Depends(auth)] = None):
    # Check is route is exempted
    if request.url.path in EXEMPT_ROUTES:
        return None

    # Extract token from cookie, or bearer if not found
    jwt_token = token
    if not token and bearer:
        jwt_token = bearer.credentials

    if not jwt_token:
        raise HTTPException(
            status_code=404, 
            detail="Unauthenticated. Missing cookie or bearer token."
        )
    
    # Decode the token with stored secret
    try:
        payload = jwt.decode(jwt_token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail=f"Invalid token.")
    
async def verify_admin_access(payload: dict = Depends(verify_jwt)):
    # Check for existance of role key and respective values
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

# Initialize the application
app = FastAPI(lifespan=lifespan, dependencies=[Depends(verify_jwt)])

@app.get('/', dependencies=[])
async def home():
    '''
    The root page of the service.
    '''
    return "Peerprep Questions Service"

# ============================================
#             User access APIs
# ============================================

@app.get('/questions', dependencies=[])
async def get_questions(
    topic: str | None = Query(default=None),
    difficulty: str | None = Query(default=None),
):
    '''
    Retrieves questions in the database, optionally filtered by
    exact topic and/or exact difficulty.
    '''
    normalized_topic = normalize_topic(topic) if isinstance(topic, str) else ''
    normalized_difficulty = difficulty.strip() if isinstance(difficulty, str) else ''

    if normalized_difficulty and normalized_difficulty not in VALID_DIFFICULTIES:
        raise HTTPException(status_code=400, detail="Invalid difficulty")

    projection = {
        'title': 1,
        'slug': 1,
        'topics': 1,
        'difficulty': 1,
        'status': 1
    }
    filter = {}

    if normalized_topic:
        filter['topics'] = {
            '$regex': rf'^\s*{re.escape(normalized_topic)}\s*$',
            '$options': 'i',
        }

    if normalized_difficulty:
        filter['difficulty'] = normalized_difficulty
    
    try:
        cursor = collection.find(filter, projection)
        results = await cursor.to_list(length=10000)
    except PyMongoError as e:
        raise HTTPException(status_code=503, detail="Database unavailable, please try again later") from e

    for r in results:
        r['_id'] = str(r['_id'])
    return results

@app.get('/questions/topics')
async def get_all_topics():
    '''
    Retrieves all distinct topics in the database, along with the
    available difficulty levels for each topic.
    '''
    projection = {
        'topics': 1,
        'difficulty': 1,
    }

    try:
        raw_questions = await collection.find({}, projection).to_list(length=10000)
    except PyMongoError as e:
        raise HTTPException(status_code=503, detail="Database unavailable, please try again later") from e

    topic_difficulties = {}
    for question in raw_questions:
        difficulty = question.get('difficulty')
        if difficulty not in VALID_DIFFICULTIES:
            continue

        for raw_topic in question.get('topics', []):
            if not isinstance(raw_topic, str):
                continue

            topic = normalize_topic(raw_topic)
            if not topic:
                continue

            if topic not in topic_difficulties:
                topic_difficulties[topic] = set()
            topic_difficulties[topic].add(difficulty)

    topics = sorted(topic_difficulties.keys(), key=str.lower)
    serialized_topic_difficulties = {
        topic: sorted(topic_difficulties[topic], key=lambda difficulty: DIFFICULTY_ORDER[difficulty])
        for topic in topics
    }
    return {
        'topics': topics,
        'topicDifficulties': serialized_topic_difficulties,
    }

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
