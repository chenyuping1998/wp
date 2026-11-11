from pathlib import Path
import math,json,subprocess,sys
import numpy as np,cv2
from scipy import ndimage as ndi
from PIL import Image,ImageDraw,ImageFont
P=Path(__file__).resolve().parent;ROOT=P.parents[1];PAPER='#e5e2d6';FONT=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',20);SIZE=(1600,2160);OFF=np.array([[1,0,280],[0,1,500],[0,0,1.]])
def around(p,a):
 a=math.radians(a);c,s=math.cos(a),math.sin(a);x,y=p;return np.array([[c,-s,x-c*x+s*y],[s,c,y-s*x-c*y],[0,0,1.]])
def transform(im,M,size=SIZE):
 b=im.getchannel('A').getbbox();x0,y0,x1,y1=b;crop=np.array(im.crop(b));corners=np.array([[x0,y0,1],[x1,y0,1],[x1,y1,1],[x0,y1,1]]);Q=(corners@M.T)[:,:2];lo=np.floor(Q.min(axis=0)-3).astype(int);hi=np.ceil(Q.max(axis=0)+3).astype(int);assert (lo>=0).all()and(hi<np.array(size)).all(),('clips',lo,hi)
 A=np.array([[1,0,-lo[0]],[0,1,-lo[1]],[0,0,1.]])@M@np.array([[1,0,x0],[0,1,y0],[0,0,1.]])
 src=crop.astype('float32')/255;src[:,:,:3]*=src[:,:,3:4];out=cv2.warpAffine(src,A[:2],tuple(hi-lo),flags=cv2.INTER_CUBIC);alpha=out[:,:,3:4].clip(0,1);out[:,:,:3]=np.where(alpha>1e-6,out[:,:,:3]/np.maximum(alpha,1e-6),0);out[:,:,3:4]=alpha;out=(out.clip(0,1)*255).round().astype('uint8');return Image.fromarray(out),tuple(lo)
poses=[('rest',{}),('extended',{'arm_l':(45,75),'arm_r':(-20,120),'hand_l':'hand_l_point','head':'head_spiral'}),('raised',{'arm_l':(120,90),'arm_r':(-130,150),'hand_l':'hand_l_open','hand_r':'hand_r_hatheld','head':'head_grin'}),('folded',{'arm_l':(-15,-85),'arm_r':(20,-60),'hand_r':'hand_r_pinch','head':'head_blink'}),('shrug',{'arm_l':(30,-30),'arm_r':(-25,30),'hand_l':'hand_l_open','hand_r':'hand_r_open','head':'head_annoyed','head_angle':-8}),('knees',{'leg_l':(20,-45),'leg_r':(-15,35),'head_angle':10})]
for ch in ['dj','host']:
 D=P/'candidate'/ch;J=json.loads((D/'layout.json').read_text())['joints'];order=json.loads((D/'layout.json').read_text())['draw_order'];L={f.stem:Image.open(f).convert('RGBA')for f in (D/'layers').glob('*.png')};(D/'qa/transparent-poses').mkdir(exist_ok=True);sheet=Image.new('RGB',(1500,1200),PAPER);frames={};Ts={}
 for i,(label,pose) in enumerate(poses):
  trans={};swap={}
  for side in ['l','r']:
   a,b=pose.get('arm_'+side,(0,0));A=around(J['shoulder_'+side],a);B=A@around(J['elbow_'+side],b);trans[f'arm_{side}_upper']=A;trans[f'arm_{side}_lower']=B;hn='hand_l_hip'if side=='l'else'hand_r_grip';trans[hn]=B
   if 'hand_'+side in pose:swap[hn]=pose['hand_'+side]
   a,b=pose.get('leg_'+side,(0,0));A=around(J['hip_'+side],a);B=A@around(J['knee_'+side],b);trans[f'leg_{side}_upper']=A;trans[f'leg_{side}_lower']=B;v=np.array([*J['ankle_'+side],1.]);Q=B@v;F=np.eye(3);F[:2,2]=Q[:2]-v[:2];trans['foot_'+side]=F
  H=around(J['neck'],pose.get('head_angle',0));trans['head_idle']=H;trans['hat']=H;trans['glasses']=H;trans['neck']=around(J['neck'],pose.get('head_angle',0)*.3)
  if 'head'in pose:swap['head_idle']=pose['head']
  full=Image.new('RGBA',SIZE)
  for name in order:
   if ch=='dj'and name=='hat'and pose.get('hand_r')=='hand_r_hatheld':continue
   part,xy=transform(L[swap.get(name,name)],OFF@trans.get(name,np.eye(3)));full.alpha_composite(part,xy)
  full.save(D/'qa/transparent-poses'/(label+'.png'));paper=Image.new('RGBA',SIZE,PAPER);paper.alpha_composite(full);ImageDraw.Draw(paper).text((25,25),label+' - original angles; rigid source layers',fill='#222222',font=FONT);paper.save(D/'qa'/('joint-'+label+'.png'));frames[label]=paper;Ts[label]=trans;small=paper.copy();small.thumbnail((500,600));sheet.paste(small.convert('RGB'),((i%3)*500,(i//3)*600))
 sheet.save(D/'qa/joint-proof-sheet.jpg',quality=96)
 # Native resolution inspection of all shoulder/elbow/wrist/hip/knee interfaces.
 tiles=[]
 for label in ['rest','extended','raised','folded','shrug','knees']:
  for side in ['l','r']:
   for kind,mat in ([('shoulder',np.eye(3)),('elbow',Ts[label][f'arm_{side}_upper']),('wrist',Ts[label][f'arm_{side}_lower'])]if label!='knees'else[('hip',np.eye(3)),('knee',Ts[label][f'leg_{side}_upper'])]):
    v=np.array([*J[kind+'_'+side],1.]);x,y=(OFF@mat@v)[:2];crop=frames[label].crop((round(x-115),round(y-115),round(x+115),round(y+115)));tile=Image.new('RGBA',(240,260),PAPER);tile.alpha_composite(crop,(5,25));ImageDraw.Draw(tile).text((4,3),label+' '+kind+' '+side,font=FONT,fill='#222222');tiles.append(tile)
 for start in range(0,len(tiles),20):
  ts=tiles[start:start+20];out=Image.new('RGBA',(1200,((len(ts)+4)//5)*260),PAPER)
  for k,t in enumerate(ts):out.alpha_composite(t,((k%5)*240,(k//5)*260))
  out.convert('RGB').save(D/'qa'/('native-joints-'+str(start//20+1)+'.jpg'),quality=97)
 # Every hand/prop at its actual common wrist, against paper and at native size.
 tiles=[]
 for side in ['l','r']:
  W=J['wrist_'+side]
  for name in sorted(n for n in L if n.startswith('hand_'+side)):
   im=Image.new('RGBA',(1024,1536),PAPER);im.alpha_composite(L[f'arm_{side}_lower']);im.alpha_composite(L[name]);crop=im.crop((W[0]-95,W[1]-110,W[0]+105,W[1]+100));tile=Image.new('RGBA',(220,245),PAPER);tile.alpha_composite(crop,(10,30));ImageDraw.Draw(tile).text((5,3),name,font=FONT,fill='#222222');tiles.append(tile)
 out=Image.new('RGBA',(880,((len(tiles)+3)//4)*245),PAPER)
 for i,t in enumerate(tiles):out.alpha_composite(t,((i%4)*220,(i//4)*245))
 out.convert('RGB').save(D/'qa/all-wrists-paper.jpg',quality=97)
 # Standalone layers on paper/dark; exact alpha diff against original delivery.
 report={};contacts=[]
 for name,im in L.items():
  a=np.array(im);before=np.array(Image.open(P.parent/'退件1105/修前交件'/ch/'layers'/(name+'.png')).convert('RGBA'));assert im.size==(1024,1536);assert ndi.label(a[:,:,3]>0)[1]==1,(ch,name,'fragment');assert not a[a[:,:,3]==0,:3].any(),(ch,name,'transparentRGB');changed=not np.array_equal(a,before)
  crop=im.crop(im.getchannel('A').getbbox());crop.thumbnail((260,280));tile=Image.new('RGBA',(560,320),PAPER);tile.alpha_composite(Image.new('RGBA',(280,320),'#171b24'),(280,0));tile.alpha_composite(crop,(10,30));tile.alpha_composite(crop,(290,30));ImageDraw.Draw(tile).text((5,3),name,font=FONT,fill='#222222');contacts.append(tile)
  if not changed:continue
  removed=before[:,:,3].astype(int)-a[:,:,3].astype(int)>16;added=a[:,:,3].astype(int)-before[:,:,3].astype(int)>16;mask=removed|added;Y,X=np.where(mask);b=(max(0,X.min()-15),max(0,Y.min()-15),min(1024,X.max()+16),min(1536,Y.max()+16))if len(X)else im.getchannel('A').getbbox();diff=before.copy();diff[removed,:3]=[220,25,40];diff[added,:3]=[20,130,80];out=Image.new('RGBA',(1200,520),PAPER)
  for i,z in enumerate([before,a,diff]):
   part=Image.fromarray(z).crop(b);part.thumbnail((390,480));out.alpha_composite(part,(i*400+5,35))
  ImageDraw.Draw(out).text((5,4),name+' | before / after / red removed; green added',font=FONT,fill='#222222');out.convert('RGB').save(D/'qa'/(name+'-alpha-diff.jpg'),quality=97);Image.fromarray(removed.astype('uint8')*255).save(D/'qa'/(name+'-removed-alpha.png'));report[name]={'removed_px':int(removed.sum()),'added_px':int(added.sum())}
 out=Image.new('RGBA',(1680,math.ceil(len(contacts)/3)*320),PAPER)
 for i,t in enumerate(contacts):out.alpha_composite(t,((i%3)*560,(i//3)*320))
 out.convert('RGB').save(D/'qa/all-layers-paper-dark.jpg',quality=96);(D/'qa/alpha-diff-report.json').write_text(json.dumps(report,indent=2))
 checker=Path.home()/'tools/spine-generator/scripts/check_outline_ink.py';r=subprocess.run([sys.executable,str(checker),str(D),'--out',str(D/'qa/outline-ink.jpg')],capture_output=True,text=True);(D/'qa/outline-ink.json').write_text(r.stdout);print(ch,r.stdout,flush=True)
 print(ch,'QA complete',flush=True)
