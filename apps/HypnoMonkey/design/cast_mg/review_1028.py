"""Actual official-runtime matrices, same amplitude, old/new source comparison."""
from pathlib import Path
from PIL import Image,ImageDraw
import json,sys
R=Path(__file__).resolve().parent;O=R/'qa/repaired_1028';O.mkdir(exist_ok=True)
spec=json.loads((R/'qa/motion-frames.json').read_text());W,H=spec['width'],spec['height']
sets={label:{p.stem:Image.open(p).convert('RGBa') for p in folder.glob('*.png')} for label,folder in [('before',R/'attempts/before-review-1028/layers'),('after',R/'layers')]}
def render(index,label='after',scale=1,only=None,light=False):
 size=(round(W*scale),round(H*scale));out=Image.new('RGBA',size,(245,245,245,255) if light else (38,38,43,255) if only is None else (0,0,0,0))
 for name,values in spec['frames'][index]['slots']:
  if only is not None and not only(name):continue
  a,b,c,d,e,f=[v*scale for v in values];det=a*d-b*c
  inverse=(d/det,-b/det,(-d*e+b*f)/det,-c/det,a/det,(c*e-a*f)/det)
  image=sets[label][name].transform(size,Image.Transform.AFFINE,inverse,resample=Image.Resampling.BICUBIC).convert('RGBA');out.alpha_composite(image)
 return out
for label,index,only in [('elbows',244,lambda n:n.startswith('arm_')),('tail',244,lambda n:n.startswith('tail_')),('grin',171,lambda n:n.startswith('head_')),('knees',303,lambda n:n.startswith('leg_'))]:
 bbox=render(index,scale=3,only=only).getbbox();bbox=(max(0,bbox[0]-35),max(0,bbox[1]-35),min(W*3,bbox[2]+35),min(H*3,bbox[3]+35))
 images=[render(index,state,3).crop(bbox).convert('RGB') for state in ['before','after']]
 for state,im in zip(['before','after'],images):im.save(O/f'{label}-{state}-f{index}.png')
 sheet=Image.new('RGB',(images[0].width*2,images[0].height+30),'#26262b');d=ImageDraw.Draw(sheet)
 for k,im in enumerate(images):sheet.paste(im,(k*im.width,30));d.text((k*im.width+10,7),['BEFORE','AFTER'][k],fill='white')
 sheet.save(O/f'{label}-comparison.png')
# Every fourth frame in all eight actions, including transition and knee extremes.
segments=json.loads((R/'qa/review-segments.json').read_text())['segments']
for number,seg in enumerate([] if '--crops-only' in sys.argv else segments,1):
 ids=list(range(seg['start'],seg['end']+1,4));cols=5;rows=(len(ids)+cols-1)//cols;tw,th=256,320
 sheet=Image.new('RGB',(tw*cols,(th+18)*rows),'#26262b');d=ImageDraw.Draw(sheet)
 for k,index in enumerate(ids):
  im=render(index).convert('RGB').resize((tw,th),Image.Resampling.LANCZOS);x=k%cols*tw;y=k//cols*(th+18);sheet.paste(im,(x,y+18));d.text((x+5,y+3),f'{number}: frame {index}',fill='white')
 sheet.save(O/f'all-motion-{number:02}.jpg',quality=96)
old=json.loads((R/'attempts/before-review-1028/cast_mg.json').read_text());new=json.loads((R/'cast_mg_spine/cast_mg.json').read_text())
for key in ['animations','bones','ik']:assert old.get(key)==new.get(key),key+' changed instead of fixing source art'
assert (R/'joints.json').read_bytes()==(R/'attempts/before-review-1028/joints.json').read_bytes()
assert (R/'motion.params.json').read_bytes()==(R/'attempts/before-review-1028/motion.params.json').read_bytes()
(O/'amplitude-check.json').write_text(json.dumps({'bonesUnchanged':True,'ikUnchanged':True,'allAnimationKeysUnchanged':True,'jointsBytesUnchanged':True,'motionParamsBytesUnchanged':True,'review':'every fourth frame, all actions, before/after 3x issue crops'},indent=2)+'\n')
print('3x actual issue comparisons + every-fourth-frame motion contacts; bones, IK, animation keys, joints and parameters unchanged.')
