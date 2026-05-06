import type { CausalChainRule, ContentPack, Ending, EndingResult, GameRuntimeState } from '@tss/schema'
import { evaluateCondition } from './condition-engine'

function causalRuleMatched(rule: CausalChainRule, state: GameRuntimeState): boolean {
  if ('fact' in rule) return state.worldState.facts[rule.fact] === true
  const actual = state.worldState.variables[rule.variable]
  if (rule.operator === 'equals') return actual === rule.value
  if (rule.operator === 'less_than') return actual < rule.value
  if (rule.operator === 'less_than_or_equal') return actual <= rule.value
  if (rule.operator === 'greater_than') return actual > rule.value
  if (rule.operator === 'greater_than_or_equal') return actual >= rule.value
  return false
}

export function evaluateEnding(pack: ContentPack, state: GameRuntimeState): EndingResult | undefined {
  const ending = [...pack.endings].sort((a, b) => b.priority - a.priority).find((item) => evaluateCondition(item.conditions, state))
  if (!ending) return undefined
  return buildEndingResult(ending, state)
}

export function buildEndingResult(ending: Ending, state: GameRuntimeState): EndingResult {
  const causalChain = ending.causalChainRules.filter((rule) => causalRuleMatched(rule, state)).map((rule) => rule.text)
  return { ending, causalChain }
}
