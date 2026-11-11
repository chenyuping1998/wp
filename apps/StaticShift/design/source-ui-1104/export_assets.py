"""Mechanical PNG export: dimensions, slices and aperture; artwork stays in raw/."""
from pathlib import Path
from PIL import Image
import hashlib,json
from collections import deque
ROOT=Path(__file__).resolve().parent
SIZES={'board_frame':(1640,1400),'board_frame_fg':(1640,1400),'cell_card':(280,280),'logo':(1600,700),'logo_small':(800,260),'bar_plate':(1920,160),'intro_card':(900,640)}
report={}
for name,size in SIZES.items():
    p=ROOT/'raw'/f'{name}.png'
    if not p.exists(): continue
    im=Image.open(p).convert('RGBA')
    if name.startswith('board_frame'):
        # Preserve the hand-painted rails while mapping the source aperture onto
        # the exact production aperture, instead of stretching the whole frame.
        sx=[0,round(im.width*120/1357),round(im.width*1238/1357),im.width]
        sy=[0,round(im.height*187/1159),round(im.height*1016/1159),im.height]
        dx=[0,120,1520,1640];dy=[0,170,1290,1400]
        out=Image.new('RGBA',size)
        for y in range(3):
            for x in range(3):
                if x==1 and y==1: continue
                piece=im.crop((sx[x],sy[y],sx[x+1],sy[y+1])).resize((dx[x+1]-dx[x],dy[y+1]-dy[y]),Image.Resampling.LANCZOS)
                out.paste(piece,(dx[x],dy[y]))
        im=out
        if name=='board_frame_fg' and (ROOT/'board_frame.png').exists():
            im.putalpha(Image.open(ROOT/'board_frame.png').getchannel('A'))
        assert im.crop((120,170,1520,1290)).getchannel('A').getbbox() is None
    elif name=='cell_card':
        # Extract only the exterior white matte. Never key the lavender paper.
        pix=im.load();w,h=im.size;seen=set();q=deque([(0,0),(w-1,0),(0,h-1),(w-1,h-1)])
        while q:
            x,y=q.popleft()
            if not(0<=x<w and 0<=y<h) or (x,y) in seen:continue
            seen.add((x,y))
            r,g,b,a=pix[x,y]
            if min(r,g,b)<230:continue
            pix[x,y]=(r,g,b,0)
            q.extend([(x-1,y),(x+1,y),(x,y-1),(x,y+1)])
        im=im.resize(size,Image.Resampling.LANCZOS)
    elif name=='bar_plate':
        # Generated output has transparent padding above/below the long strip.
        box=im.getchannel('A').point(lambda a:255 if a>128 else 0).getbbox()
        im=im.crop(box).resize(size,Image.Resampling.LANCZOS)
    else: im=im.resize(size,Image.Resampling.LANCZOS)
    # Remove residual near-zero export noise while retaining antialiased edges.
    im.putalpha(im.getchannel('A').point(lambda a:0 if a<16 else (255 if a>248 else a)))
    im.save(ROOT/f'{name}.png')
    report[name]={'size':list(im.size),'raw_sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'sha256':hashlib.sha256((ROOT/f'{name}.png').read_bytes()).hexdigest(),'alpha':list(im.getchannel('A').getextrema())}
(ROOT/'export-report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
