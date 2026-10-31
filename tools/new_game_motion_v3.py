"""Layered, soft performances; physical rest pose, restrained face and torso work."""
import math
from new_game_motion_flow import bake_curve

def refine_motion_v3(S,cat):
 def sample(keys):
  return bake_curve(keys)
 def rotate(c,b,keys):c['bones'].setdefault(b,{})['rotate']=[{'time':t,'value':v} for t,v in sample(keys)]
 def move(c,b,keys):c['bones'].setdefault(b,{})['translate']=[{'time':t,'x':x,'y':y} for t,x,y in sample(keys)]
 def scale(c,b,keys):c['bones'].setdefault(b,{})['scale']=[{'time':t,'x':x,'y':y} for t,x,y in sample(keys)]
 def duration(c):return max(k.get('time',0) for bone in c['bones'].values() for timeline in bone.values() for k in timeline)
 # Two unequal breaths, including a small quiet pause after exhaling.
 D=11.6 if cat else 10.2;keys=[(0,0),(D*.17,1),(D*.23,.98),(D*.43,0),(D*.51,0),(D*.68,.92),(D*.75,.9),(D*.95,0),(D,0)]
 breath={'bones':{},'slots':{}}
 for b,ax,ay in [('belly',.036 if cat else .032,.020),('ribs',.024,.025)]:
  scale(breath,b,[(t,1+v*ax,1+v*ay) for t,v in keys])
 move(breath,'spine_mid',[(t,0,v*1.6) for t,v in keys]);move(breath,'neck',[(t,0,v*.7) for t,v in keys])
 scale(breath,'cheek_left',[(t,1+v*.008,1+v*.004) for t,v in keys]);scale(breath,'cheek_right',[(t,1+v*.008,1+v*.004) for t,v in keys])
 S['animations']['breath']=breath
 if cat:
  # The old alternate paw drawings include their own shirt cuff (and one even
  # includes a second lens). Keep the clean paw, and articulate its fingers.
  for c in S['animations'].values():
   for k in c['slots'].get('hand_front',{}).get('attachment',[]):
    if k.get('name') in ['paw_front_push','paw_front_stamp']:k['name']='paw_front_rest'
 for name,c in S['animations'].items():
  if name in ['breath','idle','fg_idle']:continue
  D=duration(c);loop=name.endswith('_loop')
  # Divide a trunk lean over the spine, instead of turning one torso card.
  chest=c['bones'].get('chest',{}).get('rotate',[])
  if chest:
   original=[(k['time'],k.get('value',0)) for k in chest]
   c['bones']['spine_low']={'rotate':[{'time':t,'value':v*.20} for t,v in original]}
   c['bones']['spine_mid']={'rotate':[{'time':t,'value':v*.30} for t,v in original]}
   c['bones']['chest']['rotate']=[{'time':t,'value':v*.32} for t,v in original]
  for k in c['bones'].get('head',{}).get('rotate',[]):k['value']*=.42
  for k in c['bones'].get('crest',{}).get('rotate',[]):k['value']*=.42
  if not loop:
   strength=.45 if name.startswith('react') else .65 if name.startswith('idle') else 1
   # Ears, cheeks and the beak/muzzle have distinct local deformations.
   rotate(c,'ear_left',[(0,0),(D*.23,-2.4*strength),(D*.50,.7*strength),(D*.78,0),(D,0)])
   rotate(c,'ear_right',[(0,0),(D*.31,1.8*strength),(D*.57,-.5*strength),(D*.85,0),(D,0)])
   move(c,'muzzle',[(0,0,0),(D*.20,0,-1.6*strength),(D*.48,0,.7*strength),(D*.78,0,0),(D,0,0)])
   scale(c,'head',[(0,1,1),(D*.18,1.004,.994),(D*.40,.998,1.005),(D*.72,1,1),(D,1,1)])
   for bone,lag,amp in [('chain_mid',.05,2.8),('chain_end',.10,3.8),('lens_chain_mid',.04,2.0),('lens_chain_end',.09,2.7),('crest_tip',.025,-3.4),('feather_front',.055,3.2),('feather_back',.075,-2.4)]:
    lag=min(lag,D*.1);rotate(c,bone,[(0,0),(D*.24+lag,amp*strength),(D*.47+lag,-amp*.38*strength),(D*.68+lag,amp*.1*strength),(D*.88,0),(D,0)])
   # A very small compression is concentrated in the ribs at the acting beat.
   scale(c,'chest',[(0,1,1),(D*.20,1.009,.994),(D*.43,.997,1.008),(D*.72,1,1),(D,1,1)])
   if cat:
    grip=1 if name.startswith(('stamp','catch')) else .65 if name.startswith('push') else .35
    move(c,'knuckle_front',[(0,0,0),(D*.36,-.8*grip,3.5*grip),(D*.62,0,2.5*grip),(D*.92,0,0),(D,0,0)])
    scale(c,'knuckle_front',[(0,1,1),(D*.42,1.025,1-.055*grip),(D*.68,1.012,1-.025*grip),(D,1,1)])
 # Keep major acting limbs and the head on the original pose when idle. Only
 # their skin breathes; no perpetual root/head rotation is used as respiration.
 for name in ['idle','fg_idle']:
  c=S['animations'][name];rotate(c,'root',[(0,0),(16,0)])
  if cat:rotate(c,'chest',[(0,0),(16,0)])
 # The old 90-degree whole-body roll reads as a rotated cutout. The final
 # performance is a supported recline, kneading paws and a soft purring face.
 if cat:
  for name in ['win_max','win_max_loop']:
   c=S['animations'][name];loop=name.endswith('_loop');D=2 if loop else 3.2
   c['bones'].pop('hips',None)
   rotate(c,'hips',[(0,-2 if loop else 0),(D*.35,-2),(D,-2)])
   rotate(c,'spine_low',[(0,-1 if loop else 0),(D*.30,-1),(D,-1)])
   rotate(c,'spine_mid',[(0,-2 if loop else 0),(D*.40,-2),(D,-2)])
   rotate(c,'chest',[(0,-1 if loop else 0),(D*.38,-1),(D,-1)])
   move(c,'hips',[(0,0,-4 if loop else 0),(D*.45,0,-4),(D,0,-4)])
   move(c,'monocle',[(0,0,0),(D,0,0)]);rotate(c,'monocle',[(0,0),(D,0)])
   move(c,'foot_front',[(0,0,0),(D*.25,0,5),(D*.5,0,0),(D*.75,0,4),(D,0,0)])
   move(c,'foot_back',[(0,0,0),(D*.25,0,0),(D*.5,0,4),(D*.75,0,0),(D,0,0)])
   # Paws knead by bending at the wrist, each delayed by half a beat.
   rotate(c,'hand_front',[(0,0),(D*.25,-7),(D*.5,0),(D*.75,-6),(D,0)])
   rotate(c,'hand_back',[(0,0),(D*.25,0),(D*.5,6),(D*.75,0),(D,0)])
   scale(c,'cheek_left',[(0,1,1),(D*.3,1.025,1.012),(D*.65,1.012,1.020),(D,1.025,1.012)])
  # Kneading shoulders stay relaxed instead of extending both arms to the face.
  for name in ['win_max','win_max_loop']:
   c=S['animations'][name];D=2 if name.endswith('_loop') else 3.2
   for side in ['front','back']:
    rotate(c,'upper_'+side,[(0,0),(D*.3,2 if side=='front' else -2),(D,2 if side=='front' else -2)])
    rotate(c,'fore_'+side,[(0,0),(D*.3,-6 if side=='front' else 6),(D,-6 if side=='front' else 6)])
 else:
  for name in ['win_max','win_max_loop']:
   c=S['animations'][name];loop=name.endswith('_loop');D=2 if loop else 3.2
   c['bones'].pop('hips',None);move(c,'hips',[(0,0,70 if loop else 0),(D*.1,0,70 if loop else -12),(D*.23,0,80),(D*.38,0,70),(D,0,70)])
   scale(c,'chest',[(0,1,1),(D*.1,1.025,.98),(D*.23,.987,1.022),(D*.4,1,1),(D,1,1)])
 S['skeleton']['hash']=('purrfia' if cat else 'parrot')+'-soft-skin-v3-20261026'
