# QA-06 — Postman Advanced

## Concept

Postman is more than a request sender — it's a full API testing platform. You can organize requests into **collections**, manage **environments** (dev/staging/prod), and write **test scripts** that run automatically after each request.

## Code Examples

### Environment Variables

```
Create an environment: "Development"
Variables:
  base_url  = http://localhost:5000
  token     = (auto-filled by login script)

Use in requests:
  GET {{base_url}}/api/tasks
  Authorization: Bearer {{token}}
```

Switch environments with one click — no more editing URLs.

### Test Scripts (JavaScript)

```javascript
// In the "Tests" tab of a request:
pm.test("Status code is 200", () => {
    pm.response.to.have.status(200);
});

pm.test("Response has tasks array", () => {
    const data = pm.response.json();
    pm.expect(data.success).to.be.true;
    pm.expect(data.data).to.be.an("array");
});

pm.test("Each task has required fields", () => {
    const tasks = pm.response.json().data;
    tasks.forEach(task => {
        pm.expect(task).to.have.property("id");
        pm.expect(task).to.have.property("title");
        pm.expect(task).to.have.property("status");
    });
});

// Save token from login response
pm.test("Save auth token", () => {
    const data = pm.response.json();
    pm.environment.set("token", data.data.token);
});
```

### Collection Runner

```
1. Organize requests in a collection (folder by resource)
2. Click "Run Collection"
3. Select environment
4. Set iterations, delay between requests
5. View results: passed/failed, response times
```

### Pre-request Scripts

```javascript
// Auto-set auth header before every request:
pm.request.headers.add({
    key: "Authorization",
    value: `Bearer ${pm.environment.get("token")}`
});
```

### Common Test Patterns

```javascript
// Test POST (create)
pm.test("Create returns 201 with new task", () => {
    pm.response.to.have.status(201);
    const task = pm.response.json().data;
    pm.environment.set("createdTaskId", task.id); // Save for later requests
});

// Test GET (list)
pm.test("List is paginated", () => {
    const body = pm.response.json();
    pm.expect(body.pagination).to.have.property("page");
    pm.expect(body.pagination).to.have.property("totalItems");
});

// Test validation error
pm.test("Returns 400 for invalid input", () => {
    pm.response.to.have.status(400);
    const body = pm.response.json();
    pm.expect(body.errors).to.be.an("array").that.is.not.empty;
});
```

## Key Rules

- 🟢 **Use environments** — never hardcode URLs or tokens
- 🟢 **Write tests for every endpoint** — they become your regression suite
- 🟢 **Organize collections by resource**: Auth, Projects, Tasks, Comments
- 🟡 **Export & share collections** with your team (`.postman_collection.json`)
- 🟡 **Use Collection Runner for smoke tests** before manual testing

## 📚 Further Reading

- [Postman Learning Center](https://learning.postman.com/) — official tutorials
- [Postman Test Scripts Reference](https://learning.postman.com/docs/writing-scripts/test-scripts/) — all pm.* APIs
- [Chai Assertion Library](https://www.chaijs.com/api/bdd/) — used inside `pm.expect()`
- [Newman](https://learning.postman.com/docs/collections/using-newman-cli/command-line-integration/) — run Postman collections from CLI

## 💡 Tip

> A Postman collection with tests is a living API documentation. It proves the API works, not just describes how it should work. Invest time in good tests — they pay off every time the API changes.
