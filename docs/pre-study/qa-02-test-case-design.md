# QA-02 — Test Case Design

A good test case is **specific, repeatable, and unambiguous**. Anyone should be able to pick it up and execute it without asking questions.

---

## 1. Anatomy of a Test Case

```markdown
| Field | Example |
|-------|---------|
| **Test Case ID** | TC-USER-001 |
| **Title** | Verify login with valid credentials |
| **Precondition** | User "test@example.com" exists with password "Test@123" |
| **Test Steps** | 1. Navigate to /login <br> 2. Enter "test@example.com" in email field <br> 3. Enter "Test@123" in password field <br> 4. Click "Login" button |
| **Expected Result** | Redirect to /dashboard, user name displayed in header |
| **Actual Result** | (Fill in during testing) |
| **Status** | Pass / Fail / Blocked |
| **Test Data** | Email: test@example.com, Password: Test@123 |
```

---

## 2. Test Case Design Techniques

### Equivalence Partitioning

> Divide input data into groups (partitions) that should behave the same way. Test ONE value from each partition.

```markdown
Scenario: Age field (valid range: 18-65)

| Partition | Test Value | Expected |
|-----------|-----------|----------|
| Below minimum | 17 | Error: "Must be 18+" |
| Valid range | 30 | Accepts input |
| Above maximum | 66 | Error: "Must be 65 or younger" |
| Invalid type | "abc" | Error: "Must be a number" |
| Empty | (blank) | Error: "Required field" |
```

### Boundary Value Analysis

> Bugs love boundaries. Test values at the **edges** of valid ranges.

```markdown
Scenario: Quantity field (valid: 1-100)

| Boundary | Test Value | Expected |
|----------|-----------|----------|
| Below lower bound | 0 | Error |
| Lower bound | 1 | Accepts |
| Lower bound + 1 | 2 | Accepts |
| Upper bound - 1 | 99 | Accepts |
| Upper bound | 100 | Accepts |
| Above upper bound | 101 | Error |
```

### Decision Table

> For features with complex business rules — map all combinations of conditions to expected outcomes.

```markdown
Scenario: Shipping cost calculation

| Condition: VIP? | Condition: Order > $50? | Expected: Free Shipping? |
|:---:|:---:|:---:|
| Yes | Yes | Yes |
| Yes | No | Yes |
| No  | Yes | Yes |
| No  | No | No |
```

### State Transition

> For features with different states (login/logout, order status, etc.)

```markdown
Scenario: User account states

[Logged Out] --Login--> [Logged In] --Timeout--> [Logged Out]
[Logged In]  --Logout--> [Logged Out]
[Logged In]  --3x wrong password--> [Locked] --Admin unlock--> [Logged Out]
```

Test each transition path.

---

## 3. Positive vs Negative Testing

| Positive Testing | Negative Testing |
|------------------|-----------------|
| "Does it work with valid input?" | "Does it handle invalid input gracefully?" |
| Happy path | Error path |
| User does the right thing | User does the wrong thing |
| Submit form with all fields filled | Submit empty form |
| Valid email | Invalid email: `notanemail`, `@.com`, `a@` |

**A good test suite has BOTH.** Beginners often only test the happy path.

---

## 4. Test Case Format for This Project

Save test cases in `qa/test-cases/` as markdown files, named after the feature:

```
qa/test-cases/
├── user-api.md          ← Test cases for User API
├── product-api.md       ← Test cases for Product API
├── login-ui.md          ← Test cases for Login UI
└── ...
```

**Template:**
```markdown
# Test Cases: [Feature Name]

**Feature:** [Link to feature issue]
**Author:** Phúc
**Date:** [Date]

---

## TC-001: [Title]

- **Precondition:** ...
- **Steps:**
  1. ...
  2. ...
- **Expected:** ...
- **Status:** ⬜ Not Run / ✅ Pass / ❌ Fail

## TC-002: [Title]
...
```

---

## 📚 Further Reading

- [Guru99 — Test Case Design Techniques](https://www.guru99.com/software-testing-techniques.html)
- [Software Testing Help — Test Case Writing](https://www.softwaretestinghelp.com/how-to-write-effective-test-cases/)
- [ISTQB — Test Design Techniques](https://istqb-glossary.page/test-design-technique/)

---

> **Tip:** A well-written test case is like a cooking recipe — anyone should be able to follow it and get the same result.
