"""Redraw this app's existing code-defined glyphs in dark ink for marble buttons."""
from pathlib import Path
import importlib.util,json,hashlib,shutil
APP=Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('medusa_glyph_shapes',APP/'design/generate_placeholders.py')
shapes=importlib.util.module_from_spec(spec);spec.loader.exec_module(shapes)
# Only call the glyph drawing functions. The old all-art generator is never run.
shapes.WHITE=(7,31,43,255)
root=APP/'design/source/medusagaze/ui';backup=root/'icons_before_20261026';backup.mkdir(exist_ok=True)
names=['menu','menuExit','settings','info','payTable','soundOn','soundOff','increase','decrease','autoSpin']
files=[]
for name in names:
    path=APP/f'static/assets/sprites/medusaUiIcons/{name}.png'
    if path.exists() and not (backup/path.name).exists():shutil.copy2(path,backup/path.name)
    image=shapes.auto_arrow() if name=='autoSpin' else shapes.icon(name)
    image.save(path)
    files.append({'name':name,'path':path.relative_to(APP).as_posix(),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
(root/'icon-contrast-20261026.json').write_text(json.dumps({'date':'2026-10-26','foreground':'#071f2b','background':'painted cream marble','source':'Existing app-owned geometric glyph drawing functions; shapes and registration retained','files':files},indent=2)+'\n',encoding='utf-8')
print('Redrew 10 control glyphs in high-contrast dark ink.')
