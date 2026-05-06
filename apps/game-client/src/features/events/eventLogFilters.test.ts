import { describe, expect, it } from 'vitest'
import type { GameLog } from '@tss/schema'
import { getPlayerRelatedLogs } from './eventLogFilters'

function log(id: string, type: GameLog['type']): GameLog {
  return {
    id,
    day: 1,
    segment: 'morning',
    type,
    message: id,
  }
}

describe('eventLogFilters', () => {
  it('keeps only logs directly related to the player', () => {
    const logs = [
      log('system-time', 'system'),
      log('player-action', 'player'),
      log('npc-schedule', 'npc'),
      log('event-trigger', 'event'),
      log('conversation-choice', 'conversation'),
    ]

    expect(getPlayerRelatedLogs(logs).map((entry) => entry.id)).toEqual(['player-action'])
  })
})
