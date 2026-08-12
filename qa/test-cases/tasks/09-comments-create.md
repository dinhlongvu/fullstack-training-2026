# QA Test Cases - Create Comment Endpoint

## Endpoint

`POST /api/tasks/{taskId}/comments — Create a new comment`

> **Tested on:** 2026-07-09 — Branch `hoc/task-35-comments-create`
> **Tool:** Playwright E2E (`--workers=1`)
> **Backend handler:** `CreateCommentHandler.cs` (Fluent Validation enabled)

---

## TC-TASK-COMMENTS-CREATE-001: Owner creates comment (happy path)

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-COMMENTS-CREATE-001 |
| **Type** | Positive |
| **Technique** | Happy path |
| **Precondition** | User is logged in as project owner; task exists |
| **Test Data** | Authorization: `Bearer <owner-token>`, taskId: valid, content: `"This is a test comment by owner"` |
| **Test Steps** | 1. Send POST request to `/api/tasks/{taskId}/comments` with valid token and body <br> 2. Check response status and returned body |
| **Expected Result** | 1. Status 201 Created <br> 2. Returns CommentDto with `id`, valid `createdAt`, `updatedAt`, and correct `authorName` |
| **Actual Result** | 1. Response returned status 201 Created <br> 2. Body matches expected CommentDto including AutoMapper mapped fields. |
| **Status** | Pass |
| **Bug link** | — |

---

## TC-TASK-COMMENTS-CREATE-002: Member creates comment

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-COMMENTS-CREATE-002 |
| **Type** | Positive |
| **Technique** | Authorization |
| **Precondition** | User is a project member (not owner); task exists |
| **Test Data** | Authorization: `Bearer <member-token>`, taskId: valid, content: `"Member commenting"` |
| **Test Steps** | 1. Send POST request with member token and valid body <br> 2. Check response status code |
| **Expected Result** | 1. Status 201 Created <br> 2. Members are allowed to add comments |
| **Actual Result** | 1. Response returned status 201 Created <br> 2. Correct `authorId` associated with member user |
| **Status** | Pass |
| **Bug link** | — |

---

## TC-TASK-COMMENTS-CREATE-003: No token

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-COMMENTS-CREATE-003 |
| **Type** | Negative |
| **Technique** | Authorization |
| **Precondition** | Task exists |
| **Test Data** | No Authorization header, content: valid |
| **Test Steps** | 1. Send POST request without any token <br> 2. Check response status code |
| **Expected Result** | 1. Status 401 Unauthorized |
| **Actual Result** | 1. Response returned status 401 Unauthorized |
| **Status** | Pass |
| **Bug link** | — |

---

## TC-TASK-COMMENTS-CREATE-004: Non-member cannot create comment

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-COMMENTS-CREATE-004 |
| **Type** | Negative |
| **Technique** | Authorization / Data isolation |
| **Precondition** | Authenticated user is NOT a member of the project containing the task |
| **Test Data** | Authorization: `Bearer <non-member-token>`, taskId: valid but in a foreign project |
| **Test Steps** | 1. Send POST request with non-member token <br> 2. Check response status code |
| **Expected Result** | 1. Status 404 Not Found (không lộ sự tồn tại của task cho người ngoài project) <br> 2. Nội dung comment KHÔNG bị lộ cho non-member |
| **Actual Result** | 1. Status 404 Not Found với body `{"error":"Task not found","traceId":"..."}` |
| **Status** | Pass |
| **Bug link** | — |

---

## TC-TASK-COMMENTS-CREATE-005: Empty content fails validation

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-COMMENTS-CREATE-005 |
| **Type** | Negative |
| **Technique** | Boundary / Validation |
| **Precondition** | User has valid Bearer token |
| **Test Data** | content: `"   "` (spaces only or empty) |
| **Test Steps** | 1. Send POST request with empty content string <br> 2. Check response status code |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body: `{"errors":["Content is required."],"traceId":"..."}` |
| **Actual Result** | 1. Response returned status 400 Bad Request <br> 2. Response body: `{"errors":["Content is required."],"traceId":"..."}` |
| **Status** | Pass |
| **Bug link** | — |

---

## TC-TASK-COMMENTS-CREATE-006: Exceeding max length fails validation

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-COMMENTS-CREATE-006 |
| **Type** | Negative |
| **Technique** | Boundary / Validation |
| **Precondition** | User has valid Bearer token |
| **Test Data** | content: String with 2001 characters |
| **Test Steps** | 1. Send POST request with content > 2000 chars <br> 2. Check response status code |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body: `{"errors":["Content must be 2000 characters or less."],"traceId":"..."}` |
| **Actual Result** | 1. Response returned status 400 Bad Request (rejected by `MaximumLength(2000)` rule) |
| **Status** | Pass |
| **Bug link** | — |

---

## TC-TASK-COMMENTS-CREATE-007: Non-existent task

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-COMMENTS-CREATE-007 |
| **Type** | Negative |
| **Technique** | Not found |
| **Precondition** | User has valid Bearer token |
| **Test Data** | taskId: `999999` (does not exist) |
| **Test Steps** | 1. Send POST request to `/api/tasks/999999/comments` <br> 2. Check response status code |
| **Expected Result** | 1. Status 404 Not Found |
| **Actual Result** | 1. Response returned status 404 Not Found with `{"error":"Task not found","traceId":"..."}` |
| **Status** | Pass |
| **Bug link** | — |

---

## TC-TASK-COMMENTS-CREATE-008: Invalid taskId format

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-COMMENTS-CREATE-008 |
| **Type** | Negative |
| **Technique** | Boundary |
| **Precondition** | User has valid Bearer token |
| **Test Data** | taskId: `"invalid_id"` |
| **Test Steps** | 1. Send POST request to `/api/tasks/invalid_id/comments` <br> 2. Check response status code |
| **Expected Result** | 1. Status 404 Not Found (Route Constraint) |
| **Actual Result** | 1. ASP.NET route constraint `{taskId:int}` correctly blocked the request returning 404 Not Found |
| **Status** | Pass |
| **Bug link** | — |

---

## Summary

| Total TCs | Pass | Fail | Blocked | Not Run |
|:---:|:---:|:---:|:---:|:---:|
| 8 | 8 | 0 | 0 | 0 |
