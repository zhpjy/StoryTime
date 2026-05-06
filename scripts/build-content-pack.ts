import { resolve } from 'node:path'
import { defaultContentRoot, discoverContentSourceDirs, loadContentPackFromSource, writeContentPackArtifacts } from './content-source'

const contentRoot = resolve(process.argv[2] ?? defaultContentRoot)
const contentDirs = await discoverContentSourceDirs(contentRoot)
if (contentDirs.length === 0) {
  throw new Error(`${contentRoot} 下没有找到包含 world.yaml 的内容包源目录`)
}
const packs = await Promise.all(contentDirs.map((contentDir) => loadContentPackFromSource(contentDir)))
const result = await writeContentPackArtifacts(packs)

console.log(`已从 ${contentRoot} 生成 ${packs.length} 个内容包：`)
for (const packPath of result.staticContentPackJsonPaths) {
  console.log(`- ${packPath}`)
}
console.log(`- ${result.staticManifestPath}`)
