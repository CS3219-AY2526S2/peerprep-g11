```mermaid
userStateDiagram
    [*] --> IDLE : start matching
    IDLE --> WAITING : start
    WAITING --> MATCHED : match
    WAITING --> IDLE : cancel
    WAITING --> IDLE : timeout
    MATCHED --> IDLE : endMatch
```