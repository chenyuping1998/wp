# Turf War — remaining art implementation, 2026-10-16

Scope: `ART_REQUEST_REMAINING.md` (2026-10-15 21:55). Own style references only.
Native built-in imagegen originals, including rejected iterations, are retained
under `_incoming/street_cast/*/source`; prompts are in
`_incoming/street_cast/generation-prompts.json`.

## Implemented

- Two distinct street characters: MG enforcer (8 native layers) and FG Kingpin
  (6 native layers), each with its own measured skeleton. MG shares one flat
  texture set across base/feature/kingpin. FG swaps at the covered transition.
- New full figures and every layer are 1024×2048. Hidden torso/shoulder areas
  have separate native underpaint. The repeatable registration pipeline does
  alpha cleanup and colour reduction; it does not paint replacement limbs.
- Hanging-arm clearance: MG 61.20px; FG 49.01/62.80px. Shoulder overlaps:
  MG 55/49px; FG 45/45px. Pixel-exact layer composites and no body holes.
- Character style gate: MG colors95=45, soft=24.8%; FG 40, 26.1%. Cropped
  runtime textures use 4.83MiB (MG) and 3.94MiB (FG) before GPU overhead.
- Runtime mirroring removed: both new faces look left toward the reels.
  Old ±12° A-pose compensation removed; cast glow disabled for flat inks.
- Four illustrated tape/Bag frames installed; the small green sticky mark
  retains its existing program graphic. Bag corner size corrected after the
  first generated version covered too much of the symbol area. Frames pass
  colors95 73/35/28/50 and soft 22.8/31.0/28.1/31.2%. Their interior is truly
  transparent, including removal of native 1/255 alpha haze.
- Three new line foregrounds, centre 60% empty, with slow parallax behind the
  board. Paper fills removed mechanically so only ink remains.
- Loading character, square tile BG/FG and 1920×1080 cover BG/FG rebuilt from
  the new full figures. Provider logo stays separate. Cover overlay reserves
  are clear. Background luminance: tile 197.4; cover 201.5; dark fraction 0.

## Reproduce

Use `/Applications/anaconda3/envs/math-sdk/bin/python` for Python commands:

1. `design/build_street_batch.py street_batch2 --check`
2. `design/build_street_near.py`
3. `design/install_street_skin.py` (preserves validated street cast)
4. `design/build_street_cast.py --install`
5. `design/build_street_brand.py`
6. `/Users/stone/Library/pnpm/pnpm --dir /Users/stone/stake-engine/wp/apps/TurfWar build`
7. `design/stage_street_playtest.py` (local fake-wallet QA only)

Backups: `_legacy_assets/pre_street_v2`, `pre_street_cast`, `pre_street_brand`.
`check_layered_cast.mjs` now samples alpha in the declared cropped UV space,
checking bounds/dimensions and keeping its existing deformation thresholds.
FG geometry is checked against the new delivery manifest, not the retired art.

## Verification

- Full build and all chained guards PASS (`/private/tmp/turf-street-remaining-build.log`,
  final `✔ done`). First build correctly rejected a 1/255 frame interior haze;
  the export was corrected and the final full build passed.
- 1280×720 local boot, MG orientation and Lookout intro/FG Kingpin confirmed.
- Lookout BASE fixture 11 completed all 12 spins, including retrigger, and returned
  to base. Its $22.00 payout and Muscle fixture 29's $259.90 payout reconcile
  with the desktop balance of $100,279.90 after the two $1 test spins.
- 390×844 phone Kingpin fixture 50 completed 10 free spins and displayed
  $7,083.10 total win, then returned to the MG base screen (visible fake-wallet
  balance $107,081.10). Both cast variants, illustrated Bag frames and the phone
  controls were checked in the running game. These runs use local fake-wallet
  fixtures only. Captured application console errors: zero.
- Final tile title canvas was enlarged to prevent clipping; its source, build
  and local preview PNGs have identical SHA-256 hashes. `git diff --check` PASS.

This is local implementation, not a submission. Math, `upload/TurfWar`, zip files
and platform versions have not been changed. No PSD is claimed; layered PNGs,
composites, pivots and runtime manifests are retained.
