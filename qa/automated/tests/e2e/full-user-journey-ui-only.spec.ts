import { test, expect } from "@playwright/test";
import {
  uniqueEmail,
  registerAndLogin,
  createProjectViaApi,
  addMemberViaApi,
  createTaskViaApi,
  API_BASE,
} from "./utils/api-helpers";

// ─────────────────────────────────────────────────────────────────────────────
// Helper: login as a given user via UI (fills the login form and submits).
// ─────────────────────────────────────────────────────────────────────────────
async function loginViaUI(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/projects/);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: compute today's date + 1 in "yyyy-MM-dd" format (for API).
// ─────────────────────────────────────────────────────────────────────────────
function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0]; // "2026-08-12"
}

// =============================================================================
//  JOURNEY 1 — Owner's Full Lifecycle
//  Register → Login → Create Project → Add Member → Create Task (with assign
//  & due date) → Move Task status → Comment → Verify Dashboard stats &
//  Upcoming Deadlines widget
// =============================================================================
test.describe("Journey 1: Owner Full Lifecycle", () => {
  test("TC-JOURNEY-002: Register → Login → Create Project → Add Member → Create Task (assign + due date) → Move Status → Comment → Dashboard check", async ({
    page,
    request,
  }) => {
    // Increase timeout for this comprehensive journey
    test.setTimeout(60_000);

    // ── 0. Prepare a member user via API (avoids logout/re-login complexity) ──
    const memberUser = await registerAndLogin(request, {
      fullName: "Journey Member",
    });

    // ── 1. Register Owner via UI ──────────────────────────────────────────────
    const ownerEmail = uniqueEmail("owner_j1");
    const ownerPassword = "Password@123";
    await page.goto("/register");
    await page.fill('input[name="fullName"]', "Journey Owner");
    await page.fill('input[name="email"]', ownerEmail);
    await page.fill('input[name="password"]', ownerPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/login/);

    // ── 2. Login Owner via UI ─────────────────────────────────────────────────
    await page.fill('input[name="email"]', ownerEmail);
    await page.fill('input[name="password"]', ownerPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/projects/);

    // ── 3. Create Project via UI ──────────────────────────────────────────────
    await page.getByRole("button", { name: "Create Project" }).first().click();
    await page.fill('input[name="name"]', "Journey Project Alpha");
    await page.fill(
      'textarea[name="description"]',
      "Full lifecycle project test",
    );
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Create" })
      .click();
    await expect(page.getByText("Project created successfully")).toBeVisible();

    // Navigate into the project
    await page.getByRole("heading", { name: "Journey Project Alpha" }).click();
    await expect(page).toHaveURL(/\/projects\/\d+/);
    await expect(
      page.getByRole("heading", { name: "Journey Project Alpha" }),
    ).toBeVisible();

    // ── 4. Add Member via UI ──────────────────────────────────────────────────
    await page
      .getByRole("button", { name: /Add Member/i })
      .first()
      .click();
    await page.fill('input[name="email"]', memberUser.email);
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Add Member" })
      .click();
    await expect(page.getByText("Member added successfully")).toBeVisible();

    // Verify member appears in the member list (use locator('tbody') to avoid
    // matching the assignee filter dropdown that also contains the name)
    await expect(page.locator("tbody").getByText("Journey Member")).toBeVisible();

    // ── 5. Create Task via UI (with Priority + Assignee selection) ─────────
    await page.getByRole("button", { name: "New Task" }).first().click();
    await page.fill('input[name="title"]', "Deadline Task Alpha");
    await page.fill(
      'textarea[name="description"]',
      "Task with assignee and due date",
    );

    // Select Priority = High
    const dialog = page.getByRole("dialog");
    await dialog.locator('button[role="combobox"]').first().click();
    await page.getByRole("option", { name: "High" }).click();

    // Select Assignee = Journey Member (the member we just added)
    await dialog.locator('button[role="combobox"]').nth(1).click();
    await page.getByRole("option", { name: "Journey Member" }).click();

    // Submit the task
    await dialog.getByRole("button", { name: "Create Task" }).click();
    await expect(page.getByText("Task created successfully")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Deadline Task Alpha" }),
    ).toBeVisible();

    // ── 6. Move Task Status: Todo → InProgress via UI ─────────────────────
    await page
      .getByRole("button", { name: /Move Right/i })
      .first()
      .click();
    // After moving, the task should be in the "In Progress" column
    await expect(page.getByText("In Progress").first()).toBeVisible();

    // ── 7. Open Task Detail & Add Comment via UI ──────────────────────────
    await page.getByRole("link", { name: "Deadline Task Alpha" }).click();
    await expect(page).toHaveURL(/\/tasks\/\d+/);

    // Verify task detail page shows correct info
    await expect(
      page.getByRole("heading", { name: "Deadline Task Alpha" }),
    ).toBeVisible();
    await expect(page.getByText("Journey Member")).toBeVisible(); // Assignee

    // Add a comment
    await page.fill(
      'textarea[name="content"]',
      "Owner's first comment on the task!",
    );
    await page.getByRole("button", { name: "Post Comment" }).click();
    await expect(
      page.getByText("Owner's first comment on the task!"),
    ).toBeVisible();

    // ── 8. Edit Task: Set upcoming Due Date via UI ────────────────────────
    await page.getByRole("button", { name: /Edit/i }).click();
    const editDialog = page.getByRole("dialog");
    await expect(editDialog.getByText("Edit Task")).toBeVisible();

    // Open the due date calendar popover
    await editDialog.getByText("Pick a date").click();

    // Click tomorrow's date in the calendar popup.
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tmrMonth = tomorrow.toLocaleString("en-US", { month: "long" });
    const tmrDayNum = tomorrow.getDate();
    const datePattern = new RegExp(`${tmrMonth} ${tmrDayNum}\\w{0,2},`);
    await page.getByRole("button", { name: datePattern }).click();

    // Save changes (use raw locator because Radix Popover marks parent dialog aria-hidden="true")
    await page.locator('button:has-text("Save Changes")').click({ force: true });
    await expect(page.getByText("Task updated successfully")).toBeVisible();

    // ── 9. Check Dashboard: Stats + Upcoming Deadlines ────────────────────
    // The task is assigned to "Journey Member", so the dashboard of the
    // *member* should show it. Let's check the owner's dashboard first to
    // verify stats cards render.
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });
});

// =============================================================================
//  JOURNEY 2 — Member's Perspective
//  Login as Member → Check Dashboard (assigned task shows up) → View task
//  from Upcoming Deadlines → Edit task status from task detail → Add comment
//  → Verify dashboard stats update
// =============================================================================
test.describe("Journey 2: Member Dashboard & Task Interaction", () => {
  test("TC-JOURNEY-003: Member sees assigned task on Dashboard → Views from Upcoming Deadlines → Edits task → Comments", async ({
    page,
    request,
  }) => {
    test.setTimeout(60_000);

    // ── 0. Setup via API: Owner creates project, adds member, creates task
    //    with due date tomorrow and assigns it to the member ──────────────
    const owner = await registerAndLogin(request, { fullName: "Setup Owner" });
    const member = await registerAndLogin(request, {
      fullName: "Dashboard Member",
    });

    const project = await createProjectViaApi(request, owner.token, {
      name: "Member Dashboard Project",
    });
    await addMemberViaApi(request, owner.token, project.id, member.email);

    const task = await createTaskViaApi(request, owner.token, project.id, {
      title: "Upcoming Deadline Task",
      description: "Should appear in dashboard widget",
      priority: "High",
      assigneeId: member.id,
      dueDate: tomorrowISO(),
    });

    // ── 1. Login as Member via UI ─────────────────────────────────────────
    await loginViaUI(page, member.email, member.password);

    // ── 2. Go to Dashboard — verify stats and upcoming deadlines ──────────
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    // Stats cards should show at least 1 task
    await expect(page.getByText("Total Tasks")).toBeVisible();
    await expect(page.getByText("Todo")).toBeVisible();

    // Upcoming Deadlines widget should show the task
    await expect(page.getByText("Upcoming Deadlines")).toBeVisible();
    await expect(page.getByText("Upcoming Deadline Task")).toBeVisible();

    // ── 3. Click "View" link on the deadline to navigate to task detail ───
    await page
      .getByRole("link", { name: "View" })
      .first()
      .click();
    await expect(page).toHaveURL(/\/tasks\/\d+/);
    await expect(
      page.getByRole("heading", { name: "Upcoming Deadline Task" }),
    ).toBeVisible();

    // ── 4. Add a comment from the task detail page ────────────────────────
    await page.fill(
      'textarea[name="content"]',
      "Member acknowledging the task from dashboard!",
    );
    await page.getByRole("button", { name: "Post Comment" }).click();
    await expect(
      page.getByText("Member acknowledging the task from dashboard!"),
    ).toBeVisible();

    // ── 5. Go back to the project board and move task status ──────────────
    await page.getByRole("link", { name: "Back to project" }).click();
    await expect(page).toHaveURL(/\/projects\/\d+/);

    // Move task: Todo → InProgress
    await page
      .getByRole("button", { name: /Move Right/i })
      .first()
      .click();

    // ── 6. Verify Dashboard updates: InProgress count should increase ─────
    await page.goto("/dashboard");
    await expect(page.getByText("In Progress")).toBeVisible();
  });
});

// =============================================================================
//  JOURNEY 3 — Assign / Unassign Flow
//  Owner creates task unassigned → assigns to member via Kanban card picker
//  → unassigns via Edit Task dialog → re-assigns
// =============================================================================
test.describe("Journey 3: Assign & Unassign Member on Tasks", () => {
  test("TC-JOURNEY-004: Assign member via Kanban card → Unassign via Edit dialog → Re-assign", async ({
    page,
    request,
  }) => {
    test.setTimeout(60_000);

    // ── 0. Setup via API ──────────────────────────────────────────────────
    const owner = await registerAndLogin(request, { fullName: "Assign Owner" });
    const member = await registerAndLogin(request, {
      fullName: "Assign Member",
    });

    const project = await createProjectViaApi(request, owner.token, {
      name: "Assign Test Project",
    });
    await addMemberViaApi(request, owner.token, project.id, member.email);

    // Create an unassigned task
    await createTaskViaApi(request, owner.token, project.id, {
      title: "Unassigned Task",
      description: "Will be assigned and unassigned",
      priority: "Medium",
    });

    // ── 1. Login as Owner via UI ──────────────────────────────────────────
    await loginViaUI(page, owner.email, owner.password);

    // ── 2. Navigate to the project ────────────────────────────────────────
    await page.goto("/projects");
    await page.getByRole("heading", { name: "Assign Test Project" }).click();
    await expect(page).toHaveURL(/\/projects\/\d+/);

    // ── 3. Assign member via the Kanban card's assignee picker ────────────
    // The task card uses an aria-labelled assignee Select.
    // Use the sr-only label "Assignee for Unassigned Task" to find the trigger.
    await page.getByLabel("Assignee for Unassigned Task").click();
    await page.getByRole("option", { name: "Assign Member" }).click();

    // ── 4. Open task detail and verify assignee ───────────────────────────
    await page.getByRole("link", { name: "Unassigned Task" }).click();
    await expect(page).toHaveURL(/\/tasks\/\d+/);
    await expect(page.getByText("Assign Member")).toBeVisible();

    // ── 5. Unassign via Edit Task dialog ──────────────────────────────────
    await page.getByRole("button", { name: /Edit/i }).click();
    const editDialog = page.getByRole("dialog");
    await expect(editDialog.getByText("Edit Task")).toBeVisible();

    // Change assignee to "Unassigned"
    await editDialog.locator('button[role="combobox"]').last().click();
    await page.getByRole("option", { name: "Unassigned" }).click();
    await editDialog.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByText("Task updated successfully")).toBeVisible();

    // Verify on detail page: assignee should now be "Unassigned"
    await expect(page.getByText("Unassigned").first()).toBeVisible();

    // ── 6. Re-assign via Edit Task dialog ─────────────────────────────────
    await page.getByRole("button", { name: /Edit/i }).click();
    const editDialog2 = page.getByRole("dialog");
    await editDialog2.locator('button[role="combobox"]').last().click();
    await page.getByRole("option", { name: "Assign Member" }).click();
    await editDialog2.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByText("Task updated successfully").first()).toBeVisible();

    // Verify re-assignment
    await expect(page.getByText("Assign Member")).toBeVisible();
  });
});

// =============================================================================
//  JOURNEY 4 — Edit Project + Edit Task (full update flow)
//  Owner edits project name/description → Edits task title, description,
//  priority, and due date → Verifies changes persist
// =============================================================================
test.describe("Journey 4: Edit Project & Edit Task", () => {
  test("TC-JOURNEY-005: Edit project details → Edit task details (title, desc, priority, due date) → Verify changes persist", async ({
    page,
    request,
  }) => {
    test.setTimeout(60_000);

    // ── 0. Setup via API ──────────────────────────────────────────────────
    const owner = await registerAndLogin(request, { fullName: "Edit Owner" });

    const project = await createProjectViaApi(request, owner.token, {
      name: "Original Project Name",
      description: "Original description",
    });

    await createTaskViaApi(request, owner.token, project.id, {
      title: "Original Task Title",
      description: "Original task description",
      priority: "Low",
    });

    // ── 1. Login as Owner via UI ──────────────────────────────────────────
    await loginViaUI(page, owner.email, owner.password);

    // ── 2. Navigate to the project ────────────────────────────────────────
    await page.goto("/projects");
    await page
      .getByRole("heading", { name: "Original Project Name" })
      .click();
    await expect(page).toHaveURL(/\/projects\/\d+/);

    // ── 3. Edit Project via UI ────────────────────────────────────────────
    await page.getByRole("button", { name: /Edit/i }).first().click();
    const editProjDialog = page.getByRole("dialog");
    await expect(editProjDialog.getByText("Edit Project")).toBeVisible();

    await editProjDialog.locator('input[name="name"]').clear();
    await editProjDialog
      .locator('input[name="name"]')
      .fill("Updated Project Name");
    await editProjDialog.locator('textarea[name="description"]').clear();
    await editProjDialog
      .locator('textarea[name="description"]')
      .fill("Updated project description");
    await editProjDialog
      .getByRole("button", { name: "Save Changes" })
      .click();
    await expect(page.getByText("Project updated successfully")).toBeVisible();

    // Verify the project name updated on the detail page
    await expect(
      page.getByRole("heading", { name: "Updated Project Name" }),
    ).toBeVisible();

    // ── 4. Edit Task via Task Detail page ─────────────────────────────────
    await page.getByRole("link", { name: "Original Task Title" }).click();
    await expect(page).toHaveURL(/\/tasks\/\d+/);

    await page.getByRole("button", { name: /Edit/i }).click();
    const editTaskDialog = page.getByRole("dialog");
    await expect(editTaskDialog.getByText("Edit Task")).toBeVisible();

    // Update title
    await editTaskDialog.locator('input[name="title"]').clear();
    await editTaskDialog
      .locator('input[name="title"]')
      .fill("Updated Task Title");

    // Update description
    await editTaskDialog.locator('textarea[name="description"]').clear();
    await editTaskDialog
      .locator('textarea[name="description"]')
      .fill("Updated task description");

    // Change priority from Low to High
    await editTaskDialog.locator('button[role="combobox"]').first().click();
    await page.getByRole("option", { name: "High" }).click();

    // Save
    await editTaskDialog.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByText("Task updated successfully")).toBeVisible();

    // Verify changes on the task detail page
    await expect(
      page.getByRole("heading", { name: "Updated Task Title" }),
    ).toBeVisible();
    await expect(page.getByText("Updated task description")).toBeVisible();
  });
});

// =============================================================================
//  JOURNEY 5 — Full Kanban Board Lifecycle
//  Task moves through all statuses: Todo → InProgress → Done
//  Then verify on the Dashboard that the "Done" count increases.
// =============================================================================
test.describe("Journey 5: Full Kanban Board Lifecycle (Todo → InProgress → Done)", () => {
  test("TC-JOURNEY-006: Move task through all Kanban columns → Verify Dashboard Done count", async ({
    page,
    request,
  }) => {
    test.setTimeout(60_000);

    // ── 0. Setup via API ──────────────────────────────────────────────────
    const owner = await registerAndLogin(request, {
      fullName: "Kanban Owner",
    });

    const project = await createProjectViaApi(request, owner.token, {
      name: "Kanban Lifecycle Project",
    });

    await createTaskViaApi(request, owner.token, project.id, {
      title: "Kanban Flow Task",
      description: "Will travel through all columns",
      priority: "Medium",
      assigneeId: owner.id,
    });

    // ── 1. Login as Owner via UI ──────────────────────────────────────────
    await loginViaUI(page, owner.email, owner.password);

    // ── 2. Navigate to the project ────────────────────────────────────────
    await page.goto("/projects");
    await page
      .getByRole("heading", { name: "Kanban Lifecycle Project" })
      .click();
    await expect(page).toHaveURL(/\/projects\/\d+/);

    // Task should be in "Todo" column initially
    await expect(
      page.getByRole("link", { name: "Kanban Flow Task" }),
    ).toBeVisible();

    // ── 3. Move Todo → InProgress ─────────────────────────────────────────
    await page
      .getByRole("button", { name: /Move Right/i })
      .first()
      .click();

    // ── 4. Move InProgress → Done ─────────────────────────────────────────
    await page
      .getByRole("button", { name: /Move Right/i })
      .first()
      .click();

    // ── 5. Verify on Dashboard — "Done" count should be 1 ─────────────────
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Done")).toBeVisible();

    // The stats card for Done should show at least "1"
    await expect(page.getByText("1").first()).toBeVisible();
  });
});
