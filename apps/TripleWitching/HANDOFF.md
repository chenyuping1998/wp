# Triple Witching - front end

Ported from Margin Call. Builds green, boots, and is wired to the Triple
Witching maths. **Art is still Margin Call's, as placeholder** - see Gaps.

Read `math-sdk/games/TripleWitching/readme.txt` first: the reason this game
needs a client that can switch evaluation type mid-round is entirely a maths
decision, and the readme is where it is explained.

## What this game does that Margin Call did not

Margin Call had one feature shape: expand the board, run a meter that only
climbed. This has seven, and the board height *and the evaluation type* both
change with them.

    E  expand   5x5 board.  Lines: 20 -> 40 lines.  Ways: 243 -> 3125 ways.
    M  mult     CONTRACT symbols carry a multiplier; the values on a spin are
                summed and applied to that spin. Nothing carries over.
    W  ways     wins are counted as ways instead of along lines.

The one thing that makes it tractable to render: **the combination is drawn once
at the trigger and holds for the whole feature, retriggers included.** The
evaluation type never changes mid-feature, so the client switches mode once, on
one event, and nothing downstream infers anything.

### The trap a Margin Call port falls into

`stateGame.spinMultiplier` is **per spin**. Margin Call's equivalent accumulated
across the whole feature. Two consequences, both already handled, both easy to
undo by accident:

- the reset lives in the `reveal` handler, not in `multiplierWilds` - that event
  is only sent on spins where a wild actually landed, so resetting there would
  leave the previous spin's number on screen for a spin paying at 1x;
- the meter accumulates from **0**, not from the displayed 1x. The maths
  multiplier is the plain sum of the values landed: two x3 wilds pay x6, not x7.

`createBonusSnapshot` deliberately does *not* restore a multiplier for the same
reason - there is nothing cumulative to rebuild.

## Event contract

`featureSet` - once per feature, before the first reveal. Sets the modifiers,
the board height and the evaluation type, and is the only event that does:

```json
{
  "index": 12, "type": "featureSet",
  "combo": "EMW", "features": ["expand", "mult", "ways"],
  "numRows": [5, 5, 5, 5, 5],
  "evalType": "ways", "numLines": 0, "numWays": 3125,
  "gameType": "freegame"
}
```

`multiplierWilds` - per spin, only when M is active and at least one lands.
`multiplier` is the total for that spin only:

```json
{
  "index": 34, "type": "multiplierWilds",
  "added": [{ "reel": 2, "row": 3, "value": 5 }],
  "multiplier": 5
}
```

Rows in `added` already include the padding offset, like every other
position-bearing event.

`winInfo.meta` is a discriminated union - `WaysWinMeta` has `ways`,
`LinesWinMeta` has `lineIndex`. Use `isWaysWinMeta()` from `typesBookEvent.ts`
rather than reading a field that may not be there.

## Copy

Every player-facing figure was re-derived from the maths, because the inherited
copy described Margin Call throughout - 200x entry, 3,125 ways in the base game,
a 12,000x cap, a meter that never resets. All of it was wrong here and all of it
was the first thing a player read.

`payline` and `paylines` are **on the restricted-word list**, so player-facing
copy says LINES. `check_social_words.mjs` enforces it for literal template text
and for the social branch of `pick()`, and it caught this during the port.

The bonus cost and max win are interpolated from `config.betModes`, not written
into the prose - the cost moved 200 -> 120 -> 100 during balancing.

## Review round 1: what came back and what was done

Two issues, both from the first upload.

### 1. "Does not comply with the approved Social Mode terminology guidelines"

The pay table's unit banner said "not an amount in your **currency**". `currency`
is on Stake's published restricted list (replacement: `token`), and it had simply
never been in `check_social_words.mjs`'s array - that array had grown one word at
a time, each addition triggered by a rejection.

Fixed at the class, not the instance:

- the banner now reads "not a fixed amount off your balance", which says the same
  thing in both modes, so it stays literal template text rather than a `pick()`;
- the guard now carries **all** of Stake's table, flagged or not - `currency`,
  `money`, `fund(s)`, `credit(s)`, `deposit`, `withdraw`, `rebet`, `payer`. It
  fails on the exact sentence review screenshotted; that was checked by putting
  the sentence back and watching it fail.

The rest of `src` was grepped for the newly added words. The only other hits were
in code comments, which the player never sees.

### 2. "The Bonus mode gets stuck on the 5th spin and cannot continue"

**The anticipation tease.** It is not a hang - the reels really are turning - but
from the player's side it is indistinguishable from one, because for the whole of
it nothing on screen responds.

Three things compound:

- an anticipated reel is slowed by lengthening its strip, by
  `reelLength * reelPaddingMultiplierAnticipated` symbols, and the padding
  **accumulates** along the board;
- the feature reel is 7 symbols to the base game's 5, and the maths anticipates
  the feature from the **first** scatter (`anticipation_triggers` is
  `{basegame: 2, freegame: 1}`), so the common shape is `[0,1,2,3,4]` - four
  chained anticipated reels against the base game's three. It fires on **18.5% of
  feature spins**, measured over the published bonus books, so a 10-spin bonus
  hits it about twice;
- every reel from the first anticipated one on is marked `noStop`, and `noStop`
  reels awaited their slide directly rather than through the interruptible - so
  the stop button did nothing for the duration.

At the inherited 10x padding the last reel carried 288 symbols: **10.4 seconds**
of unbroken spinning with a dead stop button, arriving twice a bonus round. Margin
Call had already been through this exact problem - its `SPIN_OPTIONS_*_FREEGAME`
carry a reduced multiplier and a comment saying a single Scatter in free spins
"held the board hostage for four reels" - and the port dropped it. Two ways:

- there was no `SPIN_OPTIONS_DEFAULT_FREEGAME` at all;
- the selector in `stateGame.svelte.ts` tested `spinType !== 'fast'`. An
  anticipated reel's spinType is `'anticipated'`, never `'fast'`, so **the one
  spin whose length these options exist to control was the one spin that never
  read them** - in turbo as well.

Three changes:

1. `SPIN_OPTIONS_DEFAULT_FREEGAME` exists, and both feature option sets use
   `FREEGAME_ANTICIPATION_PADDING = 3`. Worst case 10.4s -> **3.6s**, single
   anticipated reel ~1.1s. Margin Call's 6 was not copied: it gated the maths'
   first anticipated reel away on the client, so its worst case was three reels
   where this game's is four.
2. The selector branches on game type on the non-fast path too.
3. `getAnticipationIsStoppable` - a new **opt-in** option on
   `createReelForSpinning`, off for every other game - lets the stop button
   interrupt a `noStop` reel. The tease is unchanged in length; it just stops
   swallowing the only control on screen.

`design/check_tease_length.mjs` reproduces the padding arithmetic out of
`constants.ts` and fails the build if any tease exceeds its budget, or if the
feature's tease is longer than the base game's - the taller, more frequent one has
to be the shorter one. It runs from `pnpm build`.

**What was NOT established.** The recording could not be watched in this
environment (no compositing, so no screenshots) and the game still cannot be run
against an RGS locally, so this is a defect that produces exactly the reported
symptom rather than a reproduction of the reported symptom. If a bonus round still
stops after this, the next suspects, in order:

- `freeSpinIntroUpdate` on a **retrigger** waits for a player press, exactly as
  the trigger does, but the UI is not hidden first - a press landing on the bet
  bar instead of the canvas would not resolve it;
- `Win.svelte` re-runs its presentation only because `FadeContainer` unmounts its
  children when the fade reaches 0. Two `setWin`s closer together than that fade
  would leave `OnMount` un-remounted and `oncomplete` uncalled. Every free spin
  that pays sends a `setWin`, so the gap is the reel spin.

Ruled out by inspection or by scanning the published books: every symbol name in
every board is in `SYMBOL_INFO_MAP`; every `winInfo`/`multiplierWilds` position is
inside the visible rows; every board is rectangular and the right height; every
`winLevel` is in `winLevelMap`; the multiplier meter's awaited tween is the last
one retargeted, so it cannot be orphaned.

## Gaps - do not treat this as finished

1. **Art is Margin Call's.** Symbols, backgrounds, frame, win banners and icons
   are the inherited set, regenerated only where the wordmark text is baked in
   (`generate_wordmark.mjs`, `generate_theme.mjs` now say TRIPLE / WITCHING).
   Nothing has been redrawn for this theme.
2. **Feature bags use supplied art now.** `FeatureBags.svelte` draws the three
   bags above the base-game board, left/centre/right, sized off one symbol cell
   so they scale with it. The ones the session drew burst and turn into the
   modifier's name at the same point on screen; the others dim. Originals are
   in `design/source/bags`, cut off their dark matte by
   `design/dekey_neon_art.mjs`. The accent colours used by the shockwave,
   shards and label are sampled from the art itself, so red says EXPAND, gold
   says MULTIPLIER and purple says WAYS throughout.
3. **Scatter frame is untuned.** `ScatterLandFrame.svelte` puts a hot amber
   frame plus corner ticks on any scatter cell whose reel is at rest, flaring as
   it lands and then holding. The colours were chosen for luminance rather than
   hue - the existing alarm red works at ring size and disappears at cell size -
   but nobody has seen it on a real board, and the idle board carries no
   scatter, so it cannot even be triggered without an RGS session.
4. **No payline drawing.** Line wins are presented by lighting the winning
   positions, which is honest - those are the cells that paid - but there is no
   line path drawn and no visual difference between a lines win and a ways win.
5. **Sound is reused.** `leverage_land.wav` and `board_expand.wav` are the Margin
   Call cues; the file name in `Sound.svelte` still reads `leverage_land`.
6. **`src/stories/data/*_books.ts` are stale Margin Call books.** They are not in
   the build path but they will mislead anyone who reads them.
7. **Never run against a real RGS session.** Verified only that the dev server
   boots, the canvas mounts and Pixi initialises. Actual gameplay - the seven
   combinations rendering correctly, retriggers, the resumed-round path - is
   unverified and needs an upload.

## Two Pixi mistakes that were made here, and what they looked like

Both are worth recognising on sight, because neither shows up as an error.

**Stroke-only paths written with the v7 API draw nothing.** The first versions of
`FeatureBags` and `ScatterLandFrame` built outlines with `lineStyle()` +
`drawRoundedRect()` and no fill. Those survive behind Pixi v8's deprecation shim
and the build is green, but nothing reached the screen: on the board, the only
part of a feature bag that was visible was its question mark. Use the v8 path
API - build the path, then `.fill()` and/or `.stroke()` it, as `FeatureIntro`
does.

**A dark fill on a dark background is not a bug the tooling can see.** The same
bags filled their bodies with `0x0b1410` over a near-black backdrop. Every guard
passed and the component was, technically, drawing. Both new components now
carry a tinted body and a bright rim.

The general lesson: a green build plus six green guards said these were fine,
and one screenshot of the running game said otherwise. Look at it.

## Payline shape: RTP does not depend on it, hit rate does

Worth stating plainly because the first two attempts both got it wrong, and
neither failure was visible in a build.

Total RTP genuinely does not depend on line shape. Every line on a board drawn
from independent reelstrips has the same hit probability, so the sum over a
fixed number of lines is fixed however they are drawn.

**Hit rate does depend on it**, because it is the probability of the *union* of
the lines, and that depends on how much they overlap. Measured on identical
boards (the sim is seeded per round, so the same indices give the same boards):

    ordering                          distinct fronts   base hit rate   RTP
    total movement, then lex                11            1 in 4.18     0.305
    front movement, most first               9            1 in 4.88     0.298
    cover the most distinct fronts          17            1 in 3.17     0.299

The middle row is the trap: "make the first three reels move more" sounds like
it must increase variety, and it does the opposite - maximising front movement
admits only the zig-zag fronts, which is a *smaller* set than the mixed one, so
the lines overlap more and wins clump onto fewer spins.

What the table is built for now is coverage: take the straight lines, then walk
the distinct first-three-reel shapes - most movement first - taking one line
from each before reusing any. On 3 rows that is 17 distinct fronts out of 20
lines, with only the 3 straights running flat across reels 1-3.

`game_optimization.py`'s basegame hit rate was updated from 4.2 to 3.2 to match.
**Changing the table invalidates existing books** - a line index covers
different cells, so recorded `winInfo` positions are wrong - so the simulation
has to be re-run, not just re-synced.

## Payline and paytable tables: one source, exported deliberately

The SDK's frontend config carries the BASE payline table and ONE symbol
paytable, because no other game in it changes either mid-round. This one changes
both:

- EXPAND takes the board to 5 rows and **40** lines, a table the SDK never
  exports;
- WAYS pays from an entirely different paytable - five H1 is 22.0 per way at
  5x3 and 3.5 at 5x5, against 20.0 per line - so a client showing only the
  exported table quotes numbers the game does not pay at.

`games/TripleWitching/dump_paylines.py` writes all of it (both line tables, all
three paytables) out of the same `build_paylines()` and the same paytable
objects the evaluator uses, and `design/sync_math_config.mjs` merges the result
into `config.ts` **and cross-checks** that the base line table agrees with the
SDK's own export. Nothing is transcribed by hand on the client.

Re-run both after any maths change:

    python dump_paylines.py          # in math-sdk/games/TripleWitching
    node design/sync_math_config.mjs # here

The two line tables are numbered **independently**. A 5-row board has five
straight lines where a 3-row board has three, so expanded line 4 is
`[3,3,3,3,3]` while base line 4 is `[0,0,0,0,1]`. The pay table panel says so,
because "the first 20 are the base 20" is the obvious wrong assumption.

## Feature bags: the ordering problem, and how it is solved

The bags have to burst *before* the transition into the feature - the modifiers
are what the scatters just won, so the reveal belongs on the base-game board the
player is still looking at.

But the maths sends `featureSet` **after** `freeSpinTrigger`, and the transition
happens inside the `freeSpinTrigger` handler. By the time `featureSet`'s own
handler runs, the scene has already changed.

So `freeSpinTrigger` reads the combination out of the book by looking **ahead**
for the next `featureSet` event. That is not a guess: the book is complete on the
client, and the combination is fixed at the trigger and cannot change during the
feature. `createBonusSnapshot` already uses the same kind of lookahead.

Moving the emission earlier in the maths would be tidier and is the right fix if
the maths is being re-simulated anyway - it costs a full 1e5-round re-run and
buys nothing the player can see.

## Verification actually performed

- `pnpm --dir <app> build` green, all six `design/check_*.mjs` guards pass
- dev server booted (`.claude/launch.json` -> `triplewitching-dev`, port 3015),
  canvas mounted 1600x900, WebGL live, Pixi 8.8.1 initialised, no console errors
  other than the expected RGS fetch failures with no session
- the payline/paytable pipeline checked **in the running client**, by importing
  `src/game/config.ts` in the page: 20 lines on 3 rows and 40 on 5 rows, every
  line 5 reels long, the adjacency rule holding on all 40, and all three
  paytables present with the expected values. This is the one part of the port
  that could be verified rather than inspected, because it is data rather than
  pixels.

A green build proves very little here - `+layout.ts` sets `ssr = false`, so
prerendering never evaluates the game modules. Booting the page is what catches
a module-evaluation `ReferenceError`, and that is why it was done. See
`wp/.claude/skills/stake-engine-slot`.

### What could NOT be verified, and why

**Nothing on the pixi canvas has been looked at.** Screenshots are unavailable
in the environment this was built in (the Browser pane was not displayed, so the
page never composited a frame), and pixi content is not in the DOM, so
`read_page` cannot see it either.

A stage-walking probe through `__PIXI_APP__` was tried and **discarded**: it
reported two descendants for a scene that certainly has more, which means it
could not see its target, and a probe that cannot prove it sees its target
cannot be trusted when it reports nothing.

So for the feature bags specifically: they compile, they mount, and they throw
nothing. Whether they are the right size, in the right place, above rather than
behind the frame, or legible at all is **unknown**. Look at them before
believing any of it.
