import { expect, test } from 'vitest'
import { readCssWithImports } from './css-test-utils'

const styleFiles = [
  'apps/game-client/src/styles.css',
  'apps/story-lab/src/styles.css',
]

test('apps use the bundled LXGW WenKai font as the default font', () => {
  for (const file of styleFiles) {
    const css = readCssWithImports(file)

    expect(css, `${file} should register the local font asset`).toContain(
      '@font-face'
    )
    expect(css, `${file} should load the bundled font file`).toContain('LXGWWenKai-Medium.ttf')
    expect(css, `${file} should define the default root font first`).toMatch(
      /:root\s*{[^}]*font-family:\s*"LXGW WenKai"/s
    )
  }
})
