# Story Lab Current Story Overview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `故事概览` show only the currently selected story in a compact dashboard.

**Architecture:** Keep story selection in `App` sidebar state and make `DashboardPage` a current-story-only presentation component. Remove cross-story project card rendering and derive all overview metrics from `activePack` plus the active validation report.

**Tech Stack:** React 19, TypeScript, Vite, lucide-react, existing Story Lab component primitives.

---

## File Structure

- Modify `apps/story-lab/src/pages/editor-pages.tsx`: update `DashboardPage` props, remove all-project rendering, add compact current-story sections and `data-test-id` attributes.
- Modify `apps/story-lab/src/App.tsx`: pass `activeProject`, `report`, and remove cross-story dashboard props.
- Modify `apps/story-lab/src/styles.css`: add compact overview styles and remove unused story project card layout only if no longer referenced.

## Task 1: Narrow Dashboard Data To Current Story

**Files:**
- Modify: `apps/story-lab/src/pages/editor-pages.tsx`
- Modify: `apps/story-lab/src/App.tsx`

- [ ] **Step 1: Update `DashboardPage` props**

Replace the current prop shape with:

```ts
export function DashboardPage({
  activePack,
  activeProject,
  report,
  reviewState,
  severity,
  onDownload,
  onOpenValidation,
  onSelectLocation,
}: {
  activePack: ContentPack
  activeProject: StoryProject
  report: ValidationReport
  reviewState: string
  severity: Record<string, number>
  onDownload: () => void
  onOpenValidation: () => void
  onSelectLocation: (locationId: string) => void
}) {
```

- [ ] **Step 2: Replace all-project totals**

Use current-story values only:

```ts
const topLocations = activePack.locations.slice(0, 6)
const totalIssues = report.errors.length + report.gaps.length
const activeStatus = reportStatus(report, activeProject.status)
```

- [ ] **Step 3: Update `App` call site**

Render the dashboard with:

```tsx
<DashboardPage
  activePack={pack}
  activeProject={activeProject}
  report={report}
  reviewState={reviewState}
  severity={severity}
  onDownload={downloadPack}
  onOpenValidation={() => setActiveSection('validation')}
  onSelectLocation={selectLocation}
/>
```

- [ ] **Step 4: Run typecheck**

Run: `pnpm --filter @tss/story-lab typecheck`

Expected: no TypeScript errors, or errors only from the next task's not-yet-updated JSX if running between edits.

## Task 2: Redesign Current Story Overview Markup

**Files:**
- Modify: `apps/story-lab/src/pages/editor-pages.tsx`

- [ ] **Step 1: Replace header copy and actions**

Use current story fields from props:

```tsx
<PageHeader
  eyebrow="Current Story"
  title={activeProject.name}
  description={`${activePack.world.name} / ${activePack.packId}`}
  actions={
    <div className="overview-actions" data-test-id="story-overview-actions">
      <Badge className={activeStatus} data-test-id="story-overview-status">
        {activeStatus}
      </Badge>
      <Button className="secondary" onClick={onOpenValidation} data-test-id="story-overview-validation-button">
        <ClipboardCheck size={16} />
        剧情校验
      </Button>
      <Button className="primary" onClick={onDownload} data-test-id="story-overview-export-button">
        <Download size={16} />
        导出当前故事
      </Button>
    </div>
  }
/>
```

- [ ] **Step 2: Replace metric values**

Use only current pack counts:

```tsx
<section className="metric-grid compact" data-test-id="story-overview-metrics">
  <Metric icon={MapIcon} label="地点" value={activePack.locations.length} tone="violet" />
  <Metric icon={UserRound} label="NPC" value={activePack.npcs.length} tone="amber" />
  <Metric icon={GitBranch} label="事件" value={activePack.events.length} tone="green" />
  <Metric icon={Target} label="结局" value={activePack.endings.length} tone="cyan" />
  <Metric icon={ClipboardCheck} label="待处理" value={totalIssues} tone="rose" />
</section>
```

- [ ] **Step 3: Add current story summary card**

Add a card in the main dashboard grid:

```tsx
<Card className="span-2" data-test-id="story-overview-summary-card">
  <CardHeader>
    <CardTitle>当前故事</CardTitle>
    <Badge className={activeProject.status}>{activeProject.status}</Badge>
  </CardHeader>
  <CardContent>
    <p className="lead-text">{activeProject.description}</p>
    <div className="definition-grid compact top-gap" data-test-id="story-overview-summary-fields">
      <Definition label="世界" value={activePack.world.name} />
      <Definition label="负责人" value={activeProject.owner} />
      <Definition label="更新" value={activeProject.updatedAt} />
      <Definition label="版本" value={activePack.version} />
      <Definition label="Schema" value={activePack.schemaVersion} />
      <Definition label="天数" value={activePack.world.maxDays} />
      <Definition label="时段" value={activePack.world.segments.length} />
      <Definition label="行动点" value={activePack.world.actionPointsPerSegment} />
    </div>
  </CardContent>
</Card>
```

- [ ] **Step 4: Keep status flow, validation summary, and core locations**

Reuse the existing pipeline, severity grid, bucket checklist, and location shortcuts. Change bucket count from `projectReports[activeProjectId]` to `report`:

```ts
const count = countBucket([...report.errors, ...report.gaps], bucket.match)
```

Add `data-test-id` to each section and each location button:

```tsx
data-test-id={`story-overview-location-${location.id}`}
```

## Task 3: Compact Layout Styles

**Files:**
- Modify: `apps/story-lab/src/styles.css`

- [ ] **Step 1: Add compact metric and overview styles**

Add:

```css
.overview-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.metric-grid.compact .metric-tile {
  min-height: 74px;
  padding: 12px;
}

.metric-grid.compact .metric-tile strong {
  font-size: 26px;
}

.definition-grid.compact {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
```

- [ ] **Step 2: Remove unused story project styles**

If `story-project-grid`, `story-card`, and `story-card-stats` are no longer referenced by source code, remove those style blocks from `apps/story-lab/src/styles.css`.

- [ ] **Step 3: Verify responsive behavior**

Ensure existing media queries still collapse `.metric-grid` and `.definition-grid` to one column on small screens. If needed, add `.definition-grid.compact { grid-template-columns: 1fr; }` inside the smallest media query.

## Task 4: Verification

**Files:**
- Read: `apps/story-lab/src/pages/editor-pages.tsx`
- Read: `apps/story-lab/src/App.tsx`
- Read: `apps/story-lab/src/styles.css`

- [ ] **Step 1: Search for removed multi-story preview**

Run: `rg -n "多故事剧情预览|story-project-grid|story-card|onSelectProject|projectReports\\[activeProjectId\\]|projects\\.map" apps/story-lab/src`

Expected: no hits related to the dashboard implementation.

- [ ] **Step 2: Run Story Lab typecheck**

Run: `pnpm --filter @tss/story-lab typecheck`

Expected: command exits successfully.

- [ ] **Step 3: Run repository tests**

Run: `pnpm test`

Expected: command exits successfully.

- [ ] **Step 4: Commit implementation**

Commit the implementation after verification:

```bash
git add apps/story-lab/src/pages/editor-pages.tsx apps/story-lab/src/App.tsx apps/story-lab/src/styles.css
git commit -m "feat(story-lab): focus overview on current story"
```
