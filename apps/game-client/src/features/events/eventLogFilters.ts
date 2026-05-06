import type { GameLog } from '@tss/schema'

export function getPlayerRelatedLogs(logs: GameLog[]): GameLog[] {
  return logs.filter((log) => log.type === 'player')
}
