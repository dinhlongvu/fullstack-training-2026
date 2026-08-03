// The 401 refresh path used to read "could not reach the server" as "the token
// is dead" and log the user out. These tests pin the three points where a
// network-level failure has to stay a NetworkError and leave the session alone.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient, isNetworkError } from "./api";
import { useAuthStore } from "@/stores/useAuthStore";

const OLD_TOKEN = "old.access.token";
const REFRESH_TOKEN = "old.refresh.token";
const NEW_TOKENS = {
  token: "new.access.token",
  refreshToken: "new.refresh.token",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// How a browser rejects fetch when it cannot reach the server.
const offline = () => Promise.reject(new TypeError("Failed to fetch"));
const unauthorized = () =>
  Promise.resolve(jsonResponse({ error: "expired" }, 401));
const ok = (body: unknown) => () => Promise.resolve(jsonResponse(body));

// Queues one outcome per fetch call, in order.
function mockFetch(...outcomes: Array<() => Promise<Response>>) {
  const fetchMock = vi.spyOn(globalThis, "fetch");
  outcomes.forEach((outcome) => fetchMock.mockImplementationOnce(outcome));
  // Anything past the queue is a test bug, not a real request.
  fetchMock.mockImplementation(() => {
    throw new Error("unexpected fetch call");
  });
  return fetchMock;
}

beforeEach(() => {
  useAuthStore.setState({
    token: OLD_TOKEN,
    refreshToken: REFRESH_TOKEN,
    currentUser: { id: 1, email: "test@example.com", fullName: "Test User" },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("401 refresh path", () => {
  it("keeps the session when the refresh never reached the server", async () => {
    mockFetch(unauthorized, offline);

    const error = await apiClient("/api/projects").catch((e: unknown) => e);

    expect(isNetworkError(error)).toBe(true);
    // The whole point of the ticket: a dropped connection is not a dead token.
    expect(useAuthStore.getState().token).toBe(OLD_TOKEN);
    expect(useAuthStore.getState().refreshToken).toBe(REFRESH_TOKEN);
  });

  it("clears the session when the server rejects the refresh", async () => {
    mockFetch(unauthorized, unauthorized);

    const error = await apiClient("/api/projects").catch((e: unknown) => e);

    expect(isNetworkError(error)).toBe(false);
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().currentUser).toBeNull();
  });

  it("reports a NetworkError when the retry after a good refresh drops", async () => {
    mockFetch(unauthorized, ok(NEW_TOKENS), offline);

    const error = await apiClient("/api/projects").catch((e: unknown) => e);

    expect(isNetworkError(error)).toBe(true);
    // The refresh did succeed, so the new tokens are kept for the next try.
    expect(useAuthStore.getState().token).toBe(NEW_TOKENS.token);
  });

  it("still refreshes and retries when nothing fails", async () => {
    const fetchMock = mockFetch(unauthorized, ok(NEW_TOKENS), ok([{ id: 7 }]));

    await expect(apiClient("/api/projects")).resolves.toEqual([{ id: 7 }]);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(useAuthStore.getState().token).toBe(NEW_TOKENS.token);
  });
});

describe("single-flight refresh", () => {
  it("hands the NetworkError to every waiter and still allows a later refresh", async () => {
    const fetchMock = mockFetch(
      unauthorized, // request A
      unauthorized, // request B
      offline, // the one shared refresh both are waiting on
      unauthorized, // a later request
      ok(NEW_TOKENS), // proves refreshPromise was cleared
      ok({ id: 7 }),
    );

    const [first, second] = await Promise.allSettled([
      apiClient("/api/projects"),
      apiClient("/api/tasks"),
    ]);

    expect(first.status).toBe("rejected");
    expect(second.status).toBe("rejected");
    expect(isNetworkError((first as PromiseRejectedResult).reason)).toBe(true);
    expect(isNetworkError((second as PromiseRejectedResult).reason)).toBe(true);
    expect(useAuthStore.getState().token).toBe(OLD_TOKEN);

    // 2 requests + 1 refresh: the two 401s shared a single refresh.
    expect(fetchMock).toHaveBeenCalledTimes(3);

    // refreshPromise was cleared, so a later 401 starts a fresh refresh.
    await expect(apiClient("/api/projects")).resolves.toEqual({ id: 7 });
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });
});
