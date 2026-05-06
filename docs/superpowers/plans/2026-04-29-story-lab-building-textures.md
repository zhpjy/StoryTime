# Story Lab Building Textures Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render building artwork on Story Lab map location tiles while removing protagonist artwork from the canvas.

**Architecture:** Asset imports and generic building-type mapping live in `apps/story-lab/src/features/map/mapAssets.ts`. `StoryMapCanvas` receives content-pack buildings, loads the resolved building textures, and renders a single building sprite per tile above terrain.

**Tech Stack:** React, Pixi.js, TypeScript, Vitest.

---

### Task 1: Building Asset Resolution

**Files:**
- Modify: `apps/story-lab/src/features/map/mapAssets.ts`
- Test: `apps/story-lab/src/features/map/mapAssets.test.ts`

- [ ] **Step 1: Write the failing test**

Create `mapAssets.test.ts` with tests for generic type mapping and unknown fallback.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test apps/story-lab/src/features/map/mapAssets.test.ts`

Expected: FAIL because the resolver is not exported yet.

- [ ] **Step 3: Implement resolver and asset exports**

Import building PNGs, export `mapBuildingAssetUrls`, and export a resolver that maps generic building types such as tavern, rice shop, herb shop, ruined temple, ancestral hall, guard post, pavilion, and residence.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test apps/story-lab/src/features/map/mapAssets.test.ts`

Expected: PASS.

### Task 2: Pixi Map Rendering

**Files:**
- Modify: `apps/story-lab/src/features/map/StoryMapCanvas.tsx`
- Modify: `apps/story-lab/src/pages/editor-pages.tsx`

- [ ] **Step 1: Pass buildings into the canvas**

Add a `buildings: ContentPack['buildings']` prop at the Story Lab map page call site.

- [ ] **Step 2: Load building textures**

Extend `LoadedTextures` with building textures and remove protagonist texture loading.

- [ ] **Step 3: Render building sprite per tile**

Resolve the tile's first matching building texture from `tile.buildingIds`, then draw it above terrain using stable dimensions and anchor values.

- [ ] **Step 4: Remove protagonist canvas display**

Delete player sprite constants, texture usage, animation display creation, and stage insertion. Keep logical player tile state and movement controls.

- [ ] **Step 5: Verify**

Run: `pnpm test apps/story-lab/src/features/map && pnpm exec tsc -p apps/story-lab/tsconfig.json --noEmit`

Expected: PASS.
