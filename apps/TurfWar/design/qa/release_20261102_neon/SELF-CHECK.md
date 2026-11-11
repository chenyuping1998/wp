# Turf War — 2026-11-02 release self-check

{'AT RISK': 19, 'PASS': 26, 'NEEDS A HUMAN': 5, 'N/A': 1}

Scope: exact production build from the approved local cadence trial. All audited src files match final v32 apart from constants.ts. Reused findings explicitly labelled; this is not a new full runtime/device audit. User requested upload and publication.

## Failures and risks

No unresolved FAIL in revalidated checklist. Remaining AT RISK/NEEDS A HUMAN items below retain uncompleted checks, including full currency/device/replay matrices and real RGS session. JPY retains the reviewer-requested2dp behavior; no shared formatter edit.

## Full checklist

| ID | Guideline | Verdict | Evidence |
|---|---|---|---|
| 181 | Authenticates with the RGS on launch | AT RISK | Inherited evidence (2026-10-31; matching audited source): RGS client and actor source inspected; this run used real-book replay fixtures, not a live authenticated wallet session. Authenticate.svelte:16; game/actor.ts:24. Confirm live authenticate/play status and payloads. Current candidate: 5 normal local mock rounds completed; no claim of real RGS session testing. |
| 274 | Fails correctly with an invalid rgs_url | AT RISK | Inherited evidence (2026-10-31; matching audited source): Authenticate.svelte:131 error modal and rgsFetcher.ts:36 URL-only host; invalid-host runtime path not captured in this audit. |
| 183 | Pressing bet sends a successful play request | AT RISK | Inherited evidence (2026-10-31; matching audited source): RGS client and actor source inspected; this run used real-book replay fixtures, not a live authenticated wallet session. Authenticate.svelte:16; game/actor.ts:24. Confirm live authenticate/play status and payloads. Current candidate: 5 normal local mock rounds completed; no claim of real RGS session testing. |
| 275 | No Stake Engine loader | PASS | Inherited evidence (2026-10-31; matching audited source): Production build guards and observed loading/replay use Turf artwork; build.log. |
| 213 | Title is unique and avoids restricted terms | AT RISK | Inherited evidence (2026-10-31; matching audited source): Turf War has no listed restricted title term. Web search cannot establish uniqueness; compare platform catalogue and obtain reviewer confirmation. |
| 217 | No offensive or inappropriate content | NEEDS A HUMAN | Inherited evidence (2026-10-31; matching audited source): Viewed thumbnail/cover and runtime adult cast; full asset content and similarity judgement still needs final art review. |
| 253 | Distinct from existing titles | NEEDS A HUMAN | Inherited evidence (2026-10-31; matching audited source): Viewed thumbnail/cover and runtime adult cast; full asset content and similarity judgement still needs final art review. |
| 242 | Uses every bet parameter from authenticate | PASS | Inherited evidence (2026-10-31; matching audited source): packages/components-shared/src/components/Authenticate.svelte:71–95 consumes min/max/step/default/levels from authenticate. Static evidence; dynamic response mutation not repeated. |
| 187 | An active round restores its bet amount | PASS | Inherited evidence (2026-10-31; matching audited source): Authenticate.svelte:118–124 restores round.amount; createPrimaryMachines.ts:165–178 resume handling. Static verification only. |
| 219 | Supports and displays currencies correctly | AT RISK | Inherited evidence (2026-10-31; matching audited source): packages/utils-shared/amount.ts:128–135 forces 2 decimals including JPY. Comment cites 2026-10-14 reviewer requirement; current self-check says JPY 0 decimals. Resolve conflicting requirements before editing shared formatter; full seven-currency runtime matrix incomplete. |
| 273 | Sub-cent payouts display correctly | PASS | Inherited evidence (2026-10-31; matching audited source): amount.ts:118 decimalsNeeded plus WIN_MAX_FRACTION_DIGITS=4, bookEventAmountToCurrencyString; sub-cent formatting retained. |
| 221 | Zero-win rounds send no end-round | PASS | Inherited evidence (2026-10-31; matching audited source): createPrimaryMachines.ts:125–137 conditions round closure on winning/active round; replay end-round is suppressed at line43. Source check. |
| 222 | Insufficient balance sends no play request | PASS | Inherited evidence (2026-10-31; matching audited source): game/actor.ts:24–30 checks affordability before request and stops auto; ModalBuyBonus.svelte:108–110 uses mode cost; ButtonBet.svelte:46–49 explains insufficient balance. Source check; 20s space-hold wallet test pending. |
| 228 | Space bar places a bet | PASS | Inherited evidence (2026-10-31; matching audited source): EnableHotkey.svelte:9,19,34 uses window keydown + preventDefault; ButtonBet.svelte:127 disables during modals. Source check. |
| 227 | Main frame doesn't scroll | AT RISK | Inherited evidence (2026-10-31; matching audited source): 1024×576 and 400×225 reports show viewport=scroll dimensions. app.html:62 overflow hidden. 800×450 and portrait runtime not completed this audit. |
| 104 | Autoplay needs a confirmation step | PASS | Inherited evidence (2026-10-31; matching audited source): ButtonAutoSpin.svelte:34 opens settings; AutoSpinsStartButton.svelte:25–39 starts only after confirmation. |
| 31 | High-cost modes need confirmation | PASS | Inherited evidence (2026-10-31; matching audited source): ModalBuyBonus.svelte:112–116 opens buyBonusConfirm; costs shown at184–185; all modes cost1/100/500/1000 in math index. |
| 107 | Sound can be turned off | NEEDS A HUMAN | Inherited evidence (2026-10-31; matching audited source): Sound.svelte:559,574–597 routes BGM/effects through volume settings; listen to mute during base, feature, big-win and ambient paths. |
| 25 | RTP and max win are stated | PASS | Inherited evidence (2026-10-31; matching audited source): game/config.ts RTP 96.01/96.02/96.03/96.05%; all max20,000x. math.log recomputed all100,000 LUT/book entries; rules derive config. |
| 24 | Every symbol's payout is shown | PASS | Inherited evidence (2026-10-31; matching audited source): ModalPayTable.svelte:41,76–88 lists12 symbols and config payouts; wins.log recomputed12,501 wins across800 winning rounds. |
| 26 | Win combinations are explained | PASS | rulesText.ts:39 and IntroFeatures/i18nText hashes match final published v32 fixes in precheck_20261031/publish/RELEASE-RECEIPT.json; removed incorrect one-Bruiser-per-spin claim. No math changes. |
| 27 | Every mode has a description and cost | PASS | Inherited evidence (2026-10-31; matching audited source): betModeMeta.ts:45–61 descriptions derive config cost. Lookout100x, Muscle500x, Kingpin1000x match math/index.json. |
| 29 | Free games and re-triggers are explained | PASS | Inherited evidence (2026-10-31; matching audited source): rulesText.ts:48–52 and ModalGameRules trigger/retrigger tables match game_config.py:252,279. 12/10-spin feature paths observed locally. |
| 235 | Every control is explained | PASS | Inherited evidence (2026-10-31; matching audited source): ModalGameRules.svelte:66 control guide lists11 controls including autoplay/turbo/menu/sound/feature. |
| 185 | General disclaimer is present | PASS | Inherited evidence (2026-10-31; matching audited source): rulesCommon.ts:194 includes malfunction, connection, resume, expected return, illustrative display and RGS settlement; ModalGameRules.svelte:355 TM ©2026 Engine. |
| 266 | Mystery Mode chances are accurate | N/A | Inherited evidence (2026-10-31; matching audited source): Four listed modes are Base/Lookout/Muscle/Kingpin; no Mystery Mode or displayed probability feature in rules/meta/index. |
| 193 | Laptop 1024×576 | AT RISK | Inherited evidence (2026-10-31; matching audited source): Desktop base + Lookout replay completed, no errors. replay-low-contrast.png proves Start Replay contrast only1.718:1; UI defect remains. Replay contrast was fixed in final v32; ReplayIntro.svelte hash still matches its final receipt. Full device matrix not repeated on this candidate. |
| 195 | Popout S/L | AT RISK | Inherited evidence (2026-10-31; matching audited source): Muscle400×225 played through10 spins, total2.90GC; screenshot and JSON saved. 800×450 not completed; replay start contrast defect applies. Replay contrast was fixed in final v32; ReplayIntro.svelte hash still matches its final receipt. Full device matrix not repeated on this candidate. |
| 194 | Mobile 425×812 | NEEDS A HUMAN | Inherited evidence (2026-10-31; matching audited source): Final candidate requires425×812 gameplay/cut-ins and actual touch verification. Desktop iframe is not a physical mobile test. This candidate completed normal play at390×844 with screenshot; physical425×812 touch/cut-ins remain unverified. |
| 223 | Double-tap zoom is disabled on mobile | PASS | Inherited evidence (2026-10-31; matching audited source): src/app.html:58 maximum-scale=1,user-scalable=no; line71 touch-action:manipulation. |
| 239 | English is supported | PASS | Inherited evidence (2026-10-31; matching audited source): English runtime screens and rules source reviewed; observed replay reports contain no placeholder/errors; static build guards passed. |
| 240 | Invalid languages don't break the display | PASS | Inherited evidence (2026-10-31; matching audited source): packages/state-shared/src/stateUrl.svelte.ts:31–44 falls back to English for unknown language; source verified. |
| 77 | All text uses social wording | AT RISK | Inherited evidence (2026-10-31; matching audited source): Static social guard passes, LookoutXSC and MuscleXGC runtime scans return no restricted words. All settings/advanced autoplay/error/modals not fully swept in this run. |
| 78 | SC and GC currencies, no "$" | AT RISK | Inherited evidence (2026-10-31; matching audited source): Observed XSC1.00SC/100.00SC and XGC1.00GC/500.00GC, no $. Normal wallet play paths not repeated for both. |
| 225 | Mode names use social wording | PASS | Inherited evidence (2026-10-31; matching audited source): Lookout/Muscle/Kingpin labels consistent with betModeMeta and replay; no restricted mode names. |
| 188 | The replay has no restricted words | PASS | Inherited evidence (2026-10-31; matching audited source): bonus-XSC-1024x576-2.json and bonus_hits-XGC reports: social=true, zero restricted-word hits in replay/feature flow. |
| 171 | Replay URLs load and play the event | AT RISK | Inherited evidence (2026-10-31; matching audited source): Base, Lookout, Muscle real-book local replay GET200, no wallet calls/errors. Kingpin/max-win/loss/fetch-error full replay matrix pending. |
| 172 | Optional parameters are applied | AT RISK | Inherited evidence (2026-10-31; matching audited source): USD/XSC/XGC and amount1000000 correctly applied in observed cards. EUR/non-default amount/missing-invalid parameters runtime not fully tested. |
| 173 | The replay can be watched again | PASS | Inherited evidence (2026-10-31; matching audited source): Base book64 replayed a second time with0.70 result; base-USD-1024x576-2.json. No new wallet requests. |
| 174 | Bet cost and multiplier are shown | PASS | Inherited evidence (2026-10-31; matching audited source): Observed Lookout1SC ×100=100SC, Muscle1GC ×500=500GC; result multiplier/win shown. ReplayIntro source covers same field mapping for other modes. |
| 243 | Replays work at popout S (400×225) | AT RISK | Inherited evidence (2026-10-31; matching audited source): Muscle400×225 replay runs and fits; Start Replay low contrast remains a usability defect. muscle-small.png. Replay contrast was fixed in final v32; ReplayIntro.svelte hash still matches its final receipt. Full device matrix not repeated on this candidate. |
| tile | Thumbnail artwork | PASS | Inherited evidence (2026-10-31; matching audited source): thumbnail.log + thumbnail.png/cover.png: BG opaque, FG transparency, exposure checks pass; adult subject and no lettering observed. Build artwork guard passes. |
| social-en | Social English only | PASS | Inherited evidence (2026-10-31; matching audited source): stateUrl.svelte.ts:31–44 forces English when social; runtime XSC/XGC observed English. |
| five-wins | 5 wins per mode | PASS | Inherited evidence (2026-10-31; matching audited source): wins.log:200 winning rounds per mode; 12,501 line wins recomputed, zero mismatch. This does not clear Bruiser occurrence-description defect. Bruiser rules claim corrected in final v32 source; all math hashes unchanged. |
| final-1 | Bet-level templates | AT RISK | game-before.json: platform front32/math7, approval closed+locked. Publication requested, not a new approval submission; Studio-only process checks not reverified. |
| final-2 | Provably Fair + Replay enabled | AT RISK | game-before.json: platform front32/math7, approval closed+locked. Publication requested, not a new approval submission; Studio-only process checks not reverified. |
| final-3 | Front / Math approvals | AT RISK | game-before.json: platform front32/math7, approval closed+locked. Publication requested, not a new approval submission; Studio-only process checks not reverified. |
| final-4 | Approved channel posting | AT RISK | game-before.json: platform front32/math7, approval closed+locked. Publication requested, not a new approval submission; Studio-only process checks not reverified. |
| final-5 | Older Android / iOS | NEEDS A HUMAN | Inherited evidence (2026-10-31; matching audited source): Test current build on older Android Chrome and iOS Safari: launch, touch, sound, feature, recovery, orientation and memory. |
| final-6 | Approval closed + notification | AT RISK | game-before.json: platform front32/math7, approval closed+locked. Publication requested, not a new approval submission; Studio-only process checks not reverified. |
| final-7 | Game released | AT RISK | game-before.json: platform front32/math7, approval closed+locked. Publication requested, not a new approval submission; Studio-only process checks not reverified. |

## House presentation checks

- Text centering: UI code unchanged from audited v32; desktop/portrait screenshots of current candidate viewed. Full modal pixel audit not repeated (AT RISK).
- Character source/runtime revision: cast source and assets match accepted v32; no new art or rig changes. Current desktop/portrait base play viewed. Prior six-motion evidence precheck_20261027 retained; full feature-motion rerun not performed.
- Social runtime text and large-amount audit: prior v32 evidence retained; current static social guard passed in build.log; exhaustive modal scan not repeated (AT RISK).
- New cadence: 5 normal rounds, median stop gap200ms, first-to-last786–800ms, current local mock QA errors empty; screenshots and timing JSON beside this report.
- Staged frontend exactly matches build; no stub scripts or local harness in staging. Math unchanged, CLI compliance PASS; RTP96.01/96.02/96.03/96.05%. Thumbnail/cover unchanged and retained in upload/TurfWar.

## For a person to check

Review remaining NEEDS A HUMAN rows: visual originality/content, audio mute across all beats, actual older Android/iOS and touch/layout. Publication does not imply platform approval.

## Next step

Upload the four-action frontend plan and publish, as explicitly requested. No code fixes required by this delta audit.
