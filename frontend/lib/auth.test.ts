import { Role, fetchWithAuth, forwardAuthHeaders } from "@/lib/auth";
import { fetchMock, resetFetchMock } from "@/test-utils/fetch";

describe("fetchWithAuth", () => {
  beforeEach(() => {
    resetFetchMock();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => null,
    } as Response);
  });

  it("applies default credentials and JSON headers", async () => {
    await fetchWithAuth("/api/example");

    expect(fetchMock).toHaveBeenCalledWith("/api/example", {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });
  });

  it("lets explicit headers override defaults", async () => {
    await fetchWithAuth("/api/example", {
      method: "POST",
      headers: {
        Authorization: "Bearer token",
        "Content-Type": "text/plain",
      },
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/example", {
      method: "POST",
      credentials: "include",
      headers: {
        Authorization: "Bearer token",
        "Content-Type": "text/plain",
      },
    });
  });
});

describe("forwardAuthHeaders", () => {
  it("forwards cookie and authorization headers when present", () => {
    const request = {
      headers: {
        get(name: string) {
          if (name === "cookie") return "token=abc";
          if (name === "authorization") return `Bearer ${Role.USER}`;
          return null;
        },
      },
    } as Request;

    expect(forwardAuthHeaders(request)).toEqual({
      Cookie: "token=abc",
      Authorization: "Bearer user",
    });
  });

  it("returns empty strings when auth headers are missing", () => {
    const request = {
      headers: {
        get() {
          return null;
        },
      },
    } as Request;

    expect(forwardAuthHeaders(request)).toEqual({
      Cookie: "",
      Authorization: "",
    });
  });
});
