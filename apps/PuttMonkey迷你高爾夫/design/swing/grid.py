import sys
from PIL import Image, ImageDraw
src, out, x0, y0, x1, y1, s = sys.argv[1], sys.argv[2], *map(int, sys.argv[3:8])
im = Image.open(src).convert('RGBA')
bg = Image.new('RGBA', im.size, (40, 90, 140, 255)); bg.alpha_composite(im)
c = bg.crop((x0, y0, x1, y1)).resize(((x1-x0)*s, (y1-y0)*s), Image.NEAREST)
d = ImageDraw.Draw(c)
for x in range((x0//10)*10, x1, 10):
    if x < x0: continue
    col = (255,255,0,255) if x % 50 == 0 else (255,255,255,90)
    d.line([((x-x0)*s,0),((x-x0)*s,c.height)], fill=col, width=1)
    if x % 50 == 0: d.text(((x-x0)*s+2, 2), str(x), fill=(255,255,0,255))
for y in range((y0//10)*10, y1, 10):
    if y < y0: continue
    col = (255,255,0,255) if y % 50 == 0 else (255,255,255,90)
    d.line([(0,(y-y0)*s),(c.width,(y-y0)*s)], fill=col, width=1)
    if y % 50 == 0: d.text((2,(y-y0)*s+2), str(y), fill=(255,255,0,255))
c.save(out)
