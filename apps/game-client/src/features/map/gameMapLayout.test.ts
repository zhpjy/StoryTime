import { describe, expect, it } from 'vitest'
import type { MapTile } from '@tss/schema'
import { createGameMapTileLayouts, getGameMapBounds, svgColor } from './gameMapLayout'

const tile = (id: string, x: number, y: number, overrides: Partial<MapTile> = {}): MapTile => ({
  id,
  name: id,
  x,
  y,
  terrain: 'road',
  buildingIds: [],
  npcIds: [],
  eventIds: [],
  discovered: true,
  visible: true,
  blocked: false,
  dangerLevel: 0,
  ...overrides,
})

describe('gameMapLayout', () => {
  it('creates depth-sorted SVG tile layout models with stable test ids', () => {
    const layouts = createGameMapTileLayouts([
      tile('far', 2, 2),
      tile('near-left', 1, 1),
      tile('near-right', 2, 0),
    ], 'far')

    expect(layouts.map((layout) => layout.id)).toEqual(['near-left', 'near-right', 'far'])
    expect(layouts[1]).toMatchObject({
      id: 'near-right',
      isoX: 180,
      isoY: 90,
      transform: 'translate(180 90)',
      tileTestId: 'game-map-tile-near-right',
      terrainTestId: 'game-map-terrain-near-right',
      hitAreaTestId: 'game-map-hit-area-near-right',
      isPlayer: false,
    })
    expect(layouts[2]).toMatchObject({
      id: 'far',
      transform: 'translate(0 180)',
      playerMarkerTestId: 'game-map-player-marker-far',
      isPlayer: true,
    })
  })

  it('computes bounds that include terrain and building artwork overflow', () => {
    expect(getGameMapBounds([tile('center', 1, 1)])).toEqual({
      minX: -246.2,
      minY: -156.56,
      maxX: 246.2,
      maxY: 275,
      width: 492.4,
      height: 431.56,
      centerX: 0,
      centerY: 59.22,
    })
  })

  it('formats numeric colors as SVG hex colors', () => {
    expect(svgColor(0xf4d589)).toBe('#f4d589')
    expect(svgColor(0x8f7e)).toBe('#008f7e')
  })
})
