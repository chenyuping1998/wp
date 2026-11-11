# Pragmatic Play: 669 slots by art style, and 11 games transcribed frame by frame

`hacksaw-style-atlas.md` and `nolimit-city-styles.md` cover the two studios whose
look we borrow from. This file covers the studio whose look we are most likely
to drift into by default. Pragmatic Play (PP) ships more slots than anyone
(669 titles on its site on 2026-10-12, about 100 a year since 2023), and its
house look is what an image model produces when nobody asks for anything else:
a painterly semi-real god or animal beside a bright board of glossy gems.

Use it for three things:

1. **The lobby test.** Before shortlisting a style, check whether PP already
   owns it (`pp_styles.py list --theme <word>`, `sheet --family <f>`). A style
   PP has shipped 50 times reads as PP, not as us.
2. **The whole-session timing.** PP's 11 flagship titles were captured from
   load to INFO in one sitting each, with every server request timed. That
   gives the beats outside the reels that Hacksaw's file numbers do not: how
   long the FG entry takes on screen, what the total-win panel says, how dark
   the scene gets behind it.
3. **The economy around the math.** Buy prices, ante multipliers, max wins
   and RTP per mode, read out of each game's own init response.

## Source, where things are, rules of use

- **The kit.** The user's Google Drive folder 「PP抄錄」 (shared 2026-10-12),
  built by the user's own capture scripts (`scripts/pp_*.py` in the kit:
  sitemap scrape, Chromium capture, API replay, contact sheets).
  `catalog/games.json` is the 669-title catalog with the site's blurb and
  RTP. `games/<symbol>/` holds the 11 deep captures, each with `sheet.jpg`
  (a contact sheet by phase), `frames/NNN_<phase>_<seconds>.jpg` (saved only
  when the screen changed, so the file names are the rhythm),
  `timeline.json` (every click and request with times) and `init.txt` (the
  doInit response). The kit's own README says capture of the other 27
  representative titles, the 665-title quick scan and the 300-spin volatility
  sampling (`pp_spins.py`) were not run.
- **On this machine** it is unpacked at
  `/Users/stone/stake-engine/research/pp-transcripts/unpacked/PP抄錄/`
  (outside every git repo; `$PP_STYLE_KIT` overrides). The original zips sit
  next to it in `dist_upload/`. Lobby thumbnails cache in `~/.cache/pp-styles`.
- **In the repo**, only names and numbers:
  `references/pp-slots.json` (catalog, one row per title, with family tags and
  thumbnail colour numbers) and `references/pp-style-transcripts.json` (the 11
  deep titles). `scripts/build_pp_transcripts.py --measure --write` rebuilds
  both from a newer kit and keeps the hand-made family tags.
  `scripts/pp_styles.py` queries them (see the end of this file).
- **Rules of use.** The same as the Hacksaw and Nolimit files. Look, measure,
  copy the *numbers and decisions*. Never put PP's pixels, frames, logos or
  copy into a repo, a prompt, an image model's reference slot or a build. A PP
  title named in a prompt yields a PP pastiche, and the house look is exactly
  what `art-direction.md` tells us to move away from.

## How the families were tagged

Every thumbnail was looked at on numbered contact sheets (48 per sheet) and
given one family. The catalogue key is the `art-direction.md` entry the family
maps to.

| family | key | what it looks like | count |
|---|---|---|--:|
| `semireal` | render | painterly semi-real people, gods and animals with rim light, gold frame (Gates of Olympus, Wolf Gold, John Hunter) | 247 |
| `cartoon` | cartoon | mascot cartoon: big heads, big eyes, thick shapes, smooth 3D-ish shading (Big Bass, The Dog House, the POP line) | 226 |
| `glossy` | render | glossy objects with no cast: candy, gems, fruit, gold statues, title-only art (Sweet Bonanza, Sugar Rush, 5 Lions) | 132 |
| `classic` | render | fruit-machine 7s, bars, cherries, flames (Hot to Burn, Fire Hot, Shining Hot) | 34 |
| `anime` | cel | the Starlight Princess line and Idol Pop Fever | 9 |
| `photo` | render | photographic people, 2016–2020 only (Hockey League, Romeo and Juliet) | 5 |
| `non-slot` | – | baccarat, blackjack, roulette, scratchcards, crash games, one placeholder | 16 |

"Released" below is the month the thumbnail was uploaded to the site's
WordPress, a release proxy. 2016 holds the site's first bulk upload, so a few
older titles count as 2016.

## The distribution

**There is no 2D medium in PP's catalog.** All 653 slots are rendered: no
woodcut, engraving, screenprint, ink wash, noir, rubber-hose, street, collage
or flat vector, and only 9 anime titles. Every 2D lane in `art-direction.md`
is open against PP. Hacksaw has 2D in about 40% of its catalog and Nolimit has
its caricature and grime lines. PP has nothing to separate from by medium; we
separate from PP by having one at all.

The mix moved from semi-real to cartoon:

| uploaded | slots | semireal | cartoon | glossy | classic | anime |
|---|--:|--:|--:|--:|--:|--:|
| 2016–18 | 67 | 54% | 13% | 19% | 7% | 0% |
| 2019–21 | 124 | 47% | 24% | 20% | 7% | 1% |
| 2022–23 | 169 | 35% | 34% | 19% | 9% | 2% |
| 2024 | 96 | 31% | 42% | 22% | 4% | 1% |
| 2025 | 117 | 27% | 45% | 26% | 0% | 2% |
| 2026 (to Oct) | 80 | 40% | 45% | 14% | 0% | 1% |

Two lines drive the cartoon rise: the Reel Kingdom fishing series (36 of 39
fishing titles are the same fisherman and bass, 2020 onward) and the 2025–26
"POP" line (titles carry a pink POP badge: Lucky Tiger, Touro Sortudo, Lucky
Mouse, Plushie Wins, Gates of Olympus POP), a round, soft, 3D-toy cartoon in a
pink rounded-rectangle frame aimed at the PG Soft market.

### Theme to family

| theme (parsed from name and blurb) | PP titles by family | takeaway |
|---|---|---|
| money, heist, banks (74) | cartoon 33, semireal 23, glossy 13, classic 5 | Crime as caricature mascots (Cash Patrol, Empty the Bank). Nobody at PP draws crime in a print medium; pulp comic, noir and letterpress are open. |
| Asian luck (68) | semireal 24, glossy 23, cartoon 19 | Gold statues, lion dance heads, Cai Shen. Woodblock print and ink wash are open (Hacksaw has 1 ink wash title). |
| retro, 7s, fire (54) | cartoon 20, classic 16, glossy 13 | The fruit-machine commodity look. |
| animals, safari (40) | semireal 28, cartoon 9 | Wolf Gold's rim-lit painted animal is the template. |
| fishing (39) | cartoon 36 | One series. Anything fishing-themed is compared to Big Bass. |
| Egypt (32), Greek myth (29), Norse (12) | semireal 25 / 27 / 12 | Myth is painted semi-real, almost without exception. Flat relief, red-figure pottery, papyrus line art and woodcut runes are all open. |
| candy (28) | glossy 25 | Sweet Bonanza owns glossy candy. |
| horror (22) | semireal 12, cartoon 9 | No B&W, no monochrome. Hacksaw owns that lane instead. |
| western (19) | semireal 16, cartoon 3 | Woodcut and wanted-poster letterpress are open here too (Deadwood Express's lane). |
| dogs and cats (19) | cartoon 17 | The Dog House. |
| Irish (15), Christmas (12) | cartoon 10 / 9 | Mascot cartoon. |

### Measured numbers (lobby thumbnails, 339×180)

`check_style.py` definitions: `colors95` is how many 4-bit colour bins hold 95%
of the pixels, `soft` is the share of pixels on a gentle luminance slope,
`achromatic` the share with HSV saturation under 0.15.

| family | n | colors95 (median, p25–p75) | soft | sat | achromatic |
|---|--:|---|--:|--:|--:|
| semireal | 247 | 663 (461–892) | 32% | 0.51 | 27% |
| cartoon | 226 | 827 (640–1044) | 34% | 0.50 | 27% |
| glossy | 132 | 755 (524–986) | 33% | 0.54 | 28% |
| classic | 34 | 492 (354–672) | 33% | 0.64 | 25% |
| anime | 9 | 1026 | 34% | 0.44 | 31% |

The thumbnails include logo and gold frame, so these are not symbol numbers.
What they show is that PP's families do not differ in colour behaviour: every
family sits at 500–1000 bins and about a third soft gradient. The family
changes the subject, not the rendering. In the deep captures the base game
measures colors95 790–2050 and saturation 0.37–0.77 with only 2–35% grey
pixels (`pp_styles.py norms`); compare Hacksaw's monochrome games at 83–98%
grey. A board that measures like this reads as PP whatever the subject.

## What transfers, and what to avoid

PP is the reference for **flow and economy**, not for style.

1. **Copy the flow, not the look.** PP's session structure (one-tap intro,
   left-side buy panel, wipe, CONGRATULATIONS panel, recoloured FG, total-win
   panel) is what players expect from a buy-feature slot, and Stake's players
   play PP. Our games should feel as smooth to operate. Their art should not
   look like it.
2. **Every 2D medium is a differentiator against PP**, and the strongest are
   the ones Hacksaw has not taken either: woodcut, engraving, constructivist,
   Art Nouveau, gouache picture book, cut paper (see the Hacksaw atlas's open
   lanes). A rendered myth or animal theme is the most crowded square in the
   whole market: 27 Greek, 25 Egyptian, 28 animal titles at PP alone.
3. **The semi-real default is the failure case.** `art-direction.md`'s
   contrast option ("glossy semi-real") is PP's house style in two families,
   247 + 132 titles. When a style frame comes back looking like Gates of
   Olympus, it has failed the lobby test regardless of how good it is.
4. **The FG should change the scene, not only the HUD.** Five of nine PP FG
   rounds recolour the whole scene (day to dusk, pink to purple, blue to
   violet), and five darken it by 0.03–0.19 in mean luminance (median 0.43
   base to 0.38 FG). Hacksaw does
   the same with separate FG backdrops. Our two-backdrop rule
   (`two-cast-mg-fg`) is the same idea.
5. **The panel copy is fixed, the plate is themed.** PP never rewrites
   CONGRATULATIONS / YOU HAVE WON / N / FREE SPINS / PRESS ANYWHERE TO
   CONTINUE. Only the plate's material changes (gold wings for Olympus, a
   candy frame for Sweet Bonanza, a fire shield for Zeus vs Hades, planks for
   Big Bass). That is a cheap way to make the panel belong to the world, and
   it is what our review tags ask for (`review-findings.md`: painted plate, not
   a gradient box).

---

## Part 2: the 11 deep captures

| title | family | board | RTP | max win | buy (x bet) | ante | load s | spin s (median) | FG award / spins / total s |
|---|---|---|---|---|---|---|--:|--:|---|
| Gates of Olympus | semireal | 6x5 pay anywhere | 96.50 | 5000 | 100 | 1.25 | 26.5 | 2.61 | 15 / 25 / 114 |
| Gates of Olympus 1000 | semireal | 6x5 | 96.49–96.50 | 15000 | 100 | 1.25 | 5.8 | 2.12 | 15 / 32 / 149 |
| Gates of Olympus 2500 | semireal | 6x5 | 96.49–96.52 | 25000 | 100, 250, 500, 1250 | 1.25, 2.75, 5.5, 20, 250 | 6.6 | 2.29 | 15 / 27 / 154 |
| Zeus vs Hades – Gods of War | semireal | 5x5 lines | 96.01–96.14 | 15000 | 75, 150, 300, 300 | – | 4.6 | 2.73 | 10 / 11 / 73 |
| Wolf Gold | semireal | 5x3, 25 lines | 96.00 | – | none | – | 4.8 | 2.84 | no buy |
| Sweet Bonanza 1000 | glossy | 6x5 pay anywhere | 96.50–96.55 | 25000 | 100, 500 | 1.25 | 8.7 | 2.83 | 10 / 17 / 63 |
| Sugar Rush | glossy | 7x7 cluster | 96.50 | 5000 | 100 | – | 7.1 | 2.90 | 10 / 25 / 122 |
| Fruit Party | glossy | 7x7 cluster | 96.47 | 5000 | 100 | – | 3.6 | 3.29 | 10 / 26 / 119 |
| Big Bass Bonanza 1000 | cartoon | 5x3, 10 lines | 96.51 | 20000 | 100, 450 | 1.5 | 13.4 | 2.90 | 10 / 21 / 146 |
| The Dog House Megaways | cartoon | 6x7 megaways | 96.55 | – | 100 | – | 6.0 | 1.60 | stopped at the FG pick screen |
| Starlight Princess | anime | 6x5 pay anywhere | 96.50 | 5000 | 100 | 1.25 | 4.3 | 2.25 | 15 / 30 / 133 |

FG "spins" counts server requests, which include retriggers and the extra
spins of a retrigger, so it exceeds the award. Spin timings of about 38.5 s
are the capture giving up on an autoplay prompt or a stuck overlay and are left
out of every median. Panel holds are capped near 6 s because the capture
clicks any panel after 6 s with no server request; real players hold longer.

### 1. Loading

Two kinds. Most titles show the PRAGMATIC PLAY wordmark centred on black with
a thin progress line (Wolf Gold, Sugar Rush, Starlight Princess, Fruit Party,
Zeus vs Hades, Sweet Bonanza 1000, both newer Olympus titles: lum 0.01). Big
Bass shows the REEL KINGDOM wordmark on a dark blue gradient (the sub-studio).
The original Gates of Olympus is the outlier: it loads with its intro splash
already on screen and animates the board for 24 s (21 frames) while assets
stream. Median load 6.0 s (4.6–8.7) on a desktop line, then one click.

**For a reskin.** Our loading screen is ours to design (Hacksaw's norm is a
400×25 bar under the logo). PP's black wordmark screen is the minimum; do not
go below it, and do not exceed about 8 s on desktop before something moves.

### 2. Intro splash (`pp_styles.py shots --phase intro`)

One full-screen slide at a time, not three panels side by side:

- The **board itself, at about 70% scale, playing the mechanic** (multiplier
  orbs landing, tumbles, cells lighting up) on the left two thirds. The splash
  is a demo of the game, not an illustration of it.
- The **cast on the right** (Zeus, the princess, the fisherman, the gumball
  machine). The logo sits top right or top centre.
- One **caption line** at the bottom in the logo's face: WIN UP TO 5000X BET,
  SYMBOLS PAY ANYWHERE ON THE SCREEN, EXPLOSIONS IN THE SAME CELL INCREASE
  MULTIPLIERS UP TO X128.
- **2–3 slides** with page dots that auto-advance (the capture saw 3–14
  frames over 4–8 s).
- A big **circular-arrow enter button** right of centre (x 83–86%, y 60%),
  under it a **volatility badge** (MEDIUM / HIGH VOLATILITY with bars) and a
  **DON'T SHOW NEXT TIME** checkbox.
- A choice splash replaces it when the game has modes: Zeus vs Hades opens on
  CHOOSE VOLATILITY (PLAY IN OLYMPUS / PLAY IN HADES), The Dog House Megaways
  on SELECT FREE SPINS (sticky or raining wilds).

**For a reskin.** Hacksaw's norm is three panels plus CLICK TO CONTINUE; PP's
is a self-playing board with a caption. Either is a proven pattern. The PP
idea worth taking is the volatility badge and the caption that names the max
win in x bet, both on the first screen.

### 3. Base-game screen (desktop 1280×720)

| element | position (share of screen) |
|---|---|
| spin button (large circular arrow) | x 77.5%, y 90.5%; − / + bet either side, AUTOPLAY under it |
| INFO (i), ≡ menu, sound | bottom left, x 11–14%, y 91–95% |
| CREDIT / BET | bottom left, two lines, right of INFO |
| WIN | bottom centre, gold, the largest HUD type |
| message line | under the board: GOOD LUCK! / PLACE YOUR BETS! / HOLD SPACE FOR TURBO SPIN |
| tip strip | over the board: rotating SYMBOLS PAY ANYWHERE / WIN UP TO 5000X BET, replaced by TUMBLE WIN $x during a cascade |
| buy panel | left of the board (2019+ titles): stacked BUY FREE SPINS $price, then ante (BET $2.50 DOUBLE CHANCE TO WIN FEATURE, on/off) |
| cast | right of the board, full height, facing it; logo above the cast |

Measured colour (median over the 11): saturation 0.60–0.62, 4–6% grey,
lum 0.43–0.45. PP's base game is bright, saturated and almost grey-free.

**For a reskin.** This is the layout players arrive with. Our bottom bar
(`review-findings.md`, Deadwood's compactBottom keys) should put the same
things in the same places: spin bottom right, WIN bottom centre, credit and bet
bottom left, buy panel on the board's left. The cast on the right facing the
board is the same rule as `cast-faces-board`.

### 4. Spin rhythm

- **Server latency** 0.42 s (0.40–0.45). PP's reels are already spinning
  while it waits.
- **Base spin, press to idle**, 2.74 s median over 60 spins (2.12–3.46);
  per title 2.25–2.90 s. Tumble and pay-anywhere titles stretch to 4–9 s on a
  cascade; The Dog House Megaways is fastest at 1.6 s.
- **FG spin-to-spin** 3.07 s median (2.67–3.32), slower than base because
  multipliers land and count.

**For a reskin.** These are whole-turn numbers (press to idle), not reel
constants. Compare them with our total turn time on a loss, not with
`reel.spinRevealProps`. If a losing base spin of ours takes over about 3 s at
normal speed, it is slower than PP's flagship titles.

### 5. FG entry: celebrate, wipe, panel

The same four beats in every title with a buy (`shots --phase fg --all
--name "sweet bonanza 1000"` shows them frame by frame):

1. **Trigger celebration** on the board: the scatters pulse and scale, 1.5–3 s.
2. **A full-screen wipe made of the theme's own object**, about 1 s: a wall of
   lollipops (Sweet Bonanza 1000), a sheet of fire (Zeus vs Hades), a wooden
   sign swinging down (Big Bass), a wand sweep of light (Starlight Princess).
3. **The scene is now the FG version** (see §6) and the **intro panel grows
   from the centre**: the empty plate first, then its text fills in about
   0.5 s later. Copy: CONGRATULATIONS / YOU HAVE WON / *10* / FREE SPINS /
   PRESS ANYWHERE TO CONTINUE. The number sits in a pill or a ribbon in the
   middle.
4. **Click, panel shrinks, first FG spin.**

Buy press to the second FG request: 12.8 s median (7.8–13.1, including the
capture's 6 s panel hold). Without the hold, the automatic part (celebration,
wipe, panel in) runs about 6–7 s.

**For a reskin.** This is the same set-piece `review-findings.md` asks for
("FG intro as a real set-piece started after the transition's black"). PP's
version adds the wipe made of a theme object instead of a fade to black; that
is the "pick a transition from the new theme's own imagery" rule in the main
skill, shipped 9 times out of 9.

### 6. During FG

- **The scene recolours** in 5 of 9 titles (Sweet Bonanza 1000 pink day to
  violet, Fruit Party and Starlight Princess blue to purple, Gates of Olympus
  2500 magenta to blue, Sugar Rush pink to deeper pink-purple). Five darken
  by 0.03–0.19 in mean luminance (Big Bass, Fruit Party, Sweet Bonanza 1000,
  Starlight Princess, Sugar Rush); the Olympus and Zeus vs Hades scenes keep
  their brightness.
- **The left buy panel turns into the FG counter**: FREE SPINS LEFT *N*, plus
  a TOTAL MULTIPLIER orb in the pay-anywhere titles. The bottom message line
  becomes FREE SPINS LEFT N and the WIN field carries the running total.
- **Collect titles add a meter over the board**: Big Bass shows the fisherman
  collection track and +10 / x2 / x3 / x10 retrigger steps across the top.
- **Big wins interrupt with a full-screen title card**: NICE!, MEGA WIN!,
  SENSATIONAL! in a chunky outlined face over a dimmed board and a shower of
  coins or candy, with the amount in a pill that counts up while the label
  stays fixed. The capture saw these from 2x to 360x bet.

### 7. FG exit: total-win panel

The same plate as the intro panel, rewritten: CONGRATULATIONS / YOU HAVE WON /
*$167.90* / IN 15 FREE SPINS / PRESS ANYWHERE TO CONTINUE. It appears over the
FG scene dimmed to lum 0.27 (median), the darkest the game gets outside the
INFO page. The amount counts up inside the pill. Last spin to collect: 7.9 s
median (2.7–8.2, capped by the capture's 6 s hold). After it, a fast cut back
to the base scene with the WIN field still showing the total and FREE SPINS
COMPLETED in the message line.

**For a reskin.** PP's exit beat is short and plain. Hacksaw's norm is a
diegetic outro with painted TOTAL WIN. Ours should at least match PP's two
facts: the amount counts up in a framed plate, and the number of free spins
played is stated.

### 8. Economy (from the init responses)

- **RTP.** 38 modes, median 96.50, range 96.00–96.55. The Gates of Olympus
  2500 generation runs nine modes (regular, five ante levels, four buys)
  within 0.03 of each other. Zeus vs Hades runs 96.01–96.14. Our house rule
  (`rtp-96-all-games`, every mode 96.00–96.10) sits under PP's flagship
  numbers; that is a choice, not a bug.
- **Buy price.** 100x bet is the standard first buy (9 of 10 titles with a
  buy). Second tiers: super buy 450x and 500x, Olympus 2500 at 250 / 500 /
  1250x, Zeus vs Hades at 75 / 150 / 300 / 300x.
- **Ante.** 1.25x bet for DOUBLE CHANCE TO WIN FEATURE (5 titles), Big Bass
  1.5x. Olympus 2500 stacks 1.25 / 2.75 / 5.5 / 20 / 250x antes, each with its
  own max-win cap (20000x down to 100x).
- **Max win.** 5000x on the originals, 15000–25000x on the 1000 / 2500
  remakes.
- **Bet ladder.** 22–28 coin steps; the default bet is 2.00 everywhere.

### 9. PP and Hacksaw side by side

| beat | Hacksaw norm (`hacksaw-style-transcripts.md`) | PP norm (this file) |
|---|---|---|
| loading | logo and a 400×25 accent bar | studio wordmark on black, thin line; 6 s |
| intro | three panels (mechanic / bonus / max win), CLICK TO CONTINUE | one self-playing board slide at a time, caption, volatility badge, enter arrow, don't-show-again |
| art | 2D in about 40% of titles | rendered everywhere |
| FG entry | scene dim to 0.4 over 0.5 s, diegetic panel | theme-object wipe about 1 s, themed CONGRATULATIONS plate |
| FG scene | separate backdrop | same scene, recoloured in 5 of 9 |
| FG exit | painted TOTAL WIN, bitmap digits | the intro plate again, amount counting up, scene at lum 0.27 |
| buy | per title | 100x first buy, 1.25x ante |

---

## Using the script

```bash
cd wp/.claude/skills/game-reskin
python3 scripts/pp_styles.py summary                         # families, shares by year, themes, thumbnail numbers
python3 scripts/pp_styles.py list --theme western             # who did a theme, in which family
python3 scripts/pp_styles.py list --mech super-scatter --since 2025
python3 scripts/pp_styles.py sheet --family cartoon --since 2025 --out /tmp/pp_cartoon.jpg
python3 scripts/pp_styles.py fetch                            # cache all 669 thumbnails

# the 11 deep captures (pp-style-transcripts.json; shots need the local kit)
python3 scripts/pp_styles.py game "gates of olympus 1000"     # init numbers, timing, colour per phase
python3 scripts/pp_styles.py norms                            # medians over the 11
python3 scripts/pp_styles.py shots --phase intro --out /tmp/pp_intro.jpg
python3 scripts/pp_styles.py shots --phase fg --all --name "sweet bonanza 1000" --out /tmp/sb_fg.jpg

# rebuild after a newer kit (keeps the hand-made family tags; new titles come in as 'untagged')
python3 scripts/build_pp_transcripts.py --kit <path to PP抄錄> --measure --write
```

Phases for `shots`: loading, intro, enter, main_idle, first_spin, spin, fg,
fg_end, after_fg, info. The capture's phase names follow its own script steps,
so the first intro slide is sometimes filed under loading and the enter frame
under intro; check the frame, not the label.

Contact sheets are for looking at and for the 畫風 question to the user. They
are never attached to an image-generation request.
