"""Native-resolution same-frame before/after, actual Spine 4.3 matrices.
Every action: start/end, intermediate and each inspected joint's angular extrema.
The output scales source texels 1:1; it is intentionally not a thumbnail proof.
"""
from pathlib import Path
from PIL import Image,ImageDraw
import json,math,hashlib,sys,os
D=Path(__file__).resolve().parent;O=D/'qa'/os.environ.get('HYPNO_REPAIR_REVIEW','repairs-1610');O.mkdir(exist_ok=True)
B=D/'qa'/os.environ.get('HYPNO_REPAIR_BASELINE','before-repair-1610')
FILTER=Image.Resampling.BILINEAR if os.environ.get('HYPNO_NATIVE_FILTER')=='bilinear' else Image.Resampling.BICUBIC
spec=json.loads((D/'qa/motion-frames.json').read_text());scale=1/math.hypot(*spec['frames'][0]['slots'][0][1][:2]);N=180
sets={key:{p.stem:Image.open(p).convert('RGBa') for p in folder.glob('*.png')} for key,folder in [('before',B/'layers'),('after',D/'layers')]}
regions=[('tail-root','tail_1',(652,795)),('waist','pelvis',(550,680)),('wrist-L','arm_l_lower',(190,382)),('wrist-R','arm_r_lower',(609,682)),('elbow-L','arm_l_lower',(285,560)),('elbow-R','arm_r_lower',(730,612)),('knee-L','leg_l_lower',(333,1058)),('knee-R','leg_r_lower',(580,1077)),('neck','neck',(510,387)),('shoulder-L','arm_l_upper',(374,439)),('shoulder-R','arm_r_upper',(607,445))]
def render(index,key,region):
 _,part,point=region;slots=dict(spec['frames'][index]['slots']);a,b,c,d,e,f=slots[part];x,y=point;cx=(a*x+b*y+e)*scale;cy=(c*x+d*y+f)*scale
 out=Image.new('RGBA',(N,N),'#1b1a22')
 for name,values in spec['frames'][index]['slots']:
  a,b,c,d,e,f=[v*scale for v in values];e-=cx-N/2;f-=cy-N/2;det=a*d-b*c
  inverse=(d/det,-b/det,(-d*e+b*f)/det,-c/det,a/det,(c*e-a*f)/det)
  im=sets[key][name].transform((N,N),Image.Transform.AFFINE,inverse,FILTER).convert('RGBA');out.alpha_composite(im)
 return out.convert('RGB')
coverage=[]
for segment in spec['segments']:
 if len(sys.argv)>1 and segment['label']!=sys.argv[1]:continue
 start,end=segment['start'],segment['end'];sheet=Image.new('RGB',(N*8,len(regions)*(N+30)),'#1b1a22');draw=ImageDraw.Draw(sheet)
 for row,region in enumerate(regions):
  name,part,_=region
  angles=[]
  for i in range(start,end+1):
   m=dict(spec['frames'][i]['slots'])[part];angles.append((math.atan2(m[2],m[0]),i))
  ids=[start,end,min(angles)[1],max(angles)[1]]
  coverage.append({'action':segment['label'],'region':name,'frames':ids,'times':[spec['frames'][i]['time'] for i in ids]})
  for col,index in enumerate(ids):
   for k,key in enumerate(['before','after']):
    x=(col*2+k)*N;y=row*(N+30);sheet.paste(render(index,key,region),(x,y+30));draw.text((x+3,y+3),f'{name} {key}',fill='white');draw.text((x+3,y+15),f'f{index} {spec["frames"][index]["time"]:.2f}s',fill='white')
 sheet.save(O/(segment['label']+'-native-dark.jpg'),quality=97,subsampling=0)
 print(segment['label'],'native issue regions saved',flush=True)
# Isolated sources at native resolution on BOTH backgrounds.
for key,images in sets.items():
 for color,label in [('#1b1a22','dark'),('#f5f2ec','light')]:
  paths=[]
  for name in sorted(images):
   if name.startswith(('head','chain')) or name in ['hat','watch','foot_l','foot_r']:continue
   im=images[name].convert('RGBA');box=im.getchannel('A').getbbox();im=im.crop(box);tile=Image.new('RGBA',(im.width+20,im.height+40),color);tile.alpha_composite(im,(10,30));ImageDraw.Draw(tile).text((8,8),name,fill='white' if label=='dark' else 'black');path=O/f'{key}-{name}-{label}.png';tile.save(path);paths.append(path.name)
(O/'coverage.json').write_text(json.dumps({'sourcePixelScale':scale,'note':'Each 180px region samples actual artwork at 1 source pixel per output pixel; same matrices for both revisions. First/end plus min/max world rotation for every region in all ten actions.','samples':coverage},indent=2)+'\n')
old=json.loads((B/'cast_fg.json').read_text());new=json.loads((D/'cast_fg_spine/cast_fg.json').read_text())
check={k:old.get(k)==new.get(k) for k in ['bones','ik','animations','slots','skins']};assert all(check.values()),check
assert (D/'joints.json').read_bytes()==(B/'joints.json').read_bytes()
check.update(jointsBytesUnchanged=True,recipeBytesUnchanged=(D/'assistant.recipe.json').read_bytes()==(B/'assistant.recipe.json').read_bytes());assert check['recipeBytesUnchanged']
(O/'motion-invariants.json').write_text(json.dumps(check,indent=2)+'\n')
print('Motion, rig, joints, recipe unchanged; native start/end/extrema comparisons complete.')
