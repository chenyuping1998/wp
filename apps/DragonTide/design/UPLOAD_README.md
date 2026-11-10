# Dragon Tide

Front v1 + math v1 (first publish, 2026-11-10). Staged here: front v2 candidate (final art, 2026-11-10), math unchanged (v1).

Sea-dragon slot on the 天使奧丁 rule set, original art only. 6 reels x 5 rows, scatter pays (8+ of a symbol anywhere), tumbles. Dragon pearls (x2-x1000, any number per board) land on the board; in the base game a winning tumble sequence is multiplied by the sum of the pearls on the board, in Free Spins every pearl adds to a TOTAL multiplier that starts at 0 and never resets. Dragon Gate scatter: 4/5/6+ pay 3x/5x/100x (not multiplied); 4+ award 15 Free Spins, 3+ in Free Spins award +5. Max win 20,000x bet.

- `math/`: base (cost 1), Extra Bet / ante (cost 1.25), bonus buy (cost 100) and super buy (cost 200) books + LUTs + index.json. RTP base 96.03%, ante 96.04%, bonus 96.06%, super 96.08%. `stakecli compliance` PASS, 2-star and 3-star, 0 failures / 0 warnings.
- `frontend/`: static build (`design/ship.sh`). Internal `medusa*` / `hypno*` folder and code names remain from the template for generic FX, UI and placeholder audio; no Medusa or Hypno Monkey text or art is visible.
- `thumbnail/`: 1024x1024 BG (palace sea and moon, no text), transparent FG with the Dragon King and the Dragon Princess right of centre, separate Silverstars logo for the free bottom-left corner. `*-PREVIEW-only.png` is a review composite, do not upload.
- `cover/`: 1920x1080 BG and transparent FG with both casts (the delivered gen-order-1109 store layers). Top-right and bottom-left kept clear.

Store BG brightness (mean L): thumbnail 216.3, cover 216.9 (composites 194.6 / 194.9).

Cast: MG Dragon King and FG Dragon Princess are Spine 4.3 stand34 rigs (r12 layers, in-game QA repairs; see new-games/sea-dragon/art/cast-layers-1105/r12/報告.md). The runtime atlas and rig JSON are checked against the r12 export at build time (`design/check_cast_revision.mjs`) and in the staged package (`design/ship.sh` checks).

Art: everything on screen is final (gen-order-1109, cut and registered by `design/art1109/build_final_art.py`): L1-L5, the Dragon Gate (shut / open on a trigger), five pearl tiers + blank, jade board frames (MG clouds / FG waves, nine-sliced), logo, bet strip and discs, palace-gate Buy Bonus, four TOTAL plates, free-spin counter, intro / outro panels, five win banners, whirlpool gates, tumble splash, loading cards, buy-menu art and the moving backdrop props (waves, lanterns, leaping fish / light shafts, weeds, bubbles).

Still open: Dragon Tide audio is not delivered (template music and SFX are placeholders, cast voices muted); frame-by-frame alignment with the 天使奧丁 timeline is not finished.
