import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

const appSource = readFileSync('apps/story-lab/src/App.tsx', 'utf8')
const typesSource = readFileSync('apps/story-lab/src/editor/types.ts', 'utf8')
const pagesSource = readFileSync('apps/story-lab/src/pages/editor/story-simulation-page.tsx', 'utf8')

test('story lab exposes an independent story simulation section', () => {
  expect(typesSource).toContain("| 'simulation'")
  expect(appSource).toContain("{ id: 'simulation', label: '剧情模拟'")
  expect(appSource).toContain('story-lab-nav-${section.id}')
  expect(appSource).toContain("activeSection === 'simulation'")
  expect(appSource).toContain('<StorySimulationPage')
})

test('story simulation page renders simulator controls and results', () => {
  expect(pagesSource).toContain('export function StorySimulationPage')
  expect(pagesSource).toContain('simulation-run-button')
  expect(pagesSource).toContain('simulation-final-summary')
  expect(pagesSource).toContain('simulation-tree-card')
  expect(pagesSource).toContain('SimulationTreeView')
  expect(pagesSource).toContain('SimulationNodeDetails')
})
