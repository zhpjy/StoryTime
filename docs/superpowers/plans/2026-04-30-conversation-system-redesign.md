# Conversation System Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace one-shot dialogue effects with a first-class multi-turn conversation system across schema, engine, content, game-client, Story Lab, validation, and simulation.

**Architecture:** `@tss/schema` defines conversations and runtime state. `@tss/engine` owns conversation availability, start, reply, history, and impact helpers. Content source emits `conversations`, while game-client and Story Lab consume engine helpers instead of modeling conversation as location actions.

**Tech Stack:** TypeScript, React, Zustand, Vite, Vitest, pnpm workspaces, YAML content sources.

**Execution Note:** The user explicitly requested current-branch implementation and no worktree. This plan follows that request even though the default Superpowers workflow recommends a worktree.

---

## File Map

- Modify `packages/schema/src/types.ts`: remove `Dialogue`, add `Conversation` types, `start_conversation`, active conversation runtime state, and history entries.
- Modify `packages/schema/src/constants.ts`: replace dialogue constants with conversation impact constants and update effect types.
- Create `packages/engine/src/conversation-engine.ts`: conversation availability, start, reply selection, end, history helpers, and impact helpers.
- Modify `packages/engine/src/effect-engine.ts`: remove `start_dialogue`, add optional `start_conversation` handling.
- Modify `packages/engine/src/initial-state.ts`: initialize `conversationHistory`.
- Modify `packages/engine/src/index.ts`: export conversation engine.
- Modify `packages/engine/src/simulation-engine.ts`: include conversation reply exploration and coverage steps.
- Modify `packages/validator/src/schema-validator.ts`, `reference-validator.ts`, `content-gap-analyzer.ts`, and `fact-path-validator.ts`: validate conversation graph and remove dialogue validation.
- Modify `scripts/content-source.ts`: load `conversations.yaml`.
- Modify `scripts/build-content-pack.ts`, `scripts/validate-content.ts` only if type changes require it.
- Modify `content/qinglan-town/npcs/index.yaml`: replace `dialogues.yaml` references with `conversations.yaml`.
- Create `content/qinglan-town/npcs/*/conversations.yaml`: migrate authored NPC dialogue into conversations.
- Delete `content/qinglan-town/npcs/*/dialogues.yaml`.
- Modify `content/qinglan-town/actions.yaml`, `events.yaml`, and NPC `behavior.yaml`: remove or replace `start_dialogue`.
- Regenerate `content/qinglan-town/content-pack.json` and `packages/content-pack/src/qinglan-town.ts`.
- Modify `apps/game-client/src/store/game-store.ts`: add conversation store operations and stop adding NPC dialogue actions to selected tile actions.
- Modify `apps/game-client/src/features/map/components/TileInfoPanel.tsx`: add current-tile NPC conversation UI.
- Create `apps/game-client/src/features/conversation/ConversationPanel.tsx`: active conversation view, reply list, impact badges, and empty states.
- Modify Story Lab files: `apps/story-lab/src/pages/editor/npc-studio-page.tsx`, `editor/template-catalog.ts`, `editor/story-files.ts`, `editor/types.ts`, `pages/editor/shared.tsx`, and simulation page helpers.
- Modify docs: `docs/content-schema.md`, `docs/validator.md`, and generator docs that mention dialogue.
- Modify tests under `scripts/*.test.ts` and package tests where needed.

## Task 1: Schema And Engine Conversation Contract

**Files:**
- Create: `packages/engine/src/conversation-engine.ts`
- Modify: `packages/schema/src/types.ts`
- Modify: `packages/schema/src/constants.ts`
- Modify: `packages/engine/src/effect-engine.ts`
- Modify: `packages/engine/src/initial-state.ts`
- Modify: `packages/engine/src/index.ts`
- Test: `scripts/conversation-engine-regression.test.ts`

- [ ] **Step 1: Write failing conversation engine tests**

Create tests that import the future engine functions:

```ts
import type { ContentPack } from '@tss/schema'
import {
  chooseConversationReply,
  createInitialRuntimeState,
  getAvailableConversationsForNpc,
  getConversationReplyImpact,
  hasChosenConversationReply,
  hasVisitedConversation,
  hasVisitedConversationNode,
  startConversation,
} from '@tss/engine'
import { expect, test } from 'vitest'

test('starts a conversation, records node history, and chooses a reply', () => {
  const pack = makeConversationPack()
  const initial = createInitialRuntimeState(pack, 'identity_test')
  const available = getAvailableConversationsForNpc(pack, initial, 'npc_test')
  expect(available.map((entry) => entry.conversation.id)).toEqual(['conversation_test'])

  const started = startConversation(pack, initial, 'conversation_test')
  expect(started.ok).toBe(true)
  expect(started.state.worldState.activeConversation).toEqual({
    conversationId: 'conversation_test',
    npcId: 'npc_test',
    nodeId: 'node_entry',
  })
  expect(hasVisitedConversation(started.state, 'conversation_test')).toBe(true)
  expect(hasVisitedConversationNode(started.state, 'conversation_test', 'node_entry')).toBe(true)

  const replied = chooseConversationReply(pack, started.state, 'reply_help')
  expect(replied.ok).toBe(true)
  expect(replied.state.worldState.activeConversation?.nodeId).toBe('node_after_help')
  expect(hasChosenConversationReply(replied.state, 'conversation_test', 'reply_help')).toBe(true)
  expect(replied.state.worldState.relationships['player:npc_test'].trust).toBe(12)
})

test('conversation impact prefers explicit metadata and infers effect fallback', () => {
  const pack = makeConversationPack()
  const conversation = pack.conversations[0]
  expect(getConversationReplyImpact(pack, createInitialRuntimeState(pack, 'identity_test'), conversation.nodes[0].replies[0])).toEqual([
    { type: 'relationship', targetId: 'npc_test', label: 'Trust rises', tone: 'positive' },
  ])
  expect(getConversationReplyImpact(pack, createInitialRuntimeState(pack, 'identity_test'), conversation.nodes[1].replies[0])[0]?.type).toBe('fact')
})
```

- [ ] **Step 2: Run red test**

Run: `pnpm test scripts/conversation-engine-regression.test.ts`

Expected: fail because conversation types and engine exports do not exist.

- [ ] **Step 3: Implement schema and engine**

Add the conversation types from the spec, replace `dialogueHistory` with `conversationHistory`, remove `Dialogue`, remove `DIALOGUE_TYPES`, add `start_conversation`, and implement `conversation-engine.ts` with clone-state semantics matching `interaction-engine.ts`.

- [ ] **Step 4: Run green test**

Run: `pnpm test scripts/conversation-engine-regression.test.ts`

Expected: pass.

## Task 2: Validator And Content Source Contract

**Files:**
- Modify: `packages/validator/src/schema-validator.ts`
- Modify: `packages/validator/src/reference-validator.ts`
- Modify: `packages/validator/src/content-gap-analyzer.ts`
- Modify: `packages/validator/src/fact-path-validator.ts`
- Modify: `scripts/content-source.ts`
- Test: `scripts/validator-regression.test.ts`

- [ ] **Step 1: Write failing validator assertions**

Extend `scripts/validator-regression.test.ts` with invalid conversation graph cases:

```ts
const badConversationPack = clonePack(qinglanTownContentPack)
badConversationPack.conversations[0].entryNodeId = 'missing_node'
expect(validateContentPack(badConversationPack).errors.some((issue) => issue.message.includes('entryNodeId'))).toBe(true)
```

- [ ] **Step 2: Run red validator test**

Run: `pnpm test scripts/validator-regression.test.ts`

Expected: fail until validator understands conversations.

- [ ] **Step 3: Implement validator and source loader changes**

Validate conversation ids, NPC refs, node refs, reply terminal/next-node rules, impact labels, `start_conversation` refs, and reject old `start_dialogue` effects. Update `scripts/content-source.ts` to require and load `conversations.yaml`.

- [ ] **Step 4: Run green validator test**

Run: `pnpm test scripts/validator-regression.test.ts`

Expected: pass.

## Task 3: Content Migration

**Files:**
- Modify: `content/qinglan-town/actions.yaml`
- Modify: `content/qinglan-town/events.yaml`
- Modify: `content/qinglan-town/npcs/index.yaml`
- Modify: `content/qinglan-town/npcs/*/behavior.yaml`
- Create: `content/qinglan-town/npcs/*/conversations.yaml`
- Delete: `content/qinglan-town/npcs/*/dialogues.yaml`
- Generated: `content/qinglan-town/content-pack.json`
- Generated: `packages/content-pack/src/qinglan-town.ts`
- Test: `scripts/content-source.ts`, `scripts/validate-content.ts`

- [ ] **Step 1: Add content migration checks**

Add or update source constraint tests so generated content has `conversations`, no `dialogues`, and no `start_dialogue`.

- [ ] **Step 2: Run red content checks**

Run: `pnpm test scripts/validator-regression.test.ts scripts/content-source-conversations.test.ts`

Expected: fail because `scripts/content-source-conversations.test.ts` asserts `conversations` output while the loader still emits `dialogues`.

- [ ] **Step 3: Migrate YAML content**

Convert each NPC's authored dialogue records into `conversations.yaml`. Use one conversation per previous dialogue unless multiple records form a clear multi-node topic. Remove old dialogue-triggering action effects and model player-initiated questions as conversation topics.

- [ ] **Step 4: Build content artifacts**

Run: `pnpm build:content-pack`

Expected: generated JSON and TS include `conversations`.

- [ ] **Step 5: Validate content**

Run: `pnpm validate:content`

Expected: no schema, reference, or conversation graph errors.

## Task 4: Simulation Coverage

**Files:**
- Modify: `packages/engine/src/simulation-engine.ts`
- Modify: `apps/story-lab/src/pages/editor/shared.tsx`
- Modify: `apps/story-lab/src/pages/editor/story-simulation-page.tsx`
- Test: `scripts/simulation-tree-regression.test.ts`
- Test: `scripts/simulation-coverage-regression.test.ts`

- [ ] **Step 1: Write failing simulation assertion**

Assert that coverage can emit a `conversation_reply` step when a conversation is available at the current location.

- [ ] **Step 2: Run red simulation test**

Run: `pnpm test scripts/simulation-tree-regression.test.ts`

Expected: fail because the step kind is not implemented.

- [ ] **Step 3: Implement simulation expansion**

Add `conversation_start` and `conversation_reply` or only `conversation_reply` transitions. Start available conversations from current-location NPCs, then expand active conversation replies.

- [ ] **Step 4: Run green simulation tests**

Run: `pnpm test scripts/simulation-tree-regression.test.ts scripts/simulation-coverage-regression.test.ts`

Expected: pass.

## Task 5: Game Client Conversation UI

**Files:**
- Modify: `apps/game-client/src/store/game-store.ts`
- Modify: `apps/game-client/src/features/map/components/TileInfoPanel.tsx`
- Create: `apps/game-client/src/features/conversation/ConversationPanel.tsx`
- Modify tests: `scripts/game-client-source-constraints.test.ts`

- [ ] **Step 1: Write failing source/UI assertions**

Assert that new conversation UI test ids exist and old NPC dialogue action aggregation is gone from game-client source.

- [ ] **Step 2: Run red game-client test**

Run: `pnpm test scripts/game-client-source-constraints.test.ts`

Expected: fail until UI source changes are present.

- [ ] **Step 3: Implement store operations**

Add selected NPC state, conversation start/reply/end actions, derived topic entries, and persistence after conversation state changes.

- [ ] **Step 4: Implement tile conversation UI**

Render current-tile NPC buttons, topic rows, visited markers, active node text, reply buttons, disabled reasons, and impact badges with `data-test-id`.

- [ ] **Step 5: Run green game-client checks**

Run: `pnpm test scripts/game-client-source-constraints.test.ts && pnpm --filter @tss/game-client typecheck`

Expected: pass.

## Task 6: Story Lab Conversation Views And Templates

**Files:**
- Modify: `apps/story-lab/src/pages/editor/npc-studio-page.tsx`
- Modify: `apps/story-lab/src/pages/editor/shared.tsx`
- Modify: `apps/story-lab/src/editor/template-catalog.ts`
- Modify: `apps/story-lab/src/editor/story-files.ts`
- Modify: `apps/story-lab/src/editor/dashboard-overview.ts`
- Modify: `apps/story-lab/src/editor/types.ts`
- Modify tests: `scripts/story-lab-*.test.ts`

- [ ] **Step 1: Update failing Story Lab tests**

Replace dialogue terminology expectations with conversation terminology and add checks for `conversations[]` template fields.

- [ ] **Step 2: Run red Story Lab tests**

Run: `pnpm test scripts/story-lab-ui-primitives.test.ts scripts/story-lab-source-constraints.test.ts`

Expected: fail until source updates are complete.

- [ ] **Step 3: Implement Story Lab source changes**

Rename NPC tab, render conversation outlines, update template catalog and file catalog, update metrics and shared filters.

- [ ] **Step 4: Run green Story Lab checks**

Run: `pnpm test scripts/story-lab-ui-primitives.test.ts scripts/story-lab-source-constraints.test.ts && pnpm --filter @tss/story-lab typecheck`

Expected: pass.

## Task 7: Docs And Final Verification

**Files:**
- Modify: `docs/content-schema.md`
- Modify: `docs/validator.md`
- Modify: `docs/story-generator.md`
- Modify: `README.md` if it mentions old dialogue behavior.

- [ ] **Step 1: Update docs**

Document `conversations`, `ConversationImpact`, `start_conversation`, and removal of `dialogues` / `start_dialogue`.

- [ ] **Step 2: Run repository checks**

Run:

```bash
pnpm build:content-pack
pnpm validate:content
pnpm typecheck
pnpm test
pnpm --filter @tss/game-client build
pnpm --filter @tss/story-lab build
```

Expected: all commands pass, or any unrelated baseline failure is recorded with exact output.

- [ ] **Step 3: Commit implementation**

Run:

```bash
git status --short
git add .
git commit -m "Redesign conversation system"
```

Expected: one implementation commit after verified changes.

## Self-Review

- Spec coverage: schema, engine, history, impact, content, game-client, Story Lab, validator, docs, simulation, tests, and source constraints are represented.
- Placeholder scan: task steps name concrete files and commands.
- Type consistency: the plan consistently uses `Conversation`, `ConversationNode`, `ConversationReply`, `ConversationImpact`, `activeConversation`, and `conversationHistory`.
