"""Stream published books into a weighted, deterministic local-only catalogue.
Keeps sampled/scenario books, never a decoded copy of the full library.
"""
from pathlib import Path
import csv,io,json,random,sys
import zstandard as zstd
ROOT=Path('/Users/stone/stake-engine')
BUNDLE=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'upload/StaticShift/math'
OUT=Path(sys.argv[2]) if len(sys.argv)>2 else ROOT/'dist/staticshift-playtest/stub-data.js'
rng=random.Random(20260822)
data,catall={},{}
for mode in json.loads((BUNDLE/'index.json').read_text())['modes']:
 name=mode['name'];rows=list(csv.reader((BUNDLE/mode['weights']).open()))
 ids=[int(r[0]) for r in rows];weights=[float(r[1]) for r in rows]
 pool=rng.choices(ids,weights=weights,k={'base':2500,'bonus':300,'superbonus':300}.get(name,250));want=set(pool)
 found=dict.fromkeys(['maxWin','scatter3','scatter4','scatter5','collect','collect2','levelUp','level3'])
 kept={};best=-1;last=-1;count=0
 with (BUNDLE/mode['events']).open('rb') as raw:
  with zstd.ZstdDecompressor().stream_reader(raw) as zr:
   for line in io.TextIOWrapper(zr,encoding='utf-8'):
    if not line.strip():continue
    book=json.loads(line);i=book['id'];assert i>last,'Books must be in id order';last=i;count+=1;events=book['events']
    def take(key):
     if found[key] is None:found[key]=i
    payout=book['payoutMultiplier']
    if payout>best:best=payout;found['maxWin']=i
    triggers=[e for e in events if e['type']=='freeSpinTrigger']
    if triggers:
     key='scatter'+str(len(triggers[0]['positions']))
     if key in found:take(key)
    collects=[e for e in events if e['type']=='collect']
    if collects and not triggers:take('collect')
    if not triggers and any(len(e['collectors'])>=2 for e in collects):take('collect2')
    ups=[e for e in events if e['type']=='banditMeter' and e['levelUp']>0]
    if ups:take('levelUp')
    if any(e['level']>=3 for e in ups):take('level3')
    if i in want or i in found.values():kept[i]=book
 keep=want|{v for v in found.values() if v is not None}
 assert keep<=kept.keys()
 data[name.upper()]={'cost':mode['cost'],'pool':pool,'books':{str(i):kept[i] for i in sorted(keep)}}
 catall[name.upper()]=found
 print(name,'streamed',count,'kept',len(keep),'catalogue',found,flush=True)
OUT.parent.mkdir(parents=True,exist_ok=True);temp=OUT.with_suffix('.tmp')
with temp.open('w') as h:
 h.write('window.__STUB_DATA__='+json.dumps(data,separators=(',',':'))+'\n')
 h.write('window.__STUB_CATALOGUE__='+json.dumps(catall)+'\n')
temp.replace(OUT)
print('Wrote',OUT,round(OUT.stat().st_size/1e6,2),'MB',flush=True)
