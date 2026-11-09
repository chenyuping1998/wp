# Dragon Tide

Front v1 + math v1 (first publish, 2026-11-10).

Sea-dragon slot on the 天使奧丁 rule set, original art only. 6 reels x 5 rows, scatter pays (8+ of a symbol anywhere), tumbles. Dragon pearls (x2-x1000, any number per board) land on the board; in the base game a winning tumble sequence is multiplied by the sum of the pearls on the board, in Free Spins every pearl adds to a TOTAL multiplier that starts at 0 and never resets. Dragon Gate scatter: 4/5/6+ pay 3x/5x/100x (not multiplied); 4+ award 15 Free Spins, 3+ in Free Spins award +5. Max win 20,000x bet.

- `math/`: base (cost 1), Extra Bet / ante (cost 1.25), bonus buy (cost 100) and super buy (cost 200) books + LUTs + index.json. RTP base 96.03%, ante 96.04%, bonus 96.06%, super 96.08%. `stakecli compliance` PASS, 2-star and 3-star, 0 failures / 0 warnings.
- `frontend/`: static build (`design/ship.sh`). Internal `medusa*` / `hypno*` folder and code names remain from the template for generic FX, UI and placeholder audio; no Medusa or Hypno Monkey text or art is visible.
- `thumbnail/`: 1024x1024 BG (moonlit sea, no text), transparent Dragon King FG, separate Silverstars logo. `*-PREVIEW-only.png` is a review composite, do not upload.
- `cover/`: 1920x1080 BG and transparent FG with both casts (MG Dragon King, FG Dragon Princess, facing each other). Top-right and bottom-left kept clear.

Store BG brightness (mean L): thumbnail 198.9, cover 206.7.

Cast: MG Dragon King and FG Dragon Princess are Spine 4.3 stand34 rigs (r12 layers, in-game QA repairs; see new-games/sea-dragon/art/cast-layers-1105/r12/報告.md). The runtime atlas and rig JSON are checked against the r12 export at build time (`design/check_cast_revision.mjs`) and in the staged package (`design/ship.sh` checks).

Still open: Dragon Tide audio is not delivered (template music and SFX are placeholders, cast voices muted); interim greyscale UI pieces wait for the gen-order-1109 art; frame-by-frame alignment with the 天使奧丁 timeline is not finished.
