import sys
from PIL import Image
who,arm,out=sys.argv[1:4]; box=tuple(map(int,sys.argv[4:8])); hands=sys.argv[8:]; k=3
WALL=(0x56,0x54,0x8c,255)
def tile(names):
    t=Image.new('RGBA',(1024,1536),WALL)
    for n in names: t.alpha_composite(Image.open(f'{who}/layers/{n}.png').convert('RGBA'))
    return t.crop(box).resize(((box[2]-box[0])*k,(box[3]-box[1])*k),Image.LANCZOS)
ts=[tile([arm])]+[tile([h]) for h in hands]+[tile([arm,h]) for h in hands]
w=ts[0].width; s=Image.new('RGB',(w*len(ts),ts[0].height))
for i,t in enumerate(ts): s.paste(t.convert('RGB'),(i*w,0))
s.save(out,quality=90); print(s.size)
