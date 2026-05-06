import type { ContentPack, GameLog, GameRuntimeState } from '@tss/schema'
import { evaluateCondition } from './condition-engine'
import { applyEffects } from './effect-engine'
import { cloneState, makeLog } from './state-utils'

export function processNpcBehaviors(pack: ContentPack, state: GameRuntimeState): { state: GameRuntimeState; logs: GameLog[] } {
  const next = cloneState(state)
  const logs: GameLog[] = []
  for (const npc of pack.npcs) {
    const runtime = next.worldState.npcs[npc.id]
    if (runtime?.state.alive === false) continue
    const selected = [...npc.behaviorRules].sort((a, b) => b.priority - a.priority).find((rule) => evaluateCondition(rule.conditions, next))
    if (!selected) continue
    logs.push(makeLog(next, 'npc', `${npc.name}：${selected.name}`, selected.designNote))
    logs.push(...applyEffects(pack, next, selected.effects))
  }
  next.eventLogs = [...next.eventLogs, ...logs]
  return { state: next, logs }
}
