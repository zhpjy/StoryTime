import type { ContentPack, ValidationReport } from '@tss/schema'
import type { StoryProject } from './types'

export type DashboardOverview = {
  metrics: {
    locations: number
    npcs: number
    interactions: number
    quests: number
    events: number
    endings: number
    issues: number
  }
  status: StoryProject['status'] | 'needs_fix' | 'reviewing'
}

export function getDashboardStatus(report: ValidationReport, fallback: StoryProject['status']) {
  if (report.errors.some((issue) => issue.severity === 'error')) return 'needs_fix'
  if (report.errors.length > 0 || report.gaps.length > 0) return 'reviewing'
  return fallback
}

export function buildDashboardOverview(
  activeProject: StoryProject,
  activePack: ContentPack,
  report: ValidationReport,
): DashboardOverview {
  return {
    metrics: {
      locations: activePack.locations.length,
      npcs: activePack.npcs.length,
      interactions: activePack.interactions.length,
      quests: activePack.quests.length,
      events: activePack.events.length,
      endings: activePack.endings.length,
      issues: report.errors.length + report.gaps.length,
    },
    status: getDashboardStatus(report, activeProject.status),
  }
}
