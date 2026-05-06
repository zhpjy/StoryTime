import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from 'vitest'

const conversationsRoot = 'content/qinglan-town/npcs'
const conversationFiles = readdirSync(conversationsRoot)
  .map((name) => join(conversationsRoot, name, 'conversations.yaml'))
  .filter((path) => {
    try {
      return statSync(path).isFile()
    } catch {
      return false
    }
  })

test('qinglan town player replies do not embed identity self-introductions', () => {
  const combined = conversationFiles.map((path) => readFileSync(path, 'utf8')).join('\n')

  expect(combined).not.toMatch(/我是(?:行商|武人|医者)/)
})
