import { describe, expect, it } from 'vitest'
import type { MapTile } from '@tss/schema'
import { canMovePlayerToTile, resolveInitialPlayerTileId } from './playerTile'

const tile = (id: string, overrides: Partial<MapTile> = {}): MapTile => ({
  id,
  name: id,
  x: 1,
  y: 1,
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

describe('playerTile', () => {
  it('prefers the tile matching the runtime initial player location', () => {
    expect(resolveInitialPlayerTileId([tile('a'), tile('b', { locationId: 'loc_b' })], 'loc_b', 'a')).toBe('b')
  })

  it('falls back to selected tile, visible tile, then first tile', () => {
    expect(resolveInitialPlayerTileId([tile('a', { visible: false }), tile('b')], 'missing', 'a')).toBe('a')
    expect(resolveInitialPlayerTileId([tile('a', { visible: false }), tile('b')], 'missing')).toBe('b')
    expect(resolveInitialPlayerTileId([tile('a', { visible: false }), tile('b', { visible: false })], 'missing')).toBe('a')
  })

  it('blocks movement to hidden, blocked, or current tiles', () => {
    expect(canMovePlayerToTile(tile('a'), 'b')).toBe(true)
    expect(canMovePlayerToTile(tile('a', { blocked: true }), 'b')).toBe(false)
    expect(canMovePlayerToTile(tile('a', { visible: false }), 'b')).toBe(false)
    expect(canMovePlayerToTile(tile('a'), 'a')).toBe(false)
  })
})
