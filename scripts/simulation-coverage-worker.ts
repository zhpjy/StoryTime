import { parentPort, workerData } from 'node:worker_threads'
import type { ContentPack, GameRuntimeState } from '@tss/schema'
import type { SimulationCoverageTransition } from '@tss/engine'
import { expandSimulationCoverageState } from '@tss/engine'

type WorkerPayload = {
  pack: ContentPack
  includeAdvanceTime: boolean
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

const payload = workerData as WorkerPayload

if (!parentPort) {
  throw new Error('simulation coverage worker must run inside a Worker thread')
}

parentPort.on('message', (message: ExpandRequest) => {
  if (message.type !== 'expand') return
  try {
    parentPort?.postMessage({
      type: 'expanded',
      jobId: message.jobId,
      transitions: expandSimulationCoverageState(payload.pack, message.state, payload.includeAdvanceTime),
    } satisfies ExpandResponse)
  } catch (error) {
    parentPort?.postMessage({
      type: 'failed',
      jobId: message.jobId,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    } satisfies ExpandResponse)
  }
})
