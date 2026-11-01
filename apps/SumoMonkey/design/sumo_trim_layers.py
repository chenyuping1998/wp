from pathlib import Path
from PIL import Image
import json
R=Path(__file__).resolve().parent
for cast in ['mg','fg']:
 out=R.parent/'static/assets/sumoCast'/cast
 out.mkdir(parents=True,exist_ok=True)
 boxes={}
 for p in (R/'sumo_cast'/cast/'layers').glob('*.png'):
  im=Image.open(p).convert('RGBA'); box=im.getchannel('A').getbbox()
  boxes[p.stem]=box
  im.crop(box).save(out/p.name)
 (R/'sumo_cast'/cast/'crops.json').write_text(json.dumps(boxes))
