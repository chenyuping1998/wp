"""Measure where each joint of each Turf War rig starts to distort the ARTWORK.

    python design/rig/sweep_turf_limits.py [--strain 1.12]

For every rig, every bone, both directions, it rotates that one joint and computes
per-triangle distortion = max(s1, 1/s2) of the triangle's rest->posed affine map
(1.0 is rigid). Only triangles covering drawn pixels count — transparent air may
stretch freely and invisibly. The limit printed is the largest whole angle at which
the worst drawn triangle stays under the threshold, in BOTH directions (the idle
swings both ways).

A number here is a candidate, not a verdict: mesh-cast-rig §5 — render the joint at
that angle and look at the extremity zoomed. It exists so the renders are taken at
the right angles instead of guessed ones.
"""
import json, math, os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
from mesh_render import pose_vertices  # noqa: E402

RIGS = {
    "base": ("static/assets/meshRigs/cast_guy/guy.rig.json", "static/assets/sprites/turfCast/guy.png"),
    "feature": ("static/assets/meshRigs/cast_guy/guy_feature.rig.json", "static/assets/sprites/turfCast/guy_feature.png"),
    "kingpin": ("static/assets/meshRigs/cast_guy/guy_kingpin.rig.json", "static/assets/sprites/turfCast/guy_kingpin.png"),
}
BONES = ["hips", "waist", "chest", "neck", "head", "arm_l", "fore_l", "arm_r", "fore_r", "hair"]
THRESH = float(sys.argv[sys.argv.index("--strain") + 1]) if "--strain" in sys.argv else 1.12


def drawn_triangles(rig, alpha):
    H, W = alpha.shape
    keep = []
    for t, tri in enumerate(rig["tris"]):
        pts = np.array([rig["verts"][i] for i in tri])
        x0, y0 = np.clip(pts.min(0).astype(int), 0, [W - 1, H - 1])
        x1, y1 = np.clip(pts.max(0).astype(int) + 1, 0, [W, H])
        if (alpha[y0:y1, x0:x1] > 40).mean() > 0.15:
            keep.append(t)
    return keep


def worst_strain(rig, tris, posed):
    worst = 1.0
    rest = rig["verts"]
    for t in tris:
        a, b, c = rig["tris"][t]
        S = np.array([[rest[b][0] - rest[a][0], rest[c][0] - rest[a][0]],
                      [rest[b][1] - rest[a][1], rest[c][1] - rest[a][1]]])
        D = np.array([[posed[b][0] - posed[a][0], posed[c][0] - posed[a][0]],
                      [posed[b][1] - posed[a][1], posed[c][1] - posed[a][1]]])
        s = np.linalg.svd(D @ np.linalg.inv(S), compute_uv=False)
        worst = max(worst, s[0], 1 / max(s[1], 1e-6))
    return worst


if __name__ == "__main__":
    out = {}
    print(f"distortion threshold {THRESH}  (drawn triangles only)\n")
    print("rig      " + "".join(b.rjust(8) for b in BONES))
    for name, (rp, tp) in RIGS.items():
        rig = json.load(open(os.path.join(APP, rp)))
        alpha = np.asarray(Image.open(os.path.join(APP, tp)).convert("RGBA"))[..., 3]
        tris = drawn_triangles(rig, alpha)
        names = {b["name"] for b in rig["bones"]}
        row = {}
        for bone in BONES:
            if bone not in names:
                continue
            limit = 0
            for deg in range(1, 41):
                if max(worst_strain(rig, tris, pose_vertices(rig, {bone: s * deg})) for s in (1, -1)) > THRESH:
                    break
                limit = deg
            row[bone] = limit
        out[name] = row
        print(name.ljust(9) + "".join(str(row.get(b, "-")).rjust(8) for b in BONES), flush=True)
    json.dump(out, open(os.path.join(HERE, "turf_strain_limits.json"), "w"), indent=1)
