# QA Test Cases - Delete Task Endpoint

## Endpoint

`DELETE /api/tasks/{id} — Delete task`

> **Tested on:** 2026-07-08 — Branch `bao/task-147-delete-task`
> **Tool:** Playwright E2E (`--workers=1`) + Manual browser test
> **Backend handler:** `DeleteTaskHandler.cs` — checks project membership (owner + member can delete)

---

## TC-TASK-DELETE-001: Owner deletes task (happy path)

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-DELETE-001 |
| **Type** | Positive |
| **Technique** | Happy path |
| **Precondition** | User is logged in as project owner; task exists in the project |
| **Test Data** | Authorization: `Bearer <owner-token>`, taskId: valid |
| **Test Steps** | 1. Send DELETE request to `/api/tasks/{id}` with owner token <br> 2. Check response status code <br> 3. Send GET request to `/api/tasks/{id}` to verify deletion |
| **Expected Result** | 1. Status 204 No Content <br> 2. Task is removed from the database <br> 3. Subsequent GET returns 404 Not Found |
| **Actual Result** | 1. Response returned status 204 No Content <br> 2. Subsequent GET `/api/tasks/{id}` returned 404 Not Found — task confirmed deleted |
| **Status** | Pass |
| **Bug link** | — |

---

## TC-TASK-DELETE-002: Member deletes task

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-DELETE-002 |
| **Type** | Positive |
| **Technique** | Authorization |
| **Precondition** | User is a project member (not owner); task exists |
| **Test Data** | Authorization: `Bearer <member-token>`, taskId: valid |
| **Test Steps** | 1. Login as project member <br> 2. Send DELETE request to `/api/tasks/{id}` <br> 3. Check response status code |
| **Expected Result** | 1. Status 204 No Content (if members are allowed to delete) <br> OR Status 403 Forbidden (if only owner can delete) |
| **Actual Result** | 1. Response returned status 204 No Content — members ARE allowed to delete tasks <br> 2. Subsequent GET confirmed task is deleted (404) |
| **Status** | Pass |
| **Bug link** | — |

---

## TC-TASK-DELETE-003: Delete task without Bearer token

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-DELETE-003 |
| **Type** | Negative |
| **Technique** | Authorization |
| **Precondition** | Task exists |
| **Test Data** | No Authorization header, taskId: valid |
| **Test Steps** | 1. Send DELETE request to `/api/tasks/{id}` without any token <br> 2. Check response status code |
| **Expected Result** | 1. Status 401 Unauthorized <br> 2. Task is NOT deleted from the database |
| **Actual Result** | 1. Response returned status 401 Unauthorized <br> 2. Task remains in database (verified by subsequent GET returning 200) |
| **Status** | Pass |
| **Bug link** | — |

---

## TC-TASK-DELETE-004: Non-member cannot delete task

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-DELETE-004 |
| **Type** | Negative |
| **Technique** | Authorization / Data isolation |
| **Precondition** | Authenticated user is NOT a member of the project containing the task |
| **Test Data** | Authorization: `Bearer <non-member-token>`, taskId: valid but in a foreign project |
| **Test Steps** | 1. Login as a user not in the project <br> 2. Send DELETE request to `/api/tasks/{id}` <br> 3. Check response status code |
| **Expected Result** | 1. Status 403 Forbidden or 404 Not Found <br> 2. Task is NOT deleted |
| **Actual Result** | 1. Response returned status 403 Forbidden with `{"error": "Not authorized to delete this task. Project member access required."}` <br> 2. Task remains intact |
| **Status** | Pass |
| **Bug link** | — |

---

## TC-TASK-DELETE-005: Delete non-existent task

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-DELETE-005 |
| **Type** | Negative |
| **Technique** | Not found |
| **Precondition** | User has valid Bearer token |
| **Test Data** | taskId: `999999` (does not exist) |
| **Test Steps** | 1. Send DELETE request to `/api/tasks/999999` with valid token <br> 2. Check response status code |
| **Expected Result** | 1. Status 404 Not Found <br> 2. No task is modified |
| **Actual Result** | 1. Response returned status 404 Not Found with `{"error": "Task not found"}` <br> 2. No database changes occurred |
| **Status** | Pass |
| **Bug link** | — |

---

## TC-TASK-DELETE-006: Delete task also removes associated comments

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-DELETE-006 |
| **Type** | Positive |
| **Technique** | Cascade delete / Data integrity |
| **Precondition** | Task exists with comments |
| **Test Data** | taskId: valid, with known comments in the database |
| **Test Steps** | 1. Note the `id` values of comments linked to the task <br> 2. Send DELETE request to `/api/tasks/{id}` <br> 3. Query the `Comments` table for those comment IDs |
| **Expected Result** | 1. Status 204 No Content <br> 2. Task is deleted <br> 3. All associated comments are also deleted (cascade delete enforced by EF Core) <br> 4. No orphaned comment records remain |
| **Actual Result** | 1. Response returned status 204 No Content <br> 2. EF Core cascade delete configuration (`OnDelete: Cascade`) automatically removed all associated comments — no orphaned records |
| **Status** | Pass |
| **Bug link** | — |

---

## TC-TASK-DELETE-007: Delete already deleted task (idempotency)

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-DELETE-007 |
| **Type** | Edge case |
| **Technique** | Idempotency |
| **Precondition** | User has valid Bearer token; task was previously deleted |
| **Test Data** | taskId: id of a task that was successfully deleted |
| **Test Steps** | 1. Delete a task successfully (first request) <br> 2. Send another DELETE request to the same `/api/tasks/{id}` (second request) <br> 3. Check response status code |
| **Expected Result** | 1. Status 404 Not Found on the second request <br> 2. No server error (5xx) is thrown <br> 3. Consistent error response |
| **Actual Result** | 1. First DELETE returned 204 <br> 2. Second DELETE returned 404 Not Found with `{"error": "Task not found"}` <br> 3. No 5xx server error — handler gracefully handles the case |
| **Status** | Pass |
| **Bug link** | — |

---

## TC-TASK-DELETE-008: Delete task with invalid (non-integer) taskId

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-DELETE-008 |
| **Type** | Negative |
| **Technique** | Boundary / Validation |
| **Precondition** | User has valid Bearer token |
| **Test Data** | taskId: `"xyz"` in URL path |
| **Test Steps** | 1. Send DELETE request to `/api/tasks/xyz` with valid token <br> 2. Check response status code |
| **Expected Result** | 1. Status 404 Not Found (route constraint `{taskId:int}` rejects non-integer at routing level — no matching endpoint) <br> 2. No database operation is performed |
| **Actual Result** | 1. Response returned status 404 Not Found <br> 2. ASP.NET route constraint `{taskId:int}` rejected the non-integer value at routing layer — request never reached the handler <br> 3. No database operation was performed |
| **Status** | Pass |
| **Bug link** | — |

---

## TC-TASK-DELETE-009: SQL injection in taskId path parameter

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-DELETE-009 |
| **Type** | Security |
| **Technique** | SQL Injection |
| **Precondition** | User has valid Bearer token |
| **Test Data** | URL: `/api/tasks/1; DROP TABLE Tasks; --` |
| **Test Steps** | 1. Send DELETE request with SQL injection payload in the URL path <br> 2. Check response status code <br> 3. Verify the Tasks table still exists |
| **Expected Result** | 1. Status 404 Not Found (route constraint `{taskId:int}` rejects non-integer at routing level) <br> 2. SQL is never executed <br> 3. Tasks table and all data remain intact |
| **Actual Result** | 1. Response returned status 404 Not Found <br> 2. Route constraint `{taskId:int}` blocked the injection payload at the routing layer — SQL never reached the database <br> 3. Tasks table verified intact via subsequent API calls |
| **Status** | Pass |
| **Bug link** | — |

---

## TC-TASK-DELETE-010: Deleted task no longer appears in task list

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-DELETE-010 |
| **Type** | Positive |
| **Technique** | Integration / Data integrity |
| **Precondition** | Project has a known task that can be deleted |
| **Test Data** | taskId: valid; projectId: parent project |
| **Test Steps** | 1. GET `/api/projects/{projectId}/tasks` — note task count N <br> 2. DELETE `/api/tasks/{id}` <br> 3. GET `/api/projects/{projectId}/tasks` again |
| **Expected Result** | 1. DELETE returns Status 204 No Content <br> 2. Second GET returns N-1 tasks <br> 3. The deleted task is no longer present in the list |
| **Actual Result** | 1. DELETE returned 204 No Content <br> 2. Second GET returned the task list without the deleted task <br> 3. The deleted task ID was verified absent from the response array |
| **Status** | Pass |
| **Bug link** | — |

---

## Summary

| Total TCs | Pass | Fail | Blocked | Not Run |
|:---:|:---:|:---:|:---:|:---:|
| 10 | 10 | 0 | 0 | 0 |
