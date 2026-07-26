import { test, expect, type APIRequestContext } from "@playwright/test";

import { API_BASE, uniqueEmail, registerAndLogin, createProjectViaApi, createTaskViaApi, addMemberViaApi, getProjectDetailViaApi, getProjectsViaApi, futureDateISO, type RegisteredUser, type ProjectDto, type TaskDto } from "../utils/api-helpers";

// ─── Constants ───────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE: PUT /api/projects/{id} — Update Project
// Maps to: qa/test-cases/project/04-update.md
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("API: PUT /api/projects/{id} — Update Project", () => {
  test("TC-PROJ-UPDATE-001: Owner updates project successfully → 200 OK", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);
    const project = await createProjectViaApi(request, user.token, {
      name: "Original Name",
      description: "Original description",
    });

    // Act: owner updates the project
    const res = await request.put(`${API_BASE}/api/projects/${project.id}`, {
      headers: { Authorization: `Bearer ${user.token}` },
      data: { name: "Updated Name", description: "Updated description" },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("Updated Name");
    expect(body.description).toBe("Updated description");

    // Verify via detail endpoint
    const detail = await getProjectDetailViaApi(request, user.token, project.id);
    expect(detail.status).toBe(200);
    expect(detail.body!.name).toBe("Updated Name");
    expect(detail.body!.description).toBe("Updated description");
  });

  test("TC-PROJ-UPDATE-002: Non-owner cannot update project → 404", async ({
    request,
  }) => {
    const owner = await registerAndLogin(request);
    const nonOwner = await registerAndLogin(request);

    const project = await createProjectViaApi(request, owner.token, {
      name: "Owner Only Project",
    });

    // Add nonOwner as member
    await request.post(`${API_BASE}/api/projects/${project.id}/members`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { email: nonOwner.email },
    });

    // Non-owner tries to update
    const res = await request.put(`${API_BASE}/api/projects/${project.id}`, {
      headers: { Authorization: `Bearer ${nonOwner.token}` },
      data: { name: "Hacked Name", description: "Unauthorized update" },
    });

    expect(res.status()).toBe(404);

    // Verify project unchanged
    const detail = await getProjectDetailViaApi(request, owner.token, project.id);
    expect(detail.body!.name).toBe("Owner Only Project");
  });

  test("TC-PROJ-UPDATE-003: Update project without Bearer token → 401", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);
    const project = await createProjectViaApi(request, user.token, {
      name: "No Auth Update",
    });

    const res = await request.put(`${API_BASE}/api/projects/${project.id}`, {
      data: { name: "Unauthorized", description: "" },
    });

    expect(res.status()).toBe(401);
  });

  test("TC-PROJ-UPDATE-004: Update project with empty name → 400", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);
    const project = await createProjectViaApi(request, user.token, {
      name: "Valid Name",
    });

    const res = await request.put(`${API_BASE}/api/projects/${project.id}`, {
      headers: { Authorization: `Bearer ${user.token}` },
      data: { name: "", description: "Updated description" },
    });

    expect(res.status()).toBe(400);
  });

  test("TC-PROJ-UPDATE-005: Update project with name > 200 chars → 400", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);
    const project = await createProjectViaApi(request, user.token, {
      name: "Valid Name",
    });

    const longName = "A".repeat(201);
    const res = await request.put(`${API_BASE}/api/projects/${project.id}`, {
      headers: { Authorization: `Bearer ${user.token}` },
      data: { name: longName, description: "Updated" },
    });

    expect(res.status()).toBe(400);
  });

  test("TC-PROJ-UPDATE-006: Update project with description > 2000 chars → 400", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);
    const project = await createProjectViaApi(request, user.token, {
      name: "Valid Name",
    });

    const longDesc = "D".repeat(2001);
    const res = await request.put(`${API_BASE}/api/projects/${project.id}`, {
      headers: { Authorization: `Bearer ${user.token}` },
      data: { name: "Valid Name", description: longDesc },
    });

    expect(res.status()).toBe(400);
  });

  test("TC-PROJ-UPDATE-007: Update non-existent project → 404", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);

    const res = await request.put(`${API_BASE}/api/projects/999999`, {
      headers: { Authorization: `Bearer ${user.token}` },
      data: { name: "Ghost Update", description: "" },
    });

    expect(res.status()).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE: DELETE /api/projects/{id} — Delete Project
// Maps to: qa/test-cases/project/05-delete.md
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("API: DELETE /api/projects/{id} — Delete Project", () => {
  test("TC-PROJ-DELETE-001: Owner deletes project successfully → 204", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);
    const project = await createProjectViaApi(request, user.token, {
      name: "Delete Me",
      description: "To be deleted",
    });

    const res = await request.delete(`${API_BASE}/api/projects/${project.id}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });

    expect(res.status()).toBe(204);

    // Verify project no longer accessible
    const detail = await getProjectDetailViaApi(request, user.token, project.id);
    expect(detail.status).toBe(404);
  });

  test("TC-PROJ-DELETE-002: Non-owner cannot delete project → 404", async ({
    request,
  }) => {
    const owner = await registerAndLogin(request);
    const nonOwner = await registerAndLogin(request);

    const project = await createProjectViaApi(request, owner.token, {
      name: "Protected Project",
    });

    // Add nonOwner as member
    await request.post(`${API_BASE}/api/projects/${project.id}/members`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { email: nonOwner.email },
    });

    // Non-owner tries to delete
    const res = await request.delete(`${API_BASE}/api/projects/${project.id}`, {
      headers: { Authorization: `Bearer ${nonOwner.token}` },
    });

    expect(res.status()).toBe(404);

    // Verify project still exists
    const detail = await getProjectDetailViaApi(request, owner.token, project.id);
    expect(detail.status).toBe(200);
  });

  test("TC-PROJ-DELETE-003: Delete project without Bearer token → 401", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);
    const project = await createProjectViaApi(request, user.token, {
      name: "No Auth Delete",
    });

    const res = await request.delete(`${API_BASE}/api/projects/${project.id}`);

    expect(res.status()).toBe(401);
  });

  test("TC-PROJ-DELETE-004: Delete non-existent project → 404", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);

    const res = await request.delete(`${API_BASE}/api/projects/999999`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });

    expect(res.status()).toBe(404);
  });

  test("TC-PROJ-DELETE-005: Deleted project is removed from project list", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);
    const project = await createProjectViaApi(request, user.token, {
      name: "Soon Gone",
    });

    // Verify it's in the list
    const listBefore = await request.get(`${API_BASE}/api/projects`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    const projectsBefore = await listBefore.json();
    expect(projectsBefore.find((p: any) => p.id === project.id)).toBeDefined();

    // Delete
    const delRes = await request.delete(`${API_BASE}/api/projects/${project.id}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    expect(delRes.status()).toBe(204);

    // Verify removed from list
    const listAfter = await request.get(`${API_BASE}/api/projects`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    const projectsAfter = await listAfter.json();
    expect(projectsAfter.find((p: any) => p.id === project.id)).toBeUndefined();
  });

  test("TC-PROJ-DELETE-006: Project members are removed after project deletion (cascade)", async ({
    request,
  }) => {
    const owner = await registerAndLogin(request);
    const member = await registerAndLogin(request);

    const project = await createProjectViaApi(request, owner.token, {
      name: "Cascade Delete Test",
    });

    // Add member
    await request.post(`${API_BASE}/api/projects/${project.id}/members`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { email: member.email },
    });

    // Verify member can see project
    const detailBefore = await getProjectDetailViaApi(request, member.token, project.id);
    expect(detailBefore.status).toBe(200);
    expect(detailBefore.body!.members).toHaveLength(2);

    // Delete project
    const delRes = await request.delete(`${API_BASE}/api/projects/${project.id}`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });
    expect(delRes.status()).toBe(204);

    // Member can no longer access the project
    const detailAfter = await getProjectDetailViaApi(request, member.token, project.id);
    expect(detailAfter.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE: POST /api/projects/{id}/members — Add Project Member
// Maps to: qa/test-cases/project/06-add-member.md
// Note: API uses { email } not { userId } as in TC docs
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("API: POST /api/projects/{id}/members — Add Member", () => {
  test("TC-PROJ-MEMBER-001: Owner adds member successfully → 201", async ({
    request,
  }) => {
    const owner = await registerAndLogin(request);
    const newMember = await registerAndLogin(request);

    const project = await createProjectViaApi(request, owner.token, {
      name: "Member Test Project",
    });

    const res = await request.post(`${API_BASE}/api/projects/${project.id}/members`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { email: newMember.email },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.userId).toBe(newMember.id);
    expect(body.email).toBe(newMember.email);

    // Verify member appears in project detail
    const detail = await getProjectDetailViaApi(request, owner.token, project.id);
    expect(detail.body!.members).toHaveLength(2);
    const addedMember = detail.body!.members.find((m: any) => m.userId === newMember.id);
    expect(addedMember).toBeDefined();
    expect(addedMember!.email).toBe(newMember.email);
  });

  test("TC-PROJ-MEMBER-002: Non-owner cannot add member → 404", async ({
    request,
  }) => {
    const owner = await registerAndLogin(request);
    const member = await registerAndLogin(request);
    const newUser = await registerAndLogin(request);

    const project = await createProjectViaApi(request, owner.token, {
      name: "Non-Owner Add Test",
    });

    // Add member to project first
    await request.post(`${API_BASE}/api/projects/${project.id}/members`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { email: member.email },
    });

    // Member tries to add another user
    const res = await request.post(`${API_BASE}/api/projects/${project.id}/members`, {
      headers: { Authorization: `Bearer ${member.token}` },
      data: { email: newUser.email },
    });

    expect(res.status()).toBe(404);
  });

  test("TC-PROJ-MEMBER-003: Add member without Bearer token → 401", async ({
    request,
  }) => {
    const owner = await registerAndLogin(request);
    const project = await createProjectViaApi(request, owner.token, {
      name: "No Auth Member",
    });

    const res = await request.post(`${API_BASE}/api/projects/${project.id}/members`, {
      data: { email: "someone@example.com" },
    });

    expect(res.status()).toBe(401);
  });

  test("TC-PROJ-MEMBER-004: Add non-existent user email → 404", async ({
    request,
  }) => {
    const owner = await registerAndLogin(request);
    const project = await createProjectViaApi(request, owner.token, {
      name: "Non-Existent User",
    });

    const res = await request.post(`${API_BASE}/api/projects/${project.id}/members`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { email: "nonexistent_user_999@example.com" },
    });

    expect(res.status()).toBe(404);
  });

  test("TC-PROJ-MEMBER-005: Add duplicate member → 409 Conflict", async ({
    request,
  }) => {
    const owner = await registerAndLogin(request);
    const member = await registerAndLogin(request);

    const project = await createProjectViaApi(request, owner.token, {
      name: "Duplicate Test",
    });

    // Add member first time
    const firstAdd = await request.post(`${API_BASE}/api/projects/${project.id}/members`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { email: member.email },
    });
    expect(firstAdd.status()).toBe(201);

    // Add same member again
    const secondAdd = await request.post(`${API_BASE}/api/projects/${project.id}/members`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { email: member.email },
    });

    expect(secondAdd.status()).toBe(409);
  });

  test("TC-PROJ-MEMBER-006: Add member to non-existent project → 404", async ({
    request,
  }) => {
    const owner = await registerAndLogin(request);
    const member = await registerAndLogin(request);

    const res = await request.post(`${API_BASE}/api/projects/999999/members`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { email: member.email },
    });

    expect(res.status()).toBe(404);
  });

  test("TC-PROJ-MEMBER-007: Add member with missing email → 400", async ({
    request,
  }) => {
    const owner = await registerAndLogin(request);
    const project = await createProjectViaApi(request, owner.token, {
      name: "Missing Email",
    });

    const res = await request.post(`${API_BASE}/api/projects/${project.id}/members`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: {},
    });

    expect(res.status()).toBe(400);
  });

  test("TC-PROJ-MEMBER-008: Add member with invalid email format → 400", async ({
    request,
  }) => {
    const owner = await registerAndLogin(request);
    const project = await createProjectViaApi(request, owner.token, {
      name: "Invalid Email",
    });

    const res = await request.post(`${API_BASE}/api/projects/${project.id}/members`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { email: "not-an-email" },
    });

    expect(res.status()).toBe(400);
  });

  test("TC-PROJ-MEMBER-009: Added member can access project detail → 200", async ({
    request,
  }) => {
    const owner = await registerAndLogin(request);
    const member = await registerAndLogin(request);

    const project = await createProjectViaApi(request, owner.token, {
      name: "Access After Add",
    });

    // Before adding: member cannot access
    const detailBefore = await getProjectDetailViaApi(request, member.token, project.id);
    expect(detailBefore.status).toBe(404);

    // Add member
    await request.post(`${API_BASE}/api/projects/${project.id}/members`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { email: member.email },
    });

    // After adding: member can access
    const detailAfter = await getProjectDetailViaApi(request, member.token, project.id);
    expect(detailAfter.status).toBe(200);
    expect(detailAfter.body!.id).toBe(project.id);
    expect(detailAfter.body!.members.find((m: any) => m.userId === member.id)).toBeDefined();
  });
});
