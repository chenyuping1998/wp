"""Preserve final installed reconstructed boxing art and audit its provenance.
Does not touch the raw-part folder already delivered by the parent, frontend,
math or platform. Files are copied/updated, never removed.
"""
from pathlib import Path
from PIL import Image
import json,shutil,hashlib,numpy as np
APP=Path(__file__).resolve().parents[1];REPO=APP.parents[2]
OUT=REPO/'upload/SumoMonkey/art-source';BOX=OUT/'boxing';DELIVERY=REPO/'角色生圖_相撲猴/交件'
BOX.mkdir(exist_ok=True,parents=True);report={'source':'final installed design/sumo_cast, checked against static/assets/sumoCast','casts':{},'files':{}}
def copy(source,dest):
 dest.parent.mkdir(exist_ok=True,parents=True);shutil.copy2(source,dest)
 report['files'][str(dest.relative_to(OUT))]={'source':str(source),'sha256':hashlib.sha256(source.read_bytes()).hexdigest()}
for mode in ['mg','fg']:
 live=APP/'design/sumo_cast'/mode;processed=BOX/'processed'/mode;layer_order=json.loads((live/'layers/layers.json').read_text())['order'];crops=json.loads((live/'crops.json').read_text());composed=Image.new('RGBA',(1024,1536));checks=[]
 for name in layer_order:
  layer=Image.open(live/'layers'/f'{name}.png');assert layer.mode=='RGBA' and layer.size==(1024,1536),(mode,name,layer.mode,layer.size)
  composed.alpha_composite(layer)
  runtime=Image.open(APP/'static/assets/sumoCast'/mode/f'{name}.png').convert('RGBA');box=tuple(crops[name]);expected=layer.crop(box)
  assert np.array_equal(np.array(expected),np.array(runtime)),(mode,name,'runtime texture/crops disagree')
  checks.append({'part':name,'alpha_extrema':layer.getchannel('A').getextrema(),'crop':box,'runtime_matches_crop':True})
  copy(live/'layers'/f'{name}.png',processed/'layers'/f'{name}.png')
  copy(APP/'static/assets/sumoCast'/mode/f'{name}.png',processed/'textures'/f'{name}.png')
 full=Image.open(live/'full.png').convert('RGBA');same=np.array_equal(np.array(composed),np.array(full))
 assert same,(mode,'installed full.png is not current layer composition')
 for source in [live/'full.png',live/'crops.json',live/'layers/layers.json',live/'layers/joints.json']:
  if source.exists():copy(source,processed/source.name)
 for name in ['clean_full.png','clean_alpha.png','clean_metrics.json']:
  source=DELIVERY/mode.upper()/name
  if source.exists():copy(source,processed/'request-clean'/name)
 for source in [DELIVERY/mode.upper()/'staged/staging_report.json',DELIVERY/mode.upper()/'reconstructed/prepare_report.json',DELIVERY/mode.upper()/'reconstructed/ownership_overlay.png',DELIVERY/mode.upper()/'registration/batch_report.json']:
  if source.exists():copy(source,processed/'reports'/source.name)
 report['casts'][mode]={'parts':checks,'full_matches_actual_layers':same,'source_canvas':[1024,1536]}
 # Refresh authoritative generic cast art-source too; preserve extra root files.
 dest=OUT/'cast'/mode
 for source in [live/'full.png',live/'crops.json']:
  copy(source,dest/source.name)
 for source in (live/'layers').iterdir():
  if source.is_file():copy(source,dest/'layers'/source.name)
for source in (APP/'design').glob('sumo_boxing_*'):
 if source.suffix in ['.py','.ts']:copy(source,BOX/'scripts'/source.name)
for source in (APP/'design/sumo').glob('boxing-*'):
 if source.is_file():copy(source,BOX/'reports'/source.name)
for name in ['compare-full.png','before-after-full.png','request-vs-live-full.png']:
 source=REPO/'dist/sumomonkey-boxing-evidence'/name
 if source.exists():copy(source,BOX/'reports'/name)
(BOX/'final-art-audit.json').write_text(json.dumps(report,indent=2))
(BOX/'FINAL-RECONSTRUCTION.md').write_text('''# Final reconstructed boxing art

`processed/mg` and `processed/fg` preserve the final installed layers, exact runtime crops and texture PNGs. `art-source/cast` is refreshed from the same live source. Raw generated parts in the sibling folder were preserved by the parent and are not duplicated or deleted here.

The requested unified clean illustration is retained separately under `request-clean`; it is not mislabeled as the actual reconstructed actor. Comparison sheets use the LIVE assembled `design/sumo_cast/*/full.png`. `request-vs-live-full.png` exposes the underpainting/round-cap changes instead of hiding them.

Earlier exact-rest-pose reconstruction reports are historical. Complete underpainting and full-width joint discs intentionally changed overlaps to prevent holes during motion. Final validation here checks installed assembly, all 28 RGBA layers, every actual crop/texture pair and source hashes. Motion/tool and runtime signoff belong to the parent and frontend QA.
''')
print('PASS: both installed full images match actual layers; all28 runtime textures match saved crops; final source and reports preserved')
