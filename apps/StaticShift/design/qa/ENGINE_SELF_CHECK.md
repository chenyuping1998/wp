# Static Shift — Engine self-check

> FINAL ROOT ADDENDUM — 2026-10-19: the original independent source audit below is retained as historical evidence. Both observed failures were repaired: #273 uses WIN_MAX_FRACTION_DIGITS in both replay total fields; #223 adds viewport zoom constraints and canvas touch-action:manipulation. Final build/staging and full local regular-feature replay completed. All app-owned type errors are fixed; seven shared-package baseline errors remain. Mobile control-guide missing PNGs discovered during browser QA were restored and explicitly added to production asset staging. See MANUAL_QA.md for runtime evidence and limits. No platform update occurred. The historical verdict counts below describe the earlier snapshot, not the final package.

Date: 2026-10-18 (Asia/Taipei). Auditor: stake-compliance.

## 1. Summary

17 PASS · 2 FAIL · 15 AT RISK · 6 NEEDS A HUMAN · 1 N/A

**Would fail at the audited snapshot:** replay total-win precision (#273) and mobile double-tap protection (#223). This auditor read source, inspected two staged tile layers and exhaustively scanned the published books; this auditor did not run the game. Browser QA is a separate workstream and must not be inferred from this report.

Scope: `/Users/stone/stake-engine/wp-banandit/apps/StaticShift`, its shared packages, `math-sdk/games/StaticShift/library/publish_files`, and local `upload/StaticShift`. All abbreviated source paths below are relative to `/Users/stone/stake-engine/wp-banandit/`. No remote platform/auth inspected. No StaticShift platform entry exists per task context; platform upload, publication, approval-version and published-version comparison are N/A for this local packaging task.

## 2. Failures first

### [273] Sub-cent replay total win: FAIL

**Found:** `apps/StaticShift/src/components/ui/ReplayIntro.svelte:93,129` formats totalWin with `numberToCurrencyString(totalWin)`; default precision is two decimals. Example: a 0.005 USD win becomes $0.01 rather than $0.005, including persistent replay summary. Other gameplay win fields already use the four-decimal helper.

**Fix:** pass `WIN_MAX_FRACTION_DIGITS` in both totalWin calls in this component; keep stake/cost precision currency-specific. Verify a replay with a nonzero win below one cent.

### [223] Mobile double-tap zoom: FAIL

**Found:** `apps/StaticShift/src/app.html:18` supplies `<meta name="viewport" content="width=device-width" />`; the renderer explicitly uses `touchAction='auto'` (`packages/pixi-svelte/src/lib/components/InitialiseApplication.svelte:47`). Dialog-only manipulation does not protect the game surface.

**Fix:** add an explicit viewport zoom constraint in this app (e.g. initial-scale=1, maximum-scale=1, user-scalable=no), and/or apply touch-action:manipulation to the actual canvas/game surface. Test double-tap on a touch browser.

### AT RISK findings

The following are verification gaps, not observed approval violations. Each row gives the evidence and concrete action required.

- **[181] Authenticates with RGS: AT RISK. Found:** packages/components-shared/src/components/Authenticate.svelte:16 and packages/rgs-fetcher/src/rgsFetcher.ts:37 use URL rgs_url/sessionID and normalize the scheme. No real StaticShift RGS session exists; successful 200 response not verified. **Fix/verification:** exercise the named path in browser QA against the final staged build; record the URL parameters and result.
- **[274] Invalid rgs_url error: AT RISK. Found:** Authenticate.svelte:134 catches failures into stateModal error; no alternate RGS host found. Invalid-host runtime test not performed by this auditor. **Fix/verification:** exercise the named path in browser QA against the final staged build; record the URL parameters and result.
- **[183] Successful play request: AT RISK. Found:** packages/utils-xstate/src/createPrimaryMachines.ts:11 uses requestBet with URL session, mode and amount. Real platform response not verified. **Fix/verification:** exercise the named path in browser QA against the final staged build; record the URL parameters and result.
- **[213] Title allowed and unique: AT RISK. Found:** apps/StaticShift/src/components/ui/ModalGameRules.svelte:140 names STATIC SHIFT. No prohibited title term found. Global title uniqueness not checked against platform/catalogue. **Fix/verification:** exercise the named path in browser QA against the final staged build; record the URL parameters and result.
- **[242] All authenticate bet parameters: AT RISK. Found:** packages/components-shared/src/components/Authenticate.svelte:69–97 consumes minBet/maxBet/stepBet/defaultBetLevel/betLevels/jurisdiction and retains all levels. Short-ladder and between-rung balance runtime paths need QA. **Fix/verification:** exercise the named path in browser QA against the final staged build; record the URL parameters and result.
- **[219] Currency support: AT RISK. Found:** packages/utils-shared/amount.ts:24–76 maps USD/EUR/CAD/MXN/JPY and social currencies; fixed en-US locale. Multi-currency rendered fit and network tests not performed by auditor. **Fix/verification:** exercise the named path in browser QA against the final staged build; record the URL parameters and result.
- **[227] Main frame scroll: AT RISK. Found:** apps/StaticShift/src/app.html:21 body has margin:0/padding:0/overflow:hidden. Viewport overflow and touch behavior at all required sizes remain browser QA. **Fix/verification:** exercise the named path in browser QA against the final staged build; record the URL parameters and result.
- **[107] All sound can mute: AT RISK. Found:** apps/StaticShift/src/components/Sound.svelte:225,239,288 uses volumeSoundEffect; :363,378 uses volumeMusic; packages/state-shared/src/stateSound.svelte.ts:11–12 includes master volume. Listening to every feature and active effect while muting not verified. **Fix/verification:** exercise the named path in browser QA against the final staged build; record the URL parameters and result.
- **[235] Control guide: AT RISK. Found:** ModalGameRules.svelte:23–64,160–177 explains Spin, +/−, buy/play feature, autoplay, turbo, menu, play/pay table, sound and refers to Settings. Compare every rendered submenu/shortcut/replay control in browser for completeness. **Fix/verification:** exercise the named path in browser QA against the final staged build; record the URL parameters and result.
- **[239] English: AT RISK. Found:** English catalogue and English rules exist; source numbers are config-driven. All runtime labels, fallback glyphs and loading/replay cards require browser inspection. **Fix/verification:** exercise the named path in browser QA against the final staged build; record the URL parameters and result.
- **[77] Social wording: AT RISK. Found:** Static social gate passes with no restricted words. apps/StaticShift/src/game/socialTerms.ts centralizes betting vocabulary; no complete rendered social-state scan by auditor. Restricted words found by the static gate: none. **Fix/verification:** exercise the named path in browser QA against the final staged build; record the URL parameters and result.
- **[78] SC/GC no dollar sign: AT RISK. Found:** packages/utils-shared/amount.ts:72–76 defines XGC→GC, XSC/XEC→SC with suffix placement. Browser currency/state/image review not performed by auditor. **Fix/verification:** exercise the named path in browser QA against the final staged build; record the URL parameters and result.
- **[188] Social replay wording: AT RISK. Found:** ReplayIntro.svelte:31–45 switches all betting labels to social forms; static guard passes. Full social replay rendered states not reviewed by auditor. **Fix/verification:** exercise the named path in browser QA against the final staged build; record the URL parameters and result.
- **[171] Replay loads/plays/no wallet: AT RISK. Found:** Authenticate.svelte:179–187 branches replay before authenticate; rgs-requests/src/rgs-requests.ts:90 uses GET replay; createPrimaryMachines.ts:43 prevents end-round. apps/StaticShift/src/components/ResumeBet.svelte:25–29 waits for Start. Real replay/runtime controls and error path not verified. **Fix/verification:** exercise the named path in browser QA against the final staged build; record the URL parameters and result.
- **[172] Replay optional params: AT RISK. Found:** Authenticate.svelte:143–149 applies currency and API-unit amount; stateUrl.svelte.ts validates lang. Missing/invalid replay parameter behavior not exercised. **Fix/verification:** exercise the named path in browser QA against the final staged build; record the URL parameters and result.

## 3. Full checklist

| ID | Guideline | Verdict | Evidence |
| --- | --- | --- | --- |
| 181 | Authenticates with RGS | AT RISK | packages/components-shared/src/components/Authenticate.svelte:16 and packages/rgs-fetcher/src/rgsFetcher.ts:37 use URL rgs_url/sessionID and normalize the scheme. No real StaticShift RGS session exists; successful 200 response not verified. |
| 274 | Invalid rgs_url error | AT RISK | Authenticate.svelte:134 catches failures into stateModal error; no alternate RGS host found. Invalid-host runtime test not performed by this auditor. |
| 183 | Successful play request | AT RISK | packages/utils-xstate/src/createPrimaryMachines.ts:11 uses requestBet with URL session, mode and amount. Real platform response not verified. |
| 275 | No Stake Engine loader | PASS | apps/StaticShift/src/routes/+layout.svelte:28 mounts the studio WildPartyLoader; legacy Stake splash is removed. Loader source contains studio star art, no player-facing Stake branding. |
| 213 | Title allowed and unique | AT RISK | apps/StaticShift/src/components/ui/ModalGameRules.svelte:140 names STATIC SHIFT. No prohibited title term found. Global title uniqueness not checked against platform/catalogue. |
| 217 | Appropriate content | NEEDS A HUMAN | Viewed staged thumbnail Background and Foreground: radio studio and clearly adult DJ; no offensive content observed there. Complete asset-set judgment remains human review. |
| 253 | Distinct from existing titles | NEEDS A HUMAN | Original radio theme and new characters; mechanics intentionally remain identical to GoBanandit. Compare title, cast, symbols, cover and overall presentation against existing titles. |
| 242 | All authenticate bet parameters | AT RISK | packages/components-shared/src/components/Authenticate.svelte:69–97 consumes minBet/maxBet/stepBet/defaultBetLevel/betLevels/jurisdiction and retains all levels. Short-ladder and between-rung balance runtime paths need QA. |
| 187 | Active round restores amount | PASS | Authenticate.svelte:122–130 restores round.amount; createPrimaryMachines.ts:180–186 pins resumed betAmount and wageredBetAmount again without resetting to default. |
| 219 | Currency support | AT RISK | packages/utils-shared/amount.ts:24–76 maps USD/EUR/CAD/MXN/JPY and social currencies; fixed en-US locale. Multi-currency rendered fit and network tests not performed by auditor. |
| 273 | Sub-cent payouts | FAIL | apps/StaticShift/src/components/ui/ReplayIntro.svelte:93,129 passes totalWin to numberToCurrencyString with its default maximumFractionDigits=2 (packages/utils-shared/amount.ts:137). A replay win of 0.005 displays 0.01; gameplay book amounts use the separate four-decimal formatter. |
| 221 | No end-round on zero win | PASS | packages/utils-xstate/src/createPrimaryMachines.ts:91–95 noWin endGame is a no-op; :132 classifies payoutMultiplier>0 as winning; :43 immediately skips endRound in replay. |
| 222 | Insufficient balance blocks play | PASS | createPrimaryMachines.ts:147–154 checks isBetCostAvailable before request; clears autoplay and space hold and opens insufficientFunds. apps/StaticShift/src/components/ui/ModalBuyBonus.svelte:89–91,151 disables unaffordable buys using base stake × mode cost. Runtime held-space regression remains QA. |
| 228 | Space bar | PASS | packages/components-shared/src/components/EnableHotkey.svelte:19,34 prevents default and binds window keydown; components-ui-pixi/src/components/ButtonBet.svelte:127 gates Space with disabled/modalOpen. Hold routing has affordability guard. |
| 227 | Main frame scroll | AT RISK | apps/StaticShift/src/app.html:21 body has margin:0/padding:0/overflow:hidden. Viewport overflow and touch behavior at all required sizes remain browser QA. |
| 104 | Autoplay confirmation | PASS | packages/components-ui-pixi/src/components/ButtonAutoSpin.svelte:35–54 opens autoSpin modal; button does not begin play on initial press. |
| 31 | Expensive-mode confirmation | PASS | apps/StaticShift/src/components/ui/ModalBuyBonus.svelte:94–97 choose broadcasts buyBonusConfirm only; packages/components-ui-html/src/components/ModalBuyBonusConfirm.svelte:18–24 only confirm broadcasts bet. Config-driven dialogs state mode cost. |
| 107 | All sound can mute | AT RISK | apps/StaticShift/src/components/Sound.svelte:225,239,288 uses volumeSoundEffect; :363,378 uses volumeMusic; packages/state-shared/src/stateSound.svelte.ts:11–12 includes master volume. Listening to every feature and active effect while muting not verified. |
| 25 | RTP/max win per mode | PASS | apps/StaticShift/src/components/ui/ModalGameRules.svelte:110–133,225,332 derives all mode RTP and max_win from config and states base stake. LUT verification: 96.05/96.07/96.09%, all 10000x base stake. |
| 24 | Symbol payouts | PASS | apps/StaticShift/src/components/ui/ModalPayTable.svelte:6,16–40 derives payout rows from config.symbols and maps all nine paying symbols plus W/P/S. Config paytable matches unchanged GoBanandit maths. |
| 26 | Winning combinations | PASS | ModalGameRules.svelte:145–157 and :233–270 explain 5×4 ways, left-to-right matching, Wild exclusions, every-Relay collection and collection-only meter multipliers. Full published-book mechanic scan found zero mismatches. |
| 27 | Mode descriptions/costs | PASS | ModalGameRules.svelte:97–103,306–324 lists both buys with config cost/spins/start meter and multiplier. index.json has exactly base=1, bonus=100, superbonus=150. |
| 29 | Free games/retriggers | PASS | ModalGameRules.svelte:275–301 states scatter awards derived from config, no Scatter retriggers, meter thresholds/additions and maximum spins. All books: maxima 45/40/30 and zero freegame scatters. |
| 235 | Control guide | AT RISK | ModalGameRules.svelte:23–64,160–177 explains Spin, +/−, buy/play feature, autoplay, turbo, menu, play/pay table, sound and refers to Settings. Compare every rendered submenu/shortcut/replay control in browser for completeness. |
| 185 | General disclaimer | PASS | packages/state-shared/src/legal.ts:20–28 contains all official disclaimer clauses; ModalGameRules.svelte:345 renders LEGAL_NOTICE. Official self-check explicitly permits wins for both modes; older docs/stake-submission-rules.md pays split conflicts, documented below. |
| 266 | Mystery odds | N/A | index.json defines only base, bonus and superbonus. No Mystery mode or advertised chance selector found. |
| 193 | Laptop 1024×576 | NEEDS A HUMAN | Auditor did not run browser. Verify all controls, modal fit, readable text and one complete base/feature round at 1024×576. |
| 195 | Popout 400×225 / 800×450 | NEEDS A HUMAN | Auditor did not run browser. Verify controls, modal scrolling and complete base/feature rounds at both sizes. |
| 194 | Mobile 425×812 | NEEDS A HUMAN | Auditor did not run browser. Verify touch controls, overlays, fit and full gameplay at 425×812. |
| 223 | Double-tap zoom disabled | FAIL | apps/StaticShift/src/app.html:18 has only width=device-width. packages/pixi-svelte/src/lib/components/InitialiseApplication.svelte:47 explicitly sets renderer canvas touchAction=auto. Popup.svelte:70 has manipulation only on dialogs, not the game surface. Official checklist explicitly says width=device-width alone fails. |
| 239 | English | AT RISK | English catalogue and English rules exist; source numbers are config-driven. All runtime labels, fallback glyphs and loading/replay cards require browser inspection. |
| 240 | Unknown-language fallback | PASS | packages/state-shared/src/stateUrl.svelte.ts:29–42 validates catalogue and returns en; packages/components-shared/src/components/LoadI18n.svelte:33–42 retries English on exceptions. |
| 77 | Social wording | AT RISK | Static social gate passes with no restricted words. apps/StaticShift/src/game/socialTerms.ts centralizes betting vocabulary; no complete rendered social-state scan by auditor. Restricted words found by the static gate: none. |
| 78 | SC/GC no dollar sign | AT RISK | packages/utils-shared/amount.ts:72–76 defines XGC→GC, XSC/XEC→SC with suffix placement. Browser currency/state/image review not performed by auditor. |
| 225 | Social mode names | PASS | apps/StaticShift/src/game/betModeMeta.ts selects social labels; ReplayIntro.svelte:50–54 maps BASE/BONUS/SUPERBONUS to Base Game/Free Spins/Super Free Spins. No restricted machine mode label is shown as-is for these modes. |
| 188 | Social replay wording | AT RISK | ReplayIntro.svelte:31–45 switches all betting labels to social forms; static guard passes. Full social replay rendered states not reviewed by auditor. |
| 171 | Replay loads/plays/no wallet | AT RISK | Authenticate.svelte:179–187 branches replay before authenticate; rgs-requests/src/rgs-requests.ts:90 uses GET replay; createPrimaryMachines.ts:43 prevents end-round. apps/StaticShift/src/components/ResumeBet.svelte:25–29 waits for Start. Real replay/runtime controls and error path not verified. |
| 172 | Replay optional params | AT RISK | Authenticate.svelte:143–149 applies currency and API-unit amount; stateUrl.svelte.ts validates lang. Missing/invalid replay parameter behavior not exercised. |
| 173 | Replay again | PASS | apps/StaticShift/src/components/ResumeBet.svelte:38–51 reseeds held stateReplay.round and broadcasts resumeBet when startRequested. No wallet route is used by this path; actual animation repeat delegated to QA. |
| 174 | Replay cost/multiplier | PASS | apps/StaticShift/src/components/ui/ReplayIntro.svelte:58–65,87–94 shows base amount, config cost multiplier, total feature amount, final multiplier and total win, and retains summary after the card. See #273 for precision defect. |
| 243 | Replay 400×225 | NEEDS A HUMAN | Auditor did not run browser. Start and replay-again controls plus amount/cost/result summary must fit at 400×225. |

## 4. For a person to check

- [217] Review every symbol, background, character, cover and loader for restricted imagery. Staged tile BG/FG inspected here look like a radio room and adult DJ; this is not a full asset review.
- [253] Compare title/logo/cast/art/theme/presentation against existing games; the math intentionally inherits GoBanandit.
- [193]/[195]/[194] At 1024×576, 400×225, 800×450 and 425×812, inspect menu, expanded autoplay, settings, buy cards and confirmation, rules, win plaques and full base/bonus/superbonus completion.
- [243] At 400×225, check Start, replay-again and retained stake/cost/result summary.
- House typography: run `scripts/ui_center_audit.js` over desktop/mobile modals, bar plates and feature counter; any measured offset ≥1px is AT RISK. Not run by this auditor.
- House cast checks: original own-rig layer ghost checker applies only to #7 cutout atlas rigs; current StaticShift cast uses transparent full illustrations. Do not claim arm-ghost validation from a static thumbnail. Render feature intro/outro, collector and max-win beats and ensure each displayed cast character actually moves. Not verified by this auditor.

## 5. Next step

Root should fix #273 and #223, rebuild and restage, then re-check those two guidelines. Finish independent browser QA and record remaining gaps before any future platform submission. User authorized local packaging only; no upload/publication performed or needed.

## Math and approval contract evidence

Command: `~/.local/bin/stakecli compliance math-sdk/games/StaticShift/library/publish_files` (read-only offline). Result: **PASS, 0 failures, 0 warnings**. Repeat on staged math before delivery.

| Mode | Cost | Weighted RTP | Max win/base stake | Max win/purchase price | Max-win occurrence |
| --- | ---: | ---: | ---: | ---: | ---: |
| base | 1 | 96.0500% | 10000× | 10000× | 1 in 981.7K |
| bonus | 100 | 96.0700% | 10000× | 100× | 1 in 19.6K |
| superbonus | 150 | 96.0900% | 10000× | 66.67× | 1 in 13.0K |

All satisfy the house 96.00–96.10% band, increasing buy RTP, 0.5pp cross-mode spread, and reachable max-win frequency. Base weighted nonzero hit rate 29.0425% (one in 3.443). Index has exactly three modes and all six referenced files resolve. No prohibited jackpot, gamble, early cashout or fixed currency prize ladder found in scanned game source. MEGA WIN is a celebration label, not a jackpot.

All seven published files were compared with `Buffer.equals` against GoBanandit and were byte-identical: index, three books, three lookup tables. This independently proves unchanged published math/protocol at that snapshot.

A read-only Node 24 streaming scan used `fs.createReadStream(...).pipe(zlib.createZstdDecompress())` and `readline`, parsed every book and compared its payout with the corresponding LUT row. No helper file was written. It checked sequential event indices, finalWin terminal event, Wild absence from reel 1, no freegame Scatters, Pack prize ranges, collect board coordinates and values, perCollector sum, number of collectors, active meter multiplier, collection amount (allowing cap truncation), meter count/level/additions and missing-collect conditions.

| Mode | Books | Collection events | Maximum FS | Failures |
| --- | ---: | ---: | ---: | ---: |
| base | 100000 | 51065 | 45 | 0 |
| bonus | 50000 | 210641 | 40 | 0 |
| superbonus | 50000 | 195420 | 30 | 0 |

Published event set: reveal, setTotalWin, finalWin, winInfo, setWin, freeSpinTrigger, updateFreeSpin, collect, banditMeter, freeSpinEnd, wincap. All 11 are present in `apps/StaticShift/src/game/bookEventHandlerMap.ts:126–392`. This is static coverage, not a claim that all 200000 animations were replayed in a browser.

## Build gates, assets and review-log traps

Re-ran independently after new assets landed:

- `node design/check_assets.mjs` → `OK: all 55 asset paths resolve`
- `node design/check_audio.mjs` → `OK: all 36 audio cues resolve (19 named directly)`
- `node design/check_undefined_refs.mjs` → `OK: no undefined template references`
- `node design/check_social_words.mjs` → `OK: no restricted words in social-facing copy`
- `node design/check_mesh_wins.mjs` → `check_mesh_wins: all checks passed` (exit 0). Earlier decoder-skip finding was superseded by the root's panel-rig decoder-independent gate.
- `/tmp/staticshift-ship.log` records successful Vite build/adapter-static `✔ done`; source has **17 inherited svelte-check baseline errors and no new ones** per root. This is not a clean TypeScript baseline.

Registry cross-check: `constants.ts:213–225` uses gbH1–gbH4, gbL1–gbL5, gbW, gbS, gbP; each resolves in assets.ts to the new StaticShift assets. `ModalPayTable.svelte:16–31` uses the same keys. Old gb naming is internal and does not imply old displayed art. Literal sprite-only guard blind spot considered.

Corrected earlier findings: rules now reference generated `config.prizeRanges` at :236–237, use base stake at :225/:332, and name Tape Deck Scatter at :279. Missing assets no longer reproduce. Shared disclaimer uses the official self-check's accepted “wins” wording; older repository pays/wins split conflicts with both current shared source comments and official #185 example. Treat as documentation discrepancy, not a reason to change every game's accepted legal notice.

Tile layers: viewed staged `thumbnail/StaticShift-BG.png` and `StaticShift-FG.png`. Background has no wording or multipliers; foreground is a separate adult DJ cutout. Provider logo present separately. Cover BG/FG exist, but full cover and title composition have not been visually inspected by this auditor.

Review-log checks still requiring runtime evidence: full server ladder with balance between rungs; restored active stake after full round; prolonged Space hold running out of funds; buy cards after amount changes; mute during every active effect; no new console/network errors; feature beat motion and full event completion. No approval rating is predicted by this audit.

## Final staged-tree verification

Pending final “Staged” marker in `/tmp/staticshift-ship.log` at report draft time; no platform actions authorized. Auditor will update this section after the marker.
