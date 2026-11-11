"""Copy production build to dist and add local-only real-book QA observers."""
from pathlib import Path
import re, shutil, json, os
from PIL import Image

APP = Path(__file__).resolve().parents[1]
ROOT = APP.parents[2]
OUT = ROOT / os.environ.get('SUMO_QA_OUT', 'dist/sumomonkey-redissect-v2/playtest')
OUT.mkdir(parents=True, exist_ok=True)
shutil.copytree(APP / 'build', OUT, dirs_exist_ok=True)
text = (OUT / 'index.html').read_text()
state = re.search(r'([\w$]+)=[\w$]+\(\{board:[\w$]+,rows:[\w$]+\.y,sourceRows:[\w$]+\.y,boardExpansion:', text)
derived = re.search(r'([\w$]+)=\{onSymbolLand:[\w$]+,boardLayout:', text)
events = re.search(r'const\{eventEmitter:([\w$]+)\}=[\w$]+\(\),\{stateXstate:', text)
marker = list(re.finditer(r'return [\w$]+\.start=[\w$]+,Object\.defineProperty\(', text))[-1]
assert state and derived and events, 'Cannot identify observer symbols in this build'
hook = 'window.__SUMO_QA__={state:%s,derived:%s,events:%s};' % (state[1], derived[1], events[1])
text = text[:marker.start()] + hook + text[marker.start():]
text = text.replace('</head>', '<script src="./stub-data.js"></script><script src="./stub.js"></script></head>')
(OUT / 'index.html').write_text(text)
for name in ['stub-data.js', 'stub.js']:
    shutil.copy2(ROOT / 'dist/sumomonkey-playtest' / name, OUT / name)
bounds = {}
for cast in ['mg', 'fg']:
    bounds[cast] = {}
    for image in (APP / 'static/assets/sumoCast' / cast).glob('*.png'):
        bounds[cast][image.stem] = {'alphaBounds': Image.open(image).getchannel('A').getbbox()}
(OUT / 'boxing-alpha-bounds.json').write_text(json.dumps(bounds))
print('LOCAL ONLY', OUT, {'state': state[1], 'derived': derived[1], 'events': events[1]})
