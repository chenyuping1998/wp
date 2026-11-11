"""Stage only reviewed local art, then run Stone's unmodified outline gates."""
from pathlib import Path
import json,hashlib,shutil,subprocess,sys,os
import numpy as np
from scipy import ndimage as ndi
from PIL import Image,ImageDraw
P=Path(__file__).resolve().parent;ROOT=P.parents[1];REV='rejection-fix-20261105-2';CHECK=Path.home()/'tools/spine-generator/scripts/check_outline_ink.py'
def sha(f):return hashlib.sha256(f.read_bytes()).hexdigest()
manifest={'revision':REV,'scope':'local art only; no game, Spine, upload or platform changes','paper':'#e5e2d6','characters':{},'sources':{f.name:sha(f)for f in sorted(P.glob('*_generated.png'))},'pipeline':{f.name:sha(f)for f in [P/'align_sources.py',P/'apply_repairs.py',P/'qa_repairs.py',P/'art_skinning.py',P/'review_removed.py']},'checker_sha256':sha(CHECK)}
for ch in ['dj','host']:
 D=P/'candidate'/ch;B=P/'修前交件'/ch;layout=json.loads((D/'layout.json').read_text());oldlayout=json.loads((B/'layout.json').read_text());assert layout['joints']==oldlayout['joints'];assert layout['draw_order']==oldlayout['draw_order'];files=sorted((D/'layers').glob('*.png'));assert len(files)==26
 full=Image.new('RGBA',(1024,1536));parts={}
 for f in files:
  im=Image.open(f).convert('RGBA');a=np.array(im);assert im.size==(1024,1536);assert im.getchannel('A').getextrema()==(0,255);assert ndi.label(a[:,:,3]>0)[1]==1,f;assert not a[a[:,:,3]==0,:3].any(),f
  assert not (a[0,:,3].any()or a[-1,:,3].any()or a[:,0,3].any()or a[:,-1,3].any());parts[f.name]={'sha256':sha(f),'canvas':[1024,1536]}
 for n in layout['draw_order']:full.alpha_composite(Image.open(D/'layers'/(n+'.png')).convert('RGBA'))
 assert full.tobytes()==Image.open(D/'assembled.png').convert('RGBA').tobytes();assert (D/'assembled.png').read_bytes()==(D/'master.png').read_bytes()
 overlap=json.loads((D/'qa/overlap-report.json').read_text());assert all(x['at_least_40px']for x in overlap.values()),ch
 for label in ['rest','extended','raised','folded','shrug','knees']:
  im=Image.open(D/'qa'/('joint-'+label+'.png'));assert im.getpixel((0,0))[:3]==(229,226,214)
 result=subprocess.run([sys.executable,str(CHECK),str(D),'--out',str(D/'qa/outline-ink.jpg')],capture_output=True,text=True,check=True);report=json.loads(result.stdout);assert report['verdict']=='PASS'and not report['runs'];(D/'qa/outline-ink.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 guide={'purpose':'static art verification only; not a delivered Spine rig or animation','joints':'layout.json; all original coordinates preserved','source_triangle_grid_px':7,'weight':'q = signed distance along limb from its proximal joint; child_weight = smoothstep(clamp((q+blend)/blend,0,1)); proximal concealed root follows parent, visible shaft and distal hand use full child transform','blend_px':{'arm_upper':70,'arm_lower':30,'leg_upper':90,'leg_lower':80,'foot':60},'pose_angles':'unchanged from design/cast_v2/check_joint_art.py; no reduced motion or added occlusion overlays','production_note':'Actual Spine integration must build corresponding mesh/weights and validate its own animations; these static proofs do not certify a rigid-image rig.'};(D/'qa/articulation-model.json').write_text(json.dumps(guide,ensure_ascii=False,indent=2)+'\n')
 layout['status']='ART_REPAIRED_20261105_2_RUNTIME_NOT_INTEGRATED';layout['revision']=REV;(D/'layout.json').write_text(json.dumps(layout,ensure_ascii=False,indent=2)+'\n')
 manifest['characters'][ch]={'layers':parts,'assembled_sha256':sha(D/'assembled.png'),'minimum_overlap_px':min(x['axis_overlap_px']for x in overlap.values()),'outline':report,'joints_unchanged':True,'draw_order_unchanged':True,'qa_sha256':{f.name:sha(f)for f in sorted((D/'qa').glob('*'))if f.is_file()}}
 (D/'source-report.json').write_text(json.dumps({'revision':REV,**manifest['characters'][ch]},ensure_ascii=False,indent=2)+'\n')
if '--stage'not in sys.argv:
 print('CANDIDATE GATES PASS: 52 connected RGBA layers; assemblies exact; original interfaces; outline PASS x2');sys.exit(0)
assert json.loads((P/'visual-review.json').read_text())['status']=='ACCEPTED','Visible pose defects block staging'
for ch in ['dj','host']:
 D=P/'candidate'/ch;dest=ROOT/'交件'/ch
 for n in ['layers','qa']:
  shutil.rmtree(dest/n);shutil.copytree(D/n,dest/n)
 for n in ['assembled.png','master.png','layout.json','source-report.json']:shutil.copy2(D/n,dest/n)
 # Run exactly the requested command on the final paths using python3 with the
 # existing scientific Python installation available on PATH.
 env=dict(os.environ);env['PATH']='/Applications/anaconda3/bin:'+env.get('PATH','')
 cmd=['python3',str(CHECK),'交件/'+ch,'--out','交件/'+ch+'/qa/outline-ink.jpg'];run=subprocess.run(cmd,cwd=ROOT,env=env,capture_output=True,text=True,check=True);r=json.loads(run.stdout);assert r['verdict']=='PASS'and not r['runs'];(dest/'qa/outline-ink.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n');print(ch,run.stdout)
 manifest['characters'][ch]['outline']=r;manifest['characters'][ch]['qa_sha256']={f.name:sha(f)for f in sorted((dest/'qa').glob('*'))if f.is_file()};(dest/'source-report.json').write_text(json.dumps({'revision':REV,**manifest['characters'][ch]},ensure_ascii=False,indent=2)+'\n')
 for f in (dest/'layers').glob('*.png'):assert sha(f)==manifest['characters'][ch]['layers'][f.name]['sha256']
 assert sha(dest/'assembled.png')==manifest['characters'][ch]['assembled_sha256']
old=ROOT/'精修/delivery-manifest.json'
if old.exists()and not(P/'previous-delivery-manifest.json').exists():shutil.copy2(old,P/'previous-delivery-manifest.json')
manifest['status']='ART_REPAIRED_STAGED_LOCAL_ONLY';old.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');(P/'delivery-manifest.json').write_text(old.read_text())
preview=Image.new('RGBA',(2048,1536),'#e5e2d6');hashes={}
for i,ch in enumerate(['dj','host']):
 f=ROOT/'交件'/ch/'assembled.png';preview.alpha_composite(Image.open(f),(i*1024,0));hashes[ch]=sha(f)
preview.convert('RGB').save(ROOT/'交件/preview.jpg',quality=96);(ROOT/'交件/preview-source-hashes.json').write_text(json.dumps(hashes,indent=2)+'\n')
print('FINAL LOCAL ART STAGED AND VERIFIED; both formal outline gates PASS; no platform update')
