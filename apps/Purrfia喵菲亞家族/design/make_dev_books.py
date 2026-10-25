"""Stream published books; retain real examples, never generate local outcomes."""
from pathlib import Path
import json, zstandard, io
APP=Path(__file__).resolve().parents[1]
LIB=APP.parents[2]/'math-sdk/games/Purrfia喵菲亞家族/library/publish_files'
out={}
def keep(key,book,mode):
 out.setdefault(key,[{'id':book['id'],'payoutMultiplier':book['payoutMultiplier']/100,'state':book['events'],'mode':mode}])
for mode in ('base','bonus','super'):
 with open(LIB/f'books_{mode}.jsonl.zst','rb') as source:
  with zstandard.ZstdDecompressor().stream_reader(source) as stream:
   for n,line in enumerate(io.TextIOWrapper(stream,encoding='utf8')):
    b=json.loads(line);events=b['events'];types={e['type'] for e in events}
    if mode=='base':
     if b['payoutMultiplier']>0 and 'freeSpinTrigger' not in types:keep('baseWin',b,mode)
     if b['payoutMultiplier']==0:keep('baseNoWin',b,mode)
     if 'boxOpen' in types and 'freeSpinTrigger' not in types:keep('baseBoxes',b,mode)
     if 'freeSpinTrigger' in types and 'wincap' not in types:keep('baseTrigger',b,mode)
    if mode=='bonus':
     if 'wincap' not in types:keep('bonusPlain',b,mode)
     if 'freeSpinRetrigger' in types and 'wincap' not in types:keep('bonusRetrigger',b,mode)
     if any(e['type']=='cellMults' and any(c['mult']>=32 for c in e['cells']) for e in events):keep('bonusTerritory',b,mode)
    if mode=='super' and 'wincap' not in types:keep('superPlain',b,mode)
    if 'wincap' in types:keep(mode+'Cap',b,mode)
    if n>=5000:break
outpath=APP/'src/dev/devBooks.json';outpath.write_text(json.dumps(out,separators=(',',':')),encoding='utf8')
print('Purrfia real-book fixtures: '+', '.join(out))
