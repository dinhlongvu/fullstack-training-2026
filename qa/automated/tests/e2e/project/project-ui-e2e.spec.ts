import { test, expect, type Page } from "@playwright/test";

import { getTestUser, clearBrowserAuthState, registerUser, loginUser, getPersistedToken, expectMessageVisible, expectEmailInputInvalid, trackApiCalls, expectNoApiCall, registerViaApi, loginViaUI, registerAndLoginViaUI, createProjectViaDialog, createProjectViaUIContext, type TestUser } from "../utils/ui-helpers";
import { API_BASE, type RegisteredUser, uniqueEmail } from "../utils/api-helpers";

// ─── Constants ───────────────────────────────────────────────────────────────

const LOGIN_PAGE_URL = /\/login\/?(?:\?.*)?$/;
const PROJECTS_PAGE_URL = /\/projects\/?(?:\?.*)?$/;
const PROJECT_DETAIL_URL = /\/projects\/\d+\/?(?:\?.*)?$/;

// API route patterns for interception
const PROJECTS_API = /\/api\/projects\/?(?:\?.*)?$/;

// UI text patterns
const CREATE_SUCCESS_TOAST = /Project created successfully/i;
const PROJECT_NAME_REQUIRED = /Project name is required/i;
const PROJECT_NAME_MAX_ERROR = /Project name must be at most 200 characters/i;
const DESCRIPTION_MAX_ERROR = /Description must be at most 2000 characters/i;

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE: Projects List Page UI
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("UI: Projects List Page", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await clearBrowserAuthState(page);
  });

  test('TC-UI-PROJ-01: After login, /projects shows "My Projects" heading + "Create Project" button', async ({
    page,
  }) => {
    await registerAndLoginViaUI(page);

    // Verify page heading
    await expect(
      page.getByRole("heading", { name: /My Projects/i }),
    ).toBeVisible();

    // Verify "Create Project" button exists
    await expect(
      page.getByRole("button", { name: /Create Project/i }).first(),
    ).toBeVisible();
  });

  test('TC-UI-PROJ-02: Empty state — new user sees "No projects yet" message', async ({
    page,
  }) => {
    await registerAndLoginViaUI(page);

    // Verify empty state message
    await expect(page.getByText(/No projects yet/i)).toBeVisible();
    await expect(
      page.getByText(/Create your first project to get started/i),
    ).toBeVisible();
  });

  test("TC-UI-PROJ-03: After creating a project, it appears as a card with name, description, memberCount", async ({
    page,
  }) => {
    await registerAndLoginViaUI(page);

    // Create project via dialog
    await createProjectViaDialog(page, "UI Test Project", "My test description");

    // Wait for toast
    await expect(page.getByText(CREATE_SUCCESS_TOAST).first()).toBeVisible();

    // Wait for the project card to appear
    await expect(page.getByText("UI Test Project")).toBeVisible();
    await expect(page.getByText("My test description")).toBeVisible();

    // Verify member count (creator = 1 member)
    await expect(page.getByText(/1\s*member/i)).toBeVisible();
  });

  test("TC-UI-PROJ-04: Clicking a project card navigates to /projects/{id}", async ({
    page,
  }) => {
    await registerAndLoginViaUI(page);

    // Create project via API for speed
    const project = await createProjectViaUIContext(
      page,
      "Navigate Test Project",
      "Click to view detail",
    );

    // Reload to see the project in the list
    await page.goto("/projects");
    await expect(page.getByText("Navigate Test Project")).toBeVisible();

    // Click the project card
    await page.getByText("Navigate Test Project").click();

    // Should navigate to project detail page
    await expect(page).toHaveURL(PROJECT_DETAIL_URL);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE: Create Project Dialog UI
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("UI: Create Project Dialog", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await clearBrowserAuthState(page);
  });

  test('TC-UI-PROJ-05: Click "Create Project" opens dialog with Name + Description fields', async ({
    page,
  }) => {
    await registerAndLoginViaUI(page);

    // Click Create Project button
    await page.getByRole("button", { name: /Create Project/i }).first().click();

    // Verify dialog is visible
    await expect(
      page.getByRole("heading", { name: /Create Project/i }),
    ).toBeVisible();

    // Verify dialog description
    await expect(
      page.getByText(/Add a new project. You will be the owner/i),
    ).toBeVisible();

    // Verify form fields exist
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();

    // Verify submit button
    await expect(
      page.getByRole("button", { name: /^Create$/i }),
    ).toBeVisible();
  });

  test('TC-UI-PROJ-06: Submit with empty name → validation error "Project name is required"', async ({
    page,
  }) => {
    await registerAndLoginViaUI(page);

    // Track API calls to ensure no request is sent
    const apiCalls: string[] = [];
    page.on("request", (req) => {
      if (
        (req.resourceType() === "fetch" || req.resourceType() === "xhr") &&
        req.method() === "POST" &&
        PROJECTS_API.test(req.url())
      ) {
        apiCalls.push(req.url());
      }
    });

    // Open dialog
    await page.getByRole("button", { name: /Create Project/i }).first().click();

    // Leave name empty and submit
    await page.locator('input[name="name"]').fill("");
    await page.getByRole("button", { name: /^Create$/i }).click();

    // Should show validation error
    await expect(page.getByText(PROJECT_NAME_REQUIRED).first()).toBeVisible();

    // No API call should have been made
    await page.waitForTimeout(300);
    expect(apiCalls).toHaveLength(0);
  });

  test('TC-UI-PROJ-06a: Name with 201 chars → validation error "at most 200 characters"', async ({
    page,
  }) => {
    await registerAndLoginViaUI(page);

    // Track API calls to ensure no request is sent
    const apiCalls: string[] = [];
    page.on("request", (req) => {
      if (
        (req.resourceType() === "fetch" || req.resourceType() === "xhr") &&
        req.method() === "POST" &&
        PROJECTS_API.test(req.url())
      ) {
        apiCalls.push(req.url());
      }
    });

    // Open dialog
    await page.getByRole("button", { name: /Create Project/i }).first().click();

    // Fill name with 201 characters (boundary + 1)
    const nameOver = "A".repeat(201);
    await page.locator('input[name="name"]').fill(nameOver);
    await page.getByRole("button", { name: /^Create$/i }).click();

    // Should show max-length validation error from Zod
    await expect(page.getByText(PROJECT_NAME_MAX_ERROR).first()).toBeVisible();

    // No API call should have been made — client blocks it
    await page.waitForTimeout(300);
    expect(apiCalls).toHaveLength(0);
  });

  test('TC-UI-PROJ-06b: Name with exactly 200 chars → no validation error, project created', async ({
    page,
  }) => {
    await registerAndLoginViaUI(page);

    // Open dialog
    await page.getByRole("button", { name: /Create Project/i }).first().click();

    // Fill name with exactly 200 characters (boundary value — should pass)
    const nameExact = "B".repeat(200);
    await page.locator('input[name="name"]').fill(nameExact);
    await page.getByRole("button", { name: /^Create$/i }).click();

    // Should NOT show validation error
    await expect(page.getByText(PROJECT_NAME_MAX_ERROR)).not.toBeVisible();

    // Should show success toast
    await expect(page.getByText(CREATE_SUCCESS_TOAST).first()).toBeVisible();
  });

  test('TC-UI-PROJ-06c: Description with 2001 chars → validation error "at most 2000 characters"', async ({
    page,
  }) => {
    await registerAndLoginViaUI(page);

    // Track API calls to ensure no request is sent
    const apiCalls: string[] = [];
    page.on("request", (req) => {
      if (
        (req.resourceType() === "fetch" || req.resourceType() === "xhr") &&
        req.method() === "POST" &&
        PROJECTS_API.test(req.url())
      ) {
        apiCalls.push(req.url());
      }
    });

    // Open dialog
    await page.getByRole("button", { name: /Create Project/i }).first().click();

    // Fill valid name + description with 2001 chars (boundary + 1)
    await page.locator('input[name="name"]').fill("Boundary Desc Test");
    const descOver = "D".repeat(2001);
    await page.locator('textarea[name="description"]').fill(descOver);
    await page.getByRole("button", { name: /^Create$/i }).click();

    // Should show max-length validation error for description
    await expect(page.getByText(DESCRIPTION_MAX_ERROR).first()).toBeVisible();

    // No API call should have been made — client blocks it
    await page.waitForTimeout(300);
    expect(apiCalls).toHaveLength(0);
  });

  test('TC-UI-PROJ-06d: Description with exactly 2000 chars → no validation error, project created', async ({
    page,
  }) => {
    await registerAndLoginViaUI(page);

    // Open dialog
    await page.getByRole("button", { name: /Create Project/i }).first().click();

    // Fill valid name + description with exactly 2000 chars (boundary value — should pass)
    await page.locator('input[name="name"]').fill("Boundary Desc Pass");
    const descExact = "E".repeat(2000);
    await page.locator('textarea[name="description"]').fill(descExact);
    await page.getByRole("button", { name: /^Create$/i }).click();

    // Should NOT show validation error
    await expect(page.getByText(DESCRIPTION_MAX_ERROR)).not.toBeVisible();

    // Should show success toast
    await expect(page.getByText(CREATE_SUCCESS_TOAST).first()).toBeVisible();
  });

  test('TC-UI-PROJ-07: Submit with valid data → toast "Project created successfully" + dialog closes', async ({
    page,
  }) => {
    await registerAndLoginViaUI(page);

    // Open dialog and fill form
    await createProjectViaDialog(
      page,
      "Success Dialog Test",
      "Test description here",
    );

    // Verify success toast
    await expect(page.getByText(CREATE_SUCCESS_TOAST).first()).toBeVisible();

    // Verify dialog is closed (the dialog title should not be visible)
    await expect(
      page.getByRole("heading", { name: /^Create Project$/i }),
    ).not.toBeVisible();
  });

  test('TC-UI-PROJ-08: Loading state — submit button shows "Creating..." and is disabled during API call', async ({
    page,
  }) => {
    await registerAndLoginViaUI(page);

    // Delay the POST /api/projects response to observe loading state
    await page.route("**/api/projects", async (route) => {
      const request = route.request();
      if (request.method() === "POST") {
        await page.waitForTimeout(1500);
      }
      await route.continue();
    });

    // Open dialog
    await page.getByRole("button", { name: /Create Project/i }).first().click();
    await page.locator('input[name="name"]').fill("Loading State Test");

    // Click submit
    const submitButton = page.getByRole("button", { name: /^Create$/i });
    await submitButton.click();

    // Verify loading state — button should show "Creating..." and be disabled
    await expect(
      page.getByRole("button", { name: /Creating/i }),
    ).toBeDisabled();

    // Wait for the request to complete and verify success
    await expect(page.getByText(CREATE_SUCCESS_TOAST).first()).toBeVisible();
  });

  test("TC-UI-PROJ-09: After dialog close, project list refreshes automatically", async ({
    page,
  }) => {
    await registerAndLoginViaUI(page);

    // Verify empty state initially
    await expect(page.getByText(/No projects yet/i)).toBeVisible();

    // Create a project
    await createProjectViaDialog(
      page,
      "Auto Refresh Test",
      "Should appear immediately",
    );

    // Wait for toast
    await expect(page.getByText(CREATE_SUCCESS_TOAST).first()).toBeVisible();

    // The project should now be visible in the list — empty state should be gone
    await expect(page.getByText(/No projects yet/i)).not.toBeVisible();
    await expect(page.getByText("Auto Refresh Test")).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE: Project Detail Page UI
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("UI: Project Detail Page", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await clearBrowserAuthState(page);
  });

  test("TC-UI-PROJ-10: Detail page shows project name, description, created date, member count", async ({
    page,
  }) => {
    await registerAndLoginViaUI(page);

    // Create project via API
    const project = await createProjectViaUIContext(
      page,
      "Detail Display Test",
      "Checking all detail fields",
    );

    // Navigate to detail page
    await page.goto(`/projects/${project.id}`);

    // Verify project name
    await expect(
      page.getByRole("heading", { name: "Detail Display Test" }),
    ).toBeVisible();

    // Verify description
    await expect(page.getByText("Checking all detail fields")).toBeVisible();

    // Verify created date is displayed (format: "Created MM/DD/YYYY" or similar)
    await expect(page.getByText(/Created\s/i)).toBeVisible();

    // Verify member count
    await expect(page.getByText(/1\s*member/i)).toBeVisible();
  });

  test("TC-UI-PROJ-11: Members table displays member name, email, join date", async ({
    page,
  }) => {
    const testUser = await registerAndLoginViaUI(page);

    // Create project via API
    const project = await createProjectViaUIContext(
      page,
      "Members Table Test",
      "Verify members table",
    );

    // Navigate to detail page
    await page.goto(`/projects/${project.id}`);

    // Verify Members section heading.
    // Use exact heading text to avoid matching the project title "Members Table Test".
    await expect(
      page.getByRole("heading", { name: "Members", level: 3 }),
    ).toBeVisible();

    // Scope assertions to the members table to avoid matching text elsewhere on the page.
    const membersTable = page.getByRole("table");

    // Verify member's info in the table
    await expect(
      membersTable.getByRole("cell", { name: testUser.fullName }),
    ).toBeVisible();
    await expect(
      membersTable.getByRole("cell", { name: testUser.email }),
    ).toBeVisible();

    // Verify table structure — check for table headers
    await expect(
      membersTable.getByRole("columnheader", { name: "Name" }),
    ).toBeVisible();
    await expect(
      membersTable.getByRole("columnheader", { name: "Email" }),
    ).toBeVisible();
    await expect(
      membersTable.getByRole("columnheader", { name: "Joined" }),
    ).toBeVisible();
  });

  test('TC-UI-PROJ-12: Owner sees "Add Member", "Edit", "Delete" action buttons', async ({
    page,
  }) => {
    await registerAndLoginViaUI(page);

    // Create project via API
    const project = await createProjectViaUIContext(
      page,
      "Owner Buttons Test",
      "Should see action buttons",
    );

    // Navigate to detail page
    await page.goto(`/projects/${project.id}`);

    // Wait for page to load
    await expect(
      page.getByRole("heading", { name: "Owner Buttons Test" }),
    ).toBeVisible();

    // Verify owner-only action buttons
    await expect(
      page.getByRole("button", { name: /Add Member/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Edit/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Delete/i }),
    ).toBeVisible();
  });

  test('TC-UI-PROJ-13: "Back to projects" link navigates back to /projects', async ({
    page,
  }) => {
    await registerAndLoginViaUI(page);

    // Create project and navigate to detail
    const project = await createProjectViaUIContext(
      page,
      "Back Navigation Test",
    );
    await page.goto(`/projects/${project.id}`);

    // Wait for page to load
    await expect(
      page.getByRole("heading", { name: "Back Navigation Test" }),
    ).toBeVisible();

    // Click "Back to projects" link
    await page.getByText(/Back to projects/i).click();

    // Should navigate back to /projects
    await expect(page).toHaveURL(PROJECTS_PAGE_URL);
  });

  test('TC-UI-PROJ-14: Non-existent project ID shows "Project not found" error page', async ({
    page,
  }) => {
    await registerAndLoginViaUI(page);

    // Navigate to a non-existent project
    await page.goto("/projects/999999");

    // Should show error message
    await expect(
      page.getByText(
        /Couldn't load this project. It may have been deleted, or you may not have access/i,
      ),
    ).toBeVisible();

    // Should have "Back to projects" link
    await expect(page.getByText(/Back to projects/i)).toBeVisible();
  });
});
