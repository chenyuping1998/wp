"""Register the generated watch dial and derive inked bronze/silver/gold tiers."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageOps
import colorsys,hashlib,json
R=Path(__file__).resolve().parent;A=R.parents[1];O=A/'static/assets/sprites/hypnoWatches';O.mkdir(exist_ok=True)
im=Image.open(R/'source-bronze.png').convert('RGBA');W,H=im.size
# Find the pale blank dial, distinct from warm metal. Used for exact label anchor.
pts=[(i%W,i//W) for i,(r,g,b,a) in enumerate(im.getdata()) if a>240 and r>220 and g>205 and b>160 and max(r,g,b)-min(r,g,b)<90]
xs=[p[0] for p in pts];ys=[p[1] for p in pts];center=((min(xs)+max(xs))/2,(min(ys)+max(ys))/2)
# Source highlights can join the pale mask; principal dial center is measured
# from the inner circular face (source-specific reviewed landmark).
center=(W*.5,H*.602);scale=430/H
registered=Image.new('RGBA',(512,512));size=(round(W*scale),round(H*scale));small=im.resize(size,Image.Resampling.LANCZOS);origin=(round(256-center[0]*scale),round(300-center[1]*scale));registered.alpha_composite(small,origin)
base=registered
palettes={'bronze':['#261b17','#74442c','#a76a3a','#c98c52','#e9b879','#f3d6a5','#f6e7c7'], 'silver':['#242124','#535761','#818c9a','#aebac5','#d7e0e4','#f1eee4','#f6e7c7'],'gold':['#281c16','#8b5124','#bd7f27','#e1aa35','#f6cc65','#ffe4a0','#f6e7c7']}
for name,colors in palettes.items():
 values=[]
 for red,green,blue,a in base.getdata():
  # Keep cream dial quiet, choose six ink/metal bands outside it.
  if a<16:values.append((0,0,0,0));continue
  lum=.2126*red+.7152*green+.0722*blue
  dial=red>220 and green>205 and blue>160
  index=6 if dial else 0 if lum<55 else 1 if lum<105 else 2 if lum<145 else 3 if lum<185 else 4 if lum<220 else 5
  rgb=tuple(bytes.fromhex(colors[index][1:]));values.append((*rgb,a))
 out=Image.new('RGBA',base.size);out.putdata(values);out.save(O/f'watch-{name}.png')
review=Image.new('RGB',(1000,430),'#b8b1a4');d=ImageDraw.Draw(review);font=ImageFont.truetype(str(A/'static/fonts/TitanOne.ttf'),36)
for i,name in enumerate(palettes):
 img=Image.open(O/f'watch-{name}.png');img.thumbnail((300,300));review.paste(img,(i*333+16,20),img);d.text((i*333+166,196),['×2','×25','×100'][i],font=font,fill='#261b17',anchor='mm');d.text((i*333+166,350),name,font=font,fill='#261b17',anchor='mm')
review.save(R/'tiers.jpg',quality=96)
meta={'sourceSha256':hashlib.sha256((R/'source-bronze.png').read_bytes()).hexdigest(),'size':[512,512],'dialAnchor':[.5,300/512],'tiers':{'bronze':'2–10','silver':'15–50','gold':'100+'},'runtime':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in O.glob('*.png')},'palettes':palettes}
(R/'manifest.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
print('Three registered tiers ready; dial anchor .5, .5859375')
