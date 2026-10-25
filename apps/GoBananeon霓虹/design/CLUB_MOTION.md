# DJ club motion

`design/adapt_club_motion.mjs` adds original motion to the existing PSD-derived rig without changing any mesh, attachment weights or artwork.

| Clip | Length at timeScale 1 | Purpose |
| --- | --- | --- |
| `club_idle` | 3.84 s | Eight beats at 125 BPM; side-to-side upper-body weight transfer, a small beat compression, delayed counterrotating head, unequal shoulder/forearm follow-through and slow breathing |
| `club_flutter` | 3.84 s | Track 1 only: mohawk root/tip, headphone pieces, jacket/cuffs, loose trouser details and restrained jaw/neck accessory motion |
| `dj_scratch` | 3.20 s | Anticipation, four fixed-tempo scratch strokes and a soft recovery into idle |

`idle` aliases `club_idle`. `idle_original`, `iron_idle_weave` and `iron_idle_bounce` remain available. The hip and root are never animated by the new clips: both feet remain planted. The body sway begins at the torso above the fixed stance.

`club_flutter` deliberately contains no torso/head/arm/finger tracks, so it can run through actions without overwriting their poses. The mohawk is authored as two delayed joints (`helmet` / `hairTip`) and the headphones and jacket trail the beat at different phases. Use this secondary clip in place of the older `flutter`; putting both on successive tracks would overwrite the same loose parts.

For scene music, `club_idle` and `club_flutter` may use 105/125 or 128/125 timeScale. Keep `dj_scratch` at timeScale 1. Its wrist/forearm push-pull and five-finger phase functions are unchanged. Added body counter-motion, a small reverse anticipation before the hand lifts and a restrained overshoot during recovery make the action feel connected to the rest of the figure. The repaired continuous sleeve-to-finger mesh, attachment crossfades and 3.2-second duration remain intact.

The shipped Spine clip also emits `djStroke` at 0.60, 1.08, 1.56 and 2.04 seconds, with `int` values 1–4. These are presentation markers and do not alter any game result.

## Regeneration and checks

Run `node design/adapt_iron_idle.mjs` with a Node runtime supporting native TypeScript imports, then `node design/check_neon_spine.mjs`. The complete `generate_monkey_spine.mjs` pipeline calls the same adaptation function.

The true game Spine runtime checks every mesh at 60 FPS, loop closure and fixed feet. It also checks club idle → DJ → club idle with a 200 ms mix and both secondary clips at 105, 125 and 128 BPM, including sleeve anchors, all mesh orientations, restored hand opacity and hidden DJ attachments. The new standalone idle has a minimum triangle area of 82.7%; the secondary clip 76.3%; the DJ action and tested mixed sequences 28.2%, above the 20% wrist safeguard. The older cheer decoration retains the existing global minimum.

Preview artifacts in `design/source/monkey_neon`:

- `_motion_club_idle.gif` uses `club_idle` + `club_flutter`.
- `_motion_dj_scratch_club.gif` uses `dj_scratch` + `club_flutter`.
- `_motion_dj_scratch_club_hand.gif` shows the same action close up.

The frame exporter accepts `--secondary=club_flutter` to reproduce the two-track pose rather than judging the main clip alone.
