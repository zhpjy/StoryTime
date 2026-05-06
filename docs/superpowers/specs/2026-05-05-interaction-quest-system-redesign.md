# Interaction And Quest System Redesign

## Context

The game currently mixes several player-facing decision models:

- NPC conversations are first-class and already entered from NPCs on the current map tile.
- Location and building actions are direct selectable `GameAction` records shown as "可执行行动".
- Event `playerOptions` create a pending event decision panel on the right side of the play screen.
- There is no first-class quest, quest reward, or simplified combat model.

The new requirement is a breaking redesign. The player should no longer push story forward by clicking direct executable actions or pending event options. The player should interact with NPCs, objects, places, and the environment. Quests should carry the player's current goals, and rewards should be configured data rather than implied by story text.

This migration intentionally does not preserve compatibility with old `actions` or event player options.

Repository constraints still apply:

- Every page element and control needs a stable `data-test-id`.
- Source code must not hardcode concrete story content.
- Work happens in a feature worktree, then merges back to `main`; the worktree is removed after completion.

## Goals

- Replace direct player actions with a unified interaction/action system.
- Support four player action types: conversation, give, combat, and environment interaction.
- Support environment interaction subtypes: gather and search.
- Keep conversations first-class, but treat conversation topics and replies as action-system triggers.
- Add first-class quests with NPC source, strict completion rules, and explicit rewards.
- Add first-class rewards that apply structured effects when quests complete.
- Replace the right-side pending event panel with a quest panel.
- Remove player-facing event options from schema, validation, engine, UI, simulation, and content.
- Add simplified combat resolution using player combat value against enemy force.
- Migrate all source content and generated content packs to the new schema in one pass.

## Non-Goals

- No compatibility adapter for old `actions`.
- No runtime conversion from `events.playerOptions` to interactions.
- No natural-language quest completion.
- No combat inventory, skills, equipment, turn order, or battle UI.
- No story-specific fallback interaction, quest, reward, or death text in source code.
- No full Story Lab editing UI for every nested quest field beyond what the existing inspector and templates can support in this pass.

## Schema Design

`ContentPack` removes direct `actions` and adds:

```ts
type ContentPack = {
  // existing fields...
  interactions: Interaction[]
  quests: Quest[]
  rewards: Reward[]
  events: GameEvent[]
  conversations: Conversation[]
}
```

`Location` and `Building` replace `actionIds` with `interactionIds`. `NPC` gains `interactionIds` for non-conversation NPC interactions such as giving and combat.

```ts
type InteractionType = 'conversation' | 'give' | 'combat' | 'environment'
type EnvironmentInteractionType = 'gather' | 'search'
type InteractionTargetType = 'tile' | 'location' | 'building' | 'npc'

type InteractionBase = {
  id: string
  name: string
  description: string
  type: InteractionType
  targetType: InteractionTargetType
  targetId: string
  cost?: ActionCost
  conditions?: ConditionGroup
  effects?: Effect[]
}

type ConversationInteraction = InteractionBase & {
  type: 'conversation'
  conversationId: string
}

type GiveInteraction = InteractionBase & {
  type: 'give'
  targetType: 'npc'
  targetId: string
  itemId: string
  itemCount: number
  acceptedEffects?: Effect[]
}

type CombatInteraction = InteractionBase & {
  type: 'combat'
  targetType: InteractionTargetType
  targetId: string
  enemyCombat: number
  victoryEffects?: Effect[]
}

type EnvironmentInteraction = InteractionBase & {
  type: 'environment'
  environmentType: EnvironmentInteractionType
}

type Interaction =
  | ConversationInteraction
  | GiveInteraction
  | CombatInteraction
  | EnvironmentInteraction
```

Rules:

- Conversation interactions reference an existing `Conversation`.
- Give interactions must target an NPC and must define a positive `itemCount`.
- Combat interactions may target an NPC, location, building, or tile enemy encounter and must define non-negative `enemyCombat`.
- Environment interactions must define `environmentType`.
- `cost` keeps the existing shape and semantics: action points default to 1 if omitted.
- `effects` apply before type-specific effects, after cost is paid.
- `acceptedEffects` apply only when a give succeeds.
- `victoryEffects` apply only when combat succeeds.

`GameEvent` becomes world-only. It can still trigger effects and follow-up events, but it no longer carries `playerOptions` or enters an active player decision queue.

```ts
type GameEvent = {
  id: string
  name: string
  type: EventType
  locationId?: string
  participantIds: string[]
  trigger: ConditionGroup
  description: string
  effects: Effect[]
  followupEventIds: string[]
}
```

## Quest Design

Each quest is authored as structured data. It must state where it comes from, how it completes, and what rewards it grants.

```ts
type QuestStatus = 'active' | 'completed' | 'failed'
type QuestCompletionType = 'conversation' | 'give' | 'combat' | 'environment'

type QuestCompletion =
  | {
      type: 'conversation'
      npcId: string
      conversationId: string
      replyId?: string
    }
  | {
      type: 'give'
      npcId: string
      itemId: string
      itemCount: number
      interactionId?: string
    }
  | {
      type: 'combat'
      targetType: InteractionTargetType
      targetId: string
      result: 'victory'
      interactionId?: string
    }
  | {
      type: 'environment'
      environmentType: EnvironmentInteractionType
      targetType: InteractionTargetType
      targetId: string
      interactionId?: string
    }

type Quest = {
  id: string
  title: string
  description: string
  sourceNpcId: string
  conditions?: ConditionGroup
  completion: QuestCompletion
  rewardIds: string[]
}

type Reward = {
  id: string
  name: string
  description: string
  effects: Effect[]
}
```

Runtime quest state is explicit and append-only enough for UI and simulation.

```ts
type QuestRuntimeState = {
  id: string
  status: QuestStatus
  startedAt: { day: number; segment: TimeSegment }
  completedAt?: { day: number; segment: TimeSegment }
}

type WorldState = {
  // existing fields...
  quests: Record<string, QuestRuntimeState>
}
```

Quest effects:

```ts
type Effect =
  // existing effects...
  | { type: 'start_quest'; questId: string }
  | { type: 'fail_quest'; questId: string }
```

Quest completion is not authored as an effect in normal play. After any conversation reply or interaction resolves, the engine checks active quests against the interaction trigger. Matching quests are completed once, then their rewards are applied.

Rules:

- Every quest must have a valid `sourceNpcId`.
- Every quest must have at least one valid reward.
- Rewards are the authoritative post-completion payout.
- Quest completion text may describe goals, but only `completion` controls completion.
- If a completion rule references `interactionId`, only that interaction can complete the quest.
- If a completion rule omits `interactionId`, any matching action-system trigger may complete it.

## Engine Design

Add `interaction-engine` operations that replace direct action execution:

```ts
getInteractionAvailability(pack, state, interaction)
getInteractionsForCurrentLocation(pack, state)
executeInteraction(pack, state, interactionId)
```

Availability checks:

- Cost resources.
- Target exists.
- Target location matches the player's current location.
- Target NPC is alive when the target is an NPC.
- Interaction conditions pass.
- Give interaction item count is available.
- Combat interaction is blocked if its target is an NPC that is already dead.

Execution flow:

1. Clone state.
2. Write a player log with interaction name and description.
3. Pay cost.
4. Apply base `effects`.
5. Resolve the type-specific behavior.
6. Build a `QuestCompletionTrigger`.
7. Pass the trigger to the quest engine.
8. Append logs and return `{ ok, reasons, state, logs }`.

Conversation remains in `conversation-engine`, but it emits quest completion triggers when replies are chosen.

Add a `quest-engine`:

```ts
startQuest(pack, state, questId)
failQuest(pack, state, questId)
completeQuest(pack, state, questId)
resolveQuestCompletions(pack, state, trigger)
getQuestEntries(pack, state)
```

Quest engine behavior:

- `startQuest` validates the quest exists, conditions pass, and it is not already completed.
- `completeQuest` marks the quest completed and applies each reward's effects.
- Reward effects are applied through the same effect engine as all other structured state changes.
- Quest completion writes system/player logs for completion and rewards.
- `getQuestEntries` returns active/completed quests for the right-side panel, sorted active first and then by title.

## Combat Design

Combat is intentionally simple.

```ts
type CombatOutcome = {
  victory: boolean
  playerCombat: number
  enemyCombat: number
  healthDelta: number
}
```

Resolution:

- Compare `state.player.state.combat` to `interaction.enemyCombat`.
- If player combat is lower than enemy combat, the player dies immediately.
- If player combat is equal or higher, the player wins and takes damage based on the gap.
- Larger absolute differences produce larger damage.
- Damage is deterministic. No randomness is introduced in this pass.

Recommended formula:

```ts
const gap = playerCombat - enemyCombat
const healthDelta = gap >= 0
  ? -Math.max(1, Math.ceil(enemyCombat / Math.max(1, playerCombat + 10) * 12))
  : -state.player.state.health
```

On defeat:

- Player health becomes 0.
- `facts.player_dead` is set to `true`.
- `endingResult` is evaluated immediately so the UI can show a death ending without waiting for time advancement.
- No quest reward is issued.

On victory:

- Player health is reduced by `healthDelta`.
- Target NPC state `alive` becomes `false` when the combat target is an NPC, unless content effects override a different state. Location, building, and tile enemy encounters rely on authored `victoryEffects` for persistent world changes.
- `victoryEffects` are applied.
- A combat quest trigger is emitted.

The content pack must include a death ending whose condition can match `facts.player_dead`.

## Game Client Design

The selected tile detail panel remains the main world interaction surface, but the "可执行行动" section becomes an interaction section grouped by target:

- NPCs: conversation topics, give interactions, combat interactions.
- Buildings: environment interactions attached to the building.
- Location/environment: gather and search interactions attached to the location or tile.

The player does not choose from event options. Active world events may still be displayed as contextual information on the tile.

The right-side panel changes from `EventChoicePanel` to `QuestPanel`:

- Active quests show title, source NPC, completion summary, and reward summary.
- Completed quests remain visible in a compact completed section.
- Empty state says there are no current quests.
- The panel does not expose pending events as primary choices.

Store changes:

```ts
executeInteraction(interactionId: string)
getInteractionEntriesForSelectedTile()
getQuestEntries()
```

Remove:

```ts
executeAction(actionId)
resolveEventOption(eventId, optionId)
getAvailableActionsForSelectedTile()
```

Conversation UI changes:

- Topic selection remains NPC-based.
- Replies can start quests through `start_quest` effects.
- Replies can complete conversation quests through `resolveQuestCompletions`.

All new containers, rows, buttons, badges, disabled reasons, quest sections, and empty states require stable `data-test-id`.

## Content Migration

All source content and generated content packs are migrated together.

Migration rules:

- `actions.yaml` becomes `interactions.yaml`.
- Location and building `actionIds` become `interactionIds`.
- NPC give/combat interactions are referenced from NPC `interactionIds`.
- Existing investigate/help/rest/fight actions become environment, give, or combat interactions depending on target and effect.
- Existing event `playerOptions` are removed. Their effects move to one of:
  - conversation replies,
  - quest reward effects,
  - environment/give/combat interactions,
  - automatic event effects when no player choice is required.
- Existing events with no player option remain world events.
- Existing conversation files remain `conversations.yaml`.
- New `quests.yaml` and `rewards.yaml` are added per content pack.
- Generated `content/packs/*.json` and manifest output use the new schema.

The content migration may rewrite generic sample content and current authored content, but source code must not embed the content's specific names or story facts.

## Story Lab Design

Story Lab must understand the new schema enough for authors and tests:

- Template catalog replaces `actions[]` with `interactions[]`.
- Template catalog adds `quests[]` and `rewards[]`.
- Event graph no longer renders `playerOptions`; it shows world event effects and follow-up edges.
- NPC studio displays NPC interaction counts and conversation counts.
- Content file views and summaries include interactions, quests, and rewards.
- Validation page reports quest and reward schema errors.
- Simulation page and coverage labels use interaction steps instead of action steps and event option steps.

All changed Story Lab rows and controls require `data-test-id`.

## Validator Design

Validator changes:

- Top-level `actions` is rejected or absent from `ContentPack`.
- `events[].playerOptions` is rejected.
- `interactions`, `quests`, and `rewards` must be arrays.
- Interaction ids are unique.
- Quest ids and reward ids are unique.
- Interaction type-specific fields are checked.
- Interaction targets reference existing tiles, locations, buildings, or NPCs.
- Conversation interactions reference existing conversations.
- Give interactions reference existing items.
- Quest `sourceNpcId` references an existing NPC.
- Quest completion references existing NPCs, conversations, items, interactions, and targets.
- Quest `rewardIds` are non-empty and valid.
- Reward effects are valid and reference existing content.
- Death ending coverage is reported as an error if any combat interaction exists and no ending can match `facts.player_dead`.

Existing condition and effect validation should be reused where possible.

## Simulation Design

Simulation removes direct action and event-option expansion.

Simulation step kinds become:

```ts
type SimulationStepKind =
  | 'travel'
  | 'interaction'
  | 'conversation_reply'
  | 'advance_time'
  | 'rest'
```

Simulation explores:

- Available interactions at the current location.
- Available conversations and replies for NPCs at the current location.
- Quest-starting and quest-completing consequences through engine behavior.
- World events only through normal event processing, never as player options.

Coverage should report interaction, conversation, quest, and ending reachability.

## Error Handling

All engine commands return `{ ok: false, reasons }` for invalid or unavailable interactions instead of throwing, except content-pack initialization errors that make the game impossible to start.

Expected recoverable errors:

- Interaction missing.
- Target missing or not at current location.
- Condition failure.
- Insufficient action points or resources.
- Give item missing.
- Combat target NPC already dead.
- Quest missing, already completed, failed, or conditions not met.
- Reward missing.

The client stores joined reasons in `lastError`, matching existing store behavior.

## Testing

Engine tests:

- Interaction availability checks location, cost, conditions, item inventory, and NPC alive state.
- Environment interaction applies effects, emits a quest trigger, and can complete an environment quest.
- Give interaction consumes the configured item, applies accepted effects, and completes a give quest.
- Combat victory damages the player, marks the target defeated, applies victory effects, and completes combat quests.
- Combat defeat sets health to 0, records `facts.player_dead`, and immediately produces a death ending.
- Conversation reply can start a quest and can complete a conversation quest.
- Rewards apply exactly once when a quest completes.

Validator tests:

- Old top-level `actions` is rejected.
- Old `events.playerOptions` is rejected.
- Bad interaction target, bad conversation reference, bad item reference, invalid give count, invalid enemy combat, missing quest source, missing quest completion, empty reward list, and bad reward reference are reported.

Game-client tests:

- The selected tile shows interaction groups instead of direct executable actions.
- The right panel renders quests instead of pending events.
- Interaction buttons expose stable `data-test-id` and disabled reasons.
- Quest rewards and completion summaries render without story-specific source constants.

Story Lab tests:

- Template catalog exposes interactions, quests, and rewards.
- Event graph no longer displays player option branches.
- Source constraint tests reject old `actions` and event option UI references.

Content tests:

- `pnpm validate:content` passes for all source packs.
- `pnpm build:content-pack` writes generated packs without `actions` or `playerOptions`.
- Full test suite passes.
