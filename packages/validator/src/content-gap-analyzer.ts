import type { ContentPack, ValidationIssue } from '@tss/schema'
import { issue } from './helpers'

export function analyzeContentGaps(pack: ContentPack): ValidationIssue[] {
  const gaps: ValidationIssue[] = []
  for (const npc of pack.npcs.filter((item) => item.tier !== 'ordinary')) {
    const count = pack.conversations.filter((conversation) => conversation.npcId === npc.id).length
    if (count === 0) gaps.push(issue('info', 'missing_conversation', `${npc.name} 缺少可交谈会话`, npc.id))
  }
  for (const location of pack.locations) {
    const eventCount = pack.events.filter((event) => event.locationId === location.id).length
    if (eventCount < 3) gaps.push(issue('info', 'weak_location', `${location.name} 的事件密度偏低，当前 ${eventCount} 个`, location.id))
  }
  for (const ending of pack.endings) {
    const variableRules = ending.causalChainRules.filter((rule) => 'variable' in rule)
    if (variableRules.length === 0) gaps.push(issue('info', 'weak_causal_chain', `${ending.name} 缺少变量型因果链`, ending.id))
  }
  if (pack.conversations.length < 30) gaps.push(issue('warning', 'content_gap', `会话数量少于 MVP 目标：${pack.conversations.length}/30`))
  if (pack.events.length < 50) gaps.push(issue('warning', 'content_gap', `事件数量少于 MVP 目标：${pack.events.length}/50`))
  return gaps
}
