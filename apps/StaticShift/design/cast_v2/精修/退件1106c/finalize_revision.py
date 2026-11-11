from pathlib import Path
from PIL import Image
from scipy import ndimage as ndi
import numpy as np,hashlib,json,shutil,subprocess,os,sys
P=Path(__file__).resolve().parent;R=P.parents[1];REV='staticshift-cast-20261106-r7';CHECK=Path.home()/'tools/spine-generator/scripts/check_outline_ink.py';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();allowed={'dj':{'arm_r_lower.png','hand_r_hatheld.png'},'host':{'hand_r_grip.png','arm_r_lower.png','arm_l_lower.png','hand_l_open.png','hand_l_point.png','hand_r_hatheld.png'}};proofs=['第七輪_三處原角度3倍_修前修後站姿.jpg','第七輪_遠手指向_補充3倍.jpg'];review=json.loads((P/'visual-review.json').read_text());assert review['status']=='ACCEPTED';proofmeta=json.loads((P/'proof-poses.json').read_text());manifest={'revision':REV,'scope':'Eight permitted source PNGs, including explicitly approved host hand_r_hatheld wrist root; local art delivery only','paper':'#e5e2d6','proof_zoom':3,'proof_sha256':{n:sha(P/n)for n in proofs},'characters':{},'platform_updated':False}
for ch in ['dj','host']:
 D=P/'candidate'/ch;B=P/'baseline'/ch;files=sorted((D/'layers').glob('*.png'));assert len(files)==26;changed={f.name for f in files if sha(f)!=sha(B/'layers'/f.name)};assert changed==allowed[ch],(ch,changed);parts={f.name:sha(f)for f in files};assert parts==proofmeta['source_layers_sha256']['candidate'][ch];assert parts==review['source_layers_sha256'][ch];assert sha(D/'assembled.png')==review['assembled_sha256'][ch];layout=json.loads((D/'layout.json').read_text());base=json.loads((B/'layout.json').read_text());assert layout['joints']==base['joints']and layout['draw_order']==base['draw_order'];full=Image.new('RGBA',(1024,1536))
 for f in files:
  a=np.array(Image.open(f).convert('RGBA'));assert a.shape==(1536,1024,4);assert ndi.label(a[:,:,3]>0)[1]==1,(ch,f.name,'fragment');assert not a[a[:,:,3]==0,:3].any()
 for name in layout['draw_order']:full.alpha_composite(Image.open(D/'layers'/(name+'.png')))
 assert full.tobytes()==Image.open(D/'assembled.png').convert('RGBA').tobytes();assert sha(D/'master.png')==sha(D/'assembled.png');poses=json.loads((D/'qa/pose-outline-report.json').read_text());assert len(poses)==8 and all(v['verdict']=='PASS'for v in poses.values());actual=json.loads((D/'qa/actual-wrists/report.json').read_text());assert actual['total_frames']==149 and not actual['failures'];assert actual['source_layers_sha256']==parts;assert actual['spine_r6_sha256']==sha(R/'spine_r6'/(ch+'_L')/(ch+'.json'));assert json.loads((D/'qa/outline-ink.json').read_text())['verdict']=='PASS';layout['revision']=REV;layout['status']='R7_WRIST_ART_REPAIRED_NOT_RUNTIME_INTEGRATED';(D/'layout.json').write_text(json.dumps(layout,ensure_ascii=False,indent=2)+'\n');manifest['characters'][ch]={'layers_sha256':parts,'assembled_sha256':sha(D/'assembled.png'),'changed_layers':sorted(changed),'unchanged_r6_layers':26-len(changed),'static_pose_outline_PASS':8,'actual_motion_frames':149,'actual_wrists_checked':298,'spine_r6_sha256':actual['spine_r6_sha256']}
 # Refuse to clobber an independent formal source edit.
 for f in(R/'交件'/ch/'layers').glob('*.png'):assert sha(f)==sha(B/'layers'/f.name),(ch,f.name,'formal source changed independently')
# Exact source-scope preservation, including accepted elbows and accessories.
scope=json.loads((P/'scope-report.json').read_text());assert scope['unchanged_png_count']==44;assert scope['host_hatheld_accessories_exact'];assert scope['accepted_proximal_parts_exact']
for ch in ['dj','host']:
 D=P/'candidate'/ch;dest=R/'交件'/ch
 for name in allowed[ch]:shutil.copy2(D/'layers'/name,dest/'layers'/name)
 for n in ['assembled.png','master.png','layout.json']:shutil.copy2(D/n,dest/n)
 shutil.rmtree(dest/'qa');shutil.copytree(D/'qa',dest/'qa');env=dict(os.environ);env['PATH']='/Applications/anaconda3/bin:'+env.get('PATH','');res=subprocess.run(['python3',str(CHECK),'交件/'+ch,'--out','交件/'+ch+'/qa/outline-ink.jpg'],cwd=R,env=env,capture_output=True,text=True,check=True);result=json.loads(res.stdout);assert result['verdict']=='PASS'and result['uninked_px']==0;(dest/'qa/outline-ink.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');manifest['characters'][ch]['formal_outline']=result
 for f in(dest/'layers').glob('*.png'):assert sha(f)==manifest['characters'][ch]['layers_sha256'][f.name]
 manifest['characters'][ch]['qa_sha256']={str(f.relative_to(dest/'qa')):sha(f)for f in sorted((dest/'qa').rglob('*'))if f.is_file()};(dest/'source-report.json').write_text(json.dumps({'revision':REV,**manifest['characters'][ch]},ensure_ascii=False,indent=2)+'\n');shutil.copy2(dest/'source-report.json',D/'source-report.json');print('FORMAL',ch,result['verdict'],'uninked_px',result['uninked_px'],flush=True)
for n in proofs:shutil.copy2(P/n,R/'交件'/n)
preview=Image.new('RGBA',(2048,1536),'#e5e2d6')
for i,ch in enumerate(['dj','host']):preview.alpha_composite(Image.open(R/'交件'/ch/'assembled.png'),(i*1024,0))
preview.convert('RGB').save(R/'交件/preview.jpg',quality=98);(R/'交件/preview-source-hashes.json').write_text(json.dumps({ch:manifest['characters'][ch]['assembled_sha256']for ch in ['dj','host']},indent=2)+'\n')
# Refresh common evidence from final art, never retain r6 images as r7 proof.
proof=Image.new('RGB',(1500,1350),'#e5e2d6')
for row,ch in enumerate(['dj','host']):
 for col,label in enumerate(['raised','folded','knees']):
  im=Image.open(R/'交件'/ch/'qa'/('joint-'+label+'.png')).convert('RGB');im.thumbnail((500,675));proof.paste(im,(col*500,row*675))
proof.save(R/'交件/退件修正_淺底姿勢.jpg',quality=98);wrists=Image.new('RGB',(1760,490),'#e5e2d6')
for i,ch in enumerate(['dj','host']):wrists.paste(Image.open(R/'交件'/ch/'qa/all-wrists-paper.jpg'),(i*880,0))
wrists.save(R/'交件/退件修正_全部換手.jpg',quality=98);manifest['status']='ACCEPTED_AND_STAGED_LOCAL_ART_ONLY';manifest['changed_png_count']=8;manifest['unchanged_r6_png_count']=44;(P/'delivery-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');shutil.copy2(P/'delivery-manifest.json',R/'精修/delivery-manifest.json');(P/'STATUS.json').write_text(json.dumps({'revision':REV,'status':manifest['status'],'outline':{'dj':'PASS','host':'PASS'},'changed_png_count':8,'unchanged_r6_png_count':44,'platform_updated':False},ensure_ascii=False,indent=2)+'\n');print('STAGED r7: 8 permitted PNGs repaired; 44 r6 PNGs byte-exact',flush=True)
