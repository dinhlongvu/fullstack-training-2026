# QA Test Cases - Update Comment Endpoint

## Endpoint

`PUT /api/tasks/{taskId}/comments/{commentId} — Update an existing comment`

> **Note:** Feature is not yet implemented in the backend. Actual Result and Status are left empty.

---

## TC-TASK-COMMENTS-UPDATE-001: Comment author updates comment (happy path)

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-COMMENTS-UPDATE-001 |
| **Type** | Positive |
| **Technique** | Happy path |
| **Precondition** | User is logged in and is the author of the comment |
| **Test Data** | Authorization: `Bearer <author-token>`, taskId: valid, commentId: valid, content: `"Updated comment text"` |
| **Test Steps** | 1. Send PUT request to `/api/tasks/{taskId}/comments/{commentId}` with valid token and body <br> 2. Check response status and returned body |
| **Expected Result** | 1. Status 200 OK <br> 2. Returns updated CommentDto with new content and updated `updatedAt` field |
| **Actual Result** | *N/A (Feature not implemented)* |
| **Status** | *Not Run* |
| **Bug link** | — |

---

## TC-TASK-COMMENTS-UPDATE-002: Member tries to update another user's comment

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-COMMENTS-UPDATE-002 |
| **Type** | Negative |
| **Technique** | Authorization |
| **Precondition** | User is a project member but NOT the author of the comment |
| **Test Data** | Authorization: `Bearer <other-member-token>`, taskId: valid, commentId: valid (belongs to someone else) |
| **Test Steps** | 1. Send PUT request to `/api/tasks/{taskId}/comments/{commentId}` with new content <br> 2. Check response status code |
| **Expected Result** | 1. Status 403 Forbidden |
| **Actual Result** | *N/A (Feature not implemented)* |
| **Status** | *Not Run* |
| **Bug link** | — |

---

## TC-TASK-COMMENTS-UPDATE-003: Empty content fails validation

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-COMMENTS-UPDATE-003 |
| **Type** | Negative |
| **Technique** | Validation |
| **Precondition** | User is the author of the comment |
| **Test Data** | content: `"   "` (spaces only or empty) |
| **Test Steps** | 1. Send PUT request with empty content string <br> 2. Check response status code |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Returns validation error for `Content` |
| **Actual Result** | *N/A (Feature not implemented)* |
| **Status** | *Not Run* |
| **Bug link** | — |

---

## TC-TASK-COMMENTS-UPDATE-004: Non-existent comment

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-COMMENTS-UPDATE-004 |
| **Type** | Negative |
| **Technique** | Not found |
| **Precondition** | User has valid Bearer token |
| **Test Data** | commentId: `999999` (does not exist) |
| **Test Steps** | 1. Send PUT request to `/api/tasks/{taskId}/comments/999999` <br> 2. Check response status code |
| **Expected Result** | 1. Status 404 Not Found |
| **Actual Result** | *N/A (Feature not implemented)* |
| **Status** | *Not Run* |
| **Bug link** | — |

---

## Summary

| Total TCs | Pass | Fail | Blocked | Not Run |
|:---:|:---:|:---:|:---:|:---:|
| 4 | 0 | 0 | 0 | 4 |
