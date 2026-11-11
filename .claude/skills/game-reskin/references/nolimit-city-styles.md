# Nolimit City: the style survey, and what transfers

Read this with `art-direction.md` when shortlisting styles (step 2 of its
procedure), whenever the theme is crime, prison, horror, western, war,
Americana, punk or satire, and whenever a user says "make it look like
Nolimit". It records how one studio built a recognisable house look out of
seven style families, which of its choices a reskin can copy, and which it
cannot.

**Source.** All 143 titles listed in `nolimitcity.com/sitemap-0.xml` on
2026-09-27, released 2016-10 to 2026-11 (the last four were announced, not
yet out). For every title: the 1200 × 630 key art, every game-specific image
on its page (feature badges, symbol crops, reel areas), and for 36 titles a
base-game reel screenshot. The tags live in `nolimit-slots.json` (family,
catalogue key, theme, the site's volatility and max win, image URLs), and
`scripts/nolimit_styles.py` queries them and builds contact sheets:

```
python3 scripts/nolimit_styles.py summary
python3 scripts/nolimit_styles.py list --theme prison
python3 scripts/nolimit_styles.py sheet --key caricature --kind screen --out /tmp/nlc.jpg
python3 scripts/nolimit_styles.py refresh      # new titles since the survey
```

The images are Nolimit City's. They are for looking at. Never put them in a
prompt, a style frame, an app, or this repo. The script caches them outside
the repo.

## The finding that matters most

**Nolimit's art does not measure as flat.** Symbol cells from two of their
most distinctive boards, run through `scripts/check_style.py`:

| board (cells cropped from the site's reel-area images, about 110–310 px) | colors95 | soft | chroma |
|---|--:|--:|--:|
| AFK Airport Security (2026): 5 highs, Wild, 5 lows | 10–78 | 23–44% | 23–56 |
| Punk Rocker 3 (2026): 4 portraits, 4 props | 28–100 | 29–58% | 7–30 |
| our own default-render sets, for comparison | 58–484 | 29–65% | |

Those numbers overlap our five "interchangeable AI render" sets. Nolimit
paints shaded, textured, gradient-rich art. It still never reads as the
default look, because the decisions that make it recognisable are not
rendering decisions. They are:

1. who the characters are (specific, ugly, old, real-looking people),
2. what the board is physically made of (an object from the world),
3. how value and colour are split between highs, lows and specials,
4. one alarm colour per game,
5. lettering that is designed, not generated.

The metrics in `check_style.py` catch drift away from an approved style
frame. They do not tell you whether a style has an identity. Do not treat
"low colors95" as the goal, and do not read Nolimit-level numbers in a
delivery as failure if the five decisions above are in place.

## How the look formed

| era | titles in that look | what it looked like |
|---|--:|---|
| 2016–2020 | 33 of 37 | Generic lobby art: glossy gems and neon (Wixx, Starstruck, Hot 4 Cash, Milky Ways), semi-real 3D renders (Tomb of Nefertiti, Thor, Poison Eve, Dragon Tribe, Barbarian Fury), soft 3D cartoon (Ice Ice Yeti, Bonus Bunnies). Indistinguishable from any other supplier. |
| 2019–2021 | 4 of the 37 up to 2020, then 10 of 12 in 2021 | The turn: Tombstone (2019), Punk Rocker, Deadwood, Book of Shadows (2020), then San Quentin, East Coast vs West Coast, Mental (2021). Grime, caricature and street comic arrive together with the transgressive themes. The last two generic titles (Bushido Ways, Legion X) ship in 2021. |
| 2022–2026 | 94 of 94 | Every release sits in one of the six families below. None goes back to the generic look. |

The lesson for this studio: Nolimit's first four years looked exactly like
our current five apps. Identity came from picking a point of view and
holding it across every title, not from better rendering.

## The six families (plus the legacy one)

Counts are over all 143 titles. Each family lists the technique, what it
does on the board, examples to look at, the mapping onto our catalogue keys
in `art-direction.md`, and a prompt block that names technique only (no
studio, game or artist names, per the catalogue rule). Three families became
catalogue entries of their own: `caricature` (A), `grime` (B) and `collage`
(E). The other three map onto keys that already existed.

### A. Grotesque caricature portrait: 怪誕諷刺肖像 (`caricature`, 43 titles)

The core house style. Painted over a confident ink drawing, with every face
pushed toward ugliness: big noses, bad teeth, sweat, pores, sunburn, broken
veins, bags under the eyes. Characters are middle-aged or old, overweight,
tattooed, balding. Skin is desaturated toward yellow-green or sunburn red.
Symbols are head-and-shoulder portraits on a flat saturated colour card,
framed like a mugshot, ID photo or wanted poster.

- **Examples:** San Quentin 1/2/Manhunt, Folsom Prison, Land of the Free,
  Home of the Brave, Road Rage, Loner, Kenneth Must Die, Stockholm Syndrome,
  xWays Hoarder 2, Duck/Gator/Catfish Hunters, Fire in the Hole 1–4, Das
  xBoot 1/2, Tsar Wars, Bizarre, AFK Airport Security.
- **Board:** reads well at 70 px because each high is one face on one colour
  card. The card colour does the pay-tier separation, not the face.
- **Rig:** strong fit for our layered cast. The caricature exaggeration is
  the same exaggeration squash-and-stretch wants. Keep pores and wrinkles on
  `head` and `body`; limbs get flat skin plus one shadow tone.
- **Generation:** the hardest family to generate without drifting back to
  the default. Models beautify faces by default (tell #11). The brief must
  specify age, weight, one deformity per face, skin condition, teeth, and a
  named expression, and reject any face that looks attractive.
- **Maps to:** new catalogue key `caricature`.
- **Prompt:** `grotesque caricature portrait painting over bold ink
  drawing, exaggerated {feature}, {age}-year-old, {skin condition}, crooked
  teeth, sweat and pores, desaturated skin toward {hue}, head and shoulders
  on a flat {hex} card, hard rim of ink, no beauty, no glamour lighting`

### B. Grime realism plus one alarm colour: 褪色髒污寫實＋單一警示色 (`grime`, 28 titles)

Near-monochrome painting (sepia, grey, bone, rust) buried under dirt,
scratches, stains and film grain. One accent colour carries all the
excitement: blood red (Tombstone RIP, Remember Gulag, Dead Dead or Deader),
toxic green (The Crypt 1/2, Infectious 5), furnace amber (Mental 1/2,
Highway to Hell), bruise purple (Six Feet Under). Royals are carved,
stencilled or scratched into the material (stone, iron, wood, dirt).

- **Examples:** Deadwood 1/RIP, Tombstone RIP/Slaughter, Remember Gulag,
  Rock Bottom, The Border, Mental 1/2, Beheaded, The Crypt 1/2, Dead Men
  Walking, Six Feet Under, Bangkok Hilton, True Grit Redemption 1/2,
  Disorder, Book of Shadows.
- **Board:** the value hierarchy is built in: lows are dim material, highs
  are lit, and specials are the only thing in the accent colour. Risk: dark
  mids go mud at 70 px. Specify a minimum value gap between symbol and cell
  background.
- **Rig:** texture on `body`/`head` only (the `LIMB_TEXTURE` rule). Dirt
  overlays belong to the background plate, not to limb layers.
- **Generation:** reliable. Apply grain and scratches in code with one
  overlay for the whole set (tell #10). Enforce the accent with
  `--accent HEX:0.08` and `--max-chroma` on everything else, as for `noir`.
- **Thumbnail:** Nolimit's own grime tiles are dark. Ours must still pass
  `check_thumbnail.py`'s `dark<32` gate, so light the tile's centre or use the
  paper/bone end of the palette.
- **Maps to:** `noir` when it is truly black and white (Tombstone RIP,
  Remember Gulag, Rock Bottom); new key `grime` for the painted sepia
  version.
- **Prompt:** `desaturated painted illustration, sepia and bone palette,
  heavy grime, scratches and stains, hard directional light from {dir}, one
  accent colour {hex} reserved for {object}, symbols carved or stencilled
  into {material}, no bloom, no glossy highlights`

### C. Bold sticker cartoon and zine: 粗線貼紙卡通／Zine (family `sticker`, 19 titles)

Clean heavy outline, flat fills with one hard shadow, loud saturated colour,
and often a white die-cut border so a character reads like a sticker slapped
on the board. Zine variants add marker scribble, doodles, Memphis patterns
and hand-drawn lettering. The comedy titles live here.

- **Examples:** Karen Maneater, East Coast vs West Coast, Nine to Five,
  Seamen, Soaked by Seamen, Outsourced 1/2/Payday, Crazy Ex-Girlfriend,
  Skate or Die, Supersized, Flight Mode, Devil's Crossroad, Tombstone and
  Tombstone: No Mercy (wanted-poster cartoon), Ding Dong Death, AFK Airport
  Security's pictogram specials.
- **Board:** the strongest 70 px readability of any family.
- **Rig:** excellent. The white sticker border must stop at cut edges, the
  same rule as ink outlines (`LINE_EDGE`).
- **Generation:** reliable. Quantise at 2× and downscale (see
  `art-direction.md`, Things the image model must never make).
- **Maps to:** `cartoon` for the clean comedy cartoon (Seamen, Karen
  Maneater, Nine to Five), `street` when the die-cut border, spray and
  graffiti are the point (East Coast vs West Coast, Skate or Die, Crazy
  Ex-Girlfriend). No separate key: this is the same family Hacksaw ships
  as its TV cartoon and sticker-bomb lanes (`hacksaw-style-atlas.md`).
- **Prompt:** `bold cartoon sticker illustration, thick even black outline,
  flat saturated fills {hexes}, one hard shadow tone, white die-cut border
  around the figure, exaggerated comic expression, no gradients, no texture`

### D. Ink graphic novel: 墨線圖像小說 (family `inkcomic`, 6 titles)

Heavy brush ink with black spot shadows, a limited palette (often black,
red and paper), splatter used as a graphic element, and screenprint-like
flat colour. Close to our `comic` and `noir` entries. Blood & Shadow is the
reference for doing black, red and white with no gradients at all.

- **Examples:** Blood & Shadow 1/2, Dead Dead or Deader, Brute Force 1/Alien
  Onslaught (80s action comic), Breakout (comic plus neon).
- **Maps to:** existing `comic` / `noir` / `screenprint`. No new key.

### E. Found-object collage: 現成物拼貼 (`collage`, 7 titles)

The board is assembled from real things photographed or painted as props:
cardboard and duct tape (Home of the Brave), a gilded frame on bathroom
tiles (Golden Shower, Punk Toilet), a subway carriage over a chain-link grate
with police tape (Punk Rocker 3), polaroids and a desk (Loner), dollar bills
and graffiti (Benji Killed in Vegas). Portraits are photocopy-style, black
and white, then defaced with spray paint and marker.

- **Examples:** Punk Rocker 1/2/3, Punk Toilet, Benji Killed in Vegas, Home
  of the Brave, Golden Shower.
- **Board:** Punk Rocker 3 puts each symbol on a different coloured concrete
  tile, so the tile colour does the separation while the portrait stays
  nearly grey (chroma 7–30).
- **Rig:** portraits as layered cut-outs work well: collage already looks
  cut. Keep defacement marks on `head` and `body`.
- **Generation:** prop photographs and textures generate well. The defacement
  (spray, marker, tape) looks fake when generated; paint it as its own layer
  or apply it in code.
- **Maps to:** new key `collage`.
- **Prompt:** `mixed-media collage, black and white photocopy portrait with
  coarse toner, spray paint and marker defacement in {hex}, pasted on {tile
  material}, torn paper edges, duct tape, real object props, flat even
  lighting`

### F. Retro digital: 復古數位（像素／LCD／Win95／霓虹） (family `digital`, 5 titles plus UI)

Pixel sprites (The Cage, Space Donkey), a monochrome phone LCD (Brick Snake
2000), Windows-95 dialogs and cursors (Nine to Five, and the "God Mode"
feature badge reused across a dozen titles), acid-house neon (The Rave, DJ
Psycho).

- **Board:** pixel art only reads if the pixel grid is enforced in code (one
  pixel size, no anti-aliasing inside the sprite). Generated pixel art mixes
  pixel sizes (tell #10).
- **Rig:** poor for mesh bending: a bent pixel sprite stops being pixel art.
  Use frame-swapped poses instead of a mesh rig.
- **Maps to:** `flat` with the neon edge (Hot Miami). Pixel work is in the
  catalogue's less-common options, with its rig warning.

### Legacy: early generic look (family `legacy`, 35 titles)

Kept as the contrast. It is the same look as our default render, and
Nolimit abandoned it completely. Anyone who proposes it should see this row.

## What transfers to our reskins

These are the reusable craft rules. Every one is visible in more than one of
their titles.

1. **The frame is an object from the world.** A trailer (Land of the Free),
   cardboard and tape (Home of the Brave), prison bars (Bangkok Hilton), a
   crypt wall (The Crypt 2), a mine-shaft timber (Fire in the Hole), a
   subway carriage (Punk Rocker 3), a coffin in dirt (Six Feet Under). No
   ornamental gold bezel after 2021. Put the frame object in brief §3.
2. **Each high-pay symbol sits on its own flat colour card.** The card hue
   separates pay tiers at 70 px, which lets the character art stay
   desaturated and textured. AFK: yellow, red, blue, green, sky. San
   Quentin: a red card behind each inmate. This also answers the
   "differentiate by silhouette/material, not hue" rule in
   `art-brief-template.md`: the character carries the silhouette, the card
   carries the hue.
3. **Low-pay symbols belong to the world, not to a card deck.** Either
   royals carved, stencilled or stamped into the board's material (Bangkok
   Hilton, Six Feet Under, The Crypt 2), or theme props with no letters at
   all (Punk Rocker 3: boots, brass knuckles, a bottle, a pedal), or a
   different layer of the world (AFK: the lows are x-ray scanner images in
   one cyan), or letters that spell a word on plain grey tiles (Stockholm
   Syndrome's P-O-L-I-S). Always dimmer and less saturated than the highs, but in the
   same medium. That is the fix for tell #13 (two styles on one reel).
4. **One alarm colour per game, reserved for specials.** Red for blood,
   green for toxic or undead, amber for fire. The rest of the palette stays
   quiet so a Wild or scatter lands without a glow.
5. **Specials are signage.** Wilds and scatters are drawn as the world's own
   warning signs: ISO pictograms (AFK), hazard triangles (Duck Hunters 2),
   wanted posters (Tombstone), hazard tape (Outsourced), a radiation badge
   (Disorder). The word WILD is set in a heavy condensed sans on the sign, in
   code.
6. **Faces are specific and ugly.** Age, weight, skin condition, teeth, one
   deformity, a named expression. This is the single strongest defence
   against the image model's default pretty face (tell #11). A brief that
   asks for "a tough gangster" gets the default; a brief that asks for "a
   62-year-old with a sunburnt scalp, a broken nose and a gold canine, mid-
   sneer" gets a character.
7. **Every feature title is lettered for the game.** Stencil, drip, splatter,
   carved wood, tape. Our rule stands: the image model never makes the
   letters. Build the plates from a font in code, then apply the game's
   texture to them (as Capo's `install_capo_comic_art.py` does).
8. **Grit is one overlay.** Dirt, scratches and grain are consistent across a
   whole board, which is how it reads as one medium. Apply it once in code.
9. **The key art sells the characters.** Almost every tile since 2022 shows
   two to five named characters with the logo. For a 200 px store tile,
   characters plus a tight logo beat an object or a landscape.

Where not to follow them:

- **Photoreal key art.** Several 2025–2026 tiles (Disorder, Six Feet Under,
  Blood Diamond, Bangkok Hilton) are cinematic, near-photographic paintings.
  That is exactly the look our tells table rejects, and it is the look least
  under our control. Take the characters-and-logo layout, not the rendering.
- **Content.** Nolimit sells transgression: real dictators, prison
  executions, drug references, sexual humour, gore. Stake's review rules
  (`review-findings.md` §4: no firearms, and the restricted-word checks) and
  our own taste apply. Take the craft, not the subject matter.
- **Dark tiles.** A grime tile made the Nolimit way fails our thumbnail
  exposure gate.

## Using this in the style question

When the theme is in Nolimit's territory, one or two of the shortlisted
styles can come from here. Put the family's example titles in the preview
card's 「像哪款」 line (for example 「像 Nolimit 的 San Quentin／AFK：怪誕
肖像＋每個符號一張色卡」) so the user can look them up. Score it on the same
six criteria as any other style. "Nolimit does it" is a reference, not a
score.

Theme to family, for the themes this studio keeps getting:

| theme | Nolimit family | their reference titles |
|---|---|---|
| prison, police, crime | caricature, grime | San Quentin 1/2/Manhunt, Folsom Prison, Bangkok Hilton, Stockholm Syndrome, Breakout |
| mob, hitmen | caricature, ink comic | Whacked!, Kiss My Chainsaw, Benji Killed in Vegas |
| western | grime, sticker (wanted posters) | Deadwood 1/RIP, Tombstone RIP/Begins/No Mercy, True Grit Redemption 1/2, El Paso Gunfight |
| horror, occult, undead | grime + one accent, ink comic | The Crypt 1/2, Blood & Shadow 1/2, Possessed, Beheaded, Six Feet Under, Ding Dong Death |
| street, punk, skate | collage, sticker | Punk Rocker 1/2/3, East Coast vs West Coast, Skate or Die |
| rednecks, Americana, hunting | caricature | Land of the Free, Home of the Brave, Duck/Gator/Catfish Hunters |
| war, military | caricature, grime | Das xBoot 1/2, D-Day, Tanked 1/3, Tsar Wars, Remember Gulag |
| office, travel, everyday satire | sticker, retro digital | Nine to Five, AFK Airport Security, Flight Mode, Outsourced |
| mining, dwarves | caricature | Fire in the Hole 1–4, Misery Mining, Dead Canary |
