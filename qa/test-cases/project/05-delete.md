# QA Test Cases - Delete Project Endpoint

## Endpoint

`DELETE /api/projects/{id} — Delete project, owner only`

---

## TC-PROJ-DELETE-001: Owner deletes project successfully

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-DELETE-001 |
| **Type** | Positive |
| **Technique** | Happy path |
| **Precondition** | User is logged in and owns the project |
| **Test Data** | Project ID owned by current user |
| **Test Steps** | 1. Send DELETE request to `/api/projects/{id}` with owner token <br> 2. Check response status code <br> 3. Try to get the deleted project detail |
| **Expected Result** | 1. Status 204 No Content or 200 OK, depending on API design <br> 2. Project is deleted successfully <br> 3. Deleted project is no longer accessible |
| **Actual Result** | 1. Status 204 No Content |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-DELETE-002: Non-owner cannot delete project

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-DELETE-002 |
| **Type** | Negative |
| **Technique** | Authorization |
| **Precondition** | Project exists; current user is not the owner |
| **Test Data** | Project ID owned by another user |
| **Test Steps** | 1. Login as non-owner user <br> 2. Send DELETE request to `/api/projects/{id}` <br> 3. Check response status code <br> 4. Verify project still exists |
| **Expected Result** | 1. Status 404 Not Found, depending on API design <br> 2. Project is not deleted |
| **Actual Result** | 1. Status 404 Not Found |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-DELETE-003: Delete project without Bearer token

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-DELETE-003 |
| **Type** | Negative |
| **Technique** | Authorization |
| **Precondition** | Project exists |
| **Test Data** | No Authorization header |
| **Test Steps** | 1. Send DELETE request to `/api/projects/{id}` without Bearer token <br> 2. Check response status code |
| **Expected Result** | 1. Status 401 Unauthorized <br> 2. Project is not deleted |
| **Actual Result** | 1. Status 401 Unauthorized |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-DELETE-004: Delete non-existent project

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-DELETE-004 |
| **Type** | Negative |
| **Technique** | Not found |
| **Precondition** | User is logged in |
| **Test Data** | Project ID does not exist, for example `/api/projects/999999` |
| **Test Steps** | 1. Send DELETE request to `/api/projects/999999` with valid Bearer token <br> 2. Check response status code |
| **Expected Result** | 1. Status 404 Not Found <br> 2. No project is deleted |
| **Actual Result** | 1. Status 404 Not Found |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-DELETE-005: Deleted project is removed from project list

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-DELETE-005 |
| **Type** | Positive |
| **Technique** | Data verification |
| **Precondition** | User owns a project |
| **Test Data** | Project ID owned by current user |
| **Test Steps** | 1. Delete a project successfully <br> 2. Send GET request to `/api/projects` <br> 3. Check the project list |
| **Expected Result** | 1. Deleted project does not appear in `/api/projects` response <br> 2. Project list remains valid |
| **Actual Result** | 1. Status 200 OK <br> 2. Project list does not contain deleted project |
| **Status** | ✅ Passed |  
| **Bug link** | — |

---

## TC-PROJ-DELETE-006: Project members are removed after project deletion

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-DELETE-006 |
| **Type** | Positive |
| **Technique** | Database verification |
| **Precondition** | User owns a project that has members |
| **Test Data** | Project with at least one member |
| **Test Steps** | 1. Delete project successfully <br> 2. Check `ProjectMembers` table for deleted project |
| **Expected Result** | 1. Related project member records are deleted or no longer linked to an active project <br> 2. No orphaned member records remain if hard delete is used |
| **Actual Result** | 1. Members deleted via cascade |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-DELETE-007: Cascade deletes associated tasks and comments

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-DELETE-007 |
| **Type** | Positive |
| **Technique** | Integration |
| **Precondition** | User owns a project that contains multiple tasks and comments |
| **Test Data** | Project ID with related tasks |
| **Test Steps** | 1. Send DELETE request to `/api/projects/{id}` <br> 2. Check response status code <br> 3. Verify in database that related `Tasks` and `Comments` are deleted |
| **Expected Result** | 1. Status 204 No Content <br> 2. All related tasks and comments for the project are removed from the database |
| **Actual Result** | 1. Tasks deleted via cascade |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-DELETE-008: Double delete project (idempotent/not found)

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-DELETE-008 |
| **Type** | Negative |
| **Technique** | Boundary |
| **Precondition** | User owns a project |
| **Test Data** | Project ID |
| **Test Steps** | 1. Delete project successfully (Status 204) <br> 2. Immediately send another DELETE request for the same `{id}` |
| **Expected Result** | 1. Second request returns Status 404 Not Found <br> 2. No server crash occurs |
| **Actual Result** | 1. Status 404 Not Found |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## Summary

| Total TCs | Pass | Fail | Blocked | Not Run |
|:---:|:---:|:---:|:---:|:---:|
| 8 | 8 | 0 | 0 | 0 |
