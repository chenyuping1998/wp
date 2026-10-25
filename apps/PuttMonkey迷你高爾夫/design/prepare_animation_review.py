"""Review-only short scenarios assembled from sample events; never shipping math."""
from pathlib import Path
from copy import deepcopy
import json, shutil

APP=Path(__file__).resolve().parents[1]
books=json.loads((APP/'design/qa_replay_books.json').read_text(encoding='utf-8'))
out=APP/'build-playtest'
base=deepcopy(books['base'][4])
feature=books['superbonus'][0]
opening=deepcopy(feature['events'][:2])
opening[1]['totalFs']=3
meter1=deepcopy(next(e for b in books['bonus'] for e in b['events'] if e['type']=='banditMeter' and e.get('levelUp')==1))
meter2=deepcopy(next(e for e in feature['events'] if e['type']=='banditMeter' and e.get('levelUp')==1))
events=opening
total=0
for i,meter in enumerate((meter1,meter2)):
    events.append(dict(type='updateFreeSpin',amount=i,total=3+i*10))
    reveal=deepcopy(base['events'][0]);reveal['gameType']='freegame';events.append(reveal)
    for e in base['events'][1:]:
        if e['type'] in ('collect','setWin'):
            e=deepcopy(e);e['gameType']='freegame';events.append(e)
            if e['type']=='collect':total+=e['amount']
    meter['totalFs']=13+i*10;events.append(meter)
    events.append(dict(type='setTotalWin',amount=total))
events.extend([dict(type='freeSpinEnd',amount=total,winLevel=7),dict(type='finalWin',amount=total)])
for i,e in enumerate(events):e['index']=i
suite=dict(id=900010,payoutMultiplier=total,events=events,criteria='QA shortened animation scenario; not production math')
maxevents=[deepcopy(base['events'][0]),dict(type='setWin',amount=1000000,winLevel=10),dict(type='setTotalWin',amount=1000000),dict(type='finalWin',amount=1000000)]
for i,e in enumerate(maxevents):e['index']=i
maxbook=dict(id=900011,payoutMultiplier=1000000,events=maxevents,criteria='QA max-win presentation; not production math')
data={}
for mode,rounds in books.items():
    data[mode.upper()]=dict(cost=1 if mode=='base' else 100 if mode=='bonus' else 150,
        pool=[b['id'] for b in rounds if b['id']<900000],books={str(b['id']):b for b in rounds})
for b in (suite,maxbook):data['BASE']['books'][str(b['id'])]=b
(out/'stub-data.js').write_text('window.__STUB_DATA__='+json.dumps(data,separators=(',',':'))+';window.__STUB_CATALOGUE__={};',encoding='utf-8')
shutil.copy2(APP/'design/qa_audio_probe.js',out/'qa_audio_probe.js')
p=out/'index.html';html=p.read_text(encoding='utf-8')
if 'qa_audio_probe.js' not in html:html=html.replace('<head>','<head><script src="./qa_audio_probe.js"></script>')
p.write_text(html,encoding='utf-8')
print('Prepared review-only audio probe, shortened feature 900010 and max-win 900011')
