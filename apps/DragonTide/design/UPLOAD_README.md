# Dragon Tide

Front v1 + math v1 (first publish, 2026-11-10). Staged here: front v3 candidate (front v2 = final art, bigger board, 天使奧丁 timeline, big-win plaques; v3 adds the Dragon Tide audio; 2026-11-10), math unchanged (v1).

Sea-dragon slot on the 天使奧丁 rule set, original art only. 6 reels x 5 rows, scatter pays (8+ of a symbol anywhere), tumbles. Dragon pearls (x2-x1000, any number per board) land on the board; in the base game a winning tumble sequence is multiplied by the sum of the pearls on the board, in Free Spins every pearl adds to a TOTAL multiplier that starts at 0 and never resets. Dragon Gate scatter: 4/5/6+ pay 3x/5x/100x (not multiplied); 4+ award 15 Free Spins, 3+ in Free Spins award +5. Max win 20,000x bet.

- `math/`: base (cost 1), Extra Bet / ante (cost 1.25), bonus buy (cost 100) and super buy (cost 200) books + LUTs + index.json. RTP base 96.03%, ante 96.04%, bonus 96.06%, super 96.08%. `stakecli compliance` PASS, 2-star and 3-star, 0 failures / 0 warnings.
- `frontend/`: static build (`design/ship.sh`). Internal `medusa*` / `hypno*` folder and code names remain from the template for generic FX, UI and placeholder audio; no Medusa or Hypno Monkey text or art is visible.
- `thumbnail/`: 1024x1024 BG (palace sea and moon, no text), transparent FG with ONE character only (the Dragon King, right of centre — store rule: one character on the thumbnail), separate Silverstars logo for the free bottom-left corner. `*-PREVIEW-only.png` is a review composite, do not upload.
- `cover/`: 1920x1080 BG and transparent FG with both casts (the delivered gen-order-1109 store layers). Top-right and bottom-left kept clear.

Store BG brightness (mean L): thumbnail 216.3, cover 216.9 (composites 195.2 / 194.9).

Cast: MG Dragon King and FG Dragon Princess are Spine 4.3 stand34 rigs (r12 layers, in-game QA repairs; see new-games/sea-dragon/art/cast-layers-1105/r12/報告.md). The runtime atlas and rig JSON are checked against the r12 export at build time (`design/check_cast_revision.mjs`) and in the staged package (`design/ship.sh` checks).

Art: everything on screen is final (gen-order-1109, cut and registered by `design/art1109/build_final_art.py`): L1-L5, the Dragon Gate (shut / open on a trigger), five pearl tiers + blank, jade board frames (MG clouds / FG waves, nine-sliced), logo, bet strip and discs, palace-gate Buy Bonus, four TOTAL plates, free-spin counter, intro / outro panels, five win banners, whirlpool gates, tumble splash, loading cards, buy-menu art and the moving backdrop props (waves, lanterns, leaping fish / light shafts, weeds, bubbles).

Timeline: aligned to the 天使奧丁 recordings (headless replays of the dev books, `new-games/sea-dragon/qa-1110/timeline_cdp.mjs`): new board 0.64 s after SPIN, pearls struck 0.15 s after they land (reel 1 ~1.2 s, +0.15 s a reel), first win frame 2.07 s (reference ~2.05), one tumble link 3.0 s, pearls settle one every 0.7 s, holds 1.6 s / 0.8 s; free-spin entry plaque +2.1 s, swap +7.95 s, first free spin +9.45 s after the 4th gate (reference 2.2 / 8.0 / 9.5); free spins 2.05 s each without a win; end plaque ~0.7 s after the last spin, back in the base game ~6.4 s (reference 6.2). Big wins climb BIG → SUPER → MEGA → EPIC, 3.0 s a tier, the last tier 3.0 s (MEGA and up 5.0 s), on the maths' reference tiers (25/50/100/200x, setWin.winLevel 2-5).

Audio: Dragon Tide delivery-v1 (90 original files, 9.9 MB, `static/assets/audio/dragon/`): MG / FG / plaque music and ambience, the reel and refill drops, a five-step win-frame and burst ladder per tumble link, the Dragon King / Dragon Princess casts, pearl landing, strike, light-up, flight and settlement, the Dragon Gate set, the transformation and whirlpool gates, retrigger, and a big-win start / loop / count / end per tier. Wordless character voices (local Kokoro-82M, Apache 2.0, adult male / female voices, no cloning): the Dragon King's and Dragon Princess's cast lines (never the same twice running, a fixed big line for a x250+ pearl), the King's line into free spins, the Princess on the end plaque (a bigger line at 50x+), one call per big-win tier. The template's circus / Medusa placeholder sets are gone.

Still open: The shared client asks the RGS for the round only after the old board has left, so on the live RGS the new board comes in later than in the mock by the request time.
