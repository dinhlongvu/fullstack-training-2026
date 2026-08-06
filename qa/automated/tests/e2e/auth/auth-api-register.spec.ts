import { test, expect, type APIRequestContext } from "@playwright/test";

import { API_BASE, uniqueEmail } from "../utils/api-helpers";

// ─── Constants ───────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE: POST /api/auth/register — User Registration
// Maps to: qa/test-cases/api/auth/01-register.md
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("API: POST /api/auth/register — User Registration", () => {
  test("TC-REG-001: Register with valid data (happy path) → 201", async ({
    request,
  }) => {
    const email = uniqueEmail();
    const res = await request.post(`${API_BASE}/api/auth/register`, {
      data: { email, fullName: "Nguyen Van A", password: "Test@1234" },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty("id");
    expect(body.email).toBe(email);
    expect(body.fullName).toBe("Nguyen Van A");
    // Must NOT expose password or passwordHash
    expect(body).not.toHaveProperty("password");
    expect(body).not.toHaveProperty("passwordHash");
  });

  test("TC-REG-002: Register with duplicate email → 409 Conflict", async ({
    request,
  }) => {
    const email = uniqueEmail();

    // First registration
    const first = await request.post(`${API_BASE}/api/auth/register`, {
      data: { email, fullName: "First User", password: "Test@1234" },
    });
    expect(first.status()).toBe(201);

    // Second registration with same email
    const second = await request.post(`${API_BASE}/api/auth/register`, {
      data: { email, fullName: "Another User", password: "Test@1234" },
    });

    expect(second.status()).toBe(409);
    const body = await second.json();
    expect(body.error).toMatch(/email.*already.*registered/i);
  });

  test("TC-REG-003: Register with empty email → 400", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/auth/register`, {
      data: { email: "", fullName: "Nguyen Van A", password: "Test@1234" },
    });

    expect(res.status()).toBe(400);
  });

  test("TC-REG-004: Register with invalid email format → 400", async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE}/api/auth/register`, {
      data: {
        email: "not-an-email",
        fullName: "Nguyen Van A",
        password: "Test@1234",
      },
    });

    expect(res.status()).toBe(400);
  });

  test("TC-REG-005: Register with password below minimum length (6 chars) → 400", async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE}/api/auth/register`, {
      data: {
        email: uniqueEmail(),
        fullName: "Nguyen Van A",
        password: "Abc@12",
      },
    });

    expect(res.status()).toBe(400);
  });

  test("TC-REG-006: Register with password exactly 8 characters (lower boundary) → 201", async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE}/api/auth/register`, {
      data: {
        email: uniqueEmail(),
        fullName: "Nguyen Van A",
        password: "Abcd@123",
      },
    });

    expect(res.status()).toBe(201);
  });

  test("TC-REG-007: Register with empty fullName → 400", async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE}/api/auth/register`, {
      data: { email: uniqueEmail(), fullName: "", password: "Test@1234" },
    });

    expect(res.status()).toBe(400);
  });

  test("TC-REG-008: Register with empty password → 400", async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE}/api/auth/register`, {
      data: { email: uniqueEmail(), fullName: "Nguyen Van A", password: "" },
    });

    expect(res.status()).toBe(400);
  });

  test("TC-REG-009: Register with empty request body → 400", async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE}/api/auth/register`, {
      data: {},
    });

    expect(res.status()).toBe(400);
  });

  test("TC-REG-010: Register with case-insensitive duplicate email → 409", async ({
    request,
  }) => {
    const email = uniqueEmail();

    // Register with lowercase
    const first = await request.post(`${API_BASE}/api/auth/register`, {
      data: { email, fullName: "First User", password: "Test@1234" },
    });
    expect(first.status()).toBe(201);

    // Try registering with uppercase version
    const second = await request.post(`${API_BASE}/api/auth/register`, {
      data: {
        email: email.toUpperCase(),
        fullName: "Another User",
        password: "Test@1234",
      },
    });

    expect(second.status()).toBe(409);
    const body = await second.json();
    expect(body.error).toMatch(/email.*already.*registered/i);
  });

  test("TC-REG-012: Register with wrong Content-Type header → 415", async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE}/api/auth/register`, {
      headers: { "Content-Type": "text/plain" },
      data: "email=test@example.com&fullName=Test&password=Test@1234",
    });

    // Server cannot parse non-JSON body
    expect([400, 415]).toContain(res.status());
  });

  test("TC-REG-013: Register with valid standard email (dot in local) → 201", async ({
    request,
  }) => {
    const email = `john.doe.${Date.now()}@example.com`;
    const res = await request.post(`${API_BASE}/api/auth/register`, {
      data: { email, fullName: "John Doe", password: "Passw0rd!" },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.email).toBe(email);
  });

  test("TC-REG-014: Register with email containing '_' character → 201", async ({
    request,
  }) => {
    const email = `john_doe_${Date.now()}@example.com`;
    const res = await request.post(`${API_BASE}/api/auth/register`, {
      data: { email, fullName: "John Doe", password: "Passw0rd!" },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.email).toBe(email);
  });

  test("TC-REG-015: Register with uppercase email → 201 + email normalized to lowercase", async ({
    request,
  }) => {
    const ts = Date.now();
    const uppercaseEmail = `John.Doe.${ts}@Example.Com`;
    const res = await request.post(`${API_BASE}/api/auth/register`, {
      data: {
        email: uppercaseEmail,
        fullName: "John Doe",
        password: "Passw0rd!",
      },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    // Email should be normalized to lowercase
    expect(body.email).toBe(uppercaseEmail.toLowerCase());
  });

  test("TC-REG-016: Register with missing domain (john@) → 400", async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE}/api/auth/register`, {
      data: { email: "john@", fullName: "John Doe", password: "Passw0rd!" },
    });

    expect(res.status()).toBe(400);
  });

  test("TC-REG-017: Register with missing local part (@example.com) → 400", async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE}/api/auth/register`, {
      data: {
        email: "@example.com",
        fullName: "John Doe",
        password: "Passw0rd!",
      },
    });

    expect(res.status()).toBe(400);
  });

  test("TC-REG-018: Register with missing dot in domain → 400", async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE}/api/auth/register`, {
      data: {
        email: "john@examplecom",
        fullName: "John Doe",
        password: "Passw0rd!",
      },
    });

    expect(res.status()).toBe(400);
  });

  test("TC-REG-019: Register with missing domain name (john@.com) → 400", async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE}/api/auth/register`, {
      data: {
        email: "john@.com",
        fullName: "John Doe",
        password: "Passw0rd!",
      },
    });

    expect(res.status()).toBe(400);
  });

  test("TC-REG-020: Register with space in email → 400", async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE}/api/auth/register`, {
      data: {
        email: "john doe@example.com",
        fullName: "John Doe",
        password: "Passw0rd!",
      },
    });

    expect(res.status()).toBe(400);
  });

  test("TC-REG-021: Register with leading/trailing spaces in email → 400 (spaces rejected by validator)", async ({
    request,
  }) => {
    const baseEmail = `trim.test.${Date.now()}@example.com`;
    const res = await request.post(`${API_BASE}/api/auth/register`, {
      data: {
        email: `  ${baseEmail}  `,
        fullName: "John Doe",
        password: "Passw0rd!",
      },
    });

    // Backend regex validator rejects emails with leading/trailing spaces
    expect(res.status()).toBe(400);
  });

  test("TC-REG-025: Register with underscore in domain → 400", async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE}/api/auth/register`, {
      data: {
        email: "john@example_domain.com",
        fullName: "John Doe",
        password: "Passw0rd!",
      },
    });

    expect(res.status()).toBe(400);
  });

  test("TC-REG-026: Register with subdomain email → 201", async ({
    request,
  }) => {
    const email = `john.${Date.now()}@mail.example.com`;
    const res = await request.post(`${API_BASE}/api/auth/register`, {
      data: { email, fullName: "John Doe", password: "Passw0rd!" },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.email).toBe(email);
  });

  test("TC-REG-027: Register with Unicode domain → 400", async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE}/api/auth/register`, {
      data: {
        email: "john@müller.com",
        fullName: "John Doe",
        password: "Passw0rd!",
      },
    });

    expect(res.status()).toBe(400);
  });

  test("TC-REG-029: Register with email exactly 254 characters (RFC max) → 201", async ({
    request,
  }) => {
    // Construct email exactly 254 chars: local@example.com
    // "@example.com" = 12 chars, so local part = 242 chars
    // Use timestamp prefix to ensure uniqueness across runs
    const ts = String(Date.now());
    const padding = "a".repeat(242 - ts.length);
    const localPart = `${ts}${padding}`;
    const email = `${localPart}@example.com`;
    expect(email.length).toBe(254);

    const res = await request.post(`${API_BASE}/api/auth/register`, {
      data: { email, fullName: "John Doe", password: "Passw0rd!" },
    });

    expect(res.status()).toBe(201);
  });

  test("TC-REG-030: Register with email exceeding 254 characters → 400", async ({
    request,
  }) => {
    // Construct email with 255 chars
    const localPart = "a".repeat(243);
    const email = `${localPart}@example.com`;
    expect(email.length).toBe(255);

    const res = await request.post(`${API_BASE}/api/auth/register`, {
      data: { email, fullName: "John Doe", password: "Passw0rd!" },
    });

    expect(res.status()).toBe(400);
  });

  test("TC-REG-031: Register with XSS injection in email → 400", async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE}/api/auth/register`, {
      data: {
        email: "<script>alert('xss')</script>@example.com",
        fullName: "John Doe",
        password: "Passw0rd!",
      },
    });

    expect(res.status()).toBe(400);
  });

  test("TC-REG-032: Register with SQL injection in email → 400", async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE}/api/auth/register`, {
      data: {
        email: "admin'--@example.com",
        fullName: "John Doe",
        password: "Passw0rd!",
      },
    });

    expect(res.status()).toBe(400);
  });

  test("TC-REG-033: Register with JSON injection in email → 400", async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE}/api/auth/register`, {
      data: {
        email: 'test@example.com","role":"admin',
        fullName: "John Doe",
        password: "Passw0rd!",
      },
    });

    expect(res.status()).toBe(400);
  });

  test("TC-REG-034: Register with null byte in email → 400", async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE}/api/auth/register`, {
      data: {
        email: "john\u0000@example.com",
        fullName: "John Doe",
        password: "Passw0rd!",
      },
    });

    expect(res.status()).toBe(400);
  });

  test("TC-REG-035: Register with special chars only in local part (!) → 400", async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE}/api/auth/register`, {
      data: {
        email: "!@example.com",
        fullName: "John Doe",
        password: "Passw0rd!",
      },
    });

    expect(res.status()).toBe(400);
  });

  test("TC-REG-036: Register with 1-character TLD → 400", async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE}/api/auth/register`, {
      data: {
        email: "john@example.c",
        fullName: "John Doe",
        password: "Passw0rd!",
      },
    });

    expect(res.status()).toBe(400);
  });
});
