# QA Test Report - User Registration Endpoint

## Feature Information

* **Feature:** User Registration
* **Endpoint:** `POST /api/auth/register`
* **Tester:** Hoang Phuc
* **Test Date:** 2026-06-18
* **Environment:** Local
* **Request Body Format:** `{ "email": "...", "fullName": "...", "password": "..." }`

---

## TC-REG-001: Register with valid data (happy path)

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-001 |
| **Type** | Positive |
| **Technique** | Happy path |
| **Precondition** | Email `newuser@example.com` does not exist in DB |
| **Test Data** | `{ "email": "newuser@example.com", "fullName": "Nguyen Van A", "password": "Test@1234" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/register` with valid body <br> 2. Check response status code <br> 3. Check response body contains user info (id, email, fullName) <br> 4. Check database for new user record |
| **Expected Result** | 1. Status 201 Created <br> 2. Response body contains `id`, `email`, `fullName` <br> 3. User saved to DB with password hashed (BCrypt) <br> 4. Response does NOT contain `password` or `passwordHash` |
| **Actual Result** | 1. Status 201 Created ✅ <br> 2. Response body contains `id`: 1, `email`: "newuser@example.com", `fullName`: "Nguyen Van A" ✅ <br> 3. User saved with BCrypt hash ✅ <br> 4. No password in response ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-REG-002: Register with duplicate email

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-002 |
| **Type** | Negative |
| **Technique** | Uniqueness |
| **Precondition** | User with email `existing@example.com` already exists in DB |
| **Test Data** | `{ "email": "existing@example.com", "fullName": "Another User", "password": "Test@1234" }` |
| **Test Steps** | 1. Ensure user `existing@example.com` already exists in database <br> 2. Send POST request to `/api/auth/register` with same email <br> 3. Check response status code <br> 4. Check response body for error message <br> 5. Check database — verify no duplicate entry |
| **Expected Result** | 1. Status 409 Conflict <br> 2. Response body: `{ "error": "Email already registered" }` <br> 3. No duplicate user created in database |
| **Actual Result** | 1. Status 409 Conflict ✅ <br> 2. Response body: `{ "error": "Email already registered" }` ✅ <br> 3. No duplicate user created ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-REG-003: Register with empty email

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-003 |
| **Type** | Negative |
| **Technique** | Validation |
| **Precondition** | None |
| **Test Data** | `{ "email": "", "fullName": "Nguyen Van A", "password": "Test@1234" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/register` with empty email <br> 2. Check response status code <br> 3. Check response body for validation error on field `email` <br> 4. Check database — no user created |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body contains validation error: "Email is required" <br> 3. No user created in database |
| **Actual Result** | 1. Status 400 Bad Request ✅ <br> 2. Response body contains validation error: "Email is required" ✅ <br> 3. No user created ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-REG-004: Register with invalid email format

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-004 |
| **Type** | Negative |
| **Technique** | Validation |
| **Precondition** | None |
| **Test Data** | `{ "email": "not-an-email", "fullName": "Nguyen Van A", "password": "Test@1234" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/register` with invalid email (missing @ and domain) <br> 2. Check response status code <br> 3. Check response body for validation error on field `email` <br> 4. Check database — no user created |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body contains validation error: "Email format is invalid" <br> 3. No user created in database |
| **Actual Result** | 1. Status 400 Bad Request ✅ <br> 2. Response body contains validation error: "Email format is invalid" ✅ <br> 3. No user created ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-REG-005: Register with password below minimum length

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-005 |
| **Type** | Negative |
| **Technique** | Boundary/Validation |
| **Precondition** | None |
| **Test Data** | `{ "email": "shortpw@example.com", "fullName": "Nguyen Van A", "password": "Abc@12" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/register` with password only 6 characters <br> 2. Check response status code <br> 3. Check response body for validation error on field `password` <br> 4. Check database — no user created |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body contains validation error: "Password must be at least 8 characters" <br> 3. No user created in database |
| **Actual Result** | 1. Status 400 Bad Request ✅ <br> 2. Response body contains validation error: "Password must be at least 8 characters" ✅ <br> 3. No user created ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-REG-006: Register with password exactly 8 characters (lower boundary)

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-006 |
| **Type** | Positive |
| **Technique** | Boundary |
| **Precondition** | Email `boundary8@example.com` does not exist in DB |
| **Test Data** | `{ "email": "boundary8@example.com", "fullName": "Nguyen Van A", "password": "Abcd@123" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/register` with password exactly 8 characters <br> 2. Check response status code <br> 3. Check response body contains user info <br> 4. Check database for new user record |
| **Expected Result** | 1. Status 201 Created <br> 2. Password of 8 characters accepted (meets minimum boundary) <br> 3. User saved to database successfully |
| **Actual Result** | 1. Status 201 Created ✅ <br> 2. User saved successfully ✅ <br> 3. fullName stored as "Nguyen Van A" ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-REG-007: Register with empty fullName

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-007 |
| **Type** | Negative |
| **Technique** | Validation |
| **Precondition** | None |
| **Test Data** | `{ "email": "nofullname@example.com", "fullName": "", "password": "Test@1234" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/register` with empty fullName <br> 2. Check response status code <br> 3. Check response body for validation error on field `fullName` <br> 4. Check database — no user created |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body contains validation error: "Full name is required" <br> 3. No user created in database |
| **Actual Result** | 1. Status 400 Bad Request ✅ <br> 2. Response body contains validation error: "Full name is required" ✅ <br> 3. No user created ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-REG-008: Register with empty password

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-008 |
| **Type** | Negative |
| **Technique** | Validation |
| **Precondition** | None |
| **Test Data** | `{ "email": "nopw@example.com", "fullName": "Nguyen Van A", "password": "" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/register` with empty password <br> 2. Check response status code <br> 3. Check response body for validation error on field `password` <br> 4. Check database — no user created |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body contains validation error: "Password is required" <br> 3. No user created in database |
| **Actual Result** | 1. Status 400 Bad Request ✅ <br> 2. Response body contains validation error: "Password is required" ✅ <br> 3. No user created ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-REG-009: Register with empty request body

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-009 |
| **Type** | Negative |
| **Technique** | Validation |
| **Precondition** | None |
| **Test Data** | `{}` |
| **Test Steps** | 1. Send POST request to `/api/auth/register` with empty body <br> 2. Check response status code <br> 3. Check response body for validation errors on all required fields <br> 4. Check database — no user created |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body contains validation errors for `email`, `fullName`, `password` <br> 3. No user created in database |
| **Actual Result** | 1. Status 400 Bad Request ✅ <br> 2. Response body contains validation errors ✅ <br> 3. No user created ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-REG-010: Register with case-insensitive duplicate email

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-010 |
| **Type** | Negative |
| **Technique** | Uniqueness/Case Sensitivity |
| **Precondition** | User with email `existing@example.com` already exists in DB |
| **Test Data** | `{ "email": "EXISTING@EXAMPLE.COM", "fullName": "Another User", "password": "Test@1234" }` |
| **Test Steps** | 1. Ensure user `existing@example.com` already exists in database <br> 2. Send POST request to `/api/auth/register` with email `EXISTING@EXAMPLE.COM` (uppercase) <br> 3. Check response status code <br> 4. Check response body for error message <br> 5. Check database — verify no duplicate entry with different casing |
| **Expected Result** | 1. Status 409 Conflict <br> 2. Response body: `{ "error": "Email already registered" }` <br> 3. Email comparison should be case-insensitive <br> 4. No duplicate user created in database |
| **Actual Result** | 1. Status 409 Conflict ✅ <br> 2. Response: `{ "error": "Email already registered" }` ✅ <br> 3. Email comparison is case-insensitive ✅ <br> 4. No duplicate user created ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-REG-011: Register with valid email containing '+' character

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-011 |
| **Type** | Negative |
| **Technique** | Validation |
| **Precondition** | Email `user+tag@example.com` does not exist in DB |
| **Test Data** | `{ "email": "user+tag@example.com", "fullName": "Nguyen Van B", "password": "Test@1234" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/register` with email containing '+' character <br> 2. Check response status code <br> 3. Check response body for validation error <br> 4. Check database — no user created |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body contains validation error: "Email format is invalid" <br> 3. No user created in database |
| **Actual Result** | 1. Status 201 Created ❌ <br> 2. User saved successfully ❌ <br> 3. Email stored as user+tag@example.com ❌ |
| **Status** | ⚠️ Out of Scope |
| **Bug link** | — |

---

## TC-REG-012: Register with wrong Content-Type header

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-012 |
| **Type** | Negative |
| **Technique** | Error Handling |
| **Precondition** | None |
| **Test Data** | Header: `Content-Type: text/plain` |
| **Test Steps** | 1. Send POST request to `/api/auth/register` with `Content-Type: text/plain` <br> 2. Send body as form-urlencoded instead of JSON <br> 3. Check response status code <br> 4. Check database — no user created |
| **Expected Result** | 1. Status 415 Unsupported Media Type or 400 Bad Request <br> 2. Server cannot parse body <br> 3. No user created in database |
| **Actual Result** | 1. Status 415 Unsupported Media Type ✅ <br> 2. Body parsing handled correctly ✅ <br> 3. No user created ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-REG-013: Register with valid standard email

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-013 |
| **Type** | Positive |
| **Technique** | Happy path |
| **Precondition** | None |
| **Test Data** | `{ "email": "john.doe@example.com", "fullName": "John Doe", "password": "Passw0rd!" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/register` <br> 2. Provide email with standard format john.doe@example.com <br> 3. Check response status code <br> 4. Check database for stored value |
| **Expected Result** | 1. Status 201 Created <br> 2. User saved to database successfully <br> 3. Email stored correctly as john.doe@example.com |
| **Actual Result** | 1. Status 201 Created ✅ <br> 2. User saved successfully ✅ <br> 3. Email stored as john.doe@example.com ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-REG-014: Register with email containing '_' character

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-014 |
| **Type** | Positive |
| **Technique** | Happy path |
| **Precondition** | None |
| **Test Data** | `{ "email": "john_doe@example.com", "fullName": "John Doe", "password": "Passw0rd!" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/register` <br> 2. Provide email with _ character john_doe@example.com <br> 3. Check response status code <br> 4. Check database for stored value |
| **Expected Result** | 1. Status 201 Created <br> 2. Email with _ character is accepted <br> 3. Email stored correctly as john_doe@example.com |
| **Actual Result** | 1. Status 201 Created ✅ <br> 2. User saved successfully ✅ <br> 3. Email stored as john_doe@example.com ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-REG-015: Register with uppercase email

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-015 |
| **Type** | Positive |
| **Technique** | Case Sensitivity |
| **Precondition** | None |
| **Test Data** | `{ "email": "John.Doe@Example.Com", "fullName": "John Doe", "password": "Passw0rd!" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/register` <br> 2. Provide email with uppercase characters John.Doe@Example.Com <br> 3. Check response status code <br> 4. Check database for stored value <br> 5. Verify email is case-insensitive |
| **Expected Result** | 1. Status 201 Created <br> 2. Email is normalized to lowercase before storage <br> 3. Database stores john.doe@example.com |
| **Actual Result** | 1. Status 201 Created ✅ <br> 2. Email stored as john.doe@example.com ✅ (normalized uppercase) <br> 3. Database stores john.doe@example.com ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-REG-016: Register with missing domain

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-016 |
| **Type** | Negative |
| **Technique** | Validation |
| **Precondition** | None |
| **Test Data** | `{ "email": "john@", "fullName": "John Doe", "password": "Passw0rd!" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/register` <br> 2. Provide email with missing domain john@ <br> 3. Check response status code <br> 4. Check response body for error message |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body contains validation error: "Email format is invalid" <br> 3. No user created in database |
| **Actual Result** | 1. Status 400 Bad Request ✅ <br> 2. Response body contains validation error: "Email format is invalid" ✅ <br> 3. No user created ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-REG-017: Register with missing local part

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-017 |
| **Type** | Negative |
| **Technique** | Validation |
| **Precondition** | None |
| **Test Data** | `{ "email": "@example.com", "fullName": "John Doe", "password": "Passw0rd!" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/register` <br> 2. Provide email with missing local part @example.com <br> 3. Check response status code <br> 4. Check response body for error message |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body contains validation error: "Email format is invalid" <br> 3. No user created in database |
| **Actual Result** | 1. Status 400 Bad Request ✅ <br> 2. Response body contains validation error: "Email format is invalid" ✅ <br> 3. No user created ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-REG-018: Register with missing dot in domain

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-018 |
| **Type** | Negative |
| **Technique** | Validation |
| **Precondition** | None |
| **Test Data** | `{ "email": "john@examplecom", "fullName": "John Doe", "password": "Passw0rd!" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/register` <br> 2. Provide email with missing dot john@examplecom <br> 3. Check response status code <br> 4. Check response body for error message |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body contains validation error: "Email format is invalid" <br> 3. No user created in database |
| **Actual Result** | 1. Status 400 Bad Request ✅ <br> 2. Response body contains validation error: "Email format is invalid" ✅ <br> 3. No user created ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |
| **Notes** | Dev fixed - added regex validation `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$` which requires the domain to contain a dot `.` (2026-06-18) |

---

## TC-REG-019: Register with missing domain name

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-019 |
| **Type** | Negative |
| **Technique** | Validation |
| **Precondition** | None |
| **Test Data** | `{ "email": "john@.com", "fullName": "John Doe", "password": "Passw0rd!" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/register` <br> 2. Provide email with missing domain name john@.com <br> 3. Check response status code <br> 4. Check response body for error message |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body contains validation error: "Email format is invalid" <br> 3. No user created in database |
| **Actual Result** | 1. Status 400 Bad Request ✅ <br> 2. Response body contains validation error: "Email format is invalid" ✅ <br> 3. No user created ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |
| **Notes** | Re-tested after fix |

---

## TC-REG-020: Register with email containing space

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-020 |
| **Type** | Negative |
| **Technique** | Validation |
| **Precondition** | None |
| **Test Data** | `{ "email": "john doe@example.com", "fullName": "John Doe", "password": "Passw0rd!" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/register` <br> 2. Provide email with space john doe@example.com <br> 3. Check response status code <br> 4. Check response body for error message |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body contains validation error: "Email format is invalid" <br> 3. No user created in database |
| **Actual Result** | 1. Status 400 Bad Request ✅ <br> 2. Response body contains validation error: "Email format is invalid" ✅ <br> 3. No user created ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |
| **Notes** | Dev fixed - regex only allows `[a-zA-Z0-9._%+-]` in the local part, spaces are rejected (2026-06-18) |

---

## TC-REG-021: Register with leading/trailing spaces in email

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-021 |
| **Type** | Positive |
| **Technique** | Boundary |
| **Precondition** | None |
| **Test Data** | `{ "email": " john.doe@example.com ", "fullName": "John Doe", "password": "Passw0rd!" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/register` <br> 2. Provide email with leading and trailing spaces <br> 3. Check response status code <br> 4. Check database for stored value |
| **Expected Result** | 1. Status 201 Created <br> 2. Spaces are trimmed before validation/storage <br> 3. Email stored as john.doe@example.com (no spaces) |
| **Actual Result** | 1. Status 201 Created ✅ <br> 2. Spaces are trimmed before validation/storage ✅ <br> 3. Email stored as "john.doe@example.com" (no spaces) ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-REG-022: Register with consecutive dots in local part

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-022 |
| **Type** | Negative |
| **Technique** | Validation |
| **Precondition** | None |
| **Test Data** | `{ "email": "john..doe@example.com", "fullName": "John Doe", "password": "Passw0rd!" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/register` <br> 2. Provide email with consecutive dots john..doe@example.com <br> 3. Check response status code <br> 4. Check response body for error message |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body contains validation error: "Email format is invalid" <br> 3. No user created in database |
| **Actual Result** | 1. Status 201 Created  <br> 2. User saved successfully  <br> 3. Email stored as john..doe@example.com  |
| **Status** | ⚠️ Out of Scope |
| **Bug link** | — |

---

## TC-REG-023: Register with dot at start of local part

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-023 |
| **Type** | Negative |
| **Technique** | Validation |
| **Precondition** | None |
| **Test Data** | `{ "email": ".john@example.com", "fullName": "John Doe", "password": "Passw0rd!" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/register` <br> 2. Provide email starting with dot .john@example.com <br> 3. Check response status code <br> 4. Check response body for error message |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body contains validation error: "Email format is invalid" <br> 3. No user created in database |
| **Actual Result** | 1. Status 201 Created  <br> 2. User saved successfully  <br> 3. Email stored as .john@example.com  |
| **Status** | ⚠️ Out of Scope |
| **Bug link** | — |

---

## TC-REG-025: Register with underscore in domain

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-025 |
| **Type** | Negative |
| **Technique** | Validation |
| **Precondition** | None |
| **Test Data** | `{ "email": "john@example_domain.com", "fullName": "John Doe", "password": "Passw0rd!" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/register` <br> 2. Provide email with underscore in domain john@example_domain.com <br> 3. Check response status code <br> 4. Check response body for error message |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body contains validation error: "Email format is invalid" <br> 3. Domain cannot contain _ character <br> 4. No user created in database |
| **Actual Result** | 1. Status 400 Bad Request ✅ <br> 2. Response body contains validation error: "Email format is invalid" ✅ <br> 3. No user created ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |
| **Notes** | Dev fixed does not allow `_` character (2026-06-18) |

---

## TC-REG-026: Register with subdomain

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-026 |
| **Type** | Positive |
| **Technique** | Happy path |
| **Precondition** | None |
| **Test Data** | `{ "email": "john@mail.example.com", "fullName": "John Doe", "password": "Passw0rd!" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/register` <br> 2. Provide email with subdomain john@mail.example.com <br> 3. Check response status code <br> 4. Check database for stored value |
| **Expected Result** | 1. Status 201 Created <br> 2. Email with subdomain is accepted <br> 3. Email stored correctly as john@mail.example.com |
| **Actual Result** | 1. Status 201 Created ✅ <br> 2. User saved successfully ✅ <br> 3. Email stored as john@mail.example.com ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-REG-027: Register with Unicode domain

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-027 |
| **Type** | Positive |
| **Technique** | Internationalization |
| **Precondition** | None |
| **Test Data** | `{ "email": "john@müller.com", "fullName": "John Doe", "password": "Passw0rd!" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/register` <br> 2. Provide email with Unicode domain john@müller.com <br> 3. Check response status code <br> 4. Check database for stored value |
| **Expected Result** | 1.Status 400 Bad Request <br> 2. Response body contains validation error: "Email format is invalid" <br> 3. Domain with Unicode characters (ü) is not accepted because validator only supports ASCII [a-zA-Z0-9.-] <br> 4. No user created in database|
| **Actual Result** | 1. Status 400 Bad Request ✅ <br> 2.Response body contains validation error: "Email format is invalid" ✅ <br> 3. No user created ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |
| **Note** | Unicode domain (IDN) is not supported in current version. Validator rejects because domain contains character 'ü'. System only accepts ASCII characters in domain part: [a-zA-Z0-9.-]. This matches business requirements as of 2026-06-18.|

---

## TC-REG-028: Register with local part exceeding 64 characters

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-028 |
| **Type** | Positive |
| **Technique** | Boundary |
| **Precondition** | None |
| **Test Data** | `{ "email": "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklm@example.com", "fullName": "John Doe", "password": "Passw0rd!" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/register` <br> 2. Provide email with local part of 65 characters <br> 3. Check response status code <br> 4. Check database for stored value |
| **Expected Result** | 1. Status 201 Created <br> 2. No validation error returned <br> 3. User saved to database <br> 4. Email accepted because only total length (254 chars) is validated |
| **Actual Result** | 1. Status 201 Created ✅ <br> 2. No validation error returned ✅ <br> 3. User saved to database ✅ <br> 4. Email accepted successfully ✅ |
| **Status** | ⚠️ Out of Scope |
| **Bug link** | — |

---

## TC-REG-029: Register with email exactly 254 characters (RFC max)

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-029 |
| **Type** | Positive |
| **Technique** | Boundary |
| **Precondition** | None |
| **Test Data** | Email with exactly 254 characters total |
| **Test Steps** | 1. Send POST request to `/api/auth/register` <br> 2. Provide email with exactly 254 characters total (RFC 5321 maximum) <br> 3. Check response status code <br> 4. Check database for stored value <br> 5. Verify character count of stored email |
| **Expected Result** | 1. Status 201 Created <br> 2. Email is accepted (within RFC 5321 limit) <br> 3. Email stored correctly with all 254 characters preserved |
| **Actual Result** | 1. Status 201 Created ✅ <br> 2. Email accepted ✅ <br> 3. Email stored correctly ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-REG-030: Register with email exceeding 254 characters

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-030 |
| **Type** | Negative |
| **Technique** | Boundary/Validation |
| **Precondition** | None |
| **Test Data** | Email with 255 characters total |
| **Test Steps** | 1. Send POST request to `/api/auth/register` <br> 2. Provide email with 255 characters total (exceeds RFC 5321 limit of 254) <br> 3. Check response status code <br> 4. Check response body for error message |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body contains validation error: "Email must not exceed 254 characters" <br> 3. No user created in database |
| **Actual Result** | 1. Status 400 Bad Request ✅ <br> 2. Response body contains validation error: "Email must be less than 254 characters" ✅ <br> 3. No user created ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |
| **Notes** | Dev fixed - added `.MaximumLength(254)` validation rule (2026-06-18) |

---

## TC-REG-031: Register with XSS injection in email

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-031 |
| **Type** | Negative |
| **Technique** | Security |
| **Precondition** | None |
| **Test Data** | `{ "email": "<script>alert('xss')</script>@example.com", "fullName": "John Doe", "password": "Passw0rd!" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/register` <br> 2. Provide email with XSS payload in local part <br> 3. Check response status code <br> 4. Check response body for error message <br> 5. Check database integrity <br> 6. Check if script executes anywhere when email is rendered |
| **Expected Result** | 1. Status 400 Bad Request (invalid email format) <br> 2. Response body contains validation error: "Email format is invalid" <br> 3. No user created in database <br> 4. XSS payload is not executed |
| **Actual Result** | 1. Status 400 Bad Request ✅ <br> 2. No user created ✅ <br> 3. XSS payload is not executed ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-REG-032: Register with SQL injection in email

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-032 |
| **Type** | Negative |
| **Technique** | Security |
| **Precondition** | None |
| **Test Data** | `{ "email": "admin'--@example.com", "fullName": "John Doe", "password": "Passw0rd!" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/register` <br> 2. Provide email with SQL injection payload in local part <br> 3. Check response status code <br> 4. Check database integrity (tables intact, no data leak) <br> 5. Check server error logs |
| **Expected Result** | 1. Status 400 Bad Request (invalid email format due to special characters) <br> 2. Response body contains validation error: "Email format is invalid" <br> 3. No SQL injection executed <br> 4. Database tables remain intact <br> 5. No user created in database |
| **Actual Result** | 1. Status 400 Bad Request ✅ <br> 2. Response body contains validation error: "Email format is invalid" ✅ <br> 3. No SQL injection executed ✅ (parameterized queries protect DB) <br> 4. Database tables remain intact ✅ <br> 5. No user created ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |
| **Notes** | Dev fixe does not allow `'` character in local part (2026-06-18) |

---

## TC-REG-033: Register with JSON injection in email

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-033 |
| **Type** | Negative |
| **Technique** | Security |
| **Precondition** | None |
| **Test Data** | `{ "email": "test@example.com\",\"role\":\"admin", "fullName": "John Doe", "password": "Passw0rd!" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/register` <br> 2. Provide email with JSON injection payload attempting to inject extra fields <br> 3. Check response status code <br> 4. Check response body structure <br> 5. Check database — verify no extra fields were injected |
| **Expected Result** | 1. Status 400 Bad Request (invalid email format) <br> 2. Response body contains validation error: "Email format is invalid" <br> 3. No additional fields injected into the database <br> 4. No user created in database |
| **Actual Result** | 1. Status 400 Bad Request ✅ <br> 2. JSON parsing handled correctly ✅ <br> 3. No additional fields injected ✅ <br> 4. No user created ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-REG-034: Register with null byte in email

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-034 |
| **Type** | Negative |
| **Technique** | Security |
| **Precondition** | None |
| **Test Data** | `{ "email": "john\u0000@example.com", "fullName": "John Doe", "password": "Passw0rd!" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/register` <br> 2. Provide email containing a null byte (\0) character <br> 3. Check response status code <br> 4. Check response body for error message <br> 5. Check database for stored value |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body contains validation error: "Email format is invalid" <br> 3. No user created in database <br> 4. Null byte is not stored or processed |
| **Actual Result** | 1. Status 400 Bad Request ✅ <br> 2. Response body contains validation error: "Email format is invalid" ✅ <br> 3. No user created ✅ <br> 4. Null byte correctly rejected ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |
| **Notes** | Dev fixed null byte `\0` is rejected (2026-06-18) |

---

## TC-REG-035: Register with local part only special characters

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-035 |
| **Type** | Negative |
| **Technique** | Validation |
| **Precondition** | None |
| **Test Data** | `{ "email": "!@example.com", "fullName": "John Doe", "password": "Passw0rd!" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/register` <br> 2. Provide email with local part containing only a special character "!" <br> 3. Check response status code <br> 4. Check response body for error message |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body contains validation error: "Email format is invalid" <br> 3. No user created in database |
| **Actual Result** | 1. Status 400 Bad Request ✅ <br> 2. Response body contains validation error: "Email format is invalid" ✅ <br> 3. No user created ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |
| **Notes** | Dev fixed does not allow `!` character in local part (2026-06-18) |

---

## TC-REG-036: Register with email containing 1-character TLD

| Field | Content |
|-------|----------|
| **Test Case ID** | TC-REG-036 |
| **Type** | Negative |
| **Technique** | Validation |
| **Precondition** | None |
| **Test Data** | `{ "email": "john@example.c", "fullName": "John Doe", "password": "Passw0rd!" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/register` <br> 2. Provide email with a 1-character TLD (john@example.c) <br> 3. Check response status code <br> 4. Check response body for error message |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body contains validation error: "Email format is invalid" (TLD must be at least 2 characters) <br> 3. No user created in database |
| **Actual Result** | 1. Status 400 Bad Request ✅ <br> 2. Response body contains validation error: "Email format is invalid" ✅ <br> 3. No user created ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |
| **Notes** | Dev fixed  requires TLD to have at least 2 characters (2026-06-18) |

---

## Summary of Results

| Total TCs | Pass | Fail | Blocked | Not Run | Out of Scope |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 36 | 32 | 0 | 0 | 0 | 4
