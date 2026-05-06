# Origin Intro Design

## Goal

Add a first-class origin introduction content type for player identities. The identity selection screen shows one sentence of character background, and the game shows a dismissible intro dialog after the player chooses an origin and enters the game.

## Data Model

Extend `PlayerIdentity` with content-authored fields:

- `backgroundSummary: string` for the identity selection card.
- `intro: { title: string; story: string; origin: string; motivation: string }` for the game entry dialog.

These fields live in `content/<pack>/identities.yaml` and are copied through the existing content source and packed JSON path. Game code must not contain concrete story names or authored story text.

## UI Flow

The identity page renders `backgroundSummary` under the existing identity description. After `selectIdentity`, the game page opens an origin intro dialog for the selected identity. The dialog displays the intro title plus three sections: story background, role origin, and motivation.

Closing the dialog persists a runtime fact, `origin_intro_seen`, so the same save does not show the dialog again. Loading an older save without the fact may show the intro once if identity intro content exists.

All new elements and controls must include `data-test-id`.

## Validation And Tests

Schema validation reports errors for identities missing `backgroundSummary` or any required `intro` field. Source constraint tests assert that the game client consumes identity intro fields and does not hardcode concrete story content. Content validation covers authored YAML fields.

## Skill Update

Update `.agents/skills/story-creation/SKILL.md` with guidance for writing identity origin intro fields: keep content in YAML, write a short selection summary, split full intro into story, origin, and motivation, and avoid duplicating mechanics-only advantage text.
