import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Wrench
} from 'lucide-react'
import type { ValidationIssue } from '@tss/schema'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/ui'
import {
  CodeBlock,
  Definition,
  EmptyState,
  IssueList,
  PageHeader,
  SeverityTile
} from '../../components/common'
import {
  countBucket,
  formatIssue,
  inferFile,
  issueKey
} from '../../editor/helpers'
import {
  issueBuckets,
  IssueSeverityFilter
} from './shared'

export function StoryValidationPage({
  allIssues,
  fixPromptOpen,
  generatedFixPrompt,
  reportCheckedAt,
  selectedIssue,
  selectedIssueKey,
  severity,
  onCopy,
  onGenerateFixPrompt,
  onSelectIssue,
  onSetFixPromptOpen,
}: {
  allIssues: ValidationIssue[]
  fixPromptOpen: boolean
  generatedFixPrompt: string
  reportCheckedAt: string
  selectedIssue?: ValidationIssue
  selectedIssueKey: string
  severity: Record<string, number>
  onCopy: (value: string) => void
  onGenerateFixPrompt: () => void
  onSelectIssue: (key: string) => void
  onSetFixPromptOpen: (open: boolean) => void
}) {
  const [issueSeverityFilter, setIssueSeverityFilter] = useState<IssueSeverityFilter>('all')
  const filteredIssues = issueSeverityFilter === 'all' ? allIssues : allIssues.filter((issue) => issue.severity === issueSeverityFilter)

  function selectSeverityFilter(nextFilter: IssueSeverityFilter) {
    const resolvedFilter = issueSeverityFilter === nextFilter ? 'all' : nextFilter
    setIssueSeverityFilter(resolvedFilter)

    const nextIssues = resolvedFilter === 'all' ? allIssues : allIssues.filter((issue) => issue.severity === resolvedFilter)
    const nextIssue = nextIssues[0]
    onSelectIssue(nextIssue ? issueKey(nextIssue, allIssues.indexOf(nextIssue)) : '')
  }

  function getStableIssueKey(issue: ValidationIssue) {
    return issueKey(issue, allIssues.indexOf(issue))
  }

  return (
    <>
      <PageHeader
        eyebrow="Story Validator"
        testId="validation-header"
        title="剧情校验"
        description={`检测当前剧情缺陷，并生成可交给 AI 补充修复的 Prompt。最近检查：${new Date(reportCheckedAt).toLocaleString('zh-CN')}`}
        actions={
          <Button className="primary" data-test-id="validation-generate-fix-prompt-button" onClick={onGenerateFixPrompt}>
            <Wrench size={16} />
            生成修复 Prompt
          </Button>
        }
      />

      <section className="validator-layout" data-test-id="validation-layout">
        <Card data-test-id="validation-entry-card">
          <CardHeader>
            <CardTitle>检测入口</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="severity-grid">
              <SeverityTile
                active={issueSeverityFilter === 'error'}
                label="错误"
                value={severity.error ?? 0}
                tone="danger"
                onClick={() => selectSeverityFilter('error')}
                testId="validation-filter-error"
              />
              <SeverityTile
                active={issueSeverityFilter === 'warning'}
                label="警告"
                value={severity.warning ?? 0}
                tone="warning"
                onClick={() => selectSeverityFilter('warning')}
                testId="validation-filter-warning"
              />
              <SeverityTile
                active={issueSeverityFilter === 'info'}
                label="信息"
                value={severity.info ?? 0}
                tone="info"
                onClick={() => selectSeverityFilter('info')}
                testId="validation-filter-info"
              />
            </div>
            <div className="definition-grid tight">
              <Definition label="范围" value="当前故事包" />
              <Definition label="问题数" value={allIssues.length} />
            </div>
            <div className="checklist">
              {issueBuckets.map((bucket) => (
                <div key={bucket.label} className="check-row">
                  {countBucket(allIssues, bucket.match) === 0 ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{bucket.label}</span>
                  <Badge data-test-id={`validation-bucket-count-${bucket.match[0]}`}>{countBucket(allIssues, bucket.match)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card data-test-id="validation-issues-card">
          <CardHeader>
            <CardTitle>{issueSeverityFilter === 'all' ? '问题列表' : `问题列表 · ${issueSeverityFilter}`}</CardTitle>
          </CardHeader>
          <CardContent>
            <IssueList issues={filteredIssues} selectedIssueKey={selectedIssueKey} onSelectIssue={onSelectIssue} getIssueKey={getStableIssueKey} />
          </CardContent>
        </Card>

        <Card data-test-id="validation-detail-card">
          <CardHeader>
            <CardTitle>问题详情</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedIssue ? (
              <>
                <div className="definition-grid tight">
                  <Definition label="文件" value={inferFile(selectedIssue)} />
                  <Definition label="对象" value={selectedIssue.targetId ?? '-'} />
                  <Definition label="字段" value={selectedIssue.path ?? '-'} />
                  <Definition label="类型" value={selectedIssue.type} />
                </div>
                <p className="lead-text">{selectedIssue.message}</p>
                <Button className="secondary" data-test-id="validation-copy-issue-button" onClick={() => onCopy(formatIssue(selectedIssue))}>
                  <Copy size={16} />
                  复制错误
                </Button>
              </>
            ) : (
              <EmptyState title="暂无问题" />
            )}
          </CardContent>
        </Card>

        {fixPromptOpen && (
          <div className="modal-backdrop" data-test-id="fix-prompt-backdrop" role="presentation" onClick={() => onSetFixPromptOpen(false)}>
            <div className="prompt-modal" data-test-id="fix-prompt-modal" role="dialog" aria-modal="true" aria-labelledby="fix-prompt-title" onClick={(event) => event.stopPropagation()}>
              <Card data-test-id="fix-prompt-card">
                <CardHeader>
                  <CardTitle id="fix-prompt-title">修复 Prompt</CardTitle>
                  <Button className="ghost" data-test-id="fix-prompt-close-button" onClick={() => onSetFixPromptOpen(false)}>
                    关闭
                  </Button>
                </CardHeader>
                <CardContent>
                  {generatedFixPrompt ? (
                    <>
                      <CodeBlock value={generatedFixPrompt} text compact />
                      <Button className="primary top-gap" data-test-id="fix-prompt-copy-button" onClick={() => onCopy(generatedFixPrompt)}>
                        <Copy size={16} />
                        复制修复 Prompt
                      </Button>
                    </>
                  ) : (
                    <EmptyState title="尚未生成修复 Prompt" />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </section>
    </>
  )
}
