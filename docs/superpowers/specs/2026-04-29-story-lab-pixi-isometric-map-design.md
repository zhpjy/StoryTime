# Story Lab Pixi Isometric Map Design

## Context

`story-lab` currently renders maps as a React DOM grid of buttons. The user wants this map replaced with a PixiJS 45-degree isometric map inspired by `time-space-story-map-demo`, with terrain textures, hover highlighting, tile selection, a right-side drawer, a visible player character, movement between tiles, zoom, and drag panning.

The implementation must follow repository constraints:

- All page-level and control DOM elements need stable `data-test-id` attributes.
- Code must not hardcode specific story content, location names, or NPC names.
- Existing uncommitted `time-space-story-map-demo` files are source reference input and must not be overwritten.
- Map image assets must come from `time-space-story-map-demo/assets`, then be copied into an `apps`-level shared asset location so `apps/story-lab` and `apps/game-client` can reuse the same files.

## Goals

- Render `ContentPack.maps[0].tiles` as a 45-degree isometric map using PixiJS.
- Display different terrain textures based on `MapTile.terrain`.
- Highlight the tile under the mouse.
- Select a tile on click and show a right-side details panel with tile summary data and related NPCs.
- Show the player character on the map.
- Allow the player character to move between walkable tiles.
- Support wheel zoom and pointer drag panning.
- Preserve the existing `MapPage` data flow: selection is still represented by `selectedTileId`, and tile details are derived from schema data.

## Non-Goals

- No story-specific map layout, names, NPCs, or location copy in code.
- No content schema changes.
- No pathfinding requirement. Movement can be direct tile-to-tile unless a later requirement asks for route constraints.
- No in-canvas text-heavy detail panel. The details panel remains React DOM for testability and accessibility.
- No editing of map data from the Pixi view.

## Architecture

### New Component Boundary

Add a focused `StoryMapCanvas` React component under `apps/story-lab/src/components/` or a map-specific feature directory.

The component owns Pixi lifecycle:

- Create and destroy `PIXI.Application`.
- Load or generate textures.
- Build display containers for terrain, overlays, and player marker.
- Translate map data into isometric world positions.
- Emit tile selections through `onSelectTile(tileId)`.
- Keep Pixi state synchronized with React props for selected tile and player tile.

`MapPage` remains the page orchestrator:

- Computes selected tile, selected location, NPCs, buildings, events, and actions.
- Renders the `StoryMapCanvas`.
- Renders the right-side detail drawer/panel with DOM `data-test-id` attributes.
- Holds transient player tile state if needed.

### Data Flow

Inputs:

- `map`: `ContentPack['maps'][number]`
- `pack`: `ContentPack`
- `selectedTile`: `MapTile | undefined`
- `selectedLocation`: `Location | undefined`
- `initialPlayerLocationId`: from `pack.runtime.initialState.playerLocationId`
- `onSelectTile(tileId: string)`: existing selection callback

Derived values:

- Initial player tile is the tile whose `locationId` matches `initialPlayerLocationId`; fallback to `runtime.initialState.selectedTileId`; fallback to first visible tile; fallback to first tile.
- Tile NPC list comes from `tile.npcIds`, with fallback support for NPCs whose `location` equals selected location id.
- Tile description prefers selected location `descriptions.default`; otherwise uses tile name and metadata because `MapTile` has no description field.

State:

- React keeps selected tile id.
- React or `StoryMapCanvas` keeps player tile id. The page should expose current player tile in DOM status text so tests can assert movement.
- Pixi keeps camera pan/zoom and hover tile id.

### Isometric Projection

Use the same projection pattern as the demo, adapted to schema fields:

```ts
worldX = (tile.x - tile.y) * tileWidth / 2
worldY = (tile.x + tile.y) * tileHeight / 2
```

The renderer should normalize map origin by computing bounds from all projected tiles, then center the map in the viewport. This avoids assumptions about whether tile coordinates start at 0 or 1.

Tiles render in depth order:

```ts
tile.x + tile.y, then tile.x
```

### Terrain Textures

Terrain texture lookup is keyed by `TerrainType`, not by story content. Existing terrain values include:

- `town`
- `road`
- `forest`
- `ruin`
- `river`
- `mountain`

The demo also has assets for `plain`, `farmland`, `water`, and `shrub`. Unsupported or missing terrain texture keys should fall back to a generated diamond texture with terrain-specific color. `river` can use the demo water texture if no river-specific image exists.

Assets must be copied from `time-space-story-map-demo/assets` into a shared location under `apps`, not duplicated inside only one app and not referenced directly from the demo directory at runtime. The intended layout is an `apps/shared-assets/map/` directory with terrain, building, and character subdirectories copied from the demo assets. Both `apps/story-lab` and `apps/game-client` should import from that shared app-level asset location through Vite-compatible URLs so production builds include the files.

### Interaction

Hover:

- Each tile display object is interactive.
- Pointer enter sets hover tile id and shows a translucent diamond overlay.
- Pointer leave clears hover tile id.

Click:

- Clicking a tile calls `onSelectTile(tile.id)`.
- The right-side panel opens or updates immediately.
- Selected tile overlay remains visible until another tile is selected.

Movement:

- A "move player" control in the right-side panel moves the player to the selected tile.
- Disabled when no selected tile, selected tile is blocked, selected tile is invisible, or selected tile is already the player tile.
- Movement animates player marker from current tile center to selected tile center.
- Player position state updates after animation completes.

Camera:

- Wheel zoom clamps to a reasonable range.
- Pointer drag pans the map container.
- A reset/fit button restores map to fit the viewport.
- Dragging should not accidentally select a tile.

### Right-Side Panel

The existing `map-detail-card` becomes a drawer-like details panel within the map layout. It must show:

- Selected tile name and id.
- Location name when present.
- Terrain, danger, visible/discovered/blocked state.
- Description from location default description when present, or a generic tile metadata summary.
- NPCs on the selected tile.
- Buildings, events, and actions related to the selected location.
- Player position and movement button.

All visible DOM sections and controls must have stable `data-test-id` values.

### Styling

The map canvas area should be a professional editor tool surface:

- Full-width within its card, with stable height and responsive min-height.
- No nested cards inside cards.
- Keep controls compact and icon-based where practical.
- Avoid one-note palettes. Terrain textures should provide visual variety while surrounding UI stays consistent with `story-lab`.
- Text must not overlap controls or viewport overlays.

### Testing

Use test-first implementation where feasible:

- Add unit tests for pure projection and bounds helpers before implementation.
- Add tests for initial player tile derivation.
- Add component tests if the existing setup supports them; otherwise verify with typecheck and build.
- Manual verification should include hover, click selection, drawer content, movement, zoom, drag, and reset fit.

Expected verification commands:

- `pnpm --filter @tss/story-lab typecheck`
- `pnpm --filter @tss/story-lab build`

## Open Decisions Resolved

- PixiJS is the required renderer.
- The right-side detail panel stays in React DOM for maintainability and test location.
- Movement is direct between tiles, not pathfinding.
- Terrain rendering uses schema terrain keys and never hardcodes story-specific content.
