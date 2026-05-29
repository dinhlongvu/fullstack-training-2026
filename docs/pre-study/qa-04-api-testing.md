# QA-04 — API Testing

Most features in this project are backend APIs. Testing APIs means sending HTTP requests and verifying the responses — no UI needed.

---

## 1. HTTP Methods (CRUD Mapping)

| HTTP Method | CRUD | Example | Safe? | Idempotent? |
|-------------|------|---------|:-----:|:-----------:|
| `GET` | Read | `GET /api/users` | ✅ Yes | ✅ Yes |
| `POST` | Create | `POST /api/users` | ❌ No | ❌ No |
| `PUT` | Update (full) | `PUT /api/users/5` | ❌ No | ✅ Yes |
| `PATCH` | Update (partial) | `PATCH /api/users/5` | ❌ No | ❌ No |
| `DELETE` | Delete | `DELETE /api/users/5` | ❌ No | ✅ Yes |

- **Safe** = doesn't change data (only reads)
- **Idempotent** = calling it multiple times has the same effect as calling once

---

## 2. HTTP Status Codes — What to Test

| Code | Meaning | Test Scenario |
|------|---------|---------------|
| `200 OK` | Success | `GET /api/users/1` with valid ID → 200 + user JSON |
| `201 Created` | Resource created | `POST /api/users` with valid data → 201 + new user JSON |
| `204 No Content` | Success, no body | `DELETE /api/users/1` with valid ID → 204 |
| `400 Bad Request` | Invalid input | `POST /api/users` with missing email → 400 + error message |
| `401 Unauthorized` | Not logged in | `GET /api/users` without auth token → 401 |
| `404 Not Found` | ID doesn't exist | `GET /api/users/99999` → 404 |
| `409 Conflict` | Duplicate | `POST /api/users` with existing email → 409 |
| `400 Bad Request` | Validation failed | `POST /api/users` with age=-5 → 400 |
| `500 Internal Error` | Server crash | Trigger unexpected error → 500 (should NOT expose stack trace) |

---

## 3. Using Postman (or `curl`)

### Postman (GUI — recommended for beginners)

1. Create a new request
2. Set method (GET/POST/etc.)
3. Enter URL: `https://localhost:5001/api/users`
4. If POST/PUT: go to Body → raw → JSON
5. Click **Send**

```
POST /api/users
Content-Type: application/json

{
    "name": "Alice",
    "email": "alice@example.com"
}
```

**Organize with Collections:** Create a collection for each feature (e.g., "User API"), save all related requests.

### curl (Terminal — for quick tests)

```bash
# GET all users
curl http://localhost:5001/api/users

# GET user by ID (with pretty JSON)
curl http://localhost:5001/api/users/1 | python3 -m json.tool

# POST create user
curl -X POST http://localhost:5001/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com"}'

# PUT update user
curl -X PUT http://localhost:5001/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Updated","email":"alice@example.com"}'

# DELETE user
curl -X DELETE http://localhost:5001/api/users/1
```

---

## 4. What to Test for Each API Endpoint

For every endpoint, test these scenarios:

```markdown
## GET /api/users

### Happy Path
- [ ] TC-001: Returns 200 + array of users
- [ ] TC-002: Returns 200 + user when ID exists

### Edge Cases
- [ ] TC-003: Returns 404 when ID doesn't exist
- [ ] TC-004: Returns 400 when ID is not a number (e.g., /api/users/abc)
- [ ] TC-005: Returns [] when no users in database

### Auth
- [ ] TC-006: Returns 401 when no auth token provided
- [ ] TC-007: Returns 200 when valid auth token provided

### Performance
- [ ] TC-008: Returns in < 200ms with < 100 users

### Response Structure
- [ ] TC-009: Each user object has: id, name, email (no passwordHash!)
```

---

## 5. API Response Validation Checklist

When testing an API response, check:

```markdown
✅ Status code matches expected
✅ Response body is valid JSON
✅ All required fields are present
✅ No sensitive data leaked (passwords, internal IDs, stack traces)
✅ Field types are correct (string, number, boolean)
✅ Date formats are consistent (ISO 8601)
✅ Array responses have correct pagination (if applicable)
✅ Error responses have a meaningful message (not just "Error")
✅ CORS headers are present (if testing from browser)
```

---

## 6. Environment Variables in Postman

Set up environments so you don't hardcode URLs:

```
Environment: Local
  base_url = http://localhost:5001

Environment: Training
  base_url = https://training-api.example.com
```

Then use `{{base_url}}/api/users` in your requests. Switch environments with one click.

---

## 📚 Further Reading

- [Postman Learning Center](https://learning.postman.com/)
- [HTTP Status Codes Reference](https://httpstatuses.io/)
- [REST API Testing Tutorial](https://www.guru99.com/testing-rest-api-manually.html)
- [MDN HTTP Methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods)

---

> **Tip:** When you find an API bug, include the **exact request** (method, URL, headers, body) and the **exact response** (status code, body) in your bug report. This lets the developer reproduce it in seconds.
