"""Compare real v2/re-split baked motion; render proof, never modify sources."""
from pathlib import Path
from PIL import Image, ImageDraw
import json, math

APP = Path(__file__).resolve().parents[1]
ROOT = APP.parents[2]
OUT = ROOT / 'dist/sumomonkey-redissect-v2'
OLD = Path(json.loads((OUT / 'baseline.json').read_text())['backup']) / 'extracted'
W, H, S = 420, 450, .255
reference_json = ROOT / 'dist/sumomonkey-boxing-evidence/bandit-reference-motion.json'
reference_images = Path('/Users/stone/tools/spine-generator/examples/characters/bandit-monkey/layers')
reference = None
if reference_json.exists() and reference_images.exists():
    ref_data = json.loads(reference_json.read_text())
    reference = ref_data, {n: Image.open(reference_images/f'{n}.png').convert('RGBA') for n in ref_data['names']}

def source(base, cast):
    motion = json.loads((base / f'src/game/sumoMotion_{cast}.json').read_text())
    images = {n: Image.open(base / f'static/assets/sumoCast/{cast}/{n}.png').convert('RGBA')
              for n in motion['names']}
    return motion, images

def render(data, images, name, t, title):
    clip = data['clips'][name]
    f = min(t * clip['fps'], len(clip['frames']) - 1)
    i, j = int(f), min(int(f) + 1, len(clip['frames']) - 1)
    frame = Image.new('RGBA', (W, H), '#efeadc')
    for n, left, right in zip(data['names'], clip['frames'][i], clip['frames'][j]):
        a, b, c, d, x, y = [l + (r-l)*(f-i) for l, r in zip(left, right)]
        a, b, c, d = a*S, b*S, c*S, d*S
        x, y = 190+x*S, 420+y*S
        det = a*d-b*c
        if abs(det) < 1e-9:
            continue
        inv = (d/det, -c/det, (c*y-d*x)/det, -b/det, a/det, (b*x-a*y)/det)
        frame.alpha_composite(images[n].transform((W,H), Image.Transform.AFFINE,
                                                inv, Image.Resampling.BICUBIC))
    ImageDraw.Draw(frame).text((12,12), f'{title} / {name}', fill='#282828')
    return frame.convert('RGB')

casts = {}
for cast in ['mg', 'fg']:
    old, new = source(OLD, cast), source(APP, cast)
    frames, sheets, reviews, ref_frames = [], [], [], []
    for name, clip in new[0]['clips'].items():
        count = max(1, math.ceil(clip['duration'] * 12))
        for k in range(count):
            t = k/12
            row = Image.new('RGB', (W*2,H))
            row.paste(render(*old, name, t, f'{cast.upper()} existing v2'), (0,0))
            row.paste(render(*new, name, t, f'{cast.upper()} re-split'), (W,0))
            frames.append(row)
            if reference:
                ref_row = Image.new('RGB', (W*2,H))
                ref_row.paste(render(*reference, name, t, 'BANDIT reference only'), (0,0))
                ref_row.paste(row.crop((W,0,W*2,H)), (W,0))
                ref_frames.append(ref_row)
            if k in {0, count//2, count-1}:
                sheets.append(row)
                reviews.append(row.crop((W,0,W*2,H)))
    frames[0].save(OUT/f'{cast}-v2-vs-redissect.gif', save_all=True,
                   append_images=frames[1:], duration=83, loop=0)
    if ref_frames:
        ref_frames[0].save(OUT/f'{cast}-bandit-vs-redissect.gif', save_all=True,
                           append_images=ref_frames[1:], duration=83, loop=0)
    sheet = Image.new('RGB', (W*2,H*len(sheets)))
    for i, row in enumerate(sheets):
        sheet.paste(row,(0,H*i))
    sheet.save(OUT/f'{cast}-six-motion-contact.png')
    review = Image.new('RGB', (W*3,H*6), '#efeadc')
    for i, pic in enumerate(reviews):
        review.paste(pic, ((i%3)*W,(i//3)*H))
    review.save(OUT/f'{cast}-six-motion-review.png')
    casts[cast] = new

frames = []
for name, clip in casts['mg'][0]['clips'].items():
    duration = max(clip['duration'], casts['fg'][0]['clips'][name]['duration'])
    for k in range(math.ceil(duration*12)):
        row = Image.new('RGB',(W*2,H))
        for i, cast in enumerate(['mg','fg']):
            row.paste(render(*casts[cast], name, k/12, f'SUMO {cast.upper()} re-split'), (W*i,0))
        frames.append(row)
frames[0].save(OUT/'sumo-redissect-motion.gif', save_all=True,
               append_images=frames[1:], duration=83, loop=0)
print('Rendered 6 clips per cast from the exact game matrices, plus v2 comparisons')
