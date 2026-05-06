import type { MapTile } from '@tss/schema'

export function resolvePlayerTileId(
  tiles: MapTile[],
  playerLocationId: string,
  selectedTileId?: string,
): string {
  const locationTile = tiles.find((tile) => tile.locationId === playerLocationId)
  if (locationTile) return locationTile.id

  const selectedTile = selectedTileId ? tiles.find((tile) => tile.id === selectedTileId) : undefined
  if (selectedTile) return selectedTile.id

  return tiles.find((tile) => tile.visible)?.id ?? tiles[0]?.id ?? ''
}

export function canMovePlayerToTile(tile: MapTile | undefined, playerTileId: string): boolean {
  return Boolean(tile && tile.visible && tile.discovered && !tile.blocked && tile.id !== playerTileId)
}
