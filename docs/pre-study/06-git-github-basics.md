# 06 — Git & GitHub Basics

Git is the version control system. GitHub is where we host the code and collaborate. Every task in this program goes through Git.

---

## 1. Core Concepts

```
Working Directory          Staging Area          Local Repo           Remote (GitHub)
     │                         │                      │                     │
     │  git add                 │  git commit          │  git push           │
     │ ──────────────────────→ │ ────────────────────→ │ ──────────────────→ │
     │                         │                      │                     │
     │                         │                      │  git pull / fetch    │
     │ ←─────────────────────────────────────────────────────────────────── │
```

---

## 2. Essential Commands

```bash
# Clone a repository
git clone https://github.com/dinhlongvu/fullstack-training-2026.git
cd fullstack-training-2026

# Check status — RUN THIS OFTEN
git status

# Create a new branch and switch to it
git checkout -b hoc/task-01-user-api

# Stage changes (add files to commit)
git add .                          # Add everything
git add backend/Controllers/       # Add specific folder

# Commit with a message
git commit -m "feat(api): add GET /api/users endpoint"

# Push to GitHub
git push -u origin hoc/task-01-user-api   # First push: set upstream
git push                                   # Subsequent pushes

# Keep your branch up to date with main
git checkout main
git pull origin main
git checkout hoc/task-01-user-api
git merge main                    # Bring main's changes into your branch
```

---

## 3. Commit Message Convention

Follow this format: `type(scope): short description`

```
feat(api): add user CRUD endpoints
fix(ui): resolve button not responding on mobile
refactor(service): extract validation to separate method
docs(readme): update setup instructions
style: format code with Prettier
test: add unit tests for UserService
```

| Type | When |
|------|------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code improvement (no behavior change) |
| `docs` | Documentation only |
| `style` | Formatting, semicolons, etc. |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks |

---

## 4. Pull Request (PR) Workflow

```
1. Create a branch from main
   git checkout -b hoc/task-01-user-api

2. Code, commit, push
   git add .
   git commit -m "feat: add user CRUD"
   git push -u origin hoc/task-01-user-api

3. Open a Pull Request on GitHub
   → Go to the repo page
   → Click "Compare & pull request"
   → Write description: what you did, how to test
   → Link the issue: "Closes #1"
   → Click "Create pull request"

4. Wait for review
   → CI checks must pass (green checkmark)
   → Mentor reviews and leaves comments
   → Address feedback: make changes, commit, push
   → The PR updates automatically

5. Merge (done by mentor)
```

---

## 5. Handling Merge Conflicts

Conflicts happen when two people change the same file. Don't panic!

```bash
# 1. Update your local main
git checkout main
git pull origin main

# 2. Merge main into your branch
git checkout hoc/task-01-user-api
git merge main

# 3. If conflict, Git will tell you which files:
# CONFLICT (content): Merge conflict in backend/Controllers/UsersController.cs

# 4. Open the file, look for conflict markers:
<<<<<<< HEAD
var users = _db.Users.Where(u => u.Active).ToList();
=======
var users = _db.Users.ToList();
>>>>>>> main

# 5. Decide which version to keep (or combine both), remove markers:
var users = _db.Users.Where(u => u.Active).ToList();

# 6. Stage the resolved file and continue
git add backend/Controllers/UsersController.cs
git commit -m "chore: resolve merge conflict with main"

# 7. Push
git push
```

**VS Code tip:** VS Code has a built-in merge conflict resolver — click "Accept Current" / "Accept Incoming" / "Accept Both".

---

## 6. Common Mistakes & Fixes

```bash
# "Oh no, I committed to main instead of my branch!"
git checkout -b hoc/task-fix          # Create branch from current state
git checkout main                      # Go back to main
git reset --hard origin/main          # Reset main to remote version
git checkout hoc/task-fix             # Continue on your branch

# "I messed up my last commit message"
git commit --amend -m "feat: new message"

# "I accidentally staged a file"
git reset HEAD path/to/file

# "I want to undo everything and start fresh"
git checkout -- .                     # Discard all unstaged changes
```

---

## 📚 Further Reading

- [Oh Shit, Git!?!](https://ohshitgit.com/) — solutions for common Git disasters
- [GitHub Skills](https://skills.github.com/) — interactive Git courses
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Branching — Interactive Tutorial](https://learngitbranching.js.org/)

---

> **Tip:** Run `git status` before and after every command. It tells you exactly what's happening. Also: commit early, commit often!
