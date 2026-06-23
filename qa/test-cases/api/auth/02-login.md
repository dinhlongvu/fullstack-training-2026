# QA Test Report - User Login Endpoint

## Feature Information

* **Feature:** User Login
* **Endpoint:** `POST /api/auth/login`
* **Tester:** Hoang Phuc
* **Test Date:** 2026-06-18
* **Environment:** Local
* **Request Body Format:** `{ "email": "...", "password": "..." }`
* **Common Test Data:** User `testuser@example.com` với password `Test@1234` đã được đăng ký trước

---

## TC-LOGIN-001: Login with valid credentials (happy path)

| Field | Nội dung |
|-------|----------|
| **Test Case ID** | TC-LOGIN-001 |
| **Loại** | Positive |
| **Kỹ thuật** | Happy path |
| **Precondition** | User `testuser@example.com` với password `Test@1234` đã tồn tại trong DB |
| **Test Data** | `{ "email": "testuser@example.com", "password": "Test@1234" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/login` with correct email and password <br> 2. Check response status code <br> 3. Check response body contains JWT token <br> 4. Decode JWT token and verify it contains user info (sub, email) |
| **Expected Result** | 1. Status 200 OK <br> 2. Response body contains: `{ "token": "<JWT>", "user": { "id": <number>, "email": "testuser@example.com", "fullName": "<string>" } }` <br> 3. Decoded token contains `sub` (user id) and `email` (matches login email) |
| **Actual Result** | 1. Status 200 OK ✅ <br> 2. Response body contains: `{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "user": { "id": 1, "email": "testuser@example.com", "fullName": "Nguyen Van A" } }` ✅ <br> 3. Token decoded successfully: contains sub (user id) and email ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-LOGIN-002: Login with non-existent email

| Field | Nội dung |
|-------|----------|
| **Test Case ID** | TC-LOGIN-002 |
| **Loại** | Negative |
| **Kỹ thuật** | Validation |
| **Precondition** | Email `nonexistent@example.com` không tồn tại trong DB |
| **Test Data** | `{ "email": "nonexistent@example.com", "password": "Test@1234" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/login` with non-existent email <br> 2. Check response status code <br> 3. Check response body for error message <br> 4. Verify response does NOT return a token |
| **Expected Result** | 1. Status 401 Unauthorized <br> 2. Response body: `{ "error": "Invalid email or password" }` <br> 3. No token returned <br> 4. Error message is generic (does not reveal whether email exists — security best practice) |
| **Actual Result** | 1. Status 401 Unauthorized ✅ <br> 2. Response body: `{ "error": "Invalid email or password" }` ✅ <br> 3. No token returned ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-LOGIN-003: Login with wrong password

| Field | Nội dung |
|-------|----------|
| **Test Case ID** | TC-LOGIN-003 |
| **Loại** | Negative |
| **Kỹ thuật** | Validation |
| **Precondition** | User `testuser@example.com` với password `Test@1234` đã tồn tại trong DB |
| **Test Data** | `{ "email": "testuser@example.com", "password": "WrongPassword!" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/login` with correct email but wrong password <br> 2. Check response status code <br> 3. Check response body for error message <br> 4. Verify response does NOT return a token |
| **Expected Result** | 1. Status 401 Unauthorized <br> 2. Response body: `{ "error": "Invalid email or password" }` <br> 3. No token returned <br> 4. Error message same as TC-LOGIN-002 (does not distinguish wrong email vs wrong password) |
| **Actual Result** | 1. Status 401 Unauthorized ✅ <br> 2. Response body: `{ "error": "Invalid email or password" }` ✅ <br> 3. No token returned ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-LOGIN-004: Login with empty email

| Field | Nội dung |
|-------|----------|
| **Test Case ID** | TC-LOGIN-004 |
| **Loại** | Negative |
| **Kỹ thuật** | Validation |
| **Precondition** | None |
| **Test Data** | `{ "email": "", "password": "Test@1234" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/login` with empty email <br> 2. Check response status code <br> 3. Check response body for validation error on field `email` <br> 4. Verify response does NOT return a token |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body: `{ "errors": ["Email is required"] }` <br> 3. No token returned |
| **Actual Result** | 1. Status 400 Bad Request ✅ <br> 2. Response body: `{ "errors": ["Email is required"] }` ✅ <br> 3. No token returned ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-LOGIN-005: Login with empty password

| Field | Nội dung |
|-------|----------|
| **Test Case ID** | TC-LOGIN-005 |
| **Loại** | Negative |
| **Kỹ thuật** | Validation |
| **Precondition** | None |
| **Test Data** | `{ "email": "testuser@example.com", "password": "" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/login` with empty password <br> 2. Check response status code <br> 3. Check response body for validation error on field `password` <br> 4. Verify response does NOT return a token |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body: `{ "errors": ["Password is required"] }` <br> 3. No token returned |
| **Actual Result** | 1. Status 400 Bad Request ✅ <br> 2. Response body: `{ "errors": ["Password is required"] }` ✅ <br> 3. No token returned ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-LOGIN-006: Login with empty request body

| Field | Nội dung |
|-------|----------|
| **Test Case ID** | TC-LOGIN-006 |
| **Loại** | Negative |
| **Kỹ thuật** | Validation |
| **Precondition** | None |
| **Test Data** | `{}` |
| **Test Steps** | 1. Send POST request to `/api/auth/login` with empty body <br> 2. Check response status code <br> 3. Check response body for validation errors on both `email` and `password` <br> 4. Verify response does NOT return a token |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body: `{ "errors": ["Email is required", "Password is required"] }` <br> 3. No token returned |
| **Actual Result** | 1. Status 400 Bad Request ✅ <br> 2. Response body: `{ "errors": ["Email is required", "Password is required"] }` ✅ <br> 3. No token returned ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-LOGIN-007: Login with case-insensitive email

| Field | Nội dung |
|-------|----------|
| **Test Case ID** | TC-LOGIN-007 |
| **Loại** | Positive |
| **Kỹ thuật** | Case Sensitivity |
| **Precondition** | User `testuser@example.com` với password `Test@1234` đã tồn tại trong DB |
| **Test Data** | `{ "email": "TESTUSER@EXAMPLE.COM", "password": "Test@1234" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/login` with uppercase email `TESTUSER@EXAMPLE.COM` <br> 2. Check response status code <br> 3. Check response body contains JWT token <br> 4. Verify token is valid |
| **Expected Result** | 1. Status 200 OK <br> 2. Response body contains: `{ "token": "<JWT>", "user": { "id": <number>, "email": "testuser@example.com", "fullName": "<string>" } }` <br> 3. Email comparison is case-insensitive — login succeeds with uppercase email |
| **Actual Result** | 1. Status 200 OK ✅ <br> 2. Response body: `{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "user": { "id": 1, "email": "testuser@example.com", "fullName": "Nguyen Van A" } }` ✅ <br> 3. Token decoded successfully: contains sub (user id) and email (testuser@example.com lowercased) ✅ <br> 4. Login succeeded with uppercase email ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-LOGIN-008: Login with invalid email format

| Field | Nội dung |
|-------|----------|
| **Test Case ID** | TC-LOGIN-008 |
| **Loại** | Negative |
| **Kỹ thuật** | Validation |
| **Precondition** | None |
| **Test Data** | `{ "email": "invalid-email-format", "password": "Test@1234" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/login` with invalid email format (missing @ and domain) <br> 2. Check response status code <br> 3. Check response body for error message <br> 4. Verify response does NOT return a token |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body: `{ "errors": ["Invalid email format"] }` <br> 3. No token returned |
| **Actual Result** | 1. Status 400 Bad Request ✅ <br> 2. Response body: `{ "errors": ["Invalid email format"] }` ✅ <br> 3. No token returned ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-LOGIN-009: Login with SQL injection in email

| Field | Nội dung |
|-------|----------|
| **Test Case ID** | TC-LOGIN-009 |
| **Loại** | Negative |
| **Kỹ thuật** | Security |
| **Precondition** | None |
| **Test Data** | `{ "email": "admin'--@example.com", "password": "anything" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/login` with SQL injection payload in email field <br> 2. Check response status code <br> 3. Check server logs for errors |
| **Expected Result** | 1. Status 401 Unauthorized (not 200 OK) <br> 2. Response: `{ "error": "Invalid email or password" }` <br> 3. No token returned <br> 4. SQL injection not executed |
| **Actual Result** | 1. Status 401 Unauthorized ✅ <br> 2. Response: `{ "error": "Invalid email or password" }` ✅ <br> 3. No token returned ✅ <br> 4. SQL injection failed (safe) ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-LOGIN-010: Login with XSS in email

| Field | Nội dung |
|-------|----------|
| **Test Case ID** | TC-LOGIN-010 |
| **Loại** | Negative |
| **Kỹ thuật** | Security |
| **Precondition** | None |
| **Test Data** | `{ "email": "<script>alert(1)</script>@example.com", "password": "anything" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/login` with XSS payload in email field <br> 2. Check response status code <br> 3. Check if script is executed or reflected unsafely in responses |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body: `{ "errors": ["Invalid email format"] }` <br> 3. Script is NOT executed and HTML elements are not rendered/interpreted <br> 4. No user logged in (no token returned) |
| **Actual Result** | 1. Status 400 Bad Request ✅ <br> 2. Response: `{ "errors": ["Invalid email format"] }` ✅ <br> 3. No script executed ✅ <br> 4. No token returned ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-LOGIN-011: Login with missing password field

| Field | Nội dung |
|-------|----------|
| **Test Case ID** | TC-LOGIN-011 |
| **Loại** | Negative |
| **Kỹ thuật** | Validation |
| **Precondition** | None |
| **Test Data** | `{ "email": "testuser@example.com" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/login` with missing password field in the payload <br> 2. Check response status code |
| **Expected Result** | 1. Status 400 Bad Request <br> 2. Response body contains validation error: "Password is required" <br> 3. No token returned |
| **Actual Result** | 1. Status 400 Bad Request ✅ <br> 2. Response body contains validation error: "Password is required" ✅ <br> 3. No token returned ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-LOGIN-012: Login with wrong Content-Type header

| Field | Nội dung |
|-------|----------|
| **Test Case ID** | TC-LOGIN-012 |
| **Loại** | Negative |
| **Kỹ thuật** | Error Handling |
| **Precondition** | User `testuser@example.com` with password `Test@1234` exists in DB |
| **Test Data** | Header: `Content-Type: text/plain`, Body: form-urlencoded |
| **Test Steps** | 1. Send POST request to `/api/auth/login` with `Content-Type: text/plain` header and form data body <br> 2. Check response status code |
| **Expected Result** | 1. Status 415 Unsupported Media Type or 400 Bad Request <br> 2. No token returned |
| **Actual Result** | 1. Status 415 Unsupported Media Type ✅ <br> 2. No token returned ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-LOGIN-013: Login with long email (stress test)

| Field | Nội dung |
|-------|----------|
| **Test Case ID** | TC-LOGIN-013 |
| **Loại** | Negative |
| **Kỹ thuật** | Boundary |
| **Precondition** | None |
| **Test Data** | Email with length > 254 characters |
| **Test Steps** | 1. Send POST request to `/api/auth/login` with email length exceeding 254 characters <br> 2. Check response status code |
| **Expected Result** | 1. Status 400 Bad Request (email length exceeds limit) or 401 Unauthorized (invalid credentials) <br> 2. No server crash (no 500 Internal Server Error) |
| **Actual Result** | 1. Status 401 Bad Request `{"errors": ["Invalid email or password"]}` ✅ <br> 2. No server crash (no 500 Internal Server Error) ✅ |
| **Status** | ✅ Pass |
| **Bug link** | — |

---

## TC-LOGIN-014: Verify JWT token has expiration time

| Field | Nội dung |
|-------|----------|
| **Test Case ID** | TC-LOGIN-014 |
| **Loại** | Positive |
| **Kỹ thuật** | Token Management |
| **Precondition** | User testuser@example.com exists |
| **Test Data** | `{ "email": "test@example.com", "password": "Test@1234" }` |
| **Test Steps** | 1. Login with valid credentials <br> 2. Receive JWT token <br> 3. Decode JWT token <br> 4. Check exp claim |
| **Expected Result** | 1. Status 200 OK <br> 2. Token contains exp (expiration) claim <br> 3. exp is a future timestamp <br> 4. Token expires after configured time (e.g., 15min) |
| **Actual Result** |  1. Status 200 OK ✅ <br> 2. Token contains exp claim ✅ <br> 3. exp is a future timestamp (15 minutes) ✅ <br> 4. After expiration, request returns 401 Unauthorized with `{ "error": "Unauthorized" }` ✅ |
| **Status** |✅Pass |
| **Bug link** | — |
| **Notes** | Token expiration changed to 15 minutes as per PR. Expired token correctly returns 401. |

---

## Summary of Results

| Total TCs | Pass | Fail | Blocked | Not Run |
|:---:|:---:|:---:|:---:|:---:|
| 14 | 13 | 0 | 0 | 1 |
