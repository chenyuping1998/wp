# Hacksaw style atlas: what 183 shipped slots use, and what transfers

Read this alongside `art-direction.md` when shortlisting styles (step 2 of its
procedure). The catalogue there says what each medium is and what it costs in
this engine. This file says which real, shipped games use it, how they carry it
onto the reels, and which lanes nobody in that lobby occupies yet.

**Source.** Every slot listed on `hacksawgaming.com/games/slots` on 2026-09-27:
183 titles. For each, the lobby key art (all 183), the in-game desktop
screenshot from its product page (69), and the base-game background (59) were
looked at, and every title was tagged with one family. The tags, themes, series,
volatility and image URLs are in `hacksaw-slots.json`. `scripts/hacksaw_styles.py`
lists them and builds contact sheets on demand (images are downloaded into a
cache, not kept in the repo).

**Rules of use.** The same as the catalogue's: titles and pictures are for you
and the user to look at. They never go into a generation prompt, are never
attached as a style reference, and are never traced. A prompt names techniques
(`art-direction.md`'s prompt blocks); a Hacksaw title named in a prompt produces
a pastiche with its fingerprints and is an IP risk.

## The distribution

| family | titles | share | catalogue key | mean volatility (of 5) | titles to look at |
|---|--:|--:|---|--:|---|
| Glossy casual 3D-ish cartoon | 45 | 25% | `render` | 3.3 | Magic Piggy, Marlin Masters ×4, Munchy Milo, Fred's Food Truck, Pug Life |
| Painterly semi-real, dark fantasy | 33 | 18% | `render` / `gouache` | 3.8 | Bullets and Bounty, Cursed Crypt, Arizona James, Army of Ares, 3 Cursed Chests |
| Western TV cartoon mascot | 18 | 10% | `cartoon` | 2.9 | the Le series (15), Donut Division, Smoking Dragon, Zeus Ze Zecond |
| Rubber-hose 1930s cartoon | 16 | 9% | `rubberhose` | 3.8 | Pray for Three, The Count, Rad Maxx, SixSixSix, Hot Ross, Red Rascal, Stack'Em |
| Monochrome plus one accent | 15 | 8% | `noir` | 3.9 | Death Becomes You, Cash Crew, Reign of Rome, Itero, Wings of Horus, Hounds of Hell |
| Anime | 11 | 6% | `cel` | 3.5 | the Princess series (4), Aiko and the Wind Spirit, Fist of Destruction, Feel the Beat |
| Classic casino glossy | 11 | 6% | `render` | 3.7 | Max Win Machine, Superstar Sevens, Dandy Diamonds, The Luxe |
| Street sticker-bomb / graffiti | 10 | 5% | `street` | 3.7 | Chaos Crew 1–3, Octo Attack, Break Bones, Born Wild, Outlaws Inc. |
| Action comic | 9 | 5% | `comic` | 3.3 | Jaws of Justice, Ultimate Slot of America, Bash Bros, Grug Make Fire |
| Flat vector / neon sign | 7 | 4% | `flat` | 3.6 | Miami Mayhem, Mystery Motel, OmNom, The Respinners |
| Print media | 4 | 2% | `screenprint` | 4.2 | Toshi Ways Club, Toshi Video Club, The Bowery Boys |
| Manga ink | 3 | 2% | `manga` | 4.3 | Dark Spiral, Slayers Inc, Nitro Nights |
| Ink wash | 1 | 1% | `inkwash` | 4.0 | Densho |

**The trend.** Game ids run roughly in release order. Among titles below id
1300, glossy casual was 34% (19 of 56). From id 2000 on it is 15% (6 of 41).
The families built on a named 2D medium (every row above except the three
`render` rows) went from 36% to 54% over the same span. The cartoon family
is 22% of the recent titles, and 8 of those 9 are Le games. The studio that sets the lobby's
tone is moving away from the look this repo's five default-render games share.

**Two lobbies in one catalogue.** Hacksaw's `render` half (89 titles) has the
same problem our five apps have: Supreme Zeus, Ze Zeus and Divine Drop are
three gold-and-lightning Zeuses that could swap logos. The titles that make
their lobby recognisable are all in the 2D half, and most of those belong to
a handful of locked series.

## The families, and how each one reaches the reels

The lobby key art and the in-game art are not always the same style. Study the
in-game screenshots (`hacksaw_styles.py sheet --kind screen`) for symbol
treatment. Key art alone will mislead you about what the reels look like.

### Western TV cartoon mascot (`cartoon`): 18 titles

The Le series (Le Bandit, Le Bandit Hold & Win, Le Pharaoh, Le Viking, Le
King, Le Zeus, Le Cowboy, Le Santa, Le Fisherman, Le Bunny, Le Digger, Le
Hooligan, Le Football Fan, Le Prechaun, Le Sortudo), plus Donut Division,
Smoking Dragon and Zeus Ze Zecond.

- **The look.** A thick black ink outline with some weight variation, flat
  fills with one hard cel shadow, a big head, short legs, white cartoon gloves,
  and an expression carried by brow and mouth shape (the raccoon's angry
  eyebrows and gritted grin) instead of rendering.
- **Reels.** Royals are chunky outlined letters in the palette's cream,
  yellow or red (Le Pharaoh, Le Sortudo, Smoking Dragon's green J). Coins and
  clovers are flat discs with one highlight. Le Zeus replaces the royals with
  Greek letters (α δ π Φ) in dark silhouette, so low pays read as
  background and the coins pop.
- **Background.** A painted landscape with the same ink outlines and flat sky
  gradients (Le Prechaun's forest, Le Digger's desert). Le Bandit Hold & Win
  goes further: a sepia two-tone street, so the only full colour on screen
  is the board and the raccoon.
- **Cast.** One mascot, full height, standing right of the board and facing
  it. The whole series runs on one rig (see `hacksaw-character-motion`'s
  `references/le-series-comparison.md`).
- **Cost here.** It is the most reviewer-friendly 2D style Hacksaw ships
  (mean volatility 2.9, broad appeal). Flat fills suit the mesh rig. The
  raccoon itself is a cut-parts rig, not a mesh
  (`le-bandit-art-spec.md`). The trap is that "cartoon" alone drifts to the
  glossy casual look. The outline weight and the one-shadow rule have to be
  in §0 as numbers.

### Rubber-hose 1930s cartoon (`rubberhose`): 16 titles

Two branches. **Black and white plus one neon accent** (9): Pray for Six,
Pray for Three, Hot Ross, Rad Maxx, Rip City, SixSixSix, The Count, Booze Bash
and Minted Mike. **Full colour** (7): Red Rascal, Benny the Beer, and the
yellow-blob family of Stick'Em, Stack'Em, Drop'em, Keep'em and Book of Time.

- **The look.** Noodle limbs with no elbows or knees, pie-cut eyes, white
  gloves and big shoes, round bodies filled solid black, grey film tones,
  and a grin full of teeth. The black-and-white branch adds one saturated
  neon (hot pink, cyan, acid green or purple) that lives on the logo and the
  special symbols only.
- **Reels.** This is where the family is most disciplined, and it is
  measurable (see [Measured numbers](#measured-numbers)). The Count's board
  is greyscale and only the wild bats are purple. Pray for Three's low pays
  are dark grey silhouettes, its high pays get a red outline, and its wild is
  a red cross. SixSixSix keeps even its symbols grey, so the logo is the only
  colour on screen. Rad Maxx spends its neon green and pink only on
  multipliers and specials. Minted Mike draws its royals as grey graffiti
  letters and its specials as neon stickers.
- **Background.** Greyscale rooms in the same line (The Count's castle hall,
  Booze Bash's bar), or a black-and-white photo texture (Minted Mike's
  graffiti wall).
- **Logo.** The horror line puts the title on a cross-shaped sign in the
  accent colour (Pray for Six, Pray for Three, Hot Ross, Rad Maxx, Rip City).
- **Cost here.** Rubber-hose limbs are designed to bend along a smooth curve,
  so this is the one style where a mesh-bent arm reads as intended rather than
  as the 「手像沒骨頭」 defect. The condition is a constant hose thickness
  and a smooth curve: a bend that pinches on the inside still looks broken.
  Grain and scratches are code work. It is also Hacksaw's most recognisable
  signature: nine titles. A black-and-white rubber-hose game with a neon
  cross logo will read as a Hacksaw imitation. Differentiate on something
  structural (the accent, the era's own props, colour instead of B&W) or
  choose it knowingly.

### Monochrome plus one accent (`noir`): 15 titles

Four variants:

1. **Greyscale plus blood red**: Death Becomes You, Cash Crew, Reign of Rome.
2. **Stone greyscale plus a neon glow**: Itero (marble bust, flat cyan logo),
   Invictus (cyan), Wings of Horus (violet eyes), and Spinman (a greyscale
   comic city with a neon-green hero).
3. **One hue, dark**: Hounds of Hell (red), Evil Eyes, Cursed Seas and
   Dynasty of Death (teal), Rise of Ymir (cold blue), Ronin Stackways (green).
   The rendering is painterly, but the palette is locked to one hue.
4. **No colour at all**: Life and Death, Circle of Life.

- **Reels.** Death Becomes You's symbols are greyscale etchings (fish, moth,
  owl). The red appears only on the expanding-reel feature and the two hearts
  flanking the board: the accent **is** the mechanic. Hounds of Hell draws its
  low pays as dark carved runes and puts its highs in fire frames. Reign of
  Rome carves its royals in grey stone, puts its specials in bronze
  medallions, and gives its multipliers the one blue.
- **Cost here.** The catalogue's noir entry applies as written. Hacksaw's
  numbers confirm its 5–10% accent cap. Pay hierarchy is carried by value
  and by the accent (see house rule 2 below). The store tile needs care:
  these tiles are the darkest in the lobby, and ours must still pass
  `check_thumbnail.py`.

### Manga ink (`manga`): 3 titles

Dark Spiral, Slayers Inc and Nitro Nights. Toshi Video Club's halftone robot
sits between this and print.

- **The look.** A pressure-varying pen line, screentone dots for mid-tones,
  speed lines, and solid black spot fills. Colour, if any, is a single accent.
- **Reels.** Dark Spiral keeps the whole board in greyscale screentone, and a
  red thread traces the winning ways: the accent is the win line. Nitro
  Nights frames the board with manga panels over a greyscale screentone city,
  adds hazard-yellow accents, and draws its WILDs as graffiti stickers.
- **Cost here.** Screentone is code work (one dot pitch and angle for the
  set, at least 4% of the canvas side), and only on the body and head of a
  rigged cast. Hacksaw uses it for its highest-volatility titles (mean 4.3).

### Street sticker-bomb / graffiti (`street`): 10 titles

Chaos Crew, Chaos Crew 2 and Chaos Crew 3, Octo Attack, Break Bones, Born
Wild, Beam Boys, Eye of the Panda, Outlaws Inc. and Twisted Lab.

- **The look.** Symbols are die-cut stickers with a white border, in neon
  spray colours with drips. Lettering is a marker tag or a drippy
  throw-up. The line is scratchy and the characters are grotesque.
- **Reels.** Octo Attack is the cleanest model. The background is a greyscale
  line-drawn city with no fill colour. Low pays are grey outline icons (heart,
  speech bubble, hook, box). High pays are colour stickers, and the free-spin
  symbol is a dripping FS tag. Chaos Crew 3 replaces the royals with graffiti
  letters (H, C, O) and draws its symbols as stickers (stop sign, brain, teeth).
- **Cost here.** Drips and splatter belong on symbols and backgrounds, not on
  a moving limb. A white sticker border on a layered cast has to stop at the
  cut edges, or every joint shows a white seam. This family is Turf War's
  native medium, and Turf War did not use it.

### Action comic (`comic`): 9 titles

Jaws of Justice, Ultimate Slot of America, Fire my Laser, Steamrunners, Bash
Bros, Grug Make Fire, Strength of Hercules, FRKN Bananas and Deal With Death.

- Bash Bros writes its royals as grey graffiti tags on a black board, with the
  specials as coloured spray cans.
- Grug Make Fire paints its background in a flat 2D-animation manner (value
  planes, no outlines) and outlines only the symbols and the cast. That
  separates the layers without blur or dimming, and it is worth copying for
  any outlined style.
- Jaws of Justice gives every multiplier the same red badge shape, so the
  mechanic reads by shape before the number is read.

### Anime (`cel`): 11 titles

The Princess series (Dusk, Sun, Rainbow, Cloud), Aiko and the Wind Spirit,
Fist of Destruction and its Megamultiplier, Fighter Pit, Feel the Beat,
Vending Machine and Jelly Slice.

- The Princess games use a fine line, pastel iridescent palettes and gem
  symbols. Aiko sets flat-cel characters and portrait symbols against
  painted watercolour landscapes: the soft painting stays in the
  background, and everything on the reels stays flat.
- The fighting-game titles (Fist of Destruction, Fighter Pit) are roster
  art: several full-colour fighters, with VHS glitch in the frame.

### Flat vector / neon sign (`flat`): 7 titles

Miami Mayhem (our Hot Miami reference), Miami Multiplier, Mystery Motel, OmNom,
The Respinners, Cubes and Cubes 2. Miami Mayhem stacks tall character
symbols and draws chrome-purple royals. Mystery Motel and Miami Multiplier are
neon-tube signs on dark silhouettes.

### Print media (`screenprint`, `inkwash`): 5 titles

- **Toshi Ways Club**: a maneki-neko line drawing in orange and black on cream
  paper, with rising-sun rays. A Showa-era print.
- **Toshi Video Club**: a halftone black-and-white robot on cream paper.
- **The Bowery Boys**: black gangster silhouettes on olive, with a gold
  vintage title plate. A duotone film poster.
- **Frutz**: a low-poly apple on crumpled paper with a stencil logo.
- **Densho**: ink wash with sakura pink and red. Its brush-kanji logo is the
  kind of lettering the model must never generate. Set it from a font or have
  it hand-made.

### Painterly semi-real (`render` / `gouache`): 33 titles

Western (Bullets and Bounty, Epic Bullets and Bounty, Duel at Dawn, Wanted
Dead or a Wild, 2 Wild 2 Die), Egypt (Cursed Crypt, Hand of Anubis, Sand and
Ashes, Temple of Torment), war (Army of Ares, Spear of Athena, Gladiator
Legends), horror (Dark Summoning, Immortal Desire, Bloodthirst, The Wildwood
Curse, Rotten), norse (Stormborn, Stormforged), and adventure (Arizona James,
Dawn of Kings, Great Game Serengeti and Rockies).

How the better ones keep this from reading as the default render:

- **Matte, loose brushwork and a graded atmosphere**, not gloss. Sand and
  Ashes and Epic Bullets and Bounty paint desaturated dust-and-haze
  backgrounds.
- **Muted symbols on dark boards, with thin theme glyphs as low pays.**
  Cursed Crypt's low pays are thin gold hieroglyph lines on dark stone. Its
  highs are painted portraits in frames.
- **Graphic shape design under the paint.** 3 Cursed Chests and Stormborn
  have designed silhouettes with visible strokes. This is the top end of the
  catalogue's gouache entry.

Great Game Serengeti's background is layered flat silhouettes in sunset
values, which is a painterly scene built from a flat-shape method.

### Glossy casual (`render`): 45 titles, and classic glossy (`render`): 11

Magic Piggy, Marlin Masters, the Donny games, Pocketz, Hoppers, most of the
food, farm, fishing and Christmas titles. The classic set (Max Win Machine,
Superstar Sevens, Dandy Diamonds, Power of Ten, The Luxe) is used for fruit
and gem math. This is the look `art-direction.md` offers only as the
contrast option, and Hacksaw's own share of it is falling.

## What transfers: eight house rules

These are the habits that make Hacksaw's 2D half look designed rather than
generated. Each one maps onto a step in this skill.

1. **Colour is reserved for the mechanic.** In the black-and-white and
   monochrome games, the one accent sits on exactly the thing the player must
   track: The Count's wilds, Death Becomes You's expanding reel, Dark Spiral's
   winning ways, Rad Maxx's multipliers. Everything else is grey. This is
   `art-direction.md`'s "one accent reserved for the signature mechanic",
   shipped and measured. Write the accent's owner into §0.
2. **Pay hierarchy by saturation and value, not only by subject.** Low pays
   are dark, desaturated or outline-only (Octo Attack's grey outline icons,
   Pray for Three's grey silhouettes, Hounds of Hell's carved runes, Le Zeus's
   dark Greek letters). High pays are full colour. Specials are the brightest
   thing on the board, or the only colour. This is the art brief's §2
   measured-luminance rule, turned into a style decision up front.
3. **Low pays are drawn in the world's own medium.** Graffiti tags (Bash Bros,
   Minted Mike, Chaos Crew 3), Greek letters (Le Zeus), carved stone (Reign of
   Rome, Hounds of Hell), gold hieroglyph line (Cursed Crypt), bread dough
   (Fred's Food Truck). This is the other fix for tell 13 (two styles on one
   reel). The letters still come from a font, and the medium's treatment
   (bevel, spray outline, dough texture) is applied in code or drawn around
   a set glyph. Letterforms are never generated.
4. **The background is quieter than the board.** Le Bandit Hold & Win's sepia
   street, Nitro Nights' and Octo Attack's greyscale cities, Minted Mike's
   black-and-white wall, Grug Make Fire's outline-free flat planes. The
   board and the cast hold the saturation and the outlines. The background
   gets less of both. Make this a §0 rule ("background: no outline,
   chroma below the symbols'"), not a post-hoc dimming overlay.
5. **The cast stands full height beside the board, facing it, drawn in the
   symbols' medium.** Le series on the right, The Count and Pray for Three on
   both sides, Spinman on the right. This is the same rule as this repo's
   cast-faces-board check.
6. **One style per series, reused.** 15 Le titles run on one raccoon and one
   rig. Chaos Crew has 3 titles, the Princess games 4, Marlin Masters 4, Toshi
   2, the rubber-hose horror line 6. When a reskin is the second game in a line
   (Capo Nostra, then Turf War, then Hard Time), decide up front whether it is
   a series (same style, same rig, a new mascot outfit) or a new look. Do not
   drift halfway.
7. **The style signals the volatility.** On Hacksaw's five-step meter, the
   monochrome, rubber-hose, manga and print families average 3.8–4.3, while
   the bright Le cartoon series averages 2.9. In their lobby, a restrained dark
   palette reads as "high volatility" and a bright mascot as "medium". Match
   the style's signal to the math the reskin actually ships.
8. **The logo is made the same way as the royals.** Distressed serif for the
   noir titles, the cross sign for the rubber-hose horror line, marker tags
   and drips for street, a chunky outlined bubble for the Le series, neon tube
   for Miami. The logo is the style's loudest sample. Build it from a font plus
   a code treatment, like the royals.

## Theme to style: what Hacksaw chose

Use this with `art-direction.md`'s native-medium table. That table says what
the theme's world would have printed. This one says what a shipping studio
picked, and whether picking it again would stand out or blend in.

| theme | Hacksaw titles by family | takeaway |
|---|---|---|
| horror, occult (23) | noir 6, rubberhose 6, painterly 5, glossy 3, manga 1, comic 1, street 1 | Their most 2D-heavy theme. Black-and-white rubber-hose plus neon, and greyscale plus blood red, are both taken by them. |
| Greek myth (12) | glossy 5, painterly 3, cartoon 2, comic 1, noir 1 | The glossy Zeuses are interchangeable. The ones that stand out are the parody cartoon (Le Zeus) and the greyscale marble plus neon (Itero). |
| crime, heist (10) | cartoon 3, flat 3, manga 1, noir 1, print 1, street 1 | Relevant to Capo Nostra, Turf War and Hard Time. Cash Crew (greyscale plus red, ransom-note logo) and The Bowery Boys (silhouette duotone) are the noir options. Nobody has done pulp comic. |
| street, urban (10) | street 5, rubberhose 3, comic 1, anime 1 | Sticker-bomb on a greyscale city is the proven formula. |
| East Asia (10) | glossy 3, print 2, cartoon 1, anime 1, ink wash 1, noir 1, painterly 1 | Toshi (Showa print) and Densho (ink wash) are the distinctive ones. Woodblock is open. |
| fantasy, princess (14) | glossy 6, anime 4, painterly 3, rubberhose 1 | Anime owns "princess". Art Nouveau and tarot are open. |
| western (7) | painterly 5, cartoon 1 | All painterly or cartoon. **Woodcut, wanted-poster letterpress and engraving are open** (Deadwood Express's lane). |
| Egypt (6) | painterly 4, noir 1, cartoon 1 | Wings of Horus (greyscale plus violet neon) is the distinctive one. Flat relief and papyrus are open. |
| candy, food, farm, fishing, money (20) | glossy casual 14, classic 3, anime 1, flat 1, cartoon 1 | Commodity look. Any named 2D medium stands out here. |
| norse (4), war (4) | painterly 4, noir 3 (Rise of Ymir, Invictus, Reign of Rome), cartoon 1 (Le Viking) | Woodcut and engraving are open. |

### Open lanes: catalogue styles with zero Hacksaw titles

Woodcut or linocut, engraving or banknote line, constructivist, Art Nouveau,
gouache picture book, clay, blueprint and cut paper: none of the 183. Print
media are 4 titles and ink wash is 1. On `art-direction.md`'s lobby
differentiation criterion these score highest. Rubber-hose black and white
with a neon accent is the opposite case: it is recognisably Hacksaw's.

## Measured numbers

In-game desktop screenshots, cropped to the game screen (the bet bar is
included, which slightly inflates the grey share). `mono` is the share of
pixels with Lab chroma below 10. `accent` is the largest 30° hue bin among
pixels with chroma of at least 20, and `2nd` the next one.

| title | mono | accent | 2nd | accent owner |
|---|--:|--:|--:|---|
| SixSixSix | 98% | 1.5% | 0.0% | logo only |
| Pray for Three | 96% | 1.7% | 0.9% | high-pay outlines, wild cross |
| Dark Spiral | 93% | 4.0% | 1.0% | red thread on winning ways |
| The Count | 89% | 5.9% | 0.7% | wild bats |
| Rad Maxx | 88% | 6.6% | 2.8% | multipliers, specials |
| Death Becomes You | 83% | 11.5% | 3.0% | expanding-reel feature (shown active) |
| Spinman | 76% | 13.8% | 4.4% | hero and his expanded reels |
| Octo Attack | 72% | 7.4% | 3.8% | high-pay stickers (several hues) |

Across all 69 screenshots the median `mono` is 38%. The disciplined
monochrome games sit at 83–98% grey with one hue under 12% and no second hue
above 3%. That confirms `art-direction.md`'s gates: `--max-chroma 4` on
non-accent pixels and an accent cap of 5–10% (up to about 12% while a
feature is showing).

## Using the script

```bash
cd wp/.claude/skills/game-reskin
python3 scripts/hacksaw_styles.py summary                       # families, shares, themes
python3 scripts/hacksaw_styles.py list --key noir               # titles for one catalogue key
python3 scripts/hacksaw_styles.py list --theme western
python3 scripts/hacksaw_styles.py sheet --key rubberhose --kind screen --out /tmp/rubberhose.jpg
python3 scripts/hacksaw_styles.py refresh [--write]             # new releases since the survey
```

- **When shortlisting**, run `list --theme <theme>` and read the takeaway
  row above. The candidate that lands in an open lane scores highest on lobby
  differentiation.
- **When asking the user**, build one `sheet --kind screen` per shortlisted
  key (thumbs if the key has no screenshots), send the sheets alongside the
  AskUserQuestion call, and name two or three titles in each option's
  preview card. The user then chooses from pictures, not adjectives.
- **After `refresh --write`**, tag the new titles by hand from a sheet (`--ids`).
  The script never guesses a family.
