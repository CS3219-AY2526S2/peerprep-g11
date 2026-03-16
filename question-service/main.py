import os
from datetime import datetime, timezone
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pymongo import AsyncMongoClient, ReturnDocument
from pymongo.errors import PyMongoError
from schema import QuestionSchema, DeleteSchema

load_dotenv()
app = FastAPI()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
PORT = int(os.getenv("PORT", "8000"))

client = AsyncMongoClient(MONGODB_URI)
db = client['question-service']
collection = db['questions']

@app.get('/')
async def home():
    '''
    The root page of the service.
    '''
    return "Peerprep Questions Service"

@app.get('/questions/all')
async def get_all_questions():
    '''
    Retrieves all questions in the database.
    '''
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
    '''
    Retrieves a question by exact title.
    Returns 404 if the question is not found.
    '''
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
    '''
    Upsert (update/insert) a question to the database.

    - If no document with exact title exists, inserts a new one.
    - If matching title is found, updates the content and updated_at.
    '''
    data = question.model_dump()
    title = data['title']
    now = datetime.now(timezone.utc).isoformat()

    filter = {'title': title}
    set_fields = {key: value for key, value in data.items() if key != 'title'}
    set_fields['updated_at'] = now
    update = {
        '$set': set_fields,
        '$setOnInsert': {'created_at': now, 'title': title, 'status': "Pending"}
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
    '''
    Deletes a question by its exact title.
    Returns 404 if the question is not found.
    '''
    filter = {'title': question.title}

    try:
        result = await collection.delete_one(filter)
    except PyMongoError as e:
        raise HTTPException(status_code=503, detail="Database unavailable, please try again later") from e
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Question {question.title} not found")
    
    return {'message': "Deleted", 'title': question.title}

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