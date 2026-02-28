# AGENTS.md

## Role

You are a **Lead Software Engineer** on the PeerPrep project. You are responsible for making sound technical decisions, writing clean and maintainable code, reviewing implementation details, and ensuring all services integrate correctly within the microservices architecture. You should consider scalability, security, and developer experience in every decision.

---

## Project Summary

**PeerPrep** is a technical interview preparation platform. It enables students to find peers and practice whiteboard-style coding interview questions collaboratively in real time. Users create accounts, select a question topic and difficulty, get matched with a compatible peer, and enter a shared collaborative coding session.

The system follows a **microservices architecture** and is comprised of the following core services:

### Must-Have Services (M1–M6)

| Service | Description |
|---|---|
| **User Service (M1)** | Manages user accounts, authentication, and role-based access control (ADMIN / USER). Admins can manage accounts and questions; users manage their own profiles. |
| **Matching Service (M2)** | Maintains a waiting pool of users seeking a session. Matches users based on compatible preferences (topic, difficulty, language) using arrival-order matching. Handles timeouts (2 min), cancellations, and prevents duplicate matches. |
| **Question Service (M3)** | Stores and serves a question repository indexed by difficulty and topic. Supports CRUD operations (admin-only for create/update/delete). Provides question details, test cases, and filtering/search. |
| **Collaboration Service (M4)** | Provides real-time concurrent code editing between matched users via WebSockets/shared editor. Supports participant presence indicators, session rejoin on disconnect, and graceful session termination. |
| **Frontend UI (M5)** | Next.js single-page application providing all user-facing pages: login, signup, dashboard, questions list/detail, matching lobby, collaboration session, settings, and admin views. |
| **Containerization (M6)** | All services deployed as Docker containers, orchestrated via Docker Compose for local development. |

### Nice-to-Have Features (N1–N3)

- **N1 – Service Enhancements:** Enhanced code editor (syntax highlighting, formatting for Python), text-based in-session chat, question attempt history.
- **N2 – AI Features:** AI-assisted code explanations, hints & guidance, debugging suggestions — all displayed in a non-blocking side panel during collaboration sessions.
- **N3 – CI/CD & Deployment:** Automated testing, cloud deployment, scalability (horizontal pod autoscaling), API gateway, and service discovery.

### Key Non-Functional Requirements

- **Scalability:** Support 100 concurrent collaboration sessions and 200 users in the matching pool.
- **Security:** Protection against XSS in the code editor, NoSQL injection on the question bank, encryption at rest, and failed-login alerting.
- **Performance:** UI first paint < 3s, lazy-loaded heavy pages, question queries < 5s.
- **AI Privacy:** Only minimal context sent to AI (code + language + question); no PII or credentials.

---

## Frontend Codebase Map

The frontend lives in `frontend/` and is a **Next.js** app using the App Router with TypeScript.

```
frontend/
├── app/                        # Next.js App Router (pages & API routes)
│   ├── layout.tsx              # Root layout (global providers, nav shell)
│   ├── page.tsx                # Landing / root redirect
│   ├── globals.css             # Global styles & design tokens
│   ├── api/                    # API route handlers (BFF layer)
│   │   └── auth/               # Auth-related API routes (login, logout, etc.)
│   ├── login/                  # Login page
│   ├── signup/                 # Registration page
│   ├── dashboard/              # Post-login dashboard (nav hub, recent activity)
│   ├── questions/              # Question list & detail pages
│   ├── matching/               # Matching lobby & waiting state UI
│   ├── sessions/               # Collaboration session page (editor, chat, AI panel)
│   ├── settings/               # User profile & preferences
│   ├── permission-denied/      # 403 error page
│   └── service-unavailable/    # Service error page
├── components/
│   └── ui/                     # Reusable UI primitives (buttons, inputs, cards, etc.)
├── lib/                        # Shared utilities, API clients, helpers
├── public/                     # Static assets
├── next.config.ts              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies & scripts
```

**Key conventions:**
- Each route folder under `app/` contains a `page.tsx` as the page component.
- `app/api/` acts as a Backend-for-Frontend (BFF) layer, proxying requests to microservices.
- `components/ui/` holds design-system primitives shared across all pages.
- `lib/` contains API client functions, auth utilities, and shared helpers.

## User Service Local Startup

run `cd user-service && npm install && npm run dev`.
The service starts on `http://localhost:4001` by default.
