import { test, expect, type APIRequestContext } from "@playwright/test";
import {
  API_BASE,
  registerAndLogin,
  createProjectViaApi,
  createTaskViaApi,
  updateTaskViaApi,
  updateTaskStatusViaApi,
  assignTaskViaApi,
  type RegisteredUser,
} from "../utils/api-helpers";

// ─── Constants ────────────────────────────────────────────────────────────────

const MY_STATS_URL = `${API_BASE}/api/dashboard/my-stats`;

// Status enum values expected by the backend
const STATUS = { Todo: "Todo", InProgress: "InProgress", Done: "Done" } as const;
const PRIORITY = { Low: "Low", Medium: "Medium", High: "High" } as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function futureDateISO(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
}

function pastDateISO(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

async function getMyStats(
  request: APIRequestContext,
  token: string,
): Promise<{ status: number; body: any }> {
  const res = await request.get(MY_STATS_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  let body;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status(), body };
}

/**
 * Create a task then immediately update its dueDate to a past date.
 * The backend rejects past dueDates on creation (FluentValidation),
 * but the update endpoint has no such validation.
 */
async function createOverdueTask(
  request: APIRequestContext,
  token: string,
  projectId: number,
  title: string,
  userId: number,
  daysAgo: number = 2,
) {
  const task = await createTaskViaApi(request, token, projectId, {
    title,
    dueDate: futureDateISO(1), // valid date for creation
    assigneeId: userId,
  });
  // Now update to past date (no validation on update)
  await updateTaskViaApi(request, token, task.id, {
    title,
    dueDate: pastDateISO(daysAgo),
  });
  return task;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe("Dashboard Stats API — TC-DASHBOARD-API", () => {
  // ─── TC-DASHBOARD-API-001 ──────────────────────────────────────────────────
  test("TC-DASHBOARD-API-001: Get my stats successfully (Happy path)", async ({
    request,
  }) => {
    // Setup: create user → project → tasks in different statuses
    const user = await registerAndLogin(request);
    const project = await createProjectViaApi(request, user.token, {
      name: `Dashboard-001-${Date.now()}`,
    });

    // Create tasks: 1 Todo, 1 InProgress, 1 Done
    const taskTodo = await createTaskViaApi(
      request,
      user.token,
      project.id,
      { title: "Todo task", dueDate: futureDateISO(2), assigneeId: user.id },
    );

    const taskInProgress = await createTaskViaApi(
      request,
      user.token,
      project.id,
      { title: "In-progress task", dueDate: futureDateISO(1), assigneeId: user.id },
    );
    await updateTaskStatusViaApi(request, user.token, taskInProgress.id, STATUS.InProgress);

    const taskDone = await createTaskViaApi(
      request,
      user.token,
      project.id,
      { title: "Done task", assigneeId: user.id },
    );
    await updateTaskStatusViaApi(request, user.token, taskDone.id, STATUS.Done);

    // Act
    const { status, body } = await getMyStats(request, user.token);

    // Assert
    expect(status).toBe(200);
    expect(body).toHaveProperty("tasksByStatus");
    expect(body.tasksByStatus).toHaveProperty("todo");
    expect(body.tasksByStatus).toHaveProperty("inProgress");
    expect(body.tasksByStatus).toHaveProperty("done");
    expect(body).toHaveProperty("upcomingDeadlines");
    expect(Array.isArray(body.upcomingDeadlines)).toBe(true);
    expect(body).toHaveProperty("totalAssigned");
    expect(body).toHaveProperty("overdueCount");
    expect(body.totalAssigned).toBe(3);
  });

  // ─── TC-DASHBOARD-API-002 ──────────────────────────────────────────────────
  test("TC-DASHBOARD-API-002: User has no assigned tasks (Zero stats)", async ({
    request,
  }) => {
    // Setup: brand-new user with 0 tasks
    const user = await registerAndLogin(request);

    // Act
    const { status, body } = await getMyStats(request, user.token);

    // Assert
    expect(status).toBe(200);
    expect(body.tasksByStatus.todo).toBe(0);
    expect(body.tasksByStatus.inProgress).toBe(0);
    expect(body.tasksByStatus.done).toBe(0);
    expect(body.totalAssigned).toBe(0);
    expect(body.overdueCount).toBe(0);
    expect(body.upcomingDeadlines).toEqual([]);
  });

  // ─── TC-DASHBOARD-API-003 ──────────────────────────────────────────────────
  test("TC-DASHBOARD-API-003: Overdue tasks counted separately from upcoming deadlines", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);
    const project = await createProjectViaApi(request, user.token, {
      name: `Dashboard-003-${Date.now()}`,
    });

    // Upcoming task: due within 3 days, status = Todo
    const upcomingTask = await createTaskViaApi(
      request,
      user.token,
      project.id,
      { title: "Upcoming task", dueDate: futureDateISO(1), assigneeId: user.id },
    );

    // Act
    const { status, body } = await getMyStats(request, user.token);

    // Assert
    expect(status).toBe(200);
    expect(typeof body.overdueCount).toBe("number");

    // upcomingDeadlines should contain only non-overdue upcoming tasks
    const upcomingIds = body.upcomingDeadlines.map((d: any) => d.taskId);
    expect(upcomingIds).toContain(upcomingTask.id);
  });

  // ─── TC-DASHBOARD-API-004 ──────────────────────────────────────────────────
  test("TC-DASHBOARD-API-004: Upcoming deadlines capped at 20 items and sorted chronologically", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);
    const project = await createProjectViaApi(request, user.token, {
      name: `Dashboard-004-${Date.now()}`,
    });

    // Create 25 tasks sequentially to prevent SQLite connection pool locks
    for (let i = 0; i < 25; i++) {
      const daysOffset = (i % 2) + 1; // 1 or 2 days from now (within 3 day window)
      const priorities = ["Low", "Medium", "High"];
      const priority = priorities[i % 3]; // Loop through string priorities
      await createTaskViaApi(request, user.token, project.id, {
        title: `Upcoming-${i.toString().padStart(2, "0")}`,
        dueDate: futureDateISO(daysOffset),
        priority,
        assigneeId: user.id,
      });
    }

    // Act
    const { status, body } = await getMyStats(request, user.token);

    // Assert
    expect(status).toBe(200);
    expect(body.upcomingDeadlines.length).toBeLessThanOrEqual(20);

    // Verify chronological sorting (dueDate ascending)
    for (let i = 1; i < body.upcomingDeadlines.length; i++) {
      const prevDate = body.upcomingDeadlines[i - 1].dueDate;
      const currDate = body.upcomingDeadlines[i].dueDate;
      expect(prevDate <= currDate).toBe(true);
    }
  });

  // ─── TC-DASHBOARD-API-005 ──────────────────────────────────────────────────
  test("TC-DASHBOARD-API-005: Completed tasks excluded from overdue count and upcoming deadlines", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);
    const project = await createProjectViaApi(request, user.token, {
      name: `Dashboard-005-${Date.now()}`,
    });

    // Task 1: Done, due date in the past → should NOT count as overdue
    const doneOverdue = await createOverdueTask(
      request, user.token, project.id, "Done-Overdue", user.id, 2,
    );
    await updateTaskStatusViaApi(request, user.token, doneOverdue.id, STATUS.Done);

    // Task 2: Done, due date within 3 days → should NOT be in upcoming deadlines
    const doneUpcoming = await createTaskViaApi(
      request,
      user.token,
      project.id,
      { title: "Done-Upcoming", dueDate: futureDateISO(1), assigneeId: user.id },
    );
    await updateTaskStatusViaApi(request, user.token, doneUpcoming.id, STATUS.Done);

    // Act
    const { status, body } = await getMyStats(request, user.token);

    // Assert
    expect(status).toBe(200);
    // Both completed tasks should count towards "done" status
    expect(body.tasksByStatus.done).toBeGreaterThanOrEqual(2);
    // Neither should be in overdueCount
    expect(body.overdueCount).toBe(0);
    // Neither should appear in upcomingDeadlines
    const upcomingIds = body.upcomingDeadlines.map((d: any) => d.taskId);
    expect(upcomingIds).not.toContain(doneOverdue.id);
    expect(upcomingIds).not.toContain(doneUpcoming.id);
  });

  // ─── TC-DASHBOARD-API-006 ──────────────────────────────────────────────────
  test("TC-DASHBOARD-API-006: Unauthorized access without Bearer token", async ({
    request,
  }) => {
    // Act: send request WITHOUT Authorization header
    const res = await request.get(MY_STATS_URL);

    // Assert
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty('error');
    expect(body).toHaveProperty('traceId');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // EDGE CASES
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── EDGE-API-001 ─────────────────────────────────────────────────────────
  test("EDGE-API-001: Tasks without dueDate excluded from upcoming deadlines and overdue count", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);
    const project = await createProjectViaApi(request, user.token, {
      name: `Edge-001-${Date.now()}`,
    });

    // Create 2 tasks WITHOUT dueDate
    await createTaskViaApi(request, user.token, project.id, {
      title: "No-due-1",
      assigneeId: user.id,
    });
    await createTaskViaApi(request, user.token, project.id, {
      title: "No-due-2",
      assigneeId: user.id,
    });

    const { status, body } = await getMyStats(request, user.token);

    expect(status).toBe(200);
    // They should count towards todo and totalAssigned
    expect(body.totalAssigned).toBe(2);
    expect(body.tasksByStatus.todo).toBe(2);
    // But NOT appear in overdue or upcoming (no dueDate)
    expect(body.overdueCount).toBe(0);
    expect(body.upcomingDeadlines).toHaveLength(0);
  });

  // ─── EDGE-API-002 ─────────────────────────────────────────────────────────
  test("EDGE-API-002: Task due exactly at 3-day boundary is included in upcoming deadlines", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);
    const project = await createProjectViaApi(request, user.token, {
      name: `Edge-002-${Date.now()}`,
    });

    // Task due within 3-day window (boundary check)
    const boundaryTask = await createTaskViaApi(request, user.token, project.id, {
      title: "Boundary-3day",
      dueDate: futureDateISO(2),
      assigneeId: user.id,
    });

    const { status, body } = await getMyStats(request, user.token);

    expect(status).toBe(200);
    const upcomingIds = body.upcomingDeadlines.map((d: any) => d.taskId);
    // Due in exactly 3 days → within the window
    expect(upcomingIds).toContain(boundaryTask.id);
  });

  // ─── EDGE-API-003 ─────────────────────────────────────────────────────────
  test("EDGE-API-003: Task due beyond 3-day window excluded from upcoming deadlines", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);
    const project = await createProjectViaApi(request, user.token, {
      name: `Edge-003-${Date.now()}`,
    });

    // Task due 4 days from now — OUTSIDE the 3-day window
    const farTask = await createTaskViaApi(request, user.token, project.id, {
      title: "Too-far-away",
      dueDate: futureDateISO(4),
      assigneeId: user.id,
    });

    const { status, body } = await getMyStats(request, user.token);

    expect(status).toBe(200);
    const upcomingIds = body.upcomingDeadlines.map((d: any) => d.taskId);
    expect(upcomingIds).not.toContain(farTask.id);
    // It should still count in totalAssigned and todo
    expect(body.totalAssigned).toBe(1);
    expect(body.tasksByStatus.todo).toBe(1);
  });

  // ─── EDGE-API-004 ─────────────────────────────────────────────────────────
  test("EDGE-API-004: Stats aggregate correctly across multiple projects", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);

    // Create 3 separate projects
    const projectA = await createProjectViaApi(request, user.token, {
      name: `Edge-004-A-${Date.now()}`,
    });
    const projectB = await createProjectViaApi(request, user.token, {
      name: `Edge-004-B-${Date.now()}`,
    });
    const projectC = await createProjectViaApi(request, user.token, {
      name: `Edge-004-C-${Date.now()}`,
    });

    // Project A: 1 Todo
    await createTaskViaApi(request, user.token, projectA.id, {
      title: "A-Todo",
      assigneeId: user.id,
    });

    // Project B: 1 InProgress
    const bTask = await createTaskViaApi(request, user.token, projectB.id, {
      title: "B-InProgress",
      assigneeId: user.id,
    });
    await updateTaskStatusViaApi(request, user.token, bTask.id, STATUS.InProgress);

    // Project C: 1 Done + 1 Todo with upcoming deadline
    const cDone = await createTaskViaApi(request, user.token, projectC.id, {
      title: "C-Done",
      assigneeId: user.id,
    });
    await updateTaskStatusViaApi(request, user.token, cDone.id, STATUS.Done);

    const cUpcoming = await createTaskViaApi(request, user.token, projectC.id, {
      title: "C-Upcoming",
      dueDate: futureDateISO(1),
      assigneeId: user.id,
    });

    const { status, body } = await getMyStats(request, user.token);

    expect(status).toBe(200);
    expect(body.totalAssigned).toBe(4);
    expect(body.tasksByStatus.todo).toBe(2);
    expect(body.tasksByStatus.inProgress).toBe(1);
    expect(body.tasksByStatus.done).toBe(1);
    // Upcoming from project C should appear
    const upcomingIds = body.upcomingDeadlines.map((d: any) => d.taskId);
    expect(upcomingIds).toContain(cUpcoming.id);
  });

  // ─── EDGE-API-005 ─────────────────────────────────────────────────────────
  test("EDGE-API-005: InProgress task with upcoming dueDate is included in upcoming deadlines and inProgress count", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);
    const project = await createProjectViaApi(request, user.token, {
      name: `Edge-005-${Date.now()}`,
    });

    // InProgress task with upcoming due date
    const inProgressTask = await createTaskViaApi(request, user.token, project.id, {
      title: "IP-Upcoming",
      dueDate: futureDateISO(1),
      assigneeId: user.id,
    });
    await updateTaskStatusViaApi(request, user.token, inProgressTask.id, STATUS.InProgress);

    const { status, body } = await getMyStats(request, user.token);

    expect(status).toBe(200);
    expect(body.tasksByStatus.inProgress).toBe(1);
    // Should appear in upcoming deadlines
    const upcomingIds = body.upcomingDeadlines.map((d: any) => d.taskId);
    expect(upcomingIds).toContain(inProgressTask.id);
  });

  // ─── EDGE-API-006 ─────────────────────────────────────────────────────────
  test("EDGE-API-006: Unassigned tasks do not affect another user's stats", async ({
    request,
  }) => {
    const owner = await registerAndLogin(request);
    const other = await registerAndLogin(request);
    const project = await createProjectViaApi(request, owner.token, {
      name: `Edge-006-${Date.now()}`,
    });

    // Create task assigned to owner
    await createTaskViaApi(request, owner.token, project.id, {
      title: "Owner-task",
      dueDate: futureDateISO(1),
      assigneeId: owner.id,
    });

    // Create unassigned task (no assigneeId)
    await createTaskViaApi(request, owner.token, project.id, {
      title: "Unassigned-task",
    });

    // Other user's stats should be completely clean
    const otherStats = await getMyStats(request, other.token);
    expect(otherStats.status).toBe(200);
    expect(otherStats.body.totalAssigned).toBe(0);
    expect(otherStats.body.overdueCount).toBe(0);
    expect(otherStats.body.upcomingDeadlines).toHaveLength(0);

    // Owner should only see the assigned task
    const ownerStats = await getMyStats(request, owner.token);
    expect(ownerStats.status).toBe(200);
    expect(ownerStats.body.totalAssigned).toBe(1);
  });

  // ─── EDGE-API-007 ─────────────────────────────────────────────────────────
  test("EDGE-API-007: Invalid/malformed Bearer token returns 401", async ({
    request,
  }) => {
    const res = await request.get(MY_STATS_URL, {
      headers: { Authorization: "Bearer totally-invalid-jwt-token-12345" },
    });

    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty('error');
    expect(body).toHaveProperty('traceId');
  });

  // ─── EDGE-API-008 ─────────────────────────────────────────────────────────
  test("EDGE-API-008: Attempting to create task with past dueDate is rejected (400 Bad Request)", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);
    const project = await createProjectViaApi(request, user.token, {
      name: `Edge-008-${Date.now()}`,
    });

    // Send request with past dueDate -> should be rejected with 400
    const res = await request.post(`${API_BASE}/api/projects/${project.id}/tasks`, {
      headers: { Authorization: `Bearer ${user.token}` },
      data: {
        title: "Past-task-attempt",
        dueDate: pastDateISO(2),
      },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('errors');
    expect(body).toHaveProperty('traceId');
  });
});

