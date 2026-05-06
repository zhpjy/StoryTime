import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode, WheelEvent } from 'react'
import type { ContentPack, MapTile } from '@tss/schema'
import { gameMapBackgroundAssetUrl, gameMapBuildingAssetUrls, gameMapProtagonistAssetUrl, gameMapTerrainAssetUrls, resolveGameBuildingAssetKey } from './gameMapAssets'
import { getGameTerrainHighlightFilterConfig, getGameTileHighlightOverlayStyle } from './gameMapHighlight'
import {
  baseDiamondPoints,
  clampGameMapZoom,
  createGameMapTileLayouts,
  gameMapMetrics,
  getGameMapBounds,
  svgColor,
  terrainDiamondPoints,
  tileFillColor,
} from './gameMapLayout'

type Camera = {
  zoom: number
  panX: number
  panY: number
}

type DragState = {
  pointerId: number
  tileId?: string
  startX: number
  startY: number
  panX: number
  panY: number
  moved: boolean
}

type ViewportSize = {
  width: number
  height: number
}

const initialViewport: ViewportSize = { width: 900, height: 520 }

export function GameMapSvg({
  map,
  buildings,
  selectedTileId,
  playerTileId,
  onTileActivate,
  detailDrawer,
}: {
  map: ContentPack['maps'][number]
  buildings: ContentPack['buildings']
  selectedTileId?: string
  playerTileId: string
  onTileActivate: (tileId: string) => void
  detailDrawer?: ReactNode
}) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const [viewport, setViewport] = useState<ViewportSize>(initialViewport)
  const [camera, setCamera] = useState<Camera>({ zoom: 1, panX: 0, panY: 0 })
  const [hoveredTileId, setHoveredTileId] = useState<string | null>(null)

  const bounds = useMemo(() => getGameMapBounds(map.tiles), [map.tiles])
  const tileLayouts = useMemo(() => createGameMapTileLayouts(map.tiles, playerTileId), [map.tiles, playerTileId])
  const buildingById = useMemo(() => new Map(buildings.map((building) => [building.id, building])), [buildings])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    function resize() {
      const width = host?.clientWidth || initialViewport.width
      const height = host?.clientHeight || initialViewport.height
      setViewport({ width, height })
      setCamera(fitCamera(width, height))
    }

    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host)
    return () => resizeObserver.disconnect()
  }, [bounds.centerX, bounds.centerY, bounds.height, bounds.width, map.id])

  function fitCamera(width: number = viewport.width, height: number = viewport.height): Camera {
    if (map.tiles.length === 0) return { zoom: 1, panX: 0, panY: 0 }
    const zoom = clampGameMapZoom(Math.min(width / bounds.width, height / bounds.height))
    return {
      zoom,
      panX: width / 2 - bounds.centerX * zoom,
      panY: height / 2 - bounds.centerY * zoom + 12,
    }
  }

  function zoomAt(clientX: number, clientY: number, factor: number) {
    const host = hostRef.current
    if (!host) return
    const rect = host.getBoundingClientRect()
    const localX = clientX - rect.left
    const localY = clientY - rect.top

    setCamera((currentCamera) => {
      const nextZoom = clampGameMapZoom(currentCamera.zoom * factor)
      const worldX = (localX - currentCamera.panX) / currentCamera.zoom
      const worldY = (localY - currentCamera.panY) / currentCamera.zoom

      return {
        zoom: nextZoom,
        panX: localX - worldX * nextZoom,
        panY: localY - worldY * nextZoom,
      }
    })
  }

  function activateTileFromKeyboard(event: KeyboardEvent<SVGGElement>, tileId: string) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onTileActivate(tileId)
  }

  function getPointerTileId(target: EventTarget | null): string | undefined {
    if (!(target instanceof Element)) return undefined
    return target.closest('[data-game-map-tile-id]')?.getAttribute('data-game-map-tile-id') ?? undefined
  }

  function getTileBuildingUrl(tile: MapTile): string | undefined {
    for (const buildingId of tile.buildingIds) {
      const building = buildingById.get(buildingId)
      if (!building) continue
      return gameMapBuildingAssetUrls[resolveGameBuildingAssetKey(building)]
    }
    return undefined
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      tileId: getPointerTileId(event.target),
      startX: event.clientX,
      startY: event.clientY,
      panX: camera.panX,
      panY: camera.panY,
      moved: false,
    }
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY
    if (Math.hypot(dx, dy) > 4) drag.moved = true
    if (!drag.moved) return
    setCamera((currentCamera) => ({ ...currentCamera, panX: drag.panX + dx, panY: drag.panY + dy }))
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const activationTileId = !drag.moved ? drag.tileId : undefined
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    dragRef.current = null
    if (activationTileId) onTileActivate(activationTileId)
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault()
    zoomAt(event.clientX, event.clientY, event.deltaY < 0 ? 1.1 : 0.9)
  }

  function renderHighlightOverlay(layout: ReturnType<typeof createGameMapTileLayouts>[number]) {
    const tile = layout.tile
    const isSelected = tile.id === selectedTileId
    const isHovered = tile.id === hoveredTileId
    const terrainUrl = gameMapTerrainAssetUrls[tile.terrain]
    const overlayStyle = getGameTileHighlightOverlayStyle(isSelected, isHovered)
    if (!overlayStyle || !terrainUrl) return null

    const terrainBox = {
      x: -gameMapMetrics.terrainDrawWidth / 2,
      y: -gameMapMetrics.terrainDrawHeight * gameMapMetrics.terrainAnchorY,
      width: gameMapMetrics.terrainDrawWidth,
      height: gameMapMetrics.terrainDrawHeight,
    }

    return (
      <g key={`highlight-${tile.id}`} data-test-id={layout.overlayTestId} transform={layout.transform} opacity={tile.visible ? 1 : 0.42} pointerEvents="none">
        <image
          data-test-id={layout.overlayEdgeTestId}
          href={terrainUrl}
          x={terrainBox.x}
          y={terrainBox.y}
          width={terrainBox.width}
          height={terrainBox.height}
          preserveAspectRatio="none"
          clipPath={`url(#${layout.terrainClipPathId})`}
          filter={`url(#${layout.terrainEdgeFilterId})`}
          pointerEvents="none"
        />
        <g data-test-id={layout.overlayFillMaskGroupTestId} clipPath={`url(#${layout.terrainClipPathId})`} mask={`url(#${layout.terrainMaskId})`} pointerEvents="none">
          <rect
            data-test-id={layout.overlayFillTestId}
            x={terrainBox.x}
            y={terrainBox.y}
            width={terrainBox.width}
            height={terrainBox.height}
            fill={svgColor(overlayStyle.fillColor)}
            fillOpacity={overlayStyle.fillAlpha}
            pointerEvents="none"
          />
        </g>
      </g>
    )
  }

  return (
    <div className="game-map-stage-shell" data-test-id="game-map-stage-shell" style={{ '--game-map-background-image': `url(${gameMapBackgroundAssetUrl})` } as CSSProperties}>
      <div
        ref={hostRef}
        className="game-map-svg-host"
        data-test-id="game-map-svg-host"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          dragRef.current = null
        }}
        onWheel={handleWheel}
      >
        <svg className="game-map-svg" data-test-id="game-map-svg" role="group" aria-label={map.name} viewBox={`0 0 ${viewport.width} ${viewport.height}`}>
          <g data-test-id="game-map-world-layer" transform={`translate(${camera.panX} ${camera.panY}) scale(${camera.zoom})`}>
            {tileLayouts.map((layout) => {
              const tile = layout.tile
              const isSelected = tile.id === selectedTileId
              const isHovered = tile.id === hoveredTileId
              const terrainUrl = gameMapTerrainAssetUrls[tile.terrain]
              const buildingUrl = getTileBuildingUrl(tile)
              const overlayStyle = getGameTileHighlightOverlayStyle(isSelected, isHovered)
              const terrainFilter = getGameTerrainHighlightFilterConfig(isSelected, isHovered)
              const terrainStyle: CSSProperties | undefined = terrainFilter ? { filter: `brightness(${terrainFilter.brightness}) saturate(${terrainFilter.saturation})` } : undefined
              const terrainBox = {
                x: -gameMapMetrics.terrainDrawWidth / 2,
                y: -gameMapMetrics.terrainDrawHeight * gameMapMetrics.terrainAnchorY,
                width: gameMapMetrics.terrainDrawWidth,
                height: gameMapMetrics.terrainDrawHeight,
              }

              return (
                <g
                  key={tile.id}
                  className="game-map-svg-tile"
                  data-test-id={layout.tileTestId}
                  role="button"
                  tabIndex={0}
                  aria-label={`${tile.name} ${tile.terrain}`}
                  opacity={tile.visible ? 1 : 0.36}
                  transform={layout.transform}
                  onKeyDown={(event) => activateTileFromKeyboard(event, tile.id)}
                  onPointerEnter={() => setHoveredTileId(tile.id)}
                  onPointerLeave={() => setHoveredTileId((currentTileId) => currentTileId === tile.id ? null : currentTileId)}
                >
                  {terrainUrl ? (
                    <defs data-test-id={layout.terrainMaskDefsTestId}>
                      <clipPath id={layout.terrainClipPathId} data-test-id={layout.terrainClipPathTestId} clipPathUnits="userSpaceOnUse">
                        <polygon data-test-id={`${layout.terrainClipPathTestId}-shape`} points={terrainDiamondPoints()} />
                      </clipPath>
                      <mask
                        id={layout.terrainMaskId}
                        data-test-id={layout.terrainMaskTestId}
                        maskUnits="userSpaceOnUse"
                        x={terrainBox.x}
                        y={terrainBox.y}
                        width={terrainBox.width}
                        height={terrainBox.height}
                        style={{ maskType: 'alpha' }}
                      >
                        <image
                          data-test-id={layout.terrainMaskImageTestId}
                          href={terrainUrl}
                          x={terrainBox.x}
                          y={terrainBox.y}
                          width={terrainBox.width}
                          height={terrainBox.height}
                          preserveAspectRatio="none"
                          clipPath={`url(#${layout.terrainClipPathId})`}
                          pointerEvents="none"
                        />
                      </mask>
                      {overlayStyle ? (
                        <filter
                          id={layout.terrainEdgeFilterId}
                          data-test-id={layout.terrainEdgeFilterTestId}
                          x={terrainBox.x - overlayStyle.strokeWidth * 4}
                          y={terrainBox.y - overlayStyle.strokeWidth * 4}
                          width={terrainBox.width + overlayStyle.strokeWidth * 8}
                          height={terrainBox.height + overlayStyle.strokeWidth * 8}
                          filterUnits="userSpaceOnUse"
                          colorInterpolationFilters="sRGB"
                        >
                          <feMorphology data-test-id={layout.terrainEdgeDilateTestId} in="SourceAlpha" operator="dilate" radius={overlayStyle.strokeWidth} result="terrain-edge-expanded" />
                          <feMorphology data-test-id={layout.terrainEdgeErodeTestId} in="SourceAlpha" operator="erode" radius={Math.max(0.35, overlayStyle.strokeWidth * 0.35)} result="terrain-edge-eroded" />
                          <feComposite data-test-id={layout.terrainEdgeBandTestId} in="terrain-edge-expanded" in2="terrain-edge-eroded" operator="out" result="terrain-edge-band" />
                          <feFlood data-test-id={layout.terrainEdgeFloodTestId} floodColor={svgColor(overlayStyle.strokeColor)} floodOpacity={overlayStyle.strokeAlpha} result="terrain-edge-color" />
                          <feComposite data-test-id={layout.terrainEdgeStrokeTestId} in="terrain-edge-color" in2="terrain-edge-band" operator="in" result="terrain-edge-stroke" />
                          <feGaussianBlur data-test-id={layout.terrainEdgeGlowTestId} in="terrain-edge-stroke" stdDeviation={Math.max(0.8, overlayStyle.strokeWidth * 0.65)} result="terrain-edge-glow" />
                          <feMerge data-test-id={layout.terrainEdgeMergeTestId}>
                            <feMergeNode data-test-id={layout.terrainEdgeGlowMergeNodeTestId} in="terrain-edge-glow" />
                            <feMergeNode data-test-id={layout.terrainEdgeStrokeMergeNodeTestId} in="terrain-edge-stroke" />
                          </feMerge>
                        </filter>
                      ) : null}
                    </defs>
                  ) : null}
                  <ellipse data-test-id={`game-map-shadow-${tile.id}`} cx={0} cy={gameMapMetrics.tileHeight * 0.18} rx={gameMapMetrics.tileWidth * 0.35} ry={gameMapMetrics.tileHeight * 0.14} fill="#17130d" fillOpacity={0.2} pointerEvents="none" />
                  <polygon data-test-id={layout.baseTestId} points={baseDiamondPoints()} fill={svgColor(tileFillColor(tile.terrain))} fillOpacity={0.68} stroke="#e9dfcb" strokeOpacity={0.3} strokeWidth={1.2} pointerEvents="none" />
                  {terrainUrl ? (
                    <image data-test-id={layout.terrainTestId} href={terrainUrl} x={terrainBox.x} y={terrainBox.y} width={terrainBox.width} height={terrainBox.height} preserveAspectRatio="none" clipPath={`url(#${layout.terrainClipPathId})`} style={terrainStyle} pointerEvents="none" />
                  ) : null}
                  {buildingUrl ? (
                    <image data-test-id={layout.buildingTestId} href={buildingUrl} x={-gameMapMetrics.buildingDrawWidth / 2} y={-gameMapMetrics.buildingDrawHeight * gameMapMetrics.buildingAnchorY} width={gameMapMetrics.buildingDrawWidth} height={gameMapMetrics.buildingDrawHeight} preserveAspectRatio="none" pointerEvents="none" />
                  ) : null}
                  {tile.dangerLevel > 25 ? <circle data-test-id={layout.dangerTestId} cx={gameMapMetrics.tileWidth * 0.28} cy={-gameMapMetrics.tileHeight * 0.16} r={5} fill="#9a6418" fillOpacity={0.95} pointerEvents="none" /> : null}
                  {layout.isPlayer ? (
                    <g data-test-id={layout.playerMarkerTestId} pointerEvents="none">
                      <ellipse data-test-id={`game-map-player-marker-shadow-${tile.id}`} cx={0} cy={-20} rx={16} ry={8} fill="#1d1710" fillOpacity={0.34} />
                      <image data-test-id={`game-map-player-marker-image-${tile.id}`} href={gameMapProtagonistAssetUrl} x={-17} y={-58} width={34} height={48} preserveAspectRatio="xMidYMid meet" />
                    </g>
                  ) : null}
                  <polygon className="game-map-hit-area" data-test-id={layout.hitAreaTestId} data-game-map-tile-id={tile.id} points={terrainDiamondPoints()} fill="transparent" stroke="transparent" pointerEvents="all" />
                </g>
              )
            })}
            <g data-test-id="game-map-overlay-layer" pointerEvents="none">
              {tileLayouts.map((layout) => renderHighlightOverlay(layout))}
            </g>
          </g>
        </svg>
      </div>
      {detailDrawer}
    </div>
  )
}
