import {
  Database,
  Eye,
  GitBranch,
  Network,
  PackageCheck,
  Target,
  UserRound
} from 'lucide-react'
import type {
  ContentPack,
  Conversation,
  GameEvent,
  Location,
  NPC,
  ValidationIssue
} from '@tss/schema'
import { TIME_SEGMENT_LABEL, TIME_SEGMENTS } from '@tss/schema'
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
  ConversationList,
  EmptyState,
  IssueList,
  PageHeader,
  ProgressBar,
  StoryBlock,
  TextStack
} from '../../components/common'
import type { NpcTabId } from '../../editor/types'
import {
  npcTabs
} from './shared'

export function NpcStudioPage({
  activeTab,
  issues,
  npc,
  pack,
  onSelectNpc,
  onSelectTab,
}: {
  npc: NPC
  pack: ContentPack
  activeTab: NpcTabId
  issues: ValidationIssue[]
  onSelectNpc: (id: string) => void
  onSelectTab: (tab: NpcTabId) => void
}) {
  const faction = pack.factions.find((item) => item.id === npc.faction)
  const location = pack.locations.find((item) => item.id === npc.location)
  const conversations = pack.conversations.filter((conversation) => conversation.npcId === npc.id)
  const interactions = pack.interactions.filter((interaction) => interaction.targetType === 'npc' && interaction.targetId === npc.id)
  const events = pack.events.filter((event) => event.participantIds.includes(npc.id))
  const relationships = npc.relationships.map((relationship) => ({
    ...relationship,
    targetName: pack.npcs.find((item) => item.id === relationship.targetId)?.name ?? relationship.targetId,
  }))
  const conversationTargetIds = new Set(conversations.flatMap((conversation) => [conversation.id, ...conversation.nodes.flatMap((node) => [node.id, ...node.replies.map((reply) => reply.id)])]))
  const npcIssues = issues.filter((issue) => issue.targetId === npc.id || Boolean(issue.targetId && conversationTargetIds.has(issue.targetId)))

  return (
    <>
      <PageHeader
        eyebrow="NPC Studio"
        testId="npc-header"
        title="NPC 管理"
        description={`${npc.name} / ${npc.identity} / ${npc.tier}`}
      />

      <section className="studio-layout" data-test-id="npc-layout">
        <Card data-test-id="npc-list-card">
          <CardHeader>
            <CardTitle>NPC 列表</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="object-list">
              {pack.npcs.map((item) => (
                <button key={item.id} className={item.id === npc.id ? 'object-row is-selected' : 'object-row'} data-test-id={`npc-select-${item.id}`} type="button" onClick={() => onSelectNpc(item.id)}>
                  <UserRound size={16} />
                  <span>{item.name}</span>
                  <Badge data-test-id={`npc-tier-${item.id}`}>{item.tier}</Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card data-test-id="npc-detail-card">
          <CardHeader>
            <CardTitle>{npc.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="tab-strip">
              {npcTabs.map((tab) => (
                <button key={tab.id} className={activeTab === tab.id ? 'tab-button is-active' : 'tab-button'} data-test-id={`npc-tab-${tab.id}`} type="button" onClick={() => onSelectTab(tab.id)}>
                  {tab.label}
                </button>
              ))}
            </div>
            <NpcTabContent
              activeTab={activeTab}
              conversations={conversations}
              events={events}
              faction={faction}
              issues={npcIssues}
              location={location}
              npc={npc}
              pack={pack}
              interactions={interactions}
              relationships={relationships}
            />
          </CardContent>
        </Card>
      </section>
    </>
  )
}

function NpcTabContent({
  activeTab,
  conversations,
  events,
  faction,
  issues,
  location,
  npc,
  pack,
  interactions,
  relationships,
}: {
  activeTab: NpcTabId
  conversations: Conversation[]
  events: GameEvent[]
  faction?: ContentPack['factions'][number]
  issues: ValidationIssue[]
  location?: Location
  npc: NPC
  pack: ContentPack
  interactions: ContentPack['interactions']
  relationships: Array<NPC['relationships'][number] & { targetName: string }>
}) {
  if (activeTab === 'basic') {
    return (
      <div className="detail-panel">
        <div className="npc-portrait-panel" data-test-id="npc-portrait">
          {npc.portrait ? (
            <img className="npc-portrait-image" data-test-id="npc-portrait-image" src={npc.portrait} alt={`${npc.name} 立绘`} />
          ) : (
            <div className="npc-portrait-placeholder" data-test-id="npc-portrait-placeholder">
              <UserRound size={44} />
            </div>
          )}
        </div>
        <div className="definition-grid">
          <Definition label="ID" value={npc.id} />
          <Definition label="年龄" value={npc.age} />
          <Definition label="身份" value={npc.identity} />
          <Definition label="层级" value={npc.tier} />
          <Definition label="势力" value={faction?.name ?? npc.faction} />
          <Definition label="地点" value={location?.name ?? npc.location} />
          <Definition label="交互" value={interactions.length} />
        </div>
        {npc.designNote && <p className="lead-text">{npc.designNote}</p>}
      </div>
    )
  }

  if (activeTab === 'origin') {
    return <TextStack items={[`当前公开身份：${npc.identity}`, `所属势力：${faction?.name ?? npc.faction}`, `常驻地点：${location?.name ?? npc.location}`]} />
  }

  if (activeTab === 'background') {
    return (
      <div className="story-stack">
        <StoryBlock title="公开故事" text={npc.background?.publicStory ?? '未填写'} />
        <StoryBlock title="私下故事" text={npc.background?.privateStory ?? '未填写'} />
        <StoryBlock title="隐藏故事" text={npc.background?.hiddenStory ?? '未填写'} />
      </div>
    )
  }

  if (activeTab === 'personality') {
    return (
      <div className="variable-list">
        {Object.entries(npc.personality).map(([key, value]) => (
          <div key={key} className="variable-row">
            <div className="variable-head">
              <strong>{key}</strong>
              <span>{value}</span>
            </div>
            <ProgressBar value={value} />
          </div>
        ))}
      </div>
    )
  }

  if (activeTab === 'state') return <CodeBlock value={npc.state} />
  if (activeTab === 'goals') return <TextStack items={npc.goals} icon={Target} />
  if (activeTab === 'secrets') return <TextStack items={npc.secrets.map((secret) => `${secret.id}：${secret.content}`)} icon={Eye} />
  if (activeTab === 'schedule') {
    if (npc.schedule.length === 0) return <EmptyState title="该 NPC 暂无日程" />
    return (
      <div className="rule-card-list">
        {[...npc.schedule]
          .sort((left, right) => TIME_SEGMENTS.indexOf(left.segment) - TIME_SEGMENTS.indexOf(right.segment) || (right.priority ?? 0) - (left.priority ?? 0))
          .map((entry) => {
            const scheduleLocation = pack.locations.find((item) => item.id === entry.locationId)
            return (
              <div key={entry.id} className="rule-card">
                <div className="rule-card-head">
                  <strong>{TIME_SEGMENT_LABEL[entry.segment]} / {entry.activity}</strong>
                  <Badge data-test-id={`npc-schedule-location-${entry.id}`}>{scheduleLocation?.name ?? entry.locationId}</Badge>
                </div>
                <small>{entry.id}</small>
                <CodeBlock value={{ dayRange: entry.dayRange, priority: entry.priority ?? 0, conditions: entry.conditions, effects: entry.effects ?? [] }} compact />
              </div>
            )
          })}
      </div>
    )
  }

  if (activeTab === 'behavior') {
    return (
      <div className="rule-card-list">
        {npc.behaviorRules.map((rule) => (
          <div key={rule.id} className="rule-card">
            <div className="rule-card-head">
              <strong>{rule.name}</strong>
              <Badge data-test-id={`npc-behavior-priority-${rule.id}`}>priority {rule.priority}</Badge>
            </div>
            <small>{rule.id}</small>
            <CodeBlock value={{ conditions: rule.conditions, effects: rule.effects }} compact />
          </div>
        ))}
      </div>
    )
  }

  if (activeTab === 'relationships') {
    return (
      <div className="compact-list">
        {relationships.map((relationship) => (
          <div key={relationship.targetId} className="compact-item">
            <Network size={16} />
            <div>
              <strong>{relationship.targetName}</strong>
              <small>{relationship.relationType} / {relationship.value} / {relationship.reason}</small>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activeTab === 'conversations') return <ConversationList conversations={conversations} />
  if (activeTab === 'events') {
    return (
      <div className="story-stack">
        <StoryBlock title="关联交互" text={interactions.map((interaction) => `${interaction.name} / ${interaction.type}`).join('\n') || '未绑定交互'} />
        <TextStack items={events.map((event) => `${event.name} / ${event.type}`)} icon={GitBranch} />
      </div>
    )
  }
  if (activeTab === 'endings') return <TextStack items={pack.endings.map((ending) => `${ending.name}：${ending.summary}`)} icon={PackageCheck} />
  if (activeTab === 'jobs') return <TextStack items={['AI 生成记录尚未接入持久化。']} icon={Database} />

  return issues.length === 0 ? <EmptyState title="该 NPC 暂无校验问题" /> : <IssueList issues={issues} />
}
