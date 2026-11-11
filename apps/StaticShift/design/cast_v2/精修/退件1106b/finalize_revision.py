from pathlib import Path
import json,hashlib,shutil,subprocess,os
import numpy as np
from scipy import ndimage as ndi
from PIL import Image
P=Path(__file__).resolve().parent;ROOT=P.parents[1];REV='staticshift-cast-20261106-r6';CHECK=Path.home()/'tools/spine-generator/scripts/check_outline_ink.py';sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest();allowed={'dj':{'arm_r_lower.png','arm_r_upper.png'},'host':{'arm_r_lower.png','arm_l_lower.png','hand_r_grip.png'}};proofs=['第六輪_近手_三角度與站姿.jpg','第六輪_遠手_三角度與站姿.jpg','第六輪_五張修正單層_淺暗底.jpg'];review=json.loads((P/'visual-review.json').read_text());assert review['status']=='ACCEPTED';manifest={'revision':REV,'paper':'#e5e2d6','scope':'Five source PNGs only; local art/evidence delivery; unchanged r5 skeleton used to evaluate motions','platform_updated':False,'characters':{},'proof_sha256':{f:sha(P/f)for f in proofs}}
for ch in ['dj','host']:
 D=P/'candidate'/ch;B=P/'baseline'/ch;files=sorted((D/'layers').glob('*.png'));assert len(files)==26;changed={f.name for f in files if sha(f)!=sha(B/'layers'/f.name)};assert changed==allowed[ch];layout=json.loads((D/'layout.json').read_text());old=json.loads((B/'layout.json').read_text());assert layout['joints']==old['joints']and layout['draw_order']==old['draw_order'];parts={f.name:sha(f)for f in files};full=Image.new('RGBA',(1024,1536))
 for f in files:
  a=np.array(Image.open(f));assert a.shape==(1536,1024,4);assert ndi.label(a[:,:,3]>0)[1]==1;assert not a[a[:,:,3]==0,:3].any()
 for name in layout['draw_order']:full.alpha_composite(Image.open(D/'layers'/(name+'.png')))
 assert full.tobytes()==Image.open(D/'assembled.png').convert('RGBA').tobytes();assert sha(D/'master.png')==sha(D/'assembled.png');assert review['assembled_sha256'][ch]==sha(D/'assembled.png');assert review['layers_sha256'][ch]==parts
 report=json.loads((D/'qa/outline-ink.json').read_text());assert report['verdict']=='PASS';poses=json.loads((D/'qa/pose-outline-report.json').read_text());assert len(poses)==8 and all(v['verdict']=='PASS'for v in poses.values());actual=json.loads((D/'qa/actual-motions/report.json').read_text());assert actual['total_frames']==149 and actual['source_layers_sha256']==parts;assert actual['spine_json_sha256']==sha(ROOT/'spine_r5'/(ch+'_L')/(ch+'.json'));assert not json.loads((D/'qa/dynamic-wrist-report.json').read_text())['failures'];keys=json.loads((D/'qa/actual-keyposes/report.json').read_text());assert len(keys)==6 and all(v['verdict']=='PASS'for v in keys.values());overlap=json.loads((D/'qa/overlap-report.json').read_text());assert all(v['opaque_overlap_area']>0 for v in overlap.values())  # Keep measured overlap; actual full-amplitude frame checks determine visible continuity.
 # Remove inherited r5 alpha comparison images for layers untouched in r6.
 for f in(D/'qa').glob('arm_*-alpha-diff.jpg'):
  if f.name.replace('-alpha-diff.jpg','.png')not in changed:f.unlink()
 for f in(D/'qa').glob('arm_*-removed-alpha.png'):
  if f.name.replace('-removed-alpha.png','.png')not in changed:f.unlink()
 valid=json.loads((D/'qa/exact-alpha-diffs/report.json').read_text())
 for f in(D/'qa/exact-alpha-diffs').glob('arm_*.png'):
  if f.name.rsplit('-',1)[0]not in valid:f.unlink()
 layout['revision']=REV;layout['status']='R6_ART_REPAIRED_NOT_RUNTIME_INTEGRATED';(D/'layout.json').write_text(json.dumps(layout,ensure_ascii=False,indent=2)+'\n');manifest['characters'][ch]={'layers_sha256':parts,'assembled_sha256':sha(D/'assembled.png'),'changed_layers':sorted(changed),'unchanged_r5_layers':26-len(changed),'static_outline_passes':8,'actual_keypose_outline_passes':6,'actual_motion_frames':149,'dynamic_wrist_checked_frames':149,'minimum_overlap_px':min(v['axis_overlap_px']for v in overlap.values()),'spine_r5_sha256':actual['spine_json_sha256']}
 # Entire current formal source must still be the r5 snapshot.
 for f in(ROOT/'交件'/ch/'layers').glob('*.png'):assert sha(f)==sha(B/'layers'/f.name),(ch,f.name,'independent formal edit')
# Accepted far elbow and external alpha are exact.
a=np.array(Image.open(P/'baseline/host/layers/arm_l_lower.png'));b=np.array(Image.open(P/'candidate/host/layers/arm_l_lower.png'));assert np.array_equal(a[:,:,3],b[:,:,3]);manifest['accepted_far_elbows_preserved']=True
for ch in ['dj','host']:
 D=P/'candidate'/ch;dest=ROOT/'交件'/ch
 for n in allowed[ch]:shutil.copy2(D/'layers'/n,dest/'layers'/n)
 for n in ['assembled.png','master.png','layout.json']:shutil.copy2(D/n,dest/n)
 shutil.rmtree(dest/'qa');shutil.copytree(D/'qa',dest/'qa');env=dict(os.environ);env['PATH']='/Applications/anaconda3/bin:'+env.get('PATH','');r=subprocess.run(['python3',str(CHECK),'交件/'+ch,'--out','交件/'+ch+'/qa/outline-ink.jpg'],cwd=ROOT,env=env,capture_output=True,text=True,check=True);result=json.loads(r.stdout);assert result['verdict']=='PASS';(dest/'qa/outline-ink.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');manifest['characters'][ch]['formal_outline']=result
 for f in(dest/'layers').glob('*.png'):assert sha(f)==manifest['characters'][ch]['layers_sha256'][f.name]
 manifest['characters'][ch]['qa_sha256']={str(f.relative_to(dest/'qa')):sha(f)for f in sorted((dest/'qa').rglob('*'))if f.is_file()};(dest/'source-report.json').write_text(json.dumps({'revision':REV,**manifest['characters'][ch]},ensure_ascii=False,indent=2)+'\n');shutil.copy2(dest/'source-report.json',D/'source-report.json');print('FORMAL',ch,result['verdict'],'uninked_px',result['uninked_px'],flush=True)
for n in proofs:shutil.copy2(P/n,ROOT/'交件'/n)
preview=Image.new('RGBA',(2048,1536),'#e5e2d6')
for i,ch in enumerate(['dj','host']):preview.alpha_composite(Image.open(ROOT/'交件'/ch/'assembled.png'),(i*1024,0))
preview.convert('RGB').save(ROOT/'交件/preview.jpg',quality=97);(ROOT/'交件/preview-source-hashes.json').write_text(json.dumps({ch:manifest['characters'][ch]['assembled_sha256']for ch in ['dj','host']},indent=2)+'\n')
# Refresh shared preview files from this exact final source.
proof=Image.new('RGB',(1500,1350),'#e5e2d6')
for row,ch in enumerate(['dj','host']):
 for col,label in enumerate(['raised','folded','knees']):
  im=Image.open(ROOT/'交件'/ch/'qa'/('joint-'+label+'.png')).convert('RGB');im.thumbnail((500,675));proof.paste(im,(col*500,row*675))
proof.save(ROOT/'交件/退件修正_淺底姿勢.jpg',quality=97);wrists=Image.new('RGB',(1760,490),'#e5e2d6')
for i,ch in enumerate(['dj','host']):wrists.paste(Image.open(ROOT/'交件'/ch/'qa/all-wrists-paper.jpg'),(i*880,0))
wrists.save(ROOT/'交件/退件修正_全部換手.jpg',quality=97)
manifest['status']='ACCEPTED_AND_STAGED_LOCAL_ART_ONLY';(P/'delivery-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');shutil.copy2(P/'delivery-manifest.json',ROOT/'精修/delivery-manifest.json');(P/'STATUS.json').write_text(json.dumps({'revision':REV,'status':manifest['status'],'outline':{'dj':'PASS','host':'PASS'},'changed_png_count':5,'unchanged_r5_png_count':47,'platform_updated':False},ensure_ascii=False,indent=2)+'\n');print('STAGED r6: 5 PNGs changed; 47 r5 PNGs byte-exact',flush=True)
