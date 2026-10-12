"""Cleans the cast trunks' HIDDEN pixels, which the animations reveal.

The cut (cut_cast_layers.py) filled what the arms and thighs cover with a
horizontal smear, and left pieces of trouser and leg under the apron / skirt.
At rest nobody sees them; the laugh leans the torso 6 degrees and swings the
arms, and they showed as streaky cracks beside the arms and a black wedge
between the legs (2026-10-09).

  under the arms   rebuilt by extending the visible trunk vertically (its
                   apron edges and shirt run on under the arm as drawn), an ink
                   rim where that meets the air, no islands
  under the thighs below the apron / skirt hem: flat trouser black, only where
                   a thigh covers it — a shift then shows trousers, not the old
                   leg shapes (a wedge) and not a see-through crack

Originals are kept in design/source/<cast>/_orig/ (the script always starts
from them, so it can be re-run).

    python design/clean_cast_trunk.py      (runs clean_cast_arms.py first)
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

APP = Path(__file__).resolve().parents[1]
REACH = 260
SIDE_PX = 4
INK = np.array([27, 27, 27, 255], np.uint8)
# canvas y below which a hidden trunk pixel is trouser / leg left over
HEM_Y = {"mg": 652, "fg": 552}
TROUSERS = {"mg": True, "fg": False}


def _seen(layers, src, orig, al):
    """the pixels of layer `al` (its own frame) that are on show at rest: no
    layer above it covers them. A sliver that was hidden anyway (the forearm's
    top under the sleeve) must not be pasted anywhere."""
    im = Image.open((orig / al["file"]) if (orig / al["file"]).exists() else (src / al["file"]))
    hh, ww = im.height, im.width
    covered = np.zeros((hh, ww), bool)
    for n, l in layers.items():
        if l["z"] <= al["z"]:
            continue
        f = orig / l["file"] if (orig / l["file"]).exists() else src / l["file"]
        a = np.array(Image.open(f).getchannel("A")) > 128
        ox, oy = l["x"] - al["x"], l["y"] - al["y"]
        y0, y1 = max(0, oy), min(hh, oy + a.shape[0])
        x0, x1 = max(0, ox), min(ww, ox + a.shape[1])
        if y1 > y0 and x1 > x0:
            covered[y0:y1, x0:x1] |= a[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return ~covered


def _not_arm(o_im, arm_kept):
    """pixels the forearm lost that are not its own fur or skin: anything off
    the arm (>2px — the apron's stains are fur-coloured), and right against it
    anything that is neither fur nor skin (the apron's ink edge passing behind
    the hand)"""
    r, g, b = (o_im[..., k].astype(int) for k in range(3))
    mx = np.maximum(np.maximum(r, g), b)
    skin = (r > 170) & (r - b > 60) & (g < 200)
    fur = (r >= g) & (g >= b) & (mx > 40) & (mx < 170) & (r - b > 25)
    off = ndimage.distance_transform_edt(~arm_kept) > 2
    return off | ~(skin | fur)


def main():
    # the forearms first, always: this script reads what they lost, and hands
    # some of it back to them
    import runpy
    runpy.run_path(str(Path(__file__).with_name("clean_cast_arms.py")))
    for cast in ("mg", "fg"):
        src = APP / "design/source" / cast
        orig = src / "_orig"
        orig.mkdir(exist_ok=True)
        meta = json.loads((src / "layers.json").read_text(encoding="utf-8"))
        meta_neck = {cast: json.loads((src / "rig.json").read_text(encoding="utf-8"))["neck"][1]}
        layers = {l["name"]: l for l in meta["layers"]}
        t = layers["torso_0_trunk"]
        if not (orig / t["file"]).exists():
            (orig / t["file"]).write_bytes((src / t["file"]).read_bytes())
        trunk = np.array(Image.open(orig / t["file"]).convert("RGBA"))
        h, w = trunk.shape[:2]
        cover_arm = np.zeros((h, w), bool)
        cover_leg = np.zeros((h, w), bool)
        solid_arm = np.zeros((h, w), bool)
        solid_upper = np.zeros((h, w), bool)
        # the arms as they are AFTER clean_cast_arms.py (no apron slivers)
        solid_clean = np.zeros((h, w), bool)
        for name, l in layers.items():
            if name == "torso_0_trunk" or l["z"] < t["z"]:
                continue
            # the fur edges are soft: what they half cover counts as covered, and
            # a few px more, or slivers of smear between apron and arm survive
            # as "visible" and show as cracks when the arm swings off
            # the ORIGINAL cut's cover (clean_cast_arms.py strips the apron
            # slivers off the forearms; what they covered is rebuilt here too)
            f = orig / l["file"] if (orig / l["file"]).exists() else src / l["file"]
            alpha = np.array(Image.open(f).getchannel("A"))
            a = alpha > 5
            if "arm" in name:
                a = ndimage.binary_dilation(a, iterations=4)
                # what the arm REALLY hides: only these pixels may be rebuilt or
                # dropped (the dilated ring is only kept out of the sources)

            ox, oy = l["x"] - t["x"], l["y"] - t["y"]
            ys, xs = slice(max(0, oy), min(h, oy + a.shape[0])), slice(max(0, ox), min(w, ox + a.shape[1]))
            sub = a[ys.start - oy:ys.stop - oy, xs.start - ox:xs.stop - ox]
            target = cover_leg if "leg" in name else cover_arm if "arm" in name else None
            if target is not None:
                target[ys, xs] |= sub
            if "arm" in name:
                solid_arm[ys, xs] |= (alpha > 160)[ys.start - oy:ys.stop - oy, xs.start - ox:xs.stop - ox]
            if "arm" in name:
                clean_a = np.array(Image.open(src / l["file"]).getchannel("A")) > 160
                solid_clean[ys, xs] |= clean_a[ys.start - oy:ys.stop - oy, xs.start - ox:xs.stop - ox]
            if "_arm_0_" in name:
                solid_upper[ys, xs] |= (alpha > 160)[ys.start - oy:ys.stop - oy, xs.start - ox:xs.stop - ox]
        opaque = trunk[..., 3] > 40
        visible = opaque & ~cover_arm & ~cover_leg
        rows = np.arange(h)[:, None] + t["y"]
        out = trunk.copy()
        # 1. leftovers under the thighs, below the hem: flat trouser black
        legs = opaque & cover_leg & (rows > HEM_Y[cast])
        # the Chef wears trousers; the Carhop's legs are bare fur under the
        # skirt, where a black fill showed as a bar
        # (hers are kept as they are: they cover the thighs' straight top edges)
        if TROUSERS[cast]:
            out[legs] = INK
        # 2. under the arms and hands: rebuilt by VERTICAL extension — each
        #    hidden pixel takes the nearest visible trunk pixel in its own column
        #    (up or down), so the apron's vertical edges and the shirt run on
        #    under the arm the way they are drawn, where the cut's horizontal
        #    smear had dragged the apron's edge line sideways into streaks.
        #    Beyond REACH px of anything visible in the column: dropped.
        arm_hidden = opaque & solid_arm & ~legs
        # under the UPPER arms it is the body's side below the sleeve: nothing
        # there but an ink line along the body (SIDE_PX), so a raised arm shows
        # air between it and the body. Rebuilding cloth there (by row copy, then
        # by a flat median) read as loose flaps of shirt hanging off the side.
        side = arm_hidden & solid_upper
        dist_v = ndimage.distance_transform_edt(~visible)
        out[side & (dist_v > SIDE_PX)] = 0
        out[side & (dist_v <= SIDE_PX)] = INK
        arm_hidden_v = arm_hidden & ~side
        vis_rows = [np.flatnonzero(visible[:, x]) for x in range(w)]
        for x in range(w):
            ys_h = np.flatnonzero(arm_hidden_v[:, x])
            if not len(ys_h):
                continue
            vr = vis_rows[x]
            for y in ys_h:
                if not len(vr):
                    out[y, x] = 0
                    continue
                k = np.searchsorted(vr, y)
                cand = [vr[i] for i in (k - 1, k) if 0 <= i < len(vr)]
                src_y = min(cand, key=lambda v: abs(v - y))
                if abs(src_y - y) > REACH:
                    out[y, x] = 0
                else:
                    out[y, x] = trunk[src_y, x]
        # skin the cut leaked onto the trunk beside the arms and hands (it sat
        # under the arm's soft edge at rest, and was left behind as a blob when
        # the arm swung off): dropped, below the collar, near the arms
        r_, g_, b_ = (out[..., k].astype(int) for k in range(3))
        skin = (r_ > 170) & (g_ > 110) & (g_ < 200) & (b_ < 150) & (r_ - b_ > 60)
        # only what the arm REALLY covered (and a hair round it): the apron's
        # brown stains are skin-coloured too, and are on show at rest
        near_arm = ndimage.binary_dilation(solid_clean, iterations=6)
        below_collar = rows > (meta_neck[cast] + 70)
        # (and only what the ORIGINAL arm drew over: on show at rest it stays)
        leak = (out[..., 3] > 40) & skin & near_arm & below_collar & solid_arm
        out[leak] = 0
        # an ink rim where the rebuilt part meets the air: the body's side
        alpha = out[..., 3] > 40
        air = ~alpha
        rim = arm_hidden & alpha & ndimage.binary_dilation(air, iterations=3)
        out[rim] = INK
        # and no islands: keep only the trunk's largest piece (plus anything big)
        lab, n = ndimage.label(out[..., 3] > 40)
        if n > 1:
            sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
            for i, sz in enumerate(sizes, 1):
                # only islands made of rebuilt pixels: anything on show at rest
                # (even through the fur's soft edge) stays
                if sz < 400 and not ((lab == i) & ~arm_hidden).any():
                    out[lab == i] = 0
        drop = arm_hidden & ~(out[..., 3] > 40)
        band = rim
        # 2b. flecks beside the arms: fur and skin bits and thin shards the cut
        #    left round the arm's soft edge. At rest the fur fringe half hides
        #    them; swung off, they read as dirt on the body's side. Anything
        #    there that is fur- or skin-coloured, or not part of the body's
        #    solid mass, goes.
        r_, g_, b_ = (out[..., k].astype(int) for k in range(3))
        mx_ = np.maximum(np.maximum(r_, g_), b_)
        furskin = ((r_ > 170) & (r_ - b_ > 60) & (g_ < 200)) | ((r_ >= g_) & (g_ >= b_) & (mx_ > 40) & (mx_ < 170) & (r_ - b_ > 25))
        fringe = ndimage.binary_dilation(cover_arm, iterations=2) & below_collar
        solid_body = out[..., 3] > 40
        mass = ndimage.binary_opening(solid_body, iterations=3)
        lab_m, n_m = ndimage.label(mass)
        if n_m:
            sizes_m = ndimage.sum(np.ones_like(lab_m), lab_m, range(1, n_m + 1))
            body = ndimage.binary_dilation(lab_m == 1 + int(np.argmax(sizes_m)), iterations=3)
        else:
            body = solid_body
        flecks = solid_body & fringe & (furskin | ~body)
        out[flecks] = 0
        print(cast, "flecks beside the arms", int(flecks.sum()))
        # 3. the apron / dress slivers clean_cast_arms.py took off the forearms
        #    belong to the BODY: pasted back here, onto the trunk, where they sat
        #    — so the apron keeps its drawn edge at rest and the arm no longer
        #    carries it away
        moved = 0
        for name, l in layers.items():
            if "_arm_2_hand" not in name or not (orig / l["file"]).exists():
                continue
            o_im = np.array(Image.open(orig / l["file"]).convert("RGBA"))
            c_a = np.array(Image.open(src / l["file"]).getchannel("A"))
            # everything the forearm lost that does not touch the arm it kept:
            # by POSITION, not colour — the apron's stains are fur-coloured, and
            # the arm's own trimmed fringe lies right against it
            arm_kept = c_a > 40
            sliver = (o_im[..., 3] > 40) & (c_a == 0) & _not_arm(o_im, arm_kept) & _seen(layers, src, orig, l)
            ox, oy = l["x"] - t["x"], l["y"] - t["y"]
            for yy, xx in zip(*np.nonzero(sliver)):
                ty, tx = yy + oy, xx + ox
                if 0 <= ty < h and 0 <= tx < w:
                    out[ty, tx] = o_im[yy, xx]
                    moved += 1
        # the thighs are drawn OVER the trunk, and their tops carry apron colour
        # the cut leaked in; the forearm slivers used to hide it. Wherever a
        # sliver now lies on the trunk, the thigh must not paint over it.
        pasted = np.zeros((h, w), bool)
        for name, l in layers.items():
            if "_arm_2_hand" not in name or not (orig / l["file"]).exists():
                continue
            o_im = np.array(Image.open(orig / l["file"]).convert("RGBA"))
            c_a = np.array(Image.open(src / l["file"]).getchannel("A"))
            arm_kept = c_a > 40
            sl = (o_im[..., 3] > 40) & (c_a == 0) & _not_arm(o_im, arm_kept) & _seen(layers, src, orig, l)
            ox, oy = l["x"] - t["x"], l["y"] - t["y"]
            ys_, xs_ = np.nonzero(sl)
            ok = (ys_ + oy >= 0) & (ys_ + oy < h) & (xs_ + ox >= 0) & (xs_ + ox < w)
            pasted[ys_[ok] + oy, xs_[ok] + ox] = True
        cleared = 0
        for name, l in layers.items():
            if "_leg_0_thigh" not in name:
                continue
            if not (orig / l["file"]).exists():
                (orig / l["file"]).write_bytes((src / l["file"]).read_bytes())
            th = np.array(Image.open(orig / l["file"]).convert("RGBA"))
            ox, oy = l["x"] - t["x"], l["y"] - t["y"]
            hh, ww = th.shape[:2]
            # the pasted mask in this thigh's own frame
            m = np.zeros((hh, ww), bool)
            y0, y1 = max(0, -oy), min(hh, h - oy)
            x0, x1 = max(0, -ox), min(ww, w - ox)
            if y1 > y0 and x1 > x0:
                m[y0:y1, x0:x1] = pasted[y0 + oy:y1 + oy, x0 + ox:x1 + ox]
            cleared += int((m & (th[..., 3] > 0)).sum())
            th[m] = 0
            # slivers that lay past the trunk's own canvas (the apron's corner
            # right at the hand) go onto the thigh, the next layer under the arm
            for an, al in layers.items():
                if "_arm_2_hand" not in an or not (orig / al["file"]).exists():
                    continue
                o_im = np.array(Image.open(orig / al["file"]).convert("RGBA"))
                c_a = np.array(Image.open(src / al["file"]).getchannel("A"))
                sl = (o_im[..., 3] > 40) & (c_a == 0) & _not_arm(o_im, c_a > 40) & _seen(layers, src, orig, al)
                for yy, xx in zip(*np.nonzero(sl)):
                    cy, cx_ = yy + al["y"], xx + al["x"]  # canvas
                    in_trunk = t["x"] <= cx_ < t["x"] + w and t["y"] <= cy < t["y"] + h
                    ty_, tx_ = cy - l["y"], cx_ - l["x"]
                    if not in_trunk and 0 <= ty_ < hh and 0 <= tx_ < ww:
                        th[ty_, tx_] = o_im[yy, xx]
                        cleared += 1
            Image.fromarray(th, "RGBA").save(src / l["file"])
        # a sliver with no layer under it to take it (past the trunk and every
        # thigh) goes back on its forearm: better carried than a hole at rest
        returned = 0
        for an, al in layers.items():
            if "_arm_2_hand" not in an or not (orig / al["file"]).exists():
                continue
            o_im = np.array(Image.open(orig / al["file"]).convert("RGBA"))
            c_im = np.array(Image.open(src / al["file"]).convert("RGBA"))
            sl = (o_im[..., 3] > 40) & (c_im[..., 3] == 0) & _not_arm(o_im, c_im[..., 3] > 40) & _seen(layers, src, orig, al)
            for yy, xx in zip(*np.nonzero(sl)):
                cy, cx_ = yy + al["y"], xx + al["x"]
                placed = t["x"] <= cx_ < t["x"] + w and t["y"] <= cy < t["y"] + h
                for tn_, tl in layers.items():
                    if "_leg_0_thigh" in tn_:
                        ti = Image.open(src / tl["file"])
                        if tl["x"] <= cx_ < tl["x"] + ti.width and tl["y"] <= cy < tl["y"] + ti.height:
                            placed = True
                if not placed:
                    c_im[yy, xx] = o_im[yy, xx]
                    returned += 1
            Image.fromarray(c_im, "RGBA").save(src / al["file"])
        print(cast, "slivers moved onto the trunk", moved, "thigh px", cleared, "returned to the arm", returned)
        Image.fromarray(out, "RGBA").save(src / t["file"])
        print(cast, "dropped", int(drop.sum()), "ink band", int(band.sum()), "trousers", int(legs.sum()))


if __name__ == "__main__":
    main()
