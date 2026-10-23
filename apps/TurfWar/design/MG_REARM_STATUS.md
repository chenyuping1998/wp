# MG carrying-arm revision — 2026-10-16

Request: `cast_brief_street/mg/REARM_REQUEST.md` (13:48).

Replaced only `arm_r`, `prop_bat`, `fingers_r` with built-in imagegen assets.
Native sources and all final prompts are in `_incoming/street_cast/mg_rearm/`.
Rejected arm iterations remain in the generated-image archive; they are not shipped.
The shoulder/elbow/grip joints now use (410,535), (305,770), (395,615).
The bat grip follows the new forearm, with its barrel angled outward away from
the head. Torso, head, hanging arm, chain and mask retain the existing pixels.
The Kingpin and its 10-degree resting-arm adjustment are unchanged.

The export performs measured affine placement, sleeve-width registration, alpha
cleanup and palette reduction. It does not synthesize replacement shapes.
Existing delivery and all three runtime mode folders were backed up under
`_legacy_assets/pre_mg_rearm/` before installation.

## Validation

- Strict layer checker: pixel-exact composite, zero torso holes, PASS.
- All three MG runtime modes: 3,544 poses each, zero flipped triangles,
  area ratios 0.8928–1.5025, minimum canvas margin 155.5px. Existing limits retained.
- Style: colors95 47, soft 25.2%, chroma 6.8; PASS with soft limit 38%.
- Full frontend build and all chained guards PASS; log `/private/tmp/turf-rearm-build.log`.
- Desktop 1280×720: new arm visible, no board overlap; Bruiser fixture 1 and
  51.80× base win fixture 821 completed. At 390×844, base fixture 64 completed
  with $0.70 win and $99,999.70 fake-wallet balance. Arm/grip seams and the clear
  bat-to-face gap were inspected in both sizes. Captured application errors: zero.
- All 15 untouched runtime textures (five per MG mode) were compared pixel by
  pixel with the pre-revision backup and match exactly.
- Loading art, single-character title-free thumbnail and two-character cover
  rebuilt using the same posed layers as the runtime. Background mean luminance
  197.4 / 201.5, dark fraction 0%; separate BG/FG/provider layers retained.

## Reproduce and package

Use `/Applications/anaconda3/envs/math-sdk/bin/python`:

1. `design/build_street_rearm.py --install`
2. `design/build_street_brand.py`
3. `/Users/stone/Library/pnpm/pnpm --dir /Users/stone/stake-engine/wp/apps/TurfWar build`
4. `design/stage_street_playtest.py` (local fixtures only)
5. `design/stage_street_rearm.py`

The general cast builder now selects this delivery instead of restoring the old
raised arm. Local QA has Win/Big win buttons for base fixtures 64/821.

Staged at `/Users/stone/stake-engine/upload/TurfWar/`: current app bundle,
17 changed runtime files, new thumbnail and cover layers. Existing pruned assets
were preserved. SHA-256 index regenerated and verified for 184 package files;
math files were hash-checked before/after and did not change. Previous package
backed up at `_upload_backups/TurfWar-rearm-20261016-142618.tgz`.
No ZIP produced. The platform itself has not been updated.
