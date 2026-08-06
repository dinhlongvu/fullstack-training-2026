import { test, expect, type APIRequestContext, request as playwrightRequest } from "@playwright/test";
import { API_BASE, registerAndLogin, createProjectViaApi, createTaskViaApi, addMemberViaApi, type RegisteredUser, type CommentDto } from "../utils/api-helpers";

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
