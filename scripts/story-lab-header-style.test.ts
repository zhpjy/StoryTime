import { expect, test } from 'vitest'
import { readCssWithImports } from './css-test-utils'

test('story lab page header titles use a compact size', () => {
  const css = readCssWithImports('apps/story-lab/src/styles.css')

  expect(css).toMatch(
    /\.page-header h1\s*{[^}]*font-size:\s*clamp\(1\.75rem,\s*3vw,\s*3rem\)/s
  )
  expect(css).toMatch(
    /@media[^{]+\([^)]*max-width:\s*760px[^)]*\)[\s\S]*?\.page-header h1\s*{[^}]*font-size:\s*2rem/s
  )
})
