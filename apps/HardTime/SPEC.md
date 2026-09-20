# Hard Time — spec

Prison-themed reskin of **Capo Nostra**, started 2026-09-14. The narrative is the
sequel: the boss goes inside. That is why the cast is one figure with the same
body as Capo Nostra's boss and only the costume changes — the mesh rig's
daylight-under-the-arms margin is already proven on that silhouette and does not
need re-deriving.

This is **not** a pure reskin. The multiplier core is redesigned. Everything in
"Changed" below was confirmed with the user before any code was touched.

## Unchanged from Capo Nostra

| | |
|---|---|
| Grid | 5×4 |
| Paylines | 14, fixed, left-to-right from reel 1 |
| Scatter triggers | 3 / 4 / 5 scatters |
| Retrigger table | 2/3/4/5 scatters → +2/+4/+6/+8 spins |
| Bet modes | base + one buy per tier (4 modes) |
| RTP spread requirement | all modes within 0.5% of each other |

## Changed

| Slot | Capo Nostra | Hard Time |
|---|---|---|
| Name / id | Capo Nostra / `capo_nostra` | **Hard Time** / `hard_time` |
| Multiplier carrier | Vault Frame, 1×1 / 2×2 / 3×3 | **REMOVED** — the searchlight carries it |
| Expanding wild | Tommy Gun, fills the whole reel | **Searchlight**, expands **downward only** |
| Wild stickiness | none | **sticky for the rest of the feature** (FG only) |
| Free spins per tier | 10 | **8** |
| Tier differentiator | frame count + doubling rule | **searchlight density** |
| Tier names | SOLDIER / CAPO / THE DON | **LOCKDOWN / RIOT / BREAKOUT** |
| Max win | 20,000× | **12,000×** |
| Paytable | H1 400/100/40 … | **lowered overall** (see "odds" below) |
| Transition motif | vault doors closing | **power cut → red alarm light** |
| Low symbols | ♠ ♥ ♦ ♣ | **kept** — inmates play cards, the theme carries it |

## The searchlight, exactly

This is the whole game now, so it is written out in full.

1. A searchlight lands on a cell `(reel r, row y)` and lights **from that row
   down to the bottom of reel r**. A light landing on row 0 covers 4 cells; one
   landing on row 3 covers 1. It does **not** fill the reel upward.
2. The lit segment carries **one multiplier M**, drawn from a ladder, written onto
   every cell in the segment.
3. **Same-reel doubling.** If a searchlight lands on a reel that already carries a
   lit segment, the cells where the two segments **overlap** have their existing
   multiplier **×2**. Cells the new light covers that were not already lit take
   the new light's own M.
   > 「輪」in the user's spec means **reel**, not spin — confirmed 2026-09-14.
   > Reading it as "spin" specifies a different game entirely.
4. **Line multipliers ADD — but a ×1 cell adds nothing.** A payline crossing a ×5 cell and a ×8 cell pays
   `line × 13`, not `line × 40`. A ×1 cell contributes 0, because the SDK's `multiplier_method="symbol"` skips multipliers of 1: ×2 + ×1 pays ×2, not ×3. Verified 2026-09-16 over every win in all four published book sets (0 exceptions; 55–65% of lit-cell wins cross a ×1 cell). Player-facing copy says "above 1×" for this reason. Same rule the Vault Frames used, chosen to keep
   the single-spin tail short enough for Stake's Tail Probability check.
5. Base game: searchlights clear between spins. Feature: they are **sticky until
   the feature ends**, which is what makes rule 3 fire — a light landing on an
   already-lit reel is common across 8 sticky spins and near-impossible in a
   single base spin.

### Rule 3's second half — confirmed, not assumed

A new light's non-overlapping cells take **its own M**. The alternative reading —
a second light on a lit reel contributes only the doubling and carries no value
of its own — was put to the user and rejected on 2026-09-14. Rule 3 as written
above is the confirmed behaviour.

## Why the frames could not just be deleted

Removing the frames removed the only multiplier in the game. Without a
replacement the ceiling is:

```
400×  max line pay (5×W or 5×H1)
 ×14  paylines
= 5,600×   — and that upper bound requires all five reels wild on all 14 lines,
             which downward-only expansion cannot even produce.
```

`run.py` requires a `payout == wincap` row in **every** mode's lookup table, and
`force_wincap` could never have produced one. Hence the searchlight multiplier,
and hence the cap dropping 20,000× → 12,000×.

## Tiers

All three award **8 spins**. Searchlights are sticky in all three. They differ by
how many searchlights the feature deals:

| Tier | Scatters | Mode | Searchlight density |
|---|---|---|---|
| LOCKDOWN | 3 | `bonus` | starts empty |
| RIOT | 4 | `bonus_hits` | first free spin is guaranteed 1 extra searchlight |
| BREAKOUT | 5 | `bonus_epic` | first free spin guaranteed 1 extra, highest forced-light density |

### BREAKOUT's per-spin guarantee is OFF — decided 2026-09-14

The tier was specified with "every spin is guaranteed at least one more
searchlight". Measured 2026-09-14, that guarantee is mathematically incompatible
with sticky beams: a guaranteed light every spin over 8 sticky spins means at
least 8 lights accumulating on 5 reels, which saturates the board. With it on,
**100% of generated BREAKOUT books hit the win cap**; with it off and nothing
else changed, 42%.

The user chose to keep it disabled and separate the tiers by density alone. It is
off in `tier_guaranteed_light`; the mechanism is kept because it is config-driven,
and anything that turns it back on must re-measure the cap rate first.

## Art direction notes that belong to the spec, not the brief

- **Symbols differ by silhouette and material, not hue.** Carried over from Capo
  Nostra's art brief, where ignoring it cost a full palette pass.
- **The transition must not be cell doors closing.** That is a recoloured vault
  door, and the skill is explicit that a reskinned source motif is the thing to
  avoid. Power cut → red alarm is mechanically equivalent and theme-native.
- **One signal colour is reserved for the searchlight** and used nowhere else, the
  way Capo Nostra reserved its alarm red for the Tommy Gun.

## Status

- [x] Scaffold — `wp/apps/HardTime`, `math-sdk/games/hard_time`, ids renamed,
      dev port 3017 / storybook 6017, build green through all 17 guards, page
      boots with canvas mounted (verified, not assumed)
- [x] Math (code) — frames removed, searchlight implemented, optimizer knobs
      renamed and re-ranged to the 12,000x cap; `verify_optimization_input`
      passes and all four modes generate books
- [x] Math (balance) — full run clean, zero violations. Final measured:
      | mode | RTP | etl10k (<=0.8) | etl40b (<=0.9) | max win |
      |---|---|---|---|---|
      | base | 94.5800% | 0.0021 | 0.7222 | 1 in 8,000,001 |
      | bonus | 94.6300% | 0.1648 | 0.4894 | 1 in 120,000 |
      | bonus_hits | 94.6700% | 0.5452 | 0.3000 | 1 in 40,000 |
      | bonus_epic | 94.7800% | 0.7540 | 0.0000 | 1 in 20,000 |
      Spread 0.200% (Stake limit 0.5%). Buy costs re-priced 100/300/600 for
      20x+ headroom against the 12,000x cap.
      **Watch item: bonus_epic's etl10k sits at 0.754 against a 0.800 limit —
      under 6% margin. Any regeneration must re-check it, not assume it holds.**
- [x] Mechanic assertion — `design/check_searchlight.py`, clean over 100,000
      books / 271,105 searchlights / 88,841 doubled cells
- [x] Art & audio brief — `ART_AUDIO_BRIEF.md`
- [x] Frontend rewiring — book events `newFrames`/`updateFrames`/`frameDoubling`/
      `wildExpand` replaced by `searchlight`/`updateLights`; `NeonFrames.svelte`
      became `Searchlights.svelte` (per-cell, not per-beam); `WildColumns.svelte`
      sweeps downward from the landing row with duration scaled to beam length;
      tiers renamed; all player-facing copy rewritten (intro, loading tips, rules
      modal). Build green through 17 guards; src type errors 60 vs the source
      game's 61.
      **Verified by playing real books in the playtest shell**, not by reading the
      diff: book 5 (full beam) rendered reel 3 rows 1-4 all Wild each showing its
      own 1x badge; book 28 (doubling) rendered reel 1 rows 3-4 at 2x, reel 2 rows
      1-3 at 1x and row 4 doubling 1x -> 2x with its own distinct burst, and paid
      53.80x against the book's own payoutMultiplier of 5380.
- [x] Frontend theming + art integration — prison art delivered and wired:
      symbols, cast (one prisoner), backgrounds, board frame, splash wordmarks,
      win banners, UI icons, searchlight beam and lit-cell plate. Title is now
      "Hard Time"; tier wordmarks resolve to hmTitleLockdown/Riot/Breakout.
- [x] Dead-asset audit (2026-09-14) — run against the BUILT bundle, not src:
      * `ModalPayTable` still named every symbol as Capo Nostra's — Signet Ring,
        City Skyline, Briefcase, Whiskey & Cigar, Black Sedan, Vault Door, Tommy
        Gun — shipping over completely different prison artwork. No guard catches
        this: the labels are valid strings and every asset resolves. Renamed from
        the DELIVERED ART, which disagreed with the brief on H5 (brief said
        uniform number patch, art drew tally marks -> "Tally Patch").
      * 4 modal border-images still pointed at `capoUi/buy_card_frame.svg` while
        `hardTimeUi/buy_card_frame.svg` sat unused. These are CSS `url()` strings,
        invisible to `check_assets_exist.mjs`, which only reads `assets.ts`.
      * `hmCastGuy` (the non-mesh fallback) still pointed at Capo Nostra's boss.
      * `fxLeaf` survived as an UNREACHABLE branch in FxBurst — the last of the
        GoBananas jungle carry-over, kept alive by a condition that could not fire.
      * 53 dead registry entries removed (111 -> 58); 12 old asset folders deleted.
        `static/assets/sprites` 56M -> 5.9M. Bundle now clean of every old-game
        name and folder.
      Remaining by design: `hardTimeUiIcons/spin.png` and `turbo.png` are
      delivered but unused — `uiTheme` draws both as vectors so turbo can toggle
      hollow/filled, which a static sprite cannot do.
PLACEHOLDER
- [~] Pre-submission QA (2026-09-15, partial)

      `review-findings.md` — the five items generic to this codebase:

      1. **Disclaimer — WAS BROKEN.** Shipped `TM and © 2026 Silverstars Studio.`,
         which is the wording review already rejected once; inherited through the
         scaffold copy. Now `TM and © 2026 Engine.` verbatim as dictated, verified
         against the BUILD (0 hits for Silverstars / Stake Engine).
      2. **Insufficient balance — WAS BROKEN.** `explainInsufficientBalance` was
         never set. Capo Nostra never opted in, so the reskin inherited the gap and
         all three bet routes (button / spacebar / autoplay) would have dead-ended
         on a short balance. Now set at module scope, outside the skin branch.
      3. Currency XOF/XAF/XPF — already correct in `packages/utils-shared/amount.ts`.
      4. Store tile — 1024×1024, alpha genuinely reaches 0, ONE character, no baked
         text or logo, no firearms, reads as a prison at 200px. **Headroom is 40px**,
         between the 8px that was rejected and the 86px that was fine. FLAGGED.
      5. Portrait controls after the first spin — PASS, every control survives.

      **Big-win banner over a busy board — PASS, measured.** 430 samples across a
      RIOT feature and an EPIC WIN banner: worst per-cell WORLD alpha 1.000, zero
      frames with a missing symbol. Both halves of the Capo Nostra fix (`untrack`
      in SymbolSprite, the `winCelebrationShow` gate) are inherited and working.

      The probe took three attempts and the first two lied, which is worth keeping:
      it captured the cell array once and spent a whole feature measuring nodes the
      board rebuild had detached (they report alpha 1 and no texture — a confident
      number about nothing), and a fixed tree path stopped resolving the moment a
      splash changed the tree. The working version re-resolves the board by SHAPE
      every sample and refuses an empty set.

      **All three tiers played end to end, each reconciled against its book:**
      LOCKDOWN 8/8 → $27.40 (book 11 = 27.4×); RIOT → EPIC WIN $4,143.27;
      BREAKOUT 8/8 → $6,153.90 (book 50 = 6153.9×). Retrigger (book 5313):
      "FREE SPINS 2 AWARDED", counter went 8 → 8/10, final $98.70 = 98.7×.

      **Bottom-bar menu overlap — PASS.** Capo Nostra's Buy Bonus button sat on
      top of the paytable/info icons when the menu opened; here it yields.

      **Pay table / rules copy — TWO MORE STALE NUMBERS FOUND AND FIXED.**
      `FREE_SPINS = 10` in ModalPayTable and `baseFreeSpins = 10` in
      ModalGameRules were both Capo Nostra's count, so two player-facing panels
      promised 10 free spins where the game awards 8. The Searchlight's pay-table
      line also still described the Tommy Gun ("fills its entire reel with
      Wilds") — which promises MORE than this game delivers.

      **Restricted-word guard — VALIDATED, not assumed.** Injected a banned
      phrase as literal template text (rule 1) and into `pick()`'s social branch
      (rule 2); the guard failed loudly on both and the clean run after restoring
      is therefore meaningful. Two earlier injection attempts silently did not
      apply, and produced a confident "the guard is broken" that was wrong.

      **The load-time console error is explained and is NOT a game defect.**
      It was a buffered message from the first load of that tab, which
      `preview_start` opened at the bare URL with no query string — with
      `rgs_url` empty the request escapes the stub and DNS-fails, exactly as the
      stub's own header documents. A fresh tab on the full URL logs nothing:
      zero errors, 7 fetches, 0 failures, measured at three levels (a fetch
      wrapper installed before the stub, the stub's own wrapper, and an
      `unhandledrejection` listener).

      REGRESSION I CAUSED AND FIXED: the dead-asset pass deleted `capoUiIcons`,
      but `ModalGameRules` builds that path as a template literal
      (`${ICONS}/${name}.png`), so the folder name and the filename never appear
      together and a path-literal grep found nothing. Every control icon in the
      rules panel was a broken image until it was repointed at `hardTimeUiIcons`.

      **Replay mode — PASS, end to end.** Driven at
      `?replay=true&game=hard_time&mode=BASE&event=50` (the BREAKOUT book, so the
      replay exercises a whole feature rather than one spin):
      * the loading screen — which `LoadingScreen.svelte`'s own comment records as
        "the actual, visible, only screen" in replay, and one of Stake's
        checkpoints — showed Hard Time's rewritten tips, not Capo Nostra's
        Vault Frame / Tommy Gun copy. That is the exact place the previous
        occurrence of this bug was caught.
      * start card: Payout Multiplier 6153.9x, Total Win $6,153.90, "No bets will
        be placed". The wrapped-response bug the stub's header documents
        ("Payout Multiplier 0x / Total Win $0.00") is not present.
      * the round reproduced faithfully through BREAKOUT 8/8 and settled at
        $6,153.90, matching the card and book 50.
      * replay-again resets the board AND the win meter to $0.00 — the probe's
        note warns that a leftover total from the first run is what makes a naive
        check report success.
      * no spin button and no balance in the bet bar, which is correct: replay
        wagers nothing.

- [x] Store tile headroom (2026-09-15) — recomposited, not regenerated. The
      foreground was scaled to 93% and anchored at the ink's BOTTOM, so the figure
      keeps standing on the same ground line and every pixel gained comes off the
      top, which is the only place the platform's title overlay needs it.
      Headroom **40px -> 104px**, past the 86px that was known-fine and far past
      the 8px review rejected. Canvas still 1024x1024, alpha still reaches 0,
      bottom margin unchanged (64 -> 65). Pre-scale original preserved at
      `design/source/hardTime/tile/tile_foreground_prescale.png` — out of
      `static/` so it cannot ship.
- [x] bonus_epic etl10k — ASSESSED, deliberately NOT tuned. The 0.754-vs-0.800
      "6% margin" was a misread: `etl10k_floor = wincap_slice_rtp x mode_cost`
      = 0.001 x 600 = **0.600 of it is arithmetic and cannot drift**. Only the
      0.154 band varies, and it would have to grow 30% to breach. Verified the
      relationship holds on all four modes. The finding worth keeping is the
      constraint it implies — **bonus_epic cannot be priced above ~646x** at this
      limit, which is why the first run failed at 1.4639 (the inherited 1000x
      price put the floor alone at 1.000, over the limit before a single book
      existed) and why re-pricing, not suppressor tuning, is what fixed it.
      Written into `game_optimization.py`'s header.
- [x] Thumbnail — `upload/HardTime/thumbnail/`: `HardTime-BG.png` 1024×1024,
      `HardTime-FG.png` 1024×1024 with alpha reaching 0 and 104px headroom,
      `Silverstars-Logo.png`. Stake composites the three; nothing is baked in.
      The upload's FG was found still at the pre-scale 40px version (470,309 B,
      the original's exact size) — the tile fix had not propagated past
      `static/`. Replaced and re-measured.
- [x] Package — `design/ship.sh`, 2026-09-15 run #4 from the final source:
      frontend 45.7 MB / math 100.3 MB / upload 148.3 MB, gate all clean (real
      exit 0). Shipped bundle content-matched against the final-source snapshot
      after normalizing build noise. Details and lessons in HANDOFF.md §6.
