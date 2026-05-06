import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

const source = readFileSync(fileURLToPath(new URL('./ConversationPanel.tsx', import.meta.url)), 'utf8')

test('formats player reply labels with the identity required by reply conditions', () => {
  expect(source).toContain('formatPlayerReplyText(reply.text, reply.conditions, identityLabels)')
  expect(source).toContain("condition.fact === 'player.identity'")
  expect(source).toContain('condition.equals')
})

test('looks up reply identity labels from content data', () => {
  expect(source).toContain('formatPlayerReplyText(reply.text, reply.conditions, identityLabels)')
  expect(source).toContain('new Map(pack.identities.map')
  expect(source).not.toContain("'行商'")
  expect(source).not.toContain('"行商"')
})

test('hides unavailable replies and condition reasons unless debug mode is enabled', () => {
  expect(source).toContain('const debugMode = useGameStore((state) => state.debugMode)')
  expect(source).toContain('if (!debugMode && !availability.available) return null')
  expect(source).toContain('{debugMode && !availability.available &&')
})

test('hides unavailable conversation topics and topic reasons unless debug mode is enabled', () => {
  expect(source).toContain('const visibleEntries = debugMode ? entries : entries.filter((entry) => entry.available)')
  expect(source).toContain('{visibleEntries.length === 0 &&')
  expect(source).toContain('{visibleEntries.map(({ conversation, available, reasons, visited }) =>')
  expect(source).toContain('{debugMode && !available &&')
})
