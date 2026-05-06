import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

const source = readFileSync(fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8')

test('does not automatically load saves after selecting a story pack', () => {
  expect(source).not.toContain('initializeGameStore(contentPack)\n      loadSavedGame()')
})

test('routes resumable saves through the save start choice page', () => {
  expect(source).toContain('SaveStartPage')
})
