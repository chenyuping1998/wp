"""Check every rule the player is told against the published books.

The rules page, buy menu, feature cards and design/GAME_DESCRIPTION.md all say
the same things about this game. `run.py` proves the books are internally
consistent and RTP-correct; it does not know what the copy promises. This walks
every book in every mode and checks each promise, so a sentence that is false
fails here instead of in a reviewer's hand (Hard Time shipped four).

Claims checked (numbers come from src/game/config.ts, the same source the copy
is rendered from, so the copy and this check cannot drift apart):

  C1  Collect values: base game within config.jadeCupValues.base, free spins
      within .free (max 50x / 250x)
  C2  The Wild appears only on reels 2-5 (and does appear on each of them)
  C3  The Scatter appears on all five reels in the base game
  C4  3 / 4 / 5 Scatters award scatterSpins[3/4/5] free spins
  C5  Whenever a Wild and a collect symbol are both on the board, every Wild
      collects every one: amount = sum(values) x Wilds (unless capped), mult x1
  C6  Free spins never retrigger: the spin total only grows by meter awards
  C7  Meter: reaching 4 / 8 / 12 adds 10 spins and removes 10, then J, then Q,
      and a removed symbol never lands again in that feature
  C8  Bought modes start with 10 spins; the higher one with the meter at its
      first rung and every 10 already replaced
  C9  No round pays more than the 10,000x cap

Direct-entry rounds open on a set-up board that is never evaluated; the rules
say so, so C5 skips that one board and only counts it.

Usage (from the app folder):
  E:\\stake\\math-sdk\\env\\Scripts\\python.exe -I design/check_copy_claims.py
Exit code 1 when any claim fails.
"""
import io, json, pathlib, re, sys
import zstandard

APP = pathlib.Path(__file__).resolve().parents[1]
cfg_src = (APP / 'src/game/config.ts').read_text(encoding='utf-8')
CFG = json.loads(cfg_src[cfg_src.index('{'):cfg_src.rindex('}') + 1])
GAME_ID = CFG['gameID']
BOOKS = APP.parents[2] / 'math-sdk/games' / GAME_ID / 'library/publish_files'

BASE_VALUES = set(CFG['jadeCupValues']['base'])
FREE_VALUES = set(CFG['jadeCupValues']['free'])
SCATTER_SPINS = {int(k): v for k, v in CFG['scatterSpins'].items()}
METER = CFG['banditMeter']
CAP = max(m['max_win'] for m in CFG['betModes'].values()) * 100  # book units: 1x = 100
VISIBLE = slice(1, 5)  # boards carry one padding row above and below

fails = []
def fail(claim, msg):
    fails.append(f'{claim}: {msg}')

def visible(board):
    return [reel[VISIBLE] for reel in board]

def books(mode):
    with open(BOOKS / f'books_{mode}.jsonl.zst', 'rb') as fh:
        for line in io.TextIOWrapper(zstandard.ZstdDecompressor().stream_reader(fh), encoding='utf-8'):
            yield json.loads(line)

stats = {'wild_reels': set(), 'scatter_reels_base': set(), 'collect_checked': 0, 'triggers': 0, 'meter_levels': 0, 'max_payout': 0, 'entry_boards_unevaluated': 0}

for mode in ('base', 'bonus', 'superbonus'):
    bought = mode != 'base'
    for book in books(mode):
        bid = f'{mode}#{book["id"]}'
        ev = book['events']
        stats['max_payout'] = max(stats['max_payout'], book['payoutMultiplier'])
        if book['payoutMultiplier'] > CAP:
            fail('C9', f'{bid} pays {book["payoutMultiplier"] / 100}x')

        in_free = False
        removed = []          # low symbols already turned into collect symbols
        total_fs = None
        first_free_reveal = True
        first_meter = True
        pending = None        # visible board waiting for its collect check
        for i, e in enumerate(ev):
            t = e['type']
            if t == 'reveal':
                if pending: _check = pending; pending = None
                board = visible(e['board'])
                names = [[s['name'] for s in reel] for reel in board]
                for r, reel in enumerate(names):
                    if 'W' in reel:
                        stats['wild_reels'].add(r)
                        if r == 0: fail('C2', f'{bid} Wild on reel 1')
                    if 'S' in reel and not in_free: stats['scatter_reels_base'].add(r)
                vals = [s.get('prize') for reel in board for s in reel if s['name'] == 'P']
                allowed = FREE_VALUES if in_free else BASE_VALUES
                for v in vals:
                    if v not in allowed:
                        fail('C1', f'{bid} {"free" if in_free else "base"} value {v}x not in the stated set')
                if in_free:
                    for sym in removed:
                        if any(sym in reel for reel in names):
                            fail('C7', f'{bid} removed symbol {sym} landed again')
                    if bought and mode == 'superbonus' and first_free_reveal:
                        if any('L5' in reel for reel in names):
                            fail('C8', f'{bid} 10 still on the first free spin of the higher buy')
                    first_free_reveal = False
                n_w = sum(reel.count('W') for reel in names)
                if bought and i == 0:
                    # direct entry: the set-up board only places the Scatters and
                    # is not evaluated — the rules page says so in its own sentence
                    if n_w and vals: stats['entry_boards_unevaluated'] += 1
                elif n_w and vals:
                    # the collect for this board must come before the next reveal
                    nxt = next((x for x in ev[i + 1:] if x['type'] in ('reveal', 'collect')), None)
                    if not nxt or nxt['type'] != 'collect':
                        fail('C5', f'{bid} Wild and collect symbol on the board but nothing collected')
                    else:
                        want = int(round(sum(vals) * 100)) * n_w
                        if nxt['mult'] != 1:
                            fail('C5', f'{bid} collection multiplier {nxt["mult"]}')
                        if nxt['amount'] != want and nxt['amount'] >= CAP:
                            pass  # capped
                        elif nxt['amount'] != want and nxt['amount'] < want and book['payoutMultiplier'] >= CAP:
                            pass  # capped part-way
                        elif nxt['amount'] != want:
                            fail('C5', f'{bid} collected {nxt["amount"]} for {n_w} Wild(s) x {sum(vals)}x = {want}')
                        if len(nxt['collectors']) != n_w or len(nxt['sacks']) != len(vals):
                            fail('C5', f'{bid} collect lists {len(nxt["collectors"])} Wilds / {len(nxt["sacks"])} symbols, board has {n_w} / {len(vals)}')
                        stats['collect_checked'] += 1
            elif t == 'freeSpinTrigger':
                if in_free:
                    fail('C6', f'{bid} retriggered inside free spins')
                in_free = True
                total_fs = e['totalFs']
                if bought:
                    if total_fs != 10: fail('C8', f'{bid} bought feature starts with {total_fs} spins')
                else:
                    stats['triggers'] += 1
                    n_s = len(e['positions'])
                    if SCATTER_SPINS.get(n_s) != total_fs:
                        fail('C4', f'{bid} {n_s} Scatters gave {total_fs} spins')
            elif t == 'banditMeter' and in_free:
                if first_meter and mode == 'superbonus' and e['count'] < METER['thresholds'][0]:
                    fail('C8', f'{bid} higher buy opens with meter {e["count"]}')
                first_meter = False
                if e['levelUp']:
                    stats['meter_levels'] += e['levelUp']
                    if e['spinsAdded'] != METER['spinsAdded'] * e['levelUp']:
                        fail('C7', f'{bid} meter level-up added {e["spinsAdded"]} spins')
                want_removed = METER['replacements'][:e['level']]
                if e['removedSymbols'] != want_removed:
                    fail('C7', f'{bid} level {e["level"]} removed {e["removedSymbols"]}, expected {want_removed}')
                expect_level = sum(e['count'] >= th for th in METER['thresholds'])
                if e['level'] != expect_level:
                    fail('C7', f'{bid} meter count {e["count"]} at level {e["level"]}')
                if total_fs is not None and e['totalFs'] != total_fs + e['spinsAdded']:
                    fail('C6', f'{bid} spin total went {total_fs} -> {e["totalFs"]} with {e["spinsAdded"]} awarded')
                total_fs = e['totalFs']
                removed = list(e['removedSymbols'])
            elif t == 'updateFreeSpin' and total_fs is not None and e['total'] != total_fs:
                fail('C6', f'{bid} spin total changed to {e["total"]} outside the meter')

for r in range(1, 5):
    if r not in stats['wild_reels']: fail('C2', f'the Wild never lands on reel {r + 1}')
for r in range(5):
    if r not in stats['scatter_reels_base']: fail('C3', f'the Scatter never lands on reel {r + 1} in the base game')

print(f'check_copy_claims: {GAME_ID} — {stats["collect_checked"]} collections, {stats["triggers"]} base triggers, '
      f'{stats["meter_levels"]} meter level-ups, top round {stats["max_payout"] / 100:g}x; '
      f'{stats["entry_boards_unevaluated"]} direct-entry boards with a Wild beside a collect symbol (stated in the rules, not paid)')
if fails:
    from collections import Counter
    by = Counter(f.split(':')[0] for f in fails)
    print(f'check_copy_claims: FAILED ({len(fails)}) by claim: {dict(by)}')
    for f in fails[:25]: print('  ' + f)
    sys.exit(1)
print('check_copy_claims: all claims hold (C1-C9)')
