import { test, expect, type Page } from "@playwright/test";
import {
  API_BASE,
  registerAndLogin,
  createProjectViaApi,
  createTaskViaApi,
  updateTaskViaApi,
  updateTaskStatusViaApi,
  type RegisteredUser,
} from "../utils/api-helpers";

// ─── Constants ────────────────────────────────────────────────────────────────

const DASHBOARD_URL = "/dashboard";
const MY_STATS_API = "**/api/dashboard/my-stats";

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

/** Inject the JWT token into localStorage so the app treats us as authenticated. */
async function loginViaLocalStorage(page: Page, token: string, refreshToken: string = "dummy-refresh-token") {
  await page.goto("/login");
  await page.evaluate(
    ({ t, rt }) => {
      localStorage.setItem("taskboard_token", t);
      localStorage.setItem("taskboard_refresh_token", rt);
    },
    { t: token, rt: refreshToken },
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe("Dashboard UI — TC-DASHBOARD-UI", () => {
  // ─── TC-DASHBOARD-UI-001 ───────────────────────────────────────────────────
  test("TC-DASHBOARD-UI-001: Renders dashboard stats cards and upcoming deadlines (Happy path)", async ({
    page,
    request,
  }) => {
    // Setup: user with tasks in multiple statuses + upcoming deadline
    const user = await registerAndLogin(request);
    const project = await createProjectViaApi(request, user.token, {
      name: `UI-001-${Date.now()}`,
    });

    // 1 Todo with upcoming due date
    await createTaskViaApi(request, user.token, project.id, {
      title: "UI Todo Task",
      dueDate: futureDateISO(1),
      assigneeId: user.id,
    });

    // 1 InProgress
    const inProgressTask = await createTaskViaApi(request, user.token, project.id, {
      title: "UI InProgress Task",
      assigneeId: user.id,
    });
    await updateTaskStatusViaApi(request, user.token, inProgressTask.id, "InProgress");

    // 1 Done
    const doneTask = await createTaskViaApi(request, user.token, project.id, {
      title: "UI Done Task",
      assigneeId: user.id,
    });
    await updateTaskStatusViaApi(request, user.token, doneTask.id, "Done");

    // Act: navigate to dashboard
    await loginViaLocalStorage(page, user.token);
    await page.goto(DASHBOARD_URL);

    // Wait for stats to load
    await page.waitForSelector("text=Dashboard");

    // Assert: heading
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    // Assert: 4 stats cards (Total Tasks, Todo, In Progress, Done)
    await expect(page.getByText("Total Tasks")).toBeVisible();
    await expect(page.getByText("Todo", { exact: true })).toBeVisible();
    await expect(page.getByText("In Progress")).toBeVisible();
    await expect(page.getByText("Done", { exact: true })).toBeVisible();

    // Assert: Upcoming Deadlines widget
    await expect(page.getByText("Upcoming Deadlines")).toBeVisible();

    // The upcoming task should appear in the list
    await expect(page.getByText("UI Todo Task")).toBeVisible();
  });

  // ─── TC-DASHBOARD-UI-002 ───────────────────────────────────────────────────
  test("TC-DASHBOARD-UI-002: Loading state displays skeleton cards", async ({
    page,
    request,
  }) => {
    const user = await registerAndLogin(request);
    await loginViaLocalStorage(page, user.token);

    // We need to delay the my-stats API response long enough to observe the
    // skeleton. Use a promise that we resolve manually after assertions pass.
    let resolveRoute!: () => void;
    const routeBarrier = new Promise<void>((r) => {
      resolveRoute = r;
    });

    await page.route(MY_STATS_API, async (route) => {
      // Hold the response until we've verified the skeleton
      await routeBarrier;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          tasksByStatus: { todo: 0, inProgress: 0, done: 0 },
          upcomingDeadlines: [],
          totalAssigned: 0,
          overdueCount: 0,
        }),
      });
    });

    // Navigate — the API will hang until we release it
    await page.goto(DASHBOARD_URL);

    // The DashboardStatsSkeleton renders <div class="animate-pulse ..."> elements.
    const skeletonCards = page.locator('.animate-pulse');
    await expect(skeletonCards.first()).toBeVisible({ timeout: 5000 });

    // Release the route so the page can finish loading
    resolveRoute();
  });

  // ─── TC-DASHBOARD-UI-003 ───────────────────────────────────────────────────
  test("TC-DASHBOARD-UI-003: Empty state when user has no assigned tasks", async ({
    page,
    request,
  }) => {
    // Setup: fresh user with 0 tasks
    const user = await registerAndLogin(request);
    await loginViaLocalStorage(page, user.token);

    // Act
    await page.goto(DASHBOARD_URL);

    // Assert: empty state message
    await expect(
      page.getByText("No tasks yet — create your first project!"),
    ).toBeVisible();

    // Assert: stats cards should NOT be rendered
    await expect(page.getByText("Total Tasks")).not.toBeVisible();
  });

  // ─── TC-DASHBOARD-UI-004 ───────────────────────────────────────────────────
  test("TC-DASHBOARD-UI-004: Error state handling on API failure", async ({
    page,
    request,
  }) => {
    const user = await registerAndLogin(request);
    await loginViaLocalStorage(page, user.token);

    // Mock the API to return 500
    await page.route(MY_STATS_API, (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Internal Server Error" }),
      }),
    );

    // Act
    await page.goto(DASHBOARD_URL);

    // Assert: error message is shown with the destructive style
    await expect(
      page.getByText(/Failed to load dashboard/),
    ).toBeVisible();

    // Assert: page did NOT crash — heading should still be visible
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  // ─── TC-DASHBOARD-UI-005 ───────────────────────────────────────────────────
  test("TC-DASHBOARD-UI-005: Navigation from upcoming deadline item to Task Detail page", async ({
    page,
    request,
  }) => {
    // Setup: user with 1 upcoming task
    const user = await registerAndLogin(request);
    const project = await createProjectViaApi(request, user.token, {
      name: `UI-005-${Date.now()}`,
    });

    const task = await createTaskViaApi(request, user.token, project.id, {
      title: "Navigate-to-detail",
      dueDate: futureDateISO(1),
      assigneeId: user.id,
    });

    // Login and go to dashboard
    await loginViaLocalStorage(page, user.token);
    await page.goto(DASHBOARD_URL);

    // Wait for the task to appear in upcoming deadlines
    await expect(page.getByText("Navigate-to-detail")).toBeVisible();

    // Click the "View" link next to it
    const viewLink = page.getByRole("link", { name: "View" }).first();
    await viewLink.click();

    // Assert: navigated to task detail page
    await expect(page).toHaveURL(new RegExp(`/tasks/${task.id}`));
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // EDGE CASES
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── EDGE-UI-001 ──────────────────────────────────────────────────────────
  test("EDGE-UI-001: 'No upcoming deadlines' widget displayed when tasks are due beyond 3 days", async ({
    page,
    request,
  }) => {
    // Setup: user with a task due in 10 days (beyond 3-day window)
    const user = await registerAndLogin(request);
    const project = await createProjectViaApi(request, user.token, {
      name: `EdgeUI-001-${Date.now()}`,
    });

    await createTaskViaApi(request, user.token, project.id, {
      title: "Far-future-task",
      dueDate: futureDateISO(10),
      assigneeId: user.id,
    });

    await loginViaLocalStorage(page, user.token);
    await page.goto(DASHBOARD_URL);

    // Wait for dashboard to load (Total Tasks card should show 1)
    await expect(page.getByText("Total Tasks")).toBeVisible();

    // "No upcoming deadlines" message should appear since task is due beyond 3 days
    await expect(page.getByText(/No upcoming deadlines/)).toBeVisible();
  });

  // ─── EDGE-UI-002 ──────────────────────────────────────────────────────────
  test("EDGE-UI-002: Stats card values match exact numbers from API", async ({
    page,
    request,
  }) => {
    const user = await registerAndLogin(request);
    const project = await createProjectViaApi(request, user.token, {
      name: `EdgeUI-002-${Date.now()}`,
    });

    // Create specific counts: 2 Todo, 1 InProgress, 1 Done = 4 total
    await createTaskViaApi(request, user.token, project.id, {
      title: "Count-Todo-1",
      assigneeId: user.id,
    });
    await createTaskViaApi(request, user.token, project.id, {
      title: "Count-Todo-2",
      assigneeId: user.id,
    });

    const ipTask = await createTaskViaApi(request, user.token, project.id, {
      title: "Count-IP",
      assigneeId: user.id,
    });
    await updateTaskStatusViaApi(request, user.token, ipTask.id, "InProgress");

    const doneTask = await createTaskViaApi(request, user.token, project.id, {
      title: "Count-Done",
      assigneeId: user.id,
    });
    await updateTaskStatusViaApi(request, user.token, doneTask.id, "Done");

    await loginViaLocalStorage(page, user.token);
    await page.goto(DASHBOARD_URL);

    // Wait for dashboard to fully load
    await expect(page.getByText("Total Tasks")).toBeVisible();

    // The stats card renders <p class="text-3xl font-bold">{value}</p> inside a card
    // Verify exact numbers appear as bold values inside respective cards
    // Total Tasks card should show "4"
    const totalCard = page.locator("text=Total Tasks").locator("xpath=ancestor::div[contains(@class,'rounded')]");
    await expect(totalCard.locator("p.text-3xl")).toHaveText("4");

    // Todo card should show "2"
    const todoCard = page.locator("text=Todo").first().locator("xpath=ancestor::div[contains(@class,'rounded')]");
    await expect(todoCard.locator("p.text-3xl")).toHaveText("2");

    // In Progress card should show "1"
    const ipCard = page.locator("text=In Progress").locator("xpath=ancestor::div[contains(@class,'rounded')]");
    await expect(ipCard.locator("p.text-3xl")).toHaveText("1");

    // Done card should show "1"
    const doneCard = page.locator("text=Done").first().locator("xpath=ancestor::div[contains(@class,'rounded')]");
    await expect(doneCard.locator("p.text-3xl")).toHaveText("1");
  });

  // ─── EDGE-UI-003 ──────────────────────────────────────────────────────────
  test("EDGE-UI-003: Upcoming deadlines show project names from multiple projects", async ({
    page,
    request,
  }) => {
    const user = await registerAndLogin(request);
    const projectAlpha = await createProjectViaApi(request, user.token, {
      name: `Alpha-${Date.now()}`,
    });
    const projectBeta = await createProjectViaApi(request, user.token, {
      name: `Beta-${Date.now()}`,
    });

    // Task in Alpha
    await createTaskViaApi(request, user.token, projectAlpha.id, {
      title: "Alpha-Deadline",
      dueDate: futureDateISO(1),
      assigneeId: user.id,
    });

    // Task in Beta
    await createTaskViaApi(request, user.token, projectBeta.id, {
      title: "Beta-Deadline",
      dueDate: futureDateISO(2),
      assigneeId: user.id,
    });

    await loginViaLocalStorage(page, user.token);
    await page.goto(DASHBOARD_URL);

    // Both tasks should appear in upcoming deadlines
    await expect(page.getByText("Alpha-Deadline")).toBeVisible();
    await expect(page.getByText("Beta-Deadline")).toBeVisible();

    // Project names should be resolved and shown
    await expect(page.getByText(projectAlpha.name)).toBeVisible();
    await expect(page.getByText(projectBeta.name)).toBeVisible();
  });

  // ─── EDGE-UI-004 ──────────────────────────────────────────────────────────
  test("EDGE-UI-004: Network timeout handled gracefully (does not crash)", async ({
    page,
    request,
  }) => {
    const user = await registerAndLogin(request);
    await loginViaLocalStorage(page, user.token);

    // Abort the request to simulate network failure
    await page.route(MY_STATS_API, (route) => route.abort("connectionfailed"));

    await page.goto(DASHBOARD_URL);

    // The page should show the error state, not crash
    await expect(page.getByText(/Failed to load dashboard/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });
});

