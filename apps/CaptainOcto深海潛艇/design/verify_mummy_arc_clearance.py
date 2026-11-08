"""Sample actual sector geometry against the teal channel in the shipped art."""
from pathlib import Path
import json,math,subprocess
from PIL import Image
APP=Path(__file__).resolve().parent.parent
NODE=APP.parents[2]/'tools/node-v22.23.1-win-x64/node.exe'
OUT=APP/'design/preview_mummy_20261107/layout_review';OUT.mkdir(parents=True,exist_ok=True)
code="""import {scarabSector,SCARAB_LAYOUT as layout}from './src/game/scarabLayout.ts';
const samples=[];for(let n=-34;n<=34;n++){const a=Math.PI/2+n/100*Math.PI/7;const p=scarabSector(a,1,0,0);for(let i=0;i<p.length;i+=2)samples.push([p[i],p[i+1]]);}console.log(JSON.stringify({layout,samples}));"""
geometry=json.loads(subprocess.run([str(NODE),'--input-type=module','-e',code],cwd=APP,capture_output=True,text=True,check=True).stdout)
arch=Image.open(APP/'static/assets/sprites/mummyWheel/arch_base.webp').convert('RGBA')
def pixel(x,y):
 px=round((.5+x/.864)*arch.width);py=round((.464+y)/.464*arch.height)
 return arch.getpixel((px,py)) if 0<=px<arch.width and 0<=py<arch.height else(0,0,0,0)
def teal(rgba):
 r,g,b,a=rgba
 return a>220 and g>r*1.15 and b>=r and g>25
failed=[(x,y,pixel(x,y))for x,y in geometry['samples']if not teal(pixel(x,y))]
# Reproduce the old alpha-inked rectangular tile covering the rim/hole.
tile=Image.open(APP/'static/assets/sprites/mummyWheel/tile_normal.webp').convert('RGBA')
old_samples=old_outside=0
for yy in range(0,tile.height,4):
 for xx in range(0,tile.width,4):
  if tile.getpixel((xx,yy))[3]<128:continue
  x=(xx/tile.width-.5)*.22;y=-.3375+(yy/tile.height-.5)*.15
  old_samples+=1;old_outside+=not teal(pixel(x,y))
result=dict(passed=not failed and old_outside>0,stops=69,sectorVertexSamples=len(geometry['samples']),samplesOutsidePaintedChannel=len(failed),oldRectangularTileOutsideSamples=old_outside,oldInkSamples=old_samples,layout=geometry['layout'],method='Actual TypeScript sector vertices across every 0.01 stop offset from -0.34 to +0.34, sampled against the production arch texture')
(OUT/'arc_clearance_verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result,indent=2));print('First failures:',failed[:4]);assert result['passed']
