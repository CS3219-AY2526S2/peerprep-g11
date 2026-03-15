import os
from datetime import datetime, timezone
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pymongo import AsyncMongoClient, ReturnDocument
from pymongo.errors import PyMongoError
from schema import QuestionSchema, DeleteSchema

load_dotenv()
app = FastAPI()
client = AsyncMongoClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017"))
db = client['question-service']
collection = db['questions']

@app.get('/')
async def home():
    return "Peerprep Questions Service"

@app.get('/questions/all')
async def get_all_questions():
    try:
        cursor = collection.find({})
        results = await cursor.to_list(length=100)
    except PyMongoError as e:
        raise HTTPException(status_code=503, detail="Database unavailable, please try again later") from e

    for r in results:
        r['_id'] = str(r['_id'])
    return results

@app.get('/questions/{question_title}')
async def get_question(question_title: str):
    filter = {'title': question_title}
    try:
        question = await collection.find_one(filter)
    except PyMongoError as e:
        raise HTTPException(status_code=503, detail="Database unavailable, please try again later") from e
    
    if not question:
        raise HTTPException(status_code=404, detail=f"Question {question.title} not found")

    question['_id'] = str(question['_id'])
    return question

@app.post('/questions/upsert', status_code=201)
async def add_question(question: QuestionSchema):
    data = question.model_dump()
    title = data['title']
    now = datetime.now(timezone.utc).isoformat()

    filter = {'title': title}
    set_fields = {key: value for key, value in data.items() if key != 'title'}
    set_fields['updated_at'] = now
    update = {
        '$set': set_fields,
        '$setOnInsert': {'created_at': now, 'title': title}
    }

    try:
        result = await collection.find_one_and_update(filter, update, upsert=True, return_document=ReturnDocument.AFTER)
    except PyMongoError as e:
        raise HTTPException(status_code=503, detail="Database unavailable, please try again later") from e
    
    is_inserted = result['created_at'] == now
    if is_inserted:
        return {'message': "Question added.", 'title': title}
    
    return {'message': "Question updated.", 'title': title}

@app.delete('/questions/delete')
async def delete_question(question: DeleteSchema):
    filter = {'title': question.title}

    try:
        result = await collection.delete_one(filter)
    except PyMongoError as e:
        raise HTTPException(status_code=503, detail="Database unavailable, please try again later") from e
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Question {question.title} not found")
    
    return {'message': "Deleted", 'title': question.title}