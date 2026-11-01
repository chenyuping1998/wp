"""Keep the upload tree limited to files actually loaded by this game."""
from pathlib import Path
import re,json,shutil
ROOT=Path('/Users/stone/stake-engine');APP=ROOT/'wp-banandit/apps/StaticShift';SRC=APP/'build';DST=ROOT/'upload/StaticShift/frontend'
paths=set(re.findall(r"new URL\('../../(assets/[^']+)'",(APP/'src/game/assets.ts').read_text()))
paths.update('assets/audio/'+s for s in re.findall(r"'((?:radio)/[^']+\.wav)'",(APP/'src/components/Sound.svelte').read_text()))
paths.update('assets/sprites/staticShiftIcons/'+name+'.png' for name in ['spin','decrease','increase','turbo','autoSpin','menu','payTable','soundOn','settings'])
paths.update(['assets/sprites/staticShiftUi/card_bonus.png','assets/sprites/staticShiftUi/card_superbonus.png'])
for name in list(paths):
 if name.endswith('.json'):
  obj=json.loads((SRC/name).read_text())
  if 'meta' in obj and 'image' in obj['meta']:paths.add(str(Path(name).parent/obj['meta']['image']))
  if 'sprite' in obj:paths.add('assets/audio/sounds.wav')
# a Spine atlas names its page image on its first line (cast.png beside it)
for name in list(paths):
 if name.endswith('.atlas'):
  page=next(l.strip() for l in (SRC/name).read_text().splitlines() if l.strip())
  paths.add(str(Path(name).parent/page))
for name in sorted(paths):
 a=SRC/name;b=DST/name;assert a.exists(),a;b.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(a,b)
for f in (DST/'assets').rglob('*'):
 if f.is_file() and str(f.relative_to(DST)) not in paths:f.unlink()
for f in sorted((DST/'assets').rglob('*'),reverse=True):
 if f.is_dir() and not any(f.iterdir()):f.rmdir()
print('Staged',len(paths),'reachable art/audio files')
# Auditable checksums, separate from frontend and math upload roots.
import hashlib
manifest={str(f.relative_to(DST.parent)):hashlib.sha256(f.read_bytes()).hexdigest() for f in DST.rglob('*') if f.is_file()}
(DST.parent/'frontend-sha256.json').write_text(json.dumps(manifest,indent=2))
