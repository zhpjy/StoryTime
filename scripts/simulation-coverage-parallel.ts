import { availableParallelism } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Worker } from 'node:worker_threads'
import type { ContentPack, GameRuntimeState } from '@tss/schema'
import type {
  SimulationCoverageEnding,
  SimulationCoverageNode,
  SimulationCoverageOptions,
  SimulationCoverageReport,
  SimulationCoverageSample,
  SimulationCoverageTransition,
} from '@tss/engine'
import {
  createSimulationCoverageInitialNode,
  hashSimulationCoverageState,
  isSimulationCoverageTerminal,
  makeSimulationCoverageSample,
} from '@tss/engine'

export type ParallelSimulationCoverageOptions = SimulationCoverageOptions & {
  workers?: number
}

export type ParallelSimulationCoverageReport = SimulationCoverageReport & {
  workerCount: number
  elapsedMs: number
}

type ExpandRequest = {
  type: 'expand'
  jobId: number
  state: GameRuntimeState
}

type ExpandResponse =
  | {
      type: 'expanded'
      jobId: number
      transitions: SimulationCoverageTransition[]
    }
  | {
      type: 'failed'
      jobId: number
      message: string
      stack?: string
    }

type WorkerSlot = {
  id: number
  worker: Worker
  busy: boolean
}

type InFlightJob = {
  node: SimulationCoverageNode
  worker: WorkerSlot
}

const scriptsDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(scriptsDir, '..')
const workerUrl = new URL('./simulation-coverage-worker-entry.mjs', import.meta.url)

export function getDefaultSimulationWorkerCount(): number {
  return Math.max(1, Math.min(4, availableParallelism() - 1))
}

export async function simulateCoverageParallel(pack: ContentPack, options: ParallelSimulationCoverageOptions = {}): Promise<ParallelSimulationCoverageReport> {
  process.env.TSX_TSCONFIG_PATH ??= resolve(repoRoot, 'tsconfig.base.json')

  const identityIds = options.identityIds?.length ? options.identityIds : pack.identities.map((identity) => identity.id)
  const days = options.days ?? pack.world.maxDays
  const maxDay = Math.min(days, pack.world.maxDays)
  const maxStates = options.maxStates ?? 5000
  const maxDepth = options.maxDepth ?? days * pack.world.segments.length * (pack.world.actionPointsPerSegment + 1) + 20
  const maxSamplesPerEnding = options.maxSamplesPerEnding ?? 2
  const includeAdvanceTime = options.includeAdvanceTime ?? true
  const workerCount = Math.max(1, Math.floor(options.workers ?? getDefaultSimulationWorkerCount()))
  const startedAt = performance.now()

  const queue: SimulationCoverageNode[] = []
  const visited = new Set<string>()

  for (const identityId of identityIds) {
    const initial = createSimulationCoverageInitialNode(pack, identityId)
    const hash = hashSimulationCoverageState(initial.state)
    if (visited.has(hash)) continue
    visited.add(hash)
    queue.push(initial)
  }

  let exploredStates = 0
  let terminalStates = 0
  let unresolvedTerminalStates = 0
  let maxDepthHits = 0
  let deadEnds = 0
  let truncated = false
  let truncatedReason: string | undefined
  let nextJobId = 1
  let finished = false
  const endings = new Map<string, SimulationCoverageEnding>()
  const unresolvedSamples: SimulationCoverageSample[] = []
  const inFlight = new Map<number, InFlightJob>()
  const workerSlots: WorkerSlot[] = []

  function recordTerminal(node: SimulationCoverageNode) {
    terminalStates += 1
    const ending = node.state.endingResult?.ending
    if (!ending) {
      unresolvedTerminalStates += 1
      if (unresolvedSamples.length < maxSamplesPerEnding) unresolvedSamples.push(makeSimulationCoverageSample(node))
      return
    }
    const current = endings.get(ending.id) ?? { endingId: ending.id, endingName: ending.name, count: 0, samples: [] }
    current.count += 1
    if (current.samples.length < maxSamplesPerEnding) current.samples.push(makeSimulationCoverageSample(node))
    endings.set(ending.id, current)
  }

  function makeReport(): ParallelSimulationCoverageReport {
    return {
      packId: pack.packId,
      identityIds,
      days,
      maxStates,
      maxDepth,
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
      workerCount,
      elapsedMs: Math.round(performance.now() - startedAt),
    }
  }

  function shouldRecordWithoutExpansion(node: SimulationCoverageNode): boolean {
    if (isSimulationCoverageTerminal(node, maxDay)) {
      recordTerminal(node)
      return true
    }
    if (node.depth >= maxDepth) {
      maxDepthHits += 1
      recordTerminal(node)
      return true
    }
    return false
  }

  function processTransitions(parent: SimulationCoverageNode, transitions: SimulationCoverageTransition[]) {
    if (transitions.length === 0) {
      deadEnds += 1
      recordTerminal(parent)
      return
    }

    for (const transition of [...transitions].reverse()) {
      const childNode: SimulationCoverageNode = {
        identityId: parent.identityId,
        state: transition.state,
        steps: [...parent.steps, transition.step],
        depth: parent.depth + 1,
      }

      if (isSimulationCoverageTerminal(childNode, maxDay)) {
        recordTerminal(childNode)
        continue
      }

      if (childNode.depth >= maxDepth) {
        maxDepthHits += 1
        recordTerminal(childNode)
        continue
      }

      if (truncated) continue

      const hash = hashSimulationCoverageState(childNode.state)
      if (visited.has(hash)) continue
      visited.add(hash)
      queue.push(childNode)
    }
  }

  async function shutdownWorkers() {
    await Promise.all(workerSlots.map((slot) => slot.worker.terminate()))
  }

  return await new Promise<ParallelSimulationCoverageReport>((resolvePromise, reject) => {
    function fail(error: unknown) {
      if (finished) return
      finished = true
      void shutdownWorkers().finally(() => reject(error))
    }

    function maybeFinish() {
      if (finished) return
      if ((queue.length > 0 && !truncated) || inFlight.size > 0) return
      finished = true
      const report = makeReport()
      void shutdownWorkers().then(() => resolvePromise(report), reject)
    }

    function dispatch() {
      if (finished) return
      for (const slot of workerSlots) {
        if (slot.busy || truncated) continue

        let node = queue.pop()
        while (node && shouldRecordWithoutExpansion(node)) {
          node = queue.pop()
        }

        if (!node) break

        if (exploredStates >= maxStates) {
          truncated = true
          truncatedReason = `达到最大探索状态数 ${maxStates}`
          queue.length = 0
          break
        }

        exploredStates += 1
        slot.busy = true
        const jobId = nextJobId
        nextJobId += 1
        inFlight.set(jobId, { node, worker: slot })
        slot.worker.postMessage({ type: 'expand', jobId, state: node.state } satisfies ExpandRequest)
      }
      maybeFinish()
    }

    for (let index = 0; index < workerCount; index += 1) {
      const slot: WorkerSlot = {
        id: index + 1,
        worker: new Worker(workerUrl, {
          workerData: { pack, includeAdvanceTime, tsconfigPath: resolve(repoRoot, 'tsconfig.base.json') },
        }),
        busy: false,
      }

      slot.worker.on('message', (message: ExpandResponse) => {
        const job = inFlight.get(message.jobId)
        if (!job) return
        inFlight.delete(message.jobId)
        job.worker.busy = false

        if (message.type === 'failed') {
          fail(new Error(`simulation worker ${job.worker.id} failed: ${message.message}\n${message.stack ?? ''}`))
          return
        }

        processTransitions(job.node, message.transitions)
        dispatch()
      })

      slot.worker.on('error', fail)
      slot.worker.on('exit', (code) => {
        if (!finished && code !== 0) fail(new Error(`simulation worker ${slot.id} exited with code ${code}`))
      })

      workerSlots.push(slot)
    }

    dispatch()
  })
}
