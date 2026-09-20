"""Build the male rig while preserving every PSD layer's position and z-order."""
from __future__ import annotations
import json, re
from pathlib import Path
import numpy as np
from PIL import Image, ImageChops, ImageEnhance
from psd_tools import PSDImage

APP = Path(__file__).resolve().parent.parent
PSD_PATH = APP / "design/source/spine/psd/spine-pieces-project-1.psd"
SOURCE_OUT = APP / "design/source/spine/images"
SPINE_OUT = APP / "static/assets/spines/cast_guy"
REPAIR_OUT = APP / "design/source/spine/repair_parts"
ALPHA_FLOOR, PAD, PAGE_W = 12, 2, 512
ROOT = (100, 500)
JOINTS = {
 "root":ROOT,"hips":(100,230),"chest":(100,220),"head":(100,100),
 "leg_upper_l":(74,240),"leg_lower_l":(58,385),"foot_l":(53,445),
 "leg_upper_r":(119,240),"leg_lower_r":(126,382),"foot_r":(128,458),
 "arm_upper_l":(55,130),"arm_lower_l":(31,195),"hand_l":(42,245),"arm_upper_r":(130,120),
 "arm_lower_r":(160,160),"hand_r":(178,130),"bat":(178,122),
}
PARENTS = {
 "hips":"root","chest":"hips","head":"chest",
 "leg_upper_l":"hips","leg_lower_l":"leg_upper_l","foot_l":"leg_lower_l",
 "leg_upper_r":"hips","leg_lower_r":"leg_upper_r","foot_r":"leg_lower_r",
 "arm_upper_l":"chest","arm_lower_l":"arm_upper_l","hand_l":"arm_lower_l","arm_upper_r":"chest",
 "arm_lower_r":"arm_upper_r","hand_r":"arm_lower_r",
 # Keep the bat in the same coordinate space as chest/head. The source pose has
 # it crossing behind the neck; parenting it to the wrist lets tiny wrist motion
 # slide the two visible ends in opposite directions and reads as a broken bat.
 "bat":"chest",
}

def bone_for(n):
 if n.startswith("torso"): return "chest"
 if n.startswith("head"): return "head"
 if n == "Left weapon": return "bat"
 tests = [("left_leg · 0","leg_upper_l"),("left_leg · 1","leg_lower_l"),("left_leg · 2","foot_l"),
  ("right_leg · 0","leg_upper_r"),("right_leg · 1","leg_lower_r"),("right_leg · 2","foot_r"),
  ("left_arm · 1","arm_lower_l"),("left_arm · 2","hand_l"),("right_arm · 1","arm_upper_r"),
  ("right_arm · 0","arm_lower_r"),("right_arm · 2","hand_r")]
 return next((b for p,b in tests if n.startswith(p)), "root")

def slug(i,n): return f"layer_{i:02d}_" + re.sub(r"[^a-z0-9]+","_",n.lower()).strip("_")
def to_spine(x,y): return x-ROOT[0], ROOT[1]-y

def trim_layer(layer,size):
 canvas=Image.new("RGBA",size); image=layer.composite()
 if image is not None: canvas.alpha_composite(image.convert("RGBA"),layer.offset)
 alpha=np.asarray(canvas.getchannel("A")); ys,xs=np.where(alpha>ALPHA_FLOOR)
 if not len(xs): return None
 box=(int(xs.min()),int(ys.min()),int(xs.max())+1,int(ys.max())+1)
 cropped=canvas.crop(box)
 cropped.putalpha(cropped.getchannel("A").point(lambda a:0 if a<=ALPHA_FLOOR else a))
 return cropped,box

def trim_canvas(image):
 alpha=np.asarray(image.getchannel("A")); ys,xs=np.where(alpha>ALPHA_FLOOR)
 box=(int(xs.min()),int(ys.min()),int(xs.max())+1,int(ys.max())+1)
 return image.crop(box),box

def main():
 psd=PSDImage.open(PSD_PATH); SOURCE_OUT.mkdir(parents=True,exist_ok=True); SPINE_OUT.mkdir(parents=True,exist_ok=True)
 layers=[]
 # These low-resolution PSD layers are replaced by the reviewed repair: old
 # floating left forearm/hand and the three blurry head paint layers.
 replaced={8,11,14,21,23}
 for i,layer in enumerate(psd):
  if i in replaced: continue
  trimmed=trim_layer(layer,psd.size)
  if trimmed is None: continue
  image,box=trimmed; name=slug(i,layer.name); image.save(SOURCE_OUT/f"{name}.png")
  layers.append({"index":i,"source":layer.name,"name":name,"bone":bone_for(layer.name),"image":image,"box":box})

 repair_arm=Image.open(REPAIR_OUT/"left_arm_full_canvas.png").convert("RGBA")
 repair_head=Image.open(REPAIR_OUT/"head_crisp_canvas.png").convert("RGBA")
 # The pocket arm is deliberately one locked texture. Its earlier three-piece
 # version could expose elbow/wrist cuts during breathing; review explicitly
 # prefers a static continuous arm over independent articulation here.
 image,box=trim_canvas(repair_arm); image.save(SOURCE_OUT/"repair_arm_full.png")
 layers.append({"index":27,"source":"repair_arm_full","name":"repair_arm_full","bone":"chest","image":image,"box":box})
 image,box=trim_canvas(repair_head); image.save(SOURCE_OUT/"repair_head_crisp.png")
 layers.append({"index":28,"source":"repair_head_crisp","name":"repair_head_crisp","bone":"head","image":image,"box":box})

 # This PSD's iteration order is back-to-front, matching compositor/Spine order.
 ordered=sorted(layers,key=lambda p:p["index"])
 rebuilt=Image.new("RGBA",psd.size)
 for p in ordered: rebuilt.alpha_composite(p["image"],p["box"][:2])
 reference=psd.composite().convert("RGBA")
 reference.putalpha(reference.getchannel("A").point(lambda a:0 if a<=ALPHA_FLOOR else a))
 diff=ImageEnhance.Brightness(ImageChops.difference(reference,rebuilt)).enhance(4)
 sheet=Image.new("RGBA",(psd.width*3+20,psd.height),(20,20,20,255))
 for im,pos in [(reference,(0,0)),(rebuilt,(psd.width+10,0)),(diff,(psd.width*2+20,0))]: sheet.alpha_composite(im,pos)
 sheet.save(APP/"design/source/spine/guy_psd_rebuild_compare.png")

 placed=[]; x=y=PAD; shelf_h=0
 for p in sorted(layers,key=lambda p:p["image"].height,reverse=True):
  im=p["image"]
  if x+im.width+PAD>PAGE_W: x,y,shelf_h=PAD,y+shelf_h+PAD,0
  placed.append((p,x,y)); x+=im.width+PAD; shelf_h=max(shelf_h,im.height)
 page_h=y+shelf_h+PAD; page=Image.new("RGBA",(PAGE_W,page_h))
 for p,px,py in placed: page.alpha_composite(p["image"],(px,py))
 page.save(SPINE_OUT/"cast_guy.png")
 atlas=[f"cast_guy.png\nsize:{PAGE_W},{page_h}\nformat:RGBA8888\nfilter:Linear,Linear\nrepeat:none\n"]
 for p,px,py in placed:
  im=p["image"]; atlas.append(f'{p["name"]}\nbounds:{px},{py},{im.width},{im.height}\noffsets:0,0,{im.width},{im.height}\nindex:-1\n')
 (SPINE_OUT/"cast_guy.atlas").write_text("".join(atlas),encoding="utf-8")

 bones=[{"name":"root"}]
 for name,parent in PARENTS.items():
  wx,wy=to_spine(*JOINTS[name]); px,py=to_spine(*JOINTS[parent]); b={"name":name,"parent":parent}
  if wx!=px:b["x"]=wx-px
  if wy!=py:b["y"]=wy-py
  bones.append(b)
 slots=[]; attachments={}
 for p in ordered:
  name,bone,im=p["name"],p["bone"],p["image"]; slots.append({"name":name,"bone":bone,"attachment":name})
  x0,y0,x1,y1=p["box"]; cx,cy=to_spine((x0+x1)/2,(y0+y1)/2); jx,jy=to_spine(*JOINTS[bone])
  a={"width":im.width,"height":im.height}
  if cx!=jx:a["x"]=round(cx-jx,2)
  if cy!=jy:a["y"]=round(cy-jy,2)
  # Art-direction adjustment: raise the locked bat slightly so its two visible
  # ends align through the occluded area behind the head. Positive Spine Y is up.
  if p["source"]=="Left weapon": a["y"]=round(a.get("y",0)+9,2)
  attachments[name]={name:a}
 data={"skeleton":{"hash":"guy-psd-layer-aligned-v3","spine":"4.2.74","x":-100,"y":0,"width":224,"height":512,"images":"./images/"},
  "bones":bones,"slots":slots,"skins":[{"name":"default","attachments":attachments}],"animations":{}}
 (SPINE_OUT/"guy.json").write_text(json.dumps(data,indent=2),encoding="utf-8")
 (APP/"design/source/spine/guy.spine").write_text(json.dumps(data,indent=2),encoding="utf-8")
 print(f"wrote {len(layers)} original-position layers; atlas {PAGE_W}x{page_h}")

if __name__=="__main__": main()
