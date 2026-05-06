import type { ContentPack, ValidationIssue } from '@tss/schema'
import { issue } from './helpers'

export function validateStoryLogic(pack: ContentPack): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  for (const location of pack.locations) {
    const interactionIds = Array.isArray(location.interactionIds) ? location.interactionIds : []
    if (interactionIds.length === 0 && location.buildingIds.length === 0) issues.push(issue('warning', 'logic_warning', '地点没有任何交互内容', location.id))
  }
  for (const building of pack.buildings) {
    const interactionIds = Array.isArray(building.interactionIds) ? building.interactionIds : []
    if (interactionIds.length === 0) issues.push(issue('warning', 'logic_warning', '建筑没有交互', building.id))
  }
  for (const interaction of Array.isArray(pack.interactions) ? pack.interactions : []) {
    if (!interaction.description) issues.push(issue('warning', 'logic_warning', '交互缺少描述', interaction.id, 'description'))
  }
  for (const event of pack.events) {
    if (event.effects.length === 0) issues.push(issue('warning', 'logic_warning', '事件没有任何状态变化', event.id))
  }
  for (const quest of Array.isArray(pack.quests) ? pack.quests : []) {
    const rewardIds = Array.isArray(quest.rewardIds) ? quest.rewardIds : []
    if (rewardIds.length === 0) issues.push(issue('warning', 'logic_warning', '任务没有奖励', quest.id))
  }
  for (const reward of Array.isArray(pack.rewards) ? pack.rewards : []) {
    if (!Array.isArray(reward.effects) || reward.effects.length === 0) issues.push(issue('warning', 'logic_warning', '奖励没有效果', reward.id))
  }
  for (const npc of pack.npcs) {
    if (npc.tier !== 'ordinary' && npc.behaviorRules.length === 0) issues.push(issue('warning', 'logic_warning', '重要 NPC 没有行为规则', npc.id))
  }
  const highPriority = pack.endings.filter((ending) => ending.priority >= 90)
  if (highPriority.length < 3) issues.push(issue('warning', 'logic_warning', '高优先级结局少于 3 个'))
  return issues
}
