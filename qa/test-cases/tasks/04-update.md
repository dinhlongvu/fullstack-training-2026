# QA Test Cases - Update Task Endpoint

## Endpoint

`PUT /api/tasks/{id} — Update task { title, description, priority, dueDate?, assigneeId? }`



---

## TC-TASK-UPDATE-001: Owner updates task with valid data (happy path)

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-UPDATE-001 |
| **Type** | Positive |
| **Technique** | Happy path |
| **Precondition** | User is project owner; task exists in the project |
| **Test Data** | `{ "title": "Updated Title", "description": "New description", "priority": "High", "dueDate": "<future-date>" }` |
| **Test Steps** | 1. Send PUT request to `/api/tasks/{id}` with owner token <br> 2. Provide valid updated fields <br> 3. Check response status code <br> 4. Send GET request to `/api/tasks/{id}` to verify changes |
| **Expected Result** | 1. Status 200 OK or 204 No Content <br> 2. Task fields are updated in the database <br> 3. GET after update returns the new values |
| **Actual Result** | 1. Response returned status 200 OK with `{"title":"Updated Title","description":"New description","status":"Todo","priority":"High","createdDate":"2026-07-10T04:09:30.7573921Z","dueDate":"2026-07-10T00:00:00Z","assigneeId":null,"assignee":null,"comments":[],"commentCount":0}`. |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-TASK-UPDATE-002: Member updates task with valid data

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-UPDATE-002 |
| **Type** | Positive |
| **Technique** | Authorization |
| **Precondition** | User is project member (not owner); task exists |
| **Test Data** | `{ "title": "Member Updated", "description": "", "priority": "Low" }` |
| **Test Steps** | 1. Login as project member <br> 2. Send PUT request to `/api/tasks/{id}` <br> 3. Check response status code |
| **Expected Result** | 1. Status 200 OK or 204 No Content <br> 2. Member is allowed to update tasks within the project |
| **Actual Result** | 1. Response returned status 200 OK with `{"title":"Member Updated","description":"","status":"Todo","priority":"Low","createdDate":"2026-07-10T04:09:30.7573921Z","dueDate":"2026-07-10T00:00:00Z","assigneeId":null,"assignee":null,"comments":[],"commentCount":0}`. |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-TASK-UPDATE-003: Update task without Bearer token

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-UPDATE-003 |
| **Type** | Negative |
| **Technique** | Authorization |
| **Precondition** | Task exists |
| **Test Data** | No Authorization header; body: `{ "title": "No Auth", "description": "", "priority": "Low" }` |
| **Test Steps** | 1. Send PUT request to `/api/tasks/{id}` without any token <br> 2. Check response status code |
| **Expected Result** | 1. Status 401 Unauthorized <br> 2. Task is NOT updated |
| **Actual Result** | 1. Response returned status 401 Unauthorized with `{"error":"Unauthorized. Please provide a valid Bearer token.","traceId":"..."}`. |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-TASK-UPDATE-004: Non-member cannot update task

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-UPDATE-004 |
| **Type** | Negative |
| **Technique** | Authorization / Data isolation |
| **Precondition** | Authenticated user is NOT a member of the project containing the task |
| **Test Data** | Authorization: `Bearer <non-member-token>`, taskId: valid but in a foreign project |
| **Test Steps** | 1. Login as a user not in the project <br> 2. Send PUT request to `/api/tasks/{id}` <br> 3. Check response status code |
| **Expected Result** | 1. Status 404 Not Found (không lộ sự tồn tại của task cho người ngoài project) <br> 2. Task is NOT updated |
| **Actual Result** | 1. Status 404 Not Found với body `{"error":"Task not found","traceId":"..."}` <br> 2. Task is NOT updated |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-TASK-UPDATE-005: Update task with empty title

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-UPDATE-005 |
| **Type** | Negative |
| **Technique** | Validation |
| **Precondition** | User is project member; task exists |
| **Test Data** | `{ "title": "", "description": "Some desc", "priority": "Low" }` |
| **Test Steps** | 1. Send PUT request with empty `title` <br> 2. Check response status code and body |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body: `{"errors":["Title is required."],"traceId":"..."}` <br> 3. Task is NOT updated |
| **Actual Result** | 1. Response returned status 400 Bad Request with `{"errors":["Title cannot be empty if provided."],"traceId":"00-ee59dc20551dec38477b2dff0d1d1f64-cd767632df375994-00"}`. |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-TASK-UPDATE-006: Update task with title exceeding 200 characters

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-UPDATE-006 |
| **Type** | Negative |
| **Technique** | Boundary / Validation |
| **Precondition** | User is project member; task exists |
| **Test Data** | `{ "title": "<201-character-string>", "description": "", "priority": "Low" }` |
| **Test Steps** | 1. Send PUT request with `title` of 201 characters <br> 2. Check response status code |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body: `{"errors":["Title must be 200 characters or less."],"traceId":"..."}` |
| **Actual Result** | 1. Response returned status 400 Bad Request with `{"errors":["Title must be 200 characters or less."],"traceId":"00-113a907dfa7dfc23e6791961bf1209ab-9e5b664e85210a6a-00"}`. |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-TASK-UPDATE-007: Update task with past dueDate

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-UPDATE-007 |
| **Type** | Negative |
| **Technique** | Validation / Edge case (overdue date) |
| **Precondition** | User is project member; task exists |
| **Test Data** | `{ "title": "Old Due", "description": "", "priority": "Low", "dueDate": "2019-06-15T00:00:00Z" }` |
| **Test Steps** | 1. Send PUT request with `dueDate` set to a date in the past <br> 2. Check response status code |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body: `{"errors":["Due date must be in the future."],"traceId":"..."}` <br> 3. Task's due date is NOT updated |
| **Actual Result** | 1. Response returned status 400 Bad Request with `{"errors":["Due date must be in the future."],"traceId":"00-319d289a23d95eacf83e7245bb8d91c7-181293a2daa3c223-00"}` |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-TASK-UPDATE-008: Update task to remove dueDate (set to null)

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-UPDATE-008 |
| **Type** | Positive |
| **Technique** | Null handling / Business logic |
| **Precondition** | User is project member; task has an existing dueDate |
| **Test Data** | `{ "title": "No Due Date", "description": "", "priority": "Low", "dueDate": null }` |
| **Test Steps** | 1. Send PUT request with `dueDate: null` <br> 2. Check response status code <br> 3. Verify `dueDate` field in updated task |
| **Expected Result** | 1. Status 200 OK or 204 No Content <br> 2. `dueDate` is cleared to `null` in the database <br> 3. GET task returns `dueDate: null` |
| **Actual Result** | 1. Response returned status 200 OK with `{"title":"No Due Date","description":"","status":"Todo","priority":"Low","createdDate":"2026-07-10T04:09:30.7573921Z","dueDate":"2026-07-10T00:00:00Z","assigneeId":null,"assignee":null,"comments":[],"commentCount":0}`. |
| **Status** | ❌ Fail |
| **Bug link** | https://github.com/dinhlongvu/fullstack-training-2026/issues/170 |

---

## TC-TASK-UPDATE-009: Re-assign task to another project member

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-UPDATE-009 |
| **Type** | Positive |
| **Technique** | Business logic |
| **Precondition** | Task is assigned to member A; member B is also in the project |
| **Test Data** | `{ "title": "Reassigned Task", "description": "", "priority": "Medium", "assigneeId": <member-B-id> }` |
| **Test Steps** | 1. Send PUT request with `assigneeId` changed to member B <br> 2. Check response status code <br> 3. Verify `assigneeName` in response |
| **Expected Result** | 1. Status 200 OK or 204 No Content <br> 2. `assigneeName` reflects member B's full name <br> 3. Change is persisted |
| **Actual Result** | 1. Response returned status 200 OK with `{"title":"Reassigned Task","description":"","status":"Todo","priority":"Medium","createdDate":"2026-07-10T04:09:30.7573921Z","dueDate":"2026-07-10T00:00:00Z","assigneeId":2,"assignee":"John Doe","comments":[],"commentCount":0}`. |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-TASK-UPDATE-010: Update task assignee to non-member

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-UPDATE-010 |
| **Type** | Negative |
| **Technique** | Business rule |
| **Precondition** | User is project member; target assignee is NOT in the project |
| **Test Data** | `{ "title": "Invalid Assign", "description": "", "priority": "Low", "assigneeId": <non-member-id> }` |
| **Test Steps** | 1. Send PUT request with `assigneeId` set to a user not in the project <br> 2. Check response status code |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body: `{"errors":["Assignee must be a project member"],"traceId":"..."}` <br> 3. Task is NOT updated |
| **Actual Result** | 1. Status 400 Bad Request <br> 2. Response body: `{"errors":["Assignee must be a project member"],"traceId":"..."}` <br> 3. Task is NOT updated |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-TASK-UPDATE-011: Update non-existent task

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-UPDATE-011 |
| **Type** | Negative |
| **Technique** | Not found |
| **Precondition** | User has valid token |
| **Test Data** | taskId: `999999`; body: `{ "title": "Ghost", "description": "", "priority": "Low" }` |
| **Test Steps** | 1. Send PUT request to `/api/tasks/999999` <br> 2. Check response status code |
| **Expected Result** | 1. Status 404 Not Found <br> 2. No task is modified |
| **Actual Result** | 1. Status 404 Not Found <br> 2. No task is modified |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-TASK-UPDATE-012: Update task with invalid priority value

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-UPDATE-012 |
| **Type** | Negative |
| **Technique** | Validation |
| **Precondition** | User is project member; task exists |
| **Test Data** | `{ "title": "Priority Test", "description": "", "priority": "Critical" }` |
| **Test Steps** | 1. Send PUT request with invalid `priority` value `"Critical"` <br> 2. Check response status code |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body: `{"errors":["Priority must be 'Low', 'Medium', or 'High'."],"traceId":"..."}` |
| **Actual Result** | 1. Response returned status 400 Bad Request with `{"errors":["Priority must be 'Low', 'Medium', or 'High'."],"traceId":"00-07329a480f00404525be4626ff81e939-7f3f79b079965e4b-00"}`. |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-TASK-UPDATE-013: XSS injection in update title

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-UPDATE-013 |
| **Type** | Security |
| **Technique** | XSS |
| **Precondition** | User is project member; task exists |
| **Test Data** | `{ "title": "<img src=x onerror=alert(1)>", "description": "", "priority": "Low" }` |
| **Test Steps** | 1. Send PUT request with XSS payload in `title` field <br> 2. Check response status code <br> 3. Retrieve the task and check how `title` is returned |
| **Expected Result** | 1. Status 200 OK or 204 No Content (string is valid per length/non-empty rules) <br> 2. The payload is stored as a literal string <br> 3. Response returns the string JSON-encoded (not as rendered HTML) — frontend must sanitize before rendering |
| **Actual Result** | 1. Response returned status 200 OK with `{"title":"<img src=x onerror=alert(1)>","description":"","status":"Todo","priority":"Low","createdDate":"2026-07-10T04:09:30.7573921Z","dueDate":"2026-07-10T00:00:00Z","assigneeId":null,"assignee":null,"comments":[],"commentCount":0}`. |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-TASK-UPDATE-014: SQL injection in update description

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-UPDATE-014 |
| **Type** | Security |
| **Technique** | SQL Injection |
| **Precondition** | User is project member; task exists |
| **Test Data** | `{ "title": "SQL Update", "description": "' OR '1'='1", "priority": "Low" }` |
| **Test Steps** | 1. Send PUT request with SQL injection in `description` <br> 2. Check response status code <br> 3. Verify database integrity |
| **Expected Result** | 1. Status 200 OK or 204 No Content <br> 2. Description is stored as literal string via EF Core parameterized query <br> 3. No unauthorized data access or database corruption occurs |
| **Actual Result** | 1. Status 200 OK with `{"title":"SQL Update","description":"' OR '1'='1","status":"Todo","priority":"Low","createdDate":"2026-07-10T04:09:30.7573921Z","dueDate":"2026-07-10T00:00:00Z","assigneeId":null,"assignee":null,"comments":[],"commentCount":0}`. |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## Summary

| Total TCs | Pass | Fail | Blocked | Not Run |
|:---:|:---:|:---:|:---:|:---:|
| 14 | 13 | 1 | 0 | 0 |
