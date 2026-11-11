import sys
from PIL import Image
who,out=sys.argv[1:3]; box=tuple(map(int,sys.argv[3:7])); k=float(sys.argv[7]); names=sys.argv[8:]
WALL=(0x56,0x54,0x8c,255); PAPER=(0xe5,0xe2,0xd6,255)
ts=[]
for n in names:
    bg=PAPER if n.startswith('+') else WALL; n=n.lstrip('+')
    t=Image.new('RGBA',(1024,1536),bg)
    for p in n.split(','):
        src=f'{who}/assembled.png' if p=='ALL' else (f'../../cast_v2/交件/{who}/layers/{p[3:]}.png' if p.startswith('v2:') else f'{who}/layers/{p}.png')
        t.alpha_composite(Image.open(src).convert('RGBA'))
    ts.append(t.crop(box).resize((int((box[2]-box[0])*k),int((box[3]-box[1])*k)),Image.LANCZOS))
w=ts[0].width; s=Image.new('RGB',(w*len(ts),ts[0].height))
for i,t in enumerate(ts): s.paste(t.convert('RGB'),(i*w,0))
s.save(out,quality=90); print(s.size)
