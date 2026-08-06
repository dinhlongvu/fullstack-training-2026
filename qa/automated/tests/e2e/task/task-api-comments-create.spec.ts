import { test, expect, type APIRequestContext, request as playwrightRequest } from "@playwright/test";
import { API_BASE, registerAndLogin, createProjectViaApi, createTaskViaApi, addMemberViaApi, type RegisteredUser, type CommentDto } from "../utils/api-helpers";

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE: POST /api/tasks/{taskId}/comments
// Maps to: qa/test-cases/tasks/09-comments-create.md
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("API: POST /api/tasks/{taskId}/comments — Create Comment", () => {
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

  test("TC-TASK-COMMENTS-CREATE-001: Owner creates comment (happy path) → 201 Created", async ({ request }) => {
    const project = await createProjectViaApi(request, owner.token, { name: "Create Comments Project 1" });
    const task = await createTaskViaApi(request, owner.token, project.id, "Task 1");

    const res = await request.post(`${API_BASE}/api/tasks/${task.id}/comments`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { content: "This is a test comment by owner" }
    });

    expect(res.status()).toBe(201);
    const comment: CommentDto = await res.json();
    expect(comment).toHaveProperty("id");
    expect(comment.content).toBe("This is a test comment by owner");
    expect(comment.authorId).toBe(owner.id);
    expect(comment.authorName).toBe(owner.fullName);
    expect(comment.createdAt).toBeTruthy();
    expect(comment.updatedAt).toBeTruthy();
  });

  test("TC-TASK-COMMENTS-CREATE-002: Member creates comment → 201 Created", async ({ request }) => {
    const project = await createProjectViaApi(request, owner.token, { name: "Create Comments Project 2" });
    await addMemberViaApi(request, owner.token, project.id, member.email);
    const task = await createTaskViaApi(request, owner.token, project.id, "Task 2");

    const res = await request.post(`${API_BASE}/api/tasks/${task.id}/comments`, {
      headers: { Authorization: `Bearer ${member.token}` },
      data: { content: "Member commenting" }
    });

    expect(res.status()).toBe(201);
    const comment: CommentDto = await res.json();
    expect(comment.authorId).toBe(member.id);
  });

  test("TC-TASK-COMMENTS-CREATE-003: No token → 401 Unauthorized", async ({ request }) => {
    const project = await createProjectViaApi(request, owner.token, { name: "Create Comments Project 3" });
    const task = await createTaskViaApi(request, owner.token, project.id, "Task 3");

    const res = await request.post(`${API_BASE}/api/tasks/${task.id}/comments`, {
      data: { content: "Will fail" }
    });

    expect(res.status()).toBe(401);
  });

  test("TC-TASK-COMMENTS-CREATE-004: Non-member cannot create comment → 404 Not Found", async ({ request }) => {
    const project = await createProjectViaApi(request, owner.token, { name: "Create Comments Project 4" });
    const task = await createTaskViaApi(request, owner.token, project.id, "Task 4");

    const res = await request.post(`${API_BASE}/api/tasks/${task.id}/comments`, {
      headers: { Authorization: `Bearer ${nonMember.token}` },
      data: { content: "Should fail" }
    });

    expect(res.status()).toBe(404);
  });

  test("TC-TASK-COMMENTS-CREATE-005: Empty content fails validation → 400 Bad Request", async ({ request }) => {
    const project = await createProjectViaApi(request, owner.token, { name: "Create Comments Project 5" });
    const task = await createTaskViaApi(request, owner.token, project.id, "Task 5");

    const res = await request.post(`${API_BASE}/api/tasks/${task.id}/comments`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { content: "   " } // Only spaces, should fail NotEmpty after trim or directly
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.errors).toBeTruthy();
  });

  test("TC-TASK-COMMENTS-CREATE-006: Exceeding max length fails validation → 400 Bad Request", async ({ request }) => {
    const project = await createProjectViaApi(request, owner.token, { name: "Create Comments Project 6" });
    const task = await createTaskViaApi(request, owner.token, project.id, "Task 6");

    const res = await request.post(`${API_BASE}/api/tasks/${task.id}/comments`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { content: "A".repeat(2001) }
    });

    expect(res.status()).toBe(400);
  });

  test("TC-TASK-COMMENTS-CREATE-007: Non-existent task → 404 Not Found", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/tasks/999999/comments`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { content: "Invalid task" }
    });

    expect(res.status()).toBe(404);
  });

  test("TC-TASK-COMMENTS-CREATE-008: Invalid taskId format → Route constraint rejects", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/tasks/invalid_id/comments`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { content: "Route error" }
    });

    expect([400, 404]).toContain(res.status());
  });
});
