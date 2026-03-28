# AI Assistant Service

Minimal Express + TypeScript bootstrap for the PeerPrep AI assistant service.

This service currently keeps the shared backend infrastructure from `user-service`:
- JWT authentication middleware
- admin guard middleware
- Jest test setup
- Docker packaging

For now, the API surface is intentionally small while future AI assistant routes are added.

## Base URL

`http://localhost:4002`

## Prerequisites

- Node.js 20+

## Getting Started

```bash
npm install
cp .env.example .env
npm run dev
```

## Environment Variables

| Variable | Required | Description | Default |
| --- | --- | --- | --- |
| `JWT_SECRET` | Yes | Secret used to verify JWTs | - |
| `JWT_EXPIRES_IN` | No | Reserved for future token-related consistency | `1d` |
| `FRONTEND_ORIGIN` | No | Allowed CORS origin | `http://localhost:3000` |
| `PORT` | No | Port the server listens on | `4002` |
| `AI_GATEWAY_API_KEY` | Yes | Vercel AI Gateway API key used by AI SDK | - |
| `AI_EXPLAIN_MODEL` | No | Default explain model id for AI Gateway | `openai/gpt-5-mini` |
| `AI_HINTS_MODEL` | No | Default hints model id for AI Gateway | `openai/gpt-5-mini` |
| `AI_MAX_INPUT_CHARS` | No | Max characters accepted for the full explain payload context | `20000` |
| `AI_MAX_SELECTED_CHARS` | No | Max characters accepted for `selectedCode` | `4000` |
| `AI_MAX_HINT_MESSAGES` | No | Max number of messages accepted in a hints transcript | `12` |
| `AI_MAX_HINT_MESSAGE_CHARS` | No | Max characters accepted per hint message | `2000` |
| `AI_MAX_HINT_TRANSCRIPT_CHARS` | No | Max combined characters accepted across hint messages | `6000` |
| `AI_MAX_OUTPUT_TOKENS` | No | Max tokens requested from the model for explain output | `900` |
| `AI_REQUEST_TIMEOUT_MS` | No | Timeout for the streamed explain request | `30000` |

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the service with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled build |
| `npm test` | Run tests |
| `npm run test:coverage` | Run tests with coverage |

## Current Routes

### `GET /health`

Public health check.

Example response:

```json
{
  "status": "ok"
}
```

### `GET /assistant/ping`

Protected placeholder route for verifying JWT middleware wiring. Accepts either:
- `Authorization: Bearer <token>`
- `token` cookie

Example response:

```json
{
  "message": "AI assistant service is ready",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "role": "user"
  }
}
```

If the token is missing, invalid, or expired, the route returns `401 Unauthorized`.

### `POST /assistant/explain`

Protected streamed explain route for the sessions page.

Request body:

```json
{
  "sessionId": "mock-match-001",
  "questionDescription": "string",
  "questionExamples": [
    {
      "input": "string",
      "output": "string",
      "explanation": "string"
    }
  ],
  "questionConstraints": ["string"],
  "language": "python",
  "fullCode": "string",
  "selectedCode": "string"
}
```

Successful responses stream `text/event-stream` events:

- `meta` → `{ "requestId": "...", "feature": "explain" }`
- `chunk` → `{ "delta": "..." }`
- `done` → `{ "finishReason": "stop" | "length" | "refusal" }`
- `error` → `{ "message": "..." }`

The route validates the payload, applies strict explain-only guardrails, and does not persist raw prompt or response content.

### `POST /assistant/hints`

Protected streamed hints route for the sessions page.

Request body:

```json
{
  "sessionId": "mock-match-001",
  "questionDescription": "string",
  "questionExamples": [
    {
      "input": "string",
      "output": "string",
      "explanation": "string"
    }
  ],
  "questionConstraints": ["string"],
  "language": "python",
  "fullCode": "string",
  "messages": [
    {
      "id": "hint-1",
      "role": "USER",
      "content": "Give me a hint",
      "createdAt": "2026-03-21T09:00:00.000Z"
    }
  ]
}
```

Successful responses stream the same SSE event shape as explain, with `feature: "hints"` in the `meta` event.

The route validates transcript size, applies strict hint-only guardrails, and does not persist raw prompt or response content.
