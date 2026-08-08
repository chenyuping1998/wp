# Margin Call — handoff

Ways game. Basegame 5x3 (243 ways); the feature game (LIQUIDATION RUN) grows the
board to 5x5 (3125 ways) and runs a leverage meter that only ratchets upwards.

Math lives at `math-sdk/games/MarginCall/` — read its `readme.txt` first, it
carries the measured balance numbers and the two custom events.

* RTP 0.96 — basegame 0.25 + feature 0.69 + wincap 0.02
* Max win 12,000x, feature entry 200x, natural trigger ~1 in 300

The math has had a full pipeline pass: 100,000 rounds per mode, optimizer
weights applied, RGS format checks green (SHA-256 and payout hash on both
modes). `library/publish_files/` holds what gets uploaded. Both modes land on
RTP 0.960; base hits 1 in 3.46 spins with max win at 1 in 600,000, the bought
feature averages 192x with max win at 1 in 3,000.

`src/game/config.ts` is generated from that run — re-run `node
design/sync_math_config.mjs` after any further math change, or the pay-table
panel will quietly show the old numbers.

## State of this app

Scaffolded from `apps/GoBananas` (closest reel-spin game, already 5 rows, and it
carries the SVG→PNG art pipeline). The GoBananas mechanics — paylines, expanding
wilds, sticky prizes, the superspin mode — are gone, and the game logic, the
event handling and the player-facing copy are Margin Call's.

`pnpm --dir <abs path> build` is green and all four static guards pass:

```
OK: no undefined template references
OK: no restricted words in social-facing copy
OK: all 46 asset paths resolve
OK: all 20 audio cues resolve
```

`check_audio.mjs` is new. The sound set does not go through the pixi asset
pipeline — `Sound.svelte` builds `${base}/assets/audio/…` at runtime from two
string maps, so `check_assets.mjs` never sees it and a missing cue fails the only
way audio ever fails: silently, with the rejected `play()` promise caught and
dropped on purpose. The guard reads both maps back out of the source and checks
the files exist. It was validated against a known-positive (a renamed file) so
its "OK" means something.

Dev port 3004, storybook 6004 (no stories yet — the copied ones were GoBananas
data and were deleted).

### The first upload was a black screen

Worth reading before trusting a green build here.

The first build uploaded fine and rendered nothing — not even the provider logo.
Cause: `createReelForSpinning` resolved `getReelLength()` **while constructing
the reel**, and this game's getter reads `stateGame.rows`. Reels are built at
module scope above the `export const stateGame`, so that call touched it inside
its temporal dead zone:

```
ReferenceError: Cannot access 'stateGame' before initialization
    at src/game/stateGame.svelte.ts:53
```

Every module that imports the game state dies with it. Fixed in
`packages/utils-slots` by taking the creation-time value from `initialSymbols`
instead — provably the same number for every game, and creation no longer calls
into the caller's state at all.

**Nothing in the build could have caught it.** `+layout.ts` sets `ssr = false`,
so prerendering emits a shell and never evaluates the game modules. Four green
guards and a green build, and the game was dead.

Confirmed by bisecting against the running dev server: with the old line, no
canvas and that ReferenceError; with the fix, a clean console and a mounted
canvas. GoBananas was booted too, since the change is in a shared package.

### What is still unverified

The app boots and the loading screen renders. **No round has been played** —
no spin, no board expansion, no leverage fly-in. Those need a real RGS session.
The things most likely to be wrong are under "Watch on first run" below.

## What is Margin Call specific

| Area | File |
|---|---|
| board height as state (`stateGame.rows`) | `src/game/stateGame.svelte.ts` |
| geometry as functions of the row count | `src/game/constants.ts` |
| ways `winInfo`, `boardExpand`, `leverageUpdate` | `src/game/typesBookEvent.ts` |
| event handling | `src/game/bookEventHandlerMap.ts` |
| leverage meter | `src/components/LeverageMeter.svelte` |
| math → `config.ts` sync, with validation | `design/sync_math_config.mjs` |
| symbol + background art | `design/generate_symbols.mjs` |

Ways wins have no line to draw, so `winInfo` lights the winning positions
directly (`animateSymbols`), deduplicated — a position can belong to several
wins, and animating it twice would wait on a completion that only fires once.

### Shared package change

`packages/utils-slots/src/createReelForSpinning.svelte.ts` took a new optional
`getReelLength` option. `reelLength` was resolved once from
`initialSymbols.length` and fed the padding maths, the pre-spin strip length and
the reel's resting Y — so a board that grows two rows would spin a 5-symbol strip
into a 7-symbol window and leave the bottom rows unfilled. Omit the option and
behaviour is exactly what it was; only Margin Call passes it.

GoBananas, WildParty and EmberForge were all rebuilt after the change and all
three still report `✔ done`.

## Watch on first run

1. **The expansion itself.** `boardExpand` sets `stateGame.rows` and BoardFrame
   plays a hard recoil; the housing follows `boardLayout()`, which is row-aware.
   Whether the growth reads as deliberate or as a layout glitch is the single
   biggest unknown. A tween on the row change is the first thing to try.
2. **Shrinking back.** `freeSpinEnd` sets rows back to 3 *and* settles the reels
   to a fresh 3-row idle board, because the reels are still holding the feature
   board's seven symbols. `finalWin` repeats both idempotently as a safety net.
   If a round ever ends with a seven-symbol reel in a three-row frame, that pair
   is where to look.
3. **Resumed feature rounds.** `createBonusSnapshot` restores the row count and
   the meter from the last `boardExpand` / `leverageUpdate` in the book. The
   `leverageUpdate` event carries the running total, not the increment, so
   replaying only the last one is correct.
4. **The leverage fly-in timing.** `leverageMeterCollect` is awaited before the
   win is presented, so a win is never shown before the multiplier it was paid
   at. If wins feel laggy in turbo, that await is the cost.

## Art

All generated, no third-party assets, two scripts:

| Script | Output |
|---|---|
| `design/generate_symbols.mjs` | 11 symbols + both backgrounds |
| `design/generate_theme.mjs` | housing, feature plates, bet-bar plates, 5 win banners, 13 icons, 5 particle textures |
| `design/generate_audio_terminal.mjs` | 18 cues + 2 music loops (pure-Node synthesis, no deps, no argument) |

Both take the resvg directory as their argument:

```bash
node design/generate_theme.mjs E:/stake/tools/gen
```

Everything is emitted at the dimensions the components already assume — the
housing is 1280×1280 with the board in the centred 1000×1000 (BoardFrame's
`FRAME_SCALE`), banners are 1000×560 (`BANNER_RATIO`) — so art can be
regenerated without touching a number in any component. Type is Titan One, the
same self-hosted OFL face the live `Text` nodes use, so baked headlines and
rolling amounts do not visibly disagree.

The palette (`#4bd67f` phosphor green, `#ff5566` bear red, amber / violet / teal
accents on graphite) is duplicated in three places because they are three
different rendering paths: the two generators, `game/uiTheme.ts` for the pixi bet
bar, and the CSS in `components/ui/Modals.svelte` for the DOM modals. Change one,
change all four.

## Audio

Synthesized in pure Node (16-bit WAV, no dependencies, deterministic PRNG so
regenerating produces byte-identical files). Everything is built from four
generators — filtered square/saw blips, a sine sub, band-passed noise, and a
feedback delay for depth — so the set sounds like one instrument family rather
than a pile of stock effects. The margin-call klaxon is the only cue allowed to
be unpleasant.

The five reel stops share one file, pitched by `playbackRate` in `Sound.svelte`,
so `reel_stop.wav` has to keep its character across roughly 0.9x–1.3x: short
body, hard head. Both music loops are the same four-bar minor progression at two
tempos, so entering the feature reads as the same room getting busier.

Not listened to. Synthesis parameters were chosen by ear-in-the-head, which is
worth exactly what it sounds like — the levels and the tempos are the first
thing to adjust.

## Remaining

* **Nothing is blocking an upload.** What is left is polish and judgement:
  * Audio levels and tempos — synthesized but never listened to.
  * The board-expansion moment (see "Watch on first run").
  * `src/i18n/messagesMap/*` carries only `HOME`; `game/i18nText.ts` covers the
    16 locales for the pixi strings the game actually draws. The rules and
    pay-table panels are English-only prose, same as every other game here.

## Repo-wide, not this app

`pnpm lint` fails in every app: ESLint 9 wants `eslint.config.js` and the repo
still ships `.eslintrc.cjs`. Verified against GoBananas — same failure. Left
alone because fixing it touches all four apps and belongs in its own change.
