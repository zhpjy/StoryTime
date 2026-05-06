# Story Lab shadcn Serif Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor Story Lab onto local shadcn-style primitives, apply the Serif editorial theme, and add stable test selectors across the app.

**Architecture:** Keep the existing Story Lab React structure and migrate the local UI primitives to shadcn-style class composition. Centralize Serif styling in CSS variables and update page markup only where needed for test IDs and component API alignment.

**Tech Stack:** React 19, Vite 8, TypeScript, Tailwind dependency already present, local CSS, `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge`, Vitest.

---

### Task 1: shadcn Foundation

**Files:**
- Create: `components.json`
- Modify: `apps/story-lab/package.json`
- Modify: `apps/story-lab/src/lib/cn.ts`
- Modify: `apps/story-lab/src/components/ui.tsx`
- Test: `scripts/story-lab-ui-primitives.test.ts`

- [ ] Add dependency declarations for `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, and `tailwind-merge`.
- [ ] Create `components.json` with Story Lab aliases and shadcn metadata.
- [ ] Rewrite `cn` with `clsx` + `tailwind-merge`.
- [ ] Rewrite `Button`, `Card`, and `Badge` with shadcn-style variants and `data-test-id` passthrough.
- [ ] Add tests that render primitive functions enough to verify variant class names and test ID passthrough.
- [ ] Run `pnpm install`.
- [ ] Run `pnpm test scripts/story-lab-ui-primitives.test.ts`.

### Task 2: Serif Theme CSS

**Files:**
- Modify: `apps/story-lab/src/styles.css`

- [ ] Replace the dark theme with Serif design tokens.
- [ ] Reorganize CSS into token, base, shell, primitives, layout, widgets, modal, and responsive sections.
- [ ] Remove scattered hardcoded dark palette values from Story Lab styles.
- [ ] Preserve current layout behavior for dashboard, map, schedule, NPC, event, and validation pages.
- [ ] Run `pnpm --filter @tss/story-lab typecheck`.

### Task 3: Test IDs And Source Constraints

**Files:**
- Modify: `apps/story-lab/src/App.tsx`
- Modify: `apps/story-lab/src/components/common.tsx`
- Modify: `apps/story-lab/src/pages/editor-pages.tsx`
- Modify: `apps/story-lab/src/editor/template-catalog.ts`
- Test: `scripts/story-lab-test-ids.test.ts`
- Test: `scripts/story-lab-source-constraints.test.ts`

- [ ] Add `data-test-id` to the app shell, sidebar, project selector, navigation buttons, status area, and main region.
- [ ] Add `data-test-id` to helper component internals where they render controls or repeated rows.
- [ ] Add `data-test-id` to all page cards, buttons, tabs, rows, map tiles, schedule entries, event nodes, validator controls, and modal actions.
- [ ] Replace concrete story examples in Story Lab source with generic examples.
- [ ] Add source tests that fail when `button` or `select` in Story Lab source lacks `data-test-id`.
- [ ] Add source tests that fail when concrete story examples appear in `apps/story-lab/src`.
- [ ] Run `pnpm test scripts/story-lab-test-ids.test.ts scripts/story-lab-source-constraints.test.ts`.

### Task 4: Final Verification

**Files:**
- Verify all modified files.

- [ ] Run `pnpm --filter @tss/story-lab typecheck`.
- [ ] Run `pnpm --filter @tss/story-lab build`.
- [ ] Run `pnpm test`.
- [ ] Inspect `git diff --stat` and `git status --short`.
- [ ] Commit the implementation branch if all verification passes.
