# QA Test Cases - Create Task Endpoint

## Endpoint

`POST /api/projects/{projectId}/tasks — Create { title, description, priority, dueDate?, assigneeId? }`

---

## TC-TASK-CREATE-001: Create task with all valid fields (happy path)

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-CREATE-001 |
| **Type** | Positive |
| **Technique** | Happy path |
| **Precondition** | User is logged in as project member or owner |
| **Test Data** | `{ "title": "Fix login bug", "description": "Session token expires too early", "priority": "High", "dueDate": "<future-date>", "assigneeId": <member-id> }` |
| **Test Steps** | 1. Send POST request to `/api/projects/{projectId}/tasks` with valid Bearer token <br> 2. Provide valid JSON body with all fields <br> 3. Check response status code <br> 4. Check response body |
| **Expected Result** | 1. Status 201 Created <br> 2. Response contains `id`, `title`, `description`, `status`, `priority`, `dueDate`, `assigneeName`, `commentCount`, `createdAt` <br> 3. `status` defaults to `"Todo"` <br> 4. Task is persisted in the database |
| **Actual Result** | Works as expected in E2E tests |
| **Status** | Passed |
| **Bug link** | — |

---

## TC-TASK-CREATE-002: Create task with minimum required fields only

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-CREATE-002 |
| **Type** | Positive |
| **Technique** | Boundary / Happy path |
| **Precondition** | User is project member |
| **Test Data** | `{ "title": "Minimal Task", "description": "", "priority": "Low" }` |
| **Test Steps** | 1. Send POST request with only required fields (no `dueDate`, no `assigneeId`) <br> 2. Check response status code <br> 3. Check response body |
| **Expected Result** | 1. Status 201 Created <br> 2. Task is created successfully <br> 3. `dueDate` is `null`, `assigneeName` is `null` |
| **Actual Result** | Works as expected in E2E tests |
| **Status** | Passed |
| **Bug link** | — |

---

## TC-TASK-CREATE-003: Create task without Bearer token

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-CREATE-003 |
| **Type** | Negative |
| **Technique** | Authorization |
| **Precondition** | None |
| **Test Data** | No Authorization header; body: `{ "title": "Unauthorized Task", "description": "", "priority": "Low" }` |
| **Test Steps** | 1. Send POST request without any Authorization header <br> 2. Check response status code |
| **Expected Result** | 1. Status 401 Unauthorized <br> 2. Task is NOT created in database |
| **Actual Result** | Works as expected in E2E tests |
| **Status** | Passed |
| **Bug link** | — |

---

## TC-TASK-CREATE-004: Non-member cannot create task

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-CREATE-004 |
| **Type** | Negative |
| **Technique** | Authorization / Data isolation |
| **Precondition** | Authenticated user is NOT a member or owner of the target project |
| **Test Data** | Authorization: `Bearer <non-member-token>`; valid projectId belonging to another user |
| **Test Steps** | 1. Login as a user who does not belong to the project <br> 2. Send POST request to `/api/projects/{projectId}/tasks` <br> 3. Check response status code and body |
| **Expected Result** | 1. Status 403 Forbidden <br> 2. Response body: `{ "error": "Not authorized to create tasks in this project. Project member access required." }` <br> 3. Task is NOT saved to database |
| **Actual Result** | Works as expected in E2E tests |
| **Status** | Passed |
| **Bug link** | — |

---

## TC-TASK-CREATE-005: Create task with missing title

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-CREATE-005 |
| **Type** | Negative |
| **Technique** | Validation |
| **Precondition** | User is project member |
| **Test Data** | `{ "title": "", "description": "Some description", "priority": "Medium" }` |
| **Test Steps** | 1. Send POST request with empty `title` field <br> 2. Check response status code <br> 3. Check response body for validation error |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response contains validation error: `"Title is required."` <br> 3. Task is NOT created |
| **Actual Result** | Works as expected in E2E tests |
| **Status** | Passed |
| **Bug link** | — |

---

## TC-TASK-CREATE-006: Create task with title exceeding 200 characters

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-CREATE-006 |
| **Type** | Negative |
| **Technique** | Boundary / Validation |
| **Precondition** | User is project member |
| **Test Data** | `{ "title": "<201-character-string>", "description": "", "priority": "Low" }` |
| **Test Steps** | 1. Send POST request with `title` of 201 characters <br> 2. Check response status code <br> 3. Check response body for validation error |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response contains validation error: `"Title must be 200 characters or less."` <br> 3. Task is NOT created |
| **Actual Result** | Works as expected in E2E tests |
| **Status** | Passed |
| **Bug link** | — |

---

## TC-TASK-CREATE-007: Create task with title exactly 200 characters

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-CREATE-007 |
| **Type** | Positive |
| **Technique** | Boundary |
| **Precondition** | User is project member |
| **Test Data** | `{ "title": "<200-character-string>", "description": "", "priority": "Low" }` |
| **Test Steps** | 1. Send POST request with `title` of exactly 200 characters <br> 2. Check response status code |
| **Expected Result** | 1. Status 201 Created <br> 2. Task is created with the full 200-character title |
| **Actual Result** | Works as expected in E2E tests |
| **Status** | Passed |
| **Bug link** | — |

---

## TC-TASK-CREATE-008: Create task with description exceeding 2000 characters

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-CREATE-008 |
| **Type** | Negative |
| **Technique** | Boundary / Validation |
| **Precondition** | User is project member |
| **Test Data** | `{ "title": "Valid Title", "description": "<2001-character-string>", "priority": "Low" }` |
| **Test Steps** | 1. Send POST request with `description` of 2001 characters <br> 2. Check response status code |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response contains validation error: `"Description is too long."` <br> 3. Task is NOT created |
| **Actual Result** | Works as expected in E2E tests |
| **Status** | Passed |
| **Bug link** | — |

---

## TC-TASK-CREATE-009: Create task with invalid priority value

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-CREATE-009 |
| **Type** | Negative |
| **Technique** | Validation |
| **Precondition** | User is project member |
| **Test Data** | `{ "title": "Valid Title", "description": "", "priority": "Critical" }` |
| **Test Steps** | 1. Send POST request with `priority` set to an invalid enum value `"Critical"` <br> 2. Check response status code |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response contains validation error: `"Priority must be Low, Medium, or High."` <br> 3. Task is NOT created |
| **Actual Result** | Works as expected in E2E tests |
| **Status** | Passed |
| **Bug link** | — |

---

## TC-TASK-CREATE-010: Create task with past dueDate

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-CREATE-010 |
| **Type** | Negative |
| **Technique** | Validation / Edge case (overdue date) |
| **Precondition** | User is project member |
| **Test Data** | `{ "title": "Past Due Task", "description": "", "priority": "Low", "dueDate": "2020-01-01T00:00:00Z" }` |
| **Test Steps** | 1. Send POST request with `dueDate` set to a date in the past <br> 2. Check response status code <br> 3. Check response body for validation error |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response contains validation error: `"Due date must be in the future."` <br> 3. Task is NOT created |
| **Actual Result** | Works as expected in E2E tests |
| **Status** | Passed |
| **Bug link** | — |

---

## TC-TASK-CREATE-011: Create task with future dueDate (valid)

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-CREATE-011 |
| **Type** | Positive |
| **Technique** | Validation / Edge case |
| **Precondition** | User is project member |
| **Test Data** | `{ "title": "Future Due Task", "description": "", "priority": "Medium", "dueDate": "<date 30 days from now>" }` |
| **Test Steps** | 1. Send POST request with `dueDate` set to a future date <br> 2. Check response status code |
| **Expected Result** | 1. Status 201 Created <br> 2. Task is created with the correct `dueDate` value |
| **Actual Result** | Works as expected in E2E tests |
| **Status** | Passed |
| **Bug link** | — |

---

## TC-TASK-CREATE-012: Assign task to non-member

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-CREATE-012 |
| **Type** | Negative |
| **Technique** | Business rule / Authorization |
| **Precondition** | User is project member; target assignee user exists but is NOT a project member |
| **Test Data** | `{ "title": "Invalid Assign Task", "description": "", "priority": "Low", "assigneeId": <non-member-user-id> }` |
| **Test Steps** | 1. Send POST request with `assigneeId` set to a user who is not a project member <br> 2. Check response status code |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body: `{ "error": "Assignee must be a project member" }` <br> 3. Task is NOT created |
| **Actual Result** | Works as expected in E2E tests |
| **Status** | Passed |
| **Bug link** | — |

---

## TC-TASK-CREATE-013: Assign task to project owner (owner is valid assignee)

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-CREATE-013 |
| **Type** | Positive |
| **Technique** | Business rule |
| **Precondition** | User is project member; project has an owner |
| **Test Data** | `{ "title": "Assign to Owner", "description": "", "priority": "High", "assigneeId": <owner-id> }` |
| **Test Steps** | 1. Send POST request with `assigneeId` set to the project owner's id <br> 2. Check response status code |
| **Expected Result** | 1. Status 201 Created <br> 2. Task is created and assigned to the owner <br> 3. `assigneeName` in response matches the owner's full name |
| **Actual Result** | Works as expected in E2E tests |
| **Status** | Passed |
| **Bug link** | — |

---

## TC-TASK-CREATE-014: Create task for non-existent project

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-CREATE-014 |
| **Type** | Negative |
| **Technique** | Not found |
| **Precondition** | User has valid token |
| **Test Data** | projectId: `999999`; body: `{ "title": "Ghost Task", "description": "", "priority": "Low" }` |
| **Test Steps** | 1. Send POST request to `/api/projects/999999/tasks` <br> 2. Check response status code |
| **Expected Result** | 1. Status 404 Not Found <br> 2. Response body: `{ "error": "Project not found" }` <br> 3. No task is created |
| **Actual Result** | Works as expected in E2E tests |
| **Status** | Passed |
| **Bug link** | — |

---

## TC-TASK-CREATE-015: Default status is Todo on creation

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-CREATE-015 |
| **Type** | Positive |
| **Technique** | Business logic |
| **Precondition** | User is project member |
| **Test Data** | `{ "title": "Status Check Task", "description": "", "priority": "Low" }` |
| **Test Steps** | 1. Send POST request to create a task (no `status` field in body) <br> 2. Check the `status` field in response |
| **Expected Result** | 1. Status 201 Created <br> 2. Response body has `"status": "Todo"` <br> 3. Task in database has Status = Todo |
| **Actual Result** | Works as expected in E2E tests |
| **Status** | Passed |
| **Bug link** | — |

---

## TC-TASK-CREATE-016: XSS injection in task title

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-CREATE-016 |
| **Type** | Security |
| **Technique** | XSS |
| **Precondition** | User is project member |
| **Test Data** | `{ "title": "<script>alert('XSS')</script>", "description": "", "priority": "Low" }` |
| **Test Steps** | 1. Send POST request with XSS payload in `title` field <br> 2. Check response status code <br> 3. Retrieve the created task and check how `title` is stored and returned |
| **Expected Result** | 1. Status 201 Created (validation passes since it is a non-empty string under 200 chars) <br> 2. The title is stored as a raw string <br> 3. When retrieved, the response returns the string as JSON — NOT executed as script <br> 4. Frontend must escape before rendering (API responsibility: return data as-is; rendering must sanitize) |
| **Actual Result** | Works as expected in E2E tests |
| **Status** | Passed |
| **Bug link** | — |

---

## TC-TASK-CREATE-017: SQL injection in task description

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-CREATE-017 |
| **Type** | Security |
| **Technique** | SQL Injection |
| **Precondition** | User is project member |
| **Test Data** | `{ "title": "SQL Test", "description": "'; DROP TABLE Tasks; --", "priority": "Low" }` |
| **Test Steps** | 1. Send POST request with SQL injection payload in `description` field <br> 2. Check response status code <br> 3. Verify the Tasks table still exists and data is intact |
| **Expected Result** | 1. Status 201 Created (EF Core uses parameterized queries) <br> 2. Description is stored as a literal string, not executed as SQL <br> 3. Database is unaffected; Tasks table remains intact |
| **Actual Result** | Works as expected in E2E tests |
| **Status** | Passed |
| **Bug link** | — |

---

## Summary

| Total TCs | Pass | Fail | Blocked | Not Run |
|:---:|:---:|:---:|:---:|:---:|
| 17 | 17 | 0 | 0 | 0 |
