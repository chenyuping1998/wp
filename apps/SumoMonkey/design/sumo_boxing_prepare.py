"""Source-faithful boxing layer staging. Never edits live cast.
Visible pixels are partitioned from unified full, never redrawn from the scaled
part deliveries. Complete registered underpainting and full-width round overlap
discs prioritize solid articulated anatomy over an exact rest-pose composite.
Registration reports remain reviewable, and no stretching is applied to the full.
"""
from pathlib import Path
from PIL import Image,ImageDraw
import argparse,json,numpy as np
from scipy.ndimage import maximum_filter,minimum_filter,binary_closing,binary_fill_holes,binary_dilation,label,distance_transform_edt
ROOT=Path(__file__).resolve().parent;REPO=ROOT.parents[3]
ORDER=['arm_back_upper','leg_back_upper','leg_back_lower','leg_front_upper','leg_front_lower','pelvis','neck','torso','arm_back_lower','fist_back','head','arm_front_upper','arm_front_lower','fist_front']
# Anatomical source ownership. These masks are in the unified source canvas,
# not in independently generated part coordinates. Review ownership_overlay.
MG={
 'torso':[(350,385),(660,385),(755,490),(725,790),(615,850),(490,860),(350,825),(245,780),(250,600),(295,470)],
 'head':[(300,40),(720,40),(720,395),(630,430),(535,400),(490,345),(370,325),(310,270)],
 'neck':[(465,355),(620,360),(680,440),(595,485),(480,445)],
 'pelvis':[(235,765),(350,815),(490,855),(610,845),(705,780),(735,935),(620,1025),(455,1020),(280,950)],
 'leg_back_upper':[(265,805),(480,885),(475,1010),(315,1120),(165,1150),(105,1050),(130,960)],
 'leg_back_lower':[(160,1060),(325,1070),(300,1190),(230,1380),(250,1500),(0,1520),(65,1360),(80,1210)],
 'leg_front_upper':[(540,875),(700,850),(855,990),(930,1080),(890,1190),(765,1170),(675,1060),(590,1030)],
 'leg_front_lower':[(770,1080),(940,1070),(935,1255),(1008,1380),(1024,1530),(770,1530),(760,1390),(795,1245)],
 'arm_back_upper':[(100,335),(310,325),(355,425),(270,555),(175,650),(65,665),(60,530)],
 'arm_back_lower':[(180,455),(285,465),(345,525),(300,620),(230,705),(120,710),(65,640),(85,550)],
 'fist_back':[(420,310),(480,318),(530,350),(555,430),(505,495),(380,555),(295,535),(240,485),(255,420),(300,375),(360,330)],
 'arm_front_upper':[(620,400),(730,390),(815,475),(865,600),(815,700),(740,660),(710,560),(660,520)],
 'arm_front_lower':[(775,515),(950,535),(960,650),(900,750),(825,745),(755,665)],
 'fist_front':[(805,305),(940,310),(1005,395),(1002,505),(990,570),(895,610),(820,565),(800,490),(765,425)],
}
# FG source carries a different narrower torso; do not scale the complete body.
FG={**MG,
 'torso':[(330,440),(620,430),(720,500),(700,700),(640,780),(490,805),(350,770),(315,650),(300,540)],
 'head':[(225,20),(660,20),(680,385),(590,450),(480,425),(415,375),(300,360),(225,270)],
 'neck':[(425,365),(580,385),(645,470),(530,505),(430,455)],
 'pelvis':[(340,755),(400,790),(500,820),(600,800),(675,745),(735,900),(640,990),(510,1020),(370,950),(330,865)],
 'leg_back_upper':[(330,825),(510,900),(480,1005),(315,1110),(195,1150),(145,1070),(180,985)],
 'leg_back_lower':[(175,1060),(330,1070),(310,1230),(320,1400),(325,1470),(35,1500),(50,1390),(105,1290)],
 'leg_front_upper':[(570,875),(710,820),(840,980),(890,1095),(825,1180),(700,1115),(635,1040)],
 'leg_front_lower':[(755,1080),(900,1090),(925,1310),(1008,1460),(1000,1530),(780,1530),(790,1395),(750,1240)],
 'arm_back_upper':[(140,425),(310,410),(345,495),(255,620),(150,680),(95,610)],
 'arm_back_lower':[(190,505),(300,510),(350,565),(300,655),(215,735),(125,745),(105,655),(135,575)],
 'fist_back':[(300,365),(410,360),(480,405),(500,480),(450,550),(350,610),(270,585),(235,530),(245,455)],
 'arm_front_upper':[(615,435),(735,440),(790,510),(845,610),(785,700),(700,645),(650,545)],
 'arm_front_lower':[(755,590),(925,570),(945,660),(910,730),(835,760),(765,715),(700,650)],
 'fist_front':[(770,410),(895,415),(970,470),(990,555),(945,640),(845,665),(775,610),(750,530)],
}
# Give gloves precedence over head where the guard occludes the jaw.
PRIORITY=['leg_back_upper','leg_back_lower','leg_front_upper','leg_front_lower','pelvis','neck','arm_back_upper','arm_front_upper','arm_back_lower','arm_front_lower','head','fist_back','fist_front']
def main():
 p=argparse.ArgumentParser();p.add_argument('--cast',choices=['MG','FG'],required=True);p.add_argument('--out',type=Path,required=True);args=p.parse_args()
 delivery=REPO/'角色生圖_相撲猴/交件'/args.cast;ref=Image.open(delivery/'clean_full.png').convert('RGBA');pixels=np.array(ref);alpha=pixels[:,:,3];polys=MG if args.cast=='MG' else FG
 # Assign off-polygon silhouette fringes to the nearest semantic body region,
 # never to a torso default (which would leave detached toes on the torso).
 distances=[]
 for name in ORDER:
  mask=Image.new('L',ref.size);ImageDraw.Draw(mask).polygon(polys[name],fill=255)
  distances.append(distance_transform_edt(np.array(mask)==0).astype('float32'))
 owner=np.argmin(np.stack(distances),axis=0).astype(np.int16)
 for name in ['torso']+PRIORITY:
  mask=Image.new('L',ref.size);ImageDraw.Draw(mask).polygon(polys[name],fill=255);owner[np.array(mask)>0]=ORDER.index(name)
 layers=args.out/'layers';layers.mkdir(parents=True,exist_ok=True)
 comp=Image.new('RGBA',ref.size);reports={};colors=[(100+i*37%155,60+i*53%195,90+i*67%165) for i in range(14)];ownview=np.zeros_like(pixels);ownview[:,:,3]=alpha
 for i,name in enumerate(ORDER):
  visible=owner==i;out=np.zeros_like(pixels);out[visible]=pixels[visible]
  reg=delivery/'registration'/name/'registered_generated.png'
  underlay=0
  if reg.exists() and abs(json.loads((reg.parent/'registration.json').read_text()).get('rotation_deg',999))<20 and json.loads((reg.parent/'registration.json').read_text()).get('inliers',0)>=6:
   generated=np.array(Image.open(reg).convert('RGBA'));ga=generated[:,:,3]
   # Hidden paint exists strictly behind a later semantic owner, inside opaque
   # source silhouette; it can never alter the reference silhouette at rest.
   # Clean generated source contour, then keep COMPLETE underpainting.
   # Restricting it to current-pose later owners leaves the glove/arm holes
   # that become visible as soon as the character moves.
   lum=generated[:,:,:3].astype(float)@np.array([.2126,.7152,.0722])
   edge=(maximum_filter(lum,size=5)-minimum_filter(lum,size=5)>32)&(ga>180)
   edge=binary_closing(edge,iterations=3);ids,n=label(edge);counts=np.bincount(ids.ravel());counts[0]=0
   gm=binary_fill_holes(binary_dilation(ids==counts.argmax(),iterations=3))
   generated[~gm,3]=0;generated[gm&(ga>=250),3]=255
   hidden=(generated[:,:,3]>0)&~visible
   # A generated upper arm may include a full lower arm or glove. Clip hidden
   # paint to the semantic bone capsule, never attach those duplicate parts.
   joints=json.loads((delivery/'joints.json').read_text())
   links={'arm_back_upper':('shoulderB','elbowB',85),'arm_back_lower':('elbowB','wristB',75),'arm_front_upper':('shoulderF','elbowF',85),'arm_front_lower':('elbowF','wristF',75),'leg_back_upper':('hipB','kneeB',105),'leg_back_lower':('kneeB','ankleB',90),'leg_front_upper':('hipF','kneeF',105),'leg_front_lower':('kneeF','ankleF',90),'neck':('neckBase','headBase',60)}
   if name in links:
    j0,j1,radius=links[name]
    def coord(j):
     q=joints[j];return np.array([q['x'],q['y']] if isinstance(q,dict) else q)
    start,end=coord(j0),coord(j1);vec=end-start;yy,xx=np.indices(alpha.shape);xy=np.stack([xx,yy],axis=-1)-start
    tt=np.clip((xy@vec)/(vec@vec),0,1);delta=xy-tt[:,:,None]*vec
    semantic=(delta*delta).sum(2)<=radius*radius
   else:semantic=np.ones(alpha.shape,dtype=bool) if name in ['head','torso','pelvis'] else binary_dilation(visible&(alpha>128),iterations=20)
   hidden &= semantic
   out[hidden]=generated[hidden];out[hidden,3]=255;underlay=int(hidden.sum())
  # No nearest-pixel extrusion: it creates striped rectangular caps. When
  # registration failed, copy a real 2D texture patch into SMALL round joint
  # overlaps; accepted generated art supplies all other hidden paint.
  core=visible&(alpha>250)
  accepted=reg.exists() and abs(json.loads((reg.parent/'registration.json').read_text()).get('rotation_deg',999))<20 and json.loads((reg.parent/'registration.json').read_text()).get('inliers',0)>=6
  if core.any() and not accepted:
   joints=json.loads((delivery/'joints.json').read_text())
   endpoints={'arm_back_upper':['shoulderB','elbowB'],'arm_back_lower':['elbowB','wristB'],'arm_front_upper':['shoulderF','elbowF'],'arm_front_lower':['elbowF','wristF'],'leg_back_upper':['hipB','kneeB'],'leg_back_lower':['kneeB','ankleB'],'leg_front_upper':['hipF','kneeF'],'leg_front_lower':['kneeF','ankleF'],'neck':['neckBase','headBase']}.get(name,[])
   distance=distance_transform_edt(core);sy,sx=np.unravel_index(distance.argmax(),distance.shape)
   yy,xx=np.indices(alpha.shape)
   for joint in endpoints:
    q=joints[joint];jx,jy=q['x'],q['y']
    cap=((xx-jx)**2+(yy-jy)**2<=32**2)&(owner>i)&(alpha>=250)&(out[:,:,3]<240)
    samplex=np.clip(xx-jx+sx,0,1023);sampley=np.clip(yy-jy+sy,0,1535)
    good=cap&(pixels[sampley,samplex,3]>250)
    out[good]=pixels[sampley[good],samplex[good]];out[good,3]=255
  # Full-width ROUND overlap discs, not 40px extrusion. Joint radius tracks
  # limb half-width (MG knee105, elbow80, hip90; FG knee90/elbow70/hip85).
  # Each disc reuses real source joint pixels and fills occluded/exterior areas
  # with a 2D genuine fur patch; no nearest-pixel stretching is used.
  joints=json.loads((delivery/'joints.json').read_text())
  rhip,rknee,relbow,rshoulder,rwrist=(90,105,80,80,60) if args.cast=='MG' else (85,90,70,70,55)
  caplinks={
   'arm_back_upper':[('shoulderB',rshoulder,['torso']),('elbowB',relbow,['arm_back_lower'])],
   'arm_back_lower':[('elbowB',relbow,['arm_back_upper']),('wristB',rwrist,['fist_back'])],
   'arm_front_upper':[('shoulderF',rshoulder,['torso']),('elbowF',relbow,['arm_front_lower'])],
   'arm_front_lower':[('elbowF',relbow,['arm_front_upper']),('wristF',rwrist,['fist_front'])],
   'leg_back_upper':[('hipB',rhip,['pelvis']),('kneeB',rknee,['leg_back_lower'])],
   'leg_back_lower':[('kneeB',rknee,['leg_back_upper'])],
   'leg_front_upper':[('hipF',rhip+25,['pelvis']),('kneeF',rknee,['leg_front_lower'])],
   'leg_front_lower':[('kneeF',rknee,['leg_front_upper'])],
   'pelvis':[('hipB',rhip,['leg_back_upper']),('hipF',rhip,['leg_front_upper'])],
   'torso':[('shoulderB',rshoulder,['arm_back_upper']),('shoulderF',rshoulder,['arm_front_upper'])],
  }
  yy,xx=np.indices(alpha.shape)
  for joint,radius,neighbors in caplinks.get(name,[]):
   q=joints[joint];jx,jy=q['x'],q['y'];disc=(xx-jx)**2+(yy-jy)**2<=radius**2
   valid=np.isin(owner,[i]+[ORDER.index(n) for n in neighbors])&(alpha>240)
   # This donor is an unwarped source fur patch. Wrap its two spatial axes
   # only into missing hidden portions; existing visible/gen pixels win.
   donor=(740,995) if name.startswith('leg_') or name=='pelvis' else ((185,570) if args.cast=='MG' else (180,635))
   dx,dy=donor;tilex=dx-25+(xx-jx+25)%50;tiley=dy-25+(yy-jy+25)%50
   patch=pixels[tiley,tilex].copy();patch[:,:,3]=255
   patch[valid]=pixels[valid];patch[valid,3]=255
   patch[~disc]=0
   # Paint only BEHIND the completed part, preserving its original pixels.
   capim=Image.fromarray(patch);capim.alpha_composite(Image.fromarray(out));out=np.array(capim)
  out[out[:,:,3]==0,:3]=0
  im=Image.fromarray(out);im.save(layers/f'{name}.png');comp.alpha_composite(im);reports[name]={'visible_pixels':int((visible&(alpha>0)).sum()),'generated_hidden_pixels':underlay,'generated_registered':reg.exists()};ownview[visible,:3]=colors[i]
 (layers/'layers.json').write_text(json.dumps({'order':ORDER},indent=2));ref.save(args.out/'full.png');comp.save(args.out/'assembled.png');ownview[alpha==0]=0;Image.fromarray(ownview).save(args.out/'ownership_overlay.png')
 side=Image.new('RGB',(2048,1536),'#efeadc')
 for i,im in enumerate([ref,comp]):
  bg=Image.new('RGBA',im.size,'#efeadc');bg.alpha_composite(im);side.paste(bg,(1024*i,0))
 side.save(args.out/'full-vs-assembled.png')
 compare=pixels.copy();compare[alpha==0]=0;diff=np.abs(np.array(comp).astype(int)-compare.astype(int));report={'cast':args.cast,'canvas':ref.size,'max_rgba_error':int(diff.max()),'mean_rgba_error':float(diff.mean()),'parts':reports,'warning':'complete generated underpainting may change rest overlap; motion and draw order require visual review; live cast untouched'}
 (args.out/'prepare_report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
if __name__=='__main__':main()
