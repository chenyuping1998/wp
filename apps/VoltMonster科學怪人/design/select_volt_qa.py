"""Read published books with the math SDK's existing zstandard runtime."""
from pathlib import Path
import io,json,zstandard
D=Path(__file__).resolve().parent
game=next((D.parents[3]/'math-sdk/games').glob('VoltMonster*'))
books={};summary={}
for mode in ['base','bonus','holdandspin','scarab5','scarab10','sunboost']:
    chosen={};count=0
    with open(game/'library/publish_files'/f'books_{mode}.jsonl.zst','rb') as raw:
        with zstandard.ZstdDecompressor().stream_reader(raw) as stream:
            for line in io.TextIOWrapper(stream,encoding='utf-8'):
                book=json.loads(line);events=book['events'];types=[e['type'] for e in events]
                wins=[w['symbol'] for e in events if e['type']=='winInfo' for w in e['wins']]
                tags=['first']+(['win'] if book['payoutMultiplier']>0 else [])
                tags += [t for t in types if any(k in t.lower() for k in ['wheel','roulette','trigger','hold','sticky','multiplier'])]
                tags += ['symbol_'+s for s in wins]
                for tag in tags: chosen.setdefault(tag,book)
                count+=1
                if count>=3000 or len(chosen)>=18:break
    unique={b['id']:b for b in chosen.values()};books[mode]=list(unique.values())
    summary[mode]={'scanned':count,'books':[{'id':b['id'],'payoutMultiplier':b['payoutMultiplier'],'events':list(dict.fromkeys(e['type'] for e in b['events']))} for b in unique.values()]}
target=D/'source/volt_delivery';target.mkdir(exist_ok=True)
(target/'qa_data.json').write_text(json.dumps(books),encoding='utf-8')
(target/'qa_books.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
print({mode:len(rows) for mode,rows in books.items()})
