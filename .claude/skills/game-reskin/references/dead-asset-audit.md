# Dead-asset / old-game-leftover audit

Run this LAST, after art integration is done — earlier passes have false
negatives on anything not wired in yet. The scaffold step copies the source
game byte-for-byte, and nothing about the copy self-flags as "still old"; this
pass exists because every one of the examples below built cleanly, ran
cleanly, and was still wrong.

## What to grep for

**The old game's own name**, case-insensitive, across the shipped frontend
build output specifically (not just source — a template literal or a
half-renamed constant can survive into the bundle even after the source looks
clean):

```bash
grep -rin "hot ?miami" build/ | head   # substitute the actual source game's name
```

**The old game's palette.** Before renaming, pull the source game's own
distinctive hex values (its uiTheme.ts, its neon/signature accent colours) into
a short list, then grep the new game's source for them after theming is
"done":

```bash
grep -rn "ff8ede\|<old game's other signature hex values>" src/
```

This catches colours that leaked into SHARED components the new theme's own
files never touch directly — win-line palettes, symbol-land flash tints,
splash-panel plate colours, scrollbar gradients, modal backdrop tints. In Capo
Nostra these were found in `WinLines.svelte` (a 35-entry rainbow inherited
whole), `symbolWinMotion.ts`/`symbolLandMotion.ts` (a `NEON` colour table for
letters that had since become card suits), `FeatureSplashPanel.svelte` (a
plate colour and ink colour copied wholesale from a DIFFERENT reference game's
own card art, not even the direct source game's), and `Modals.svelte` (an
even earlier game's olive/GoBananas palette, inherited through a chain of
reskins rather than from the immediate source).

## Structural leftovers a grep won't catch

- **Symbol/character rigs still depicting the old cast.** If the source game
  used part-based rigs (`SYMBOL_RIGS` or similar — arm/head/torso pieces keyed
  by symbol) or mesh rigs, check what the individual PART FILES actually show,
  not just whether the registry entry resolves. A part can render without
  error while depicting the old game's mascot (a pink flamingo leg on a symbol
  that is now a city skyline). If the new theme's symbols don't support
  part-based animation, empty the rig table explicitly with a comment
  explaining why, rather than leaving it silently pointing at old art.
- **An asset overlay pointing at a PRE-PROCESSING-step file.** If any pipeline
  step (softening opacity, recolouring, building a sheet) produces both an
  intermediate and a final asset, grep every `src` reference to that asset
  family and confirm each one points at the FINAL file, not the source game's
  original or an intermediate step. A frame overlay used on a small intro-card
  icon can easily still point at the original because nobody looked at it at
  that size — it renders fine at full board size and wrong everywhere else.
- **Paytable/rules copy naming the WRONG asset.** If the source game's low or
  high symbols were redrawn to different subject matter, the display strings
  naming them (paytable labels, rules-panel prose, betmode summary text) do
  not update themselves — check every symbol's rendered art against its label
  side by side, not just that a label string exists for each symbol key.
- **Comments and docstrings citing stale figures.** Not user-facing, but worth
  a pass before a final HANDOFF write-up: numbers in code comments (an old
  RTP figure, an old game name in a "why this exists" note) that were true
  when written and are now misleading to the next reader.

## An asset that's wired and still never shows: skin-level overrides

The registry can resolve a key, the component can be correctly wired to read
it, and the art can even be genuinely reskinned — and it can still never
render, because a THEME-SKIN-LEVEL override further down the same file clears
the sprite map for that key on the skin that's actually active. This is a
different failure from everything else in this document: those are all about
old content sitting where new content should be; this one is about new
content that's correct and simply never gets drawn.

Concretely, in Capo Nostra (`src/game/uiTheme.ts`): the base theme wired
`sprites.buyBonus` to a custom plate asset from day one, matching Hot Miami's
own drawn-UI look. But the game also ships a second "platform chrome" skin —
a neutral, cross-title casing Hacksaw's own UI files use, selected as the
DEFAULT — and that skin's own theme object set `sprites: {}`, deliberately
emptying the sprite map to keep a flat, generic bet bar. `ButtonBuyBonus`'s
fallback path (custom sprite if the key resolves, else a flat drawn rect)
then silently drew the flat rect under the active default skin, regardless of
whether a themed plate asset existed and was correctly registered elsewhere in
the same file. Weeks of screenshots showed a plain black rounded rectangle and
nobody caught why, because every individual link in the chain — asset file,
registry entry, component wiring — was checked and was fine in isolation.

**If a game defines more than one UI skin/theme variant, grep every variant's
own sprite/colour map for the key in question, not just the "main" one.**
`grep -n "sprites:" src/game/uiTheme.ts` (or equivalent) and read what each
match actually contains — an empty object several skins down is easy to miss
scrolling past it once, and it silently wins if it's the active default.

## Unreferenced asset folders

Compare what the asset registry (`assets.ts` or equivalent) actually
references against what exists under the static asset root. Anything present
but unreferenced is dead weight in the upload, and worth a deliberate
decision (delete vs. keep for a feature not yet built) rather than silent
inclusion:

```bash
# crude but effective: list asset subfolders, then check each for any
# reference in the registry file
for d in static/assets/*/*/; do
  name=$(basename "$d")
  grep -q "$name" src/game/assets.ts || echo "UNREFERENCED: $d"
done
```

Before deleting anything found this way, check whether it forecloses restoring
a feature that's simply not wired yet (part-based win animations, an
alternate cast) — that's a call for the user, not a default "delete unused
files" pass.

## Shared-component interaction check

Things that are correct on their own can still collide once combined — this
isn't a leftover-art problem but belongs in the same final pass because it has
the same shape (something that renders fine in isolation and wrong once you
actually look at the composed screen). Concretely: open every menu/overlay
state and check what it draws OVER, not just what it draws. Capo Nostra's
menu, when expanded, drew a full-screen click-catching scrim but a sibling
Buy Bonus button was still rendered on top of it, visually overlapping the
paytable/info icons underneath — correct on its own, wrong once opened
together.
