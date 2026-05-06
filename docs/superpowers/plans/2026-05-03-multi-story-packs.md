# Multi Story Packs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add manifest-driven story-pack selection to `apps/game-client` and add a second simple content pack for testing.

**Architecture:** The client loads only the generated content manifest at startup, renders a generic pack selection page, then fetches and initializes the selected content pack. Content pack metadata and story text remain in `content/packs/*.json` artifacts, not in client source.

**Tech Stack:** React 19, Vite, Zustand, Vitest, TypeScript, YAML content source, existing StoryTime schema/engine/validator packages.

---

## File Structure

- Modify `apps/game-client/src/store/content-loader.ts`: replace default-pack loading with manifest and selected-pack loading APIs.
- Modify `apps/game-client/src/store/content-loader.test.ts`: test manifest loading, selected-pack loading, and fetch errors.
- Create `apps/game-client/src/pages/game/story-pack-select-page.tsx`: generic selection UI with `data-test-id` on every page element and control.
- Modify `apps/game-client/src/App.tsx`: manage manifest/load state and selected-pack initialization before identity/game pages.
- Modify `apps/game-client/src/main.tsx`: render `<App />` immediately and remove startup default-pack fetch.
- Modify `scripts/game-client-source-constraints.test.ts`: assert the new selection page is addressable and the old default-pack startup is gone.
- Create `content/demo-crossroads/**`: minimal story pack source.
- Regenerate `content/packs/manifest.json` and generated pack JSON files with `pnpm build:content-pack`.

### Task 1: Content Loader API

**Files:**
- Modify: `apps/game-client/src/store/content-loader.test.ts`
- Modify: `apps/game-client/src/store/content-loader.ts`

- [ ] **Step 1: Write failing tests**

Add tests that import `loadContentPackManifest` and `loadContentPack`, stub `fetch`, and expect:

```ts
await expect(loadContentPackManifest()).resolves.toEqual(manifest)
await expect(loadContentPack(manifest.packs[1])).resolves.toEqual(pack)
expect(fetchMock).toHaveBeenNthCalledWith(1, '/content-packs/manifest.json')
expect(fetchMock).toHaveBeenNthCalledWith(2, '/content-packs/pack_fixture.json')
await expect(loadContentPackManifest()).rejects.toThrow(/Failed to load/)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run apps/game-client/src/store/content-loader.test.ts`

Expected: TypeScript import failure because the new functions do not exist.

- [ ] **Step 3: Implement loader functions**

In `content-loader.ts`, define and export `ContentPackManifestEntry`, `ContentPackManifest`, `loadContentPackManifest()`, and `loadContentPack(entry)`. Keep `fetchJson<T>()` generic and preserve useful HTTP status errors.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run apps/game-client/src/store/content-loader.test.ts`

Expected: all tests in the file pass.

### Task 2: Story Pack Selection Startup

**Files:**
- Create: `apps/game-client/src/pages/game/story-pack-select-page.tsx`
- Modify: `apps/game-client/src/App.tsx`
- Modify: `apps/game-client/src/main.tsx`
- Modify: `scripts/game-client-source-constraints.test.ts`

- [ ] **Step 1: Write failing source constraint test**

In `scripts/game-client-source-constraints.test.ts`, add the new page to top-level required sources and assert:

```ts
const appSource = readSource('apps/game-client/src/App.tsx')
const mainSource = readSource('apps/game-client/src/main.tsx')
const selectSource = readSource('apps/game-client/src/pages/game/story-pack-select-page.tsx')

expect(mainSource).not.toContain('loadDefaultContentPack')
expect(appSource).toContain('StoryPackSelectPage')
expect(selectSource).toContain('data-test-id="story-pack-select-page"')
expect(selectSource).toContain('data-test-id={`story-pack-select-card-${pack.packId}`}')
expect(selectSource).not.toMatch(/青岚|qinglan|Qinglan/)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run scripts/game-client-source-constraints.test.ts`

Expected: failure because the new page and startup changes do not exist.

- [ ] **Step 3: Implement the page and startup state**

Create `StoryPackSelectPage` with props:

```ts
type StoryPackSelectPageProps = {
  packs: ContentPackManifestEntry[]
  loadingPackId?: string
  error?: string
  onSelectPack: (pack: ContentPackManifestEntry) => void
}
```

Use existing `Card`, `Button`, and `Badge` UI primitives. Use generic labels only.

Update `App.tsx` to load the manifest in `useEffect`, render loading/error states with `data-test-id`, render `StoryPackSelectPage`, load the selected pack, call `initializeGameStore`, call `loadSavedGame`, and then render existing identity/game pages inside `GameShell`.

Update `main.tsx` to remove default-pack loading and always render `<App />`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run scripts/game-client-source-constraints.test.ts`

Expected: source constraints pass.

### Task 3: Minimal Test Content Pack

**Files:**
- Create: `content/demo-crossroads/world.yaml`
- Create: `content/demo-crossroads/variables.yaml`
- Create: `content/demo-crossroads/maps.yaml`
- Create: `content/demo-crossroads/locations.yaml`
- Create: `content/demo-crossroads/buildings.yaml`
- Create: `content/demo-crossroads/factions.yaml`
- Create: `content/demo-crossroads/identities.yaml`
- Create: `content/demo-crossroads/actions.yaml`
- Create: `content/demo-crossroads/events.yaml`
- Create: `content/demo-crossroads/items.yaml`
- Create: `content/demo-crossroads/endings.yaml`
- Create: `content/demo-crossroads/runtime.yaml`
- Create: `content/demo-crossroads/npcs/index.yaml`
- Create: `content/demo-crossroads/npcs/guide/identity.yaml`
- Create: `content/demo-crossroads/npcs/guide/background.yaml`
- Create: `content/demo-crossroads/npcs/guide/attributes.yaml`
- Create: `content/demo-crossroads/npcs/guide/relationships.yaml`
- Create: `content/demo-crossroads/npcs/guide/behavior.yaml`
- Create: `content/demo-crossroads/npcs/guide/conversations.yaml`
- Modify generated: `content/packs/manifest.json`
- Create generated: `content/packs/demo_crossroads.json`

- [ ] **Step 1: Create minimal source content**

Author a small original pack with pack id `demo_crossroads`, one map tile, one location, one building, one faction, one player identity with required intro fields, one guide NPC, one investigation action, one conversation, one variable, and one ending.

- [ ] **Step 2: Validate source content**

Run: `pnpm validate:content`

Expected: reports for all source packs with no `severity: "error"` issues.

- [ ] **Step 3: Generate artifacts**

Run: `pnpm build:content-pack`

Expected: output includes generated JSON for the existing pack, `content/packs/demo_crossroads.json`, and `content/packs/manifest.json`.

### Task 4: Full Verification

**Files:**
- Verify all modified files.

- [ ] **Step 1: Run unit tests**

Run: `pnpm test`

Expected: all tests pass.

- [ ] **Step 2: Run content validation**

Run: `pnpm validate:content`

Expected: no error-severity validation issues.

- [ ] **Step 3: Run game-client typecheck**

Run: `pnpm --filter @tss/game-client typecheck`

Expected: TypeScript exits 0.

- [ ] **Step 4: Run game-client build**

Run: `pnpm --filter @tss/game-client build`

Expected: Vite build exits 0.

## Self Review

- Spec coverage: startup selection, manifest-based loading, no default auto-play, data-test ids, generic client source, and new content pack are covered.
- Placeholder scan: no placeholder instructions remain.
- Type consistency: `ContentPackManifestEntry`, `StoryPackSelectPage`, `loadContentPackManifest`, and `loadContentPack` are named consistently across tasks.
