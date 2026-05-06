# Game Client Story Lab Structure Refactor Design

## Context

`apps/game-client` must be refactored to match the current code organization and technical style of `apps/story-lab` while preserving the existing playable game loop. The current game client already supports identity selection, runtime state, map selection, movement, actions, event choices, save import/export, and ending display, but much of the UI is still organized around broad game components and ad hoc Tailwind surfaces.

`apps/story-lab` now uses a clearer structure: page-level orchestration, feature-specific modules, local UI primitives, CSS split by responsibility, and a dedicated `features/map` implementation with tested geometry helpers. The game client should follow that shape without importing map implementation code from Story Lab because the two maps are expected to diverge later.

Repository constraints:

- All page elements and controls need stable `data-test-id` attributes.
- Source code must not hardcode concrete story content, location names, project names, or story-specific save names.
- Map texture assets should be shared from the existing app-level shared asset directory, not duplicated into each app.
- Work must happen in a worktree and be merged back to `main`; the worktree must be cleaned up after merge.

## Goals

- Preserve the current playable flow: identity selection, save load, game shell, map interaction, movement, action execution, event resolution, time/rest controls, state panels, event log, save import/export, and ending modal.
- Restructure `apps/game-client/src` around Story Lab's current conventions: small page orchestrators, feature directories, shared UI primitives, and split style files.
- Convert game-client UI to local shadcn-style primitives and use those primitives consistently across the app.
- Keep a consistent game-client visual system across all screens and panels.
- Replace the current grid map with an independent game-client SVG isometric map implementation that ports Story Lab's current map capabilities.
- Use shared map image assets from `apps/shared-assets/map/...` through Vite imports. Do not duplicate image files.
- Remove source hardcoding of concrete story content. Labels and file names should derive from `ContentPack` data or generic game-client constants.
- Add or update focused tests for map pure helpers and source constraints.

## Non-Goals

- No changes to `@tss/schema`, `@tss/engine`, or content pack data formats unless required by compile errors.
- No new renderer library. The map should use React and SVG, matching Story Lab's current map implementation approach.
- No direct imports from `apps/story-lab/src/features/map`.
- No shared map code package in this refactor. Asset sharing is required; implementation sharing is not.
- No gameplay redesign, new mechanics, pathfinding, or content editing tools.
- No copying concrete story text from content into source constants.

## Proposed Structure

```text
apps/game-client/src
├── App.tsx
├── app/
│   └── GameShell.tsx
├── components/
│   └── ui/
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── scroll-area.tsx
│       ├── separator.tsx
│       └── tooltip.tsx
├── features/
│   ├── events/
│   ├── identity/
│   ├── map/
│   ├── player/
│   ├── save/
│   └── world/
├── pages/
│   └── game/
│       ├── game-page.tsx
│       └── identity-page.tsx
├── store/
│   └── game-store.ts
└── styles/
    ├── base.css
    ├── game.css
    ├── map.css
    ├── panels.css
    └── ui.css
```

`App.tsx` remains the entry switch:

- load saved game on mount,
- render identity selection when no runtime exists,
- render the game shell/page when runtime exists.

`pages/game/*` owns page composition. Feature directories own focused panels, helpers, and tests.

## UI And shadcn Component Model

The game client should use local shadcn-style primitives consistently:

- `Button` with `default`, `secondary`, `outline`, `ghost`, `destructive`, and `icon`-appropriate sizing.
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and `CardFooter`.
- `Badge` for status, action type, relationship, inventory, and event count chips.
- `Dialog` for ending display and save import/export feedback where modal behavior is needed.
- `ScrollArea` for event logs, detail panels, and long lists.
- `Separator` for compact panel structure.
- `Tooltip` for icon-only map controls and dense status controls.

The existing component primitives in `apps/game-client/src/components/ui` can be evolved rather than replaced wholesale. The implementation should follow shadcn local-component patterns: `cn`, variant classes where useful, `asChild` support for buttons when needed, and predictable prop passthrough including `data-test-id`.

All page regions, repeated rows, buttons, inputs, modals, status chips, and map SVG elements must have `data-test-id`.

## Visual Design

The game client should have one cohesive application style:

- A restrained game dashboard surface, not an editor clone.
- Dark readable background, warm neutral panels, measured accent colors, and texture-driven map variety.
- Cards should be used for individual panels and modals, not nested inside other cards.
- Dense information should be scan-friendly: compact headings, predictable panel layout, stable scrolling regions, and no text overlap on mobile or desktop.
- Use lucide icons in buttons and headings where icons clarify action or category.

The design should avoid scattering one-off Tailwind color expressions throughout component source. Styles should move into `styles/*.css` with tokens and semantic classes where it improves consistency.

## Map Design

`apps/game-client/src/features/map` gets its own implementation:

```text
features/map/
├── GameMapSvg.tsx
├── gameMapAssets.ts
├── gameMapHighlight.ts
├── gameMapLayout.ts
├── gamePlayerTile.ts
├── isometricGeometry.ts
└── *.test.ts
```

This implementation should port Story Lab's current behavior, not import it:

- project map tile coordinates into 45-degree isometric SVG space,
- depth-sort tiles by `x + y`, then `x`,
- compute responsive bounds and fit camera,
- support wheel zoom and pointer-drag panning,
- support click/tap selection without accidental selection after drag,
- support keyboard activation for tiles,
- render terrain textures, building textures, danger markers, selected/hover overlays, and player marker,
- expose an internal game detail drawer or adjacent panel region,
- derive all content from `ContentPack`, `GameRuntimeState`, and map tile data.

The map should integrate with gameplay:

- selecting a tile updates `runtime.selectedTileId`,
- selected tile details show location, NPCs, buildings, active events, and available actions,
- movement remains controlled by existing store behavior, so engine rules still decide whether travel succeeds,
- the player marker follows `runtime.player.locationId` by resolving the tile with that `locationId`,
- unavailable, hidden, blocked, or undiscovered tiles remain visually distinct and do not allow invalid gameplay actions.

## Shared Assets

Map texture imports should reference the existing shared asset location:

```text
apps/shared-assets/map/background.webp
apps/shared-assets/map/terrain/*.webp
apps/shared-assets/map/buildings/*.webp
```

`gameMapAssets.ts` should map schema terrain and building types to those URLs. Unknown building types should fall back to a generic residence-style asset. Unknown or unsupported terrain should fall back to a generated SVG/base diamond color, not a story-specific file.

No image files should be copied into `apps/game-client/src` or duplicated under `apps/game-client`.

## Data And Store

`store/game-store.ts` should keep the existing gameplay API but remove concrete story hardcoding:

- `SAVE_KEY` should be derived from a generic app namespace plus `contentPack.packId`, not a concrete story id.
- exported save filenames should use `contentPack.packId` and a generic suffix.
- identity page title and call-to-action should derive from `pack.title`, `pack.world.name`, or other content pack fields if available, with generic fallbacks.
- source code must not contain specific story names or location names.

The store can be split only if it reduces risk. A large behavioral store is acceptable for this refactor if the public selectors and action methods remain stable.

## Gameplay Panels

Existing panels should be preserved behaviorally and reorganized:

- Identity selection becomes `features/identity` plus `pages/game/identity-page.tsx`.
- Top status, player stats, inventory, local NPC relationships, and world variables move into focused feature folders.
- Event choice and event log move into `features/events`.
- Tile detail and map-specific action affordances move under `features/map`.
- Save controls move into `features/save`.
- Ending modal uses shadcn `Dialog`.

Each panel should consume store selectors directly or receive already-derived props from the page where that keeps the component simpler. Avoid duplicating complicated derivation logic in multiple panels; if derivation is shared, extract a local feature helper.

## Error Handling

- Store actions continue to set `lastError` for invalid imports, unavailable moves, unavailable actions, and event option failures.
- The shell renders a dismissible error banner with `data-test-id`.
- Import parsing failures should not crash the page.
- Missing map, missing selected tile, or content pack gaps should show empty states instead of throwing.

## Testing And Verification

Add focused tests where they give confidence without requiring a browser:

- isometric coordinate projection and bounds,
- SVG tile layout creation and stable test ids,
- map highlight style decisions,
- initial player tile resolution from runtime location and selected tile fallback,
- source constraints: no concrete story content in `apps/game-client/src`, core controls have `data-test-id`, and map assets import from `apps/shared-assets`.

Baseline note: at the start of this worktree on 2026-04-30, `pnpm typecheck` passes, while `pnpm test` has existing Story Lab source-test failures because tests still assert old content inside `apps/story-lab/src/pages/editor-pages.tsx` after pages were split into `pages/editor/*`. This refactor should not expand those Story Lab failures; final verification should at minimum run:

- `pnpm --filter @tss/game-client typecheck`
- `pnpm --filter @tss/game-client build`
- relevant new `vitest` tests for game-client map and source constraints
- full `pnpm test`, with any remaining unrelated Story Lab baseline failures called out

## Acceptance Criteria

- `apps/game-client` keeps the complete playable flow.
- The game map uses an independent game-client SVG isometric implementation and shared map assets.
- The game client UI consistently uses local shadcn-style primitives.
- Source code under `apps/game-client/src` contains no concrete story content hardcoding.
- Page elements and key SVG/map nodes have stable `data-test-id`.
- Game-client typecheck and build pass.
- Work is committed on the worktree branch, merged back to `main`, and the worktree is removed after merge.
