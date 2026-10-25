from pathlib import Path
import io,json,zstandard
app=Path(__file__).resolve().parent.parent
lib=app.parents[2]/'math-sdk/games/ParrotRadio鸚鵡電台/library/publish_files'
out={}
for mode in ('base','bonus','super'):
 with open(lib/f'books_{mode}.jsonl.zst','rb') as f:
  for number,line in enumerate(io.TextIOWrapper(zstandard.ZstdDecompressor().stream_reader(f),encoding='utf-8')):
   b=json.loads(line);es=b['events'];types={e['type'] for e in es}
   shape={'id':b['id'],'payoutMultiplier':b['payoutMultiplier']/100,'state':es,'mode':mode}
   def save(key,ok):
    if ok and key not in out:out[key]=[shape]
   if mode=='base':
    simple='freeSpinTrigger' not in types and 'wincap' not in types
    save('baseWin',simple and b['payoutMultiplier']>0 and 'encore' not in types)
    save('baseEncore',simple and 'encore' in types)
    save('baseEncoreHit',simple and any(e['type']=='encore' and i+1<len(es) and es[i+1]['type']=='winInfo' for i,e in enumerate(es)))
    save('baseEncoreMiss',simple and any(e['type']=='encore' and i+1<len(es) and es[i+1]['type']!='winInfo' for i,e in enumerate(es)))
    save('baseRecord',simple and any(e['type']=='platinumRecord' and e['applied'] for e in es))
    save('baseRecordMiss',simple and any(e['type']=='platinumRecord' and not e['applied'] for e in es))
    save('baseTrigger','freeSpinTrigger' in types and 'wincap' not in types)
   else:
    save(mode+'Plain','wincap' not in types)
    save(mode+'Retrigger','freeSpinRetrigger' in types and 'wincap' not in types)
   if number>20000:break
   expected=['baseWin','baseEncore','baseEncoreHit','baseEncoreMiss','baseRecord','baseRecordMiss','baseTrigger'] if mode=='base' else [mode+'Plain',mode+'Retrigger']
   if all(k in out for k in expected):break
(app/'src/dev/devBooks.json').write_text(json.dumps(out,separators=(',',':')),encoding='utf-8')
print({k:{'id':v[0]['id'],'events':len(v[0]['state'])} for k,v in out.items()})
