# Origin Intro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add content-authored origin introductions to identity selection and the game entry flow.

**Architecture:** `@tss/schema` defines required identity intro fields. Content YAML owns story-specific text and the content pack pipeline passes it through unchanged. The game client reads the selected identity intro, shows it once per runtime, and persists dismissal as a fact.

**Tech Stack:** TypeScript, React, Zustand, Vitest, YAML content source.

---

### Task 1: Schema And Validator

**Files:**
- Modify: `packages/schema/src/types.ts`
- Modify: `packages/validator/src/schema-validator.ts`
- Test: `scripts/validator-regression.test.ts`

- [ ] **Step 1: Write failing validator test**

Add a test case to `scripts/validator-regression.test.ts` that removes `backgroundSummary` and `intro.motivation` from a copied identity and expects schema errors mentioning those paths.

- [ ] **Step 2: Run red test**

Run: `pnpm test scripts/validator-regression.test.ts`
Expected: FAIL because missing origin intro fields are not validated yet.

- [ ] **Step 3: Add types and validation**

Add `backgroundSummary` and `intro` to `PlayerIdentity`, then validate all required strings in `validateSchema`.

- [ ] **Step 4: Run green test**

Run: `pnpm test scripts/validator-regression.test.ts`
Expected: PASS.

### Task 2: Content Fields

**Files:**
- Modify: `content/qinglan-town/identities.yaml`
- Test: content validation via `pnpm validate:content`

- [ ] **Step 1: Add authored fields**

For each identity, add `backgroundSummary` and `intro.title/story/origin/motivation`. Keep the text in content YAML only.

- [ ] **Step 2: Validate content**

Run: `pnpm validate:content`
Expected: PASS.

### Task 3: Game Client UI

**Files:**
- Modify: `apps/game-client/src/pages/game/identity-page.tsx`
- Create: `apps/game-client/src/features/game/OriginIntroDialog.tsx`
- Modify: `apps/game-client/src/pages/game/game-page.tsx`
- Modify: `apps/game-client/src/store/game-store.ts`
- Test: `scripts/game-client-source-constraints.test.ts`

- [ ] **Step 1: Write failing source constraint test**

Add assertions that the identity page renders `backgroundSummary`, the game page mounts `OriginIntroDialog`, the dialog uses `origin_intro_seen`, and new dialog elements have `data-test-id`.

- [ ] **Step 2: Run red test**

Run: `pnpm test scripts/game-client-source-constraints.test.ts`
Expected: FAIL because the dialog and summary rendering do not exist.

- [ ] **Step 3: Implement UI and state**

Add a store action that sets `worldState.facts.origin_intro_seen = true` and persists the runtime. Render the summary on identity cards. Add `OriginIntroDialog` with existing dialog primitives and mount it from `GamePage`.

- [ ] **Step 4: Run green test**

Run: `pnpm test scripts/game-client-source-constraints.test.ts`
Expected: PASS.

### Task 4: Story Creation Skill

**Files:**
- Modify: `.agents/skills/story-creation/SKILL.md`

- [ ] **Step 1: Update guidance**

Document identity origin intro fields and authoring rules in the existing skill, preserving existing user edits where present.

### Task 5: Final Verification

**Files:**
- Generated: `content/packs/qinglan_town_mvp.json`

- [ ] **Step 1: Build content pack**

Run: `pnpm build:content-pack`
Expected: PASS and packed JSON includes the identity intro fields.

- [ ] **Step 2: Run full checks**

Run: `pnpm test && pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit implementation**

Run: `git status --short`, review changed files, then commit the feature.
