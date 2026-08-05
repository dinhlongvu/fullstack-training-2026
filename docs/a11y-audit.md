# Accessibility Audit — TaskBoard Frontend

Issue: #76 · Branch: `bao/task-f05-accessibility`

**Scope**: Login, Register, Projects, Project Detail, Task Detail, Dashboard
(+ the 404 page). Light theme only — the app ships no dark theme.
**Tooling**: `@axe-core/react` 4.12 (dev console), manual keyboard pass in
Chrome, and accessible names read off the Chrome DevTools Accessibility pane.
No screen-reader pass was run — see limitation 7.

---

## 1. Automated scanning

`@axe-core/react` runs in development only, wired through
`frontend/src/lib/useAxeReporter.ts`. Violations are grouped in the browser
console by impact.

### Known limitation: the library does not support React 18

Deque's README states the package does not support React 18 and above. It
re-scans by patching `React.createElement` and hooking class-component
lifecycles. This app compiles JSX with the automatic runtime
(`"jsx": "react-jsx"`) and has no class components except `ErrorBoundary`, so
neither hook ever fires.

Effect: the library only ever scans `document.body` at the moment it is called.
`useAxeReporter` works around this by calling it again on every route change, so
each of the six screens is scanned. Consequences to be aware of:

- Violations introduced by a state change *within* a screen (opening a dialog,
  switching a filter) are **not** picked up until the next navigation.
- Component-level coverage is handled instead by `@storybook/addon-a11y`, which
  is already configured in `.storybook/main.ts`.

If a future ticket upgrades to React 19, `ReactDOM.findDOMNode` is removed and
this package must be replaced.

---

## 2. Issues found and fixed

| Impact | Rule / criterion | Where | Fix |
|---|---|---|---|
| critical | `select-name` | Kanban priority + assignee filters | `aria-label` on both `<select>` |
| serious | `nested-interactive` | `TaskCard` | Card is no longer `role="button"`; the title is a real `<Link>` |
| serious | WCAG 2.1.1 Keyboard | `ProjectCard` | Was a `<div onClick>` with no keyboard path; the title is now a `<Link>` |
| serious | `color-contrast` | `--destructive` token | 3.29–3.76:1 → 4.92–5.79:1 |
| serious | `color-contrast` | Overdue due date on `TaskCard` | `text-red-500` → `text-destructive` |
| moderate | `region`, `landmark-one-main` | Login, Register, 404 | Wrapped in `<main>` |
| moderate | WCAG 2.4.1 Bypass Blocks | Every signed-in page | Skip link to `#main-content` |
| minor | WCAG 4.1.2 | `AuthGuard` spinner | `role="status"` + screen-reader text |
| minor | — | ~28 decorative icons | `aria-hidden="true"` |

Button names on the board now carry the task they act on (`Edit task: <title>`,
`Move Left: <title>`), so a screen-reader user tabbing across twelve cards no
longer hears the same four labels repeated. The visible text stays the first
part of the accessible name, which WCAG 2.5.3 Label in Name requires for
voice-control users.

### Contrast measurements (light theme)

| Pair | Before | After |
|---|---|---|
| `--destructive` on `--background` | 3.76:1 | 5.79:1 |
| `--destructive-foreground` on `--destructive` | 3.61:1 | 5.54:1 |
| `--destructive` on `bg-destructive/10` | 3.29:1 | 4.92:1 |

Already passing, left alone: `--muted-foreground` on `--background` (4.74:1) and
on the sidebar's `bg-muted/40` (4.58:1); all five status/priority badges
(4.57–9.37:1).

---

## 3. Verified as already correct

- **Form labels.** Every input goes through `FormItem` / `FormLabel` /
  `FormControl`, which generate a `useId()` pair and wire `htmlFor`, `id`,
  `aria-describedby` and `aria-invalid`. No manual ARIA was added inside any
  form: a prop set on a `FormControl` child overrides the generated one even
  when its value is `undefined`, which silently breaks the link to
  `FormMessage` (that was #213).
- **Focus trap in modals.** Radix `Dialog` and `AlertDialog` trap focus, restore
  it to the trigger on close, and close on Escape. Verified by hand on Create
  Project, Edit Project, Add Member, Create Task, Edit Task, and both delete
  confirmations.
- **Loading announcements.** All nine skeletons expose
  `role="status" aria-busy="true" aria-live="polite"` with screen-reader text,
  and wrap the visual placeholders in `aria-hidden="true"`.
- **Select icons.** Radix already renders `aria-hidden` wrappers around
  `SelectIcon`, `ItemIndicator`, `Separator` and both scroll buttons, so
  `components/ui/Select.tsx` was deliberately left untouched.

---

## 4. Known limitations (not fixed here)

1. **`heading-order` on error blocks (moderate).** shadcn's `AlertTitle` renders
   an `<h5>`, so an `ErrorState` on a page whose last heading is `<h2>` skips
   three levels. Not fixed because the block is a `role="alert"` region — the
   whole thing is announced at once and the heading adds nothing — and changing
   the shadcn primitive's element affects every future `Alert`. Worth a
   follow-up ticket.
2. **The `<h1>` is the app name, not the page name.** `Layout` renders
   `<h1>TaskBoard</h1>` in the sidebar and each page starts at `<h2>`. Heading
   order stays valid, but screen-reader users get the same `<h1>` everywhere.
   Fixing it means renumbering headings on all six pages.
3. **`document.title` never changes between routes** (WCAG 2.4.2 Page Titled,
   Level A). Every screen reports "TaskBoard". Needs a per-route title hook.
4. **Focus is not moved on client-side navigation.** After following a link,
   focus stays on `<body>`, so a screen-reader user has to re-orient manually.
   The skip link makes this recoverable but does not solve it.
5. **Filter results are not announced.** Changing a Kanban filter re-renders the
   board silently; there is no live region reporting the new task count.
6. **No dark theme**, so contrast was only measured against the light palette.
7. **Nothing here was verified with a real screen reader.** Accessible names were
   read off the DevTools Accessibility pane, which computes the same name a
   screen reader announces but says nothing about how the announcement actually
   sounds in context. The assignee picker on `TaskCard` is why this matters: its
   name was reasoned about, judged correct, and was not — an `aria-label` there
   replaced the selected assignee instead of labelling it.

Items 3 and 4 are the natural next accessibility ticket.
