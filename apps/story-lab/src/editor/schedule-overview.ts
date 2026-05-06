import type { Condition, ConditionGroup, ContentPack, Effect, TimeSegment } from '@tss/schema'
import { TIME_SEGMENTS } from '@tss/schema'

export type ScheduleEventSourceKind = 'schedule' | 'behavior'

export type ScheduleEventOverviewEntry = {
  id: string
  sourceKind: ScheduleEventSourceKind
  sourceId: string
  sourceName: string
  day: number
  segment: TimeSegment
  npcId: string
  npcName: string
  locationId?: string
  locationName?: string
  eventIds: string[]
  eventNames: string[]
  conditionCount: number
}

export type ScheduleEventOverviewSegment = {
  segment: TimeSegment
  entries: ScheduleEventOverviewEntry[]
  entryCount: number
  eventCount: number
}

export type ScheduleEventOverviewDay = {
  day: number
  segments: ScheduleEventOverviewSegment[]
  entryCount: number
  eventCount: number
  npcCount: number
}

export type ScheduleEventOverview = {
  days: ScheduleEventOverviewDay[]
  totalEntries: number
  totalEvents: number
}

function triggeredEventIds(effects: Effect[] | undefined): string[] {
  return [...new Set((effects ?? []).filter((effect) => effect.type === 'trigger_event').map((effect) => effect.eventId))]
}

function isMoveNpcEffect(effect: Effect): effect is Extract<Effect, { type: 'move_npc' }> {
  return effect.type === 'move_npc'
}

function conditionCount(condition: ConditionGroup | undefined): number {
  if (!condition) return 0
  if ('all' in condition) return condition.all.reduce((total, item) => total + conditionCount(item), 0)
  if ('any' in condition) return condition.any.reduce((total, item) => total + conditionCount(item), 0)
  if ('not' in condition) return conditionCount(condition.not)
  if ('fact' in condition) return 1
  return 0
}

function isFactCondition(condition: ConditionGroup): condition is Extract<Condition, { fact: string }> {
  return 'fact' in condition
}

function numberConditionCanMatch(condition: Extract<Condition, { fact: string }>, value: number): boolean {
  if ('equals' in condition) return condition.equals === value
  if ('not_equals' in condition) return condition.not_equals !== value
  if ('greater_than' in condition) return value > condition.greater_than
  if ('greater_than_or_equal' in condition) return value >= condition.greater_than_or_equal
  if ('less_than' in condition) return value < condition.less_than
  if ('less_than_or_equal' in condition) return value <= condition.less_than_or_equal
  if ('in' in condition) return condition.in.includes(value)
  if ('not_in' in condition) return !condition.not_in.includes(value)
  return true
}

function segmentConditionCanMatch(condition: Extract<Condition, { fact: string }>, value: TimeSegment): boolean {
  if ('equals' in condition) return condition.equals === value
  if ('not_equals' in condition) return condition.not_equals !== value
  if ('in' in condition) return condition.in.includes(value)
  if ('not_in' in condition) return !condition.not_in.includes(value)
  return true
}

function conditionCanMatchTime(condition: ConditionGroup | undefined, day: number, segment: TimeSegment): boolean {
  if (!condition) return true
  if ('all' in condition) return condition.all.every((item) => conditionCanMatchTime(item, day, segment))
  if ('any' in condition) return condition.any.some((item) => conditionCanMatchTime(item, day, segment))
  if ('not' in condition) return true
  if (!isFactCondition(condition)) return true
  if (condition.fact === 'time.day') return numberConditionCanMatch(condition, day)
  if (condition.fact === 'time.segment') return segmentConditionCanMatch(condition, segment)
  return true
}

function eventNames(pack: ContentPack, eventIds: string[]): string[] {
  return eventIds.map((eventId) => pack.events.find((event) => event.id === eventId)?.name ?? eventId)
}

export function buildScheduleEventOverview(pack: ContentPack): ScheduleEventOverview {
  const days = Array.from({ length: pack.world.maxDays }, (_, index) => index + 1)
  const overviewDays = days.map((day): ScheduleEventOverviewDay => {
    const segments = TIME_SEGMENTS.map((segment): ScheduleEventOverviewSegment => {
      const entries = pack.npcs.flatMap((npc) => {
        const scheduleEntries = npc.schedule
          .filter((entry) => entry.segment === segment)
          .filter((entry) => (entry.dayRange?.from ?? 1) <= day && (entry.dayRange?.to ?? pack.world.maxDays) >= day)
          .flatMap((entry): ScheduleEventOverviewEntry[] => {
            const eventIds = triggeredEventIds(entry.effects)
            if (eventIds.length === 0) return []
            const location = pack.locations.find((item) => item.id === entry.locationId)
            return [{
              id: `schedule:${npc.id}:${entry.id}:${day}:${segment}`,
              sourceKind: 'schedule',
              sourceId: entry.id,
              sourceName: entry.activity,
              day,
              segment,
              npcId: npc.id,
              npcName: npc.name,
              locationId: entry.locationId,
              locationName: location?.name ?? entry.locationId,
              eventIds,
              eventNames: eventNames(pack, eventIds),
              conditionCount: conditionCount(entry.conditions),
            }]
          })

        const behaviorEntries = npc.behaviorRules
          .filter((rule) => conditionCanMatchTime(rule.conditions, day, segment))
          .flatMap((rule): ScheduleEventOverviewEntry[] => {
            const eventIds = triggeredEventIds(rule.effects)
            if (eventIds.length === 0) return []
            const moveEffect = rule.effects.filter(isMoveNpcEffect).find((effect) => effect.npcId === npc.id)
            const locationId = moveEffect?.locationId ?? npc.location
            const location = pack.locations.find((item) => item.id === locationId)
            return [{
              id: `behavior:${npc.id}:${rule.id}:${day}:${segment}`,
              sourceKind: 'behavior',
              sourceId: rule.id,
              sourceName: rule.name,
              day,
              segment,
              npcId: npc.id,
              npcName: npc.name,
              locationId,
              locationName: location?.name ?? locationId,
              eventIds,
              eventNames: eventNames(pack, eventIds),
              conditionCount: conditionCount(rule.conditions),
            }]
          })

        return [...scheduleEntries, ...behaviorEntries]
      })
      const eventCount = entries.reduce((total, entry) => total + entry.eventIds.length, 0)
      return { segment, entries, entryCount: entries.length, eventCount }
    })
    const allEntries = segments.flatMap((segmentItem) => segmentItem.entries)
    return {
      day,
      segments,
      entryCount: allEntries.length,
      eventCount: allEntries.reduce((total, entry) => total + entry.eventIds.length, 0),
      npcCount: new Set(allEntries.map((entry) => entry.npcId)).size,
    }
  })

  return {
    days: overviewDays,
    totalEntries: overviewDays.reduce((total, day) => total + day.entryCount, 0),
    totalEvents: overviewDays.reduce((total, day) => total + day.eventCount, 0),
  }
}
