import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Download,
  GitBranch,
  Map as MapIcon,
  Target,
  UserRound
} from 'lucide-react'
import type { ContentPack, NPC } from '@tss/schema'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/ui'
import {
  Definition,
  Metric,
  PageHeader,
  SeverityTile,
  StatusDot
} from '../../components/common'
import {
  countBucket,
  pipelineCopy
} from '../../editor/helpers'
import { buildDashboardOverview } from '../../editor/dashboard-overview'
import type { StoryProject } from '../../editor/types'
import {
  contentStatus,
  issueBuckets,
  ValidationReport
} from './shared'

export function DashboardPage({
  activePack,
  activeProject,
  report,
  reviewState,
  severity,
  onDownload,
  onOpenValidation,
  onSelectLocation,
}: {
  activePack: ContentPack
  activeProject: StoryProject
  report: ValidationReport
  reviewState: string
  severity: Record<string, number>
  onDownload: () => void
  onOpenValidation: () => void
  onSelectLocation: (locationId: string) => void
}) {
  const topLocations = activePack.locations.slice(0, 6)
  const overview = buildDashboardOverview(activeProject, activePack, report)

  return (
    <>
      <PageHeader
        eyebrow="Current Story"
        testId="story-overview-header"
        title={activeProject.name}
        description={`${activePack.world.name} / ${activePack.packId}`}
        actions={
          <div className="overview-actions" data-test-id="story-overview-actions">
            <Badge className={overview.status} data-test-id="story-overview-status">
              {overview.status}
            </Badge>
            <Button className="secondary" onClick={onOpenValidation} data-test-id="story-overview-validation-button">
              <ClipboardCheck size={16} />
              剧情校验
            </Button>
            <Button className="primary" onClick={onDownload} data-test-id="story-overview-export-button">
              <Download size={16} />
              导出当前故事
            </Button>
          </div>
        }
      />

      <section className="metric-grid compact" data-test-id="story-overview-metrics">
        <Metric icon={MapIcon} label="地点" value={overview.metrics.locations} tone="violet" testId="story-overview-metric-locations" />
        <Metric icon={UserRound} label="NPC" value={overview.metrics.npcs} tone="amber" testId="story-overview-metric-npcs" />
        <Metric icon={GitBranch} label="事件" value={overview.metrics.events} tone="green" testId="story-overview-metric-events" />
        <Metric icon={Target} label="结局" value={overview.metrics.endings} tone="cyan" testId="story-overview-metric-endings" />
        <Metric icon={ClipboardCheck} label="待处理" value={overview.metrics.issues} tone="rose" testId="story-overview-metric-issues" />
      </section>

      <section className="dashboard-grid top-gap" data-test-id="story-overview-dashboard-grid">
        <Card className="span-2" data-test-id="story-overview-summary-card">
          <CardHeader>
            <CardTitle>当前故事</CardTitle>
            <Badge className={activeProject.status} data-test-id="story-overview-project-status">
              {activeProject.status}
            </Badge>
          </CardHeader>
          <CardContent>
            <p className="lead-text" data-test-id="story-overview-description">{activeProject.description}</p>
            <div className="definition-grid compact top-gap" data-test-id="story-overview-summary-fields">
              <Definition label="世界" value={activePack.world.name} testId="story-overview-field-world" />
              <Definition label="负责人" value={activeProject.owner} testId="story-overview-field-owner" />
              <Definition label="更新" value={activeProject.updatedAt} testId="story-overview-field-updated-at" />
              <Definition label="版本" value={activePack.version} testId="story-overview-field-version" />
              <Definition label="Schema" value={activePack.schemaVersion} testId="story-overview-field-schema" />
              <Definition label="天数" value={activePack.world.maxDays} testId="story-overview-field-max-days" />
              <Definition label="时段" value={activePack.world.segments.length} testId="story-overview-field-segments" />
              <Definition label="行动点" value={activePack.world.actionPointsPerSegment} testId="story-overview-field-action-points" />
            </div>
          </CardContent>
        </Card>

        <Card className="span-2" data-test-id="story-overview-pipeline-card">
          <CardHeader>
            <CardTitle>当前故事状态流</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="pipeline" data-test-id="story-overview-pipeline">
              {contentStatus.map((status) => (
                <div
                  key={status}
                  className={status === reviewState ? 'pipeline-step is-current' : 'pipeline-step'}
                  data-test-id={`story-overview-pipeline-${status}`}
                >
                  <StatusDot state={status} />
                  <strong>{status}</strong>
                  <small>{pipelineCopy(status)}</small>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card data-test-id="story-overview-validation-card">
          <CardHeader>
            <CardTitle>校验摘要</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="severity-grid" data-test-id="story-overview-severity-grid">
              <SeverityTile label="错误" value={severity.error ?? 0} tone="danger" />
              <SeverityTile label="警告" value={severity.warning ?? 0} tone="warning" />
              <SeverityTile label="信息" value={severity.info ?? 0} tone="info" />
            </div>
            <div className="checklist" data-test-id="story-overview-issue-buckets">
              {issueBuckets.map((bucket) => {
                const count = countBucket([...report.errors, ...report.gaps], bucket.match)
                return (
                  <div key={bucket.label} className="check-row" data-test-id={`story-overview-issue-bucket-${bucket.match[0]}`}>
                    {count === 0 ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    <span>{bucket.label}</span>
                    <Badge className={count === 0 ? 'ok' : 'warn'} data-test-id={`story-overview-issue-bucket-count-${bucket.match[0]}`}>{count}</Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card data-test-id="story-overview-locations-card">
          <CardHeader>
            <CardTitle>核心地点</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="location-shortcuts" data-test-id="story-overview-location-list">
              {topLocations.map((location) => (
                <button
                  key={location.id}
                  className="shortcut-row"
                  data-test-id={`story-overview-location-${location.id}`}
                  type="button"
                  onClick={() => onSelectLocation(location.id)}
                >
                  <MapIcon size={16} />
                  <span>{location.name}</span>
                  <small>{location.type}</small>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  )
}
