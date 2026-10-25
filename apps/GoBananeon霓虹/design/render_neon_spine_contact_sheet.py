"""Render exported Spine mesh frames offline for motion review."""
from pathlib import Path
import json
import sys
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'design/source/monkey_neon'
DATA = json.loads((SRC / '_posed_frames.json').read_text(encoding='utf-8'))
PAGE = np.asarray(Image.open(ROOT / 'static/assets/spines/goBananasMonkey/monkey.png').convert('RGBA'))
PAGES = {'monkey.png': PAGE}
for frame in DATA['frames']:
    for part in frame['parts']:
        name = part.get('page', 'monkey.png')
        if name not in PAGES:
            PAGES[name] = np.asarray(Image.open(ROOT / 'static/assets/spines/goBananasMonkey' / name).convert('RGBA'))
SCALE = 0.62
CW, CH = 360, 590
GROUND = (884 * SCALE) + 12
ORIGIN_X = CW / 2
if DATA['animation'] in ('iron_punch', 'dj_scratch'):
    CW = 560
    ORIGIN_X = 350
DETAIL = '--hand' in sys.argv
if DETAIL:
    points = np.concatenate([np.asarray(part['xy']).reshape(-1, 2) for frame in DATA['frames'] for part in frame['parts'] if part['name'] == 'dj_hand'])
    low, high = points.min(axis=0), points.max(axis=0)
    CW, CH = 460, 360
    SCALE = min(2.8, (CW-45)/(high[0]-low[0]), (CH-45)/(high[1]-low[1]))
    center = (low+high)/2
    ORIGIN_X = CW/2-center[0]*SCALE
    GROUND = CH/2+center[1]*SCALE
SUFFIX = '_hand' if DETAIL else ''

def render(frame):
    out = np.zeros((CH, CW, 3), dtype=np.float32)
    out[:] = (17, 19, 32)
    for part in frame['parts']:
        page = PAGES[part.get('page', 'monkey.png')]
        verts = np.asarray(part['xy'], dtype=np.float32).reshape(-1, 2)
        verts[:, 0] = ORIGIN_X + verts[:, 0] * SCALE
        verts[:, 1] = GROUND - verts[:, 1] * SCALE
        uv = np.asarray(part['uv'], dtype=np.float32).reshape(-1, 2)
        tri = part['triangles']
        for i in range(0, len(tri), 3):
            d = verts[tri[i:i+3]]
            s = uv[tri[i:i+3]]
            minx = max(0, int(np.floor(d[:, 0].min())))
            maxx = min(CW, int(np.ceil(d[:, 0].max()))+1)
            miny = max(0, int(np.floor(d[:, 1].min())))
            maxy = min(CH, int(np.ceil(d[:, 1].max()))+1)
            if minx >= maxx or miny >= maxy:
                continue
            denominator = (d[1,1]-d[2,1])*(d[0,0]-d[2,0])+(d[2,0]-d[1,0])*(d[0,1]-d[2,1])
            if abs(denominator) < 1e-5:
                continue
            xx, yy = np.meshgrid(np.arange(minx,maxx,dtype=np.float32)+.5, np.arange(miny,maxy,dtype=np.float32)+.5)
            a = ((d[1,1]-d[2,1])*(xx-d[2,0])+(d[2,0]-d[1,0])*(yy-d[2,1]))/denominator
            b = ((d[2,1]-d[0,1])*(xx-d[2,0])+(d[0,0]-d[2,0])*(yy-d[2,1]))/denominator
            c = 1-a-b
            inside = (a >= -0.001)&(b >= -0.001)&(c >= -0.001)
            if not inside.any():
                continue
            sx = np.clip(np.rint(a*s[0,0]+b*s[1,0]+c*s[2,0]).astype(np.int32),0,page.shape[1]-1)
            sy = np.clip(np.rint(a*s[0,1]+b*s[1,1]+c*s[2,1]).astype(np.int32),0,page.shape[0]-1)
            sampled = page[sy,sx]
            alpha = (sampled[:,:,3].astype(np.float32)/255) * inside * part.get('alpha', 1)
            dest = out[miny:maxy,minx:maxx]
            dest[:] = sampled[:,:,:3]*alpha[:,:,None] + dest*(1-alpha[:,:,None])
    image = Image.fromarray(np.uint8(np.clip(out,0,255)), 'RGB')
    ImageDraw.Draw(image).text((12,8),f"{DATA['animation']}  {frame['time']:.2f}s",fill=(108,235,255))
    return image

frames = [render(frame) for frame in DATA['frames']]
if '--gif' in sys.argv:
    path = SRC / f"_motion_{DATA['animation']}{SUFFIX}.gif"
    times = [frame['time'] for frame in DATA['frames']]
    # End is the duplicate loop pose; omit it so the loop never pauses there.
    durations = [max(10, round((times[i+1]-times[i])*100)*10) for i in range(len(times)-1)]
    frames[0].save(path, save_all=True, append_images=frames[1:-1], duration=durations, loop=0)
    print(path)
    sys.exit(0)
cols = 3
rows = (len(frames)+cols-1)//cols
sheet = Image.new('RGB',(cols*CW,rows*CH),(9,11,24))
for i, image in enumerate(frames):
    sheet.paste(image,((i%cols)*CW,(i//cols)*CH))
path = SRC / f"_contact_{DATA['animation']}{SUFFIX}.jpg"
sheet.save(path,quality=92)
print(path)
