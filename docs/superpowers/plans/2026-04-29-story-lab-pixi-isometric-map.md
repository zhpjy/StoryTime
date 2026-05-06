# Story Lab Pixi Isometric Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `story-lab` DOM map grid with a PixiJS 45-degree isometric map that uses shared copied demo assets, supports hover, selection, player movement, zoom, and drag panning.

**Architecture:** Keep React responsible for page state and the right-side details drawer, and isolate Pixi lifecycle inside a focused `StoryMapCanvas` component. Put projection/player helper logic in pure TypeScript modules so it can be tested before the Pixi UI work. Copy demo assets into `apps/shared-assets/map/` for future reuse by both app packages.

**Tech Stack:** React 19, Vite, TypeScript, PixiJS, Vitest, existing `@tss/schema` content types.

---

## File Structure

- Create `apps/story-lab/src/features/map/isometricGeometry.ts`: pure isometric projection, bounds, sorting, and fit helpers.
- Create `apps/story-lab/src/features/map/playerTile.ts`: pure initial player tile derivation and move eligibility helpers.
- Create `apps/story-lab/src/features/map/mapAssets.ts`: Vite URL imports for shared terrain and character assets.
- Create `apps/story-lab/src/features/map/StoryMapCanvas.tsx`: React wrapper that creates and updates PixiJS stage.
- Create tests under `apps/story-lab/src/features/map/*.test.ts`.
- Modify `apps/story-lab/src/pages/editor-pages.tsx`: replace the DOM grid with `StoryMapCanvas`, add player state and detail drawer controls.
- Modify `apps/story-lab/src/styles.css`: Pixi map viewport, toolbar, drawer, and responsive styles.
- Modify `apps/story-lab/package.json` and `pnpm-lock.yaml`: add `pixi.js`.
- Create `apps/shared-assets/map/**`: copied terrain, building, and character image assets from `time-space-story-map-demo/assets`.

## Task 1: Shared Assets And Dependency

**Files:**
- Create: `apps/shared-assets/map/terrain/*.png`
- Create: `apps/shared-assets/map/buildings/*.png`
- Create: `apps/shared-assets/map/characters/*.png`
- Modify: `apps/story-lab/package.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Copy source image assets**

Run:

```bash
mkdir -p apps/shared-assets/map
cp -R /Users/jessetzh/CodeSpace/StoryTime/time-space-story-map-demo/assets/terrain apps/shared-assets/map/
cp -R /Users/jessetzh/CodeSpace/StoryTime/time-space-story-map-demo/assets/buildings apps/shared-assets/map/
cp -R /Users/jessetzh/CodeSpace/StoryTime/time-space-story-map-demo/assets/characters apps/shared-assets/map/
```

Expected: `apps/shared-assets/map/terrain`, `apps/shared-assets/map/buildings`, and `apps/shared-assets/map/characters` exist.

- [ ] **Step 2: Add PixiJS dependency**

Run:

```bash
pnpm --filter @tss/story-lab add pixi.js
```

Expected: `apps/story-lab/package.json` contains `pixi.js` and `pnpm-lock.yaml` updates.

## Task 2: Pure Geometry Helpers

**Files:**
- Create: `apps/story-lab/src/features/map/isometricGeometry.test.ts`
- Create: `apps/story-lab/src/features/map/isometricGeometry.ts`

- [ ] **Step 1: Write failing tests**

Test projection, depth sorting, and bounds normalization:

```ts
import { describe, expect, it } from 'vitest'
import { compareTilesByIsoDepth, getIsoMapBounds, tileToIsoWorld } from './isometricGeometry'

describe('isometricGeometry', () => {
  it('projects tile coordinates into 45-degree isometric world space', () => {
    expect(tileToIsoWorld({ x: 2, y: 1 }, { tileWidth: 180, tileHeight: 90 })).toEqual({ x: 90, y: 135 })
  })

  it('sorts tiles by isometric depth', () => {
    const sorted = [
      { id: 'far', x: 2, y: 2 },
      { id: 'near-left', x: 1, y: 1 },
      { id: 'near-right', x: 2, y: 0 },
    ].sort(compareTilesByIsoDepth)
    expect(sorted.map((tile) => tile.id)).toEqual(['near-left', 'near-right', 'far'])
  })

  it('computes padded map bounds from projected tiles', () => {
    expect(getIsoMapBounds([{ x: 1, y: 1 }, { x: 3, y: 2 }], { tileWidth: 180, tileHeight: 90, padding: 24 })).toEqual({
      minX: -24,
      minY: 66,
      maxX: 114,
      maxY: 249,
      width: 138,
      height: 183,
      centerX: 45,
      centerY: 157.5,
    })
  })
})
```

- [ ] **Step 2: Verify red**

Run:

```bash
pnpm vitest run apps/story-lab/src/features/map/isometricGeometry.test.ts
```

Expected: FAIL because `isometricGeometry` does not exist.

- [ ] **Step 3: Implement geometry helpers**

Create exported `tileToIsoWorld`, `compareTilesByIsoDepth`, and `getIsoMapBounds` functions using the formulas in the spec.

- [ ] **Step 4: Verify green**

Run:

```bash
pnpm vitest run apps/story-lab/src/features/map/isometricGeometry.test.ts
```

Expected: PASS.

## Task 3: Player Tile Helpers

**Files:**
- Create: `apps/story-lab/src/features/map/playerTile.test.ts`
- Create: `apps/story-lab/src/features/map/playerTile.ts`

- [ ] **Step 1: Write failing tests**

Test initial tile derivation and movement eligibility:

```ts
import { describe, expect, it } from 'vitest'
import type { MapTile } from '@tss/schema'
import { canMovePlayerToTile, resolveInitialPlayerTileId } from './playerTile'

const tile = (id: string, overrides: Partial<MapTile> = {}): MapTile => ({
  id,
  name: id,
  x: 1,
  y: 1,
  terrain: 'road',
  buildingIds: [],
  npcIds: [],
  eventIds: [],
  discovered: true,
  visible: true,
  blocked: false,
  dangerLevel: 0,
  ...overrides,
})

describe('playerTile', () => {
  it('prefers the tile matching the runtime initial player location', () => {
    expect(resolveInitialPlayerTileId([tile('a'), tile('b', { locationId: 'loc_b' })], 'loc_b', 'a')).toBe('b')
  })

  it('falls back to selected tile, visible tile, then first tile', () => {
    expect(resolveInitialPlayerTileId([tile('a', { visible: false }), tile('b')], 'missing', 'a')).toBe('a')
    expect(resolveInitialPlayerTileId([tile('a', { visible: false }), tile('b')], 'missing')).toBe('b')
  })

  it('blocks movement to hidden, blocked, or current tiles', () => {
    expect(canMovePlayerToTile(tile('a'), 'b')).toBe(true)
    expect(canMovePlayerToTile(tile('a', { blocked: true }), 'b')).toBe(false)
    expect(canMovePlayerToTile(tile('a', { visible: false }), 'b')).toBe(false)
    expect(canMovePlayerToTile(tile('a'), 'a')).toBe(false)
  })
})
```

- [ ] **Step 2: Verify red**

Run:

```bash
pnpm vitest run apps/story-lab/src/features/map/playerTile.test.ts
```

Expected: FAIL because `playerTile` does not exist.

- [ ] **Step 3: Implement helpers**

Create `resolveInitialPlayerTileId` and `canMovePlayerToTile` with the fallback and disabled-state behavior from the spec.

- [ ] **Step 4: Verify green**

Run:

```bash
pnpm vitest run apps/story-lab/src/features/map/playerTile.test.ts
```

Expected: PASS.

## Task 4: Pixi Map Component And Page Integration

**Files:**
- Create: `apps/story-lab/src/features/map/mapAssets.ts`
- Create: `apps/story-lab/src/features/map/StoryMapCanvas.tsx`
- Modify: `apps/story-lab/src/pages/editor-pages.tsx`
- Modify: `apps/story-lab/src/styles.css`

- [ ] **Step 1: Add asset URL imports**

Create `mapAssets.ts` with terrain URL mappings from `apps/shared-assets/map/terrain`, map `river` to water, and export protagonist image URL.

- [ ] **Step 2: Implement `StoryMapCanvas`**

Use PixiJS to create a canvas, render terrain sprites in isometric depth order, draw hover and selected diamond overlays, draw protagonist sprite, handle wheel zoom, drag panning, reset fit, and click selection.

- [ ] **Step 3: Integrate in `MapPage`**

Replace `.map-grid` with `StoryMapCanvas`, keep React details panel, add player tile state, movement button, player status, NPC/building/event/action sections, and stable `data-test-id` attributes for all DOM elements.

- [ ] **Step 4: Style the map tool surface**

Add `.map-stage-shell`, `.map-canvas-host`, `.map-toolbar`, `.map-detail-drawer`, and responsive styles with stable dimensions and no nested cards.

## Task 5: Verification And Commit

**Files:**
- All changed implementation files.

- [ ] **Step 1: Run focused tests**

Run:

```bash
pnpm vitest run apps/story-lab/src/features/map/isometricGeometry.test.ts apps/story-lab/src/features/map/playerTile.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run constraints tests**

Run:

```bash
pnpm vitest run scripts/story-lab-test-ids.test.ts scripts/story-lab-source-constraints.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run story-lab checks**

Run:

```bash
pnpm --filter @tss/story-lab typecheck
pnpm --filter @tss/story-lab build
```

Expected: PASS.

- [ ] **Step 4: Commit the implementation**

Run:

```bash
git add apps/shared-assets apps/story-lab package.json pnpm-lock.yaml docs/superpowers/plans/2026-04-29-story-lab-pixi-isometric-map.md
git commit -m "Implement Pixi isometric story map"
```

Expected: one implementation commit on `feat/story-lab-pixi-map`.
