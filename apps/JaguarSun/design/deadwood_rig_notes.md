# Deadwood conductor rig — 2026-09-21

Rebuild with `python3 design/deadwood_rig.py`; gate the actual TypeScript
production posing functions with `node design/deadwood_rig_runtime.mjs`.
Requires numpy, Pillow and the installed hacksaw-character-motion toolkit.
Artwork is read unchanged. The rig is authored for this 1024×1536 drawing.

The 24×48 grid has 1,225 vertices, 2,304 triangles and ten bones. Shoulder,
elbow and hand paths are explicitly authored; no automatic arm finder is used.
The bent ticket-punch arm is left/bracing; the straight right arm drives.
Explicit forearm axes avoid stretching the bent forearm in its upper-arm axis.
The right-extending scarf belongs to the continuous torso mesh; it has no
independent flutter bone in this version.

Verification performed:

- Toolkit `reproduce.py`: everything reproduced.
- Toolkit `parity.py`: 4,088 values, maximum error 4.44e-16.
- Toolkit `check.py`: all checks passed; idle feet travel zero; head travel
  9.1 px (0.61% of figure height); opacity area variance 0.69%.
- Authored-axis Python sweep: reaction area ratio 0.581–1.390 across eight
  trigger phases; no inversions. All triangles included, not only opaque ones.
- Production TypeScript sweep: win 0.686–1.296; big win 0.633–1.343;
  trigger 0.580–1.390. Thresholds remain 0.5 minimum and 1.6 maximum.
- Python/production parity: 9,800 vertex coordinates; maximum discrepancy
  0.000119 pixels (production uses Float32Array).
- Inked arm ownership: left 0.866, right 0.908, required minimum 0.5.
- Rendered and inspected five reaction frames at ~500px display height,
  full-resolution hands, and isolated positive/negative arm joint crops.
  Conservative visually checked local limits: left shoulder/elbow 5°/5°,
  right shoulder/elbow 4°/5°. Runtime gate includes idle in these budgets.

Transparency: 54.33% of source pixels have alpha zero. Diagnostic rendering on
a solid gray-purple background shows no fog rectangle; the apparent black fog
in the uncomposited source view is transparent RGB. Source headroom is only
2–3% on top/right/bottom, below the brief's 4%; mesh rendering is not clipped
to source texture bounds, but final stage placement must leave movement room.

Limitations: geometric limits for every joint are in deadwood_rig_report.json;
only the four arm limits received isolated enlarged visual testing. Browser
motion, final stage clipping, turbo behavior and actual game reactions still
need frontend/browser QA. This is a single-image mesh accent, not independent
character acting or a full skeletal pose library. Scarf is not independently
animated. No audio was changed by this task.
