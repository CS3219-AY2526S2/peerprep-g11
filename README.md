# PeerPrep

A technical interview preparation platform where students can find peers and practice whiteboard-style coding questions together in real time. Built with a microservices architecture.

## Architecture

```mermaid
graph TD
    User([User])

    User -->|HTTP :3001| Frontend

    subgraph Services
        Frontend[Frontend\nNext.js]
        UserSvc[User Service\nAuth & Accounts]
        QuestionSvc[Question Service\nCRUD & Search]
        MatchingSvc[Matching Service\nPeer Pairing]
        CollabSvc[Collaboration Service\nReal-time Editor]
        AISvc[AI Assistant Service\nHints & Debugging]
        Redis[(Redis)]
    end

    Frontend -->|HTTP| UserSvc
    Frontend -->|HTTP| QuestionSvc
    Frontend -->|HTTP| MatchingSvc
    Frontend -->|HTTP| AISvc
    Frontend -->|WebSocket| CollabSvc

    MatchingSvc -->|HTTP| QuestionSvc
    MatchingSvc -->|HTTP| CollabSvc
    QuestionSvc --- Redis
```

| Service | Description |
|---|---|
| **Frontend** | Next.js web application |
| **User Service** | Authentication and user management |
| **Question Service** | Question bank with CRUD operations |
| **Matching Service** | Pairs users based on topic, difficulty, and language |
| **Collaboration Service** | Real-time collaborative code editing via WebSockets |
| **AI Assistant Service** | AI-powered hints, explanations, and debugging suggestions |

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose

### Environment Setup

Create the required environment/config files before running:

- `user-service/.env`
- `question-service/.env`
- `collaboration-service/.env`
- `ai-assistant-service/.env`
- `matching-service/application.properties`

Refer to each service's README for the expected variables.

### Run with Docker Compose

```bash
docker compose build
docker compose up -d
```

The app will be available at **http://localhost:3001**.

To stop all services:

```bash
docker compose down
```

## Service Documentation

Each service has its own README with setup instructions, API details, and development guides:

- [Frontend](./frontend/README.md)
- [User Service](./user-service/README.md)
- [Question Service](./question-service/README.md)
- [Matching Service](./matching-service/docs/README.md)
- [Collaboration Service](./collaboration-service/readme.md)
- [AI Assistant Service](./ai-assistant-service/README.md)
