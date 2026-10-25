# Capo Nostra Spine layer workbench

`full.png` is the approved 1024×2048 v3 character master and is the coordinate
reference for every layer.

Files named `*_candidate_*.png` are image-generation work products. They are
not shippable until they have been restored to the 1024×2048 master canvas,
registered against `full.png`, and pass the overlap/rotation checks described
in `../../ART_BRIEF_CAST_SPINE.md`.

Current candidates:

- `torso_candidate_01.png`: useful completed cloth/shoulder paint, but the
  generator returned an 887×1774 recentered canvas.
- `torso_candidate_02.png`: stricter coordinate-lock retry. It preserves more
  transparent margin but still returns 887×1774, so it remains a paint donor.
- `arm_l_upper_candidate_01.png`: useful sleeve/rounded-joint paint reference,
  but it contains more than the requested upper-arm segment and is not aligned.

Do not rename either candidate to a final layer filename until registration and
mask cleanup are complete.
