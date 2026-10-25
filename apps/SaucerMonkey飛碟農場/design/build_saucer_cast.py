"""Continuous weighted Spine cast, measured per new master; no inherited cut polygons."""
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw,ImageFilter
import json,math,shutil
import numpy as np
APP=Path(__file__).resolve().parents[1]
THEME="saucer" if APP.name.startswith("Saucer") else "putt"
SRC=APP/"design/source"/THEME
W,H=560,912
CONFIG={('saucer', 'mg'): {'neck': (270, 340), 'hip': (260, 550), 'shoulderL': (175, 370), 'elbowL': (135, 470), 'shoulderR': (350, 380), 'elbowR': (405, 495), 'flow': [('antenna', (235, 135), (195, 60)), ('cape', (370, 370), (475, 445)), ('tail', (340, 630), (490, 660))], 'face': (210, 190, 345, 305)}, ('saucer', 'fg'): {'neck': (266, 371), 'hip': (280, 570), 'shoulderL': (195, 410), 'elbowL': (155, 510), 'shoulderR': (350, 410), 'elbowR': (386, 510), 'flow': [('antenna', (270, 139), (250, 70)), ('net', (403, 333), (500, 440)), ('tail', (400, 660), (500, 580))], 'face': (175, 235, 305, 350)}, ('putt', 'mg'): {'neck': (272, 316), 'hip': (275, 560), 'shoulderL': (170, 350), 'elbowL': (126, 470), 'shoulderR': (383, 352), 'elbowR': (432, 475), 'flow': [('pompom', (230, 128), (206, 90)), ('towel', (367, 490), (383, 620)), ('tail', (420, 550), (500, 465))], 'face': (190, 180, 342, 298)}, ('putt', 'fg'): {'neck': (244, 362), 'hip': (270, 550), 'shoulderL': (194, 400), 'elbowL': (165, 500), 'shoulderR': (340, 395), 'elbowR': (365, 515), 'flow': [('visor', (240, 160), (115, 160)), ('towel', (430, 350), (475, 525)), ('tail', (365, 640), (500, 620))], 'face': (150, 205, 270, 335)}}
def sigmoid(x):
 return 1/(1+math.exp(-max(-35,min(35,x))))

def facial_cels(full,folder,c):
 names=("neutral","blink","grin","shock","laugh_inhale","laugh_rising","laugh_peak","laugh_settle")
 cels={"neutral":full.copy()}
 mask=Image.new("L",(W,H),0)
 ImageDraw.Draw(mask).rounded_rectangle(c["face"],radius=18,fill=255)
 mask=mask.filter(ImageFilter.GaussianBlur(3))
 for name in names[1:]:
  path=folder/"expressions"/(name+".png")
  if not path.exists():
   raise FileNotFoundError(f"Missing registered facial cel: {path}")
  source=Image.open(path).convert("RGBA").resize((440,420),Image.Resampling.LANCZOS)
  patch=full.copy()
  patch.alpha_composite(source,(60,0))
  cel=Image.composite(patch,full,mask)
  cel.putalpha(full.getchannel("A"))
  cels[name]=cel
 out=folder/"registered";out.mkdir(exist_ok=True)
 for name,im in cels.items():
  im.save(out/(name+".png"))
 sheet=Image.new("RGB",(4*280,2*320),"#dedcd2")
 d=ImageDraw.Draw(sheet)
 for i,(name,im)in enumerate(cels.items()):
  head=im.crop((60,0,500,420))
  head.thumbnail((270,280),Image.Resampling.LANCZOS)
  x=(i%4)*280+5;y=(i//4)*320
  sheet.paste(head,(x,y),head)
  d.text((x+8,y+288),name,fill="black")
 sheet.save(folder/"expressions_contact.png")
 return cels

def main():
 for cast in ("mg","fg"):
  source=SRC/f"cast/{cast}.png"
  if not source.exists():
   print(f"WAIT {cast} master");continue
  c=CONFIG[THEME,cast]
  raw=Image.open(source).convert("RGBA")
  if raw.getextrema()[3][0]!=0:raise ValueError("Cast must have alpha")
  trim=raw.crop(raw.getchannel("A").getbbox())
  trim=ImageOps.contain(trim,(520,882),Image.Resampling.LANCZOS)
  full=Image.new("RGBA",(W,H))
  full.alpha_composite(trim,((W-trim.width)//2,H-trim.height-8))
  folder=SRC/"cast"/cast;folder.mkdir(parents=True,exist_ok=True)
  full.save(folder/"normalized.png")
  # A head framing reference for facial cels, kept independent of the master.
  head=full.crop((60,0,500,420))
  head.save(folder/"head_reference.png")
  root=(280,904);hip=c["hip"];neck=c["neck"]
  pts={"root":root,"hip":hip,"torso":(hip[0],460),"head":neck,
       "armL":c["shoulderL"],"forearmL":c["elbowL"],
       "armR":c["shoulderR"],"forearmR":c["elbowR"]}
  parents={"hip":"root","torso":"hip","head":"torso","armL":"torso","forearmL":"armL","armR":"torso","forearmR":"armR"}
  for name,pivot,tip in c["flow"]:
   pts[name]=pivot
   parents[name]="head" if name in ("pompom","antenna","visor") else "torso"
  names=list(pts)
  bones=[]
  for name,pivot in pts.items():
   parent=parents.get(name);origin=pts[parent] if parent else root
   b=dict(name=name,x=pivot[0]-origin[0],y=origin[1]-pivot[1])
   if parent:b["parent"]=parent
   if name in [x[0] for x in c["flow"]]:
    tip=next(x[2] for x in c["flow"] if x[0]==name)
    b["length"]=math.dist(pivot,tip)
   bones.append(b)
  cols,rows=32,52
  uvs=[];vertices=[];tris=[]
  arr=np.asarray(full)
  for row in range(rows+1):
   y=H*row/rows
   for col in range(cols+1):
    x=W*col/cols;uvs.extend([col/cols,row/rows])
    headw=sigmoid((neck[1]-y)/18)
    torsow=sigmoid((hip[1]-y)/30)*(1-headw)
    weights={"head":headw,"torso":torsow,"hip":1-headw-torsow}
    for side in ("L","R"):
     sh=c["shoulder"+side];el=c["elbow"+side]
     outer=sigmoid((sh[0]-x)/12 if side=="L" else (x-sh[0])/12)
     arm=outer*sigmoid((y-sh[1]+5)/16)*sigmoid((hip[1]+60-y)/30)*(1-headw)
     fore=sigmoid((y-el[1])/20)
     for n in list(weights):weights[n]*=1-arm
     weights["arm"+side]=arm*(1-fore);weights["forearm"+side]=arm*fore
    if THEME=="putt":
     if cast=="mg":
      propw=sigmoid((95-x)/8)*sigmoid((y-520)/12)
     else:
      propw=max(sigmoid((105-x)/7)*sigmoid((y-285)/9)*sigmoid((580-y)/9),sigmoid((178-x)/8)*sigmoid((y-340)/9)*sigmoid((440-y)/9))
     for n in list(weights):weights[n]*=1-propw
     weights["forearmL"]=weights.get("forearmL",0)+propw
    for name,pivot,tip in c["flow"]:
     # A feathered appendage field around its painted centre line, never a cut.
     if name in ("pompom","antenna"):
      k=math.exp(-((x-tip[0])/38)**2-((y-tip[1])/56)**2)*.8
     elif name=="visor":
      k=math.exp(-((x-tip[0])/65)**2-((y-tip[1])/25)**2)*.7
     else:
      cx,cy=(pivot[0]+tip[0])/2,(pivot[1]+tip[1])/2
      k=math.exp(-((x-cx)/45)**2-((y-cy)/90)**2)*.8
     for n in list(weights):weights[n]*=1-k
     weights[name]=k
    clean=[(n,v)for n,v in weights.items()if v>.0001];total=sum(v for _,v in clean)
    vertices.append(len(clean))
    for n,v in clean:
     px,py=pts[n];vertices.extend([names.index(n),round(x-px,4),round(py-y,4),round(v/total,6)])
  for y in range(rows):
   for x in range(cols):
    a=y*(cols+1)+x;b=a+1;d=a+cols+1;e=d+1
    tris.extend([a,b,e,a,e,d])
  def rotation(values,duration):
   return [{"time":duration*t,"value":v}for t,v in values]
  def act(name,duration,amp=1):
   # Distinct staging, anticipation, hold, follow-through and recovery per action.
   waves={
    "idle":[(0,0),(.22,.4),(.5,0),(.74,-.4),(1,0)],
    "nod":[(0,0),(.14,-.35),(.3,1),(.42,1),(.6,-.3),(.79,.18),(1,0)],
    "cheer":[(0,0),(.13,-.55),(.28,-.55),(.48,1),(.60,1),(.76,-.25),(1,0)],
    "throwit":[(0,0),(.18,-.6),(.40,-.6),(.58,1),(.68,.7),(.84,-.2),(1,0)],
    "flinch":[(0,0),(.1,.85),(.2,1),(.37,-.5),(.55,.25),(.75,-.1),(1,0)],
    "alert":[(0,0),(.2,-.3),(.38,1),(.72,1),(.87,.3),(1,0)],
    "glance":[(0,0),(.2,.1),(.38,1),(.65,1),(.82,.2),(1,0)]}
   if name=="chestbeat":
    wave=[(0,0)]
    for beat in range(6):
     at=.2+beat*1.12
     wave.extend([(at/duration,-.35),((at+.15)/duration,-.5),((at+.32)/duration,1),((at+.7)/duration,.12)])
    wave.append((1,0))
   else:wave=waves[name]
   amp=min(amp,.68)
   def channel(factor,phase=0):
    return rotation([(min(1,t+phase) if t not in (0,1) else t,v*factor*amp)for t,v in wave],duration)
   golfer=THEME=="putt"
   # Golfer follows the putter low; captain raises his remote, caddie answers with flag.
   left=(1.6 if golfer else 2.4)*(-1 if name in ("throwit","cheer") and golfer else 1)
   right=(-2.3 if cast=="mg" else 2.0)
   head=3.0 if name in ("glance","alert") else (-2.7 if name=="nod" else -1.2)
   bones={
    "torso":{"rotate":channel(.65)},"head":{"rotate":channel(head,.035)},
    "armL":{"rotate":channel(left)},"forearmL":{"rotate":channel(left*.55,.04)},
    "armR":{"rotate":channel(right,.045)},"forearmR":{"rotate":channel(right*.55,.07)},
    "hip":{"translate":[{"time":duration*t,"x":round(v*(1.1 if name=="glance" else .3)*amp,3),"y":round(v*(2 if name!="idle" else .8)*amp,3)}for t,v in wave]}}
   if name=="glance":
    bones={"head":{"rotate":channel(3.2)},"torso":{"rotate":channel(.35,.05)},"hip":bones["hip"]}
   return {"bones":bones}
  animations={n:act(n,d,a)for n,d,a in [
   ("idle",4.8,.6),("cheer",1.7,1.5),("chestbeat",7.7,1.65),("nod",.8,1),
   ("throwit",1.0,1.6),("flinch",.6,1.25),("alert",.8,1),("glance",1.2,.75)]}
  animations["flutter"]={"bones":{}}
  for i,(name,_,_) in enumerate(c["flow"]):
   # Always-on second track only touches appendages; body acting remains on track 0.
   phase=(-1 if i%2 else 1)
   boost=1.4 if name=="pompom" else 1
   frames=[(0,0),(.2,2.5*phase*boost),(.48,-2.2*phase*boost),(.76,1.7*phase*boost),(1,0)]
   animations["flutter"]["bones"][name]={"rotate":rotation(frames,3.2)}
  mesh=dict(type="mesh",uvs=uvs,triangles=tris,vertices=vertices,hull=(cols+rows)*2,width=W,height=H)
  rig={"skeleton":{"spine":"4.2.40","width":W,"height":H,"x":-280,"y":0},
       "bones":bones,"slots":[{"name":"figure","bone":"root","attachment":"figure"}],
       "skins":[{"name":"default","attachments":{"figure":{"figure":mesh}}}],"animations":animations}
  out=APP/"static/assets/spines"/("sushiMaster" if cast=="mg" else "sushiApprentice")
  backup=SRC/"_previous_runtime"/"spines"/cast
  if not backup.exists():shutil.copytree(out,backup)
  full.save(out/"monkey.png")
  (out/"monkey.atlas").write_text(f"monkey.png\nsize:{W},{H}\nfilter:Linear,Linear\npma:false\nfigure\nbounds:0,0,{W},{H}\noffsets:0,0,{W},{H}\nindex:-1\n")

  cels=facial_cels(full,folder,c)
  attachments={}
  atlas_page=Image.new("RGBA",((W+4)*4,(H+4)*2))
  atlas_text=f"monkey.png\nsize:{atlas_page.width},{atlas_page.height}\nfilter:Linear,Linear\npma:false\n"
  for ci,(expression,cel) in enumerate(cels.items()):
   region="figure" if expression=="neutral" else "figure_"+expression
   x=(ci%4)*(W+4)+2;y=(ci//4)*(H+4)+2
   atlas_page.alpha_composite(cel,(x,y))
   attachments[region]=dict(mesh,path=region)
   atlas_text+=f"{region}\nbounds:{x},{y},{W},{H}\noffsets:0,0,{W},{H}\nindex:-1\n"
  rig["skins"][0]["attachments"]["figure"]=attachments
  def expression_keys(seq):
   return [{"time":t,"name":"figure" if e=="neutral" else "figure_"+e}for t,e in seq]
  for name,animation in animations.items():
   if name=="flutter":continue
   seq=[(0,"neutral")]
   duration=max(k["time"]for b in animation["bones"].values()for channel in b.values()for k in channel)
   if name=="idle":
    seq+=[(2.1,"blink"),(2.24,"neutral"),(4.0,"blink"),(4.15,"neutral")]
   elif name=="chestbeat":
    for beat in range(6):
     at=.2+beat*1.12
     seq += [(at,"laugh_inhale"),(at+.15,"laugh_rising"),(at+.32,"laugh_peak"),(at+.7,"laugh_settle")]
   elif name=="cheer":
    seq += [(.12,"grin"),(.55,"laugh_rising"),(.85,"laugh_peak"),(1.3,"laugh_settle")]
   elif name in ("alert","flinch"):
    seq += [(.08,"shock"),(duration*.75,"blink")]
   elif name in ("nod","throwit"):
    seq += [(.13,"grin")]
   seq += [(duration,"neutral")]
   animation["slots"]={"figure":{"attachment":expression_keys(seq)}}
  atlas_page.save(out/"monkey.png")
  (out/"monkey.atlas").write_text(atlas_text)

  (out/"monkey.json").write_text(json.dumps(rig,separators=(",",":")))
  meta={"_note":"New continuous mesh measured on the approved theme master; no Strike cuts.","out":out.name,
        "root":root,"hip":hip,"neck":neck,"flow":[{"name":n,"links":1}for n,_,_ in c["flow"]],
        "source":str(source),"canvas":[W,H],"face":c["face"],"bones":pts}
  p=APP/"design/source"/cast/"rig.json";p.write_text(json.dumps(meta,indent=2))
  (folder/"measurements.json").write_text(json.dumps(meta,indent=2))
  print(f"{THEME} {cast}: {(cols+1)*(rows+1)} weighted vertices, {len(tris)//3} triangles, nine animations")
if __name__=="__main__":main()
