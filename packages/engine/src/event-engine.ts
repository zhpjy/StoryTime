import type { ContentPack, GameEvent, GameLog, GameRuntimeState } from '@tss/schema'
import { evaluateCondition } from './condition-engine'
import { applyEffects } from './effect-engine'
import { cloneState, makeLog } from './state-utils'

function triggerEvent(pack: ContentPack, state: GameRuntimeState, event: GameEvent): GameLog[] {
  if (state.worldState.eventHistory.includes(event.id)) return []
  state.worldState.eventHistory.push(event.id)
  const logs: GameLog[] = [makeLog(state, 'event', `事件触发：${event.name}`, event.description)]
  logs.push(...applyEffects(pack, state, event.effects))
  for (const followup of event.followupEventIds) {
    if (!state.worldState.eventHistory.includes(followup) && !state.worldState.pendingEventIds.includes(followup)) {
      state.worldState.pendingEventIds.push(followup)
    }
  }
  return logs
}

export function processEvents(pack: ContentPack, state: GameRuntimeState, maxEvents = 8): { state: GameRuntimeState; logs: GameLog[] } {
  const next = cloneState(state)
  const logs: GameLog[] = []
  let count = 0

  const pending = [...next.worldState.pendingEventIds]
  next.worldState.pendingEventIds = []
  for (const id of pending) {
    const event = pack.events.find((item) => item.id === id)
    if (event && !next.worldState.eventHistory.includes(event.id)) {
      logs.push(...triggerEvent(pack, next, event))
      count += 1
      if (count >= maxEvents) break
    }
  }

  if (count < maxEvents) {
    for (const event of pack.events) {
      if (next.worldState.eventHistory.includes(event.id)) continue
      if (evaluateCondition(event.trigger, next)) {
        logs.push(...triggerEvent(pack, next, event))
        count += 1
        if (count >= maxEvents) break
      }
    }
  }

  next.eventLogs = [...next.eventLogs, ...logs]
  return { state: next, logs }
}
