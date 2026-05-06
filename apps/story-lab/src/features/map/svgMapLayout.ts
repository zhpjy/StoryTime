import type { MapTile, TerrainType } from '@tss/schema'
import { compareTilesByIsoDepth, getIsoMapBounds, tileToIsoWorld } from './isometricGeometry'

export const svgMapMetrics = {
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

export type SvgTileLayout = {
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

export function createSvgTileLayouts(tiles: MapTile[], playerTileId: string): SvgTileLayout[] {
  return tiles.slice().sort(compareTilesByIsoDepth).map((tile) => {
    const position = tileToIsoWorld(tile, svgMapMetrics)
    const isoX = round(position.x)
    const isoY = round(position.y)
    const isPlayer = tile.id === playerTileId

    return {
      id: tile.id,
      isoX,
      isoY,
      transform: `translate(${isoX} ${isoY})`,
      tileTestId: `map-tile-${tile.id}`,
      baseTestId: `map-base-${tile.id}`,
      terrainTestId: `map-terrain-${tile.id}`,
      terrainMaskDefsTestId: `map-terrain-mask-defs-${tile.id}`,
      terrainClipPathId: `map-terrain-clip-${tile.id}`,
      terrainClipPathTestId: `map-terrain-clip-${tile.id}`,
      terrainMaskId: `map-terrain-alpha-mask-${tile.id}`,
      terrainMaskTestId: `map-terrain-mask-${tile.id}`,
      terrainMaskImageTestId: `map-terrain-mask-image-${tile.id}`,
      terrainEdgeFilterId: `map-terrain-edge-filter-${tile.id}`,
      terrainEdgeFilterTestId: `map-terrain-edge-filter-${tile.id}`,
      terrainEdgeDilateTestId: `map-terrain-edge-dilate-${tile.id}`,
      terrainEdgeErodeTestId: `map-terrain-edge-erode-${tile.id}`,
      terrainEdgeBandTestId: `map-terrain-edge-band-${tile.id}`,
      terrainEdgeFloodTestId: `map-terrain-edge-flood-${tile.id}`,
      terrainEdgeStrokeTestId: `map-terrain-edge-stroke-${tile.id}`,
      terrainEdgeGlowTestId: `map-terrain-edge-glow-${tile.id}`,
      terrainEdgeMergeTestId: `map-terrain-edge-merge-${tile.id}`,
      terrainEdgeGlowMergeNodeTestId: `map-terrain-edge-glow-merge-node-${tile.id}`,
      terrainEdgeStrokeMergeNodeTestId: `map-terrain-edge-stroke-merge-node-${tile.id}`,
      buildingTestId: `map-building-${tile.id}`,
      overlayTestId: `map-highlight-${tile.id}`,
      overlayEdgeTestId: `map-highlight-edge-${tile.id}`,
      overlayFillMaskGroupTestId: `map-highlight-fill-mask-${tile.id}`,
      overlayFillTestId: `map-highlight-fill-${tile.id}`,
      dangerTestId: `map-danger-${tile.id}`,
      hitAreaTestId: `map-hit-area-${tile.id}`,
      playerMarkerTestId: isPlayer ? `map-player-marker-${tile.id}` : undefined,
      isPlayer,
      tile,
    }
  })
}

export function getSvgMapBounds(tiles: MapTile[]) {
  return roundBounds(getIsoMapBounds(tiles, {
    tileWidth: svgMapMetrics.tileWidth,
    tileHeight: svgMapMetrics.tileHeight,
    padding: svgMapMetrics.padding,
    extraLeft: Math.max(0, svgMapMetrics.terrainDrawWidth / 2 - svgMapMetrics.tileWidth / 2),
    extraRight: Math.max(0, svgMapMetrics.terrainDrawWidth / 2 - svgMapMetrics.tileWidth / 2),
    extraTop: Math.max(
      0,
      Math.max(
        svgMapMetrics.terrainDrawHeight * svgMapMetrics.terrainAnchorY,
        svgMapMetrics.buildingDrawHeight * svgMapMetrics.buildingAnchorY,
      ) - svgMapMetrics.tileHeight / 2,
    ),
    extraBottom: Math.max(
      0,
      Math.max(
        svgMapMetrics.terrainDrawHeight * (1 - svgMapMetrics.terrainAnchorY),
        svgMapMetrics.buildingDrawHeight * (1 - svgMapMetrics.buildingAnchorY),
      ) - svgMapMetrics.tileHeight / 2,
    ),
  }))
}

export function clampSvgZoom(zoom: number): number {
  return Math.min(svgMapMetrics.maxZoom, Math.max(svgMapMetrics.minZoom, zoom))
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
  const halfWidth = svgMapMetrics.tileWidth / 2
  const halfHeight = svgMapMetrics.tileHeight / 2
  return pointsToSvg([
    [0, -halfHeight],
    [halfWidth, 0],
    [0, halfHeight],
    [-halfWidth, 0],
  ])
}

export function terrainDiamondPoints(): string {
  const topY = -svgMapMetrics.terrainDrawHeight * svgMapMetrics.terrainAnchorY
  const bottomY = svgMapMetrics.terrainDrawHeight * (1 - svgMapMetrics.terrainAnchorY)
  const middleY = (topY + bottomY) / 2
  const halfWidth = svgMapMetrics.terrainDrawWidth / 2
  return pointsToSvg([
    [0, topY],
    [halfWidth, middleY],
    [0, bottomY],
    [-halfWidth, middleY],
  ])
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
