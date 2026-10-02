# Go Banandit — upload bundle

5×4 ways slot, 1,024 ways. Banana Sacks carry values; the Bandit (Wild, reels 2–5)
collects every Sack on the board. In Free Spins every 4 / 8 / 12 Bandits add 10 spins
and raise collections to ×2 / ×3 / ×10. Max win 10,000×.

Reskin of Go Boomana (chenyuping1998/wp). Same ways engine; mechanic, math and art new.

- math   `math-sdk/games/GoBanandit`
- front  `wp-banandit/apps/GoBanandit`（branch `go-banandit`）
- 細節   `apps/GoBanandit/HANDOFF.md`、`SPEC.md`

## Bet modes

| mode | cost | RTP | max win |
|---|---|---|---|
| base | 1× | 96.00% | 10,000× |
| bonus（Free Spins） | 100× | 96.00% | 10,000× |
| superbonus（Super Free Spins，meter opens at 4, ×2） | 150× | 96.00% | 10,000× |

Custom events: `collect`, `banditMeter`.

## Thumbnail

`thumbnail/GoBanandit-BG.png`（1024², RGB）、`GoBanandit-FG.png`（hero only, RGBA）、`Silverstars-Logo.png`。
BG mean luminance 178 / p10 78 / dark 0% at 200 px.

## Submission description

```
Base Game

Go Banandit is a 5×4 video slot with 1,024 ways, paying left to right from reel 1. Banana Sacks land carrying a value of 1×–50× the bet. The Bandit is a Wild that appears on reels 2 to 5; whenever a Bandit and a Sack are on the board together, every Bandit collects the total value of every Sack, so two Bandits collect it twice.

Free Spins

Landing 3, 4 or 5 Scatters awards 10, 12 or 15 Free Spins. Sacks can carry up to 250× during the feature. Every Bandit that lands is counted on the Bandit meter: at 4, 8 and 12 Bandits, 10 extra spins are added and every later collection is multiplied by ×2, ×3 and then ×10. Scatters do not appear during the feature.

Buy Bonus

Free Spins can be entered directly for 100× the bet, or for 150× with the meter already at 4 and collections starting at ×2.

RTP & Max Win

RTP is 96.00% in all three modes, with a spread of 0.00%. Max Win is capped at 10,000× the bet in every mode.
```
