"""Publish reviewed local art only. No game/runtime/upload/platform writes."""
from pathlib import Path
import json,hashlib,shutil,subprocess,sys,os
import numpy as np
from scipy import ndimage as ndi
from PIL import Image,ImageDraw,ImageFont
P=Path(__file__).resolve().parent;ROOT=P.parents[1];REV='staticshift-cast-20261105-r4';CHECK=Path.home()/'tools/spine-generator/scripts/check_outline_ink.py'
def sha(f):return hashlib.sha256(f.read_bytes()).hexdigest()
manifest={'revision':REV,'status':'REVIEWED_LOCAL_ART','scope':'art only; no Spine/runtime/game/upload/platform update','paper':'#e5e2d6','checker_sha256':sha(CHECK),'characters':{},'pipeline':{f.name:sha(f)for f in sorted(P.glob('*.py'))},'generated_sources':{f.name:sha(f)for f in sorted(P.glob('*-generated.png'))if f.name in ['dj-thigh-generated.png','host-thigh-generated.png','dj-fabric-generated.png']}}
for ch in ['dj','host']:
 D=P/'candidate'/ch;before=P/'baseline'/ch;layout=json.loads((D/'layout.json').read_text());original=json.loads((before/'layout.json').read_text());assert layout['joints']==original['joints'];assert layout['draw_order']==original['draw_order'];files=sorted((D/'layers').glob('*.png'));assert len(files)==26;assert {f.name for f in files}=={f.name for f in(before/'layers').glob('*.png')};L={};parts={}
 for f in files:
  im=Image.open(f).convert('RGBA');a=np.array(im);assert im.size==(1024,1536);assert ndi.label(a[:,:,3]>0)[1]==1,f;assert im.getchannel('A').getextrema()==(0,255);assert not a[a[:,:,3]==0,:3].any();assert not(a[0,:,3].any()or a[-1,:,3].any()or a[:,0,3].any()or a[:,-1,3].any());L[f.stem]=im;parts[f.name]={'sha256':sha(f),'canvas':[1024,1536]}
 full=Image.new('RGBA',(1024,1536))
 for n in layout['draw_order']:full.alpha_composite(L[n])
 assert full.tobytes()==Image.open(D/'assembled.png').convert('RGBA').tobytes();assert (D/'master.png').read_bytes()==(D/'assembled.png').read_bytes()
 poses=json.loads((D/'qa/pose-outline-report.json').read_text());assert set(poses)=={'rest','extended','raised','folded','shrug','knees'};assert all(r['verdict']=='PASS'and not r['runs']for r in poses.values()),ch
 overlap=json.loads((D/'qa/overlap-report.json').read_text());assert all(r['at_least_40px']for r in overlap.values())
 # Prevent any recurrence of incorrect shared material, e.g. skin on purple pants.
 J=layout['joints']
 for side in ['l','r']:
  k=J['knee_'+side];a=np.array(L[f'leg_{side}_lower']);ys,xs=np.mgrid[:1536,:1024];m=(xs-k[0])**2+(ys-k[1])**2<20**2;rgb=np.median(a[m&(a[:,:,3]>230),:3],axis=0)
  assert (rgb[2]>rgb[0]if ch=='dj'else(rgb[0]>rgb[1]and rgb[2]>rgb[1])),(ch,side,rgb)
 static=json.loads((D/'qa/outline-ink.json').read_text());assert static['verdict']=='PASS'and not static['runs'];assert (D/'qa/exact-alpha-diffs/report.json').exists()
 layout['revision']=REV;layout['status']='ART_REPAIRED_RUNTIME_NOT_INTEGRATED';(D/'layout.json').write_text(json.dumps(layout,ensure_ascii=False,indent=2)+'\n')
 entry={'layers':parts,'assembled_sha256':sha(D/'assembled.png'),'master_sha256':sha(D/'master.png'),'minimum_joint_overlap_px':min(r['axis_overlap_px']for r in overlap.values()),'original_joints_preserved':True,'original_draw_order_preserved':True,'static_outline':static,'six_rigid_pose_verdicts':{n:r['verdict']for n,r in poses.items()},'qa_sha256':{str(f.relative_to(D/'qa')):sha(f)for f in sorted((D/'qa').rglob('*'))if f.is_file()},'visual_acceptance':'Third-round crotch and sleeve-cap localized repairs; 47 layers byte-identical to r3, knee joint pixels unchanged. Premultiplied-alpha interpolation corrected to eliminate false circular highlight. Source paper/dark layers, all original rigid poses, wrists and exact alpha removals reviewed. Static art only.'}
 manifest['characters'][ch]=entry;(D/'source-report.json').write_text(json.dumps({'revision':REV,**entry},ensure_ascii=False,indent=2)+'\n')
allowed={'dj':{'leg_l_upper.png','leg_r_upper.png','arm_r_upper.png'},'host':{'leg_l_upper.png','leg_r_upper.png'}}
for ch in ['dj','host']:
 changed={f.name for f in (P/'candidate'/ch/'layers').glob('*.png')if sha(f)!=sha(P/'baseline'/ch/'layers'/f.name)};assert changed==allowed[ch],(ch,changed)
assert json.loads((P/'scope-report.json').read_text())['dj']['knee_joint_80px_RGBA_unchanged']
assert json.loads((P/'scope-report.json').read_text())['host']['knee_joint_80px_RGBA_unchanged']
manifest['third_round_scope']={'changed_layers':{ch:sorted(v)for ch,v in allowed.items()},'unchanged_source_layers':47,'knee_joint_pixels_unchanged_radius_px':80,'details_sha256':{name:sha(P/name)for name in ['第三輪_修正放大.jpg','第三輪_逐項站姿對照.jpg','第三輪_修前修後站姿.jpg']}}
print('CANDIDATE VERIFIED: 52 source layers, original interfaces, exact composites, static PASS x2, rigid poses PASS x12, all overlaps >=40px',flush=True)
if '--stage'not in sys.argv:
 (P/'verified-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');sys.exit(0)
review=json.loads((P/'visual-review.json').read_text());assert review['status']=='ACCEPTED';assert all(review['source_sha256'][ch]==manifest['characters'][ch]['assembled_sha256']for ch in ['dj','host'])
for ch in ['dj','host']:
 D=P/'candidate'/ch;dest=ROOT/'交件'/ch
 for sub in ['layers','qa']:
  shutil.rmtree(dest/sub);shutil.copytree(D/sub,dest/sub)
 for name in ['assembled.png','master.png','layout.json','source-report.json']:shutil.copy2(D/name,dest/name)
 # Exactly the user-requested checks, on the final delivery paths.
 env=dict(os.environ);env['PATH']='/Applications/anaconda3/bin:'+env.get('PATH','')
 cmd=['python3',str(CHECK),'交件/'+ch,'--out','交件/'+ch+'/qa/outline-ink.jpg'];r=subprocess.run(cmd,cwd=ROOT,env=env,capture_output=True,text=True,check=True);report=json.loads(r.stdout);assert report['verdict']=='PASS'and not report['runs'];(dest/'qa/outline-ink.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');manifest['characters'][ch]['static_outline']=report
 for f in (dest/'layers').glob('*.png'):assert sha(f)==manifest['characters'][ch]['layers'][f.name]['sha256']
 assert sha(dest/'assembled.png')==manifest['characters'][ch]['assembled_sha256'];print('FORMAL',ch,report['verdict'],'uninked_px',report['uninked_px'],flush=True)
 manifest['characters'][ch]['qa_sha256']={str(f.relative_to(dest/'qa')):sha(f)for f in sorted((dest/'qa').rglob('*'))if f.is_file()};(dest/'source-report.json').write_text(json.dumps({'revision':REV,**manifest['characters'][ch]},ensure_ascii=False,indent=2)+'\n')
manifest['status']='ART_REPAIRED_STAGED_LOCAL_ONLY';(P/'delivery-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');shutil.copy2(P/'delivery-manifest.json',ROOT/'精修/delivery-manifest.json')
preview=Image.new('RGBA',(2048,1536),'#e5e2d6');hashes={}
for i,ch in enumerate(['dj','host']):
 f=ROOT/'交件'/ch/'assembled.png';preview.alpha_composite(Image.open(f),(i*1024,0));hashes[ch]=sha(f)
preview.convert('RGB').save(ROOT/'交件/preview.jpg',quality=96);(ROOT/'交件/preview-source-hashes.json').write_text(json.dumps(hashes,indent=2)+'\n')
proof=Image.new('RGB',(1500,1350),'#e5e2d6')
for row,ch in enumerate(['dj','host']):
 for col,label in enumerate(['raised','folded','knees']):
  im=Image.open(ROOT/'交件'/ch/'qa'/('joint-'+label+'.png')).convert('RGB');im.thumbnail((500,675));proof.paste(im,(col*500,row*675))
proof.save(ROOT/'交件/退件修正_淺底姿勢.jpg',quality=97)
wrists=Image.new('RGB',(1760,490),'#e5e2d6')
for i,ch in enumerate(['dj','host']):wrists.paste(Image.open(ROOT/'交件'/ch/'qa/all-wrists-paper.jpg').convert('RGB'),(i*880,0))
wrists.save(ROOT/'交件/退件修正_全部換手.jpg',quality=97)
(P/'STATUS.json').write_text(json.dumps({'status':'ACCEPTED_AND_STAGED','revision':REV,'formal_paths':['../../交件/dj','../../交件/host'],'static_checks':{ch:manifest['characters'][ch]['static_outline']['verdict']for ch in ['dj','host']},'rigid_pose_checks':'12/12 PASS; original angles and original joints','source_hashes':hashes,'scope':'art only; platform unchanged','third_round_details':['第三輪_修正放大.jpg','第三輪_逐項站姿對照.jpg','第三輪_修前修後站姿.jpg']},ensure_ascii=False,indent=2)+'\n')
for name in ['第三輪_修正放大.jpg','第三輪_逐項站姿對照.jpg','第三輪_修前修後站姿.jpg']:shutil.copy2(P/name,ROOT/'交件'/name)
print('ART DELIVERED: final 52 layers and all QA match the reviewed revision; platform unchanged',flush=True)
