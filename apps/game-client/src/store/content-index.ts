import type { Building, ContentPack, Conversation, Interaction, Location, MapTile, Quest, Reward } from '@tss/schema'

export type ContentIndex = {
  tileById: Map<string, MapTile>
  tileByLocationId: Map<string, MapTile>
  locationById: Map<string, Location>
  buildingById: Map<string, Building>
  interactionById: Map<string, Interaction>
  questById: Map<string, Quest>
  rewardById: Map<string, Reward>
  conversationsByNpcId: Map<string, Conversation[]>
}

export function buildContentIndex(pack: ContentPack): ContentIndex {
  const tileById = new Map<string, MapTile>()
  const tileByLocationId = new Map<string, MapTile>()
  for (const map of pack.maps) {
    for (const tile of map.tiles) {
      tileById.set(tile.id, tile)
      if (tile.locationId) tileByLocationId.set(tile.locationId, tile)
    }
  }

  const conversationsByNpcId = new Map<string, Conversation[]>()
  for (const conversation of pack.conversations) {
    const conversations = conversationsByNpcId.get(conversation.npcId) ?? []
    conversations.push(conversation)
    conversationsByNpcId.set(conversation.npcId, conversations)
  }

  return {
    tileById,
    tileByLocationId,
    locationById: new Map(pack.locations.map((location) => [location.id, location])),
    buildingById: new Map(pack.buildings.map((building) => [building.id, building])),
    interactionById: new Map(pack.interactions.map((interaction) => [interaction.id, interaction])),
    questById: new Map(pack.quests.map((quest) => [quest.id, quest])),
    rewardById: new Map(pack.rewards.map((reward) => [reward.id, reward])),
    conversationsByNpcId,
  }
}
