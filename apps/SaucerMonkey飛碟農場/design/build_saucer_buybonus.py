"""Buy Bonus plate (2026-10-17, plan S-B): the abducted cow clinging to the
sign, cut from the approved intro master intro_receipt_cow_v2.png so the art is
the one the user already signed off. Removes the captain's hand, the remote's
signal arcs and the ground; the beam fades out at its foot.

Then the button's frames, posed like a mesh: a smooth displacement field made
of weighted rotations (head, tail, each hind leg, the ship) sampled backwards,
so nothing tears. THE SIGN HAS NO WEIGHT and never moves: the shared button
typesets BUY BONUS / PLAY BONUS / DISABLE (and every translation) on top of
it, so the board under the words must stay put.

  rest      the plate
  off       beam down, for the disabled (spinning) state
  idle_*    one beat every few seconds (BuyBonusCow.svelte): the beam flickers,
            the ship dips, the cow looks up and kicks once, the tail flicks
  hover_*   once under the pointer, holding the last: the ship's lamps run
            left to right, the beam comes up, the cow kicks twice
  press_*   the tractor beam yanks: beam flare, ship lurches, legs flail

    python design/build_saucer_buybonus.py
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

APP = Path(__file__).resolve().parents[1]
SRC = APP / "design/source/saucer/intro/intro_receipt_cow_v2.png"
OUT = APP / "design/source/saucer/buybonus"
RUNTIME = APP / "static/assets/sprites/sushiUi/buybonus_cow"
BOX = (420, 0, 1560, 950)          # on the master
# erased regions on the master (x0, y0, x1, y1)
ERASE = [
    (420, 420, 612, 660),          # the captain's hand and remote
    (588, 368, 714, 506),          # the remote's signal arcs
    (420, 600, 520, 950),          # the captain's boot
]
GROUND = (420, 862, 945, 950)      # rocks and grass: erased except the beam
BEAM_FADE = (760, 905)             # beam pixels fade out between these y


def build():
    im = np.asarray(Image.open(SRC).convert("RGBA")).astype(np.float32)
    h, w = im.shape[:2]
    a = im[..., 3]
    for x0, y0, x1, y1 in ERASE:
        a[y0:y1, x0:x1] = 0
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    beam = (g > r + 35) & (g > b + 35) & (g > 150)   # bright: dark grass is not beam
    gx0, gy0, gx1, gy1 = GROUND
    ground = np.zeros_like(beam)
    ground[gy0:gy1, gx0:gx1] = True
    a[ground & ~beam] = 0
    yy = np.arange(h, dtype=np.float32)[:, None].repeat(w, 1)
    k = np.clip((yy - BEAM_FADE[0]) / (BEAM_FADE[1] - BEAM_FADE[0]), 0, 1)
    k = k * k * (3 - 2 * k)
    a[beam] *= 1 - k[beam]
    # anything left under the fade line that is not cow is debris
    a[(yy > BEAM_FADE[1]) & beam] = 0
    im[..., 3] = a
    out = Image.fromarray(im.round().astype(np.uint8)).crop(BOX)
    out = out.crop(out.getchannel("A").getbbox())
    OUT.mkdir(parents=True, exist_ok=True)
    out.save(OUT / "cow_sign_cutout.png")
    return out


# ── the rig, measured on cow_sign_cutout.png (1132 x 950) ─────────────────────
SIZE = 384                         # runtime px: the 151 css px plate at DPR ~2.5
HEAD = dict(pivot=(615, 492), box=(470, 290, 810, 500), ramp=(500, 440))   # 0 at y500, 1 at y440
TAIL = dict(pivot=(408, 505), box=(330, 390, 440, 512))
LEGL = dict(pivot=(532, 800), box=(470, 795, 610, 950), top=802)
LEGR = dict(pivot=(672, 792), box=(615, 785, 790, 950), top=794)
SHIP = dict(pivot=(566, 250), ramp=(336, 410))                     # rigid down to the emitter's lip (y336); only the beam stretches below
LAMPS = [(160, 250), (300, 660), (690, 820)]                       # x spans: left lamp, emitter, right lamp


def smooth(v):
    v = np.clip(v, 0, 1)
    return v * v * (3 - 2 * v)


def box_weight(xx, yy, box, soft):
    x0, y0, x1, y1 = box
    return (smooth((xx - x0) / soft) * smooth((x1 - xx) / soft) *
            smooth((yy - y0) / soft) * smooth((y1 - yy) / soft))


class Rig:
    def __init__(self, cut):
        im = np.asarray(cut).astype(np.float32)
        self.h, self.w = im.shape[:2]
        # premultiplied, so transparent edges do not bleed dark when sampled
        self.pm = im.copy()
        self.pm[..., :3] *= self.pm[..., 3:4] / 255
        yy, xx = np.mgrid[0:self.h, 0:self.w].astype(np.float32)
        self.xx, self.yy = xx, yy
        r, g, b, a = (im[..., i] for i in range(4))
        green = (g > r + 35) & (g > b + 35) & (g > 150) & (a > 0)
        self.beam = green & (yy >= 318)
        self.lamps = [green & (yy < 345) & (yy > 240) & (xx >= x0) & (xx < x1) for x0, x1 in LAMPS]
        hr0, hr1 = HEAD['ramp']
        hw = box_weight(xx, yy, HEAD['box'], 30) * smooth((hr0 - yy) / (hr0 - hr1))
        tw = box_weight(xx, yy, TAIL['box'], 14) * smooth(np.hypot(xx - TAIL['pivot'][0], yy - TAIL['pivot'][1]) / 40)
        lw = box_weight(xx, yy, LEGL['box'], 16) * smooth((yy - LEGL['top']) / 26)
        rw = box_weight(xx, yy, LEGR['box'], 16) * smooth((yy - LEGR['top']) / 26)
        sw = smooth((SHIP['ramp'][1] - yy) / (SHIP['ramp'][1] - SHIP['ramp'][0]))
        self.parts = [('head', HEAD['pivot'], hw), ('tail', TAIL['pivot'], tw),
                      ('legL', LEGL['pivot'], lw), ('legR', LEGR['pivot'], rw), ('ship', SHIP['pivot'], sw)]

    def disp(self, pose, x, y):
        dx = np.zeros_like(x)
        dy = np.zeros_like(y)
        for name, (cx, cy), wgt in self.parts:
            ang, tx, ty = pose.get(name, (0, 0, 0))
            if not (ang or tx or ty):
                continue
            th = np.radians(ang)
            c, s = np.cos(th), np.sin(th)
            px, py = x - cx, y - cy
            # image y is down: a positive angle turns clockwise on screen
            dx += wgt * (c * px - s * py + cx + tx - x)
            dy += wgt * (s * px + c * py + cy + ty - y)
        return dx, dy

    def sample(self, sx, sy):
        x0 = np.clip(np.floor(sx).astype(int), 0, self.w - 2)
        y0 = np.clip(np.floor(sy).astype(int), 0, self.h - 2)
        fx = np.clip(sx - x0, 0, 1)[..., None]
        fy = np.clip(sy - y0, 0, 1)[..., None]
        pm = self.pm
        top = pm[y0, x0] * (1 - fx) + pm[y0, x0 + 1] * fx
        bot = pm[y0 + 1, x0] * (1 - fx) + pm[y0 + 1, x0 + 1] * fx
        out = top * (1 - fy) + bot * fy
        inside = ((sx >= 0) & (sx <= self.w - 1) & (sy >= 0) & (sy <= self.h - 1))[..., None]
        out = out * inside
        al = out[..., 3:4]
        out[..., :3] = np.where(al > 0, out[..., :3] * 255 / np.maximum(al, 1e-6), 0)
        return out

    def mask_at(self, m, sx, sy):
        xi = np.clip(np.round(sx).astype(int), 0, self.w - 1)
        yi = np.clip(np.round(sy).astype(int), 0, self.h - 1)
        return m[yi, xi]

    def pose(self, pose):
        x, y = self.xx, self.yy
        dx, dy = self.disp(pose, x, y)
        # one fixed-point step toward the true inverse of the forward field
        dx, dy = self.disp(pose, x - dx, y - dy)
        sx, sy = x - dx, y - dy
        out = self.sample(sx, sy)
        # light: the beam and the ship's lamps, by gain (1 = as drawn)
        out = glow(out, self.mask_at(self.beam, sx, sy), pose.get('beam', 1.0))
        for i, lamp in enumerate(self.lamps):
            out = glow(out, self.mask_at(lamp, sx, sy), pose.get('lamps', [1.0] * 3)[i])
        return Image.fromarray(np.clip(out, 0, 255).round().astype(np.uint8))


def glow(out, mask, gain):
    if gain == 1:
        return out
    o = out.copy()
    if gain > 1:
        k = gain - 1
        o[mask, :3] = o[mask, :3] * (1 + 0.12 * k) + np.array([30, 95, 35]) * k
    else:
        k = 1 - gain
        lum = o[mask, :3].mean(-1, keepdims=True)
        o[mask, :3] = (o[mask, :3] * (1 - 0.55 * k) + lum * 0.25 * k) * (1 - 0.35 * k)
    return o


def square(im):
    """the plate is drawn square: pad the art top and bottom, then scale"""
    w, h = im.size
    s = max(w, h)
    sq = Image.new('RGBA', (s, s))
    sq.alpha_composite(im, ((s - w) // 2, (s - h) // 2))
    return sq.resize((SIZE, SIZE), Image.Resampling.LANCZOS)


# ── the beats ────────────────────────────────────────────────────────────────
def key(t, pts):
    """smoothstep through (t, value) keys"""
    if t <= pts[0][0]:
        return pts[0][1]
    for (t0, v0), (t1, v1) in zip(pts, pts[1:]):
        if t <= t1:
            u = (t - t0) / (t1 - t0)
            u = u * u * (3 - 2 * u)
            return v0 + (v1 - v0) * u
    return pts[-1][1]


def kick(t, t0, amp, ln=0.18):
    """one kick: out, back past rest a little, home"""
    return amp * key(t, [(t0, 0), (t0 + ln * 0.4, 1), (t0 + ln * 0.75, -0.3), (t0 + ln, 0)])


def idle(t):          # 0..0.62 s, then still
    return {
        'beam': key(t, [(0, 1), (0.06, 1.45), (0.12, 1.05), (0.18, 1.5), (0.4, 1.15), (0.62, 1)]),
        'ship': (0, 0, key(t, [(0, 0), (0.12, 7), (0.3, -5), (0.48, 1.5), (0.62, 0)])),
        'head': (key(t, [(0, 0), (0.16, -5), (0.42, -5), (0.62, 0)]), 0, 0),
        'tail': (key(t, [(0, 0), (0.1, 14), (0.24, -8), (0.38, 4), (0.55, 0)]), 0, 0),
        'legL': (kick(t, 0.14, 13, 0.24), 0, 0),
        'legR': (-kick(t, 0.24, 13, 0.24), 0, 0),
    }


def hover(t):         # 0..0.35 s, the last frame held
    def lamp(t0):
        return key(t, [(t0, 1), (t0 + 0.05, 1.9), (t0 + 0.14, 1.35)])
    return {
        'beam': key(t, [(0, 1), (0.2, 1.4)]),
        'lamps': [lamp(0.0), lamp(0.08), lamp(0.16)],
        'ship': (0, 0, key(t, [(0, 0), (0.12, -5), (0.35, -3)])),
        'head': (key(t, [(0, 0), (0.15, -4), (0.35, -2.5)]), 0, 0),
        'tail': (key(t, [(0, 0), (0.08, 12), (0.2, -6), (0.35, 3)]), 0, 0),
        'legL': (kick(t, 0.02, 14, 0.16) + kick(t, 0.18, 9, 0.16), 0, 0),
        'legR': (-kick(t, 0.1, 14, 0.16) - kick(t, 0.26, 9, 0.09), 0, 0),
    }


def press(t):         # 0..0.4 s, ending on the hover hold
    return {
        'beam': key(t, [(0, 1.4), (0.05, 1.85), (0.2, 1.6), (0.4, 1.4)]),
        'lamps': [key(t, [(0, 1.35), (0.05, 2.0), (0.4, 1.35)])] * 3,
        'ship': (key(t, [(0, 0), (0.06, -2), (0.16, 1.5), (0.3, 0)]), 0, key(t, [(0, -3), (0.06, -9), (0.2, 2), (0.4, -3)])),
        'head': (key(t, [(0, -2.5), (0.07, -8), (0.25, 1), (0.4, -2.5)]), 0, 0),
        'tail': (key(t, [(0, 3), (0.06, 20), (0.18, -10), (0.3, 5), (0.4, 3)]), 0, 0),
        'legL': (key(t, [(0, 0), (0.07, 20), (0.2, -7), (0.32, 3), (0.4, 0)]), 0, 0),
        'legR': (key(t, [(0, 0), (0.07, -20), (0.2, 7), (0.32, -3), (0.4, 0)]), 0, 0),
    }


FPS = 25
SEQ = {'idle': (idle, 0.62), 'hover': (hover, 0.35), 'press': (press, 0.4)}


def save(im, name):
    # 256 colours: indistinguishable at the button's size and a fifth of the
    # bytes (37 frames ~1.2 MB instead of ~6 MB)
    q = im.quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG)
    q.save(RUNTIME / f'{name}.png', optimize=True)


def frames(cut):
    rig = Rig(cut)
    RUNTIME.mkdir(parents=True, exist_ok=True)
    counts = {}
    save(square(rig.pose({})), 'rest')
    save(square(rig.pose({'beam': 0.45, 'lamps': [0.5, 0.5, 0.5]})), 'off')
    for name, (fn, dur) in SEQ.items():
        n = max(2, round(dur * FPS))
        counts[name] = n
        for i in range(1, n + 1):
            save(square(rig.pose(fn(dur * i / n))), f'{name}_{i}')
    (RUNTIME / 'frames.json').write_text(json.dumps({'fps': FPS, **counts}), encoding='utf-8')
    # the frame counts the game plays (src/game/buyBonusCow.ts)
    (APP / 'src/game/buyBonusCowFrames.json').write_text(json.dumps({'fps': FPS, **counts}) + '
', encoding='utf-8')
    return counts


if __name__ == "__main__":
    o = build()
    print("cutout", o.size)
    print("frames", frames(o))
