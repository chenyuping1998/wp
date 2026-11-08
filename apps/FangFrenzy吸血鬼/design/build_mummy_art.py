"""Package ImageGen masters and exact wheel geometry into runtime textures.

Generated art is retained untouched under originals; masks/atlases/levels are reproducible.
"""
from pathlib import Path
import json, shutil, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance, ImageOps
from scipy.ndimage import label, binary_dilation

ROOT=Path(__file__).resolve().parent; APP=ROOT.parent
DEL=ROOT/'source/mummy_delivery'; SPR=APP/'static/assets/sprites'
META=json.loads((ROOT/'generated_sources.json').read_text(encoding='utf-8'))
ORIG=DEL/'originals'; ORIG.mkdir(parents=True,exist_ok=True)
for key,item in META.items():
 if not (ORIG/(key+'.png')).exists():shutil.copy2(item['path'],ORIG/(key+'.png'))
def source(k):return Image.open(ORIG/(k+'.png')).convert('RGBA')
def clean(im):
 a=np.array(im);labs,n=label(a[:,:,3]>70);cnt=np.bincount(labs.ravel());cnt[0]=0
 if n:a[:,:,3]=np.where(binary_dilation(labs==cnt.argmax(),iterations=2),a[:,:,3],0)
 return Image.fromarray(a)
def sandstone(im):
 a=np.array(im);rgb=a[:,:,:3].astype(float);warm=(rgb[:,:,0]>rgb[:,:,1]*1.08)&(rgb[:,:,1]>rgb[:,:,2]*1.12)
 lum=(rgb*np.array([.2126,.7152,.0722])).sum(2)
 corrected=np.clip((rgb*.65+lum[:,:,None]*.35)*1.05,0,255)
 a[:,:,:3]=np.where(warm[:,:,None],corrected,rgb).astype('uint8');return Image.fromarray(a)
def save(im,category,name,size=None,runtime=None):
 p=DEL/category/(name+'.png');p.parent.mkdir(parents=True,exist_ok=True)
 if size:im=im.resize(size,Image.Resampling.LANCZOS)
 im.save(p)
 if runtime:
  out=SPR/runtime/(name+'.png');out.parent.mkdir(parents=True,exist_ok=True);im.save(out)
 return im
def shape(size,draw):
 im=Image.new('RGBA',size);draw(ImageDraw.Draw(im));return im

SYMS={}
for k in ['h1','h2','h3','h4','w','s']:
 if k in META:
  im=source(k);save(im,'symbols',k,(1024,1024));SYMS[k]=im.resize((256,256),Image.Resampling.LANCZOS)
lows=source('lows');cw=lows.width/5
for i in range(5):
 im=clean(lows.crop((round(i*cw),0,round((i+1)*cw),lows.height)));bb=im.getchannel('A').getbbox();im=im.crop(bb)
 tile=Image.new('RGBA',(256,256));im.thumbnail((246,246),Image.Resampling.LANCZOS);tile.alpha_composite(im,((256-im.width)//2,(256-im.height)//2))
 # Art brief: low-pay bright area must not exceed the least-bright high-pay object.
 rgb=ImageEnhance.Color(tile).enhance(.2);SYMS['l'+str(i+1)]=ImageEnhance.Brightness(rgb).enhance(.80)
 SYMS['l'+str(i+1)]=ImageEnhance.Brightness(SYMS['l'+str(i+1)]).enhance(.975)
 save(SYMS['l'+str(i+1)],'symbols','l'+str(i+1),(1024,1024))

# Coin and recess are native UI geometry, sharing the generated sandstone/enamel material.
plate=sandstone(source('scarab_plate'))
coin=plate.copy();d=ImageDraw.Draw(coin);s=coin.width
d.ellipse((s*.22,s*.22,s*.78,s*.78),fill='#987049',outline='#2EC4B6',width=round(s*.018))
SYMS['p']=coin.resize((256,256),Image.Resampling.LANCZOS)
SYMS['x']=shape((256,256),lambda d:(d.rounded_rectangle((12,12,244,244),18,fill='#193943',outline='#705f48',width=5),d.rounded_rectangle((25,25,231,231),12,fill='#102c35')))
for k,im in SYMS.items():
 master=source(k) if k in ['h1','h2','h3','h4','w','s'] else coin if k=='p' else im
 save(master,'symbols',k,(1024,1024))
 (SPR/'mummySymbols').mkdir(exist_ok=True);im.save(SPR/'mummySymbols'/(k+'.png'))
 yy,xx=np.mgrid[0:256,0:256];inside=(xx>18)&(xx<238)&(yy>16)&(yy<240)
 rgba=np.array(im);sat=rgba[:,:,:3].max(2)-rgba[:,:,:3].min(2)
 mask=inside.astype(float)*np.minimum(1,np.array(im.getchannel('A'))/255)
 if k.startswith('l'):mask*=((rgba[:,:,0]*.21+rgba[:,:,1]*.72+rgba[:,:,2]*.07)<90)
 else:mask*=np.clip((sat-15)/50,0,1)
 glow=rgba.copy();glow[:,:,3]=(mask*255).astype('uint8');Image.fromarray(glow).save(SPR/'mummySymbols'/(k+'_glow.png'))
 sheet=Image.new('RGBA',(768,512))
 small=np.array(Image.fromarray((mask*255).astype('uint8')).resize((128,128)))/255
 sy,sx=np.mgrid[0:128,0:128]
 for f in range(24):
  centre=-90+f/23*360;strength=np.exp(-((sx+sy-centre)/18)**2)*small
  a=np.full((128,128,4),255,dtype='uint8');a[:,:,3]=(strength*170).astype('uint8')
  sheet.alpha_composite(Image.fromarray(a),((f%6)*128,(f//6)*128))
 sheet.save(SPR/'mummySymbols'/(k+'_sheen.png'))
# Compatibility for dormant cut-layer keys; all mummy symbols use framed panel rigs.
for suffix in ['plate','subject','shadow']:
 im=SYMS['h3'] if suffix=='subject' else Image.new('RGBA',(256,256))
 im.save(SPR/'mummySymbols'/('h3_'+suffix+'.png'))

for k in ['bg_base','bg_feature','bg_holdandspin']:
 save(source(k),'backgrounds',k,(1920,1080),'mummyBackground')
frame=sandstone(clean(source('frame'))).resize((1280,1280),Image.Resampling.LANCZOS)
alpha=np.array(frame)[:,:,3]
def inner_gap(v):
 ids=np.flatnonzero(v<10);runs=np.split(ids,np.where(np.diff(ids)>1)[0]+1);r=max(runs,key=len);return int(r[0]),int(r[-1])+1
x0,x1=inner_gap(alpha[640]);y0,y1=inner_gap(alpha[:,640]);xs=[0,x0,x1,1280];ys=[0,y0,y1,1280];edges=[0,140,1140,1280]
fitted=Image.new('RGBA',(1280,1280))
for row in range(3):
 for col in range(3):
  part=frame.crop((xs[col],ys[row],xs[col+1],ys[row+1])).resize((edges[col+1]-edges[col],edges[row+1]-edges[row]),Image.Resampling.LANCZOS)
  fitted.alpha_composite(part,(edges[col],edges[row]))
frame=fitted;save(frame,'frame','frame_edge',runtime='mummyFrame')
backing=Image.new('RGBA',(1280,1280));ImageDraw.Draw(backing).rectangle((130,130,1150,1150),fill=(16,45,54,235));save(backing,'frame','frame_bg',runtime='mummyFrame')
# Compose blank signs from the same generated slab material, leaving text runtime-driven.
for name,size in [('fs_sign',(1280,1000)),('fs_counter_panel',(1280,966))]:
 im=frame.resize(size);d=ImageDraw.Draw(im);d.rounded_rectangle((150,150,size[0]-150,size[1]-150),25,fill='#153e47')
 if name=='fs_sign':
  for y in [int(size[1]/3),int(size[1]*2/3)]:d.line((125,y,size[0]-125,y),fill='#d9b77a',width=15)
 save(im,'frame',name,runtime='mummyFrame')
for k in ['big','superwin','mega','epic','max']:
 if 'banner_'+k in META:save(clean(source('banner_'+k)),'banners',k,(1000,560),'mummyBanners')

save(sandstone(clean(source('scarab_arch'))),'scarab_wheel','arch_base',(1600,860),'mummyWheel')
save(clean(plate),'scarab_wheel','plate',(640,640),'mummyWheel')
button=clean(source('scarab_button'));save(button,'scarab_wheel','button',(420,420),'mummyWheel')
save(ImageEnhance.Brightness(button).enhance(1.15),'scarab_wheel','button_lit',(420,420),'mummyWheel')
# Exact annular wedge material: all variants share one geometry, never shift on replacement.
def wedge(color):
 w,h=360,300;yy,xx=np.mgrid[0:h,0:w];cx=w/2;cy=h+440;r=np.hypot(xx-cx,yy-cy);a=np.arctan2(xx-cx,cy-yy)
 mask=(r>465)&(r<735)&(abs(a)<math.pi/14)
 rgb=np.array(ImageOps.colorize(ImageOps.grayscale(plate.resize((w,h))),black='#102c35',white=color)).astype(float)
 bevel=np.minimum.reduce([735-r,r-465,(math.pi/14-abs(a))*r]);shine=np.clip((6-bevel)/6,0,1)
 rgb=np.clip(rgb*(.7+.3*(1-yy/h))[:,:,None]+shine[:,:,None]*55,0,255)
 return Image.fromarray(np.dstack([rgb,mask*255]).astype('uint8'))
for name,color in [('tile_normal','#2ec4b6'),('tile_hot','#c8443a'),('tile_top','#8255b2')]:save(wedge(color),'scarab_wheel',name,runtime='mummyWheel')
ring=clean(source('sun_ring'));save(ring,'sun_wheel','ring',(1400,1400),'mummyWheel')
needle=clean(source('sun_needle'));save(needle,'sun_wheel','needle',(280,760),'mummyWheel')
save(button,'sun_wheel','hub',(320,320),'mummyWheel')
save(needle.rotate(180),'scarab_wheel','pointer',(180,240),'mummyWheel')
band=clean(source('bandage'));band=band.crop(band.getchannel('A').getbbox());save(band,'transition','bandage_strip',(2400,360),'mummyTransition')
save(band.crop((max(0,band.width-band.height),0,band.width,band.height)),'transition','bandage_end',(360,360),'mummyTransition')

# Soft scalar fields, used additively. No star textures and no outlined halos.
yy,xx=np.mgrid[-1:1:256j,-1:1:256j];r=np.hypot(xx,yy)
for name,field in [('fx_glow',np.exp(-r*r*6)),('fx_star',np.exp(-r*r*12)),('fx_leaf',np.exp(-(xx*xx*45+yy*yy*5))),('fx_streak',np.exp(-(xx*xx*2+yy*yy*70)))]:
 a=np.full((256,256,4),255,dtype='uint8');a[:,:,3]=(field*255).astype('uint8');save(Image.fromarray(a),'fx',name,runtime='mummyFx')
# The vignette is NOT additive: Game.svelte lays it over the scene with normal
# blending at 0.9, so it must be dark. It was white like the light fields above,
# which put a white haze over every background (fixed 2026-11-07).
a=np.zeros((256,256,4),dtype='uint8');a[:,:,:3]=(11,8,4);a[:,:,3]=(np.clip((r-.42)/.9,0,1)**1.5*235).astype('uint8');save(Image.fromarray(a),'fx','fx_vignette',runtime='mummyFx')
for name,size in [('plate_flash',(800,800)),('button_burst',(600,600)),('tile_result_glow',(360,300))]:
 g=Image.open(SPR/'mummyFx/fx_glow.png');save(g,'scarab_wheel',name,size,'mummyWheel')
save(Image.open(SPR/'mummyFx/fx_glow.png'),'transition','sand_burst',(1024,1024),'mummyTransition')

# Hold coin spray: ten orientations of our bronze coin, replacing the inherited bananas.
sheet=Image.new('RGBA',(1280,128));frames={}
for i in range(10):
 im=SYMS['p'].resize((128,128));im=im.resize((max(18,round(128*abs(math.cos(i*math.pi/10)))),128))
 sheet.alpha_composite(im,(i*128+(128-im.width)//2,0));frames[str(i)]={'frame':{'x':i*128,'y':0,'w':128,'h':128},'sourceSize':{'w':128,'h':128},'spriteSourceSize':{'x':0,'y':0,'w':128,'h':128}}
pd=SPR/'mummyCoins';pd.mkdir(exist_ok=True);sheet.save(pd/'coins.png');(pd/'coins.json').write_text(json.dumps({'frames':frames,'meta':{'image':'coins.png','scale':'1','size':{'w':1280,'h':128}}}))

if 'sun_disc' in META:
 disc=source('sun_disc').resize((1200,1200));rgb=np.array(disc);hsv=np.array(disc.convert('HSV'))
 for i,color in enumerate(['#2ec4b6','#2457a6','#c8443a','#6a2c9e'],1):
  # Only recolour enamel; gold ribs and exact segment boundaries stay identical.
  out=rgb.copy();target=np.array(Image.new('RGB',(1,1),color))[0,0];teal=(hsv[:,:,0]>65)&(hsv[:,:,0]<150)&(hsv[:,:,1]>60)
  lum=(rgb[:,:,:3]*[.21,.72,.07]).sum(2)/145
  out[:,:,:3]=np.where(teal[:,:,None],np.clip(target*lum[:,:,None],0,255),rgb[:,:,:3])
  yy,xx=np.mgrid[0:1200,0:1200];ang=np.arctan2(xx-600,600-yy);rad=np.hypot(xx-600,yy-600)
  special=(abs(ang)<math.pi/12)&(rad>130)&(rad<570)&(hsv[:,:,1]>60)&(hsv[:,:,0]>65)
  special_color=['#2457a6','#c8443a','#6a2c9e','#ffc23a'][i-1]
  sc=np.array(Image.new('RGB',(1,1),special_color))[0,0]
  out[:,:,:3]=np.where(special[:,:,None],np.clip(sc*lum[:,:,None],0,255),out[:,:,:3])
  if i==4:
   bottom=(abs(abs(ang)-math.pi)<math.pi/12)&(rad>130)&(rad<570)&teal
   out[:,:,:3]=np.where(bottom[:,:,None],np.clip(np.array([255,194,58])*lum[:,:,None],0,255),out[:,:,:3])
  save(Image.fromarray(out),'sun_wheel','disc_lv'+str(i),runtime='mummyWheel')

# Art contact sheet at actual cell size, plus quantitative high-pay visibility.
contact=Image.new('RGB',(7*144,2*170),'#10303a');draw=ImageDraw.Draw(contact);metrics={}
for i,(name,im) in enumerate(SYMS.items()):
 p=((i%7)*144,(i//7)*170);small=im.resize((118,118));contact.paste(small,(p[0]+13,p[1]+8),small);draw.text((p[0]+50,p[1]+135),name,fill='white')
 a=np.array(im.convert('RGB'));lum=a@np.array([.2126,.7152,.0722]);metrics[name]={'central_mean_luma':round(float(lum[51:205,51:205].mean()),2),'bright_fraction':round(float((lum>160).mean()),3)}
contact.save(DEL/'symbol_contact_118px.png');(DEL/'art_report.json').write_text(json.dumps(metrics,indent=2))
assert min(metrics[k]['central_mean_luma'] for k in ['h1','h2','h3','h4'])>=70
assert max(metrics['l'+str(i)]['bright_fraction'] for i in range(1,6))<=min(metrics[k]['bright_fraction'] for k in ['h1','h2','h3','h4'])
print('Packaged',len(SYMS),'symbols; high-pay luma', {k:v['central_mean_luma'] for k,v in metrics.items() if k.startswith('h')})
