"""Draw design/bg_alive/preview.mjs frames over the plate (additive sprites
added, tinted by multiply), 960 wide per frame, two columns."""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

APP = Path(__file__).resolve().parents[2]
TEX = {
    'fxGlow': 'static/assets/sprites/goBananasFx/fx_glow.png',
    'fxStar': 'static/assets/sprites/goBananasFx/fx_star.png',
    'gbPotionVapor': 'static/assets/sprites/goBanalchemyFx/potion_vapor.png',
    'bgFog0': 'static/assets/sprites/goBanalchemyLight/fog_0.png',
    'bgFog1': 'static/assets/sprites/goBanalchemyLight/fog_1.png',
    'bgFog2': 'static/assets/sprites/goBanalchemyLight/fog_2.png',
}
PLATE = {'base': 'bg_base.jpg', 'feature': 'bg_feature.jpg'}
W, H = 960, 540
K = W / 1920

data = json.loads(Path(sys.argv[1]).read_text())
plate = np.asarray(Image.open(APP / 'static/assets/sprites/goBanalchemyBackground' / PLATE[data['scene']]).convert('RGB').resize((W, H), Image.LANCZOS)).astype(np.float32) / 255
cache = {}
tiles = []
for fr in data['frames']:
    img = plate.copy()
    for s in fr['sprites']:
        w, h = max(1, round(s['w'] * K)), max(1, round(s['h'] * K))
        if s['alpha'] <= 0.005:
            continue
        key = (s['key'], w, h, round(s['rot'], 2))
        if key not in cache:
            t = Image.open(APP / TEX[s['key']]).convert('RGBA').resize((w, h), Image.LANCZOS).rotate(-np.degrees(s['rot']), expand=True)
            cache[key] = np.asarray(t).astype(np.float32) / 255
        t = cache[key]
        th, tw = t.shape[:2]
        x0, y0 = round(s['x'] * K - tw / 2), round(s['y'] * K - th / 2)
        xa, ya, xb, yb = max(0, x0), max(0, y0), min(W, x0 + tw), min(H, y0 + th)
        if xa >= xb or ya >= yb:
            continue
        sub = t[ya - y0:yb - y0, xa - x0:xb - x0]
        tint = np.array([(s['tint'] >> 16) & 255, (s['tint'] >> 8) & 255, s['tint'] & 255], np.float32) / 255
        rgb, a = sub[..., :3] * tint, sub[..., 3:] * s['alpha']
        if s['add']:
            img[ya:yb, xa:xb] = np.clip(img[ya:yb, xa:xb] + rgb * a, 0, 1)
        else:
            img[ya:yb, xa:xb] = img[ya:yb, xa:xb] * (1 - a) + rgb * a
    tile = Image.fromarray((img * 255).astype(np.uint8))
    tiles.append((fr['t'], tile))
cols = 2
rows = (len(tiles) + 1) // 2
sheet = Image.new('RGB', (W * cols, H * rows))
from PIL import ImageDraw
for i, (t, tile) in enumerate(tiles):
    ImageDraw.Draw(tile).text((8, 6), f"{data['scene']} t={t:.2f}s", fill=(255, 255, 0))
    sheet.paste(tile, ((i % cols) * W, (i // cols) * H))
sheet.save(sys.argv[2])
print(sys.argv[2])
