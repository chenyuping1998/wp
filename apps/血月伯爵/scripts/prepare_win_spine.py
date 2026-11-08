"""Keep the original 4.1 rigs byte-for-byte; use their matching runtime."""
from pathlib import Path
import hashlib,json,shutil,struct
APP=Path(__file__).resolve().parents[1]
SOURCE=APP.parents[2]/'星城抄錄/血月伯爵/extracted/game145/spine'
stages={}
def duration(value):
    if isinstance(value,dict):return max([value.get('time',0)]+[duration(v) for v in value.values()])
    if isinstance(value,list):return max([0]+[duration(v) for v in value])
    return 0
for tier,title in [('big','Big'),('super','Super'),('mega','Mega'),('epic','Epic')]:
    name=f'G145_{title}Win';src=SOURCE/name;out=APP/'static/bloodmoon/win-spine'/tier;out.mkdir(parents=True,exist_ok=True)
    hashes={}
    for suffix,extension in [('json','json'),('atlas.txt','atlas'),('png','png')]:
        original=src/f'{name}.{suffix}';target=out/f'{name}.{extension}';shutil.copyfile(original,target)
        hashes[extension]=hashlib.sha256(original.read_bytes()).hexdigest()
    data=json.loads((src/f'{name}.json').read_text(encoding='utf8'));animation=next(k for k in data['animations'] if k!='Default')
    width,height=struct.unpack('>II',(src/f'{name}.png').read_bytes()[16:24])
    stages[tier]={'skeleton':f'/bloodmoon/win-spine/{tier}/{name}.json','atlas':f'/bloodmoon/win-spine/{tier}/{name}.atlas','animation':animation,'duration':duration(data['animations'][animation]),'editor':data['skeleton']['spine'],'imageSize':[width,height],'sha256':hashes}
manifest={'runtime':'4.1.56','renderer':'pixi8-native-mesh','atlasUVs':'logical-export-dimensions','stages':stages}
(APP/'src/game/winSpineAssets.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
license_source=APP/'node_modules/@esotericsoftware/spine-core/dist/Skeleton.js'
text=license_source.read_text(encoding='utf8');license_text=text[:text.find('*/')+2]
licenses=APP/'static/licenses';licenses.mkdir(exist_ok=True);(licenses/'Spine-Runtime-4.1.txt').write_text(license_text+'\n',encoding='utf8')
print('Prepared four original Spine 4.1 rigs, atlases, textures and runtime notice.')
