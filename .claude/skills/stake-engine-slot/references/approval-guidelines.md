# Approval guidelines — the 51 checkpoints

Stake's approval page has four tabs: **Conversation**, **Rating**, **Guidelines**,
**Issues**. Rating is the star score that decides publication. **Guidelines is a
separate 51-item checklist a reviewer works through afterwards**, ticking each
line; anything that fails comes back as a change request.

Passing the rating does not mean the guidelines have been checked. Wild Party was
published at 4.7/9 with the guidelines tab still reading `0 / 51`.

Transcribed from the review page 2026-08-17. The counts below sum to exactly 51,
which matches the tab, so nothing is missing from the transcription.

**Outcome on Wild Party:** the review opened ten issues in total, added over
several rounds as each resubmission was re-tested. All were resolved and the game
is live. Lines that actually failed are marked **✗ failed**; the reasoning behind
each is in [review-log.md](review-log.md#wild-party-guidelines-pass--ten-issues-all-resolved).

## How to use this

Most of these are cheaper to satisfy before the first upload than to retrofit —
see [review-log.md](review-log.md) for what each round of retrofitting cost. The
annotations marked **✗ failed** are lines Wild Party actually lost; **⚠** marks a
risk found by reading this repo that was never put to the test.

---

## PreChecks (4)

- [ ] Game authenticates with RGS successfully on game launch
- [ ] Game authentication fails correctly with an invalid `rgs_url`
- [ ] Clicking on the bet button sends a successful play request to RGS
- [ ] **⚠ Game should not contain the Stake Engine Loader**

> The last one is about *containing*, not displaying. Removing the loader from
> the render tree while leaving `static/stake-engine-loader.gif` in place still
> ships it — it lands in `build/` and is served. Delete the asset, not just the
> component reference. Keeping it "so it can be put back in one line" is exactly
> what this line forbids.

## Compliance Checks (3)

- [ ] Game title is unique and does not use restricted terms
- [ ] Game assets and imagery do not contain offensive or inappropriate content
- [ ] Game is sufficiently distinct from existing titles and series

## Game Thumbnail (1)

- [ ] **✗ failed — Game thumbnail meets Stake artwork guidelines**

> This is **three separate files**, which Stake composites itself — not one
> finished tile:
>
> | File | Role | Spec |
> | :-- | :-- | :-- |
> | `<Game>-BG.png` | Background | an environmental background showing the world of the game; 1024×1024, opaque |
> | `<Game>-FG.png` | Foreground | a feature character or key item; 1024×1024, alpha must reach 0 |
> | `<Studio>-Logo.png` | Provider logo | the studio mark, transparent, legible small |
>
> Background + foreground together must stay under 3 MB. A pre-composited tile is
> explicitly not what is being asked for, and the provider logo is easy to not
> notice is missing.
>
> Wild Party failed this line with two files under non-conforming names, no
> provider logo and a composite included — before any argument about the art.
> Read "ensure it has an appropriate background and foreground" literally first.
>
> On the art: keep the gradient inside one colour family (a violet→amber tile was
> called out as not complementary), keep the subject inside the frame with margin,
> put no lettering or multiplier values on either layer, and check it is brighter
> than the dark interface it sits in — measure mean luminance against a tile you
> know passed rather than judging by eye.

## RGS Requirements

### Bet Levels (2)

- [ ] **✗ failed** — Game dynamically uses all betting parameters from the authenticate response
- [ ] Active rounds restore the bet amount from the authenticate response

### Currency Support (2)

- [ ] **✗ failed** — Game supports and displays currencies correctly
- [ ] Game displays sub-cent payouts correctly

> Sub-cent is the one that bites: at 2 decimal places a small win on a minimum
> stake renders as `0.00` and stops matching the server's JSON. Allow up to 4.

### RGS requests (2)

- [ ] Zero-win bets do **not** send an end-round request to the RGS
- [ ] Insufficient balance bets do **not** send a play request to the RGS

## Frontend Requirements (2)

- [ ] Main game frame should not be scrollable
- [ ] Space bar should be bound to the bet button

> `EnableHotkey` from `components-shared` provides the space binding; a game that
> renders it inside `Game.svelte` gets this for free.

### Game Rules (6)

- [ ] RTP and Max Win are clearly stated within the game rules
- [ ] Payout information per symbol must be clearly communicated
- [ ] Win combinations are displayed in the game rules
- [ ] Game modes include description and cost information
- [ ] Free game and re-trigger conditions are clearly displayed in the game rules
- [ ] General disclaimer is included in the game information

### Auto Play (2)

- [ ] Auto-bet requires a confirmation step before starting
- [ ] High cost bet modes require confirmation before activation

### Responsive Checks (4)

- [ ] Game functions correctly on Desktop/Laptop
- [ ] **✗ failed** — Game functions correctly on Popout S/L
- [ ] Game functions correctly on Mobile
- [ ] Double tap to zoom is disabled on mobile

- [ ] **✗ failed** — User interaction guide is included in the game information

### Sounds / Music (1)

- [ ] Game provides an option to disable sounds

### Multiple Language Support (2)

- [ ] Game supports English language
- [ ] Invalid language parameters do not break game display

- [ ] **✗ failed** — Check 5 wins for each game mode against the Game Rules
- [ ] If Mystery Mode is present in the game, any numerical values representing
      chances or probabilities are accurate

## Jurisdiction Requirements

### Stake.US (5)

- [ ] **✗ failed** — Is the game compliant with the required translations for a social game?
- [ ] Game supports SC and GC currencies & values do not display a `$` prefix
- [ ] **✗ failed** — Game mode naming follows Social Mode terminology guidelines
- [ ] Replay window does not contain restricted words
- [ ] English is the only supported language in Social Mode

> See [certification.md](certification.md) for the restricted-word table. The
> replay window is a surface that is easy to miss when sweeping for these.

## Replay Support (5)

- [ ] Supports replay urls, loads and plays desired event
- [ ] Supports all optional parameters like currency, language, amount
- [ ] **✗ failed** — Replay allows replaying the event again after completion
- [ ] UI clearly displays bet cost and applied multiplier
- [ ] Supports Replays in Popout S view

> Five of the 51 checkpoints are replay, and Go Bananas lost a whole round on it
> (review-log round 4). Wild Party passed four of the five on the shared
> packages alone and failed only "replay again after completion", because
> `resumeGame` nulls `betToResume` out as it starts — after one run there is
> nothing left to replay.
>
> Stake only serves `/bet/replay/` for real historical bets, so none of this can
> be exercised before submitting unless the local harness mocks that endpoint.
> That is why it keeps shipping broken.

## Final approval checklist (7)

- [ ] Game has bet-level templates applied
- [ ] Provably Fair and Replay are enabled
- [ ] Front and Math requests are approved
- [ ] Game is posted in the stake-engine-game-approved channel
- [ ] Game works correctly on older mobile devices (Android and iOS)
- [ ] Approval request is closed after the game is live & emojis are added to the
      slack notification
- [ ] Game Released

> The last block is largely Stake's own process, not the studio's.

---

## What this list does not cover

Nothing here scores art or animation. Those live in the **Rating** tab and are
what actually decides publication — a build can be 51/51 compliant and still
fail to reach the points threshold. See
[review-log.md](review-log.md#the-rating-round) for how the rating works.
