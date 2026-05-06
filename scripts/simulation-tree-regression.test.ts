import { expect, test } from 'vitest'
import type { SimulationCoverageStep, SimulationCoverageTransition } from '@tss/engine'
import {
  buildSimulationCoverageTree,
  createSimulationCoverageInitialNode,
  expandSimulationCoverageState,
  getDefaultSimulationCoverageOptions,
  resolveSimulationCoverageOptions,
  runSimulationCoverage,
  simulateCoverage,
} from '@tss/engine'
import { loadDefaultContentPackArtifact } from './content-pack-artifact'

function summarizeReport(report: ReturnType<typeof simulateCoverage>) {
  return {
    identityIds: report.identityIds,
    days: report.days,
    maxStates: report.maxStates,
    maxDepth: report.maxDepth,
    exploredStates: report.exploredStates,
    uniqueStates: report.uniqueStates,
    terminalStates: report.terminalStates,
    unresolvedTerminalStates: report.unresolvedTerminalStates,
    maxDepthHits: report.maxDepthHits,
    deadEnds: report.deadEnds,
    truncated: report.truncated,
    truncatedReason: report.truncatedReason,
    endings: report.endings.map((ending) => ({
      endingId: ending.endingId,
      count: ending.count,
    })),
  }
}

test('simulation coverage tree uses the shared coverage runner', () => {
  const pack = loadDefaultContentPackArtifact()
  const defaults = getDefaultSimulationCoverageOptions(pack)

  expect(defaults.identityIds).toEqual(pack.identities.map((identity) => identity.id))
  expect(defaults.days).toBe(pack.world.maxDays)
  expect(defaults.maxStates).toBe(5000)
  expect(defaults.maxDepth).toBe(pack.world.maxDays * pack.world.segments.length * (pack.world.actionPointsPerSegment + 1) + 20)
  expect(defaults.maxSamplesPerEnding).toBe(2)
  expect(defaults.includeAdvanceTime).toBe(true)

  const normalized = resolveSimulationCoverageOptions(pack, { days: 1 })
  expect(normalized.days).toBe(1)
  expect(normalized.maxDepth).toBe(defaults.maxDepth)

  const options = {
    identityIds: [pack.identities[0].id],
    days: 1,
    maxStates: 10000,
    maxDepth: 3,
    maxSamplesPerEnding: 1,
  }
  const legacy = simulateCoverage(pack, options)
  const shared = runSimulationCoverage(pack, options).report

  expect(summarizeReport(shared)).toEqual(summarizeReport(legacy))

  const treeResult = buildSimulationCoverageTree(pack, options)
  expect(treeResult.tree.rootIds).toHaveLength(1)
  expect(summarizeReport(treeResult.report).exploredStates).toBe(summarizeReport(shared).exploredStates)
  expect(Object.values(treeResult.tree.nodes).some((node) => node.childIds.length > 0)).toBe(true)
  for (const node of Object.values(treeResult.tree.nodes)) {
    for (const childId of node.childIds) expect(treeResult.tree.nodes[childId]).toBeTruthy()
  }
})

test('simulation expansion includes conversation starts and replies', () => {
  const pack = loadDefaultContentPackArtifact()
  const initial = createSimulationCoverageInitialNode(pack, pack.identities[0].id)
  const startTransitions = expandSimulationCoverageState(pack, initial.state, false).filter((transition) => transition.step.kind === 'conversation_start')

  expect(startTransitions.length).toBeGreaterThan(0)

  const replyTransitions = expandSimulationCoverageState(pack, startTransitions[0].state, false).filter((transition) => transition.step.kind === 'conversation_reply')
  expect(replyTransitions.length).toBeGreaterThan(0)
})

test('simulation coverage tree records duplicate references', () => {
  const pack = loadDefaultContentPackArtifact()
  const identityId = pack.identities[0].id
  const initial = createSimulationCoverageInitialNode(pack, identityId)
  const duplicateStep: SimulationCoverageStep = {
    kind: 'advance_time',
    id: 'test_duplicate',
    name: '测试重复状态',
    day: initial.state.time.day,
    segment: initial.state.time.segment,
    locationId: initial.state.player.locationId,
  }
  const duplicateResult = buildSimulationCoverageTree(
    pack,
    {
      identityIds: [identityId],
      days: 1,
      maxStates: 10,
      maxDepth: 4,
      maxSamplesPerEnding: 1,
    },
    (node): SimulationCoverageTransition[] => {
      if (node.depth > 0) return []
      return [
        { step: { ...duplicateStep, id: 'test_duplicate_a' }, state: node.state },
        { step: { ...duplicateStep, id: 'test_duplicate_b' }, state: node.state },
      ]
    },
  )

  const root = duplicateResult.tree.nodes[duplicateResult.tree.rootIds[0]]
  const duplicateNodes = root.childIds.map((id) => duplicateResult.tree.nodes[id])
  expect(duplicateNodes).toHaveLength(2)
  expect(duplicateNodes.every((node) => node.status === 'duplicate')).toBe(true)
  expect(duplicateNodes.every((node) => node.duplicateOf === root.id)).toBe(true)
})
