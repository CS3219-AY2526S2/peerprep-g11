# Question Service

Handles CRUD operations on PeerPrep question repository. Built with FastAPI and MongoDB.

## Prerequisites

- Python 3
- A MongoDB instance (local or MongoDB Atlas)

## Getting Started

```bash
# Copy the environment variable and fill in the values
cp .env.example .env

# Build the docker image
docker build -t question-service .

# Run the built image
docker run -p 8000:8000 question-service
```

## Environment Variables
| Variable          | Required | Description                                          | Example                          |
|-------------------|----------|------------------------------------------------------|----------------------------------|
| `MONGODB_URI`     | Yes      | MongoDB connection string                            | `mongodb+srv://...`              |
| `PORT`            | No       | Port the server listens on (default: `8000`)         | `8000`                           |

## API Reference

### GET /questions/`{question_title}`

Get a question with exact question title based on `question_title`.

#### Responses

| Status | Description                                         |
|--------|-----------------------------------------------------|
| 200    | Question retrieved                                  |
| 404    | Question not found                                  |
| 503    | Database down, check health status of your database |

---

### GET /questions/all

Get all available questions in the repository.

#### Responses

| Status | Description                                         |
|--------|-----------------------------------------------------|
| 200    | Question retrieved                                  |
| 503    | Database down, check health status of your database |

---

### POST /questions/upsert

Upsert (update/insert) a question to the database. It searches the question with exact title before upsert.

- If no question with exact title exists, inserts the question.
- If matching question is found, updates the content of the question.

#### Request body

The request body should look like this. **All elements are required**.

```json
{
    "title": "Two Sum Variations",
    "description":"Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
    "topics": ["Arrays", "Hash Table"],
    "difficulty": "Easy",
    "examples": [
      {
        "input": "nums = [2,7,11,15], target = 9",
        "output": "[0,1]",
        "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1].",
      },
    ],
    "constraints": [
      "2 ≤ nums.length ≤ 10⁴",
      "-10⁹ ≤ nums[i] ≤ 10⁹",
      "Only one valid answer exists.",
    ]
}

```

| Variable          | Description | Constraint                                         |
|-------------------|----------|------------------------------------------------------|
| `title`   | Title of the question      | None  |
| `description` | Description of the question       | None         |
| `topics`   | Relevant data structures and algorithms to solve the question       | Must have at least one topic for all questions         |
| `difficulty`    | Difficulty of the question       | Must be between `Easy`, `Medium` or `Hard`   |
| `examples`   | Examples with input and their expected output, provided with explanation for understanding      | At least one example is needed, and each example needs `input` and `output`  |
| `constraints`   | Designated constraint for inputs of the question      | Must include at least one constraint  |

#### Responses

| Status | Description                                         |
|--------|-----------------------------------------------------|
| 201    | Question created/updated                            |
| 503    | Database down, check health status of your database |

---

### DELETE /questions/delete

Delete a question with exact title from the repository.

#### Request body

```json
{
    "title": "Two Sum Variations",
}
```

| Variable          | Description | Constraint                                         |
|-------------------|----------|------------------------------------------------------|
| `title`   | Title of the target question      | None  |

#### Responses

| Status | Description                                         |
|--------|-----------------------------------------------------|
| 200    | Question deleted                                    |
| 404    | Question not found                                  |
| 503    | Database down, check health status of your database |

## Data Model

### Question

| Field        | Type       | Constraints                            |
|--------------|------------|----------------------------------------|
| `title`      | str        | Required, unique                       |
| `description`| str        | Required, unique, lowercase            |
| `topics`     | List[str]  | Required, at least one                 |
| `difficulty` | str        | `Easy`, `Medium` or `Hard` only        |
| `examples`   | List[dict] | Required, at least one                 |
| `constraint` | List[str]  | Required, at least one                 |
| `created_at` | Date       | Auto-managed by PyMongo                |
| `updated_at` | Date       | Auto-managed by Pymongo                |
