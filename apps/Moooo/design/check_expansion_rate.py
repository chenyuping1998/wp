"""Expansion rate by cow count, against the reference's measured figures.

The reference measured its own game: 1 symbol on the board expands 41.9% of the
time, 2 -> 63.7%, 3 -> 85.2%. Those numbers are not a parameter anywhere - they
are what falls out of "expand only if the reel crosses a win line" once you also
know the paytable and the strips. So they are a check on whether the RULE is
implemented the same way, which no RTP figure can tell you.
"""
import collections, os, sys
ROOT = "/Users/stone/stake-engine/math-sdk"
GAME = os.path.join(ROOT, "games", "moooo")
sys.path.insert(0, ROOT); sys.path.insert(0, GAME); os.chdir(GAME)
from game_config import GameConfig
from gamestate import GameState

REFERENCE = {1: 41.9, 2: 63.7, 3: 85.2, 4: 100.0}

config = GameConfig(); gs = GameState(config)
gs.betmode = "base"
landed = collections.Counter(); expanded = collections.Counter()

for criteria in ("basegame", "0", "freegame"):
    gs.criteria = criteria
    for sim in range(2500):
        gs.run_spin(sim)
        per_spin = {}
        for e in gs.book.events:
            if e["type"] == "newCows":
                per_spin[e["index"]] = [len(e["cows"]), 0]
                last = e["index"]
            elif e["type"] == "expandCows" and per_spin:
                per_spin[last][1] = len(e["reels"])
        for n, exp in per_spin.values():
            landed[n] += n
            expanded[n] += exp

print(f"{'cows on board':>14} {'landed':>8} {'expanded':>9} {'rate':>7}   reference")
for n in sorted(landed):
    if n == 0: continue
    rate = 100 * expanded[n] / landed[n]
    ref = REFERENCE.get(n)
    print(f"{n:>14} {landed[n]:>8} {expanded[n]:>9} {rate:>6.1f}%   {ref if ref else '-':>6}")
