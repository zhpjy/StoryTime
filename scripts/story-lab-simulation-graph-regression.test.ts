import { expect, test } from 'vitest'
import type { SimulationCoverageTree } from '@tss/engine'
import { buildSimulationGraphLayout, calculateSimulationGraphZoom } from '../apps/story-lab/src/features/simulation/simulationGraphLayout'

function makeTree(): SimulationCoverageTree {
  return {
    rootIds: ['root'],
    nodes: {
      root: {
        id: 'root',
        stateHash: 'root-hash',
        identityId: 'identity_doctor',
        depth: 0,
        day: 1,
        segment: 'morning',
        locationId: 'loc_town_gate',
        status: 'expanded',
        childIds: ['interaction', 'travel'],
        recentLogs: [],
      },
      interaction: {
        id: 'interaction',
        parentId: 'root',
        viaStep: { kind: 'interaction', id: 'interaction_test', name: '测试交互', day: 1, segment: 'morning', locationId: 'loc_town_gate' },
        stateHash: 'interaction-hash',
        identityId: 'identity_doctor',
        depth: 1,
        day: 1,
        segment: 'morning',
        locationId: 'loc_town_gate',
        status: 'terminal',
        terminalReason: 'dead_end',
        childIds: [],
        recentLogs: [],
      },
      travel: {
        id: 'travel',
        parentId: 'root',
        viaStep: { kind: 'travel', id: 'loc_tavern', name: '前往酒肆', day: 1, segment: 'morning', locationId: 'loc_town_gate' },
        stateHash: 'travel-hash',
        identityId: 'identity_doctor',
        depth: 1,
        day: 1,
        segment: 'morning',
        locationId: 'loc_tavern',
        status: 'expanded',
        childIds: ['ending'],
        recentLogs: [],
      },
      ending: {
        id: 'ending',
        parentId: 'travel',
        viaStep: { kind: 'conversation_reply', id: 'conversation.reply', name: '揭开真相', day: 1, segment: 'noon', locationId: 'loc_tavern' },
        stateHash: 'ending-hash',
        identityId: 'identity_doctor',
        depth: 2,
        day: 1,
        segment: 'noon',
        locationId: 'loc_tavern',
        status: 'terminal',
        terminalReason: 'ending',
        endingId: 'ending_truth',
        endingName: '真相浮出',
        childIds: [],
        recentLogs: [],
      },
    },
  }
}

test('simulation graph layout preserves visible branches and filters', () => {
  const layout = buildSimulationGraphLayout(makeTree(), {
    filters: { identityId: 'all', endingId: 'all', stepKind: 'all' },
  })

  expect(layout.nodes.map((node) => node.id)).toEqual(['root', 'interaction', 'travel', 'ending'])
  expect(layout.edges.map((edge) => `${edge.sourceId}->${edge.targetId}`)).toEqual(['root->interaction', 'root->travel', 'travel->ending'])
  expect(layout.truncated).toBe(false)
  expect(layout.width).toBeGreaterThan(0)
  expect(layout.height).toBeGreaterThan(0)
  expect(layout.nodes.find((node) => node.id === 'ending')?.x).toBe(layout.nodes.find((node) => node.id === 'root')!.x + 560)

  const filtered = buildSimulationGraphLayout(makeTree(), {
    filters: { identityId: 'all', endingId: 'ending_truth', stepKind: 'all' },
  })

  expect(filtered.nodes.map((node) => node.id)).toEqual(['root', 'travel', 'ending'])
  expect(filtered.edges.map((edge) => `${edge.sourceId}->${edge.targetId}`)).toEqual(['root->travel', 'travel->ending'])

  const limited = buildSimulationGraphLayout(makeTree(), {
    filters: { identityId: 'all', endingId: 'all', stepKind: 'all' },
    maxNodes: 2,
  })

  expect(limited.truncated).toBe(true)
  expect(limited.nodes).toHaveLength(2)
  expect(limited.hiddenNodeCount).toBeGreaterThan(0)
})

test('simulation graph zoom keeps the pointer anchored and clamps scale', () => {
  const zoomedIn = calculateSimulationGraphZoom({
    currentPan: { x: 36, y: 36 },
    currentZoom: 1,
    viewportPoint: { x: 400, y: 260 },
    wheelDeltaY: -120,
  })

  expect(zoomedIn.zoom).toBe(1.12)
  expect(screenToGraphPoint({ x: 400, y: 260 }, zoomedIn.pan, zoomedIn.zoom)).toEqual(screenToGraphPoint({ x: 400, y: 260 }, { x: 36, y: 36 }, 1))

  const minZoom = calculateSimulationGraphZoom({
    currentPan: { x: 0, y: 0 },
    currentZoom: 0.25,
    viewportPoint: { x: 100, y: 100 },
    wheelDeltaY: 120,
  })
  expect(minZoom.zoom).toBe(0.25)

  const maxZoom = calculateSimulationGraphZoom({
    currentPan: { x: 0, y: 0 },
    currentZoom: 2.5,
    viewportPoint: { x: 100, y: 100 },
    wheelDeltaY: -120,
  })
  expect(maxZoom.zoom).toBe(2.5)
})

function screenToGraphPoint(point: { x: number; y: number }, pan: { x: number; y: number }, zoom: number) {
  return {
    x: Math.round(((point.x - pan.x) / zoom) * 1000) / 1000,
    y: Math.round(((point.y - pan.y) / zoom) * 1000) / 1000,
  }
}
