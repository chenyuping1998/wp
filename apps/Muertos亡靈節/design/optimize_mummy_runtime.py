"""Encode runtime WebP separately from untouched PNG delivery masters."""
from pathlib import Path
from PIL import Image
import numpy as np
import json
ROOT=Path(__file__).resolve().parent.parent;SPR=ROOT/'static/assets/sprites'
before=0;after=0;converted={};rows=[]
for folder in SPR.glob('mummy*'):
 for p in folder.glob('*.png'):
  a=Image.open(p).convert('RGBA');arr=np.array(a);arr[arr[:,:,3]==0,:3]=0;a=Image.fromarray(arr)
  # Texture resolution follows displayed size; atlas UV grids retain exact pixel geometry.
  if folder.name=='mummyWheel' and max(a.size)>1024 and p.stem not in ['rays']:a.thumbnail((1024,1024),Image.Resampling.LANCZOS)
  lossless=folder.name in ['mummyFx','mummyCoins'] or p.stem.endswith('_sheen') or p.stem=='buy_icon'
  target=p.with_suffix('.webp');a.save(target,format='WEBP',lossless=lossless,quality=94,method=4,exact=True)
  b=Image.open(target);assert b.size==a.size
  assert p.resolve().is_relative_to(SPR.resolve()) and target.exists()
  before+=p.stat().st_size;after+=target.stat().st_size;converted[p.relative_to(SPR).as_posix()]=target.relative_to(SPR).as_posix()
  rows.append(dict(file=target.relative_to(ROOT/'static').as_posix(),bytes=target.stat().st_size,size=a.size))
  p.unlink()
for relative in ['src/game/assets.ts','src/components/ui/BuyEmblem.svelte']:
 p=ROOT/relative;s=p.read_text(encoding='utf-8')
 for old,new in converted.items():s=s.replace(old,new)
 if relative.endswith('BuyEmblem.svelte'):s=s.replace('${names[kind]}.png','${names[kind]}.webp')
 p.write_text(s,encoding='utf-8')
p=SPR/'mummyCoins/coins.json';j=json.loads(p.read_text());j['meta']['image']='coins.webp';p.write_text(json.dumps(j))
report=dict(input_bytes=before,output_bytes=after,files=len(rows),runtime_textures=rows)
(ROOT/'design/source/mummy_delivery/runtime_texture_budget.json').write_text(json.dumps(report,indent=2))
print(f'Runtime texture encoding: {before/1048576:.2f} -> {after/1048576:.2f} MiB; {len(rows)} WebP files; PNG masters retained')
