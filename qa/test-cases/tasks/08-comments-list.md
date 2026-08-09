# QA Test Cases - Get Task Comments Endpoint

## Endpoint

`GET /api/tasks/{id}/comments — Get all comments for a task`

> **Tested on:** 2026-07-09 — Branch `hoc/task-34-comments-list`
> **Tool:** Playwright E2E (`--workers=1`)
> **Backend handler:** `GetTaskCommentsQuery.cs` — checks project membership (owner + member can view)

---

## TC-TASK-COMMENTS-001: Owner gets comments (happy path)

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-COMMENTS-001 |
| **Type** | Positive |
| **Technique** | Happy path |
| **Precondition** | User is logged in as project owner; task exists |
| **Test Data** | Authorization: `Bearer <owner-token>`, taskId: valid |
| **Test Steps** | 1. Send GET request to `/api/tasks/{id}/comments` with owner token <br> 2. Check response status code and data structure |
| **Expected Result** | 1. Status 200 OK <br> 2. Returns an array of CommentDto |
| **Actual Result** | 1. Response returned status 200 OK <br> 2. Data is a valid JSON array |
| **Status** | ✅Pass |
| **Bug link** | — |

---

## TC-TASK-COMMENTS-002: Member gets comments

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-COMMENTS-002 |
| **Type** | Positive |
| **Technique** | Authorization |
| **Precondition** | User is a project member (not owner); task exists |
| **Test Data** | Authorization: `Bearer <member-token>`, taskId: valid |
| **Test Steps** | 1. Send GET request to `/api/tasks/{id}/comments` with member token <br> 2. Check response status code |
| **Expected Result** | 1. Status 200 OK <br> 2. Members are allowed to view task comments |
| **Actual Result** | 1. Response returned status 200 OK <br> 2. Returned valid array of comments |
| **Status** |  ✅Pass |
| **Bug link** | — |

---

## TC-TASK-COMMENTS-003: No token

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-COMMENTS-003 |
| **Type** | Negative |
| **Technique** | Authorization |
| **Precondition** | Task exists |
| **Test Data** | No Authorization header, taskId: valid |
| **Test Steps** | 1. Send GET request to `/api/tasks/{id}/comments` without any token <br> 2. Check response status code |
| **Expected Result** | 1. Status 401 Unauthorized |
| **Actual Result** | 1. Response returned status 401 Unauthorized |
| **Status** |  ✅Pass |
| **Bug link** | — |

---

## TC-TASK-COMMENTS-004: Non-member cannot view comments

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-COMMENTS-004 |
| **Type** | Negative |
| **Technique** | Authorization / Data isolation |
| **Precondition** | Authenticated user is NOT a member of the project containing the task |
| **Test Data** | Authorization: `Bearer <non-member-token>`, taskId: valid but in a foreign project |
| **Test Steps** | 1. Send GET request to `/api/tasks/{id}/comments` <br> 2. Check response status code |
| **Expected Result** | 1. Status 404 Not Found (không lộ sự tồn tại của task cho người ngoài project) <br> 2. Nội dung comment KHÔNG bị lộ cho non-member |
| **Actual Result** | 1. Status 404 Not Found với body `{"error":"Task not found","traceId":"..."}` |
| **Status** | ✅Pass |
| **Bug link** | — |

---

## TC-TASK-COMMENTS-005: Non-existent task

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-COMMENTS-005 |
| **Type** | Negative |
| **Technique** | Not found |
| **Precondition** | User has valid Bearer token |
| **Test Data** | taskId: `999999` (does not exist) |
| **Test Steps** | 1. Send GET request to `/api/tasks/999999/comments` <br> 2. Check response status code |
| **Expected Result** | 1. Status 404 Not Found |
| **Actual Result** | 1. Response returned status 404 Not Found with `{"error":"Task not found","traceId":"..."}` |
| **Status** | ✅Pass |
| **Bug link** | — |

---

## TC-TASK-COMMENTS-006: Invalid taskId format

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-COMMENTS-006 |
| **Type** | Negative |
| **Technique** | Boundary / Validation |
| **Precondition** | User has valid Bearer token |
| **Test Data** | taskId: `"invalid_id"` in URL path |
| **Test Steps** | 1. Send GET request to `/api/tasks/invalid_id/comments` <br> 2. Check response status code |
| **Expected Result** | 1. Status 404 Not Found (route constraint `{taskId:int}` rejects non-integer) |
| **Actual Result** | 1. Response returned status 404 Not Found. ASP.NET route constraint matched correctly. |
| **Status** | ✅Pass |
| **Bug link** | — |

---

## TC-TASK-COMMENTS-007: SQL Injection in taskId parameter

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-COMMENTS-007 |
| **Type** | Security |
| **Technique** | SQL Injection |
| **Precondition** | User has valid Bearer token |
| **Test Data** | URL: `/api/tasks/1; DROP TABLE Tasks; --/comments` |
| **Test Steps** | 1. Send GET request with SQL injection payload in the URL path <br> 2. Check response status code |
| **Expected Result** | 1. Status 404 Not Found (route constraint `{taskId:int}` rejects non-integer) |
| **Actual Result** | 1. Response returned status 404 Not Found. Route constraint blocked the payload. |
| **Status** | Pass |
| **Bug link** | — |

---

## Summary

| Total TCs | Pass | Fail | Blocked | Not Run |
|:---:|:---:|:---:|:---:|:---:|
| 7 | 7 | 0 | 0 | 0 |
