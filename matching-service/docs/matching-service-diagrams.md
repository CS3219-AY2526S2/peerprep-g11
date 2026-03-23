## Quick Start:
```./gradlew bootrun```

Set ```JWT_SECRET``` in ```application.properties```

## User state diagram:

```mermaid
userStateDiagram
    [*] --> IDLE : start matching
    IDLE --> WAITING : start
    WAITING --> MATCHED : match
    WAITING --> IDLE : cancel
    WAITING --> IDLE : timeout
    MATCHED --> IDLE : endMatch
```

## API endpoints:

| Action | HTTP Method | Endpoint             |
| ------ | ----------- | -------------------- |
| Start  | POST        | `/match`             |
| Cancel | DELETE      | `/match/[RequestId]` |
| Status | GET         | `/match/[RequestId]` |
| End    | PATCH       | `/match/[RequestId]` |
