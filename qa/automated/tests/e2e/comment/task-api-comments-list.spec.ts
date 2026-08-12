import { test, expect } from "../utils/api-fixtures";
import { API_BASE, uniqueEmail, registerAndLogin, createProjectViaApi, createTaskViaApi, addMemberViaApi, getProjectDetailViaApi, getProjectsViaApi, futureDateISO, createCommentViaApi, type RegisteredUser, type ProjectDto, type TaskDto, type CommentDto } from "../utils/api-helpers";

import { execSync } from "child_process";
import * as path from "path";

// ─── Constants ───────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE: GET /api/tasks/{taskId}/comments
// Maps to: qa/test-cases/tasks/08-comments-list.md
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("API: GET /api/tasks/{taskId}/comments — List Comments", () => {
  test("TC-TASK-COMMENTS-001: Owner gets comments (happy path) → 200 OK", async ({ request, owner }) => {
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

  test("TC-TASK-COMMENTS-002: Member gets comments → 200 OK", async ({ request, owner, member }) => {
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

  test("TC-TASK-COMMENTS-003: No token → 401 Unauthorized", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, { name: "Comments Project 3" });
    const task = await createTaskViaApi(request, owner.token, project.id, "Task 3");

    const res = await request.get(`${API_BASE}/api/tasks/${task.id}/comments`);

    expect(res.status()).toBe(401);
  });

  test("TC-TASK-COMMENTS-004: Non-member cannot get comments → 404 Not Found", async ({ request, owner, nonMember }) => {
    const project = await createProjectViaApi(request, owner.token, { name: "Comments Project 4" });
    const task = await createTaskViaApi(request, owner.token, project.id, "Task 4");

    const res = await request.get(`${API_BASE}/api/tasks/${task.id}/comments`, {
      headers: { Authorization: `Bearer ${nonMember.token}` },
    });

    expect(res.status()).toBe(404);
  });

  test("TC-TASK-COMMENTS-005: Non-existent task → 404 Not Found", async ({ request, owner }) => {
    const res = await request.get(`${API_BASE}/api/tasks/999999/comments`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });

    expect(res.status()).toBe(404);
  });

  test("TC-TASK-COMMENTS-006: Invalid taskId format → Route constraint rejects", async ({ request, owner }) => {
    const res = await request.get(`${API_BASE}/api/tasks/invalid_id/comments`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });

    // ASP.NET route constraint {taskId:int} will return 404 because it doesn't match the route
    expect([400, 404]).toContain(res.status());
  });

  test("TC-TASK-COMMENTS-007: SQL Injection → Route constraint rejects", async ({ request, owner }) => {
    const res = await request.get(`${API_BASE}/api/tasks/1; DROP TABLE Tasks; --/comments`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });

    // ASP.NET route constraint {taskId:int} will return 404
    expect([400, 404]).toContain(res.status());
  });

  test("TC-TASK-COMMENTS-008: Empty state (task has no comments)", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, { name: "Comments Project 8" });
    const task = await createTaskViaApi(request, owner.token, project.id, "Task 8");

    const res = await request.get(`${API_BASE}/api/tasks/${task.id}/comments`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });

    expect(res.status()).toBe(200);
    const comments: CommentDto[] = await res.json();
    expect(comments).toEqual([]);
  });

  test("TC-TASK-COMMENTS-009: Check comment sorting order (oldest first)", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, { name: "Comments Project 9" });
    const task = await createTaskViaApi(request, owner.token, project.id, "Task 9");

    await createCommentViaApi(request, owner.token, task.id, "First comment");
    await new Promise(r => setTimeout(r, 100)); // small delay
    await createCommentViaApi(request, owner.token, task.id, "Second comment");

    const res = await request.get(`${API_BASE}/api/tasks/${task.id}/comments`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });

    expect(res.status()).toBe(200);
    const comments: CommentDto[] = await res.json();
    expect(comments.length).toBe(2);
    expect(comments[0].content).toBe("First comment");
    expect(comments[1].content).toBe("Second comment");
    expect(new Date(comments[0].createdAt).getTime()).toBeLessThanOrEqual(new Date(comments[1].createdAt).getTime());
  });
});
