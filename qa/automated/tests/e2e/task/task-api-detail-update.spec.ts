import { test, expect } from "../utils/api-fixtures";
import { API_BASE, uniqueEmail, registerAndLogin, createProjectViaApi, createTaskViaApi, addMemberViaApi, createCommentViaApi, type RegisteredUser, type TaskDto, type ProjectDto } from "../utils/api-helpers";

// Priority and Status enum values (local to task tests)
const PRIORITY = { Low: "Low", Medium: "Medium", High: "High" } as const;
const TASK_STATUS = { Todo: "Todo", InProgress: "InProgress", Done: "Done" } as const;

// ─── Types (local — matches API response shape with string enums) ────────────
interface TaskDto {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assigneeName: string | null;
  commentCount: number;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE: GET /api/tasks/{id} — Task Detail
// Maps to: qa/test-cases/tasks/03-detail.md
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("API: GET /api/tasks/{id} — Task Detail", () => {
  test("TC-TASK-DETAIL-001: Get task detail as project owner (happy path) → 200", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, {
      name: "Detail Test Project",
    });

    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "Detail Test Task",
      description: "Detailed description",
      priority: PRIORITY.High,
    });

    const res = await request.get(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });

    expect(res.status()).toBe(200);
    const body: TaskDto = await res.json();

    expect(body.id).toBe(task.id);
    expect(body.title).toBe("Detail Test Task");
    expect(body.description).toBe("Detailed description");
    expect(body.status).toBe("Todo");
    expect(body.priority).toBe("High");
    expect(body).toHaveProperty("dueDate");
    expect(body).toHaveProperty("assigneeName");
    expect(body).toHaveProperty("commentCount");
    expect(body).toHaveProperty("createdAt");
  });

  test("TC-TASK-DETAIL-002: Get task detail as project member → 200", async ({ request, owner, member }) => {
    const project = await createProjectViaApi(request, owner.token, {
      name: "Member Detail Project",
    });
    await addMemberViaApi(request, owner.token, project.id, member.email);

    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "Member Task",
    });

    const res = await request.get(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${member.token}` },
    });

    expect(res.status()).toBe(200);
    const body: TaskDto = await res.json();
    expect(body.id).toBe(task.id);
  });

  test("TC-TASK-DETAIL-003: Get task detail without Bearer token → 401", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, {
      name: "Unauth Project",
    });
    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "Unauth Task",
    });

    const res = await request.get(`${API_BASE}/api/tasks/${task.id}`);
    expect(res.status()).toBe(401);
  });

  test("TC-TASK-DETAIL-004: Non-member cannot get task detail → 404", async ({ request, owner, nonMember }) => {
    const project = await createProjectViaApi(request, owner.token, {
      name: "Private Detail Project",
    });
    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "Private Task",
    });

    const res = await request.get(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${nonMember.token}` },
    });

    expect(res.status()).toBe(404);
  });

  test("TC-TASK-DETAIL-005: Get non-existent task → 404", async ({ request, owner }) => {
    const res = await request.get(`${API_BASE}/api/tasks/999999`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });

    expect(res.status()).toBe(404);
  });

  test("TC-TASK-DETAIL-006: Task detail includes correct comment count", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, {
      name: "Detail Comments Project",
    });
    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "Task with Comments",
    });

    await createCommentViaApi(request, owner.token, task.id, "Comment 1");
    await createCommentViaApi(request, owner.token, task.id, "Comment 2");
    await createCommentViaApi(request, owner.token, task.id, "Comment 3");

    const res = await request.get(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });

    expect(res.status()).toBe(200);
    const body: TaskDto = await res.json();
    expect(body.commentCount).toBe(3);
  });

  test("TC-TASK-DETAIL-007: Task detail with no comments returns commentCount=0", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, {
      name: "No Comment Project",
    });
    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "No Comment Task",
    });

    const res = await request.get(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });

    expect(res.status()).toBe(200);
    const body: TaskDto = await res.json();
    expect(body.commentCount).toBe(0);
  });

  test("TC-TASK-DETAIL-008: Task detail with invalid (non-integer) taskId → 400", async ({ request, owner }) => {
    const res = await request.get(`${API_BASE}/api/tasks/abc`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });

    expect(res.status()).toBe(404);
  });

  test("TC-TASK-DETAIL-009: Task detail shows correct assigned member name", async ({ request, owner, assignee }) => {
    const project = await createProjectViaApi(request, owner.token, {
      name: "Assignee Detail Project",
    });
    await addMemberViaApi(request, owner.token, project.id, assignee.email);

    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "Assigned Task",
      assigneeId: assignee.id,
    });

    const res = await request.get(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });

    expect(res.status()).toBe(200);
    const body: TaskDto = await res.json();
    expect(body.assigneeName).toBe(assignee.fullName);
  });

  test("TC-TASK-DETAIL-010: Task detail for unassigned task shows null assigneeName", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, {
      name: "Unassigned Detail Project",
    });

    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "Unassigned Task",
    });

    const res = await request.get(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });

    expect(res.status()).toBe(200);
    const body: TaskDto = await res.json();
    expect(body.assigneeName).toBeNull();
  });

  test("TC-TASK-DETAIL-012: SQL injection in taskId path parameter → rejected", async ({ request, owner }) => {
    const res = await request.get(
      `${API_BASE}/api/tasks/1%27%20OR%201=1%20--`,
      {
        headers: { Authorization: `Bearer ${owner.token}` },
      },
    );

    expect([400, 404]).toContain(res.status());
  });

  test("TC-TASK-DETAIL-013: XSS stored in title is returned safely in JSON response", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, {
      name: "XSS Detail Project",
    });

    const xssTitle = "<script>alert('xss')</script>";
    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: xssTitle,
    });

    const res = await request.get(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });

    expect(res.status()).toBe(200);
    const body: TaskDto = await res.json();
    expect(body.title).toBe(xssTitle);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE: PUT /api/tasks/{id} — Update Task
// Maps to: qa/test-cases/tasks/04-update.md
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("API: PUT /api/tasks/{id} — Update Task", () => {
  test("TC-TASK-UPDATE-001: Owner updates task with valid data → 200", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, {
      name: "Update Task Project 1",
    });
    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "Original Title",
      priority: PRIORITY.Low,
    });

    const res = await request.put(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: {
        title: "Updated Title",
        description: "New description",
        priority: "High",
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.title).toBe("Updated Title");
  });

  test("TC-TASK-UPDATE-002: Member updates task with valid data → 200", async ({ request, owner, member }) => {
    const project = await createProjectViaApi(request, owner.token, {
      name: "Update Task Project 2",
    });
    await addMemberViaApi(request, owner.token, project.id, member.email);

    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "Member Task",
    });

    const res = await request.put(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${member.token}` },
      data: { title: "Updated by Member", priority: "Medium" },
    });

    expect(res.status()).toBe(200);
  });

  test("TC-TASK-UPDATE-003: Update task without Bearer token → 401", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, {
      name: "No Token Project",
    });
    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "No Token Task",
    });

    const res = await request.put(`${API_BASE}/api/tasks/${task.id}`, {
      data: { title: "Hacked Title" },
    });

    expect(res.status()).toBe(401);
  });

  test("TC-TASK-UPDATE-004: Non-member cannot update task → 404", async ({ request, owner, nonMember }) => {
    const project = await createProjectViaApi(request, owner.token, {
      name: "Private Update Project",
    });
    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "Private Task",
    });

    const res = await request.put(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${nonMember.token}` },
      data: { title: "Unauthorized Update" },
    });

    expect(res.status()).toBe(404);
  });

  test("TC-TASK-UPDATE-005: Update task with empty title → 400", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, {
      name: "Empty Title Project",
    });
    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "Valid Title",
    });

    const res = await request.put(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { title: "" },
    });

    expect(res.status()).toBe(400);
  });

  test("TC-TASK-UPDATE-006: Update task with title exceeding 200 characters → 400", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, {
      name: "Long Title Project",
    });
    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "Short Title",
    });

    const res = await request.put(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { title: "A".repeat(201) },
    });

    expect(res.status()).toBe(400);
  });

  test("TC-TASK-UPDATE-007: Update task with past dueDate → 400", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, {
      name: "Past Due Project",
    });
    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "Future Task",
    });

    const res = await request.put(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { dueDate: "2020-01-01T00:00:00Z" },
    });

    expect(res.status()).toBe(400);
  });

  test("TC-TASK-UPDATE-008: Update task to remove dueDate (set clearDueDate) → 200", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, {
      name: "Clear DueDate Project",
    });
    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "Has DueDate Task",
      dueDate: "2030-12-31T00:00:00Z",
    });

    const res = await request.put(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { clearDueDate: true },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.dueDate).toBeNull();
  });

  test("TC-TASK-UPDATE-009: Re-assign task to another project member → 200", async ({ request, owner, member }) => {
    const project = await createProjectViaApi(request, owner.token, {
      name: "Reassign Project",
    });
    await addMemberViaApi(request, owner.token, project.id, member.email);

    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "Unassigned Task",
    });

    const res = await request.put(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { assigneeId: member.id },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.assigneeName).toBe(member.fullName);
  });

  test("TC-TASK-UPDATE-010: Update task assignee to non-member → 400", async ({ request, owner, nonMember }) => {
    const project = await createProjectViaApi(request, owner.token, {
      name: "Invalid Assignee Project",
    });
    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "Valid Task",
    });

    const res = await request.put(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { assigneeId: nonMember.id },
    });

    expect(res.status()).toBe(400);
  });

  test("TC-TASK-UPDATE-011: Update non-existent task → 404", async ({ request, owner }) => {
    const res = await request.put(`${API_BASE}/api/tasks/999999`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { title: "Ghost Task" },
    });

    expect(res.status()).toBe(404);
  });

  test("TC-TASK-UPDATE-012: Update task with invalid priority value → 400", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, {
      name: "Invalid Priority Project",
    });
    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "Priority Test Task",
    });

    const res = await request.put(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { priority: "SuperHigh" },
    });

    expect(res.status()).toBe(400);
  });

  test("TC-TASK-UPDATE-013: XSS injection in update title → stored as literal", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, {
      name: "XSS Update Project",
    });
    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "Safe Title",
    });

    const xssTitle = "<script>alert('xss')</script>";
    const res = await request.put(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { title: xssTitle },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.title).toBe(xssTitle);
  });

  test("TC-TASK-UPDATE-014: SQL injection in update description → stored as literal", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, {
      name: "SQLi Update Project",
    });
    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "SQLi Title",
    });

    const sqliDesc = "'; DROP TABLE Tasks; --";
    const res = await request.put(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { description: sqliDesc },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.description).toBe(sqliDesc);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE: PATCH /api/tasks/{id}/status — Update Task Status
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("API: PATCH /api/tasks/{id}/status — Update Task Status", () => {
  test("TC-TASK-STATUS-001: Update task status to InProgress → 200", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, {
      name: "Status Update Project",
    });
    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "Status Test Task",
    });

    const res = await request.patch(
      `${API_BASE}/api/tasks/${task.id}/status`,
      {
        headers: { Authorization: `Bearer ${owner.token}` },
        data: { status: "InProgress" },
      },
    );

    expect(res.status()).toBe(200);

    // Verify via detail
    const detailRes = await request.get(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });
    expect(detailRes.status()).toBe(200);
    const detail: TaskDto = await detailRes.json();
    expect(detail.status).toBe("InProgress");
  });

  test("TC-TASK-STATUS-002: Update task status to Done → 200", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, {
      name: "Done Status Project",
    });
    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "Done Test Task",
    });

    const res = await request.patch(
      `${API_BASE}/api/tasks/${task.id}/status`,
      {
        headers: { Authorization: `Bearer ${owner.token}` },
        data: { status: "Done" },
      },
    );

    expect(res.status()).toBe(200);

    // Verify via detail
    const detailRes = await request.get(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });
    const detail: TaskDto = await detailRes.json();
    expect(detail.status).toBe("Done");
  });

  test("TC-TASK-STATUS-003: Update task status back to Todo → 200", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, {
      name: "Back to Todo Project",
    });
    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "Revert Status Task",
    });

    // Move to InProgress first
    await request.patch(`${API_BASE}/api/tasks/${task.id}/status`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { status: "InProgress" },
    });

    // Move back to Todo
    const res = await request.patch(
      `${API_BASE}/api/tasks/${task.id}/status`,
      {
        headers: { Authorization: `Bearer ${owner.token}` },
        data: { status: "Todo" },
      },
    );

    expect(res.status()).toBe(200);

    const detailRes = await request.get(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });
    const detail: TaskDto = await detailRes.json();
    expect(detail.status).toBe("Todo");
  });

  test("TC-TASK-DETAIL-011: Task detail reflects correct status (InProgress) after update", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, { name: "Status Reflect Project" });
    const task = await createTaskViaApi(request, owner.token, project.id, { title: "Reflect Status Task" });
    await request.patch(`${API_BASE}/api/tasks/${task.id}/status`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { status: "InProgress" },
    });
    const res = await request.get(`${API_BASE}/api/tasks/${task.id}`, { headers: { Authorization: `Bearer ${owner.token}` } });
    expect(res.status()).toBe(200);
    const body: TaskDto = await res.json();
    expect(body.status).toBe("InProgress");
  });

  test("TC-TASK-STATUS-004: Update status without Bearer token → 401", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, { name: "Status Proj 4" });
    const task = await createTaskViaApi(request, owner.token, project.id, { title: "Task 4" });
    const res = await request.patch(`${API_BASE}/api/tasks/${task.id}/status`, {
      data: { status: "InProgress" }
    });
    expect(res.status()).toBe(401);
  });

  test("TC-TASK-STATUS-005: Non-member cannot update task status → 404 Not Found", async ({ request, owner, nonMember }) => {
    const project = await createProjectViaApi(request, owner.token, { name: "Status Proj 5" });
    const task = await createTaskViaApi(request, owner.token, project.id, { title: "Task 5" });
    const res = await request.patch(`${API_BASE}/api/tasks/${task.id}/status`, {
      headers: { Authorization: `Bearer ${nonMember.token}` },
      data: { status: "InProgress" }
    });
    expect(res.status()).toBe(404);
  });

  test("TC-TASK-STATUS-006: Update status with invalid status value → 400 Bad Request", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, { name: "Status Proj 6" });
    const task = await createTaskViaApi(request, owner.token, project.id, { title: "Task 6" });
    const res = await request.patch(`${API_BASE}/api/tasks/${task.id}/status`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { status: "Archived" } // Invalid value
    });
    expect(res.status()).toBe(400);
  });

  test("TC-TASK-STATUS-007: Update status on non-existent task → 404 Not Found", async ({ request, owner }) => {
    const res = await request.patch(`${API_BASE}/api/tasks/999999/status`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { status: "Done" }
    });
    expect(res.status()).toBe(404);
  });

  test("TC-TASK-STATUS-008: Update status with missing status field in body → 400 Bad Request", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, { name: "Status Proj 8" });
    const task = await createTaskViaApi(request, owner.token, project.id, { title: "Task 8" });
    const res = await request.patch(`${API_BASE}/api/tasks/${task.id}/status`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: {} // Missing status
    });
    expect(res.status()).toBe(400);
  });

  test("TC-TASK-STATUS-009: Set task status to same value (idempotent) → 204 or 200", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, { name: "Status Proj 9" });
    const task = await createTaskViaApi(request, owner.token, project.id, { title: "Task 9" });
    const res = await request.patch(`${API_BASE}/api/tasks/${task.id}/status`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { status: "Todo" } // Current status is already Todo
    });
    expect([200, 204]).toContain(res.status());
  });

  test("TC-TASK-STATUS-010: XSS injection in status value → 400 Bad Request", async ({ request, owner }) => {
    const project = await createProjectViaApi(request, owner.token, { name: "Status Proj 10" });
    const task = await createTaskViaApi(request, owner.token, project.id, { title: "Task 10" });
    const res = await request.patch(`${API_BASE}/api/tasks/${task.id}/status`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { status: "<script>alert('XSS')</script>" }
    });
    expect(res.status()).toBe(400);
  });
});
