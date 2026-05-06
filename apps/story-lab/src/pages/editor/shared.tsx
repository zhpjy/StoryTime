import type { ReactNode } from 'react'
import type { TerrainType, ValidationIssue } from '@tss/schema'
import type { SimulationCoverageStepKind } from '@tss/engine'
import type { validateContentPack } from '@tss/validator'
import type { NpcTabId } from '../../editor/types'

export type ValidationReport = ReturnType<typeof validateContentPack>
export type IssueSeverityFilter = ValidationIssue['severity'] | 'all'
export type WorldTabId = 'basics' | 'variables' | 'affiliations' | 'runtime'

export const contentStatus = ['draft', 'needs_fix', 'reviewing', 'accepted', 'locked']

export const simulationStepKinds: Array<{ id: SimulationCoverageStepKind; label: string }> = [
  { id: 'conversation_start', label: '开始会话' },
  { id: 'conversation_reply', label: '会话回复' },
  { id: 'interaction', label: '交互' },
  { id: 'travel', label: '移动' },
  { id: 'advance_time', label: '跳过时段' },
]

export const issueBuckets = [
  { label: 'Schema 字段', match: ['schema_error'] },
  { label: '引用有效性', match: ['reference_error'] },
  { label: 'Fact 路径', match: ['fact_path_error'] },
  { label: 'Conditions / Effects', match: ['effect_error', 'logic_error'] },
  { label: '内容缺口', match: ['missing_conversation', 'weak_location', 'weak_causal_chain', 'content_gap'] },
]

export const terrainLabel: Record<TerrainType, string> = {
  town: '城镇',
  road: '道路',
  forest: '森林',
  river: '河流',
  mountain: '山地',
  ruin: '遗迹',
}

export function booleanLabel(value: boolean) {
  return value ? '是' : '否'
}

export const worldGuardrails = [
  '时间推进、空间变化、NPC 自主行动、动态叙事、因果结局',
  '所有结构化内容必须可校验、可导出、可模拟、可复查',
  '事件、交互、任务、会话必须有触发条件或完成方式，效果必须引用已存在对象',
]

export const worldTabs: Array<{ id: WorldTabId; label: string }> = [
  { id: 'basics', label: '世界基础' },
  { id: 'variables', label: '世界变量' },
  { id: 'affiliations', label: '势力与身份' },
  { id: 'runtime', label: '开始入口' },
]

export const npcTabs: Array<{ id: NpcTabId; label: string }> = [
  { id: 'basic', label: '基础信息' },
  { id: 'origin', label: '出身设定' },
  { id: 'background', label: '背景故事' },
  { id: 'personality', label: '性格属性' },
  { id: 'state', label: '状态字段' },
  { id: 'goals', label: '目标' },
  { id: 'secrets', label: '秘密' },
  { id: 'schedule', label: '日程' },
  { id: 'behavior', label: '行为规则' },
  { id: 'relationships', label: '关系' },
  { id: 'conversations', label: '会话' },
  { id: 'events', label: '事件引用' },
  { id: 'endings', label: '结局影响' },
  { id: 'jobs', label: 'AI 生成记录' },
  { id: 'checks', label: '检测结果' },
]

export function highlightJson(content: string): ReactNode[] {
  const tokenPattern = /(\"(?:\\.|[^\"\\])*\"(?=\s*:)|\"(?:\\.|[^\"\\])*\"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\b(?:true|false|null)\b|[{}\[\]:,])/g
  const nodes: ReactNode[] = []
  let cursor = 0
  let tokenIndex = 0

  for (const match of content.matchAll(tokenPattern)) {
    const token = match[0]
    const index = match.index ?? 0
    if (index > cursor) nodes.push(content.slice(cursor, index))

    const className = token.startsWith('\"') && content.slice(index + token.length).match(/^\s*:/)
      ? 'syntax-key'
      : token.startsWith('\"')
        ? 'syntax-string'
        : /^(true|false|null)$/.test(token)
          ? 'syntax-literal'
          : /^-?\d/.test(token)
            ? 'syntax-number'
            : 'syntax-punctuation'

    nodes.push(
      <span key={`${token}-${tokenIndex}`} className={className} data-test-id={`world-file-syntax-token-${tokenIndex}`}>
        {token}
      </span>
    )
    cursor = index + token.length
    tokenIndex += 1
  }

  if (cursor < content.length) nodes.push(content.slice(cursor))
  return nodes
}
