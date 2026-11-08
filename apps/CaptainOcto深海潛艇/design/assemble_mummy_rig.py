"""Extract generated rig atlas, place full-canvas layers, and retain joint measurements."""
from pathlib import Path
from PIL import Image
import numpy as np
from scipy.ndimage import label, binary_dilation
import json, shutil
ROOT=Path(__file__).resolve().parent
OUT=ROOT/'source/mummy_delivery/mascot'
OUT.mkdir(parents=True,exist_ok=True)
src=ROOT/'source/mummy_delivery/originals/RigResult.png'
if not src.exists():src=Path(json.loads((ROOT/'generated_sources.json').read_text())['RigResult']['path'])
shutil.copy2(src,OUT/'rig_source.png')
atlas=Image.open(src).convert('RGBA')
layers=OUT/'layers'; layers.mkdir(exist_ok=True)
names=['head','torso','arm_l','arm_r','pelvis','leg_l','leg_r','tail']
# Target boxes measured against the required shoulder/head clearance and mild outward knees.
boxes=[(300,160,724,570),(312,510,712,1004),(215,560,385,1100),(639,560,809,1100),
 (332,916,692,1150),(283,1030,483,1456),(541,1030,741,1456),(610,670,950,1090)]
composite=Image.new('RGBA',(1024,1536))
for i,(name,box) in enumerate(zip(names,boxes)):
 col=i%4;row=i//4
 part_atlas=atlas
 if name=='torso' and (ROOT/'source/mummy_delivery/originals/RigTorsoV2.png').exists():
  part_atlas=Image.open(ROOT/'source/mummy_delivery/originals/RigTorsoV2.png').convert('RGBA').resize(atlas.size,Image.Resampling.LANCZOS)
 piece=part_atlas.crop((col*384,row*512,(col+1)*384,(row+1)*512))
 threshold=200 if name=='torso' and part_atlas is not atlas else 60
 a=np.array(piece); labs,n=label(a[:,:,3]>threshold); counts=np.bincount(labs.ravel());counts[0]=0
 keep=binary_dilation(labs==counts.argmax(),iterations=2);a[:,:,3]=np.where(keep,a[:,:,3],0);piece=Image.fromarray(a)
 bbox=piece.getchannel('A').point(lambda v:255 if v>60 else 0).getbbox()
 piece=piece.crop(bbox).resize((box[2]-box[0],box[3]-box[1]),Image.Resampling.LANCZOS)
 im=Image.new('RGBA',(1024,1536)); im.alpha_composite(piece,(box[0],box[1]));im.save(layers/(name+'.png'))
order=['tail','leg_l','leg_r','pelvis','torso','arm_l','arm_r','head']
for name in order:composite.alpha_composite(Image.open(layers/(name+'.png')))
composite.save(OUT/'assembled.png')
joints=dict(ground=[512,1456],hip=[512,1050],belly=[512,890],chest=[512,700],neckBase=[512,570],headBase=[512,545],headTop=[512,160],
 shoulderL=[322,610],elbowL=[270,830],wristL=[312,1060],handTipL=[312,1090],
 shoulderR=[702,610],elbowR=[754,830],wristR=[712,1060],handTipR=[712,1090],
 hipL=[430,1080],kneeL=[378,1240],ankleL=[383,1400],toeL=[370,1450],
 hipR=[594,1080],kneeR=[646,1240],ankleR=[641,1400],toeR=[654,1450],
 tail=[[652,1053],[759,906],[831,736]])
(OUT/'joints.json').write_text(json.dumps(joints,indent=2))
(OUT/'layers.json').write_text(json.dumps(dict(order=order)))
(OUT/'mascot.json').write_text(json.dumps(dict(name='mummyCat',reels='left',scale=0.5,spine='4.2',grid=22)))
print(OUT)
