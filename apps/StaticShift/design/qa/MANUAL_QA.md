# Static Shift — final local browser QA

2026-10-19, Asia/Taipei. Root performed these checks through the in-app browser against the final local static preview. The independent browser agent could not run because workspace credits were unavailable; this report does not imply independent browser review.

## Verified

- Small landscape400×225: replay card scrolls internally; bottom total, Start Replay and replay disclaimer remain reachable. Screenshot replay-small.png.
- Desktop 1280×800 and phone 390×844: intro, game board, control bar, original cast/portrait art, readable frameless symbols. Phone intentionally hides the side cast when there is insufficient room.
- Base book671: start spread0ms; reel stops2509/2592/2691/2778/2876ms after press; gaps83/99/87/98ms, mean91.75ms. Final win$2.40 and balance$1001.40 from$1000 at$1 base stake. Collection completes.
- Full bonus replay book0: ten free spins complete; correct female host enters under wipe; last measured FG stop intervals98/100/102/99ms. Final total$23.20 matches replay metadata; dismissing outro restores main cast/sign. Replay navigation logs show replay requests, without wallet requests for this replay.
- Superbonus replay book2: cost150×, base$1, totalcost$150, payout227.1×/$227.10. Begins at collection×2. Observed promotion to×3 and totalspins20. Both promotions observed (×3/20 spins, then ×10/30 spins); all30 free spins complete. Final outro$227.10 matches metadata, with no stall. Screenshot superbonus-result.png records the outcome.
- Maximum-win replay base1875: four Scatters award12 spins, all three meter promotions work; feature terminates at15/42 on reaching the cap. Total$10000.00 at$1 base stake matches10000× metadata. Capped outro completes without waiting out unused spins. Screenshot maxwin-result.png.
- Phone rules modal scrolls within viewport, close remains reachable. Runtime QA found missing Spin/+/-/Turbo guide images after pruning; regenerated icons and added explicit DOM dependencies to production staging. The final build includes all eight control-guide images; final phone screenshot mobile-rules.png confirms no missing icons. Phone intro captions now use explicit short lines to stay inside plaques.
- Final fast FG sample: stop gaps63/50/70/44ms (mean56.75ms), preserving sequential landing. Natural four-Scatter trigger in base1875 awards12 spins; anticipation adds one631ms interval while ordinary gaps remain83–102ms.
- Final npm build and all required local guards pass. App-owned type errors:0. Seven preexisting shared-package errors remain in the ratcheted baseline; this is not a clean global TypeScript check.
- Comic geometry:251 frames per kind, triangle area61.2–112.4% of rest, no inversion; head travel0.029525 normalized. Plaque mesh checks also pass without skipping.
- Independent compliance scan: all200000 books checked; zero mechanic failures. Offline stakecli: zero failures/warnings. Seven staged math files byte-identical to GoBanandit publish files.
- Final production checksum verification:108 files,0 mismatches. No local wallet/stub URLs or stub-data scripts in production entry. Original title assets,38 synthesized audio files, local font licenses, new thumbnail and cover staged.

## Remaining limits

Real RGS authentication, live wallet, platform title availability, platform-specific jurisdiction controls and final approval remain unverified. No platform game was created, uploaded, published or submitted. One earlier measurement-harness navigation logged a MutationObserver target error without a source URL; later complete feature playback did not stall. This is retained rather than claiming zero console errors across all harness navigations. Physical touchscreen double-tap behavior still requires device validation; source viewport and canvas constraints are fixed.

The original source audit is retained in ENGINE_SELF_CHECK.md with a final repair addendum. Its old failure counts describe the earlier snapshot.
