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
