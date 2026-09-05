# What review actually raises — fix these before submitting, not after

Hot Miami took **four submissions**. Three rejections, then a pass with six
items to clear. Almost none of it was game design.

**Five of those six are generic to this codebase**, which means a reskin
inherits them. They are cheap to fix in advance and expensive to discover in a
round trip. Work through this list before the first submission of any new game.

Sources: the 2026-09-04 review comment, and `docs/handoff/hot_miami.md` under
that date.

---

## The five that will hit your reskin too

### 1. "Stake" must not appear in the General Disclaimer

The review underlined the words **"Stake Engine"** in the shipped disclaimer.
That closing line is the STUDIO's copyright notice, not the platform's — so it
carries the studio's own name (the one on your loader and intro card).

The required sentence is the malfunction clause; everything after it is yours to
word. In Hot Miami it lives in `ModalGameRules.svelte`, with the opening clause
coming from `socialTerms.ts` (which also swaps "pays" → "wins" in social mode).

**Verify against the BUILD, not the source:**

```bash
grep -rl "Stake Engine" apps/<App>/build/ | wc -l   # must be 0
```

Source-only greps miss it — the string can arrive through a shared component or
a generated file.

### 2. Balance too low needs a message, not a dead button

> "When the player tries to place a Bet but does not have enough Balance, the
> game should display an insufficient balance message"

The machinery already exists in the shared `ButtonBet` — the button stays
pressable and answers with a `message` modal rather than the autoplay one
(because "AUTO PLAY HAS STOPPED DUE TO…" is a false statement when the player
pressed spin by hand). It is **off by default** so games that never opted in
keep the disabled button they were built with.

```ts
// game/uiTheme.ts
betButtonMessageOnInsufficientBalance: true,
```

One line. Hot Miami had never set it; a sibling game already had, having
presumably been told the same thing.

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

---

## The sixth: a maths bug that survived three submissions

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
