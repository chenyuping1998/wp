# Three Jade-derived theme deliveries (2026-10-09)

| App | Source art | Audio | Contact sheet |
| --- | --- | --- | --- |
| Monkey King Rush | `apps/MonkeyKingRush齊天大聖/design/source/monkeyking/` | `static/assets/audio/monkeyking/` | `_sheets/monkeyking_art_contact.png` |
| Pocha Monkey | `apps/PochaMonkey韓式路邊攤/design/source/pocha/` | `static/assets/audio/pocha/` | `_sheets/pocha_art_contact.png` |
| Swing Monkey | `apps/SwingMonkey爵士俱樂部/design/source/swing/` | `static/assets/audio/swing/` | `_sheets/swing_art_contact.png` |

Each source directory retains the original generated style master, three-scene intro, background, two character paintings, seven individually generated symbols, transparent paired throw-prop art and a full-screen transition door. The intro scenes are deliberately comic sequences: Monkey King loses control of a peach and summons hair clones before a scroll runs away; Pocha's order snowballs from a food basket into a frantic prep line and endless receipt; Swing's records start a dance, the tap dancer joins in and the score runs off the page. The transition doors are a heavenly gate, a street-stall curtain and a jazz-stage velvet curtain. No lettering was generated in the pictures; the game composes type separately.

The three opening illustrations have small, independent motion in `FeatureIntro.svelte`: clouds/clone/scroll, food basket/scissors/receipt, and beat-synced record/tap/program. The FG entrance uses a separate edict, order ticket or jazz intertitle, with live localized title text. `BanditMeter.svelte` changes the upgrade strike itself to staff, scissors or cane and uses the theme's color and comic cue.

Image generation mode was new transparent cutouts for symbols, characters and props, and opaque illustrations for style, backgrounds and the three-panel sequences. Source prompts called for original characters and props, strong readable silhouettes, transparent margins where appropriate, and no text. The theme directions were: inked Chinese action comic in red/gold/teal, colorful Korean street-food webtoon, and restrained sepia/black/red 1930s rubber-hose-inspired jazz cartoon. All generated images are preserved; `build_three_theme_art.py` crops, scales and typesets them into the runtime's existing sprite contract. Two cast rigs per theme are rebuilt with `design/generate_monkey_spine.mjs` using `E:/stake/tools/gen` as the pngjs tool directory and `CAST=mg` or `CAST=fg`.

`build_three_theme_audio.py` synthesizes the audio from original oscillators/noise rather than recordings, and places 48 kHz/24-bit stereo WAV masters in `design/source/<theme>/audio/masters/`. Per theme: 39 mono 44.1 kHz/16-bit WAV cues and two stereo MP3 BGM loops. All 41 runtime cue paths are wired in `Sound.svelte`; the 39 named cues resolve. Audio packages are 5.2–5.4 MB each.

`measure_three_theme_audio.py` measured all six final MP3 loops at −18.2 to −18.0 LUFS integrated and −6.3 to −3.1 dBTP. The original short cues peak below −1 dBFS. The music uses 16 whole bars per loop and MP3 gapless metadata.

Regenerate from `E:/stake/wp` with `python tools/build_three_theme_art.py` and `python tools/build_three_theme_audio.py`. The app build command is `npm run build` in each app directory. The build runs asset, audio, reference, copy, type-baseline, mesh and cast checks before emitting `build/`.

The math and play books are inherited from Jade Teahouse. Consult each app's `HANDOFF.md` before platform submission for math rerun/certification requirements. This delivery concerns the three front-end visual and audio themes.

Local browser QA: `prepare_three_theme_qa.py` copies each final build to `E:/stake/tmp/qa_*_20261009`, injects a local fake RGS and reads one real Jade bonus book from the math SDK. At 1280×720, all three intro pages rendered; Monkey King and Pocha also showed the newly illustrated closing/opening curtains. A Pocha bonus book played through its FG opening, meter advancement and total-win closing board without browser errors. The Swing intro was also inspected at 390×844, leading to the larger mobile body text and wider picture-to-text separation in all three apps. The QA shells are local test outputs, never shipping content.
