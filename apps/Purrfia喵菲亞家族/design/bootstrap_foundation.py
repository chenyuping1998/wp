"""Create a mechanics review build. Does not create approved production art."""
from pathlib import Path
import shutil, re, json
from PIL import Image, ImageDraw, ImageFont

APP = Path(__file__).resolve().parents[1]
BASE = APP.parent / 'MedusaGaze梅杜莎凝視'
for folder in ('src',):
    shutil.copytree(BASE/folder, APP/folder, dirs_exist_ok=True)
for filename in ('package.json','svelte.config.js','tsconfig.json','lingui.config.ts','.eslintrc.cjs','.gitignore'):
    shutil.copy2(BASE/filename, APP/filename)
for folder in ('fonts','licenses'):
    shutil.copytree(BASE/'static'/folder, APP/'static'/folder, dirs_exist_ok=True)
for filename in ('check_assets.mjs','check_undefined_refs.mjs','check_string_literals.mjs','check_social_words.mjs','check_tumble_rule.mjs'):
    shutil.copy2(BASE/'design'/filename, APP/'design'/filename)

def write(rel, text):
    p=APP/rel; p.parent.mkdir(parents=True,exist_ok=True); p.write_text(text,encoding='utf8')

# Keep the shared transport and cascading engine, own the new game's presentation.
for p in (APP/'src').rglob('*'):
    if p.suffix not in ('.ts','.svelte','.html','.json','.txt'): continue
    s=p.read_text(encoding='utf8').replace('MEDUSA_GAZE','PURRFIA').replace('MedusaGaze','Purrfia').replace('MEDUSA GAZE','PURRFIA').replace('Medusa Gaze','Purrfia')
    s=s.replace('medusaUi','purrfiaUi').replace('medusaBrand','purrfiaBrand').replace('medusaSymbols','purrfiaSymbols').replace('medusaIntro','purrfiaIntro').replace('medusaFx','purrfiaFx').replace('medusaBackground','purrfiaBackground').replace('medusaWinBanners','purrfiaWinBanners')
    p.write_text(s,encoding='utf8')

# Register only plain review assets. Final art is gated by the style sample.
original=(BASE/'src/game/assets.ts').read_text(encoding='utf8')
entries=re.findall(r'(\w+):\s*\{\s*type:\s*[\'"]sprite[\'"]\s*,\s*src:\s*new URL\([\'"]([^\'"]+)',original)
font=ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf',72)
registry=[]
manifest=[]
for key,path in entries:
    if key=='mgCastAtlas': continue
    rel=path.replace('../../','').replace('medusa','purrfia')
    dest=APP/'static'/rel;dest.parent.mkdir(parents=True,exist_ok=True)
    source=BASE/'static'/path.replace('../../','')
    w,h=Image.open(source).size
    if 'UiIcons' in path:
        shutil.copy2(source,dest)
    else:
        im=Image.new('RGBA',(w,h),(0,0,0,0));d=ImageDraw.Draw(im)
        if path.endswith('.jpg'):
            im=Image.new('RGB',(w,h),'#141826');d=ImageDraw.Draw(im)
        if key.startswith('mgH') or key.startswith('mgL') or key=='mgS':
            palette={'mgH1':'#99cee8','mgH2':'#e8b7a6','mgH3':'#c77ddb','mgH4':'#78ad79','mgL1':'#c7b9ec','mgL2':'#df7c86','mgL3':'#82bdc6','mgL4':'#e7c572','mgS':'#f2c14e'}
            c=palette.get(key,'#f2c14e');p=int(w*.12)
            d.rounded_rectangle((p,p,w-p,h-p),radius=w*.14,fill=c,outline='#fff0cc',width=max(2,w//50))
            text=key[2:];box=d.textbbox((0,0),text,font=font);d.text(((w-box[2])/2,(h-box[3])/2),text,font=font,fill='#2a1e1a')
        elif 'Bg' in key:
            d.rectangle((0,0,w,h),fill='#171a28' if 'Free' not in key else '#231629')
            for x in range(0,w,120):d.line((x,0,x+w*.24,h),fill='#242b42',width=22)
        elif 'Logo' in key:
            f=ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf',int(h*.35));box=d.textbbox((0,0),'PURRFIA',font=f);d.text(((w-box[2])/2,(h-box[3])/2),'PURRFIA',font=f,fill='#f2c14e')
        elif key.startswith('fx'):
            d.ellipse((w*.25,h*.25,w*.75,h*.75),fill='#fff0c8')
        else:
            margin=max(2,min(w,h)//14);d.rounded_rectangle((margin,margin,w-margin,h-margin),radius=min(w,h)*.16,fill='#2a1e1a',outline='#b58b49',width=max(2,min(w,h)//24))
        if dest.suffix=='.jpg':im.convert('RGB').save(dest,quality=88)
        else:im.save(dest)
    registry.append(f"\t{key}: {{ type: 'sprite', src: new URL('../../{rel}', import.meta.url).href, preload: true }},")
    manifest.append({'key':key,'path':rel,'status':'neutral_mechanics_placeholder' if 'UiIcons' not in path else 'shared_generic_icon'})
for name,color in [('M','#c9945a'),('W','#f2c14e')]:
    im=Image.new('RGBA',(512,512));d=ImageDraw.Draw(im);d.rounded_rectangle((60,60,452,452),radius=70,fill=color,outline='#fff0cc',width=8);d.text((210,205),name,font=font,fill='#2a1e1a');dest=APP/f'static/assets/sprites/purrfiaSymbols/{name.lower()}.png';dest.parent.mkdir(parents=True,exist_ok=True);im.save(dest)
    registry.append(f"\tmg{name}: {{ type: 'sprite', src: new URL('../../assets/sprites/purrfiaSymbols/{name.lower()}.png', import.meta.url).href, preload: true }},")
write('src/game/assets.ts','// Neutral mechanics placeholders; style approval pending.\nexport default {\n'+'\n'.join(registry)+'\n} as const;\n')
write('src/game/audioManifest.ts','// Original Purrfia audio production awaits visual style approval.\nexport const MEDUSA_AUDIO: Record<string,string> = {};\n')
write('design/placeholder-assets.json',json.dumps(manifest,indent=2)+'\n')
write('vite.config.js',"import config from 'config-vite';\nimport { mergeConfig } from 'vite';\nexport default mergeConfig(config(), { base: './' });\n")

package=json.loads((APP/'package.json').read_text());package['name']='purrfia'
package['scripts']={'dev':'vite dev --host --port 3046','preview':'vite preview','build':'node design/sync_math_config.mjs && node design/check_undefined_refs.mjs && node design/check_assets.mjs && node design/check_purrfia_events.mjs && vite build','check:events':'node design/check_purrfia_events.mjs','check:assets':'node design/check_assets.mjs','check:refs':'node design/check_undefined_refs.mjs','dev:books':'E:/stake/math-sdk/env/Scripts/python.exe design/make_dev_books.py'}
write('package.json',json.dumps(package,indent=2)+'\n')

for p in ('src/components/Medusa.svelte','src/components/MedusaThrow.svelte','src/components/MedusaRigView.svelte','src/components/MedusaBuyBonusButton.svelte','src/components/MedusaSpinGlyph.svelte','src/game/medusaRigScene.ts','src/game/medusaRigData.json','src/game/medusaRigCore.ts','src/game/medusaRigAtlas.txt','src/game/medusaAnchors.svelte.ts','src/game/multiplierFxScene.ts','src/game/multiplierPerformance.ts','src/components/MultiplierFx.svelte','src/game/backgroundScene.ts','src/game/backgroundMotion.ts','src/game/boardFrameScene.ts'):
    (APP/p).unlink(missing_ok=True)
print(APP)
