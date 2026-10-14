"""Technical alpha-preserving canvas export; does not repaint or recolor art."""
from pathlib import Path
from PIL import Image,ImageOps
import json,shutil,sys
ROOT=Path(__file__).resolve().parent.parent
source=ROOT/'design/source/production_v2';runtime=ROOT/'static/assets/pickle'
for f in sys.argv[1:]:
 records=json.loads((source/f).read_text())
 for r in records:
  p=Path(r['path']); name=r['name'];size=tuple(r['size'])
  shutil.copy2(p,source/(name+'_original.png'))
  im=Image.open(p).convert('RGBA');im=ImageOps.contain(im,size,Image.Resampling.LANCZOS)
  canvas=Image.new('RGBA',size);canvas.paste(im,((size[0]-im.width)//2,(size[1]-im.height)//2))
  canvas.save(runtime/(name+'.png'));canvas.save(source/(name+'.png'))
  print(name,size,canvas.getchannel('A').getbbox())
