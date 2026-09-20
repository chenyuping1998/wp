"""Offline renderer for mesh-cast rigs: the same skinning skinnedFigure.update() does,
drawn with the real texture, so joint limits can be judged by LOOKING (mesh-cast-rig §5).

    from mesh_render import load_rig, pose_vertices, render
    img = render(rig, texture, pose_vertices(rig, {"fore_r": 8}))

Skinning matches skinnedFigure.ts: per bone a rotation about its own rest position,
composed parent -> child, vertices blended by weight (LBS). Textured by affine-warping
every triangle from its rest position to its posed position.
"""
import json, math
from PIL import Image, ImageDraw

DEG = math.pi / 180


def load_rig(path):
    return json.load(open(path))


def bone_matrices(rig, angles_deg, push=None):
    """angles_deg: {bone: local rotation in degrees}. Returns list of 2x3 affine matrices."""
    mats = []
    for b in rig["bones"]:
        a = angles_deg.get(b["name"], 0.0) * DEG
        c, s = math.cos(a), math.sin(a)
        # rotate about the bone's rest pivot: T(p) R T(-p)
        local = [c, -s, b["x"] - c * b["x"] + s * b["y"],
                 s,  c, b["y"] - s * b["x"] - c * b["y"]]
        if b["parent"] < 0:
            m = local
        else:
            p = mats[b["parent"]]
            m = [p[0] * local[0] + p[1] * local[3], p[0] * local[1] + p[1] * local[4],
                 p[0] * local[2] + p[1] * local[5] + p[2],
                 p[3] * local[0] + p[4] * local[3], p[3] * local[1] + p[4] * local[4],
                 p[3] * local[2] + p[4] * local[5] + p[5]]
        mats.append(m)
    if push:
        i = next(k for k, b in enumerate(rig["bones"]) if b["name"] == push["bone"])
        mats[i] = mats[i][:2] + [mats[i][2] + push["dx"]] + mats[i][3:5] + [mats[i][5] + push["dy"]]
    return mats


def pose_vertices(rig, angles_deg, push=None):
    mats = bone_matrices(rig, angles_deg, push)
    out = []
    for (x, y), w in zip(rig["verts"], rig["weights"]):
        ax = ay = 0.0
        for j, wt in enumerate(w):
            if wt <= 0.002:
                continue
            m = mats[j]
            ax += (m[0] * x + m[1] * y + m[2]) * wt
            ay += (m[3] * x + m[4] * y + m[5]) * wt
        out.append((ax, ay))
    return out


def _affine_from(src, dst):
    """Coefficients mapping DESTINATION -> SOURCE (what PIL.Image.transform wants)."""
    (x0, y0), (x1, y1), (x2, y2) = dst
    (u0, v0), (u1, v1), (u2, v2) = src
    det = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0)
    if abs(det) < 1e-9:
        return None
    a = ((u1 - u0) * (y2 - y0) - (u2 - u0) * (y1 - y0)) / det
    b = ((u2 - u0) * (x1 - x0) - (u1 - u0) * (x2 - x0)) / det
    d = ((v1 - v0) * (y2 - y0) - (v2 - v0) * (y1 - y0)) / det
    e = ((v2 - v0) * (x1 - x0) - (v1 - v0) * (x2 - x0)) / det
    return (a, b, u0 - a * x0 - b * y0, d, e, v0 - d * x0 - e * y0)


def render(rig, texture, posed, margin=0):
    W, H = rig["size"]
    canvas = Image.new("RGBA", (W + 2 * margin, H + 2 * margin), (0, 0, 0, 0))
    rest = rig["verts"]
    for tri in rig["tris"]:
        src = [rest[i] for i in tri]
        dst = [(posed[i][0] + margin, posed[i][1] + margin) for i in tri]
        xs = [p[0] for p in dst]; ys = [p[1] for p in dst]
        bx0, by0 = int(math.floor(min(xs))), int(math.floor(min(ys)))
        bx1, by1 = int(math.ceil(max(xs))) + 1, int(math.ceil(max(ys))) + 1
        if bx1 <= bx0 or by1 <= by0:
            continue
        local_dst = [(p[0] - bx0, p[1] - by0) for p in dst]
        coeffs = _affine_from(src, local_dst)
        if coeffs is None:
            continue
        patch = texture.transform((bx1 - bx0, by1 - by0), Image.AFFINE, coeffs, resample=Image.BILINEAR)
        mask = Image.new("L", patch.size, 0)
        # fill + a 2px outline: shared edges overlap slightly instead of leaving hairline
        # gaps that read as tears (WebGL shares edges exactly; this renderer does not)
        ImageDraw.Draw(mask).polygon(local_dst, fill=255, outline=255, width=2)
        canvas.paste(patch, (bx0, by0), Image.composite(patch, Image.new("RGBA", patch.size), mask).getchannel("A"))
    return canvas


if __name__ == "__main__":
    # self-test: the rest pose must reproduce the texture it was built from
    import sys
    rig = load_rig(sys.argv[1]); tex = Image.open(sys.argv[2]).convert("RGBA")
    out = render(rig, tex, pose_vertices(rig, {}))
    import numpy as np
    a = np.asarray(out, dtype=float); b = np.asarray(tex, dtype=float)
    diff = np.abs(a - b)[..., :3].mean(axis=2)[np.asarray(tex)[..., 3] > 128]
    print(f"rest-pose self-test: mean abs RGB diff {diff.mean():.2f} over opaque px, 99th pct {np.percentile(diff, 99):.1f}")
    out.save(sys.argv[3]) if len(sys.argv) > 3 else None
