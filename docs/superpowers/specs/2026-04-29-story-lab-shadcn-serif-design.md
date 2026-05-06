# Story Lab shadcn Serif Design

## Goal

Refactor Story Lab to use a local shadcn-style component foundation, apply the Serif editorial design system across the app, and make all page elements addressable through stable `data-test-id` attributes.

## Scope

- Story Lab only: `apps/story-lab`.
- Introduce shadcn-style local primitives for the controls currently used by Story Lab.
- Standardize the visual language around Serif tokens: ivory canvas, rich black text, warm gray secondary text, burnished gold accents, fine rule lines, white cards, restrained shadows, and editorial typography.
- Add test IDs to page shells, navigation, controls, cards, list rows, repeated items, tabs, modals, and key content regions.
- Remove hardcoded concrete story examples from Story Lab source code. Real content packs under `content/` are not changed.

## Non-Goals

- Do not rewrite Story Lab data flow or editor behavior.
- Do not migrate the game client.
- Do not import large unused shadcn component sets.
- Do not hardcode any concrete story content in UI source.

## Architecture

Story Lab will keep its current React/Vite structure, but its `components/ui.tsx` primitives will be rewritten with the shadcn local-component pattern: `cva` variants, `Slot` support for buttons, and class merging through `cn`. The app will use CSS variables as the single source of styling tokens, with page-specific classes consuming those tokens instead of hardcoded colors.

The pages in `editor-pages.tsx` will stay in one file for this refactor to avoid unrelated restructuring. Test IDs will be added in place, using stable content IDs where available.

## Component Model

- `Button`: shadcn-style variants for `default`, `secondary`, `ghost`, `outline`, plus `asChild`.
- `Card`, `CardHeader`, `CardTitle`, `CardContent`: shadcn-style class composition with test ID passthrough.
- `Badge`: shadcn-style variants and tone classes for existing status/severity values.
- Existing helper components in `common.tsx` remain, but expose `testId` where repeated UI requires deterministic selection.

## Styling Model

`apps/story-lab/src/styles.css` will be reorganized into:

- font imports and design tokens,
- base/reset rules,
- shell and navigation,
- primitive component styles,
- page layout utilities,
- domain widgets,
- responsive behavior.

The style rules should avoid one-off color values where a token exists. Component and state classes should reference variables such as `--background`, `--foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-secondary`, `--border`, `--card`, and `--ring`.

## Testing And Verification

- Add focused tests for Story Lab source constraints:
  - no concrete story examples in `apps/story-lab/src`,
  - all current `button` and `select` elements include `data-test-id`,
  - core shadcn-style primitives expose expected classes and test IDs.
- Run Story Lab typecheck.
- Run Story Lab build.
- Run the full existing Vitest suite if feasible.

## Worktree Cleanup

Implementation happens in `.worktrees/story-lab-shadcn-serif`. After the branch is merged or no longer needed, remove the worktree as required by `AGENTS.md`.
