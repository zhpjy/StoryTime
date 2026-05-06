import { describe, expect, it } from 'vitest'
import { applyEffects } from './effect-engine'
import { createInitialRuntimeState } from './initial-state'
import { completeQuest, getQuestEntries, resolveQuestCompletions, startQuest } from './quest-engine'
import { makeBaseInteractionPack } from './test-content-pack'

describe('quest engine', () => {
  it('starts a quest and lists active entries', () => {
    const pack = makeBaseInteractionPack()
    const state = createInitialRuntimeState(pack, 'identity_test')

    const result = startQuest(pack, state, 'quest_search_test')

    expect(result.ok).toBe(true)
    expect(result.state.worldState.quests.quest_search_test?.status).toBe('active')
    expect(getQuestEntries(pack, result.state)[0]?.quest.id).toBe('quest_search_test')
  })

  it('completes a quest once and applies reward effects once', () => {
    const pack = makeBaseInteractionPack()
    const started = startQuest(pack, createInitialRuntimeState(pack, 'identity_test'), 'quest_search_test')

    const first = resolveQuestCompletions(pack, started.state, {
      type: 'environment',
      environmentType: 'search',
      targetType: 'location',
      targetId: 'loc_test',
      interactionId: 'interaction_search_test',
    })
    const second = completeQuest(pack, first.state, 'quest_search_test')

    expect(first.state.worldState.quests.quest_search_test?.status).toBe('completed')
    expect(first.state.worldState.variables.rapport).toBe(5)
    expect(second.state.worldState.variables.rapport).toBe(5)
  })

  it('starts and fails quests from effects', () => {
    const pack = makeBaseInteractionPack()
    const state = createInitialRuntimeState(pack, 'identity_test')

    applyEffects(pack, state, [{ type: 'start_quest', questId: 'quest_search_test' }])
    applyEffects(pack, state, [{ type: 'fail_quest', questId: 'quest_search_test' }])

    expect(state.worldState.quests.quest_search_test?.status).toBe('failed')
  })
})
