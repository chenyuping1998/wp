from pathlib import Path
import hashlib,json,zipfile
APP=Path(__file__).resolve().parent.parent
release=APP/'design/release';release.mkdir(exist_ok=True)
out=release/'MummyMayhem_frontend_review_20261107_character_v2.zip'
source=APP/'static/assets/spines/mummyCat';built=APP/'build/assets/spines/mummyCat'
for p in source.iterdir():
 if p.is_file():assert (built/p.name).read_bytes()==p.read_bytes(),f'stale built character:{p.name}'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in sorted((APP/'build').rglob('*')):
  if p.is_file():z.write(p,p.relative_to(APP/'build').as_posix())
with zipfile.ZipFile(out) as z:
 assert 'index.html' in z.namelist()
 for p in source.iterdir():
  if p.is_file():assert z.read('assets/spines/mummyCat/'+p.name)==p.read_bytes()
result=dict(file=out.name,bytes=out.stat().st_size,sha256=hashlib.sha256(out.read_bytes()).hexdigest(),character='v2: tail reattached to pelvis, smaller belly')
(release/'PACKAGE_character_v2.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
