## Quick Start:
Set ```JWT_SECRET``` and ```spring.data.mongodb.uri``` in ```application.properties```

### Gradle
```./gradlew bootrun```

### Docker
```
docker build -t matching-service .
docker run -p 8080:8080 -e SPRING_DATA_MONGODB_URI="mongodb://..." matching-service
```

## User state diagram:

```mermaid
userStateDiagram
    [*] --> IDLE : start matching
    IDLE --> WAITING : start
    WAITING --> MATCHED : match
    WAITING --> IDLE : cancel
    WAITING --> IDLE : timeout
    MATCHED --> IDLE : cancel
    MATCHED --> IDLE : endMatch
```

## API endpoints:

| Action       | HTTP Method | Endpoint                         |
| ------------ | ----------- | -------------------------------- |
| Start        | POST        | `/matching/requests`             |
| Cancel       | DELETE      | `/matching/requests/[RequestId]` |
| Status       | GET         | `/matching/requests/[RequestId]` |
| Enter Match  | POST        | `/matches`                       |
| End Match    | DELETE      | `/matches/[MatchId]`             |
