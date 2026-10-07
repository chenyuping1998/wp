"""Shared helpers for the archetype tools: load a motion pack, read world
joint positions, and map the pack's bones onto the 10-bone game skeleton
(root/hips/waist/chest/neck/head/arm_l/fore_l/arm_r/fore_r).

Only STRUCTURE comes out of here -- joint positions, bone directions, timing,
amplitudes, ratios. No mesh outlines, no attachment shapes, no pixels.
That is the line rig/PROVENANCE.md draws, and the reason the brief's pose
guide is a stick figure rather than a silhouette.
"""
import json, math, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SKILL = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(SKILL, 'spineplay'))
import motionlib  # noqa: E402

ARCHETYPES = json.load(open(os.path.join(HERE, 'archetypes.json'), encoding='utf-8'))
GAME_BONES = ['hips', 'waist', 'chest', 'neck', 'head', 'arm_l', 'fore_l', 'arm_r', 'fore_r']


def archetype(key):
    key = str(key)
    for a in ARCHETYPES['archetypes']:
        if key in (str(a['number']), a['id']):
            return a
    raise SystemExit('unknown archetype %r; try --list' % key)


def load(arch):
    return motionlib.MotionPack(os.path.join(SKILL, 'spineplay', 'packs', arch['id'] + '.motion.json'))


def world(mp, anim, t):
    """{bone: (a, b, c, d, wx, wy)} after constraints, Spine space (y up)."""
    mp.pose(anim, t)
    return dict(mp.sk._Bw)


def angle(m):
    return math.degrees(math.atan2(m[2], m[0]))


def local_visible(W, bone, parent):
    """Bone's rotation relative to its game-parent, from WORLD matrices -- so
    IK and transform constraints are included, which is what the eye sees."""
    a = angle(W[bone])
    return a - angle(W[parent]) if parent else a


def game_parent(role):
    return {'hips': None, 'waist': 'hips', 'chest': 'waist', 'neck': 'chest', 'head': 'neck',
            'arm_l': 'chest', 'fore_l': 'arm_l', 'arm_r': 'chest', 'fore_r': 'arm_r'}[role]


def joints(mp, arch, anim, t=0.0):
    """Game-role joint positions in Spine space, plus wrists/tips derived from
    each forearm's length, plus the figure's vertical extent."""
    W = world(mp, anim, t)
    m = arch['bones']
    out = {}
    for role, name in m.items():
        if name and name in W:
            out[role] = (W[name][4], W[name][5])
    blen = {b['name']: b.get('length', 0.0) for b in mp.sk.bones}
    for side in 'lr':
        f = m.get('fore_' + side)
        if f and f in W:
            a, c = W[f][0], W[f][2]
            L = blen.get(f) or 0.0
            out['wrist_' + side] = (W[f][4] + a * L, W[f][5] + c * L)
    h = m.get('head')
    if h and h in W:
        L = blen.get(h) or 0.0
        out['head_top'] = (W[h][4] + W[h][0] * L, W[h][5] + W[h][2] * L)
    for extra in arch.get('props', []) + arch.get('dangles', []):
        b = extra.get('bone')
        if b and b in W:
            out[extra['layer']] = (W[b][4], W[b][5])
    sd = mp.p['skeleton']
    out['_ground_y'] = sd.get('y', 0.0)            # Spine y of the canvas bottom
    out['_top_y'] = sd.get('y', 0.0) + sd.get('height', 0.0)
    return out, W
