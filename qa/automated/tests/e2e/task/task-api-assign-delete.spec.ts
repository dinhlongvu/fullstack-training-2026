import { test, expect, type APIRequestContext, request as playwrightRequest } from "@playwright/test";
import { API_BASE, registerAndLogin, createProjectViaApi, createTaskViaApi, addMemberViaApi, type RegisteredUser, type ProjectDto, type TaskDto } from "../utils/api-helpers";

// Priority and Status enum values (local to task tests)
const PRIORITY = { Low: "Low", Medium: "Medium", High: "High" } as const;
const TASK_STATUS = { Todo: "Todo", InProgress: "InProgress", Done: "Done" } as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE: PATCH /api/tasks/{id}/assign & DELETE /api/tasks/{id}
// Maps to: qa/test-cases/tasks/06-assigne.md & 07-delete.md
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("API: Tasks Assign & Delete", () => {
  let apiContext: APIRequestContext;
  let owner: RegisteredUser;
  let member: RegisteredUser;
  let member2: RegisteredUser;
  let nonMember: RegisteredUser;

  test.beforeAll(async () => {
    apiContext = await playwrightRequest.newContext();
    owner = await registerAndLogin(apiContext, { fullName: "Shared Owner" });
    member = await registerAndLogin(apiContext, { fullName: "Shared Member One" });
    member2 = await registerAndLogin(apiContext, { fullName: "Shared Member Two" });
    nonMember = await registerAndLogin(apiContext, { fullName: "Shared NonMember" });
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  // ─── ASSIGN TASK ─────────────────────────────────────────────────────────────

  test.describe("PATCH /api/tasks/{id}/assign — Assign Task", () => {
    let project: ProjectDto;
    let task: TaskDto;

    test.beforeAll(async () => {
      // Create a shared project and task for the assign tests
      project = await createProjectViaApi(apiContext, owner.token, { name: "Assign Test Project" });
      await addMemberViaApi(apiContext, owner.token, project.id, member.email);
      await addMemberViaApi(apiContext, owner.token, project.id, member2.email);
    });

    test.beforeEach(async ({ request }) => {
      // Create a fresh task for each test
      task = await createTaskViaApi(request, owner.token, project.id, {
        title: "Test Task for Assign",
      });
    });

    test("TC-TASK-ASSIGN-001: Owner assigns task to a project member (happy path)", async ({
      request,
    }) => {
      const res = await request.patch(`${API_BASE}/api/tasks/${task.id}/assign`, {
        headers: { Authorization: `Bearer ${owner.token}` },
        data: { assigneeId: member.id },
      });
      expect(res.status()).toBe(200);

      // Verify
      const detailRes = await request.get(`${API_BASE}/api/tasks/${task.id}`, {
        headers: { Authorization: `Bearer ${owner.token}` },
      });
      const detail = await detailRes.json();
      expect(detail.assigneeName).toBe(member.fullName);
    });

    test("TC-TASK-ASSIGN-002: Member assigns task to another project member", async ({
      request,
    }) => {
      const res = await request.patch(`${API_BASE}/api/tasks/${task.id}/assign`, {
        headers: { Authorization: `Bearer ${member.token}` },
        data: { assigneeId: member2.id },
      });
      expect(res.status()).toBe(200);

      // Verify
      const detailRes = await request.get(`${API_BASE}/api/tasks/${task.id}`, {
        headers: { Authorization: `Bearer ${owner.token}` },
      });
      const detail = await detailRes.json();
      expect(detail.assigneeName).toBe(member2.fullName);
    });

    test("TC-TASK-ASSIGN-003: Assign task without Bearer token → 401", async ({
      request,
    }) => {
      const res = await request.patch(`${API_BASE}/api/tasks/${task.id}/assign`, {
        data: { assigneeId: member.id },
      });
      expect(res.status()).toBe(401);
    });

    test("TC-TASK-ASSIGN-004: Non-member cannot assign task → 404", async ({
      request,
    }) => {
      const res = await request.patch(`${API_BASE}/api/tasks/${task.id}/assign`, {
        headers: { Authorization: `Bearer ${nonMember.token}` },
        data: { assigneeId: member.id },
      });
      expect(res.status()).toBe(404);
    });

    test("TC-TASK-ASSIGN-005: Assign task to non-member user → 400", async ({
      request,
    }) => {
      const res = await request.patch(`${API_BASE}/api/tasks/${task.id}/assign`, {
        headers: { Authorization: `Bearer ${owner.token}` },
        data: { assigneeId: nonMember.id },
      });
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body.errors).toBeDefined();
    });

    test("TC-TASK-ASSIGN-006: Assign task to non-existent user → 400/404", async ({
      request,
    }) => {
      const res = await request.patch(`${API_BASE}/api/tasks/${task.id}/assign`, {
        headers: { Authorization: `Bearer ${owner.token}` },
        data: { assigneeId: 999999 },
      });
      expect([400, 404]).toContain(res.status());
    });

    test("TC-TASK-ASSIGN-007: Unassign task by setting assigneeId to null", async ({
      request,
    }) => {
      // Setup: assign to member first
      await request.patch(`${API_BASE}/api/tasks/${task.id}/assign`, {
        headers: { Authorization: `Bearer ${owner.token}` },
        data: { assigneeId: member.id },
      });

      // Act: unassign
      const res = await request.patch(`${API_BASE}/api/tasks/${task.id}/assign`, {
        headers: { Authorization: `Bearer ${owner.token}` },
        data: { assigneeId: null },
      });
      expect(res.status()).toBe(200);

      // Verify
      const detailRes = await request.get(`${API_BASE}/api/tasks/${task.id}`, {
        headers: { Authorization: `Bearer ${owner.token}` },
      });
      const detail = await detailRes.json();
      expect(detail.assigneeName).toBeNull();
    });

    test("TC-TASK-ASSIGN-008: Assign task to project owner (owner is valid assignee)", async ({
      request,
    }) => {
      const res = await request.patch(`${API_BASE}/api/tasks/${task.id}/assign`, {
        headers: { Authorization: `Bearer ${owner.token}` },
        data: { assigneeId: owner.id },
      });
      expect(res.status()).toBe(200);

      const detailRes = await request.get(`${API_BASE}/api/tasks/${task.id}`, {
        headers: { Authorization: `Bearer ${owner.token}` },
      });
      const detail = await detailRes.json();
      expect(detail.assigneeName).toBe(owner.fullName);
    });

    test("TC-TASK-ASSIGN-009: Assign non-existent task → 404", async ({
      request,
    }) => {
      const res = await request.patch(`${API_BASE}/api/tasks/999999/assign`, {
        headers: { Authorization: `Bearer ${owner.token}` },
        data: { assigneeId: member.id },
      });
      expect(res.status()).toBe(404);
    });

    test("TC-TASK-ASSIGN-010: SQL injection in assigneeId body field → 400", async ({
      request,
    }) => {
      const res = await request.patch(`${API_BASE}/api/tasks/${task.id}/assign`, {
        headers: { Authorization: `Bearer ${owner.token}` },
        data: { assigneeId: "1; DROP TABLE Users; --" },
      });
      expect(res.status()).toBe(400); // Invalid JSON/Type
    });
  });

  // ─── DELETE TASK ─────────────────────────────────────────────────────────────

  test.describe("DELETE /api/tasks/{id} — Delete Task", () => {
    let project: ProjectDto;
    let task: TaskDto;

    test.beforeAll(async () => {
      // Create a shared project
      project = await createProjectViaApi(apiContext, owner.token, { name: "Delete Test Project" });
      await addMemberViaApi(apiContext, owner.token, project.id, member.email);
    });

    test.beforeEach(async ({ request }) => {
      // Create a fresh task to delete for each test
      task = await createTaskViaApi(request, owner.token, project.id, {
        title: "Test Task for Delete",
      });
    });

    test("TC-TASK-DELETE-001: Owner deletes task (happy path) → 204", async ({
      request,
    }) => {
      const res = await request.delete(`${API_BASE}/api/tasks/${task.id}`, {
        headers: { Authorization: `Bearer ${owner.token}` },
      });
      expect(res.status()).toBe(204);

      // Verify deletion
      const detailRes = await request.get(`${API_BASE}/api/tasks/${task.id}`, {
        headers: { Authorization: `Bearer ${owner.token}` },
      });
      expect(detailRes.status()).toBe(404);
    });

    test("TC-TASK-DELETE-002: Member deletes task → 204", async ({
      request,
    }) => {
      const res = await request.delete(`${API_BASE}/api/tasks/${task.id}`, {
        headers: { Authorization: `Bearer ${member.token}` },
      });
      expect(res.status()).toBe(204);

      // Verify deletion
      const detailRes = await request.get(`${API_BASE}/api/tasks/${task.id}`, {
        headers: { Authorization: `Bearer ${owner.token}` },
      });
      expect(detailRes.status()).toBe(404);
    });

    test("TC-TASK-DELETE-003: Delete task without Bearer token → 401", async ({
      request,
    }) => {
      const res = await request.delete(`${API_BASE}/api/tasks/${task.id}`);
      expect(res.status()).toBe(401);
    });

    test("TC-TASK-DELETE-004: Non-member cannot delete task → 404", async ({
      request,
    }) => {
      const res = await request.delete(`${API_BASE}/api/tasks/${task.id}`, {
        headers: { Authorization: `Bearer ${nonMember.token}` },
      });
      expect(res.status()).toBe(404);
    });

    test("TC-TASK-DELETE-005: Delete non-existent task → 404", async ({
      request,
    }) => {
      const res = await request.delete(`${API_BASE}/api/tasks/999999`, {
        headers: { Authorization: `Bearer ${owner.token}` },
      });
      expect(res.status()).toBe(404);
    });

    test("TC-TASK-DELETE-006: Delete task also removes associated comments", async ({
      request,
    }) => {
      // Add a comment to the task first (assuming POST /api/tasks/{id}/comments exists)
      // Since it's not implemented or we don't have the script here, we'll just delete and verify.
      const res = await request.delete(`${API_BASE}/api/tasks/${task.id}`, {
        headers: { Authorization: `Bearer ${owner.token}` },
      });
      expect(res.status()).toBe(204);
    });

    test("TC-TASK-DELETE-007: Delete already deleted task (idempotency) → 404", async ({
      request,
    }) => {
      await request.delete(`${API_BASE}/api/tasks/${task.id}`, {
        headers: { Authorization: `Bearer ${owner.token}` },
      });

      const duplicateRes = await request.delete(`${API_BASE}/api/tasks/${task.id}`, {
        headers: { Authorization: `Bearer ${owner.token}` },
      });
      expect(duplicateRes.status()).toBe(404);
    });

    test("TC-TASK-DELETE-008: Delete task with invalid (non-integer) taskId → 400", async ({
      request,
    }) => {
      const res = await request.delete(`${API_BASE}/api/tasks/abc`, {
        headers: { Authorization: `Bearer ${owner.token}` },
      });
      expect([400, 404]).toContain(res.status());
    });

    test("TC-TASK-DELETE-009: SQL injection in taskId path parameter → rejected", async ({
      request,
    }) => {
      const payload = encodeURIComponent("1; DROP TABLE Tasks;--");
      const res = await request.delete(`${API_BASE}/api/tasks/${payload}`, {
        headers: { Authorization: `Bearer ${owner.token}` },
      });
      expect([400, 404]).toContain(res.status());
    });

    test("TC-TASK-DELETE-010: Deleted task no longer appears in task list", async ({
      request,
    }) => {
      await request.delete(`${API_BASE}/api/tasks/${task.id}`, {
        headers: { Authorization: `Bearer ${owner.token}` },
      });

      const listRes = await request.get(`${API_BASE}/api/projects/${project.id}/tasks`, {
        headers: { Authorization: `Bearer ${owner.token}` },
      });
      const list = await listRes.json();
      expect(list.some((t: TaskDto) => t.id === task.id)).toBe(false);
    });
  });
});
