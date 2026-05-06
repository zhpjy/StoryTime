import { MapPin } from 'lucide-react'
import { TileInfoPanel } from '@/features/map/components/TileInfoPanel'
import { GameMapSvg } from '@/features/map/GameMapSvg'
import { resolvePlayerTileId } from '@/features/map/gamePlayerTile'
import { useGameStore } from '@/store/game-store'

export function WorldMapGrid() {
  const pack = useGameStore((state) => state.contentPack)
  const runtime = useGameStore((state) => state.runtime)!
  const selectTile = useGameStore((state) => state.selectTile)
  const hoverTile = useGameStore((state) => state.hoverTile)
  const map = pack.maps[0]
  const playerTileId = resolvePlayerTileId(map.tiles, runtime.player.locationId, runtime.selectedTileId)
  const currentLocation = pack.locations.find((item) => item.id === runtime.player.locationId)

  return (
    <div className="flex h-full flex-col overflow-hidden" data-test-id="world-map-container">
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-black/40 px-6 py-4" data-test-id="world-map-header">
        <div data-test-id="world-map-heading">
          <h2 className="text-xl font-bold tracking-tight text-amber-100" data-test-id="world-map-title">{map.name}</h2>
          <p className="text-sm text-stone-400" data-test-id="world-map-description">点击地块后查看地点、NPC、建筑、事件与行动。</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-stone-300" data-test-id="world-map-current-location">
          <MapPin className="size-4 text-amber-200/70" data-test-id="world-map-current-location-icon" />
          {currentLocation?.name ?? runtime.player.locationId}
        </div>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden" data-test-id="world-map-content">
        <div className="absolute inset-0" data-test-id="world-map-stage">
          <GameMapSvg
            map={map}
            buildings={pack.buildings}
            selectedTileId={runtime.selectedTileId}
            playerTileId={playerTileId}
            onTileActivate={(tileId) => {
              selectTile(tileId)
              hoverTile(undefined)
            }}
            detailDrawer={<TileInfoPanel />}
          />
        </div>
      </div>
    </div>
  )
}
