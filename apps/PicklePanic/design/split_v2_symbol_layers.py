"""Lossless semantic alpha partition; original pixels are never repainted.
Underlap paint is supplied separately by native image generation, not synthesized here.
Coordinates are authored on a 256-unit guide and recorded in runtime 512-space.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageChops
import numpy as np,json
ROOT=Path(__file__).resolve().parent.parent;src=ROOT/'static/assets/pickle';out=ROOT/'design/source/production_v2/symbol_layers';out.mkdir(exist_ok=True)
# Front-to-back regions, points measured against symbol_layer_planning.png.
regions={
'h1':[('pickle_middle',[(84,29),(125,24),(161,67),(144,120),(126,149),(89,147),(78,94)],(115,145)),('pickle_left',[(18,58),(61,63),(93,105),(99,143),(46,157),(21,112)],(70,145)),('pickle_right',[(162,62),(228,53),(241,88),(205,133),(166,150),(139,140)],(163,143)),('top_bun',[(17,129),(238,127),(236,160),(18,160)],(128,150)),('cheese',[(43,143),(110,143),(130,136),(190,146),(166,176),(118,191),(80,173)],(128,155)),('tomato',[(12,158),(240,158),(240,188),(10,188)],(128,175))],
'h2':[('mustard',[(74,71),(132,80),(164,97),(189,111),(194,129),(171,128),(139,111),(112,109),(92,96),(57,101),(60,85)],(129,99)),('pickle',[(14,89),(39,72),(72,78),(104,100),(155,106),(192,119),(215,119),(235,132),(235,162),(219,171),(181,150),(111,140),(56,124),(20,119)],(128,125))],
'h3':[('ring_top',[(78,34),(128,34),(161,68),(157,107),(132,145),(103,135),(91,108),(72,84)],(117,107)),('ring_left',[(49,108),(99,110),(139,138),(143,176),(105,191),(53,174),(39,147)],(84,158)),('ring_right',[(143,122),(188,122),(222,143),(208,171),(181,194),(146,183),(135,154)],(177,166))],
'h4':[('spear_middle',[(102,17),(143,21),(155,84),(140,157),(126,210),(96,202),(88,146)],(121,202)),('spear_left',[(48,45),(79,48),(107,97),(113,161),(121,207),(93,215),(60,164),(43,99)],(104,204)),('spear_right',[(183,62),(212,54),(239,77),(219,134),(193,185),(151,216),(128,207),(165,130)],(142,207))],
'w':[('hat',[(100,33),(146,27),(158,55),(187,79),(140,89),(100,65)],(135,80)),('glasses',[(63,96),(79,76),(110,78),(124,89),(159,87),(181,115),(169,138),(130,138),(113,126),(92,139),(63,125)],(126,111)),('mouth',[(70,147),(102,141),(126,141),(145,152),(145,178),(123,188),(98,171),(74,167)],(112,165)),('head',[(63,69),(106,53),(138,63),(161,78),(184,92),(198,130),(189,172),(164,205),(128,222),(100,209),(75,179),(63,150),(43,122)],(130,152))],
's':[('flag',[(42,39),(50,23),(54,36),(108,48),(82,67),(57,78),(51,102),(44,104)],(48,101)),('clapper',[(114,68),(163,58),(189,76),(182,90),(154,101),(125,101),(113,84)],(145,100)),('paper',[(48,170),(107,174),(92,235),(56,232),(35,217)],(71,177))],
'p':[('lid',[(43,30),(198,28),(217,44),(208,73),(43,75)],(51,69)),('pickle_left',[(44,108),(76,77),(93,81),(116,92),(108,127),(99,182),(93,227),(63,230),(36,211)],(78,188)),('pickle_right',[(155,87),(175,79),(201,83),(211,101),(207,135),(194,184),(182,221),(158,229),(130,215)],(168,188)),('liquid',[(41,207),(211,207),(208,235),(53,237)],(128,224))],
'l1_a':[('extrusion',[(65,174),(88,180),(91,198),(63,195)],(76,191)),('bottle',[(21,151),(65,158),(80,184),(61,199),(27,180)],(62,180))],
'l2_k':[('extrusion',[(141,192),(164,188),(166,205),(141,205)],(152,199)),('bottle',[(161,155),(186,158),(190,177),(186,201),(165,207),(151,200)],(171,199))],
'l3_q':[('spear',[(130,163),(151,157),(187,183),(199,205),(180,214),(146,188)],(140,171))],
'l4_j':[('fork',[(147,56),(187,63),(171,96),(142,111)],(148,100))],
'l5_10':[('one',[(43,67),(101,71),(112,112),(103,189),(77,204),(46,191)],(76,191))]
}
manifest={};registry=[]
for name,parts in regions.items():
 im=Image.open(src/(name+'.png')).convert('RGBA');assert im.size==(512,512)
 original=np.asarray(im);free=np.ones((512,512),bool);layers=[];arrs=[]
 for part,poly,pivot in parts:
  mask=Image.new('1',(512,512));ImageDraw.Draw(mask).polygon([(x*2,y*2) for x,y in poly],fill=1)
  selected=np.asarray(mask)&free
  if name=='p' and part.startswith('pickle'):
   selected[256:352,112:376]=False # front label belongs to immobile jar, never to its contents
  free &= ~selected
  a=original.copy();a[:,:,3]=original[:,:,3]*selected;arrs.append(a)
  filename=f'{name}_{part}_v2.png';Image.fromarray(a).save(out/filename);box=Image.fromarray(a).getbbox() or (0,0,1,1);Image.fromarray(a).crop(box).save(src/filename)
  key='layer_'+name+'_'+part;registry.append((key,filename));layers.append({'name':part,'key':key,'pivot':[pivot[0]*2,pivot[1]*2],'box':list(box),'polygon':[[x*2,y*2]for x,y in poly]})
 a=original.copy();a[:,:,3]=original[:,:,3]*free;arrs.append(a);filename=f'{name}_body_v2.png';Image.fromarray(a).save(out/filename);box=Image.fromarray(a).getbbox() or (0,0,1,1);Image.fromarray(a).crop(box).save(src/filename);key='layer_'+name+'_body';registry.append((key,filename));layers.insert(0,{'name':'body','key':key,'pivot':[256,256],'box':list(box)})
 reconstructed=np.zeros_like(original)
 for a in arrs:
  active=a[:,:,3]>0;reconstructed[active]=a[active]
 active=original[:,:,3]>0
 error=int(np.max(np.abs(reconstructed[active].astype(int)-original[active].astype(int))))
 assert error==0,(name,error)
 manifest[name]={'canvas':[512,512],'rest_max_rgba_error':error,'layers':layers[::-1] if name=='w' else layers,'underpaint':name+'_underpaint_v2' if name in ['h1','h2','h3','h4','w','s','p']else None}
(out/'pivots.json').write_text(json.dumps(manifest,indent=2))
(ROOT/'src/game/symbolLayers.ts').write_text('export const SYMBOL_LAYERS = '+json.dumps(manifest,indent=2)+' as const;\n')
p=ROOT/'src/game/assets.ts';s=p.read_text();keys=''.join(f"\t{key}: {{type:'sprite',src:new URL('../../assets/pickle/{f}',import.meta.url).href,preload:true}},\n" for key,f in registry);import re
s=re.sub(r'\tlayer_[^:]+: \{[^\n]+\n','',s)
s=s.replace('export default {','export default {\n'+keys);p.write_text(s)
print({name:m['rest_max_rgba_error'] for name,m in manifest.items()})
