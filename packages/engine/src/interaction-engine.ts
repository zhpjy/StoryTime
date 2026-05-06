import type { ContentPack, GameLog, GameRuntimeState, Interaction } from '@tss/schema'
import { evaluateCondition, explainConditionFailures } from './condition-engine'
import { applyEffects } from './effect-engine'
import { evaluateEnding } from './ending-engine'
import { resolveQuestCompletions, type QuestCompletionTrigger } from './quest-engine'
import { cloneState, getLocationTile, makeLog } from './state-utils'

export type Availability = {
  available: boolean
  reasons: string[]
}

export type AvailabilityOptions = {
  ignoreLocation?: boolean
}

export type InteractionExecutionResult = {
  state: GameRuntimeState
  logs: GameLog[]
  ok: boolean
  reasons: string[]
}

export function checkInteractionCost(state: GameRuntimeState, interaction: Pick<Interaction, 'cost'>): string[] {
  const cost = interaction.cost
  const reasons: string[] = []
  const actionPointCost = cost?.actionPoints ?? 1
  if (actionPointCost > state.time.actionPoints) reasons.push(`行动点不足，需要 ${actionPointCost}`)
  if ((cost?.stamina ?? 0) > state.player.state.stamina) reasons.push(`体力不足，需要 ${cost?.stamina}`)
  if ((cost?.money ?? 0) > state.player.state.money) reasons.push(`金钱不足，需要 ${cost?.money}`)
  if ((cost?.health ?? 0) >= state.player.state.health) reasons.push('生命不足，需要保留生命')
  if (cost?.itemId && (state.player.inventory[cost.itemId] ?? 0) < (cost.itemCount ?? 1)) reasons.push(`物品不足：${cost.itemId}`)
  return reasons
}

export function getInteractionTargetLocationId(pack: ContentPack, state: GameRuntimeState, interaction: Interaction): string | undefined {
  if (interaction.targetType === 'location') return interaction.targetId
  if (interaction.targetType === 'building') return pack.buildings.find((building) => building.id === interaction.targetId)?.locationId
  if (interaction.targetType === 'npc') return state.worldState.npcs[interaction.targetId]?.locationId ?? pack.npcs.find((npc) => npc.id === interaction.targetId)?.location
  if (interaction.targetType === 'tile') return pack.maps.flatMap((map) => map.tiles).find((tile) => tile.id === interaction.targetId)?.locationId
  return undefined
}

export function getInteractionAvailability(pack: ContentPack, state: GameRuntimeState, interaction: Interaction, options: AvailabilityOptions = {}): Availability {
  const reasons = [...checkInteractionCost(state, interaction)]
  if (!options.ignoreLocation) {
    const locationId = getInteractionTargetLocationId(pack, state, interaction)
    if (!locationId) {
      reasons.push('交互目标无法定位')
    } else if (locationId !== state.player.locationId) {
      reasons.push('需要先前往目标地点')
    }
  }
  if (interaction.targetType === 'npc' && state.worldState.npcs[interaction.targetId]?.state.alive === false) reasons.push('目标当前无法互动')
  if (interaction.type === 'give' && (state.player.inventory[interaction.itemId] ?? 0) < interaction.itemCount) reasons.push(`物品不足：${interaction.itemId}`)
  if (!evaluateCondition(interaction.conditions, state)) {
    reasons.push(...explainConditionFailures(interaction.conditions, state).map((item) => `${item.fact ?? '条件'}：需要 ${item.expected}，当前 ${String(item.actual)}`))
  }
  return { available: reasons.length === 0, reasons }
}

function consumeInteractionCost(state: GameRuntimeState, interaction: Interaction): void {
  const cost = interaction.cost ?? { actionPoints: 1 }
  state.time.actionPoints = Math.max(0, state.time.actionPoints - (cost.actionPoints ?? 1))
  if (cost.stamina) state.player.state.stamina = Math.max(0, state.player.state.stamina - cost.stamina)
  if (cost.money) state.player.state.money = Math.max(0, state.player.state.money - cost.money)
  if (cost.health) state.player.state.health = Math.max(0, state.player.state.health - cost.health)
  if (cost.itemId) state.player.inventory[cost.itemId] = Math.max(0, (state.player.inventory[cost.itemId] ?? 0) - (cost.itemCount ?? 1))
}

function resolveCombat(pack: ContentPack, state: GameRuntimeState, interaction: Extract<Interaction, { type: 'combat' }>): { logs: GameLog[]; trigger?: QuestCompletionTrigger } {
  const playerCombat = state.player.state.combat
  const gap = playerCombat - interaction.enemyCombat
  if (gap < 0) {
    state.player.state.health = 0
    state.worldState.facts.player_dead = true
    const ending = evaluateEnding(pack, state)
    if (ending) state.endingResult = ending
    return { logs: [makeLog(state, 'player', `战斗失败：${interaction.name}`, interaction.description)] }
  }

  const damage = Math.max(1, Math.ceil((interaction.enemyCombat / Math.max(1, playerCombat + 10)) * 12))
  state.player.state.health = Math.max(0, state.player.state.health - damage)
  const logs = [makeLog(state, 'player', `战斗胜利：${interaction.name}`, `生命 -${damage}`)]
  if (interaction.targetType === 'npc') {
    const target = state.worldState.npcs[interaction.targetId]
    if (target) target.state.alive = false
  }
  logs.push(...applyEffects(pack, state, interaction.victoryEffects ?? []))
  return {
    logs,
    trigger: {
      type: 'combat',
      targetType: interaction.targetType,
      targetId: interaction.targetId,
      result: 'victory',
      interactionId: interaction.id,
    },
  }
}

export function getTravelAvailability(pack: ContentPack, state: GameRuntimeState, locationId: string): Availability {
  const reasons: string[] = []
  if (state.player.locationId === locationId) reasons.push('已经在此地')
  if (state.time.actionPoints < 1) reasons.push('行动点不足，需要 1')
  const location = state.worldState.locations[locationId]
  if (!location) reasons.push('地点不存在')
  if (location && !location.accessible) reasons.push('地点尚不可进入')
  const tile = getLocationTile(pack, state, locationId)
  if (!tile) reasons.push('地点没有对应地块')
  if (tile && (!tile.visible || !tile.discovered)) reasons.push('地点尚未发现')
  if (tile?.blocked) reasons.push('地块被阻挡')
  return { available: reasons.length === 0, reasons }
}

export function movePlayerToLocation(pack: ContentPack, state: GameRuntimeState, locationId: string): InteractionExecutionResult {
  const availability = getTravelAvailability(pack, state, locationId)
  if (!availability.available) return { state, logs: [], ok: false, reasons: availability.reasons }
  const next = cloneState(state)
  next.time.actionPoints = Math.max(0, next.time.actionPoints - 1)
  const logs = applyEffects(pack, next, [{ type: 'move_player', locationId }])
  next.eventLogs = [...next.eventLogs, ...logs]
  return { state: next, logs, ok: true, reasons: [] }
}

export function executeInteraction(pack: ContentPack, state: GameRuntimeState, interactionId: string): InteractionExecutionResult {
  const interaction = pack.interactions.find((item) => item.id === interactionId)
  if (!interaction) return { state, logs: [], ok: false, reasons: ['交互不存在'] }
  const availability = getInteractionAvailability(pack, state, interaction)
  if (!availability.available) return { state, logs: [], ok: false, reasons: availability.reasons }

  const next = cloneState(state)
  const logs: GameLog[] = [makeLog(next, 'player', `执行交互：${interaction.name}`, interaction.description)]
  consumeInteractionCost(next, interaction)
  logs.push(...applyEffects(pack, next, interaction.effects ?? []))

  let trigger: QuestCompletionTrigger | undefined
  if (interaction.type === 'environment') {
    trigger = {
      type: 'environment',
      environmentType: interaction.environmentType,
      targetType: interaction.targetType,
      targetId: interaction.targetId,
      interactionId: interaction.id,
    }
  } else if (interaction.type === 'give') {
    next.player.inventory[interaction.itemId] = Math.max(0, (next.player.inventory[interaction.itemId] ?? 0) - interaction.itemCount)
    logs.push(...applyEffects(pack, next, interaction.acceptedEffects ?? []))
    trigger = {
      type: 'give',
      npcId: interaction.targetId,
      itemId: interaction.itemId,
      itemCount: interaction.itemCount,
      interactionId: interaction.id,
    }
  } else if (interaction.type === 'combat') {
    const combat = resolveCombat(pack, next, interaction)
    logs.push(...combat.logs)
    trigger = combat.trigger
  } else if (interaction.type === 'conversation') {
    logs.push(...applyEffects(pack, next, [{ type: 'start_conversation', conversationId: interaction.conversationId }]))
    trigger = {
      type: 'conversation',
      npcId: pack.conversations.find((conversation) => conversation.id === interaction.conversationId)?.npcId ?? interaction.targetId,
      conversationId: interaction.conversationId,
    }
  }

  if (trigger) {
    const questResult = resolveQuestCompletions(pack, next, trigger)
    next.worldState = questResult.state.worldState
    next.player = questResult.state.player
    next.endingResult = questResult.state.endingResult
    logs.push(...questResult.logs)
  }
  next.eventLogs = [...next.eventLogs, ...logs]
  return { state: next, logs, ok: true, reasons: [] }
}
