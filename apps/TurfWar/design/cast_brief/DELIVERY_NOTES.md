# Turf War cast delivery

The finished layered art is in `design/cast_parts/{base,feature,kingpin}/`. Each state has eight 1024×2048 part PNGs, `full.png`, `layers.json`, and an eight-layer `cast.psd`. The PSD layers and PNGs match pixel for pixel. All three states use the same pose and identical per-layer alpha; lighting and bat markings change within the shared silhouettes.

The artwork uses `source_master_v2.png` for the visible character, `body_master.png` for the complete torso/legs hidden under moving limbs, and `bat_master_v2.png` for the complete standalone bat. `build_cast_parts.py` rebuilds the delivery. Earlier source studies are kept in this folder but are not used by the final build.

## Validation

Run `validate_cast_parts.py` after rebuilding. It checks dimensions, the 176px head-top and 1674px sole position, PNG compositing, PSD layer parity, variant alpha parity, bat connectivity, shoulder and neck overlap, and clearances. On this delivery it reports a **61px minimum free-arm gap** and **82.7px bat-to-head clearance**. Both shoulder underlaps exceed 40px horizontally; the head/neck underlap spans 132px.

## Motion correction: rigid head and straight arm

The first seam fix pinned every torso-underpaint overlap. That overlap extends into the hood and far down the sleeve, producing rubber-like deformation even though no seam opened. That approach is no longer used for the head or hanging arm.

`check_motion.py` now authors their attachment weights by anatomical region:

- Head: pure rigid rotation on head pixels above y=435; only the lower hood/collar blends between y=435 and 500. The head field has a 32px rigid contour guard followed by an 80px falloff into adjacent shoulder artwork and is applied once after layer compositing, so the collar and shoulder boundary cannot slide apart through separate transforms.
- Hanging arm: shoulder attachment blends between y=490 and 600; the remaining upper arm, elbow, forearm and fist share one rigid rotation. No independent elbow or wrist deformation.
- Raised arm, bat and fingers retain their shared field.
- Chain upper ends stay fixed; the mask tail inherits the head field after its local sway.

The 24-frame idle and 24-frame reaction cycles check fixed attachment pixels and visible deformation-map Jacobians. Exact unit weights are asserted across the rigid head and arm regions; an absence of folds alone is not sufficient evidence of rigid anatomy. The reusable 16-bit weights and binding description are in `cast_parts/motion_binding/`. `motion_validation.json` contains current measured results.

`collar_preview.gif` shows both hood-to-shoulder joins at 2× scale across both cycles. `rigidity_preview.gif` shows the head and complete hanging arm at enlarged scale across both cycles. `motion_preview.gif` and `reaction_preview.gif` show the whole character. `seam_audit.png` covers the shoulder, collar, grip, chain and mask attachments. All three variants have identical layer alpha and use the same fields.

These are the art delivery's preview bindings. The in-game cast renderer has not been modified. Importing these layers requires carrying over the explicit attachment constraints, rather than deriving weights from alpha overlap or rotating every layer independently.
