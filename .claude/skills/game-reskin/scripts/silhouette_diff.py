"""Every frame: where did the character's silhouette change between two renders (published vs new)?
A fix to one part can uncover a defect in its neighbour (2026-11-11: removing the torso "leaf" bared a notch in the
upper arm's elbow — Stone「變成手有缺角」). This lists EVERY region where body became background (LOST) or background
became body (GAINED) and writes before|after crops of each, so all of them get looked at, not only the fixed spot.

usage: python3 silhouette_diff.py <old frames dir> <new frames dir> <out dir> [min_px=6] [--mirror]
writes <out>/sheet_NN.jpg (12 crops per sheet: old | new, LOST red / GAINED green outline) + regions.json"""
import os, sys, json
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

old_d, new_d, out = sys.argv[1:4]
mn = int(sys.argv[4]) if len(sys.argv) > 4 and sys.argv[4].isdigit() else 6
mirror = '--mirror' in sys.argv
os.makedirs(out, exist_ok=True)
BG = np.array([236, 226, 204], float)
R = 70  # crop half size (2x render px)


def body(p):
    a = np.array(Image.open(p).convert('RGB')).astype(float)
    a[:40, :300] = BG  # frame label
    return np.abs(a - BG).max(-1) > 10


regions, tiles = [], []
for f in sorted(os.listdir(new_d)):
    if not (f.startswith('f') and f.endswith('.png')) or not os.path.exists(os.path.join(old_d, f)):
        continue
    A, B = body(os.path.join(old_d, f)), body(os.path.join(new_d, f))
    for kind, m, col in (('LOST', A & ~B, (230, 0, 0)), ('GAINED', B & ~A, (0, 170, 0))):
        m = ndi.binary_opening(m)  # ignore 1-px anti-alias shimmer
        lab, k = ndi.label(m, structure=np.ones((3, 3)))
        for i, sl in enumerate(ndi.find_objects(lab), 1):
            sz = int((lab[sl] == i).sum())
            if sz < mn:
                continue
            cy, cx = (sl[0].start + sl[0].stop) // 2, (sl[1].start + sl[1].stop) // 2
            regions.append({'frame': f, 'kind': kind, 'px': sz, 'x': cx, 'y': cy})
            box = (cx - R, cy - R, cx + R, cy + R)
            pair = []
            for src in (old_d, new_d):
                im = Image.open(os.path.join(src, f)).convert('RGB').crop(box)
                mm = Image.fromarray(((lab == i)[max(0, box[1]):box[3], max(0, box[0]):box[2]] * 255).astype(np.uint8))
                edge = np.array(mm) > 0
                edge = edge & ~ndi.binary_erosion(edge)
                arr = np.array(im)
                ox, oy = max(0, -box[0]), max(0, -box[1])
                ys, xs = np.nonzero(edge)
                arr[ys + oy, xs + ox] = col
                im = Image.fromarray(arr)
                if mirror:
                    im = im.transpose(Image.FLIP_LEFT_RIGHT)
                pair.append(im.resize((210, 210), Image.LANCZOS))
            t = Image.new('RGB', (424, 232), 'white')
            t.paste(pair[0], (0, 22)); t.paste(pair[1], (214, 22))
            ImageDraw.Draw(t).text((4, 4), f'{f} {kind} {sz}px  old | new', fill=col)
            tiles.append(t)
for n in range(0, len(tiles), 12):
    chunk = tiles[n:n + 12]
    s = Image.new('RGB', (424 * 3, 232 * ((len(chunk) + 2) // 3)), 'white')
    for i, t in enumerate(chunk):
        s.paste(t, ((i % 3) * 424, (i // 3) * 232))
    s.save(os.path.join(out, f'sheet_{n // 12:02d}.jpg'), quality=90)
json.dump(regions, open(os.path.join(out, 'regions.json'), 'w'), indent=0)
lost = sum(1 for r in regions if r['kind'] == 'LOST'); gained = len(regions) - lost
print(f'{len(regions)} changed regions ({lost} LOST, {gained} GAINED) in {len({r["frame"] for r in regions})} frames -> {out}')
