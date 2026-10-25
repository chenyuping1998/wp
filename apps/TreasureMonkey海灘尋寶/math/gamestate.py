"""Integer book-unit evaluator and the actual Treasure Monkey event machine.

Only publication weights tune RTP. A round's paid amount is always its evaluated
paylines, with the documented 20,000x round cap; no post-hoc payout scaling.
"""
import random
from copy import deepcopy
from game_config import RULES

CAP = 2_000_000
LINES = {int(k): v for k, v in RULES['paylines'].items()}
PAY = {(name, int(k)): round(value * 100) for name, d in RULES['symbols'].items()
       for entry in d['paytable'] or [] for k, value in entry.items()}
PAYING = ('W', 'H1', 'H2', 'H3', 'H4', 'H5', 'L1', 'L2', 'L3', 'L4')
TIERS = {3: 'soldier', 4: 'capo', 5: 'don'}
VALUES = {1: ([2,3,4,5,6,7,8,9,10,25,50,100], [30,23,16,10,6,4,3,2,2,2,1,1]),
          2: (list(range(2,11)), [28,23,17,12,8,5,3,2,2]),
          3: (list(range(2,9)), [30,25,18,12,8,5,2])}

def covered(frame):
    return {(r, y) for r in range(frame['reel'], frame['reel'] + frame['size'])
            for y in range(frame['row'], frame['row'] + frame['size'])}

def expand(board):
    result = [column[:] for column in board]
    wilds = [{'reel': r, 'row': y + 1} for r in range(5) for y in range(4) if board[r][y] == 'SW']
    reels = sorted({p['reel'] for p in wilds})
    for reel in reels:
        result[reel] = [s if s == 'S' else 'W' for s in result[reel]]
    return result, wilds, reels

def evaluate(board, frames, remaining=CAP):
    """Highest payable left-to-right substitution, one award per line.

    A frame contributes its value once PER winning position it covers. Separate
    frames add; a winning frame doubles at most once after the whole spin.
    """
    wins, touched = [], set()
    for line_id, rows in LINES.items():
        symbols = [board[r][rows[r]] for r in range(5)]
        best = None
        first_non_wild = next((s for s in symbols if s != 'W'), None)
        # Match SDK lines: a wild prefix can pay as W or join the first real
        # symbol. It cannot invent an absent premium symbol for a shorter win.
        for symbol in ('W', first_non_wild) if first_non_wild else ('W',):
            n = 0
            for s in symbols:
                if s == symbol or s == 'W': n += 1
                else: break
            base = PAY.get((symbol, n), 0)
            if not base: continue
            positions = [(r, rows[r]) for r in range(n)]
            counts = [sum(r >= f['reel'] and r < f['reel']+f['size'] and
                          y >= f['row'] and y < f['row']+f['size'] for r, y in positions) for f in frames]
            multiplier = sum(f['mult'] * count for f, count in zip(frames, counts)) or 1
            amount = base * multiplier
            if best is None or amount > best[0]: best = (amount, symbol, n, base, multiplier, counts, positions)
        if best is None: continue
        amount, symbol, n, base, multiplier, counts, positions = best
        paid = min(amount, remaining)
        if paid:
            wins.append({'symbol': symbol, 'kind': n, 'win': paid,
                         'positions': [{'reel': r, 'row': y+1} for r,y in positions],
                         'meta': {'lineIndex': line_id, 'multiplier': multiplier, 'winWithoutMult': base,
                                  'globalMult': 1, 'lineMultiplier': multiplier, 'uncappedWin': amount}})
            touched.update(i for i,c in enumerate(counts) if c)
            remaining -= paid
        if remaining == 0: break
    return wins, touched

class GameState:
    def __init__(self, config):
        self.config = config
        self.stops = {}
        for key, strips in config.reels.items():
            for reel, strip in enumerate(strips):
                for symbol in ('S', 'SW'):
                    self.stops[key, reel, symbol] = [i for i in range(len(strip))
                        if symbol in [strip[(i+y) % len(strip)] for y in range(4)]]
                scatters = set(self.stops[key,reel,'S'])
                self.stops[key,reel,'noS'] = [i for i in range(len(strip)) if i not in scatters]

    def draw(self, rng, game_type, scatter_count=None, guaranteed=False, cap=False):
        key = 'BR0' if game_type == 'basegame' else 'FR0'
        strips = self.config.reels[key]
        selected = set(rng.sample(range(5), scatter_count)) if scatter_count is not None else None
        while True:
            stops = [rng.choice(self.stops[key,r,'S' if r in selected else 'noS']) if selected is not None
                     else rng.randrange(len(strips[r])) for r in range(5)]
            if cap:
                stops = [900]*5
                if guaranteed: stops[1] = 914
            visible = [[strip[(stop+y)%len(strip)] for y in range(4)] for strip,stop in zip(strips,stops)]
            if not guaranteed or any('SW' in column for column in visible): break
        padded = [[strip[(stop+y)%len(strip)] for y in range(-1,5)] for strip,stop in zip(strips,stops)]
        board = [[{'name':s, **({'wild':True} if s=='W' else {'scatter':True} if s=='S' else {})}
                  for s in column] for column in padded]
        return visible, board, stops

    @staticmethod
    def frame(rng, frames, cap=False):
        occupied = set().union(*(covered(f) for f in frames)) if frames else set()
        sizes = [rng.choices([1,2,3],[73,23,4])[0],1]
        for size in sizes:
            candidates = [{'reel':r,'row':y,'size':size} for r in range(6-size) for y in range(5-size)
                          if not (covered({'reel':r,'row':y,'size':size}) & occupied)]
            if candidates:
                result = rng.choice(candidates)
                result['mult'] = rng.choices(*VALUES[size])[0]
                if cap: result['mult'] = max(VALUES[size][0])
                return result
        return None

    def run(self, mode, seed, force=None, entry_only=False):
        rng = random.Random(seed)
        events, total, feature_paid = [], 0, 0
        tier = RULES['modes'][mode]['tier']
        emit = lambda kind, **data: events.append({'index':len(events),'type':kind,**data})
        def wire(frames): return [{**f,'row':f['row']+1} for f in frames]
        def resolve(raw, board, stops, game_type, frames, carried=False, new=()):
            nonlocal total, feature_paid
            seen, anticipation = 0, []
            for column in raw:
                anticipation.append(min(2,max(0,seen-1)))
                seen += column.count('S')
            emit('reveal',board=board,paddingPositions=stops,anticipation=anticipation,gameType=game_type)
            if carried: emit('updateFrames',frames=wire(frames[:-len(new)] if new else frames))
            if new: emit('newFrames',frames=wire(new))
            evaluated, wilds, reels = expand(raw)
            if wilds: emit('wildExpand',wilds=wilds,reels=reels)
            wins,touched = evaluate(evaluated,frames,CAP-total)
            amount = sum(w['win'] for w in wins)
            if amount: emit('winInfo',totalWin=amount,wins=wins)
            total += amount
            if game_type == 'freegame': feature_paid += amount
            if amount: emit('setWin',amount=amount,winLevel=self.config.get_win_level(amount/100,'standard'))
            emit('setTotalWin',amount=total)
            if total == CAP: emit('wincap',amount=CAP)
            return touched

        # Buying opens the SAME feature as scatters, with an entry-only nonpaying
        # scatter board. Its visible symbols still come from actual reel stops.
        count = next((n for n,t in TIERS.items() if t==tier), None)
        if mode == 'base' and force in TIERS.values(): count = next(n for n,t in TIERS.items() if t==force)
        while True:
            raw, board, stops = self.draw(rng,'basegame',count,cap=force=='cap' and mode=='base')
            if force=='ordinary' and sum(c.count('S') for c in raw)>=3: continue
            if mode == 'base' or not evaluate(expand(raw)[0],[])[0]: break
        frames = []
        if mode == 'base' and (force=='cap' or rng.random()<.07):
            f = {'reel':1,'row':0,'size':3,'mult':8} if force=='cap' else self.frame(rng,frames)
            frames.append(f)
        resolve(raw,board,stops,'basegame',frames,new=frames)
        base_paid = total
        scatters = [{'reel':r,'row':y+1} for r in range(5) for y in range(4) if raw[r][y]=='S']
        if mode=='base': tier = TIERS.get(len(scatters))
        if entry_only:
            return {'events':events,'basePayout':total,'positions':scatters}
        if tier is not None and total<CAP:
            total_fs, played = 10, 0
            emit('freeSpinTrigger',totalFs=total_fs,positions=scatters)
            emit('bonusTier',tier=tier,seedFrames=RULES['seedFrames'][tier])
            frames = []
            for _ in range(RULES['seedFrames'][tier]):
                frames.append(self.frame(rng,frames,cap=force=='cap'))
            while played < total_fs and total < CAP:
                if played >= 10000: raise RuntimeError('unexpected runaway feature; never silently truncate')
                if tier=='soldier' and played:
                    for f in frames: f['mult']=rng.choices(*VALUES[f['size']])[0]
                raw,board,stops=self.draw(rng,'freegame',guaranteed=tier=='don',cap=force=='cap' and played==0)
                new=[]
                if rng.random()<.14:
                    f=self.frame(rng,frames)
                    if f: frames.append(f);new.append(f)
                touched=resolve(raw,board,stops,'freegame',frames,carried=True,new=new)
                if tier in ('capo','don') and total<CAP:
                    doubled=[]
                    for i in sorted(touched): frames[i]['mult']*=2;doubled.append(frames[i])
                    if doubled: emit('frameDoubling',frames=wire(doubled))
                positions=[{'reel':r,'row':y+1} for r in range(5) for y in range(4) if raw[r][y]=='S']
                if total<CAP and len(positions)>=2:
                    total_fs += RULES['retrigger'][str(len(positions))]
                    emit('freeSpinRetrigger',totalFs=total_fs,positions=positions)
                emit('updateFreeSpin',amount=played,total=total_fs)
                played+=1
            emit('freeSpinEnd',amount=feature_paid,winLevel=self.config.get_win_level(feature_paid/100,'endFeature'))
        emit('finalWin',amount=total)
        return {'id':0,'mode':mode,'payoutMultiplier':total,'events':events,
                'criteria':'cap' if total==CAP else ('trigger_'+tier if mode=='base' and tier else 'ordinary'),
                'basePayout':base_paid,'featurePayout':feature_paid,'featureTier':tier}

    def natural_from_buy(self, source, seed):
        """Same feature path and probability as its bought counterpart.

        A fresh valid natural trigger may itself win. Rebase cumulative amounts
        and apply the SAME round cap to the remaining budget, never scale wins.
        """
        tier=source['featureTier']
        while True:
            entry=self.run('base',seed,force=tier,entry_only=True)
            if entry['basePayout']<CAP:break
            seed+=1
        events=entry['events'];total=entry['basePayout'];feature=0;spin=0
        def emit(kind,**data):events.append({'index':len(events),'type':kind,**data})
        started=False
        for original in source['events']:
            kind=original['type']
            if kind=='freeSpinTrigger':started=True
            if not started:continue
            event=deepcopy(original);event.pop('index');event.pop('type')
            if kind=='freeSpinTrigger':event['positions']=entry['positions']
            elif kind=='winInfo':
                wins=[];spin=0
                for win in event['wins']:
                    paid=min(win['meta']['uncappedWin'],CAP-total-spin)
                    if paid:win['win']=paid;wins.append(win);spin+=paid
                event['wins']=wins;event['totalWin']=spin
                total+=spin;feature+=spin
            elif kind=='reveal':spin=0
            elif kind=='setWin':event.update(amount=spin,winLevel=self.config.get_win_level(spin/100,'standard'))
            elif kind=='setTotalWin':event['amount']=total
            elif kind=='wincap':continue
            elif kind in ('frameDoubling','freeSpinRetrigger') and total==CAP:continue
            elif kind=='freeSpinEnd':event.update(amount=feature,winLevel=self.config.get_win_level(feature/100,'endFeature'))
            elif kind=='finalWin':event['amount']=total
            emit(kind,**event)
            if kind=='setTotalWin' and total==CAP:emit('wincap',amount=CAP)
            if kind=='updateFreeSpin' and total==CAP:
                emit('freeSpinEnd',amount=feature,winLevel=self.config.get_win_level(feature/100,'endFeature'))
                emit('finalWin',amount=total);break
        return {'id':0,'mode':'base','payoutMultiplier':total,'events':events,
                'criteria':'trigger_'+tier,'basePayout':entry['basePayout'],
                'featurePayout':feature,'featureTier':tier}
