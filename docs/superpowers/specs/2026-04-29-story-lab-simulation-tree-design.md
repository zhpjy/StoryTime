# Story Lab Simulation Tree Design

## Goal

Add a dedicated Story Lab page that visualizes the coverage simulation behind `pnpm simulate` as a branching story tree. The page must show the whole exploration process within configured limits, summarize how many possible nodes and endings were reached, and avoid a separate browser-only simulation implementation.

## Core Requirement

`pnpm simulate` and Story Lab must use one shared simulation coverage core. Future changes to traversal rules, default options, state deduplication, terminal-state handling, counters, or tree/report generation must be made in the shared core, not duplicated in the CLI script or the React page.

The CLI should only parse command-line options and print the report. Story Lab should only collect UI options, invoke the shared core, and render the returned graph/report.

## Shared Architecture

Move coverage orchestration into `@tss/engine` as browser-safe code:

- `getDefaultSimulationCoverageOptions(pack)` returns defaults matching current `pnpm simulate`:
  - all identities
  - `days = pack.world.maxDays`
  - `maxStates = 5000`
  - `maxDepth = pack.world.maxDays * segments * (actionPointsPerSegment + 1) + 20`
  - `maxSamplesPerEnding = 2`
  - `includeAdvanceTime = true`
- `runSimulationCoverage(pack, options, adapter)` owns traversal, visited-state handling, terminal recording, summary counters, truncation, and optional tree capture.
- `buildSimulationCoverageTree(pack, options, adapter)` is a convenience wrapper that enables tree capture and returns `{ report, tree }`.
- `expandSimulationCoverageState` remains the canonical state expansion primitive.

`maxStates` must keep the current `pnpm simulate` meaning: maximum explored/expanded states, not maximum unique states. The report still exposes both explored states and unique states.

The adapter is the only replaceable part:

- Browser/Story Lab uses a local adapter that directly calls `expandSimulationCoverageState`.
- CLI can use a worker-pool adapter for parallel expansion, but it must not own traversal, counting, deduplication, or report logic.

This keeps Node-specific worker code outside the browser while preserving a single source of truth for simulation behavior.

## CLI Design

`scripts/simulate-qinglan.ts` should:

- import default options and the shared runner from `@tss/engine`
- parse CLI overrides for identity, days, max states, max depth, samples, and workers
- create either a local adapter or worker-pool adapter
- call the shared runner
- print the resulting report using the existing Chinese terminal format

`scripts/simulation-coverage-parallel.ts` should become a thin worker adapter or wrapper around the shared runner. It may manage Node workers and elapsed time, but must not duplicate the coverage traversal loop.

When CLI options are omitted, the script must call `getDefaultSimulationCoverageOptions(pack)` instead of recomputing defaults locally. If a CLI option changes `days` but omits `maxDepth`, the behavior must be whatever the shared default/normalization function defines, so Story Lab and CLI remain identical.

## Story Lab Page

Add a new navigation item in `apps/story-lab`: `剧情模拟`.

The page contains:

- Controls for identities, days, max states, max depth, samples per ending, and including skip-time transitions.
- Defaults populated from `getDefaultSimulationCoverageOptions(pack)`, matching `pnpm simulate`.
- A run action that builds the simulation tree in the browser.
- Summary metrics:
  - explored states
  - unique nodes
  - terminal branches
  - reached endings
  - unresolved terminal branches
  - max-depth hits
  - dead ends
  - truncation reason, if any
- Ending coverage list sorted the same way as the CLI report.
- Tree visualization with expandable nodes.
- Selected-node details including identity, step, day/segment, location, depth, terminal state, ending, and recent logs.

## Tree Model

The shared core should capture a tree/graph model during traversal:

- root nodes are initial states, one per selected identity after deduplication
- each edge is a `SimulationCoverageStep`
- each node stores:
  - stable node id
  - state hash
  - identity id
  - depth
  - time and location summary
  - terminal status
  - ending summary when present
  - child node ids
  - duplicate reference when an already visited state is encountered

Visited-state behavior must match the CLI report. Duplicate states should appear in the tree as references, not as fully expanded copies.

## UI Behavior

The tree should default to a readable collapsed state:

- expand roots and the first few levels by default
- allow manual expand/collapse per node
- support filters by identity, ending, and step kind
- show badges for ending, unresolved terminal, max-depth, dead end, truncated, and duplicate reference

The top of the page must include the final prompt-style summary:

`共探索 X 个状态，发现 Y 个唯一节点，终止 Z 个分支，触达 N 个结局。`

If truncated, append the truncation reason.

## Error Handling

- If a run throws, show an inline error panel and keep the previous successful result visible.
- If the selected max state/depth settings are very high, run with the requested values but show progress/cost context in the controls.
- If no endings are reached, show the same semantic result as CLI: no reached ending plus unresolved terminal details when available.

## Testing

Use TDD for implementation.

Core tests:

- default options match current `pnpm simulate` defaults
- shared runner summary matches existing `simulateCoverage` behavior for a small deterministic run
- tree capture counts roots, child edges, terminal nodes, and duplicate references correctly
- CLI parallel adapter report matches the local adapter report for the same options

Story Lab checks:

- TypeScript typecheck passes for `@tss/engine`, scripts, and `@tss/story-lab`
- Story Lab build succeeds
- Manual browser check confirms the page runs with default settings and shows the final node/ending summary

## Out Of Scope

- No server-side API for Story Lab simulation.
- No separate Story Lab-only traversal rules.
- No long-term persistence of simulation results.
- No graph layout library unless the initial tree UI becomes unreadable with existing CSS patterns.
