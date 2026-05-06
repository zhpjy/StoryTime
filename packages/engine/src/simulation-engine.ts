import type { ContentPack, GameRuntimeState, Interaction } from '@tss/schema'
import { chooseConversationReply, getActiveConversationNode, getAvailableConversationsForNpc, startConversation } from './conversation-engine'
import { processEvents } from './event-engine'
import { executeInteraction, getInteractionAvailability, getInteractionTargetLocationId, getTravelAvailability, movePlayerToLocation } from './interaction-engine'
import { createInitialRuntimeState } from './initial-state'
import { cloneState } from './state-utils'
import { maybeAutoAdvanceTime, advanceTimeSegment, forceEndingCheck } from './turn-engine'

export type SimulationStrategy = 'balanced' | 'medicine' | 'guard' | 'truth' | 'random'
export type SimulationCoverageStepKind = 'conversation_start' | 'conversation_reply' | 'interaction' | 'travel' | 'advance_time'

export type SimulationCoverageStep = {
  kind: SimulationCoverageStepKind
  id: string
  name: string
  day: number
  segment: GameRuntimeState['time']['segment']
  locationId: string
}

export type SimulationCoverageSample = {
  identityId: string
  endingId?: string
  endingName?: string
  finalDay: number
  finalSegment: GameRuntimeState['time']['segment']
  finalLocationId: string
  stepCount: number
  steps: SimulationCoverageStep[]
  recentLogs: string[]
}

export type SimulationCoverageEnding = {
  endingId: string
  endingName: string
  count: number
  samples: SimulationCoverageSample[]
}

export type SimulationCoverageOptions = {
  identityIds?: string[]
  days?: number
  maxStates?: number
  maxDepth?: number
  maxSamplesPerEnding?: number
  includeAdvanceTime?: boolean
}

export type SimulationCoverageReport = {
  packId: string
  identityIds: string[]
  days: number
  maxStates: number
  maxDepth: number
  exploredStates: number
  uniqueStates: number
  terminalStates: number
  unresolvedTerminalStates: number
  maxDepthHits: number
  deadEnds: number
  truncated: boolean
  truncatedReason?: string
  endings: SimulationCoverageEnding[]
  unresolvedSamples: SimulationCoverageSample[]
}

export type SimulationCoverageResolvedOptions = Required<SimulationCoverageOptions>
export type SimulationCoverageTreeNodeStatus = 'queued' | 'expanded' | 'terminal' | 'duplicate'
export type SimulationCoverageTerminalReason = 'ending' | 'max_day' | 'max_depth' | 'dead_end' | 'unresolved'

export type SimulationCoverageTreeNode = {
  id: string
  parentId?: string
  viaStep?: SimulationCoverageStep
  stateHash: string
  identityId: string
  depth: number
  day: number
  segment: GameRuntimeState['time']['segment']
  locationId: string
  status: SimulationCoverageTreeNodeStatus
  terminalReason?: SimulationCoverageTerminalReason
  endingId?: string
  endingName?: string
  childIds: string[]
  duplicateOf?: string
  recentLogs: string[]
}

export type SimulationCoverageTree = {
  rootIds: string[]
  nodes: Record<string, SimulationCoverageTreeNode>
}

export type SimulationCoverageRunResult = {
  report: SimulationCoverageReport
  tree?: SimulationCoverageTree
}

export type SimulationCoverageExpansionAdapter = (node: SimulationCoverageNode) => SimulationCoverageTransition[]

export type SimulationCoverageRunController = {
  options: SimulationCoverageResolvedOptions
  nextNode: () => SimulationCoverageNode | undefined
  completeNode: (node: SimulationCoverageNode, transitions: SimulationCoverageTransition[]) => void
  isComplete: () => boolean
  makeResult: () => SimulationCoverageRunResult
  makeReport: () => SimulationCoverageReport
}

export type SimulationCoverageNode = {
  identityId: string
  state: GameRuntimeState
  steps: SimulationCoverageStep[]
  depth: number
  treeNodeId?: string
}

export type SimulationCoverageTransition = {
  step: SimulationCoverageStep
  state: GameRuntimeState
}

function scoreInteraction(interaction: Interaction, strategy: SimulationStrategy): number {
  const text = `${interaction.id} ${interaction.name}`
  let score = 0
  if (strategy === 'medicine' || strategy === 'balanced') {
    if (/medicine|herb|treatment|boil|gather|药|诊|草|采/.test(text)) score += 8
  }
  if (strategy === 'guard' || strategy === 'balanced') {
    if (/guard|bandit|patrol|track|combat|盗|巡|护|匪|战/.test(text)) score += 7
  }
  if (strategy === 'truth' || strategy === 'balanced') {
    if (/truth|record|old|clue|investigate|search|旧|案|查|线索|庙|搜/.test(text)) score += 6
  }
  if (/rest|buy_wine/.test(text)) score -= 2
  return score
}

function chooseInteraction(pack: ContentPack, state: GameRuntimeState, strategy: SimulationStrategy): Interaction | undefined {
  const available = pack.interactions.filter((interaction) => getInteractionAvailability(pack, state, interaction).available)
  if (available.length === 0) return undefined
  if (strategy === 'random') return available[(state.time.day + state.time.actionPoints + available.length) % available.length]
  return available.sort((a, b) => scoreInteraction(b, strategy) - scoreInteraction(a, strategy))[0]
}

function chooseTravelDestination(pack: ContentPack, state: GameRuntimeState, strategy: SimulationStrategy): string | undefined {
  const candidates = pack.interactions
    .map((interaction) => ({ interaction, locationId: getInteractionTargetLocationId(pack, state, interaction) }))
    .filter((entry): entry is { interaction: Interaction; locationId: string } => Boolean(entry.locationId))
    .filter((entry) => entry.locationId !== state.player.locationId)
    .filter((entry) => getInteractionAvailability(pack, state, entry.interaction, { ignoreLocation: true }).available)
    .filter((entry) => getTravelAvailability(pack, state, entry.locationId).available)

  if (candidates.length === 0) return undefined
  if (strategy === 'random') return candidates[(state.time.day + state.time.actionPoints + candidates.length) % candidates.length].locationId
  return candidates.sort((a, b) => scoreInteraction(b.interaction, strategy) - scoreInteraction(a.interaction, strategy))[0].locationId
}

export function simulateDays(pack: ContentPack, state: GameRuntimeState, days: number, strategy: SimulationStrategy = 'balanced'): { state: GameRuntimeState; ending: GameRuntimeState['endingResult'] } {
  let next = state
  const stopDay = next.time.day + days
  while (next.time.day <= stopDay && !next.endingResult) {
    const interaction = chooseInteraction(pack, next, strategy)
    if (interaction) {
      const result = executeInteraction(pack, next, interaction.id)
      next = result.ok ? result.state : next
      next = processEvents(pack, next).state
      next = maybeAutoAdvanceTime(pack, next).state
    } else {
      const destination = chooseTravelDestination(pack, next, strategy)
      if (destination) {
        const result = movePlayerToLocation(pack, next, destination)
        next = result.ok ? result.state : next
        next = processEvents(pack, next).state
        next = maybeAutoAdvanceTime(pack, next).state
      } else {
        next = advanceTimeSegment(pack, next).state
      }
    }
    if (next.time.day > pack.world.maxDays) next = forceEndingCheck(pack, next)
  }
  return { state: next, ending: next.endingResult }
}

function withPostTurn(pack: ContentPack, state: GameRuntimeState): GameRuntimeState {
  let next = processEvents(pack, state).state
  next = maybeAutoAdvanceTime(pack, next).state
  if (next.time.day > pack.world.maxDays) next = forceEndingCheck(pack, next)
  return next
}

function makeStep(state: GameRuntimeState, kind: SimulationCoverageStepKind, id: string, name: string): SimulationCoverageStep {
  return {
    kind,
    id,
    name,
    day: state.time.day,
    segment: state.time.segment,
    locationId: state.player.locationId,
  }
}

function compactLogs(state: GameRuntimeState): GameRuntimeState {
  state.eventLogs = state.eventLogs.slice(-20)
  return state
}

export function expandSimulationCoverageState(pack: ContentPack, state: GameRuntimeState, includeAdvanceTime = true): SimulationCoverageTransition[] {
  const transitions: SimulationCoverageTransition[] = []
  const currentMeaningfulState = hashMeaningfulState(state)

  const activeConversation = getActiveConversationNode(pack, state)
  if (activeConversation) {
    for (const reply of activeConversation.node.replies) {
      const result = chooseConversationReply(pack, state, reply.id)
      if (!result.ok) continue
      const next = compactLogs(withPostTurn(pack, result.state))
      if (hashMeaningfulState(next) === currentMeaningfulState) continue
      transitions.push({
        step: makeStep(state, 'conversation_reply', `${activeConversation.conversation.id}.${reply.id}`, `${activeConversation.conversation.title} / ${reply.text}`),
        state: next,
      })
    }
    return transitions
  }

  const currentNpcIds = Object.values(state.worldState.npcs)
    .filter((npc) => npc.locationId === state.player.locationId && npc.state.alive !== false)
    .map((npc) => npc.id)
  for (const npcId of currentNpcIds) {
    for (const entry of getAvailableConversationsForNpc(pack, state, npcId)) {
      const result = startConversation(pack, state, entry.conversation.id)
      if (!result.ok) continue
      const next = compactLogs(withPostTurn(pack, result.state))
      if (hashMeaningfulState(next) === currentMeaningfulState) continue
      transitions.push({
        step: makeStep(state, 'conversation_start', entry.conversation.id, entry.conversation.title),
        state: next,
      })
    }
  }

  for (const interaction of pack.interactions) {
    if (!getInteractionAvailability(pack, state, interaction).available) continue
    const result = executeInteraction(pack, state, interaction.id)
    if (!result.ok) continue
    const next = compactLogs(withPostTurn(pack, result.state))
    if (hashMeaningfulState(next) === currentMeaningfulState) continue
    transitions.push({
      step: makeStep(state, 'interaction', interaction.id, interaction.name),
      state: next,
    })
  }

  for (const location of pack.locations) {
    if (!getTravelAvailability(pack, state, location.id).available) continue
    const result = movePlayerToLocation(pack, state, location.id)
    if (!result.ok) continue
    transitions.push({
      step: makeStep(state, 'travel', location.id, `前往${location.name}`),
      state: compactLogs(withPostTurn(pack, result.state)),
    })
  }

  if (includeAdvanceTime) {
    const skipped = cloneState(state)
    skipped.time.actionPoints = 0
    const advanced = compactLogs(withPostTurn(pack, skipped))
    transitions.push({
      step: makeStep(state, 'advance_time', 'advance_time', '跳过当前时段'),
      state: advanced,
    })
  }

  return transitions
}

export function createSimulationCoverageInitialNode(pack: ContentPack, identityId: string): SimulationCoverageNode {
  return {
    identityId,
    state: compactLogs(withPostTurn(pack, createInitialRuntimeState(pack, identityId))),
    steps: [],
    depth: 0,
  }
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(',')}}`
}

export function hashSimulationCoverageState(state: GameRuntimeState): string {
  return stableStringify({
    time: state.time,
    player: state.player,
    worldState: state.worldState,
    selectedTileId: state.selectedTileId,
    endingId: state.endingResult?.ending.id,
  })
}

function hashMeaningfulState(state: GameRuntimeState): string {
  return stableStringify({
    player: state.player,
    worldState: state.worldState,
    selectedTileId: state.selectedTileId,
    endingId: state.endingResult?.ending.id,
  })
}

export function makeSimulationCoverageSample(node: SimulationCoverageNode): SimulationCoverageSample {
  const ending = node.state.endingResult?.ending
  return {
    identityId: node.identityId,
    endingId: ending?.id,
    endingName: ending?.name,
    finalDay: node.state.time.day,
    finalSegment: node.state.time.segment,
    finalLocationId: node.state.player.locationId,
    stepCount: node.steps.length,
    steps: node.steps,
    recentLogs: node.state.eventLogs.slice(-10).map((log) => `[D${log.day}-${log.segment}] ${log.message}`),
  }
}

export function isSimulationCoverageTerminal(node: SimulationCoverageNode, maxDay: number): boolean {
  return Boolean(node.state.endingResult || node.state.time.day > maxDay)
}

export function getDefaultSimulationCoverageOptions(pack: ContentPack): SimulationCoverageResolvedOptions {
  return {
    identityIds: pack.identities.map((identity) => identity.id),
    days: pack.world.maxDays,
    maxStates: 5000,
    maxDepth: pack.world.maxDays * pack.world.segments.length * (pack.world.actionPointsPerSegment + 1) + 20,
    maxSamplesPerEnding: 2,
    includeAdvanceTime: true,
  }
}

export function resolveSimulationCoverageOptions(pack: ContentPack, options: SimulationCoverageOptions = {}): SimulationCoverageResolvedOptions {
  const defaults = getDefaultSimulationCoverageOptions(pack)
  return {
    identityIds: options.identityIds?.length ? options.identityIds : defaults.identityIds,
    days: options.days ?? defaults.days,
    maxStates: options.maxStates ?? defaults.maxStates,
    maxDepth: options.maxDepth ?? defaults.maxDepth,
    maxSamplesPerEnding: options.maxSamplesPerEnding ?? defaults.maxSamplesPerEnding,
    includeAdvanceTime: options.includeAdvanceTime ?? defaults.includeAdvanceTime,
  }
}

function makeTreeRecentLogs(state: GameRuntimeState): string[] {
  return state.eventLogs.slice(-10).map((log) => `[D${log.day}-${log.segment}] ${log.message}`)
}

export function createSimulationCoverageRun(
  pack: ContentPack,
  options: SimulationCoverageOptions = {},
  config: { captureTree?: boolean } = {},
): SimulationCoverageRunController {
  const resolved = resolveSimulationCoverageOptions(pack, options)
  const maxDay = Math.min(resolved.days, pack.world.maxDays)
  const queue: SimulationCoverageNode[] = []
  const visited = new Set<string>()
  const endings = new Map<string, SimulationCoverageEnding>()
  const unresolvedSamples: SimulationCoverageSample[] = []
  const tree: SimulationCoverageTree | undefined = config.captureTree ? { rootIds: [], nodes: {} } : undefined
  const stateHashToTreeNodeId = new Map<string, string>()

  let exploredStates = 0
  let terminalStates = 0
  let unresolvedTerminalStates = 0
  let maxDepthHits = 0
  let deadEnds = 0
  let truncated = false
  let truncatedReason: string | undefined
  let nextTreeNodeId = 1

  function addTreeNode(
    node: SimulationCoverageNode,
    stateHash: string,
    parentId: string | undefined,
    viaStep: SimulationCoverageStep | undefined,
    status: SimulationCoverageTreeNodeStatus,
    duplicateOf?: string,
  ): string | undefined {
    if (!tree) return undefined
    const ending = node.state.endingResult?.ending
    const id = `sim_node_${nextTreeNodeId}`
    nextTreeNodeId += 1
    tree.nodes[id] = {
      id,
      parentId,
      viaStep,
      stateHash,
      identityId: node.identityId,
      depth: node.depth,
      day: node.state.time.day,
      segment: node.state.time.segment,
      locationId: node.state.player.locationId,
      status,
      endingId: ending?.id,
      endingName: ending?.name,
      childIds: [],
      duplicateOf,
      recentLogs: makeTreeRecentLogs(node.state),
    }
    if (parentId) tree.nodes[parentId]?.childIds.push(id)
    else tree.rootIds.push(id)
    return id
  }

  function markTreeNode(node: SimulationCoverageNode, status: SimulationCoverageTreeNodeStatus, reason?: SimulationCoverageTerminalReason) {
    if (!tree || !node.treeNodeId) return
    const treeNode = tree.nodes[node.treeNodeId]
    if (!treeNode) return
    const ending = node.state.endingResult?.ending
    treeNode.status = status
    treeNode.terminalReason = reason
    treeNode.endingId = ending?.id
    treeNode.endingName = ending?.name
    treeNode.recentLogs = makeTreeRecentLogs(node.state)
  }

  function recordTerminal(node: SimulationCoverageNode, reason: SimulationCoverageTerminalReason = node.state.endingResult ? 'ending' : 'unresolved') {
    terminalStates += 1
    markTreeNode(node, 'terminal', reason)
    const ending = node.state.endingResult?.ending
    if (!ending) {
      unresolvedTerminalStates += 1
      if (unresolvedSamples.length < resolved.maxSamplesPerEnding) unresolvedSamples.push(makeSimulationCoverageSample(node))
      return
    }
    const current = endings.get(ending.id) ?? { endingId: ending.id, endingName: ending.name, count: 0, samples: [] }
    current.count += 1
    if (current.samples.length < resolved.maxSamplesPerEnding) current.samples.push(makeSimulationCoverageSample(node))
    endings.set(ending.id, current)
  }

  function shouldRecordWithoutExpansion(node: SimulationCoverageNode): boolean {
    if (isSimulationCoverageTerminal(node, maxDay)) {
      recordTerminal(node, node.state.endingResult ? 'ending' : 'max_day')
      return true
    }
    if (node.depth >= resolved.maxDepth) {
      maxDepthHits += 1
      recordTerminal(node, 'max_depth')
      return true
    }
    return false
  }

  function makeReport(): SimulationCoverageReport {
    return {
      packId: pack.packId,
      identityIds: resolved.identityIds,
      days: resolved.days,
      maxStates: resolved.maxStates,
      maxDepth: resolved.maxDepth,
      exploredStates,
      uniqueStates: visited.size,
      terminalStates,
      unresolvedTerminalStates,
      maxDepthHits,
      deadEnds,
      truncated,
      truncatedReason,
      endings: [...endings.values()].sort((left, right) => right.count - left.count || left.endingName.localeCompare(right.endingName)),
      unresolvedSamples,
    }
  }

  for (const identityId of resolved.identityIds) {
    const initial = createSimulationCoverageInitialNode(pack, identityId)
    const hash = hashSimulationCoverageState(initial.state)
    if (visited.has(hash)) continue
    visited.add(hash)
    const treeNodeId = addTreeNode(initial, hash, undefined, undefined, 'queued')
    if (treeNodeId) {
      initial.treeNodeId = treeNodeId
      stateHashToTreeNodeId.set(hash, treeNodeId)
    }
    queue.push(initial)
  }

  return {
    options: resolved,
    nextNode() {
      if (truncated) return undefined
      let node = queue.pop()
      while (node && shouldRecordWithoutExpansion(node)) node = queue.pop()
      if (!node) return undefined
      if (exploredStates >= resolved.maxStates) {
        truncated = true
        truncatedReason = `达到最大探索状态数 ${resolved.maxStates}`
        queue.length = 0
        return undefined
      }
      exploredStates += 1
      markTreeNode(node, 'expanded')
      return node
    },
    completeNode(parent, transitions) {
      if (transitions.length === 0) {
        deadEnds += 1
        recordTerminal(parent, 'dead_end')
        return
      }

      for (const transition of [...transitions].reverse()) {
        const childNode: SimulationCoverageNode = {
          identityId: parent.identityId,
          state: transition.state,
          steps: [...parent.steps, transition.step],
          depth: parent.depth + 1,
        }
        const hash = hashSimulationCoverageState(childNode.state)

        if (isSimulationCoverageTerminal(childNode, maxDay)) {
          childNode.treeNodeId = addTreeNode(childNode, hash, parent.treeNodeId, transition.step, 'queued')
          recordTerminal(childNode, childNode.state.endingResult ? 'ending' : 'max_day')
          continue
        }

        if (childNode.depth >= resolved.maxDepth) {
          maxDepthHits += 1
          childNode.treeNodeId = addTreeNode(childNode, hash, parent.treeNodeId, transition.step, 'queued')
          recordTerminal(childNode, 'max_depth')
          continue
        }

        if (truncated) continue

        const duplicateOf = stateHashToTreeNodeId.get(hash)
        if (visited.has(hash)) {
          addTreeNode(childNode, hash, parent.treeNodeId, transition.step, 'duplicate', duplicateOf)
          continue
        }

        visited.add(hash)
        childNode.treeNodeId = addTreeNode(childNode, hash, parent.treeNodeId, transition.step, 'queued')
        if (childNode.treeNodeId) stateHashToTreeNodeId.set(hash, childNode.treeNodeId)
        queue.push(childNode)
      }
    },
    isComplete() {
      return truncated || queue.length === 0
    },
    makeReport,
    makeResult() {
      return tree ? { report: makeReport(), tree } : { report: makeReport() }
    },
  }
}

export function runSimulationCoverage(
  pack: ContentPack,
  options: SimulationCoverageOptions = {},
  expandState?: SimulationCoverageExpansionAdapter,
): SimulationCoverageRunResult {
  const coverage = createSimulationCoverageRun(pack, options)
  const expand = expandState ?? ((node: SimulationCoverageNode) => expandSimulationCoverageState(pack, node.state, coverage.options.includeAdvanceTime))
  let node = coverage.nextNode()
  while (node) {
    coverage.completeNode(node, expand(node))
    node = coverage.nextNode()
  }
  return coverage.makeResult()
}

export function buildSimulationCoverageTree(
  pack: ContentPack,
  options: SimulationCoverageOptions = {},
  expandState?: SimulationCoverageExpansionAdapter,
): SimulationCoverageRunResult & { tree: SimulationCoverageTree } {
  const coverage = createSimulationCoverageRun(pack, options, { captureTree: true })
  const expand = expandState ?? ((node: SimulationCoverageNode) => expandSimulationCoverageState(pack, node.state, coverage.options.includeAdvanceTime))
  let node = coverage.nextNode()
  while (node) {
    coverage.completeNode(node, expand(node))
    node = coverage.nextNode()
  }
  const result = coverage.makeResult()
  if (!result.tree) throw new Error('simulation coverage tree capture was not enabled')
  return { report: result.report, tree: result.tree }
}

export function simulateCoverage(pack: ContentPack, options: SimulationCoverageOptions = {}): SimulationCoverageReport {
  return runSimulationCoverage(pack, options).report
}
