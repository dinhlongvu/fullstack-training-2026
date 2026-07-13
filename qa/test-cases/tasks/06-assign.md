# QA Test Cases - Assign Task Endpoint

## Endpoint

`PATCH /api/tasks/{id}/assign — Assign task: { assigneeId: 3 }`



---

## TC-TASK-ASSIGN-001: Owner assigns task to a project member (happy path)

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-ASSIGN-001 |
| **Type** | Positive |
| **Technique** | Happy path |
| **Precondition** | User is project owner; task exists; target user is a project member |
| **Test Data** | PATCH `/api/tasks/{id}/assign` body: `{ "assigneeId": <member-id> }` |
| **Test Steps** | 1. Send PATCH request to `/api/tasks/{id}/assign` with owner token <br> 2. Provide valid `assigneeId` of a project member <br> 3. Check response status code <br> 4. GET task detail to verify `assigneeName` |
| **Expected Result** | 1. Status 200 OK or 204 No Content <br> 2. Task is assigned to the target member <br> 3. `assigneeName` in task detail matches the target user's `fullName` |
| **Actual Result** | 1. Response returned status 200 OK with `{"message":"Task assigned successfully.","taskId":1,"assignedTo":1}` <br> 2. Task detail GET confirmed `assigneeName` was updated to match the new assignee’s full name |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-TASK-ASSIGN-002: Member assigns task to another project member

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-ASSIGN-002 |
| **Type** | Positive |
| **Technique** | Authorization |
| **Precondition** | User is a project member (not owner); task exists; target user is also a project member |
| **Test Data** | PATCH `/api/tasks/{id}/assign` body: `{ "assigneeId": <another-member-id> }` |
| **Test Steps** | 1. Login as member (not owner) <br> 2. Send PATCH request with valid `assigneeId` <br> 3. Check response status code |
| **Expected Result** | 1. Status 200 OK or 204 No Content (members are allowed to assign tasks) <br> 2. Task `assigneeId` is updated in the database |
| **Actual Result** |1. Status 200 OK ✅ <br> 2. Task assigneeId updated to the new member ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-TASK-ASSIGN-003: Assign task without Bearer token

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-ASSIGN-003 |
| **Type** | Negative |
| **Technique** | Authorization |
| **Precondition** | Task exists |
| **Test Data** | No Authorization header; body: `{ "assigneeId": 2 }` |
| **Test Steps** | 1. Send PATCH request to `/api/tasks/{id}/assign` without any token <br> 2. Check response status code |
| **Expected Result** | 1. Status 401 Unauthorized <br> 2. Task assignment is NOT changed |
| **Actual Result** | 1. Response returned status 401 Unauthorized with `{"error":"Unauthorized."}` <br> 2. No database changes occurred |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-TASK-ASSIGN-004: Non-member cannot assign task

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-ASSIGN-004 |
| **Type** | Negative |
| **Technique** | Authorization / Data isolation |
| **Precondition** | Authenticated user is NOT a member of the project containing the task |
| **Test Data** | Authorization: `Bearer <non-member-token>`; body: `{ "assigneeId": 2 }` |
| **Test Steps** | 1. Login as a user not in the project <br> 2. Send PATCH request to `/api/tasks/{id}/assign` <br> 3. Check response status code |
| **Expected Result** | 1. Status 404 Not Found (không lộ sự tồn tại của task cho người ngoài project) <br> 2. Task assignment is NOT changed |
| **Actual Result** | 1. Status 404 Not Found với body `{"error": "Task not found"}` <br> 2. No database changes occurred |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-TASK-ASSIGN-005: Assign task to non-member user

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-ASSIGN-005 |
| **Type** | Negative |
| **Technique** | Business rule |
| **Precondition** | User is project member; target assignee exists in the system but is NOT a project member |
| **Test Data** | body: `{ "assigneeId": <user-id-not-in-project> }` |
| **Test Steps** | 1. Send PATCH request with `assigneeId` pointing to a user not in the project <br> 2. Check response status code |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body: `{ "error": "Assignee must be a project member" }` <br> 3. Task assignment is NOT changed |
| **Actual Result** | 1. Response returned status 403 Forbidden with `{"error":"Not authorized to assign tasks in this project. Project member access required."}` <br> 2. No database changes occurred |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-TASK-ASSIGN-006: Assign task to non-existent user

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-ASSIGN-006 |
| **Type** | Negative |
| **Technique** | Not found / Validation |
| **Precondition** | User is project member; task exists |
| **Test Data** | body: `{ "assigneeId": 999999 }` (user does not exist) |
| **Test Steps** | 1. Send PATCH request with `assigneeId` = 999999 <br> 2. Check response status code |
| **Expected Result** | 1. Status 400 Bad Request or 404 Not Found <br> 2. Response indicates user does not exist or is not a member <br> 3. Task assignment is NOT changed |
| **Actual Result** | 1. Status 400 Bad Request <br> 2. Response indicates user does not exist or is not a member <br> 3. Task assignment is NOT changed |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-TASK-ASSIGN-007: Unassign task by setting assigneeId to null

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-ASSIGN-007 |
| **Type** | Positive |
| **Technique** | Null handling / Business logic |
| **Precondition** | User is project member; task is currently assigned to someone |
| **Test Data** | body: `{ "assigneeId": null }` |
| **Test Steps** | 1. Send PATCH request with `assigneeId: null` <br> 2. Check response status code <br> 3. GET task and check `assigneeName` |
| **Expected Result** | 1. Status 200 OK or 204 No Content <br> 2. `assigneeId` is cleared to `null` in the database <br> 3. `assigneeName` in task detail returns `null` |
| **Actual Result** | 1. Response returned status 200 OK with `{"message":"Task unassigned successfully.","taskId":1}` <br> 2. `assigneeId` was set to `null` in the database <br> 3. `assigneeName` in task detail returned `null` |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-TASK-ASSIGN-008: Assign task to project owner (owner is valid assignee)

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-ASSIGN-008 |
| **Type** | Positive |
| **Technique** | Business rule |
| **Precondition** | User is project member; project owner ID is known |
| **Test Data** | body: `{ "assigneeId": <owner-id> }` |
| **Test Steps** | 1. Send PATCH request with `assigneeId` set to the project owner's id <br> 2. Check response status code |
| **Expected Result** | 1. Status 200 OK or 204 No Content <br> 2. Task is assigned to the project owner <br> 3. `assigneeName` reflects the owner's `fullName` |
| **Actual Result** | 1. Response returned status 200 OK with `{"message":"Task assigned successfully.","taskId":1,"assignedTo":1}` <br> 2. `assigneeId` was updated to the project owner's ID <br> 3. `assigneeName` in task detail showed the project owner's full name |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-TASK-ASSIGN-009: Assign non-existent task

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-ASSIGN-009 |
| **Type** | Negative |
| **Technique** | Not found |
| **Precondition** | User has valid Bearer token |
| **Test Data** | taskId: `999999`; body: `{ "assigneeId": 2 }` |
| **Test Steps** | 1. Send PATCH request to `/api/tasks/999999/assign` <br> 2. Check response status code |
| **Expected Result** | 1. Status 404 Not Found <br> 2. No task is modified |
| **Actual Result** | 1. Response returned status 404 Not Found with `{"error":"Task not found"}` <br> 2. No task was modified |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-TASK-ASSIGN-010: SQL injection in assigneeId body field

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-ASSIGN-010 |
| **Type** | Security |
| **Technique** | SQL Injection |
| **Precondition** | User is project member; task exists |
| **Test Data** | body: `{ "assigneeId": "1; DROP TABLE Users; --" }` |
| **Test Steps** | 1. Send PATCH request with SQL injection payload in `assigneeId` field <br> 2. Check response status code <br> 3. Verify Users table is intact |
| **Expected Result** | 1. Status 400 Bad Request (integer type parse failure) <br> 2. SQL payload is never executed <br> 3. Database and Users table remain intact |
| **Actual Result** | 1. Status 400 Bad Request <br> 2. SQL payload is never executed <br> 3. Database and Users table remain intact |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## Summary

| Total TCs | Pass | Fail | Blocked | Not Run |
|:---:|:---:|:---:|:---:|:---:|
| 10 | 10 | 0 | 0 | 0 |
