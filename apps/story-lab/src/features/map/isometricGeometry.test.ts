import { describe, expect, it } from 'vitest'
import { compareTilesByIsoDepth, getIsoMapBounds, tileToIsoWorld } from './isometricGeometry'

describe('isometricGeometry', () => {
  it('projects tile coordinates into 45-degree isometric world space', () => {
    expect(tileToIsoWorld({ x: 2, y: 1 }, { tileWidth: 180, tileHeight: 90 })).toEqual({ x: 90, y: 135 })
  })

  it('sorts tiles by isometric depth', () => {
    const sorted = [
      { id: 'far', x: 2, y: 2 },
      { id: 'near-left', x: 1, y: 1 },
      { id: 'near-right', x: 2, y: 0 },
    ].sort(compareTilesByIsoDepth)

    expect(sorted.map((tile) => tile.id)).toEqual(['near-left', 'near-right', 'far'])
  })

  it('computes padded map bounds from projected tiles', () => {
    expect(getIsoMapBounds([{ x: 1, y: 1 }, { x: 3, y: 2 }], { tileWidth: 180, tileHeight: 90, padding: 24 })).toEqual({
      minX: -114,
      minY: 21,
      maxX: 204,
      maxY: 294,
      width: 318,
      height: 273,
      centerX: 45,
      centerY: 157.5,
    })
  })

  it('expands bounds for artwork that extends beyond the base diamond', () => {
    expect(getIsoMapBounds([{ x: 1, y: 1 }], {
      tileWidth: 180,
      tileHeight: 90,
      padding: 0,
      extraLeft: 20,
      extraRight: 30,
      extraTop: 60,
      extraBottom: 10,
    })).toEqual({
      minX: -110,
      minY: -15,
      maxX: 120,
      maxY: 145,
      width: 230,
      height: 160,
      centerX: 5,
      centerY: 65,
    })
  })
})
