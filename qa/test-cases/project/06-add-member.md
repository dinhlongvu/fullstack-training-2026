# QA Test Cases - Add Project Member Endpoint

## Endpoint

`POST /api/projects/{id}/members — Add member { email }`

---

## TC-PROJ-MEMBER-001: Owner adds member successfully

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-MEMBER-001 |
| **Type** | Positive |
| **Technique** | Happy path |
| **Precondition** | User is logged in as project owner; target user exists and is not already a member |
| **Test Data** | { "email": "member@example.com" } |
| **Test Steps** | 1. Send POST request to `/api/projects/{id}/members` with owner token <br> 2. Provide existing user `email` <br> 3. Check response status code <br> 4. Check project detail or database |
| **Expected Result** | 1. Status 201 Created <br> 2. Target user is added to project members <br> 3. Member appears in project detail |
| **Actual Result** | 1. Status 201 Created <br> 2. Member added |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-MEMBER-002: Non-owner cannot add member

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-MEMBER-002 |
| **Type** | Negative |
| **Technique** | Authorization |
| **Precondition** | Project exists; current user is not project owner |
| **Test Data** | { "email": "member@example.com" } |
| **Test Steps** | 1. Login as non-owner user <br> 2. Send POST request to `/api/projects/{id}/members` <br> 3. Check response status code <br> 4. Verify member was not added |
| **Expected Result** | 1. Status 404 Not Found (or 404 Not Found depending on API spec) <br> 2. User is not added as project member |
| **Actual Result** | 1. Status 404 Not Found |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-MEMBER-003: Add member without Bearer token

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-MEMBER-003 |
| **Type** | Negative |
| **Technique** | Authorization |
| **Precondition** | Project exists |
| **Test Data** | { "email": "member@example.com" } |
| **Test Steps** | 1. Send POST request to `/api/projects/{id}/members` without Bearer token <br> 2. Check response status code |
| **Expected Result** | 1. Status 401 Unauthorized <br> 2. Member is not added |
| **Actual Result** | 1. Status 401 Unauthorized |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-MEMBER-004: Add non-existent user as member

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-MEMBER-004 |
| **Type** | Negative |
| **Technique** | Not found/Validation |
| **Precondition** | Project exists and current user is owner |
| **Test Data** | { "email": "nonexistent@example.com" } |
| **Test Steps** | 1. Send POST request to `/api/projects/{id}/members` with non-existent `email` <br> 2. Check response status code <br> 3. Check response body |
| **Expected Result** | 1. Status 404 Not Found <br> 2. Response indicates user does not exist <br> 3. No member is added |
| **Actual Result** | 1. Status 404 Not Found |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-MEMBER-005: Add duplicate member

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-MEMBER-005 |
| **Type** | Negative |
| **Technique** | Business rule |
| **Precondition** | Target user is already a member of the project |
| **Test Data** | { "email": "member@example.com" } |
| **Test Steps** | 1. Add user to project once <br> 2. Send POST request again with the same `email` <br> 3. Check response status code <br> 4. Check `ProjectMembers` table |
| **Expected Result** | 1. Status 409 Conflict <br> 2. Duplicate member record is not created |
| **Actual Result** | 1. Status 409 Conflict |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-MEMBER-006: Add member to non-existent project

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-MEMBER-006 |
| **Type** | Negative |
| **Technique** | Not found |
| **Precondition** | User is logged in |
| **Test Data** | Project ID: `999999`, body: `{ "email": "member@example.com" }` |
| **Test Steps** | 1. Send POST request to `/api/projects/999999/members` with valid Bearer token <br> 2. Check response status code |
| **Expected Result** | 1. Status 404 Not Found <br> 2. Member is not added |
| **Actual Result** | 1. Status 404 Not Found |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-MEMBER-007: Add member with missing email

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-MEMBER-007 |
| **Type** | Negative |
| **Technique** | Validation |
| **Precondition** | Project exists and current user is owner |
| **Test Data** | {} or { "email": "" } |
| **Test Steps** | 1. Send POST request to `/api/projects/{id}/members` with missing or empty `email` <br> 2. Check response status code <br> 3. Check response body for validation error |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response contains validation error for `email` <br> 3. Member is not added |
| **Actual Result** | 1. Status 400 Bad Request |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-MEMBER-008: Add member with invalid email format

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-MEMBER-008 |
| **Type** | Negative |
| **Technique** | Validation |
| **Precondition** | Project exists and current user is owner |
| **Test Data** | { "email": "not-an-email" } |
| **Test Steps** | 1. Send POST request to `/api/projects/{id}/members` with invalid email format <br> 2. Check response status code <br> 3. Check response body for validation error |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response contains validation error for `email` <br> 3. Member is not added |
| **Actual Result** | 1. Status 400 Bad Request |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-MEMBER-009: Added member can access project detail

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-MEMBER-009 |
| **Type** | Positive |
| **Technique** | Integration |
| **Precondition** | Owner has successfully added target user to project |
| **Test Data** | Token of newly added member |
| **Test Steps** | 1. Owner adds target user as member <br> 2. Login as the added member <br> 3. Send GET request to `/api/projects/{id}` |
| **Expected Result** | 1. Status 200 OK <br> 2. Added member can view project detail <br> 3. Project detail includes the added member in members list |
| **Actual Result** | 1. Status 200 OK <br> 2. Members length is correct |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-MEMBER-010: Owner attempts to add themselves

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-MEMBER-010 |
| **Type** | Negative |
| **Technique** | Business logic |
| **Precondition** | Project exists and current user is owner |
| **Test Data** | { "email": "<owner-email>" } |
| **Test Steps** | 1. Send POST request to `/api/projects/{id}/members` with owner's own email <br> 2. Check response status code |
| **Expected Result** | 1. Status 409 Conflict (since owner is already auto-added as member) <br> 2. Member record is not duplicated |
| **Actual Result** | 1. Status 409 Conflict |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-MEMBER-011: Add member email is case-insensitive

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-MEMBER-011 |
| **Type** | Positive |
| **Technique** | Boundary/Logic |
| **Precondition** | Target user exists as `user@example.com` |
| **Test Data** | { "email": "USER@EXAMPLE.COM" } |
| **Test Steps** | 1. Send POST request to `/api/projects/{id}/members` with uppercase email <br> 2. Check response status code |
| **Expected Result** | 1. Status 201 Created <br> 2. User is successfully matched regardless of casing and added to project |
| **Actual Result** | 1. Status 201 Created |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-MEMBER-012: [Integration] Project list member count updates after adding member

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-MEMBER-012 |
| **Type** | Positive |
| **Technique** | Integration / Frontend State |
| **Precondition** | User is project owner, Project has N members |
| **Test Data** | { "email": "newmember@example.com" } |
| **Test Steps** | 1. Go to Project List page and note member count <br> 2. Add a new member to the project <br> 3. Go back to Project List page |
| **Expected Result** | 1. Member is added successfully <br> 2. Project List displays N+1 members immediately without manual hard refresh |
| **Actual Result** | 1. Member added <br> 2. Project List member count is updated (Verified after bug #136 fix) |
| **Status** | ✅ Passed |
| **Bug link** | [#136](https://github.com/dinhlongvu/fullstack-training-2026/issues/136) |

---

## Summary

| Total TCs | Pass | Fail | Blocked | Not Run |
|:---:|:---:|:---:|:---:|:---:|
| 12 | 12 | 0 | 0 | 0 |
