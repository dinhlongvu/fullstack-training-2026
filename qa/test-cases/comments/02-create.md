# QA Test Cases - Create Comment Endpoint

## Endpoint

`POST /api/tasks/{taskId}/comments — Create a new comment`

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
| **Actual Result** | 1. Status 404 Not Found với body `{"error": "Task not found"}` |
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
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Returns validation error for `Content` |
| **Actual Result** | 1. Response returned status 400 Bad Request <br> 2. FluentValidation caught the error and returned RFC-compliant Validation Problem format. |
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
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Returns validation error |
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
| **Actual Result** | 1. Response returned status 404 Not Found with `{"error": "Task not found"}` |
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

## TC-TASK-COMMENTS-CREATE-009: Missing content field

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-COMMENTS-CREATE-009 |
| **Type** | Negative |
| **Technique** | Boundary / Validation |
| **Precondition** | User has valid Bearer token |
| **Test Data** | Request body: `{}` or `{"content": null}` |
| **Test Steps** | 1. Send POST request missing the `content` field <br> 2. Check response status code |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Returns validation error for `Content` being required |
| **Actual Result** | 1. Response returned status 400 Bad Request <br> 2. Validation caught the missing field |
| **Status** | Pass |
| **Bug link** | — |

---

## TC-TASK-COMMENTS-CREATE-010: XSS in content

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-COMMENTS-CREATE-010 |
| **Type** | Security |
| **Technique** | Cross-Site Scripting (XSS) |
| **Precondition** | User has valid Bearer token |
| **Test Data** | content: `"<script>alert('xss')</script>"` |
| **Test Steps** | 1. Send POST request with XSS payload <br> 2. Check response status code and data |
| **Expected Result** | 1. Status 201 Created (if backend allows saving) <br> 2. The payload must be properly sanitized or encoded when returned to prevent execution |
| **Actual Result** | 1. Response returned status 201 Created <br> 2. Data is properly saved and will be handled by frontend safely |
| **Status** | Pass |
| **Bug link** | — |

---

## TC-TASK-COMMENTS-CREATE-011: Long unspaced string (UI/UX edge case)

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-COMMENTS-CREATE-011 |
| **Type** | Negative (UI) |
| **Technique** | Exploratory / Edge Case |
| **Precondition** | User has valid Bearer token |
| **Test Data** | content: `"ThisIsAVeryLongStringWithoutAnySpacesThatKeepsGoingAndGoing..."` |
| **Test Steps** | 1. Send POST request with long unspaced string <br> 2. Open UI and verify comment rendering |
| **Expected Result** | 1. Comment is created successfully <br> 2. UI breaks words or wraps text to prevent layout overflow |
| **Actual Result** | 1. Comment created successfully <br> 2. UI does NOT wrap text, causing layout overflow and breaking page width |
| **Status** | Fail |
| **Bug link** | #192 |

---

## TC-TASK-COMMENTS-CREATE-012: Consecutive newlines (UI/UX edge case)

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-COMMENTS-CREATE-012 |
| **Type** | Negative (UI) |
| **Technique** | Exploratory / Edge Case |
| **Precondition** | User has valid Bearer token |
| **Test Data** | content: `"Line 1\n\n\n\n\nLine 2"` (multiple consecutive newlines) |
| **Test Steps** | 1. Send POST request with consecutive newlines <br> 2. Open UI and verify comment rendering |
| **Expected Result** | 1. Comment is created successfully <br> 2. UI collapses consecutive newlines or renders them without excessive gaps |
| **Actual Result** | 1. Comment created successfully <br> 2. UI renders all newlines, creating a huge unexpected gap in the comment content |
| **Status** | Fail |
| **Bug link** | #193 |

---

## Summary

| Total TCs | Pass | Fail | Blocked | Not Run |
|:---:|:---:|:---:|:---:|:---:|
| 12 | 10 | 2 | 0 | 0 |
