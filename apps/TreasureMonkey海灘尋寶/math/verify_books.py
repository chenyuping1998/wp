"""Independent replay of published books, reel windows, rules and integer LUTs.

Does not import the game's evaluator. Rejects an unearned award, an omitted win,
an invalid zone/double/retrigger, an inconsistent replay, or non-96% mode.
"""
import argparse
import csv
import hashlib
import io
import json
from fractions import Fraction
from pathlib import Path
import zstandard as zstd
from game_config import GameConfig,RULES
from utils.rgs_verification import verify_lookup_format

CAP=2000000
PAYS={s:{int(k):round(v*100) for e in d['paytable'] or [] for k,v in e.items()} for s,d in RULES['symbols'].items()}
LINES={int(k):v for k,v in RULES['paylines'].items()}
LADDERS={1:set(list(range(2,11))+[25,50,100]),2:set(range(2,11)),3:set(range(2,9))}
ALLOWED={'reveal','newFrames','updateFrames','wildExpand','winInfo','setWin','setTotalWin','wincap',
         'freeSpinTrigger','bonusTier','frameDoubling','freeSpinRetrigger','updateFreeSpin','freeSpinEnd','finalWin'}

def assert_equal(a,b,label):
    if a!=b:raise AssertionError(f'{label}: {str(a)[:250]} != {str(b)[:250]}')

def bounds(f):
    assert f['size'] in (1,2,3) and 0<=f['reel']<=5-f['size'] and 1<=f['row']<=5-f['size']
    return {(r,y) for r in range(f['reel'],f['reel']+f['size']) for y in range(f['row'],f['row']+f['size'])}

def oracle(board,frames,remaining):
    output=[];used=set()
    zones=[(bounds(f),f['mult']) for f in frames]
    for line_id,rows in LINES.items():
        names=[board[r][rows[r]] for r in range(5)]
        leading=next((r for r,s in enumerate(names) if s!='W'),5)
        choices=[]
        if leading in PAYS['W']:choices.append(('W',leading,PAYS['W'][leading]))
        if leading<5:
            s=names[leading];n=leading
            while n<5 and names[n] in (s,'W'):n+=1
            if n in PAYS[s]:choices.append((s,n,PAYS[s][n]))
        ranked=[]
        for s,n,base in choices:
            positions=[{'reel':r,'row':rows[r]+1} for r in range(n)]
            counts=[sum((p['reel'],p['row']) in cells for p in positions) for cells,_ in zones]
            touched=[i for i,count in enumerate(counts) if count]
            mult=sum(multiplier*count for (_,multiplier),count in zip(zones,counts)) or 1
            ranked.append((base*mult,s,n,base,mult,positions,touched))
        if not ranked:continue
        raw,s,n,base,mult,positions,touched=max(ranked,key=lambda x:x[0])
        paid=min(raw,remaining)
        if paid:
            output.append({'symbol':s,'kind':n,'win':paid,'positions':positions,
                           'meta':{'lineIndex':line_id,'multiplier':mult,'winWithoutMult':base,
                                   'globalMult':1,'lineMultiplier':mult,'uncappedWin':raw}})
            remaining-=paid;used.update(touched)
        if remaining==0:break
    return output,used

def verify_round(book,config):
    frames=[];board=None;raw=None;total=0;feature_paid=0;spin_paid=0
    tier=None;game_type=None;fs_total=0;played=0;expected_touched=set()
    spin_checked=True;did_retrigger=False;did_expand=False;did_double=False;finished=False
    saw_feature=False
    def finish_spin():
        if board is None:return
        if not spin_checked:
            expected,_=oracle(board,frames,CAP-total)
            assert not expected,'payable line was omitted'
        sweeps=any('SW' in c for c in raw)
        assert_equal(did_expand,sweeps,'wildExpand must match dealt SW')
        if game_type=='freegame':
            assert tier!='don' or sweeps,'Lost Lagoon requires SW every spin'
            count=sum(c.count('S') for c in raw)
            assert_equal(did_retrigger,count>=2 and total<CAP,'required retrigger')
            assert_equal(did_double,bool(expected_touched) and tier in ('capo','don') and total<CAP,'required once-per-zone doubling')
    for index,event in enumerate(book['events']):
        kind=event['type'];assert kind in ALLOWED
        assert_equal(event['index'],index,'event index')
        assert not finished,'event after finalWin'
        if kind=='reveal':
            finish_spin();assert total<CAP,'spin after max win'
            game_type=event['gameType'];key='BR0' if game_type=='basegame' else 'FR0'
            assert len(event['board'])==5 and all(len(c)==6 for c in event['board'])
            for reel,column in enumerate(event['board']):
                stop=event['paddingPositions'][reel];strip=config.reels[key][reel]
                expected=[strip[(stop+y)%len(strip)] for y in range(-1,5)]
                assert_equal([s['name'] for s in column],expected,'reveal must be a real strip window')
                for symbol in column:
                    assert_equal(bool(symbol.get('scatter')),symbol['name']=='S','scatter flag')
                    assert_equal(bool(symbol.get('wild')),symbol['name']=='W','wild flag')
            raw=[[s['name'] for s in c[1:5]] for c in event['board']]
            board=[c[:] for c in raw]
            assert not any('SW' in raw[r] for r in (0,4)),'SW only on middle reels'
            if game_type=='basegame':frames=[]
            spin_checked=False;spin_paid=0;expected_touched=set();did_retrigger=did_expand=did_double=False
        elif kind in ('newFrames','updateFrames'):
            values=event['frames'];occupied=set()
            for f in values:
                cells=bounds(f);assert not cells&occupied,'overlapping zones';occupied|=cells
                assert isinstance(f['mult'],int) and f['mult']>0
            if kind=='newFrames':
                old=set().union(*(bounds(f) for f in frames)) if frames else set()
                assert not old&occupied,'new zone overlaps sticky zone'
                for f in values:assert f['mult'] in LADDERS[f['size']]
                frames+=values
            else:
                assert game_type=='freegame'
                if not frames:
                    assert_equal(len(values),RULES['seedFrames'][tier],'initial seeded zones')
                else:
                    assert_equal([(f['reel'],f['row'],f['size']) for f in values],[(f['reel'],f['row'],f['size']) for f in frames],'sticky footprints')
                    if tier!='soldier':assert_equal(values,frames,'sticky multiplier persists')
                if tier=='soldier' or not frames:
                    for f in values:assert f['mult'] in LADDERS[f['size']]
                frames=values
        elif kind=='wildExpand':
            expected=[{'reel':r,'row':y+1} for r,c in enumerate(raw) for y,s in enumerate(c) if s=='SW']
            assert_equal(event['wilds'],expected,'SW origin positions')
            assert_equal(event['reels'],sorted({p['reel'] for p in expected}),'expanded reels')
            for r in event['reels']:board[r]=['S' if s=='S' else 'W' for s in board[r]]
            did_expand=True
        elif kind=='winInfo':
            assert not spin_checked,'duplicate winInfo'
            expected,expected_touched=oracle(board,frames,CAP-total)
            assert expected,'zero win must not show a win presentation'
            assert_equal(event['wins'],expected,'paytable, line, frame coverage and cap arithmetic')
            spin_paid=sum(w['win'] for w in expected);assert_equal(event['totalWin'],spin_paid,'spin total')
            total+=spin_paid
            if game_type=='freegame':feature_paid+=spin_paid
            spin_checked=True
        elif kind=='setWin':assert_equal(event['amount'],spin_paid,'setWin')
        elif kind=='setTotalWin':assert_equal(event['amount'],total,'running amount')
        elif kind=='wincap':assert_equal(event['amount'],CAP,'cap amount');assert total==CAP
        elif kind=='freeSpinTrigger':
            positions=[{'reel':r,'row':y+1} for r,c in enumerate(raw) for y,s in enumerate(c) if s=='S']
            assert_equal(event['positions'],positions,'trigger scatters');assert len(positions) in (3,4,5)
            assert_equal(event['totalFs'],10,'initial free spins');fs_total=10;saw_feature=True
        elif kind=='bonusTier':
            tier=event['tier'];assert tier in ('soldier','capo','don')
            count=sum(c.count('S') for c in raw)
            assert_equal(tier,{3:'soldier',4:'capo',5:'don'}[count],'tier by scatter count')
            assert_equal(event['seedFrames'],RULES['seedFrames'][tier],'seed count announcement');frames=[]
        elif kind=='frameDoubling':
            assert not did_double and tier in ('capo','don') and total<CAP
            expected=[{**frames[i],'mult':frames[i]['mult']*2} for i in sorted(expected_touched)]
            assert_equal(event['frames'],expected,'each used frame doubles once')
            mapping={(f['reel'],f['row']):f for f in expected}
            frames=[mapping.get((f['reel'],f['row']),f) for f in frames];did_double=True
        elif kind=='freeSpinRetrigger':
            positions=[{'reel':r,'row':y+1} for r,c in enumerate(raw) for y,s in enumerate(c) if s=='S']
            assert_equal(event['positions'],positions,'retrigger scatters')
            fs_total+=RULES['retrigger'][str(len(positions))]
            assert_equal(event['totalFs'],fs_total,'retrigger total');did_retrigger=True
        elif kind=='updateFreeSpin':
            assert_equal(event['amount'],played,'free-spin counter');assert_equal(event['total'],fs_total,'free-spin allocation');played+=1
        elif kind=='freeSpinEnd':
            finish_spin();spin_checked=True;board=None
            assert played==fs_total or total==CAP,'feature ended early without cap'
            assert_equal(event['amount'],feature_paid,'feature total')
        elif kind=='finalWin':
            finish_spin();assert_equal(event['amount'],total,'final amount');finished=True
    assert finished
    assert_equal(book['payoutMultiplier'],total,'book payout')
    assert_equal(book['featurePayout'],feature_paid,'feature accounting')
    assert_equal(book['basePayout']+feature_paid,total,'base plus feature accounting')
    if book['mode']!='base':
        assert saw_feature and tier==RULES['modes'][book['mode']]['tier'] and book['basePayout']==0
    return len(book['events'])

def read_books(path):
    with Path(path).open('rb') as f,zstd.ZstdDecompressor().stream_reader(f) as stream:
        for line in io.TextIOWrapper(stream,encoding='utf-8'):
            if line.strip():yield json.loads(line)

def verify(bundle):
    config=GameConfig();bundle=Path(bundle)
    index=json.loads((bundle/'index.json').read_text(encoding='utf-8'))
    configs=Path(config.library_path)/'configs'
    backend=json.loads((configs/f'config_{config.game_id}.json').read_text(encoding='utf-8'))
    shelf={m['name']:m for m in backend['bookShelfConfig']}
    def check_hash(path,expected):
        with path.open('rb') as f:digest=hashlib.file_digest(f,'sha256').hexdigest()
        assert_equal(digest,expected,'published SHA-256 '+path.name)
    check_hash(configs/backend['frontendConfig']['file'],backend['frontendConfig']['sha256'])
    assert_equal({m['name']:m['cost'] for m in index['modes']},{m:d['cost'] for m,d in RULES['modes'].items()},'modes and template buy costs')
    result={}
    for mode in index['modes']:
        name=mode['name'];entry=shelf[name]
        assert_equal(entry['cost'],mode['cost'],'backend cost')
        assert_equal(entry['rtp'],.96,'backend RTP')
        assert_equal(entry['maxWin'],20000,'backend max win')
        assert_equal(entry['booksFile']['file'],mode['events'],'backend book file')
        assert_equal(entry['tables'][0]['file'],mode['weights'],'backend lookup file')
        check_hash(bundle/mode['events'],entry['booksFile']['sha256'])
        check_hash(bundle/mode['weights'],entry['tables'][0]['sha256'])
        verify_lookup_format(str(bundle/mode['weights']))
        with (bundle/mode['weights']).open() as file:rows=list(csv.reader(file))
        weights={int(i):(int(w),int(p)) for i,w,p in rows}
        assert len(weights)==len(rows) and all(w>0 for w,p in weights.values())
        total_weight=sum(w for w,p in weights.values());assert total_weight<2**64
        assert_equal(Fraction(sum(w*p for w,p in weights.values()),total_weight*100*int(mode['cost'])),Fraction(96,100),'exact published RTP')
        assert max(p for w,p in weights.values())==CAP
        count=events=0;seen=set();fixtures={}
        weighted={k:0 for k in ('features','freeSpins','retriggers','sweepRounds','soldier','capo','don')}
        for book in read_books(bundle/mode['events']):
            i=book['id'];assert i not in seen;seen.add(i)
            assert_equal(weights[i][1],book['payoutMultiplier'],'lookup payout')
            assert book['payoutMultiplier']%10==0 and 0<=book['payoutMultiplier']<=CAP
            try:events+=verify_round(book,config)
            except Exception as e:raise AssertionError(f'{name} book {i}: {e}') from e
            w=weights[i][0];tier=book['featureTier']
            if tier:
                weighted['features']+=w;weighted[tier]+=w
            weighted['freeSpins']+=w*sum(e['type']=='reveal' and e['gameType']=='freegame' for e in book['events'])
            weighted['retriggers']+=w*sum(e['type']=='freeSpinRetrigger' for e in book['events'])
            weighted['sweepRounds']+=w*any(e['type']=='wildExpand' for e in book['events'])
            if book['payoutMultiplier']==CAP:fixtures.setdefault('cap',book)
            elif book['payoutMultiplier']>0:fixtures.setdefault('win',book)
            if book['featureTier'] and book['payoutMultiplier']<CAP:fixtures.setdefault('natural_'+book['featureTier'],book)
            if any(e['type']=='wildExpand' for e in book['events']):fixtures.setdefault('sweep',book)
            if any(e['type']=='freeSpinRetrigger' for e in book['events']):fixtures.setdefault('retrigger',book)
            if any(e['type']=='newFrames' and any(f['size']>1 for f in e['frames']) for e in book['events']):fixtures.setdefault('largeZone',book)
            count+=1
            if count%20000==0:print(f'{name}: replayed {count:,} books',flush=True)
        assert_equal(seen,set(weights),'no missing or orphan books')
        assert_equal(count,entry['bookLength'],'backend book length')
        (Path(config.library_path)/f'configs/verified_fixtures_{name}.json').write_text(json.dumps(fixtures,separators=(',',':')),encoding='utf-8')
        result[name]={'books':count,'events':events,'rtp':.96,'exactRtp':'24/25','maxWin':20000,
                      'totalWeight':total_weight,'hashesVerified':True,'sdkLookupFormatVerified':True,
                      'featureProbability':weighted['features']/total_weight,
                      'meanFreeSpinsPerRound':weighted['freeSpins']/total_weight,
                      'meanFreeSpinsPerFeature':weighted['freeSpins']/weighted['features'],
                      'meanRetriggersPerRound':weighted['retriggers']/total_weight,
                      'sweepRoundProbability':weighted['sweepRounds']/total_weight,
                      'tierProbabilities':{t:weighted[t]/total_weight for t in ('soldier','capo','don')}}
        print(f'OK {name}: {count:,} complete books / {events:,} events; independently recomputed, RTP exactly 96%',flush=True)
    report=Path(config.library_path)/'reports/verification.json'
    report.write_text(json.dumps(result,indent=2),encoding='utf-8')
    return result

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('bundle',nargs='?');a=p.parse_args()
    verify(a.bundle or GameConfig().publish_path)
