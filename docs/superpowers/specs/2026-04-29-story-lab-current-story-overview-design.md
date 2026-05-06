# Story Lab Current Story Overview Design

## Context

`apps/story-lab` has a `故事概览` page that currently renders preview cards for every configured story project. The left sidebar already owns story switching through the `当前故事` selector, so repeating all stories in the overview makes the page tall and distracts from the selected story.

Project instructions require every page element to include `data-test-id` for packaged-app targeting. Implementation must also avoid hardcoding concrete story content in source code.

## Goal

Change the `故事概览` page so it only presents the currently selected story. Redesign the page into a more compact operational overview for that story, while leaving cross-story selection in the sidebar.

## User Experience

The overview should make the current story visible at a glance:

- Header: current story title, world name, pack id, validation status, and actions for validation and export.
- Compact metrics: current story counts for locations, NPCs, events, endings, and current validation workload.
- Current story summary: description, owner, update date, version, schema version, max days, time segments, and action points.
- Status flow: existing content workflow states, highlighting the current review state.
- Validation summary: current story issue severity counts and issue buckets.
- Core locations: a compact list of the first important locations, still linking into the map view.

The page must not render story preview cards for inactive stories. Users switch stories only from the existing sidebar selector.

## Data Flow

`App` should pass only the active project, active pack, active validation report, derived review state, and current severity counts into `DashboardPage`.

`DashboardPage` should stop calculating totals across `projects` and should not map over the full project list. Counts come from `activePack` and the active validation report only.

## Component Changes

- Update `DashboardPage` props to remove `activeProjectId`, `projects`, `projectReports`, and `onSelectProject`.
- Add an `activeProject` prop for project metadata that is not inside the content pack, such as owner, status, and updated date.
- Keep `onDownload`, `onOpenValidation`, and `onSelectLocation`.
- Add `data-test-id` attributes to the overview page elements and interactive controls touched by this change.
- Use existing `Metric`, `Definition`, `Badge`, `Button`, `Card`, and layout styles where possible.
- Add or adjust CSS only for compact layout needs.

## Testing

Verification should cover:

- TypeScript build/typecheck for `@tss/story-lab`.
- Existing repository test command, if available.
- A code search confirming the old multi-story preview title and inactive story-card loop are removed from the overview implementation.

## Out Of Scope

- Changing story project ordering or default selection.
- Changing the sidebar story selector behavior.
- Editing concrete content packs or story YAML/JSON content.
- Adding a new cross-story dashboard.
