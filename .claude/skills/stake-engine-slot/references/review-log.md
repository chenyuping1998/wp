# Review log — what Stake actually asked for

Go Bananas went through six rounds of review. Every item below cost at least one
upload-and-wait cycle, and most were cheaper to have built in from the start than
to retrofit.

The checklist is the reusable part. The case log behind it is the evidence — read
an entry when you want to know what a reviewer's one-line comment really meant.

## Contents

- [Pre-submission checklist](#pre-submission-checklist)
- [Round 1 — presentation quality](#round-1--presentation-quality)
- [Round 2 — certification checklist](#round-2--certification-checklist)
- [Round 3 — social terminology](#round-3--social-terminology)
- [Round 4 — replay mode](#round-4--replay-mode)
- [Round 5 — config, maths, restricted words](#round-5--config-maths-restricted-words)
- [Round 6 — cover art](#round-6--cover-art)
- [The rating round](#the-rating-round)
- [Wild Party round 1 — the same two phrases, a different cause](#wild-party-round-1--the-same-two-phrases-a-different-cause)
- [Wild Party guidelines pass — ten issues, all resolved](#wild-party-guidelines-pass--ten-issues-all-resolved)
- [A clean replacement can still be the wrong one](#a-clean-replacement-can-still-be-the-wrong-one)
- [Every stake must be one the server named](#every-stake-must-be-one-the-server-named)
- [A guard that cannot see its target](#a-guard-that-cannot-see-its-target)
- [The oncomplete race — one shape, five places](#the-oncomplete-race--one-shape-five-places)
- [Production bugs worth recognising again](#production-bugs-worth-recognising-again)
- [Working with the reviewers](#working-with-the-reviewers)

---

## Pre-submission checklist

Run this before the first upload. Each line maps to a round that was lost.

**Server contract**

- [ ] Every field of the authenticate response is used: `betLevels`, `minBet`,
      `maxBet`, `stepBet`, `defaultBetLevel`, `jurisdiction`. Nothing about
      staking is hardcoded — no default ladder, no default opening stake.
- [ ] Opening stake comes from `defaultBetLevel`, so each currency opens where
      the server says (Gold Coins open at 10,000 GC, not 1).
- [ ] Bet menu presents the server's levels in full — no index whitelist.
- [ ] **Every selectable stake is one of the server's levels.** Affordability may
      only pick a lower rung, never the balance itself, and every control that
      sets a stake goes through the same clamp — a menu that assigns directly
      skips it. Test with a balance that falls *between* two rungs.
- [ ] `?lang=` is validated against the catalogue before use; an unknown code
      falls back to English rather than being passed to `Intl`.

**Money**

- [ ] Formatted against a fixed locale, never the interface language.
- [ ] Social currencies bypass `Intl`: `XGC → GC`, `XSC → SC`, `XEC → SC`, no `$`.
- [ ] Wins allow up to 4 decimals (2 minimum). At 2, a 2000-book-unit win on a
      $0.01 stake renders `$0.00` and stops matching the server's JSON.
- [ ] Amount parameters are in API units — 1,000,000 = 1 coin. A launcher
      `balance=100000000` is 100 coins, not 100 million.

**Social mode (`?social=true`)**

- [ ] No restricted word anywhere the player can read — see
      [certification.md](certification.md) for Stake's published table.
- [ ] Vocabulary lives in one module per game, shared by every panel.
- [ ] Check the quiet surfaces too: the spin ticker, feature-buy dialogs, the
      insufficient-balance message, the replay panel.
- [ ] A static guard runs on build.

**Game information**

- [ ] How to play, line direction, how wins combine.
- [ ] A controls guide showing each control's actual button art.
- [ ] RTP and max win **per mode**, read from the maths config, not typed into
      prose.
- [ ] Every feature the maths implements — retriggers included.
- [ ] The max-win cap and what happens when a round hits it.

**Presentation**

- [ ] Bet bar in the conventional arrangement; occasional expensive actions
      (feature buy) kept away from the control pressed every few seconds.
- [ ] No emoji icons — they render as the viewer's system font and ignore canvas
      fill, so they cannot be themed.
- [ ] A display face that is not a system default.
- [ ] Spacebar bound to the bet button.
- [ ] Every modal tested at the smallest supported size, including the popout.
- [ ] Stake Engine's splash removed; your own studio logo kept.

**Cover art**

- [ ] Character sits **inside** the frame with margin on all sides. Background
      bleeds to the edges; the character does not.
- [ ] Ask for their example image first and match its margins.

**Replay (`?replay=true`)**

- [ ] `lang` passed when requesting the replay.
- [ ] Currency read from the URL — a replay never authenticates.
- [ ] A panel at the start showing play cost, multiplier and final amount.
- [ ] A control to replay the event again after it finishes.
- [ ] Works in the small popout layout, with no live bet controls anywhere.

**Maths ↔ presentation agreement**

- [ ] Whatever the animation shows as covering the board is what the maths
      evaluated. If a symbol visibly expands, it expanded before the lines were
      read.
- [ ] The rules text matches the maths, not the intention.

---

## Round 1 — presentation quality

> "The bet control bar is unclear, hard to use or doesn't conform to expected UX
> standards"

Not about any single button. The layout itself was unconventional — a side rail
instead of the bar players arrive already knowing. Rebuilt as one strip along the
foot: menu and readouts left, bet/stepper/spin/autoplay/turbo right, everything
secondary in the menu.

> "Heavy reliance on generic or AI art, standard fonts, emoji icons or gradient
> fills"

Three separate things, all fixable mechanically:

- **Emoji icons** (`≡ ⚙ 🔊 ▤`) render as the viewer's system emoji and ignore
  canvas fill, so they cannot be themed at all. Replaced with drawn brass icons
  generated from SVG.
- **Standard font** — replaced with a self-hosted display face. Pick it with
  objective checks, not by eye: family name from the TTF `name` table, cap height
  from `OS/2` for cross-face size normalisation, and `cmap` coverage for the
  scripts you ship.
- **Flat gradient fills** — replaced with textured FX and additive blending.

> "Spacebar should be bound to the bet button"

Literally that. Note that synthetic key events do not exercise the same path as a
physical press — this one needs a human to verify.

---

## Round 2 — certification checklist

A batch of standard items, all mechanical:

| Asked | Where it landed |
|---|---|
| Bet levels must come from the server | `stateConfig.betAmountOptions`, whitelist removed |
| Win amounts must match the server's JSON | 4 decimal places for wins, 2 for stakes |
| Bet menu must scroll | a definite-height ancestor plus `min-height: 0` on the flex child |
| RTP and max win per mode | a table generated from `config.betModes` |
| Retriggers must be documented | its own section in the rules |
| A user-interaction guide | controls list with the real button art |

Two CSS traps cost time here and will again:

- A percentage `max-height` resolves to `auto` against an auto-height parent, so
  the scroll container never bounded anything.
- `transform: scale()` shrinks rendered output regardless of `font-size`, so it
  silently defeats any `clamp()` floor you set for small screens.

---

## Round 3 — social terminology

> "For the social mode, please rephrase the following words: pay…"

First of three rounds on the same theme, because each was fixed only where the
screenshot pointed. **Grep the whole player-facing surface**, then fix.

The mistake that made it three rounds: treating it as a word swap. It is not.

- A swap can produce nonsense — "pay left to right, starting from the leftmost
  reel" becomes "start from left to right, starting from…". Store the whole
  clause when the surrounding words must move with it.
- A replacement can contradict itself — "Does not award — 4 or 5 Scatters award
  12 Free Spins". Reworded to "No line win".
- The replacement must match what the UI actually says. The rules page cannot
  call it Buy Bonus while the button says PLAY BONUS.

---

## Round 4 — replay mode

Five requirements; see [certification.md](certification.md) for the
implementation notes. The two that are easy to miss:

- A replay never authenticates, so **nothing else sets the currency** — read it
  from the URL or every amount renders as USD.
- The stripped-down template replay layout has nowhere to put a replay control
  and looks nothing like the game. Using the game's own bar (with staking
  controls removed) solves both.

Three versions of the replay button shipped wrong before one worked, all because
"the build passed" was treated as verification. The button was in the wrong
layout, then in the wrong mode, then behind a condition that was never true. One
dev-server probe would have caught each in a minute — see
[verification.md](verification.md).

---

## Round 5 — config, maths, restricted words

> "All parameters from the authenticate response should be dynamically used in
> the game, including minBet, maxBet, stepBet, DefaultBetLevel, and betLevels."

`betLevels` was used; the other four were read and thrown away. The visible
consequence was the next comment:

> "The default bet level for Stake Gold Coin (GC) should be 10,000 GC."

Not a separate bug — the same one. `defaultBetLevel` is per-currency and the
game was opening at a hardcoded 1.

> "In Free Spins Mode, on the 4th spin, the game evaluates only one winning
> payline instead of all four qualifying paylines."

**The most instructive item of the whole review.** A maths/presentation
disagreement, not a display bug.

A wild landed on one cell. The frontend animated it expanding to cover the reel,
and the rules said it did. The maths appended new wilds to the sticky list
*after* the board was expanded, so on the landing spin only the single cell was
a wild — and only paylines through that one row paid.

Diagnosing it took reading the book data, not the code:

```
newExpandingWilds: [{reel: 4, row: 1, mult: 3}]
same spin's reveal, reel 4 = L4, W, L1, L2, L2, H4, H1   ← one W, not five
```

The fix expands the reel after the reveal and the `newExpandingWilds` event (so
the growth animation still plays from the landed cell) but **before** the lines
are read. Re-running the maths held RTP at 96.5% — the optimiser re-converges on
the target, so a rules-level change like this does not automatically break it.

**Whenever an animation shows something covering the board, check the book data
says the same thing.** The presentation and the maths are written months apart by
different reasoning.

---

## Round 6 — cover art

> "The main character in the cover image does not follow the Stake artwork
> guidelines. The character extends from edge to edge, which should not be the
> case."

The character was cropped by the frame on three sides — headwear cut at the top
row of pixels, both shoulders cut at the art panel's edges. Stake want the
character complete and inside a safe area, with the background bleeding to the
edges instead.

Two things that make this expensive to fix late:

- **Keep the source layers.** Once the cover is flattened, the cropped pixels are
  gone — scaling the character down cannot restore the top of a hat that was
  never drawn.
- **Ask for their example image.** They reference one in the thread; it defines
  the exact margins and saves a guessing round.

---

## Ember Forge round 1 — "low quality asset", "poor animation"

Two canned phrases, no screenshot, nothing named. They were still specific.

**"Low quality asset" was the sample game's art, still shipping.** Four assets
had come across with the template and never been replaced, and three of them
were permanently on screen:

| Asset | Where it was |
|---|---|
| `symbols3` / `explosion` | the burst on every cluster clear — dozens a round |
| `coin` / `SD2_Coin` | the big-win celebration |
| `anticipation` | the tumble payframe |
| `reelhouse` | the glow around the playfield |

The reviewers see the sample game constantly. The most repeated animation in the
game being their own demo art is the loudest possible version of this complaint,
and no amount of original symbol art compensates for it.

`anticipation` turned out to be **unreachable** — the win state had become a
sprite, so the branch drawing it was dead — and it was still being downloaded.
Grep for every template asset key and check each one is both used and yours.

**"Poor animation" was the absence of any.** Every symbol was a still PNG: no
idle motion, no per-symbol win animation, nothing moving on a settled board,
which is what a player looks at most of the time. The painted background had the
same problem one level up — flames, a lava pour and a furnace, all frozen.

What fixed it without commissioning art:

- **Separate the fire from the picture once, offline.** A heat mask baked off
  the background (bright AND warm, multiplied — either test alone catches the
  lit stonework or the red gloom), then scroll seamless streaked noise through
  it at runtime. The fire moves and the stone does not. Sample the same mask for
  particle emitters and the sparks come off things that are actually burning.
- **Idle breathing on symbols**, ~1% of scale, phase-offset by cell position so
  the grid never pulses as one block. Nearly invisible; conspicuous when absent.
- **Escalate something with the win.** A cluster game's drama is chain depth and
  nothing on screen was tracking it.
- **Draw the pressed state.** `pressed` is handed to `UiButton` by `Button` and
  was never used, so on a phone — no hover — a tap had no acknowledgement at all.

Two general lessons:

- **A canned rejection phrase is still evidence.** Inventory what actually ships
  and how often each thing is on screen before theorising about taste.
- **Ship-weight is a quality signal.** The same audit found 17MB of a 50MB build
  was a template audio bank nothing played from. Assets 46MB → 15MB.

## The rating round

Publication is decided by a **Rating** tab that is separate from the 51-item
Guidelines checklist ([approval-guidelines.md](approval-guidelines.md)). How it
works, from Wild Party's review page:

- Three reviewers each award **0–3 stars**, so the total is **out of 9**.
- The bar was **4.5** (a 1.5-star average) for Wild Party. **Later submissions
  need 6.** Hot Miami and everything after it are on the higher bar.
- The displayed star is the average rounded to a whole star, but publication is
  decided on exact points — a game can show 1.5★ and still fall short.
- Reviewers attach short canned tags, occasionally a free-text line.
- **Passing the rating does not touch the Guidelines tab.** Wild Party published
  at 4.7/9 with Guidelines still at `0 / 51`.

The gap between 4.5 and 6 is not a polish gap. 4.7 is what a build scores when
its compliance, layout, colour and copy are all sound and its art and animation
are not.

## Wild Party round 1 — the same two phrases, a different cause

Scores 1.67 / 1.67 / 1.33 = **4.7 / 9**. Tags: *Low quality assets* ×2, *Poor
animations* ×2, and one free-text *"Bonus buy menu is too simple"*.

The two canned phrases are the same ones Ember Forge got, but **the Ember Forge
diagnosis did not apply**. This build had already been swept: template spines
deleted, the template anticipation recoloured, the sample coin sheet repainted,
~24MB of unused template assets removed. There was no sample art left on screen.

So the phrases have a second meaning, and it is the literal one:

- **"Low quality assets" also means the art itself, not just whose art it is.**
  Wild Party's symbols are flat neon outlines — the royals are letter shapes with
  a glow, the premiums are flat fills with a stroke. Internally consistent, and
  thin next to competitors whose symbols carry volume, material and lighting.
  Original art that is cheap to produce still reads as cheap.
- **"Poor animations" survives a reskin.** Retexturing template spines leaves the
  *motion* untouched — the same land, the same win pop, the same idle. Changing
  what the symbol looks like does not change how it moves, and movement is what
  this tag is about.

**"Bonus buy menu is too simple"** was three text tiers in a list. Competitors
ship illustrated tier cards with distinct art, preview motion and clear price
hierarchy. This is the cheapest of the three to fix and the only one named
explicitly.

The lesson for planning: a visual overhaul that covers palette, layout, typography,
compliance and asset provenance — all of which this round did — moves none of
these three numbers. Symbol craft and motion are their own workstream, and on the
6-point bar they are the workstream.

## Wild Party guidelines pass — ten issues, all resolved

Publication and the 51-item Guidelines checklist are scored separately, so the
game went live at 4.7/9 and the checklist review started afterwards.

It opened **eight** issues at once, then added a ninth and a tenth as each
resubmission was re-tested. All ten were accepted and **the game is now live**.

The shape of that review is the thing to plan around: it is not one pass. Each
fix is re-tested and can surface the next problem, so budget for a short series
of round trips rather than a single fix-everything push. The last two arrived
only because the earlier fixes were being exercised — the PAY TABLE wording was
spotted in a controls guide that had just been added, and the Max Bet defect
needs a balance sitting between two rungs of the ladder before it appears at all.

### The three that were not what they looked like

**"Symbol payouts do not match the paytable" was not a maths bug.** All 556 line
wins across every book were recomputed against `config.symbols` — zero
mismatches, and the pay table is rendered from that same config rather than a
second hardcoded copy. The reviewer was looking at a 35-payline board where
several lines win at once, and the presentation flicked through one line every
140ms with nothing naming any of them. Nothing on screen ever said which symbol
had paid or how much, so the figure could not be reconciled with the rules.

The fix is a readout, but the interesting part is the pacing. A readable pace per
line is not available — a 35-line board reaches 35 simultaneous wins. Lines that
share a symbol AND a run length pay identically, so they are one fact, not
thirty-five: grouping on `(symbol, kind)` collapsed every book in the game to at
most 5 groups and 92% to 3, which fits comfortably at 800ms each.

**"Game thumbnail does not meet artwork guidelines" was mostly packaging.** The
tile spec is THREE files — background, foreground, provider logo — which Stake
composites itself. The submission had two files under non-conforming names, no
provider logo at all, and a pre-composited image the spec explicitly does not
want. Read "ensure it has an appropriate background and foreground" literally
before reading it as composition advice. See
[approval-guidelines.md](approval-guidelines.md#game-thumbnail-1).

**"Currency handling" named CAD, CNY, MXN and ARS** — which is exactly the set
that `Intl.NumberFormat`'s `currencyDisplay: 'narrowSymbol'` renders ambiguously.
narrowSymbol strips the country qualifier, so in en-US those become a bare `$`
(indistinguishable from USD) and `¥` (indistinguishable from JPY). `'symbol'`
gives `CA$`, `MX$`, `ARS`, `CN¥` and leaves USD/EUR/JPY/BRL unchanged.

### The rest

- **Social-mode terminology and mode naming** — both traced to one file. The
  bet-mode table was plain hardcoded English ("Buy direct entry", "50× BET",
  "BUY 50×", "PLACE YOUR BET") and nothing in it went through the game's social
  vocabulary. It has to be built on call, not at module scope, because the
  social flag comes from the page URL.
- **Popout S/L** — the bonus panel's shrink factor has a floor, justified in a
  comment on the grounds that "the wrapper scrolls, so overflow is recoverable".
  Both of its scroll containers were passed `noScroll`, so it did not, and tiers
  were cut off. The stake badge is `position: fixed` to the viewport while the
  cards are shifted left to clear it; on a narrow window they converge and
  overlap.
- **User interaction guide** — the rules page listed every feature and no
  controls. Each row now carries the button's real art. Watch for the turbo
  button: `UiButton` has `turbo: '⚡'` in its icon map but draws a vector bolt
  instead, so copying the glyph into a guide both misdescribes the control and
  reintroduces the emoji icons certification objected to.
- **Replay again after completion** — `resumeGame` nulls `betToResume` out as it
  starts, so after one run there was nothing left to replay. Keep a copy of the
  round and re-seed from it. Replay cannot be exercised against Stake, which only
  serves `/bet/replay/` for real historical bets, so a local mock of that endpoint
  is the only way to see any of this before submitting.

### Two found while fixing, not reported

- The main frame was scrollable by 5px. Not a stray margin: a `<canvas>` is
  `display: inline` by default, so it sits on a text baseline and the line box
  reserves descender space under it. `display: block` removes the phantom row.
- A replay opening behind the feature-introduction card. Suppressing that card in
  replay mode is the wrong fix — it only exposes the older pixi loading screen the
  card exists to cover. Auto-dismiss it instead.

## A clean replacement can still be the wrong one

Wild Party's guidelines round closed 8 of 9 issues; the ninth was:

> The restricted term "PAY TABLE" has been identified and should be replaced with
> "WIN TABLE."

The game was already substituting it — as **"PLAY TABLE"**, derived from the
"pay → play" pattern the rest of Stake's table follows. That is the failure worth
recognising: *the restricted word was gone*, so the static guard passed, and the
build was clean by its own measure while still carrying the wrong term.

Two consequences:

- **A restricted-word guard proves absence, not correctness.** It cannot know
  that "play table" is not the sanctioned wording. When a review comment names a
  replacement, copy the literal string into the vocabulary module rather than
  re-deriving it.
- **Check the shared package, not just the game.** The visible offender was one
  sentence in the game's own controls guide, but the menu button itself came from
  `components-ui-pixi/src/i18n/i18nDerived.ts` — so fixing only the game would
  have left the button reading PLAY TABLE next to a rules page reading WIN TABLE.

The screenshot also pointed at a fourth blind spot in the guard, in a place that
had just been written: prose living in a component's `<script>` (a `controls`
array of `{icon, name, what}` objects) is invisible to a rule that strips
`<script>` before scanning. Scanning string literals **that contain whitespace**
separates copy from identifiers without needing an exception list — `'payTable'`
and `'wp-paytable'` have no spaces; a sentence does.

## Every stake must be one the server named

> "when the player has, for example, a 1,120 GC balance and selects Max Bet, the
> game sets the bet to 1,120 GC. This bet level is not provided by the RGS."

Two independent paths in `packages/`, two different mistakes, and only the first
looks like the reported symptom:

- **`correctBetAmount()` ended with `Math.min(corrected, affordable)`**, where
  `affordable` is the raw balance divided by the cost multiplier. Whenever the
  balance was the smaller number the function returned *the balance itself* — a
  value no `betLevels` ever contained. The intent (do not offer a stake the
  player cannot cover) was right; the implementation invented a rung.
  Affordability may only ever pick a **lower rung of the server's own ladder**.
- **The bet menu bypassed that function entirely.** Both `BetMenuAmountGrid` and
  `BetMenuAmountToggle` assigned `stateBet.betAmount = value` directly, so
  min/max and affordability were never applied there at all — MAX on a $3.40
  balance selected $100.00, while the +/- steppers, which do go through the
  setter, could not. One entry point, one set of rules.

When a player cannot afford even the lowest rung, show the lowest rung and let
the insufficient-balance path refuse the spin. Inventing an affordable stake is
not the client's call.

Three assignments that must stay raw: the server's `defaultBetLevel`, a resumed
round's amount (already committed), and a replay's `?amount=` (the stake it was
recorded at). Clamping any of those against a live balance is wrong.

The defect only appears when the balance falls **between two rungs**, which is
why it survives casual play-testing — a local harness needs a way to seed an
exact balance before this is reproducible at all.

## A guard that cannot see its target

The restricted-word guard passed on every submission that certification then
failed. Four separate times, and never because the word list was wrong:

| What shipped | Why the guard was blind |
| :-- | :-- |
| `"funds"` in shared i18n | the file was not in the scanned set at all |
| `"Buy direct entry"`, `"50× BET"`, `"BUY 50×"` in `betModeMeta.ts` | the file *was* scanned, but only for `pick()` and `social ? …` shapes — it contained neither, so there was nothing to inspect |
| `"pay table"` in a controls guide | prose living in a component's `<script>`, which the template rule strips before scanning |
| `"PLAY TABLE"` | not a blind spot — the word was gone. The *replacement* was wrong, which no restricted-word check can detect |

Three rules fall out:

1. **A probe must be shown to fail before it is trusted to pass.** Inject the
   exact string certification reported, confirm the guard fires, then remove it.
   A clean run means nothing until the check has demonstrated it can fail.
2. **"The file is in the list" is not coverage.** Ask what *shape* the check
   matches and whether the file contains that shape. `betModeMeta.ts` was listed
   from the start and was structurally invisible.
3. **Absence is not correctness.** A guard proves a banned word is gone. It
   cannot know whether what replaced it is the sanctioned wording.

For prose in a `<script>`, scanning string literals **that contain whitespace**
separates copy from code without an exception list — `'payTable'` and
`'wp-paytable'` have no spaces; a sentence does.

## The oncomplete race — one shape, five places

Worth recognising on sight, because it has now caused two separate frozen rounds
in one game:

```js
state = 'running';                                   // mounts/starts the animation
await waitForResolve((resolve) => (oncomplete = resolve));  // resolver armed AFTER
```

If the animation reaches completion between those two statements, the callback it
finds is the previous one — usually a no-op — and the real resolver is never
invoked. The awaiting handler waits forever. Nothing errors, the build is green,
and the console is clean.

It froze the free-spin trigger (`Board.svelte`, symbol win animations) and, later,
the room transition (`Transition.svelte`, the curtain's "covered" handshake) —
the second one caught only because replay reproduces it far more often: on a
re-run the component tree and the spine are already warm, so the animation wins
the race more often. A sweep found the same shape in three more components.

Two rules:

1. **Arm the resolver before the state change**, always.
2. **Bound the wait.** A ceiling turns a lost callback from a dead session into
   one dropped beat, and it is worth having whether or not the race is the cause
   — which matters, because these are intermittent and "no longer observed" is
   not evidence.

## Production bugs worth recognising again

Not from review — found while building, and each took far longer than it should
have because the symptom pointed elsewhere.

| Symptom | Actual cause |
|---|---|
| A win frame never lights up, three fixes in a row change nothing | The state object being mutated was the raw literal, not the array's proxy — writes signalled nothing |
| A symbol occasionally fails to light in turbo | A completion callback from a previous animation state landing after the state changed; capture the state the callback was created for and ignore stale ones |
| A sound loops during the outro | The event that stops it was never wired; a broadcast with no listener is silent in every sense |
| Big-win music silent | The asset path had been renamed; nothing errors, the sound simply never plays |
| "Asset loading is stuck", provider logo frozen | A `ReferenceError` at component init aborted Svelte 5's effect flush — nothing after it initialised. See SKILL.md |
| Whole game black on upload, console looks clean | Same class, one stage earlier: module-scope state touched inside its temporal dead zone |
| Replay shows nothing at all, no error | The request rejected out of `onMount`, so the gate that renders the game never opened |

The two habits that shortened all of these:

1. **Bisect before theorising.** `git stash push -u` → build → test → `pop`
   settles "is it my change?" in one round.
2. **A probe must prove it can see its target.** A check reporting "no matches"
   is worthless if its matcher never could have matched — validate it against a
   known-positive first. This happened twice: once matching a texture label that
   is a full URL, once using the wrong key name in book data.

---

## Working with the reviewers

- **Fix the class, not the instance.** A screenshot flags two words; the same
  word is usually in four other places nobody screenshotted.
- **Name the source of truth.** When a requirement is about a displayed value,
  find where that value comes from. Mode names exist in the maths only as `base`
  / `bonus` / `superspin` — there is no display-name field, so a friendly name
  has to be mapped in the frontend.
- **Replies are short and factual.** "All of the reported issues have been
  fixed." They do not need the list read back to them. Do mention when a maths
  change is involved, so they know to re-test against a new upload — and say the
  RTP is unchanged, because that is their first question.
- **Upload the maths and the frontend together** when both changed. A frontend-
  only upload leaves the reviewer testing the old behaviour.
