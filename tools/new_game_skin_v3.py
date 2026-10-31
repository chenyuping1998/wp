"""Soft skinning for the established seated cat and macaw source layers."""
import math

def clamp(v):return max(0.,min(1.,v))
def smooth(a,b,v):
 t=clamp((v-a)/(b-a));return t*t*(3-2*t)
def gauss(p,x,y,rx,ry):return math.exp(-((p[0]-x)/rx)**2-((p[1]-y)/ry)**2)

def add_skin_bones(bone,cat):
 for name,p in [('ear_left',[305,240]),('ear_right',[695,270]),('cheek_left',[325,555]),('cheek_right',[680,555]),('muzzle',[500,570])]:bone(name,'head',p)
 bone('crest_tip','crest',[465,105]);bone('chain_mid','chain',[535,805]);bone('chain_end','chain_mid',[535,885])
 bone('lens_chain_mid','monocle',[655,560]);bone('lens_chain_end','lens_chain_mid',[655,645])
 bone('foot_front','hips',[435,1345]);bone('foot_back','hips',[290,1310])
 for side in ['front','back']:
  bone('feather_'+side,'hand_'+side,[210,1110] if side=='front' else [870,1080])
 if cat:
  bone('knuckle_front','hand_front',[435,1172]);bone('knuckle_back','hand_back',[830,1125])

def grid_for(name):
 if name=='body':return 20,26
 if name.startswith('face_'):return 16,18
 if name=='tail':return 10,18
 if name.startswith(('arm_','wing_','paw_')):return 8,12
 if name in ['chain','monocle_chain','crest']:return 6,12
 return 2,2

def skin_weights(name,p,default,cat,joints):
 x,y=p
 if name=='body':
  # Wide weight fields make the torso silhouette breathe. Feet and seat stay planted.
  lower=smooth(750,1080,y);anchor=1-smooth(1190 if cat else 1090,1290 if cat else 1150,y)
  belly=.90*gauss(p,510,990 if cat else 960,430,205)*anchor
  ribs=.82*gauss(p,510,795,380,150)*anchor
  total=belly+ribs
  if total>.96:belly*=.96/total;ribs*=.96/total
  free=1-belly-ribs
  result=[('hips',free*lower),('chest',free*(1-lower)),('belly',belly),('ribs',ribs)]
  if cat:
   feet=[('foot_front',.80*gauss(p,435,1370,95,78)),('foot_back',.70*gauss(p,290,1340,95,75))]
   amount=min(.92,sum(w for _,w in feet));result=[(b,w*(1-amount)) for b,w in result]+[(b,w) for b,w in feet]
  return normalize(result)
 if name.startswith('face_'):
  earL=.90*gauss(p,300,215,125,130)*(1-smooth(330,400,y)) if cat else 0
  earR=.90*gauss(p,700,245,125,130)*(1-smooth(350,420,y)) if cat else 0
  cheekL=.65*gauss(p,320,555,140,125);cheekR=.65*gauss(p,690,555,140,125)
  muzzle=.44*gauss(p,500,575,115,105);neck=.20*smooth(610,745,y)
  parts=[('ear_left',earL),('ear_right',earR),('cheek_left',cheekL),('cheek_right',cheekR),('muzzle',muzzle),('neck',neck)]
  amount=sum(w for _,w in parts)
  if amount>.90:parts=[(b,w*.90/amount) for b,w in parts];amount=.90
  return normalize([('head',1-amount)]+parts)
 if name=='tail':
  t=clamp((y-1090)/330)*2.999;k=int(t);f=t-k;return [(f'tail_{k+1}',1-f),(f'tail_{min(4,k+2)}',f)]
 if name in ['chain','monocle_chain']:
  prefix='lens_chain_' if name=='monocle_chain' else 'chain_';base='monocle' if name=='monocle_chain' else 'chain';a,b=(545,645) if name=='monocle_chain' else (785,885)
  t=smooth(a,b,y);top=1-smooth(a-75,a+20,y)
  return normalize([(base,top),(prefix+'mid',(1-top)*(1-t)),(prefix+'end',(1-top)*t)])
 if name=='crest':
  t=1-smooth(90,265,y);return [('crest',1-t*.75),('crest_tip',t*.75)]
 if name in ['arm_front_full','arm_back']:
  side='front' if name=='arm_front_full' else 'back';sh,el,wr=joints[side]
  bend=smooth(el[1]-65,el[1]+65,y);shoulder=.35*(1-smooth(sh[1],sh[1]+65,y));wrist=smooth(wr[1]-85,wr[1]+5,y)
  return normalize([('chest',shoulder),('upper_'+side,(1-shoulder)*(1-bend)),('fore_'+side,(1-shoulder)*bend*(1-wrist)),('hand_'+side,(1-shoulder)*bend*wrist)])
 if cat and name.startswith('paw_'):
  side='back' if 'back' in name else 'front';start=1095 if side=='back' else 1140;end=1150 if side=='back' else 1200;w=.58*smooth(start,end,y)
  return [(default,1-w),('knuckle_'+side,w)]
 if name.startswith(('arm_','wing_','paw_')):
  side='back' if 'back' in name else 'front';sh,el,wr=joints[side]
  def project(a,b):
   dx,dy=b[0]-a[0],b[1]-a[1];return ((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)
  upper='upper_'+side;fore='fore_'+side;hand='hand_'+side
  if 'upper' in name or name=='arm_back':
   t=project(sh,el);shoulder=.24*(1-smooth(-.05,.35,t));elbow=.44*smooth(.60,1.12,t)
   return normalize([('chest',shoulder),(upper,1-shoulder-elbow),(fore,elbow)])
  if 'fore' in name or 'mid' in name or name=='wing_back_tip':
   t=project(el,wr);near=.34*(1-smooth(-.1,.35,t));far=.52*smooth(.65,1.12,t)
   return normalize([(upper,near),(fore,1-near-far),(hand,far)])
  t=project(el,wr);wrist=.28*(1-smooth(.82,1.22,t));feather=.42*smooth(.96,1.6,t) if not cat else 0
  return normalize([(fore,wrist),(hand,1-wrist-feather),('feather_'+side,feather)])
 return [(default,1)]

def normalize(weights):
 combined={}
 for b,w in weights:
  if w>1e-6:combined[b]=combined.get(b,0)+w
 total=sum(combined.values());return [(b,w/total) for b,w in combined.items()]
