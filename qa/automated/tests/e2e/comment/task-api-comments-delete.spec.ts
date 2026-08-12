import { test, expect } from "../utils/api-fixtures";
import { API_BASE, registerAndLogin, createProjectViaApi, createTaskViaApi, createCommentViaApi, addMemberViaApi, type RegisteredUser } from "../utils/api-helpers";

test.describe("API: DELETE /api/tasks/{taskId}/comments/{commentId} — Delete Comment", () => {
  test("TC-TASK-COMMENTS-DELETE-001: Author deletes their own comment → 204 No Content", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, { name: "Delete Comment Proj 1" });
    const task = await createTaskViaApi(request, owner.token, project.id, "Task 1");
    const comment = await createCommentViaApi(request, owner.token, task.id, "Comment to delete");

    const res = await request.delete(`${API_BASE}/api/tasks/${task.id}/comments/${comment.id}`, {
      headers: { Authorization: `Bearer ${owner.token}` }
    });

    expect([200, 204]).toContain(res.status());
  });

  test("TC-TASK-COMMENTS-DELETE-002: Project owner deletes member's comment → 204 No Content", async ({ request, owner, member }) => {
    const project = await createProjectViaApi(request, owner.token, { name: "Delete Comment Proj 2" });
    await addMemberViaApi(request, owner.token, project.id, member.email);
    const task = await createTaskViaApi(request, owner.token, project.id, "Task 2");
    
    // Member creates comment
    const comment = await createCommentViaApi(request, member.token, task.id, "Member's comment");

    // Owner deletes it (should have admin rights)
    const res = await request.delete(`${API_BASE}/api/tasks/${task.id}/comments/${comment.id}`, {
      headers: { Authorization: `Bearer ${owner.token}` }
    });

    expect([200, 204]).toContain(res.status());
  });

  test("TC-TASK-COMMENTS-DELETE-003: Member tries to delete another's comment → 403 Forbidden / 404", async ({ request, owner, member }) => {
    const project = await createProjectViaApi(request, owner.token, { name: "Delete Comment Proj 3" });
    await addMemberViaApi(request, owner.token, project.id, member.email);
    const task = await createTaskViaApi(request, owner.token, project.id, "Task 3");
    
    // Owner creates comment
    const comment = await createCommentViaApi(request, owner.token, task.id, "Owner's comment");

    // Member tries to delete it
    const res = await request.delete(`${API_BASE}/api/tasks/${task.id}/comments/${comment.id}`, {
      headers: { Authorization: `Bearer ${member.token}` }
    });

    expect([403, 404]).toContain(res.status());
  });

  test("TC-TASK-COMMENTS-DELETE-004: Delete non-existent comment → 404 Not Found", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, { name: "Delete Comment Proj 4" });
    const task = await createTaskViaApi(request, owner.token, project.id, "Task 4");

    const res = await request.delete(`${API_BASE}/api/tasks/${task.id}/comments/999999`, {
      headers: { Authorization: `Bearer ${owner.token}` }
    });

    expect(res.status()).toBe(404);
  });
});
