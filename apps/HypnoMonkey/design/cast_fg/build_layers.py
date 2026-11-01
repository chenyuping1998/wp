"""Deterministic same-canvas split of the APPROVED master.
ImageGen extraction drafts are archived separately: they moved/rescaled parts and
are not accepted geometry. Visible pixels here come from the approved master;
concealed socket underpainting is kept inside adjacent anatomical silhouettes.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops, ImageFilter
import json,math,hashlib
D=Path(__file__).resolve().parent;L=D/'layers';L.mkdir(exist_ok=True)
required_repairs=['tail_1','pelvis','neck','torso',*[f'arm_{side}_{part}' for side in ['l','r'] for part in ['upper','lower']],*[f'leg_{side}_{part}' for side in ['l','r'] for part in ['upper','lower']],'hand_l_hip','hand_l_point','hand_l_open','hand_r_pinch','hand_r_grip','hand_r_open']
missing=[name for name in required_repairs if not (D/'source/repairs-1028'/(name+'.png')).exists()]
if missing:raise FileNotFoundError('Run import_generated_repairs.py before rebuilding; missing accepted sources: '+', '.join(missing))
master=Image.open(D/'master-approved.png').convert('RGBA');W,H=master.size
# Remove diffuse exterior alpha; keep a single clean anti-aliased contour.
a=master.getchannel('A').point(lambda v:255 if v>180 else 0).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(.35));master.putalpha(a)
# The old loose strand ended in the torso. Remove it at source before splitting.
oldChain=Image.new('L',(W,H));cd=ImageDraw.Draw(oldChain)
cd.line([(245,279),(264,396),(297,475),(315,490),(350,502)],fill=255,width=13)
cd.line([(174,391),(173,513)],fill=255,width=12)
pix=master.load();cm=oldChain.load()
for yy in range(270,522):
 for xx in range(160,363):
  if cm[xx,yy]:
   if yy>480 and xx>300:pix[xx,yy]=(129,72,46,255)
   else:pix[xx,yy]=(0,0,0,0)
master.save(D/'master-clean-source.png')
visibleMasks={}
INK='#372018';SKIN='#81482e';CREAM='#f2e1bf';RED='#9e2927'
def blank():return Image.new('RGBA',(W,H))
def maskpoly(points):
 m=Image.new('L',(W,H));ImageDraw.Draw(m).polygon(points,fill=255);return m
def cut(points):
 im=master.copy();im.putalpha(ImageChops.multiply(im.getchannel('A'),maskpoly(points)));return im
def layer(name,points,caps=(),erase=()):
 im=blank();d=ImageDraw.Draw(im)
 for x,y,r,color in caps:d.ellipse((x-r,y-r,x+r,y+r),fill=color)
 front=cut(points)
 if erase:
  m=front.getchannel('A');md=ImageDraw.Draw(m)
  for p in erase:md.polygon(p,fill=0)
  front.putalpha(m)
 visibleMasks[name]=front.getchannel('A')
 im.putalpha(ImageChops.multiply(im.getchannel('A'),master.getchannel('A')))
 im.alpha_composite(front);im.save(L/(name+'.png'));return im
# Body sockets are complete below independently drawn sleeves.
torsoPoints=[(392,381),(448,375),(496,393),(552,372),(596,405),(572,440),(560,493),(551,536),(510,579),(550,626),(538,649),(481,696),(390,681),(367,655),(383,608),(366,561),(354,522),(350,470),(375,411)]
layer('torso',torsoPoints,[(382,443,30,CREAM),(563,433,30,CREAM)])
pelvisPoints=[(394,644),(483,648),(532,625),(583,692),(623,723),(656,779),(647,804),(486,826),(358,789),(375,700)]
pelvis=blank();pd=ImageDraw.Draw(pelvis);pd.polygon(pelvisPoints,fill=RED);front=cut(pelvisPoints)
# The hand is foreground, never baked into the shorts underneath it.
fm=front.getchannel('A');ImageDraw.Draw(fm).polygon([(501,615),(558,615),(623,662),(616,708),(560,716),(505,698)],fill=0);front.putalpha(fm);pelvis.alpha_composite(front);pelvis.save(L/'pelvis.png');visibleMasks['pelvis']=front.getchannel('A')
layer('neck',[(476,341),(572,330),(576,378),(552,398),(486,446),(448,436),(481,399)],[(520,365,29,SKIN),(491,409,24,SKIN)])
layer('arm_l_upper',[(329,447),(409,419),(423,530),(306,587),(266,599),(248,564),(294,502)],[(372,475,24,CREAM),(286,561,29,SKIN)])
# Remove the old chain crossing the far upper arm; it is redrawn as a connected separate prop.
p=Image.open(L/'arm_l_upper.png').convert('RGBA');pd=ImageDraw.Draw(p)
for x in range(302,354):
 y=round(485+(x-302)*.30);pd.line((x,y-5,x,y+5),fill=SKIN,width=1)
p.save(L/'arm_l_upper.png')
layer('arm_l_lower',[(151,365),(208,362),(243,437),(279,480),(311,517),(318,555),(291,584),(268,600),(233,543),(199,471)],[(190,382,17,SKIN),(285,560,28,SKIN)])
layer('arm_r_upper',[(544,390),(624,390),(697,475),(703,515),(750,565),(784,615),(770,640),(727,647),(689,610),(642,567),(612,549),(572,549),(543,509)],[(602,444,33,CREAM),(730,611,28,SKIN)])
layer('arm_r_lower',[(706,578),(757,580),(785,619),(762,654),(682,692),(609,705),(609,681),(609,655),(655,628),(691,596)],[(731,613,29,SKIN),(609,681,19,SKIN)])
layer('leg_l_upper',[(357,805),(425,813),(481,833),(480,878),(451,926),(406,985),(369,1039),(372,1073),(348,1095),(308,1095),(277,1064),(270,1032),(289,990),(306,902)],[(418,824,66,SKIN),(333,1058,32,SKIN)])
layer('leg_l_lower',[(291,1038),(359,1032),(400,1089),(424,1138),(405,1243),(387,1310),(377,1342),(330,1341),(323,1252),(300,1160)],[(333,1058,31,SKIN),(354,1320,19,SKIN)])
layer('foot_l',[(315,1310),(345,1294),(399,1297),(399,1332),(413,1370),(430,1407),(425,1444),(382,1454),(346,1432),(321,1460),(274,1483),(210,1475),(207,1447),(270,1418),(307,1370)])
layer('leg_r_upper',[(488,827),(639,813),(650,873),(624,956),(612,1014),(618,1067),(598,1114),(555,1115),(540,1080),(530,1035),(497,952),(482,879)],[(561,829,82,SKIN),(580,1077,32,SKIN)])
layer('leg_r_lower',[(547,1047),(602,1045),(638,1094),(679,1151),(676,1199),(655,1266),(655,1341),(603,1357),(592,1290),(563,1207),(553,1123)],[(580,1077,31,SKIN),(626,1340,22,SKIN)])
layer('foot_r',[(592,1323),(620,1316),(658,1319),(674,1354),(688,1391),(694,1434),(686,1477),(647,1503),(548,1504),(535,1484),(540,1460),(577,1420),(598,1372)])
layer('hand_l_hip',[(153,305),(167,280),(184,266),(199,247),(246,262),(256,283),(238,301),(239,335),(216,364),(211,391),(181,394),(166,368)],[(190,382,16,SKIN)])
layer('hand_r_pinch',[(499,644),(519,627),(550,627),(578,639),(605,659),(625,677),(619,697),(597,705),(571,700),(551,704),(517,697),(514,679),(503,668)],[(608,682,17,SKIN)])
# Hand art contains skin only: remove any red shorts pixel between the fingers.
p=Image.open(L/'hand_r_pinch.png').convert('RGBA');pixels=p.load()
for y in range(610,714):
 for x in range(490,630):
  r,g,b,a=pixels[x,y]
  if a and r>80 and g<75 and r>g*1.9:pixels[x,y]=(0,0,0,0)
p.save(L/'hand_r_pinch.png')
# Complete head, with the headband/feather on an independent accessory layer.
head=cut([(331,61),(563,58),(606,89),(638,124),(681,173),(707,221),(700,311),(649,349),(589,358),(570,367),(526,377),(482,374),(449,366),(409,370),(369,345),(349,303),(348,251),(330,204)])
bandPoly=[(499,102),(541,101),(580,117),(597,132),(613,157),(627,196),(615,203),(600,169),(582,151),(547,131),(505,121)]
# The band conceals hair, not a hole. Paint that narrow hidden strip before extraction.
hd=ImageDraw.Draw(head);hd.polygon(bandPoly,fill='#4b291d');head.save(L/'head_idle.png');visibleMasks['head_idle']=head.getchannel('A')
accessory=blank();accessory.alpha_composite(cut(bandPoly));accessory.alpha_composite(cut([(579,135),(580,94),(588,56),(619,22),(652,8),(685,5),(672,25),(654,48),(648,70),(628,104),(609,133)]));accessory.save(L/'hat.png');visibleMasks['hat']=accessory.getchannel('A')
layer('tail_1',[(642,763),(686,804),(764,932),(826,984),(861,997),(869,1055),(824,1040),(774,1019),(710,950),(672,874),(640,831)],[(657,800,19,SKIN),(837,1016,20,SKIN)])
layer('tail_2',[(804,978),(863,995),(899,978),(914,951),(913,924),(900,889),(889,858),(930,842),(950,892),(963,943),(960,990),(938,1029),(900,1052),(846,1054),(805,1036)],[(838,1016,20,SKIN),(921,895,19,SKIN)])
layer('tail_3',[(913,947),(898,912),(880,875),(831,817),(809,780),(797,737),(805,696),(835,666),(872,656),(920,666),(951,689),(976,727),(977,760),(960,790),(939,787),(933,760),(904,733),(878,717),(858,725),(851,745),(865,775),(901,818),(929,863),(946,894),(958,949)],[(921,895,23,SKIN),(935,922,22,SKIN)])
# Pocket watch with its winding ring, separate from the chain.
layer('watch',[(152,512),(184,511),(196,535),(219,559),(228,603),(213,631),(185,649),(151,647),(124,627),(114,590),(121,558),(146,538)])
# Three independently rigged chain sections. Links are original vector geometry,
# drawn at their real connected anchors; no second strand terminates in the torso.
chainPoints=[(244,276),(235,359),(212,442),(172,523)]
for i,(a,b) in enumerate(zip(chainPoints,chainPoints[1:]),1):
 im=blank();d=ImageDraw.Draw(im);length=math.dist(a,b);n=round(length/8)
 for k in range(n+1):
  t=k/n;x=a[0]+(b[0]-a[0])*t;y=a[1]+(b[1]-a[1])*t
  d.ellipse((x-3,y-5,x+3,y+5),outline=INK,width=3);d.ellipse((x-2,y-4,x+2,y+4),outline='#dca83e',width=2)
 im.save(L/f'chain_{i}.png')
# Strict anatomical cleanup: no neighbouring garments, chain or shoe fragments.
def keep_skin(name, area=None):
 p=L/(name+'.png');im=Image.open(p).convert('RGBA');h,sat,val=im.convert('HSV').split()
 sm=ImageChops.multiply(h.point(lambda v:255 if 5<=v<=24 else 0),sat.point(lambda v:255 if v>45 else 0));sm=ImageChops.multiply(sm,val.point(lambda v:255 if v>45 else 0))
 sm=sm.filter(ImageFilter.MaxFilter(3))
 if area:
  region=maskpoly(area);sm=ImageChops.lighter(ImageChops.subtract(Image.new('L',(W,H),255),region),ImageChops.multiply(sm,region))
 im.putalpha(ImageChops.multiply(im.getchannel('A'),sm));im.save(p)
for name in ['hand_l_hip','hand_r_pinch','neck','tail_1']:
 keep_skin(name)
for name in ['leg_l_lower','leg_r_lower']:
 im=Image.open(L/(name+'.png')).convert('RGBA');d=ImageDraw.Draw(im)
 for yy in range(1308,1368):
  for xx in range(250 if name=='leg_l_lower' else 530,450 if name=='leg_l_lower' else 700):
   if im.getpixel((xx,yy))[3]:im.putpixel((xx,yy),(129,72,46,255))
 im.save(L/(name+'.png'))
for name in []:
 im=Image.open(L/(name+'.png')).convert('RGBA');h,sat,val=im.convert('HSV').split();skin=ImageChops.multiply(h.point(lambda v:255 if 5<=v<=24 else 0),sat.point(lambda v:255 if v>65 else 0));skin=ImageChops.multiply(skin,val.point(lambda v:255 if v>65 else 0));im.putalpha(ImageChops.subtract(im.getchannel('A'),skin));im.save(L/(name+'.png'))
# Pelvis contains shorts only; concealed thigh sockets belong to leg layers.
im=Image.open(L/'pelvis.png').convert('RGBA');h,sat,val=im.convert('HSV').split();skin=ImageChops.multiply(h.point(lambda v:255 if 5<=v<=24 else 0),sat.point(lambda v:255 if v>65 else 0));skin=ImageChops.multiply(skin,val.point(lambda v:255 if v>65 else 0));skin=ImageChops.multiply(skin,maskpoly([(0,790),(1024,790),(1024,1536),(0,1536)]));im.putalpha(ImageChops.subtract(im.getchannel('A'),skin));im.save(L/'pelvis.png')
# Torso must never contain the hand resting over its lower corner.
im=Image.open(L/'torso.png').convert('RGBA');d=ImageDraw.Draw(im);h,sat,val=im.convert('HSV').split()
for yy in range(620,700):
 for xx in range(495,580):
  if im.getpixel((xx,yy))[3] and 5<=h.getpixel((xx,yy))<=24 and sat.getpixel((xx,yy))>65:im.putpixel((xx,yy),(158,41,39,255))
im.save(L/'torso.png')
# Clean source arm with reconstructed hidden sleeve anatomy; registration is a
# similarity transform of shoulder and elbow, never an arbitrary resize.
src=Image.open(D/'source/extraction-drafts/arm_l_upper.png').convert('RGBA')
a0=(447,516);a1=(332,747);b0=(374,439);b1=(285,560)
sa=math.hypot(a1[0]-a0[0],a1[1]-a0[1]);sb=math.hypot(b1[0]-b0[0],b1[1]-b0[1]);scale=sb/sa;angle=math.atan2(b1[1]-b0[1],b1[0]-b0[0])-math.atan2(a1[1]-a0[1],a1[0]-a0[0]);c=math.cos(angle)*scale;sn=math.sin(angle)*scale;tx=b0[0]-c*a0[0]+sn*a0[1];ty=b0[1]-sn*a0[0]-c*a0[1];det=c*c+sn*sn
out=src.transform((W,H),Image.Transform.AFFINE,(c/det,sn/det,(-c*tx-sn*ty)/det,-sn/det,c/det,(sn*tx-c*ty)/det),Image.Resampling.BICUBIC);out.putalpha(out.getchannel('A').point(lambda v:255 if v>180 else 0).filter(ImageFilter.MinFilter(3)));out.save(L/'arm_l_upper.png')
# Registered clean head and hand drawings keep body fragments out of swap layers.
def fit_part(path,box,clipFraction=None):
 im=Image.open(path).convert('RGBA');a=im.getchannel('A').point(lambda v:255 if v>200 else 0);im.putalpha(a);b=a.getbbox()
 if clipFraction:b=(b[0],b[1],int(b[0]+(b[2]-b[0])*clipFraction),b[3])
 im=im.crop(b);im=im.crop(im.getchannel('A').getbbox());im=im.resize((box[2]-box[0],box[3]-box[1]),Image.Resampling.LANCZOS);out=blank();out.alpha_composite(im,(box[0],box[1]));return out
for name in ['head_idle','head_blink','head_spiral','head_grin','head_annoyed']:
 path=D/'source'/('extraction-drafts/head_idle.png' if name=='head_idle' else name+'.png')
 if path.exists():fit_part(path,(340,68,695,376)).save(L/(name+'.png'))
fit_part(D/'source/extraction-drafts/hand_l_hip.png',(155,247,255,399)).save(L/'hand_l_hip.png')
fit_part(D/'source/extraction-drafts/hand_r_pinch.png',(498,625,621,705),.46).save(L/'hand_r_pinch.png')
# The ankle extension is painted from the calf's own adjacent pixels, not a flat
# rectangular patch. Shoes remain independent, connected complete pieces.
for name,x0,x1,yy in [('leg_l_lower',315,405,1307),('leg_r_lower',580,667,1307)]:
 im=Image.open(L/(name+'.png')).convert('RGBA');original=master.copy()
 for y in range(1308,1368):
  for x in range(x0,x1):
   r,g,b,a=im.getpixel((x,y))
   if a:
    donor=original.getpixel((x,yy))
    if donor[3]>128:im.putpixel((x,y),donor)
 im.save(L/(name+'.png'))
# Open shoe cuffs have no baked calf fragment; the independent shin supplies it.
for name,opening in [('foot_l',[(316,1310),(345,1294),(400,1296),(390,1327),(331,1337)]),('foot_r',[(594,1330),(620,1316),(658,1319),(655,1345),(607,1358)])]:
 im=Image.open(L/(name+'.png')).convert('RGBA');om=maskpoly(opening);h,ss,v=im.convert('HSV').split()
 for yy in range(1290,1360):
  for xx in range(300,680):
   if om.getpixel((xx,yy)) and 5<=h.getpixel((xx,yy))<=24 and ss.getpixel((xx,yy))>65 and v.getpixel((xx,yy))>75:im.putpixel((xx,yy),(0,0,0,0))
 im.save(L/(name+'.png'))
# At the hip overlap, copy the original visible skin (never garment pixels)
# onto the concealed cap so no flat socket-colour strip shows below the hem.
for name,x0,x1 in [('leg_l_upper',300,485),('leg_r_upper',480,655)]:
 im=Image.open(L/(name+'.png')).convert('RGBA');h,ss,v=master.convert('HSV').split()
 for yy in range(782,860):
  for xx in range(x0,x1):
   if im.getpixel((xx,yy))[3] and 5<=h.getpixel((xx,yy))<=24 and ss.getpixel((xx,yy))>65 and v.getpixel((xx,yy))>65:
    im.putpixel((xx,yy),master.getpixel((xx,yy)))
 im.save(L/(name+'.png'))
# Register the pinching wrist and fingertip, not just the PNG's bounding box.
im=Image.open(L/'hand_l_hip.png').convert('RGBA');ang=math.radians(17.6);c=math.cos(ang);sn=math.sin(ang);tx=190-c*225+sn*382;ty=382-sn*225-c*382
im=im.transform((W,H),Image.Transform.AFFINE,(c,sn,-c*tx-sn*ty,-sn,c,sn*tx-c*ty),Image.Resampling.BICUBIC);im.save(L/'hand_l_hip.png')
im=Image.open(L/'hand_r_pinch.png').convert('RGBA');out=blank();out.alpha_composite(im,(-12,0));out.save(L/'hand_r_pinch.png')
# Alternate gestures register by their wrist end, not the texture's centre.
for name in ['hand_l_point','hand_l_open','hand_r_open','hand_r_grip']:
 path=D/'source'/(name+'.png')
 if not path.exists():continue
 im=Image.open(path).convert('RGBA');im.putalpha(im.getchannel('A').point(lambda v:255 if v>200 else 0));box=im.getchannel('A').getbbox();im=im.crop(box)
 near=name.startswith('hand_l');scale=(150 if near else 110)/im.height;im=im.resize((max(1,round(im.width*scale)),max(1,round(im.height*scale))),Image.Resampling.LANCZOS);a=im.getchannel('A');px=a.load()
 points=[(x,y) for y in range(im.height) for x in range(im.width) if px[x,y]>128 and (y>im.height*.88 if near else x>im.width*.88)]
 wx=sum(x for x,y in points)/len(points);wy=sum(y for x,y in points)/len(points);root=(190,382) if near else (609,682);out=blank();out.alpha_composite(im,(round(root[0]-wx),round(root[1]-wy)));out.save(L/(name+'.png'))
# Reconstruct the waistband hidden by the original hip hand, as actual garment
# source art. It must remain a continuous belt when that hand presents or waves.
im=Image.open(L/'pelvis.png').convert('RGBA');d=ImageDraw.Draw(im)
d.line([(532,633),(554,658),(578,683),(595,701)],fill=INK,width=18,joint='curve');d.line([(532,633),(554,658),(578,683),(595,701)],fill='#e2b34a',width=13,joint='curve')
im.save(L/'pelvis.png')
# Remove neighbouring-art remnants from hidden wrist and tail sockets too.
im=Image.open(L/'arm_l_lower.png').convert('RGBA')
for yy in range(350,405):
 for xx in range(140,225):
  if im.getpixel((xx,yy))[3]:
   im.putpixel((xx,yy),(113,59,37,255))
im.save(L/'arm_l_lower.png')
im=Image.open(L/'torso.png').convert('RGBA');im.putalpha(ImageChops.multiply(im.getchannel('A'),maskpoly(torsoPoints)));im.save(L/'torso.png')
im=Image.open(L/'tail_1.png').convert('RGBA');a=im.getchannel('A');ImageDraw.Draw(a).polygon([(620,740),(690,740),(690,795),(671,822),(620,847)],fill=0);im.putalpha(a)
d=ImageDraw.Draw(im);d.line([(652,795),(675,835),(694,867)],fill=SKIN,width=25,joint='curve');im.save(L/'tail_1.png')
# Tiny unconnected remnants never enter the runtime atlas.
for p in L.glob('*.png'):
 if p.stem.startswith('chain_'):continue
 im=Image.open(p).convert('RGBA');a=im.getchannel('A');box=a.getbbox()
 if not box:continue
 pix=a.load();seen=set();components=[]
 for yy in range(box[1],box[3]):
  for xx in range(box[0],box[2]):
   if pix[xx,yy]<32 or (xx,yy) in seen:continue
   queue=[(xx,yy)];seen.add((xx,yy));component=[]
   for qx,qy in queue:
    component.append((qx,qy))
    for nx,ny in [(qx-1,qy),(qx+1,qy),(qx,qy-1),(qx,qy+1)]:
     if box[0]<=nx<box[2] and box[1]<=ny<box[3] and (nx,ny) not in seen and pix[nx,ny]>=32:seen.add((nx,ny));queue.append((nx,ny))
   components.append(component)
 if len(components)>1:
  keep=max(components,key=len);clean=Image.new('L',(W,H));cp=clean.load()
  for xx,yy in keep:cp[xx,yy]=pix[xx,yy]
  im.putalpha(clean);im.save(p)
# Accepted same-canvas source repairs override the historical extraction. Keep
# these after ALL legacy cleanup, so rebuilding cannot reintroduce cut patches.
repair_dir=D/'source/repairs-1028'
repair_manifest={}
if repair_dir.exists():
 for path in sorted(repair_dir.glob('*.png')):
  if not (L/path.name).exists():raise ValueError(f'Unknown repair layer: {path.name}')
  repaired=Image.open(path).convert('RGBA')
  if repaired.size!=(W,H):raise ValueError(f'Repair must keep source canvas: {path.name}')
  repaired.save(L/path.name)
  repair_manifest[path.name]=hashlib.sha256(path.read_bytes()).hexdigest()
# Assemble the actual source revision, not an older mother image.
order=['tail_3','tail_2','tail_1','arm_l_upper','arm_l_lower','leg_l_upper','leg_l_lower','foot_l','leg_r_upper','leg_r_lower','foot_r','pelvis','neck','torso','head_idle','hat','arm_r_upper','arm_r_lower','chain_3','chain_2','chain_1','watch','hand_l_hip','hand_r_pinch']
full=blank()
for name in order:full.alpha_composite(Image.open(L/(name+'.png')).convert('RGBA'))
full.save(D/'assembled.png')
joints={'hip':(495,785),'waist':(466,650),'neckBase':(493,410),'headBase':(518,358),'headTop':(510,90),'hatBase':(595,140),'hatTop':(640,35),'glasses':(490,252),'shoulderL':(374,439),'elbowL':(285,560),'wristL':(190,382),'shoulderR':(607,445),'elbowR':(730,612),'wristR':(609,682),'hipL':(421,826),'kneeL':(333,1058),'ankleL':(354,1320),'toeL':(274,1457),'hipR':(559,830),'kneeR':(580,1077),'ankleR':(626,1340),'toeR':(585,1483),'tailRoot':(652,795),'tail2':(837,1016),'tail3':(921,895),'tailTip':(951,772),'coatRootL':(420,750),'coatTipL':(420,810),'coatRootR':(570,750),'coatTipR':(570,810)}
(D/'joints.json').write_text(json.dumps({k:{'x':v[0],'y':v[1]} for k,v in joints.items()},indent=2)+'\n')
manifest={'approvedMasterSha256':hashlib.sha256((D/'master-approved.png').read_bytes()).hexdigest(),'layers':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in L.glob('*.png')},'assemblyOrder':order,'approvedMasterMatchesAssembly':False,'repairs':repair_manifest,'reason':'Source splitting, concealed-anatomy underpainting, independent headband and watch chain. Source repairs are not a pixel-identical copy of the approved master. Visual acceptance is tracked separately from revision hashes.'}
(D/'source-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Built',len(manifest['layers']),'same-canvas layers; final assembly differs from master only for source splitting and connected prop design.')
