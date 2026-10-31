"""Collect V6 native-player motion evidence after builds and visual review."""
from pathlib import Path
import hashlib,json,shutil
from PIL import Image,ImageDraw
ROOT=Path('E:/stake');WP=ROOT/'wp';QA=ROOT/'tmp/new-games-motion-v6-20261030'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
for folder,slug,sequence,poses in [
 ('Purrfia喵菲亞家族','purrfia','purrfia-final-v6b-sequence','purrfia-final-v6b-all'),
 ('ParrotRadio鸚鵡電台','parrot','parrot-sequence','parrot-all')]:
 app=WP/'apps'/folder;src=app/'design/source'/slug;cast=src/'cast';review=cast/'motion-review';history=cast/'motion_v5_before/review'
 if not history.exists():shutil.copytree(review,history)
 review.mkdir(exist_ok=True)
 # Keep the native UV shoulder strips available beside the layered PSD.
 if slug=='purrfia':
  layerdir=cast/'layers';specs=json.loads((layerdir/'layers.json').read_text(encoding='utf-8'))['layers'];body=Image.open(layerdir/'body.png').convert('RGBA')
  for name,spec in specs.items():
   if not name.startswith('shoulder_facing_'):continue
   rect=spec['rect'];layer=Image.new('RGBA',body.size);layer.paste(body.crop(tuple(rect)),tuple(rect[:2]));layer.save(layerdir/(name+'.png'))
 shutil.copy2(QA/sequence/'motion.gif',review/'motion.gif')
 # Compact actual-player contact sheet: representative poses and hold/return.
 frames=json.loads((QA/sequence/'frames.json').read_text(encoding='utf-8'))
 ids=sorted(set([0,*[i for i,f in enumerate(frames) if f['name']!='idle' and (i==len(frames)-1 or frames[i+1]['name']!=f['name'])],*[round(i*(len(frames)-1)/15) for i in range(16)]]))
 sheet=Image.new('RGB',(256*4,408*((len(ids)+3)//4)),(23,30,40))
 for j,i in enumerate(ids):sheet.paste(Image.open(QA/sequence/(frames[i]['id']+'.png')),(j%4*256,j//4*408+20))
 sheet.save(review/'contact.png')
 shutil.copy2(QA/poses/'contact.png',review/'all-actions.png')
 anatomy=json.loads((cast/'anatomy-validation.json').read_text(encoding='utf-8'));flow=json.loads((cast/'motion-flow-validation.json').read_text(encoding='utf-8'))
 assert anatomy['rigSha256']==flow['rigSha256']==sha(app/'src/game/characterRigData.json')
 assert anatomy['playerSha256']==flow['playerSha256']==sha(app/'src/game/characterRigCore.ts')
 assert anatomy['totalFolded']==anatomy['seamFailures']==0
 (review/'REVIEW.txt').write_text(f'''V6 / 2026-10-31
motion.gif: {len(frames)} frames at 20fps, exported from shipped createCharacterPlayer.
Independent respiration, configured smooth crossfades, completion listeners,
held celebration loops and returns to idle remain active during capture.
contact.png: selected frames from the same continuous sequence.
all-actions.png: every action plus breath at 0 / 27 / 54 / 85 percent.
Official Spine 4.3 runtime: {anatomy['totalFrames']} frames at 60Hz;
{anatomy['transitionPairs']} action pairs; normal and turbo actual-player sequences.
{anatomy['seamSamples']} alpha-contact samples; {anatomy['totalFolded']} inverted triangles;
{anatomy['seamFailures']} failed contact samples. Contact patches: {anatomy.get('contactPatches')}.
V5 comparison: held return peak wrist speed reduced {flow['heldReturn']['peakReductionPercent']}%.
Numerical coverage is sampled; see browser-validation.json for current game QA.
''',encoding='utf-8')
 prior=src/'browser-validation.json';baseline=cast/'motion_v5_before/browser-validation.json'
 if not baseline.exists():shutil.copy2(prior,baseline)
 qa=src/'qa-v6';screens={p.name:sha(p) for p in qa.glob('*.png')}
 assert screens,'Current game screenshots required before finalization'
 report={'date':'2026-10-31','revision':'motion-flow-v6','environment':'Existing game, local mock wallet and unchanged published fixtures; no live RGS.',
 'rigSha256':anatomy['rigSha256'],'playerSha256':anatomy['playerSha256'],
 'motion':{'continuousPlayerReview':'cast/motion-review/motion.gif','allActions':'cast/motion-review/all-actions.png','anatomy':'cast/anatomy-validation.json','continuity':'cast/motion-flow-validation.json'},
 'screenshots':screens,'currentBrowserResult':json.loads((qa/'result.json').read_text(encoding='utf-8')),
 'previousUiBackgroundPrizeEvidence':'cast/motion_v5_before/browser-validation.json'}
 prior.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(slug,'V6 review collected',len(frames),'frames',anatomy['seamSamples'],'contact samples',flush=True)
