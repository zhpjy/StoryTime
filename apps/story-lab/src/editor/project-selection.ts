import type { StoryProject } from './types'

const BLANK_TEMPLATE_PROJECT_ID = 'starter'

export function getDefaultStoryProject(projects: StoryProject[]) {
  return projects.find((project) => project.id !== BLANK_TEMPLATE_PROJECT_ID) ?? projects[0]
}

export function orderStoryProjects(filesystemProjects: StoryProject[], builtInProjects: StoryProject[]) {
  const projects = [...filesystemProjects, ...builtInProjects]
  const blankTemplate = projects.find((project) => project.id === BLANK_TEMPLATE_PROJECT_ID)
  return blankTemplate ? [...projects.filter((project) => project.id !== BLANK_TEMPLATE_PROJECT_ID), blankTemplate] : projects
}
