"""Cut the free ends of the ninja's ties into meshes of their own (2026-10-17,
user: 「人物腿上腰上後腦的綁帶飄逸效果可以要再做明顯一點，目前看不太出來」).

WHY. The headband tails, the sash ends and the shin ties were painted INTO the
body pieces (head_2_face, torso_0_trunk, the calves), so their flutter was a
weight field inside the body's mesh. A tail swinging there drags the cloth
beside it, and check_ninja_mesh's fold limit capped the gain long before the
motion read (tips travelled 10-16 px). Cut out, each end is its own mesh on its
own two-bone chain, drawn just above the piece it was painted on, and can swing
as far as a tie actually swings.

WHAT IT DOES, per tie (TIES below):
  1. finds the tie's pixels in its piece: red cloth plus its ink outline, inside
     a capsule along the tie's own bones, past the knot
  2. copies them into a new atlas region and builds a grid mesh on it, weighted
     piece-bone -> tie bone -> tie tip bone along the tie's length (the knot end
     pinned, the tip free)
  3. fills the hole left in the piece from its surroundings (premultiplied
     diffusion), so swinging the tie shows hood, tunic or air behind it
  4. removes that tie's bones from the piece's own mesh weights
  5. rewrites the tie bones' `flutter` loop at the larger amplitudes below

Reads the PRISTINE page/atlas (design/source/ninja_reskin/ninja.pre_blink.*)
and the rig as boost_ninja_flow.mjs left it, so it is safe to re-run; it is run
by boost_ninja_flow.mjs, before ninja_blink.py.
"""
import json
import math
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from polish_ninja_motion import local_point, smooth, world_transform  # noqa: E402

APP = HERE.parent
DIR = APP / 'static/assets/spines/goBananinjaMascot'
SRC = APP / 'design/source/ninja_reskin'
JSON = DIR / 'ninja.json'

# tie: (slot, base bone, half-width px, flutter deg base, flutter deg tip, phase)
TIES = {
    'band_lower':        ('head_2_face', 'band_lower', 16, 7.0, 16.0, 0.0),
    'band_upper':        ('head_2_face', 'band_upper', 14, 7.5, 17.0, 0.5),
    'sash_side':         ('torso_0_trunk', 'sash_side', 24, 5.0, 12.0, 1.3),
    'sash_base':         ('torso_0_trunk', 'sash_base', 26, 4.5, 10.0, 1.6),
    'sash_short':        ('torso_0_trunk', 'sash_short', 22, 7.0, 7.0, 2.0),
    'shin_left_outer':   ('left_leg_1_calf', 'shin_left_outer', 12, 9.0, 20.0, 3.1),
    'shin_left_inner':   ('left_leg_1_calf', 'shin_left_inner', 12, 8.0, 18.0, 3.5),
    'shin_right_outer':  ('right_leg_1_calf', 'shin_right_outer', 10, 9.0, 20.0, 3.8),
    'shin_right_inner':  ('right_leg_1_calf', 'shin_right_inner', 10, 8.0, 18.0, 4.2),
}
# bones that hang below a base bone ('sash_base' -> 'sash_tip')
TIP = {'sash_base': 'sash_tip', 'sash_short': None}
PERIOD = 4.8
GRID = 8  # px per mesh cell


def tip_of(base):
    return TIP[base] if base in TIP else base + '_tip'


def wave(amp, phase):
    def value(t):
        a = 2 * math.pi * t / PERIOD
        return amp * (math.sin(a + phase) - math.sin(phase) + 0.2 * (math.sin(2 * a + phase) - math.sin(phase)))

    def speed(t):
        a = 2 * math.pi * t / PERIOD
        return amp * 2 * math.pi / PERIOD * (math.cos(a + phase) + 0.4 * math.cos(2 * a + phase))
    unit = max(abs(value(PERIOD * i / 480)) for i in range(480)) or 1
    keys = []
    for i in range(49):
        t = PERIOD * i / 48
        key = {'time': round(t, 6), 'value': round(value(t) / unit * amp, 6)}
        if i < 48:
            end = t + PERIOD / 48
            dt = (end - t) / 3
            key['curve'] = [round(v, 6) for v in (t + dt, (value(t) + speed(t) * dt) / unit * amp,
                                                    end - dt, (value(end) - speed(end) * dt) / unit * amp)]
        keys.append(key)
    return keys


def decode(att):
    v, c, out = att['vertices'], 0, []
    for _ in range(len(att['uvs']) // 2):
        k = int(v[c]); c += 1
        out.append({int(v[c + 4 * q]): (v[c + 4 * q + 1], v[c + 4 * q + 2], v[c + 4 * q + 3]) for q in range(k)})
        c += 4 * k
    return out


def encode(infl):
    out = []
    for m in infl:
        out.append(len(m))
        for b, (x, y, w) in m.items():
            out += [b, round(x, 4), round(y, 4), round(w, 5)]
    return out


def dilate(m, n):
    for _ in range(n):
        m = m | np.roll(m, 1, 0) | np.roll(m, -1, 0) | np.roll(m, 1, 1) | np.roll(m, -1, 1)
    return m


def diffuse_fill(rgba, hole, iters=220):
    """fill `hole` from its surroundings, premultiplied so air stays air"""
    a = rgba[..., 3:].copy()
    pm = rgba[..., :3] * a
    known = ~hole
    acc = np.dstack([pm, a])
    acc[hole] = 0
    for _ in range(iters):
        nb = (np.roll(acc, 1, 0) + np.roll(acc, -1, 0) + np.roll(acc, 1, 1) + np.roll(acc, -1, 1)) / 4
        acc = np.where(known[..., None], acc, nb)
    out = rgba.copy()
    alpha = acc[..., 3:]
    out[..., :3] = np.where(hole[..., None], acc[..., :3] / np.maximum(alpha, 1e-4), rgba[..., :3])
    out[..., 3:] = np.where(hole[..., None], alpha, rgba[..., 3:])
    return out


def main():
    rig = json.loads(JSON.read_text(encoding='utf-8'))
    atlas = (SRC / 'ninja.pre_blink.atlas').read_text()
    page = np.asarray(Image.open(SRC / 'ninja.pre_blink.png').convert('RGBA'), float) / 255
    bones = rig['bones']
    index = {b['name']: i for i, b in enumerate(bones)}
    T = {b['name']: world_transform(bones, b['name']) for b in bones}
    skin = rig['skins'][0]['attachments']
    # drop a previous run's slots
    rig['slots'] = [s for s in rig['slots'] if not s['name'].endswith('_cut')]
    for name in list(skin):
        if name.endswith('_cut'):
            del skin[name]

    def bounds(name):
        x, y, w, h = map(int, re.search(rf'^{name}\nbounds:(\d+),(\d+),(\d+),(\d+)', atlas, re.M).groups())
        return x, y, w, h

    # where each piece sits in world space: fitted from its own mesh
    placement = {}
    for slot in {t[0] for t in TIES.values()}:
        att = skin[slot][slot]
        infl = decode(att)
        w, h = att['width'], att['height']
        offs = []
        for i, m in enumerate(infl):
            wx = wy = 0
            for b, (x, y, wt) in m.items():
                a, bb, c, d, tx, ty = T[bones[b]['name']]
                wx += wt * (a * x + c * y + tx)
                wy += wt * (bb * x + d * y + ty)
            px, py = att['uvs'][2 * i] * w, att['uvs'][2 * i + 1] * h
            offs.append((wx - px, wy + py))
        offs = np.array(offs)
        assert offs.std(0).max() < 0.5, (slot, offs.std(0))
        placement[slot] = offs.mean(0)  # world = (ox + px, oy - py)

    def to_part(slot, wx, wy):
        ox, oy = placement[slot]
        return wx - ox, oy - wy

    def to_world(slot, px, py):
        ox, oy = placement[slot]
        return ox + px, oy - py

    # ── the pixels of every tie ───────────────────────────────────────────────
    pieces = {}
    by_slot = {}
    for tie, (slot, base, half, *_rest) in TIES.items():
        tip = tip_of(base)
        a, b, c, d, tx, ty = T[base]
        length = bones[index[base]].get('length', 40) + (bones[index[tip]].get('length', 0) if tip else 0)
        root = to_part(slot, tx, ty)
        end = to_part(slot, tx + a * length, ty + b * length)
        by_slot.setdefault(slot, []).append((tie, root, end, half, base, tip))
    for slot, ties in by_slot.items():
        x, y, w, h = bounds(slot)
        part = page[y:y + h, x:x + w].copy()
        r, g, bl, al = (part[..., i] for i in range(4))
        red = (al > 0.3) & (r > 0.24) & (r > 1.55 * g) & (r > 1.4 * bl)
        ink = (al > 0.3) & ((r + g + bl) / 3 < 0.2)
        ys, xs = np.mgrid[0:h, 0:w]
        fields = []
        for tie, root, end, half, base, tip in ties:
            dx, dy = end[0] - root[0], end[1] - root[1]
            L = math.hypot(dx, dy)
            t = ((xs - root[0]) * dx + (ys - root[1]) * dy) / (L * L)
            dist = np.abs((xs - root[0]) * dy - (ys - root[1]) * dx) / L
            fields.append((t, dist))
        dists = np.stack([f[1] for f in fields])
        nearest = dists.argmin(0)
        hole_all = np.zeros((h, w), bool)
        for k, (tie, root, end, half, base, tip) in enumerate(ties):
            t, dist = fields[k]
            zone = (nearest == k) & (t > 0.1) & (t < 1.45) & (dist < half * 1.9)
            core = red & zone
            # grow into the ink outline that belongs to it
            grown = core.copy()
            for _ in range(4):
                g2 = grown | np.roll(grown, 1, 0) | np.roll(grown, -1, 0) | np.roll(grown, 1, 1) | np.roll(grown, -1, 1)
                grown = g2 & (core | (ink & zone) | (red & zone))
            # one more pixel of the tie's own ink goes with it, and the hole is
            # filled two pixels wider than that: a tie's outline left behind on
            # the piece showed as a jagged black edge whenever the tie swung away
            mask = grown | (dilate(grown, 1) & ink & zone)
            if mask.sum() < 40:
                print('skip', tie, 'too few pixels', int(mask.sum()))
                continue
            yy, xx = np.where(mask)
            x0, x1 = max(0, xx.min() - 2), min(w, xx.max() + 3)
            y0, y1 = max(0, yy.min() - 2), min(h, yy.max() + 3)
            crop = part[y0:y1, x0:x1].copy()
            soft = mask[y0:y1, x0:x1].astype(float)
            crop[..., 3] *= soft
            pieces[tie] = dict(slot=slot, crop=crop, x0=x0, y0=y0, root=root, end=end, base=base, tip=tip)
            hole_all |= dilate(mask, 2) & (al > 0.02)
        # the hole, filled, written back into the page
        page[y:y + h, x:x + w] = diffuse_fill(part, hole_all)

    # ── pack the new regions ─────────────────────────────────────────────────
    atlas = re.sub(r'\n\w+_cut\nbounds:[^\n]*\noffsets:[^\n]*\nindex:-1', '', atlas)
    occ = np.zeros(page.shape[:2], bool)
    for bx, by, bw, bh in re.findall(r'bounds:(\d+),(\d+),(\d+),(\d+)', atlas):
        bx, by, bw, bh = map(int, (bx, by, bw, bh))
        occ[max(0, by - 2):by + bh + 2, max(0, bx - 2):bx + bw + 2] = True
    occ |= page[..., 3] > 0
    occ[0:100, 870:1024] = True  # the blink lids (ninja_blink.py) go here
    cx, cy, shelf = 4, 1784, 0
    regions = ''
    for tie, p in pieces.items():
        ch, cw = p['crop'].shape[:2]
        if cx + cw > 1020:
            cx, cy, shelf = 4, cy + shelf + 4, 0
        assert cy + ch < page.shape[0], 'atlas page is full'
        assert not occ[cy:cy + ch, cx:cx + cw].any(), f'{tie} would overlap'
        page[cy:cy + ch, cx:cx + cw] = p['crop']
        p['at'] = (cx, cy)
        regions += f'\n{tie}_cut\nbounds:{cx},{cy},{cw},{ch}\noffsets:0,0,{cw},{ch}\nindex:-1'
        cx += cw + 4
        shelf = max(shelf, ch)
    Image.fromarray((page.clip(0, 1) * 255).astype(np.uint8), 'RGBA').save(DIR / 'ninja.png')
    (DIR / 'ninja.atlas').write_text(atlas.rstrip('\n') + regions + '\n')

    # ── the meshes ───────────────────────────────────────────────────────────
    for tie, p in pieces.items():
        slot, base, tip = p['slot'], p['base'], p['tip']
        parent = next(s for s in rig['slots'] if s['name'] == slot)['bone']
        ch, cw = p['crop'].shape[:2]
        cols, rows = max(2, math.ceil(cw / GRID)), max(2, math.ceil(ch / GRID))
        root, end = p['root'], p['end']
        dx, dy = end[0] - root[0], end[1] - root[1]
        L2 = dx * dx + dy * dy
        uvs, verts, tris = [], [], []
        for r_ in range(rows + 1):
            for c_ in range(cols + 1):
                u, v = c_ / cols, r_ / rows
                px, py = p['x0'] + u * cw, p['y0'] + v * ch
                t = ((px - root[0]) * dx + (py - root[1]) * dy) / L2
                pin = 1 - smooth((t - 0.04) / 0.24)
                free = 1 - pin
                blend = smooth((t - 0.35) / 0.55) if tip else 0
                ws = {parent: pin, base: free * (1 - blend)}
                if tip:
                    ws[tip] = free * blend
                ws = {k: wv for k, wv in ws.items() if wv > 1e-4}
                tot = sum(ws.values())
                wx, wy = to_world(slot, px, py)
                m = {}
                for bn, wv in ws.items():
                    lx, ly = local_point(T[bn], wx, wy)
                    m[index[bn]] = (lx, ly, wv / tot)
                uvs += [u, v]
                verts.append(m)
        for r_ in range(rows):
            for c_ in range(cols):
                a_ = r_ * (cols + 1) + c_
                b_, d_ = a_ + 1, a_ + cols + 1
                tris += [a_, b_, d_ + 1, a_, d_ + 1, d_]
        skin[f'{tie}_cut'] = {f'{tie}_cut': {'type': 'mesh', 'path': f'{tie}_cut', 'width': cw, 'height': ch,
                                              'uvs': uvs, 'vertices': encode(verts), 'triangles': tris}}
        at = next(i for i, s in enumerate(rig['slots']) if s['name'] == slot)
        rig['slots'].insert(at + 1, {'name': f'{tie}_cut', 'bone': parent, 'attachment': f'{tie}_cut'})

    # ── the piece meshes forget the ties that left them ─────────────────────
    cut_bones = {index[p['base']] for p in pieces.values()} | {index[p['tip']] for p in pieces.values() if p['tip']}
    for slot in by_slot:
        att = skin[slot][slot]
        infl = decode(att)
        for m in infl:
            for b in [b for b in m if b in cut_bones]:
                del m[b]
            tot = sum(w for _, _, w in m.values())
            for b, (x, y, w) in list(m.items()):
                m[b] = (x, y, w / tot)
        att['vertices'] = encode(infl)

    # ── a flutter the size a tie actually swings ─────────────────────────────
    flutter = rig['animations']['flutter']['bones']
    for tie, p in pieces.items():
        _, base, _, amp_base, amp_tip, phase = TIES[tie]
        flutter[base] = {'rotate': wave(amp_base, phase)}
        if p['tip']:
            flutter[p['tip']] = {'rotate': wave(amp_tip, phase + 0.65)}

    rig['skeleton']['strapsCut'] = sorted(pieces)
    JSON.write_text(json.dumps(rig, separators=(',', ':')), encoding='utf-8')
    for tie, p in pieces.items():
        print(f"cut {tie}: {p['crop'].shape[1]}x{p['crop'].shape[0]} from {p['slot']} -> atlas {p['at']}")


if __name__ == '__main__':
    main()
