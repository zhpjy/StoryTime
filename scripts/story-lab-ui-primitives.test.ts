import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

test('story lab ui primitives use shadcn-style foundations', () => {
  const uiSource = readFileSync('apps/story-lab/src/components/ui.tsx', 'utf8')
  const cnSource = readFileSync('apps/story-lab/src/lib/cn.ts', 'utf8')

  expect(uiSource, 'Button should support shadcn asChild through Slot').toMatch(/@radix-ui\/react-slot/)
  expect(uiSource, 'UI primitives should use cva variants').toMatch(/class-variance-authority/)
  expect(uiSource, 'Button variants should be centralized').toMatch(/buttonVariants/)
  expect(uiSource, 'Badge variants should be centralized').toMatch(/badgeVariants/)
  expect(uiSource, 'UI primitives should document or pass through test IDs').toMatch(/data-test-id/)
  expect(cnSource, 'cn should merge Tailwind-style classes').toMatch(/tailwind-merge/)
  expect(cnSource, 'cn should normalize conditional class inputs').toMatch(/clsx/)
})
