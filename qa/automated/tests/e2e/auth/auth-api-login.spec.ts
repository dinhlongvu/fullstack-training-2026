import { test, expect, type APIRequestContext } from "@playwright/test";

import { API_BASE, uniqueEmail } from "../utils/api-helpers";

// Local helper — registers a user without login (only used in this file)
async function registerUser(request: APIRequestContext, email: string, fullName: string, password: string) {
  const res = await request.post(`${API_BASE}/api/auth/register`, {
    data: { email, fullName, password },
  });
  expect(res.status(), `Register failed for ${email}`).toBe(201);
}

// ─── Constants ───────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE: POST /api/auth/login — User Login
// Maps to: qa/test-cases/api/auth/02-login.md
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("API: POST /api/auth/login — User Login", () => {
  test("TC-LOGIN-001: Login with valid credentials (happy path) → 200 + JWT", async ({
    request,
  }) => {
    const email = uniqueEmail();
    const password = "Test@1234";
    await registerUser(request, email, "Test User", password);

    const res = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email, password },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("token");
    expect(typeof body.token).toBe("string");
    expect(body.token.length).toBeGreaterThan(0);
    // Verify user object in response
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe(email);
    expect(body.user.fullName).toBe("Test User");
    expect(body.user).toHaveProperty("id");
  });

  test("TC-LOGIN-002: Login with non-existent email → 401", async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE}/api/auth/login`, {
      data: {
        email: "nonexistent_999@example.com",
        password: "Test@1234",
      },
    });

    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("Invalid email or password");
    // Must not reveal whether email exists (security)
    expect(body).not.toHaveProperty("token");
  });

  test("TC-LOGIN-003: Login with wrong password → 401", async ({
    request,
  }) => {
    const email = uniqueEmail();
    await registerUser(request, email, "Test User", "Test@1234");

    const res = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email, password: "WrongPassword!" },
    });

    expect(res.status()).toBe(401);
    const body = await res.json();
    // Generic error message — does not distinguish wrong email vs wrong password
    expect(body.error).toContain("Invalid email or password");
    expect(body).not.toHaveProperty("token");
  });

  test("TC-LOGIN-004: Login with empty email → 400", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: "", password: "Test@1234" },
    });

    expect(res.status()).toBe(400);
    expect(await res.json()).not.toHaveProperty("token");
  });

  test("TC-LOGIN-005: Login with empty password → 400", async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: "testuser@example.com", password: "" },
    });

    expect(res.status()).toBe(400);
    expect(await res.json()).not.toHaveProperty("token");
  });

  test("TC-LOGIN-006: Login with empty request body → 400", async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE}/api/auth/login`, {
      data: {},
    });

    expect(res.status()).toBe(400);
    expect(await res.json()).not.toHaveProperty("token");
  });

  test("TC-LOGIN-007: Login with case-insensitive email → 200", async ({
    request,
  }) => {
    const email = uniqueEmail();
    const password = "Test@1234";
    await registerUser(request, email, "Test User", password);

    // Login with uppercase version of the email
    const res = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: email.toUpperCase(), password },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("token");
    // Returned email should be the normalized (lowercase) version
    expect(body.user.email).toBe(email);
  });

  test("TC-LOGIN-008: Login with invalid email format → 400", async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: "invalid-email-format", password: "Test@1234" },
    });

    expect(res.status()).toBe(400);
    expect(await res.json()).not.toHaveProperty("token");
  });

  test("TC-LOGIN-009: Login with SQL injection in email → 401 (no injection executed)", async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: "admin'--@example.com", password: "anything" },
    });

    // Should be rejected — either 400 (invalid format) or 401 (not found)
    expect([400, 401]).toContain(res.status());
    expect(await res.json()).not.toHaveProperty("token");
  });

  test("TC-LOGIN-010: Login with XSS in email → 400", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/auth/login`, {
      data: {
        email: "<script>alert(1)</script>@example.com",
        password: "anything",
      },
    });

    // Should be rejected — either 400 (invalid format) or 401 (not found)
    expect([400, 401]).toContain(res.status());
    expect(await res.json()).not.toHaveProperty("token");
  });

  test("TC-LOGIN-011: Login with missing password field → 400", async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: "testuser@example.com" },
    });

    expect(res.status()).toBe(400);
    expect(await res.json()).not.toHaveProperty("token");
  });

  test("TC-LOGIN-012: Login with wrong Content-Type header → 415", async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE}/api/auth/login`, {
      headers: { "Content-Type": "text/plain" },
      data: "email=test@example.com&password=Test@1234",
    });

    // Server cannot parse non-JSON body
    expect([400, 415]).toContain(res.status());
    // Response body may be empty on 415, so just verify no token via text check
    const text = await res.text();
    expect(text).not.toContain('"token"');
  });

  test("TC-LOGIN-013: Login with long email (> 254 chars) → no server crash", async ({
    request,
  }) => {
    const longLocal = "a".repeat(250);
    const longEmail = `${longLocal}@example.com`;

    const res = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: longEmail, password: "Test@1234" },
    });

    // Should be 400 or 401 — critically NOT 500
    expect(res.status()).toBeLessThan(500);
    expect(await res.json()).not.toHaveProperty("token");
  });

  test("TC-LOGIN-014: Verify JWT token has expiration claim", async ({
    request,
  }) => {
    const email = uniqueEmail();
    const password = "Test@1234";
    await registerUser(request, email, "Test User", password);

    const res = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email, password },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    const token = body.token;

    // Decode JWT payload (base64url)
    const payloadBase64 = token.split(".")[1];
    const payload = JSON.parse(
      Buffer.from(payloadBase64, "base64url").toString("utf-8"),
    );

    // Verify exp claim exists and is a future timestamp
    expect(payload).toHaveProperty("exp");
    expect(typeof payload.exp).toBe("number");
    const now = Math.floor(Date.now() / 1000);
    expect(payload.exp).toBeGreaterThan(now);
  });
});
