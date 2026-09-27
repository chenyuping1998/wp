# What review actually raises — fix these before submitting, not after

Hot Miami took **four submissions**. Three rejections, then a pass — followed by
**two rounds of items to clear before going live**. Almost none of it was game
design.

Most of what follows is generic to this codebase, which means a reskin inherits
it. All of it is cheap to fix in advance and expensive to discover in a round
trip. Work through this list before the first submission of any new game.

**Two of these came back a second time** because the first fix was partial (the
balance message covered two routes of three) or applied reasoning instead of the
instruction (the disclaimer). Both are marked below.

Sources: the review comments of 2026-09-04 and 2026-09-06, and
`docs/handoff/hot_miami.md` under those dates.

---

## The five that will hit your reskin too

### 1. The disclaimer's closing line is DICTATED, not yours to word

It took two rounds because the first fix applied reasoning instead of the
instruction:

| round | instruction | result |
| :-- | :-- | :-- |
| 2026-09-04 | "remove the word Stake from the General Disclaimer" | read "Stake Engine" → changed to the studio's name |
| 2026-09-06 | "replace *Silverstars Studio* with *Engine*" | now exactly `TM and © 2026 Engine.` |

**Do not reason about what a copyright notice ought to contain.** It looks like
the studio's line and it is not. Use whatever review last dictated, verbatim,
and leave a comment saying so — otherwise the next person restores a studio name
on perfectly sensible grounds and it comes back a third time.

The required sentence is the malfunction clause; everything after it is yours to
word. In Hot Miami it lives in `ModalGameRules.svelte`, with the opening clause
coming from `socialTerms.ts` (which also swaps "pays" → "wins" in social mode).

**Verify against the BUILD, not the source:**

```bash
grep -rl "Stake Engine" apps/<App>/build/ | wc -l   # must be 0
```

Source-only greps miss it — the string can arrive through a shared component or
a generated file.

### 2. Balance too low needs a message on EVERY route into a bet

> 2026-09-04: "the game should display an insufficient balance message"
> 2026-09-06: "regardless of whether the bet is initiated using the Bet button,
> the spacebar, or Autoplay"

**It came back a second time because only two of the three routes were fixed.**
There are three, and they do not share a component:

| route | component | package |
| :-- | :-- | :-- |
| Bet button | `ButtonBet` | components-ui-pixi |
| spacebar | `ButtonBet`'s `OnHotkey` — same handler, so it follows for free | components-ui-pixi |
| Autoplay | `ButtonAutoSpin` (opener) **and** `AutoSpinsStartButton` (panel) | pixi **and** html |

Autoplay was a dead end: both of its buttons were `disabled` outright when the
balance was short, so there was no control left to press and no message to show.
Check all three by hand before claiming this one is done.

Note the layering trap: `components-ui-html` does **not** depend on
`components-ui-pixi`, so the html-side button cannot read `uiTheme`. The policy
therefore lives in `stateConfig.explainInsufficientBalance` (state-shared),
which both packages can see:

```ts
// the game's uiTheme.ts, alongside its other UI policy
stateConfig.explainInsufficientBalance = true;
```

Each control stays pressable and answers with the `message` modal rather than
the autoplay one — because "AUTO PLAY HAS STOPPED DUE TO…" is a false statement
when the player pressed spin by hand, or pressed Autoplay and it never started.

The policy is **off by default** so games that never opted in keep the disabled
controls they were built with. There used to be a
`uiTheme.betButtonMessageOnInsufficientBalance` for this; it is gone, because a
theme key the html package cannot read could only ever fix two routes of three.
If you find that name anywhere, it is stale.

### 3. Currency symbols that render as words

> "For the West African CFA Franc, the currency symbol should be displayed as
> XOF or CFA, not F CFA."

`Intl.NumberFormat` with `currencyDisplay: 'symbol'` renders XOF as the words
`F CFA`. Sweeping all 126 plausible platform currencies, exactly three do this:

| currency | `symbol` gives | fix |
| :-- | :-- | :-- |
| XOF | `F CFA` | `currencyDisplay: 'code'` → `XOF` |
| XAF | `FCFA` | → `XAF` |
| XPF | `CFPF` | → `XPF` |

Handled in `packages/utils-shared/amount.ts` via `CODE_DISPLAY_CURRENCIES`.
**Do not undo it**, and do not move these into `NO_LOCALISATION_CURRENCY_MAP` —
that branch formats with `toFixed` and loses thousands separators, which these
currencies need most (XOF has no minor unit in practice, so ordinary amounts run
to five figures).

### 4. The store tile: one character, and mind what goes on top

> "The game thumbnail should contain only one main character."

The spec is "a feature character **or key item**" — singular. Also:

- 1024×1024, alpha genuinely reaching 0
- no text, no title, no provider logo baked in
- **no realistic firearms.** This game had art rejected for weapons once
  already, and its in-game character carries a deliberately non-realistic
  novelty prop for the same reason. A store tile still showing a real revolver
  is an unforced risk.
- **leave headroom.** The platform's Tile Editor composites a gradient and the
  game title over your foreground. Hot Miami's replacement art left 8px above
  the character's hair (the previous version had 86px), which risks the title
  landing on his head.

If you are tempted to salvage a two-character tile by cutting one out: four
approaches were tried and all failed. A straight vertical cut separates the
front figure cleanly but keeps his weapons; cutting the other way gives an
unarmed figure but in a pose that is its own problem; recolouring the in-game
mesh art produces something too static for a tile; and erasing a held weapon
leaves a hole in the fist, because the grip passes through the fingers.
**Regenerate the art.**

### 5. Portrait controls must survive the first spin

> "When the game is in mobile screen mode, after the first spin, several UI
> elements disappear, including the Bet controls, Autoplay button, Game Info
> button, Balance, and other game controls."

This was worse than it reads — it was a **dead end**, not a glitch:

1. `platformUx.closePanelsOnSpin` broadcasts `drawerFold` on every bet
2. in portrait the drawer holds the bet controls, autoplay, game info, balance —
   it is **not** a dismissible panel
3. `stateUi.drawerButtonShow` is `false` by default and only becomes true when
   free spins begin, so the button that reopens the drawer is hidden AND disabled
4. nothing broadcasts `drawerUnfold` in the base game

The primary controls were unrecoverable after one spin. The flag was copied from
a reference game whose `placeBet()` shuts seven *panels*; the word did not mean
the same thing in this layout.

Now guarded in the shared `ButtonBetProvider` — the fold only happens when the
player has a way to undo it. **Still check a portrait viewport before every
submission**, because this is the class of bug that no gate catches and that a
desktop-only pass never sees.

### 5b. …and portrait controls must fit on the screen at all

Separate from surviving the spin: `LayoutPortrait` puts the menu disc and Buy
Bonus at a fixed ±470 from centre, sized for the original round buttons. A
reskin that enlarges either one pushes it off the edge — on Deadwood Express at
375×812 the menu disc lost 9 px on the left and the Buy Bonus plate (drawn at
`buyBonusPlateScale` 1.25) lost 28 px on the right. Buy Bonus cannot simply move
in, because turbo sits next to it.

`uiTheme.portraitSideButtonX` (default 470) and `portraitBuyBonusScale`
(default 1) exist for this; Deadwood uses 445 / 0.85. At the same width the
text game name at top-left (ends ≈x 322) ran under the logo (starts 196 px in
from the right) — a game whose logo already spells the name can drop the text
below ~560 px canvas width. **Measure the bounds, don't eyeball them:** walk the
pixi tree and compare each control's `getBounds()` against `app.screen`.

---

## Deadwood Express: 5/10 "poor UI" — things that light up on a tap

Deadwood's first submission (2026-09-22) scored 5/10 with poor UI. The
collaborator's advice was that controls lighting up when tapped is what earns
that mark. Two separate things did it, and both are template behaviour a
reskin inherits:

**Sticky hover on touch.** The shared `Button` (every round control, Buy Bonus)
and `LabelBet` (the Bet panel) set `hovered` on `pointerover` and clear it on
`pointerout`. A finger fires `pointerover` on tap and **never** fires
`pointerout` when it lifts, so on a phone whatever was tapped last stayed
highlighted — the Bet panel kept its box after every tap. Fixed in the shared
components on 2026-09-23: hover ignores `pointerType === 'touch'` and a touch
`pointerup` clears it. Mouse behaviour is unchanged. Desktop testing never
shows this; a browser pane's "mobile" preset does not either, because its
clicks still arrive as mouse events. Verify with synthetic
`new PointerEvent(..., { pointerType: 'touch' })` dispatched on the canvas.

**The spin halo.** `uiTheme.spinButtonGlow` draws a breathing ring behind the
spin button that runs faster and brighter the moment Spin is pressed. The
collaborator's recent titles (Go Bananas Boat / Frostline / Bananaut /
Bananubis, Go Boomana) default `DEFAULT_SKIN = 'platform'`, whose flat
Hacksaw-style chrome ships it off. Deadwood set `spinButtonGlow: false`.

Note the naming trap when the user reports this: **`ButtonBet` is the spin
button** in this codebase, and the Bet *panel* is `LabelBet`. "Bet lights up"
can mean either — fix both rather than guess.

If a game still draws "poor UI" after that, the next lever is the whole
platform skin (every reskin from Hot Miami carries it as a second `setUiTheme`
block behind a `DEFAULT_SKIN` switch). It changes the whole bar's look, so ask
before flipping it.

---

## When the game and the Game Info disagree, check WHICH ONE is wrong

Review will report the contradiction, not the cause. Twice on this game the text
and the behaviour disagreed, and **the right fix was different each time.**

**Hot Miami's Collector rule said it "never lands inside a Frame".** It does —
on 35.2% of Collector spins in the top tier, 18.6% and 17.9% in the others. The
guard was one-directional: `framable_positions()` stops a new Frame landing on
the Collector, but Frames are sticky across free spins and the board (Collector
included) is dealt *before* Frames are applied, so the Collector gets dealt onto
a Frame carried from an earlier spin.

**The text was changed, not the maths**, and the reason is the whole lesson:
`evaluate_collector()` sweeps every Frame on the board including the one it sits
on, so the player was paid correctly and nothing was broken. Only the sentence
was false. Regenerating 100MB of books and moving the RTP to make a decorative
sentence true would have been the wrong trade.

Contrast with the frame-doubling bug below, where the same shape of complaint —
"the game does not do what Game Info says" — was a genuine maths fault that cost
players money and had to be fixed at the source.

**So: before choosing, establish whether the player is actually harmed.** Walk
the books, measure the frequency, and check whether the money comes out right.
That measurement is what tells you which side of the contradiction to change.

## The maths bug that survived three submissions

Not generic — but the *shape* of it is, and it is worth understanding before
trusting any regenerated bundle.

Frames that took part in a win were supposed to double before the next spin.
They did — **unless a Collector also won on that spin.**

`resolve_collector()` replaced `self.win_data` wholesale with a single-position
sweep entry so the sweep could reuse the standard `winInfo` event. The doubling
code, written separately, read `win_data` afterwards — and so on any spin with a
Collector it saw only the sweep, and every line win that had happened a moment
earlier became invisible to it.

Measured over 4,000 published books before the fix:

| | spins |
| :-- | --: |
| Collector on the spin → **doubling missed** | **1,521** |
| Collector on the spin → correct | 4,608 |
| no Collector → correct | 7,377 |
| no Collector → missed | **0** |

100% of the failures on collector spins, zero elsewhere. Not a probability
question — one line. After the fix, across the full regenerated bundles: 81,137
doubling events in `bonus_hits` and 69,132 in `bonus_epic`, **zero missed**. RTP
re-optimised back to the published figures.

### The generalisable lesson

**When two features read the same mutable field at different points in a
sequence, the second one needs its own accumulated copy.** The fix was not to
stop the collector overwriting `win_data` (that would have changed the event
payload); it was to record the positions as each win is evaluated:

```python
self.spin_win_positions = {
    (p["reel"], p["row"]) for win in self.win_data.get("wins", []) for p in win["positions"]
}
```

### What to do about it on a reskin

If your game has any rule of the form *"X happens to Y because of a win"* —
sticky upgrades, doubling, collection, persistence — **write a script that walks
the generated books and asserts it**, and run it on every regeneration. It is
twenty lines and it is the only thing that would have caught this:

```python
# per spin: gather every winInfo position, then assert the follow-on event
# covers all of them that had state attached. Report by category (with/without
# the other feature) — the split is what localises the bug.
```

A green `run.py` proves internal consistency, not that your mechanic's own rules
hold. `check_math_bundle.py` checks RTP, counts and payout hashes — also not
your mechanic. Nothing in the toolchain checks the thing your Game Info promises
the player.
