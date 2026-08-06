import { test, expect, type APIRequestContext, request as playwrightRequest } from "@playwright/test";
import { API_BASE, uniqueEmail, registerAndLogin, createProjectViaApi, createTaskViaApi, addMemberViaApi, type RegisteredUser, type TaskDto } from "../utils/api-helpers";

// Priority and Status enum values (local to task tests)
const PRIORITY = { Low: "Low", Medium: "Medium", High: "High" } as const;
const TASK_STATUS = { Todo: "Todo", InProgress: "InProgress", Done: "Done" } as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE: GET /api/projects/{projectId}/tasks — List Tasks
// Maps to: qa/test-cases/tasks/01-list.md
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("API: GET /api/projects/{projectId}/tasks — List Tasks", () => {
  let apiContext: APIRequestContext;
  let user: RegisteredUser;
  let owner: RegisteredUser;
  let member: RegisteredUser;
  let nonMember: RegisteredUser;

  test.beforeAll(async () => {
    apiContext = await playwrightRequest.newContext();
    user = await registerAndLogin(apiContext, { fullName: "Shared ListUser" });
    owner = await registerAndLogin(apiContext, { fullName: "Shared ListOwner" });
    member = await registerAndLogin(apiContext, { fullName: "Shared ListMember" });
    nonMember = await registerAndLogin(apiContext, { fullName: "Shared ListNonMember" });
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });
  test("TC-TASK-LIST-001: List tasks as project owner (happy path) → 200 + correct shape", async ({
    request,
  }) => {

    const project = await createProjectViaApi(request, user.token, {
      name: "Task List Test",
    });

    // Create a task
    await createTaskViaApi(request, user.token, project.id, {
      title: "Test Task",
      description: "Description",
      priority: PRIORITY.High,
    });

    // List tasks
    const res = await request.get(
      `${API_BASE}/api/projects/${project.id}/tasks`,
      { headers: { Authorization: `Bearer ${user.token}` } },
    );

    expect(res.status()).toBe(200);
    const tasks: TaskDto[] = await res.json();
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBeGreaterThanOrEqual(1);

    // Verify shape
    const task = tasks[0];
    expect(task).toHaveProperty("id");
    expect(task).toHaveProperty("title");
    expect(task).toHaveProperty("description");
    expect(task).toHaveProperty("status");
    expect(task).toHaveProperty("priority");
    expect(task).toHaveProperty("dueDate");
    expect(task).toHaveProperty("assigneeName");
    expect(task).toHaveProperty("commentCount");
    expect(task).toHaveProperty("createdAt");
  });

  test("TC-TASK-LIST-002: List tasks as project member (non-owner) → 200", async ({
    request,
  }) => {



    const project = await createProjectViaApi(request, owner.token, {
      name: "Member Task List",
    });

    await addMemberViaApi(request, owner.token, project.id, member.email);

    await createTaskViaApi(request, owner.token, project.id, {
      title: "Task For Member",
    });

    // Member lists tasks
    const res = await request.get(
      `${API_BASE}/api/projects/${project.id}/tasks`,
      { headers: { Authorization: `Bearer ${member.token}` } },
    );

    expect(res.status()).toBe(200);
    const tasks: TaskDto[] = await res.json();
    expect(tasks.length).toBeGreaterThanOrEqual(1);
  });

  test("TC-TASK-LIST-003: List tasks without Bearer token → 401", async ({
    request,
  }) => {

    const project = await createProjectViaApi(request, user.token, {
      name: "No Auth Task List",
    });

    const res = await request.get(
      `${API_BASE}/api/projects/${project.id}/tasks`,
    );

    expect(res.status()).toBe(401);
  });

  test("TC-TASK-LIST-004: Non-member cannot list tasks → 404", async ({
    request,
  }) => {
    const project = await createProjectViaApi(request, owner.token, {
      name: "Non-Member Task List",
    });

    const res = await request.get(
      `${API_BASE}/api/projects/${project.id}/tasks`,
      { headers: { Authorization: `Bearer ${nonMember.token}` } },
    );

    expect(res.status()).toBe(404);
  });

  test("TC-TASK-LIST-005: List tasks for non-existent project → 404", async ({
    request,
  }) => {


    const res = await request.get(
      `${API_BASE}/api/projects/999999/tasks`,
      { headers: { Authorization: `Bearer ${user.token}` } },
    );

    expect(res.status()).toBe(404);
  });

  test("TC-TASK-LIST-006: Filter tasks by status=Todo → only Todo tasks", async ({
    request,
  }) => {

    const project = await createProjectViaApi(request, user.token, {
      name: "Filter Status Test",
    });

    // Create tasks (all start as Todo)
    await createTaskViaApi(request, user.token, project.id, {
      title: "Todo Task 1",
    });
    await createTaskViaApi(request, user.token, project.id, {
      title: "Todo Task 2",
    });

    // Filter by status=Todo
    const res = await request.get(
      `${API_BASE}/api/projects/${project.id}/tasks?status=Todo`,
      { headers: { Authorization: `Bearer ${user.token}` } },
    );

    expect(res.status()).toBe(200);
    const tasks: TaskDto[] = await res.json();
    expect(tasks.length).toBeGreaterThanOrEqual(2);
    for (const task of tasks) {
      expect(task.status).toBe("Todo");
    }
  });

  test("TC-TASK-LIST-007: Filter tasks by priority=High → only High tasks", async ({
    request,
  }) => {

    const project = await createProjectViaApi(request, user.token, {
      name: "Filter Priority Test",
    });

    await createTaskViaApi(request, user.token, project.id, {
      title: "High Task",
      priority: PRIORITY.High,
    });
    await createTaskViaApi(request, user.token, project.id, {
      title: "Low Task",
      priority: PRIORITY.Low,
    });

    const res = await request.get(
      `${API_BASE}/api/projects/${project.id}/tasks?priority=High`,
      { headers: { Authorization: `Bearer ${user.token}` } },
    );

    expect(res.status()).toBe(200);
    const tasks: TaskDto[] = await res.json();
    expect(tasks.length).toBeGreaterThanOrEqual(1);
    for (const task of tasks) {
      expect(task.priority).toBe("High");
    }
  });

  test("TC-TASK-LIST-008: Filter tasks by assigneeId → only assigned tasks", async ({
    request,
  }) => {



    const project = await createProjectViaApi(request, owner.token, {
      name: "Filter Assignee Test",
    });

    await addMemberViaApi(request, owner.token, project.id, member.email);

    // Create task assigned to member
    await createTaskViaApi(request, owner.token, project.id, {
      title: "Assigned Task",
      assigneeId: member.id,
    });
    // Create unassigned task
    await createTaskViaApi(request, owner.token, project.id, {
      title: "Unassigned Task",
    });

    const res = await request.get(
      `${API_BASE}/api/projects/${project.id}/tasks?assigneeId=${member.id}`,
      { headers: { Authorization: `Bearer ${owner.token}` } },
    );

    expect(res.status()).toBe(200);
    const tasks: TaskDto[] = await res.json();
    expect(tasks.length).toBe(1);
    expect(tasks[0].assigneeName).toBe(member.fullName);
  });

  test("TC-TASK-LIST-009: Filter tasks by combined status + priority", async ({
    request,
  }) => {

    const project = await createProjectViaApi(request, user.token, {
      name: "Combined Filter Test",
    });

    await createTaskViaApi(request, user.token, project.id, {
      title: "High Todo",
      priority: PRIORITY.High,
    });
    await createTaskViaApi(request, user.token, project.id, {
      title: "Low Todo",
      priority: PRIORITY.Low,
    });

    // All tasks are Todo by default; filter for status=Todo&priority=High
    const res = await request.get(
      `${API_BASE}/api/projects/${project.id}/tasks?status=Todo&priority=High`,
      { headers: { Authorization: `Bearer ${user.token}` } },
    );

    expect(res.status()).toBe(200);
    const tasks: TaskDto[] = await res.json();
    expect(tasks.length).toBe(1);
    expect(tasks[0].title).toBe("High Todo");
    expect(tasks[0].status).toBe("Todo");
    expect(tasks[0].priority).toBe("High");
  });

  test("TC-TASK-LIST-010: Filter with status=Done returns empty list when no done tasks", async ({
    request,
  }) => {

    const project = await createProjectViaApi(request, user.token, {
      name: "Empty Done Filter",
    });

    // Create task (status defaults to Todo)
    await createTaskViaApi(request, user.token, project.id, {
      title: "Not Done",
    });

    const res = await request.get(
      `${API_BASE}/api/projects/${project.id}/tasks?status=Done`,
      { headers: { Authorization: `Bearer ${user.token}` } },
    );

    expect(res.status()).toBe(200);
    const tasks: TaskDto[] = await res.json();
    expect(tasks).toHaveLength(0);
  });

  test("TC-TASK-LIST-011: Filter with invalid status value → 400", async ({
    request,
  }) => {

    const project = await createProjectViaApi(request, user.token, {
      name: "Invalid Status Filter",
    });

    const res = await request.get(
      `${API_BASE}/api/projects/${project.id}/tasks?status=InvalidStatus`,
      { headers: { Authorization: `Bearer ${user.token}` } },
    );

    expect(res.status()).toBe(400);
  });

  test("TC-TASK-LIST-012: XSS injection in query parameter → 400 + not reflected", async ({
    request,
  }) => {

    const project = await createProjectViaApi(request, user.token, {
      name: "XSS Filter Test",
    });

    const res = await request.get(
      `${API_BASE}/api/projects/${project.id}/tasks?status=<script>alert(1)</script>`,
      { headers: { Authorization: `Bearer ${user.token}` } },
    );

    expect(res.status()).toBe(400);

    // Verify XSS payload is not reflected raw in response
    const text = await res.text();
    expect(text).not.toContain("<script>alert(1)</script>");
  });

  test("TC-TASK-LIST-013: SQL injection in assigneeId query parameter → 400", async ({
    request,
  }) => {

    const project = await createProjectViaApi(request, user.token, {
      name: "SQLi Filter Test",
    });

    const res = await request.get(
      `${API_BASE}/api/projects/${project.id}/tasks?assigneeId=1 OR 1=1`,
      { headers: { Authorization: `Bearer ${user.token}` } },
    );

    // Integer parse failure → 400 Bad Request
    expect(res.status()).toBe(400);
  });

  test("TC-TASK-LIST-014: Tasks ordered by createdAt descending (newest first)", async ({
    request,
  }) => {

    const project = await createProjectViaApi(request, user.token, {
      name: "Sort Order Test",
    });

    await createTaskViaApi(request, user.token, project.id, {
      title: "Task Alpha",
    });
    await createTaskViaApi(request, user.token, project.id, {
      title: "Task Beta",
    });
    await createTaskViaApi(request, user.token, project.id, {
      title: "Task Gamma",
    });

    const res = await request.get(
      `${API_BASE}/api/projects/${project.id}/tasks`,
      { headers: { Authorization: `Bearer ${user.token}` } },
    );

    expect(res.status()).toBe(200);
    const tasks: TaskDto[] = await res.json();
    expect(tasks.length).toBe(3);

    // Verify descending order by createdAt
    for (let i = 0; i < tasks.length - 1; i++) {
      const current = new Date(tasks[i].createdAt).getTime();
      const next = new Date(tasks[i + 1].createdAt).getTime();
      expect(current).toBeGreaterThanOrEqual(next);
    }
  });
});
