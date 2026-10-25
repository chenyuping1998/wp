"""Measure actual integer lookup distributions; prices come from index.json."""
import csv
import json
import math
import sys
from fractions import Fraction
from pathlib import Path
DEFAULT=Path(__file__).resolve().parents[1].parents[2]/'math-sdk/games/TreasureMonkey/library/publish_files'
def main(bundle=None):
    bundle=Path(bundle or DEFAULT)
    index=json.loads((bundle/'index.json').read_text(encoding='utf-8'));results={}
    for mode in index['modes']:
        with (bundle/mode['weights']).open() as f:rows=[tuple(map(int,row)) for row in csv.reader(f)]
        total=sum(w for _,w,p in rows);paid=sum(w*p for _,w,p in rows);cost=int(mode['cost'])
        rtp=Fraction(paid,total*100*cost)
        assert rtp==Fraction(24,25),f"{mode['name']}: wrong RTP {float(rtp)}"
        hit=sum(w for _,w,p in rows if p>0)/total
        profit=sum(w for _,w,p in rows if p>100*cost)/total
        cap=sum(w for _,w,p in rows if p==2000000)/total
        std=math.sqrt(sum(w*(p/100/cost-float(rtp))**2 for _,w,p in rows)/total)
        results[mode['name']]={'books':len(rows),'cost':cost,'rtp':float(rtp),'hitRate':hit,'profitProbability':profit,'stdDevCostUnits':std,'maxWinProbability':cap,'maxWinBaseBetX':max(p for _,w,p in rows)/100}
        print(f"{mode['name']:12} cost={cost:4}x RTP={float(rtp):.10%} hit={hit:.4%} profit={profit:.4%} std/cost={std:.4f} cap=1/{1/cap:,.0f}")
    return results
if __name__=='__main__':main(sys.argv[1] if len(sys.argv)>1 else None)
