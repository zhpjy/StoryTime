export type IsoTilePoint = {
  x: number
  y: number
}

export type IsoTileSize = {
  tileWidth: number
  tileHeight: number
}

export type IsoBoundsOptions = IsoTileSize & {
  padding?: number
  extraLeft?: number
  extraRight?: number
  extraTop?: number
  extraBottom?: number
}

export function tileToIsoWorld(tile: IsoTilePoint, size: IsoTileSize): IsoTilePoint {
  return {
    x: (tile.x - tile.y) * (size.tileWidth / 2),
    y: (tile.x + tile.y) * (size.tileHeight / 2),
  }
}

export function compareTilesByIsoDepth<T extends IsoTilePoint>(a: T, b: T): number {
  return (a.x + a.y) - (b.x + b.y) || a.x - b.x
}

export function getIsoMapBounds(tiles: IsoTilePoint[], options: IsoBoundsOptions) {
  const padding = options.padding ?? 0
  const extraLeft = options.extraLeft ?? 0
  const extraRight = options.extraRight ?? 0
  const extraTop = options.extraTop ?? 0
  const extraBottom = options.extraBottom ?? 0
  const projected = tiles.map((tile) => tileToIsoWorld(tile, options))
  const minX = Math.min(...projected.map((tile) => tile.x)) - options.tileWidth / 2 - extraLeft - padding
  const minY = Math.min(...projected.map((tile) => tile.y)) - options.tileHeight / 2 - extraTop - padding
  const maxX = Math.max(...projected.map((tile) => tile.x)) + options.tileWidth / 2 + extraRight + padding
  const maxY = Math.max(...projected.map((tile) => tile.y)) + options.tileHeight / 2 + extraBottom + padding
  const width = maxX - minX
  const height = maxY - minY

  return {
    minX,
    minY,
    maxX,
    maxY,
    width,
    height,
    centerX: minX + width / 2,
    centerY: minY + height / 2,
  }
}
