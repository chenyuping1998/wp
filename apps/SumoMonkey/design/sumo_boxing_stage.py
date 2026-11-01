"""Validate and stage registered full-canvas layers without touching live cast.
Usage: --delivery DIR --full clean_full.png --out STAGING
Only ready, reviewed 14 semantic layers should enter this step.
"""
from pathlib import Path
from PIL import Image,ImageDraw
import argparse,json,shutil
import numpy as np
ORDER=['arm_back_upper','leg_back_upper','leg_back_lower','leg_front_upper','leg_front_lower','pelvis','neck','torso','arm_back_lower','fist_back','head','arm_front_upper','arm_front_lower','fist_front']
p=argparse.ArgumentParser();p.add_argument('--delivery',type=Path,required=True);p.add_argument('--full',type=Path,required=True);p.add_argument('--out',type=Path,required=True);args=p.parse_args()
ref=Image.open(args.full).convert('RGBA');assert ref.size==(1024,1536),ref.size
images={};crops={};errors=[]
for name in ORDER:
 path=args.delivery/f'{name}.png'
 if not path.exists():errors.append(f'missing {name}');continue
 im=Image.open(path)
 if im.mode!='RGBA' or im.size!=ref.size:errors.append(f'{name}: need RGBA {ref.size}, got {im.mode} {im.size}');continue
 box=im.getchannel('A').getbbox()
 if box is None:errors.append(f'{name}: empty alpha');continue
 if im.getchannel('A').getextrema()[0]!=0:errors.append(f'{name}: no transparent background');continue
 images[name]=im;crops[name]=box
if errors:raise SystemExit('\n'.join(errors))
layers=args.out/'layers';textures=args.out/'textures';layers.mkdir(parents=True,exist_ok=True);textures.mkdir(exist_ok=True)
comp=Image.new('RGBA',ref.size)
for name in ORDER:
 im=images[name];im.save(layers/f'{name}.png');crop=im.crop(crops[name]);crop.save(textures/f'{name}.png')
 # Guarantee trimmed sprite + stored crop reconstructs exact original pixels.
 rt=Image.new('RGBA',ref.size);rt.paste(crop,crops[name][:2]);assert np.array_equal(np.array(rt),np.array(im)),name
 comp.alpha_composite(im)
(layers/'layers.json').write_text(json.dumps({'order':ORDER},indent=2));(args.out/'crops.json').write_text(json.dumps(crops,indent=2));comp.save(args.out/'assembled.png');shutil.copy2(args.full,args.out/'full.png')
paper=Image.new('RGBA',ref.size,'#efeadc');a=paper.copy();a.alpha_composite(ref);b=paper.copy();b.alpha_composite(comp)
side=Image.new('RGB',(2048,1536),'#efeadc');side.paste(a,(0,0));side.paste(b,(1024,0));side.save(args.out/'full-vs-assembled.png')
ra=np.array(ref.getchannel('A'))>128;ca=np.array(comp.getchannel('A'))>128
rgb1=np.array(a)[:,:,:3].astype(float);rgb2=np.array(b)[:,:,:3].astype(float)
report={'layer_order':ORDER,'crops':crops,'crop_roundtrip_exact':True,'reference_alpha_pixels':int(ra.sum()),'assembled_alpha_pixels':int(ca.sum()),'missing_reference_fraction':float((ra&~ca).sum()/ra.sum()),'excess_fraction':float((ca&~ra).sum()/ra.sum()),'visible_rgb_mae':float(abs(rgb1-rgb2)[ra].mean()),'scope':'staging only; inspect overlay and motion before live installation'}
(args.out/'staging_report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
