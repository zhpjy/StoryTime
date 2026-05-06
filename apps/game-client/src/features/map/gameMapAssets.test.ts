import { describe, expect, it } from 'vitest'
import type { Building } from '@tss/schema'
import { resolveGameBuildingAssetKey } from './gameMapAssets'

const building = (type: string): Building => ({
  id: `building_${type}`,
  locationId: 'loc_test',
  name: type,
  type,
  state: {},
  descriptions: { default: type },
  interactionIds: [],
})

describe('gameMapAssets', () => {
  it.each([
    ['tavern_hall', 'tavern'],
    ['rice_shop', 'rice-shop'],
    ['shop_counter', 'herb-shop'],
    ['ruined_temple', 'ruined-temple'],
    ['memorial_hall', 'ancestral-hall'],
    ['guard_post', 'watchtower'],
    ['pavilion', 'pavilion'],
    ['common_house', 'residence'],
  ] as const)('maps %s buildings to the %s texture key', (type, expectedKey) => {
    expect(resolveGameBuildingAssetKey(building(type))).toBe(expectedKey)
  })

  it('falls back to the residence texture for unknown building types', () => {
    expect(resolveGameBuildingAssetKey(building('unknown_structure'))).toBe('residence')
  })
})
