"""Source-only revisions keep the existing officially authored 4.3 rig byte-for-byte.

Current spine-motion no longer contains the old stand34 preset. Do not run the
fighter character generator on these stand34 layers to repair source artwork.
"""
from pathlib import Path
import json,shutil,subprocess,sys
D=Path(__file__).resolve().parent;app=D.parents[1]
rig=D/'cast_fg_spine/cast_fg.json';runtime=app/'src/game/hypnoAssistantData.json'
assert rig.read_bytes()==runtime.read_bytes(),'Authoring and runtime rig differ; resolve before source sync'
j=json.loads(rig.read_text())
assert len(j['animations'])==10
assert next(e['time'] for e in j['animations']['gaze']['events'] if e['name']=='throw')==.62
before=rig.read_bytes()
for p in (D/'layers').glob('*.png'):shutil.copy2(p,D/'cast_fg_spine/images'/p.name)
subprocess.run([sys.executable,str(D/'build_runtime.py')],check=True)
assert rig.read_bytes()==before
print('Source images/runtime synchronized; official ten-clip rig preserved exactly.')
