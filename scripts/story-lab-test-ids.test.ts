import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from 'vitest'

const storyLabSourceRoot = 'apps/story-lab/src'

function source(path: string) {
  return readFileSync(join(storyLabSourceRoot, path), 'utf8')
}

function tags(content: string, tagName: string) {
  return content.match(new RegExp(`<${tagName}\\b[\\s\\S]*?>`, 'g')) ?? []
}

function assertEveryTagHasTestId(file: string, tagName: string) {
  const missing = tags(source(file), tagName).filter((tag) => !tag.includes('data-test-id'))
  expect(missing, `${file} has <${tagName}> elements without data-test-id`).toEqual([])
}

test('story lab native controls include data-test-id', () => {
  const files = ['App.tsx', 'components/common.tsx', 'components/ui.tsx', 'pages/editor-pages.tsx']
  for (const file of files) {
    assertEveryTagHasTestId(file, 'button')
    assertEveryTagHasTestId(file, 'select')
  }
})
