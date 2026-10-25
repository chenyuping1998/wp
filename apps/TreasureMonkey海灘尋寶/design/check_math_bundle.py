"""Check a copied TreasureMonkey upload bundle with exact integer RTP."""
import csv,io,json,sys
from fractions import Fraction
from pathlib import Path
import zstandard as zstd
RULES=json.loads((Path(__file__).resolve().parents[1]/'math/rules.json').read_text(encoding='utf-8'))
def main(folder):
    root=Path(folder);index=json.loads((root/'index.json').read_text(encoding='utf-8'))
    assert {m['name']:m['cost'] for m in index['modes']}=={n:m['cost'] for n,m in RULES['modes'].items()}
    referenced={'index.json'}|{m[k] for m in index['modes'] for k in ('events','weights')}
    assert {p.name for p in root.iterdir() if p.suffix in ('.csv','.zst')}<=referenced
    for mode in index['modes']:
        with (root/mode['weights']).open() as f:rows=list(csv.reader(f))
        lut={int(i):(int(w),int(p)) for i,w,p in rows}
        assert len(lut)==len(rows) and all(w>0 and p>=0 and p%10==0 for w,p in lut.values())
        total=sum(w for w,p in lut.values());assert total<2**64
        assert Fraction(sum(w*p for w,p in lut.values()),total*100*int(mode['cost']))==Fraction(24,25)
        assert max(p for w,p in lut.values())==RULES['maxWin']*100
        seen=set()
        with (root/mode['events']).open('rb') as f,zstd.ZstdDecompressor().stream_reader(f) as stream:
            for line in io.TextIOWrapper(stream,encoding='utf-8'):
                b=json.loads(line);i=b['id'];assert i not in seen;seen.add(i)
                assert b['payoutMultiplier']==lut[i][1]
        assert seen==set(lut)
        print(f"OK {mode['name']}: {len(seen):,} books; exact RTP 96%; book/LUT matched")
    return 0
if __name__=='__main__':
    target=sys.argv[1] if len(sys.argv)>1 else str(Path(__file__).resolve().parents[4]/'math-sdk/games/TreasureMonkey/library/publish_files')
    sys.exit(main(target))
