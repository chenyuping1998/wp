"""Package verified final artifacts; compare every archived byte's SHA-256."""
import argparse,hashlib,json,zipfile
from pathlib import Path
from game_config import GameConfig

def digest(path):
    with path.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()

def archive(target,files):
    expected={name:digest(path) for path,name in files}
    # Compression of zstd streams brings no useful gain; preserve exact bytes.
    with zipfile.ZipFile(target,'w',compression=zipfile.ZIP_STORED,allowZip64=True) as z:
        for path,name in files:z.write(path,name)
    with zipfile.ZipFile(target) as z:
        assert set(z.namelist())==set(expected)
        for name,sha in expected.items():
            with z.open(name) as f:assert hashlib.file_digest(f,'sha256').hexdigest()==sha,name
    return {'file':target.name,'sha256':digest(target),'entries':expected}

def main(destination):
    c=GameConfig();root=Path(c.library_path);source=Path(__file__).resolve().parent
    verified=json.loads((root/'reports/verification.json').read_text(encoding='utf-8'))
    index=json.loads((Path(c.publish_path)/'index.json').read_text(encoding='utf-8'))
    backend=json.loads((root/f'configs/config_{c.game_id}.json').read_text(encoding='utf-8'))
    assert sum(v['books'] for v in verified.values())==sum(m['bookLength'] for m in backend['bookShelfConfig'])
    for mode in backend['bookShelfConfig']:
        assert verified[mode['name']]['exactRtp']=='24/25'
        for item in [mode['booksFile'],*mode['tables']]:
            assert digest(Path(c.publish_path)/item['file'])==item['sha256']
    out=Path(destination);out.mkdir(parents=True,exist_ok=True)
    core=['index.json']+[m[k] for m in index['modes'] for k in ('events','weights')]
    math=archive(out/'TreasureMonkey_math_96_20261023.zip',[(Path(c.publish_path)/n,n) for n in core])
    files=[(p,'sources/'+p.name) for p in source.iterdir() if p.suffix in ('.py','.json')]
    files +=[(p,'sources/reels/'+p.name) for p in (source/'reels').glob('*.csv')]
    files +=[(p,str(p.relative_to(root)).replace('\\','/')) for d in ('reports','configs') for p in (root/d).iterdir() if p.is_file()]
    files +=[(source/'README.md','README.md')]
    sources=archive(out/'TreasureMonkey_math_sources_20261023.zip',files)
    manifest=out/'SHA256.json';manifest.write_text(json.dumps({'math':math,'sources':sources},indent=2),encoding='utf-8')
    print(json.dumps({'math':str(out/math['file']),'sources':str(out/sources['file']),'sha256':str(manifest)},indent=2))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('destination');main(p.parse_args().destination)
