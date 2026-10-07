# Hacksaw whole-game transcription: what 140 shipped games actually do, in numbers

`hacksaw-style-atlas.md` says which art style each Hacksaw slot uses, judged
from the lobby. This file is the layer underneath it: what the shipped games
put on screen from the first loading frame to the free-spins outro, and how
long each beat takes. Every number was read out of the game files themselves
(`gameconfig.json`, the `.atlas` files, the spine `.json` files and the
minified `main.js`), not estimated from video.

Read it when you are about to build or judge anything the art-style atlas does
not cover: the loading screen, the intro splash, the FG intro and outro panels,
transitions, reel timing, the win ladder, big-win art, symbol and character
animation lengths, the sound set, fonts and text treatment, and the asset
inventory a finished game carries. Each section ends with **For a reskin**,
which turns the numbers into a check against our apps.

## Source, where things are, rules of use

- **The transcription.** The user's research kit `hacksaw-motion-kit`
  (Google Drive, 2026-10-06), folder `materials/style-library/`: 141 game
  folders, 1.2 GB. One of them, `slots/`, is a second copy of Le Vampire
  (same game id 2582, same 497 files), so there are 140 distinct titles. Of
  those, 135 are in the lobby survey, Dr Zappo and Le Vampire are newer slots,
  and Crash, Instant Win Games and Scratchcards are not slots. Each game
  folder holds `style.md` (the write-up, in 繁中), `style.json`,
  `shots/` (desktop and mobile loading frames, the intro splash, the base game
  early and late), `palette.png`, `crops/` (the key atlas regions cut out)
  and `states/` (that game's own state-machine source).
- **On this machine** it lives at
  `/Users/stone/stake-engine/research/hacksaw-motion-kit/` (outside every git
  repo; `$HACKSAW_STYLE_LIBRARY` overrides the path). The same kit also carries
  an expanded motion library (235 characters from 114 games) for
  `hacksaw-character-motion`. This skill does not install it.
- **In the repo**, only the numbers and names are kept:
  `references/hacksaw-style-transcripts.json` (1.7 MB, one record per title).
  `scripts/build_hacksaw_transcripts.py --write` rebuilds it from a newer kit.
  `scripts/hacksaw_styles.py` queries it:

  ```
  hacksaw_styles.py game "cash crew"                 # one title, every section
  hacksaw_styles.py game 1309 --section flow --section tiers
  hacksaw_styles.py norms --key rubberhose           # the norms below, for any subset
  hacksaw_styles.py find --sound wintier_            # who uses a cue / font / anim / skeleton / atlas / text role
  hacksaw_styles.py shots --key noir --kind splash --out /tmp/noir_splash.jpg   # local screenshots
  ```

- **Rules of use.** These are the same as the atlas's, but stricter, because
  this kit holds Hacksaw's actual art and code and not only lobby thumbnails.
  Look at it, measure it and copy the *numbers and the decisions*. Never put
  its pixels, crops, fonts, sounds or source into a repo, a prompt, an image
  model's reference slot or a build. A title named in a generation prompt
  produces a pastiche. Their font files are licensed to them; pick our own
  face that does the same job. The kit's own README says the same thing:
  research only, never distributed, never shipped.

## How to read the numbers

- **Median (p25–p75)** is over the titles that define the field. Fewer than
  half the titles put reel timing in `gameconfig.json` (54 of 140); the rest
  drive the reels from code, so the reel norms describe those 54.
- **Release order.** Game ids run roughly in release order, and several house
  rules arrived over time. The eight-step win ladder below is on 1 of 19 titles
  under id 1400 and on 34 of 34 titles from 1800 to 2200. When a norm changed,
  follow the recent titles.
- **Families** are the atlas's tags (`glossy-casual`, `painterly`, `cartoon`,
  `rubberhose`, `mono-accent`, `anime`, `action-comic`, `street`, `classic`,
  `manga`, `inkwash`, `flat`, `print`). `--key` filters by the art-direction
  catalogue key instead (`render`, `cartoon`, `noir`, `cel`, …).

---

## 1. Loading screen

**What they ship.** All of it comes from one shared Hacksaw preloader
(`PreSplash` and `ProgressIndicator` in `index.html` / `ui.min.css`). A game
supplies only its backplate art (`scaleMode: fill`, anchored centre, 85 of 105
titles) and the progress bar's geometry and colours:

| field | median | spread |
|---|---|---|
| bar width | 400 px | p25–p75 395–405; outliers 241 to 1215 (Cash Crew 724) |
| bar height | 25 px | 20–25; 12 to 65 |
| bar y offset from centre | +145 px | 142–145, so the bar sits under the logo |
| track colour behind the bar | `#000000` | 98 of 105 |
| bar colour | `#ffffff` on 18 titles; otherwise the game's single accent | Cash Crew `#fb002a`, Le Bandit `#e59a58` |

In the screenshots the frame sequence is the same on every title: a black
screen, the backplate fading in with the logo, a thin bar filling under the
logo, then the intro splash. Nothing on the loading screen animates except
the bar. The game has no art of its own there beyond the logo and a darkened
key-art plate.

**For a reskin.** One thin bar, about 400×25, under the logo, in the game's one
accent colour on black. Use no percentage text, no spinner and no tips carousel.
The backplate is the cover art, darkened.

## 2. Intro splash ("開場說明格")

**What they ship.** 113 of 140 titles have a `splash` atlas. The layout is
nearly fixed, as the contact sheet shows
(`hacksaw_styles.py shots --kind splash`):

- **The logo is top centre**, and under it sits a **volatility meter**, a row of
  five skull or bolt pips (a `volatility` region on 104 of 140 titles).
- **There are three panels in a row** (25 of 26 titles with a splash config; one
  has 4). Each panel is a framed picture on top (a/b/c regions, about 837×924 at
  2048 atlas scale), with a header and two to four body lines under it. The
  panel spacing `xSpacing` has a median of 1.5 panel widths.
- **The panel order tells a story.** Panel 1 is the base mechanic, panel 2 the
  bonus games, panel 3 the max win as a huge number (`max_win_uc` is a header
  on 20 of 26). The third panel's picture is the max-win figure drawn as
  lettering ("15 000x", "10 000x").
- **A "HIDDEN EPIC BONUS" badge** is pinned to the top-right corner of a panel
  (86 of 140 titles carry an `epic` region).
- **"CLICK TO CONTINUE"** sits at the bottom centre, in the display face, and
  is the only call to action.
- **The panel frame is an object from the world, never a generic card.** Cash
  Crew uses vault doors with bolts, Pray for Three church-window arches on a
  tower, Le Pharaoh papyrus scrolls, Bullets and Bounty torn wanted posters,
  Toshi Ways Club 1990s OS windows, Cloud Princess gilded arches, Chaos Crew 2
  sticker-bombed CRT cards, and Densho torn rice paper.
- **The backdrop is the base-game background, dimmed**, with the cast often
  standing in it (Miami Mayhem's batter at the left edge).

Text, from `gameconfig.json → style.text`:

| role | size median (p25–p75) | outlined | colour |
|---|---|---|---|
| `splashHeader` | 50 (35–60) | 53 of 100 | white on 26, black on 6 (light parchment frames) |
| `splashBody` | 35 (32–40) | 49 of 101 | white, or black on paper |
| `splashFooter` / `clickToContinue` | 70 (55–70) | 50 of 61 / 23 of 42 | white |
| `splashTopHeader` (optional "HACKSAW GAMING PRESENTS") | 120 (90–120) | 0 of 6 | — |

- **Header and body use the same font on 76 of 100 titles.** A Hacksaw game
  usually ships **one** display face (median one font per title, p75 two). The
  header is 1.43× the body (p25–p75 1.11–1.5): hierarchy comes from size and
  caps, not from a second family.
- Text is usually set in uppercase (`*_uc` string keys). Tracking sits at
  about −1 (tight) when it is set at all.

**For a reskin.** Three panels: mechanic, bonus, max win. Logo and volatility
pips go above, and one CLICK TO CONTINUE below. Draw the panel frame as an
object from the game's world. One display face for header and body, header
about 1.4× body, uppercase, outlined or shadowed only if the backdrop is busy.
If our splash uses two families, a generic rounded card or more than three
panels, it is off-norm. Splash `after()` waits are 0.2 s (70 of the titles'
distinct waits), so the panels do not dawdle in.

## 3. FG intro and outro panels

**What they ship.** These are a separate atlas (`fs_splash`, `splash_bonus`,
`bonus_splash` and so on) plus the `feature*` text roles. Three conventions
recur:

- **The panel is again an object from the world, and it is diegetic.** Le
  Bandit's free spins are announced by two pinned polaroids and a camera.
  Cash Crew's run on a smartphone with cables, using green monospace text
  (`featureBody: cascadia_code 35 #00ff44`, a heist hacker's screen). Magic
  Piggy's is a gold-framed card, and Death Becomes You's a blood-lettered
  "DROP DEAD".
- **The words that matter are painted art, not live text.** "TOTAL WIN" is an
  atlas region in the game's lettering on 82 of 140 titles (Toshi's adds
  合計勝利, Chaos Crew 2's is spray paint). "+2 FS" retrigger badges are
  pre-drawn per count on 52 titles (`retrigger_2`, `retrigger_4`, … one image
  each). Numbers are **bitmap digit fonts**: `digits` on 121 titles,
  `digits_countup` on 120, and a median of **five** digit atlases per game
  (gold, silver, bronze, multiplier, total, countup, clock…). Every context
  that shows a number gets its own drawn numerals.
- **Text sizes are big.** `featureHeader` 90 (70–110), `featureBody` 50 (33–60),
  `featureInfo` ("N FREE SPINS PLAYED") 50, `featureFooter` (CLICK TO
  CONTINUE) 55 (50–70). `retrigger` "+N SPINS" is 220 (200–250) and outlined
  on 10 of 12. `featureDigits` is 140. The footer is the most consistently
  outlined role (72 of 87).

**For a reskin.** Our FG intro and outro should be an object from the theme
(a dossier, a ticket, a wanted poster, a phone), not the shared modal. "TOTAL
WIN", "FREE SPINS" and "+N" should be drawn lettering. The counting number
should be a drawn digit set or at least the display face with outline. Check
retrigger: a separate +N badge, 200 px or more, outlined.

## 4. Transitions and flow

**The state machine** (class names from each `main.js`). Every title has
`InitState → SplashState → IdleState → (SpinState | DropState | RevealState) →
ResultState`, and the bonus path is `FeatureEnterState → Freespin*State →
FreespinResultState → FeatureExitState`. `FeatureEnterState` is on 129 titles,
`FeatureExitState` on 128. Cascading games add `RedropState` and `ReactState`
(45 and 43). What happens inside:

| beat | what the code does | numbers |
|---|---|---|
| scene dim behind a panel | colour-tint the `reels` and `background` scenes to 0.4 grey | tween 0.5 s (`TransitionHandler`, `new Ta(tint, .5)`; read from minified code); 0.35 s inside feature enter/exit |
| feature enter | flash or alarm (Cash Crew: four steps of red `(1,.3,.3)` / white, 0.35 s tween + 0.15 s hold each, after a 0.3 s wait), then `game/enterMode`, then the FG panel | waits: 0.5 s (33), 0.2 (27), 0.1 (25); 1.5 s on 5 titles |
| feature exit | total-win panel, count, click, then `enterMode` back to base | the 0.5 s wait dominates (65) |
| result | symbol wins, then `game/showLines` and `casino/updateWinField`, then the next state | waits of 0.2 / 0.5 / 1.5 s; 1.5 s is the cascade pause (27 titles) |
| spin | 1.5 s (28 titles) is the fallback reel-stop timeout, not a pause | — |
| scenes shown | `show:reels`, `show:splash`, `feature_splash`, `transition` (33), `show:character` (22), `show:countup` (13) | — |

- **Transitions are short.** The most common `after()` waits in splash,
  enter and exit states are 0.1 to 0.5 s. Only 5 titles wait longer than
  2.75 s anywhere in them (the longest is 4.75 s). A dedicated
  transition skeleton (`transition`, `fire_transition` and so on) exists on 26
  titles. The rest cut through a tint and fade.
- **Feature enter is announced to the cast.** Events like
  `game/raccoonWelcoming`, `game/raccoonFuming`, `game/raccoonDelighted` fire
  from the states (Le Bandit), so the character reacts to the beat. It is not
  just idling.
- **Ambience switches with the mode.** `game/startAmbianceBonus`,
  `game/stopAmbianceBase` and `game/startAmbianceEpicBonus` fire in
  feature enter (Le Bandit).

**For a reskin.** Dim the board to about 40% under any panel, over about
0.5 s. Panel-in waits of 0.1 to 0.5 s; anything over 1.5 s needs a reason.
Fire a cast reaction and an ambience switch on feature enter and exit. Our
two-cast rule (MG and FG figure) fits this: the FG figure arrives at
`FeatureEnter`.

## 5. Rhythm

### 5.1 Reel timing (`gameconfig.json → reel.spinRevealProps`, 54 titles)

| field (seconds unless noted) | normal | turbo | superTurbo |
|---|---|---|---|
| `speed` (symbols/s) | **18** (18–22) | **30** (28–40) | **75** (50–100) |
| `startDuration` (wind-up) | 0.4 (0.2–0.4) | 0.2 (0.1–0.2) | 0.1 |
| `reelDelay` (**start** stagger per reel) | **0.025** (0.025–0.09) | 0.025 | 0 |
| `stopDuration` (bounce) | 0.2 (0–0.25) | 0.1 | 0 |
| `reelStopDelay` (**stop** stagger per reel) | **0.2** (0.15–0.25) | **0.1** (0.05–0.15) | 0.05 (8 titles), else 0 |
| `stopSpeed` | 18 (12–20) | 15 | 11 |
| `presentDelay` (stop → present wins) | 0.5 | 0.15 | 0 |
| `attentionSpeed` (anticipation reel speed) | 13 (9–20), about 0.7× speed | 20 | — |
| `attentionStopDuration` | 1 (0–1.75) | 0 | — |

- **The reels start almost together and stop one by one.** The start stagger
  is 25 ms, and the stop stagger is 8× that at 200 ms. The Luxe (`reelDelay`
  0.2), which our 2026-08-25 retime copied, is an outlier: only 8 of 54
  titles start-stagger 0.15 s or more.
- **Turbo keeps a stop stagger** (0.1 s), and superTurbo is the only speed
  that lands the board as one block. Turbo is 1.67× normal speed (median of
  the per-title ratio).
- **Anticipation slows the reel** (attention speed about 0.7× spin speed,
  some titles 0.4×) and holds it 1 to 1.75 s. It is never a stop-and-wait.
- The Le series is one template: speed 18 to 22, start 0.2 to 0.5, start
  stagger 0.025 to 0.05, stop stagger 0.1 to 0.25, attention 18 to 24.

### 5.2 Win presentation ladder (`TierDef`, 130 titles)

| threshold × bet | label | presentation ms (69 titles, the modern default) |
|---|---|---|
| 0 / 1.01 / 2 | — | **0**: symbol animation and lines only, no count-up |
| 10 | (no GFX) | **1500**: count-up only |
| 20 | BIG WIN GFX | **1800** |
| 50 | MEGA WIN GFX | **3600** |
| 100 | SUPER MEGA WIN GFX | **3600** |
| 250 | EPIC WIN GFX | **7000** |

- **43 titles stop at the 10× rung** (`0 · 1.01 · 2 · 10:1500`) with no
  big-win GFX at all. They are the older half of the catalogue: the median
  id is 1452 against 1938 for the eight-rung titles, across every family.
  Cash Crew is one: its big wins ride on the game's own feature art.
- The eight-rung version is the house standard from id 1800 on (34 of 34
  titles between ids 1800 and 2199).
- Under 10× costs zero present time on every title.
- The big-win skeleton (`countup_tiers` on 66 titles, `big_win`, `win_tiers`)
  plays per tier: `trigger` 0.9 s (0.67–1.33), then an `idle` loop of 2.0 s
  (1.67–2.67) that holds for the rung's duration, then `remove` 0.5 s
  (0.33–0.67). Count-up text is `winAnimationTier` 170, outlined on 14 of 15.

### 5.3 Symbol and character animation lengths (spine)

| animation | median (p25–p75) |
|---|---|
| symbol `land` | **0.5 s** (0.5–0.57) |
| symbol `win` | **1.0 s** (0.93–1.0) |
| symbol `remove` (cascade pop) | **0.43 s** (0.33–0.6) |
| special (scatter, wild) `idle` loop | 1.5 s (1.33–1.67) |
| scatter `land` | 0.5 s (0.43–0.67) |
| character `idle` loop | **2.9 s** (1.7–3.7) |
| character reaction (`win_1..3`, `loosing_1..2`, `welcome`, `laugh`, `dance`) | **2.1 s** (1.7–2.9) |
| ambient loops (rain 0.67, smoke 30.5, light rays 26.8 in Cash Crew) | slow layers 25 to 30 s; fast ones under 1 s |

- **The symbol skeleton is one per game** (`symbols` on 70 titles), with
  animations named `lows/low_N/{setup,land,win,remove}`,
  `highs/high_N/{…}` and `specials/{fs,wild}/{…,idle}`. These name every state
  a symbol can be in, which makes a good checklist for ours.
- **Character skeletons are rich.** They have a median of 71 bones (53–134)
  and a vocabulary of `idle`, `idle_blink`, `idle_look_at_reel`, `welcome`,
  `win_1..3`, `loosing_1..3`, `sus_scratch`, `reel_highlight`, `laugh`,
  `dance_start/idle/end`, and an `epic_bonus/*` copy of the set for the bonus
  costume. The Le series shares one set (`lost_mustache`, `sus_scratch`,
  `loosing_3_stomp_on_hat` …). Losing has animations too, not only winning.
- Spine 4.0.64 is the house runtime (910 skeletons; 229 on 3.8.99).

### 5.4 Sound

| | median |
|---|---|
| cues per title | **106** (84–126; 10 to 174) |
| layered music stems | **12** (8–13) |

- **The music is layered by intensity, not a playlist.** It runs
  `music_level_0..3` for base and `music_bonus_level_0..3` per bonus
  (`music_bonus_2_*`, `music_bonus_3_*`, `music_epic_*`). These are four stems
  of one track, and levels rise with the action (124 titles have
  `music_level_0`).
- **The house cue set every title shares** (number of titles):
  `win_end_bet_low` / `win_end_bet_over` (137), `win_count` (122),
  `win_end_high` (91), `wintier_1..4` (92), `betlevel` (106, the
  bet-change tick), `click` (97), `intro` (65), `enter` / `exit` (61),
  `ambience` (63+), `dropgrid_in/out` (83), `dropswoosh_in` (51),
  `total_win_1/2` (73), `reel_stop` (43, or `reel_stop_1..4` per reel),
  `symdrop_1..4`, and `reeldrop_1`.
- **Scatter landings escalate.** `bonus_landed_1..5` (49) is one cue per
  scatter count, then `bonus_triggered_1..3` (36).
- **Win end is judged against the bet**: `win_end_bet_low` when the win is
  under the bet, `win_end_bet_over` when over, and `win_end_high` for big.
- The theme's own cues come on top (Cash Crew: cash registers, timer beeps,
  sirens, metal; Le Bandit: `raccoon_raging_*`, `fuming_*`, `infuriated_*`).
  These are named after what the character feels, which lets the state
  machine fire them by mood.

**For a reskin.** Compare our `SoundEffectName` list against the house set
above. The usual gaps are four music stems per mode, a per-scatter-count land
cue, `betlevel`, and low/over/high win-end stings. A title with fewer than
about 80 cues is under the house norm.

## 6. Style: fonts, outlines, palette

### 6.1 Type

- **Usually one display face per game, chosen for the theme** (median one font
  per title). The most reused faces: `alphakind` on 23 titles (the Le series
  and the rubber-hose games), `jockeyone_regular` 8, `avega_italic` 6,
  `titanone_regular` 5, `chinese_rocks_regular` 4 (westerns),
  `staatliches_regular` 4, `arco` 4 (rubber-hose), `norse_bold` 3 (Zeus,
  Ymir), and `old_newspaper` 3 (westerns). Mood fonts are kept for one role:
  Cash Crew's `cascadia_code` hacker green is only `featureBody`.
- **Outlines** are on about half the splash text and most feature text
  (footer 72 of 87, retrigger 10 of 12, tier text 14 of 15), with width 1 to 2
  at size 32 and up to 5 to 15 on the 170 to 240 px tier and header text.
  A second outline (`outlineColor2`, 15 roles) gives the arcade double stroke.
  Drop shadows appear on only 15 of 100 splash headers.
- **By family:** painterly uses distressed westerns or horror faces
  (`chinese_rocks`, `old_newspaper`, `headbanger`, `the_macabre`). Cartoon
  uses `alphakind` (16 of 20). Rubber-hose uses `alphakind` / `arco` / `sobread`.
  Glossy uses rounded heavy faces (`super_corn`, `lemonmilk_bold`). Noir uses
  serif or slab display faces (`pirataone`, `rye`, `mason_serif`,
  `cormorant`). Ink wash uses brush script (`hvd_edding`, `yozakura`).

### 6.2 Palette, measured per family

These are area-weighted means of each title's atlas regions (top six colours
per region × region area), with medians over the family's titles. `sat` and `val`
are HSV 0–1, `dark` is the share with V < 0.2, and `grey` the share with
S < 0.12. Use them as targets when gating a style frame. `check_style.py`
measures different things (colours95, soft, chroma), so compare like with
like by running `hacksaw_styles.py game <title> --section palette` on a
reference.

| family | titles | background sat / val / dark / grey | splash art sat / val / dark / grey |
|---|---|---|---|
| glossy-casual | 27 | 0.55 / 0.50 / 0.07 / 0.02 | 0.64 / 0.66 / 0.01 / 0.01 |
| painterly | 25 | 0.39 / 0.52 / 0.18 / 0.05 | 0.48 / 0.39 / 0.29 / 0.04 |
| cartoon | 20 | 0.44 / 0.60 / 0.02 / 0.03 | 0.54 / 0.69 / 0.01 / 0.02 |
| rubberhose | 13 | 0.39 / 0.35 / 0.22 / **0.47** | 0.22 / 0.37 / 0.26 / **0.51** |
| mono-accent (noir) | 13 | 0.23 / 0.38 / 0.30 / 0.32 | 0.29 / 0.36 / 0.35 / **0.63** |
| anime | 11 | 0.44 / 0.60 / 0.07 / 0.07 | 0.51 / 0.51 / 0.01 / 0.09 |
| action-comic | 9 | 0.46 / 0.51 / 0.15 / 0.13 | 0.54 / 0.57 / 0.12 / 0.02 |
| street | 7 | 0.20 / 0.21 / **0.47** / **0.61** | 0.46 / 0.39 / 0.32 / 0.07 |
| classic glossy | 6 | **0.81** / 0.54 / 0.14 / 0.00 | 0.63 / 0.67 / 0.00 / 0.01 |
| manga | 3 | 0.26 / 0.24 / **0.59** / **0.70** | 0.28 / 0.46 / 0.17 / 0.59 |
| ink wash | 1 | 0.34 / 0.61 / 0.10 / 0.12 | 0.09 / 0.83 / 0.01 / 0.83 |

What the table says:

- **The 2D families get their identity from grey and black, not from hue.**
  Rubber-hose, noir, street and manga run 32 to 70% greyscale area and 22 to
  59% near-black. Glossy and cartoon run under 3% grey. A "noir" style frame
  that measures grey 0.1 is a render with a filter, not noir.
- **Street is dark backgrounds with saturated art on top.** Its background is
  0.21 val with 61% grey, while the splash art jumps to 0.46 sat. The board
  pops because the wall behind it is dead.
- **Cartoon is bright and clean:** almost no near-black area (2%) despite the
  black outlines, because the lines are thin against large flat fills.
- **Painterly splash art is dark** (val 0.39, 29% near-black). That is the
  dramatic low-key lighting, not murk.

### 6.3 Layout (from the base-game shots and the 3D cameras)

- **A perspective camera at `pos(0,0,10) fov 45` or `pos(0,0,5) fov 45` is on
  every title.** The board is a flat plane facing it, so layout is in world
  units and portrait is a re-position, not a re-scale (`orientation_strings`
  per title).
- **The board is centred and takes about half the width on desktop.** The
  logo sits either above the board as its header (Le series, Death Becomes
  You, Jaws of Justice) or in the top-left corner (Miami Mayhem, Bullets and
  Bounty, Magic Piggy, Pray for Three). The cast stands full height at one or
  both sides, never on the board.
- **The reel frame is themed art** (`frame` regions on 54 titles: blood-red
  gothic arch, neon sticker frame, carved stone). The cell backs are darker
  than the background so the symbols read.
- **The bet bar is the shared Hacksaw bar** (BUY BONUS disc bottom-left,
  balance, bet with arrows, round spin button, autoplay) on every title, and
  only its accent changes.

## 7. The asset inventory of a finished Hacksaw game

| | median (p25–p75) |
|---|---|
| asset files | 441 (385–535) |
| asset size | 111 MB (88–125) |
| atlases | 13 (9–17), pages 2048² (962 pages) or 512² digits (444) |
| spine skeletons | 8 (5–11) |
| digit atlases | 5 |
| sound cues | 106 |

The atlases most titles carry form a checklist: `digits` (121), `digits_countup` (120),
`misc` (113), `splash` (113), `backgrounds` (62) plus `bonus_backgrounds`
(11), `symbols` (39) or one atlas per high, `tiers` (33), per-context digit
sets (`digits_gold/silver/bronze/crit/multiplier/total`), `reels` or `reel`
(frame), `coin_animations` / `spinning_coin`, `fs_splash`, `retrigger`,
`transition_backgrounds` (9), and `foreground` (8; the near layer that
overlaps the board edge). The skeletons most titles carry: `symbols`,
`countup_tiers`, `total_win`, `character`, `fs_attention` (the
scatter-anticipation glow), `reel_attention`, `logo`, `wild`, `transition`,
and `square_ploff` (the cascade pop).

**For a reskin.** Before submission, walk this list against the new game:
every row we lack is a place a reviewer sees "Reused assets" or "Low quality
assets". The common gaps in our apps have been a per-context digit set, a
painted TOTAL WIN, a themed retrigger badge, the scatter-attention glow, an
animated logo, and the foreground layer.

## 8. Our apps against these norms (2026-10-06 reading of CapoNostra)

| | Hacksaw norm | CapoNostra today (`src/game/constants.ts`, `winLevelMap.ts`) |
|---|---|---|
| reel start stagger | 0.025 s (0.025–0.09) | `reelSpinDelay` 200 ms (from The Luxe, an outlier) |
| reel stop stagger | 0.2 s normal, 0.1 s turbo | about 280 ms, falling out of the padding; turbo staggers |
| anticipation | slow to about 0.7× and hold 1 to 1.75 s | 0.5× speed, 5× padding: in line |
| present delay | 0.5 s normal, 0.15 turbo | — |
| win ladder | 10×:1.5 s, 20×:1.8, 50×:3.6, 100×:3.6, 250×:7.0 | 0 to 15× is 0 ms, 15 to 30× 1.8 s, 30 to 50× 3.6, 50 to 100× 3.6, 100×+ 7.0, max 9.0 |
| symbol win / land / remove | 1.0 / 0.5 / 0.43 s | win hold 970 ms: in line |

Two differences are worth raising with the user before changing anything (do
not retime a shipped game on this file alone):

1. **Start stagger.** Most Hacksaw titles start all reels within about 0.1 s
   and stagger the stop. Ours start-staggers by 200 ms, copied from The Luxe,
   which is one of the five titles that do.
2. **The 10× rung.** Hacksaw counts 10 to 20× up for 1.5 s without big-win
   art. We present nothing until 15×. This is a small gap, but it is the most
   common win size that gets a count-up.

## 9. Per-family presentation idioms (from the splash and base shots)

- **Cartoon (Le series and similar).** Splash panels are props from the
  setting (papyrus scrolls, pinned polaroids). The mascot reacts on every
  beat (welcome, fuming, delighted, sus_scratch). The ladder is the 8-rung
  version, with `alphakind` throughout. The background is a painted setting
  with the same outline weight.
- **Rubber-hose (Pray for Three, The Count, Red Rascal).** The UI is
  greyscale; colour is reserved for one accent per element (Pray for Three's
  cyan logo). Panels are church or tower architecture. Two cast figures
  flank the board. Its splash art is the least saturated of any family with more than one
  title (sat 0.22).
- **Noir (Cash Crew, Death Becomes You, Reign of Rome).** Black, white and
  one red. The frame lights up red on the board (Death Becomes You). The
  splash frames are vault doors or tombstones. Five of the 13 stop at the
  10× rung and carry the drama in feature art instead. Fonts are serif or slab.
- **Street (Chaos Crew).** Dead-dark wall, neon sticker frame, saturated
  symbols, two grotesque mascots. The splash panels are CRT or sticker cards
  at slight angles.
- **Manga (Dark Spiral, Slayers Inc).** Screen-tone black and white. White
  panels with a black header bar. A red title and a red loading bar are the
  only colour.
- **Painterly (Bullets and Bounty, Cursed Crypt).** Low-key dramatic lighting.
  Torn-poster and stone frames. Distressed western or horror type. A
  full-height painted cast at the side.
- **Glossy casual (Magic Piggy, Marlin Masters).** Bright, saturated, gold
  frames, rounded heavy type, with no near-black and no grey.
- **Print (Toshi Ways Club).** Paper-grey halftone backdrop, flat orange
  accent, OS-window panels, a bilingual TOTAL WIN wordmark.
- **Ink wash (Densho).** Rice-paper splash, brush-script type, a white
  loading bar on paper. This is the one family whose palette is light (val
  0.83).

Run `hacksaw_styles.py shots --key <key> --kind splash` and `--kind base_late`
to see these for any family. Then `game <title>` gives the numbers behind one
of them.
