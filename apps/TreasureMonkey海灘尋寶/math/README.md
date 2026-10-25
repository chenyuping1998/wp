# Treasure Monkey — independent 96% math

5 reels × 4 rows, 14 fixed left-to-right lines, 20,000× base-stake round cap.
The template's three Buy Bonus prices remain **100× / 500× / 1,000×**.
All four modes target **0.96**, measured from published integer lookup weights.

| Mode | Cost | Feature |
| --- | ---: | --- |
| base | 1× | Natural 3/4/5 Scatter entries |
| bonus | 100× | BEACH SWEEP: 10 spins, one seeded zone, sticky footprints, rerolled values |
| bonus_hits | 500× | HIDDEN COVE: 10 spins, three seeded zones, used zones double once per spin |
| bonus_epic | 1,000× | LOST LAGOON: Hidden Cove plus at least one SW every spin |

Every feature retriggers on 2/3/4/5 Scatters for +2/+4/+6/+8. Added spins keep
their tier. Reaching the round cap ends the round immediately.

## Implementation

- `rules.json` owns the paytable, paylines, costs and tier contract. No Collector
  or unrelated template mechanic is used.
- Deterministic finite 1,024-stop CSV strips supply real raw and padded windows.
  SW appears only on middle reels and preserves Scatters. Mixed S/SW windows
  make the highest tier's five-Scatter retrigger possible too.
- A zone covers 1×1, 2×2 or 3×3 cells. Each WINNING position it covers contributes
  its multiplier. Zone contributions add; distinct zones do not overlap. Initial
  ladders: 1×1 = 2..10/25/50/100; 2×2 = 2..10; 3×3 = 2..8.
- Lines follow SDK actual-symbol/wild-prefix substitution. Money is integer
  hundredths of the BASE stake; a Buy Bonus RTP divides by its purchase cost too.
- Runtime outcomes come from a finite WEIGHTED book library, not uniformly drawn
  raw strips. Stratified legal paths use the local template's smooth log-payout
  weighting approach; payouts are never scaled to reach RTP. All lookup weights
  are positive integers. Integer correction makes each mode's RTP exactly 24/25.
- Natural features mirror ALL bought paths with their same relative weights.
  A fresh base trigger spin is separately evaluated; cumulative amounts and the
  remaining cap budget are rebased without changing ordinary line awards.
- The base feature frequency is approximately 1 in 350 rounds, with conditional
  tier shares 94% / 5% / 1%. Exact published probabilities are in verification.json.
- Cap paths use legal strip stops, valid initial values and the documented spin
  allocation. There are no hidden extra spins or special unlisted multipliers.

## Rebuild

From `E:/stake/math-sdk`, with the E-drive Python and `PYTHONPATH=.`:

```powershell
$env:PYTHONPATH='E:/stake/math-sdk'
& E:/stake/math-sdk/env/Scripts/python.exe games/TreasureMonkey/make_reels.py
& E:/stake/math-sdk/env/Scripts/python.exe -m unittest discover -s games/TreasureMonkey -p 'test_*.py'
& E:/stake/math-sdk/env/Scripts/python.exe -u games/TreasureMonkey/run.py --books 100000 --base-books 100000
& E:/stake/math-sdk/env/Scripts/python.exe -u games/TreasureMonkey/verify_books.py
& E:/stake/math-sdk/env/Scripts/python.exe games/TreasureMonkey/write_report.py
& E:/stake/math-sdk/env/Scripts/python.exe games/TreasureMonkey/package_bundle.py E:/stake/archive/deliverables/TreasureMonkey
```

Output is 100,000 books per buy tier, 100,000 ordinary base books and 300,000
mirrored natural features: **700,000 complete rounds**. Three local worker
processes generate buy supplies, using fixed repeatable seeds. The index is
invalidated before generation and written last. Never copy a library mid-run.

`verify_books.py` independently replays EVERY book from raw strip windows and
checks all paylines, zone coverage, expansion, doubling, counters, retriggers,
cap accounting, book/LUT identity and exact weighted RTP. It does not import the
game evaluator. Tests additionally compare plain lines against the actual SDK
on 1,500 random boards and deliberately reject corrupted awards/sweeps.

`library/publish_files` contains four `.jsonl.zst` streams, matching CSV tables
and the index. `library/configs` contains SDK-generated frontend configuration,
backend hashes, sidecars and verified fixture books. `library/reports` contains
measured distribution and replay verification. Reports, not target labels,
demonstrate the result. Platform publication and a real RGS session are separate.

The math ZIP contains only the index and its eight referenced book/table files
at archive root. A separate sources ZIP preserves code, strips, configurations,
fixtures and reports. Every archived file is rehashed after packaging; SHA256.json
records both archives and their contents. An upload ZIP is not proof of upload.

Frontend source mirror: `E:/stake/wp/apps/TreasureMonkey海灘尋寶/math`. Sources and
strips are mirrored; large generated libraries stay in the SDK. After verification:

```powershell
& E:/stake/math-sdk/env/Scripts/python.exe E:/stake/wp/apps/TreasureMonkey/design/sync_math_config.py
& E:/stake/math-sdk/env/Scripts/python.exe E:/stake/wp/apps/TreasureMonkey/design/sync_story_books.py
& E:/stake/math-sdk/env/Scripts/python.exe E:/stake/wp/apps/TreasureMonkey/design/math_quicktest.py
```
