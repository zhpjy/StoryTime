import type { SimulationCoverageEnding } from '@tss/engine'
import { simulateCoverage } from '@tss/engine'
import { expect, test } from 'vitest'
import { loadDefaultContentPackArtifact } from './content-pack-artifact'
import { simulateCoverageParallel } from './simulation-coverage-parallel'

function summarizeEndings(endings: SimulationCoverageEnding[]) {
  return endings.map((ending) => ({
    endingId: ending.endingId,
    count: ending.count,
  }))
}

test('parallel simulation coverage matches synchronous simulation coverage', async () => {
  const pack = loadDefaultContentPackArtifact()
  const options = {
    identityIds: ['identity_doctor'],
    days: 1,
    maxStates: 10000,
    maxDepth: 3,
    maxSamplesPerEnding: 1,
  }
  const sync = simulateCoverage(pack, options)
  const parallel = await simulateCoverageParallel(pack, { ...options, workers: 2 })

  expect(parallel.workerCount).toBe(2)
  expect(parallel.truncated).toBe(sync.truncated)
  expect(parallel.uniqueStates).toBe(sync.uniqueStates)
  expect(parallel.terminalStates).toBe(sync.terminalStates)
  expect(parallel.unresolvedTerminalStates).toBe(sync.unresolvedTerminalStates)
  expect(summarizeEndings(parallel.endings)).toEqual(summarizeEndings(sync.endings))
})
