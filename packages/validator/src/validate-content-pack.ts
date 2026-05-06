import type { ContentPack, ValidationReport } from '@tss/schema'
import { analyzeContentGaps } from './content-gap-analyzer'
import { validateEffects } from './effect-validator'
import { validateFactPaths } from './fact-path-validator'
import { validateStoryLogic } from './logic-validator'
import { validateReferences } from './reference-validator'
import { validateSchema } from './schema-validator'

export function validateContentPack(pack: ContentPack): ValidationReport {
  const errors = [
    ...validateSchema(pack),
    ...validateReferences(pack),
    ...validateFactPaths(pack),
    ...validateEffects(pack),
    ...validateStoryLogic(pack),
  ]
  const gaps = analyzeContentGaps(pack)
  return {
    packId: pack.packId,
    checkedAt: new Date().toISOString(),
    errors,
    gaps,
    summary: {
      locations: pack.locations.length,
      buildings: pack.buildings.length,
      npcs: pack.npcs.length,
      interactions: Array.isArray(pack.interactions) ? pack.interactions.length : 0,
      quests: Array.isArray(pack.quests) ? pack.quests.length : 0,
      rewards: Array.isArray(pack.rewards) ? pack.rewards.length : 0,
      events: pack.events.length,
      conversations: pack.conversations.length,
      endings: pack.endings.length,
    },
  }
}
