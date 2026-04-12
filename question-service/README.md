# Question Service

Standalone service for managing CRUD operations on PeerPrep question repository. Built with FastAPI and MongoDB.

## Prerequisites

- Python 3.9 and above
- Existing MongoDB instance (local or MongoDB Atlas)

## Getting Started

```bash
# Copy the environment file and fill in the values
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
| `JWT_SECRET`      | Yes      | Secret used for JWT verification                     | `some_random_string`             |
| `PORT`            | No       | Port the server listens on (default: `8000`)         | `8000`                           |

Refer to [MongoDB connection string](https://www.mongodb.com/resources/products/fundamentals/mongodb-connection-string) for connecting to your db.

**`JWT_SECRET` must be the same across all services.**

## Authentication

All endpoints, except `\health` and `\questions`, require JWT authenthication. The JWT will be retrieved from cookie parameter `token`, or `Bearer <token>` from `Authorization` header as backup.

## API Reference

### Open routes

These routes do not require JWT verification.

#### GET /health

Return health status of the connected MongoDB server.

**Responses:**

| Status | Description                                         |
|--------|-----------------------------------------------------|
| 200    | Ok                                                  |
| 503    | Database down, check the status of your database    |

---

#### GET /questions

Get questions from the repository, optionally filtered by exact `topic` and/or `difficulty`.

**Query parameters:**

| Parameter    | Required | Description                                         |
|--------------|----------|-----------------------------------------------------|
| `topic`      | No       | Exact topic match, case-insensitive                 |
| `difficulty` | No       | Exact difficulty match: `Easy`, `Medium`, or `Hard` |

**Responses:**

| Status | Description                                         |
|--------|-----------------------------------------------------|
| 200    | Question retrieved                                  |
| 400    | Invalid difficulty                                  |
| 503    | Database down, check health status of your database |

---

### Protected routes

These routes can be accesed by any user. Basic JWT verification is required.

#### GET /questions/`{question_slug}`

Get a question with full details based on `question_slug`. Refer to [Data Model](#data-model) for more details.

**Responses:**

| Status | Description                                         |
|--------|-----------------------------------------------------|
| 200    | Question retrieved                                  |
| 404    | Question not found                                  |
| 503    | Database down, check health status of your database |

---

### Admin routes

Role checking is implemented on top of JWT verification, only admin access is allowed.

#### POST /questions/upsert

Upsert (update/insert) a question to the database. It searches the question with exact title and slug before upsert.

- If no question with exact title and slug exists, inserts the question.
- If matching question is found, updates the content of the question.

**Request body:**

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

| Variable          | Description                                                                                     | Constraint                                         |
|-------------------|-------------------------------------------------------------------------------------------------|----------------------------------------------------|
| `title`           | Title of the question                                                                           | Required                                           |
| `description`     | Description of the question                                                                     | Required                                           |
| `topics`          | Relevant data structures and algorithms to solve the question                                   | Must have at least one topic for all questions     |
| `difficulty`      | Difficulty of the question                                                                      | Must be between `Easy`, `Medium` or `Hard`         |
| `examples`        | Examples with input and their expected output, provided with explanation for understanding      | At least one example is needed, and each example needs `input` and `output`  |
| `constraints`     | Designated constraint for inputs of the question                                                | Must include at least one constraint               |

**Responses:**

| Status | Description                                         |
|--------|-----------------------------------------------------|
| 201    | Question created/updated                            |
| 503    | Database down, check health status of your database |

---

#### DELETE /questions/delete

Delete a question with exact slug from the repository.

**Request body:**

```json
{
    "slug": "two-sum-variations"
}
```

| Variable    | Description                      | Constraint            |
|-------------|----------------------------------|-----------------------|
| `slug`      | Slug of the target question      | None                  |

**Responses:**

| Status | Description                                         |
|--------|-----------------------------------------------------|
| 200    | Question deleted                                    |
| 404    | Question not found                                  |
| 503    | Database down, check health status of your database |

---

#### POST /questions/bulk-delete

Delete multiple questions by slug in a single request.

The operation is all-or-nothing for missing questions:

- If every slug exists, all matching questions are deleted.
- If any slug is missing, the endpoint returns `404` and does not delete anything.

**Request body:**

```json
{
    "slugs": [
        "two-sum-variations",
        "valid-parentheses"
    ]
}
```

| Variable      | Description                        | Constraint                      |
|---------------|------------------------------------|---------------------------------|
| `slugs`       | Slugs of the target questions      | Must contain at least one slug  |

**Responses:**

| Status | Description                                         |
|--------|-----------------------------------------------------|
| 200    | Questions deleted                                   |
| 404    | One or more questions not found                     |
| 503    | Database down, check health status of your database |

### History routes

These routes are used for storing and retrieving user attempt history.

#### POST /history/insert

Adds an attempt to the database.

**Request body:**

```json
{
    "session_id": "81420ad8-9559-497b-8695-2585137a29d5",
    "user_ids": ["69be848b4e2576f0b59c492d", "69be848b4e2576f0b59c492d"],
    "user_names": ["test1", "test2"],
    "slug": "two-sum-variations",
    "language": "Python",
    "code": "
        def main():
            print('Hello World')
            
    "
}
```

| Variable         | Description                            | Constraint                                                                           |
|------------------|----------------------------------------|--------------------------------------------------------------------------------------|
| `session_id`     | The completed session id               | Auto-managed by collaboration service                                                |
| `user_ids`       | The  users' id                         | Must be exactly 2 ids, each id must correspond to username in `user_names`           |
| `user_names`     | The usernames                          | Must be exactly 2 names, each name must correspond to id in `user_ids`               |
| `slug`           | The slug of the attempting question    | Required                                                                             |
| `language`       | The coding language used               | Must be a language available in PeerPrep                                             |
| `code`           | The full code                          | None                                                                                 |

**Responses:**

| Status | Description                                         |
|--------|-----------------------------------------------------|
| 201    | History created                                     |
| 503    | Database down, check health status of your database |

#### GET /history/list

Retrieves the full history of users.

**Request body:**

```json
{
    "user_id": "69be848b4e2576f0b59c492d"
}
```

| Variable      | Description                    | Constraint                                                          |
|---------------|--------------------------------|---------------------------------------------------------------------|
| `user_id`     | The target user's id           | Must be 24 characters and in hexadcimal characters (based on BSON)  |

**Responses:**

| Status | Description                                         |
|--------|-----------------------------------------------------|
| 200    | History retrieved                                   |
| 503    | Database down, check health status of your database |

#### GET /history/`{id}`

Retrieves the full history of users

**Request query:**

| Variable   | Description                | Constraint                                                          |
|------------|----------------------------|---------------------------------------------------------------------|
| `id`       | The attempt's id           | Must be 24 characters and in hexadcimal characters (based on BSON)  |

**Responses:**

| Status | Description                                         |
|--------|-----------------------------------------------------|
| 200    | History retrieved                                   |
| 404    | History not found                                   |
| 503    | Database down, check health status of your database |

## Data Model

Below demonstrates the data structures stored in question service.

### Question

```json
{
    "_id": "69be848b4e2576f0b59c492d",
    "title": "Two Sum Variations",
    "slug": "two-sum-variations",
    "topics": [
        "Arrays",
        "Hash Table"
    ],
    "difficulty": "Easy",
    "description": "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
    "examples": [
        {
            "input": "nums = [2,7,11,15], target = 9",
            "output": "[0,1]",
            "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
        }
    ],
    "constraints": [
        "2 ≤ nums.length ≤ 10⁴",
        "-10⁹ ≤ nums[i] ≤ 10⁹",
        "Only one valid answer exists."
    ],
    "created_at": "2026-03-21T11:44:11.420579+00:00",
    "updated_at": "2026-03-21T11:44:11.420579+00:00"
}
```

| Field         | Type       | Constraints                                   |
|---------------|------------|-----------------------------------------------|
| `_id`         | ObjectId   | Auto-managed by MongoDB                       |
| `title`       | str        | Required, unique                              |
| `description` | str        | Required                                      |
| `slug`        | str        | Auto-generated from title                     |
| `topics`      | List[str]  | Required, at least one                        |
| `difficulty`  | str        | Required, `Easy`, `Medium` or `Hard` only     |
| `examples`    | List[dict] | Required, at least one                        |
| `constraints` | List[str]  | Required, at least one                        |
| `created_at`  | Date       | Auto-managed by service                       |
| `updated_at`  | Date       | Auto-managed by service                       |

### Attempt

```json
{
    "_id": "69be848b4e2576f0b59c492d",
    "session_id": "81420ad8-9559-497b-8695-2585137a29d5",
    "user_ids": ["69be848b4e2576f0b59c492d", "69be848b4e2576f0b59c492d"],
    "slug": "two-sum-variations",
    "language": "Python",
    "code": "ZGVmIG1haW4oKToKICAgIHByaW50KCJIZWxsbyBXb3JsZCIp",
    "timestamp": "2026-04-02T14:02:50.215983+00:00"
}
```

| Field         | Type       | Constraints                                               |
|---------------|------------|-----------------------------------------------------------|
| `_id`         | ObjectId   | Auto-managed by MongoDB                                   |
| `session_id`  | uuid       | Auto-managed by collaboration service                     |
| `user_ids`    | List[str]  | Required, exactly two users must be present               |
| `slug`        | str        | Auto-generated from title                                 |
| `language`    | str        | Required, must be an language available on PeerPrep       |
| `code`        | str        | Endoded in base64                                         |
| `timestamp`   | Date       | Auto-managed by service                                   |
