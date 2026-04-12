import { Role } from "@/lib/auth";
import { getCurrentServerUser } from "@/lib/server-auth";
import {
  fetchMock,
  queueFetchReject,
  queueJsonResponse,
  resetFetchMock,
} from "@/test-utils/fetch";

describe("getCurrentServerUser", () => {
  beforeEach(() => {
    resetFetchMock();
  });

  it("returns null without fetching when no token is provided", async () => {
    await expect(getCurrentServerUser(undefined)).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps a valid user payload with an id", async () => {
    queueJsonResponse({
      id: "user-1",
      username: "Ada",
      email: "ada@example.com",
      role: Role.ADMIN,
    });

    await expect(getCurrentServerUser("token")).resolves.toEqual({
      id: "user-1",
      username: "Ada",
      email: "ada@example.com",
      role: Role.ADMIN,
    });
  });

  it("accepts _id as the user identifier", async () => {
    queueJsonResponse({
      _id: "mongo-id",
      username: "Linus",
      email: "linus@example.com",
      role: Role.USER,
    });

    await expect(getCurrentServerUser("token")).resolves.toEqual({
      id: "mongo-id",
      username: "Linus",
      email: "linus@example.com",
      role: Role.USER,
    });
  });

  it("returns null for malformed payloads", async () => {
    queueJsonResponse({
      id: "user-1",
      username: "Ada",
    });

    await expect(getCurrentServerUser("token")).resolves.toBeNull();
  });

  it("returns null when the downstream service is not ok", async () => {
    queueJsonResponse({ error: "Unauthenticated" }, { status: 401 });

    await expect(getCurrentServerUser("token")).resolves.toBeNull();
  });

  it("returns null when fetching throws", async () => {
    queueFetchReject();

    await expect(getCurrentServerUser("token")).resolves.toBeNull();
  });
});
