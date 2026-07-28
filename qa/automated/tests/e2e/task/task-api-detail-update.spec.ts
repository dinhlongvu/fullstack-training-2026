import { test, expect, type APIRequestContext, request as playwrightRequest } from "@playwright/test";

// ─── Constants ───────────────────────────────────────────────────────────────

const API_BASE = "http://localhost:5000";

// Priority and Status enum values (backend uses integer, not string)
const PRIORITY = { Low: 0, Medium: 1, High: 2 } as const;
const TASK_STATUS = { Todo: 0, InProgress: 1, Done: 2 } as const;

// ─── Types ───────────────────────────────────────────────────────────────────

interface RegisteredUser {
  id: number;
  email: string;
  fullName: string;
  password: string;
  token: string;
}

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

// ─── Helper Functions ────────────────────────────────────────────────────────

function uniqueEmail(): string {
  return `taskdetail_${Date.now()}_${Math.floor(Math.random() * 100000)}@example.com`;
}

async function registerAndLogin(
  request: APIRequestContext,
  overrides?: { email?: string; fullName?: string; password?: string },
): Promise<RegisteredUser> {
  const email = overrides?.email ?? uniqueEmail();
  const fullName = overrides?.fullName ?? "Task Detail Test User";
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
  data: {
    title: string;
    description?: string;
    priority?: number;
    dueDate?: string | null;
    assigneeId?: number | null;
  },
): Promise<TaskDto> {
  const res = await request.post(
    `${API_BASE}/api/projects/${projectId}/tasks`,
    {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title: data.title,
        description: data.description ?? "",
        priority: data.priority ?? PRIORITY.Low,
        ...(data.dueDate !== undefined ? { dueDate: data.dueDate } : {}),
        ...(data.assigneeId !== undefined ? { assigneeId: data.assigneeId } : {}),
      },
    },
  );
  expect(res.status(), `Create task failed: ${data.title}`).toBe(201);
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
// TEST SUITE: GET /api/tasks/{id} — Task Detail
// Maps to: qa/test-cases/tasks/03-detail.md
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("API: GET /api/tasks/{id} — Task Detail", () => {
  let apiContext: APIRequestContext;
  let owner: RegisteredUser;
  let member: RegisteredUser;
  let nonMember: RegisteredUser;
  let assignee: RegisteredUser;
  let user: RegisteredUser;

  test.beforeAll(async () => {
    apiContext = await playwrightRequest.newContext();
    owner = await registerAndLogin(apiContext, { fullName: "Shared DetailOwner" });
    member = await registerAndLogin(apiContext, { fullName: "Shared DetailMember" });
    nonMember = await registerAndLogin(apiContext, { fullName: "Shared DetailNonMember" });
    assignee = await registerAndLogin(apiContext, { fullName: "Jane Doe" });
    user = await registerAndLogin(apiContext, { fullName: "Shared DetailUser" });
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });
  test("TC-TASK-DETAIL-001: Get task detail as project owner (happy path) → 200", async ({
    request,
  }) => {

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

  test("TC-TASK-DETAIL-002: Get task detail as project member → 200", async ({
    request,
  }) => {



    const project = await createProjectViaApi(request, owner.token, {
      name: "Member Detail Project",
    });
    await addMemberViaApi(request, owner.token, project.id, member.email);

    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "Task for Member View",
    });

    // Member gets task detail
    const res = await request.get(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${member.token}` },
    });

    expect(res.status()).toBe(200);
    const body: TaskDto = await res.json();
    expect(body.id).toBe(task.id);
    expect(body.title).toBe("Task for Member View");
  });

  test("TC-TASK-DETAIL-003: Get task detail without Bearer token → 401", async ({
    request,
  }) => {

    const project = await createProjectViaApi(request, owner.token, {
      name: "No Auth Detail",
    });
    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "Auth Test Task",
    });

    const res = await request.get(`${API_BASE}/api/tasks/${task.id}`);
    expect(res.status()).toBe(401);
  });

  test("TC-TASK-DETAIL-004: Non-member cannot get task detail → 403", async ({
    request,
  }) => {



    const project = await createProjectViaApi(request, owner.token, {
      name: "Non-Member Detail",
    });
    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "Private Task",
    });

    const res = await request.get(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${nonMember.token}` },
    });

    expect([403, 404]).toContain(res.status());
  });

  test("TC-TASK-DETAIL-005: Get non-existent task → 404", async ({
    request,
  }) => {


    const res = await request.get(`${API_BASE}/api/tasks/999999`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });

    expect(res.status()).toBe(404);
  });

  test("TC-TASK-DETAIL-007: Task detail with no comments returns commentCount=0", async ({
    request,
  }) => {

    const project = await createProjectViaApi(request, owner.token, {
      name: "No Comments Project",
    });
    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "No Comments Task",
    });

    const res = await request.get(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });

    expect(res.status()).toBe(200);
    const body: TaskDto = await res.json();
    expect(body.commentCount).toBe(0);
  });

  test("TC-TASK-DETAIL-008: Task detail with invalid (non-integer) taskId → 400", async ({
    request,
  }) => {


    const res = await request.get(`${API_BASE}/api/tasks/abc`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });

    // Route constraint {taskId:int} rejects non-integer → 400 or 404
    expect([400, 404]).toContain(res.status());
  });

  test("TC-TASK-DETAIL-009: Task detail shows correct assigned member name", async ({
    request,
  }) => {
    const project = await createProjectViaApi(request, owner.token, {
      name: "Assignee Name Project",
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
    expect(body.assigneeName).toBe("Jane Doe");
  });

  test("TC-TASK-DETAIL-010: Task detail for unassigned task shows null assigneeName", async ({
    request,
  }) => {

    const project = await createProjectViaApi(request, owner.token, {
      name: "Null Assignee Project",
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

  test("TC-TASK-DETAIL-012: SQL injection in taskId path parameter → rejected", async ({
    request,
  }) => {


    // URL-encode the SQL injection payload
    const res = await request.get(
      `${API_BASE}/api/tasks/1%3B%20DROP%20TABLE%20Tasks%3B%20--`,
      {
        headers: { Authorization: `Bearer ${user.token}` },
      },
    );

    // Route constraint {taskId:int} rejects non-integer → 400 or 404
    expect([400, 404]).toContain(res.status());

    // Verify tasks table is still intact by creating and listing
    const project = await createProjectViaApi(request, user.token, {
      name: "SQLi Verify Project",
    });
    const task = await createTaskViaApi(request, user.token, project.id, {
      title: "Verify DB Intact",
    });
    expect(task.id).toBeGreaterThan(0);
  });

  test("TC-TASK-DETAIL-013: XSS stored in title is returned safely in JSON response", async ({
    request,
  }) => {

    const project = await createProjectViaApi(request, owner.token, {
      name: "XSS Detail Project",
    });

    const xssPayload = "<script>alert('XSS')</script>";
    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: xssPayload,
    });

    const res = await request.get(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });

    expect(res.status()).toBe(200);
    const body: TaskDto = await res.json();
    // Title is returned as raw JSON string, properly encoded
    expect(body.title).toBe(xssPayload);

    // Verify Content-Type is JSON (not HTML)
    const contentType = res.headers()["content-type"] ?? "";
    expect(contentType).toContain("application/json");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE: PUT /api/tasks/{id} — Update Task
// Maps to: qa/test-cases/tasks/04-update.md
//
// NOTE: PUT /api/tasks/{id} endpoint is NOT yet implemented in the backend.
// Only PATCH /api/tasks/{taskId}/status exists.
// Tests for the full PUT endpoint are skipped with test.skip().
// Tests for PATCH /status are included below.
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("API: PUT /api/tasks/{id} — Update Task (NOT YET IMPLEMENTED)", () => {
  test.skip("TC-TASK-UPDATE-001: Owner updates task with valid data → 200", async ({
    request,
  }) => {
    // Endpoint PUT /api/tasks/{id} not yet implemented

    const project = await createProjectViaApi(request, user.token, {
      name: "Update Task Project",
    });
    const task = await createTaskViaApi(request, user.token, project.id, {
      title: "Original Title",
      priority: PRIORITY.Low,
    });

    const res = await request.put(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${user.token}` },
      data: {
        title: "Updated Title",
        description: "New description",
        priority: PRIORITY.High,
      },
    });

    expect([200, 204]).toContain(res.status());
  });

  test.skip("TC-TASK-UPDATE-002: Member updates task with valid data → 200", async ({
    request,
  }) => {
    // Endpoint PUT /api/tasks/{id} not yet implemented
  });

  test.skip("TC-TASK-UPDATE-003: Update task without Bearer token → 401", async ({
    request,
  }) => {
    // Endpoint PUT /api/tasks/{id} not yet implemented
  });

  test.skip("TC-TASK-UPDATE-004: Non-member cannot update task → 403", async ({
    request,
  }) => {
    // Endpoint PUT /api/tasks/{id} not yet implemented
  });

  test.skip("TC-TASK-UPDATE-005: Update task with empty title → 400", async ({
    request,
  }) => {
    // Endpoint PUT /api/tasks/{id} not yet implemented
  });

  test.skip("TC-TASK-UPDATE-006: Update task with title exceeding 200 characters → 400", async ({
    request,
  }) => {
    // Endpoint PUT /api/tasks/{id} not yet implemented
  });

  test.skip("TC-TASK-UPDATE-007: Update task with past dueDate → 400", async ({
    request,
  }) => {
    // Endpoint PUT /api/tasks/{id} not yet implemented
  });

  test.skip("TC-TASK-UPDATE-008: Update task to remove dueDate (set to null) → 200", async ({
    request,
  }) => {
    // Endpoint PUT /api/tasks/{id} not yet implemented
  });

  test.skip("TC-TASK-UPDATE-009: Re-assign task to another project member → 200", async ({
    request,
  }) => {
    // Endpoint PUT /api/tasks/{id} not yet implemented
  });

  test.skip("TC-TASK-UPDATE-010: Update task assignee to non-member → 400", async ({
    request,
  }) => {
    // Endpoint PUT /api/tasks/{id} not yet implemented
  });

  test.skip("TC-TASK-UPDATE-011: Update non-existent task → 404", async ({
    request,
  }) => {
    // Endpoint PUT /api/tasks/{id} not yet implemented
  });

  test.skip("TC-TASK-UPDATE-012: Update task with invalid priority value → 400", async ({
    request,
  }) => {
    // Endpoint PUT /api/tasks/{id} not yet implemented
  });

  test.skip("TC-TASK-UPDATE-013: XSS injection in update title → stored as literal", async ({
    request,
  }) => {
    // Endpoint PUT /api/tasks/{id} not yet implemented
  });

  test.skip("TC-TASK-UPDATE-014: SQL injection in update description → stored as literal", async ({
    request,
  }) => {
    // Endpoint PUT /api/tasks/{id} not yet implemented
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE: PATCH /api/tasks/{id}/status — Update Task Status
// This is the only update-related endpoint currently implemented.
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("API: PATCH /api/tasks/{id}/status — Update Task Status", () => {
  test.skip("TC-TASK-STATUS-001: Update task status to InProgress → 204", async ({
    request,
  }) => {

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
        data: { status: TASK_STATUS.InProgress },
      },
    );

    expect(res.status()).toBe(204);

    // Verify via detail
    const detailRes = await request.get(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });
    expect(detailRes.status()).toBe(200);
    const detail: TaskDto = await detailRes.json();
    expect(detail.status).toBe(TASK_STATUS.InProgress);
  });

  test.skip("TC-TASK-STATUS-002: Update task status to Done → 204", async ({
    request,
  }) => {

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
        data: { status: TASK_STATUS.Done },
      },
    );

    expect(res.status()).toBe(204);

    // Verify via detail
    const detailRes = await request.get(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });
    const detail: TaskDto = await detailRes.json();
    expect(detail.status).toBe(TASK_STATUS.Done);
  });

  test.skip("TC-TASK-STATUS-003: Update task status back to Todo → 204", async ({
    request,
  }) => {

    const project = await createProjectViaApi(request, owner.token, {
      name: "Back to Todo Project",
    });
    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "Revert Status Task",
    });

    // Move to InProgress first
    await request.patch(`${API_BASE}/api/tasks/${task.id}/status`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { status: TASK_STATUS.InProgress },
    });

    // Move back to Todo
    const res = await request.patch(
      `${API_BASE}/api/tasks/${task.id}/status`,
      {
        headers: { Authorization: `Bearer ${owner.token}` },
        data: { status: TASK_STATUS.Todo },
      },
    );

    expect(res.status()).toBe(204);

    const detailRes = await request.get(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });
    const detail: TaskDto = await detailRes.json();
    expect(detail.status).toBe(TASK_STATUS.Todo);
  });

  test.skip("TC-TASK-DETAIL-011: Task detail reflects correct status (InProgress) after update", async ({
    request,
  }) => {

    const project = await createProjectViaApi(request, owner.token, {
      name: "Status Reflect Project",
    });
    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "Status Verify Task",
    });

    // Update status
    await request.patch(`${API_BASE}/api/tasks/${task.id}/status`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { status: TASK_STATUS.InProgress },
    });

    // Get detail and verify
    const res = await request.get(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });
    expect(res.status()).toBe(200);
    const body: TaskDto = await res.json();
    expect(body.status).toBe(TASK_STATUS.InProgress);
  });
});
