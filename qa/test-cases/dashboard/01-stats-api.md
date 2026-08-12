# QA Test Cases - Dashboard Stats Endpoint

## Endpoint

`GET /api/dashboard/my-stats — Get current user task statistics`

> **Tested on:** 2026-07-31 — Branch `bao/fix-210-back-to-project-nav`
> **Backend handler:** `GetMyStatsQuery.cs` — calculates status counts, overdue count, and upcoming deadlines (within 3 days)

---

## TC-DASHBOARD-API-001: Get my stats successfully (Happy path)

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-DASHBOARD-API-001 |
| **Type** | Positive |
| **Technique** | Happy path |
| **Precondition** | User is logged in; has assigned tasks across Todo, InProgress, Done statuses |
| **Test Data** | Authorization: `Bearer <valid-token>` |
| **Test Steps** | 1. Send GET request to `/api/dashboard/my-stats` with valid Bearer token <br> 2. Verify response HTTP status code and JSON payload structure |
| **Expected Result** | 1. Status 200 OK <br> 2. JSON response contains `tasksByStatus` (todo, inProgress, done), `upcomingDeadlines` array, `totalAssigned`, and `overdueCount` |
| **Actual Result** | 1. Response returned status 200 OK <br> 2. Returned valid `DashboardStatsDto` JSON payload |
| **Status** | ✅Pass |
| **Bug link** | — |

---

## TC-DASHBOARD-API-002: User has no assigned tasks (Zero stats)

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-DASHBOARD-API-002 |
| **Type** | Positive |
| **Technique** | Boundary value / Empty data |
| **Precondition** | User is logged in; has 0 assigned tasks across all projects |
| **Test Data** | Authorization: `Bearer <user-with-no-tasks-token>` |
| **Test Steps** | 1. Send GET request to `/api/dashboard/my-stats` <br> 2. Verify response data when task count is zero |
| **Expected Result** | 1. Status 200 OK <br> 2. `tasksByStatus` has todo: 0, inProgress: 0, done: 0 <br> 3. `totalAssigned`: 0, `overdueCount`: 0, `upcomingDeadlines`: `[]` |
| **Actual Result** | 1. Response returned status 200 OK <br> 2. All status counts equal 0 and `upcomingDeadlines` is empty array |
| **Status** | ✅Pass |
| **Bug link** | — |

---

## TC-DASHBOARD-API-003: Overdue tasks counted separately from upcoming deadlines

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-DASHBOARD-API-003 |
| **Type** | Positive |
| **Technique** | Business logic / Data partitioning |
| **Precondition** | User has open tasks with `dueDate < now` (overdue) and tasks with `now <= dueDate <= now + 3 days` |
| **Test Data** | Authorization: `Bearer <valid-token>` |
| **Test Steps** | 1. Send GET request to `/api/dashboard/my-stats` <br> 2. Check `overdueCount` and `upcomingDeadlines` array contents |
| **Expected Result** | 1. Status 200 OK <br> 2. `overdueCount` correctly reflects open past-due tasks <br> 3. `upcomingDeadlines` array contains ONLY non-overdue tasks due within 3 days |
| **Actual Result** | 1. Response returned status 200 OK <br> 2. Overdue tasks increment `overdueCount` and do not crowd out `upcomingDeadlines` |
| **Status** | ✅Pass |
| **Bug link** | — |

---

## TC-DASHBOARD-API-004: Upcoming deadlines capped at 20 items and sorted chronologically

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-DASHBOARD-API-004 |
| **Type** | Positive |
| **Technique** | Boundary value / Sorting & Truncation |
| **Precondition** | User has 25+ open tasks assigned due within the next 3 days |
| **Test Data** | Authorization: `Bearer <valid-token>` |
| **Test Steps** | 1. Send GET request to `/api/dashboard/my-stats` <br> 2. Check `upcomingDeadlines` array length and ordering |
| **Expected Result** | 1. Status 200 OK <br> 2. `upcomingDeadlines` length is capped at maximum 20 items <br> 3. Items are sorted by `dueDate` ascending, then by Priority descending (High -> Medium -> Low) |
| **Actual Result** | 1. Response returned status 200 OK <br> 2. `upcomingDeadlines` array length is exactly 20 and correctly sorted |
| **Status** | ✅Pass |
| **Bug link** | — |

---

## TC-DASHBOARD-API-005: Completed tasks (Done) excluded from overdue count and upcoming deadlines

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-DASHBOARD-API-005 |
| **Type** | Positive |
| **Technique** | Filter / State exclusion |
| **Precondition** | User has tasks marked as `Status: Done` whose due date was in the past or within 3 days |
| **Test Data** | Authorization: `Bearer <valid-token>` |
| **Test Steps** | 1. Send GET request to `/api/dashboard/my-stats` <br> 2. Verify completed tasks are excluded from overdue and upcoming lists |
| **Expected Result** | 1. Status 200 OK <br> 2. `tasksByStatus.done` increments for completed tasks <br> 3. `overdueCount` and `upcomingDeadlines` exclude tasks with `Status: Done` |
| **Actual Result** | 1. Response returned status 200 OK <br> 2. Completed tasks only count towards `done` status and `totalAssigned` |
| **Status** | ✅Pass |
| **Bug link** | — |

---

## TC-DASHBOARD-API-006: Unauthorized access without Bearer token

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-DASHBOARD-API-006 |
| **Type** | Negative |
| **Technique** | Security / Authentication |
| **Precondition** | Endpoint requires authentication |
| **Test Data** | No `Authorization` header |
| **Test Steps** | 1. Send GET request to `/api/dashboard/my-stats` without Bearer token <br> 2. Check HTTP response status |
| **Expected Result** | 1. Status 401 Unauthorized |
| **Actual Result** | 1. Response returned status
```json
{
  "error": "Unauthorized. Please provide a valid Bearer token."
}
``` 
 |
| **Status** | ✅Pass |
| **Bug link** | — |

---

## TC-DASHBOARD-API-007: Query urgent & overdue tasks via GET /api/dashboard/my-tasks

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-DASHBOARD-API-007 |
| **Type** | Positive / Technical Finding |
| **Technique** | Boundary & Query Logic Verification |
| **Precondition** | User is logged in; has overdue tasks (`DueDate < now`) and upcoming tasks (`now <= DueDate <= 3 days`) |
| **Test Data** | `GET /api/dashboard/my-tasks?isUrgentOnly=true` |
| **Test Steps** | 1. Send GET request to `/api/dashboard/my-tasks?isUrgentOnly=true` <br> 2. Compare returned tasks against tasks with `isUrgentOnly=false` |
| **Expected Result** | 1. API returns tasks with `DueDate <= now + 3 days` (includes overdue + upcoming within 3 days) <br> 2. Excludes tasks with `DueDate == null` or `DueDate > 3 days` <br> 3. Overdue tasks appear at the top of the list due to `.ThenBy(t => t.DueDate)` sorting |
| **Actual Result** | 1. `isUrgentOnly=true` filters tasks due `<= 3 days` (both overdue and near-future tasks), excluding null/far-future dates <br> 2. Overdue tasks are sorted to the top. **Note:** API does NOT have an `isOverdueOnly` filter exclusively for past-due tasks. |
| **Status** | ✅Pass |
| **Bug link** | — |
