import { loadDefaultContentPackArtifact } from './content-pack-artifact'
import { getDefaultSimulationWorkerCount, simulateCoverageParallel } from './simulation-coverage-parallel'

function getNumberArg(name: string, fallback: number): number {
  const prefix = `--${name}=`
  const raw = process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length)
  if (!raw) return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}

const identityArg = process.argv.find((arg) => arg.startsWith('--identity='))?.slice('--identity='.length)
const identityIds = identityArg ? identityArg.split(',').map((item) => item.trim()).filter(Boolean) : undefined
const contentPack = loadDefaultContentPackArtifact()
const report = await simulateCoverageParallel(contentPack, {
  identityIds,
  days: getNumberArg('days', contentPack.world.maxDays),
  maxStates: getNumberArg('max-states', 5000),
  maxDepth: getNumberArg('max-depth', contentPack.world.maxDays * contentPack.world.segments.length * (contentPack.world.actionPointsPerSegment + 1) + 20),
  maxSamplesPerEnding: getNumberArg('samples', 2),
  workers: getNumberArg('workers', getDefaultSimulationWorkerCount()),
})

console.log(`内容包：${report.packId}`)
console.log(`身份：${report.identityIds.join(', ')}`)
console.log(`线程：${report.workerCount}，耗时：${report.elapsedMs}ms`)
console.log(`覆盖：探索 ${report.exploredStates} 个状态，发现 ${report.uniqueStates} 个非终止唯一状态，终止 ${report.terminalStates} 个分支`)
console.log(`上限：days=${report.days} max-states=${report.maxStates}（探索状态） max-depth=${report.maxDepth} samples=${getNumberArg('samples', 2)}`)
if (report.truncated) console.log(`截断：${report.truncatedReason}`)
if (report.maxDepthHits > 0) console.log(`深度上限命中：${report.maxDepthHits}`)
if (report.deadEnds > 0) console.log(`死路状态：${report.deadEnds}`)
if (report.unresolvedTerminalStates > 0) console.log(`未判定终止分支：${report.unresolvedTerminalStates}`)

console.log('\n结局覆盖：')
if (report.endings.length === 0) {
  console.log('未触达任何结局')
} else {
  console.table(report.endings.map((ending) => ({
    endingId: ending.endingId,
    endingName: ending.endingName,
    branches: ending.count,
  })))
}

for (const ending of report.endings) {
  const sample = ending.samples[0]
  if (!sample) continue
  const path = sample.steps
    .slice(0, 12)
    .map((step) => `[D${step.day}-${step.segment}] ${step.name}`)
    .join(' -> ')
  const suffix = sample.stepCount > 12 ? ` -> ...（共 ${sample.stepCount} 步）` : ''
  console.log(`\n样例路径：${ending.endingName}`)
  console.log(path ? `${path}${suffix}` : '初始状态直接到达')
  console.log('最近日志：')
  console.log(sample.recentLogs.join('\n'))
}

if (report.unresolvedSamples.length > 0) {
  const sample = report.unresolvedSamples[0]
  console.log('\n未判定样例：')
  console.log(`身份 ${sample.identityId}，停在 D${sample.finalDay}-${sample.finalSegment}，地点 ${sample.finalLocationId}，步数 ${sample.stepCount}`)
  console.log(sample.recentLogs.join('\n'))
}
