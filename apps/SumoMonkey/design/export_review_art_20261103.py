"""Reproducible print/export normalization of the ImageGen originals.

No paint, font replacement or anatomy editing: remove subpixel alpha noise,
size to the delivery specification, and nine-slice the frame to its old opening.
"""
from pathlib import Path
import json
import shutil
import hashlib
import numpy as np
from scipy import ndimage
from PIL import Image, ImageDraw, ImageCms

APP = Path(__file__).resolve().parents[1]
ROOT = APP.parents[2]
DELIVERY = ROOT / '角色生圖_相撲猴/交件/美術_20261103'
QA = APP / 'design/qa/art_20261103'
PROFILE = ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes()

def clean(im):
    a = np.array(im.convert('RGBA'))
    # Discard only near-transparent noise and detached 1–2 px output specks.
    a[a[:, :, 3] < 32] = 0
    labels, n = ndimage.label(a[:, :, 3] > 0)
    counts = np.bincount(labels.ravel())
    a[np.isin(labels, np.where(counts < 24)[0])] = 0
    a[a[:, :, 3] == 0] = 0
    return Image.fromarray(a)

def fit(im, size, fraction):
    a = np.array(im.getchannel('A'))
    box = Image.fromarray((a >= 96).astype('uint8') * 255).getbbox()
    im = im.crop(box)
    ratio = min(size[0] * fraction / im.width, size[1] * fraction / im.height)
    im = im.resize((round(im.width * ratio), round(im.height * ratio)), Image.Resampling.LANCZOS)
    out = Image.new('RGBA', size)
    out.alpha_composite(im, ((size[0] - im.width)//2, (size[1] - im.height)//2))
    return clean(out)

def export():
    manifest = json.loads((DELIVERY / 'generation.json').read_text())
    QA.mkdir(parents=True, exist_ok=True)
    report = {}
    for name, item in manifest.items():
        source = Path(item['path'])
        raw = DELIVERY / 'raw' / (name + '.png')
        if not source.exists():
            source = raw
        if source.resolve() != raw.resolve():
            shutil.copy2(source, raw)
        im = clean(Image.open(source))
        if name == 'frame_edge':
            # Continuous nine-slice: folds are wholly above the exact opening.
            sx, sy = [66, 160, 1096, 1188], [74, 236, 1096, 1194]
            dx, dy = [64, 140, 1141, 1216], [64, 140, 1141, 1216]
            out = Image.new('RGBA', (1280, 1280))
            for x in range(3):
                for y in range(3):
                    if x == y == 1:
                        continue
                    tile = im.crop((sx[x], sy[y], sx[x+1], sy[y+1]))
                    tile = tile.resize((dx[x+1]-dx[x], dy[y+1]-dy[y]), Image.Resampling.LANCZOS)
                    out.alpha_composite(tile, (dx[x], dy[y]))
            out = clean(out)
            assert not out.getchannel('A').crop((140,140,1141,1141)).getbbox()
            folder = 'sumoFrame'
        elif name == 'frame_bg':
            out = Image.new('RGBA', (1280,1280))
            paper = im.crop((157,157,1097,1097)).resize((1001,1001), Image.Resampling.LANCZOS)
            out.alpha_composite(paper,(140,140))
            folder = 'sumoFrame'
        elif name.startswith('l') and name not in ('logo_main','logo_header'):
            out = fit(im, (512,512), .84)
            folder = 'sumoSymbols'
        elif name.startswith('logo'):
            out = fit(im, (1600,600) if name == 'logo_main' else (800,200), .9)
            folder = 'sumoV8'
        else:
            out = clean(im.resize((640,400), Image.Resampling.LANCZOS))
            folder = 'sumoV8'
        path = DELIVERY / (name + '.png')
        out.save(path, icc_profile=PROFILE)
        shutil.copy2(path, APP / 'static/assets/sprites' / folder / path.name)
        # Native resolution compositing evidence, both required backings.
        for bg, color in [('light','#EFEADC'), ('dark','#282828')]:
            plate = Image.new('RGBA', out.size, color)
            plate.alpha_composite(out)
            plate.convert('RGB').save(QA / (name + '-' + bg + '.png'))
        report[name] = {'size': out.size, 'alpha_bounds':out.getchannel('A').getbbox(),
                        'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
                        'source':source.name}
    (QA / 'asset-manifest.json').write_text(json.dumps(report, indent=2))
    # Native 96px reel-size low symbols, shown on each required background.
    contact = Image.new('RGB',(5*116,252),'#EFEADC')
    draw = ImageDraw.Draw(contact)
    for row,color in enumerate(['#EFEADC','#282828']):
        draw.rectangle((0,row*126,580,(row+1)*126),fill=color)
        for col,name in enumerate(['l1_a','l2_k','l3_q','l4_j','l5_10']):
            tile=Image.open(DELIVERY/(name+'.png')).resize((96,96),Image.Resampling.LANCZOS)
            contact.paste(tile,(col*116+10,row*126+10),tile)
    contact.save(QA/'low-symbols-96px.png')
    print(json.dumps(report, indent=2))

if __name__ == '__main__':
    export()
