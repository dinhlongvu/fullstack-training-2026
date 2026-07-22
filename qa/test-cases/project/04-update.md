# QA Test Cases - Update Project Endpoint

## Endpoint

`PUT /api/projects/{id} — Update project, owner only`

---

## TC-PROJ-UPDATE-001: Owner updates project successfully

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-UPDATE-001 |
| **Type** | Positive |
| **Technique** | Happy path |
| **Precondition** | User is logged in and owns the project |
| **Test Data** | { "name": "Updated Project", "description": "Updated description" } |
| **Test Steps** | 1. Send PUT request to `/api/projects/{id}` with owner token <br> 2. Provide valid request body <br> 3. Check response status code <br> 4. Fetch project detail again |
| **Expected Result** | 1. Status 200 OK or 204 No Content, depending on API design <br> 2. Project data is updated successfully <br> 3. Updated values are visible from detail endpoint |
| **Actual Result** | 1. Status 200 OK |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-UPDATE-002: Non-owner cannot update project

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-UPDATE-002 |
| **Type** | Negative |
| **Technique** | Authorization |
| **Precondition** | Project exists; current user is a member but not owner, or not a project member |
| **Test Data** | { "name": "Hacked Project", "description": "Unauthorized update" } |
| **Test Steps** | 1. Login as non-owner user <br> 2. Send PUT request to `/api/projects/{id}` <br> 3. Check response status code <br> 4. Fetch project detail as owner |
| **Expected Result** | 1. Status 404 Not Found, depending on API design <br> 2. Project is not updated |
| **Actual Result** | 1. Status 404 Not Found |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-UPDATE-003: Update project without Bearer token

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-UPDATE-003 |
| **Type** | Negative |
| **Technique** | Authorization |
| **Precondition** | Project exists |
| **Test Data** | { "name": "Unauthorized Update", "description": "No token" } |
| **Test Steps** | 1. Send PUT request to `/api/projects/{id}` without Bearer token <br> 2. Check response status code |
| **Expected Result** | 1. Status 401 Unauthorized <br> 2. Project is not updated |
| **Actual Result** | 1. Status 401 Unauthorized |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-UPDATE-004: Update project with empty name

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-UPDATE-004 |
| **Type** | Negative |
| **Technique** | Validation |
| **Precondition** | User is owner of the project |
| **Test Data** | { "name": "", "description": "Updated description" } |
| **Test Steps** | 1. Send PUT request to `/api/projects/{id}` with empty `name` <br> 2. Check response status code <br> 3. Check response body for validation error |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response contains validation error for `name` <br> 3. Project is not updated |
| **Actual Result** | 1. Status 400 Bad Request |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-UPDATE-005: Update project with name longer than 200 characters

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-UPDATE-005 |
| **Type** | Negative |
| **Technique** | Boundary/Validation |
| **Precondition** | User is owner of the project |
| **Test Data** | { "name": "<201-character-name>", "description": "Updated description" } |
| **Test Steps** | 1. Send PUT request to `/api/projects/{id}` with name longer than 200 characters <br> 2. Check response status code <br> 3. Check response body for validation error |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response contains validation error for `name` max length <br> 3. Project is not updated |
| **Actual Result** | 1. Status 400 Bad Request |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-UPDATE-006: Update project with description longer than 2000 characters

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-UPDATE-006 |
| **Type** | Negative |
| **Technique** | Boundary/Validation |
| **Precondition** | User is owner of the project |
| **Test Data** | { "name": "Valid Project", "description": "<2001-character-description>" } |
| **Test Steps** | 1. Send PUT request to `/api/projects/{id}` with description longer than 2000 characters <br> 2. Check response status code <br> 3. Check response body for validation error |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response contains validation error for `description` max length <br> 3. Project is not updated |
| **Actual Result** | 1. Status 400 Bad Request |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-UPDATE-007: Update non-existent project

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-UPDATE-007 |
| **Type** | Negative |
| **Technique** | Not found |
| **Precondition** | User is logged in |
| **Test Data** | { "name": "Updated Project", "description": "Updated description" } |
| **Test Steps** | 1. Send PUT request to `/api/projects/999999` with valid Bearer token <br> 2. Check response status code |
| **Expected Result** | 1. Status 404 Not Found <br> 2. No project is updated |
| **Actual Result** | 1. Status 404 Not Found |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-UPDATE-008: Project member (non-owner) cannot update project

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-UPDATE-008 |
| **Type** | Negative |
| **Technique** | Authorization |
| **Precondition** | User is a member of the project, but not the owner |
| **Test Data** | { "name": "Member Updated", "description": "Member description" } |
| **Test Steps** | 1. Login as the non-owner member <br> 2. Send PUT request to `/api/projects/{id}` <br> 3. Check response status code |
| **Expected Result** | 1. Status 404 Not Found <br> 2. Project is not updated |
| **Actual Result** | 1. Status 404 Not Found |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-UPDATE-009: Partial update (only name provided)

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-UPDATE-009 |
| **Type** | Positive |
| **Technique** | Partial data |
| **Precondition** | User is owner of the project |
| **Test Data** | { "name": "New Name Only" } |
| **Test Steps** | 1. Send PUT request to `/api/projects/{id}` without providing `description` <br> 2. Check response status code <br> 3. Fetch project detail again |
| **Expected Result** | 1. Status 200 OK or 204 No Content <br> 2. Project name is updated <br> 3. Previous project description remains unchanged (or is set to null, depending on API spec) |
| **Actual Result** | 1. Status 200 OK <br> 2. Name is updated, description is unchanged |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## Summary

| Total TCs | Pass | Fail | Blocked | Not Run |
|:---:|:---:|:---:|:---:|:---:|
| 9 | 9 | 0 | 0 | 0 |
