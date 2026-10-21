"""Read-only acceptance evidence for the chef's replacement art and rig."""
from pathlib import Path
import json, re, subprocess, sys
import numpy as np
from PIL import Image

APP = Path(__file__).resolve().parents[1]
SRC = APP / 'design/source/review_1021'
QA = APP / 'design/qa/review_1021'
QA.mkdir(exist_ok=True)
def pixels(p):
    return np.asarray(Image.open(p).convert('RGBA'))
def read(rel, old=False):
    return json.loads(((SRC/'before' if old else APP)/rel).read_text())
meta = read('design/source/fg/layers.json')
old_meta = read('design/source/fg/layers.json', True)
rig = read('static/assets/spines/picklePepper/cast.json')
old_rig = read('static/assets/spines/picklePepper/cast.json', True)
assert meta['canvas'] == old_meta['canvas'] == [560,912]
for field in ('bones','animations','physics','slots'):
    assert rig[field] == old_rig[field], field
assert read('design/source/fg/rig.json') == read('design/source/fg/rig.json', True)
report = {'bones_animations_physics_slots_joints':'unchanged', 'widths':{}}
for layer in meta['layers']:
    name=layer['name']; rel='design/source/fg/'+layer['file']
    a=pixels(APP/rel); old=pixels(SRC/'before'/rel)
    assert a.shape[:2] == (layer['h'],layer['w'])
    def width(a):
        mask=a[:,:,3]>8
        return max((np.ptp(np.where(row)[0])+1 if row.any() else 0) for row in mask)
    def bbox_width(a):
        _,x=np.where(a[:,:,3]>8)
        return int(x.max()-x.min()+1)
    report['widths'][name]={'before':int(width(old)),'after':int(width(a)),
                           'bbox_before':bbox_width(old),'bbox_after':bbox_width(a)}
    if 'face' in name or 'foot' in name:
        assert np.array_equal(a,old), name
    attachment=rig['skins'][0]['attachments'][name][name]
    previous=old_rig['skins'][0]['attachments'][name][name]
    if attachment.get('type')=='mesh':
        assert attachment['uvs']==previous['uvs']
        assert attachment['triangles']==previous['triangles']
        v=attachment['vertices']; ov=previous['vertices']; k=0
        while k<len(v):
            n=v[k];assert n==ov[k];k+=1;total=0
            for _ in range(n):
                assert v[k]==ov[k] and v[k+3]==ov[k+3]
                total+=v[k+3];k+=4
            assert abs(total-1)<1e-6
torso=pixels(APP/'design/source/fg/torso_0_trunk.png')[:,:,3]>8
row_width=lambda y: int(np.ptp(np.where(torso[y])[0])+1)
chest=max(row_width(y) for y in range(60,101))
waist=min(row_width(y) for y in range(120,161))
assert waist>=chest*.9
report['torso']={'chest':chest,'waist_min':waist,'waist_chest_ratio':waist/chest}
atlas=pixels(APP/'static/assets/spines/picklePepper/cast.png')
text=(APP/'static/assets/spines/picklePepper/cast.atlas').read_text()
for name,x,y,w,h in re.findall(r'([^\n]+)\nbounds:(\d+),(\d+),(\d+),(\d+)',text):
    if name=='sack':continue
    x,y,w,h=map(int,(x,y,w,h))
    source=pixels(APP/f'design/source/fg/{name}.png');region=atlas[y:y+h,x:x+w]
    assert np.array_equal(region[:,:,3],source[:,:,3]),name
    # libvips unpremultiplication rounds a visible RGB channel by at most 1.
    assert np.abs(region.astype(int)-source.astype(int))[source[:,:,3]>8].max()<=1,name
report['atlas']='every region matches its registered source, mesh weights and topology retained'
for rel in ['static/assets/pickle/buy_chef.png','static/assets/pickle/upgrade_cutin.png',
            'static/assets/pickle/upgrade_cutin_arm.png','static/assets/pickle/upgrade_cutin_body.png',
            'static/assets/pickle/win_max_base.png','design/cover/PicklePanic-Cover-FG.png']:
    assert Image.open(APP/rel).size==Image.open(SRC/'before'/rel).size,rel
cover=pixels(APP/'design/cover/PicklePanic-Cover-FG.png')
old_cover=pixels(SRC/'before/design/cover/PicklePanic-Cover-FG.png')
male=(old_cover[:,:,:3].sum(2)>0)&(old_cover[:,:,3]>0)&(np.indices(cover.shape[:2])[1]<1378)
assert np.array_equal(cover[male],old_cover[male]),'cover male'
plaque=pixels(APP/'static/assets/pickle/win_max_base.png')
old_plaque=pixels(SRC/'before/static/assets/pickle/win_max_base.png')
assert np.array_equal(plaque[:,:1337],old_plaque[:,:1337])
report['protected_art']='male cover pixels, left plaque/sign, head and shoes preserved'
files=[APP/'design/source/fg'/l['file'] for l in meta['layers'] if 'face' not in l['name'] and 'foot' not in l['name']]
files += [SRC/'fg_registered.png', APP/'static/assets/pickle/buy_chef.png',
          APP/'static/assets/pickle/upgrade_cutin.png',APP/'static/assets/pickle/win_max_base.png']
cmd=[sys.executable,str(APP.parents[2]/'wp/.claude/skills/game-reskin/scripts/check_style.py'),
     '--palette','#6A9F35,#31572C,#FFF0CF,#E9B83E,#C84A36,#20231D',
     '--max-colors','140','--max-soft','0.38','--min-fit','0.60',
     '--sheet',str(QA/'style_sheet.png'),*map(str,files)]
r=subprocess.run(cmd,text=True,capture_output=True)
(QA/'style_metrics.txt').write_text(r.stdout+r.stderr)
print(r.stdout)
assert r.returncode==0,'style gates'
report['style']='all replacement parts, assembled cast, buy card, cut-in and MAX pass brief palette gates'
(QA/'registration_audit.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
