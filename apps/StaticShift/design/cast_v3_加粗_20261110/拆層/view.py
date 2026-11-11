import sys, numpy as np
from PIL import Image
who=sys.argv[1]; box=tuple(map(int,sys.argv[2:6])); names=sys.argv[6:]
WALL=(0x56,0x54,0x8c); w,h=box[2]-box[0],box[3]-box[1]
tiles=[Image.open(f'{who}/layers/{n}.png') for n in names]+[Image.open(f'{who}/assembled.png')]
sheet=Image.new('RGB',(w*len(tiles),h*2),WALL)
for i,t in enumerate(tiles):
    c=t.crop(box); sheet.paste(c,(i*w,0),c)
    l=Image.new('RGB',(w,h),(0xe5,0xe2,0xd6)); l.paste(c,(0,0),c); sheet.paste(l,(i*w,h))
sheet.save(f'{who}/_view.png'); print(sheet.size)
