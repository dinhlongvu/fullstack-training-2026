# QA-05 — Test Planning

A test plan is the **blueprint** for your testing effort. It answers: what will be tested, how, by whom, and when.

---

## 1. Why Write a Test Plan?

- **Clarity**: Everyone knows what's being tested and what's not
- **Scope control**: Prevents scope creep ("should we also test X?")
- **Resource planning**: Who tests what, how long it takes
- **Accountability**: Did we actually test everything we planned?

---

## 2. Test Plan Structure (Simplified IEEE 829)

```markdown
# Test Plan: [Feature Name]

## 1. Introduction
Brief description of the feature being tested.

## 2. Scope
### In Scope
- What WILL be tested (e.g., User CRUD API, Login UI)
### Out of Scope
- What will NOT be tested (e.g., third-party payment gateway, performance under 10k users)

## 3. Test Objectives
- Verify all CRUD operations work correctly
- Verify input validation prevents bad data
- Verify appropriate error messages are returned

## 4. Test Approach
- **API Testing**: Manual testing with Postman
- **UI Testing**: Manual testing across Chrome + Safari
- **Regression**: Re-run existing test cases after changes

## 5. Test Deliverables
- [ ] Test cases document (qa/test-cases/user-api.md)
- [ ] Bug reports (GitHub Issues with label `bug`)
- [ ] Test summary report (at end of testing cycle)

## 6. Schedule
| Activity | Duration | Dates |
|----------|:--------:|-------|
| Write test cases | 0.5 day | Mon |
| Execute test cases | 1.5 days | Tue-Wed |
| Report bugs | Ongoing | Tue-Wed |
| Retest fixes | 0.5 day | Thu |
| Test summary | 0.5 day | Fri |

## 7. Risks
- **Risk**: API not stable yet → **Mitigation**: Start with smoke tests first
- **Risk**: Only 1 QA → **Mitigation**: Focus on critical paths, skip minor UI polish
```

---

## 3. Example: Test Plan for User API Feature

```markdown
# Test Plan: User CRUD API

## Feature
User management API — CRUD operations on user accounts.
**Issue:** #1
**Developer:** Học

## Test Objectives
1. Verify all CRUD endpoints work with valid data
2. Verify input validation returns appropriate errors
3. Verify duplicate email handling
4. Verify non-existent user handling

## Test Cases (see qa/test-cases/user-api.md)
| ID | Scenario | Priority |
|----|----------|:--------:|
| TC-001 | GET all users (empty database) | High |
| TC-002 | GET all users (with data) | High |
| TC-003 | GET user by valid ID | High |
| TC-004 | GET user by non-existent ID | High |
| TC-005 | POST create user with valid data | High |
| TC-006 | POST create user without required fields | High |
| TC-007 | POST create duplicate email | Medium |
| TC-008 | PUT update existing user | High |
| TC-009 | PUT update non-existent user | Medium |
| TC-010 | DELETE existing user | High |
| TC-011 | DELETE non-existent user | Medium |

## Test Environment
- Backend: localhost:5001
- Database: SQLite (fresh instance for each test run)
- Tool: Postman

## Exit Criteria
- All High priority tests pass
- No open Critical bugs
- All Medium priority tests either pass or have documented workarounds
```

---

## 4. Test Plan vs Test Cases vs Test Strategy

| Document | Scope | Detail Level | Example |
|----------|-------|:---:|---------|
| **Test Strategy** | Entire project | High | "We'll do manual API testing + basic UI testing" |
| **Test Plan** | One feature | Medium | "User API: test CRUD, validation, auth. 11 test cases, 3 days." |
| **Test Cases** | One scenario | Low | "TC-001: GET /api/users expects 200 + JSON array" |

For this project's scale, a **Test Plan per feature** is sufficient. No need for a separate high-level strategy document.

---

## 5. How Test Planning Fits in This Project

```
Feature assigned to dev
    ↓
QA writes Test Plan + Test Cases  ← You do this BEFORE testing
    ↓
Dev completes feature → merges to training/
    ↓
QA executes Test Cases
    ↓
Bugs found → report → dev fixes → QA retests
    ↓
All tests pass → Feature approved
    ↓
QA writes Test Summary (brief: what was tested, bug count, result)
```

---

## 6. Test Summary Template

After completing testing, write a brief summary:

```markdown
# Test Summary: User CRUD API

**Date:** 2026-06-15
**Tester:** Phúc

## Results
- Test cases executed: 11
- Passed: 9
- Failed: 2 (see issues #15, #16)
- Blocked: 0

## Bugs Found
- #15: GET /api/users returns 500 when no users exist (Critical)
- #16: DELETE returns 200 instead of 204 (Minor)

## Verdict
⚠️ NOT READY — Critical bug #15 must be fixed before release.
```

---

## 📚 Further Reading

- [IEEE 829 — Test Documentation Standard](https://en.wikipedia.org/wiki/IEEE_829)
- [How to Write a Test Plan](https://www.guru99.com/what-everybody-ought-to-know-about-test-planing.html)
- [Test Plan vs Test Strategy](https://www.softwaretestinghelp.com/test-strategy-vs-test-plan/)

---

> **Tip:** A test plan doesn't need to be 50 pages. For a feature that takes 2 days to build, a half-page test plan is enough. The key is: **write it before you test**, not after.
