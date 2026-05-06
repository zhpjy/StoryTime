import {
  AlertTriangle,
  GitBranch,
} from 'lucide-react'
import type { ContentPack, GameEvent, NPC, GameRuntimeState } from '@tss/schema'
import { evaluateCondition, explainConditionFailures } from '@tss/engine'
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/ui'
import {
  CodeBlock,
  Definition,
  FlowNode,
  PageHeader,
  StatusDot
} from '../../components/common'
import {
  conditionFacts,
  inferEndingImpact,
  summarizeEffect
} from '../../editor/helpers'

export function EventGraphPage({
  event,
  failures,
  initialState,
  isReady,
  pack,
  onSelectEvent,
}: {
  event: GameEvent
  failures: ReturnType<typeof explainConditionFailures>
  initialState: GameRuntimeState
  isReady: boolean
  pack: ContentPack
  onSelectEvent: (id: string) => void
}) {
  const participants = event.participantIds.map((id) => pack.npcs.find((npc) => npc.id === id)?.name ?? id)
  const location = event.locationId ? pack.locations.find((item) => item.id === event.locationId) : undefined
  const followups = event.followupEventIds.map((id) => pack.events.find((item) => item.id === id)?.name ?? id)

  return (
    <>
      <PageHeader
        eyebrow="Event Graph"
        testId="events-header"
        title="事件与分支"
        description={`${event.name} / ${event.type}`}
      />

      <section className="studio-layout" data-test-id="events-layout">
        <Card data-test-id="events-list-card">
          <CardHeader>
            <CardTitle>事件列表</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="object-list">
              {pack.events.map((item) => {
                const ready = evaluateCondition(item.trigger, initialState)
                return (
                  <button key={item.id} className={item.id === event.id ? 'object-row is-selected' : 'object-row'} data-test-id={`event-select-${item.id}`} type="button" onClick={() => onSelectEvent(item.id)}>
                    <GitBranch size={16} />
                    <span>{item.name}</span>
                    <Badge className={ready ? 'ok' : 'muted'} data-test-id={`event-ready-${item.id}`}>{ready ? '可触发' : '等待'}</Badge>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card data-test-id="event-detail-card">
          <CardHeader>
            <CardTitle>{event.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="event-status">
              <StatusDot state={isReady ? 'accepted' : 'reviewing'} />
              <strong>{isReady ? '当前初始状态可触发' : '当前初始状态未触发'}</strong>
              <span>{location?.name ?? '全局事件'}</span>
            </div>
            <p className="lead-text">{event.description}</p>
            <div className="definition-grid">
              <Definition label="事件 ID" value={event.id} />
              <Definition label="参与 NPC" value={participants.join('、') || '-'} />
              <Definition label="后续事件" value={followups.join('、') || '-'} />
              <Definition label="事件效果" value={event.effects.length} />
            </div>

            {failures.length > 0 && (
              <div className="failure-list">
                {failures.map((failure, index) => (
                  <div key={`${failure.fact}-${index}`} className="failure-row">
                    <AlertTriangle size={16} />
                    <span>{failure.fact ?? '条件'}：需要 {failure.expected}，当前 {String(failure.actual)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="event-flow">
              <FlowNode title="前置条件" value={conditionFacts(event.trigger).join(', ') || '无'} />
              <FlowNode title="事件效果" value={event.effects.map(summarizeEffect).join(' / ') || '无'} />
              <FlowNode title="后续 followups" value={followups.join(' / ') || '无'} />
              <FlowNode title="影响结局" value={inferEndingImpact(pack, event).join(' / ') || '间接影响变量'} />
            </div>

            <div className="split-content">
              <div>
                <h3>原始结构</h3>
                <CodeBlock value={{ trigger: event.trigger, effects: event.effects, followupEventIds: event.followupEventIds }} compact />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  )
}
