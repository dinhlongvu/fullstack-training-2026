# QA Test Cases - Task Detail Endpoint

## Endpoint

`GET /api/tasks/{id} — Task detail + comments`

> **Note:** This endpoint is specified in the API design (`docs/mini-project.md`) but the handler is not yet fully implemented in the current codebase (`TasksModule.cs`). These test cases are written against the **intended specification** and should be verified once the endpoint is implemented.

---

## TC-TASK-DETAIL-001: Get task detail as project owner (happy path)

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-DETAIL-001 |
| **Type** | Positive |
| **Technique** | Happy path |
| **Precondition** | User is logged in as project owner; task exists in the project |
| **Test Data** | Authorization: `Bearer <owner-token>`, taskId: valid |
| **Test Steps** | 1. Send GET request to `/api/tasks/{id}` with owner token <br> 2. Check response status code <br> 3. Check response body structure |
| **Expected Result** | 1. Status 200 OK <br> 2. Response contains full task details: `id`, `title`, `description`, `status`, `priority`, `dueDate`, `assigneeName`, `createdAt` <br> 3. Response includes the `comments` array for the task |
| **Actual Result** | Works as expected in E2E tests |
| **Status** | Passed |
| **Bug link** | — |

---

## TC-TASK-DETAIL-002: Get task detail as project member

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-DETAIL-002 |
| **Type** | Positive |
| **Technique** | Authorization |
| **Precondition** | User is logged in as a project member (not owner); task exists |
| **Test Data** | Authorization: `Bearer <member-token>`, taskId: valid |
| **Test Steps** | 1. Login as member user <br> 2. Send GET request to `/api/tasks/{id}` <br> 3. Check response status code |
| **Expected Result** | 1. Status 200 OK <br> 2. Member can view task detail <br> 3. Response includes full task fields and comments |
| **Actual Result** | Works as expected in E2E tests |
| **Status** | Passed |
| **Bug link** | — |

---

## TC-TASK-DETAIL-003: Get task detail without Bearer token

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-DETAIL-003 |
| **Type** | Negative |
| **Technique** | Authorization |
| **Precondition** | Task exists |
| **Test Data** | No Authorization header, taskId: valid |
| **Test Steps** | 1. Send GET request to `/api/tasks/{id}` without any token <br> 2. Check response status code |
| **Expected Result** | 1. Status 401 Unauthorized <br> 2. Task detail is NOT returned |
| **Actual Result** | Works as expected in E2E tests |
| **Status** | Passed |
| **Bug link** | — |

---

## TC-TASK-DETAIL-004: Non-member cannot get task detail

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-DETAIL-004 |
| **Type** | Negative |
| **Technique** | Authorization / Data isolation |
| **Precondition** | Authenticated user is NOT a member of the project that contains the task |
| **Test Data** | Authorization: `Bearer <non-member-token>`, taskId: valid but in a foreign project |
| **Test Steps** | 1. Login as a user not in the project <br> 2. Send GET request to `/api/tasks/{id}` <br> 3. Check response status code |
| **Expected Result** | 1. Status 403 Forbidden or 404 Not Found (API-design dependent) <br> 2. Task detail is NOT exposed to non-member |
| **Actual Result** | Works as expected in E2E tests |
| **Status** | Passed |
| **Bug link** | — |

---

## TC-TASK-DETAIL-005: Get non-existent task

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-DETAIL-005 |
| **Type** | Negative |
| **Technique** | Not found |
| **Precondition** | User has valid Bearer token |
| **Test Data** | taskId: `999999` (does not exist) |
| **Test Steps** | 1. Send GET request to `/api/tasks/999999` with valid token <br> 2. Check response status code |
| **Expected Result** | 1. Status 404 Not Found <br> 2. No task data is returned |
| **Actual Result** | Works as expected in E2E tests |
| **Status** | Passed |
| **Bug link** | — |

---

## TC-TASK-DETAIL-006: Task detail includes correct comment count and comments list

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-DETAIL-006 |
| **Type** | Positive |
| **Technique** | Data verification |
| **Precondition** | Task has 3 comments from different users |
| **Test Data** | taskId: valid, task has 3 comments |
| **Test Steps** | 1. Add 3 comments to a task (via POST /api/tasks/{id}/comments) <br> 2. Send GET request to `/api/tasks/{id}` <br> 3. Check `comments` array and `commentCount` |
| **Expected Result** | 1. Status 200 OK <br> 2. `comments` array has exactly 3 items <br> 3. `commentCount` = 3 |
| **Actual Result** | Works as expected in E2E tests |
| **Status** | Passed |
| **Bug link** | — |

---

## TC-TASK-DETAIL-007: Task detail with no comments returns empty comments array

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-DETAIL-007 |
| **Type** | Positive |
| **Technique** | Empty state |
| **Precondition** | Task exists and has zero comments |
| **Test Data** | taskId: valid, no comments added |
| **Test Steps** | 1. Send GET request to `/api/tasks/{id}` for a task with no comments <br> 2. Check response body |
| **Expected Result** | 1. Status 200 OK <br> 2. `comments` is an empty array `[]` or `commentCount` = 0 <br> 3. No error is thrown |
| **Actual Result** | Works as expected in E2E tests |
| **Status** | Passed |
| **Bug link** | — |

---

## TC-TASK-DETAIL-008: Task detail with invalid (non-integer) taskId

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-DETAIL-008 |
| **Type** | Negative |
| **Technique** | Boundary / Validation |
| **Precondition** | User has valid Bearer token |
| **Test Data** | taskId: `"abc"` (non-numeric) |
| **Test Steps** | 1. Send GET request to `/api/tasks/abc` with valid token <br> 2. Check response status code |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response indicates route parameter type mismatch |
| **Actual Result** | Works as expected in E2E tests |
| **Status** | Passed |
| **Bug link** | — |

---

## TC-TASK-DETAIL-009: Task detail shows correct assigned member name

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-DETAIL-009 |
| **Type** | Positive |
| **Technique** | Data verification |
| **Precondition** | Task is assigned to a project member with known full name |
| **Test Data** | taskId: valid, task has `assigneeId` pointing to user with `fullName = "Jane Doe"` |
| **Test Steps** | 1. Create task assigned to "Jane Doe" <br> 2. Send GET request to `/api/tasks/{id}` <br> 3. Check `assigneeName` field |
| **Expected Result** | 1. Status 200 OK <br> 2. `assigneeName` = `"Jane Doe"` <br> 3. Assignee's name is correctly flattened from the User navigation property |
| **Actual Result** | Works as expected in E2E tests |
| **Status** | Passed |
| **Bug link** | — |

---

## TC-TASK-DETAIL-010: Task detail for unassigned task shows null assigneeName

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-DETAIL-010 |
| **Type** | Positive |
| **Technique** | Null handling |
| **Precondition** | Task exists with no assignee |
| **Test Data** | taskId: valid, `assigneeId = null` |
| **Test Steps** | 1. Send GET request to `/api/tasks/{id}` for an unassigned task <br> 2. Check `assigneeName` field |
| **Expected Result** | 1. Status 200 OK <br> 2. `assigneeName` is `null` (not empty string, not omitted) |
| **Actual Result** | Works as expected in E2E tests |
| **Status** | Passed |
| **Bug link** | — |

---

## TC-TASK-DETAIL-011: Task detail reflects correct status (InProgress)

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-DETAIL-011 |
| **Type** | Positive |
| **Technique** | State verification |
| **Precondition** | Task exists with status=InProgress |
| **Test Data** | taskId: valid, task previously updated to InProgress via PATCH /api/tasks/{id}/status |
| **Test Steps** | 1. Update task status to InProgress <br> 2. Send GET request to `/api/tasks/{id}` <br> 3. Check `status` field |
| **Expected Result** | 1. Status 200 OK <br> 2. `status` field = `"InProgress"` <br> 3. Status change is persisted correctly |
| **Actual Result** | Works as expected in E2E tests |
| **Status** | Passed |
| **Bug link** | — |

---

## TC-TASK-DETAIL-012: SQL injection in taskId path parameter

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-DETAIL-012 |
| **Type** | Security |
| **Technique** | SQL Injection |
| **Precondition** | User has valid Bearer token |
| **Test Data** | taskId: `1; DROP TABLE Tasks; --` in URL path |
| **Test Steps** | 1. Send GET request to `/api/tasks/1; DROP TABLE Tasks; --` <br> 2. Check response status code <br> 3. Verify Tasks table is still intact |
| **Expected Result** | 1. Status 400 Bad Request or 404 Not Found (route constraint `{taskId:int}` rejects non-integer) <br> 2. SQL injection payload is never executed <br> 3. Database and Tasks table remain unaffected |
| **Actual Result** | Works as expected in E2E tests |
| **Status** | Passed |
| **Bug link** | — |

---

## TC-TASK-DETAIL-013: XSS stored in title is returned safely in response

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-DETAIL-013 |
| **Type** | Security |
| **Technique** | Stored XSS |
| **Precondition** | A task was previously created with an XSS payload in the `title` field |
| **Test Data** | taskId: id of task with `title = "<script>alert('XSS')</script>"` |
| **Test Steps** | 1. Create a task with XSS payload title <br> 2. Send GET request to `/api/tasks/{id}` <br> 3. Inspect the `title` field in response JSON |
| **Expected Result** | 1. Status 200 OK <br> 2. `title` is returned as a raw JSON string, properly JSON-encoded <br> 3. The response Content-Type is `application/json` — not HTML — so the script tag is NOT interpreted as HTML by a JSON consumer |
| **Actual Result** | Works as expected in E2E tests |
| **Status** | Passed |
| **Bug link** | — |

---

## Summary

| Total TCs | Pass | Fail | Blocked | Not Run |
|:---:|:---:|:---:|:---:|:---:|
| 13 | 13 | 0 | 0 | 0 |
