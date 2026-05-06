import type { ContentPack, GameLog, GameRuntimeState } from '@tss/schema'
import { evaluateCondition } from './condition-engine'
import { evaluateEnding } from './ending-engine'
import { applyEffects } from './effect-engine'
import { processEvents } from './event-engine'
import { processNpcBehaviors } from './npc-behavior-engine'
import { processNpcSchedules } from './npc-schedule-engine'
import { cloneState, makeLog, nextSegment, segmentDidAdvanceDay } from './state-utils'

function applyDailyDrift(pack: ContentPack, state: GameRuntimeState): GameLog[] {
  const logs: GameLog[] = [makeLog(state, 'system', `一夜过去，${pack.world.name}的局势自行推移。`)]
  for (const rule of pack.runtime.dailyDriftRules) {
    if (!evaluateCondition(rule.conditions, state)) continue
    logs.push(makeLog(state, 'system', `世界规则：${rule.name}`, rule.id))
    logs.push(...applyEffects(pack, state, rule.effects))
  }
  return logs
}

export function advanceTimeSegment(pack: ContentPack, state: GameRuntimeState): { state: GameRuntimeState; logs: GameLog[] } {
  let next = cloneState(state)
  const logs: GameLog[] = []
  const oldSegment = next.time.segment
  next.time.segment = nextSegment(next.time.segment)
  if (segmentDidAdvanceDay(oldSegment)) next.time.day += 1
  next.time.actionPoints = pack.world.actionPointsPerSegment
  logs.push(makeLog(next, 'system', `时间推进：第 ${next.time.day} 天 · ${next.time.segment}`))
  if (segmentDidAdvanceDay(oldSegment)) logs.push(...applyDailyDrift(pack, next))
  next.eventLogs = [...next.eventLogs, ...logs]

  const scheduleResult = processNpcSchedules(pack, next)
  next = scheduleResult.state
  logs.push(...scheduleResult.logs)

  const npcResult = processNpcBehaviors(pack, next)
  next = npcResult.state
  logs.push(...npcResult.logs)

  const eventResult = processEvents(pack, next)
  next = eventResult.state
  logs.push(...eventResult.logs)

  if (next.time.day > pack.world.maxDays && !next.endingResult) {
    const ending = evaluateEnding(pack, next)
    if (ending) {
      next.endingResult = ending
      const endingLog = makeLog(next, 'ending', `结局：${ending.ending.name}`, ending.ending.summary)
      next.eventLogs = [...next.eventLogs, endingLog]
      logs.push(endingLog)
    }
  }

  return { state: next, logs }
}

export function maybeAutoAdvanceTime(pack: ContentPack, state: GameRuntimeState): { state: GameRuntimeState; logs: GameLog[] } {
  if (state.time.actionPoints > 0 || state.endingResult) return { state, logs: [] }
  return advanceTimeSegment(pack, state)
}

export function forceEndingCheck(pack: ContentPack, state: GameRuntimeState): GameRuntimeState {
  const next = cloneState(state)
  const result = evaluateEnding(pack, next)
  if (result) next.endingResult = result
  return next
}
