# QA Test Cases - Create Project Endpoint

## Endpoint

`POST /api/projects — Create `{ name, description }``

---

## TC-PROJ-CREATE-001: Create project with valid data

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-CREATE-001 |
| **Type** | Positive |
| **Technique** | Happy path |
| **Precondition** | User is logged in and has a valid Bearer token |
| **Test Data** | { "name": "My Project", "description": "Project description" } |
| **Test Steps** | 1. Send POST request to `/api/projects` with valid Bearer token <br> 2. Provide valid request body <br> 3. Check response status code <br> 4. Check response body |
| **Expected Result** | 1. Status 201 Created <br> 2. Response contains `id`, `name`, `description`, `createdAt`, and `createdById` <br> 3. Project is saved to database |
| **Actual Result** | 1. Status 201 Created <br> 2. Response body contains valid project details |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-CREATE-002: Create project without Bearer token

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-CREATE-002 |
| **Type** | Negative |
| **Technique** | Authorization |
| **Precondition** | None |
| **Test Data** | { "name": "Unauthorized Project", "description": "No token" } |
| **Test Steps** | 1. Send POST request to `/api/projects` without Authorization header <br> 2. Check response status code |
| **Expected Result** | 1. Status 401 Unauthorized <br> 2. Project is not created in database |
| **Actual Result** | 1. Status 401 Unauthorized |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-CREATE-003: Create project with empty name

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-CREATE-003 |
| **Type** | Negative |
| **Technique** | Validation |
| **Precondition** | User has valid Bearer token |
| **Test Data** | { "name": "", "description": "Project description" } |
| **Test Steps** | 1. Send POST request to `/api/projects` with empty `name` <br> 2. Check response status code <br> 3. Check response body for validation error |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response contains validation error for `name` <br> 3. Project is not created in database |
| **Actual Result** | 1. Status 400 Bad Request <br> 2. Response body contains validation error for name |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-CREATE-004: Create project with name longer than 200 characters

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-CREATE-004 |
| **Type** | Negative |
| **Technique** | Boundary/Validation |
| **Precondition** | User has valid Bearer token |
| **Test Data** | { "name": "<201-character-name>", "description": "Project description" } |
| **Test Steps** | 1. Send POST request to `/api/projects` with name longer than 200 characters <br> 2. Check response status code <br> 3. Check response body for validation error |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response contains validation error for `name` max length <br> 3. Project is not created |
| **Actual Result** | 1. Status 400 Bad Request <br> 2. Response body contains validation error for name |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-CREATE-005: Create project with name exactly 200 characters

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-CREATE-005 |
| **Type** | Positive |
| **Technique** | Boundary |
| **Precondition** | User has valid Bearer token |
| **Test Data** | { "name": "<200-character-name>", "description": "Project description" } |
| **Test Steps** | 1. Send POST request to `/api/projects` with name exactly 200 characters <br> 2. Check response status code <br> 3. Check response body |
| **Expected Result** | 1. Status 201 Created <br> 2. Project is created successfully <br> 3. Name with exactly 200 characters is accepted |
| **Actual Result** | 1. Status 201 Created |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-CREATE-006: Create project without description

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-CREATE-006 |
| **Type** | Positive |
| **Technique** | Validation |
| **Precondition** | User has valid Bearer token |
| **Test Data** | { "name": "Project Without Description" } |
| **Test Steps** | 1. Send POST request to `/api/projects` without `description` field <br> 2. Check response status code <br> 3. Check response body |
| **Expected Result** | 1. Status 201 Created <br> 2. Project is created successfully <br> 3. Description is optional |
| **Actual Result** | 1. Status 201 Created |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-CREATE-007: Create project with description longer than 2000 characters

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-CREATE-007 |
| **Type** | Negative |
| **Technique** | Boundary/Validation |
| **Precondition** | User has valid Bearer token |
| **Test Data** | { "name": "Valid Project", "description": "<2001-character-description>" } |
| **Test Steps** | 1. Send POST request to `/api/projects` with description longer than 2000 characters <br> 2. Check response status code <br> 3. Check response body for validation error |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response contains validation error for `description` max length <br> 3. Project is not created |
| **Actual Result** | 1. Status 400 Bad Request <br> 2. Response body contains validation error for description |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-CREATE-008: Request body cannot override CreatedById

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-CREATE-008 |
| **Type** | Negative |
| **Technique** | Security |
| **Precondition** | User has valid Bearer token |
| **Test Data** | { "name": "Override Test", "description": "Security test", "createdById": 999 } |
| **Test Steps** | 1. Login as a valid user <br> 2. Send POST request to `/api/projects` with extra `createdById` field <br> 3. Check response/database value |
| **Expected Result** | 1. API ignores `createdById` from request body <br> 2. Project is created with `createdById` from JWT claim <br> 3. Project is not assigned to user id `999` |
| **Actual Result** | 1. Status 201 Created <br> 2. createdById matches JWT user id |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-CREATE-009: Creator is auto-added as Owner member

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-CREATE-009 |
| **Type** | Positive |
| **Technique** | Business logic |
| **Precondition** | User has valid Bearer token |
| **Test Data** | { "name": "Owner Project", "description": "Check owner member" } |
| **Test Steps** | 1. Create project successfully <br> 2. Check `ProjectMembers` table for the created project |
| **Expected Result** | 1. Creator is added to `ProjectMembers` <br> 2. Creator `UserId` matches current user id <br> 3. Creator role is `Owner` |
| **Actual Result** | 1. Creator is added to members list automatically |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-CREATE-010: Create project with whitespace-only name

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-CREATE-010 |
| **Type** | Negative |
| **Technique** | Validation |
| **Precondition** | User has valid Bearer token |
| **Test Data** | { "name": "   ", "description": "Project description" } |
| **Test Steps** | 1. Send POST request to `/api/projects` with whitespace-only `name` <br> 2. Check response status code <br> 3. Check response body for validation error |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response contains validation error for `name` <br> 3. Project is not created |
| **Actual Result** | 1. Status 400 Bad Request |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-PROJ-CREATE-011: Create project with XSS payload in name

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-PROJ-CREATE-011 |
| **Type** | Security |
| **Technique** | Injection |
| **Precondition** | User has valid Bearer token |
| **Test Data** | { "name": "<script>alert('xss')</script>", "description": "Project description" } |
| **Test Steps** | 1. Send POST request to `/api/projects` with XSS payload in `name` <br> 2. Fetch project detail if created successfully <br> 3. Check response body |
| **Expected Result** | 1. Status 201 Created or API sanitizes input <br> 2. If created, the payload is safely stored and returned as string, not executed in context |
| **Actual Result** | 1. Status 201 Created <br> 2. Name is properly stored as string |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## Summary

| Total TCs | Pass | Fail | Blocked | Not Run |
|:---:|:---:|:---:|:---:|:---:|
| 11 | 11 | 0 | 0 | 0 |
