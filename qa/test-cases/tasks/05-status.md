# QA Test Cases - Update Task Status Endpoint

## Endpoint

`PATCH /api/tasks/{id}/status — Move task: { status: "InProgress" }`


---

## Valid Status Values
- `Todo`
- `InProgress`
- `Done`

---

## TC-TASK-STATUS-001: Move task from Todo to InProgress (happy path)

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-STATUS-001 |
| **Type** | Positive |
| **Technique** | Happy path / Status transition |
| **Precondition** | User is project member; task exists with status = `Todo` |
| **Test Data** | PATCH `/api/tasks/{id}/status` body: `{ "status": "InProgress" }` |
| **Test Steps** | 1. Send PATCH request to `/api/tasks/{id}/status` with valid Bearer token <br> 2. Provide body `{ "status": "InProgress" }` <br> 3. Check response status code <br> 4. Verify task status in database |
| **Expected Result** | 1. Status 204 No Content <br> 2. Task `status` is updated to `InProgress` in the database <br> 3. Subsequent GET on the task returns `"status": "InProgress"` |
| **Actual Result** | 1. Status 204 No Content <br> 2. Task `status` is updated to `InProgress` in the database <br> 3. Subsequent GET on the task returns `"status": "InProgress"` |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-TASK-STATUS-002: Move task from InProgress to Done

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-STATUS-002 |
| **Type** | Positive |
| **Technique** | Status transition |
| **Precondition** | User is project member; task exists with status = `InProgress` |
| **Test Data** | PATCH `/api/tasks/{id}/status` body: `{ "status": "Done" }` |
| **Test Steps** | 1. Send PATCH request with body `{ "status": "Done" }` <br> 2. Check response status code <br> 3. Verify final status |
| **Expected Result** | 1. Status 204 No Content <br> 2. Task status = `Done` in the database |
| **Actual Result** | 1. Status 204 No Content <br> 2. Task status = `Done` in the database |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-TASK-STATUS-003: Move task backward from Done to Todo (backward transition)

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-STATUS-003 |
| **Type** | Edge case |
| **Technique** | Status transition / Business rule |
| **Precondition** | User is project member; task has status = `Done` |
| **Test Data** | PATCH `/api/tasks/{id}/status` body: `{ "status": "Todo" }` |
| **Test Steps** | 1. Send PATCH request with body `{ "status": "Todo" }` on a Done task <br> 2. Check response status code <br> 3. Verify task status |
| **Expected Result** | Status 204 No Content; task reverts to `Todo` |
| **Actual Result** | 1. Status 204 No Content ✅ <br> 2. Task status changed from `Done` to `Todo` ✅ |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-TASK-STATUS-004: Update status without Bearer token

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-STATUS-004 |
| **Type** | Negative |
| **Technique** | Authorization |
| **Precondition** | Task exists |
| **Test Data** | No Authorization header; body: `{ "status": "InProgress" }` |
| **Test Steps** | 1. Send PATCH request to `/api/tasks/{id}/status` without Bearer token <br> 2. Check response status code |
| **Expected Result** | 1. Status 401 Unauthorized <br> 2. Task status is NOT changed |
| **Actual Result** | 1. Response returned status 401 Unauthorized with `{"error": "Unauthorized. Please provide a valid Bearer token."}`. |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-TASK-STATUS-005: Non-member cannot update task status

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-STATUS-005 |
| **Type** | Negative |
| **Technique** | Authorization / Data isolation |
| **Precondition** | Authenticated user is NOT a member of the project containing the task |
| **Test Data** | Authorization: `Bearer <non-member-token>`; taskId in a foreign project; body: `{ "status": "Done" }` |
| **Test Steps** | 1. Login as non-member <br> 2. Send PATCH request to `/api/tasks/{id}/status` <br> 3. Check response status code |
| **Expected Result** | 1. Status 403 Forbidden or 404 Not Found <br> 2. Task status is NOT changed |
| **Actual Result** | 1. Response returned status 403 Forbidden with `{"error": "Not authorized to update task status. Project member access required."}`. |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-TASK-STATUS-006: Update status with invalid status value

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-STATUS-006 |
| **Type** | Negative |
| **Technique** | Validation |
| **Precondition** | User is project member; task exists |
| **Test Data** | body: `{ "status": "Archived" }` |
| **Test Steps** | 1. Send PATCH request with invalid `status` value `"Archived"` <br> 2. Check response status code |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response indicates `"Archived"` is not a valid status value <br> 3. Task status is NOT changed |
| **Actual Result** | 1. Response returned status 400 Bad Request with `{"error": "Invalid status value. Must be one of: Todo, InProgress, Done."}`. |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-TASK-STATUS-007: Update status on non-existent task

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-STATUS-007 |
| **Type** | Negative |
| **Technique** | Not found |
| **Precondition** | User has valid Bearer token |
| **Test Data** | taskId: `999999`; body: `{ "status": "Done" }` |
| **Test Steps** | 1. Send PATCH request to `/api/tasks/999999/status` <br> 2. Check response status code |
| **Expected Result** | 1. Status 404 Not Found <br> 2. No task is modified |
| **Actual Result** | 1. Response returned status 404 Not Found with `{"error": "Task not found"}`. |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-TASK-STATUS-008: Update status with missing status field in body

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-STATUS-008 |
| **Type** | Negative |
| **Technique** | Validation |
| **Precondition** | User is project member; task exists |
| **Test Data** | body: `{}` (empty JSON object, no `status` field) |
| **Test Steps** | 1. Send PATCH request with an empty body <br> 2. Check response status code |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response indicates `status` is required <br> 3. Task is NOT modified |
| **Actual Result** | 1. Response returned status 400 Bad Request with `{"error": "Status field is required."}`. |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-TASK-STATUS-009: Set task status to same value (idempotent)

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-STATUS-009 |
| **Type** | Edge case |
| **Technique** | Idempotency |
| **Precondition** | User is project member; task exists with status = `Todo` |
| **Test Data** | body: `{ "status": "Todo" }` (same as current status) |
| **Test Steps** | 1. Send PATCH request setting status to `Todo` when task is already `Todo` <br> 2. Check response status code <br> 3. Verify task status remains unchanged |
| **Expected Result** | 1. Status 204 No Content (idempotent update accepted) <br> 2. Task status remains `Todo` <br> 3. No error is thrown for updating to the current status |
| **Actual Result** | 1. Response returned status 204 No Content. <br> 2. Task status remains `Todo` in the database. |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-TASK-STATUS-010: XSS injection in status value

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-STATUS-010 |
| **Type** | Security |
| **Technique** | XSS |
| **Precondition** | User is project member; task exists |
| **Test Data** | body: `{ "status": "<script>alert('XSS')</script>" }` |
| **Test Steps** | 1. Send PATCH request with XSS payload as `status` value <br> 2. Check response status code |
| **Expected Result** | 1. Status 400 Bad Request (enum parse failure; XSS string is not a valid TaskStatus) <br> 2. Payload is never stored or reflected unencoded <br> 3. Task status is NOT changed |
| **Actual Result** | 1. Response returned status 400 Bad Request with `{"errors":["Invalid status value. Must be one of: Todo, InProgress, Done."]}`. |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## Summary

| Total TCs | Pass | Fail | Blocked | Not Run |
|:---:|:---:|:---:|:---:|:---:|
| 10 | 10 | 0 | 0 | 0 |
