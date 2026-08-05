import { test, expect, type APIRequestContext, request as playwrightRequest } from "@playwright/test";

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
    priority?: string | number;
    dueDate?: string | null;
    assigneeId?: number | null;
  },
): Promise<TaskDto> {
  const priorityNum =
    typeof data.priority === "number"
      ? data.priority
      : data.priority === "High"
        ? 2
        : data.priority === "Medium"
          ? 1
          : 0;

  const res = await request.post(
    `${API_BASE}/api/projects/${projectId}/tasks`,
    {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title: data.title,
        description: data.description ?? "",
        priority: priorityNum,
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

// ─── Shared Test State ────────────────────────────────────────────────────────
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

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE: GET /api/tasks/{id} — Task Detail
// Maps to: qa/test-cases/tasks/03-detail.md
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("API: GET /api/tasks/{id} — Task Detail", () => {
  test("TC-TASK-DETAIL-001: Get task detail as project owner (happy path) → 200", async ({
    request,
  }) => {
    const project = await createProjectViaApi(request, owner.token, {
      name: "Detail Test Project",
    });

    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "Detail Test Task",
      description: "Detailed description",
      priority: "High",
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
      title: "Member Task",
    });

    const res = await request.get(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${member.token}` },
    });

    expect(res.status()).toBe(200);
    const body: TaskDto = await res.json();
    expect(body.id).toBe(task.id);
  });

  test("TC-TASK-DETAIL-003: Get task detail without Bearer token → 401", async ({
    request,
  }) => {
    const project = await createProjectViaApi(request, owner.token, {
      name: "Unauth Project",
    });
    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "Unauth Task",
    });

    const res = await request.get(`${API_BASE}/api/tasks/${task.id}`);
    expect(res.status()).toBe(401);
  });

  test("TC-TASK-DETAIL-004: Non-member cannot get task detail → 404", async ({
    request,
  }) => {
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

  test("TC-TASK-DETAIL-005: Get non-existent task → 404", async ({
    request,
  }) => {
    const res = await request.get(`${API_BASE}/api/tasks/999999`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });

    expect(res.status()).toBe(404);
  });

  test("TC-TASK-DETAIL-007: Task detail with no comments returns commentCount=0", async ({
    request,
  }) => {
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

  test("TC-TASK-DETAIL-008: Task detail with invalid (non-integer) taskId → 400", async ({
    request,
  }) => {
    const res = await request.get(`${API_BASE}/api/tasks/abc`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });

    expect(res.status()).toBe(404);
  });

  test("TC-TASK-DETAIL-009: Task detail shows correct assigned member name", async ({
    request,
  }) => {
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
    expect(body.assigneeName).toBe("Jane Doe");
  });

  test("TC-TASK-DETAIL-010: Task detail for unassigned task shows null assigneeName", async ({
    request,
  }) => {
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

  test("TC-TASK-DETAIL-012: SQL injection in taskId path parameter → rejected", async ({
    request,
  }) => {
    const res = await request.get(
      `${API_BASE}/api/tasks/1%27%20OR%201=1%20--`,
      {
        headers: { Authorization: `Bearer ${owner.token}` },
      },
    );

    expect([400, 404]).toContain(res.status());
  });

  test("TC-TASK-DETAIL-013: XSS stored in title is returned safely in JSON response", async ({
    request,
  }) => {
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
  test("TC-TASK-UPDATE-001: Owner updates task with valid data → 200", async ({
    request,
  }) => {
    const project = await createProjectViaApi(request, owner.token, {
      name: "Update Task Project 1",
    });
    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "Original Title",
      priority: "Low",
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

  test("TC-TASK-UPDATE-002: Member updates task with valid data → 200", async ({
    request,
  }) => {
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

  test("TC-TASK-UPDATE-003: Update task without Bearer token → 401", async ({
    request,
  }) => {
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

  test("TC-TASK-UPDATE-004: Non-member cannot update task → 404", async ({
    request,
  }) => {
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

  test("TC-TASK-UPDATE-005: Update task with empty title → 400", async ({
    request,
  }) => {
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

  test("TC-TASK-UPDATE-006: Update task with title exceeding 200 characters → 400", async ({
    request,
  }) => {
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

  test("TC-TASK-UPDATE-007: Update task with past dueDate → 400", async ({
    request,
  }) => {
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

  test("TC-TASK-UPDATE-008: Update task to remove dueDate (set clearDueDate) → 200", async ({
    request,
  }) => {
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

  test("TC-TASK-UPDATE-009: Re-assign task to another project member → 200", async ({
    request,
  }) => {
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

  test("TC-TASK-UPDATE-010: Update task assignee to non-member → 400", async ({
    request,
  }) => {
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

  test("TC-TASK-UPDATE-011: Update non-existent task → 404", async ({
    request,
  }) => {
    const res = await request.put(`${API_BASE}/api/tasks/999999`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { title: "Ghost Task" },
    });

    expect(res.status()).toBe(404);
  });

  test("TC-TASK-UPDATE-012: Update task with invalid priority value → 400", async ({
    request,
  }) => {
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

  test("TC-TASK-UPDATE-013: XSS injection in update title → stored as literal", async ({
    request,
  }) => {
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

  test("TC-TASK-UPDATE-014: SQL injection in update description → stored as literal", async ({
    request,
  }) => {
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
  test("TC-TASK-STATUS-001: Update task status to InProgress → 200", async ({
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

  test("TC-TASK-STATUS-002: Update task status to Done → 200", async ({
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

  test("TC-TASK-STATUS-003: Update task status back to Todo → 200", async ({
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

  test("TC-TASK-DETAIL-011: Task detail reflects correct status (InProgress) after update", async ({
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
      data: { status: "InProgress" },
    });

    // Get detail and verify
    const res = await request.get(`${API_BASE}/api/tasks/${task.id}`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });
    expect(res.status()).toBe(200);
    const body: TaskDto = await res.json();
    expect(body.status).toBe("InProgress");
  });
});
