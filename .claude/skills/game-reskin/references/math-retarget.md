# Math retargeting: RTP, tail probability, distribution shape

This is the exact discipline used tuning Capo Nostra's `bonus_epic` (The Don,
1000x buy) through four consecutive retargets in one day: an RTP cut, a
tail-probability compliance fix, a Probability-of-Payout-<-Bet target, and a
distribution-shape reshape. Every one of them followed the same loop —
**verify the assertion locally, run the real optimizer in the background,
measure the actual result, compare against the actual target, iterate if
short** — and every one of them needed at least one iteration because the
relationship between a config knob and its measured effect is not linear or
obvious in advance.

**Before you touch a slice: which knob does the request actually mean?** See
SKILL.md's "The user's vocabulary" — on this project "odds" means the
`self.paytable` payout values (cut the dict, don't touch slices) and "feature"
means the signature mechanics (reel special-symbol density, full-board-frame
chance), not the free-spin trigger rate. Turf War burned five optimizer runs
before that was pinned down.

## The assertion to check before every run

`OptimizationSetup.__init__` calls `verify_optimization_input`, which asserts
that each bet mode's `opt_params[mode]["conditions"]` RTP values sum (rounded
to 5 decimals) to that mode's own `bet_mode.rtp`. This is cheap and catches a
misaligned retarget before spending the real run's several minutes:

```python
import sys
sys.path.insert(0, "games/<game>")
sys.path.insert(0, ".")
from game_config import GameConfig
from game_optimization import OptimizationSetup
gc = GameConfig()
OptimizationSetup(gc)   # raises AssertionError if any mode's slices don't sum right
for bm in gc.bet_modes:
    print(bm.get_name(), bm.get_rtp())
```

Run this (with the correct math-sdk Python — see `stake-engine-slot` skill for
which interpreter actually works on this machine) EVERY time `game_config.py`
or `game_optimization.py` changes, before launching `run.py`.

## Retargeting RTP by a flat amount

If every mode needs to move by the same absolute amount (e.g. "lower every
mode's RTP by 0.5 points"):

1. Move each bet mode's `rtp=` value in `game_config.py` by that amount.
2. For a mode whose optimizer conditions are auto-derived from `bet_mode.rtp`
   (a common pattern: `rtp=round(mode_rtps[mode] - <wincap slice>, 5)`), this
   is automatic — nothing else to touch.
3. For a mode whose conditions are hand-written slices (typically the base
   game, with one slice per feature-tier plus a `basegame` slice plus a
   `wincap` slice), retarget proportionally: hold the wincap slice's RTP
   fixed (it sets max-win frequency, not RTP; changing it as a side effect of
   an RTP retarget makes the advertised max win rarer or commoner for no
   reason), scale every OTHER slice by `(new_total - wincap) /
   (old_total - wincap)`, and adjust the largest slice by whatever rounding
   remainder is needed so the slices sum to EXACTLY the new target (the
   assertion checks exact equality at 5 decimals, not "close enough").

## Reading the actual distribution, not the summary file

`library/stats_summary.json` (written by `create_stat_sheet`) has the
headline numbers but rounds to 3 decimals — not enough precision to confirm a
tight compliance margin. Recompute directly from the published lookup table
for full precision, and to get numbers that map onto exactly what an external
dashboard checks:

```python
import sys
sys.path.insert(0, "/path/to/math-sdk")
from utils.analysis.distribution_functions import (
    make_win_distribution, get_etl_cvar_p5k_10k_vales, get_prob_scale,
)

dist = make_win_distribution("library/publish_files/lookUpTable_<mode>_0.csv")
total = sum(dist.values())
cost = <mode's bet cost, e.g. 1000.0>

p5k, p10k, etl10k, etl40, cvar = get_etl_cvar_p5k_10k_vales(dist, cost, total)
scale = get_prob_scale(cost)   # 1.0 / 0.8 / 0.5 / 0.2 by bet_cost bracket
raw_p5k, raw_p10k = p5k / scale, p10k / scale   # the number a platform dashboard shows

prob_less_bet = sum(wt for win, wt in dist.items() if win < cost) / total
average_win = sum(win * wt for win, wt in dist.items()) / total   # == RTP * cost, sanity check
```

Bucket a distribution by payout range the same way to see WHERE weight sits
(useful before deciding what to suppress/boost):

```python
buckets = [(0, 999.999), (1000, 1999.999), (2000, 4999.999), (5000, 9999.999),
           (10000, 19999.999), (20000, 20000)]
for lo, hi in buckets:
    w = sum(wt for win, wt in dist.items() if lo <= win <= hi)
    print(f"[{lo},{hi}] share={w/total:.6f}")
```

## The local `etl10k` volatility check is a false-positive generator for high-cost modes — do not trust it alone

`utils/rgs_verification.py`'s `verify_mode_volatility` computes `etl10k` as
`sum(win * probability for win >= 10000)` — a dollar-weighted sum, **not
divided by `bet_cost`** (unlike `cvar`, and unlike `p5k`/`p10k` which get a
`get_prob_scale(bet_cost)` leniency multiplier). For a mode with bet_cost 500x
or 1000x, an ordinary, unremarkable win easily exceeds 10,000 in raw
base-bet-unit terms purely from the buy multiplier, so this check tends to
flag high-cost modes regardless of whether the underlying distribution is
actually risky. It did, in Capo Nostra, for a 500x mode whose REAL tail
probability was comfortably compliant the entire time (0.001 vs a 0.01
limit) — the local check never stopped complaining about it and was wrong to.

**The metric that matters is the raw probability** (`p5k`/`p10k` above, with
`prob_scale` divided back OUT to get the number a real platform dashboard
compares against its own star-tier thresholds), not `etl10k`. If a platform
review tool flags a specific mode's tail probability, treat that as
authoritative over the local `etl10k` warning; if only `etl10k` fires and the
recomputed raw probability is fine, it's very likely noise.

## Reshaping a distribution: `ConstructScaling`

A bet mode's `"scaling"` list of `{criteria, scale_factor, win_range,
probability}` entries locally reweights the optimizer's selection likelihood
for already-simulated books whose payout falls in `win_range`, for the given
fence `criteria`. It does NOT create new payout values — only the reels/
paytable determine what payouts exist; scaling only changes how often
existing ones get selected to hit the fence's RTP/hr target.

Things that are not obvious until measured:

- **The relationship is not linear.** A `scale_factor` of 0.12 does not
  produce roughly `1/8` of the old bucket's share — in practice, adjacent
  buckets and the fence's own RTP-preservation pull the actual result in
  directions a naive linear estimate misses. Always regenerate and remeasure
  after a change; size the NEXT iteration off the measured gap, not off a
  formula.
- **Suppressing one bucket doesn't say where the freed weight goes.** If the
  goal is "move weight from bucket A into bucket B specifically" (e.g. "lower
  the probability of paying less than the bet cost" — which needs weight to
  move from below-cost into above-cost, not just anywhere), suppress A AND
  explicitly boost B. Suppressing A alone leaves the optimizer free to send
  the freed weight anywhere that holds the fence's RTP target, including back
  into a below-cost bucket, which can move the target metric the WRONG way.
- **Check for existing scaling entries on OTHER criteria in the same win
  range before assuming a range is untouched.** A `ConstructScaling` list is
  usually shared across several bet modes (e.g. one `buy_scaling` object used
  by three different buy-in tiers), and each entry is scoped to one fence's
  own `criteria` label. A `(2000, 5000)` entry that looks like it covers "the
  2000-5000x range" for the mode being tuned may actually belong to a
  DIFFERENT mode's own criteria — check the `criteria` field, not just the
  `win_range`, before concluding a range has or hasn't been touched.
- **Mirror a bought-feature's scaling changes to its free-trigger entry
  point, if the source game has one.** If a feature can be entered either by
  buying it or by triggering it naturally (e.g. landing enough Scatters in
  base play), and both routes lead into the SAME feature math, retuning only
  the bought route's scaling produces two different payout shapes for what
  is supposed to be one feature — leaving one route amplified while the
  other is suppressed makes free-triggering rewarding in a way buying
  deliberately isn't (or vice versa), which reads as backwards regardless of
  which direction it points.

## The iteration loop in practice

1. Edit `game_optimization.py`.
2. Run the local assertion check above. Fix and repeat until it passes.
3. `run.py` in the background (it's minutes; never block on it in the
   foreground).
4. On completion, recompute the actual metric from `library/publish_files/`
   (not the summary file) using the snippets above.
5. Compare against the actual target. If short, adjust the SAME lever's
   magnitude (don't add new levers on the first miss) and repeat from 3.
6. Once the target is met, ALSO re-verify anything a previous retarget in the
   same session already fixed — a later change can undo an earlier one's
   compliance margin without erroring, since nothing enforces cross-fix
   consistency automatically. Re-run every metric that was previously a
   target, not just the newest one.
7. Only once satisfied: sync the frontend config, rebuild the playtest stub,
   and repackage — see `references/packaging.md`.
