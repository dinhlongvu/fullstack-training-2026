# QA-03 — Bug Reporting

A great bug report saves hours of back-and-forth. The developer should be able to reproduce the bug from your report **without asking you any questions**.

---

## 1. Anatomy of a Bug Report

```markdown
## [BUG] Login button does nothing when clicked on Safari

### Environment
- **Browser/OS:** Safari 17, macOS Sonoma 14
- **Branch/Commit:** training/, commit a1b2c3d
- **Feature:** Login UI (Issue #5)

### Steps to Reproduce
1. Open Safari, go to https://localhost:5173/login
2. Enter valid email: test@example.com
3. Enter valid password: Test@123
4. Click the blue "Log In" button

### Expected Behavior
User is redirected to /dashboard, and their name appears in the header.

### Actual Behavior
Nothing happens. No redirect, no error message, no network request in DevTools.

### Screenshot
![Login page with no response](link-to-screenshot)

### Severity
🔴 Critical — Login is completely broken on Safari (primary browser for some users).

### Additional Notes
- Works fine on Chrome 120 and Firefox 125
- Console shows: `TypeError: undefined is not an object (evaluating 'form.submit')`
- This started after the React 18 upgrade (commit a1b2c3d)
```

---

## 2. The Golden Rules of Bug Reporting

| Rule | Why |
|------|-----|
| **One bug per report** | Multiple bugs in one report = some get lost |
| **Reproduce before reporting** | "I saw it once" is not a bug report |
| **Be specific** | "It's broken" → ❌ / "Login button unresponsive on Safari" → ✅ |
| **Steps to reproduce are MANDATORY** | If dev can't reproduce, they can't fix |
| **Include environment info** | Browser, OS, version, branch, commit |
| **Attach screenshots / videos** | A picture is worth 1000 words |
| **Distinguish severity from priority** | Critical but rare ≠ High priority |

---

## 3. Severity vs Priority

| | Severity (Impact) | Priority (Urgency) |
|---|---|---|
| **Definition** | How badly does this affect the system? | How soon should we fix this? |
| **Who sets it?** | QA | Product Owner / Manager |
| **Example: App crashes on startup** | 🔴 Critical | 🔴 High |
| **Example: Typo on About page** | 🟢 Minor | 🟢 Low |
| **Example: PayPal broken, Stripe works** | 🟡 Medium | 🔴 High (revenue impact) |

**Severity levels we use in this project:**

| Level | Label | Description |
|-------|-------|-------------|
| 🔴 Critical | `bug` + `high` | Core functionality broken, no workaround |
| 🟡 Medium | `bug` + `medium` | Feature broken but workaround exists |
| 🟢 Minor | `bug` + `low` | Cosmetic issue, typo, alignment |

---

## 4. Common Bug Report Mistakes

| ❌ Bad | ✅ Good |
|--------|---------|
| "It doesn't work" | "GET /api/users returns 500 when page=0" |
| "Fix the login" | "Login button unresponsive on Safari 17" |
| Missing steps to reproduce | "1. Open Safari 2. Go to /login 3. Click Login → nothing happens" |
| No environment info | "Safari 17, macOS, commit a1b2c3d" |
| "Sometimes it breaks" | "Happens consistently when the user list has 0 items" |
| Multiple bugs in one report | Separate reports for separate bugs |

---

## 5. Bug Lifecycle

```
         ┌─────────┐
         │  NEW    │  ← QA reports a bug
         └────┬────┘
              ↓
         ┌─────────┐
         │ ASSIGNED│  ← CEO assigns to a developer
         └────┬────┘
              ↓
         ┌─────────┐
         │ IN PROG │  ← Developer is fixing it
         └────┬────┘
              ↓
         ┌─────────┐
         │  FIXED  │  ← Developer pushes fix, opens PR
         └────┬────┘
              ↓
         ┌─────────┐
    ┌────│ VERIFY  │  ← QA tests the fix
    │    └────┬────┘
    │         ↓
    │    ┌─────────┐
    │    │ CLOSED  │  ✅ Bug is fixed & verified
    │    └─────────┘
    │
    └── Bug still happening? → REOPEN
```

---

## 6. Bug Report Template (GitHub Issue)

When reporting a bug on GitHub, use this template (also saved in `qa/bug-reports/TEMPLATE.md`):

```markdown
## [BUG] Short descriptive title

### Environment
- **Browser/OS:** ...
- **Branch/Commit:** ...
- **Feature:** #IssueNumber

### Steps to Reproduce
1. ...
2. ...

### Expected Behavior
...

### Actual Behavior
...

### Screenshot / Video
...

### Severity
- [ ] 🔴 Critical  - [ ] 🟡 Medium  - [ ] 🟢 Minor
```

---

## 📚 Further Reading

- [Bug Advocacy — Cem Kaner](https://kaner.com/pdfs/bug-advocacy.pdf)
- [How to Write a Good Bug Report](https://www.softwaretestinghelp.com/how-to-write-good-bug-report/)
- [Mozilla Bug Writing Guidelines](https://bugzilla.mozilla.org/page.cgi?id=bug-writing.html)

---

> **Tip:** A bug report is a conversation starter, not an accusation. Frame it as: "Here's what I found, and here's how to reproduce it." The goal is to help the developer fix it quickly, not to blame anyone.
