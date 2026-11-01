# Static Shift — Engine self-check, 2026-10-19 (Claude, after the review pass)

> Later ink/contact revision: the original full audit below predates the new art and contact cues. Root rechecked production staging, both store alpha/brightness layers, local base/feature/max runtime, required guards and motion gates; see INK_REVISION_QA.md. Math and shared packages were unchanged. Existing real-RGS / physical-phone / human-listening limits remain. Original verdict counts below remain attached to their audited snapshot.

Checklist: `wp/.claude/skills/stake-engine-slot/references/engine-self-check.md`.
Build checked: the one staged in `upload/StaticShift` at the end of this pass (108 checksummed files, 0 mismatches).
Ran the game: yes. Route B: the local mock RGS (`design/playtest_stub.js`, real books) at 1024×576, 400×225, 1280×800 and 425×812 (`device=mobile`). #274 was run on the production build with no mock (`rgs_url=example.com`).

## 1. Summary

38 PASS · 0 FAIL · 2 AT RISK · 2 NEEDS A HUMAN (+ a listen check on #107 and a real-phone check) · 1 N/A — the game was run, not only read.

Fixed during this pass (all re-checked after the change):
- Bet steppers − / + sat 1.5 / 2 px low on their round plates → 0 / 0 px (`packages/components-ui-pixi/src/components/UiButton.svelte`, ink-centred like the ∞ badge).
- Buy Bonus plate: "BONUS" sat on the plate's inner border (3.5 px low, label too big) → one line, 0.25 px off centre; phone plate was about 40×18 px with ~5 px letters → scale 1.7 (`src/game/uiTheme.ts`).
- Buy menu subtitle still said "CHOOSE YOUR JOB" (Go Banandit heist leftover) → "PICK YOUR BROADCAST".
- Shared `utils-shared/amount.ts` was missing Capo Nostra's 2026-10-14 review fix ("Balance and Bet always two decimals"); ported from the main `wp` tree.

## 2. AT RISK

**[219] Currency display: AT RISK.**
- **Found:** JPY shows `¥1,001.40` / `¥1.00`, i.e. two decimals. That follows Stake's Capo Nostra review of 2026-10-14 ("The Balance and Bet values should always be displayed with two decimal places"), now in `packages/utils-shared/amount.ts`. Engine's self-check table says JPY should read `¥10`, with 0 decimals. The two sources disagree. USD / CAD (`CA$1,000.00`) / XSC (`1,000.00 SC`) are correct.
- **Fix:** none until Stone picks one rule. Capo Nostra (2 decimals) and Go Banandit (0 decimals for JPY, built before the port) were both approved.

**Popup content rendered twice (not a numbered guideline; causes extra page height).**
- **Found:** `packages/components-shared/src/components/Popup.svelte:36-38` renders `props.children()` once outside the overlay as well. Every open modal has a second, visible copy in normal flow below the canvas (at 425×812 the document becomes 1170 px tall; body `overflow:hidden` stops the player scrolling to it). This has been in the template since 2026-07-31 and is in every game, including the approved ones.
- **Fix:** delete the stray `<div>{@render props.children()}</div>`. It is a shared component for all games, so this was left for Stone to decide.

## 3. Full table

| ID | Guideline | Verdict | Evidence |
| --- | --- | --- | --- |
| 181 | Authenticates on launch | PASS | `/wallet/authenticate` on every load via `rgs_url` (stub log); no hardcoded RGS host in the build |
| 274 | Invalid rgs_url fails clearly | PASS | prod build, `rgs_url=example.com`: "Sorry, something went wrong. TypeError: Failed to fetch"; no other host contacted |
| 183 | Bet sends play | PASS | `/wallet/play {mode:BASE, amount:1000000}`, round played (book 671, 2.4×) |
| 275 | No Stake Engine loader | PASS | build has no loader branding; `stake-engine-loader.gif` exists in the app folder but is not referenced or staged |
| 213 | Title | PASS | "Static Shift": no restricted term |
| 217 | Offensive content | NEEDS A HUMAN | adult cast, no minors seen in the symbols/cast/backgrounds viewed |
| 253 | Distinct from existing titles | NEEDS A HUMAN | original radio-studio world; rhythm reference only (Stream Time transcript), no captured art |
| 242 | Bet params from authenticate | PASS | bet menu lists the server ladder 0.10…50.00 + MAX(100); opens on `defaultBetLevel` 1.00 |
| 187 | Active round restores bet | PASS (code) | `utils-xstate/createPrimaryMachines.ts` pins `betToResume.amount` (same as approved Go Banandit) |
| 219 | Currencies | AT RISK | see §2 |
| 273 | Sub-cent payouts | PASS (code) | wins keep up to 4 decimals (`numberToCurrencyString`), floor 2 |
| 221 | Zero-win sends no end-round | PASS | two 0× rounds: no `/wallet/end-round`; 2.4× round: end-round after its presentation |
| 222 | Insufficient balance sends no play | PASS | balance 2.5 at 1.00, space held 22 s: 2 plays, then the notice; no `ERR_IPB` request sent |
| 228 | Space bar bets | PASS | window keydown starts a round |
| 227 | Main frame doesn't scroll | PASS | `body{overflow:hidden}`, canvas = viewport; see the Popup note in §2 |
| 104 | Autoplay needs confirmation | PASS | one press opens AUTO SPINS (rounds, ADVANCED, START AUTOPLAY); no play sent |
| 31 | High-cost modes confirmed | PASS | BUY 100× opens a confirm stating "100× your bet"; no play before CONFIRM |
| 107 | Sound off | PASS (code) / NEEDS A HUMAN (listen) | every cue and the music set volume from `stateSoundDerived` in `Sound.svelte`; no other audio source |
| 25 | RTP & max win per mode | PASS | rules table 96.05 / 96.07 / 96.09 %, 10,000× each = math |
| 24 | Every payout shown | PASS | pay table equals `math-sdk/games/StaticShift/game_config.py` paytable (9 symbols × 3 counts) |
| 26 | Win combinations explained | PASS | ways, adjacency, multiplication, highest win per symbol, collection |
| 27 | Every mode, description and cost | PASS | Free Spins 100×, Super Free Spins 150× |
| 29 | Free games & retriggers | PASS | 3/4/5 → 10/12/15; no Scatter retrigger stated; meter +10 at 4/8/12; maxima 45/40/30 |
| 235 | Every control explained | PASS | Spin, ±, Buy Bonus, Auto Spin, Turbo, Menu, Pay table, Sound, Settings |
| 185 | Disclaimer | PASS | full Engine text present |
| 266 | Mystery chances | N/A | no such feature in the math or rules |
| 193 | Laptop 1024×576 | PASS | loads, bets, controls clear |
| 195 | Popout S 400×225 / L | PASS | intro keeps 3 columns and fits; replay card fits |
| 194 | Mobile 425×812 | PASS | portrait layout, plate now readable; cast hidden by design |
| 223 | Double-tap zoom | PASS | `maximum-scale=1, user-scalable=no` + `touch-action: manipulation` |
| 239 | English | PASS | no keys / undefined / placeholders seen |
| 240 | Invalid language | PASS | `lang=zz` renders English |
| 77 | Social wording | PASS | static guard clean; in-game: PLAY BONUS, AMOUNT, FEATURES, PLAY 100×, "READY TO PLAY" |
| 78 | SC / GC, no $ | PASS | `1,000.00 SC`, `1.00 SC` |
| 225 | Mode names social | PASS | Free Spins / Super Free Spins |
| 188 | Replay social wording | PASS | replay card: Base Play, Feature Multiplier, Total Play Amount, Total Win |
| 171 | Replay loads & plays | PASS | superbonus event 2 card + Start Replay; no wallet calls |
| 172 | Optional params | PASS | XSC / amount / lang applied |
| 173 | Watch again | PASS | Codex QA 10-19 (Play Again after outro) |
| 174 | Cost & multiplier shown | PASS | 1.00 SC · 150x · 150.00 SC · 227.1x · 227.10 SC |
| 243 | Replay at 400×225 | PASS | card fits at 400×225 |
| — | Static files only | PASS | runtime requests are all local; the twist-game / s3 URLs in the bundle are unused template data (identical in approved games) |

House checks:
- Text centring: autoplay (incl. ADVANCED), buy menu, buy confirm, bet menu: 0 offenders. Bar steppers: 0 / 0 px (were 1.5 / 2). Buy plate: 0.25 px.
- Cast ghosts: N/A. Both casts are single-image meshes (`ComicFigure`), not the cut-layer rig the script checks.
- Still characters at feature beats: PASS. The intro cards animate their figures; FG intro, promotion and outro plaques show no cast; the cast swaps under full cover.

## 4. For a person to check

- [217] / [253]: look over the symbols, both casts and the store art.
- [107]: with the sound button off, play a base win, a FG trigger and a big win, and confirm silence.
- A real phone (touch): double-tap the board, open each modal, and confirm the page does not scroll.

## 5. Next step

Decide the JPY decimals rule (§2) and whether to remove the stray Popup render in the shared package. Both affect every game in the `wp-banandit` tree.
