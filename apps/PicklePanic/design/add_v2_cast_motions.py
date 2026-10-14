"""Append original v2 choreography without changing any of the nine existing clips."""
from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib,shutil,math
ROOT=Path(__file__).resolve().parents[1];out=ROOT/'design/source/production_v2/cast';out.mkdir(exist_ok=True)
def r(keys):return [{'time':t,'value':v}for t,v in keys]
def xy(keys):return [{'time':t,'x':x,'y':y}for t,x,y in keys]
def color(keys):return [{'time':t,'color':f'ffffff{round(v*255):02x}'}for t,v in keys]
for folder in ['pickleBoss','picklePepper']:
 p=ROOT/'static/assets/spines'/folder/'cast.json';d=json.loads(p.read_text());backup=out/(folder+'_before.json')
 if not backup.exists():shutil.copy2(p,backup)
 before={k:hashlib.sha256(json.dumps(v,sort_keys=True).encode()).hexdigest()for k,v in d['animations'].items()if k not in ['bigwin_cheer','bigwin_hold','fs_trigger','upgrade_slam']}
 fg=folder=='picklePepper'
 intro={'bones':{
 'hip':{'translate':xy([(0,0,0),(.12,0,-18),(.32,0,24),(.65,0,4),(1.1,0,10),(1.6,0,0)])},
 'torso':{'rotate':r([(0,0),(.18,-3 if fg else 2),(.38,5 if fg else -3),(.8,-4 if fg else 2),(1.6,0)]),'scale':xy([(0,1,1),(.12,1.04,.96),(.32,.98,1.04),(1.6,1,1)])},
 'head':{'rotate':r([(0,0),(.24,-4),(.46,5),(1.15,-2),(1.6,0)])},
 'armL':{'rotate':r([(0,0),(.14,-20),(.36,-24),(1.6,0)])},
 'armR':{'rotate':r([(0,0),(.14,20),(.36,24),(1.6,0)])},
 'armL_fore':{'rotate':r([(0,0),(.2,16),(.5,12),(1.6,0)])},
 'armR_fore':{'rotate':r([(0,0),(.2,-16),(.5,-12),(1.6,0)])},
 'helmet':{'translate':xy([(0,0,0),(.30,0,0),(.5,0,65),(.85,0,18),(1.08,0,-5),(1.25,0,0),(1.6,0,0)])},
 'pocket':{'rotate':r([(0,0),(.3,fg and 18 or 3),(.55,fg and -14 or -3),(.85,fg and 9 or 2),(1.6,0)])}
 }}
 hold={'bones':{'hip':{'translate':xy([(0,0,0),(.5,0,5),(1,0,0),(1.5,0,5),(2,0,0)])},'head':{'rotate':r([(0,0),(.5,2),(1,0),(1.5,-2),(2,0)])},'pocket':{'rotate':r([(0,0),(.5,4),(1,0),(1.5,-4),(2,0)])}}}
 if fg:intro['bones']['root']={'scale':xy([(0,1,1),(.4,.25,1),(.65,-1,1),(1.02,-.2,1),(1.32,1,1),(1.6,1,1)])}
 else:
  old=['left_arm_2_hand','left_arm_0_upper_arm','right_arm_2_hand','right_arm_0_upper_arm']
  intro['slots']={s:{'rgba':color([(0,1),(.18,1),(.36,0),(1.6,0)])}for s in old}
  hold['slots']={s:{'rgba':color([(0,0),(2,0)])}for s in old}
  for s in ['v2_raise_L','v2_raise_R']:
   intro['slots'][s]={'rgba':color([(0,0),(.18,0),(.36,1),(1.6,1)])};hold['slots'][s]={'rgba':color([(0,1),(2,1)])}
 trigger={'bones':{'head':{'rotate':r([(0,0),(.12,8),(.4,8),(.65,2),(1.2,0)])},'torso':{'rotate':r([(0,0),(.18,-3),(.5,4),(.75,-1),(1.2,0)])},'armL':{'rotate':r([(0,0),(.25,-24),(.47,14),(.6,0),(1.2,0)])},'armL_fore':{'rotate':r([(0,0),(.25,20),(.47,-16),(.7,4),(1.2,0)])},'hip':{'translate':xy([(0,0,0),(.28,0,4),(.47,0,-8),(.75,0,2),(1.2,0,0)])}}}
 slam={'bones':{'armL':{'rotate':r([(0,0),(.23,-24),(.4,20),(.52,-6),(.9,0)])},'armL_fore':{'rotate':r([(0,0),(.27,20),(.4,-18),(.55,4),(.9,0)])},'torso':{'rotate':r([(0,0),(.28,-4),(.46,5),(.62,-2),(.9,0)])},'head':{'rotate':r([(0,0),(.32,-5),(.5,7),(.65,-3),(.9,0)])},'helmet':{'rotate':r([(0,0),(.46,9),(.58,-6),(.7,3),(.9,0)])},'hip':{'translate':xy([(0,0,0),(.25,0,6),(.4,0,-12),(.53,0,3),(.9,0,0)])}}}
 d['animations'].update(bigwin_cheer=intro,bigwin_hold=hold,fs_trigger=trigger,upgrade_slam=slam)
 # New regions use existing torso bone; bone count stays 24.
 if not fg:
  im=Image.open(ROOT/'static/assets/pickle/mg_cheer_pose_v2.png').convert('RGBA');polys={'L':[(43,117),(185,117),(189,219),(146,244),(161,266),(213,298),(226,366),(169,377),(86,337),(43,286)],'R':[(391,117),(486,116),(534,250),(539,316),(486,343),(414,377),(370,342),(376,300),(430,270),(406,210)]}
  parts=[]
  for side,poly in polys.items():
   mask=Image.new('L',im.size);ImageDraw.Draw(mask).polygon(poly,fill=255);a=im.copy();a.putalpha(Image.composite(im.getchannel('A'),Image.new('L',im.size),mask));box=a.getbbox();a=a.crop(box);a.save(out/f'raised_arm_{side}.png');parts.append({'side':side,'box':box,'offset':[-22 if side=='L' else -28,0]})
   slot='v2_raise_'+side
   if not any(s['name']==slot for s in d['slots']):d['slots'].insert(11,{'name':slot,'bone':'torso','attachment':slot,'color':'ffffff00'})
   x0,y0,x1,y1=box;off=-22 if side=='L'else -28
   d['skins'][0]['attachments'][slot]={slot:{'type':'region','path':slot,'x':(x0+x1)/2+off-283,'y':484-(y0+y1)/2,'width':x1-x0,'height':y1-y0}}
  (out/'raised_arm_registration.json').write_text(json.dumps(parts,indent=2))
 assert len(d['bones'])==24
 for k,h in before.items():assert hashlib.sha256(json.dumps(d['animations'][k],sort_keys=True).encode()).hexdigest()==h
 p.write_text(json.dumps(d,separators=(',',':')))
 (out/(folder+'_keyframes.json')).write_text(json.dumps({k:d['animations'][k]for k in ['bigwin_cheer','bigwin_hold','fs_trigger','upgrade_slam']},indent=2))
 print(folder,'24 bones; nine previous clips preserved')
