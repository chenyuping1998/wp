"""Tiny Spine 4.3 animation authoring layer for the v6 cast.

Clip.keys(bone, channel, [(t, value, ease), ...]) — ease applies to the segment
that STARTS at that key. Channels: rotate, x, y, scalex, scaley, shearx, sheary.
Values are offsets from the setup pose (scale: multiplier).

Clip.wave(bone, channel, lo, hi, at_hi, delay=0) — a looping sine-shaped swing
between lo and hi, peaking at `at_hi` + `delay` seconds; keys only at the two
extremes (ease-in-out-sine), split exactly at the loop boundary so the cycle
joins without a kink.
"""
import math

EASES = {
  'linear': None,
  'smooth': (0.37, 0.0, 0.63, 1.0),      # ease-in-out-sine
  'soft': (0.25, 0.0, 0.75, 1.0),
  'in': (0.5, 0.0, 0.9, 0.6),           # accelerate into the next key
  'out': (0.1, 0.4, 0.5, 1.0),          # decelerate into the next key
  'snap': (0.15, 0.55, 0.45, 1.0),      # strike: most travel in the first third
  'drive': (0.3, 0.3, 0.55, 1.0),       # trunk behind a strike: firm but no pop
  'backout': (0.2, 0.0, 0.3, 1.0),
  'hold': (0.3, 0.0, 0.7, 1.0),
}
CH = {'rotate': ('rotate', 'value'), 'x': ('translatex', 'value'), 'y': ('translatey', 'value'),
      'scalex': ('scalex', 'value'), 'scaley': ('scaley', 'value'),
      'shearx': ('shearx', 'value'), 'sheary': ('sheary', 'value')}


def _bez(p0, p1, p2, p3, u):
  a = [(1 - u) * p0[i] + u * p1[i] for i in range(2)]
  b = [(1 - u) * p1[i] + u * p2[i] for i in range(2)]
  c = [(1 - u) * p2[i] + u * p3[i] for i in range(2)]
  d = [(1 - u) * a[i] + u * b[i] for i in range(2)]
  e = [(1 - u) * b[i] + u * c[i] for i in range(2)]
  f = [(1 - u) * d[i] + u * e[i] for i in range(2)]
  return a, d, f, e, c


def _ctrl(t0, v0, t1, v1, ease):
  if ease is None or ease == 'linear':
    return (t0 + (t1 - t0) / 3, v0 + (v1 - v0) / 3), (t0 + 2 * (t1 - t0) / 3, v0 + 2 * (v1 - v0) / 3)
  x1, y1, x2, y2 = EASES[ease] if isinstance(ease, str) else ease
  return (t0 + x1 * (t1 - t0), v0 + y1 * (v1 - v0)), (t0 + x2 * (t1 - t0), v0 + y2 * (v1 - v0))


def _split_at_time(p0, p1, p2, p3, t):
  lo, hi = 0.0, 1.0
  for _ in range(60):
    u = (lo + hi) / 2
    x = _bez(p0, p1, p2, p3, u)[2][0]
    lo, hi = (u, hi) if x < t else (lo, u)
  a, d, f, e, c = _bez(p0, p1, p2, p3, (lo + hi) / 2)
  return (p0, a, d, f), (f, e, c, p3)


def eval_seg(p0, p1, p2, p3, t):
  return _split_at_time(p0, p1, p2, p3, t)[0][3][1]


class Clip:
  def __init__(self, name, dur, loop=False):
    self.name, self.dur, self.loop = name, dur, loop
    self.tracks = {}   # (bone, channel) -> list of segments [(p0,p1,p2,p3)] or keys

  def keys(self, bone, channel, keys):
    """keys: [(t, v, ease)] with ease for the segment starting there."""
    keys = sorted(keys, key=lambda k: k[0])
    segs = []
    for (t0, v0, e), (t1, v1, _) in zip(keys, keys[1:]):
      c1, c2 = _ctrl(t0, v0, t1, v1, e)
      segs.append(((t0, v0), c1, c2, (t1, v1)))
    if len(keys) == 1:
      segs.append(((keys[0][0], keys[0][1]),) * 4)
    self.tracks[(bone, channel)] = segs
    return self

  def wave(self, bone, channel, lo, hi, at_hi, delay=0.0, ease='smooth'):
    T = self.dur
    th = (at_hi + delay) % T
    tl = (th + T / 2) % T
    pts = sorted([(th, hi), (tl, lo)])
    # periodic: segments a->b, b->a+T
    (ta, va), (tb, vb) = pts
    s1 = (ta, va), *_ctrl(ta, va, tb, vb, ease), (tb, vb)
    s2 = (tb, vb), *_ctrl(tb, vb, ta + T, va, ease), (ta + T, va)
    # split s2 at T: the part past T moves to the front
    if abs(ta) < 1e-9:
      segs = [s1, s2]
    else:
      left, right = _split_at_time(*s2, T)
      right = tuple((p[0] - T, p[1]) for p in right)
      segs = [right, s1, left]
    self.tracks[(bone, channel)] = segs
    return self

  def add(self, bone, channel, keys):
    """Adds keyed offsets on top of an existing wave/keys track (resampled at
    the union of key times, smooth)."""
    raise NotImplementedError

  def value(self, bone, channel, t):
    for p0, p1, p2, p3 in self.tracks[(bone, channel)]:
      if p0[0] - 1e-9 <= t <= p3[0] + 1e-9:
        if p3[0] - p0[0] < 1e-9: return p0[1]
        return eval_seg(p0, p1, p2, p3, max(t, p0[0] + 1e-9))
    return self.tracks[(bone, channel)][-1][3][1]

  def to_spine(self):
    bones = {}
    for (bone, channel), segs in self.tracks.items():
      name, field = CH[channel]
      out = []
      for p0, p1, p2, p3 in segs:
        k = {'time': round(p0[0], 5), field: round(p0[1], 4)}
        if p3[0] - p0[0] > 1e-9:
          k['curve'] = [round(p1[0], 5), round(p1[1], 4), round(p2[0], 5), round(p2[1], 4)]
        out.append(k)
      last = segs[-1][3]
      out.append({'time': round(last[0], 5), field: round(last[1], 4)})
      if out[0]['time'] == 0: del out[0]['time']
      bones.setdefault(bone, {})[name] = out
    return {'bones': bones}
