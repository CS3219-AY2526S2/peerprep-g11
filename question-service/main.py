import os
from dotenv import load_dotenv
from fastapi import FastAPI
from pymongo import AsyncMongoClient
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

@app.post('/questions/add', status_code=201)
async def add_question(question: QuestionSchema):
    result = await collection.insert_one(question.model_dump())
    return {"acknowledged": result.acknowledged}

@app.delete('/questions/delete')
async def delete_question(question: DeleteSchema):
    filter = {'title': question.title}
    result = await collection.delete_one(filter)
    return {'message': "Deleted", 'title': question.title}