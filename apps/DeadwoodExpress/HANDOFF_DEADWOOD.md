# Deadwood Express handoff

## 2026-09-20 — approved concept and scaffold

The user selected Deadwood Express and confirmed that each winning FG spin draws a nondecreasing multiplier which applies immediately to all line wins on that spin. Both 100x and 250x purchases initially had a 100x multiplier ceiling; the premium wheel selects multiples of five only. See DESIGN.md for current scope and explicitly provisional decisions.

Scaffold copied from the current local HotMiami app and math-sdk/games/hot_miami. Build output, upload output, dependency directories and generated math libraries were excluded to avoid representing old books/builds as the new game. Source modifications in HotMiami were preserved.

## 2026-09-21 — implementation and verification checkpoint

The new math and wheel event presentation are implemented. Generated Deadwood symbols, two backgrounds, conductor with verified mesh rig, logo, purchase card artwork and CTA are wired. Gold-frame and collector event handlers are removed. Both theme variants retain the new CTA sprite.

Verified locally:
- All 6 wheel unit tests pass.
- Published-book verification passed for 40,000 base + 20,000 standard + 20,000 premium books, including nondecreasing held multipliers and same-spin payout application.
- Weighted RTP: base 93.9999999187%, standard 93.9999999980%, premium 93.9999999991%; max win 20,000x in every mode.
- Production build passes asset, sprite-key, restricted-copy and frontend-contract guards. Contract coverage includes premium book fixtures.
- Production mesh deformation and Python/runtime parity pass (maximum coordinate error 0.0001188 px).
- Store BG and FG exported at 1024 square. BG at 200 px: mean luminance 133.7, p10 35.8, dark fraction 8.2%. FG is genuine RGBA with 39.8% transparent pixels.
- Added MODE_PREMIUM/book Storybook entry for a deterministic recorded 250x feature.

## 2026-09-22 — upload package

Upload packages were built from the synced math config. The production asset registry now contains only Deadwood runtime art plus shared audio/coin infrastructure; player-facing Hot Miami names and absolute asset URLs were removed from the staged frontend. The generated-art prompts are recorded in `design/IMAGEGEN_PROMPTS.md`. Store BG+FG are separate 1024×1024 layers, provider logo is separate, BG luminance gates pass, and FG is genuine RGBA. The store hero's original gun-like prop was compliance-edited into a harmless brass railway ticket punch; the rejected source candidate is retained only under `design/source` and does not ship.

Browser checks covered the base board, the 100× Midnight Passage and a complete recorded 250× Phantom Express feature through spin 10 and its result panel. The standard feature visibly applied a newly held 5× to its triggering line win; the premium held multiplier rose from 1× to 15× and persisted. Both browser runs ended with zero console errors. A Pixi signed-RGB error found during the first premium run was fixed and the production build was rebuilt; the staged production opening screen then booted with zero console errors. Published books and guards remain the authoritative verification for both modes. Actual Stake RGS authentication, wallet responses and platform upload can only be exercised after upload.

Build warnings about optional public environment exports, generated tsconfig inheritance and chunk size are inherited/nonfatal. They do not prevent the static adapter from producing the frontend.

Canonical new math location: /Users/stone/stake-engine/math-sdk/games/deadwood_express.
New frontend location: /Users/stone/stake-engine/wp/apps/DeadwoodExpress.

Do not execute inherited packaging scripts until their source-game output paths have been redirected and verified. The installed stake-engine-slot skill contains historical Windows toolchain instructions; this workspace runs macOS, so resolve the actual local tools rather than using those Windows paths.

## 2026-09-22 — wheel readability and cast spacing revision

The premium wheel was enlarged to an 820 px presentation window with a 790 px dial so all 20 multiplier segments remain legible. Numerals are larger, normal spin travel is 4.2 seconds (2 seconds in player-selected turbo), and the current 200× ladder uses distinct treatments: 40×–90× gold, 100×–190× coral, and 200× magenta. The board-side conductor moved from 89% to 94% of stage width, leaving a visible gap between the figure and reel frame at the verified 1280×720 view.

The deterministic premium Storybook book was replayed through the revised wheel. It confirmed separated segment labels, the three high-value colour tiers, the selected multiplier display, and the cast/reel spacing. During the final console audit, an existing self-reactive symbol-dimming interpolation was found to overshoot RGB channel bounds; its animation read is now untracked and clamped to 0..1 before packaging.

## 2026-09-22 — Buy Bonus CTA spacing revision

The brass Buy Bonus plate now renders at 1.25× its button box while keeping the established rail position, caption size, and hit target. This uses the existing art's transparent square canvas to give both caption lines safe inset from the teal inner frame without pushing the CTA into the reel board. The 1280×720 deterministic premium story visually confirms the larger plate, contained lettering, clear board gap, and zero browser console errors.

Following the next visual review, the complete rail CTA scale was raised from 1.35× to 2.0× in addition to the 1.25× plate-art scale. This makes the plaque, caption, and hit target materially larger rather than only adding internal art clearance. The narrow-layout Storybook view confirms that the enlarged caption remains inside the teal frame and the control remains fully inside the left viewport; the browser console remains clean.

## 2026-09-22 — half paytable / 200× wheel retarget

Every symbol paytable entry was divided by exactly two. Both feature wheels were doubled position-for-position so their maximum rose from 100× to 200× without adding segments: Midnight Passage now uses 2×–200× and Phantom Express uses 10×–200×, with every premium value still divisible by five. The generated frontend config and paytable are sourced from the regenerated math library.

The full 40,000 base + 20,000 standard-buy + 20,000 premium-buy library was regenerated and optimized. Published-book verification measured RTP at 93.99999992% / 94.00000000% / 94.00000000%, a spread below 0.0000001 percentage points, with 20,000× reachable in all modes. Max-win frequencies are approximately 1 in 13.33m / 200k / 80k. Raw 10,000× tail probabilities are 0.000000111 / 0.000015683 / 0.000046158. All wheel-book assertions passed, including nondecreasing values, no wheel on losing spins, premium divisibility, and same-spin application to every line win.

## 2026-09-22 — wheel layout, near miss, button centring

The wheel no longer prints its eligible values in ascending order. `layoutWheel` (wheelState.svelte.ts) splits the set into lower/upper halves, scrambles each with a seed derived from the set, and alternates them, so every large value sits between small ones and the same set always draws the same dial. About 20% of the time a landing next to a much larger neighbour (≥3× the result and ≥40% of the top value) stops 0.34 of a segment toward that neighbour; otherwise the stop is jittered within ±0.25. Presentation only — the book still decides the value; math, books and RTP are untouched.

Button centring was measured pixel-by-pixel at 1280×720: caption and bar-readout ink centres sit within 1px of their plates/panels, and the SVG icons are centred in their canvases. The defects were elsewhere: in portrait (375×812) the shared ±470 placement pushed the menu disc 9px off the left edge and the 1.25× plate 28px off the right; and the desktop hover highlight lit the whole square PNG canvas instead of the plate. New shared keys `portraitSideButtonX`, `portraitBuyBonusScale` and `buyBonusPlateInsetOffsetY` default to the old behaviour; Deadwood sets 445 / 0.85 and a highlight sized to the plate body measured from the PNG alpha.

Portrait also dropped the text game name below 560 px canvas width: it ran under the logo (x 90–322 against 179–355 at 375 wide). The logo already carries the name; tablet and desktop keep the text.

Restaged 2026-09-22 22:51: `upload/DeadwoodExpress/frontend/` now holds the new build (index.html + `_app/immutable`) with the same pruned file set as the 21:39 staging. The build folder still contains inherited Hot Miami static files and full-size PNGs; the staged assets are the earlier 512-px palette-compressed copies, so never `rsync --delete build/` straight over the staged frontend. Math bundle is byte-identical to `library/publish_files` and passes `check_math_bundle.py` (RTP 0.9400 ×3, 20,000× reachable). The staged frontend boots on a static server with 47/47 resources loading; the only errors are the expected missing-RGS wallet fetch. Previous staged frontend backed up in `_upload_backups/`. Zips rebuilt on request after restaging: frontend 91 files / math 8 / thumbnail 4 / upload 105, same file lists and sizes as the 21:42 set, archives tested, SHA256 in `upload/DeadwoodExpress-SHA256.txt`. The 21:42 zips are kept in `_upload_backups/zips-2142/`.
