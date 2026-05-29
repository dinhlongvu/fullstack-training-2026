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
| **xUnit + HttpClient** | .NET integration tests (what devs write) |
| **Postman + Newman** | Run Postman collections from CLI |
| **Playwright** | End-to-end browser testing (later weeks) |
| **RestSharp** | C# HTTP client for API testing |

## Basic Pattern: Arrange → Act → Assert

Every automated test follows this 3-step pattern:

```
1. ARRANGE — Set up test data (create a project, get auth token)
2. ACT     — Call the API endpoint
3. ASSERT  — Check the response is correct
```

### Example: Testing "Create Task" API

```csharp
// Conceptual — you'll write real code in Week 3!
[Fact]
public async Task CreateTask_WithValidData_Returns201()
{
    // ARRANGE
    var token = await GetAuthToken("test@example.com", "password");
    var newTask = new { title = "Test Task", priority = "high" };

    // ACT
    var response = await httpClient.PostAsJsonAsync(
        "/api/projects/1/tasks", newTask);

    // ASSERT
    Assert.Equal(201, (int)response.StatusCode);
    var task = await response.Content.ReadFromJsonAsync<TaskDto>();
    Assert.Equal("Test Task", task.Title);
    Assert.Equal("high", task.Priority);
}
```

### Example: Testing Validation

```csharp
[Fact]
public async Task CreateTask_WithoutTitle_Returns400()
{
    // ARRANGE
    var invalidTask = new { title = "", priority = "high" };

    // ACT
    var response = await httpClient.PostAsJsonAsync(
        "/api/projects/1/tasks", invalidTask);

    // ASSERT
    Assert.Equal(400, (int)response.StatusCode);
    var error = await response.Content.ReadFromJsonAsync<ErrorDto>();
    Assert.Contains(error.Errors, e => e.Field == "title");
}
```

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

Later, you'll write a test script that:
1. Creates a test user
2. Logs in and gets a token
3. Creates a project
4. Creates 3 tasks in that project
5. Updates one task status
6. Deletes the test data (cleanup)

This flow verifies the entire CRUD lifecycle works correctly.

## Key Rules

- 🟢 **One test = one behavior** — don't test 5 things in one test
- 🟢 **Tests should be independent** — test B should not depend on test A's data
- 🟢 **Clean up after tests** — delete test data so tests are repeatable
- 🟡 **Name tests descriptively**: `CreateTask_WithoutTitle_Returns400`
- 🟡 **Start with happy path, then add edge cases**
- 🔴 **Never test against production** — use a dedicated test database

## 📚 Further Reading

- [xUnit Documentation](https://xunit.net/) — .NET testing framework
- [Integration Tests in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests) — official guide
- [Test Automation University](https://testautomationu.applitools.com/) — free courses
- [Postman + Newman CI](https://learning.postman.com/docs/collections/using-newman-cli/integration-with-travis/) — run in pipelines

## 💡 Tip

> Think of automated tests as "living documentation." They prove the API behaves correctly, not just describe how it should. A good test suite catches regressions before users do.
