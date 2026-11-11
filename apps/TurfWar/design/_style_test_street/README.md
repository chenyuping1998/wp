# Turf War street sticker style test — 2026-10-15

Source brief: `../STYLE_TEST_STREET.md`. This is the required six-piece style
test, not a finished reskin or an upload package. Built-in imagegen produced each
piece separately; exact prompts are in `prompts.json`, originals in
`../_incoming/style_test_street/`. No reference-game artwork was supplied.

## Delivered

- `h1.png`, `l1.png`, `w.png`, `sw.png`, `cast_head.png`: 512px RGBA, blue key
  removed including internal holes, restricted palette quantisation.
- `bg_crop.png`: 1920×1080 grey line city. Mean luminance 196.68/255 = 77.13%,
  exceeding the brief's 55% minimum.
- `samples.png`: six samples with 70px and 96px symbols.
- `readability.png`: standard style-check sheet, including greyscale.
- `low_pay_compare.png`: current L1–L4 beside proposed L1.
- `lobby_200.png`: head-and-city readability study, **not final store art**.
- `metrics.json`: output hashes, dimensions, opacity and brightness.

Rebuild with:

```sh
/Applications/anaconda3/envs/math-sdk/bin/python design/build_street_style_test.py --stage-playtest
```

The stage option copies the existing local playtest into
`/Users/stone/stake-engine/dist/turfwar-street-test/`, replaces only the four
sample symbols and MG background, and clears the old night foreground layer.
It never installs into production `static/` or `upload/`. The new cast head is
review-only: it is not a full-body layered character and cannot replace the rig.

Preview (local HTTP server on 4231 serving `/Users/stone/stake-engine/dist`):

`http://127.0.0.1:4231/turfwar-street-test/?hmdebug=1&rgs_url=stub.local&sessionID=playtest&currency=USD&lang=en`

## Measurements

`check_style.py` without thresholds reports measurements; its PASS label is not
style approval. Current → sample colors95 / soft share:

| Symbol | Current | Sample |
|---|---|---|
| H1 | 210 / 28.2% | 30 / 24.0% |
| L1 | 4 / 89.3% | 4 / 14.0% |
| W | 201 / 44.9% | 32 / 25.1% |
| SW | 252 / 61.2% | 24 / 23.7% |
| Cast head | — | 10 / 11.5% |

Bright background, distinct orange H1 and red SW, open finger holes and a
left-facing cast head were visually inspected. Some SW linework remains finer
than ideal at 70px; simplify it during the full asset pass. WILD remains a runtime
lettering requirement: the generated grip is intentionally blank.

## Integration findings

The running 1280×720 Pixi game loads the sample H1/L1 and line-art backdrop and
returns from a local test spin. The preview intentionally mixes new samples with
the existing frame, other symbols, UI and rig; it is not a coherent final game.

A fixed BASE book 1 also completed with all four new W sprites in the expanded
reel, with no console errors. A local Lookout feature was exercised through a
retrigger (10 → 14 spins); the new symbols remain loaded during feature play.
Lookout completed all 14 spins, showed $56.70 on the outro and accepted the
return-to-base click. Console errors remained zero. This checks the existing
presentation with sample textures; it does not certify the planned new motion.

- `src/components/Game.svelte` wraps the background in a blur filter and draws a
  vignette. Remove/rework those for the approved line-art direction.
- `src/components/SymbolArt.svelte` draws low-pay rim/shadow copies, turning grey
  ink into an embossed object. Replace that treatment for the street direction.
- New W needs runtime WILD typography. No baked labels should be generated.
- Existing land/win transforms and signature effects still belong to the previous
  art treatment. New media require sticker slap/peel, spray sweep and wall-cover
  transitions per the brief. A static reskin does not resolve Poor animations.
- `check_review_tags.py`: 0 FAIL, 1 WARN (flat chain layer beside current painted
  cast). It does not evaluate visual motion quality.

## Remaining scope

Select a style frame before propagating the complete art brief. Then produce
the remaining symbols, frames/housing, two full layered characters, UI, logo,
transitions/FX, thumbnail and cover; integrate the new motion language; build,
play all tiers and restage the verified package. No new math was requested here.

Production source art, math, upload package and platform have not been updated.
