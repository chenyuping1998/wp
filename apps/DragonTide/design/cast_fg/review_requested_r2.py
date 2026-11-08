"""Second review's exact requested times, actual 4.3 matrices and 1:1 texels."""
from pathlib import Path
from PIL import Image,ImageDraw
import json,math
D=Path(__file__).resolve().parent;O=D/'qa/repairs-r2'
spec=json.loads((D/'qa/motion-frames.json').read_text())
scale=1/math.hypot(*spec['frames'][0]['slots'][0][1][:2]);N=180
sets={k:{p.stem:Image.open(p).convert('RGBa') for p in f.glob('*.png')} for k,f in [('before',D/'qa/before-repair-r2/layers'),('after',D/'layers')]}
regions=[('wrist-L','arm_l_lower',(190,382)),('wrist-R','arm_r_lower',(609,682)),('elbow-R','arm_r_lower',(730,612)),('knee-L','leg_l_lower',(333,1058)),('knee-R','leg_r_lower',(580,1077))]
requested=[]
for action,time in [('idle',0),('gaze_dud',.56),('fg_end',.6)]:
 seg=next(s for s in spec['segments'] if s['label']==action)
 index=min(range(seg['start'],seg['end']+1),key=lambda i:abs(spec['frames'][i]['time']-time))
 assert abs(spec['frames'][index]['time']-time)<1e-6
 sheet=Image.new('RGB',(N*2,len(regions)*(N+25)),'#1b1a22');draw=ImageDraw.Draw(sheet)
 for row,(label,part,(x,y)) in enumerate(regions):
  a,b,c,d,e,f=dict(spec['frames'][index]['slots'])[part];cx=(a*x+b*y+e)*scale;cy=(c*x+d*y+f)*scale
  for col,key in enumerate(['before','after']):
   out=Image.new('RGBA',(N,N),'#1b1a22')
   for name,m in spec['frames'][index]['slots']:
    a,b,c,d,e,f=[v*scale for v in m];e-=cx-N/2;f-=cy-N/2;det=a*d-b*c
    inv=(d/det,-b/det,(-d*e+b*f)/det,-c/det,a/det,(c*e-a*f)/det)
    out.alpha_composite(sets[key][name].transform((N,N),Image.Transform.AFFINE,inv,Image.Resampling.BILINEAR).convert('RGBA'))
   sheet.paste(out.convert('RGB'),(col*N,row*(N+25)+25));draw.text((col*N+3,row*(N+25)+5),f'{label} {key} {time:.2f}s',fill='white')
 sheet.save(O/f'requested-{action}-{time:.2f}.png')
 requested.append({'action':action,'time':time,'frame':index,'nativeScale':scale})
(O/'requested-times.json').write_text(json.dumps(requested,indent=2)+'\n')
print('Exact requested frames rendered: idle 0s, gaze_dud .56s, fg_end .60s.')
