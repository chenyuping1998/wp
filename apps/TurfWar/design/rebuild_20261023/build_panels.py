"""Production exports from retained painted panel sources. Preserve corner geometry."""
from pathlib import Path
from PIL import Image, ImageDraw
D=Path(__file__).resolve().parent; APP=D.parent.parent;SPR=APP/'static/assets/sprites'
def save(im,p):im.save(p,optimize=True)
def sliced(im,size,cap):
 w,h=im.size;W,H=size;c=cap;out=Image.new('RGBA',size)
 # Source corners are scaled uniformly to destination cap; only plain center spans stretch.
 cs=140
 for yi,(y0,y1,dy0,dy1) in enumerate([(0,cs,0,c),(cs,h-cs,c,H-c),(h-cs,h,H-c,H)]):
  for x0,x1,dx0,dx1 in [(0,cs,0,c),(cs,w-cs,c,W-c),(w-cs,w,W-c,W)]:
   patch=im.crop((x0,y0,x1,y1)).resize((dx1-dx0,dy1-dy0),Image.Resampling.LANCZOS);out.alpha_composite(patch,(dx0,dy0))
 return out
console=Image.open(D/'source/console-plate.png').convert('RGBA').crop((8,240,1976,548))
# Export at exact legacy dimensions for the package's three-slice renderer.
for n,size in [('bar_plate',(3744,270)),('bar_strip',(3744,240))]:save(sliced(console,size,110),SPR/'turfUi'/f'{n}.png')
panel=Image.open(D/'source/feature-plate.png').convert('RGBA').crop((28,132,1508,866))
# The image model put fractional alpha through the painted well. Normalize
# the solid sheet metal to opaque, retaining the bevel silhouette.
mask=Image.new('L',panel.size);ImageDraw.Draw(mask).polygon([(8,55),(55,8),(1420,8),(1472,55),(1472,680),(1420,727),(55,727),(8,680)],fill=255);panel.putalpha(mask)
for p in [SPR/'turfBoardFrame/fs_counter_panel.png',SPR/'turfBoardFrame/fs_sign.png',*list((SPR/'turfWinBanners').glob('*.png')),*list((SPR/'turfSplash').glob('title_*.png'))]:
 size=Image.open(p).size;save(sliced(panel,size,min(65,min(size)//5)),p)
# Frame is painted casing with a completely clear reel window.
edge=sliced(panel,(1280,1280),80);a=edge.getchannel('A');dr=ImageDraw.Draw(a);dr.rectangle((67,67,1213,1213),fill=0);edge.putalpha(a);save(edge,SPR/'turfBoardFrame/frame_edge.png')
# Unlabelled Buy plate uses the same actual painted material, and keeps its transparent margin.
p=SPR/'turfUi/buybonus_plate.png';out=Image.new('RGBA',(512,512));out.alpha_composite(sliced(panel,(450,450),62),(31,31));save(out,p)
print('Painted console, feature panels, titles and reel casing exported.')
