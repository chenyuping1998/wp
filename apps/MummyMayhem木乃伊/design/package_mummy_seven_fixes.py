"""Versioned complete frontend package for the seven UI/character/wheel fixes."""
from pathlib import Path
import hashlib,json,zipfile
APP=Path(__file__).resolve().parent.parent;release=APP/'design/release'
out=release/'MummyMayhem_frontend_review_20261107_seven_fixes.zip'
source=APP/'static/assets/spines/mummyCat';built=APP/'build/assets/spines/mummyCat'
for p in source.iterdir():
 if p.is_file():assert (built/p.name).read_bytes()==p.read_bytes(),f'stale character:{p.name}'
paths={
 'cloth':'design/source/mummy_delivery/mascot/flow/verification.json',
 'clothSeams':'design/source/mummy_delivery/mascot/flow/seams_verification.json',
 'arms':'design/source/mummy_delivery/mascot/arm_verification.json',
 'uiWheel':'design/source/mummy_delivery/ui_wheel_verification.json',
 'runtime':'design/source/mummy_delivery/runtime_verification.json'}
reports={k:json.loads((APP/p).read_text(encoding='utf-8-sig'))for k,p in paths.items()}
assert all(r['passed']for r in reports.values())
assert reports['cloth']['clothStrips']==4
assert all(v==1 for v in reports['clothSeams']['minCoverage'].values())
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in sorted((APP/'build').rglob('*')):
  if p.is_file():z.write(p,p.relative_to(APP/'build').as_posix())
with zipfile.ZipFile(out)as z:
 assert 'index.html' in z.namelist()
 for p in source.iterdir():
  if p.is_file():assert z.read('assets/spines/mummyCat/'+p.name)==p.read_bytes()
meta=dict(file=out.name,bytes=out.stat().st_size,sha256=hashlib.sha256(out.read_bytes()).hexdigest(),reports=paths)
(release/'PACKAGE_seven_fixes.json').write_text(json.dumps(meta,indent=2));print(json.dumps(meta,indent=2))
