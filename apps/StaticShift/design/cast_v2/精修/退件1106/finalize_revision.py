"""Stage only reviewed fifth-round elbow PNGs. All other r4 layers stay in place."""
from pathlib import Path
import json,hashlib,shutil,subprocess,os
import numpy as np
from scipy import ndimage as ndi
from PIL import Image
P=Path(__file__).resolve().parent;ROOT=P.parents[1];REV='staticshift-cast-20261106-r5';CHECK=Path.home()/'tools/spine-generator/scripts/check_outline_ink.py';proofs=['第五輪_手臂伸直_淺紙底放大.jpg','第五輪_手舉過頭_淺紙底放大.jpg','第五輪_肘端總對照.jpg','第五輪_單層肘端_淺暗底.jpg'];sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest();arms={f'arm_{s}_{part}.png'for s in ['l','r']for part in ['upper','lower']}
review=json.loads((P/'visual-review.json').read_text());assert review['status']=='ACCEPTED';scope=json.loads((P/'scope-report.json').read_text());manifest={'revision':REV,'scope':'Local art delivery only; r4 runtime used unchanged for QA, no Spine integration/game/upload/platform update','paper':'#e5e2d6','characters':{},'proof_sha256':{n:sha(P/n)for n in proofs},'checker_sha256':sha(CHECK),'pipeline_sha256':{f.name:sha(f)for f in sorted(P.glob('*.py'))},'reference_prompts':['GENERATION_PROMPTS.json']}
for ch in ['dj','host']:
 D=P/'candidate'/ch;B=P/'baseline'/ch;layout=json.loads((D/'layout.json').read_text());oldlayout=json.loads((B/'layout.json').read_text());assert layout['joints']==oldlayout['joints'];assert layout['draw_order']==oldlayout['draw_order'];files=sorted((D/'layers').glob('*.png'));assert len(files)==26;assert{f.name for f in files}=={f.name for f in(B/'layers').glob('*.png')};parts={};L={}
 for f in files:
  a=np.array(Image.open(f).convert('RGBA'));assert a.shape==(1536,1024,4);assert ndi.label(a[:,:,3]>0)[1]==1;assert not a[a[:,:,3]==0,:3].any();parts[f.name]=sha(f);L[f.stem]=Image.fromarray(a)
  if f.name not in arms:assert sha(f)==sha(B/'layers'/f.name)
 assert set(scope[ch]['changed_layers'])=={n[:-4]for n in arms};assert len(scope[ch]['unchanged_layers'])==22
 full=Image.new('RGBA',(1024,1536))
 for n in layout['draw_order']:full.alpha_composite(L[n])
 assert full.tobytes()==Image.open(D/'assembled.png').convert('RGBA').tobytes();assert (D/'master.png').read_bytes()==(D/'assembled.png').read_bytes();assert review['source_sha256'][ch]==sha(D/'assembled.png')
 poses=json.loads((D/'qa/pose-outline-report.json').read_text());assert len(poses)==8 and all(v['verdict']=='PASS'and not v['runs']for v in poses.values());overlap=json.loads((D/'qa/overlap-report.json').read_text());assert all(v['at_least_40px']for v in overlap.values());actual=json.loads((D/'qa/actual-motions/report.json').read_text());assert actual['total_frames']==126;assert actual['source_layers_sha256']==parts;assert actual['spine_json_sha256']==sha(ROOT/'spine_r4'/(ch+'_L')/(ch+'.json'))
 layout['revision']=REV;layout['status']='R5_ELBOW_ART_REPAIRED_NOT_RUNTIME_INTEGRATED';(D/'layout.json').write_text(json.dumps(layout,ensure_ascii=False,indent=2)+'\n');manifest['characters'][ch]={'layers_sha256':parts,'assembled_sha256':sha(D/'assembled.png'),'changed_layers':sorted(arms),'unchanged_layers':22,'poses':{n:v['verdict']for n,v in poses.items()},'actual_motion_frames':126,'actual_r4_skeleton_sha256':actual['spine_json_sha256'],'minimum_overlap_px':min(v['axis_overlap_px']for v in overlap.values())}
print('REVIEWED SOURCE VERIFIED: 8 local elbow layers, 44 unchanged, 16/16 static poses, 252 actual frames',flush=True)
# Refuse to clobber any independent edit since the r4 snapshot.
for ch in ['dj','host']:
 for f in (ROOT/'交件'/ch/'layers').glob('*.png'):assert sha(f)==sha(P/'baseline'/ch/'layers'/f.name),(ch,f.name,'official delivery changed since baseline')
for ch in ['dj','host']:
 D=P/'candidate'/ch;dest=ROOT/'交件'/ch
 for n in arms:shutil.copy2(D/'layers'/n,dest/'layers'/n)
 for n in ['assembled.png','master.png','layout.json']:shutil.copy2(D/n,dest/n)
 shutil.rmtree(dest/'qa');shutil.copytree(D/'qa',dest/'qa');env=dict(os.environ);env['PATH']='/Applications/anaconda3/bin:'+env.get('PATH','');r=subprocess.run(['python3',str(CHECK),'交件/'+ch,'--out','交件/'+ch+'/qa/outline-ink.jpg'],cwd=ROOT,env=env,capture_output=True,text=True,check=True);out=json.loads(r.stdout);assert out['verdict']=='PASS'and not out['runs'];(dest/'qa/outline-ink.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');manifest['characters'][ch]['outline']=out
 for f in(dest/'layers').glob('*.png'):assert sha(f)==manifest['characters'][ch]['layers_sha256'][f.name]
 assert sha(dest/'assembled.png')==manifest['characters'][ch]['assembled_sha256'];manifest['characters'][ch]['qa_sha256']={str(f.relative_to(dest/'qa')):sha(f)for f in sorted((dest/'qa').rglob('*'))if f.is_file()};(dest/'source-report.json').write_text(json.dumps({'revision':REV,**manifest['characters'][ch]},ensure_ascii=False,indent=2)+'\n');shutil.copy2(dest/'source-report.json',D/'source-report.json');print('FORMAL',ch,out['verdict'],'uninked_px',out['uninked_px'],flush=True)
for n in proofs:shutil.copy2(P/n,ROOT/'交件'/n)
preview=Image.new('RGBA',(2048,1536),'#e5e2d6')
for i,ch in enumerate(['dj','host']):preview.alpha_composite(Image.open(ROOT/'交件'/ch/'assembled.png'),(1024*i,0))
preview.convert('RGB').save(ROOT/'交件/preview.jpg',quality=97);(ROOT/'交件/preview-source-hashes.json').write_text(json.dumps({ch:manifest['characters'][ch]['assembled_sha256']for ch in ['dj','host']},indent=2)+'\n')
proof=Image.new('RGB',(1500,1350),'#e5e2d6')
for row,ch in enumerate(['dj','host']):
 for col,label in enumerate(['raised','folded','knees']):
  im=Image.open(ROOT/'交件'/ch/'qa'/('joint-'+label+'.png')).convert('RGB');im.thumbnail((500,675));proof.paste(im,(col*500,row*675))
proof.save(ROOT/'交件/退件修正_淺底姿勢.jpg',quality=97)
wrists=Image.new('RGB',(1760,490),'#e5e2d6')
for i,ch in enumerate(['dj','host']):wrists.paste(Image.open(ROOT/'交件'/ch/'qa/all-wrists-paper.jpg'),(i*880,0))
wrists.save(ROOT/'交件/退件修正_全部換手.jpg',quality=97)
manifest['status']='ACCEPTED_AND_STAGED_LOCAL_ART_ONLY';(P/'delivery-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');shutil.copy2(P/'delivery-manifest.json',ROOT/'精修/delivery-manifest.json');(P/'STATUS.json').write_text(json.dumps({'revision':REV,'status':manifest['status'],'outline':{ch:manifest['characters'][ch]['outline']['verdict']for ch in ['dj','host']},'unchanged_r4_layers':44,'formal_paths':['../../交件/dj','../../交件/host'],'platform_updated':False},ensure_ascii=False,indent=2)+'\n');print('ART STAGED: only 8 elbow source files overwritten; other 44 r4 files untouched',flush=True)
