# Turf War — 2026-10-20 proportions correction v2

**This v2 supersedes the rejected v1 below.** The user reported that v1 proportions were completely wrong. Diagnosis: the body registration squeezed MG to 72% and FG to 76% of their native width-to-height ratios, while heads and arms used different scales. A green mesh/build gate did not validate anatomy.

- Repainted coherent full-body masters with broad shoulders, thick crossed arms, compact abdomen and sturdy legs; shortened the boss coat. Native masters retained in `_incoming/street_cast_crossed_v2/{mg,fg}/source/master-native.png`.
- `build_master_cast.py` makes one uniform registration for the whole master, then partitions visible pixels into parts on that same canvas. Individual parts never receive a resize transform. Native armless torso underpainting is hidden beneath the crossed arms; small alpha pinholes are cleaned during master registration.
- The folded arms now share the upper torso transform (no independent arm oscillation); torso weight blending begins below the sleeve ends, preventing a stationary white edge at the coat/sleeve seam. Head and accessories retain the 700ms reaction.
- Browser fixture QA: MG main board, Kingpin entry and full feature return, 1280x720, 1024x768, 390x844. Proportions remain intact in the game; no cast/reel overlap.
- Each delivery has `proportion-check.json`: both master silhouette IoU = 1.0 and maximum RGBA reconstruction error = 0. This proves the composed art preserves the chosen full figure; it does not independently certify an exact anatomical head count.
- Added `check_cast_proportions.py` to the production build: it recomposes the actual cropped runtime textures in manifest order and compares them to the cleaned full master. All four shipped modes PASS. Exercised it on the rejected v1 assets and confirmed FAIL.
- The old `build_crossed_cast.py` entry point now forwards to v2, so a later rebuild cannot silently restore the squeezed parts. Source/frame layout uses the master-derived joints and a wider cast envelope.
- Both layered-art gates PASS: complete torso, overlapping joints, antialiased cuts. Both shipped motion gates PASS (2,848 poses per rig, no flipped triangles). Full `pnpm build` PASS, including the new proportion check. Style gate MG 47 colors95 / 31.9% soft; FG 46 / 32.3%, both PASS.
- Loading art, thumbnail foreground/background and cover foreground/background rebuilt from the same runtime layers. V1 is backed up in `_legacy_assets/proportions_rejected_v1_20261020/`; its staged package is backed up in `_upload_backups/TurfWar-proportions-rejected-v1-20261020.tgz`.
- Review images: `cast_brief_crossed/proportions_before_after.jpg` (equal-height comparison), `proportions_v2.jpg`, `reaction.gif` (exact runtime mesh rendering).

Rebuild with `python design/build_master_cast.py --install`, `python design/build_street_brand.py`, then `pnpm build` (math-sdk Python for the design scripts).

Staged at `/Users/stone/stake-engine/upload/TurfWar/` with updated frontend, thumbnail, cover and hashes. Math unchanged. **Platform frontend v20 published on 2026-10-20; math remains v7.** Scratch re-check: 0 actions,176 unchanged files. Added a per-round affordability guard in actor.ts; six boundary cases and21sec space-hold test pass (2.50 balance,1.00 stake =>2 requests,0.50 remaining,notice). Store thumbnail/cover files are packaged but NOT yet applied on the platform: web sign-in requires the user to accept terms and sign in. Approval remains closed/locked; no approval version updated. Release receipt and partial runtime self-check are in upload/TurfWar/.

---

# Turf War — 2026-10-20 crossed-arm cast delivery

Implements `cast_brief_crossed/REQUEST.md` dated 2026-10-20.

- MG masked hoodie enforcer and FG Kingpin are distinct newly painted street-sticker characters, both folded arms and facing screen-left. Compact large-head proportions, short legs, forward shoes; old corrective arm rest rotations removed.
- MG: 7 independent layers (back-slung bat, complete armless hoodie/body, right arm, left arm, hooded head, crown chain, mask tails). FG: 6 layers (complete armless coat/body, right arm, left arm, bearded head, cigar, smoke).
- Original native imagegen outputs and clean full-canvas deliveries retained in `_incoming/street_cast_crossed/{mg,fg}/source/` and the parent folders. Body underpainting has no enclosed holes and no painted hands. The #7 hanging-arm underlay tool does not apply to crossed arms (the torso is deliberately underneath the forearms); inspect reaction frames instead.
- Cropped runtime layers in `static/assets/castLayers/turf/{base,feature,kingpin,fg}`. Bat parent = chest; cigar parent = head. Removed obsolete gripping-fingers asset/preload. Old layers backed up in `_legacy_assets/pre_crossed_20261020/`.
- New original 700ms shoulder recoil with no long hold, longitudinal arm scaling or foot lift; folded arms share the breathing rhythm.
- New vertical fit keeps side-band full figures above the controls; portrait keeps the upper-body composition behind the housing. Rebuilt loading art, separate thumbnail BG/FG/provider mark and separate cover BG/FG.

## Verification

- Both layered-art delivery gates PASS: pixel-exact stacked composite, no body holes, shoulder overlap >=40px, neck overlap >=30px, antialiased contour, >=40px canvas margin.
- MG bat/head clearance >=60px enforced by `build_crossed_cast.py`.
- Shipped motion gates PASS: each rig tested at 2,848 poses including idle, win/winBig/trigger and 1x/2x/4x speed. No flipped triangles; arms <1px affine bend residual.
- Style gate: MG colors95=58 / soft=34.1%; FG colors95=42 / soft=36.3%; both PASS.
- Full `pnpm build` PASS (all game gates + Vite). `git diff --check` clean.
- Visible browser local fixture QA: MG launch/main board, Kingpin entry, full Kingpin free-spin round and automatic return to MG, 1280x800, 1024x768 and 390x844. Both face the board; cast stays outside the reels; shoes visible above controls in landscape, portrait head/torso above board. Uses local published-book fixture, no live RGS session.
- Browser logs had existing translation/deprecation warnings and browser observer errors without game URL; no game-source exception was reported in this run.
- Exact runtime-mesh reaction preview: `cast_brief_crossed/reaction.gif` and `reaction_peak.jpg`.

## Reproduce / delivery

1. `/Applications/anaconda3/envs/math-sdk/bin/python design/build_crossed_cast.py --install`
2. `/Applications/anaconda3/envs/math-sdk/bin/python design/build_street_brand.py`
3. `pnpm build`
4. `python design/stage_street_playtest.py` (local fixture only, never upload)

Staged at `/Users/stone/stake-engine/upload/TurfWar/`: frontend, thumbnail and cover updated; math byte-identical to existing published-file source. SHA-256 inventory refreshed. No new ZIP. Previous staged files saved to `_upload_backups/TurfWar-pre-crossed-20261020.tgz`.

**Platform has NOT been uploaded, published or resubmitted by this task.** Whole-game Engine submission self-check remains a separate pre-submission step.
