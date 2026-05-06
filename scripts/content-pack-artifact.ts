import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { ContentPack } from '@tss/schema'
import { defaultContentPackDir } from './content-source'

type ContentPackManifest = {
  defaultPackId?: string
  packs: Array<{ packId: string }>
}

export function loadDefaultContentPackArtifact(): ContentPack {
  const manifest = JSON.parse(readFileSync(resolve(defaultContentPackDir, 'manifest.json'), 'utf8')) as ContentPackManifest
  const defaultPackId = manifest.defaultPackId ?? manifest.packs[0]?.packId
  if (!defaultPackId) {
    throw new Error('content/packs/manifest.json 中没有可加载的默认内容包')
  }
  return JSON.parse(readFileSync(resolve(defaultContentPackDir, `${defaultPackId}.json`), 'utf8')) as ContentPack
}
