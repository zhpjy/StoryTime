import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode, WheelEvent } from 'react'
import type { ContentPack, MapTile } from '@tss/schema'
import {
  mapBackgroundAssetUrl,
  mapBuildingAssetUrls,
  mapDetailCardBackgroundAssetUrl,
  mapTerrainAssetUrls,
  resolveBuildingAssetKey,
} from './mapAssets'
import { getTerrainHighlightFilterConfig, getTileHighlightOverlayStyle } from './mapHighlight'
import {
  baseDiamondPoints,
  clampSvgZoom,
  createSvgTileLayouts,
  getSvgMapBounds,
  svgColor,
  svgMapMetrics,
  terrainDiamondPoints,
  tileFillColor,
} from './svgMapLayout'

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

const initialViewport: ViewportSize = { width: 900, height: 480 }

export function StoryMapSvg({
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
  const [isLoadingAssets, setIsLoadingAssets] = useState(true)

  const bounds = useMemo(() => getSvgMapBounds(map.tiles), [map.tiles])
  const tileLayouts = useMemo(() => createSvgTileLayouts(map.tiles, playerTileId), [map.tiles, playerTileId])
  const buildingById = useMemo(() => new Map(buildings.map((building) => [building.id, building])), [buildings])
  const assetUrls = useMemo(() => {
    const urls = new Set<string>([mapBackgroundAssetUrl, mapDetailCardBackgroundAssetUrl])

    for (const tile of map.tiles) {
      const terrainUrl = mapTerrainAssetUrls[tile.terrain]
      if (terrainUrl) urls.add(terrainUrl)

      for (const buildingId of tile.buildingIds) {
        const building = buildingById.get(buildingId)
        if (!building) continue
        urls.add(mapBuildingAssetUrls[resolveBuildingAssetKey(building)])
      }
    }

    return Array.from(urls)
  }, [buildingById, map.tiles])

  useEffect(() => {
    let canceled = false
    setIsLoadingAssets(true)

    if (assetUrls.length === 0) {
      setIsLoadingAssets(false)
      return () => {
        canceled = true
      }
    }

    let remainingAssets = assetUrls.length
    const finishAsset = () => {
      remainingAssets -= 1
      if (remainingAssets > 0 || canceled) return
      requestAnimationFrame(() => {
        if (!canceled) setIsLoadingAssets(false)
      })
    }

    const imageLoaders = assetUrls.map((url) => {
      const image = new Image()
      let isSettled = false
      const settleAsset = () => {
        if (isSettled) return
        isSettled = true
        finishAsset()
      }
      image.onload = settleAsset
      image.onerror = settleAsset
      image.src = url
      if (image.complete) settleAsset()
      return image
    })

    return () => {
      canceled = true
      for (const image of imageLoaders) {
        image.onload = null
        image.onerror = null
      }
    }
  }, [assetUrls])

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
    const zoom = clampSvgZoom(Math.min(width / bounds.width, height / bounds.height))
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
      const nextZoom = clampSvgZoom(currentCamera.zoom * factor)
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
    return target.closest('[data-map-tile-id]')?.getAttribute('data-map-tile-id') ?? undefined
  }

  function resolveTileActivationFromPointer(drag: DragState | null): string | undefined {
    if (!drag || drag.moved) return undefined
    return drag.tileId
  }

  function getTileBuildingUrl(tile: MapTile): string | undefined {
    for (const buildingId of tile.buildingIds) {
      const building = buildingById.get(buildingId)
      if (!building) continue
      return mapBuildingAssetUrls[resolveBuildingAssetKey(building)]
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
    if (Math.hypot(dx, dy) > 4) {
      drag.moved = true
    }
    if (!drag.moved) return
    setCamera((currentCamera) => ({ ...currentCamera, panX: drag.panX + dx, panY: drag.panY + dy }))
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    const activationTileId = resolveTileActivationFromPointer(dragRef.current)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    dragRef.current = null
    if (activationTileId) onTileActivate(activationTileId)
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault()
    zoomAt(event.clientX, event.clientY, event.deltaY < 0 ? 1.1 : 0.9)
  }

  function renderHighlightOverlay(layout: ReturnType<typeof createSvgTileLayouts>[number]) {
    const tile = layout.tile
    const isSelected = tile.id === selectedTileId
    const isHovered = tile.id === hoveredTileId
    const terrainUrl = mapTerrainAssetUrls[tile.terrain]
    const overlayStyle = getTileHighlightOverlayStyle(isSelected, isHovered)
    if (!overlayStyle || !terrainUrl) return null

    const terrainBox = {
      x: -svgMapMetrics.terrainDrawWidth / 2,
      y: -svgMapMetrics.terrainDrawHeight * svgMapMetrics.terrainAnchorY,
      width: svgMapMetrics.terrainDrawWidth,
      height: svgMapMetrics.terrainDrawHeight,
    }

    return (
      <g
        key={`highlight-${tile.id}`}
        data-test-id={layout.overlayTestId}
        transform={layout.transform}
        opacity={tile.visible ? 1 : 0.42}
        pointerEvents="none"
      >
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
        <g
          data-test-id={layout.overlayFillMaskGroupTestId}
          clipPath={`url(#${layout.terrainClipPathId})`}
          mask={`url(#${layout.terrainMaskId})`}
          pointerEvents="none"
        >
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
    <div
      className="map-stage-shell"
      data-test-id="map-stage-shell"
      style={{ '--map-background-image': `url(${mapBackgroundAssetUrl})` } as CSSProperties}
    >
      <div
        ref={hostRef}
        className="map-svg-host"
        data-test-id="map-svg-host"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          dragRef.current = null
        }}
        onWheel={handleWheel}
      >
        <svg
          className="map-svg"
          data-test-id="map-svg"
          role="group"
          aria-label={map.name}
          viewBox={`0 0 ${viewport.width} ${viewport.height}`}
        >
          <g
            data-test-id="map-svg-world-layer"
            transform={`translate(${camera.panX} ${camera.panY}) scale(${camera.zoom})`}
          >
            {tileLayouts.map((layout) => {
              const tile = layout.tile
              const isSelected = tile.id === selectedTileId
              const isHovered = tile.id === hoveredTileId
              const terrainUrl = mapTerrainAssetUrls[tile.terrain]
              const buildingUrl = getTileBuildingUrl(tile)
              const overlayStyle = getTileHighlightOverlayStyle(isSelected, isHovered)
              const terrainFilter = getTerrainHighlightFilterConfig(isSelected, isHovered)
              const terrainStyle: CSSProperties | undefined = terrainFilter
                ? { filter: `brightness(${terrainFilter.brightness}) saturate(${terrainFilter.saturation})` }
                : undefined
              const terrainBox = {
                x: -svgMapMetrics.terrainDrawWidth / 2,
                y: -svgMapMetrics.terrainDrawHeight * svgMapMetrics.terrainAnchorY,
                width: svgMapMetrics.terrainDrawWidth,
                height: svgMapMetrics.terrainDrawHeight,
              }

              return (
                <g
                  key={tile.id}
                  className="map-svg-tile"
                  data-test-id={layout.tileTestId}
                  role="button"
                  tabIndex={0}
                  aria-label={`${tile.name} ${tile.terrain}`}
                  opacity={tile.visible ? 1 : 0.42}
                  transform={layout.transform}
                  onKeyDown={(event) => activateTileFromKeyboard(event, tile.id)}
                  onPointerEnter={() => setHoveredTileId(tile.id)}
                  onPointerLeave={() => setHoveredTileId((currentTileId) => currentTileId === tile.id ? null : currentTileId)}
                >
                  {terrainUrl ? (
                    <defs data-test-id={layout.terrainMaskDefsTestId}>
                      <clipPath
                        id={layout.terrainClipPathId}
                        data-test-id={layout.terrainClipPathTestId}
                        clipPathUnits="userSpaceOnUse"
                      >
                        <polygon
                          data-test-id={`${layout.terrainClipPathTestId}-shape`}
                          points={terrainDiamondPoints()}
                        />
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
                          <feMorphology
                            data-test-id={layout.terrainEdgeDilateTestId}
                            in="SourceAlpha"
                            operator="dilate"
                            radius={overlayStyle.strokeWidth}
                            result="terrain-edge-expanded"
                          />
                          <feMorphology
                            data-test-id={layout.terrainEdgeErodeTestId}
                            in="SourceAlpha"
                            operator="erode"
                            radius={Math.max(0.35, overlayStyle.strokeWidth * 0.35)}
                            result="terrain-edge-eroded"
                          />
                          <feComposite
                            data-test-id={layout.terrainEdgeBandTestId}
                            in="terrain-edge-expanded"
                            in2="terrain-edge-eroded"
                            operator="out"
                            result="terrain-edge-band"
                          />
                          <feFlood
                            data-test-id={layout.terrainEdgeFloodTestId}
                            floodColor={svgColor(overlayStyle.strokeColor)}
                            floodOpacity={overlayStyle.strokeAlpha}
                            result="terrain-edge-color"
                          />
                          <feComposite
                            data-test-id={layout.terrainEdgeStrokeTestId}
                            in="terrain-edge-color"
                            in2="terrain-edge-band"
                            operator="in"
                            result="terrain-edge-stroke"
                          />
                          <feGaussianBlur
                            data-test-id={layout.terrainEdgeGlowTestId}
                            in="terrain-edge-stroke"
                            stdDeviation={Math.max(0.8, overlayStyle.strokeWidth * 0.65)}
                            result="terrain-edge-glow"
                          />
                          <feMerge data-test-id={layout.terrainEdgeMergeTestId}>
                            <feMergeNode data-test-id={layout.terrainEdgeGlowMergeNodeTestId} in="terrain-edge-glow" />
                            <feMergeNode data-test-id={layout.terrainEdgeStrokeMergeNodeTestId} in="terrain-edge-stroke" />
                          </feMerge>
                        </filter>
                      ) : null}
                    </defs>
                  ) : null}
                  <ellipse
                    data-test-id={`map-shadow-${tile.id}`}
                    cx={0}
                    cy={svgMapMetrics.tileHeight * 0.18}
                    rx={svgMapMetrics.tileWidth * 0.35}
                    ry={svgMapMetrics.tileHeight * 0.14}
                    fill="#17130d"
                    fillOpacity={0.2}
                    pointerEvents="none"
                  />
                  <polygon
                    data-test-id={layout.baseTestId}
                    points={baseDiamondPoints()}
                    fill={svgColor(tileFillColor(tile.terrain))}
                    fillOpacity={0.68}
                    stroke="#e9dfcb"
                    strokeOpacity={0.3}
                    strokeWidth={1.2}
                    pointerEvents="none"
                  />
                  {terrainUrl ? (
                    <image
                      data-test-id={layout.terrainTestId}
                      href={terrainUrl}
                      x={terrainBox.x}
                      y={terrainBox.y}
                      width={terrainBox.width}
                      height={terrainBox.height}
                      preserveAspectRatio="none"
                      clipPath={`url(#${layout.terrainClipPathId})`}
                      style={terrainStyle}
                      pointerEvents="none"
                    />
                  ) : null}
                  {buildingUrl ? (
                    <image
                      data-test-id={layout.buildingTestId}
                      href={buildingUrl}
                      x={-svgMapMetrics.buildingDrawWidth / 2}
                      y={-svgMapMetrics.buildingDrawHeight * svgMapMetrics.buildingAnchorY}
                      width={svgMapMetrics.buildingDrawWidth}
                      height={svgMapMetrics.buildingDrawHeight}
                      preserveAspectRatio="none"
                      pointerEvents="none"
                    />
                  ) : null}
                  {tile.dangerLevel > 25 ? (
                    <circle
                      data-test-id={layout.dangerTestId}
                      cx={svgMapMetrics.tileWidth * 0.28}
                      cy={-svgMapMetrics.tileHeight * 0.16}
                      r={5}
                      fill="#9a6418"
                      fillOpacity={0.95}
                      pointerEvents="none"
                    />
                  ) : null}
                  {layout.isPlayer ? (
                    <g data-test-id={layout.playerMarkerTestId} pointerEvents="none">
                      <circle data-test-id={`map-player-marker-shadow-${tile.id}`} cx={0} cy={-28} r={13} fill="#2d2720" fillOpacity={0.28} />
                      <circle data-test-id={`map-player-marker-core-${tile.id}`} cx={0} cy={-32} r={9} fill="#f8f4ed" stroke="#8f5d16" strokeWidth={3} />
                      <circle data-test-id={`map-player-marker-dot-${tile.id}`} cx={0} cy={-32} r={3} fill="#8f5d16" />
                    </g>
                  ) : null}
                  <polygon
                    className="map-hit-area"
                    data-test-id={layout.hitAreaTestId}
                    data-map-tile-id={tile.id}
                    points={terrainDiamondPoints()}
                    fill="transparent"
                    stroke="transparent"
                    pointerEvents="all"
                  />
                </g>
              )
            })}
            <g data-test-id="map-svg-overlay-layer" pointerEvents="none">
              {tileLayouts.map((layout) => renderHighlightOverlay(layout))}
            </g>
          </g>
        </svg>
      </div>
      {detailDrawer}
      {isLoadingAssets ? (
        <div className="map-loading-overlay" data-test-id="map-loading-overlay" aria-live="polite" aria-busy="true">
          <div className="map-loading-spinner" data-test-id="map-loading-spinner" />
          <div className="map-loading-text" data-test-id="map-loading-text">地图资源加载中</div>
        </div>
      ) : null}
    </div>
  )
}
