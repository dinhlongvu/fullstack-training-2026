# QA Test Cases - Project Detail Endpoint

## Endpoint

`GET /api/projects/{id} — Project detail + members`

---

## TC-PROJ-DETAIL-001: Get project detail as owner

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-DETAIL-001 |
| **Type** | Positive |
| **Technique** | Happy path |
| **Precondition** | User is logged in and owns the project |
| **Test Data** | Project ID owned by current user |
| **Test Steps** | 1. Send GET request to `/api/projects/{id}` with valid Bearer token <br> 2. Check response status code <br> 3. Check response body |
| **Expected Result** | 1. Status 200 OK <br> 2. Response contains project detail <br> 3. Response contains project members |
| **Actual Result** | 1. Status 200 OK <br> 2. Returned details with members. |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-DETAIL-002: Get project detail as project member

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-DETAIL-002 |
| **Type** | Positive |
| **Technique** | Authorization |
| **Precondition** | User is logged in and is a member but not owner |
| **Test Data** | Project ID where current user is a member |
| **Test Steps** | 1. Send GET request to `/api/projects/{id}` with member token <br> 2. Check response status code <br> 3. Check response body |
| **Expected Result** | 1. Status 200 OK <br> 2. Member can view project detail <br> 3. Response includes project members |
| **Actual Result** | 1. Status 200 OK <br> 2. Member can access details. |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-DETAIL-003: Get project detail without Bearer token

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-DETAIL-003 |
| **Type** | Negative |
| **Technique** | Authorization |
| **Precondition** | Project exists |
| **Test Data** | No Authorization header |
| **Test Steps** | 1. Send GET request to `/api/projects/{id}` without Bearer token <br> 2. Check response status code |
| **Expected Result** | 1. Status 401 Unauthorized <br> 2. Project detail is not returned |
| **Actual Result** | 1. Status 401 Unauthorized |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-DETAIL-004: Get project detail as non-member

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-DETAIL-004 |
| **Type** | Negative |
| **Technique** | Authorization/Data isolation |
| **Precondition** | Project exists and current user is not a member |
| **Test Data** | Project ID owned by another user |
| **Test Steps** | 1. Login as non-member user <br> 2. Send GET request to `/api/projects/{id}` <br> 3. Check response status code |
| **Expected Result** | 1. Status 404 Not Found, depending on API design <br> 2. Project detail is not exposed |
| **Actual Result** | 1. Status 404 Not Found <br> 2. Non-member cannot access details. |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-DETAIL-005: Get non-existent project detail

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-DETAIL-005 |
| **Type** | Negative |
| **Technique** | Not found |
| **Precondition** | User is logged in |
| **Test Data** | Project ID does not exist, for example `/api/projects/999999` |
| **Test Steps** | 1. Send GET request to `/api/projects/999999` with valid Bearer token <br> 2. Check response status code |
| **Expected Result** | 1. Status 404 Not Found <br> 2. No project detail is returned |
| **Actual Result** | 1. Status 404 Not Found |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-DETAIL-006: Project detail contains correct member list

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-DETAIL-006 |
| **Type** | Positive |
| **Technique** | Data verification |
| **Precondition** | Project has multiple members |
| **Test Data** | Existing project with owner and member |
| **Test Steps** | 1. Send GET request to `/api/projects/{id}` <br> 2. Check members in response |
| **Expected Result** | 1. Status 200 OK <br> 2. Members list contains correct users <br> 3. Owner/member roles are correct if included |
| **Actual Result** | 1. Members list returned correctly |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-DETAIL-007: Get project detail with invalid ID format

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-DETAIL-007 |
| **Type** | Negative |
| **Technique** | Validation/Routing |
| **Precondition** | User is logged in |
| **Test Data** | Project ID: `abc` |
| **Test Steps** | 1. Send GET request to `/api/projects/abc` <br> 2. Check response status code |
| **Expected Result** | 1. Status 404 Not Found (or 400 Bad Request) <br> 2. Route constraint prevents matching or validation fails |
| **Actual Result** | 1. Status 404 Not Found |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-DETAIL-008: [UI] Task card layout handles long Created At text

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-DETAIL-008 |
| **Type** | Positive |
| **Technique** | UI / Edge case |
| **Precondition** | User is viewing a project detail page with tasks |
| **Test Data** | A task with an extremely long `createdAt` or related text string |
| **Test Steps** | 1. Navigate to Project Detail page (Task Board view) <br> 2. Observe the layout of task cards with long text |
| **Expected Result** | 1. Text is properly truncated (e.g. using ellipsis) or wrapped <br> 2. Card layout does not overflow or break other UI elements |
| **Actual Result** | 1. Long text breaks layout (Originally failed, verified passed after #115 fix) |
| **Status** | ✅ Passed |
| **Bug link** | [#115](https://github.com/dinhlongvu/fullstack-training-2026/issues/115) |

---

## TC-PROJ-DETAIL-009: [Integration] Filter tasks by multiple priority values in URL

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-DETAIL-009 |
| **Type** | Negative/Edge Case |
| **Technique** | Integration / URL Parsing |
| **Precondition** | User is viewing a project detail page with tasks |
| **Test Data** | Query string: `?priority=Low,High` |
| **Test Steps** | 1. Manually update URL to include multiple comma-separated priority values (e.g. `?priority=Low,High`) <br> 2. Reload page <br> 3. Observe tasks displayed |
| **Expected Result** | 1. Application gracefully handles invalid parameter (either takes first valid value, or clears filter) <br> 2. Does not fail silently and display all tasks incorrectly |
| **Actual Result** | 1. Filter logic failed to parse multiple values properly (Originally failed, verified passed after #146 fix) |
| **Status** | ✅ Passed |
| **Bug link** | [#146](https://github.com/dinhlongvu/fullstack-training-2026/issues/146) |

---

## Summary

| Total TCs | Pass | Fail | Blocked | Not Run |
|:---:|:---:|:---:|:---:|:---:|
| 9 | 9 | 0 | 0 | 0 |
