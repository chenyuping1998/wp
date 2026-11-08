"""Register generated character layers to a single shared canvas and measured joints."""
from pathlib import Path
import json
import numpy as np
from PIL import Image,ImageDraw,ImageFilter

D=Path(__file__).resolve().parent/'source/volt_delivery'
O=D/'originals';M=D/'mascot';L=M/'layers';L.mkdir(parents=True,exist_ok=True)
SIZE=(1024,1536)
def original(name):return Image.open(O/('mascot_'+name+'.png')).convert('RGBA').resize(SIZE,Image.Resampling.LANCZOS)
def moved(im,dy):
    out=Image.new('RGBA',SIZE);out.alpha_composite(im,(0,dy));return out
def clip(im,polygon):
    mask=Image.new('L',SIZE);ImageDraw.Draw(mask).polygon(polygon,fill=255)
    a=np.array(im);a[:,:,3]=np.minimum(a[:,:,3],np.array(mask));return Image.fromarray(a)
order=['leg_l','leg_r','pelvis','neck','torso','arm_l','arm_r','head']
layers={name:original(name) for name in order}
full=Image.open(O/'mascot_full_v2.png').convert('RGBA').resize(SIZE)
# Register visible surfaces from the identity master so adjoining cloth pixels
# meet exactly. The generated complete parts remain the source for occluded fills.
layers['leg_l']=clip(full,[(320,875),(507,875),(507,1025),(465,1180),(447,1280),(447,1536),(95,1536),(95,1290),(258,1140),(268,975)])
layers['leg_r']=clip(full,[(704,875),(517,875),(517,1025),(559,1180),(577,1280),(577,1536),(929,1536),(929,1290),(766,1140),(756,975)])
# Keep the pelvis at the hip; the articulated thigh carries the rest of each trouser leg.
layers['pelvis']=clip(full,[(288,865),(736,865),(767,1025),(512,1045),(257,1025)])
layers['neck']=moved(layers['neck'],-95)
# Sleeves belong to the moving arms. The torso completes the shoulder and armpit behind them.
layers['torso']=clip(full,[(260,435),(390,375),(634,375),(764,435),(787,960),(237,960)])
layers['arm_l']=clip(full,[(190,425),(290,450),(330,520),(300,625),(290,655),(270,795),(235,900),(255,1065),(0,1125),(0,790),(95,640),(115,545)])
layers['arm_r']=clip(full,[(834,425),(734,450),(694,520),(724,625),(734,655),(754,795),(789,900),(769,1065),(1024,1125),(1024,790),(929,640),(909,545)])
layers['head']=moved(layers['head'],-25)
for name,im in layers.items():im.save(L/(name+'.png'));im.save(M/(name+'.png'))
hair=original('hair');hair.save(M/'hair.png')
hair_zap=moved(original('hair_zap'),-52);hair_zap.save(M/'hair_zap.png')
# Preserve the exact head contour. Only the facial interior receives the alternate expression.
mask=Image.new('L',SIZE);ImageDraw.Draw(mask).ellipse((431,198,593,360),fill=255);mask=mask.filter(ImageFilter.GaussianBlur(5))
for name in ['head_blink','head_laugh','head_zap']:
    variant=moved(original(name),-25)
    out=Image.composite(variant,layers['head'],mask);out.putalpha(layers['head'].getchannel('A'));out.save(M/(name+'.png'))
assembled=Image.new('RGBA',SIZE)
for name in order:assembled.alpha_composite(layers[name])
assembled.alpha_composite(hair);assembled.save(M/'assembled.png')
Image.open(O/'mascot_full_v2.png').save(M/'full_body.png')
joints=dict(ground=[512,1515],hip=[512,930],belly=[512,790],chest=[512,585],neckBase=[512,475],headBase=[512,387],headTop=[512,90],
 shoulderL=[250,515],elbowL=[155,700],wristL=[118,915],handTipL=[108,1060],
 shoulderR=[774,515],elbowR=[869,700],wristR=[906,915],handTipR=[916,1060],
 hipL=[394,958],kneeL=[328,1115],ankleL=[315,1320],toeL=[274,1465],
 hipR=[630,958],kneeR=[696,1115],ankleR=[709,1320],toeR=[750,1465])
(M/'joints.json').write_text(json.dumps(joints,indent=2))
(M/'layers.json').write_text(json.dumps({'order':order}))
(M/'mascot.json').write_text(json.dumps(dict(name='voltMonster',reels='left',scale=.5,spine='4.2',grid=22)))
print(M)
