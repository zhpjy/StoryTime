import type { ContentPack, GameRuntimeState, RelationshipState } from '@tss/schema'
import { cloneState, relationKey } from './state-utils'

export function createInitialRuntimeState(pack: ContentPack, identityId: string): GameRuntimeState {
  const identity = pack.identities.find((item) => item.id === identityId) ?? pack.identities[0]
  if (!identity) throw new Error('内容包缺少玩家身份')
  const initialConfig = pack.runtime.initialState
  const fallbackLocationId = pack.locations.find((location) => location.state.is_accessible !== false)?.id ?? pack.locations[0]?.id
  if (!fallbackLocationId) throw new Error('内容包缺少地点')
  const playerLocationId = pack.locations.some((location) => location.id === initialConfig.playerLocationId)
    ? initialConfig.playerLocationId
    : fallbackLocationId
  const selectedTileId = initialConfig.selectedTileId ?? pack.maps[0]?.tiles.find((tile) => tile.locationId === playerLocationId)?.id
  const variables = Object.fromEntries(pack.variables.map((item) => [item.key, item.initialValue]))
  const locations = Object.fromEntries(
    pack.locations.map((location) => [
      location.id,
      {
        id: location.id,
        state: cloneState(location.state),
        discovered: location.state.discovered === true || location.id === playerLocationId,
        accessible: location.state.is_accessible !== false || location.id === playerLocationId,
      },
    ]),
  )
  const buildings = Object.fromEntries(pack.buildings.map((building) => [building.id, { id: building.id, state: cloneState(building.state) }]))
  const npcs = Object.fromEntries(pack.npcs.map((npc) => [npc.id, { id: npc.id, locationId: npc.location, state: cloneState(npc.state) }]))
  const relationships = Object.fromEntries(pack.relationships.map((item) => [relationKey(item.sourceId, item.targetId), { ...item }])) as Record<string, RelationshipState>

  for (const npc of pack.npcs) {
    const key = relationKey('player', npc.id)
    if (!relationships[key]) {
      relationships[key] = {
        sourceId: 'player',
        targetId: npc.id,
        value: 0,
        trust: 0,
        fear: 0,
        gratitude: 0,
        suspicion: npc.faction === 'faction_bandit' ? 40 : 10,
        tags: [],
      }
    }
  }

  return {
    contentPackId: pack.packId,
    contentPackVersion: pack.version,
    time: { day: 1, segment: 'morning', actionPoints: pack.world.actionPointsPerSegment },
    player: {
      identity: identity.id,
      locationId: playerLocationId,
      state: { ...identity.initialState },
      inventory: {},
    },
    worldState: {
      variables,
      locations,
      buildings,
      npcs,
      relationships,
      quests: {},
      facts: cloneState(initialConfig.facts),
      eventHistory: [],
      activeEventIds: [],
      conversationHistory: [],
      pendingEventIds: [],
      tileOverrides: cloneState(initialConfig.tileOverrides ?? {}),
    },
    selectedTileId,
    eventLogs: [
      {
        id: 'log_start',
        day: 1,
        segment: 'morning',
        type: 'system',
        message: `你以「${identity.name}」的身份进入${pack.world.name}。`,
      },
    ],
  }
}
