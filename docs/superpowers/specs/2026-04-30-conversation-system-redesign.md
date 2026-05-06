# Conversation System Redesign

## Context

The current dialogue model is a one-shot `Dialogue` object triggered indirectly through `start_dialogue` effects, usually from location or NPC actions. This makes active NPC conversation feel like a side effect of the action system instead of a first-class interaction.

The new requirement is to redesign conversation across schema, content, engine, game-client, Story Lab, templates, validation, and simulation:

- When the player selects a map tile and the player is currently at that tile's location, the player can choose any living NPC present on that tile and talk to them.
- The player then chooses from available conversation topics for that NPC.
- Conversation is multi-turn: nodes display speaker text and replies advance the conversation.
- The system records which conversations, nodes, and replies the player has visited.
- Replies reserve an extension point for declaring or deriving their gameplay impact.
- Old `Dialogue` and `start_dialogue` compatibility is not required. The migration is intentionally breaking.

Repository constraints still apply:

- All page elements and controls need stable `data-test-id` attributes.
- Source code must not hardcode concrete story content such as specific story names or location names.
- Content files and Story Lab templates must be updated with the schema change.

## Goals

- Replace `Dialogue` with a first-class `Conversation` model.
- Remove `start_dialogue` from schema, content, validator, engine, and UI usage.
- Add multi-turn conversation runtime state and engine operations.
- Add game-client NPC conversation entry from the selected current map tile.
- Track conversation visits at conversation, node, and reply granularity.
- Add an impact declaration interface on replies, with engine helpers that can later support richer preview behavior.
- Update content source, generated content pack output, schema docs, Story Lab templates, Story Lab NPC views, validation, and simulation coverage.
- Keep non-dialogue actions as normal actions; conversation should not be modeled as a location action.

## Non-Goals

- No backward compatibility for old `dialogues` content.
- No adapter that silently converts `start_dialogue` effects at runtime.
- No full authoring UI for editing conversation YAML in this pass, unless existing Story Lab patterns already support similar generated views.
- No LLM-generated dynamic dialogue. All conversation content remains authored in content files.
- No hardcoded story-specific fallback conversations in source code.

## Schema Design

`ContentPack` replaces `dialogues: Dialogue[]` with `conversations: Conversation[]`.

```ts
export type Conversation = {
  id: string
  npcId: string
  title: string
  entryNodeId: string
  conditions?: ConditionGroup
  priority?: number
  nodes: ConversationNode[]
  impact?: ConversationImpact[]
}

export type ConversationNode = {
  id: string
  speaker: 'player' | string
  text: string
  effects?: Effect[]
  replies: ConversationReply[]
}

export type ConversationReply = {
  id: string
  text: string
  conditions?: ConditionGroup
  effects?: Effect[]
  impact?: ConversationImpact[]
  nextNodeId?: string
  endConversation?: boolean
}

export type ConversationImpact = {
  type: 'relationship' | 'fact' | 'variable' | 'item' | 'event' | 'location' | 'npc' | 'custom'
  targetId?: string
  label: string
  tone?: 'positive' | 'negative' | 'neutral' | 'risk'
}
```

Rules:

- `Conversation.npcId` must reference an existing NPC.
- `Conversation.title` is the player-visible topic label.
- `entryNodeId` must reference a node in `nodes`.
- `ConversationNode.speaker` is either `player` or an actor id, normally the NPC id.
- `ConversationReply` must either set `nextNodeId` or `endConversation: true`.
- `nextNodeId`, when present, must reference a node in the same conversation.
- `impact` is declarative. It does not apply effects by itself.
- Actual state mutation still uses `effects`.

`EffectType` removes `start_dialogue`. If forced conversation launch is still needed for events or behavior rules, add:

```ts
| { type: 'start_conversation'; conversationId: string }
```

This effect starts a conversation only when the target conversation exists and its conditions pass. It is not used for normal player-initiated NPC conversation.

## Runtime State

`WorldState.dialogueHistory` is replaced with conversation-specific runtime fields.

```ts
export type ActiveConversationState = {
  conversationId: string
  npcId: string
  nodeId: string
}

export type ConversationHistoryEntry = {
  conversationId: string
  npcId: string
  nodeId: string
  replyId?: string
  day: number
  segment: TimeSegment
}

export type WorldState = {
  // existing fields...
  activeConversation?: ActiveConversationState
  conversationHistory: ConversationHistoryEntry[]
}
```

History is append-only. The engine also exposes derived helpers:

```ts
hasVisitedConversation(state, conversationId)
hasVisitedConversationNode(state, conversationId, nodeId)
hasChosenConversationReply(state, conversationId, replyId)
```

These helpers support UI badges, validation, future content conditions, and simulation reports.

## Engine Design

Create a conversation engine module with focused operations:

```ts
getConversationAvailability(pack, state, conversation)
getAvailableConversationsForNpc(pack, state, npcId)
startConversation(pack, state, conversationId)
getActiveConversationNode(pack, state)
getConversationReplyAvailability(pack, state, reply)
chooseConversationReply(pack, state, replyId)
endConversation(pack, state)
getConversationReplyImpact(pack, state, reply)
```

Behavior:

- `getAvailableConversationsForNpc` filters by NPC existence, NPC alive state, same player location, and conversation conditions.
- `startConversation` verifies availability, clones state, sets `activeConversation`, records entry node history, applies entry node effects, and writes a conversation log.
- `chooseConversationReply` verifies active conversation, reply existence, and reply conditions. It applies reply effects, records `replyId`, advances to `nextNodeId` and applies that node's effects, or ends the conversation.
- `endConversation` clears `activeConversation`.
- `getConversationReplyImpact` initially returns explicit `reply.impact` when present, otherwise derives a basic impact summary from `effects`.

Error handling:

- Missing conversation, NPC, node, or reply returns `{ ok: false, reasons }`.
- Unavailable conversation or reply returns condition failure reasons.
- Invalid `nextNodeId` returns an error and ends the active conversation to avoid trapping the player.

The existing event/action engine remains responsible for non-conversation actions. Event options can still apply effects and can use `start_conversation` only when an event should force a conversation UI.

## Game Client Design

The map tile detail panel becomes the main conversation entry point.

Flow:

1. Player selects a map tile.
2. If the tile has a location and `runtime.player.locationId === tile.locationId`, NPCs currently at that location are rendered as interactive conversation targets.
3. Clicking an NPC opens that NPC's available conversation topics.
4. A topic row shows `title`, availability, already-visited status, and any declared topic-level impact.
5. Starting a topic opens the active conversation view.
6. The conversation view shows current speaker, node text, reply buttons, condition failure reasons, and reply impacts.
7. Selecting a reply applies effects, records history, and advances or ends.
8. Ending returns the player to the selected NPC's topic list.

Store additions:

```ts
selectConversationNpc(npcId?: string)
startConversation(conversationId: string)
chooseConversationReply(replyId: string)
endConversation()
getConversationEntriesForNpc(npcId: string)
```

UI rules:

- NPC conversation controls appear only for the player's current tile.
- NPCs on non-current selected tiles may still be listed for information, but their conversation controls are disabled with a clear reason.
- Existing non-dialogue actions remain in the action list.
- Conversation UI must not use story-specific fallback text.
- All cards, NPC buttons, topic rows, reply buttons, impact badges, error states, and active conversation regions need `data-test-id`.

## Content Migration

Content source changes:

- Replace `content/**/npcs/*/dialogues.yaml` with `content/**/npcs/*/conversations.yaml`.
- Update `scripts/content-source.ts` to load conversations.
- Update `content/**/content-pack.json` and generated `packages/content-pack/src/*.ts`.
- Remove `dialogues` arrays from content pack outputs.
- Remove all `start_dialogue` effects from actions, events, and NPC behavior files.

Migration rules:

- Existing important one-shot dialogue becomes a single-topic conversation.
- Related one-shot dialogue for the same NPC can become multiple conversation topics or multiple nodes in one topic, depending on narrative relationship.
- If a previous action existed only to ask an NPC a question, remove that action and model the question as a conversation topic.
- If a previous event or behavior used dialogue as a forced narrative beat, either convert it to `start_conversation` or express it as event/log narrative if no player reply is needed.
- Every NPC should have at least one authored conversation unless intentionally marked by validation metadata in a later design.
- Each reply that changes state should include an `impact` declaration where the player-facing consequence is meaningful.

## Story Lab Design

Story Lab must reflect the new conversation model instead of old dialogues.

NPC page:

- Rename the old "对白" tab to "会话".
- Show conversations for the selected NPC.
- Show topic title, condition summary, node count, reply count, impact summary, and validation issues.
- Show a compact node/reply outline so authors can inspect multi-turn flow.

Template catalog:

- Replace `dialogues[]` templates with `conversations[]`.
- Include fields for `title`, `entryNodeId`, `nodes[].speaker`, `nodes[].replies[].text`, `nextNodeId`, `endConversation`, and `impact`.
- Template examples must use generic sample ids and text, not concrete story content.

Content file view:

- Replace `dialogues.json` with `conversations.json`.
- Counts and file labels use conversation terminology.

Validation page:

- Add validation for missing titles, invalid NPC references, invalid `entryNodeId`, invalid `nextNodeId`, replies without a terminal or next node, empty node text, empty reply text, invalid impact declarations, and illegal `start_dialogue` effects.
- Add content gap warnings for NPCs without conversations and conversations with no available entry under plausible initial state.

Simulation page:

- Treat `conversation_reply` as a simulation step kind.
- Explore available NPC conversations and replies from the current location.
- Track coverage for conversations, nodes, and replies separately from event/action coverage.

All new Story Lab controls and rows require `data-test-id`.

## Validator And Docs

Update `packages/validator`:

- Validate the new conversation graph.
- Validate effect references for `start_conversation`.
- Reject or flag old `dialogues` and `start_dialogue`.
- Extend fact path validation only if new history conditions are added.

Update docs:

- `docs/content-schema.md`
- `docs/validator.md`
- Any generator docs that mention dialogue files or `start_dialogue`.

The docs should state that `impact` is descriptive metadata and `effects` are authoritative for state mutation.

## Testing

Engine tests:

- Available conversations are filtered by NPC, location, alive state, and conditions.
- Starting a conversation sets active state, applies entry node effects, and records history.
- Choosing a reply applies effects, records reply history, advances nodes, and ends when requested.
- Invalid graph references fail cleanly.
- Impact helper returns explicit impact and can infer basic impact from effects.

Validator tests:

- Missing title, bad NPC id, bad entry node, bad next node, empty reply terminal, missing impact label, and old `start_dialogue` are reported.

Game-client tests:

- Current tile NPCs expose conversation controls.
- Non-current selected tile NPCs do not allow conversation start.
- Visited conversations show an already-visited marker.
- Reply impacts and disabled reasons render.
- All new UI elements expose stable `data-test-id`.

Story Lab tests:

- NPC page displays conversation tab and conversation outlines.
- Template catalog exposes conversation fields.
- Source constraint tests no longer look for old dialogue templates.
- Simulation step filters include conversation replies.

Content tests:

- Content source loads conversations.
- Built content pack has `conversations` and no `dialogues`.
- No content file or generated content contains `start_dialogue`.

## Acceptance Criteria

- `Dialogue` type, `dialogues` content pack field, `dialogueHistory`, and `start_dialogue` are removed.
- `Conversation`, `ConversationNode`, `ConversationReply`, `ConversationImpact`, `activeConversation`, and `conversationHistory` are implemented.
- Player can click NPCs on the current selected map tile and choose available conversation topics.
- Multi-turn replies advance, apply effects, record history, and expose impact summaries.
- Content source files and generated content pack are fully migrated to conversations.
- Story Lab NPC pages, templates, content file views, validation, and simulation coverage use conversations.
- No source code hardcodes concrete story content.
- New and changed UI elements have `data-test-id`.
- Typecheck, relevant unit tests, content validation, and app builds pass, or any unrelated baseline failures are explicitly documented.
