import type { ValidationIssue } from '@tss/schema'

export function issue(severity: ValidationIssue['severity'], type: string, message: string, targetId?: string, path?: string): ValidationIssue {
  return { severity, type, message, targetId, path }
}
