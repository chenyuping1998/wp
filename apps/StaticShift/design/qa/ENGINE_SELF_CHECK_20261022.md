# Static Shift — Engine self-check, 2026-10-22 (Claude, before submission)

Checklist: `wp/.claude/skills/stake-engine-slot/references/engine-self-check.md` + house checks.
Build checked: front v4 as published 2026-10-22 (= `upload/StaticShift/frontend`, = `dist/staticshift-playtest`), math v1.
Ran the game: yes, route B (mock RGS `stub.js`, real books) with a temporary fetch probe that logged every RGS call and could rewrite balance / bet config. Sizes 1024×576, 400×225, 425×812 (`device=mobile`). #274 on the production `index.html` with no mock. Probe files removed afterwards.

## 1. Summary

37 PASS · 0 FAIL · 1 AT RISK (+3 house AT RISK) · 2 NEEDS A HUMAN (+ listen check, real phone) · 1 N/A — the game was run, not only read.

## 2. AT RISK

**[219] Currency display: AT RISK (unchanged since 10-19).**
- **Found:** JPY shows `¥1,000.00` / `¥1.00` (two decimals). Engine's table says `¥10` (0 decimals); Stake's Capo Nostra review (10-14) asked for "always two decimals". USD `$1,000.00`, XGC `1,000.00 GC`, XSC `1.00 SC` correct.
- **Fix:** Stone to pick one rule (`packages/utils-shared/amount.ts`).

**House — Signal Pack value legibility, 10×–50× tier: AT RISK.**
- **Found:** `src/components/SackBadge.svelte:17-18` — 1–5× ink on gold (10.6:1), 100×+ gold on ink (10.6:1), but 10–50× is cream `0xe5e2d6` on orange `0xe7aa53`: **1.58:1**. Rendered at reel scale (badge ≈ 30 px) the digits are faint. Same class as Sushi Monkey's 10-20 review "plate value unclear".
- **Fix:** ink `0x15191f` on the orange plate (8.7:1), keep the plate colour so the tier still reads as "bigger".

**House — rules don't list every Pack value: AT RISK.**
- **Found:** Rules: "Signal Packs land carrying a value from 1× to 50× the amount (up to 250× in Free Spins)"; Play table: "Carries a value". Maths (`game_config.py:82-87`): base 1, 2, 3, 4, 5, 10, 15, 20, 25, 50×; Free Spins add 100× and 250× (all three modes). Range is correct, but the house rule after the Sushi review is to list every value per mode.
- **Fix:** list them in `ModalGameRules.svelte` (+16 locales) and the Play table Signal Pack row.

**House — text centring: AT RISK (minor).**
- **Found:** bet menu buttons "1,000.00" and "2,000.00" sit 1.1 px low in their boxes (`__centerAudit.html()`); every other button 0. Autoplay (incl. ADVANCED), buy menu, buy confirm: 0 offenders.

## 3. Full table

| ID | Guideline | Verdict | Evidence |
| --- | --- | --- | --- |
| 181 | Authenticates on launch | PASS | `/wallet/authenticate {sessionID, language}` on every load via `rgs_url` |
| 274 | Invalid rgs_url | PASS | prod build, `rgs_url=example.com`: request went to `https://example.com/wallet/authenticate` (scheme added), dialog "Sorry, something went wrong. TypeError: Failed to fetch"; no other host |
| 183 | Bet sends play | PASS | `/wallet/play {mode:BASE, amount:1000000}`, rounds played |
| 275 | No Stake Engine loader | PASS | no `stake engine` / `powered by stake` / loader strings in `upload/StaticShift/frontend` |
| 213 | Title | PASS | "Static Shift" |
| 217 | Offensive content | NEEDS A HUMAN | adult cast; nothing doubtful in symbols/cast/backgrounds seen |
| 253 | Distinct from existing titles | NEEDS A HUMAN | original radio-studio world |
| 242 | Bet params from authenticate | PASS | authenticate rewritten to levels 1/1.5/2/3, default 1.5: opened on $1.50, stopped at $3.00 and $1.00 (− greyed) |
| 187 | Active round restores bet | PASS (code) | shared `createPrimaryMachines` unchanged since 10-19 |
| 219 | Currencies | AT RISK | §2 |
| 273 | Sub-cent payouts | PASS (code) | formatter unchanged since 10-19 |
| 221 | Zero-win sends no end-round | PASS | 4× 0× rounds: no end-round; 20.5× round: end-round after presentation |
| 222 | Insufficient balance | PASS | balance 2.50 at 1.00, space held 22 s: 2 plays, then "INSUFFICIENT FUNDS…" notice, no further play; both buy cards greyed "INSUFFICIENT BALANCE" |
| 228 | Space bar bets | PASS | window keydown starts a round |
| 227 | No scroll | PASS | body `overflow:hidden`; 1024×576 page 582 px, 425×812 page 816 px, not user-scrollable |
| 104 | Autoplay confirmation | PASS | one press opens AUTO SPINS (rounds, ADVANCED, START AUTOPLAY); 0 plays sent |
| 31 | High-cost modes confirmed | PASS | card shows 150.00 GC; confirm "Enter 10 FREE SPINS for 150× your amount…"; 0 plays before CONFIRM |
| 107 | Sound off | PASS (code) / NEEDS A HUMAN (listen) | unchanged since 10-19 |
| 25 | RTP & max win per mode | PASS | rules 96.05 / 96.07 / 96.09 %, 10,000× = `stakecli compliance` |
| 24 | Every payout shown | PASS | play table 9 symbols × 3 = `game_config.py:42-52` |
| 26 | Win combinations | PASS | ways, adjacency, multiplication, highest per symbol, collection |
| 27 | Mode description & cost | PASS | Free Spins 100×, Super Free Spins 150× |
| 29 | Free games & retriggers | PASS | 3/4/5 → 10/12/15; no Scatter retrigger; meter +10 at 4/8/12; maxima 45/40/30 |
| 235 | Every control explained | PASS | Spin, ±, Play Bonus, Auto Spin, Turbo, Menu, Play table, Sound (+Settings via Menu) |
| 185 | Disclaimer | PASS | full Engine text |
| 266 | Mystery chances | N/A | no such feature |
| 193 | Laptop 1024×576 | PASS | loads, bets, controls clear |
| 195 | Popout S 400×225 | PASS | replay card scrolls to Start Replay; replay bar fits |
| 194 | Mobile 425×812 | PASS | portrait layout, DJ waist-up behind board, controls reachable |
| 223 | Double-tap zoom | PASS | `maximum-scale=1, user-scalable=no` + `canvas{touch-action:manipulation}` |
| 239 | English | PASS | no keys / undefined |
| 240 | Invalid language | PASS | `lang=zz` renders English |
| 77 | Social wording | PASS | `social_text_audit.js`: splash, base, bet menu, autoplay+ADVANCED, buy menu, buy confirm, FG intro, big/super/mega/epic win, meter promotion, total win, play table, rules: 0 hits |
| 78 | SC / GC, no $ | PASS | `1,000.00 GC`, `1.00 SC` |
| 225 | Mode names social | PASS | FEATURES / PLAY 100× / PLAY BONUS |
| 188 | Replay social | PASS | Base Play, Feature Multiplier, Total Play Amount, Total Win; audit 0 hits |
| 171 | Replay loads & plays | PASS | `/bet/replay/static-shift/1/superbonus/2` only, no wallet calls |
| 172 | Optional params | PASS | XSC / amount / lang applied |
| 173 | Watch again | PASS | REPLAY button on the replay bar |
| 174 | Cost & multiplier | PASS | 1.00 SC · 150x · 150.00 SC · 227.1x · 227.10 SC |
| 243 | Replay at 400×225 | PASS | card scrolls; bar fits |
| — | Static files only | PASS | runtime requests all local; bundle URLs are unused template data (same as approved games) |
| — | Bet ladder K/M | PASS | ladder to 1,000,000: "750,000.00", no K/M |

House checks:
- Text centring: §2 (1.1 px in two bet-menu buttons).
- Cast ghosts: `check_cast_underlay.py` mg WARN (L 3.9 %, R 8.3 %), fg WARN (L 0.6 %, R 2.3 %) — same art as 10-21, visually checked then.
- Still characters at feature beats: PASS — intro cards use the Spine rigs; FG collects now play `hype` (10-22).
- Math: `stakecli compliance` PASS, 2★ + 3★, 0 failures.

## 4. For a person to check

- [217] / [253]: look over symbols, both casts, store art.
- [107]: sound off → base win, FG trigger, big win: silence.
- Real phone: double-tap the board, open each modal, no page scroll.
- Popout S: the "08:52 STATIC SHIFT" header is large relative to the scene at 400×225 — look whether it reads as clutter.

## 5. Next step

Fix the two Pack items (badge ink, value list in rules + play table, 16 locales) and decide JPY decimals.

## 6. Fixes after the check (same day, staged — platform not updated)

- SackBadge 10–50× ink → `0x15191f` on the orange plate (8.7:1); verified on the reel (book 713: 3×, 4×, 15×).
- `design/sync_math_config.mjs` now also writes `prizeValues` (every Pack value per game type) into `src/game/config.ts`.
- Rules "Signal Packs & the Relay": lists every value (base 1–50×, ten values; Free Spins adds 100×, 250×) and the badge colour per tier. Play table Signal Pack row lists the same values, and its icon now wears a 5× badge like the reel symbol. Rules/play table are English-only components (no locale strings to update). Social run: "amount" / "award" wording held.
- Not changed: JPY decimals (Stone's call), bet-menu 1.1 px.
- 2026-10-23: Stone decided JPY keeps two decimals (`¥1,000.00`), matching the 10-14 review rule — [219] is PASS; no code change (shared `amount.ts` already does this).
