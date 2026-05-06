import {
  advanceTimeSegment,
  createInitialRuntimeState,
  executeInteraction,
  getInteractionAvailability,
  movePlayerToLocation,
  simulateCoverage,
} from '@tss/engine'
import { expect, test } from 'vitest'
import { loadDefaultContentPackArtifact } from './content-pack-artifact'

test('engine regression behavior stays stable', () => {
  const pack = loadDefaultContentPackArtifact()
  const initial = createInitialRuntimeState(pack, 'identity_doctor')

  expect(initial.player.locationId).toBe(pack.runtime.initialState.playerLocationId)
  expect(initial.selectedTileId).toBe(pack.runtime.initialState.selectedTileId)
  expect(initial.worldState.facts).toEqual(pack.runtime.initialState.facts)
  expect(initial.worldState.tileOverrides).toEqual(pack.runtime.initialState.tileOverrides)

  const tavernInteractionId = 'interaction_gather_tavern_rumors'
  const tavernInteraction = pack.interactions.find((interaction) => interaction.id === tavernInteractionId)
  expect(tavernInteraction).toBeTruthy()

  const remoteResult = executeInteraction(pack, initial, tavernInteractionId)
  expect(remoteResult.ok).toBe(false)
  expect(remoteResult.reasons.join('；')).toMatch(/需要先前往/)
  expect(getInteractionAvailability(pack, initial, tavernInteraction).available).toBe(false)

  const moveResult = movePlayerToLocation(pack, initial, 'loc_tavern')
  expect(moveResult.ok).toBe(true)
  expect(moveResult.state.player.locationId).toBe('loc_tavern')
  expect(moveResult.state.time.actionPoints).toBe(initial.time.actionPoints - 1)
  expect(getInteractionAvailability(pack, moveResult.state, tavernInteraction).available).toBe(true)

  const driftSeed = createInitialRuntimeState(pack, 'identity_doctor')
  driftSeed.time.day = 3
  driftSeed.time.segment = 'night'
  driftSeed.worldState.facts.first_patient_event_happened = true
  const driftResult = advanceTimeSegment(pack, driftSeed)
  expect(driftResult.state.time.day).toBe(4)
  expect(driftResult.state.worldState.variables.plague_level).toBeGreaterThan(driftSeed.worldState.variables.plague_level)
  expect(driftResult.state.worldState.variables.herb_stock).toBeLessThan(driftSeed.worldState.variables.herb_stock)

  const coverage = simulateCoverage(pack, {
    identityIds: ['identity_doctor'],
    days: 1,
    maxStates: 30,
    maxDepth: 8,
    maxSamplesPerEnding: 1,
  })
  expect(coverage.identityIds.length).toBe(1)
  expect(coverage.exploredStates).toBeGreaterThan(0)
  expect(coverage.uniqueStates).toBeGreaterThan(0)
})
