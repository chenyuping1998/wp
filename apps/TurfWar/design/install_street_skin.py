#!/usr/bin/env python3
"""Install ART_BRIEF v2 program-owned graphics and approved/generated art.

Missing delivered artwork uses the expressly authorised grey sticker transition.
Every replacement keeps a once-only original backup; re-running is deterministic.
"""
from pathlib import Path
import json
import math
import shutil
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

D = Path(__file__).resolve().parent
APP = D.parent
SPR = APP / 'static/assets/sprites'
BACKUP = D / '_legacy_assets/pre_street_v2'
INK, WHITE, PAPER, BOARD, ORANGE = '#121212', '#F7F5F0', '#D8D6D1', '#3A3D42', '#F5893D'
changes = []

def original(path):
    relative = path.relative_to(APP)
    saved = BACKUP / relative
    if not saved.exists():
        saved.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, saved)
    return Image.open(saved).convert('RGBA')

def save(im, path, status='program graphic'):
    original(path)
    im.save(path)
    changes.append({'path': str(path.relative_to(APP)), 'status': status})

def plate(size, fill=BOARD, hollow=False, circle=False, accent=ORANGE, margin=.025, band=.035):
    # Draw at 2x to give the flat geometry antialiased edges, without noise/glow.
    w, h = size
    im = Image.new('RGBA', (w*2, h*2))
    draw = ImageDraw.Draw(im)
    unit = min(w, h)*2
    m, b = unit*margin, max(2, unit*band)
    box = [m, m, w*2-m-1, h*2-m-1]
    shape = draw.ellipse if circle else lambda box, **kw: draw.rounded_rectangle(box, radius=unit*.065, **kw)
    shape(box, fill=WHITE)
    shape([box[0]+b,box[1]+b,box[2]-b,box[3]-b], fill=INK)
    shape([box[0]+b*1.5,box[1]+b*1.5,box[2]-b*1.5,box[3]-b*1.5], fill=accent)
    shape([box[0]+b*2.2,box[1]+b*2.2,box[2]-b*2.2,box[3]-b*2.2], fill=(0,0,0,0) if hollow else fill)
    return im.resize(size, Image.Resampling.LANCZOS)

def grey_sticker(path, border=False):
    src = original(path)
    a = src.getchannel('A')
    grey = ImageOps.grayscale(src)
    # Explicit interim conversion, not represented as newly drawn final art.
    grey = ImageOps.posterize(grey, 3)
    im = ImageOps.colorize(grey, INK, WHITE).convert('RGBA')
    im.putalpha(a)
    if border:
        edge = Image.new('RGBA', im.size, WHITE)
        edge.putalpha(a.filter(ImageFilter.MaxFilter(9)))
        edge.alpha_composite(im)
        im = edge
    save(im, path, 'interim grey sticker; delivered street art pending')

def main():
    for name in ('h1','w','sw','l1'):
        src = D/'style_frame'/f'{name}.png'
        save(Image.open(src).convert('RGBA'), SPR/'turfSymbols'/f'{name}.png', 'approved style frame')
    for name in ('h2','h3','h4','h5','fs','l2','l3','l4'):
        p = SPR/'turfSymbols'/f'{name}.png'
        delivered = D/'_street/street_batch1'/f'{name}.png'
        if delivered.exists():
            save(Image.open(delivered).convert('RGBA'), p, 'street batch1 delivered')
        else:
            grey_sticker(p, not name.startswith('l'))

    for p in (SPR/'turfUi').glob('*.png'):
        size = original(p).size
        circle = p.stem in ('drawer_plate','spin_plate','button_plate','button_plate_active')
        hollow = p.stem in ('panel_edge','modal_frame','buy_card_frame')
        save(plate(size, fill=ORANGE if p.stem=='button_plate_active' else BOARD,
                   circle=circle, hollow=hollow), p)
    for p in (SPR/'turfBoardFrame').glob('*.png'):
        save(plate(original(p).size, hollow=p.stem=='frame_edge', band=.018), p)
    for p in (SPR/'turfFrames').glob('*.png'):
        size = original(p).size
        delivered=D/'_street/street_batch2'/f'{p.stem}.png'
        base_name=p.stem.replace('frame_edge_', 'frame_').replace('frame_full_edge','frame_full')
        edge_source=D/'_street/street_batch2'/f'{base_name}.png'
        if delivered.exists():
            save(Image.open(delivered).convert('RGBA').resize(size,Image.Resampling.LANCZOS),p,'street batch2 delivered')
            continue
        if ('edge' in p.stem) and edge_source.exists():
            alpha=Image.open(edge_source).convert('RGBA').resize(size,Image.Resampling.LANCZOS).getchannel('A')
            im=Image.new('RGBA',size,WHITE)
            im.putalpha(alpha)
            save(im,p,'edge alpha derived from delivered Bag')
            continue
        if p.stem=='frame_sticky':
            im = Image.new('RGBA',size)
            g=ImageDraw.Draw(im)
            w,h=size
            g.ellipse((w*.1,h*.1,w*.9,h*.9), outline='#9BD437', width=max(3,int(w*.05)))
            g.line([(w*.27,h*.5),(w*.45,h*.67),(w*.77,h*.3)],fill='#9BD437',width=max(3,int(w*.065)))
        else:
            # Absolute tape widths stay similar across Bag sizes, rather than
            # increasing with the covered area. Centres remain fully empty.
            im=plate(size,hollow=True,margin=.015,band=max(.004,5/min(size)))
        save(im,p,'interim tape frame; bag-corner artwork pending')
    for p in (SPR/'turfWinBanners').glob('*.png'):
        save(plate(original(p).size, fill=BOARD, accent={'big':ORANGE,'superwin':'#2EC4C6','mega':'#E0338A','epic':'#9BD437','max':WHITE}[p.stem]),p)
    # Blank plaques: the titles and wordmark are now live Bungee lettering.
    for p in list((SPR/'turfSplash').glob('*.png'))+[SPR/'turfBrand/logo.png']:
        save(plate(original(p).size,fill=ORANGE,band=.025),p)

    base = Image.open(D/'style_frame/bg_base.png').convert('RGBA').resize((1920,1080))
    for mode in ('base','feature','epic'):
        scene=D/'_street/street_batch3'/f'bg_{mode}.png'
        im=Image.open(scene).convert('RGBA') if scene.exists() else base
        save(im,SPR/f'turfBackground/bg_{mode}.png','approved MG line city' if mode=='base' else 'delivered mode line scene')
        # Separate sides, with a broad invisible centre. Parallax is tiny in
        # Background.svelte so there is no visible duplicate-building seam.
        delivered_near=D/'_street/street_near'/f'bg_{mode}_near.png'
        near=Image.open(delivered_near).convert('RGBA').resize(base.size,Image.Resampling.LANCZOS) if delivered_near.exists() else Image.new('RGBA',base.size)
        save(near,SPR/f'turfBackground/bg_{mode}_near.png','delivered separate line foreground' if delivered_near.exists() else 'near delivery pending')

    # Flat ink FX; no glows, gradients, realistic sparks or gun debris.
    for p in (SPR/'turfFx').glob('*.png'):
        src=original(p)
        delivered=D/'_street/street_batch3'/p.name
        if p.stem in ('shutter_l','shutter_r','lock') and delivered.exists():
            save(Image.open(delivered).convert('RGBA').resize(src.size,Image.Resampling.LANCZOS),p,'street batch3 delivered')
            continue
        w,h=src.size
        im=Image.new('RGBA',src.size)
        g=ImageDraw.Draw(im)
        name=p.stem
        if name.startswith('shutter_'):
            g.rectangle((0,0,w,h),fill=PAPER)
            for y in range(0,h,64): g.line((0,y,w,y),fill='#55585D',width=5)
            # Own approved stickers, composed, never generated typography.
            for i,n in enumerate(('h1','w','sw','l1')):
                sticker=Image.open(D/'style_frame'/f'{n}.png').convert('RGBA').resize((280,280))
                im.alpha_composite(sticker,(int(w*(.12+.34*(i%2))),280+i*220))
        elif name=='sw_locked':
            for y in range(0,h,256):
                g.line([(w*.1,y+40),(w*.9,y+220)],fill='#B22222',width=20)
                g.line([(w*.9,y+40),(w*.1,y+220)],fill='#B22222',width=20)
        elif name=='lock':
            g.rounded_rectangle((w*.28,h*.12,w*.72,h*.62),radius=w*.2,outline=WHITE,width=int(w*.08))
            g.rounded_rectangle((w*.24,h*.42,w*.76,h*.83),radius=w*.04,fill=ORANGE,outline=INK,width=int(w*.025))
        elif name=='fx_vignette':
            pass
        elif name=='sw_column_beam':
            g.rectangle((w*.18,0,w*.82,h),fill=WHITE)
            for i in range(5):
                x=w*(.2+.13*i)
                g.rounded_rectangle((x,0,x+w*.09,h*(.7+.06*(i%3))),radius=w*.045,fill=WHITE)
        elif name in ('fx_streak','fx_ray'):
            g.polygon([(0,h*.25),(w,h*.42),(w,h*.58),(0,h*.75)],fill=WHITE)
        else:
            points=[]
            for i in range(16):
                a=i*math.pi/8
                r=min(w,h)*(.46 if i%2==0 else .2)
                points.append((w/2+math.cos(a)*r,h/2+math.sin(a)*r))
            g.polygon(points,fill=WHITE)
        save(im,p)
    for p in (APP/'static/assets/castLayers/turf').rglob('*.png'):
        who='fg' if p.parent.name=='fg' else 'mg'
        # Final delivery owns both geometry and textures. Never grey or resize
        # its cropped runtime textures; build_street_cast.py installs that pair.
        if (D/f'_incoming/street_cast/{who}/delivery-check.json').exists():
            continue
        grey_sticker(p)
    for p in (SPR/'turfUiIcons').glob('*.png'):
        src=original(p)
        a=src.getchannel('A')
        # Preserve the supplied black keyline; a white tint over the entire
        # alpha would thicken every control icon and erase its open gaps.
        lum=ImageOps.grayscale(src)
        im=ImageOps.colorize(lum.point(lambda v:255 if v>100 else 0),INK,WHITE).convert('RGBA')
        im.putalpha(a)
        save(im,p)
    coin=SPR/'turfCoin/coin.png'
    im=plate(original(coin).size,fill=ORANGE,circle=True,band=.04)
    w,h=im.size
    g=ImageDraw.Draw(im)
    points=[]
    for i in range(10):
        angle=i*math.pi/5-math.pi/2
        radius=w*(.22 if i%2==0 else .10)
        points.append((w/2+math.cos(angle)*radius,h/2+math.sin(angle)*radius))
    g.polygon(points,fill=WHITE,outline=INK)
    save(im,coin)
    # WinCoins consumes the animated atlas, not coin.png. Replace both paths.
    atlas_path=SPR/'turfCoin/coin_sheet.png'
    atlas=Image.new('RGBA',original(atlas_path).size)
    for i in range(12):
        width=max(10,round(128*abs(math.cos(i*math.pi/6))))
        face=im.resize((width,128),Image.Resampling.LANCZOS)
        atlas.alpha_composite(face,(i*128+(128-width)//2,0))
    save(atlas,atlas_path)
    (D/'street-install-status.json').write_text(json.dumps(changes,indent=2)+'\n')
    print(f'Installed {len(changes)} street assets; originals: {BACKUP}')

if __name__=='__main__': main()
