import type { Page, Route } from "@playwright/test";

type Persona = "guest" | "user" | "admin";

const baseQuestion = {
  id: "q-1",
  title: "Two Sum",
  slug: "two-sum",
  topics: ["Arrays", "Hash Map"],
  difficulty: "Easy",
  status: "Completed",
};

const questionDetail = {
  ...baseQuestion,
  description: "Find two indices that add up to the target.",
  constraints: ["2 <= nums.length", "One valid answer exists"],
  examples: [
    {
      input: "nums = [2,7,11,15], target = 9",
      output: "[0,1]",
      explanation: "2 + 7 = 9",
    },
  ],
};

function json(route: Route, data: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(data),
  });
}

export async function stubApiPersona(page: Page, persona: Persona) {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname, searchParams } = url;

    if (pathname === "/api/users/me") {
      if (persona === "guest") {
        return json(route, { error: "Unauthenticated" }, 401);
      }

      return json(route, {
        id: `${persona}-1`,
        username: persona === "admin" ? "Admin User" : "Ada User",
        email:
          persona === "admin" ? "admin@example.com" : "ada@example.com",
        role: persona === "admin" ? "admin" : "user",
        skip_onboarding: 0,
      });
    }

    if (pathname === "/api/questions/topics") {
      return json(route, {
        topics: ["Arrays", "Graphs"],
        topicDifficulties: {
          Arrays: ["Easy", "Medium", "Hard"],
          Graphs: ["Medium", "Hard"],
        },
      });
    }

    if (pathname === "/api/questions" && request.method() === "GET") {
      return json(route, {
        data: [baseQuestion],
        total: 1,
        page: Number(searchParams.get("page") ?? "1"),
        pageSize: Number(searchParams.get("pageSize") ?? "10"),
        totalPages: 1,
      });
    }

    if (pathname.startsWith("/api/questions/") && request.method() === "GET") {
      return json(route, questionDetail);
    }

    if (pathname === "/api/history" && request.method() === "GET") {
      return json(route, {
        data: [
          {
            _id: "history-1",
            partner_id: "partner-1",
            partner_username: "Taylor",
            question: questionDetail,
            timestamp: "2026-04-05T10:00:00.000Z",
          },
        ],
        total: 1,
        page: Number(searchParams.get("page") ?? "1"),
        pageSize: Number(searchParams.get("pageSize") ?? "5"),
        totalPages: 1,
      });
    }

    if (pathname === "/api/users/admin-requests/mine") {
      return json(route, { hasPending: false });
    }

    if (pathname === "/api/matching/requests" && request.method() === "POST") {
      return json(route, {
        requestId: "match-1",
        status: "pending",
        preferences: {
          topic: "Arrays",
          difficulty: "Easy",
          language: "python",
        },
      });
    }

    if (
      pathname === "/api/matching/requests/match-1" &&
      request.method() === "GET"
    ) {
      return json(route, {
        requestId: "match-1",
        status: "pending",
        preferences: {
          topic: "Arrays",
          difficulty: "Easy",
          language: "python",
        },
      });
    }

    if (pathname === "/api/users/all") {
      return json(route, [
        {
          _id: "admin-1",
          email: "admin@example.com",
          role: "admin",
          createdAt: "2026-04-01T10:00:00.000Z",
        },
        {
          _id: "user-1",
          email: "ada@example.com",
          role: "user",
          createdAt: "2026-04-02T10:00:00.000Z",
        },
      ]);
    }

    if (pathname === "/api/users/admin-requests") {
      return json(route, [
        {
          _id: "request-1",
          status: "pending",
          createdAt: "2026-04-02T10:00:00.000Z",
          userId: {
            _id: "user-2",
            username: "Taylor",
            email: "taylor@example.com",
          },
        },
      ]);
    }

    if (pathname === "/api/users/demotion-votes") {
      return json(route, []);
    }

    if (pathname === "/api/admin/questions" && request.method() === "GET") {
      return json(route, { exists: false });
    }

    if (pathname === "/api/admin/questions/bulk-delete") {
      return json(route, { deletedCount: 0, deleted: [] });
    }

    if (pathname === "/api/users/profile" && request.method() === "PUT") {
      return json(route, { ok: true });
    }

    return json(route, { error: `Unhandled route: ${pathname}` }, 404);
  });
}
