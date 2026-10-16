# Pickle Panic

Release staging: /Users/stone/stake-engine/upload/PicklePanic/ (2026-10-13).

- frontend/: static game, original pickle assets and licensed fonts. No offline server stub.
- math/: 100,000 base, 50,000 bonus and 50,000 superbonus books, matching LUTs and index.json.
- thumbnail/: 1024×1024 BG, transparent single pickle boss FG, separate Silverstars provider logo.
- cover/: 1920×1080 BG and transparent cast FG. Separate overlay-safe layers.

5×4, 1,024 ways. Every Cook collects all Pickle Jars at ×1. In Free Spins, meter 4/8/12 adds 10 spins per newly reached stage and replaces all 10/J/Q symbols respectively on later spins. Three/four/five Scatters award 10/12/15 spins. No free-spin Scatter retrigger. Diner Service costs 100× and opens at meter 0; Extra Dill costs 150× and opens at meter 4 with 10 already replaced, without extra opening spins. Both buys start with 10 spins. RTP: base 96.02%, Diner Service 96.04%, Extra Dill 96.06%; max win 10,000× BASE bet.

User-approved rugged underground American sci-fi comic. Two different original pickle characters, own #7 cast rigs, new food and jar symbols, cool fermentation-station backgrounds, new transitions, UI and original synthesized sound (v2, 2026-10-14). Original raster sources, prompts, measured cuts and export scripts remain in the app design directory.

All 200,000 published books match their LUT payouts. Existing 15 type-check baseline issues remain; the build introduces no new errors. Local preview checks and remaining integration limitations are documented in /Users/stone/stake-engine/docs/handoff/PicklePanic.md.

Store BG luminance: thumbnail mean 155.7, cover mean 145.0; dark fractions 12.5% / 12.3%. Low p10 is deliberate solid comic ink, visually checked with both composites.

2026-10-13 21:4x review pass (code only, no math, no new thumbnail/cover requested): larger symbol plates and food, jar value fitted to the label, duplicate top-right title removed, FS counter clear of the title, Scatter on the intro card, cast + jars on the buy cards, ringing bells on the FS intro, portrait cast waist-up behind the housing, cast steps back for throw/cheer so no motion touches the board, mipmapped cast atlases, portrait FS label no longer over Balance. New art/audio is requested in design/ART_REQUEST_2026-10-13.md (not yet delivered).

2026-10-14 sound v2 (design/generate_pickle_audio_v2.py + generate_pickle_music.py, brief design/ART_REQUEST_2026-10-13.md §S): every cue rebuilt from physical models (service bells, glass jars, steel trays, blast door, steam), 48 kHz stereo, BS.1770 loudness-matched, no two files identical (design/audio_v2_report.json). Main score 61 s in 2 stems, free-spin score 64 s in 3 stems layered by the Cook meter (AAC, seamless Web Audio loops); five big-win fanfares cut to their presentation lengths with music ducking; separate voices for both characters. Template sounds.wav reduced to 0.1 s of silence.

2026-10-14 production v2 (design/ART_REQUEST_2026-10-13.md A–I, sources and prompts in design/source/production_v2/): drawn royals; five distinct big-win objects with animated debris; hand-drawn UI set (Spin 4 states, buttons, Buy Bonus, 13 icons); blast-door transition with wheels, latch, steam; layered symbols with land/win performances; new free-spin background; drawn logo; four new motions per character (reach-clamped off the board); ink/paper/brine FX. Sound reworked again: main score 3 stems, character voices from CC0 human recordings (provenance in design/source/production_v2/voice_sources/LICENSES.md). 46 unreferenced intermediate images moved to design/_runtime_unused_20261014 so they do not ship.

2026-10-15 background motion (src/components/BackgroundFx.svelte, cut-outs from design/build_bg_fx.py; nothing newly painted): free spins — the brine gush flows (displacement over its own cut-out), drops swell, fall, splash and ripple the puddle; base game — bubbles rise inside the two fermentation tanks, sky stars glint. Flat inks, hard edges, no glow.

2026-10-15 UI: Buy Bonus label centred on the hanging sign's paper (offset + size 0.44); bet bar end-cap rivets painted out (original kept as design/source/production_v2/ui_bar_v2_with_rivets_backup.png) and the menu/turbo buttons enlarged 1.4x in landscape so they sit on the caps.

Platform: math v1 + front v1 published 2026-10-15 00:35 via stakecli; this UI update is published as the next front version. No ZIP files were requested or produced.
