import type { KeyboardEvent, PointerEvent, WheelEvent } from 'react'
import { useMemo, useRef, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  GitBranch,
  Network,
  PackageCheck,
  Play,
  Route,
  UserRound,
  Users,
  Wrench
} from 'lucide-react'
import type { ContentPack } from '@tss/schema'
import { TIME_SEGMENT_LABEL } from '@tss/schema'
import type {
  SimulationCoverageResolvedOptions,
  SimulationCoverageRunResult,
  SimulationCoverageTree,
  SimulationCoverageTreeNode
} from '@tss/engine'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/ui'
import {
  Definition,
  EmptyState,
  Metric,
  PageHeader
} from '../../components/common'
import { buildSimulationGraphLayout, calculateSimulationGraphZoom } from '../../features/simulation/simulationGraphLayout'
import {
  simulationStepKinds
} from './shared'

export function StorySimulationPage({
  error,
  filters,
  isRunning,
  options,
  pack,
  result,
  selectedNodeId,
  onFilterChange,
  onResetOptions,
  onRun,
  onSelectAllIdentities,
  onSelectNode,
  onSetIncludeAdvanceTime,
  onSetNumberOption,
  onToggleIdentity,
}: {
  error: string
  filters: { identityId: string; endingId: string; stepKind: string }
  isRunning: boolean
  options: SimulationCoverageResolvedOptions
  pack: ContentPack
  result?: SimulationCoverageRunResult & { tree: SimulationCoverageTree }
  selectedNodeId: string
  onFilterChange: (key: 'identityId' | 'endingId' | 'stepKind', value: string) => void
  onResetOptions: () => void
  onRun: () => void
  onSelectAllIdentities: () => void
  onSelectNode: (nodeId: string) => void
  onSetIncludeAdvanceTime: (includeAdvanceTime: boolean) => void
  onSetNumberOption: (key: 'days' | 'maxStates' | 'maxDepth' | 'maxSamplesPerEnding', value: string) => void
  onToggleIdentity: (identityId: string) => void
}) {
  const selectedNode = result && selectedNodeId ? result.tree.nodes[selectedNodeId] : undefined
  const summary = result
    ? `共探索 ${result.report.exploredStates} 个状态，发现 ${result.report.uniqueStates} 个唯一节点，终止 ${result.report.terminalStates} 个分支，触达 ${result.report.endings.length} 个结局。${result.report.truncated ? ` 截断：${result.report.truncatedReason}` : ''}`
    : '配置参数后运行模拟，生成与 pnpm simulate 共用核心逻辑的剧情覆盖树。'

  return (
    <>
      <PageHeader
        eyebrow="Simulation Tree"
        testId="simulation-header"
        title="剧情模拟"
        description="复用 pnpm simulate 的共享覆盖模拟核心，以图谱查看剧情分支探索过程。"
        actions={
          <>
            <Button className="secondary" data-test-id="simulation-reset-button" disabled={isRunning} onClick={onResetOptions}>
              <Wrench size={16} />
              恢复默认
            </Button>
            <Button className="primary" data-test-id="simulation-run-button" disabled={isRunning} onClick={onRun}>
              <Play size={16} />
              {isRunning ? '模拟进行中...' : '运行模拟'}
            </Button>
          </>
        }
      />

      {error && (
        <div className="simulation-error" data-test-id="simulation-error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      <section className="simulation-final-summary" data-test-id="simulation-final-summary">
        <GitBranch size={18} />
        <strong>{summary}</strong>
      </section>

      {result && (
        <section className="metric-grid simulation-metrics" data-test-id="simulation-metrics">
          <Metric icon={Activity} label="探索状态" value={result.report.exploredStates} tone="cyan" testId="simulation-metric-explored" />
          <Metric icon={Network} label="唯一节点" value={result.report.uniqueStates} tone="violet" testId="simulation-metric-unique" />
          <Metric icon={Route} label="终止分支" value={result.report.terminalStates} tone="amber" testId="simulation-metric-terminal" />
          <Metric icon={PackageCheck} label="触达结局" value={result.report.endings.length} tone="green" testId="simulation-metric-endings" />
          <Metric icon={AlertTriangle} label="未判定" value={result.report.unresolvedTerminalStates} tone="rose" testId="simulation-metric-unresolved" />
        </section>
      )}

      <section className="simulation-layout" data-test-id="simulation-layout">
        <Card data-test-id="simulation-options-card">
          <CardHeader>
            <CardTitle>模拟参数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="simulation-form" data-test-id="simulation-form">
              <div data-test-id="simulation-identity-section">
                <div className="form-label-row" data-test-id="simulation-identity-header">
                  <strong>身份</strong>
                  <Button className="secondary compact-button" data-test-id="simulation-select-all-identities-button" disabled={isRunning} onClick={onSelectAllIdentities}>
                    <Users size={14} />
                    全部
                  </Button>
                </div>
                <div className="identity-filter-list" data-test-id="simulation-identity-list">
                  {pack.identities.map((identity) => (
                    <button
                      key={identity.id}
                      className={options.identityIds.includes(identity.id) ? 'identity-filter is-selected' : 'identity-filter'}
                      data-test-id={`simulation-identity-${identity.id}`}
                      disabled={isRunning}
                      type="button"
                      onClick={() => onToggleIdentity(identity.id)}
                    >
                      <UserRound size={15} />
                      <span>{identity.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="simulation-input-grid" data-test-id="simulation-input-grid">
                <label className="simulation-field" data-test-id="simulation-field-days">
                  <span>天数</span>
                  <input data-test-id="simulation-input-days" disabled={isRunning} min={1} type="number" value={options.days} onChange={(event) => onSetNumberOption('days', event.target.value)} />
                </label>
                <label className="simulation-field" data-test-id="simulation-field-max-states">
                  <span>Max states</span>
                  <input data-test-id="simulation-input-max-states" disabled={isRunning} min={1} type="number" value={options.maxStates} onChange={(event) => onSetNumberOption('maxStates', event.target.value)} />
                </label>
                <label className="simulation-field" data-test-id="simulation-field-max-depth">
                  <span>Max depth</span>
                  <input data-test-id="simulation-input-max-depth" disabled={isRunning} min={1} type="number" value={options.maxDepth} onChange={(event) => onSetNumberOption('maxDepth', event.target.value)} />
                </label>
                <label className="simulation-field" data-test-id="simulation-field-samples">
                  <span>Samples</span>
                  <input data-test-id="simulation-input-samples" disabled={isRunning} min={1} type="number" value={options.maxSamplesPerEnding} onChange={(event) => onSetNumberOption('maxSamplesPerEnding', event.target.value)} />
                </label>
              </div>

              <label className="simulation-check" data-test-id="simulation-field-include-advance-time">
                <input
                  checked={options.includeAdvanceTime}
                  data-test-id="simulation-input-include-advance-time"
                  disabled={isRunning}
                  type="checkbox"
                  onChange={(event) => onSetIncludeAdvanceTime(event.target.checked)}
                />
                <span>包含跳过当前时段</span>
              </label>
            </div>

            {result && (
              <div className="ending-coverage" data-test-id="simulation-ending-coverage">
                <div className="form-label-row" data-test-id="simulation-ending-coverage-header">
                  <strong>结局覆盖</strong>
                  <Badge data-test-id="simulation-ending-count">{result.report.endings.length}</Badge>
                </div>
                {result.report.endings.length === 0 ? (
                  <EmptyState testId="simulation-empty-endings" title="未触达任何结局" />
                ) : (
                  <div className="compact-list" data-test-id="simulation-ending-list">
                    {result.report.endings.map((ending) => (
                      <div key={ending.endingId} className="compact-item" data-test-id={`simulation-ending-${ending.endingId}`}>
                        <PackageCheck size={16} />
                        <span>{ending.endingName}</span>
                        <Badge data-test-id={`simulation-ending-count-${ending.endingId}`}>{ending.count}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="simulation-tree-card" data-test-id="simulation-tree-card">
          <CardHeader>
            <CardTitle>分支图</CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <>
                <div className="tree-filter-row" data-test-id="simulation-filter-row">
                  <select className="simulation-select" data-test-id="simulation-filter-identity" value={filters.identityId} onChange={(event) => onFilterChange('identityId', event.target.value)}>
                    <option value="all">全部身份</option>
                    {pack.identities.map((identity) => (
                      <option key={identity.id} value={identity.id}>{identity.name}</option>
                    ))}
                  </select>
                  <select className="simulation-select" data-test-id="simulation-filter-ending" value={filters.endingId} onChange={(event) => onFilterChange('endingId', event.target.value)}>
                    <option value="all">全部结局</option>
                    {result.report.endings.map((ending) => (
                      <option key={ending.endingId} value={ending.endingId}>{ending.endingName}</option>
                    ))}
                  </select>
                  <select className="simulation-select" data-test-id="simulation-filter-step-kind" value={filters.stepKind} onChange={(event) => onFilterChange('stepKind', event.target.value)}>
                    <option value="all">全部步骤</option>
                    {simulationStepKinds.map((kind) => (
                      <option key={kind.id} value={kind.id}>{kind.label}</option>
                    ))}
                  </select>
                </div>
                <SimulationTreeView
                  filters={filters}
                  selectedNodeId={selectedNodeId}
                  tree={result.tree}
                  onSelectNode={onSelectNode}
                />
              </>
            ) : isRunning ? (
              <div className="empty-state simulation-running" data-test-id="simulation-running">
                <Activity size={20} />
                <span>模拟进行中...</span>
              </div>
            ) : (
              <EmptyState testId="simulation-empty-tree" title="尚未运行模拟" />
            )}
          </CardContent>
        </Card>
      </section>

      {selectedNode && <SimulationNodeModal node={selectedNode} pack={pack} onClose={() => onSelectNode('')} />}
    </>
  )
}

function SimulationTreeView({
  filters,
  selectedNodeId,
  tree,
  onSelectNode,
}: {
  filters: { identityId: string; endingId: string; stepKind: string }
  selectedNodeId: string
  tree: SimulationCoverageTree
  onSelectNode: (nodeId: string) => void
}) {
  const layout = useMemo(() => buildSimulationGraphLayout(tree, { filters }), [tree, filters])
  const [pan, setPan] = useState({ x: 36, y: 36 })
  const [zoom, setZoom] = useState(1)
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef<{ pointerX: number; pointerY: number; panX: number; panY: number } | undefined>(undefined)

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    dragStart.current = { pointerX: event.clientX, pointerY: event.clientY, panX: pan.x, panY: pan.y }
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return
    setPan({
      x: dragStart.current.panX + event.clientX - dragStart.current.pointerX,
      y: dragStart.current.panY + event.clientY - dragStart.current.pointerY,
    })
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    dragStart.current = undefined
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  function zoomCanvas(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault()
    const bounds = event.currentTarget.getBoundingClientRect()
    const next = calculateSimulationGraphZoom({
      currentPan: pan,
      currentZoom: zoom,
      viewportPoint: {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      },
      wheelDeltaY: event.deltaY,
    })
    setPan(next.pan)
    setZoom(next.zoom)
  }

  function selectNodeFromKeyboard(event: KeyboardEvent<SVGGElement>, nodeId: string) {
    if (event.key === 'Enter' || event.key === ' ') onSelectNode(nodeId)
  }

  if (layout.nodes.length === 0) return <EmptyState testId="simulation-empty-filtered-tree" title="没有符合筛选条件的节点" />

  return (
    <div
      className={dragging ? 'simulation-graph-viewport is-dragging' : 'simulation-graph-viewport'}
      data-test-id="simulation-graph-viewport"
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onWheel={zoomCanvas}
    >
      <div className="graph-zoom-indicator" data-test-id="simulation-graph-zoom">{Math.round(zoom * 100)}%</div>
      {layout.truncated && (
        <div className="graph-limit-banner" data-test-id="simulation-graph-limit">
          <AlertTriangle size={16} />
          <span>当前画布显示 {layout.nodes.length} 个节点，隐藏 {layout.hiddenNodeCount} 个节点；可通过筛选缩小范围。</span>
        </div>
      )}
      <div className="simulation-graph-stage" data-test-id="simulation-graph-stage" style={{ width: layout.width, height: layout.height, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
        <svg className="simulation-graph-svg" data-test-id="simulation-graph-svg" width={layout.width} height={layout.height} role="img" aria-label="剧情模拟图谱">
          <defs>
            <marker id="graph-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" />
            </marker>
          </defs>
          <g className="graph-edges" data-test-id="simulation-graph-edges">
            {layout.edges.map((edge) => (
              <path
                key={edge.id}
                className={`graph-edge ${edge.stepKind ?? 'unknown'}`}
                data-test-id={`simulation-graph-edge-${edge.sourceId}-${edge.targetId}`}
                d={`M${edge.x1},${edge.y1} C${edge.x1 + 80},${edge.y1} ${edge.x2 - 80},${edge.y2} ${edge.x2},${edge.y2}`}
                markerEnd="url(#graph-arrow)"
              />
            ))}
          </g>
          <g className="graph-nodes" data-test-id="simulation-graph-nodes">
            {layout.nodes.map((entry) => (
              <g
                key={entry.id}
                className={selectedNodeId === entry.id ? `graph-node ${graphNodeClass(entry.node)} is-selected` : `graph-node ${graphNodeClass(entry.node)}`}
                data-test-id={`simulation-graph-node-${entry.id}`}
                role="button"
                tabIndex={0}
                transform={`translate(${entry.x},${entry.y})`}
                onClick={() => onSelectNode(entry.id)}
                onPointerDown={(event) => event.stopPropagation()}
                onKeyDown={(event) => selectNodeFromKeyboard(event, entry.id)}
              >
                <rect x="-76" y="-31" width="152" height="62" rx="8" />
                <text className="graph-node-title" x="0" y="-6" textAnchor="middle">{truncateGraphLabel(simulationNodeTitle(entry.node), 13)}</text>
                <text className="graph-node-meta" x="0" y="14" textAnchor="middle">D{entry.node.day} · {TIME_SEGMENT_LABEL[entry.node.segment]}</text>
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  )
}

function SimulationNodeModal({ node, pack, onClose }: { node: SimulationCoverageTreeNode; pack: ContentPack; onClose: () => void }) {
  return (
    <div className="simulation-modal-backdrop" data-test-id="simulation-node-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="simulation-modal" data-test-id="simulation-node-modal" role="dialog" aria-modal="true" aria-label="节点详情" onClick={(event) => event.stopPropagation()}>
        <div className="simulation-modal-head" data-test-id="simulation-node-modal-head">
          <strong>节点详情</strong>
          <button data-test-id="simulation-node-modal-close" type="button" onClick={onClose}>关闭</button>
        </div>
        <SimulationNodeDetails node={node} pack={pack} />
      </div>
    </div>
  )
}

function SimulationNodeDetails({ node, pack }: { node: SimulationCoverageTreeNode; pack: ContentPack }) {
  return (
    <div className="detail-panel" data-test-id="simulation-node-detail">
      <div className="definition-grid tight" data-test-id="simulation-node-fields">
        <Definition label="节点" value={node.id} testId="simulation-node-id" />
        <Definition label="身份" value={identityName(pack, node.identityId)} testId="simulation-node-identity" />
        <Definition label="深度" value={node.depth} testId="simulation-node-depth" />
        <Definition label="状态" value={simulationNodeStatusLabel(node)} testId="simulation-node-status" />
        <Definition label="时间" value={`第 ${node.day} 天 / ${TIME_SEGMENT_LABEL[node.segment]}`} testId="simulation-node-time" />
        <Definition label="地点" value={locationName(pack, node.locationId)} testId="simulation-node-location" />
        <Definition label="步骤" value={node.viaStep?.name ?? '初始状态'} testId="simulation-node-step" />
        <Definition label="结局" value={node.endingName ?? '-'} testId="simulation-node-ending" />
      </div>
      {node.duplicateOf && <p className="lead-text" data-test-id="simulation-node-duplicate">该节点引用已访问状态：{node.duplicateOf}</p>}
      <div data-test-id="simulation-node-logs">
        <h3 className="subsection-title">最近日志</h3>
        {node.recentLogs.length === 0 ? (
          <EmptyState testId="simulation-node-empty-logs" title="暂无日志" />
        ) : (
          <div className="log-list compact-log-list" data-test-id="simulation-node-log-list">
            {node.recentLogs.map((log) => (
              <div key={log} className="log-row" data-test-id={`simulation-node-log-${log}`}>
                <Badge data-test-id={`simulation-node-log-badge-${log}`}>log</Badge>
                <span>{log}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function simulationNodeTitle(node: SimulationCoverageTreeNode) {
  if (!node.viaStep) return '初始状态'
  if (node.status === 'duplicate') return `${node.viaStep.name}（重复）`
  return node.viaStep.name
}

function simulationNodeStatusLabel(node: SimulationCoverageTreeNode) {
  if (node.status === 'duplicate') return '重复状态'
  if (node.status === 'expanded') return '已展开'
  if (node.status === 'queued') return '待展开'
  if (node.endingName) return '结局'
  if (node.terminalReason === 'max_depth') return '深度上限'
  if (node.terminalReason === 'dead_end') return '死路'
  if (node.terminalReason === 'max_day') return '天数上限'
  return '未判定'
}

function identityName(pack: ContentPack, identityId: string) {
  return pack.identities.find((identity) => identity.id === identityId)?.name ?? identityId
}

function locationName(pack: ContentPack, locationId: string) {
  return pack.locations.find((location) => location.id === locationId)?.name ?? locationId
}

function graphNodeClass(node: SimulationCoverageTreeNode) {
  if (node.status === 'duplicate') return 'duplicate'
  if (node.endingName) return 'ending'
  if (node.terminalReason === 'max_depth') return 'max-depth'
  if (node.terminalReason === 'dead_end' || node.terminalReason === 'max_day') return 'blocked'
  return node.viaStep?.kind ?? 'root'
}

function truncateGraphLabel(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value
}
