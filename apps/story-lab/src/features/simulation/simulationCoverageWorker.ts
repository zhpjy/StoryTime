import type { ContentPack } from '@tss/schema'
import { buildSimulationCoverageTree } from '@tss/engine'
import type { SimulationCoverageResolvedOptions, SimulationCoverageRunResult, SimulationCoverageTree } from '@tss/engine'

export type SimulationCoverageWorkerRequest = {
  type: 'run'
  pack: ContentPack
  options: SimulationCoverageResolvedOptions
}

export type SimulationCoverageWorkerResponse =
  | {
      type: 'completed'
      result: SimulationCoverageRunResult & { tree: SimulationCoverageTree }
    }
  | {
      type: 'failed'
      message: string
    }

type SimulationCoverageWorkerScope = {
  postMessage: (message: SimulationCoverageWorkerResponse) => void
  onmessage: ((event: MessageEvent<SimulationCoverageWorkerRequest>) => void) | null
}

const workerScope = self as unknown as SimulationCoverageWorkerScope

workerScope.onmessage = (event: MessageEvent<SimulationCoverageWorkerRequest>) => {
  if (event.data.type !== 'run') return
  try {
    workerScope.postMessage({
      type: 'completed',
      result: buildSimulationCoverageTree(event.data.pack, event.data.options),
    })
  } catch (error) {
    workerScope.postMessage({
      type: 'failed',
      message: error instanceof Error ? error.message : String(error),
    })
  }
}
