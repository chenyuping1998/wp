"""Install imagegen originals and resize exports with macOS sips; no drawn substitutes."""
import json, shutil, subprocess
from PIL import Image
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'static/assets/sprites'
manifest = json.loads((ROOT / 'design/turf-art-manifest.json').read_text())
for item in manifest:
    key = item['key']
    if not item.get('source'): continue
    source = ROOT / 'design/source/turf' / (key + '.png')
    source.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(item['source'], source)
    size = (512, 512)
    if key in ['w','sw','fs','h1','h2','h3','h4','h5','l1','l2','l3','l4']: group = 'turfSymbols'
    elif key.startswith('bg_'): group, size = 'turfBackground', (1920,1080)
    elif key in ['logo','tile_foreground','tile_background']: group, size = 'turfBrand', ((1200,520) if key=='logo' else (1024,1024))
    elif key.startswith('guy'): group, size = 'turfCast', (512,1024)
    elif key.startswith('icon_'): group, size = 'turfUiIcons', (128,128)
    elif key=='coin': group, size = 'turfCoin', (128,128)
    elif key.startswith('title_'): group, size = 'turfSplash', (1024,360)
    elif key in ['big','superwin','mega','epic','max']: group, size = 'turfWinBanners', (1000,560)
    elif key in ['frame_bg','frame_edge','fs_sign']: group, size = 'turfBoardFrame', ((1280,1002) if key=='fs_sign' else (1280,1280))
    elif key=='buy_card_frame': group, size = 'turfUi', (512,440)
    elif key.startswith('frame_'):
        group = 'turfFrames'
        size = (256,256) if key in ['frame_1x1','frame_sticky'] else (512,512) if key=='frame_2x2' else (768,768) if key=='frame_3x3' else (1280,1280)
    else:
        group = 'turfFx'
        if key.startswith('shutter'): size=(1024,1536)
        elif key=='lock': size=(1024,1024)
        elif key in ['sw_column_beam','sw_locked']: size=(256,1024)
        elif key=='sw_debris': size=(64,64)
    target=ASSETS/group/((key.removeprefix('icon_') if key.startswith('icon_') else key)+'.png')
    target.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(['sips','-z',str(size[1]),str(size[0]),str(source),'--out',str(target)],check=True,stdout=subprocess.DEVNULL)
    # Technical sprite packing only: originals remain untouched. Preserve
    # aspect for wide symbols; fit the cast's painted pixels to the rig box.
    if group in ['turfCast','turfSymbols','turfUiIcons']:
        im=Image.open(source).convert('RGBA')
        box=im.getchannel('A').point(lambda a: 255 if a>90 else 0).getbbox()
        if not box: raise ValueError(f'Empty sprite: {key}')
        painted=im.crop(box)
        canvas=Image.new('RGBA',size,(0,0,0,0))
        if group=='turfCast':
            painted=painted.resize((269,753),Image.Resampling.LANCZOS)
            canvas.alpha_composite(painted,(134,86))
        elif group=='turfSymbols' and not key.startswith('l'):
            painted.thumbnail((470,470),Image.Resampling.LANCZOS)
            canvas.alpha_composite(painted,((512-painted.width)//2,(512-painted.height)//2))
        elif group=='turfUiIcons':
            painted.thumbnail((112,112),Image.Resampling.LANCZOS)
            canvas.alpha_composite(painted,((128-painted.width)//2,(128-painted.height)//2))
        else:
            canvas=im.resize(size,Image.Resampling.LANCZOS)
        canvas.save(target)
    item['installed']=str(target.relative_to(ROOT))
    item['size']=size
(ROOT/'design/turf-art-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Installed',sum(bool(x.get('installed')) for x in manifest),'imagegen assets')

# Export sizes and animation packing from painted masters, not new illustrations.
for name,w,h in [('frame_edge_1x1',256,256),('frame_edge_2x2',512,512),('frame_edge_3x3',768,768)]:
    subprocess.run(['sips','-z',str(h),str(w),str(ASSETS/'turfFrames/frame_full_edge.png'),'--out',str(ASSETS/'turfFrames'/f'{name}.png')],check=True,stdout=subprocess.DEVNULL)
for name,w,h in [('fs_counter_panel',1280,966),('ticker_plate',603,135),('buybonus_plate',512,440)]:
    dest=ASSETS/('turfBoardFrame' if name=='fs_counter_panel' else 'turfUi')/(name+'.png')
    subprocess.run(['sips','-z',str(h),str(w),str(ASSETS/'turfBoardFrame/fs_sign.png'),'--out',str(dest)],check=True,stdout=subprocess.DEVNULL)
coin=ASSETS/'turfCoin/coin.png'
if coin.exists():
    import math
    token=Image.open(coin).convert('RGBA')
    sheet=Image.new('RGBA',(1536,128),(0,0,0,0))
    frames={}
    for i in range(12):
        width=max(8,round(118*abs(math.cos(i*math.pi/6))))
        frame=token.resize((width,118),Image.Resampling.LANCZOS)
        sheet.alpha_composite(frame,(i*128+(128-width)//2,5))
        frames[f'{i+1}.png']={'frame':{'x':i*128,'y':0,'w':128,'h':128},'rotated':False,'trimmed':False,'spriteSourceSize':{'x':0,'y':0,'w':128,'h':128},'sourceSize':{'w':128,'h':128}}
    sheet.save(coin.parent/'coin_sheet.png')
    (coin.parent/'coin.json').write_text(json.dumps({'frames':frames,'animations':{'coin':list(frames)},'meta':{'image':'coin_sheet.png','format':'RGBA8888','size':{'w':1536,'h':128},'scale':'1'}}))
# Clear sub-visible alpha rounding residue for additive overlays.
for path in ASSETS.glob('turf*/*.png'):
    im=Image.open(path)
    if im.mode=='RGBA':
        im.putalpha(im.getchannel('A').point(lambda a: 0 if a<=1 else a))
        im.save(path)
