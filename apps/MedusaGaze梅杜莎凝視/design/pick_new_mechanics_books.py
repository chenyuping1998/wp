"""Read-only extraction of real new-mechanism books into dev-only fixtures."""
from pathlib import Path
import json,io,zstandard
APP=Path(__file__).resolve().parent.parent
LIB=Path('E:/stake/math-sdk/games/MedusaGaze梅杜莎凝視/library/publish_files')
p=APP/'src/dev/devBooks.json';data=json.loads(p.read_text(encoding='utf-8'))
for mode,key in [('petrify','newPetrify'),('bonus','newLadder'),('super','newSuper')]:
 with (LIB/f'books_{mode}.jsonl.zst').open('rb') as f:
  with zstandard.ZstdDecompressor().stream_reader(f) as reader:
   for i,line in enumerate(io.TextIOWrapper(reader,encoding='utf-8')):
    b=json.loads(line);events=b['events'];b={'id':b['id'],'payoutMultiplier':b['payoutMultiplier'],'state':events}
    good=any(e['type']=='stoneReveal' for e in events) if mode=='petrify' else any(e['type']=='serpentLevel' and (mode=='super' or e.get('level',0)>=2) for e in events)
    if good:data[key]=[b];print(key,b['id'],len(events));break
    if i>5000:raise RuntimeError('No representative book '+mode)
p.write_text(json.dumps(data,separators=(',',':')),encoding='utf-8')
