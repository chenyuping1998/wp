"""Seam/gap scan on frames rendered BY THE GAME (dragonCastScene via ?castqa inspect + pixi extract).

Same detector as new-games/sea-dragon/art/tools/scan_gaps.py (transparent or half-transparent
pockets inside the body outline), run on the integrated renderer's output instead of the kit's.
Usage: python3 scan_game_frames.py <frames dir> <out dir> [--prefix qa_mg] [--max-w 7]
Frames are RGBA PNGs named qa_<kind>_<animation>_<index>_<time>.jpg (PNG bytes).
"""
import argparse, json, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, '/Users/stone/stake-engine/new-games/sea-dragon/art/tools')
from scan_gaps import gaps  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('frames'); ap.add_argument('out')
    ap.add_argument('--prefix', default='qa_mg'); ap.add_argument('--max-w', type=int, default=7)
    a = ap.parse_args()
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    rows = []
    for path in sorted(Path(a.frames).glob(f'{a.prefix}_*')):
        parts = path.stem.split('_')  # qa, kind, anim..., index, time
        anim = '_'.join(parts[2:-2])
        im = Image.open(path).convert('RGBA'); al = np.asarray(im)[..., 3]
        g, _ = gaps(al, a.max_w)
        rows.append(dict(file=path.name, anim=anim, t=parts[-1], n=len(g), px=sum(x['px'] for x in g), gaps=g, size=im.size))
    by = {}
    for r in rows:
        b = by.setdefault(r['anim'], dict(frames=0, bad=0, px=0)); b['frames'] += 1; b['bad'] += r['n'] > 0; b['px'] += r['px']
    worst = sorted(rows, key=lambda r: -r['px'])
    for r in worst[:10]:
        if not r['n']:
            break
        im = Image.open(Path(a.frames) / r['file']).convert('RGBA')
        bg = Image.new('RGBA', im.size, (18, 22, 38, 255)); bg.alpha_composite(im); d = ImageDraw.Draw(bg)
        for x in r['gaps']:
            d.rectangle((x['x0'] - 10, x['y0'] - 10, x['x1'] + 10, x['y1'] + 10), outline=(255, 40, 40, 255), width=4)
        bg.convert('RGB').resize((im.width // 2, im.height // 2)).save(out / f"worst-{r['anim']}-{r['t']}.jpg", quality=88)
    (out / 'gaps.json').write_text(json.dumps(dict(by_motion=by, worst=worst[:30]), ensure_ascii=False, indent=1))
    for k, v in by.items():
        print(f"{k:14s} frames {v['frames']:3d}  with gaps {v['bad']:3d}  gap px {v['px']}")
    print('worst:', [(r['anim'], r['t'], r['n'], r['px']) for r in worst[:10]])


if __name__ == '__main__':
    main()
