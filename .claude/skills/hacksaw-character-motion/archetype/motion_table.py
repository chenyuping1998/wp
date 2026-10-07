"""Measure an archetype's motion and write it as the GAME's own motion table.

    python archetype/motion_table.py -c 2 --out motion/            # json + ts
    python archetype/motion_table.py -c 2 --sides anatomical       # arm_l = the figure's own left
    python archetype/motion_table.py -c 2 --mirror                 # your art faces the other way

What comes out is MEASUREMENT, not the pack: per game bone, the peak angle a
reaction reaches and how late that bone starts; the snap/hold shape of the
envelope; how far the body lifts and leans; how each arm changes shape (ALONG
the bone vs ACROSS it -- Spine scaleX is along, scaleY is across; reading them
the other way round is the 2026-09-24 bug that made arms look boneless); the
idle's amplitude and period per bone. Those are timings, ratios and
amplitudes -- the craft side of rig/PROVENANCE.md. No keyframe curves, no
vertices, no weights are written out, and the tables drive the game's own
10-bone mesh, not the pack's skeleton.

Angles are converted to the game renderer's convention (y DOWN, so a positive
angle turns clockwise on screen). The pack is y-up; every angle is negated.
"""
import argparse, json, math, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common  # noqa: E402

FPS = 60.0


def series(mp, arch, anim, dur, fn):
    ts = np.arange(0.0, dur + 1e-9, 1.0 / FPS)
    return ts, [fn(common.world(mp, anim, t)) for t in ts]


def role_angle(arch, role):
    m = arch['bones']
    parent = common.game_parent(role)
    b, p = m.get(role), (m.get(parent) if parent else None)

    def f(W):
        if not b or b not in W:
            return 0.0
        a = common.angle(W[b]) - (common.angle(W[p]) if p and p in W else 0.0)
        return -a  # y-up pack -> y-down game
    return f


def unwrap(vals):
    return np.degrees(np.unwrap(np.radians(np.array(vals))))


def axis_lengths(W, bone):
    a, b, c, d = W[bone][:4]
    return math.hypot(a, c), math.hypot(b, d)


def figure_height(mp, arch, anim):
    J, _ = common.joints(mp, arch, anim, 0.0)
    top = J.get('head_top', (0, J['_top_y']))[1]
    feet = min(J.get('hips', (0, J['_ground_y']))[1], J['_ground_y'])
    return max(top - J['_ground_y'], 1.0) if feet is not None else 1.0


def measure_reaction(mp, arch, anim):
    dur = mp.duration(anim)
    H = figure_height(mp, arch, anim)
    roles = [r for r in common.GAME_BONES if arch['bones'].get(r)]
    out = {'anim': anim, 'duration_ms': round(dur * 1000), 'bones': {}}
    peaks = {}
    for r in roles:
        ts, v = series(mp, arch, anim, dur, role_angle(arch, r))
        d = unwrap(v)
        d = d - d[0]
        i = int(np.argmax(np.abs(d)))
        peak = float(d[i])
        if abs(peak) < 0.3:   # below this nothing is visible on screen
            continue
        half = np.nonzero(np.abs(d) >= 0.5 * abs(peak))[0]
        above = np.nonzero(np.abs(d) >= 0.9 * abs(peak))[0]
        peaks[r] = dict(peak=peak, t_half=float(ts[half[0]]), t_in=float(ts[above[0]]),
                        t_out=float(ts[above[-1]]), t_peak=float(ts[i]))
    if not peaks:
        return None
    t0 = min(p['t_half'] for p in peaks.values())
    for r, p in peaks.items():
        out['bones'][r] = [round(p['peak'], 2), round((p['t_half'] - t0) * 1000)]
    # envelope shape, weighted by how much each bone moves
    w = np.array([abs(p['peak']) for p in peaks.values()])
    snap = float(np.dot(w, [p['t_in'] for p in peaks.values()]) / w.sum() / dur)
    hold = float(np.dot(w, [p['t_out'] for p in peaks.values()]) / w.sum() / dur)
    out['snap'] = round(snap, 3)
    out['hold'] = round(max(hold, snap + 0.02), 3)
    # rigid body lift / lean, from the hips joint (moves the whole figure)
    hb = arch['bones'].get('hips') or arch['bones'].get('waist')
    ts, pos = series(mp, arch, anim, dur, lambda W: (W[hb][4], W[hb][5]))
    pos = np.array(pos) - np.array(pos[0])
    i = int(np.argmax(np.abs(pos[:, 1])))
    out['rise'] = round(float(pos[i, 1]) / H, 4)            # + = up
    j = int(np.argmax(np.abs(pos[:, 0])))
    out['lean'] = round(float(pos[j, 0]) / H, 4)            # + = screen right
    # Parallax: bones named *persp* drive mesh edges through weights/constraints
    # rather than moving the skeleton (Miami's "body pushes forward" lives
    # here). Reported as the largest translation, as a fraction of height, so
    # a game can feed it to a push channel or front/back edge weights.
    par = {}
    for n in [b['name'] for b in mp.sk.bones if 'persp' in b['name'].lower()]:
        ts, P = series(mp, arch, anim, dur, lambda W, n=n: (W[n][4], W[n][5]))
        P = np.array(P) - np.array(P[0])
        k = int(np.argmax(np.hypot(P[:, 0], P[:, 1])))
        if np.hypot(*P[k]) / H > 0.002:
            par[n] = [round(float(P[k, 0]) / H, 4), round(float(P[k, 1]) / H, 4), round(float(ts[k]) / dur, 3)]
    out['parallax'] = par
    # shape change per arm bone: along vs across, at its largest deviation
    shape, muscles = {}, {}
    names = {b['name']: b for b in mp.sk.bones}
    for r in ['arm_l', 'fore_l', 'arm_r', 'fore_r']:
        b = arch['bones'].get(r)
        if not b:
            continue
        ts, L = series(mp, arch, anim, dur, lambda W, b=b: axis_lengths(W, b))
        L = np.array(L) / np.array(L[0])
        dev = np.max(np.abs(L - 1.0), axis=1)
        i = int(np.argmax(dev))
        if dev[i] > 0.02:
            shape[r] = [round(float(L[i, 0]), 3), round(float(L[i, 1]), 3)]
        # zero-length leaf children that only drive weights (biceps etc.)
        for n, nb in names.items():
            if nb.get('parent') == b and not nb.get('length'):
                ts, M = series(mp, arch, anim, dur, lambda W, n=n: axis_lengths(W, n))
                M = np.array(M) / np.array(M[0])
                k = int(np.argmax(np.max(np.abs(M - 1.0), axis=1)))
                if np.max(np.abs(M[k] - 1.0)) > 0.02:
                    # flutter: oscillation of the muscle during the hold
                    seg = M[:, 1][(ts >= snap * dur) & (ts <= hold * dur)]
                    flips = int(np.sum(np.diff(np.sign(np.diff(seg))) != 0)) if len(seg) > 3 else 0
                    muscles[n] = dict(role=r, peak=[round(float(M[k, 0]), 3), round(float(M[k, 1]), 3)],
                                      hold_wobble=round(float((seg.max() - seg.min()) / 2), 3) if len(seg) else 0,
                                      hold_turns=flips)
    out['shape'] = shape
    out['muscles'] = muscles
    return out


def measure_idle(mp, arch, anim):
    dur = mp.duration(anim)
    res = {'anim': anim, 'loop_ms': round(dur * 1000), 'bones': {}}
    fns = {r: role_angle(arch, r) for r in common.GAME_BONES if arch['bones'].get(r)}
    # A dangle is a CHAIN; what reads is its tip. Measure every bone in the
    # chain relative to its own parent and keep the loudest (usually the tip).
    kids = {}
    for n in mp.sk.bones:
        kids.setdefault(n.get('parent'), []).append(n['name'])
    par_of = {n['name']: n.get('parent') for n in mp.sk.bones}
    for extra in arch.get('dangles', []):
        chain, stack = [], [extra['bone']]
        while stack:
            b = stack.pop()
            chain.append(b)
            stack.extend(kids.get(b, []))
        best = None
        for b in chain:
            p = par_of.get(b)
            f = (lambda W, b=b, p=p: -(common.angle(W[b]) - (common.angle(W[p]) if p in W else 0.0)))
            ts, v = series(mp, arch, anim, dur, f)
            amp = float((np.ptp(unwrap(v))) / 2)
            if best is None or amp > best[0]:
                best = (amp, f)
        fns[extra['layer']] = best[1]
    tmax = {}
    for r, f in fns.items():
        ts, v = series(mp, arch, anim, dur, f)
        d = unwrap(v)
        amp = float((d.max() - d.min()) / 2)
        if amp < 0.02:
            continue
        x = d - d.mean()
        spec = np.abs(np.fft.rfft(x))
        spec[0] = 0
        k = int(np.argmax(spec))
        period = dur / k if k else dur
        tmax[r] = float(ts[int(np.argmax(x))]) % period
        res['bones'][r] = [round(amp, 3), 0, round(period * 1000), 0.0]
    ref = tmax.get('chest', min(tmax.values()) if tmax else 0.0)
    for r in res['bones']:
        per = res['bones'][r][2] / 1000.0
        res['bones'][r][1] = round(((tmax[r] - ref) % per) * 1000)
    return res


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('-c', '--character', required=True)
    ap.add_argument('--out', default=None)
    ap.add_argument('--sides', choices=['screen', 'anatomical'], default='screen',
                    help="'screen': arm_l is the arm on screen-left (the pack's own naming). "
                         "'anatomical': arm_l is the figure's own left, i.e. screen-right on a front-facing figure.")
    ap.add_argument('--mirror', action='store_true', help='your art is the mirror image of the archetype')
    a = ap.parse_args()
    arch = common.archetype(a.character)
    mp = common.load(arch)
    idle = next((x for x in mp.animations if x.endswith('idle')), None)
    react = next((x for x in mp.animations if x.endswith('reaction') and x.startswith('full')), None) \
        or next((x for x in mp.animations if 'reaction' in x), None)
    result = {'archetype': arch['id'], 'provenance': 'timings, amplitudes and ratios measured from a research-only motion pack; '
              'no keyframes, vertices or weights. Do not ship the pack itself (rig/PROVENANCE.md).',
              'angle_convention': 'degrees, y-down renderer: + turns clockwise on screen',
              'sides': a.sides, 'mirrored': a.mirror,
              'idle': measure_idle(mp, arch, idle) if idle else None,
              'reaction': measure_reaction(mp, arch, react) if react else None}

    def remap(tbl):
        if not tbl:
            return tbl
        flip = a.mirror
        swap = a.mirror != (a.sides == 'anatomical')   # pack _l is screen-left
        out = {}
        for k, v in tbl.items():
            nk = k
            if swap and k[-2:] in ('_l', '_r') and k.split('_')[0] in ('arm', 'fore'):
                nk = k[:-1] + ('r' if k.endswith('l') else 'l')
            if flip and isinstance(v, list) and k in common.GAME_BONES:
                v = [-v[0]] + v[1:]
            out[nk] = v
        return out
    if result['idle']:
        result['idle']['bones'] = remap(result['idle']['bones'])
    if result['reaction']:
        r = result['reaction']
        r['bones'] = remap(r['bones'])
        r['shape'] = remap(r['shape'])
        if a.mirror:
            r['lean'] = -r['lean']
    text = json.dumps(result, ensure_ascii=False, indent=1)
    if not a.out:
        print(text)
        return
    os.makedirs(a.out, exist_ok=True)
    open(os.path.join(a.out, arch['id'] + '.motion-table.json'), 'w').write(text)
    open(os.path.join(a.out, arch['id'] + '.motion-table.ts'), 'w').write(to_ts(result, arch))
    print('wrote', os.path.join(a.out, arch['id'] + '.motion-table.{json,ts}'))


def to_ts(res, arch):
    r, i = res['reaction'], res['idle']
    L = ['/**',
         ' * Motion table measured from the %s archetype (hacksaw-character-motion' % arch['id'],
         ' * archetype/motion_table.py). Timings, amplitudes and ratios ONLY -- the',
         ' * research pack itself never ships (rig/PROVENANCE.md).',
         ' *',
         ' * Degrees, y-down renderer: + turns clockwise on screen. Sides: %s%s.' % (res['sides'], ', mirrored' if res['mirrored'] else ''),
         ' * Shape is [ALONG the bone, ACROSS it] at the peak. Start the game at',
         ' * k = 0.42 and sweep it against the mesh gate on YOUR rig; the reference',
         ' * values are the full-size gesture on a Spine rig with separate limb images.',
         ' */',
         'export const ARCHETYPE = %s;' % json.dumps(arch['id'])]
    if i:
        L.append('export const IDLE_MEASURED = %s; // [amplitudeDeg, lagMs, periodMs, oddScale]' % json.dumps(i['bones']))
        L.append('export const IDLE_LOOP_MS = %d;' % i['loop_ms'])
    if r:
        bones = {k: v for k, v in r['bones'].items()}
        L.append('export const TRIGGER_MEASURED = %s;' % json.dumps(dict(
            bones=bones, durationMs=r['duration_ms'], snap=r['snap'], hold=r['hold'],
            rise=max(r['rise'], 0.0), lean=r['lean'], stretch=0,
            scale=dict(k=0.42, shape=r['shape']) if r['shape'] else None)))
        L.append('// A ladder is a design choice, not a measurement: the same gesture at less size.')
        L.append('export const LADDER = { trigger: 1, winBig: 0.75, win: 0.5 };')
    else:
        L.append('// This archetype has NO reaction animation in the reference -- idle only.')
        L.append('export const TRIGGER_MEASURED = null;')
    return '\n'.join(L) + '\n'


if __name__ == '__main__':
    main()
