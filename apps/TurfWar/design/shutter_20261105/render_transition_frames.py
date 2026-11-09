"""Offline key frames of TransitionAnimation.svelte at 1280x720 (same maths)."""
import math
from pathlib import Path
from PIL import Image
HERE = Path(__file__).resolve().parent; APP = HERE.parent.parent
FX = APP / 'static/assets/sprites/turfFx'
W, H = 1280, 720
L = Image.open(FX / 'shutter_l.png').convert('RGBA'); R = Image.open(FX / 'shutter_r.png').convert('RGBA')
LOCK = Image.open(FX / 'lock.png').convert('RGBA')
bg = Image.open(APP / 'static/assets/sprites/turfBackground/bg_base.png').convert('RGBA').resize((W, H))
CLOSE, LOCKMS, HOLD, OPEN = 460, 340, 520, 780
LOCK_AT, HOLD_AT = CLOSE, CLOSE + LOCKMS; OPEN_AT = HOLD_AT + HOLD
c01 = lambda t: min(1, max(0, t)); eoc = lambda t: 1 - (1 - c01(t)) ** 3; eic = lambda t: c01(t) ** 3
def frame(e):
    off = 0
    if e < LOCK_AT: gap = 1 - eic(e / CLOSE); swing = 0; drop = 1
    elif e < OPEN_AT:
        gap = 0; t = (e - LOCK_AT) / LOCKMS
        drop = 1 - eoc(c01(t * 1.6)); swing = 0.2 * math.sin(c01(t * 0.9) * math.pi * 3) * math.exp(-c01(t) * 2.6)
    else:
        p = (e - OPEN_AT) / OPEN; q = c01((p - 0.25) / 0.62); gap = q * q * (3 - 2 * q); drop = 0
        swing = -0.16 * math.sin(c01(p / 0.3) * math.pi * 2) * (1 - c01(p / 0.3))
        off = eic(c01((p - 0.08) / 0.24))
    since = e - LOCK_AT
    bounce = math.sin(since / 300 * math.pi * 2) * math.exp(-since / 110) if 0 <= since < 300 else 0
    seal = 1 - gap if LOCK_AT <= e < OPEN_AT + OPEN * 0.4 else 0
    s = max(W / 2 / 1024, H / 1536); dw, dh = int(1024 * s), int(1536 * s)
    cx = W / 2; cy = H / 2 - gap * ((H + dh) / 2) * 1.04 - bounce * H * 0.03
    img = bg.copy()
    travel = W * 0.62
    for door, sign in ((L, -1), (R, 1)):
        d = door.resize((dw, dh))
        rot = 0; dx = 0
        if rot: d = d.rotate(-math.degrees(rot), expand=True, resample=Image.BICUBIC)
        x = cx + dx - (d.width if sign < 0 else 0); y = cy - d.height / 2
        img.alpha_composite(d, (int(x), int(y)))
    from PIL import ImageDraw
    seam = Image.new('RGBA', (W, H)); g = ImageDraw.Draw(seam)
    for hw, al in ():
        g.rectangle((cx - hw, cy - dh / 2, cx + hw, cy + dh / 2), fill=(0, 0, 0, int(255 * al)))
    img.alpha_composite(seam)
    if seal > 0.01:
        size = int(min(H * 0.32, W * 0.42)); lk = LOCK.resize((size, size))
        # anchor (0.5, 0.08) at (cx, cy - 0.42 size - drop*0.16 size), rotate about it
        ax, ay = size * 0.5, size * 0.08
        canvas = Image.new('RGBA', (size * 3, size * 3)); canvas.alpha_composite(lk, (int(size * 1.5 - ax), int(size * 1.5 - ay)))
        canvas = canvas.rotate(-math.degrees(swing + off * 0.5), center=(size * 1.5, size * 1.5), resample=Image.BICUBIC)
        a = min(1, seal * 1.6) * (1 - off); canvas.putalpha(canvas.getchannel('A').point(lambda v: int(v * a)))
        px, py = cx, cy - size * 0.42 - drop * size * 0.16 + off * H * 0.55
        img.alpha_composite(canvas, (int(px - size * 1.5), int(py - size * 1.5)))
    return img.convert('RGB')
labels = [(230, 'falling'), (470, 'slam'), (560, 'lock swing'), (1100, 'held shut'), (OPEN_AT + 150, 'unhook'), (OPEN_AT + 450, 'rolling up')]
tiles = [frame(e).resize((640, 360)) for e, _ in labels]
sheet = Image.new('RGB', (1280, 360 * 3))
for i, t in enumerate(tiles): sheet.paste(t, ((i % 2) * 640, (i // 2) * 360))
sheet.save(HERE / 'transition_frames_1280.jpg', quality=88)
frame(1100).save(HERE / 'transition_held_1280.jpg', quality=90)
print('ok')
