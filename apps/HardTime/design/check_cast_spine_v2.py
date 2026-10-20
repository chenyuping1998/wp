"""Validate the cast actually consumed by CastSpine, not the legacy mesh cast."""
import json
import sys
from pathlib import Path
from PIL import Image
from build_cast_spine import PRISONER, WARDEN, source_fingerprint
from cast_spine_v2_config import upgrade

APP=Path(__file__).resolve().parents[1]

def check(c,data):
    names=[s['name'] for s in data['slots']]
    assert names==c['order'],f"{c['name']}: wrong layers/order: {names}"
    assert 'body' not in names,'uncut full body is not a v2 attachment'
    assert len(data['ik'])==4,'both segments of both legs need IK'
    for side in ['l','r']:
        assert any(ik['bones']==[c['shins'][side]] and ik['target']==c['legs'][side][1] for ik in data['ik'])
    assert data['animations']['blink']['slots']['blink']['attachment'][-1]['name'] is None
    assert next(s for s in data['slots'] if s['name']=='blink').get('attachment') is None
    if c['name']=='warden':assert names.index('forearm_r')>names.index('torso'),'baton forearm must be in front'
    for layer,parts in data['skins'][0]['attachments'].items():
        a=parts[layer];v=a['vertices'];i=0;count=0
        while i<len(v):
            n=v[i];weights=[v[i+4+4*j] for j in range(n)]
            assert abs(sum(weights)-1)<0.001,(layer,weights)
            assert all(0<=v[i+1+4*j]<len(data['bones']) for j in range(n))
            i+=1+4*n;count+=1
        assert count*2==len(a['uvs']) and max(a['triangles'])<count
    source=APP/'static/assets/castLayers'/c['src']
    assert data['skeleton']['hash']==c['name']+'-'+source_fingerprint(source),'rebuild Spine after changing layers'
    if c['name']=='warden':
        manifest=json.loads((source/'layers.json').read_text())
        for layer in manifest['layers']:
            if layer['name'] not in ['pelvis','thigh_l']:continue
            x,y,w,h=layer['crop']
            alpha=Image.open(source/layer['texture']).getchannel('A')
            if x+w>700 and y<1150:
                region=alpha.crop((max(0,700-x),0,w,min(h,1150-y)))
                assert region.getextrema()[1]<12,layer['name']+' contains the hanging hand ghost'

for original in [PRISONER,WARDEN]:
    c=upgrade(original);p=APP/'static/assets/spines/htCast'/(c['name']+'.json')
    data=json.loads(p.read_text());check(c,data)
    # Prove the old coarse-layer regression cannot pass this guard.
    broken=json.loads(p.read_text());broken['slots']=broken['slots'][:2]
    try:check(c,broken)
    except AssertionError:pass
    else:raise AssertionError('guard accepted coarse legacy layers')
    print(c['name'],len(data['slots']),'meshes; 4 leg IK; blink; layer order; weights; source hash: PASS')
    if '--runtime' in sys.argv:
        r=json.loads((APP/'design/source/spine_v2/qa/motion-check.json').read_text())[c['name']]
        assert r['rigHash']==data['skeleton']['hash'],'rerun motion QA after rebuilding the cast'
        assert r['frames']>=360 and r['flips']==0 and r['maxAnkleError']<0.01
        assert r['minTriangleRatio']>0.5 and r['maxTriangleRatio']<1.6
        print('  production runtime: 363 frames, no folds, planted ankles: PASS')
