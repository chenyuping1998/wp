## 2026-11-02 — 腳踝修正已發布 front14／math2

v13的角色腳踝驗收已撤回：裁平鞋口與分開襪鞋造成使用者截圖的斷腳。兩角四條腿已重畫完整大腿至鞋底來源，改連續 weighted mesh；腿權重重建，骨骼／動畫曲線／physics／動作幅度不變。舊 apply_review_1101.mjs 已阻擋還原退役鞋層，後續使用 apply_ankle_review_1101.mjs。

每角13 clips／837 runtime格、亮暗底／alpha移除差異／完整身形關鍵格及腳踝放大圖已檢視。手機補明確盤框後半身裁切，保留原角色尺寸，移除與mask衝突的portrait DropShadowFilter。最新production build已實跑桌機1280×720與直式425×812完整book74（派彩330.4、結餘1329.4、各9cut-in、pageerrors=[]），手機不再透腿／浮空／消失。來源、atlas、build及stage hash一致，數學不變。

已打包 /Users/stone/stake-engine/upload/PicklePanic/，上傳12actions/5,494,948bytes、重排0；發布front14、math2，get_game確認。平台tile106674／cover106675已更新選用。正式證據：design/qa/review_1101_ankles/REPORT.md、SELF_CHECK.md、PLATFORM_RELEASE.json及studio-media-final.png。原始逐格runtime證據保留runtime-frames.tar.gz。v13與失敗mask原型不能作新版驗收依據。

closed approval未更動；Engine藝術評分、真實RGS、實體舊手機／耳機仍屬既有人工範圍。Studio發布不等同casino正式上線。

---

## 2026-11-01 — v13 ankle acceptance withdrawn; corrective work in progress

Stone supplied a screenshot showing disconnected/cut-flat shoes. The previous whole-body contact-sheet visual acceptance was wrong and must not be reused as proof of clean ankles. v13 is published but NOT accepted for character quality. Known defect: MG left shoe source is clipped through its collar, and separate sock/foot skinning makes the seam visible. Both roles must receive source and joint inspection at native scale. Original bone motions/amplitudes remain the baseline. Repair source anatomy and continuous ankle skinning, then inspect isolated ankle close-ups across all clips plus actual desktop/portrait gameplay. WORK_IN_PROGRESS blocks packaging until repaired. Prior math/UI/RGS evidence remains valid in its stated scope; prior character acceptance claims are superseded.

## 2026-11-01 06:55 Taipei — published front v13 / math v2, platform artwork updated

The five-hour continuation finished source repairs and final rendered acceptance. Final script: design/apply_review_1101.mjs; source raw/backup/prompt provenance in design/source/review_1101/. Important: top/sock resize must use fit:fill, never default cover. Both leg crops have expanded vertical overlap, width/height changes update weighted rest positions, and the right green upper leg has native affine registration to tuck under the apron. No bone, animation, amplitude, UV topology or vertex-weight change. Old 1021 exporter and older source previews must not replace this revision.

Final build: /tmp/picklepanic-build-1101-release.log, ✔done, 15 existing type baseline. All source/atlas invariants, source alpha diffs/light-dark,380 actual motion renders, full desktop/portrait feature, currencies/social/UI/replay/contract, subcent and audio checks completed. Official report and final evidence: design/qa/review_1101/SELF_CHECK.md and ACCEPTANCE.json. User authorized upload AND publish; front13 is now published, math2 unchanged. Upload16 actions/5,691,823bytes and post-upload0actions verified; get_game confirms versions. Approval closed+locked, do not update approval-version or imply certification. Package stage /Users/stone/stake-engine/upload/PicklePanic/. Final remote result: design/qa/review_1101/PLATFORM_RELEASE.json (also in staged package). Store thumbnail/cover rebuilt, staged AND applied in Studio Media Editor: tile105451, cover105453. Selected links and studio-media-final.png prove platform update. Five-hour automation id automation deleted. Unauthenticated CDN403, so real live-RGS/CDN hash verification is not claimed. No ZIP produced. Existing unrelated shared-package edits preserved.

Earlier pause notes and historical failures below are superseded by the final evidence above; they are not current acceptance results.

# Pickle Panic — release handoff

2026-10-18 latest repair: F–H implemented and verified (quiet tile, 894x200 phone tickets, narrow bottom-anchored rays). Print theme now maps base_ticker to the actual ticket sprite. H4 middle spear rotates independently +/-0.22 rad. Steam 1/5/6 soft: 20.7/20.8/29.9%; FG wall peak local contrast: 5.31%; tile inner luminance range: 5.04%. Nine UI/steam style gates pass. Production build passes with 15 existing type diagnostics, no new errors; review tags: 0 FAIL / 8 WARN (7 retired assets and existing portrait sizing reminder). Alpha/atlas audits pass. Local MG/FG, 375x812 tickets, EPIC/MAX and H4 book preview inspected with no observed console errors. Evidence: design/qa/review_1018/. Originals and exact prompts: design/source/review_1018/prompts_full.json. Package: /Users/stone/stake-engine/upload/PicklePanic/, including current 10/17 cover and thumbnail. Math unchanged. Platform NOT updated. Three-unfamiliar-human H4 recognition and real platform/touch-device checks remain outstanding.

Earlier audit/history below is superseded by the repair results above.

Additional scope found in current HEAD `86131c1`: `design/ART_REQUEST_2026-10-18.md` adds F low_label, G ticker and H ray. All three assets are byte-identical to the versions before A–E (`97dddce`), so F–H are NOT implemented. Ticker remains 900×130 rather than requested 894×200; ray alpha bounds remain (0,6)–(256,240), rather than the requested narrow centered bottom-anchored wedge. Current asset registration and runtime components still use these old files. The earlier “all requirements complete” statement does not cover these new requirements.

2026-10-18 audit correction: A–E artwork is integrated, but acceptance is incomplete. Newly expanded style check finds steam frames 1/5/6 exceed soft<=38% (42.4/40.0/47.4%). H4 middle spear has a separate layer but its local win rotation remains zero; only left/right rotate. Three unfamiliar-human recognition checks remain undone. FG right-wall sampled local-contrast peak is 9.09% under the existing smooth-reference measurement, so the <=8% target is not fully established. Torso underlay remains 0% both arms; frame alpha audit passes; cast heights 849/856 (<1% difference), cover 854/827 (<5%); all 279 package hashes and selected source/stage artwork match. Earlier completion notes below describe integration and must not be read as full acceptance.

Latest local revision (2026-10-17): A–E art request implemented and staged in `/Users/stone/stake-engine/upload/PicklePanic/`. New layered parallel H4 spears/boat, FG chef vest in all runtime illustrations and cover, re-inked doors/hardware/steam with large medallion, olive/plum enamel frame and quiet wall details in both backgrounds. Skeleton/motion/math unchanged. Recoverable inputs and selected imagegen sources/prompts: `design/source/review_1017_ae/`; checks and browser evidence: `design/qa/review_1017_ae/`. Production build/guards, exact frame/torso alpha audit and cast-underlay checks pass; 15 preexisting type diagnostics remain. Desktop and 390×844/320×568 local previews checked. Independent three-person H4 recognition test is still a human task. Platform NOT updated by this revision. Full current handoff: `/Users/stone/stake-engine/docs/handoff/PicklePanic.md`; notes below are historical.

Completed 2026-10-13. Source app: wp-banandit/apps/SushiMonkey. New app: wp-banandit/apps/PicklePanic. Math: math-sdk/games/PicklePanic. Stage: upload/PicklePanic.

User approved third style frame (design/style_concept_v3.png): rough American underground sci-fi comic, cold lilac/blue fermentation station and green cast separation. Both MG male boss and FG female spicy chef use own #7 standing pose and motion structure. Original art and prompts saved in design/source/production. No research reference artwork or monkey atlases shipped.

## Math

Published book bytes and all payouts remain identical to the source, preserving its 5×4/1,024-ways mechanics. Weights retargeted ONCE from the original 94.50% tables, not already tilted 96.02% tables. Original weights retained under design/math_original; provenance in design/math_metrics.json. RTP base 0.9600000002396396, bonus 0.9599999999997415, superbonus 0.9599999999993862. All modes 10,000× base-bet cap and nonzero max-win probability. Costs 1/100/150. Full bundle audit: 200,000 books and LUT IDs agree, zero payout mismatches. check_plate_replacements and complete book event assertions passed. No new mechanics or retriggers added.

## Art, rig, build

16 original raster production assets plus native thin icons and flat printed UI. Foreground inks olive/cream/mustard/brick, background cold blue/lilac/plum. Symbol measured colors95 54–123, soft 22.9–34.8%, palette fit 63.3–88.8%; relative gates ≤140 / ≤38% / ≥60%. Archive template unused static assets under design/_template_reference. Sprite registry 106 resolving paths, audio 39 resolving cues. Fonts Bungee/Archivo/Anton and licensed fallback originals. Own cast JSONs each 24 bones and 3,242 weighted vertices; maximum weight error 1e-8. All required motion names exist. Layer cuts lose zero opaque source pixels. Runtime matches measured throw origins and fist impacts.

Build10 passes asset, audio, undefined-reference, social-word and mesh guards, with 15 preexisting type errors (no new error per-file). Review tags: 0 FAIL, 16 WARN. Native UI/icon/particle geometries intentionally use 1–5 spot colors; they are small functional line symbols, printed blanks and solid comic chips. Background/frame/cast/food use original rough ink drawings. Mobile control hierarchy warning requires visual QA below.

Thumbnail and cover separately generated bright key art, BG + actual RGBA FG; thumbnail one boss, logo separate. Cover both cast with top-right/bottom-left safe areas. Luminance mean 155.7/145.0, dark fraction 12.5/12.3%; p10 24.0/23.1 accepted for deliberate sparse black ink shapes after composite inspection.

## Local verification

Offline published-book preview at http://localhost:4197/?rgs_url=stub.local&sessionID=playtest&currency=USD&lang=en . Scripts injected into dist only, never upload. Base book 74 completes natural 10-spin entry through all three upgrades to 40 spins and total $330.40 at $1 stake; returns to male boss, controls and $1,329.40 balance. Female chef swaps under transition, jars collect and display their values. Old diagonally cut geometry replaced with jagged fist-impact burst. Corrected free-spin and big-win text safe margins. Final local audit follows.

## Platform

Platform NOT updated; no live RGS session or approval performed. No ZIP requested or produced. Use design/stage_pickle_package.py to restage verified code and explicitly owned assets without copying source leftovers. Local generated stub is for presentation QA only.


2026-10-13 final local verification: Superbonus book 2 enters with 10 spins, presents opening replacement with no extra award, reaches its two remaining upgrades and finishes at 30 spins/$280.30 with the correct balance. Natural base max-win book 1875 completes 42 spins and settles $10,000.00 at $1 base bet (phone_maxwin_10000.jpg). Book 12 replay shows entry stake/mode/cost/payout, requires Start Replay, settles $4.20, and can play again. Final 320×568 opening text and in-game cast clear the board; a base spin settles $4.20 and restores all controls with $1,003.20 balance. 390×844 and desktop previously checked. No new console errors in these final sessions. Original font/preload errors were fixed before production verification; older console entries remain dated 2026-10-12 15:11 UTC.

Desktop and phone collections, three upgrade stages, entry/outro/return, generated store composites and max-win totals were viewed. Review warning on native flat UI is intentional printed geometry; portrait controls visually fit, remain present after the spin and feature return. Browser tools emulate viewport and mouse, not a physical touch device. Real platform/RGS/touch-device integration remains a deployment verification gap, not a claim of platform approval.

Production source role: design/_template_reference is a recoverable archive of removed source material. Only explicitly registered new pickle assets and licensed fonts enter upload. Existing source book event identifiers are retained for protocol compatibility.

Final rules modal opened in the running build: all DOM images loaded (zero broken/incomplete images); 96.00% RTP, base-bet cap units, jar ranges and maximum-spin limits rendered correctly. Menu clears Buy Bonus while open. Native mouse tools do not expose an isolated hover-only movement (dragging into CTA releases as a press); no claim of every control hover screenshot. Both CTA rest/hover PNGs are independent and their sprite hook remains wired. This remains a manual pointer/device spot-check before platform publishing.


## 2026-11-02: Neon spinning-feel local trial

Stone requested the same GoBananeon spin treatment on Pickle Panic after Turf's corrected v34. Existing BoardBase had fixed-state12px/3px/0px blur; replaced with GoBananeon's actual-displacement ReelMotion/reelMotion sampler, including padding-key rebasing and45ms build/24ms sharpen. Removed the remaining8% symbol stretch; plates and art retain their proportions. Both games use140px cells, so normal profile matches Neon directly: pre2.8px/ms, sweep4.2, brake2.8, settle0.22, normal padding1, start delay100ms, rebound0.12cells. Pickle's anticipation/Turbo profiles, audio and existing dirty character/ankle/art changes are preserved.

Build/guards PASS; preexisting type guard remains at15 baseline errors (no new per-file diagnostics). Ported Neon check_reel_motion.mjs passes and is in build. Production preview Chrome measured3 complete normal spins: median stop gap200ms; first-to-last798–800ms. Viewed moving-reel frame, desktop settled and390x844 portrait play. Caught window errors empty. Explicit labelled-reel scene check after settling found5 stopped reels with empty filters. Generic whole-scene blur samples also include existing ambient filters and must not be quoted as reel-stop leakage. No complete bonus/real-device/platform QA in this trial.

Preview: http://localhost:8019/?rgs_url=stub.local&sessionID=playtest&currency=USD&lang=en ; files `dist/picklepanic-neon-motion/`, actual clip `neon-motion-preview.gif`, logs/timing/screenshots/source hashes in `evidence/`. Local trial only: no upload staging, no platform upload/publication, no cover/thumbnail changes.


## 2026-11-02: Neon motion uploaded and published

Stone requested publication of all3 new trials. Uploaded the exact tested frontend to silver-stars/pickle-panic; publish success **front v15**, get_game confirmed **math v2** unchanged. Plan3 uploads +1 obsolete-bundle deletion; post-upload replan0 actions, math replan0 actions. Existing thumbnail/cover retained; no platform store-art replacement, approval-version update or new review submission. Build/source hashes and incremental official checklist (with inherited coverage gaps clearly marked) are in `design/qa/neon_release_20261102/`; release receipt and self-check copied to `upload/PicklePanic/`. No ZIP produced.
