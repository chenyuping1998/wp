"""Crop the delivered warden layers, retaining production mesh coordinates."""
from pathlib import Path
import json
from PIL import Image
D=Path(__file__).resolve().parent/'_incoming/fg';OUT=D.parents[2]/'static/assets/castLayers/warden'
OUT.mkdir(parents=True,exist_ok=True)
m=json.loads((D/'layers.manifest.json').read_text())
for l in m['layers']:
 im=Image.open(D/l['texture']);x0,y0,x1,y1=im.getchannel('A').getbbox();box=(max(0,x0-4),max(0,y0-4),min(1024,x1+4),min(2048,y1+4));x0,y0,x1,y1=box
 l['crop']=[x0,y0,x1-x0,y1-y0];im.crop(box).save(OUT/l['texture'],optimize=True)
(OUT/'layers.json').write_text(json.dumps(m,separators=(',',':')))
im=Image.open(D/'full.png');im.crop(im.getchannel('A').getbbox()).save(OUT/'full.png')
print(OUT)
