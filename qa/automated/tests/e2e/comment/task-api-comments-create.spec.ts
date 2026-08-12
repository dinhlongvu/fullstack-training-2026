import { test, expect } from "../utils/api-fixtures";
import { API_BASE, uniqueEmail, registerAndLogin, createProjectViaApi, createTaskViaApi, addMemberViaApi, getProjectDetailViaApi, getProjectsViaApi, futureDateISO, type RegisteredUser, type ProjectDto, type TaskDto, type CommentDto } from "../utils/api-helpers";

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE: POST /api/tasks/{taskId}/comments
// Maps to: qa/test-cases/tasks/09-comments-create.md
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("API: POST /api/tasks/{taskId}/comments — Create Comment", () => {
  test("TC-TASK-COMMENTS-CREATE-001: Owner creates comment (happy path) → 201 Created", async ({ request, owner }) => {
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

  test("TC-TASK-COMMENTS-CREATE-002: Member creates comment → 201 Created", async ({ request, owner, member }) => {
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

  test("TC-TASK-COMMENTS-CREATE-003: No token → 401 Unauthorized", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, { name: "Create Comments Project 3" });
    const task = await createTaskViaApi(request, owner.token, project.id, "Task 3");

    const res = await request.post(`${API_BASE}/api/tasks/${task.id}/comments`, {
      data: { content: "Will fail" }
    });

    expect(res.status()).toBe(401);
  });

  test("TC-TASK-COMMENTS-CREATE-004: Non-member cannot create comment → 404 Not Found", async ({ request, owner, nonMember }) => {
    const project = await createProjectViaApi(request, owner.token, { name: "Create Comments Project 4" });
    const task = await createTaskViaApi(request, owner.token, project.id, "Task 4");

    const res = await request.post(`${API_BASE}/api/tasks/${task.id}/comments`, {
      headers: { Authorization: `Bearer ${nonMember.token}` },
      data: { content: "Should fail" }
    });

    expect(res.status()).toBe(404);
  });

  test("TC-TASK-COMMENTS-CREATE-005: Empty content fails validation → 400 Bad Request", async ({ request, owner }) => {
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

  test("TC-TASK-COMMENTS-CREATE-006: Exceeding max length fails validation → 400 Bad Request", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, { name: "Create Comments Project 6" });
    const task = await createTaskViaApi(request, owner.token, project.id, "Task 6");

    const res = await request.post(`${API_BASE}/api/tasks/${task.id}/comments`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { content: "A".repeat(2001) }
    });

    expect(res.status()).toBe(400);
  });

  test("TC-TASK-COMMENTS-CREATE-007: Non-existent task → 404 Not Found", async ({ request, owner }) => {
    const res = await request.post(`${API_BASE}/api/tasks/999999/comments`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { content: "Invalid task" }
    });

    expect(res.status()).toBe(404);
  });

  test("TC-TASK-COMMENTS-CREATE-008: Invalid taskId format → Route constraint rejects", async ({ request, owner }) => {
    const res = await request.post(`${API_BASE}/api/tasks/invalid_id/comments`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { content: "Route error" }
    });

    expect([400, 404]).toContain(res.status());
  });

  test("TC-TASK-COMMENTS-CREATE-009: Missing content field → 400 Bad Request", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, { name: "Comments Create Project 9" });
    const task = await createTaskViaApi(request, owner.token, project.id, "Task 9");

    const res = await request.post(`${API_BASE}/api/tasks/${task.id}/comments`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: {} // Missing content
    });

    expect(res.status()).toBe(400);
  });

  test("TC-TASK-COMMENTS-CREATE-010: XSS in content → 201 Created (sanitized on frontend)", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, { name: "Comments Create Project 10" });
    const task = await createTaskViaApi(request, owner.token, project.id, "Task 10");

    const xssPayload = "<script>alert('xss')</script>";
    const res = await request.post(`${API_BASE}/api/tasks/${task.id}/comments`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { content: xssPayload }
    });

    expect(res.status()).toBe(201);
    const data = await res.json();
    expect(data.content).toBe(xssPayload);
  });

  test("TC-TASK-COMMENTS-CREATE-011: Long unspaced string → 201 Created", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, { name: "Comments Create Project 11" });
    const task = await createTaskViaApi(request, owner.token, project.id, "Task 11");

    const longString = "ThisIsAVeryLongStringWithoutAnySpacesThatKeepsGoingAndGoingAndGoingAndGoingAndGoing";
    const res = await request.post(`${API_BASE}/api/tasks/${task.id}/comments`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { content: longString }
    });

    expect(res.status()).toBe(201);
    const data = await res.json();
    expect(data.content).toBe(longString);
  });

  test("TC-TASK-COMMENTS-CREATE-012: Consecutive newlines → 201 Created", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, { name: "Comments Create Project 12" });
    const task = await createTaskViaApi(request, owner.token, project.id, "Task 12");

    const newlinesString = "Line 1\n\n\n\n\nLine 2";
    const res = await request.post(`${API_BASE}/api/tasks/${task.id}/comments`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { content: newlinesString }
    });

    expect(res.status()).toBe(201);
    const data = await res.json();
    expect(data.content).toBe(newlinesString);
  });
});
