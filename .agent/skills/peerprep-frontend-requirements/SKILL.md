---
name: peerprep-frontend-requirements
description: Project-specific frontend requirements for PeerPrep. Defines the tech stack (Next.js, TailwindCSS, shadcn), component and styling rules, theme color usage from globals.css, and the recommended pattern for using Next.js API routes to proxy calls to backend microservices.
---

This skill defines the project-specific frontend requirements for PeerPrep. **All frontend work MUST follow these rules.**

---

## Tech Stack & Component Rules

PeerPrep uses **Next.js** (App Router), **TailwindCSS**, and **shadcn/ui** (`new-york` style).

### Component Requirements

- **ALL UI components MUST use shadcn/ui.** Installed components live in `components/ui/`. To add a new shadcn component, run:
  ```bash
  npx shadcn@latest add <component-name>
  ```
- Do **NOT** create custom UI primitives (buttons, inputs, cards, dialogs, etc.) when a shadcn equivalent exists.
- Compose pages and features from shadcn components + Tailwind utility classes.

### Styling Requirements

- **Use the project's theme colors** defined as CSS variables in `frontend/app/globals.css`. Reference them via their Tailwind token names:

  | Token              | Tailwind class example          | Purpose                     |
  |--------------------|--------------------------------|-----------------------------|
  | `background`       | `bg-background`                | Page background             |
  | `foreground`       | `text-foreground`              | Default text                |
  | `primary`          | `bg-primary text-primary-foreground` | Primary actions / CTAs |
  | `secondary`        | `bg-secondary`                 | Secondary surfaces          |
  | `muted`            | `text-muted-foreground`        | De-emphasized text          |
  | `accent`           | `bg-accent text-accent-foreground` | Highlight / accents    |
  | `destructive`      | `bg-destructive`               | Destructive actions         |
  | `card`             | `bg-card text-card-foreground` | Card surfaces               |
  | `popover`          | `bg-popover`                   | Popover / dropdown surfaces |
  | `border`           | `border-border`                | Borders                     |
  | `input`            | `border-input`                 | Input borders               |
  | `ring`             | `ring-ring`                    | Focus rings                 |
  | `chart-1` … `chart-5` | `text-chart-1`             | Chart / data-viz colors     |
  | `sidebar-*`        | `bg-sidebar`                   | Sidebar-specific tokens     |

- **If a color not in the theme is needed**, use Tailwind CSS color utilities (e.g. `text-emerald-500`, `bg-slate-100`). **Never use raw CSS** (`style={{ color: '#xxx' }}` or inline `color:` rules).
- All spacing, typography, borders, and shadows should use **Tailwind utility classes**, not raw CSS.

---

## Next.js API Route Pattern (BFF Layer)

The frontend uses Next.js API routes under `app/api/` as a **Backend-for-Frontend (BFF) layer**. Client components **never call backend microservices directly** — they call the Next.js API routes, which in turn proxy requests to the appropriate microservice.

### Why

- Keeps service URLs and secrets server-side only.
- Provides a single origin for all frontend API calls (no CORS issues).
- Allows the BFF to attach auth tokens, transform responses, and handle errors uniformly.

### Architecture

```
Browser (React component)
  → fetch("/api/questions")
    → Next.js API Route (app/api/questions/route.ts)
      → fetch("http://question-service:3001/questions")  // internal microservice
```

### Step 1: Client Component (browser-side)

`app/questions/page.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Question {
  id: string;
  title: string;
  difficulty: string;
  topics: string[];
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true); //loader

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch("/api/questions");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setQuestions(data);
      } catch (error) {
        console.error("Error loading questions:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, []);

}
```

### Step 2: API Route (server-side)

`app/api/questions/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";

const QUESTION_SERVICE_URL = process.env.QUESTION_SERVICE_URL ?? "http://localhost:3001";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const res = await fetch(`${QUESTION_SERVICE_URL}/questions?${searchParams}`, {
      headers: {
        // Forward auth token if needed
        Authorization: request.headers.get("Authorization") ?? "",
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Question service unavailable" },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(`${QUESTION_SERVICE_URL}/questions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: request.headers.get("Authorization") ?? "",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Question service unavailable" },
      { status: 503 }
    );
  }
}
```

### Key Rules

1. **Client → `/api/*` only.** Never import or hardcode microservice URLs in client components.
2. **Service URLs via env vars.** API routes read `process.env.XXXX_SERVICE_URL` — never commit real URLs.
3. **Forward auth headers.** The BFF should forward `Authorization` (or cookies) to downstream services.
4. **Uniform error handling.** Catch fetch errors in the API route and return a clean JSON error with an appropriate status code.
5. **Use `NextRequest` / `NextResponse`.** These are the standard Next.js App Router API primitives.
