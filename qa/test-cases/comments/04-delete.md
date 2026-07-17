# QA Test Cases - Delete Comment Endpoint

## Endpoint

`DELETE /api/tasks/{taskId}/comments/{commentId} — Delete an existing comment`

> **Note:** Feature is not yet implemented in the backend. Actual Result and Status are left empty.

---

## TC-TASK-COMMENTS-DELETE-001: Comment author deletes comment (happy path)

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-COMMENTS-DELETE-001 |
| **Type** | Positive |
| **Technique** | Happy path |
| **Precondition** | User is logged in and is the author of the comment |
| **Test Data** | Authorization: `Bearer <author-token>`, taskId: valid, commentId: valid |
| **Test Steps** | 1. Send DELETE request to `/api/tasks/{taskId}/comments/{commentId}` with valid token <br> 2. Check response status code |
| **Expected Result** | 1. Status 204 No Content or 200 OK <br> 2. Comment is successfully removed from the database |
| **Actual Result** | *N/A (Feature not implemented)* |
| **Status** | *Not Run* |
| **Bug link** | — |

---

## TC-TASK-COMMENTS-DELETE-002: Project owner deletes member's comment

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-COMMENTS-DELETE-002 |
| **Type** | Positive / Security |
| **Technique** | Authorization / Moderation |
| **Precondition** | User is the project owner |
| **Test Data** | Authorization: `Bearer <owner-token>`, taskId: valid, commentId: valid (created by another member) |
| **Test Steps** | 1. Send DELETE request to `/api/tasks/{taskId}/comments/{commentId}` <br> 2. Check response status code |
| **Expected Result** | 1. Status 204 No Content or 200 OK (Project owner usually has moderation rights to delete any comment in their project) |
| **Actual Result** | *N/A (Feature not implemented)* |
| **Status** | *Not Run* |
| **Bug link** | — |

---

## TC-TASK-COMMENTS-DELETE-003: Member tries to delete another user's comment

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-COMMENTS-DELETE-003 |
| **Type** | Negative |
| **Technique** | Authorization |
| **Precondition** | User is a project member but NOT the author of the comment, and NOT the project owner |
| **Test Data** | Authorization: `Bearer <member-token>`, taskId: valid, commentId: valid (created by someone else) |
| **Test Steps** | 1. Send DELETE request to `/api/tasks/{taskId}/comments/{commentId}` <br> 2. Check response status code |
| **Expected Result** | 1. Status 403 Forbidden |
| **Actual Result** | *N/A (Feature not implemented)* |
| **Status** | *Not Run* |
| **Bug link** | — |

---

## TC-TASK-COMMENTS-DELETE-004: Non-existent comment

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-TASK-COMMENTS-DELETE-004 |
| **Type** | Negative |
| **Technique** | Not found |
| **Precondition** | User has valid Bearer token |
| **Test Data** | commentId: `999999` (does not exist) |
| **Test Steps** | 1. Send DELETE request to `/api/tasks/{taskId}/comments/999999` <br> 2. Check response status code |
| **Expected Result** | 1. Status 404 Not Found |
| **Actual Result** | *N/A (Feature not implemented)* |
| **Status** | *Not Run* |
| **Bug link** | — |

---

## Summary

| Total TCs | Pass | Fail | Blocked | Not Run |
|:---:|:---:|:---:|:---:|:---:|
| 4 | 0 | 0 | 0 | 4 |
