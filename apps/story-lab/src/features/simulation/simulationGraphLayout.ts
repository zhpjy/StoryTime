import type { SimulationCoverageStepKind, SimulationCoverageTree, SimulationCoverageTreeNode } from '@tss/engine'

export type SimulationGraphFilters = {
  identityId: string
  endingId: string
  stepKind: string
}

export type SimulationGraphNode = {
  id: string
  x: number
  y: number
  node: SimulationCoverageTreeNode
}

export type SimulationGraphEdge = {
  id: string
  sourceId: string
  targetId: string
  stepKind?: SimulationCoverageStepKind
  x1: number
  y1: number
  x2: number
  y2: number
}

export type SimulationGraphLayout = {
  nodes: SimulationGraphNode[]
  edges: SimulationGraphEdge[]
  width: number
  height: number
  truncated: boolean
  hiddenNodeCount: number
}

export type SimulationGraphLayoutOptions = {
  filters: SimulationGraphFilters
  maxNodes?: number
}

export type SimulationGraphPoint = {
  x: number
  y: number
}

export type SimulationGraphZoomInput = {
  currentPan: SimulationGraphPoint
  currentZoom: number
  viewportPoint: SimulationGraphPoint
  wheelDeltaY: number
}

const X_SPACING = 280
const Y_SPACING = 96
const X_OFFSET = 96
const Y_OFFSET = 72
export const SIMULATION_GRAPH_MIN_ZOOM = 0.25
export const SIMULATION_GRAPH_MAX_ZOOM = 2.5
const ZOOM_STEP = 1.12

export function buildSimulationGraphLayout(tree: SimulationCoverageTree, options: SimulationGraphLayoutOptions): SimulationGraphLayout {
  const maxNodes = options.maxNodes ?? 2200
  const orderedIds = collectVisibleNodeIds(tree, options.filters, maxNodes)
  const visibleIds = new Set(orderedIds.visibleIds)
  const layerCounts = new Map<number, number>()
  const graphNodes: SimulationGraphNode[] = []

  for (const nodeId of orderedIds.visibleIds) {
    const node = tree.nodes[nodeId]
    if (!node) continue
    const layerIndex = layerCounts.get(node.depth) ?? 0
    layerCounts.set(node.depth, layerIndex + 1)
    graphNodes.push({
      id: node.id,
      x: X_OFFSET + node.depth * X_SPACING,
      y: Y_OFFSET + layerIndex * Y_SPACING,
      node,
    })
  }

  const nodePositions = new Map(graphNodes.map((node) => [node.id, node]))
  const edges: SimulationGraphEdge[] = []

  for (const graphNode of graphNodes) {
    for (const childId of graphNode.node.childIds) {
      if (!visibleIds.has(childId)) continue
      const child = nodePositions.get(childId)
      if (!child) continue
      edges.push({
        id: `${graphNode.id}->${child.id}`,
        sourceId: graphNode.id,
        targetId: child.id,
        stepKind: child.node.viaStep?.kind,
        x1: graphNode.x + 72,
        y1: graphNode.y,
        x2: child.x - 72,
        y2: child.y,
      })
    }
  }

  const maxDepth = graphNodes.reduce((current, node) => Math.max(current, node.node.depth), 0)
  const maxLayerCount = [...layerCounts.values()].reduce((current, count) => Math.max(current, count), 1)

  return {
    nodes: graphNodes,
    edges,
    width: Math.max(900, X_OFFSET * 2 + maxDepth * X_SPACING + 220),
    height: Math.max(560, Y_OFFSET * 2 + (maxLayerCount - 1) * Y_SPACING + 160),
    truncated: orderedIds.truncated,
    hiddenNodeCount: orderedIds.hiddenNodeCount,
  }
}

function collectVisibleNodeIds(tree: SimulationCoverageTree, filters: SimulationGraphFilters, maxNodes: number) {
  const allMatchingIds: string[] = []

  function collect(nodeId: string): string[] {
    const node = tree.nodes[nodeId]
    if (!node) return []

    const selfMatches = simulationGraphNodeSelfMatches(node, filters)
    const childIds = node.childIds.flatMap(collect)
    if (!selfMatches && childIds.length === 0) return []
    return [nodeId, ...childIds]
  }

  for (const rootId of tree.rootIds) allMatchingIds.push(...collect(rootId))
  const visibleIds = allMatchingIds.slice(0, maxNodes)

  return {
    visibleIds,
    truncated: allMatchingIds.length > visibleIds.length,
    hiddenNodeCount: Math.max(0, allMatchingIds.length - visibleIds.length),
  }
}

function simulationGraphNodeSelfMatches(node: SimulationCoverageTreeNode, filters: SimulationGraphFilters): boolean {
  const identityMatches = filters.identityId === 'all' || node.identityId === filters.identityId
  const endingMatches = filters.endingId === 'all' || node.endingId === filters.endingId
  const stepMatches = filters.stepKind === 'all' || node.viaStep?.kind === filters.stepKind
  return identityMatches && endingMatches && stepMatches
}

export function calculateSimulationGraphZoom(input: SimulationGraphZoomInput): { pan: SimulationGraphPoint; zoom: number } {
  const graphPoint = {
    x: (input.viewportPoint.x - input.currentPan.x) / input.currentZoom,
    y: (input.viewportPoint.y - input.currentPan.y) / input.currentZoom,
  }
  const direction = input.wheelDeltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP
  const zoom = clamp(input.currentZoom * direction, SIMULATION_GRAPH_MIN_ZOOM, SIMULATION_GRAPH_MAX_ZOOM)

  return {
    zoom,
    pan: {
      x: input.viewportPoint.x - graphPoint.x * zoom,
      y: input.viewportPoint.y - graphPoint.y * zoom,
    },
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}
