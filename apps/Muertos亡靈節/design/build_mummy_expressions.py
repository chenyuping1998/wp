from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import json,re,copy
ROOT=Path(__file__).resolve().parent
APP=ROOT.parent
D=ROOT/"source/mummy_delivery"
# Expression attachments share the exact same mesh, silhouette and UV extent.
meta=json.loads((ROOT/'generated_sources.json').read_text(encoding='utf-8'))
rigdir=D/'mascot';head=Image.open(rigdir/'layers/head.png').convert('RGBA')
orig=Image.open(D/'originals/RigResult.png').convert('RGBA').crop((0,0,384,512));bb=orig.getchannel('A').point(lambda v:255 if v>60 else 0).getbbox()
variants={'head_laugh':head}
for key,name in [('face_idle','head_idle'),('face_blink','head_blink')]:
 a=Image.open(D/'originals'/(key+'.png')).convert('RGBA').crop((0,0,384,512)).crop(bb).resize((424,410),Image.Resampling.LANCZOS)
 full=Image.new('RGBA',(1024,1536));full.alpha_composite(a,(300,160));mask=Image.new('L',full.size);ImageDraw.Draw(mask).ellipse((342,274,680,521),fill=255);mask=mask.filter(ImageFilter.GaussianBlur(7))
 out=Image.composite(full,head,mask);out.putalpha(head.getchannel('A'));variants[name]=out
 variants[name].save(rigdir/(name+'.png'))
eye_mask=Image.new('L',head.size);ImageDraw.Draw(eye_mask).ellipse((367,280,509,408),fill=255);eye_mask=eye_mask.filter(ImageFilter.GaussianBlur(5))
variants['head_laugh']=Image.composite(variants['head_blink'],head,eye_mask)
variants['head_laugh'].putalpha(head.getchannel('A'));variants['head_laugh'].save(rigdir/'head_laugh.png')
runtime=APP/'static/assets/spines/mummyCat';built=D/'mascot_built/game';data=json.loads((built/'mummyCat.json').read_text());atlas=(built/'mummyCat.atlas').read_text();texture=Image.open(runtime/'mummyCat.png').convert('RGBA')
match=re.search(r'head\nbounds:(\d+),(\d+),(\d+),(\d+)',atlas);x,y,w,h=map(int,match.groups());region=texture.crop((x,y,x+w,y+h))
# Use the original complete head's alpha crop to preserve pack padding exactly.
cropbox=head.getchannel('A').getbbox();hp=head.crop(cropbox)
for name,full in variants.items():
 a=full.crop(cropbox);canvas=Image.new('RGBA',(w,h));rb=region.getchannel('A').getbbox();a=a.resize((rb[2]-rb[0],rb[3]-rb[1]),Image.Resampling.LANCZOS);canvas.alpha_composite(a,(rb[0],rb[1]));canvas.putalpha(region.getchannel('A'));canvas.save(runtime/(name+'.png'))
 atlas+=f'\n{name}.png\nsize:{w},{h}\nformat:RGBA8888\nfilter:Linear,Linear\nrepeat:none\npma:false\n{name}\nbounds:0,0,{w},{h}\n'
 att=copy.deepcopy(data['skins'][0]['attachments']['head']['head']);att['path']=name;data['skins'][0]['attachments']['head'][name]=att
next(s for s in data['slots'] if s['name']=='head')['attachment']='head_idle'  # by name: v3 draws the collar after the head
(runtime/'mummyCat.json').write_text(json.dumps(data,separators=(',',':')));(runtime/'mummyCat.atlas').write_text(atlas)
print('Installed three linked expression textures for the current mummyCat rig')
