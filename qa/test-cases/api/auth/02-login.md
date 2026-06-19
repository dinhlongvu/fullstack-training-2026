# Test Cases: User Login

- **Feature:** User Login
- **Endpoint / Page:** `POST /api/auth/login`
- **Author:** Phúc
- **Date:** 2026-06-18
- **Test Data chung:** User `testuser@example.com` với password `Test@1234` đã được đăng ký trước. Request Body Format: `{ "email": "...", "password": "..." }`

---

## TC-LOGIN-001: Login with valid credentials (happy path)

| Field | Nội dung |
|-------|----------|
| **Test Case ID** | TC-LOGIN-001 |
| **Loại** | Positive |
| **Kỹ thuật** | Equivalence Partitioning — valid credentials partition |
| **Precondition** | User `testuser@example.com` với password `Test@1234` đã tồn tại trong DB |
| **Test Data** | `{ "email": "testuser@example.com", "password": "Test@1234" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/login` with correct email and password <br> 2. Check response status code <br> 3. Check response body contains JWT token <br> 4. Decode JWT token and verify it contains user info (`sub`, `email`) |
| **Expected Result** | 1. Status code: `200 OK` <br> 2. Response body: `{ "token": "<JWT>" }` <br> 3. Token is valid, decodes to contain `sub` (user id) and `email` |
| **Actual Result** | 1. Status code: 200 OK ✅ <br> 2. Response body: `{ "token": "eyJhbGciOi..." }` ✅ <br> 3. Token decoded: contains sub and email ✅ |
| **Status** | ✅ Pass |
| **Bug link** | |

---

## TC-LOGIN-002: Login with non-existent email

| Field | Nội dung |
|-------|----------|
| **Test Case ID** | TC-LOGIN-002 |
| **Loại** | Negative |
| **Kỹ thuật** | Equivalence Partitioning — non-existent email partition |
| **Precondition** | Email `nonexistent@example.com` không tồn tại trong DB |
| **Test Data** | `{ "email": "nonexistent@example.com", "password": "Test@1234" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/login` with non-existent email <br> 2. Check response status code <br> 3. Check response body for error message <br> 4. Verify response does NOT return a token |
| **Expected Result** | 1. Status code: `401 Unauthorized` <br> 2. Response body: `{ "error": "Invalid email or password" }` <br> 3. No token returned <br> 4. Error message is generic (does not reveal whether email exists — security best practice) |
| **Actual Result** | 1. Status code: 401 Unauthorized ✅ <br> 2. Response: `{ "error": "Invalid email or password" }` ✅ <br> 3. No token returned ✅ |
| **Status** | ✅ Pass |
| **Bug link** | |

---

## TC-LOGIN-003: Login with wrong password

| Field | Nội dung |
|-------|----------|
| **Test Case ID** | TC-LOGIN-003 |
| **Loại** | Negative |
| **Kỹ thuật** | Equivalence Partitioning — wrong password partition |
| **Precondition** | User `testuser@example.com` với password `Test@1234` đã tồn tại trong DB |
| **Test Data** | `{ "email": "testuser@example.com", "password": "WrongPassword!" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/login` with correct email but wrong password <br> 2. Check response status code <br> 3. Check response body for error message <br> 4. Verify response does NOT return a token |
| **Expected Result** | 1. Status code: `401 Unauthorized` <br> 2. Response body: `{ "error": "Invalid email or password" }` <br> 3. No token returned <br> 4. Error message same as TC-LOGIN-002 (does not distinguish wrong email vs wrong password) |
| **Actual Result** | 1. Status code: 401 Unauthorized ✅ <br> 2. Response: `{ "error": "Invalid email or password" }` ✅ <br> 3. No token returned ✅ |
| **Status** | ✅ Pass |
| **Bug link** | |

---

## TC-LOGIN-004: Login with empty email

| Field | Nội dung |
|-------|----------|
| **Test Case ID** | TC-LOGIN-004 |
| **Loại** | Negative |
| **Kỹ thuật** | Equivalence Partitioning — empty required field |
| **Precondition** | None |
| **Test Data** | `{ "email": "", "password": "Test@1234" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/login` with empty email <br> 2. Check response status code <br> 3. Check response body for validation error on field `email` <br> 4. Verify response does NOT return a token |
| **Expected Result** | 1. Status code: `400 Bad Request` <br> 2. Response body chứa validation error: "Email is required" hoặc tương tự <br> 3. No token returned |
| **Actual Result** | 1. Status code: 400 Bad Request ✅ <br> 2. Response: `{ "errors": { "email": ["Email is required"] } }` ✅ <br> 3. No token returned ✅ |
| **Status** | ✅ Pass |
| **Bug link** | |

---

## TC-LOGIN-005: Login with empty password

| Field | Nội dung |
|-------|----------|
| **Test Case ID** | TC-LOGIN-005 |
| **Loại** | Negative |
| **Kỹ thuật** | Equivalence Partitioning — empty required field |
| **Precondition** | None |
| **Test Data** | `{ "email": "testuser@example.com", "password": "" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/login` with empty password <br> 2. Check response status code <br> 3. Check response body for validation error on field `password` <br> 4. Verify response does NOT return a token |
| **Expected Result** | 1. Status code: `400 Bad Request` <br> 2. Response body chứa validation error: "Password is required" hoặc tương tự <br> 3. No token returned |
| **Actual Result** | 1. Status code: 400 Bad Request ✅ <br> 2. Response: `{ "errors": { "password": ["Password is required"] } }` ✅ <br> 3. No token returned ✅ |
| **Status** | ✅ Pass |
| **Bug link** | |

---

## TC-LOGIN-006: Login with empty request body

| Field | Nội dung |
|-------|----------|
| **Test Case ID** | TC-LOGIN-006 |
| **Loại** | Negative |
| **Kỹ thuật** | Equivalence Partitioning — tất cả fields đều thiếu |
| **Precondition** | None |
| **Test Data** | Request body: `{}` (hoặc no body) |
| **Test Steps** | 1. Send POST request to `/api/auth/login` with empty body `{}` <br> 2. Check response status code <br> 3. Check response body for validation errors on both `email` and `password` <br> 4. Verify response does NOT return a token |
| **Expected Result** | 1. Status code: `400 Bad Request` <br> 2. Response body chứa validation errors cho `email` và `password` <br> 3. No token returned |
| **Actual Result** | 1. Status code: 400 Bad Request ✅ <br> 2. Response: `{ "errors": { "email": ["Email is required"], "password": ["Password is required"] } }` ✅ <br> 3. No token returned ✅ |
| **Status** | ✅ Pass |
| **Bug link** | |

---

## TC-LOGIN-007: Login with case-insensitive email

| Field | Nội dung |
|-------|----------|
| **Test Case ID** | TC-LOGIN-007 |
| **Loại** | Positive |
| **Kỹ thuật** | Equivalence Partitioning — email case normalization |
| **Precondition** | User `testuser@example.com` với password `Test@1234` đã tồn tại trong DB |
| **Test Data** | `{ "email": "TESTUSER@EXAMPLE.COM", "password": "Test@1234" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/login` with uppercase email `TESTUSER@EXAMPLE.COM` <br> 2. Check response status code <br> 3. Check response body contains JWT token <br> 4. Verify token is valid |
| **Expected Result** | 1. Status code: `200 OK` <br> 2. Response body: `{ "token": "<JWT>" }` <br> 3. Email comparison is case-insensitive — login succeeds with uppercase email |
| **Actual Result** | 1. Status code: 200 OK ✅ <br> 2. Response body: `{ "token": "eyJhbGciOi..." }` ✅ <br> 3. Token decoded: email lowercased ✅ <br> 4. Login succeeded ✅ |
| **Status** | ✅ Pass |
| **Bug link** | |

---

## TC-LOGIN-008: Login with invalid email format

| Field | Nội dung |
|-------|----------|
| **Test Case ID** | TC-LOGIN-008 |
| **Loại** | Negative |
| **Kỹ thuật** | Equivalence Partitioning — invalid email format partition |
| **Precondition** | None |
| **Test Data** | `{ "email": "invalid-email-format", "password": "Test@1234" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/login` with invalid email format (missing @ and domain) <br> 2. Check response status code <br> 3. Check response body for error message <br> 4. Verify response does NOT return a token |
| **Expected Result** | 1. Status code: `400 Bad Request` hoặc `401 Unauthorized` <br> 2. Response body chứa error message <br> 3. No token returned |
| **Actual Result** | 1. Status code: 400 Bad Request ✅ <br> 2. Response: `{ "errors": { "email": ["Email must be a valid email address"] } }` ✅ <br> 3. No token returned ✅ |
| **Status** | ✅ Pass |
| **Bug link** | |

---

## TC-LOGIN-009: Login with SQL injection in email

| Field | Nội dung |
|-------|----------|
| **Test Case ID** | TC-LOGIN-009 |
| **Loại** | Negative |
| **Kỹ thuật** | Equivalence Partitioning — security testing (SQL injection) |
| **Precondition** | None |
| **Test Data** | `{ "email": "admin'--@example.com", "password": "anything" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/login` with SQL injection payload in email <br> 2. Check response status code <br> 3. Check server logs for errors |
| **Expected Result** | 1. Status code: `401 Unauthorized` (not 200 OK) <br> 2. Response: `{ "error": "Invalid email or password" }` <br> 3. No token returned <br> 4. SQL injection không executed |
| **Actual Result** | _(để trống — điền khi chạy)_ |
| **Status** | ⬜ Not Run |
| **Bug link** | |

---

## TC-LOGIN-010: Login with XSS in email

| Field | Nội dung |
|-------|----------|
| **Test Case ID** | TC-LOGIN-010 |
| **Loại** | Negative |
| **Kỹ thuật** | Equivalence Partitioning — security testing (XSS) |
| **Precondition** | None |
| **Test Data** | `{ "email": "<script>alert(1)</script>@example.com", "password": "anything" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/login` with XSS payload in email <br> 2. Check response status code <br> 3. Check if script is executed or reflected unsafely in responses |
| **Expected Result** | 1. Status code: `400 Bad Request` <br> 2. Script is NOT executed and HTML elements are not rendered/interpreted <br> 3. No user logged in (no token returned) |
| **Actual Result** | _(để trống — điền khi chạy)_ |
| **Status** | ⬜ Not Run |
| **Bug link** | |

---

## TC-LOGIN-011: Login with missing email field

| Field | Nội dung |
|-------|----------|
| **Test Case ID** | TC-LOGIN-011 |
| **Loại** | Negative |
| **Kỹ thuật** | Equivalence Partitioning — missing required field in payload |
| **Precondition** | None |
| **Test Data** | `{ "password": "Test@1234" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/login` with missing email field in payload <br> 2. Check response status code |
| **Expected Result** | 1. Status code: `400 Bad Request` <br> 2. Response body chứa validation error: "Email is required" <br> 3. No token returned |
| **Actual Result** | _(để trống — điền khi chạy)_ |
| **Status** | ⬜ Not Run |
| **Bug link** | |

---

## TC-LOGIN-012: Login with missing password field

| Field | Nội dung |
|-------|----------|
| **Test Case ID** | TC-LOGIN-012 |
| **Loại** | Negative |
| **Kỹ thuật** | Equivalence Partitioning — missing required field in payload |
| **Precondition** | None |
| **Test Data** | `{ "email": "testuser@example.com" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/login` with missing password field in payload <br> 2. Check response status code |
| **Expected Result** | 1. Status code: `400 Bad Request` <br> 2. Response body chứa validation error: "Password is required" <br> 3. No token returned |
| **Actual Result** | _(để trống — điền khi chạy)_ |
| **Status** | ⬜ Not Run |
| **Bug link** | |

---

## TC-LOGIN-013: Login with extra field (role injection attempt)

| Field | Nội dung |
|-------|----------|
| **Test Case ID** | TC-LOGIN-013 |
| **Loại** | Negative |
| **Kỹ thuật** | Equivalence Partitioning — security testing (mass assignment / role injection) |
| **Precondition** | User `testuser@example.com` with password `Test@1234` exists in DB |
| **Test Data** | `{ "email": "testuser@example.com", "password": "Test@1234", "role": "admin" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/login` with extra field `role`: `admin` in body <br> 2. Check response status code <br> 3. Verify if role claims or extra attributes are injected |
| **Expected Result** | 1. Status code: `200 OK` <br> 2. Extra field `role` is IGNORED by the server <br> 3. Response token does NOT contain injected `role` claim or grant admin access |
| **Actual Result** | _(để trống — điền khi chạy)_ |
| **Status** | ⬜ Not Run |
| **Bug link** | |

---

## TC-LOGIN-014: Login with wrong Content-Type (text/plain)

| Field | Nội dung |
|-------|----------|
| **Test Case ID** | TC-LOGIN-014 |
| **Loại** | Negative |
| **Kỹ thuật** | Equivalence Partitioning — invalid Content-Type partition |
| **Precondition** | User `testuser@example.com` with password `Test@1234` exists in DB |
| **Test Data** | Header: `Content-Type: text/plain`, Body: `email=testuser@example.com&password=Test@1234` |
| **Test Steps** | 1. Send POST request to `/api/auth/login` with `Content-Type: text/plain` header and form data body <br> 2. Check response status code |
| **Expected Result** | 1. Status code: `415 Unsupported Media Type` hoặc `400 Bad Request` <br> 2. No token returned |
| **Actual Result** | _(để trống — điền khi chạy)_ |
| **Status** | ⬜ Not Run |
| **Bug link** | |

---

## TC-LOGIN-015: Login with long email (stress test / boundary)

| Field | Nội dung |
|-------|----------|
| **Test Case ID** | TC-LOGIN-015 |
| **Loại** | Negative |
| **Kỹ thuật** | Boundary Value Analysis — email length > 254 characters |
| **Precondition** | None |
| **Test Data** | `{ "email": "aaa...aaa@example.com", "password": "anything" }` (email length > 254 characters) |
| **Test Steps** | 1. Send POST request to `/api/auth/login` with email length exceeding 254 characters <br> 2. Check response status code |
| **Expected Result** | 1. Status code: `400 Bad Request` (email length exceeds limit) hoặc `401 Unauthorized` (invalid credentials) <br> 2. No server crash (no `500 Internal Server Error`) |
| **Actual Result** | _(để trống — điền khi chạy)_ |
| **Status** | ⬜ Not Run |
| **Bug link** | |

---

## TC-LOGIN-016: Login with Unicode email (IDN)

| Field | Nội dung |
|-------|----------|
| **Test Case ID** | TC-LOGIN-016 |
| **Loại** | Positive |
| **Kỹ thuật** | Equivalence Partitioning — internationalized domain name (IDN) |
| **Precondition** | User `tést@example.com` with password `Test@1234` exists in DB |
| **Test Data** | `{ "email": "tést@example.com", "password": "Test@1234" }` |
| **Test Steps** | 1. Send POST request to `/api/auth/login` with Unicode characters in email local part <br> 2. Check response status code |
| **Expected Result** | 1. Status code: `200 OK` (if IDN supported and user matches) <br> 2. Or `400 Bad Request` / `401 Unauthorized` (if IDN not supported) |
| **Actual Result** | _(để trống — điền khi chạy)_ |
| **Status** | ⬜ Not Run |
| **Bug link** | |

---

## Checklist độ phủ

- [x] **Happy path** — input hợp lệ, luồng chính chạy đúng (TC-001, TC-007)
- [x] **Validation** — thiếu field bắt buộc, sai định dạng email (TC-004, TC-005, TC-006, TC-008, TC-011, TC-012)
- [x] **Boundary** — email dài > 254 chars (TC-015)
- [x] **Negative** — sai credentials: wrong email (TC-002), wrong password (TC-003)
- [ ] **Auth/Authorization** — endpoint không yêu cầu auth (N/A)
- [x] **Error shape** — body lỗi đúng cấu trúc (`errors[]`, `error`), đúng HTTP status (verified across negative TCs)

---

## Tổng kết (điền sau khi chạy hết)

| Tổng số TC | Pass | Fail | Blocked | Not Run |
|:---:|:---:|:---:|:---:|:---:|
| 16 | 8 | 0 | 0 | 8 |

Bug đã tạo: _(liệt kê link issue)_
