# Diner Monkey — art and audio handoff

2026-10-09. This project is under `E:\stake\wp\apps\DinerMonkey美式餐館`. Nothing has been uploaded to a platform.

- Approved style sample: `design/source/diner/style_test_v1.png` and prompt alongside it.
- Art source and reproducible exporter: `design/source/diner/` and `design/build_diner_art.py`. Runtime sprites are in `static/assets/sprites/sushiXxx/`; the legacy directory names remain for code compatibility.
- Characters: `design/cast_delivery/`, `design/source/mg/`, `design/source/fg/`, and `static/assets/spines/sushiMaster/` / `sushiApprentice/`. Regenerate faces with `python design/build_diner_faces.py`, then each Spine atlas with `CAST=mg` or `CAST=fg` and `node design/generate_monkey_spine.mjs E:\stake\tools\gen`.
- Audio: 39 cues plus two MP3 loops in `static/assets/audio/diner/`; generator, WAV masters, audit, and level list are in `design/source/diner/audio/`.
- Promo: `design/thumbnail/BG.png` + `FG.png`; `design/cover/DinerMonkey-Cover-BG.png` + `DinerMonkey-Cover-FG.png`. The 200 px thumbnail passes the requested brightness limits; see `design/thumbnail/metrics.txt`.
- QA sheets: `design/source/diner/_sheets/`. Local 1280×720 main screen preview and `pnpm build` passed. Physical listening on speakers and headphones remains to be done.

The math bundle still needs to be regenerated with game ID `DinerMonkey` before platform staging; see `HANDOFF.md`.
