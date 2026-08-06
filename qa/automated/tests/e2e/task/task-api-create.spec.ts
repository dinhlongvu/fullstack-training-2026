import { test, expect, type APIRequestContext, request as playwrightRequest } from "@playwright/test";
import { API_BASE, uniqueEmail, registerAndLogin, createProjectViaApi, createTaskViaApi, addMemberViaApi, futureDateISO, type RegisteredUser, type TaskDto } from "../utils/api-helpers";

// Priority and Status enum values (local to task tests)
const PRIORITY = { Low: "Low", Medium: "Medium", High: "High" } as const;
const TASK_STATUS = { Todo: "Todo", InProgress: "InProgress", Done: "Done" } as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE: POST /api/projects/{projectId}/tasks — Create Task
// Maps to: qa/test-cases/tasks/02-create.md
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("API: POST /api/projects/{projectId}/tasks — Create Task", () => {
  let apiContext: APIRequestContext;
  let owner: RegisteredUser;
  let member: RegisteredUser;
  let nonMember: RegisteredUser;

  test.beforeAll(async () => {
    apiContext = await playwrightRequest.newContext();
    owner = await registerAndLogin(apiContext, { fullName: "Shared Owner" });
    member = await registerAndLogin(apiContext, { fullName: "Shared Member" });
    nonMember = await registerAndLogin(apiContext, { fullName: "Shared NonMember" });
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });
  test("TC-TASK-CREATE-001: Create task with all valid fields (happy path) → 201", async ({
    request,
  }) => {


    const project = await createProjectViaApi(request, owner.token, {
      name: "Full Task Project",
    });
    await addMemberViaApi(request, owner.token, project.id, member.email);

    const dueDate = futureDateISO();
    const res = await request.post(
      `${API_BASE}/api/projects/${project.id}/tasks`,
      {
        headers: { Authorization: `Bearer ${owner.token}` },
        data: {
          title: "Fix login bug",
          description: "Session token expires too early",
          priority: PRIORITY.High,
          dueDate,
          assigneeId: member.id,
        },
      },
    );

    expect(res.status()).toBe(201);
    const body: TaskDto = await res.json();

    expect(body).toHaveProperty("id");
    expect(body.title).toBe("Fix login bug");
    expect(body.description).toBe("Session token expires too early");
    expect(body.status).toBe("Todo");
    expect(body.priority).toBe("High");
    expect(body.dueDate).not.toBeNull();
    expect(body.assigneeName).toBe(member.fullName);
    expect(body).toHaveProperty("commentCount");
    expect(body).toHaveProperty("createdAt");
    expect(typeof body.id).toBe("number");
  });

  test("TC-TASK-CREATE-002: Create task with minimum required fields only → 201", async ({
    request,
  }) => {

    const project = await createProjectViaApi(request, owner.token, {
      name: "Minimal Task Project",
    });

    const res = await request.post(
      `${API_BASE}/api/projects/${project.id}/tasks`,
      {
        headers: { Authorization: `Bearer ${owner.token}` },
        data: {
          title: "Minimal Task",
          description: "",
          priority: PRIORITY.Low,
        },
      },
    );

    expect(res.status()).toBe(201);
    const body: TaskDto = await res.json();
    expect(body.title).toBe("Minimal Task");
    expect(body.dueDate).toBeNull();
    expect(body.assigneeName).toBeNull();
  });

  test("TC-TASK-CREATE-003: Create task without Bearer token → 401", async ({
    request,
  }) => {

    const project = await createProjectViaApi(request, owner.token, {
      name: "No Auth Task Create",
    });

    const res = await request.post(
      `${API_BASE}/api/projects/${project.id}/tasks`,
      {
        data: {
          title: "Unauthorized Task",
          description: "",
          priority: PRIORITY.Low,
        },
      },
    );

    expect(res.status()).toBe(401);
  });

  test("TC-TASK-CREATE-004: Non-member cannot create task → 404", async ({
    request,
  }) => {
    const project = await createProjectViaApi(request, owner.token, {
      name: "Non-Member Task Create",
    });

    const res = await request.post(
      `${API_BASE}/api/projects/${project.id}/tasks`,
      {
        headers: { Authorization: `Bearer ${nonMember.token}` },
        data: {
          title: "Hacked Task",
          description: "",
          priority: PRIORITY.Low,
        },
      },
    );

    expect(res.status()).toBe(404);
  });

  test("TC-TASK-CREATE-005: Create task with missing title → 400", async ({
    request,
  }) => {

    const project = await createProjectViaApi(request, owner.token, {
      name: "Empty Title Project",
    });

    const res = await request.post(
      `${API_BASE}/api/projects/${project.id}/tasks`,
      {
        headers: { Authorization: `Bearer ${owner.token}` },
        data: {
          title: "",
          description: "Some description",
          priority: PRIORITY.Medium,
        },
      },
    );

    expect(res.status()).toBe(400);
  });

  test("TC-TASK-CREATE-006: Create task with title exceeding 200 characters → 400", async ({
    request,
  }) => {

    const project = await createProjectViaApi(request, owner.token, {
      name: "Long Title Project",
    });

    const longTitle = "T".repeat(201);
    const res = await request.post(
      `${API_BASE}/api/projects/${project.id}/tasks`,
      {
        headers: { Authorization: `Bearer ${owner.token}` },
        data: {
          title: longTitle,
          description: "",
          priority: PRIORITY.Low,
        },
      },
    );

    expect(res.status()).toBe(400);
  });

  test("TC-TASK-CREATE-007: Create task with title exactly 200 characters → 201", async ({
    request,
  }) => {

    const project = await createProjectViaApi(request, owner.token, {
      name: "Boundary Title Project",
    });

    const exactTitle = "B".repeat(200);
    const res = await request.post(
      `${API_BASE}/api/projects/${project.id}/tasks`,
      {
        headers: { Authorization: `Bearer ${owner.token}` },
        data: {
          title: exactTitle,
          description: "",
          priority: PRIORITY.Low,
        },
      },
    );

    expect(res.status()).toBe(201);
    const body: TaskDto = await res.json();
    expect(body.title).toBe(exactTitle);
    expect(body.title.length).toBe(200);
  });

  test("TC-TASK-CREATE-008: Create task with description exceeding 2000 characters → 400", async ({
    request,
  }) => {

    const project = await createProjectViaApi(request, owner.token, {
      name: "Long Desc Project",
    });

    const longDesc = "D".repeat(2001);
    const res = await request.post(
      `${API_BASE}/api/projects/${project.id}/tasks`,
      {
        headers: { Authorization: `Bearer ${owner.token}` },
        data: {
          title: "Valid Title",
          description: longDesc,
          priority: PRIORITY.Low,
        },
      },
    );

    expect(res.status()).toBe(400);
  });

  test("TC-TASK-CREATE-009: Create task with invalid priority value → 400", async ({
    request,
  }) => {

    const project = await createProjectViaApi(request, owner.token, {
      name: "Invalid Priority Project",
    });

    const res = await request.post(
      `${API_BASE}/api/projects/${project.id}/tasks`,
      {
        headers: { Authorization: `Bearer ${owner.token}` },
        data: {
          title: "Valid Title",
          description: "",
          priority: "Critical",  // Invalid — not a valid enum value
        },
      },
    );

    expect(res.status()).toBe(400);
  });

  test("TC-TASK-CREATE-010: Create task with past dueDate → 400", async ({
    request,
  }) => {

    const project = await createProjectViaApi(request, owner.token, {
      name: "Past DueDate Project",
    });

    const res = await request.post(
      `${API_BASE}/api/projects/${project.id}/tasks`,
      {
        headers: { Authorization: `Bearer ${owner.token}` },
        data: {
          title: "Past Due Task",
          description: "",
          priority: PRIORITY.Low,
          dueDate: "2020-01-01T00:00:00Z",
        },
      },
    );

    expect(res.status()).toBe(400);
  });

  test("TC-TASK-CREATE-011: Create task with future dueDate → 201", async ({
    request,
  }) => {

    const project = await createProjectViaApi(request, owner.token, {
      name: "Future DueDate Project",
    });

    const dueDate = futureDateISO(30);
    const res = await request.post(
      `${API_BASE}/api/projects/${project.id}/tasks`,
      {
        headers: { Authorization: `Bearer ${owner.token}` },
        data: {
          title: "Future Due Task",
          description: "",
          priority: PRIORITY.Medium,
          dueDate,
        },
      },
    );

    expect(res.status()).toBe(201);
    const body: TaskDto = await res.json();
    expect(body.dueDate).not.toBeNull();
  });

  test("TC-TASK-CREATE-018: Create task with today's dueDate → 201", async ({
    request,
  }) => {
    const project = await createProjectViaApi(request, owner.token, {
      name: "Today DueDate Project",
    });

    const dueDate = new Date().toISOString();
    const res = await request.post(
      `${API_BASE}/api/projects/${project.id}/tasks`,
      {
        headers: { Authorization: `Bearer ${owner.token}` },
        data: {
          title: "Today Due Task",
          description: "",
          priority: PRIORITY.Medium,
          dueDate,
        },
      },
    );

    expect(res.status()).toBe(201);
    const body: TaskDto = await res.json();
    expect(body.dueDate).not.toBeNull();
  });

  test("TC-TASK-CREATE-012: Assign task to non-member → 400", async ({
    request,
  }) => {



    const project = await createProjectViaApi(request, owner.token, {
      name: "Non-Member Assign",
    });

    // nonMember is NOT added to project
    const res = await request.post(
      `${API_BASE}/api/projects/${project.id}/tasks`,
      {
        headers: { Authorization: `Bearer ${owner.token}` },
        data: {
          title: "Invalid Assign Task",
          description: "",
          priority: PRIORITY.Low,
          assigneeId: nonMember.id,
        },
      },
    );

    expect(res.status()).toBe(400);
  });

  test("TC-TASK-CREATE-013: Assign task to project owner (owner is valid assignee) → 201", async ({
    request,
  }) => {

    const project = await createProjectViaApi(request, owner.token, {
      name: "Owner Assign Project",
    });

    const res = await request.post(
      `${API_BASE}/api/projects/${project.id}/tasks`,
      {
        headers: { Authorization: `Bearer ${owner.token}` },
        data: {
          title: "Assign to Owner",
          description: "",
          priority: PRIORITY.High,
          assigneeId: owner.id,
        },
      },
    );

    expect(res.status()).toBe(201);
    const body: TaskDto = await res.json();
    expect(body.assigneeName).toBe(owner.fullName);
  });

  test("TC-TASK-CREATE-014: Create task for non-existent project → 404", async ({
    request,
  }) => {


    const res = await request.post(
      `${API_BASE}/api/projects/999999/tasks`,
      {
        headers: { Authorization: `Bearer ${owner.token}` },
        data: {
          title: "Ghost Task",
          description: "",
          priority: PRIORITY.Low,
        },
      },
    );

    expect(res.status()).toBe(404);
  });

  test("TC-TASK-CREATE-015: Default status is Todo on creation", async ({
    request,
  }) => {

    const project = await createProjectViaApi(request, owner.token, {
      name: "Default Status Project",
    });

    const res = await request.post(
      `${API_BASE}/api/projects/${project.id}/tasks`,
      {
        headers: { Authorization: `Bearer ${owner.token}` },
        data: {
          title: "Status Check Task",
          description: "",
          priority: PRIORITY.Low,
        },
      },
    );

    expect(res.status()).toBe(201);
    const body: TaskDto = await res.json();
    expect(body.status).toBe("Todo");
  });

  test("TC-TASK-CREATE-016: XSS injection in task title → 201 (stored as raw string)", async ({
    request,
  }) => {

    const project = await createProjectViaApi(request, owner.token, {
      name: "XSS Title Project",
    });

    const xssPayload = "<script>alert('XSS')</script>";
    const res = await request.post(
      `${API_BASE}/api/projects/${project.id}/tasks`,
      {
        headers: { Authorization: `Bearer ${owner.token}` },
        data: {
          title: xssPayload,
          description: "",
          priority: PRIORITY.Low,
        },
      },
    );

    expect(res.status()).toBe(201);
    const body: TaskDto = await res.json();
    // Title is stored as raw string, returned in JSON — not executed
    expect(body.title).toBe(xssPayload);

    // Verify Content-Type is JSON
    const contentType = res.headers()["content-type"] ?? "";
    expect(contentType).toContain("application/json");
  });

  test("TC-TASK-CREATE-017: SQL injection in task description → 201 (stored as literal)", async ({
    request,
  }) => {

    const project = await createProjectViaApi(request, owner.token, {
      name: "SQLi Desc Project",
    });

    const sqliPayload = "'; DROP TABLE Tasks; --";
    const res = await request.post(
      `${API_BASE}/api/projects/${project.id}/tasks`,
      {
        headers: { Authorization: `Bearer ${owner.token}` },
        data: {
          title: "SQL Test",
          description: sqliPayload,
          priority: PRIORITY.Low,
        },
      },
    );

    expect(res.status()).toBe(201);
    const body: TaskDto = await res.json();
    expect(body.description).toBe(sqliPayload);

    // Verify tasks endpoint still works (table not dropped)
    const listRes = await request.get(
      `${API_BASE}/api/projects/${project.id}/tasks`,
      { headers: { Authorization: `Bearer ${owner.token}` } },
    );
    expect(listRes.status()).toBe(200);
  });
});
