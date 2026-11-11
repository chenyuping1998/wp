"""Install the 2026-11 thick-limb cast (交件/<C>/layers from 角色生圖_相撲猴/四肢加粗_20261107) into the game.

1. Backup everything the cast pipeline rewrites → _upload_backups/SumoMonkey-before-thicklimbs-<date>/cast.tgz
2. Copy the 14 layer PNGs + full.png per cast into design/sumo_cast/<c>/ (joints.json, layers.json,
   motion.params.json stay as they are: same rig, same motion recipe).
Then run the usual pipeline (see HANDOFF): sumo_trim_layers.py → sumo_generate_motion.ts →
sumo_export_motion.ts → measure_cast_placement.py → pnpm build.
"""
from pathlib import Path
import hashlib, json, shutil, tarfile, time

APP = Path(__file__).resolve().parents[1]
ROOT = APP.parents[2]
SRC = ROOT / '角色生圖_相撲猴/四肢加粗_20261107/交件'
STAMP = time.strftime('%Y%m%d')
BACKUP = ROOT / f'_upload_backups/SumoMonkey-before-thicklimbs-{STAMP}'
BACKUP.mkdir(parents=True, exist_ok=True)
h = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()

tgz = BACKUP / 'cast.tgz'
if not tgz.exists():
    with tarfile.open(tgz, 'w:gz') as t:
        for rel in ['design/sumo_cast', 'static/assets/sumoCast', 'src/game/sumoMotion_mg.json',
                    'src/game/sumoMotion_fg.json', 'src/game/sumoCastPlacement.json']:
            t.add(APP / rel, arcname=rel)
    print('backup', tgz)
else:
    print('backup already there', tgz)

order = json.loads((APP / 'design/sumo_cast/mg/layers/layers.json').read_text())['order']
log = {}
for C in ['MG', 'FG']:
    c = C.lower()
    dst = APP / 'design/sumo_cast' / c
    for n in order:
        s = SRC / C / 'layers' / f'{n}.png'
        d = dst / 'layers' / f'{n}.png'
        shutil.copyfile(s, d)
        log[f'{c}/{n}.png'] = h(d)
    shutil.copyfile(SRC / C / 'full.png', dst / 'full.png')
    log[f'{c}/full.png'] = h(dst / 'full.png')
    for f in ['joints.json', 'layers.json', 'motion.params.json']:
        assert (dst / 'layers' / f).exists(), f
(BACKUP / 'installed.json').write_text(json.dumps(log, indent=1))
print('installed', len(log), 'files')
