import type { MapTile, TerrainType } from '@tss/schema'
import { compareTilesByIsoDepth, getIsoMapBounds, tileToIsoWorld } from './isometricGeometry'

export const gameMapMetrics = {
  tileWidth: 180,
  tileHeight: 90,
  terrainDrawWidth: 180 * 1.18,
  terrainDrawHeight: 148,
  terrainAnchorY: 0.72,
  buildingDrawWidth: 180 * 0.82,
  buildingDrawHeight: 118,
  buildingAnchorY: 0.84,
  padding: 140,
  minZoom: 0.45,
  maxZoom: 2.2,
} as const

export type GameMapTileLayout = {
  id: string
  isoX: number
  isoY: number
  transform: string
  tileTestId: string
  baseTestId: string
  terrainTestId: string
  terrainMaskDefsTestId: string
  terrainClipPathId: string
  terrainClipPathTestId: string
  terrainMaskId: string
  terrainMaskTestId: string
  terrainMaskImageTestId: string
  terrainEdgeFilterId: string
  terrainEdgeFilterTestId: string
  terrainEdgeDilateTestId: string
  terrainEdgeErodeTestId: string
  terrainEdgeBandTestId: string
  terrainEdgeFloodTestId: string
  terrainEdgeStrokeTestId: string
  terrainEdgeGlowTestId: string
  terrainEdgeMergeTestId: string
  terrainEdgeGlowMergeNodeTestId: string
  terrainEdgeStrokeMergeNodeTestId: string
  buildingTestId: string
  overlayTestId: string
  overlayEdgeTestId: string
  overlayFillMaskGroupTestId: string
  overlayFillTestId: string
  dangerTestId: string
  hitAreaTestId: string
  playerMarkerTestId?: string
  isPlayer: boolean
  tile: MapTile
}

export function createGameMapTileLayouts(tiles: MapTile[], playerTileId: string): GameMapTileLayout[] {
  return tiles.slice().sort(compareTilesByIsoDepth).map((tile) => {
    const position = tileToIsoWorld(tile, gameMapMetrics)
    const isoX = round(position.x)
    const isoY = round(position.y)
    const isPlayer = tile.id === playerTileId

    return {
      id: tile.id,
      isoX,
      isoY,
      transform: `translate(${isoX} ${isoY})`,
      tileTestId: `game-map-tile-${tile.id}`,
      baseTestId: `game-map-base-${tile.id}`,
      terrainTestId: `game-map-terrain-${tile.id}`,
      terrainMaskDefsTestId: `game-map-terrain-mask-defs-${tile.id}`,
      terrainClipPathId: `game-map-terrain-clip-${tile.id}`,
      terrainClipPathTestId: `game-map-terrain-clip-${tile.id}`,
      terrainMaskId: `game-map-terrain-alpha-mask-${tile.id}`,
      terrainMaskTestId: `game-map-terrain-mask-${tile.id}`,
      terrainMaskImageTestId: `game-map-terrain-mask-image-${tile.id}`,
      terrainEdgeFilterId: `game-map-terrain-edge-filter-${tile.id}`,
      terrainEdgeFilterTestId: `game-map-terrain-edge-filter-${tile.id}`,
      terrainEdgeDilateTestId: `game-map-terrain-edge-dilate-${tile.id}`,
      terrainEdgeErodeTestId: `game-map-terrain-edge-erode-${tile.id}`,
      terrainEdgeBandTestId: `game-map-terrain-edge-band-${tile.id}`,
      terrainEdgeFloodTestId: `game-map-terrain-edge-flood-${tile.id}`,
      terrainEdgeStrokeTestId: `game-map-terrain-edge-stroke-${tile.id}`,
      terrainEdgeGlowTestId: `game-map-terrain-edge-glow-${tile.id}`,
      terrainEdgeMergeTestId: `game-map-terrain-edge-merge-${tile.id}`,
      terrainEdgeGlowMergeNodeTestId: `game-map-terrain-edge-glow-merge-node-${tile.id}`,
      terrainEdgeStrokeMergeNodeTestId: `game-map-terrain-edge-stroke-merge-node-${tile.id}`,
      buildingTestId: `game-map-building-${tile.id}`,
      overlayTestId: `game-map-highlight-${tile.id}`,
      overlayEdgeTestId: `game-map-highlight-edge-${tile.id}`,
      overlayFillMaskGroupTestId: `game-map-highlight-fill-mask-${tile.id}`,
      overlayFillTestId: `game-map-highlight-fill-${tile.id}`,
      dangerTestId: `game-map-danger-${tile.id}`,
      hitAreaTestId: `game-map-hit-area-${tile.id}`,
      playerMarkerTestId: isPlayer ? `game-map-player-marker-${tile.id}` : undefined,
      isPlayer,
      tile,
    }
  })
}

export function getGameMapBounds(tiles: MapTile[]) {
  return roundBounds(getIsoMapBounds(tiles, {
    tileWidth: gameMapMetrics.tileWidth,
    tileHeight: gameMapMetrics.tileHeight,
    padding: gameMapMetrics.padding,
    extraLeft: Math.max(0, gameMapMetrics.terrainDrawWidth / 2 - gameMapMetrics.tileWidth / 2),
    extraRight: Math.max(0, gameMapMetrics.terrainDrawWidth / 2 - gameMapMetrics.tileWidth / 2),
    extraTop: Math.max(
      0,
      Math.max(
        gameMapMetrics.terrainDrawHeight * gameMapMetrics.terrainAnchorY,
        gameMapMetrics.buildingDrawHeight * gameMapMetrics.buildingAnchorY,
      ) - gameMapMetrics.tileHeight / 2,
    ),
    extraBottom: Math.max(
      0,
      Math.max(
        gameMapMetrics.terrainDrawHeight * (1 - gameMapMetrics.terrainAnchorY),
        gameMapMetrics.buildingDrawHeight * (1 - gameMapMetrics.buildingAnchorY),
      ) - gameMapMetrics.tileHeight / 2,
    ),
  }))
}

export function clampGameMapZoom(zoom: number): number {
  return Math.min(gameMapMetrics.maxZoom, Math.max(gameMapMetrics.minZoom, zoom))
}

export function tileFillColor(terrain: TerrainType): number {
  const colors: Record<TerrainType, number> = {
    forest: 0x6c8f61,
    mountain: 0x8c8a82,
    river: 0x6798a8,
    road: 0xb49a72,
    ruin: 0x8f7e95,
    town: 0xb99d78,
  }
  return colors[terrain]
}

export function svgColor(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`
}

export function baseDiamondPoints(): string {
  const halfWidth = gameMapMetrics.tileWidth / 2
  const halfHeight = gameMapMetrics.tileHeight / 2
  return pointsToSvg([[0, -halfHeight], [halfWidth, 0], [0, halfHeight], [-halfWidth, 0]])
}

export function terrainDiamondPoints(): string {
  const topY = -gameMapMetrics.terrainDrawHeight * gameMapMetrics.terrainAnchorY
  const bottomY = gameMapMetrics.terrainDrawHeight * (1 - gameMapMetrics.terrainAnchorY)
  const middleY = (topY + bottomY) / 2
  const halfWidth = gameMapMetrics.terrainDrawWidth / 2
  return pointsToSvg([[0, topY], [halfWidth, middleY], [0, bottomY], [-halfWidth, middleY]])
}

function pointsToSvg(points: Array<[number, number]>): string {
  return points.map(([x, y]) => `${round(x)},${round(y)}`).join(' ')
}

function roundBounds(bounds: ReturnType<typeof getIsoMapBounds>) {
  return {
    minX: round(bounds.minX),
    minY: round(bounds.minY),
    maxX: round(bounds.maxX),
    maxY: round(bounds.maxY),
    width: round(bounds.width),
    height: round(bounds.height),
    centerX: round(bounds.centerX),
    centerY: round(bounds.centerY),
  }
}

function round(value: number): number {
  return Number(value.toFixed(2))
}
