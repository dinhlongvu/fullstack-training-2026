# QA Test Cases - Dashboard UI Page

## Component / Page

`DashboardPage.tsx — Render user task statistics, stats cards & upcoming deadlines widget`


## TC-DASHBOARD-UI-001: Renders dashboard stats cards and upcoming deadlines (Happy path)

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-DASHBOARD-UI-001 |
| **Type** | Positive |
| **Technique** | Happy path / UI Rendering |
| **Precondition** | User is logged in; `GET /api/dashboard/my-stats` returns stats with `totalAssigned > 0` |
| **Test Data** | User account with tasks in Todo, In Progress, Done, and Upcoming Deadlines |
| **Test Steps** | 1. Navigate to `/dashboard` <br> 2. Inspect rendered page layout and stats cards <br> 3. Inspect `UpcomingDeadlines` widget |
| **Expected Result** | 1. Renders "Dashboard" heading <br> 2. Displays 4 stats cards: Total Tasks, Todo, In Progress, Done with exact numbers <br> 3. Renders `UpcomingDeadlines` list displaying task titles, project names, and due labels |
| **Actual Result** | 1. Heading "Dashboard" is visible <br> 2. All 4 stats cards render with correct icons and counts <br> 3. `UpcomingDeadlines` widget lists tasks with relative due labels ("Today", "Tomorrow", etc.) |
| **Status** | ✅Pass |
| **Bug link** | — |

---

## TC-DASHBOARD-UI-002: Loading state displays skeleton cards

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-DASHBOARD-UI-002 |
| **Type** | Positive |
| **Technique** | UI Loading State / Accessibility |
| **Precondition** | `GET /api/dashboard/my-stats` query is pending (`isLoading === true`) |
| **Test Data** | Network throttling set to Slow 3G or paused response |
| **Test Steps** | 1. Navigate to `/dashboard` while API request is in-flight <br> 2. Inspect loading indicators and DOM markup |
| **Expected Result** | 1. Renders `DashboardStatsSkeleton` component with skeleton card placeholders <br> 2. Container includes ARIA announcements (`role="status"`, `aria-busy="true"`, `aria-live="polite"`, `<span className="sr-only">Loading dashboard...</span>`) |
| **Actual Result** | 1. Skeleton placeholders render cleanly <br> 2. ARIA status role announces loading state to screen readers |
| **Status** | ✅Pass |
| **Bug link** | — |

---

## TC-DASHBOARD-UI-003: Empty state when user has no assigned tasks

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-DASHBOARD-UI-003 |
| **Type** | Positive |
| **Technique** | UI Empty State |
| **Precondition** | User is logged in; `GET /api/dashboard/my-stats` returns `totalAssigned: 0` |
| **Test Data** | Newly registered user account with 0 assigned tasks |
| **Test Steps** | 1. Navigate to `/dashboard` <br> 2. Inspect rendered empty state container |
| **Expected Result** | 1. Stats cards and deadlines widget are NOT rendered <br> 2. Renders empty state block with ListTodo icon and message: `"No tasks yet — create your first project!"` |
| **Actual Result** | 1. Page displays centered empty state container with icon and exact empty message |
| **Status** | ✅Pass |
| **Bug link** | — |

---

## TC-DASHBOARD-UI-004: Error state handling on API failure

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-DASHBOARD-UI-004 |
| **Type** | Negative |
| **Technique** | UI Error State / Exception handling |
| **Precondition** | `GET /api/dashboard/my-stats` request fails (500 Internal Server Error or network error) |
| **Test Data** | Mocked network error or 500 API response |
| **Test Steps** | 1. Trigger network error / block `/api/dashboard/my-stats` <br> 2. Navigate to `/dashboard` |
| **Expected Result** | 1. Does NOT crash page or throw unhandled React exception <br> 2. Renders error message: `"Failed to load dashboard: <error.message>"` in destructive text styling |
| **Actual Result** | 1. Page renders gracefully <br> 2. Displays red text error message `"Something went wrong Couldn't load this project. Check your connection and try again.` |
| **Status** | ✅Pass |
| **Bug link** | — |

---

## TC-DASHBOARD-UI-005: Navigation from upcoming deadline item to Task Detail page

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-DASHBOARD-UI-005 |
| **Type** | Positive |
| **Technique** | Navigation / Router integration |
| **Precondition** | `UpcomingDeadlines` widget contains at least one task item |
| **Test Data** | Click "View" link next to a task (e.g. Task ID: 15) |
| **Test Steps** | 1. Open `/dashboard` <br> 2. Click "View" link on an upcoming task item <br> 3. Observe active URL route and loaded page |
| **Expected Result** | 1. Router navigates smoothly to `/tasks/15` <br> 2. `TaskDetailPage` renders the corresponding task detail |
| **Actual Result** | 1. Router updates URL to `/tasks/15` <br> 2. Task detail page loads successfully |
| **Status** | ✅Pass |
| **Bug link** | — |

## TC-DASHBOARD-UI-006: Lack of "View All / Filter" action on Overdue Tasks summary banner

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-DASHBOARD-UI-006 |
| **Type** | Negative / Usability |
| **Technique** | UX Defect / Missing Feature |
| **Precondition** | User has open overdue tasks (overdueCount > 0) |
| **Test Data** | Account with 5 overdue tasks |
| **Test Steps** | 1. Log in and navigate to /dashboard |
2. Observe the Overdue Tasks warning banner ("5 overdue tasks") |
3. Attempt to click or interact with the banner to view/filter the overdue tasks |
| **Expected Result** | 1. Banner displays overdue task count |
2. Banner should provide an interactive button/link (e.g., "View overdue tasks" or "Filter overdue") allowing the user to view or navigate to the list of overdue tasks |
| **Actual Result** | 1. Banner renders as a static <div> element |
2. Banner has no link or click action; user cannot inspect or view which tasks are overdue from the Dashboard |
| **Status** | ❌ Fail (UX Defect) |
| **Bug link** | [BUG-DASHBOARD-OVERDUE-LINK](https://github.com/dinhlongvu/fullstack-training-2026/issues/231) |
