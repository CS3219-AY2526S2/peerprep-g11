import os
from datetime import datetime, timezone
from dotenv import load_dotenv
from fastapi import FastAPI
from pymongo import AsyncMongoClient, ReturnDocument
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
    cursor = collection.find({})
    result = await cursor.to_list(length=100)
    return result

@app.get('/questions/{question_title}')
async def get_question(question_title: str):
    filter = {'title': question_title}
    question = await collection.find_one(filter)
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

    result = await collection.find_one_and_update(filter, update, upsert=True, return_document=ReturnDocument.AFTER)
    is_inserted = result['created_at'] == now
    
    if is_inserted:
        return {'message': "Question added.", 'title': title}
    
    return {'message': "Question updated.", 'title': title}

@app.delete('/questions/delete')
async def delete_question(question: DeleteSchema):
    filter = {'title': question.title}
    result = await collection.delete_one(filter)
    return {'message': "Deleted", 'title': question.title}