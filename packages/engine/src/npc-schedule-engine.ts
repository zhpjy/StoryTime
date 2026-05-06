import type { ContentPack, GameLog, GameRuntimeState, NpcScheduleEntry } from '@tss/schema'
import { evaluateCondition } from './condition-engine'
import { applyEffects } from './effect-engine'
import { cloneState, makeLog, setByPath } from './state-utils'

function isInDayRange(entry: NpcScheduleEntry, day: number): boolean {
  if (typeof entry.dayRange?.from === 'number' && day < entry.dayRange.from) return false
  if (typeof entry.dayRange?.to === 'number' && day > entry.dayRange.to) return false
  return true
}

function selectScheduleEntry(entries: NpcScheduleEntry[], state: GameRuntimeState): NpcScheduleEntry | undefined {
  return entries
    .filter((entry) => entry.segment === state.time.segment)
    .filter((entry) => isInDayRange(entry, state.time.day))
    .filter((entry) => evaluateCondition(entry.conditions, state))
    .sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0))[0]
}

export function processNpcSchedules(pack: ContentPack, state: GameRuntimeState): { state: GameRuntimeState; logs: GameLog[] } {
  const next = cloneState(state)
  const logs: GameLog[] = []

  for (const npc of pack.npcs) {
    const runtime = next.worldState.npcs[npc.id]
    if (!runtime || runtime.state.alive === false) continue

    const selected = selectScheduleEntry(npc.schedule, next)
    if (!selected) continue

    const oldLocationId = runtime.locationId
    const oldActivity = runtime.state.currentActivity
    runtime.locationId = selected.locationId
    setByPath(runtime.state, 'currentActivity', selected.activity)
    setByPath(runtime.state, 'currentScheduleId', selected.id)

    if (oldLocationId !== selected.locationId || oldActivity !== selected.activity) {
      const locationName = pack.locations.find((location) => location.id === selected.locationId)?.name ?? selected.locationId
      logs.push(makeLog(next, 'npc', `${npc.name}：${selected.activity}`, `日程前往：${locationName}`))
    }

    if (selected.effects?.length) logs.push(...applyEffects(pack, next, selected.effects))
  }

  next.eventLogs = [...next.eventLogs, ...logs]
  return { state: next, logs }
}
