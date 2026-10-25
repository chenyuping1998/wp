"""Deterministic finite strips; forced samples always use real strip stops."""
import csv
import random
from pathlib import Path

def make_reels():
    folder = Path(__file__).resolve().parent / 'reels'
    folder.mkdir(exist_ok=True)
    for key, premium, sweeps in [('BR0', [5, 8, 14, 25, 40], 7), ('FR0', [9, 14, 24, 36, 52], 15)]:
        columns = []
        for reel in range(5):
            rng = random.Random(20261023 + reel * 137 + (1000 if key == 'FR0' else 0))
            names = ['H1', 'H2', 'H3', 'H4', 'H5', 'L1', 'L2', 'L3', 'L4', 'W']
            weights = premium + [210, 210, 210, 210, 4]
            strip = rng.choices(names, weights, k=1024)
            # At most one scatter per visible reel; every count 0..5 is possible.
            for pos in (50, 250, 450, 650, 850):
                strip[(pos + reel * 13) % 1024] = 'S'
            if reel in (1, 2, 3):
                for i in range(sweeps):
                    pos = 15 + i * 59
                    if all(strip[(pos + j) % 1024] != 'S' for j in range(-4, 5)):
                        strip[pos] = 'SW'
            # Reachable cap support. These are ordinary positive-probability stops,
            # not a payout override or extra spins hidden in a max-win criterion.
            strip[899:905] = ['L2', 'H1', 'H1', 'H1', 'H1', 'L3']
            if reel in (1, 2, 3):
                strip[913:919] = ['L2', 'H1', 'H1', 'SW', 'H1', 'L3']
                # A real mixed window makes Scatter preservation observable and
                # lets Lost Lagoon land five Scatters while still guaranteeing SW.
                strip[929:935] = ['L2', 'S', 'H1', 'SW', 'L3', 'L1']
            columns.append(strip)
        with (folder / f'{key}.csv').open('w', newline='', encoding='utf-8') as handle:
            csv.writer(handle).writerows(zip(*columns))
    print('Wrote BR0 / FR0: 5 x 1024 finite strip stops')

if __name__ == '__main__':
    make_reels()

