import { workerData } from 'node:worker_threads'
import { register } from 'tsx/esm/api'

register({ tsconfig: workerData.tsconfigPath })

await import(new URL('./simulation-coverage-worker.ts', import.meta.url))
