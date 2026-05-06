import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

test('does not subscribe to freshly allocated quest entries', () => {
  const source = readFileSync(fileURLToPath(new URL('./QuestPanel.tsx', import.meta.url)), 'utf8')

  expect(source).not.toContain('useGameStore((state) => state.getQuestEntries())')
})
