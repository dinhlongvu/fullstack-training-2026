import { test, expect, type APIRequestContext } from "@playwright/test";

import { API_BASE, uniqueEmail, registerAndLogin, createProjectViaApi, createTaskViaApi, addMemberViaApi, getProjectDetailViaApi, getProjectsViaApi, futureDateISO, type RegisteredUser, type ProjectDto, type TaskDto } from "../utils/api-helpers";

// ─── Constants ───────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE: GET /api/projects — List Projects
// Maps to: qa/test-cases/projects/01-list.md
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("API: GET /api/projects — List Projects", () => {
  test("TC-API-LIST-001: List projects with valid token → 200 + correct shape", async ({
    request,
  }) => {
    // Arrange: register user and create a project
    const user = await registerAndLogin(request);
    await createProjectViaApi(request, user.token, {
      name: "List Test Project",
      description: "Testing list endpoint",
    });

    // Act: fetch project list
    const res = await request.get(`${API_BASE}/api/projects`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });

    // Assert: status 200 + response is array with correct shape
    expect(res.status()).toBe(200);
    const projects: ProjectDto[] = await res.json();
    expect(Array.isArray(projects)).toBe(true);
    expect(projects.length).toBeGreaterThanOrEqual(1);

    // Verify shape of each project
    const project = projects[0];
    expect(project).toHaveProperty("id");
    expect(project).toHaveProperty("name");
    expect(project).toHaveProperty("description");
    expect(project).toHaveProperty("createdAt");
    expect(project).toHaveProperty("memberCount");
    expect(typeof project.id).toBe("number");
    expect(typeof project.name).toBe("string");
    expect(typeof project.memberCount).toBe("number");
  });

  test("TC-API-LIST-002: List projects without Bearer token → 401", async ({
    request,
  }) => {
    const res = await request.get(`${API_BASE}/api/projects`);
    expect(res.status()).toBe(401);
  });

  test("TC-API-LIST-003: List projects with invalid Bearer token → 401", async ({
    request,
  }) => {
    const res = await request.get(`${API_BASE}/api/projects`, {
      headers: { Authorization: "Bearer invalid-token-12345" },
    });
    expect(res.status()).toBe(401);
  });

  test("TC-API-LIST-004: New user with no projects → 200 + empty array", async ({
    request,
  }) => {
    // Register a fresh user who has no projects
    const user = await registerAndLogin(request);

    const res = await request.get(`${API_BASE}/api/projects`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });

    expect(res.status()).toBe(200);
    const projects: ProjectDto[] = await res.json();
    expect(Array.isArray(projects)).toBe(true);
    expect(projects).toHaveLength(0);
  });

  test("TC-API-LIST-005: Data isolation — User A cannot see User B's private projects", async ({
    request,
  }) => {
    // Create two users
    const userA = await registerAndLogin(request);
    const userB = await registerAndLogin(request);

    // User B creates a project
    const projectB = await createProjectViaApi(request, userB.token, {
      name: "User B Private Project",
      description: "Should not be visible to User A",
    });

    // User A fetches their project list
    const projectsA = await getProjectsViaApi(request, userA.token);

    // Assert: User A's list should NOT contain User B's project
    const foundBProject = projectsA.find((p) => p.id === projectB.id);
    expect(foundBProject).toBeUndefined();

    // User B should see their own project
    const projectsBList = await getProjectsViaApi(request, userB.token);
    const foundOwnProject = projectsBList.find((p) => p.id === projectB.id);
    expect(foundOwnProject).toBeDefined();
  });

  test("TC-API-LIST-006: MemberCount reflects actual number of members", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);

    // Create a project — creator is auto-added as member (memberCount = 1)
    const created = await createProjectViaApi(request, user.token, {
      name: "Member Count Test",
    });

    const projects = await getProjectsViaApi(request, user.token);
    const project = projects.find((p) => p.id === created.id);

    expect(project).toBeDefined();
    expect(project!.memberCount).toBe(1);
  });

  test("TC-API-LIST-007: Newly created project appears in list immediately", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);

    // Verify initial empty state
    const before = await getProjectsViaApi(request, user.token);
    expect(before).toHaveLength(0);

    // Create a project
    const created = await createProjectViaApi(request, user.token, {
      name: "Immediate Visibility Test",
      description: "Should appear right away",
    });

    // Verify project appears in list
    const after = await getProjectsViaApi(request, user.token);
    expect(after.length).toBe(1);
    expect(after[0].id).toBe(created.id);
    expect(after[0].name).toBe("Immediate Visibility Test");
  });

  test("TC-API-LIST-008: Projects sorted by createdAt descending (newest first)", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);

    // Create 3 projects with slight time gaps
    await createProjectViaApi(request, user.token, { name: "Project Alpha" });
    await createProjectViaApi(request, user.token, { name: "Project Beta" });
    await createProjectViaApi(request, user.token, { name: "Project Gamma" });

    const projects = await getProjectsViaApi(request, user.token);
    expect(projects.length).toBe(3);

    // Verify descending order: Gamma (newest) → Beta → Alpha (oldest)
    expect(projects[0].name).toBe("Project Gamma");
    expect(projects[1].name).toBe("Project Beta");
    expect(projects[2].name).toBe("Project Alpha");

    // Double-check with timestamps
    for (let i = 0; i < projects.length - 1; i++) {
      const current = new Date(projects[i].createdAt).getTime();
      const next = new Date(projects[i + 1].createdAt).getTime();
      expect(current).toBeGreaterThanOrEqual(next);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE: POST /api/projects — Create Project
// Maps to: qa/test-cases/projects/02-create.md
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("API: POST /api/projects — Create Project", () => {
  test("TC-API-CREATE-001: Create project with valid data → 201 + correct response body", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);

    const res = await request.post(`${API_BASE}/api/projects`, {
      headers: { Authorization: `Bearer ${user.token}` },
      data: { name: "My New Project", description: "A great project" },
    });

    expect(res.status()).toBe(201);
    const body: ProjectDto = await res.json();

    // Verify response shape and values
    expect(body).toHaveProperty("id");
    expect(body.name).toBe("My New Project");
    expect(body.description).toBe("A great project");
    expect(body).toHaveProperty("createdAt");
    expect(body.createdById).toBe(user.id);
    expect(typeof body.id).toBe("number");
    expect(body.id).toBeGreaterThan(0);
  });

  test("TC-API-CREATE-002: Create project without Bearer token → 401", async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE}/api/projects`, {
      data: { name: "Unauthorized Project", description: "No token" },
    });
    expect(res.status()).toBe(401);
  });

  test("TC-API-CREATE-003: Create project with empty name → 400 validation error", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);

    const res = await request.post(`${API_BASE}/api/projects`, {
      headers: { Authorization: `Bearer ${user.token}` },
      data: { name: "", description: "Valid description" },
    });

    expect(res.status()).toBe(400);
  });

  test("TC-API-CREATE-004: Create project with name > 200 chars → 400 validation error", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);
    const longName = "A".repeat(201);

    const res = await request.post(`${API_BASE}/api/projects`, {
      headers: { Authorization: `Bearer ${user.token}` },
      data: { name: longName, description: "Valid description" },
    });

    expect(res.status()).toBe(400);
  });

  test("TC-API-CREATE-005: Create project with name exactly 200 chars → 201 success", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);
    const exactName = "B".repeat(200);

    const res = await request.post(`${API_BASE}/api/projects`, {
      headers: { Authorization: `Bearer ${user.token}` },
      data: { name: exactName, description: "Boundary test" },
    });

    expect(res.status()).toBe(201);
    const body: ProjectDto = await res.json();
    expect(body.name).toBe(exactName);
    expect(body.name.length).toBe(200);
  });

  test("TC-API-CREATE-006: Create project without description → 201 success (optional field)", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);

    const res = await request.post(`${API_BASE}/api/projects`, {
      headers: { Authorization: `Bearer ${user.token}` },
      data: { name: "No Description Project" },
    });

    expect(res.status()).toBe(201);
    const body: ProjectDto = await res.json();
    expect(body.name).toBe("No Description Project");
  });

  test("TC-API-CREATE-007: Create project with description > 2000 chars → 400 validation error", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);
    const longDesc = "D".repeat(2001);

    const res = await request.post(`${API_BASE}/api/projects`, {
      headers: { Authorization: `Bearer ${user.token}` },
      data: { name: "Valid Project", description: longDesc },
    });

    expect(res.status()).toBe(400);
  });

  test("TC-API-CREATE-008: Request body cannot override createdById → uses JWT claim", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);

    // Attempt to inject a fake createdById
    const res = await request.post(`${API_BASE}/api/projects`, {
      headers: { Authorization: `Bearer ${user.token}` },
      data: {
        name: "Override Test",
        description: "Security test",
        createdById: 999999,
      },
    });

    expect(res.status()).toBe(201);
    const body: ProjectDto = await res.json();

    // createdById should be the authenticated user's ID, NOT 999999
    expect(body.createdById).toBe(user.id);
    expect(body.createdById).not.toBe(999999);
  });

  test("TC-API-CREATE-009: Creator is auto-added as Owner member → verify via detail endpoint", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);

    // Create project
    const created = await createProjectViaApi(request, user.token, {
      name: "Auto Member Test",
      description: "Check auto-added member",
    });

    // Fetch detail to verify member list
    const detail = await getProjectDetailViaApi(
      request,
      user.token,
      created.id,
    );

    expect(detail.status).toBe(200);
    expect(detail.body).not.toBeNull();
    expect(detail.body!.members).toHaveLength(1);

    // Creator should be in the members list
    const creatorMember = detail.body!.members[0];
    expect(creatorMember.userId).toBe(user.id);
    expect(creatorMember.email).toBe(user.email);
    expect(creatorMember).toHaveProperty("joinedAt");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE: GET /api/projects/{id} — Project Detail
// Maps to: qa/test-cases/projects/03-detail.md
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("API: GET /api/projects/{id} — Project Detail", () => {
  test("TC-API-DETAIL-001: Get project detail as owner → 200 + full detail with members", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);
    const created = await createProjectViaApi(request, user.token, {
      name: "Detail Test Project",
      description: "Testing detail endpoint",
    });

    const res = await request.get(
      `${API_BASE}/api/projects/${created.id}`,
      {
        headers: { Authorization: `Bearer ${user.token}` },
      },
    );

    expect(res.status()).toBe(200);
    const body: ProjectDto = await res.json();

    // Verify all expected fields
    expect(body.id).toBe(created.id);
    expect(body.name).toBe("Detail Test Project");
    expect(body.description).toBe("Testing detail endpoint");
    expect(body).toHaveProperty("createdAt");
    expect(body.createdById).toBe(user.id);

    // Verify members array
    expect(Array.isArray(body.members)).toBe(true);
    expect(body.members?.length).toBeGreaterThanOrEqual(1);

    // Each member should have correct shape
    const member = body.members[0];
    expect(member).toHaveProperty("userId");
    expect(member).toHaveProperty("email");
    expect(member).toHaveProperty("fullName");
    expect(member).toHaveProperty("joinedAt");
  });

  test("TC-API-DETAIL-002: Get project detail without Bearer token → 401", async ({
    request,
  }) => {
    // We need a valid project ID, so create one first
    const user = await registerAndLogin(request);
    const created = await createProjectViaApi(request, user.token, {
      name: "No Auth Detail Test",
    });

    // Try to access without token
    const res = await request.get(
      `${API_BASE}/api/projects/${created.id}`,
    );

    expect(res.status()).toBe(401);
  });

  test("TC-API-DETAIL-003: Get project detail as non-member → 404 Not Found", async ({
    request,
  }) => {
    // User A creates a project
    const userA = await registerAndLogin(request);
    const project = await createProjectViaApi(request, userA.token, {
      name: "Private Project",
      description: "Only for User A",
    });

    // User B tries to access it
    const userB = await registerAndLogin(request);
    const res = await request.get(
      `${API_BASE}/api/projects/${project.id}`,
      {
        headers: { Authorization: `Bearer ${userB.token}` },
      },
    );

    expect(res.status()).toBe(404);
  });

  test("TC-API-DETAIL-004: Get non-existent project → 404 Not Found", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);

    const res = await request.get(`${API_BASE}/api/projects/999999`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });

    expect(res.status()).toBe(404);
  });

  test("TC-API-DETAIL-005: Detail contains correct member list with all fields", async ({
    request,
  }) => {
    const user = await registerAndLogin(request);
    const created = await createProjectViaApi(request, user.token, {
      name: "Member Detail Check",
      description: "Verify member fields",
    });

    const detail = await getProjectDetailViaApi(
      request,
      user.token,
      created.id,
    );

    expect(detail.status).toBe(200);
    expect(detail.body).not.toBeNull();

    const members = detail.body!.members;
    expect(members.length).toBe(1);

    // Verify all member fields are correct
    const member = members[0];
    expect(member.userId).toBe(user.id);
    expect(member.email).toBe(user.email);
    expect(member.fullName).toBe(user.fullName);
    expect(typeof member.joinedAt).toBe("string");

    // joinedAt should be a valid ISO date string
    const joinDate = new Date(member.joinedAt);
    expect(joinDate.getTime()).not.toBeNaN();
  });
});
