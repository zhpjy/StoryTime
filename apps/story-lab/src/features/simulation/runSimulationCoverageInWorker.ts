import type { ContentPack } from '@tss/schema'
import type { SimulationCoverageResolvedOptions, SimulationCoverageRunResult, SimulationCoverageTree } from '@tss/engine'
import type { SimulationCoverageWorkerRequest, SimulationCoverageWorkerResponse } from './simulationCoverageWorker'

export class SimulationCoverageWorkerCancelledError extends Error {
  constructor() {
    super('simulation coverage worker cancelled')
    this.name = 'SimulationCoverageWorkerCancelledError'
  }
}

export function isSimulationCoverageWorkerCancelled(error: unknown): boolean {
  return error instanceof SimulationCoverageWorkerCancelledError
}

export function runSimulationCoverageInWorker(
  pack: ContentPack,
  options: SimulationCoverageResolvedOptions,
  onCancelReady?: (cancel: () => void) => void,
): Promise<SimulationCoverageRunResult & { tree: SimulationCoverageTree }> {
  const worker = new Worker(new URL('./simulationCoverageWorker.ts', import.meta.url), { type: 'module' })

  return new Promise((resolve, reject) => {
    let settled = false

    function cleanup() {
      worker.onmessage = null
      worker.onerror = null
      worker.terminate()
    }

    onCancelReady?.(() => {
      if (settled) return
      settled = true
      cleanup()
      reject(new SimulationCoverageWorkerCancelledError())
    })

    worker.onmessage = (event: MessageEvent<SimulationCoverageWorkerResponse>) => {
      if (settled) return
      settled = true
      cleanup()
      if (event.data.type === 'failed') {
        reject(new Error(event.data.message))
        return
      }
      resolve(event.data.result)
    }

    worker.onerror = (event) => {
      if (settled) return
      settled = true
      cleanup()
      reject(new Error(event.message || 'simulation worker failed'))
    }

    worker.postMessage({ type: 'run', pack, options } satisfies SimulationCoverageWorkerRequest)
  })
}
