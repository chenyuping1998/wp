"""Record the verified symbol-art delivery; never marks character work complete."""
from pathlib import Path
import json
import re
from zipfile import ZipFile, ZIP_DEFLATED

app = Path(__file__).resolve().parent.parent
root = app / 'design/source/medusagaze'
symbols = root / 'symbols'
buildlog = Path('E:/stake/tmp/medusa-symbols-v2-build-20261024.log')
typelog = Path('E:/stake/tmp/medusa-symbols-v2-svelte-check-final-20261024.log')
text = buildlog.read_text(encoding='utf-8')
assert 'adapter-static' in text and 'done' in text, 'Completed static build required'
types = typelog.read_text(encoding='utf-8')
assert not re.search(r'ERROR.*(?:symbolMotion|SymbolArtMesh|build_symbols_v2|check_motion|build_motion_review)', types)
assert 'COMPLETED' in types
recording = json.loads((root / 'motion/recording_symbols_v2.json').read_text(encoding='utf-8'))
motion = json.loads((app / 'design/motion-validation.json').read_text(encoding='utf-8'))
assert motion['invertedTriangles'] == 0
manifest = json.loads((symbols / 'manifest.json').read_text(encoding='utf-8'))
for item in manifest['files']:
    name = item['name'] + '.png'
    assert (symbols / name).read_bytes() == (app / 'static/assets/sprites/medusaSymbols' / name).read_bytes()
    assert (symbols / name).read_bytes() == (app / 'build/assets/sprites/medusaSymbols' / name).read_bytes()
manifest['validation'] = {'runtimeAndBuildImagesMatch': True, 'transparentRGBAImages': 10,
    'visualReview': 'Codex inspected all ten on game teal and magenta, at detail and 98px size. Final user asset review remains available.',
    'meshGrid': motion['meshGrid'], 'invertedTriangles': 0,
    'minMeshAreaRatio': motion['minMeshAreaRatio'], 'layeredActing': 'in_progress'}
(symbols / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
with ZipFile(symbols / 'MedusaGaze_symbols_v2.zip', 'w', ZIP_DEFLATED) as z:
    for item in manifest['files']:
        z.write(symbols / (item['name'] + '.png'), 'symbols/' + item['name'] + '.png')
    for name in ['SYMBOL_PROMPTS.md', 'manifest.json']:
        z.write(symbols / name, name)
    z.write(root / '_sheets/symbols_v2_contact.jpg', 'symbols_v2_contact.jpg')

status_file = root / 'delivery-status.json'
status = json.loads(status_file.read_text(encoding='utf-8'))
status['motionV2'].update({'recordingSeconds': recording['durationSeconds'], 'recordingBytes': recording['bytes'],
    'offlineBrowserSmoke': 'Local mock baseWin completed with polished symbols, WIN 0.60 and Spin available; error logs empty. Not Stake Engine verification.'})
status['validation'].update({'build': 'production_symbols_passed_exit_0_adapter_static_done',
    'buildLog': str(buildlog).replace('\\','/'), 'typeCheckLog': str(typelog).replace('\\','/'),
    'typeCheck': 'Full svelte-check: 154 pre-existing errors in other sources/config/dependencies, no errors in changed symbol motion or review sources.',
    'browser': 'Ten symbol cards and 20 displayed images loaded. Teal and magenta edge checks passed. Local mock baseWin finished, no error logs.',
    'productionSymbolBytes': manifest['runtimeBytes'], 'productionSymbolCount': 10,
    'packagedImagesMatchRuntime': True, 'symbolZipBytes': (symbols / 'MedusaGaze_symbols_v2.zip').stat().st_size})
status_file.write_text(json.dumps(status, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'symbols': 10, 'runtimeBytes': manifest['runtimeBytes'], 'movieSeconds': recording['durationSeconds'], 'build': 'PASS', 'changedSourceTypeErrors': 0}, indent=2))
