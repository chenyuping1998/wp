# Pickle Panic — release handoff

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
