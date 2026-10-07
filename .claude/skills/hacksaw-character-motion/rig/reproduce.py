# -*- coding: utf-8 -*-
"""
Run the whole pipeline on the bundled example and check it lands on the same
numbers it landed on here.

    python rig/reproduce.py

This is what makes the package reproducible rather than merely portable. It
starts from the same flattened JPEG the example came from, keys it, rigs it,
attaches the prop, and asserts the measurements. If your Pillow or numpy resamples
differently, or a default gets edited, this says so instead of quietly producing
a slightly different animation.

Every expected value below was measured, not chosen.
"""
from __future__ import print_function
import os
import shutil
import sys
import tempfile

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import skin, motion, dekey, props, check as gate, inspect_art

EX = os.path.join(HERE, 'example')

EXPECT = [
    # (label, value, expected, tolerance)
]


def approx(label, got, want, tol, fails):
    ok = abs(got - want) <= tol
    print('  %s  %-46s %10.3f   expected %.3f +/- %g'
          % ('PASS ' if ok else 'FAIL ', label, got, want, tol))
    if not ok:
        fails.append(label)


def main():
    fails = []
    work = tempfile.mkdtemp(prefix='rigrepro_')
    try:
        src = os.path.join(EX, 'character.jpg')
        png = os.path.join(work, 'character.png')

        print('1. key the background out')
        img, info = dekey.dekey(src)
        img.save(png)
        a = np.asarray(img)[..., 3]
        approx('background share of the image (%)', 100.0 * info['background_px']
               / (info['size'][0] * info['size'][1]), 77.1, 0.5, fails)
        approx('same-colour pixels kept inside the figure',
               info['interior_same_colour'], 7807, 60, fails)
        approx('soft edge (%% of pixels)', 100.0 * ((a > 0) & (a < 255)).mean(),
               4.2, 0.3, fails)

        print('2. inspect the pose')
        r = inspect_art.inspect(png, overlay=False)
        txt = '\n'.join(r.lines)
        ok = 'arms read as CLEAR' in txt
        print('  %s  arms detected as clear of the body' % ('PASS ' if ok else 'FAIL '))
        if not ok:
            fails.append('arm clearance')

        print('3. build the rig')
        im = Image.open(png).convert('RGBA')
        rig = skin.build_rig(im)
        rig, added = skin.add_arm_bones(rig, skin.silhouette(im))
        rig['image'] = 'character.png'
        ok = added == ['arm_l', 'fore_l', 'arm_r', 'fore_r']
        print('  %s  arm bones added: %s' % ('PASS ' if ok else 'FAIL ', added))
        if not ok:
            fails.append('arm bones')
        approx('bones', len(rig['bones']), 10, 0, fails)
        approx('vertices', len(rig['verts']), 697, 0, fails)
        approx('triangles', len(rig['tris']), 1280, 0, fails)
        W = np.asarray(rig['weights'])
        approx('mean bones per vertex', (W > 0.02).sum(1).mean(), 3.57, 0.05, fails)

        print('4. attach the prop')
        prop_img = props.place(os.path.join(EX, 'bat.png'), tuple(rig['size']),
                               (378, 552), 300, 0.0, 0.12)
        props.bleed(prop_img).save(os.path.join(work, 'character_prop_bat.png'))
        props.attach(rig, 'bat', (378, 552), 'fore_r', 'behind', (2.4, 400, 1525, 0.9))
        skin.save_rig(rig, os.path.join(work, 'character.rig.json'))

        print('5. measure the idle')
        v0 = np.asarray(rig['verts'])
        x0, y0, x1, y1 = rig['figure_box']
        FH = y1 - y0
        top = v0[:, 1] < y0 + 0.10 * FH
        foot = v0[:, 1] > y1 - 0.04 * FH
        tris = np.asarray(rig['tris'])

        def areas(v):
            p, q, rr = v[tris[:, 0]], v[tris[:, 1]], v[tris[:, 2]]
            return 0.5 * ((q[:, 0] - p[:, 0]) * (rr[:, 1] - p[:, 1])
                          - (rr[:, 0] - p[:, 0]) * (q[:, 1] - p[:, 1]))
        a0 = areas(v0)
        sh, gr, fl, hm, fm = 1.0, 1.0, 0, 0.0, 0.0
        for i in range(96):
            t = i * (motion.LOOP_MS / 96.0)
            ang = motion.angles(rig['bones'], t)
            v = skin.pose(rig, ang)
            a1 = areas(v)
            ratio = np.abs(a1) / np.maximum(np.abs(a0), 1e-9)
            sh = min(sh, ratio.min()); gr = max(gr, ratio.max())
            fl += int((np.sign(a1) != np.sign(a0)).sum())
            d = v - v0
            hm = max(hm, np.abs(d[top, 0]).max())
            fm = max(fm, np.abs(d[foot, 0]).max())
        approx('idle: triangle flips', fl, 0, 0, fails)
        approx('idle: worst shrink', sh, 0.64, 0.03, fails)
        approx('idle: worst stretch', gr, 1.37, 0.03, fails)
        approx('idle: feet travel (px)', fm, 0.0, 0.01, fails)
        approx('idle: head travel (%% of height)', 100 * hm / FH, 0.78, 0.05, fails)

        print('6. measure the reaction, across 8 trigger phases')
        sh, gr, fl = 1.0, 1.0, 0
        srot, grot = 1.0, 1.0
        peak = None
        for st in range(0, motion.LOOP_MS, motion.LOOP_MS // 8):
            for i in range(40):
                t = st + i * (motion.REACTION_MS / 40.0)
                ang, off, _ = motion.reaction_state(rig['bones'], t, st, rig['figure_box'])
                sc = motion.reaction_scales(rig['bones'], t, st)
                if st == 0 and abs(t - motion.REACTION_MS * 0.4) < 13:
                    peak = sc
                a1 = areas(skin.pose(rig, ang, off, sc))
                ratio = np.abs(a1) / np.maximum(np.abs(a0), 1e-9)
                sh = min(sh, ratio.min()); gr = max(gr, ratio.max())
                fl += int((np.sign(a1) != np.sign(a0)).sum())
                # the same pose with the squash and stretch taken out, to show
                # what that channel actually costs
                a2 = areas(skin.pose(rig, ang, off))
                r2 = np.abs(a2) / np.maximum(np.abs(a0), 1e-9)
                srot = min(srot, r2.min()); grot = max(grot, r2.max())
        approx('reaction: triangle flips', fl, 0, 0, fails)
        approx('reaction: worst shrink', sh, 0.538, 0.02, fails)
        # 1.529 before 2026-09-24, when the squash lengthened the arm along
        # itself (motion.py REACTION_SCALE, axes read the wrong way round);
        # the corrected bulge-across costs 0.01 over rotation alone, not 0.08
        approx('reaction: worst stretch', gr, 1.466, 0.02, fails)
        approx('reaction: worst stretch, rotation only', grot, 1.453, 0.02, fails)
        # scale does not inherit down the chain -- if it did, this is where it
        # would show, as inverted triangles at the far end of a limb
        names = [b['name'] for b in rig['bones']]
        d = dict(zip(names, peak))
        # the reference's gesture, axes corrected 2026-09-24: the driving upper
        # arm keeps its LENGTH and bulges across; the bracing forearm thins
        approx('peak: arm_r keeps its length', d['arm_r'][0], 1.0, 0.001, fails)
        approx('peak: arm_r bulges across the bone', d['arm_r'][1], 1.096, 0.01, fails)
        approx('peak: fore_l thins across the bone', d['fore_l'][1], 0.916, 0.01, fails)
        approx('peak: hips left alone', d['hips'][0], 1.0, 0.0, fails)

        print('7. gate')
        rc = gate.check(os.path.join(work, 'character.rig.json'))
        if rc:
            fails.append('gate')

        print()
        if fails:
            print('%d check(s) did not reproduce: %s' % (len(fails), ', '.join(fails)))
            return 1
        print('everything reproduced')
        return 0
    finally:
        shutil.rmtree(work, ignore_errors=True)


if __name__ == '__main__':
    import sys as _sys
    for _s in (_sys.stdout, _sys.stderr):  # Windows 的管線預設 cp950，agent 讀到會是亂碼
        if hasattr(_s, 'reconfigure'):
            _s.reconfigure(encoding='utf-8', errors='replace')
    sys.exit(main())
