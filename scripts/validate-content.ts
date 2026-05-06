import { resolve } from 'node:path'
import { validateContentPack } from '@tss/validator'
import { defaultContentRoot, discoverContentSourceDirs, loadContentPackFromSource } from './content-source'

const contentDirs = process.argv[2] ? [resolve(process.argv[2])] : await discoverContentSourceDirs(defaultContentRoot)
if (contentDirs.length === 0) {
  throw new Error(`${defaultContentRoot} 下没有找到包含 world.yaml 的内容包源目录`)
}
const reports = await Promise.all(contentDirs.map(async (contentDir) => validateContentPack(await loadContentPackFromSource(contentDir))))
console.log(JSON.stringify(reports.length === 1 ? reports[0] : reports, null, 2))

if (reports.some((report) => report.errors.some((item) => item.severity === 'error'))) {
  process.exitCode = 1
}
