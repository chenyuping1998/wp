"""Canvas sizing/compression for generated art; no painting or colour edits."""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFont
import json
import shutil
import hashlib

app = Path(__file__).resolve().parent.parent
source = app / 'design/source/medusagaze/background'
runtime = app / 'static/assets/sprites/medusaBackground'
runtime.mkdir(parents=True, exist_ok=True)
files = []
names = {'day': ('bg_base.jpg', (1920,1080)), 'night': ('bg_free.jpg', (1920,1080)), 'cloud': ('cloud.png',(1024,342)), 'tourist': ('statue_tourist.png',(512,1024)), 'icecream': ('statue_icecream.png',(512,1024)), 'flame': ('flame.png',(256,384))}
for key, (name,size) in names.items():
    original = Image.open(source / f'{key}_original.png')
    if key not in ['day','night']:
        assert original.mode == 'RGBA' and original.getchannel('A').getextrema()[0] == 0
    image = ImageOps.fit(original, size, method=Image.Resampling.LANCZOS)
    old = runtime / name
    backup = source / 'legacy-placeholders' / name
    if old.exists() and not backup.exists():
        backup.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(old, backup)
    if name.endswith('.jpg'):
        image.convert('RGB').save(old, quality=93, subsampling=0, optimize=True)
    else:
        image.save(old, optimize=True)
    shutil.copy2(old, source / name)
    files.append({'name':name, 'size':size, 'mode':image.mode, 'original':f'{key}_original.png',
                  'bytes':old.stat().st_size,'sha256':hashlib.sha256(old.read_bytes()).hexdigest()})
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 23)
small = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 17)
sheet = Image.new('RGB',(1440,1270),'#0b242c'); d=ImageDraw.Draw(sheet)
d.text((24,20),'MEDUSA GAZE / BACKGROUND ART + ANIMATED LAYERS',font=font,fill='#f2c14e')
for i,name in enumerate(['bg_base.jpg','bg_free.jpg']):
    image=Image.open(source/name).resize((680,383),Image.Resampling.LANCZOS)
    sheet.paste(image,(24+i*712,68));d.text((24+i*712,462),['DAY / fixed architecture','DUSK / matching composition'][i],font=small,fill='#c5d9dc')
for i,(name,label) in enumerate([('statue_tourist.png','SELFIE STATUE'),('statue_icecream.png','ICE-CREAM STATUE')]):
    image=Image.open(source/name).resize((300,600),Image.Resampling.LANCZOS);sheet.paste(image,(32+i*352,545),image);d.text((32+i*352,1160),label,font=small,fill='#c5d9dc')
image=Image.open(source/'cloud.png').resize((650,217),Image.Resampling.LANCZOS);sheet.paste(image,(755,568),image);d.text((755,805),'CLOUD / 384 scene px per minute',font=small,fill='#c5d9dc')
image=Image.open(source/'flame.png').resize((180,270),Image.Resampling.LANCZOS);sheet.paste(image,(980,870),image);d.text((840,1160),'FIRE / free game only; base anchored',font=small,fill='#c5d9dc')
sheets=source.parent/'_sheets';sheets.mkdir(exist_ok=True);sheet.save(sheets/'background_assets_contact.jpg',quality=94,subsampling=0)
report={'tool':'built-in image_gen','prompts':'BACKGROUND_PROMPTS.md','styleReference':'../style_ref.png','files':files,
        'runtimeBytes':sum(f['bytes']for f in files),'processing':'Canvas fit/downsample and JPEG/PNG compression only. Generated originals retained.',
        'motion':'Only clouds, free-game fire and one 1.2s statue fracture/rebuild at each big-win presentation. Architecture is static.'}
(source/'manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'assets':len(files),'runtimeBytes':report['runtimeBytes']}))
