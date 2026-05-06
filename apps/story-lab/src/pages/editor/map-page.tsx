import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  GitBranch,
  Layers,
  Map as MapIcon,
  ShieldCheck,
  UserRound,
  MousePointer2
} from 'lucide-react'
import type { ContentPack, Location, MapTile, NPC } from '@tss/schema'
import {
  EmptyState,
  PageHeader
} from '../../components/common'
import { mapDetailCardBackgroundAssetUrl } from '../../features/map/mapAssets'
import { StoryMapSvg } from '../../features/map/StoryMapSvg'
import { canMovePlayerToTile, resolveInitialPlayerTileId } from '../../features/map/playerTile'
import {
  booleanLabel,
  terrainLabel
} from './shared'

export function MapPage({
  map,
  pack,
  selectedLocation,
  selectedTile,
  onSelectTile,
}: {
  map: ContentPack['maps'][number] | undefined
  pack: ContentPack
  selectedTile?: MapTile
  selectedLocation?: Location
  onSelectTile: (tileId: string) => void
}) {
  const initialPlayerTileId = useMemo(
    () => resolveInitialPlayerTileId(map?.tiles ?? [], pack.runtime.initialState.playerLocationId, pack.runtime.initialState.selectedTileId),
    [map?.tiles, pack.runtime.initialState.playerLocationId, pack.runtime.initialState.selectedTileId],
  )
  const [playerTileId, setPlayerTileId] = useState(initialPlayerTileId)
  const [mapDetailOpen, setMapDetailOpen] = useState(false)

  useEffect(() => {
    setPlayerTileId(initialPlayerTileId)
  }, [initialPlayerTileId])

  useEffect(() => {
    setMapDetailOpen(false)
  }, [map?.id])

  if (!map) return <EmptyState title="没有地图数据" />
  const buildings = selectedLocation ? pack.buildings.filter((building) => building.locationId === selectedLocation.id) : []
  const selectedNpcIds = new Set(selectedTile?.npcIds ?? [])
  const npcs = pack.npcs.filter((npc) => selectedNpcIds.has(npc.id) || Boolean(selectedLocation && npc.location === selectedLocation.id))
  const events = selectedLocation ? pack.events.filter((event) => event.locationId === selectedLocation.id) : []
  const interactions = selectedLocation ? pack.interactions.filter((interaction) => interaction.targetId === selectedLocation.id) : []
  const selectedTileDescription = selectedLocation?.descriptions.default ?? (selectedTile ? `${selectedTile.name} / ${terrainLabel[selectedTile.terrain]} / ${selectedTile.x},${selectedTile.y}` : '')

  function activateMapTile(tileId: string) {
    const targetTile = map?.tiles.find((tile) => tile.id === tileId)
    onSelectTile(tileId)
    setMapDetailOpen(true)
    if (canMovePlayerToTile(targetTile, playerTileId)) setPlayerTileId(tileId)
  }

  return (
    <>
      <PageHeader
        eyebrow="Map & Locations"
        testId="map-header"
        title="地图与地点"
        description={`${map.name} / ${map.width} x ${map.height} / ${map.tiles.length} 个地块`}
      />

      <section className="map-layout" data-test-id="map-layout">
        <StoryMapSvg
          map={map}
          buildings={pack.buildings}
          selectedTileId={selectedTile?.id}
          playerTileId={playerTileId}
          onTileActivate={activateMapTile}
          detailDrawer={
            <div
              className={mapDetailOpen ? 'map-detail-drawer is-open' : 'map-detail-drawer'}
              data-test-id="map-detail-card"
              aria-hidden={!mapDetailOpen}
              style={{ '--map-detail-card-background-image': `url(${mapDetailCardBackgroundAssetUrl})` } as CSSProperties}
            >
              <div className="map-detail-header" data-test-id="map-detail-header">
                <h2 data-test-id="map-detail-title">{selectedLocation?.name ?? selectedTile?.name ?? '未选择'}</h2>
              </div>
              <div className="map-detail-body" data-test-id="map-detail-body">
                {selectedTile && (
                  <div className="map-detail-stats" data-test-id="map-tile-definitions">
                    <div className="map-stat" data-test-id="map-field-tile-id">
                      <MapIcon size={14} data-test-id="map-field-tile-id-icon" />
                      <span data-test-id="map-field-tile-id-label">地块</span>
                      <strong data-test-id="map-field-tile-id-value">{selectedTile.id}</strong>
                    </div>
                    <div className="map-stat" data-test-id="map-field-terrain">
                      <Layers size={14} data-test-id="map-field-terrain-icon" />
                      <span data-test-id="map-field-terrain-label">地形</span>
                      <strong data-test-id="map-field-terrain-value">{terrainLabel[selectedTile.terrain]}</strong>
                    </div>
                    <div className="map-stat" data-test-id="map-field-danger">
                      <AlertTriangle size={14} data-test-id="map-field-danger-icon" />
                      <span data-test-id="map-field-danger-label">危险</span>
                      <strong data-test-id="map-field-danger-value">{selectedTile.dangerLevel}</strong>
                    </div>
                    <div className="map-stat" data-test-id="map-field-visible">
                      <Eye size={14} data-test-id="map-field-visible-icon" />
                      <span data-test-id="map-field-visible-label">可见</span>
                      <strong data-test-id="map-field-visible-value">{booleanLabel(selectedTile.visible)}</strong>
                    </div>
                    <div className="map-stat" data-test-id="map-field-discovered">
                      <CheckCircle2 size={14} data-test-id="map-field-discovered-icon" />
                      <span data-test-id="map-field-discovered-label">已发现</span>
                      <strong data-test-id="map-field-discovered-value">{booleanLabel(selectedTile.discovered)}</strong>
                    </div>
                    <div className="map-stat" data-test-id="map-field-blocked">
                      <ShieldCheck size={14} data-test-id="map-field-blocked-icon" />
                      <span data-test-id="map-field-blocked-label">阻塞</span>
                      <strong data-test-id="map-field-blocked-value">{booleanLabel(selectedTile.blocked)}</strong>
                    </div>
                  </div>
                )}
                {selectedLocation ? (
                  <>
                    <p className="map-detail-summary" data-test-id="map-tile-summary">{selectedTileDescription}</p>
                    <div className="map-detail-section" data-test-id="map-section-buildings">
                      <div className="map-section-title" data-test-id="map-section-title-buildings"><Layers size={14} /> 建筑</div>
                      {buildings.length > 0 ? (
                        <div className="map-entity-list" data-test-id="map-entity-list-buildings">
                          {buildings.map((building) => (
                            <span key={building.id} className="map-entity-item" data-test-id={`map-building-${building.id}`}>{building.name} <small>{building.type}</small></span>
                          ))}
                        </div>
                      ) : <span className="map-entity-empty" data-test-id="map-entity-empty-buildings">无建筑</span>}
                    </div>
                    <div className="map-detail-section" data-test-id="map-section-npcs">
                      <div className="map-section-title" data-test-id="map-section-title-npcs"><UserRound size={14} /> NPC</div>
                      {npcs.length > 0 ? (
                        <div className="map-entity-list" data-test-id="map-entity-list-npcs">
                          {npcs.map((npc) => (
                            <span key={npc.id} className="map-entity-item" data-test-id={`map-npc-${npc.id}`}>{npc.name}</span>
                          ))}
                        </div>
                      ) : <span className="map-entity-empty" data-test-id="map-entity-empty-npcs">无 NPC</span>}
                    </div>
                    <div className="map-detail-section" data-test-id="map-section-events">
                      <div className="map-section-title" data-test-id="map-section-title-events"><GitBranch size={14} /> 事件</div>
                      {events.length > 0 ? (
                        <div className="map-entity-list" data-test-id="map-entity-list-events">
                          {events.map((event) => (
                            <span key={event.id} className="map-entity-item" data-test-id={`map-event-${event.id}`}>{event.name}</span>
                          ))}
                        </div>
                      ) : <span className="map-entity-empty" data-test-id="map-entity-empty-events">无事件</span>}
                    </div>
                    <div className="map-detail-section" data-test-id="map-section-interactions">
                      <div className="map-section-title" data-test-id="map-section-title-interactions"><MousePointer2 size={14} /> 交互</div>
                      {interactions.length > 0 ? (
                        <div className="map-entity-list" data-test-id="map-entity-list-interactions">
                          {interactions.map((interaction) => (
                            <span key={interaction.id} className="map-entity-item" data-test-id={`map-interaction-${interaction.id}`}>{interaction.name}</span>
                          ))}
                        </div>
                      ) : <span className="map-entity-empty" data-test-id="map-entity-empty-interactions">无交互</span>}
                    </div>
                  </>
                ) : (
                  <>
                    {selectedTile && <p className="map-detail-summary" data-test-id="map-tile-summary">{selectedTileDescription}</p>}
                    <div className="map-detail-section" data-test-id="map-section-npcs">
                      <div className="map-section-title" data-test-id="map-section-title-npcs"><UserRound size={14} /> NPC</div>
                      {npcs.length > 0 ? (
                        <div className="map-entity-list" data-test-id="map-entity-list-npcs">
                          {npcs.map((npc) => (
                            <span key={npc.id} className="map-entity-item" data-test-id={`map-npc-${npc.id}`}>{npc.name}</span>
                          ))}
                        </div>
                      ) : <span className="map-entity-empty" data-test-id="map-entity-empty-npcs">无 NPC</span>}
                    </div>
                    <div className="map-empty-note" data-test-id="map-empty-location-note">
                      该地块没有绑定地点
                    </div>
                  </>
                )}
              </div>
            </div>
          }
        />
      </section>
    </>
  )
}
