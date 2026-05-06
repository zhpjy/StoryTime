# Story Lab Building Textures Design

## Goal

Story Lab's isometric map should show building artwork on location tiles and stop rendering the protagonist artwork on the canvas.

## Scope

- Add building texture support to the existing Pixi map.
- Resolve building art from content-pack building metadata without hardcoding story-specific names or locations.
- Keep map selection, hover, camera controls, movement state, and detail-panel player position behavior intact.
- Remove protagonist image loading and sprite rendering from the canvas.

## Approach

`mapAssets.ts` owns map asset URL imports and texture selection rules. It will expose a small building asset key set and a resolver that maps generic `Building.type` values to the closest available building artwork. Unknown building types fall back to a generic residence artwork.

`StoryMapCanvas` receives `buildings` from the page, loads building textures alongside terrain textures, and draws a building sprite on top of the terrain sprite when a tile has at least one matching building. If a tile has multiple buildings, the first building that resolves to a known texture determines the visible artwork.

The protagonist sprite and character asset import are removed. Movement remains a logical state used by buttons and detail text, but the canvas no longer adds a player display layer.

## Testing

- Unit-test the building texture resolver with representative generic building types and an unknown fallback.
- Run existing map tests to protect isometric sorting and player movement logic.
- Run Story Lab typecheck to verify Pixi texture and React prop changes.
