import type { ReactNode } from 'react'
import type { Conversation, ValidationIssue, VariableDefinition } from '@tss/schema'
import type { LucideIcon } from 'lucide-react'
import { Database, FileCode2, LayoutDashboard } from 'lucide-react'
import { Badge } from './ui'
import { inferFile, issueKey, normalizeVariable } from '../editor/helpers'

export function PageHeader({
  actions,
  description,
  eyebrow,
  testId,
  title,
}: {
  actions?: ReactNode
  description: string
  eyebrow: string
  testId?: string
  title: string
}) {
  return (
    <header className="page-header" data-test-id={testId}>
      <div data-test-id={testId ? `${testId}-copy` : undefined}>
        <div className="eyebrow" data-test-id={testId ? `${testId}-eyebrow` : undefined}>{eyebrow}</div>
        <h1 data-test-id={testId ? `${testId}-title` : undefined}>{title}</h1>
        <p data-test-id={testId ? `${testId}-description` : undefined}>{description}</p>
      </div>
      {actions && <div className="header-actions" data-test-id={testId ? `${testId}-actions` : undefined}>{actions}</div>}
    </header>
  )
}

export function Metric({
  icon: Icon,
  label,
  testId,
  tone,
  value,
}: {
  icon: LucideIcon
  label: string
  testId?: string
  tone: string
  value: number | string
}) {
  return (
    <div className={`metric-tile ${tone}`} data-test-id={testId}>
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export function SeverityTile({
  active = false,
  label,
  onClick,
  testId,
  tone,
  value,
}: {
  active?: boolean
  label: string
  onClick?: () => void
  testId?: string
  tone: string
  value: number
}) {
  const className = active ? `severity-tile ${tone} is-active` : `severity-tile ${tone}`
  if (onClick) {
    return (
      <button className={className} data-test-id={testId} type="button" aria-pressed={active} onClick={onClick}>
        <span>{label}</span>
        <strong>{value}</strong>
      </button>
    )
  }

  return (
    <div className={className} data-test-id={testId}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export function Definition({ label, testId, value }: { label: string; testId?: string; value: ReactNode }) {
  return (
    <div className="definition" data-test-id={testId}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export function ProgressBar({ testId, value }: { testId?: string; value: number }) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className="progress-track" data-test-id={testId}>
      <div className="progress-fill" style={{ width: `${clamped}%` }} />
    </div>
  )
}

export function VariableBars({
  definitions,
  variables,
}: {
  definitions: VariableDefinition[]
  variables: Record<string, number>
}) {
  return (
    <div className="variable-bars">
      {Object.entries(variables).map(([key, value]) => {
        const definition = definitions.find((variable) => variable.key === key)
        return (
          <div key={key} className="variable-mini">
            <div>
              <span>{definition?.name ?? key}</span>
              <strong>{value}</strong>
            </div>
            <ProgressBar testId={`variable-mini-progress-${key}`} value={normalizeVariable(value, definition?.min, definition?.max)} />
          </div>
        )
      })}
    </div>
  )
}

export function StatusDot({ state }: { state: string }) {
  return <span className={`status-dot ${state}`} aria-hidden="true" />
}

export function EmptyState({ testId, title }: { testId?: string; title: string }) {
  return (
    <div className="empty-state" data-test-id={testId}>
      <Database size={20} />
      <span>{title}</span>
    </div>
  )
}

export function CodeBlock({ compact = false, text = false, value }: { compact?: boolean; text?: boolean; value: unknown }) {
  return <pre className={compact ? 'code-block compact' : 'code-block'} data-test-id={compact ? 'code-block-compact' : 'code-block'}>{text ? String(value) : JSON.stringify(value, null, 2)}</pre>
}

export function InfoCluster({ icon: Icon, items, title }: { icon: LucideIcon; items: string[]; title: string }) {
  return (
    <div className="info-cluster" data-test-id={`info-cluster-${title}`}>
      <div className="cluster-title" data-test-id={`info-cluster-title-${title}`}>
        <Icon size={16} />
        <strong>{title}</strong>
      </div>
      {items.length === 0 ? <small>暂无</small> : <div className="badge-wrap" data-test-id={`info-cluster-items-${title}`}>{items.map((item) => <Badge key={item} data-test-id={`info-cluster-badge-${title}-${item}`}>{item}</Badge>)}</div>}
    </div>
  )
}

export function TextStack({ icon: Icon = FileCode2, items }: { icon?: LucideIcon; items: string[] }) {
  return (
    <div className="compact-list" data-test-id="text-stack-list">
      {items.length === 0 ? (
        <EmptyState title="暂无内容" />
      ) : (
        items.map((item) => (
          <div key={item} className="compact-item" data-test-id={`text-stack-item-${item}`}>
            <Icon size={16} />
            <span>{item}</span>
          </div>
        ))
      )}
    </div>
  )
}

export function StoryBlock({ text, title }: { text: string; title: string }) {
  return (
    <div className="story-block" data-test-id={`story-block-${title}`}>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  )
}

export function ConversationList({ conversations }: { conversations: Conversation[] }) {
  if (conversations.length === 0) return <EmptyState testId="conversation-list-empty" title="暂无会话" />
  return (
    <div className="conversation-list" data-test-id="conversation-list">
      {conversations.map((conversation) => (
        <div key={conversation.id} className="conversation-row" data-test-id={`conversation-row-${conversation.id}`}>
          <Badge data-test-id={`conversation-node-count-${conversation.id}`}>{conversation.nodes.length} nodes</Badge>
          <div data-test-id={`conversation-row-copy-${conversation.id}`}>
            <strong data-test-id={`conversation-title-${conversation.id}`}>{conversation.title}</strong>
            <span data-test-id={`conversation-reply-count-${conversation.id}`}>{conversation.nodes.reduce((total, node) => total + node.replies.length, 0)} replies</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function FlowNode({ title, value }: { title: string; value: string }) {
  return (
    <div className="flow-node" data-test-id={`flow-node-${title}`}>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  )
}

export function IssueList({
  getIssueKey,
  issues,
  onSelectIssue,
  selectedIssueKey,
}: {
  getIssueKey?: (issue: ValidationIssue, index: number) => string
  issues: ValidationIssue[]
  onSelectIssue?: (key: string) => void
  selectedIssueKey?: string
}) {
  if (issues.length === 0) return <EmptyState title="暂无问题" />
  return (
    <div className="issue-list" data-test-id="issue-list">
      {issues.slice(0, 80).map((issue, index) => {
        const key = getIssueKey?.(issue, index) ?? issueKey(issue, index)
        return (
          <button
            key={key}
            className={selectedIssueKey === key ? `issue-row ${issue.severity} is-selected` : `issue-row ${issue.severity}`}
            data-test-id={`issue-row-${key}`}
            type="button"
            onClick={() => onSelectIssue?.(key)}
          >
            <Badge data-test-id={`issue-severity-${key}`}>{issue.severity}</Badge>
            <span>{issue.message}</span>
            <small>{inferFile(issue)} · {issue.targetId ?? '-'}</small>
          </button>
        )
      })}
    </div>
  )
}

export const fallbackIcon = LayoutDashboard
