import type { ContentPack, GameLog, GameRuntimeState, MapTile, RelationshipState, TimeSegment } from '@tss/schema'

export function cloneState<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function makeLog(state: GameRuntimeState, type: GameLog['type'], message: string, detail?: string): GameLog {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    day: state.time.day,
    segment: state.time.segment,
    type,
    message,
    detail,
  }
}

export function relationKey(sourceId: string, targetId: string): string {
  return `${sourceId}:${targetId}`
}

export function ensureRelationship(state: GameRuntimeState, sourceId: string, targetId: string): RelationshipState {
  const key = relationKey(sourceId, targetId)
  const current = state.worldState.relationships[key]
  if (current) return current
  const created: RelationshipState = {
    sourceId,
    targetId,
    value: 0,
    trust: 0,
    fear: 0,
    gratitude: 0,
    suspicion: 0,
    tags: [],
  }
  state.worldState.relationships[key] = created
  return created
}

export function getByPath(root: unknown, path: string): unknown {
  if (!path) return root
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc === null || acc === undefined) return undefined
    if (typeof acc !== 'object') return undefined
    return (acc as Record<string, unknown>)[part]
  }, root)
}

export function setByPath(root: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.')
  let current: Record<string, unknown> = root
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index]
    const next = current[part]
    if (!next || typeof next !== 'object') current[part] = {}
    current = current[part] as Record<string, unknown>
  }
  current[parts[parts.length - 1]] = value
}

export function changeNumberByPath(root: Record<string, unknown>, path: string, delta: number): number {
  const current = getByPath(root, path)
  const next = (typeof current === 'number' ? current : 0) + delta
  setByPath(root, path, next)
  return next
}

export function clampVariable(pack: ContentPack, key: string, value: number): number {
  const def = pack.variables.find((item) => item.key === key)
  const min = def?.min ?? 0
  const max = def?.max ?? 999
  return Math.max(min, Math.min(max, Math.round(value)))
}

export function getMainMap(pack: ContentPack) {
  return pack.maps[0]
}

export function getTileWithRuntime(state: GameRuntimeState, tile: MapTile): MapTile {
  const override = state.worldState.tileOverrides[tile.id] ?? {}
  return { ...tile, ...override }
}

export function getTileByLocation(pack: ContentPack, locationId: string): MapTile | undefined {
  return getMainMap(pack).tiles.find((tile) => tile.locationId === locationId)
}

export function getLocationTile(pack: ContentPack, state: GameRuntimeState, locationId: string): MapTile | undefined {
  const tile = getTileByLocation(pack, locationId)
  return tile ? getTileWithRuntime(state, tile) : undefined
}

export function nextSegment(segment: TimeSegment): TimeSegment {
  if (segment === 'morning') return 'noon'
  if (segment === 'noon') return 'night'
  return 'morning'
}

export function segmentDidAdvanceDay(segment: TimeSegment): boolean {
  return segment === 'night'
}
