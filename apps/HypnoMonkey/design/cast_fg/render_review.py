from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib
D=Path(__file__).resolve().parent;spec=json.loads((D/'qa/motion-frames.json').read_text());W,H=spec['width'],spec['height'];images={p.stem:Image.open(p).convert('RGBa') for p in (D/'layers').glob('*.png')}
def render(index,scale=1,dark=False):
 size=(round(W*scale),round(H*scale));out=Image.new('RGBA',size,'#222127' if dark else '#f1eee8')
 for name,m in spec['frames'][index]['slots']:
  a,b,c,d,e,f=[v*scale for v in m];det=a*d-b*c;inverse=(d/det,-b/det,(-d*e+b*f)/det,-c/det,a/det,(c*e-a*f)/det)
  # Pixi's actual texture sampling is linear. Bicubic overshoots premultiplied
  # RGB at opaque overlaps, drawing a bright ring absent from source/GPU.
  im=images[name].transform(size,Image.Transform.AFFINE,inverse,resample=Image.Resampling.BILINEAR).convert('RGBA');out.alpha_composite(im)
 return out.convert('RGB')
# Six poses including both ends and four interior samples for every clip.
for number,seg in enumerate(spec['segments'],1):
 ids=[round(seg['start']+(seg['end']-seg['start'])*i/5) for i in range(6)];sheet=Image.new('RGB',(W*3,(H+24)*2),'#f1eee8');d=ImageDraw.Draw(sheet)
 for i,index in enumerate(ids):
  im=render(index);x=i%3*W;y=i//3*(H+24);sheet.paste(im,(x,y+24));d.text((x+6,y+5),f'{seg["label"]} {spec["frames"][index]["time"]:.2f}s',fill='black')
 sheet.save(D/'qa'/f'motion-{number:02d}.jpg',quality=95)
# Full source layers in native scale against light/dark; one connected anatomy each.
files=sorted((D/'layers').glob('*.png'))
for dark in [False,True]:
 sheet=Image.new('RGB',(1800,((len(files)+7)//8)*290),'#18171b' if dark else '#f1eee8');d=ImageDraw.Draw(sheet)
 for i,p in enumerate(files):
  im=Image.open(p).convert('RGBA');im=im.crop(im.getchannel('A').getbbox());im.thumbnail((215,255));x=i%8*225;y=i//8*290;sheet.paste(im,(x+(225-im.width)//2,y+28),im);d.text((x+4,y+5),p.stem,fill='white' if dark else 'black')
 sheet.save(D/'qa'/('layers-dark.jpg' if dark else 'layers-light.jpg'),quality=96)
# Render every fourth actual frame, not selected flattering stills.
for number,seg in enumerate(spec['segments'],1):
 ids=list(range(seg['start'],seg['end']+1,4));tw,th=260,360;sheet=Image.new('RGB',(tw*5,(th+20)*((len(ids)+4)//5)),'#222127');d=ImageDraw.Draw(sheet)
 for i,index in enumerate(ids):
  im=render(index,dark=True);im.thumbnail((tw,th));x=i%5*tw;y=i//5*(th+20);sheet.paste(im,(x+(tw-im.width)//2,y+20));d.text((x+4,y+4),f'{index} {spec["frames"][index]["time"]:.2f}',fill='white')
 sheet.save(D/'qa'/f'all-frames-{number:02d}.jpg',quality=95)
# The animation preview uses the exact layers/JSON above, with a source seal.
frames=[render(i,dark=True).resize((round(W*.7),round(H*.7)),Image.Resampling.LANCZOS) for i in range(0,len(spec['frames']),2)]
frames[0].save(D/'preview.gif',save_all=True,append_images=frames[1:],duration=80,loop=0,optimize=False)
seal={str(p.relative_to(D)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [D/'cast_fg_spine/cast_fg.json',*sorted((D/'layers').glob('*.png'))]};(D/'qa/preview-source-manifest.json').write_text(json.dumps(seal,indent=2)+'\n')
print('All ten clips, every fourth actual frame, light/dark sources and final-source GIF rendered.')
