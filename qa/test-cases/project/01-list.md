# QA Test Report - List Project Endpoint

## Feature Information

* **Feature:** List Project
* **Endpoint:** `GET /api/Project — Get Project`
* **Tester:** Hoang Phuc
* **Test Date:** 2026-06-30
* **Environment:** Local

---

## TC-Project-LIST-001: List Project with valid Bearer token

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-Project-LIST-001 |
| **Type** | Positive |
| **Technique** | Happy path |
| **Precondition** | User is logged in and has at least one Project |
| **Test Data** | Authorization: `Bearer <valid-token>` |
| **Test Steps** | 1. Send GET request to `/api/Projects` with valid Bearer token <br> 2. Check response status code <br> 3. Check response body |
| **Expected Result** | 1. Status 200 OK <br> 2. Response returns Projects owned by or joined by the current user <br> 3. Each Project contains `id`, `name`, `description`,`createAt`, `updateAt` and `memberCount` |
| **Actual Result** | 1. Status 200 OK <br> 2. Response returns Projects <br> 3. Each Project contains `id`, `name`, `description`,`createAt`, `updateAt` and `memberCount` |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-Project-LIST-002: List Project without Bearer token

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-Project-LIST-002 |
| **Type** | Negative |
| **Technique** | Authorization |
| **Precondition** | None |
| **Test Data** | No Authorization header |
| **Test Steps** | 1. Send GET request to `/api/Projects` without Bearer token <br> 2. Check response status code |
| **Expected Result** | 1. Status 401 Unauthorized <br> 2. Projects are not returned |
| **Actual Result** | 1. Status 401 Unauthorized with response body <br> `{ "error": "Unauthorized. Please provide a valid Bearer token." }` <br> 2. Projects are not returned |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-Project-LIST-003: List Project with invalid Bearer token

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-Project-LIST-003 |
| **Type** | Negative |
| **Technique** | Authorization |
| **Precondition** | None |
| **Test Data** | Authorization: `Bearer invalid-token` |
| **Test Steps** | 1. Send GET request to `/api/Projects` with invalid Bearer token <br> 2. Check response status code |
| **Expected Result** | 1. Status 401 Unauthorized <br> 2. Projects are not returned |
| **Actual Result** | 1. Status 401 Unauthorized with response body <br> `{ "error": "Unauthorized. Please provide a valid Bearer token." }` <br> 2. Projects are not returned |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-Project-LIST-004: List Project when user has no Project

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-Project-LIST-004 |
| **Type** | Positive |
| **Technique** | Empty state |
| **Precondition** | User is logged in and has no Projects |
| **Test Data** | Authorization: `Bearer <valid-token-of-user-with-no-Projects>` |
| **Test Steps** | 1. Send GET request to `/api/Projects` with valid Bearer token <br> 2. Check response status code <br> 3. Check response body |
| **Expected Result** | 1. Status 200 OK <br> 2. Response body returns an empty list `[]` <br> 3. No error is returned |
| **Actual Result** | 1. Status 200 OK <br> 2. Response body returns an empty list `[]` <br> 3. No error is returned |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-Project-LIST-005: List Project only for current user

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-Project-LIST-005 |
| **Type** | Security |
| **Technique** | Authorization / Data Isolation |
| **Precondition** | 1. User A exists.<br>2. User B exists.<br>3. User B owns at least one private Project where User A is neither the owner nor a member.<br>4. User A owns or is a member of at least one Project. |
| **Test Data** | Authorization: `Bearer <user-a-token>` |
| **Test Steps** | 1. Login as User A. <br> 2. Send GET /api/Projects with User A's access token. <br> 3. Verify the returned Project list. |
| **Expected Result** | 1. Response status is 200 OK. <br> 2. Every returned Project belongs to or is shared with User A. <br> 3. No Project owned exclusively by User B is returned. <br> 4. The response contains no metadata or information related to inaccessible Projects. |
| **Actual Result** | 1. Status 200 OK <br> 2. Response includes only Projects where User A is owner/member <br> 3. User B private Projects are not returned |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## TC-Project-LIST-006: List Project includes correct member count

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-Project-LIST-006 |
| **Type** | Positive |
| **Technique** | Data verification |
| **Precondition** | User has a Project with known members |
| **Test Data** | Project with 2 members |
| **Test Steps** | 1. Send GET request to `/api/Projects` <br> 2. Find the Project in response <br> 3. Check `memberCount` value |
| **Expected Result** | 1. Status 200 OK <br> 2. `memberCount` matches actual number of Project members |
| **Actual Result** | 1. Status 200 OK <br> 2. `memberCount` matches actual number of Project members |
| **Status** | ✅ Passed |
| **Bug link** | — |

---

## Summary

| Total TCs | Pass | Fail | Blocked | Not Run |
|:---:|:---:|:---:|:---:|:---:|
| 6 | 6 | 0 | 0 | 0 |
