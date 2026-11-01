"""Compose title-free Stake store BG/FG layers from preserved Sumo Monkey art.
Run after root installs the final reconstructed live design/sumo_cast full.png.
"""
from pathlib import Path
from PIL import Image, ImageOps
import json, shutil
APP=Path(__file__).resolve().parents[1]
SOURCE=APP/'design/sumo_source'
UPLOAD=APP.parents[2]/'upload/SumoMonkey'
def copy_if_changed(src,dst):
 if Path(dst).exists() and Path(src).read_bytes()==Path(dst).read_bytes():return str(dst)
 return shutil.copy2(src,dst)
# App is wp-banandit/apps/SumoMonkey; repository is three parents above.
UPLOAD=APP.parents[2]/'upload/SumoMonkey'

def cast(name,height):
 choices=[APP/f'design/sumo_cast/{name}/full.png',SOURCE/f'{name}_full.png',APP/f'design/sumo/{name}_full.png']
 p=next((x for x in choices if x.exists()),None)
 if p is None:raise FileNotFoundError(f'Assembled cast missing: {choices}')
 im=Image.open(p).convert('RGBA');im=im.crop(im.getchannel('A').getbbox());im.thumbnail((height*2,height),Image.Resampling.LANCZOS);return im,p

def main():
 arena=Image.open(SOURCE/'arena.png').convert('RGB')
 manifests=[]
 for category,size in [('thumbnail',(1024,1024)),('cover',(1920,1080))]:
  out=UPLOAD/category;out.mkdir(parents=True,exist_ok=True)
  # Texture layer has no baked wording or foreground hero.
  bg=ImageOps.fit(arena,size,Image.Resampling.LANCZOS,centering=(.5,.55))
  fg=Image.new('RGBA',size)
  mg,mg_path=cast('mg',round(size[1]*(.87 if category=='thumbnail' else .84)))
  fgpic,fg_path=cast('fg',round(size[1]*(.66 if category=='thumbnail' else .70)))
  if category=='thumbnail':positions=[(mg,(round(size[0]*.50-mg.width*.5),round(size[1]*.09)))]
  else:positions=[(fgpic,(round(size[0]*.82-fgpic.width*.5),round(size[1]*.26))),(mg,(round(size[0]*.61-mg.width*.5),round(size[1]*.12)))]
  for pic,xy in positions:fg.alpha_composite(pic,xy)
  stem=f'SumoMonkey-{category.title()}'
  bg.save(out/f'{stem}-BG.png',optimize=True);fg.save(out/f'{stem}-FG.png',optimize=True)
  preview=bg.convert('RGBA');preview.alpha_composite(fg);preview.convert('RGB').save(out/f'{stem}-PREVIEW-only.png',optimize=True)
  evidence=APP/'design/sumo';evidence.mkdir(exist_ok=True)
  preview.convert('RGB').resize((round(200*size[0]/size[1]),200),Image.Resampling.LANCZOS).save(evidence/f'boxing-{category}-composite-200h.png')
  print(category,'BG alpha',bg.mode,'FG alpha',fg.getchannel('A').getextrema())
  manifests.append({'category':category,'size':size,'layers':[str(SOURCE/'arena.png'),str(mg_path),str(fg_path)]})
 (UPLOAD/'art-source').mkdir(exist_ok=True)
 for source_file in SOURCE.iterdir():
  if source_file.is_file():shutil.copy2(source_file,UPLOAD/'art-source'/source_file.name)
 logo=UPLOAD.parent/'SushiMonkey/thumbnail/Silverstars-Logo.png'
 if logo.exists():shutil.copy2(logo,UPLOAD/'thumbnail/Silverstars-Logo.png')
 for mode in ['mg','fg']:
  castsource=APP/'design/sumo_cast'/mode
  dest=UPLOAD/'art-source/cast'/mode;dest.mkdir(parents=True,exist_ok=True)
  shutil.copy2(castsource/'full.png',dest/'full.png')
  shutil.copy2(castsource/'crops.json',dest/'crops.json')
  shutil.copytree(castsource/'layers',dest/'layers',dirs_exist_ok=True,copy_function=copy_if_changed)
 for script in ['sumo_generate_motion.ts','sumo_export_motion.ts','sumo_trim_layers.py','sumo_redissect_v2_audit.py','sumo_redissect_v2_preview.py','build_sumo_chrome.py','ingest_forearm_fix.py','sumo_forearm_preview.py','sumo_polish_motion_preview.py']:
  shutil.copy2(APP/'design'/script,UPLOAD/'art-source'/script)
 shutil.copy2(APP/'ART_BRIEF.md',UPLOAD/'art-source/ART_BRIEF.md')
 for evidence in (APP/'design/sumo').glob('manga-*'):
  if evidence.is_file():shutil.copy2(evidence,UPLOAD/'art-source'/evidence.name)
 shutil.copy2(__file__,UPLOAD/'art-source/build_sumo_store.py')
 (UPLOAD/'art-source/layers.json').write_text(json.dumps(manifests,indent=2))
if __name__=='__main__':main()
