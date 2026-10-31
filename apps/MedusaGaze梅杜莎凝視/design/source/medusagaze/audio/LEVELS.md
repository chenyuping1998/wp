# Medusa Gaze audio levels

Deterministic original synthesis; seed 20261024. Measured on delivered runtime files using FFmpeg 7.1 `loudnorm` (EBU R128 integrated LUFS / oversampled true peak). For cues shorter than 3 s, the complete file is repeated to at least 3 s to provide finite LUFS (R128 otherwise has no valid 400 ms window on a short cue). These repeated-cue LUFS are audition references; peaks and in-game gains govern SFX matching. Longer files are measured in full.

Runtime library: **6,688,808 bytes (6.69 MB), 57 files**. Masters excluded from download budget.

Multiplier v2 uses seed 2026102502 and 13 redesigned cues. Runtime panning follows the actual orb flight. Masters and editable material stems are retained. Regenerate the original library first, then run `upgrade_multiplier.py` and `build_preview.py`.

Multiplier v2 uses seed 2026102502 and 13 redesigned cues. Runtime panning follows the actual orb flight. Masters and editable material stems are retained. Regenerate the original library first, then run `upgrade_multiplier.py` and `build_preview.py`.

Multiplier v2 uses seed 2026102502 and 13 redesigned cues. Runtime panning follows the actual orb flight. Masters and editable material stems are retained. Regenerate the original library first, then run `upgrade_multiplier.py` and `build_preview.py`.

Multiplier v2 uses seed 2026102502 and 13 redesigned cues. Runtime panning follows the actual orb flight. Masters and editable material stems are retained. Regenerate the original library first, then run `upgrade_multiplier.py` and `build_preview.py`.

Signature v4 uses seed 2026102502 and 13 redesigned cues. Runtime panning follows the actual orb flight. Masters and editable material stems are retained. Regenerate the original library first, then run `upgrade_multiplier.py` and `build_preview.py`.

Signature v4 uses seed 2026102502 and 13 redesigned cues. Runtime panning follows the actual orb flight. Masters and editable material stems are retained. Regenerate the original library first, then run `upgrade_multiplier.py` and `build_preview.py`.

| File | Seconds | Format / Hz / channels | Peak dBTP | LUFS-I | Bytes |
|---|---:|---|---:|---:|---:|
| `sfx_petrify_1.wav` | 0.235 | PCM16 / 44100 / 1 | -7.99 | -19.38 | 20,806 |
| `sfx_petrify_2.wav` | 0.235 | PCM16 / 44100 / 1 | -7.99 | -19.49 | 20,806 |
| `sfx_petrify_3.wav` | 0.235 | PCM16 / 44100 / 1 | -7.99 | -18.95 | 20,806 |
| `sfx_petrify_4.wav` | 0.235 | PCM16 / 44100 / 1 | -7.97 | -18.88 | 20,806 |
| `sfx_petrify_5.wav` | 0.235 | PCM16 / 44100 / 1 | -8.00 | -18.78 | 20,806 |
| `sfx_crumble.wav` | 0.380 | PCM16 / 44100 / 1 | -12.00 | -21.51 | 33,594 |
| `sfx_drop.wav` | 0.170 | PCM16 / 44100 / 1 | -17.00 | -28.11 | 15,072 |
| `sfx_reel_stop.wav` | 0.135 | PCM16 / 44100 / 1 | -11.00 | -20.58 | 11,986 |
| `sfx_win_mark.wav` | 0.280 | PCM16 / 44100 / 1 | -11.99 | -23.87 | 24,774 |
| `sfx_spin.wav` | 0.320 | PCM16 / 44100 / 1 | -10.00 | -22.45 | 28,302 |
| `sfx_button.wav` | 0.090 | PCM16 / 44100 / 1 | -15.00 | -22.26 | 8,016 |
| `sfx_glasses_slide.wav` | 0.220 | PCM16 / 44100 / 1 | -12.97 | -27.54 | 19,482 |
| `sfx_glasses_on.wav` | 0.120 | PCM16 / 44100 / 1 | -13.96 | -30.31 | 10,662 |
| `sfx_gaze_charge.wav` | 0.280 | PCM16 / 44100 / 1 | -13.95 | -27.74 | 24,774 |
| `sfx_gaze_beam.wav` | 0.760 | PCM16 / 44100 / 1 | -10.97 | -29.36 | 67,110 |
| `sfx_orb_fly.wav` | 0.600 | PCM16 / 44100 / 1 | -13.00 | -26.30 | 52,998 |
| `sfx_orb_hit_s.wav` | 0.420 | PCM16 / 44100 / 1 | -11.00 | -27.84 | 37,122 |
| `sfx_orb_hit_m.wav` | 0.500 | PCM16 / 44100 / 1 | -10.00 | -27.61 | 44,178 |
| `sfx_orb_hit_l.wav` | 0.580 | PCM16 / 44100 / 1 | -8.99 | -26.03 | 51,234 |
| `sfx_orb_crack.wav` | 0.480 | PCM16 / 44100 / 1 | -11.84 | -32.44 | 42,414 |
| `sfx_orb_crack_2.wav` | 0.480 | PCM16 / 44100 / 1 | -12.00 | -31.78 | 42,414 |
| `sfx_mult_count.wav` | 0.240 | PCM16 / 44100 / 1 | -22.00 | -38.63 | 21,246 |
| `sfx_total_mult_up.wav` | 0.420 | PCM16 / 44100 / 1 | -13.00 | -26.66 | 37,122 |
| `sfx_total_to_win.wav` | 0.280 | PCM16 / 44100 / 1 | -11.94 | -25.49 | 24,774 |
| `sfx_scatter_land.wav` | 0.480 | PCM16 / 44100 / 1 | -9.97 | -24.24 | 42,414 |
| `sfx_scatter_tease.wav` | 0.760 | PCM16 / 44100 / 1 | -18.00 | -33.39 | 67,110 |
| `sfx_scatter_trigger.wav` | 0.920 | PCM16 / 44100 / 1 | -8.99 | -22.18 | 81,222 |
| `sfx_buybonus_hover.wav` | 0.240 | PCM16 / 44100 / 1 | -17.90 | -28.61 | 21,246 |
| `sfx_buybonus_confirm.wav` | 0.820 | PCM16 / 44100 / 1 | -10.00 | -20.98 | 72,402 |
| `sfx_fg_plus5.wav` | 0.950 | PCM16 / 44100 / 1 | -8.00 | -19.36 | 83,868 |
| `sfx_statues_crack.wav` | 0.650 | PCM16 / 44100 / 1 | -11.97 | -23.87 | 57,408 |
| `sfx_bigwin_1.wav` | 2.250 | PCM16 / 44100 / 1 | -8.00 | -21.56 | 198,528 |
| `sfx_bigwin_1_loop.wav` | 1.600 | PCM16 / 44100 / 1 | -13.99 | -25.29 | 141,198 |
| `sfx_bigwin_2.wav` | 2.500 | PCM16 / 44100 / 1 | -8.00 | -20.94 | 220,578 |
| `sfx_bigwin_2_loop.wav` | 1.600 | PCM16 / 44100 / 1 | -13.99 | -25.29 | 141,198 |
| `sfx_bigwin_3.wav` | 2.750 | PCM16 / 44100 / 1 | -8.00 | -20.70 | 242,628 |
| `sfx_bigwin_3_loop.wav` | 1.600 | PCM16 / 44100 / 1 | -13.99 | -25.29 | 141,198 |
| `sfx_bigwin_4.wav` | 3.000 | PCM16 / 44100 / 1 | -7.96 | -20.39 | 264,678 |
| `sfx_bigwin_4_loop.wav` | 1.600 | PCM16 / 44100 / 1 | -13.99 | -25.29 | 141,198 |
| `sfx_bigwin_5.wav` | 3.250 | PCM16 / 44100 / 1 | -7.96 | -20.09 | 286,728 |
| `sfx_bigwin_5_loop.wav` | 1.600 | PCM16 / 44100 / 1 | -13.99 | -25.29 | 141,198 |
| `vo_medusa_hmm.wav` | 0.550 | PCM16 / 44100 / 1 | -13.00 | -20.57 | 48,588 |
| `vo_medusa_peek.wav` | 0.370 | PCM16 / 44100 / 1 | -12.99 | -20.94 | 32,712 |
| `vo_medusa_annoyed.wav` | 0.550 | PCM16 / 44100 / 1 | -13.00 | -21.31 | 48,588 |
| `vo_medusa_gasp.wav` | 0.740 | PCM16 / 44100 / 1 | -12.81 | -25.20 | 65,346 |
| `vo_medusa_laugh.wav` | 1.750 | PCM16 / 44100 / 1 | -12.99 | -28.99 | 154,428 |
| `vo_medusa_laugh_2.wav` | 1.840 | PCM16 / 44100 / 1 | -13.00 | -29.23 | 162,366 |
| `vo_medusa_cry_happy.wav` | 1.900 | PCM16 / 44100 / 1 | -12.99 | -29.00 | 167,658 |
| `sfx_snakes_hiss.wav` | 0.560 | PCM16 / 44100 / 1 | -16.65 | -31.50 | 49,470 |
| `sfx_snake_yawn.wav` | 0.760 | PCM16 / 44100 / 1 | -18.00 | -25.25 | 67,110 |
| `sfx_snakes_laugh.wav` | 0.960 | PCM16 / 44100 / 1 | -16.75 | -35.68 | 84,750 |
| `stinger_fg_intro.wav` | 3.500 | PCM16 / 44100 / 1 | -8.01 | -19.79 | 308,778 |
| `stinger_fg_outro.wav` | 3.650 | PCM16 / 44100 / 1 | -9.00 | -21.18 | 322,008 |
| `bgm_base.ogg` | 64.000 | Vorbis q5 / 44100 / 2 | -2.38 | -17.97 | 896,306 |
| `bgm_feature.ogg` | 64.000 | Vorbis q5 / 44100 / 2 | -3.11 | -17.96 | 954,038 |
| `amb_plaza.ogg` | 12.000 | Vorbis q5 / 44100 / 2 | -29.06 | -46.62 | 129,776 |
| `amb_night.ogg` | 12.000 | Vorbis q5 / 44100 / 2 | -29.41 | -41.50 | 150,782 |

## v5 runtime playback gains (2026-10-26)

The original masters remain unchanged. Orb flight gain: 0.8 → 1.35 (+4.55 dB). Casting utterance: 0.82 → 1.10 (+2.55 dB). Number collision impact: 1.15. Runtime uses the existing shared compressor. Character voices are synthesized nonverbal cues.

## v6 runtime playback mix (2026-10-26)

Casting utterance gain 2.10 at playback rate 0.87, layered with snake hiss gain 0.55 at 0.86. Collision impact gain 1.65; numeral-transfer gain 1.30; count loop gain 0.78. Orb flight remains 1.35. These settings are identical in every Turbo tier and run through the existing master compressor. Underlying original masters are unchanged.
