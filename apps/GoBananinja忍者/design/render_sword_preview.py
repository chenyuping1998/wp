"""Review the native sword geometry over representative game art, not a new asset."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageChops, ImageOps

root=Path(__file__).resolve().parent.parent
out=root/'design/source/ninja_reskin'
frames=json.loads((out/'sword_frames.json').read_text())
W,H,S=800,500,2
bg=Image.open(root/'design/source/backgrounds_1672/bg_base.png').convert('RGB')
base=ImageOps.fit(bg,(W*S,H*S))
shade=Image.new('RGB',base.size,(7,12,22))
base=Image.blend(base,shade,.42)
draw=ImageDraw.Draw(base)
draw.rounded_rectangle((107*S,35*S,693*S,465*S),radius=16*S,fill=(13,20,30),outline=(123,107,67),width=3*S)
names=['h1','w','h3','h2','h4']
images=[]
for name in names:
    path=root/f'static/assets/sprites/goBananinjaSharpHigh/{name}.png'
    if not path.exists(): path=root/f'static/assets/sprites/goBananasSymbolsV3/{name}.png'
    if not path.exists(): path=root/'static/assets/sprites/goBananinjaSharpHigh/h1.png'
    images.append(Image.open(path).convert('RGBA'))
for row in range(4):
    for col in range(5):
        x,y=118+col*113,46+row*102
        tile=ImageOps.contain(images[(row+col)%len(images)],(108*S,96*S))
        base.paste(tile,(x*S+(108*S-tile.width)//2,y*S+(96*S-tile.height)//2),tile)

def color(c): return ((c>>16)&255,(c>>8)&255,c&255)
def point(x,y): return ((W/2+x)*S,(H/2+y)*S)
rendered=[]
for f in frames:
    image=base.copy()
    # Same additive layers as Graphics plus its soft central glow texture.
    glow=Image.new('RGB',image.size)
    gd=ImageDraw.Draw(glow)
    a=f['glow']
    gd.ellipse((240*S,211*S,560*S,289*S),fill=tuple(int(v*a) for v in (221,239,255)))
    image=ImageChops.add(image,glow.filter(ImageFilter.GaussianBlur(28*S)))
    for ribbon in f['ribbons']:
        layer=Image.new('RGB',image.size)
        d=ImageDraw.Draw(layer)
        points=list(zip(ribbon['points'][::2],ribbon['points'][1::2]))
        d.polygon([point(x,y) for x,y in points],fill=tuple(round(v*ribbon['alpha']) for v in color(ribbon['color'])))
        image=ImageChops.add(image,layer)
    layer=Image.new('RGB',image.size); d=ImageDraw.Draw(layer)
    for sp in f['streaks']:
        d.line([point(sp['x'],sp['y']),point(sp['x']-sp['dx'],sp['y']-sp['dy'])],
               fill=(round(255*sp['alpha']),)*3,width=max(1,round(sp['width']*S)))
    if f['impact']>.01:
        w=740
        pts=[(-w*.11,0),(-w*.005,-w*.004),(0,-w*.065),(w*.005,-w*.004),(w*.11,0),
             (w*.005,w*.004),(0,w*.065),(-w*.005,w*.004)]
        d.polygon([point(x,y) for x,y in pts],fill=(round(255*f['impact']*.85),)*3)
    image=ImageChops.add(image,layer).resize((W,H),Image.Resampling.LANCZOS)
    ImageDraw.Draw(image).text((14,14),f"SWORD ENERGY / FINALE   {f['t']}ms",fill=(240,242,248))
    rendered.append(image)
durations=[20]*len(rendered); durations[-1]=650
rendered[0].save(out/'sword_slash.gif',save_all=True,append_images=rendered[1:],duration=durations,loop=0,disposal=2)
rendered[16].save(out/'sword_impact.png')
contact=Image.new('RGB',(W*3,H*2))
for i,j in enumerate([8,11,16,20,26,34]): contact.paste(rendered[j],((i%3)*W,(i//3)*H))
contact.save(out/'sword_contact.png')
print(out/'sword_slash.gif')
