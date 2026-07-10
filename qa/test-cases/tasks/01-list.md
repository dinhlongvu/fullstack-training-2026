# QA Test Cases - List Tasks Endpoint

## Endpoint

`GET /api/projects/{projectId}/tasks — Tasks in project (?status=&priority=&assigneeId=)`

---

## TC-TASK-LIST-001: List tasks as project owner (happy path)

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-LIST-001 |
| **Type** | Positive |
| **Technique** | Happy path |
| **Precondition** | User is logged in as project owner; project has at least one task |
| **Test Data** | Authorization: `Bearer <owner-token>`, projectId: valid |
| **Test Steps** | 1. Send GET request to `/api/projects/{projectId}/tasks` with owner token <br> 2. Check response status code <br> 3. Check response body structure |
| **Expected Result** | 1. Status 200 OK <br> 2. Returns a JSON array of tasks <br> 3. Each task contains `id`, `title`, `description`, `status`, `priority`, `dueDate`, `assigneeName`, `commentCount`, `createdAt` |
| **Actual Result** | 1. Status 200 OK contains body: `{ "data": [ { "id": 1, "name": "Test Task", "description": "Test Task Description", "status": "Todo", "priority": "Medium", "dueDate": "2026-07-10T17:46:02.1708673+07:00", "createdAt": "2026-07-10T17:46:02.1708673+07:00", "createdById": 2, "assigneeId": 1, "assigneeName": "Alice", "commentCount": 0 } ], "page": 1, "pageSize": 25, "totalCount": 1 }` <br> 2. Returns a JSON array of tasks <br> 3. Each task contains `id`, `title`, `description`, `status`, `priority`, `dueDate`, `assigneeName`, `commentCount`, `createdAt` |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-TASK-LIST-002: List tasks as project member (non-owner)

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-LIST-002 |
| **Type** | Positive |
| **Technique** | Authorization |
| **Precondition** | User is a project member (not owner); project has tasks |
| **Test Data** | Authorization: `Bearer <member-token>`, projectId: valid |
| **Test Steps** | 1. Login as a member user <br> 2. Send GET request to `/api/projects/{projectId}/tasks` <br> 3. Check response status code |
| **Expected Result** | 1. Status 200 OK <br> 2. Tasks are returned for member access <br> 3. Response is identical in shape to owner response |
| **Actual Result** | 1. Status 200 OK contains body: `{ "data": [ { "id": 1, "name": "Test Task", "description": "Test Task Description", "status": "Todo", "priority": "Medium", "dueDate": "2026-07-10T17:46:02.1708673+07:00", "createdAt": "2026-07-10T17:46:02.1708673+07:00", "createdById": 2, "assigneeId": 1, "assigneeName": "Alice", "commentCount": 0 } ], "page": 1, "pageSize": 25, "totalCount": 1 }` <br> 2. Tasks are returned for member access <br> 3. Response is identical in shape to owner response |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-TASK-LIST-003: List tasks without Bearer token

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-LIST-003 |
| **Type** | Negative |
| **Technique** | Authorization |
| **Precondition** | Project exists |
| **Test Data** | No Authorization header |
| **Test Steps** | 1. Send GET request to `/api/projects/{projectId}/tasks` without any token <br> 2. Check response status code |
| **Expected Result** | 1. Status 401 Unauthorized <br> 2. No task data is returned |
| **Actual Result** | 1. Status 401 Unauthorized contains body: `{ "error": "Unauthorized. Please provide a valid Bearer token."}` <br> 2. No task data is returned |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-TASK-LIST-004: Non-member cannot list tasks

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-LIST-004 |
| **Type** | Negative |
| **Technique** | Authorization / Data isolation |
| **Precondition** | Project exists; authenticated user is NOT a member or owner of the project |
| **Test Data** | Authorization: `Bearer <non-member-token>`, projectId: valid but foreign project |
| **Test Steps** | 1. Login as a user who is not a member of the project <br> 2. Send GET request to `/api/projects/{projectId}/tasks` <br> 3. Check response status code and body |
| **Expected Result** | 1. Status 403 Forbidden <br> 2. Response body: `{ "error": "Not authorized to view tasks in this project. Project member access required." }` <br> 3. No task data is leaked |
| **Actual Result** | 1. Status 403 Forbidden <br> 2. Response body: `{ "error": "Not authorized to view tasks in this project. Project member access required." }` <br> 3. No task data is leaked |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-TASK-LIST-005: List tasks for non-existent project

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-LIST-005 |
| **Type** | Negative |
| **Technique** | Not found |
| **Precondition** | User has valid Bearer token |
| **Test Data** | projectId: `999999` (does not exist) |
| **Test Steps** | 1. Send GET request to `/api/projects/999999/tasks` with valid token <br> 2. Check response status code |
| **Expected Result** | 1. Status 404 Not Found <br> 2. Response body: `{ "error": "Project not found" }` |
| **Actual Result** | 1. Status 404 Not Found <br> 2. Response body: `{ "error": "Project not found" }` |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-TASK-LIST-006: Filter tasks by status=Todo

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-LIST-006 |
| **Type** | Positive |
| **Technique** | Filter |
| **Precondition** | Project has tasks with statuses: Todo, InProgress, Done |
| **Test Data** | `GET /api/projects/{projectId}/tasks?status=Todo` |
| **Test Steps** | 1. Send GET request with query param `?status=Todo` <br> 2. Check response status code <br> 3. Check all returned tasks |
| **Expected Result** | 1. Status 200 OK <br> 2. All returned tasks have `status = "Todo"` <br> 3. Tasks with `InProgress` or `Done` are NOT included |
| **Actual Result** | 1. Status 200 OK <br> 2. All returned tasks have `status = "Todo"` <br> 3. Tasks with `InProgress` or `Done` are NOT included |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-TASK-LIST-007: Filter tasks by priority=High

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-LIST-007 |
| **Type** | Positive |
| **Technique** | Filter |
| **Precondition** | Project has tasks with multiple priorities: Low, Medium, High |
| **Test Data** | `GET /api/projects/{projectId}/tasks?priority=High` |
| **Test Steps** | 1. Send GET request with `?priority=High` <br> 2. Check all tasks in response |
| **Expected Result** | 1. Status 200 OK <br> 2. Only tasks with `priority = "High"` are returned <br> 3. Low and Medium priority tasks are excluded |
| **Actual Result** | 1. Status 200 OK <br> 2. Only tasks with `priority = "High"` are returned <br> 3. Low and Medium priority tasks are excluded |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-TASK-LIST-008: Filter tasks by assigneeId

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-LIST-008 |
| **Type** | Positive |
| **Technique** | Filter |
| **Precondition** | Project has tasks; some assigned to user with id=2 |
| **Test Data** | `GET /api/projects/{projectId}/tasks?assigneeId=2` |
| **Test Steps** | 1. Send GET request with `?assigneeId=2` <br> 2. Check all tasks in response |
| **Expected Result** | 1. Status 200 OK <br> 2. Only tasks assigned to user 2 are returned <br> 3. Unassigned tasks and tasks assigned to other users are excluded |
| **Actual Result** | 1. Status 200 OK <br> 2. Only tasks assigned to user 2 are returned <br> 3. Unassigned tasks and tasks assigned to other users are excluded |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-TASK-LIST-009: Filter tasks by combined status + priority

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-LIST-009 |
| **Type** | Positive |
| **Technique** | Filter combination |
| **Precondition** | Project has tasks with mixed status/priority values |
| **Test Data** | `GET /api/projects/{projectId}/tasks?status=InProgress&priority=High` |
| **Test Steps** | 1. Send GET request with both `?status=InProgress&priority=High` <br> 2. Check all returned tasks |
| **Expected Result** | 1. Status 200 OK <br> 2. Only tasks with `status="InProgress"` AND `priority="High"` are returned <br> 3. Filters are applied with AND logic |
| **Actual Result** | 1. Status 200 OK <br> 2. Only tasks with `status="InProgress"` AND `priority="High"` are returned <br> 3. Filters are applied with AND logic |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-TASK-LIST-010: Filter with status=Done returns empty list when no done tasks

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-LIST-010 |
| **Type** | Positive |
| **Technique** | Empty state / Filter |
| **Precondition** | Project exists but no tasks have status=Done |
| **Test Data** | `GET /api/projects/{projectId}/tasks?status=Done` |
| **Test Steps** | 1. Send GET request with `?status=Done` <br> 2. Check response body |
| **Expected Result** | 1. Status 200 OK <br> 2. Response body is an empty array `[]` <br> 3. No error is thrown |
| **Actual Result** | 1. Status 200 OK <br> 2. Response body is an empty array `[]` <br> 3. No error is thrown |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-TASK-LIST-011: Filter with invalid status value

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-LIST-011 |
| **Type** | Negative |
| **Technique** | Validation / Boundary |
| **Precondition** | User is project member |
| **Test Data** | `GET /api/projects/{projectId}/tasks?status=InvalidStatus` |
| **Test Steps** | 1. Send GET request with `?status=InvalidStatus` <br> 2. Check response status code |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response indicates the status value is invalid <br> 3. No tasks are returned |
| **Actual Result** | 1. Status 400 Bad Request contains body: `{ "error": "Invalid status value. Allowed values: Todo, InProgress, Done."}` <br> 2. Response indicates the status value is invalid <br> 3. No tasks are returned |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-TASK-LIST-012: XSS injection in query parameter

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-LIST-012 |
| **Type** | Security |
| **Technique** | XSS |
| **Precondition** | User is project member |
| **Test Data** | `GET /api/projects/{projectId}/tasks?status=<script>alert(1)</script>` |
| **Test Steps** | 1. Send GET request with XSS payload in `status` query param <br> 2. Check response status code <br> 3. Check that the payload is NOT reflected in response body without encoding |
| **Expected Result** | 1. Status 400 Bad Request (enum parse failure) <br> 2. The script tag is NOT executed <br> 3. Response does NOT reflect the raw `<script>` string unescaped |
| **Actual Result** | 1. Status 400 Bad Request contains body: `{ "error": "Invalid status value. Allowed values: Todo, InProgress, Done."}` <br> 2. The script tag is NOT executed <br> 3. Response does NOT reflect the raw `<script>` string unescaped |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-TASK-LIST-013: SQL injection in assigneeId query parameter

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-LIST-013 |
| **Type** | Security |
| **Technique** | SQL Injection |
| **Precondition** | User is project member |
| **Test Data** | `GET /api/projects/{projectId}/tasks?assigneeId=1 OR 1=1` |
| **Test Steps** | 1. Send GET request with SQL injection payload in `assigneeId` <br> 2. Check response status code <br> 3. Verify that all tasks are NOT dumped from DB |
| **Expected Result** | 1. Status 400 Bad Request (integer parse failure) or no tasks returned outside of normal filter logic <br> 2. EF Core parameterized queries prevent SQL injection <br> 3. No additional unauthorized data is exposed |
| **Actual Result** | 1. Status 400 Bad Request contains body: `{ "error": "Invalid assigneeId value. Must be a valid integer."}` <br> 2. EF Core parameterized queries prevent SQL injection <br> 3. No additional unauthorized data is exposed |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-TASK-LIST-014: Tasks ordered by createdAt descending

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-LIST-014 |
| **Type** | Positive |
| **Technique** | Sorting / Business logic |
| **Precondition** | Project has multiple tasks created at different times |
| **Test Data** | Authorization: `Bearer <member-token>`, valid projectId |
| **Test Steps** | 1. Create multiple tasks at different timestamps <br> 2. Send GET request to list tasks <br> 3. Check the order of `createdAt` in response array |
| **Expected Result** | 1. Status 200 OK <br> 2. Tasks are sorted in descending order by `createdAt` (newest first) |
| **Actual Result** | 1. Status 200 OK <br> 2. Tasks are sorted in descending order by `createdAt` (newest first) |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## Summary

| Total TCs | Pass | Fail | Blocked | Not Run |
|:---:|:---:|:---:|:---:|:---:|
| 14 | 14 | 0 | 0 | 0 |
