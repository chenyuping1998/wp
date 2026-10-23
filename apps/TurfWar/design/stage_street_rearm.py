"""Restage a built MG arm revision without restoring pruned legacy assets."""
from datetime import datetime
import hashlib
import json
from pathlib import Path
import shutil
import tarfile

D=Path(__file__).resolve().parent
APP=D.parent
ROOT=D.parents[3]
UPLOAD=ROOT/'upload/TurfWar'
BUILD=APP/'build'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    assert (BUILD/'index.html').is_file(), 'Build first'
    backup=ROOT/'_upload_backups'/f'TurfWar-rearm-{datetime.now():%Y%m%d-%H%M%S}.tgz'
    backup.parent.mkdir(exist_ok=True)
    math_before={p.name:sha(p) for p in (UPLOAD/'math').iterdir() if p.is_file()}
    with tarfile.open(backup,'w:gz') as archive:
        for name in ('frontend','thumbnail','cover','README.md','ART-PACKAGE-SHA256.json'):
            archive.add(UPLOAD/name,arcname=name)
    frontend=UPLOAD/'frontend'
    shutil.copy2(BUILD/'index.html',frontend/'index.html')
    immutable=frontend/'_app/immutable'
    shutil.rmtree(immutable)
    shutil.copytree(BUILD/'_app/immutable',immutable)
    for name in ('env.js','version.json'):
        shutil.copy2(BUILD/'_app'/name,frontend/'_app'/name)
    changed=[]
    for mode in ('base','feature','kingpin'):
        for name in ('arm_r.png','prop_bat.png','fingers_r.png','full.png','layers.manifest.json'):
            changed.append(f'assets/castLayers/turf/{mode}/{name}')
    changed += ['assets/castLayers/turf/loading.png','assets/sprites/turfBrand/tile_foreground.png']
    for name in changed:
        shutil.copy2(BUILD/name,frontend/name)
        assert sha(frontend/name)==sha(BUILD/name),name
    for folder,names in {'thumbnail':['TurfWar-BG.png','TurfWar-FG.png','Silverstars-Logo.png'],
                         'cover':['TurfWar-Cover-BG.png','TurfWar-Cover-FG.png']}.items():
        for name in names:
            shutil.copy2(D/folder/name,UPLOAD/folder/name)
    assert not any('stub' in p.name.lower() or 'playtest' in p.name.lower() for p in frontend.iterdir())
    html=(frontend/'index.html').read_text()
    assert 'stub.local' not in html and 'localhost:' not in html
    for path in [frontend/'index.html',*immutable.rglob('*.js')]:
        content=path.read_text()
        assert not any(text in content for text in ('Capo Nostra','CAPO NOSTRA','Hot Miami','HOT MIAMI')),path
    # Full frontend and separate store layers, same scope as the existing index.
    hashes={str(p.relative_to(UPLOAD)):sha(p) for folder in ('frontend','thumbnail','cover')
            for p in sorted((UPLOAD/folder).rglob('*')) if p.is_file() and p.name!='.DS_Store'}
    (UPLOAD/'ART-PACKAGE-SHA256.json').write_text(json.dumps(hashes,indent=2)+'\n')
    assert math_before=={p.name:sha(p) for p in (UPLOAD/'math').iterdir() if p.is_file()},'math changed'
    print(f'Staged {len(changed)} runtime files plus current app bundles and store layers')
    print(f'Backup: {backup}')
    print(f'Hashes verified: {len(hashes)}; math unchanged; no ZIP; platform unchanged')


if __name__=='__main__':
    main()
