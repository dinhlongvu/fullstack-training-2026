# QA-01 — Software Testing Fundamentals

Testing is not just "finding bugs." It's the process of evaluating software to ensure it meets requirements, works as expected, and doesn't break existing functionality.

---

## 1. Why Testing Matters

- **Catches bugs before users do** — cheaper to fix early
- **Prevents regressions** — new code doesn't break old features
- **Documents expected behavior** — tests are living documentation
- **Builds confidence** — deploy without fear

---

## 2. Test Levels (The Testing Pyramid)

```
        ┌─────────┐
        │   E2E   │  ← Few: slow, expensive, full user flows
       ┌┴─────────┴┐
       │Integration│  ← Some: test how pieces work together
      ┌┴───────────┴┐
      │    Unit     │  ← Many: fast, cheap, test individual functions
     └─────────────┘
```

| Level | What it tests | Speed | Example |
|-------|---------------|-------|---------|
| **Unit** | Single function/method | Fast (ms) | `CalculateDiscount(100)` returns `10` |
| **Integration** | Multiple components together | Medium | API endpoint + database query |
| **E2E (End-to-End)** | Full user journey | Slow (seconds) | Login → Browse → Add to Cart → Checkout |

---

## 3. Test Types

| Type | Purpose | How |
|------|---------|-----|
| **Functional** | Does it work? | Test features against requirements |
| **Regression** | Did we break anything? | Re-run old tests after changes |
| **Smoke** | Is the build stable? | Quick check of critical paths |
| **UI/UX** | Does it look right? | Visual inspection, responsive design |
| **Performance** | Is it fast enough? | Load time, response time |
| **Security** | Is it safe? | SQL injection, XSS, auth bypass |

---

## 4. What Makes a Good Test?

| ✅ Good test | ❌ Bad test |
|-------------|------------|
| Independent (doesn't depend on other tests) | Order-dependent (must run after another test) |
| Repeatable (same result every time) | Flaky (passes sometimes, fails sometimes) |
| Tests one thing clearly | Tests many things at once |
| Fast | Slow (makes people skip running it) |
| Has clear expected result | Vague: "check if it works" |

---

## 5. The Testing Mindset

```
Developer mindset:     "How do I make this work?"
QA mindset:            "How do I make this BREAK?"

Great QAs think like:
- A curious user:   "What happens if I click this 5 times fast?"
- A malicious user:  "What if I put SQL code in this input?"
- An edge case:      "What if the list is empty?"
- A frustrated user: "What if I lose internet mid-transaction?"
```

---

## 6. Key Terminology

| Term | Definition |
|------|------------|
| **Test Case** | A set of steps, inputs, and expected results |
| **Test Suite** | A collection of test cases |
| **Test Plan** | A document describing scope, approach, resources, schedule |
| **Bug / Defect** | A discrepancy between expected and actual behavior |
| **Severity** | How bad is the bug? (Critical / Medium / Minor) |
| **Priority** | How urgent is the fix? (High / Medium / Low) |
| **Regression** | A bug in a feature that used to work |

---

## 📚 Further Reading

- [ISTQB Foundation Level Syllabus](https://www.istqb.org/certifications/foundation-level)
- [Ministry of Testing](https://www.ministryoftesting.com/)
- [The Testing Pyramid](https://martinfowler.com/bliki/TestPyramid.html)
- [Guru99 Software Testing Tutorial](https://www.guru99.com/software-testing.html)

---

> **Tip:** The best QAs are curious. Always ask "What if...?" Don't just follow the happy path — explore the edges!
