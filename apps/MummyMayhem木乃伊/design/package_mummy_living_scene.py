"""Package the built living scene after reviewed runtime and component checks."""
from pathlib import Path
import hashlib,json,zipfile
APP=Path(__file__).resolve().parent.parent
release=APP/'design/release'
out=release/'MummyMayhem_frontend_review_20261107_living_scene.zip'
paths={
 'face':'design/preview_mummy_20261107/living_scene/face_verification.json',
 'background':'design/preview_mummy_20261107/living_scene/ambience_verification.json',
 'betComponent':'design/preview_mummy_20261107/living_scene/bet_component_verification.json',
 'rumble':'design/source/mummy_delivery/audio/wheel_rumble_report.json',
 'audio':'design/source/mummy_audio/verification.json',
 'cloth':'design/source/mummy_delivery/mascot/flow/verification.json',
 'clothSeams':'design/source/mummy_delivery/mascot/flow/seams_verification.json',
 'arms':'design/source/mummy_delivery/mascot/arm_verification.json',
 'uiWheel':'design/source/mummy_delivery/ui_wheel_verification.json',
 'runtime':'design/source/mummy_delivery/runtime_verification.json'}
reports={k:json.loads((APP/p).read_text(encoding='utf-8-sig'))for k,p in paths.items()}
assert all(r['passed']for r in reports.values())
assert reports['cloth']['clothStrips']==4
assert all(v==1 for v in reports['clothSeams']['minCoverage'].values())
# Catch stale art/audio copied by a build before any final asset revision.
for directory in ['assets/spines/mummyCat','assets/audio/mummy','assets/sprites/mummyBackground']:
 for p in (APP/'static'/directory).rglob('*'):
  if p.is_file():assert (APP/'build'/p.relative_to(APP/'static')).read_bytes()==p.read_bytes(),f'Stale asset: {p}'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=6)as z:
 for p in sorted((APP/'build').rglob('*')):
  if p.is_file():z.write(p,p.relative_to(APP/'build').as_posix())
with zipfile.ZipFile(out)as z:
 assert 'index.html'in z.namelist()
 assert z.read('assets/spines/mummyCat/head_talk.png')==(APP/'static/assets/spines/mummyCat/head_talk.png').read_bytes()
meta=dict(file=out.name,bytes=out.stat().st_size,sha256=hashlib.sha256(out.read_bytes()).hexdigest(),reports=paths)
(release/'PACKAGE_living_scene.json').write_text(json.dumps(meta,indent=2),encoding='utf-8')
print(json.dumps(meta,indent=2))
