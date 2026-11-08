"""Final layered FX exports and measurable delivery checks; preserve originals."""
from package_volt_art import *
# Sky is clipped to the four glass panes, excluding the stone, mullions and tower.
far=Image.open(DEL/'backgrounds/bg_base_far.png').convert('RGBA')
mask=Image.new('L',far.size);d=ImageDraw.Draw(mask)
for points in [[(39,151),(60,103),(92,72),(126,53),(127,181)],[(146,59),(169,88),(195,135),(222,208),(146,186)],[(34,177),(127,205),(126,329),(34,310)],[(147,209),(230,233),(230,350),(146,332)]]:d.polygon(points,fill=255)
mask=mask.filter(ImageFilter.GaussianBlur(1));far.putalpha(mask)
save(far,'backgrounds','bg_base_sky',runtime='voltBackground')
p=DEL/'backgrounds/objects.txt';p.write_text(p.read_text(encoding='utf-8').replace('power_gauge.png | screen','power_gauge.png | needle')+'bg_base_sky.png | window lightning | static registered glass mask | period=31000ms\n',encoding='utf-8')
# Additive rings and stopped wedge: scalar light, not illustrated star particles.
y,x=np.mgrid[-1:1:1400j,-1:1:1400j];r=np.hypot(x,y)
colors=['#4FF0C8','#3A8BFF','#F5C518','#B05CFF']
for lv,c in enumerate(colors,1):
 a=np.zeros((1400,1400,4),dtype='uint8');a[:,:,:3]=tuple(bytes.fromhex(c[1:]));a[:,:,3]=(np.exp(-((r-.89)/.065)**2)*200).astype('uint8')
 save(Image.fromarray(a),'tesla_wheel',f'ring_glow_lv{lv}',runtime='voltWheel')
wedge=blank((640,640));d=ImageDraw.Draw(wedge);d.pieslice((-320,0,960,1280),255,285,fill=(255,255,255,180));wedge=wedge.filter(ImageFilter.GaussianBlur(7));save(wedge,'tesla_wheel','wedge_win',runtime='voltWheel')
# Exact sectors retain a sampled illustrated metal surface under the level colours.
metal=np.array(src('meter_plate').resize((1200,1200)).convert('RGB'),dtype=float).mean(2)/255
for lv,c in enumerate(colors,1):
 face=blank((1200,1200));d=ImageDraw.Draw(face);col=tuple(bytes.fromhex(c[1:]));dim=tuple(round(n*.30) for n in col)
 for k in range(12):
  fill=colors[lv] if k==0 and lv<4 else '#ffd8ff' if k==0 else '#fff2ff' if k==6 and lv==4 else c if k==6 else col if k%2 else dim
  d.pieslice((35,35,1165,1165),-105+k*30,-75+k*30,fill=fill,outline='#C47A3A',width=7)
 a=np.array(face);a[:,:,:3]=np.clip(a[:,:,:3]*(.72+.4*metal[:,:,None]),0,255).astype('uint8');face=Image.fromarray(a)
 ImageDraw.Draw(face).ellipse((35,35,1165,1165),outline='#d9a064',width=12)
 save(face,'tesla_wheel',f'disc_lv{lv}',runtime='voltWheel')
# Different charged windows for the two activation heroes, and a stack of coins.
for name,bars in [('volt5',1),('volt10',2)]:
 im=fit(src('h4'),(512,512),.08);d=ImageDraw.Draw(im)
 for bar in range(bars,3):
  x=257+bar*31;d.rounded_rectangle((x,229,x+29,285),3,fill='#183436')
 save(im,'ui','buy_hero_'+name,runtime='voltUi')
coin=fit(src('coin'),(330,330),.06);stack=blank((512,512))
for xy in [(40,142),(142,105),(88,36)]:stack.alpha_composite(coin,xy)
save(stack,'ui','buy_hero_holdandspin',runtime='voltUi')
# Quantitative gates, saved with exact measurements.
metrics={};luma=np.array([.2126,.7152,.0722])
for key in ['h1','h2','h3','h4','w','s','l1','l2','l3','l4','l5']:
 a=np.array(Image.open(DEL/'symbols'/f'{key}.png').convert('RGB'));c=(a*luma).sum(2)[205:819,205:819]
 metrics[key]={'central60Mean':round(float(c.mean()),3),'bright150Coverage':round(float((c>150).mean()),5)}
high=[metrics[k] for k in ['h1','h2','h3','h4','w','s']];low=[metrics[k] for k in ['l1','l2','l3','l4','l5']]
assert min(v['central60Mean'] for v in high)>=70
assert max(v['central60Mean'] for v in low)<=min(v['central60Mean'] for v in high)
assert max(v['bright150Coverage'] for v in low)<=min(v['bright150Coverage'] for v in high)
thumbs={}
for key in ['thumb','cover_16x9']:
 bg=Image.open(DEL/'thumbnail'/f'{key}_bg.png').convert('RGBA');fg=Image.open(DEL/'thumbnail'/f'{key}_fg.png').convert('RGBA');bg.alpha_composite(fg)
 c=(np.array(bg.convert('RGB').resize((200,200)))*luma).sum(2);dark=np.sort(c.flatten())[:4000]
 thumbs[key]={'mean':round(float(c.mean()),3),'dark10Mean':round(float(dark.mean()),3),'below32':round(float((c<32).mean()),4)}
 assert c.mean()>=80 and dark.mean()>=35 and (c<32).mean()<=.30,(key,thumbs[key])
 bg.convert('RGB').save(DEL/'thumbnail'/f'{key}_preview.jpg',quality=93)
(DEL/'art_metrics.json').write_text(json.dumps({'passed':True,'symbols':metrics,'thumbnail':thumbs},indent=2),encoding='utf-8')
print(json.dumps({'passed':True,'thumbnail':thumbs}))
