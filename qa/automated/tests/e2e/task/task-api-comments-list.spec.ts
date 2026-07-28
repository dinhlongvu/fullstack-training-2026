import { test, expect, type APIRequestContext, request as playwrightRequest } from "@playwright/test";
import { execSync } from "child_process";
import * as path from "path";

// ─── Constants ───────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:5000";

// ─── Types ───────────────────────────────────────────────────────────────────
interface RegisteredUser {
  id: number;
  email: string;
  fullName: string;
  password: string;
  token: string;
}

interface CommentDto {
  id: number;
  content: string;
  authorId: number;
  authorName: string;
  createdAt: string;
  updatedAt: string | null;
}

// ─── Helper Functions ────────────────────────────────────────────────────────
function uniqueEmail(): string {
  return `commentslist_${Date.now()}_${Math.floor(Math.random() * 100000)}@example.com`;
}

async function registerAndLogin(
  request: APIRequestContext,
  overrides?: { email?: string; fullName?: string; password?: string },
): Promise<RegisteredUser> {
  const email = overrides?.email ?? uniqueEmail();
  const fullName = overrides?.fullName ?? "Comment List Test User";
  const password = overrides?.password ?? "Test@1234";

  const registerRes = await request.post(`${API_BASE}/api/auth/register`, {
    data: { email, fullName, password },
  });
  expect(registerRes.status(), `Register failed for ${email}`).toBe(201);
  const registerBody = await registerRes.json();

  const loginRes = await request.post(`${API_BASE}/api/auth/login`, {
    data: { email, password },
  });
  expect(loginRes.status(), `Login failed for ${email}`).toBe(200);
  const loginBody = await loginRes.json();

  return {
    id: registerBody.id ?? loginBody.user?.id,
    email,
    fullName,
    password,
    token: loginBody.token,
  };
}

async function createProjectViaApi(
  request: APIRequestContext,
  token: string,
  data: { name: string; description?: string },
): Promise<{ id: number; name: string }> {
  const res = await request.post(`${API_BASE}/api/projects`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { name: data.name, description: data.description ?? "" },
  });
  expect(res.status(), "Create project should return 201").toBe(201);
  return res.json();
}

async function createTaskViaApi(
  request: APIRequestContext,
  token: string,
  projectId: number,
  title: string
): Promise<{ id: number; title: string }> {
  const res = await request.post(
    `${API_BASE}/api/projects/${projectId}/tasks`,
    {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title,
        description: "",
        priority: 0,
      },
    },
  );
  expect(res.status(), `Create task failed: ${title}`).toBe(201);
  return res.json();
}

async function addMemberViaApi(
  request: APIRequestContext,
  ownerToken: string,
  projectId: number,
  memberEmail: string,
): Promise<void> {
  const res = await request.post(
    `${API_BASE}/api/projects/${projectId}/members`,
    {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: { email: memberEmail },
    },
  );
  expect(res.status(), `Add member failed: ${memberEmail}`).toBe(201);
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE: GET /api/tasks/{taskId}/comments
// Maps to: qa/test-cases/tasks/08-comments-list.md
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("API: GET /api/tasks/{taskId}/comments — List Comments", () => {
  let apiContext: APIRequestContext;
  let owner: RegisteredUser;
  let member: RegisteredUser;
  let nonMember: RegisteredUser;

  test.beforeAll(async () => {
    apiContext = await playwrightRequest.newContext();
    owner = await registerAndLogin(apiContext, { fullName: "Comment Owner" });
    member = await registerAndLogin(apiContext, { fullName: "Comment Member" });
    nonMember = await registerAndLogin(apiContext, { fullName: "Comment NonMember" });
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test("TC-TASK-COMMENTS-001: Owner gets comments (happy path) → 200 OK", async ({ request }) => {
    const project = await createProjectViaApi(request, owner.token, { name: "Comments Project 1" });
    const task = await createTaskViaApi(request, owner.token, project.id, "Task 1");

    // We can't easily seed comments via API yet, so we verify empty array is returned successfully (200)
    const res = await request.get(`${API_BASE}/api/tasks/${task.id}/comments`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });

    expect(res.status()).toBe(200);
    const comments: CommentDto[] = await res.json();
    expect(Array.isArray(comments)).toBe(true);
    expect(comments.length).toBe(0); // Assuming no comments seeded
  });

  test("TC-TASK-COMMENTS-002: Member gets comments → 200 OK", async ({ request }) => {
    const project = await createProjectViaApi(request, owner.token, { name: "Comments Project 2" });
    await addMemberViaApi(request, owner.token, project.id, member.email);
    const task = await createTaskViaApi(request, owner.token, project.id, "Task 2");

    const res = await request.get(`${API_BASE}/api/tasks/${task.id}/comments`, {
      headers: { Authorization: `Bearer ${member.token}` },
    });

    expect(res.status()).toBe(200);
    const comments: CommentDto[] = await res.json();
    expect(Array.isArray(comments)).toBe(true);
  });

  test("TC-TASK-COMMENTS-003: No token → 401 Unauthorized", async ({ request }) => {
    const project = await createProjectViaApi(request, owner.token, { name: "Comments Project 3" });
    const task = await createTaskViaApi(request, owner.token, project.id, "Task 3");

    const res = await request.get(`${API_BASE}/api/tasks/${task.id}/comments`);

    expect(res.status()).toBe(401);
  });

  test("TC-TASK-COMMENTS-004: Non-member cannot get comments → 404 Not Found", async ({ request }) => {
    const project = await createProjectViaApi(request, owner.token, { name: "Comments Project 4" });
    const task = await createTaskViaApi(request, owner.token, project.id, "Task 4");

    const res = await request.get(`${API_BASE}/api/tasks/${task.id}/comments`, {
      headers: { Authorization: `Bearer ${nonMember.token}` },
    });

    expect(res.status()).toBe(404);
  });

  test("TC-TASK-COMMENTS-005: Non-existent task → 404 Not Found", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/tasks/999999/comments`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });

    expect(res.status()).toBe(404);
  });

  test("TC-TASK-COMMENTS-006: Invalid taskId format → Route constraint rejects", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/tasks/invalid_id/comments`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });

    // ASP.NET route constraint {taskId:int} will return 404 because it doesn't match the route
    expect([400, 404]).toContain(res.status());
  });

  test("TC-TASK-COMMENTS-007: SQL Injection → Route constraint rejects", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/tasks/1; DROP TABLE Tasks; --/comments`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });

    // ASP.NET route constraint {taskId:int} will return 404
    expect([400, 404]).toContain(res.status());
  });
});
