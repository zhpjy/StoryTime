import type { ContentPack } from '@tss/schema'
import { parse as parseYaml } from 'yaml'

export function importContentPack(raw: string): ContentPack {
  const data = parseYaml(raw) as unknown
  if (!data || typeof data !== 'object' || !('packId' in data) || !Array.isArray((data as ContentPack).locations)) {
    throw new Error('不是合法的 ContentPack YAML/JSON')
  }
  return data as ContentPack
}

export function exportContentPack(pack: ContentPack): string {
  return JSON.stringify(pack, null, 2)
}

