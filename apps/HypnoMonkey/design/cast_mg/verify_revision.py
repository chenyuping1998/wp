"""Assert source/Spine/runtime/preview revision coherence and record hashes."""
from pathlib import Path
from PIL import Image,ImageDraw
import hashlib,json
r=Path(__file__).resolve().parent;app=r.parents[1]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
manifest=json.loads((r/'runtime-manifest.json').read_text())
atlas=Image.open(app/'static/assets/sprites/hypnoCast/mg-atlas.png').convert('RGBA')
for p in sorted((r/'layers').glob('*.png')):
 assert sha(p)==sha(r/'cast_mg_spine/images'/p.name),p.name
 part=manifest['crops'][p.stem];assert sha(p)==part['sourceSha256'],p.name
 box=(part['cropX'],part['cropY'],part['cropX']+part['width'],part['cropY']+part['height'])
 packed=(part['x'],part['y'],part['x']+part['width'],part['y']+part['height'])
 source=Image.open(p).convert('RGBA').crop(box);crop=atlas.crop(packed)
 assert source.getchannel('A').tobytes()==crop.getchannel('A').tobytes(),p.name
 assert all(a==b for a,b in zip(source.getdata(),crop.getdata()) if a[3]>0),p.name
assert sha(r/'master.png')==sha(r/'assembled.png')
assert sha(r/'cast_mg_spine/cast_mg.json')==sha(app/'src/game/hypnoCastData.json')
assert sha(r/'qa/final-preview.gif')==sha(r/'cast_mg_spine/預覽.gif')
sealed=json.loads((r/'qa/preview-source-manifest.json').read_text())
assert sealed['layers']=={p.name:sha(p) for p in sorted((r/'layers').glob('*.png'))}
assert sealed['gifSha256']==sha(r/'qa/final-preview.gif')
assert sealed['spineSha256']==sha(r/'cast_mg_spine/cast_mg.json')
assert sealed['matricesSha256']==sha(r/'qa/motion-frames.json')
assert len(list((r/'layers').glob('*.png')))==32
assert all(len(items)==1 for items in json.loads((r/'qa/connected-components.json').read_text()).values())
assert json.loads((r/'registered-source-validation.json').read_text())['failed_layers']==0
base=Image.open(r/'layers/head_idle.png').getchannel('A')
for p in (r/'layers').glob('head_*.png'):
 alpha=Image.open(p).getchannel('A');assert alpha.size==base.size
 if p.stem!='head_grin':assert alpha.tobytes()==base.tobytes()
 else:
  changes=[i for i,(old,new) in enumerate(zip(base.getdata(),alpha.getdata())) if old!=new]
  assert len(changes)<=1500
  assert all(215<=i%1024<335 and 365<=i//1024<545 for i in changes)
  assert all(new<=old for old,new in zip(base.getdata(),alpha.getdata()))
with Image.open(r/'qa/final-preview.gif') as im: assert im.n_frames==428
for p in (app/'build/_app').rglob('*.js'):
 assert 'data-cast-action' not in p.read_text() and '催眠出手' not in p.read_text(),p
files=[r/'master.png',r/'assembled.png',r/'reference-master.png',r/'joints.json',r/'motion.params.json',r/'layers.json',r/'cast_mg_spine/cast_mg.json',r/'cast_mg_spine/預覽.gif',r/'cast_mg_spine/報告.md',r/'qa/motion-frames.json',r/'qa/game-desktop.png',r/'qa/game-mobile.png',r/'qa/final-layers-light.jpg',r/'qa/final-layers-dark.jpg',r/'runtime-manifest.json']+sorted((r/'layers').glob('*.png'))
result={'date':'2026-10-28','scope':'MG source, eight motions and basegame integration; full reskin pending','checks':{'layers':32,'source_failures':0,'one_connected_part_each':True,'four_heads_same_alpha':True,'grin_exterior_shadow_alpha_cleanup':True,'spine_images_equal_source':True,'runtime_crops_visible_rgba_and_alpha_equal_source':True,'transparent_rgb_note':'Atlas alpha compositing clears RGB under alpha=0; only fully invisible RGB is excluded','master_equal_assembled':True,'runtime_spine_equal_export':True,'final_gif_frames':428,'production_excludes_cast_qa':True},'files':{str(p.relative_to(r)):sha(p) for p in files}}
(r/'manifest.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
# Whole portrait screenshots, no simulated UI.
files=sorted((r/'qa').glob('mobile-pose-*.png'))
size=Image.open(files[0]).size
out=Image.new('RGB',(size[0]*4,size[1]*2),'white')
for i,p in enumerate(files):
 im=Image.open(p);assert im.size==size
 out.paste(im,(i%4*size[0],i//4*size[1]))
out.save(r/'qa/mobile-all-poses.jpg',quality=95)
print('PASS: 32 source layers = Spine images = runtime crop alpha + every visible RGBA pixel; Spine data and 428-frame GIF synchronized; dev panel absent in production.')
