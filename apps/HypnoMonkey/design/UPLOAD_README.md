# Hypno Monkey

Package v2, staged 2026-10-29 (v1 staged 2026-10-28 was never uploaded).

v2: base spins with no win throw more watches, about 4 in 10 of them x100+ (wasted, so they pay nothing but land with the full thunderclap and board shake; a x100+ watch shows about 1 in 28 base spins); new Super Free Spins buy at 400x where every watch is x10+; bigger watch numbers with a tier-colour glow; both casts' cheer poses fixed (no bent-back wrist, open hand seated on the cuff).

Circus reskin of Medusa Gaze. 6 reels x 5 rows, scatter pays (8+ of a symbol anywhere), tumbles. The hypnotist may throw pocket-watch multipliers (x2-x500, five watch colours by tier); on a winning spin they ride the last refill and multiply the spin, on a spin with no win they shatter. Free Spins: watch multipliers add to a total that never resets. Max win 15,000x bet.

- `math/`: base (cost 1), bonus buy (cost 100) and super buy (cost 400) books + LUTs + index.json. RTP base 96.03%, bonus 96.06%, super 96.08%. `stakecli compliance` PASS, 2-star and 3-star.
- `frontend/`: static build. Medusa-only art folders the game no longer loads are removed (see `design/ship.sh`). Internal `medusa*` folder and code names remain for generic FX, UI icons and shared audio; no Medusa text, art or voice is visible or audible.
- `thumbnail/`: 1024x1024 BG (circus plaza, no text), transparent hypnotist FG, separate Silverstars logo. `*-PREVIEW-only.png` is a review composite, do not upload.
- `cover/`: 1920x1080 BG and transparent FG with both casts (MG hypnotist, FG assistant). Top-right and bottom-left kept clear.

Store BG brightness (mean L): thumbnail 160.8, cover 153.5.

Cast: MG hypnotist and FG assistant are Spine 4.3 stand34 rigs. Assistant passed Claude's third-round native-resolution check on 2026-10-28 (`design/cast_fg/QA_CLAUDE_1028.md`), and was played in game in portrait 375x812 and desktop 1280x720.

Still open: hypnotist and assistant reaction voices and plaza crowd ambience are not delivered (silent for now). Circus SFX and music are original synthesized cues.
