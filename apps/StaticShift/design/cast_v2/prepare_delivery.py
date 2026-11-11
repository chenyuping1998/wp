"""Build reviewable art; --stage-art copies the reviewed revision to 交件/ only."""
from pathlib import Path
import sys,subprocess,json,shutil,hashlib
from PIL import Image
import numpy as np
from scipy import ndimage as ndi
P=Path(__file__).resolve().parent
if '--reuse-reviewed' not in sys.argv:
 for script in ['repair_layers.py','check_overlap.py','check_joint_art.py','native_joint_checks.py','review_alpha_changes.py','compare_source_repaint.py']:
  subprocess.run([sys.executable,str(P/script)],check=True)
manifest={'revision':'precise-20261105-1','scope':'art only; runtime/motion/platform not integrated','characters':{},'pipeline':{},'input_sources':{}}
for script in ['repair_layers.py','check_overlap.py','check_joint_art.py','native_joint_checks.py','review_alpha_changes.py','compare_source_repaint.py']:
 manifest['pipeline'][script]=hashlib.sha256((P/script).read_bytes()).hexdigest()
for ch in ['dj','host']:
 inputs=[P/'交件'/ch/'reference-master.png',*sorted((P/'交件'/ch/'raw').glob('*.png'))]
 inputs.extend([P/'精修/source'/(ch+'_forearm.png'),P/'精修/source'/(ch+'_leg_revision.png')])
 if ch=='host':inputs.append(P/'精修/source/host_torso_no_socket.png')
 manifest['input_sources'][ch]={str(f.relative_to(P)):hashlib.sha256(f.read_bytes()).hexdigest()for f in inputs}
 D=P/'精修/v1'/ch;files=sorted((D/'layers').glob('*.png'));assert len(files)==26,(ch,len(files));parts={};arrays={}
 for f in files:
  im=Image.open(f).convert('RGBA');assert im.size==(1024,1536),f;a=np.array(im);lab,n=ndi.label(a[:,:,3]>0);assert n==1,(ch,f.name,n);assert not any([a[0,:,3].any(),a[-1,:,3].any(),a[:,0,3].any(),a[:,-1,3].any()]),f;assert im.getchannel('A').getextrema()==(0,255),f;assert not a[a[:,:,3]==0,:3].any(),f
  arrays[f.stem]=im;parts[f.name]={'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'size':[1024,1536],'nonzero_alpha_components':n}
 layout=json.loads((D/'layout.json').read_text());full=Image.new('RGBA',(1024,1536))
 for name in layout['draw_order']:full.alpha_composite(arrays[name])
 expected=Image.open(D/'qa/assembled-candidate.png').convert('RGBA');assert full.tobytes()==expected.tobytes(),ch
 overlap=json.loads((D/'qa/overlap-report.json').read_text());assert all(v['at_least_40px'] for v in overlap.values()),(ch,overlap)
 silhouette=json.loads((D/'qa/leg-silhouette-report.json').read_text());assert silhouette['pass'],(ch,silhouette)
 manifest['characters'][ch]={'layers':parts,'draw_order':layout['draw_order'],'joints':layout['joints'],'minimum_measured_joint_overlap_px':min(v['axis_overlap_px']for v in overlap.values()),'assembled_sha256':hashlib.sha256((D/'qa/assembled-candidate.png').read_bytes()).hexdigest(),'qa_sha256':{str(f.relative_to(D/'qa')):hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted((D/'qa').rglob('*')) if f.is_file()},'visual_acceptance':'must be reviewed with native light/dark and static articulation proofs; source gates alone do not prove animation'}
if '--stage-art' in sys.argv:
 for ch in ['dj','host']:
  W=P/'精修/v1'/ch;D=P/'交件'/ch;H=P/'精修/history/initial-draft-delivery'/ch
  if not H.exists():
   H.mkdir(parents=True)
   for sub in ['layers','qa']:
    if (D/sub).exists():shutil.copytree(D/sub,H/sub)
   for f in ['source-report.json','master.png']:
    if (D/f).exists():shutil.copy2(D/f,H/f)
  if not (D/'reference-master.png').exists():shutil.copy2(D/'master.png',D/'reference-master.png')
  for sub in ['layers','qa']:
   if (D/sub).exists():shutil.rmtree(D/sub)
   shutil.copytree(W/sub,D/sub)
  shutil.copy2(W/'qa/assembled-candidate.png',D/'assembled.png');shutil.copy2(D/'assembled.png',D/'master.png');layout=json.loads((W/'layout.json').read_text());layout['status']='ART_DELIVERED_RUNTIME_NOT_INTEGRATED';(D/'layout.json').write_text(json.dumps(layout,indent=2)+'\n');(D/'source-report.json').write_text(json.dumps(manifest['characters'][ch],indent=2)+'\n')
  # Final copied files must be byte-identical to the actual reviewed revision.
  for file,info in manifest['characters'][ch]['layers'].items():assert hashlib.sha256((D/'layers'/file).read_bytes()).hexdigest()==info['sha256']
  assert hashlib.sha256((D/'assembled.png').read_bytes()).hexdigest()==manifest['characters'][ch]['assembled_sha256']
 manifest['status']='ART_STAGED_LOCAL_ONLY'
else:manifest['status']='REVIEW_CANDIDATE'
(P/'精修/delivery-manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n')
print(manifest['status'],'52 PNG layers + 2 exact assemblies; only art folder touched')
