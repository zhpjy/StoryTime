import type { StoryProject } from '../apps/story-lab/src/editor/types'
import { getDefaultStoryProject, orderStoryProjects } from '../apps/story-lab/src/editor/project-selection'
import { expect, test } from 'vitest'

function project(id: string): StoryProject {
  return {
    id,
    name: id,
    description: '',
    owner: '',
    status: id === 'starter' ? 'draft' : 'reviewing',
    updatedAt: '2026-04-29',
    pack: {} as StoryProject['pack'],
  }
}

test('story projects are ordered with selected content before templates', () => {
  expect(
    orderStoryProjects([project('sample-content')], [project('starter'), project('other-template')]).map((item) => item.id),
  ).toEqual(['sample-content', 'other-template', 'starter'])
})

test('default story project prefers non-starter content when present', () => {
  expect(getDefaultStoryProject([project('starter'), project('sample-content')])?.id).toBe('sample-content')
  expect(getDefaultStoryProject([project('starter')])?.id).toBe('starter')
  expect(getDefaultStoryProject([])).toBeUndefined()
})
