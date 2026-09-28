"""Package ImageGen artwork into aligned PNG/PSD animation layers.
Art is generated with built-in ImageGen; this script performs extraction,
registration, canvas placement, lossless alpha locking and delivery checks.
"""
from pathlib import Path
import json, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import label, binary_dilation
from psd_tools import PSDImage
from psd_tools.api.layers import PixelLayer

ROOT=Path(__file__).resolve().parent/'cast_parts'
SIZE=(1024,2048)
SRC_SIZE=(887,1774)

def clean(im, minimum=60):
 a=np.array(im);lab,n=label(a[:,:,3]>16)
 counts=np.bincount(lab.ravel());counts[0]=0
 keep=np.isin(lab,np.flatnonzero(counts>=minimum))
 keep=binary_dilation(keep,iterations=3)
 a[~keep]=0
 return Image.fromarray(a)

def mask(points,size=SRC_SIZE,blur=.7):
 m=Image.new('L',size);ImageDraw.Draw(m).polygon(points,fill=255)
 return m.filter(ImageFilter.GaussianBlur(blur)) if blur else m

def cut(im,points=None,m=None):
 if m is None:m=mask(points,im.size)
 a=np.array(im);a[:,:,3]=np.rint(a[:,:,3].astype(float)*np.array(m)/255).astype('uint8')
 a[a[:,:,3]==0]=0
 return Image.fromarray(a)

def affine(im,scale=1,xy=(0,0),size=SRC_SIZE,angle=0,pivot=(0,0)):
 M=np.array([[scale,0,xy[0]],[0,scale,xy[1]],[0,0,1.]])
 if angle:
  x,y=pivot;r=math.radians(angle);c,s=math.cos(r),math.sin(r)
  M=np.array([[c,-s,x-c*x+s*y],[s,c,y-s*x-c*y],[0,0,1.]])@M
 inv=np.linalg.inv(M)
 return im.transform(size,Image.Transform.AFFINE,tuple(inv[:2].ravel()),Image.Resampling.BICUBIC),M

def place(im,M):
 inv=np.linalg.inv(M)
 return im.transform(SIZE,Image.Transform.AFFINE,tuple(inv[:2].ravel()),Image.Resampling.BICUBIC)

def ptx(p,M):return np.round((M@np.array([*p,1.]))[:2],3).tolist()

def compose(layers,order):
 out=Image.new('RGBA',next(iter(layers.values())).size)
 for n in order:out.alpha_composite(layers[n])
 return out

def psd_save(folder,layers,order,full):
 psd=PSDImage.new('RGBA',SIZE)
 for n in order:PixelLayer.frompil(layers[n],psd,n)
 matte=Image.new('RGBA',SIZE,(255,255,255,255));matte.alpha_composite(full)
 channels=list(matte.convert('RGB').split())+[full.getchannel('A')]
 psd._record.image_data.set_data([c.tobytes() for c in channels],psd._record.header)
 psd._record.layer_and_mask_information.layer_info.layer_count=-len(order)
 psd._updated=False;psd.save(folder/'cast.psd')
 read=PSDImage.open(folder/'cast.psd')
 assert [l.name for l in read]==order
 for l,n in zip(read,order):assert np.array_equal(np.asarray(l.topil()),np.asarray(layers[n])),n
 assert read.composite().getchannel('A').tobytes()==full.getchannel('A').tobytes()

MG_ARM_R=[(182,432),(255,427),(278,482),(279,557),(260,620),(245,672),(217,743),(177,870),(168,923),(189,1004),(170,1070),(52,1070),(30,910),(64,732),(113,605),(146,505)]
MG_ARM_L=[(608,448),(655,456),(687,476),(709,564),(739,645),(770,697),(812,790),(854,901),(844,1065),(733,1073),(736,958),(715,893),(715,835),(713,790),(718,752),(712,715),(695,662),(684,620),(685,552),(653,494)]
FG_ARM_R=[(260,405),(301,410),(326,448),(341,500),(337,543),(316,574),(317,636),(307,712),(281,808),(257,888),(257,920),(278,965),(288,1037),(243,1052),(193,1004),(192,937),(213,829),(230,722),(232,631),(235,568),(225,493),(223,450)]
FG_ARM_L=[(506,358),(555,358),(583,395),(607,458),(617,480),(641,509),(658,447),(673,390),(656,372),(654,334),(672,312),(705,316),(727,347),(728,405),(728,484),(713,555),(697,621),(651,627),(612,596),(582,544),(565,493),(533,442),(504,413)]

def build(role):
 src=clean(Image.open(ROOT/role/'full-concept-v1.png').convert('RGBA'))
 generated=clean(Image.open(ROOT/'source_generated'/f'{role}_body.png').convert('RGBA'))
 if role=='mg':
  arms={'arm_r':cut(src,MG_ARM_R),'arm_l':cut(src,MG_ARM_L)}
  # Keep all original visible tailoring. Generated underpaint supplies the
  # shoulders and neck backing that were hidden in the flattened original.
  under,_=affine(generated,.92,(31,180))
  body_shape=[(256,414),(329,389),(347,350),(368,383),(408,402),(473,410),(516,388),(541,401),(634,451),(663,530),(666,632),(669,762),(700,1018),(681,1420),(805,1581),(802,1655),(164,1670),(174,1496),(224,1300),(229,1009),(237,851),(251,728),(250,624),(250,524)]
  visible=cut(src,body_shape)
  under=cut(under,[(212,420),(335,359),(516,394),(636,439),(683,518),(691,652),(696,743),(702,1029),(822,1659),(157,1670),(239,1009),(236,757),(211,598)])
  hidden=Image.new('RGBA',SRC_SIZE)
  hidden.alpha_composite(cut(under,[(218,429),(284,413),(292,540),(265,659),(224,640)]))
  hidden.alpha_composite(cut(under,[(620,456),(667,460),(689,526),(686,650),(657,640)]))
  body=hidden;body.alpha_composite(visible)
  head=cut(src,[(296,108),(594,108),(603,297),(558,310),(529,307),(503,309),(481,321),(497,332),(544,346),(539,397),(516,421),(403,423),(353,385),(334,349),(319,310),(288,298)])
  head,_=affine(clean(Image.open(ROOT/'source_generated'/'mg_head.png').convert('RGBA')),.28,(280,94))
  cigar=cut(src,[(494,314),(572,320),(575,343),(536,344),(496,329)])
  smoke=cut(src,[(575,344),(556,329),(577,302),(580,272),(601,256),(617,245),(603,219),(609,203),(598,180),(590,155),(608,126),(631,123),(624,154),(620,176),(636,198),(628,221),(650,245),(646,266),(610,286),(604,319),(594,343)])
  layers={'body':body,'head':head,**arms,'prop_cigar':cigar,'dangle_smoke':smoke}
  J={'head_top':[471,117],'neck':[455,408],'chest':[458,551],'waist':[469,845],'hips':[469,1036], 'shoulder_r':[241,471],'elbow_r':[169,715],'wrist_r':[118,928], 'shoulder_l':[654,501],'elbow_l':[754,744],'wrist_l':[793,926]}
  arm_src=Image.open(ROOT/'source_generated'/'mg_arm_l.png').convert('RGBA')
  arm_outline=[(77,57),(128,35),(268,43),(379,73),(431,133),(464,232),(537,350),(618,455),(630,488),(681,554),(691,619),(741,706),(783,816),(834,916),(890,1018),(910,1078),(907,1121),(928,1172),(941,1260),(936,1337),(902,1397),(862,1450),(820,1501),(798,1509),(774,1495),(778,1466),(790,1424),(772,1445),(747,1463),(721,1450),(727,1423),(743,1368),(737,1347),(718,1376),(693,1400),(667,1396),(676,1344),(677,1260),(692,1190),(701,1156),(662,1159),(638,1128),(646,1088),(597,996),(543,897),(500,802),(459,783),(415,738),(363,666),(298,590),(251,527),(224,523),(194,504),(153,447),(115,374),(92,298),(62,211),(54,123)]
  arm_src=cut(arm_src,arm_outline)
  layers['arm_l'],AM=affine(arm_src,.38,(548,428),angle=3.5,pivot=(643,489))
  J['shoulder_l']=ptx((250,160),AM);J['elbow_l']=ptx((630,750),AM);J['wrist_l']=ptx((790,1160),AM)
  angles={'arm_r':4.0,'arm_l':0}
  anchors={'prop_cigar':[499,323],'dangle_smoke':[565,334]}
  order=['head','arm_l','body','arm_r','prop_cigar','dangle_smoke']
  scale=(1822-224)/(1645-117);tx=512-446*scale;ty=224-117*scale
 else:
  arms={'arm_r':cut(src,FG_ARM_R),'arm_l':cut(src,FG_ARM_L)}
  old_rod=mask([(668,391),(690,393),(663,490),(630,490)])
  ar=np.array(arms['arm_l']);ar[:,:,3]=np.rint(ar[:,:,3].astype(float)*(1-np.array(old_rod)/255)).astype('uint8');ar[ar[:,:,3]==0]=0;arms['arm_l']=Image.fromarray(ar)
  under,_=affine(generated,.84,(63,310))
  body_shape=[(295,393),(344,375),(379,386),(443,383),(472,357),(519,359),(537,402),(553,451),(581,528),(566,601),(581,670),(623,750),(617,910),(592,1168),(612,1320),(658,1505),(772,1613),(767,1677),(600,1728),(294,1730),(116,1654),(117,1591),(216,1494),(275,1328),(304,1076),(330,981),(321,910),(299,842),(301,770),(332,689),(369,642),(365,611),(334,572),(342,528),(348,484),(322,429)]
  visible=cut(src,body_shape)
  under=cut(under,[(264,377),(330,363),(474,351),(548,354),(560,422),(580,517),(577,620),(628,781),(626,950),(593,1120),(647,1454),(780,1694),(306,1740),(110,1670),(206,1483),(307,1211),(329,942),(290,826),(308,735),(364,639),(344,591),(313,539),(278,471)])
  body=under;body.alpha_composite(visible)
  head=cut(src,[(325,114),(506,110),(529,279),(491,322),(463,337),(460,383),(480,409),(483,447),(376,456),(338,408),(345,370),(356,344),(362,315),(347,293),(305,305),(282,278),(281,211),(299,158)])
  head,_=affine(clean(Image.open(ROOT/'source_generated'/'fg_head.png').convert('RGBA')),.225,(281,110))
  ha=np.array(head);yy=np.arange(SRC_SIZE[1])[:,None];fade=np.clip((411-yy)/42,0,1);ha[:,:,3]=np.rint(ha[:,:,3]*fade).astype('uint8');head=Image.fromarray(ha)
  feather=cut(src,[(218,35),(326,38),(375,106),(370,157),(341,170),(310,194),(288,253),(287,335),(274,387),(249,418),(231,415),(245,374),(234,315),(231,248),(249,188),(283,151),(245,120),(210,144),(204,96)])
  # Earrings are extracted by material color within hand-authored silhouettes.
  earrings={}
  for side,poly in {'r':[(350,259),(361,271),(366,302),(363,340),(356,351),(339,347),(338,274)],'l':[(436,303),(458,298),(460,347),(447,358),(434,344)]}.items():
   piece=cut(src,poly)
   ar=np.array(piece);rgb=ar[:,:,:3].astype(float)
   gold=(rgb[:,:,0]>rgb[:,:,2]*2.3)&(rgb[:,:,1]>rgb[:,:,2]*1.5)
   ar[:,:,3]=np.where(gold,ar[:,:,3],0);earrings['dangle_earring_'+side]=Image.fromarray(ar)
  fingers=cut(src,[(663,314),(696,313),(718,330),(717,364),(696,382),(660,378),(654,357),(658,333)])
  # Prop comes from a separate ImageGen asset, registered after source inspection.
  prop_path=ROOT/'source_generated'/'fg_prop.png'
  if prop_path.exists():
   pp=clean(Image.open(prop_path).convert('RGBA'))
   prop,_=affine(pp,.31,(480,172),angle=10,pivot=(687,350))
  else:prop=Image.new('RGBA',SRC_SIZE)
  layers={'body':body,'head':head,**arms,'fingers_l':fingers,'prop_bat':prop,'dangle_ponytail':feather,**earrings}
  J={'head_top':[415,119],'neck':[404,397],'chest':[443,482],'waist':[442,660],'hips':[459,916], 'shoulder_r':[286,453],'elbow_r':[269,687],'wrist_r':[226,930], 'shoulder_l':[541,402],'elbow_l':[658,565],'wrist_l':[690,354]}
  angles={'arm_r':9.0,'arm_l':0}
  anchors={'prop_bat':[687,350],'dangle_ponytail':[341,163],'dangle_earring_r':[351,271],'dangle_earring_l':[447,308]}
  order=['body','head','arm_l','prop_bat','arm_r','dangle_ponytail','dangle_earring_l','dangle_earring_r','fingers_l']
  scale=(1822-260)/(1724-119);tx=512-445*scale;ty=260-119*scale
 # Rotate the complete free arm rigidly around its shoulder, without stretching.
 for n,angle in angles.items():
  side=n[-1];layers[n],R=affine(layers[n],angle=angle,pivot=J['shoulder_'+side])
  for k in ['elbow_'+side,'wrist_'+side]:J[k]=ptx(J[k],R)
 M=np.array([[scale,0,tx],[0,scale,ty],[0,0,1.]])
 out={n:place(clean(im,minimum=12 if n.startswith(('prop_','dangle_')) else 100),M) for n,im in layers.items()}
 template=json.loads((ROOT.parent/'cast_brief'/role/'layers.template.json').read_text())
 template.update(order=order,joints={k:ptx(p,M) for k,p in J.items()},anchors={k:ptx(p,M) for k,p in anchors.items()},source='full-concept-v1.png + source_generated',parents={'prop_cigar':'head','dangle_smoke':'prop_cigar'} if role=='mg' else {'prop_bat':'fore_l','dangle_ponytail':'head','dangle_earring_l':'head','dangle_earring_r':'head'})
 folder=ROOT/role;folder.mkdir(exist_ok=True)
 for n,im in out.items():im.save(folder/f'{n}.png')
 full=compose(out,order);full.save(folder/'full.png')
 (folder/'layers.json').write_text(json.dumps(template,indent=2)+'\n')
 psd_save(folder,out,order,full)
 preview=Image.new('RGBA',SIZE,(40,36,33,255));preview.alpha_composite(full);preview.convert('RGB').resize((512,1024)).save(ROOT/'review'/f'{role}-assembled.jpg')
 print(role,full.getchannel('A').getbbox(),flush=True)
 return out,template

if __name__=='__main__':
 for role in ['mg','fg']:build(role)
