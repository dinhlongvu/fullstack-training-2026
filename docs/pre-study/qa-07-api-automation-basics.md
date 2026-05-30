# QA-07 — API Automation Basics

## Concept

Manual testing is essential, but **automated API tests** save time on repetitive checks. Instead of clicking through Postman for every regression cycle, you write scripts that test APIs programmatically.

This is an **introduction only** — you'll practice automation more in later weeks. For now, understand the concepts.

## Why Automate API Tests?

| Manual Testing | Automated Testing |
|----------------|-------------------|
| Slow, repetitive | Run in seconds |
| Human error | Consistent every time |
| Hard to repeat exactly | Same steps every run |
| Done occasionally | Run on every commit (CI) |
| Good for exploration | Good for regression |

## Tools We'll Use Later

| Tool | What It Does |
|------|-------------|
| **Postman + Newman** | Run Postman collections from CLI |
| **Postman Collection Runner** | Run all requests in a collection automatically |
| **Newman** | Command-line tool to run Postman collections in CI/CD |
| **Playwright** | End-to-end browser testing (later weeks) |

## Basic Pattern: Arrange → Act → Assert

Every test follows this 3-step pattern:

```
1. ARRANGE — Set up test data (get auth token, prepare request body)
2. ACT     — Send the API request
3. ASSERT  — Check the response is correct
```

### Example: Testing "Create Task" API with Postman

**In Postman, you write test scripts in JavaScript (not C#):**

```javascript
// In the "Tests" tab of your POST /api/projects/1/tasks request:

// ARRANGE: This is your request body (in the Body tab):
// {
//   "title": "Test Task",
//   "description": "Created by automated test",
//   "priority": "High"
// }

// ASSERT: Check the response
pm.test("Create task returns 201 Created", () => {
    pm.response.to.have.status(201);
});

pm.test("Response contains the created task", () => {
    const task = pm.response.json();
    pm.expect(task.title).to.equal("Test Task");
    pm.expect(task.priority).to.equal("High");
    pm.expect(task.id).to.be.a("number");
    
    // Save the ID for later requests (e.g., update, delete)
    pm.environment.set("createdTaskId", task.id);
});
```

### Example: Testing Validation Errors

```javascript
// In the "Tests" tab of your POST /api/projects/1/tasks request
// (with empty title in the request body)

pm.test("Empty title returns 400 Bad Request", () => {
    pm.response.to.have.status(400);
});

pm.test("Error message mentions title", () => {
    const body = pm.response.json();
    pm.expect(body.error).to.include("Title");
});

## What to Test (API Testing Pyramid)

```
        ┌──────┐
        │ E2E  │  ← Full user flows (Login → Create → Edit → Delete)
       ┌┴──────┴┐
       │  API   │  ← Individual endpoints with various inputs
      ┌┴────────┴┐
      │   Unit    │  ← Single functions, validators, mappers
      └───────────┘
```

For API testing, focus on:
1. **Happy path**: valid input → 200/201
2. **Validation**: missing/invalid fields → 400
3. **Auth**: missing token → 401, wrong role → 403
4. **Not found**: non-existent ID → 404
5. **Edge cases**: empty list, max length, special characters

## Your First Automation Task (Week 3+)

Later, you'll build a Postman collection that:
1. Creates a test user (POST /api/auth/register)
2. Logs in to get a token (POST /api/auth/login) — saves to environment
3. Creates a project (POST /api/projects)
4. Creates 3 tasks in that project (POST /api/projects/{id}/tasks)
5. Updates one task's status (PATCH /api/tasks/{id}/status)
6. Deletes the test data (DELETE endpoints to clean up)

Use **Collection Runner** to run all requests in sequence. Add test scripts to each request that verify the response. When everything passes in one click — you've automated your regression suite!

## Key Rules

- 🟢 **One test = one behavior** — don't test 5 things in one `pm.test()`
- 🟢 **Tests should be independent** — use environment variables to chain data
- 🟢 **Clean up after tests** — delete test data so tests are repeatable
- 🟡 **Name tests descriptively**: "Create Task returns 201", "Empty title returns 400"
- 🟡 **Start with happy path, then add edge cases**
- 🔴 **Never test against production** — use local or dedicated test environment

## 📚 Further Reading

- [Postman Test Scripts Reference](https://learning.postman.com/docs/writing-scripts/test-scripts/) — all `pm.*` APIs
- [Postman Collection Runner](https://learning.postman.com/docs/collections/running-collections/intro-to-collection-runs/)
- [Newman — Run Postman from CLI](https://learning.postman.com/docs/collections/using-newman-cli/command-line-integration/)
- [Test Automation University](https://testautomationu.applitools.com/) — free courses

## 💡 Tip

> Think of automated tests as "living documentation." They prove the API behaves correctly, not just describe how it should. A good test suite catches regressions before users do.
