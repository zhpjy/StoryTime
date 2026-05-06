import type { Building, TerrainType } from '@tss/schema'

import mapBackgroundUrl from '../../../../shared-assets/map/background.webp'
import protagonistUrl from '../../../../shared-assets/map/characters/protagonist.webp'
import ancestralHallUrl from '../../../../shared-assets/map/buildings/ancestral-hall.webp'
import herbShopUrl from '../../../../shared-assets/map/buildings/herb-shop.webp'
import pavilionUrl from '../../../../shared-assets/map/buildings/pavilion.webp'
import residenceUrl from '../../../../shared-assets/map/buildings/residence.webp'
import riceShopUrl from '../../../../shared-assets/map/buildings/rice-shop.webp'
import ruinedTempleUrl from '../../../../shared-assets/map/buildings/ruined-temple.webp'
import tavernUrl from '../../../../shared-assets/map/buildings/tavern.webp'
import watchtowerUrl from '../../../../shared-assets/map/buildings/watchtower.webp'
import forestUrl from '../../../../shared-assets/map/terrain/forest.webp'
import mountainUrl from '../../../../shared-assets/map/terrain/mountain.webp'
import roadUrl from '../../../../shared-assets/map/terrain/road.webp'
import detailCardBackgroundUrl from '../../../../shared-assets/map/terrain/terrain-card.webp'
import townUrl from '../../../../shared-assets/map/terrain/town.webp'
import waterUrl from '../../../../shared-assets/map/terrain/water.webp'

export type GameBuildingAssetKey =
  | 'ancestral-hall'
  | 'herb-shop'
  | 'pavilion'
  | 'residence'
  | 'rice-shop'
  | 'ruined-temple'
  | 'tavern'
  | 'watchtower'

export const gameMapTerrainAssetUrls: Partial<Record<TerrainType, string>> = {
  forest: forestUrl,
  mountain: mountainUrl,
  river: waterUrl,
  road: roadUrl,
  ruin: mountainUrl,
  town: townUrl,
}

export const gameMapBuildingAssetUrls: Record<GameBuildingAssetKey, string> = {
  'ancestral-hall': ancestralHallUrl,
  'herb-shop': herbShopUrl,
  pavilion: pavilionUrl,
  residence: residenceUrl,
  'rice-shop': riceShopUrl,
  'ruined-temple': ruinedTempleUrl,
  tavern: tavernUrl,
  watchtower: watchtowerUrl,
}

export const gameMapBackgroundAssetUrl = mapBackgroundUrl
export const gameMapDetailCardBackgroundAssetUrl = detailCardBackgroundUrl
export const gameMapProtagonistAssetUrl = protagonistUrl

const buildingTypeMatchers: Array<{ key: GameBuildingAssetKey; patterns: string[] }> = [
  { key: 'tavern', patterns: ['tavern', 'inn'] },
  { key: 'rice-shop', patterns: ['rice', 'grain', 'market', 'vendor'] },
  { key: 'herb-shop', patterns: ['herb', 'medicine', 'treatment', 'clinic', 'shop_counter'] },
  { key: 'ruined-temple', patterns: ['ruin', 'temple', 'cellar', 'hidden'] },
  { key: 'ancestral-hall', patterns: ['ancestral', 'memorial', 'record', 'ritual', 'hall'] },
  { key: 'watchtower', patterns: ['guard', 'watch', 'tower', 'post', 'notice'] },
  { key: 'pavilion', patterns: ['pavilion', 'slope', 'path'] },
  { key: 'residence', patterns: ['residence', 'house', 'home', 'shed', 'common'] },
]

export function resolveGameBuildingAssetKey(building: Pick<Building, 'type'>): GameBuildingAssetKey {
  const normalizedType = building.type.toLowerCase().replaceAll('-', '_')
  return buildingTypeMatchers.find((matcher) => matcher.patterns.some((pattern) => normalizedType.includes(pattern)))?.key ?? 'residence'
}
