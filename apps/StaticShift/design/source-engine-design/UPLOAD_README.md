# Static Shift — upload bundle

5×4 ways slot, 1,024 ways. Banana Sacks carry values; the Bandit (Wild, reels 2–5)
collects every Sack on the board. In Free Spins every 4 / 8 / 12 Bandits add 10 spins
and raise collections to ×2 / ×3 / ×10. Max win 10,000×.

Reskin of Go Boomana (chenyuping1998/wp). Same ways engine; mechanic, math and art new.

- math   `math-sdk/games/StaticShift`
- front  `wp-staticShift/apps/StaticShift`（branch `static-shift`）
- 細節   `apps/StaticShift/HANDOFF.md`、`SPEC.md`

## Bet modes

| mode | cost | RTP | max win |
|---|---|---|---|
| base | 1× | 96.05% | 10,000× |
| bonus（Free Spins） | 100× | 96.07% | 10,000× |
| superbonus（Super Free Spins，meter opens at 4, ×2） | 150× | 96.09% | 10,000× |

Custom events: `collect`, `banditMeter`.

## Thumbnail

`thumbnail/StaticShift-BG.png`（1024², RGB）、`StaticShift-FG.png`（hero only, RGBA）、`Silverstars-Logo.png`。
BG mean luminance 178 / p10 78 / dark 0% at 200 px.

## Submission description

```
Base Game

Static Shift is a 5×4 video slot with 1,024 ways, paying left to right from reel 1. Banana Sacks land carrying a value of 1×–50× the bet. The Bandit is a Wild that appears on reels 2 to 5; whenever a Bandit and a Sack are on the board together, every Bandit collects the total value of every Sack, so two Bandits collect it twice.

Free Spins

Landing 3, 4 or 5 Scatters awards 10, 12 or 15 Free Spins. Sacks can carry up to 250× during the feature. Every Bandit that lands is counted on the Bandit meter: at 4, 8 and 12 Bandits, 10 extra spins are added and every later collection is multiplied by ×2, ×3 and then ×10. Scatters do not appear during the feature.

Buy Bonus

Free Spins can be entered directly for 100× the bet, or for 150× with the meter already at 4 and collections starting at ×2.

RTP & Max Win

RTP is 96.05% in the base game, 96.07% for Free Spins bought at 100× and 96.09% for Super Free Spins bought at 150×, a spread of 0.04%. Max Win is capped at 10,000× the bet in every mode.
```

## 2026-10-12 23:55 thumbnail provider logo fix

`thumbnail/Silverstars-Logo.png` was the Turf War title artwork (sha256 3980b490…), copied from `design/thumbnail/` by ship.sh. Replaced with the Silverstars studio logo (sha256 98c28678…, same file as every other game) both here and in the source `design/thumbnail/Silverstars-Logo.png`. Old files kept in `_upload_backups/StaticShift-thumbnail-1012/`. Frontend, math, cover and the other thumbnail layers untouched. No zip made. Platform NOT updated.

## 2026-10-15 post-approval review fixes

Stake's 4 open issues: (1) game-info RTP vs math — the platform was running front v9 (10-04, 94.50%) against math v3 (96.12%); math now stepped per house rule 96.05 / 96.07 / 96.09 (LUT reweight only, books unchanged) and the info table, buy menu and feature copy read each mode's own figure; (2) holding space with insufficient balance sent play requests — the space-hold loop now checks the balance before every round, and no play request is ever sent when the stake is not covered; (3) buy options grey out and cannot be chosen when the balance does not cover their price; (4) social mode wording ("PLACE YOUR BET") — fixed since 10-05 (COME AND PLAY), the reviewed front predated it.
