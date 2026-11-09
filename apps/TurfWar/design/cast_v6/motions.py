"""v6 cast clips (Turf War). Timing model = Iron Jaw (3-star, Stake):
one 2.0 s idle on a global clock, every limb segment 0.067 s behind the one it
hangs from; reactions = anticipation ~0.3 s, strike ~0.1 s, hold, recover,
played over the running idle and cross-faded back into it.

Signs (Spine, y up; the picture faces +x): positive rotate = counter-clockwise
on screen. Trunk bones point up, so a negative trunk rotation leans toward the
board. upperArmF points down-right: + raises the lead arm forward. foreArmF
local +: folds the lead elbow; − opens it. clavB points left: − lifts the near
shoulder; clavF points right: + lifts the lead shoulder.
"""
from clip import Clip

LAG = 0.067  # per limb segment (Iron Jaw)


def idle(who, T=2.0):
  c = Clip('idle', T, loop=True)
  k = {'mg': 1.0, 'fg': 0.85}[who]           # the Kingpin is heavier and calmer
  dip = 22 * k
  # The settle: hips sink and drift toward the board, then rise back to the
  # drawing (never above it — the planted legs would have to lengthen).
  c.wave('hip', 'y', -dip, 0, at_hi=1.5)
  c.wave('hip', 'x', -4 * k, 7 * k, at_hi=0.55)
  c.wave('hip', 'rotate', 1.0 * k, -1.4 * k, at_hi=0.55)
  c.wave('spine', 'rotate', 1.2 * k, -1.6 * k, at_hi=0.55, delay=LAG)
  c.wave('chest', 'rotate', 1.6 * k, -2.4 * k, at_hi=0.55, delay=2 * LAG)
  # breath: the rib cage lengthens on the rise
  c.wave('chest', 'scalex', 1.0, 1.022, at_hi=1.45, delay=2 * LAG)
  # shoulders ride the breath, a beat behind the chest
  c.wave('clavB', 'rotate', 1.2 * k, -2.6 * k, at_hi=1.5, delay=3 * LAG)
  c.wave('clavF', 'rotate', -1.0 * k, 2.2 * k, at_hi=1.5, delay=3 * LAG)
  # eyes stay on the board: the head undoes most of the trunk's lean and nods
  # slightly into the dip
  c.wave('neck', 'rotate', -0.8 * k, 1.4 * k, at_hi=0.55, delay=3 * LAG)
  c.wave('head', 'rotate', 1.2 * k, -1.2 * k, at_hi=0.6, delay=4 * LAG)
  # guard: fists bob down with the dip and back, segment by segment
  c.wave('upperArmB', 'rotate', -2.5 * k, 3.5 * k, at_hi=1.5, delay=3 * LAG)
  c.wave('foreArmB', 'rotate', -6 * k, 0.5 * k, at_hi=1.5, delay=4 * LAG)  # guard elbow never folds past the drawing
  c.wave('handB', 'rotate', -3 * k, 3 * k, at_hi=1.5, delay=5 * LAG)
  c.wave('upperArmF', 'rotate', -3.0 * k, 3.5 * k, at_hi=1.5, delay=3 * LAG)
  c.wave('foreArmF', 'rotate', 5 * k, -4 * k, at_hi=1.5, delay=4 * LAG)
  c.wave('handF', 'rotate', 4 * k, -4 * k, at_hi=1.5, delay=5 * LAG)
  return c


TRUNK = {'hip', 'spine', 'chest', 'neck', 'head'}  # clavicles move with the arm's timing


# FG's vest armhole is tighter than MG's jacket: the lead upper arm lifts less
# and the clavicle carries more of the reach (a 50 deg lift folded the hidden
# sleeve root at the vest edge)
LIFT = {'mg': 0.84, 'fg': 0.78}
CLAV = {'mg': 1.3, 'fg': 1.35}
# MG's lead elbow is drawn folded into a bunched sleeve: extending it the full
# ~90 deg drives the cuff into that bunch (the back of the elbow folds)
EXT = {'mg': 0.7, 'fg': 0.74}


def beats(c, ts, kinds, tracks, who='mg'):
  """Keys every track on shared beats. kinds[i] tells how the segment that
  ENDS at beat i moves: 'load' (smooth), 'strike' (arm snaps; the trunk drives
  a little earlier and lands a little later), 'settle' (decelerate), 'rest'.
  The last beat is the clip end (rest pose)."""
  ease_for = {'load': 'smooth', 'settle': 'out', 'rest': 'smooth', 'hold': 'smooth'}
  for (bone, ch), vals in tracks.items():
    if (bone, ch) == ('upperArmF', 'rotate'):
      vals = [v * LIFT[who] if v > 0 else v for v in vals]
    if (bone, ch) == ('clavF', 'rotate'):
      vals = [v * CLAV[who] if v > 0 else v for v in vals]
    if (bone, ch) == ('foreArmF', 'rotate'):
      vals = [v * EXT[who] if v < -40 else v for v in vals]
    trunk = bone in TRUNK
    keys = []
    for i, (t, v) in enumerate(zip(ts, vals)):
      nxt = kinds[i + 1] if i + 1 < len(kinds) else 'rest'
      if nxt == 'strike':
        ease = 'drive' if trunk else 'snap'
      else:
        ease = ease_for[nxt]
      tt = t
      if trunk and i + 1 < len(ts):
        prev = kinds[i - 1] if i > 0 else 'rest'
        if kinds[i] == 'strike' or (prev == 'strike' and kinds[i] in ('settle', 'hold')):
          tt = t + 0.04        # the trunk lands after the fist, and settles after it
        elif nxt == 'strike' and i > 0 and t - ts[i - 1] > 0.12:
          tt = t - 0.03        # ...and starts before it
      keys.append((tt, v, ease))
    c.keys(bone, ch, keys)
  return c


def jab(who):
  """Small win: one sharp lead jab. 0.30 load, 0.10 strike, hold, recover."""
  c = Clip('jab', 0.95)
  ts = [0, 0.30, 0.40, 0.56, 0.95]
  kinds = ['rest', 'load', 'strike', 'hold', 'rest']
  return beats(c, ts, kinds, who=who, tracks={
    ('hip', 'x'): [0, -10, -1, -1, 0],
    ('hip', 'y'): [0, -10, -8, -8, 0],
    ('hip', 'rotate'): [0, 2.0, -2.4, -2.0, 0],
    ('spine', 'rotate'): [0, 2.0, -2.6, -2.2, 0],
    ('chest', 'rotate'): [0, 3.0, -2.0, -1.7, 0],
    ('clavF', 'rotate'): [0, -4, 4, 3, 0],
    ('clavB', 'rotate'): [0, 1.5, -2.5, -2, 0],
    ('upperArmF', 'rotate'): [0, -6, 40, 37, 0],
    ('foreArmF', 'rotate'): [0, -3, -92, -86, 0],
    ('foreArmF', 'scalex'): [1, 1, 1.03, 1.02, 1],
    ('handF', 'rotate'): [0, 4, -10, -9, 0],
    ('upperArmB', 'rotate'): [0, 3, 5, 4, 0],
    ('foreArmB', 'rotate'): [0, -2, -4, -3, 0],
    ('neck', 'rotate'): [0, -1.5, 1.5, 1.2, 0],
    ('head', 'rotate'): [0, -2.0, 2.0, 1.6, 0],
  })


def combo(who):
  """Big win: double jab, then a rising lead uppercut held a beat."""
  c = Clip('combo', 1.7)
  ts = [0, 0.22, 0.31, 0.44, 0.52, 0.62, 0.84, 0.95, 1.22, 1.7]
  kinds = ['rest', 'load', 'strike', 'settle', 'strike', 'settle', 'load', 'strike', 'hold', 'rest']
  return beats(c, ts, kinds, who=who, tracks={
    ('hip', 'x'):        [0, -8, 3, 0, 3, 0, -6, 8, 6, 0],
    ('hip', 'y'):        [0, -8, -7, -6, -7, -8, -22, -4, -5, 0],
    ('hip', 'rotate'):   [0, 1.5, -2.2, -0.6, -2.4, 0, 2.2, -1.5, -1.2, 0],
    ('spine', 'rotate'): [0, 1.5, -2.4, -0.8, -2.6, 0, 2.5, -2.0, -1.6, 0],
    ('chest', 'rotate'): [0, 2.5, -2.4, -0.8, -2.6, 0, 4.0, -2.5, -2.0, 0],
    ('clavF', 'rotate'): [0, -3, 4, 1, 4, -2, -6, 12, 10, 0],
    ('clavB', 'rotate'): [0, 1, -2, 0, -2, 0, 2, -3, -2.5, 0],
    ('upperArmF', 'rotate'): [0, -5, 39, 8, 41, -3, -7, 66, 62, 0],
    ('foreArmF', 'rotate'): [0, -3, -90, -20, -92, -2, -3, -22, -20, 0],
    ('foreArmF', 'scalex'): [1, 1, 1.03, 1.0, 1.03, 1, 1, 1.02, 1.01, 1],
    ('handF', 'rotate'): [0, 3, -10, -3, -10, 3, 6, 10, 8, 0],
    ('upperArmB', 'rotate'): [0, 3, 5, 3, 5, 3, 4, 6, 5, 0],
    ('foreArmB', 'rotate'): [0, -2, -4, -2, -4, -2, -3, -5, -4, 0],
    ('neck', 'rotate'): [0, -1.5, 1.5, 0, 1.5, 0, -2.5, 3, 2.5, 0],
    ('head', 'rotate'): [0, -1.5, 2, 0, 2, 0, -3, 4, 3.5, 0],
  })


def celebrate(who):
  """Feature trigger: drop, then explode up — lead fist punched up and out
  twice (clear of the head), chest out, chin up; the guard fist pulls in."""
  c = Clip('celebrate', 2.1)
  ts = [0, 0.30, 0.46, 0.62, 0.80, 0.98, 1.16, 1.55, 2.1]
  kinds = ['rest', 'load', 'strike', 'settle', 'strike', 'settle', 'strike', 'hold', 'rest']
  return beats(c, ts, kinds, who=who, tracks={
    ('hip', 'y'):        [0, -24, -2, -9, -3, -9, -3, -4, 0],
    ('hip', 'x'):        [0, -6, 6, 4, 6, 4, 6, 5, 0],
    ('hip', 'rotate'):   [0, -2.5, 2.0, 1.2, 2.0, 1.2, 2.0, 1.6, 0],
    ('spine', 'rotate'): [0, -2.5, 2.5, 1.6, 2.5, 1.6, 2.5, 2.0, 0],
    ('chest', 'rotate'): [0, -3, 4, 2.5, 4, 2.5, 4, 3, 0],
    ('chest', 'scalex'): [1, 0.99, 1.03, 1.02, 1.03, 1.02, 1.03, 1.025, 1],
    ('clavF', 'rotate'): [0, -4, 14, 9, 14, 9, 14, 12, 0],
    ('clavB', 'rotate'): [0, 2, 3, 3, 3, 3, 3, 3, 0],
    ('upperArmF', 'rotate'): [0, -6, 62, 50, 64, 50, 64, 60, 0],
    ('foreArmF', 'rotate'): [0, -3, -34, -22, -36, -22, -36, -32, 0],
    ('handF', 'rotate'): [0, 4, -6, -2, -6, -2, -6, -5, 0],
    ('upperArmB', 'rotate'): [0, 4, 12, 12, 12, 12, 12, 11, 0],
    ('foreArmB', 'rotate'): [0, -2, -14, -12, -14, -12, -14, -12, 0],
    ('handB', 'rotate'): [0, 2, -6, -6, -6, -6, -6, -5, 0],
    ('neck', 'rotate'): [0, -3, 4, 3, 4, 3, 4, 3.5, 0],
    ('head', 'rotate'): [0, -3, 6, 4, 6, 4, 6, 5, 0],
  })


def rom(who):
  """QA only: each joint to its extreme in turn (not shipped)."""
  c = Clip('rom', 8.0)
  seq = [('upperArmF', 'rotate', 100), ('foreArmF', 'rotate', -95), ('upperArmB', 'rotate', 20),
         ('foreArmB', 'rotate', -30), ('head', 'rotate', 10), ('chest', 'rotate', -8), ('hip', 'y', -40), ('clavF', 'rotate', 15)]
  for i, (b, ch, v) in enumerate(seq):
    ks = [(0, 0, 'smooth')] + ([(i, 0, 'smooth')] if i else []) + [(i + 0.5, v, 'smooth'), (i + 1, 0, 'linear')]
    if i + 1 < 8: ks.append((8, 0, 'linear'))
    c.keys(b, ch, ks)
  return c


CLIPS = [idle, jab, combo, celebrate, rom]
