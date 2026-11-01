"""Normalize built-in ImageGen sources; preserve alpha and archive source hashes.
Fit/crop/resample and reproducible disconnected-alpha cleanup for the counter.
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
import json, hashlib, shutil
D=Path(__file__).resolve().parent
A=D.parents[1]
S=A/'static/assets/sprites'
SPECS={
'bgBase':('hypnoBackground/bg_base.jpg',(1920,1080)),
'bgFree':('hypnoBackground/bg_free.jpg',(1920,1080)),
'propSign':('hypnoBackground/prop_spiral_sign.png',(512,1024)),
'balloons':('hypnoBackground/prop_balloons.png',(512,1024)),
'bunting':('hypnoBackground/bunting.png',(1024,342)),
'frameCorner':('hypnoFrame/corner.png',(256,249)),
'frameTop':('hypnoFrame/top.png',(512,49)),
'frameSide':('hypnoFrame/side.png',(77,512)),
'logo':('hypnoBrand/logo.png',(1600,600)),
'buyBonus':('hypnoUi/buybonus_plate.png',(640,640)),
'buyBonusLit':('hypnoUi/buybonus_plate_lit.png',(640,640)),
'buyBonusAligned':('hypnoUi/buybonus_plate_lit.png',(640,640)),
'totalPlate':('hypnoUi/total_plate.png',(512,320)),
'totalPlateMid':('hypnoUi/total_plate_mid.png',(512,320)),
'totalPlateHigh':('hypnoUi/total_plate_high.png',(512,320)),
'fsSign':('hypnoUi/fs_sign.png',(1706,922)),
'fsPanel':('hypnoUi/fs_counter_panel.png',(512,320)),
'ticker':('hypnoUi/ticker_plate.png',(652,146)),
'barStrip':('hypnoUi/bar_strip.png',(1600,200)),
'button':('hypnoUi/button_disc.png',(256,256)),
'buttonOn':('hypnoUi/button_disc_on.png',(256,256)),
'buttonOnMatte':('hypnoUi/button_disc_on.png',(256,256)),
'buttonAligned':('hypnoUi/button_disc_on.png',(256,256)),
'intro1':('hypnoIntro/intro_1.png',(960,720)),
'intro2':('hypnoIntro/intro_2.png',(960,720)),
'intro2Clean':('hypnoIntro/intro_2.png',(960,720)),
'intro3':('hypnoIntro/intro_3.png',(960,720)),
'intro3ChainClean':('hypnoIntro/intro_3.png',(960,720)),
'curtain':('hypnoBackground/curtain.png',(512,1024)),
'winBig':('hypnoWinBanners/big.png',(1500,462)),
'winSuperwin':('hypnoWinBanners/superwin.png',(1500,462)),
'winMega':('hypnoWinBanners/mega.png',(1500,520)),
'winEpic':('hypnoWinBanners/epic.png',(1500,580)),
'winMax':('hypnoWinBanners/max.png',(1500,624)),
}
rows=json.loads((D/'generated-sources.json').read_text());manifest=[]
for row in rows:
 key=row['key'];src=Path(row['path']);archived=D/'source'/f'{key}.png';archived.parent.mkdir(exist_ok=True);shutil.copy2(src,archived)
 if key not in SPECS: continue
 rel,size=SPECS[key];dst=S/rel;dst.parent.mkdir(exist_ok=True);im=Image.open(src).convert('RGBA')
 if key.startswith('bg') or key.startswith('intro') or key=='curtain':
  out=ImageOps.fit(im.convert('RGB'),size,Image.Resampling.LANCZOS)
 elif key in ('frameTop','frameSide','barStrip'):
  # Parallel edges must fill a tiled strip, not carry generated canvas padding.
  box=im.getchannel('A').point(lambda a:255 if a>20 else 0).getbbox();out=im.crop(box).resize(size,Image.Resampling.LANCZOS)
 else:
  out=ImageOps.contain(im,size,Image.Resampling.LANCZOS);canvas=Image.new('RGBA',size);canvas.alpha_composite(out,((size[0]-out.width)//2,(size[1]-out.height)//2));out=canvas
 if key=='fsPanel':
  # Claude's 10/28 cleanup must survive a rebuild: the counter is one
  # connected wooden plate, never the isolated half-alpha specks beneath it.
  alpha=out.getchannel('A');pixels=alpha.load();seen=set();components=[]
  for yy in range(out.height):
   for xx in range(out.width):
    if pixels[xx,yy]<8 or (xx,yy) in seen:continue
    queue=[(xx,yy)];seen.add((xx,yy))
    for qx,qy in queue:
     for nx,ny in [(qx-1,qy),(qx+1,qy),(qx,qy-1),(qx,qy+1)]:
      if 0<=nx<out.width and 0<=ny<out.height and (nx,ny) not in seen and pixels[nx,ny]>=8:seen.add((nx,ny));queue.append((nx,ny))
    components.append(queue)
  keep=set(max(components,key=len));clean=Image.new('L',out.size);cp=clean.load()
  for xx,yy in keep:cp[xx,yy]=pixels[xx,yy]
  out.putalpha(clean)
 if dst.suffix=='.jpg':out.save(dst,quality=94,subsampling=0)
 else:out.save(dst)
 manifest.append({'key':key,'source':str(archived.relative_to(A)),'source_sha256':hashlib.sha256(archived.read_bytes()).hexdigest(),'runtime':str(dst.relative_to(A)),'runtime_sha256':hashlib.sha256(dst.read_bytes()).hexdigest(),'size':size,'alpha_bbox':out.getchannel('A').getbbox() if out.mode=='RGBA' else None,'prompt':row.get('prompt'),'tool':'built-in image_gen'})
manifest=list({row['runtime']:row for row in manifest}.values())
(D/'manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n')
for bg,ink,label in [('#f4f1eb','black','light'),('#16151a','white','dark')]:
 sheet=Image.new('RGB',(1600,((len(manifest)+4)//5)*260),bg);d=ImageDraw.Draw(sheet)
 for i,row in enumerate(manifest):
  im=Image.open(A/row['runtime']).convert('RGBA');im.thumbnail((300,220));x=i%5*320;y=i//5*260;sheet.paste(im,(x+(320-im.width)//2,y+32),im);d.text((x+8,y+8),row['key'],fill=ink)
 sheet.save(D/'qa'/f'all-assets-{label}.jpg',quality=95)
print('Normalized',len(manifest),'assets; raw sources and SHA256 manifest archived.')
