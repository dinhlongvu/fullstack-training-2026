import { test, expect, type APIRequestContext } from "@playwright/test";

import { API_BASE, uniqueEmail, registerAndLogin, createProjectViaApi, createTaskViaApi, addMemberViaApi, getProjectDetailViaApi, getProjectsViaApi, futureDateISO, type RegisteredUser, type ProjectDto, type TaskDto } from "../utils/api-helpers";

// ─── Constants ───────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE: GET /api/auth/me — Get Current User
// Maps to: qa/test-cases/api/auth/03-me.md
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("API: GET /api/auth/me — Get Current User", () => {
  test("TC-ME-001: Get current user with valid token (happy path) → 200", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);

    const res = await request.get(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("id");
    expect(body.email).toBe(user.email);
    expect(body.fullName).toBe(user.fullName);
    // Must NOT expose password or passwordHash
    expect(body).not.toHaveProperty("password");
    expect(body).not.toHaveProperty("passwordHash");
  });

  test("TC-ME-002: Access /me without Authorization header → 401", async ({
    request,
  }) => {
    const res = await request.get(`${API_BASE}/api/auth/me`);

    expect(res.status()).toBe(401);
  });

  test("TC-ME-003: Access /me with invalid/malformed token → 401", async ({
    request,
  }) => {
    const res = await request.get(`${API_BASE}/api/auth/me`, {
      headers: {
        Authorization: "Bearer this-is-not-a-valid-jwt-token",
      },
    });

    expect(res.status()).toBe(401);
  });

  test("TC-ME-004: Access /me with expired token → 401", async ({
    request,
  }) => {
    // Use a pre-crafted expired JWT token (HS256, exp in the past)
    // This is a generic expired token — the signature won't match the server's secret,
    // but the server should reject it with 401 regardless (either expired or invalid signature)
    const expiredToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
      "eyJzdWIiOiIxIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjoxNjAwMDAwMDAwfQ." +
      "invalid-signature-placeholder";

    const res = await request.get(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });

    expect(res.status()).toBe(401);
  });

  test("TC-ME-005: Verify /me does not return sensitive data", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);

    const res = await request.get(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    const bodyString = JSON.stringify(body);

    // Verify only public fields are returned
    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("email");
    expect(body).toHaveProperty("fullName");

    // Verify NO sensitive fields are exposed
    expect(body).not.toHaveProperty("password");
    expect(body).not.toHaveProperty("passwordHash");
    expect(body).not.toHaveProperty("salt");
    expect(body).not.toHaveProperty("securityStamp");
    // Ensure password-related strings don't appear in the response
    expect(bodyString).not.toContain("passwordHash");
    expect(bodyString).not.toContain("$2a$"); // BCrypt hash prefix
    expect(bodyString).not.toContain("$2b$"); // BCrypt hash prefix
  });
});
