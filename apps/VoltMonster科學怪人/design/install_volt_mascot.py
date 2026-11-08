"""Pack linked face variants, then let spine-core register the separate hair attachment."""
from pathlib import Path
import json,shutil,copy
from PIL import Image
D=Path(__file__).resolve().parent;APP=D.parent;M=D/'source/volt_delivery/mascot';B=M.parent/'mascot_built'
OUT=APP/'static/assets/spines/voltMonster';OUT.mkdir(parents=True,exist_ok=True)
for p in (B/'game').iterdir():shutil.copy2(p,OUT/p.name)
data=json.loads((OUT/'voltMonster.json').read_text());atlas=(OUT/'voltMonster.atlas').read_text()
crop=json.loads((B/'_work/crops.json').read_text())['head'];box=(crop['x'],crop['y'],crop['x']+crop['w'],crop['y']+crop['h'])
for name in ['head_idle','head_blink','head_laugh','head_zap']:
    im=Image.open(M/'layers/head.png' if name=='head_idle' else M/(name+'.png')).convert('RGBA').crop(box)
    im=im.resize((round(crop['w']*.5),round(crop['h']*.5)),Image.Resampling.LANCZOS);im.save(OUT/(name+'.png'))
    w,h=im.size
    atlas+=f'\n{name}.png\nsize:{w},{h}\nformat:RGBA8888\nfilter:Linear,Linear\nrepeat:none\npma:false\n{name}\nbounds:0,0,{w},{h}\n'
    att=copy.deepcopy(data['skins'][0]['attachments']['head']['head']);att['path']=name
    data['skins'][0]['attachments']['head'][name]=att
next(s for s in data['slots'] if s['name']=='head')['attachment']='head_idle'
normal=Image.open(M/'hair.png').convert('RGBA');zap=Image.open(M/'hair_zap.png').convert('RGBA')
a=normal.getchannel('A');b=zap.getchannel('A')
from PIL import ImageChops
box=ImageChops.lighter(a,b).point(lambda v:255 if v>5 else 0).getbbox()
for name,im in [('hair',normal),('hair_zap',zap)]:
    im=im.crop(box);im=im.resize((round(im.width*.5),round(im.height*.5)),Image.Resampling.LANCZOS);im.save(OUT/(name+'.png'))
    w,h=im.size
    atlas+=f'\n{name}.png\nsize:{w},{h}\nformat:RGBA8888\nfilter:Linear,Linear\nrepeat:none\npma:false\n{name}\nbounds:0,0,{w},{h}\n'
(OUT/'hair_region.json').write_text(json.dumps({'canvasCenter':[(box[0]+box[2])/2,(box[1]+box[3])/2],'size':[w,h],'ground':[512,1515],'scale':.5}))
(OUT/'voltMonster.json').write_text(json.dumps(data,separators=(',',':')));(OUT/'voltMonster.atlas').write_text(atlas)
print('Installed linked face textures and registered hair pages')
