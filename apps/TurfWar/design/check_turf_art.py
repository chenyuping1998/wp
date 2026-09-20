"""Verify actual exported artwork dimensions, transparency and mesh alignment."""
import json
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parent.parent
manifest=json.loads((ROOT/'design/turf-art-manifest.json').read_text())
opaque={'bg_base','bg_feature','bg_epic','frame_bg','tile_background','shutter_l','shutter_r'}
report=[]
for asset in manifest:
    image=Image.open(ROOT/asset['installed'])
    alpha=image.convert('RGBA').getchannel('A')
    assert image.size==tuple(asset['size']),f"{asset['key']}: wrong export size"
    if asset['key'] not in opaque:
        assert alpha.getextrema()[0]==0,f"{asset['key']}: missing real transparency"
    if asset['key'].startswith('guy'):
        # 2026-09-15: (134,86,403,839) -> (136, 88, 401, 837) — the delivered cut-outs' 2px white halo was trimmed;
        assert alpha.point(lambda a:255 if a>90 else 0).getbbox()==(136, 88, 401, 837),f"{asset['key']}: rig alignment"
    if asset['key'].startswith('shutter_'):
        assert alpha.getextrema()==(255,255),f"{asset['key']}: transition does not conceal scene"
    report.append({'asset':asset['key'],'size':image.size,'alpha':alpha.getextrema()})
for name in ['frame_1x1','frame_2x2','frame_3x3','frame_full','frame_full_edge']:
    image=Image.open(ROOT/'static/assets/sprites/turfFrames'/f'{name}.png').convert('RGBA')
    w,h=image.size
    center=image.getchannel('A').crop((int(w*.35),int(h*.35),int(w*.65),int(h*.65)))
    assert center.getextrema()==(0,0),f'{name}: multiplier center is not clear'
(ROOT/'design/turf-validation.json').write_text(json.dumps(report,indent=2)+'\n')
print(f'OK: {len(report)} Turf exports; transparency, cast alignment and frame centers verified')
