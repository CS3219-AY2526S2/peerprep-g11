import os
import re
from bson import ObjectId
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from pymongo import AsyncMongoClient, ReturnDocument, ASCENDING
from pymongo.errors import PyMongoError
from schema import QuestionSchema, DeleteSchema, BulkDeleteSchema

load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
PORT = int(os.getenv("PORT", "8000"))

client = AsyncMongoClient(MONGODB_URI)
db = client['question-service']
collection = db['questions']

VALID_DIFFICULTIES = ('Easy', 'Medium', 'Hard')
DIFFICULTY_ORDER = {difficulty: index for index, difficulty in enumerate(VALID_DIFFICULTIES)}

@asynccontextmanager
async def lifespan(app):
    await collection.create_index(
        [('slug', ASCENDING)],
        unique=True,\
        background=True)
    yield

app = FastAPI(lifespan=lifespan)

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

def sort_difficulties(difficulties: set[str]):
    '''
    Sorts difficulties in the fixed PeerPrep order.
    '''
    return sorted(difficulties, key=lambda difficulty: DIFFICULTY_ORDER[difficulty])

@app.get('/')
async def home():
    '''
    The root page of the service.
    '''
    return "Peerprep Questions Service"

@app.get('/questions')
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
        topic: sort_difficulties(topic_difficulties[topic])
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

@app.post('/questions/upsert', status_code=201)
async def add_question(question: QuestionSchema):
    '''
    Upsert (update/insert) a question to the database.

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
async def delete_question(question: DeleteSchema):
    '''
    Deletes a question by its exact slug.
    Returns 404 if the question is not found.
    '''
    filter = {'slug': question.slug}

    try:
        result = await collection.delete_one(filter)
    except PyMongoError as e:
        raise HTTPException(status_code=503, detail="Database unavailable, please try again later") from e
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Question {question.slug} not found")
    
    return {'message': "Deleted", 'title': question.slug}


@app.post('/questions/bulk-delete')
async def bulk_delete_questions(payload: BulkDeleteSchema):
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

@app.get('/health')
async def health_check():
    try:
        await client.admin.command("ping")
    except PyMongoError as e:
        raise HTTPException(status_code=503, detail="Database unavailable, please try again later") from e
    
    return {'status': "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
