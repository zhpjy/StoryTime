import {
  UserRound
} from 'lucide-react'
import type { ContentPack, NPC } from '@tss/schema'
import { TIME_SEGMENT_LABEL } from '@tss/schema'
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/ui'
import {
  PageHeader
} from '../../components/common'
import { buildScheduleEventOverview } from '../../editor/schedule-overview'

export function SchedulePage({ pack, onSelectNpc }: { pack: ContentPack; onSelectNpc: (id: string) => void }) {
  const overview = buildScheduleEventOverview(pack)

  return (
    <>
      <PageHeader
        eyebrow="Schedule"
        testId="schedule-header"
        title="日程总览"
        description="按天和时段查看 NPC 的默认作息、地点与条件。带条件的日程代表潜在安排，运行时会根据当时世界状态判定。"
      />

      <section className="schedule-layout" data-test-id="schedule-layout">
        <section className="schedule-board event-focused" data-test-id="schedule-board">
          {overview.days.map((day) => (
            <Card key={day.day} id={`schedule-day-${day.day}`} data-test-id={`schedule-day-${day.day}`}>
              <CardHeader>
                <CardTitle>第 {day.day} 天</CardTitle>
                <Badge className={day.entryCount > 0 ? 'ok' : 'muted'} data-test-id={`schedule-day-event-count-${day.day}`}>
                  {day.eventCount} 事件
                </Badge>
              </CardHeader>
              <CardContent>
                {day.entryCount === 0 ? (
                  <p className="empty-copy" data-test-id={`schedule-day-empty-${day.day}`}>无事件 NPC</p>
                ) : (
                  <div className="schedule-segments">
                    {day.segments
                      .filter((segment) => segment.entryCount > 0)
                      .map((segment) => (
                        <div key={segment.segment} className="schedule-segment" data-test-id={`schedule-day-${day.day}-segment-${segment.segment}`}>
                          <div className="schedule-segment-head" data-test-id={`schedule-day-${day.day}-segment-head-${segment.segment}`}>
                            <strong data-test-id={`schedule-segment-label-${day.day}-${segment.segment}`}>{TIME_SEGMENT_LABEL[segment.segment]}</strong>
                            <Badge data-test-id={`schedule-entry-count-${day.day}-${segment.segment}`}>{segment.entryCount} NPC</Badge>
                          </div>
                          <div className="schedule-entry-list" data-test-id={`schedule-entry-list-${day.day}-${segment.segment}`}>
                            {segment.entries.map((entry) => (
                              <button key={entry.id} className="schedule-entry" data-test-id={`schedule-entry-${entry.id}`} type="button" onClick={() => onSelectNpc(entry.npcId)}>
                                <UserRound size={16} />
                                <span data-test-id={`schedule-entry-main-${entry.id}`}>
                                  <strong data-test-id={`schedule-entry-npc-${entry.id}`}>{entry.npcName}</strong>
                                  <small data-test-id={`schedule-entry-detail-${entry.id}`}>{entry.locationName ?? entry.locationId ?? '-'} / {entry.sourceName}</small>
                                  <small data-test-id={`schedule-entry-events-${entry.id}`}>{entry.eventNames.join(' / ')}</small>
                                </span>
                                <span className="schedule-entry-meta" data-test-id={`schedule-entry-meta-${entry.id}`}>
                                  <Badge data-test-id={`schedule-entry-source-${entry.id}`}>{entry.sourceKind === 'schedule' ? '日程' : '行为'}</Badge>
                                  {entry.conditionCount > 0 && <Badge data-test-id={`schedule-entry-condition-count-${entry.id}`}>条件 {entry.conditionCount}</Badge>}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </section>

        <nav className="schedule-timeline" aria-label="日程日期时间轴" data-test-id="schedule-timeline">
          <div className="schedule-timeline-list" data-test-id="schedule-timeline-list">
            {overview.days.map((day) => (
              <a
                key={day.day}
                className={day.entryCount > 0 ? 'schedule-timeline-item has-events' : 'schedule-timeline-item'}
                aria-label={`第 ${day.day} 天，${day.eventCount} 个事件`}
                data-test-id={`schedule-timeline-day-${day.day}`}
                href={`#schedule-day-${day.day}`}
              >
                <span data-test-id={`schedule-timeline-day-label-${day.day}`}>{day.day} 日</span>
              </a>
            ))}
          </div>
        </nav>
      </section>
    </>
  )
}
