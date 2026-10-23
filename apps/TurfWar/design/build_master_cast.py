"""Cut native full-figure masters without ever resizing an individual body part.

All visible pixels come from one uniformly registered master per character.
Native painted body underlays are used only underneath those visible pixels.
The reconstruction gate rejects silhouette or colour drift from the master.
"""
from pathlib import Path
import argparse, json, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import binary_dilation, binary_erosion, binary_fill_holes, label, distance_transform_edt
from build_crossed_cast import clean, install, KIT, APP, D

SRC=D/'_incoming/street_cast_crossed_v2'
SIZE=(1024,2048)
ORDER={'mg':['prop_bat','body','arm_l','arm_r','head','dangle_chain','dangle_mask'],
       'fg':['body','arm_r','arm_l','head','prop_cigar','dangle_smoke']}
# Measured on source/master-grid.jpg. These are selection masks, never new art.
CUTS={
 'mg':[
  ('prop_bat',[(90,280),(270,280),(365,480),(410,580),(300,645),(90,420)]),
  ('prop_bat',[(738,965),(802,970),(902,1155),(808,1205),(750,1095)]),
  ('dangle_mask',[(670,529),(712,520),(725,588),(686,609),(660,583)]),
  ('head',[(270,160),(770,160),(770,582),(703,605),(661,594),(630,581),(607,594),(569,576),(546,551),(511,593),(453,582),(420,561),(391,554),(363,536),(327,529),(314,502),(298,490),(290,460),(300,420),(280,390)]),
  ('dangle_chain',[(414,551),(455,572),(500,616),(564,652),(607,622),(638,574),(681,570),(672,639),(650,690),(638,721),(650,773),(538,791),(518,716),(464,686),(419,615)]),
  # The rear left hand rests on the opposite upper arm and must be selected
  # before the foreground right sleeve surrounding it.
  ('arm_l',[(390,690),(440,697),(457,719),(468,746),(483,773),(424,776),(393,753),(385,728)]),
  ('arm_r',[(176,635),(280,565),(353,550),(403,568),(430,620),(445,691),(435,754),(472,781),(527,773),(568,765),(629,776),(669,783),(692,776),(739,803),(727,833),(673,866),(650,911),(601,939),(500,965),(420,971),(328,957),(259,928),(217,882),(174,839)]),
  ('arm_l',[(690,601),(790,616),(811,667),(839,690),(869,762),(910,842),(900,900),(869,949),(810,993),(732,1006),(625,990),(569,963),(650,919),(673,862),(741,817),(690,776),(639,787),(650,719),(681,659)]),
 ],
 'fg':[
  ('dangle_smoke',[(225,230),(315,230),(318,380),(292,406),(261,389),(230,335)]),
  ('prop_cigar',[(257,394),(370,370),(383,399),(320,429),(263,441)]),
  ('head',[(310,170),(655,170),(652,357),(682,391),(651,436),(612,475),(570,497),(520,524),(464,515),(418,503),(389,491),(344,474),(325,436),(333,417),(364,409),(361,388),(337,379),(334,344),(316,313)]),
  ('arm_r',[(529,746),(577,698),(633,666),(676,659),(711,676),(732,703),(717,731),(700,759),(683,781),(636,771),(580,759)]),
  ('arm_l',[(650,620),(746,567),(842,541),(904,567),(902,653),(879,701),(900,756),(868,821),(830,876),(790,926),(749,957),(701,981),(600,975),(499,947),(399,929),(339,904),(326,881),(331,829),(275,828),(220,813),(207,764),(233,719),(281,700),(332,712),(372,751),(521,778),(651,702),(701,643)]),
  ('arm_r',[(171,585),(255,550),(314,565),(330,613),(353,670),(386,716),(379,759),(338,818),(329,883),(343,920),(290,938),(168,936),(111,864),(95,796),(137,693)]),
 ],
}
TORSO={
 'mg':[(326,555),(681,574),(746,661),(742,1087),(329,1108),(300,944),(289,720)],
 'fg':[(342,478),(610,454),(733,564),(788,765),(789,1105),(633,1235),(310,1233),(227,1090),(262,703)],
}
JOINTS={
 'mg':{'head_top':[512,178],'neck':[530,577],'chest':[534,701],
       'waist':[523,1020],'hips':[523,1130],
       'shoulder_r':[324,623],'elbow_r':[308,859],'wrist_r':[669,816],
       'shoulder_l':[749,664],'elbow_l':[827,893],'wrist_l':[437,736]},
 'fg':{'head_top':[498,178],'neck':[497,506],'chest':[520,650],
       'waist':[520,1030],'hips':[520,1122],
       'shoulder_r':[250,611],'elbow_r':[192,848],'wrist_r':[664,715],
       'shoulder_l':[816,618],'elbow_l':[806,807],'wrist_l':[318,775]},
}
ANCHORS={'mg':{'prop_bat':[510,800],'dangle_chain':[535,590],'dangle_mask':[686,550]},
         'fg':{'prop_cigar':[370,397],'dangle_smoke':[282,403]}}

def mask(poly):
 im=Image.new('L',SIZE); ImageDraw.Draw(im).polygon(poly,fill=255)
 return np.asarray(im)>0

def master(who):
 p=SRC/who/'source/master-native.png'; im=clean(p)
 # A single uniform scale is the only registration allowed for all parts.
 scale=1495/im.height; width=round(im.width*scale)
 assert width<=900,'Master too wide; redraw the coherent figure instead of squeezing it'
 im=im.resize((width,1495),Image.Resampling.LANCZOS)
 a=np.array(im); a[:,:,3]=np.rint(a[:,:,3].astype(float)*255/254).clip(0,255).astype('uint8')
 a[:,:,3][a[:,:,3]>220]=255
 # Native output can contain enclosed alpha pinholes in a trouser/shoe fill.
 # Clean only tiny enclosed specks, never the open space between the legs.
 holes=binary_fill_holes(a[:,:,3]>16)&(a[:,:,3]<=16)
 labs,n=label(holes)
 _,nearest=distance_transform_edt(a[:,:,3]<=220,return_indices=True)
 for k in range(1,n+1):
  m=labs==k
  if m.sum()<=400:
   a[m]=a[nearest[0][m],nearest[1][m]]
   a[:,:,3][m]=255
 a[a[:,:,3]==0]=0
 full=Image.new('RGBA',SIZE);full.alpha_composite(Image.fromarray(a),((1024-width)//2,178))
 full.save(SRC/who/'source/master.png');return full,scale

def build(who):
 out=SRC/who; out.mkdir(parents=True,exist_ok=True)
 full,scale=master(who); px=np.array(full); alpha=px[:,:,3]
 owner=np.full(alpha.shape,-1,dtype=np.int8)
 for name,poly in CUTS[who]:
  m=mask(poly)&(alpha>0)&(owner<0)
  if name=='dangle_chain' or (name=='prop_bat' and poly[0][1]<500):
   rgb=px[:,:,:3].astype(int)
   gold=(rgb[:,:,0]>140)&(rgb[:,:,1]>60)&(rgb[:,:,1]<rgb[:,:,0]*.86)&(rgb[:,:,2]<130)
   m &= binary_dilation(gold,iterations=12 if name=='prop_bat' else 4)
  owner[m]=ORDER[who].index(name)
 # Any unclaimed outer ink beside the torso belongs to a neighbouring
 # sleeve/head, never to a second stationary arm on the body underlayer.
 yy,xx=np.indices(alpha.shape)
 loose=(alpha>0)&(owner<0)
 if who=='mg':
  batLoose=loose&(yy<620)&(xx<350)
  owner[batLoose]=ORDER[who].index('prop_bat')
  loose=(alpha>0)&(owner<0)
 headLoose=loose&(yy<(560 if who=='mg' else 490))
 owner[headLoose]=ORDER[who].index('head')
 loose=(alpha>0)&(owner<0)
 outer=loose&~mask(TORSO[who])&(yy<(1008 if who=='mg' else 982))
 dl=distance_transform_edt(owner!=ORDER[who].index('arm_l'))
 dr=distance_transform_edt(owner!=ORDER[who].index('arm_r'))
 owner[outer&(dl<dr)]=ORDER[who].index('arm_l')
 owner[outer&(dr<=dl)]=ORDER[who].index('arm_r')
 owner[(alpha>0)&(owner<0)]=ORDER[who].index('body')

 # Native painted armless torso from the previous delivery. Its visible pixels
 # are NOT used; it only supplies the shirt/coat hidden under the crossed arms.
 under=clean(D/f'_incoming/street_cast_crossed/{who}/source/body.png')
 factor=1350/under.height
 under=under.resize((round(under.width*factor),1350),Image.Resampling.LANCZOS)
 canvas=Image.new('RGBA',SIZE);canvas.alpha_composite(under,((1024-under.width)//2,323))
 painted=np.array(canvas)
 torso=mask(TORSO[who])&(alpha==255)
 # Extend an already painted underlayer only within the covered torso mask.
 valid=painted[:,:,3]>220
 _,indices=distance_transform_edt(~valid,return_indices=True)
 filled=painted[indices[0],indices[1]];filled[:,:,3]=255
 # Preserve original ink at cut seams underneath the antialiased edges.
 seam=np.zeros(alpha.shape,dtype=bool)
 for k in range(len(ORDER[who])):
  own=owner==k
  seam |= binary_dilation(own,iterations=2)&binary_dilation((owner>=0)&~own,iterations=2)
 seam &= (alpha==255)&(owner>=0)
 images={}
 for i,name in enumerate(ORDER[who]):
  a=np.zeros_like(px); own=owner==i; a[own]=px[own]
  if name=='body':
   hidden=torso&(owner>i)
   a[hidden]=filled[hidden]
   a[seam]=px[seam]
   holes=binary_fill_holes(a[:,:,3]>16)&(a[:,:,3]<=16)&(alpha==255)&(owner>i)
   a[holes]=filled[holes]
  else:
   # Part extensions are hidden beneath later parts, never outside the master.
   above=(owner>i)&(alpha==255)
   reach=35 if name=='head' else 18 if name.startswith('arm_') else 0
   if reach:
    dist,ix=distance_transform_edt(~own,return_indices=True)
    hidden=above&(dist<=reach)
    a[hidden]=px[ix[0][hidden],ix[1][hidden]]
   # Antialias selection boundaries, retaining the original outer silhouette.
   other=(owner>=0)&(owner!=i)
   cut=binary_dilation(other,iterations=2)&binary_dilation(own,iterations=2)&(alpha==255)&binary_erosion(alpha>0,iterations=3)
   soft=np.array(Image.fromarray(a[:,:,3]).filter(ImageFilter.GaussianBlur(.5)))
   a[:,:,3][cut]=np.minimum(soft[cut],alpha[cut])
   partial=cut&(a[:,:,3]>0)&(a[:,:,3]<255)
   a[:,:,:3][partial]=px[:,:,:3][partial]
  a[:,:,:3][seam&(a[:,:,3]>0)]=px[:,:,:3][seam&(a[:,:,3]>0)]
  a[a[:,:,3]==0]=0
  images[name]=Image.fromarray(a)
  images[name].save(out/f'{name}.png',optimize=True)
 rebuilt=Image.new('RGBA',SIZE)
 for name in ORDER[who]:rebuilt.alpha_composite(images[name])
 rebuilt.save(out/'full.png',optimize=True)
 actual=np.array(rebuilt).astype(int); target=px.astype(int)
 delta=np.abs(actual-target)
 # A cut cannot alter the original proportion, silhouette or rest-pose colour.
 assert np.array_equal(actual[:,:,3]>16,target[:,:,3]>16),'Master silhouette changed'
 assert delta.max()<=1,f'Master changed by {delta.max()} levels'
 report={'uniformScale':scale,'partScaleOverrides':{},'silhouetteIoU':1.0,
         'maxPixelError':int(delta.max()),'nativeMaster':'source/master-native.png'}
 (out/'proportion-check.json').write_text(json.dumps(report,indent=2)+'\n')
 spec={'version':1,'archetype':'miami_green_guy','size':list(SIZE),
       'feet_y':1673,'top_y':178,'sides':'anatomical','mirrored':False,
       'order':ORDER[who],'joints':JOINTS[who],'anchors':ANCHORS[who],
       'arms':{'l':'crossed','r':'crossed'},
       'provenance':'Native imagegen full master; uniform scale only, polygon partition. Painted torso underlayer remains fully hidden at rest. No independent part resizing.'}
 (out/'layers.json').write_text(json.dumps(spec,indent=2)+'\n')
 subprocess.run([sys.executable,str(KIT/'check_layered_art.py'),str(out)],check=True)
 subprocess.run([sys.executable,str(KIT/'build_layered_rig.py'),str(out)],check=True)
 manifest=json.loads((out/'layers.manifest.json').read_text())
 for layer in manifest['layers']:
  bones=layer['rig']['bones']
  if layer['name']=='body':
   # Folded arms and their covered chest must share the same chest transform.
   # A torso blend starting above the elbows shears the sleeve/coat seam.
   chest=next(i for i,b in enumerate(bones) if b['name']=='chest')
   hips=next(i for i,b in enumerate(bones) if b['name']=='hips')
   for i,(_,y) in enumerate(layer['rig']['verts']):
    if y<JOINTS[who]['hips'][1]:
     t=max(0,min(1,(y-1030)/(JOINTS[who]['hips'][1]-1030)))
     t=t*t*(3-2*t)
     w=[0.0]*len(bones);w[chest]=1-t;w[hips]=t
     layer['rig']['weights'][i]=w
  for prop,parent in [('prop_bat','chest'),('prop_cigar','head')]:
   if prop in ORDER[who]:
    next(b for b in bones if b['name']==prop)['parent']=next(i for i,b in enumerate(bones) if b['name']==parent)
 (out/'layers.manifest.json').write_text(json.dumps(manifest,separators=(',',':')))
 return out,manifest

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--install',action='store_true');args=ap.parse_args()
 built={who:build(who) for who in ('mg','fg')}
 preview=Image.new('RGB',(1000,900),'#55585D')
 for i,who in enumerate(('mg','fg')):
  im=Image.open(built[who][0]/'full.png');im.thumbnail((500,900));preview.paste(im,(i*500,0),im)
 preview.save(D/'cast_brief_crossed/proportions_v2.jpg')
 if args.install:
  for who,(out,manifest) in built.items():install(who,out,manifest)

if __name__=='__main__':main()
