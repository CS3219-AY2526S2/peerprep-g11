# Collaboration service

- demonstration of shared code editor using [monaco](https://github.com/microsoft/monaco-editor), [yjs](https://github.com/yjs/yjs) with websocket connection, with the help of [monaco-editor/react](https://github.com/suren-atoyan/monaco-react).

- run the server at `localhost:1234` with

```powershell
npm install
node server.ts
```

## Rest API

- GET `/sessions/:sessionId` will return an json entry with matching sessionId from a database like below.

```javascript
{
  "sessionId": "mock-match-001",
  "questionId": "q2",
  "status": "active",
  "selectedLanguage": "python",
  "allowedLanguages": ["python", "java"],
  "participants": [
    {
      "id": "user-current",
      "username": "Current User"
    },
    {
      "id": "user-partner",
      "username": "Alex P."
    }
  ]
},
{
  "sessionId": "mock-match-002",
  "questionId": "q3",
  "status": "active",
  "selectedLanguage": "javascript",
  "allowedLanguages": ["javascript", "python"],
  "participants": [
    {
      "id": "user-current",
      "username": "Current User"
    },
    {
      "id": "user-partner",
      "username": "Taylor G."
    }
  ]
},

```

- POST `/matched`
  - accepts a json body with required fields sessionId, questionId, selectedLanguage, participants.
  - details of what values are expected in each field can be found in the mock data above.
    - mongodb schema definition in `Sessions.ts` is also a good reference

- DELETE /sessions/:sessionId
  - Called by the BFF when a user leaves a session.
  - Deletes the session document from the DB.
  - Either participant leaving is sufficient to end the session.
