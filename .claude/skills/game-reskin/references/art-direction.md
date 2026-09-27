# Art direction: choosing a style with the user, and keeping it from reading as AI output

Read this before writing the art brief (SKILL.md step 3). It covers the question
to ask the user, the professional recommendation that goes with it, the style
catalogue, the specific things that make generated art look generated, and how
to measure all of it.

## Why this step exists

On 2026-09-26 the symbol sets of Capo Nostra, Turf War, Hard Time, Deadwood
Express and Soul Seal were laid side by side. They are one look: a semi-real
glossy object, the same top-left sheen on gold or brass, micro-texture at an
even density everywhere, a dark rim and a soft glow. Nobody chose that look.
It is what an image model draws when the prompt names a theme and objects but
not a medium or technique, so every game made that way converges on it. In a
lobby, two such tiles read as the same studio's same game, and a reviewer who
has seen a thousand of them reads them as "AI slot art".

`scripts/check_style.py` puts numbers on it (512 px sources, high-pay symbols
plus Wild):

| set | colors95 | soft | read as |
|---|--:|--:|---|
| Capo / Turf / Hard Time / Deadwood / Soul Seal | 58–484 | 29–65% | the default render look |
| Hot Miami | 121–547 | 27–36% | a chosen style: flat vector plus neon edge |
| flat fills with ink outline (synthetic reference) | 7 | 7% | flat / print |
| Turf `l1` / Hard Time `l1` | 1–2 | 6% | a flat grey glyph, in the same reel as rendered highs |

Hot Miami is the only one of these that reads as designed. Its prompt names a
technique ("heavy dark outline, bold solid fills, minimal internal detail").
The others name only objects and moods. Hot Miami's numbers are still high,
because of its neon glow and portrait symbols. The metrics measure rendering,
not whether a style was chosen, which is why the gates below are set relative
to an approved style frame, not as absolute limits. Nolimit City confirms it
from the other side: their symbol cells measure colors95 10–100 and soft
23–58%, inside the default-render range, and their boards never read as the
default look (`nolimit-city-styles.md`). The last row is a second failure: the
low-pay glyphs are flat and the highs are rendered, so there are two styles on
one reel.

**The fix is not a better adjective in the prompt.** Pick a real medium with
physical rules (how the ink goes down, how many inks there are, how shading is
made), write those rules as numbers, enforce the parts code can enforce, and
look at the result at reel size.

## The procedure: ask first, with a recommendation

Do this after the theme and name are settled and before any prompt is written.
The style decides the palette, the fonts, the UI chrome, the win FX colours, the
transition art and the cast brief, so a change after art starts redoes all of
them.

### 1. Find the theme's native medium

Ask what this world would have printed, painted or carved itself. A style that
comes from the theme's own period and material carries the theme for you, and
because it is a real medium it has rules a model can follow. That is the main
defence against the default look.

| theme | its own media | styles to shortlist |
|---|---|---|
| 1930s mob, noir, detectives | pulp magazine covers, film-noir stills, newspaper halftone | Noir black and white plus one accent, American comic (pulp), Art Deco poster, Grotesque caricature |
| street crews, gangs, skate, hip-hop, punk | spray stencils, photocopied zines, screen-printed gig posters, sticker-bombed walls | Street sticker-bomb, Found-object collage, Screenprint / risograph, American comic, Noir plus one accent |
| prison, heist, police | mugshots, stencilled markings, newsprint, prison-tattoo linework | Grotesque caricature (mugshot cards), Grime plus one alarm colour, Noir plus one accent, woodcut, screenprint, Western TV cartoon (a caper, not a thriller) |
| Wild West, railroads, frontier | woodcut wanted posters, engraved timetables, letterpress, sepia tintypes | Woodcut / linocut, engraving, two-ink letterpress, Grime plus one alarm colour |
| money, finance, trading | banknote engraving, stock certificates, ticker tape | Engraving plus two inks, constructivist poster |
| East Asian myth, spirits, temples | ink wash, woodblock prints, cut paper | Ink wash plus seal red, woodblock, cut paper |
| horror, occult, witches, asylums, undead | etchings, woodcuts, tarot, grimoires, 1930s cartoons, horror manga, case-file photos | Etching / woodcut plus one sickly accent, Art Nouveau line, Rubber-hose (B&W plus one neon), Manga ink plus red, Grime plus one alarm colour |
| ancient Egypt, Aztec, Greek | carved relief, painted pottery, papyrus, marble statuary | Flat vector in an earth palette, carved-relief two-tone, Noir variant: stone greyscale plus one neon |
| 1980s, synthwave, Miami | airbrush, vector neon, VHS covers | Flat vector plus neon edge (Hot Miami) |
| cute animals, farm, candy | picture books, Saturday-morning cel animation, 1930s cartoon shorts | Western TV cartoon mascot, Rubber-hose (colour), gouache picture book, clay |
| sport, fans, parody of myth or history | TV cartoons, stickers, trading cards | Western TV cartoon mascot, American comic |
| modern Japan, racing, idols, fighting games | manga, anime, Showa-era prints and packaging | Manga ink plus one accent, Cel animation, Screenprint (Showa print) |
| machines, scrapyards, space | blueprints, technical manuals, stencilled hazard plates | Blueprint line, screenprint, flat vector |
| rednecks, hunting, Americana satire, war satire | trailer-park snapshots, hunting-magazine covers, bumper stickers, propaganda posters | Grotesque caricature, Found-object collage, Western TV cartoon |
| office, airports, everyday satire | safety pictograms, Windows-95 dialogs, clip-art, memo paper | Western TV cartoon, Flat vector, pixel (less common options) |
| fantasy, magic, jewels | Art Nouveau posters, tarot, illuminated manuscripts | Art Nouveau line, gouache |

Then check what a shipping studio actually chose for the theme:
`hacksaw-style-atlas.md` has the same themes mapped onto Hacksaw Gaming's 183
slots (`scripts/hacksaw_styles.py list --theme <word>`), with the lanes nobody
has taken yet. A candidate that is the theme's native medium **and** an open
lane is the strongest recommendation. One that repeats a Hacksaw signature
(black-and-white rubber-hose with a neon cross, the Le raccoon's cartoon)
needs a structural difference, or it reads as an imitation.

For crime, prison, horror, western, war, punk, Americana and satire, also
check `nolimit-city-styles.md`: Nolimit City's 143 slots
(`scripts/nolimit_styles.py list --theme <word>`), which built a house look
in exactly those themes out of catalogue entries 16–18 below, and the
board-building rules that carry it (a frame that is an object from the
world, a colour card behind each high, low pays in the world's own
material, one alarm colour). Hacksaw and Nolimit together cover most of what
a lobby player has already seen: a lane both have left empty is the
strongest differentiation argument.

### 2. Score the shortlist on six criteria

This scoring is the professional opinion the user asked for. Write one line
per criterion per style. Do not only say "fits the theme".

1. **Theme fit.** Is it the theme's native medium (table above), or only a
   medium that goes with the mood?
2. **Reel readability.** A cell is about 180 px on desktop and about 70 CSS px
   on a portrait phone. At 70 px, fine hatching, small halftone dots and
   engraving lines become grey noise. See the minimum sizes under
   [Measuring it](#measuring-it). Styles built from big shapes and few values
   pass easily. Line-texture styles pass only with coarse texture.
3. **Cast rig.** The character is layered meshes that bend
   (`hacksaw-character-motion`). Flat fills hide the bend. Halftone, hatching
   and brush texture on a moving limb visibly stretch at the joint. An ink
   outline gets thicker and thinner under squash-and-stretch. For a textured
   style, keep the texture on the body and head, which barely move, and make
   the limbs flat or nearly flat. Flat styles carry their own trap: art drawn
   or palette-quantised at delivery size has 3–7 colours and a hard edge, and
   the mesh stair-steps it the moment a limb turns
   (`check_layered_art.py` fails it). Draw or quantise at 2× and downscale.
4. **Lobby differentiation.** At the 200 px store tile, a bold 2D style with
   few values stands out from the glossy-render tiles that dominate the lobby.
   Also compare against this studio's own catalogue: five apps already share
   the default render look. Say which existing app the candidate would
   resemble, and which Hacksaw titles use it (`hacksaw-style-atlas.md`).
   Woodcut, engraving, constructivist, Art Nouveau, gouache picture book,
   clay, blueprint and cut paper had zero titles among Hacksaw's 183 on
   2026-09-27, and zero among Nolimit City's 143 (`nolimit-city-styles.md`),
   so they are open lanes. Black-and-white rubber-hose with a
   neon accent is Hacksaw's nine times over. Grotesque caricature portraits
   on mugshot colour cards are Nolimit's (43 titles), and so is sepia grime
   with a blood-red accent in a western or prison (28).
5. **Generation control and post-process cost.** Models do flat fills, ink
   outlines, cel shading and gouache reliably. They do fake halftone (dots of
   random size and angle), fake hatching (lines in every direction) and fake
   pixel art (mixed pixel sizes) badly. Those textures have to be applied in
   code (see [Things the image model must never make](#things-the-image-model-must-never-make)).
   Say which parts of the style are code work.
6. **Review risk.** A stylised weapon is still a weapon: the no-firearms rule
   in `review-findings.md` §4 applies in every style. For a dark style
   (noir, etching), the store tile has to pass `check_thumbnail.py`'s exposure
   gates, so plan the tile on the paper-white side of the style. Gore and
   occult imagery need extra care.

### 3. Ask with AskUserQuestion

Send one call with two questions (three if finish matters). Put the
recommended style first with 「（推薦）」 in its label. Each option's
`preview` is the scored card, written in Traditional Chinese.

- **Q1 畫風** (header `畫風`): three shortlisted styles plus one contrast,
  usually the current default render. List the default so the user sees it as
  a choice and sees its cost. Do not quietly fall back to it.
- **Q2 色彩策略** (header `色彩`): full colour in a locked palette of 6–8 hex
  values / black and white plus one accent reserved for the signature
  mechanic / two or three spot inks / whatever the style implies.
- **Q3 質感** (optional, header `質感`): clean and crisp / printed-and-worn
  (misregistration, paper grain, ink spread, applied in code).

Preview card format (a Turf War example):

```
看起來：2–3 色油墨疊印、套色微偏、紙張顆粒；陰影只用一層網點
為什麼適合：街頭的原生媒材就是噴漆模板和影印海報
盤面 70px：大色塊、少明度層次，縮小仍清楚
角色 rig：平塗色塊，手臂彎曲看不出變形
成本：網點/顆粒/套色偏移由程式統一套，生圖只要平塗
風險：色數少時高低分難分 → 靠輪廓＋保留色（見 §2 符號）
像哪款：目前沒有自家遊戲用過
參考：Hacksaw《Toshi Ways Club》《The Bowery Boys》（給使用者看，不進提示詞）
```

Before the call, build one contact sheet per shortlisted style with
`scripts/hacksaw_styles.py sheet --key <key> --kind screen --out …` (use
`--kind thumb` when the key has no screenshots, or `--theme` to narrow it)
and send the sheets to the user with the question (SendUserFile when
available). In-game screenshots show how the style treats symbols, which the
user is actually choosing. For an open-lane style with no Hacksaw titles,
say so in the card: the style test (step 4) is then the user's first
picture of it.

If the user answers 「你決定」 or skips, use the recommendation and say so in
one line. Do not ask again.

### 4. Run a style test before the full set

Make four to five test pieces in the chosen style, or in the top two styles if
the user was torn: H1, one low-pay, the Wild, a 512 px crop of the base
background, and the character's head if a cast figure is in scope. Composite
them on the real board with the dev server (a screenshot, not a mock-up), and
make a 200 px tile. Run `check_style.py --sheet` on the symbols.

The user approves one result. That image becomes the **style frame**: the
reference every later prompt attaches, and the source of the measured numbers
in the brief's §0. Everything after it is judged against the style frame.
Nobody's memory of what the style was supposed to be counts.

### 5. Lock §0 of the brief, then propagate

Write the brief's §0 (template: `art-brief-template.md` §0) and carry it into
every place that produces art:

- The cast brief. Generate it with `archetype/brief.py --style
  <app>/ART_BRIEF.md --style-kind <catalogue key> --style-frame <frame>`.
  `--style` embeds the brief's `## 0` section. `--style-kind` uses the keys of
  the catalogue below (`comic`, `noir`, `woodcut`, `engraving`, `screenprint`,
  `flat`, `cel`, `inkwash`, `constructivist`, `nouveau`, `gouache`,
  `cartoon`, `rubberhose`, `manga`, `street`, `caricature`, `grime`,
  `collage`, `render`)
  and adds the rules the style needs because the figure is layered and bent:
  outlines stop at cut edges, line texture only on the body and head, no paper
  inside a layer. Without `--style`, the character comes back in the default
  render look beside stylised symbols, and the generated README says it is not
  ready to hand over.
- The UI icon drawer (line weight and cap style match the style's ink line),
  the frame and plate art, the win-FX colours (a black-and-white style's win
  glow is its accent colour), and the transition art.
- The runtime fonts (per-style suggestions below; all are Google Fonts under
  open licences, OFL or Apache 2.0, so check glyph coverage for every shipped
  language).
- The thumbnail BG and FG.

## Style catalogue

Each entry gives the technique that defines the style (the prompt block states
it; the negatives protect it), the themes it suits, what it costs in this
engine, and the shipped Hacksaw titles that use it (from
`hacksaw-style-atlas.md`; `scripts/hacksaw_styles.py sheet --key <key>` shows
them). The titles are for you and the user to look at, never for a prompt. Prompt blocks name techniques and processes. **Never name a living
artist or a specific comic, film or brand in a prompt.** That produces a
pastiche with the source's fingerprints, it is an IP risk, and it is its own
AI tell.

Shared negatives for every 2D style, after the style's own:

```
3D render, CGI, octane, unreal engine, photorealistic, glossy, shiny,
specular highlights, metallic sheen, bloom, glow, lens flare, god rays,
volumetric light, depth of field, bokeh, sparkles, particles, airbrushed
gradient, text, letters, numbers, watermark, signature, logo
```

### 1. American comic (bold ink, flat colour, halftone): 美式漫畫

- **Technique:** contour line about twice the weight of interior lines. Solid
  black spot-shadows instead of gradients. Flat colour fills. One halftone
  layer for mid-tones, applied in code. Three values per form at most:
  light, colour, black.
- **Fits:** mob, heist, superheroes, street, pulp adventure, sci-fi pulp.
- **Reel:** strong. Contour at least 2% of the canvas side.
- **Rig:** good, since flat fills hide the bend. Check contour weight at the
  extreme squash frame.
- **Generation:** reliable for line and flat colour. Halftone must be applied
  in code: ask for flat fills and add dots afterwards.
- **Fonts:** Bangers or Luckiest Guy for titles. Keep numbers on a plain
  condensed face (Oswald).
- **Prompt:** `comic book ink illustration, bold black contour lines twice the
  weight of interior lines, solid black spot shadows, flat colour fills with no
  gradients, limited palette of {hexes}, hard-edged cel shadows, printed comic
  look`
- **Hacksaw:** Jaws of Justice, Ultimate Slot of America, Fire my Laser, Bash
  Bros (grey graffiti-tag royals, colour spray-can specials), Grug Make Fire
  (outline-free flat background behind outlined symbols). Nine titles; none
  is pulp-era, so a 1930s–50s pulp comic is still distinct.
- **Nolimit:** Brute Force and Brute Force: Alien Onslaught (80s action
  comic), Breakout (comic plus neon), Apocalypse.

### 2. Noir: black and white plus one accent: 黑白高反差＋單一點綴色

- **Technique:** pure black and paper white. Shapes are carved out of large
  black masses. At most one mid-grey. One accent colour, reserved for the
  signature mechanic (the same "one alarm colour" rule as Turf War's blood
  red), at an area cap of 5–10%.
- **Fits:** noir, mob, prison, detective, horror, western at night.
- **Reel:** symbols must separate on silhouette and value alone, so the
  art-brief §2 silhouette rule becomes mandatory. Pay hierarchy needs a
  second restrained colour (say gold for high-pay) or a value rule. Decide
  which before generating.
- **Rig:** excellent. Two flat values hide everything.
- **Generation:** reliable. Enforce with `--max-chroma 4` on everything
  except accent pixels.
- **Thumbnail:** needs a white-dominant tile. A black-dominant noir tile
  fails the `dark<32` gate.
- **Fonts:** Bebas Neue or Oswald. Special Elite for "typed" notes.
- **Prompt:** `high-contrast black and white ink illustration, large solid black
  shapes, pure white highlights, no grey gradients, dramatic hard shadows
  carved from black, single accent colour {hex} used only on {object}`
- **Variants:** stone greyscale plus one neon glow (a statue or marble world,
  the accent as light), and a one-hue monochrome (every value in one dark hue,
  plus the accent). Both keep the same accent rule.
- **Hacksaw:** Death Becomes You (greyscale etched symbols, red only on the
  expanding-reel feature), Cash Crew, Reign of Rome, Itero, Invictus, Wings of
  Horus, Spinman, Hounds of Hell, Evil Eyes. Measured in-game: 83–98% of the
  screen achromatic, the accent at 1.5–11.5%, no second hue above 3%.
- **Nolimit:** Tombstone RIP (black-and-white painted western, blood red
  only), Remember Gulag (black and white plus propaganda red), Rock Bottom,
  and Blood & Shadow 1/2, the cleanest reference for black, red and paper
  with no gradients at all.

### 3. Woodcut / linocut: 木刻／麻膠版畫

- **Technique:** white lines carved out of black (the reverse of drawing).
  Gouge marks follow the form. One or two inks on paper. Edges are slightly
  rough.
- **Fits:** western, folklore, horror, vikings, pirates, prison.
- **Reel:** good if the gouges are coarse (at least 3.5% of the canvas
  apart). Fine gouging goes grey at 70 px.
- **Rig:** body and head carry the gouge texture. Keep limbs mostly solid.
- **Generation:** good. Models understand "linocut print".
- **Fonts:** Rye (western) or Alfa Slab One. IM Fell English for body flavour
  text.
- **Prompt:** `linocut relief print, white gouge marks cut from solid black,
  gouge direction follows the form, two inks {hex} and {hex} on off-white
  paper, slightly rough printed edges, bold simple shapes`
- **Hacksaw:** none of 183 titles. An open lane, and the western theme's
  native medium (Hacksaw's seven westerns are all painterly or cartoon).
- **Nolimit:** none of 143. Their westerns are grime (entry 17), so woodcut
  is open against both studios.

### 4. Engraving / etching (banknote line): 銅版雕刻／鈔票線刻

- **Technique:** value built only from parallel line density and
  cross-hatching. Lines follow the form's contours. One or two inks.
- **Fits:** finance, money, western, Victorian, occult, pirates.
- **Reel:** the riskiest style for 70 px cells. Use it for backgrounds, the
  logo and frames. Symbols need hatching at least 3.5% of the canvas apart,
  or a flat-fill symbol set with engraved accents only.
- **Rig:** hatching stretches visibly on limbs. Keep engraving on the body and
  head only.
- **Generation:** models produce hatching that goes in every direction. The
  style frame must show consistent contour-following lines. Expect to reject
  more generations than usual.
- **Fonts:** Playfair Display or Cinzel for titles.
- **Prompt:** `copperplate engraving, value built only from parallel lines and
  cross-hatching that follow the form, no solid grey fills, one ink {hex} on
  paper {hex}, banknote engraving line quality`
- **Hacksaw:** none. The closest is Death Becomes You's greyscale etched
  symbols, which are tonal, not line-built. An open lane.
- **Nolimit:** none.

### 5. Screenprint / risograph poster: 絹印／Risograph 復古海報

- **Technique:** two to four spot inks, each a flat layer. Overlaps create the
  extra colours. Slight misregistration and paper grain are applied in code
  with one offset and one grain file for the whole set.
- **Fits:** street, music, retro travel, surf, 60s–70s, sport.
- **Reel:** strong, with big shapes and few values.
- **Rig:** excellent.
- **Generation:** reliable for the flat shapes. Grain and misregistration
  must be code: model versions differ in every image.
- **Fonts:** Bungee or Anton for titles.
- **Prompt:** `screen printed poster illustration, {n} flat spot inks {hexes},
  inks overlap to make darker tones, no gradients, bold simplified shapes,
  flat graphic composition`
- **Hacksaw:** Toshi Ways Club (two inks on cream paper, a Showa-era print),
  Toshi Video Club (halftone on cream), The Bowery Boys (black silhouettes on
  olive, a duotone film poster). Four titles in all.
- **Nolimit:** Dead Dead or Deader (red and black ink splatter on paper),
  Punk Rocker (screenprinted punk flags and zine type).

### 6. Flat vector / mid-century modern: 扁平向量／中世紀現代

- **Technique:** geometric shape language (circles, rounded rectangles, sharp
  wedges). Flat fills, and at most one hard-edged shadow tone per colour.
  Either no outline or an even one.
- **Fits:** Egypt and ancient worlds, retro-futurism, travel, sport, 80s
  (with a neon edge, as Hot Miami did).
- **Reel:** strong.
- **Rig:** excellent.
- **Generation:** reliable. Quantise to the palette afterwards.
- **Fonts:** Righteous or Bebas Neue.
- **Prompt:** `flat vector illustration, geometric shapes, flat colour fills,
  one hard-edged shadow tone per colour, no gradients, no texture, palette
  {hexes}, clean even outline {weight}`
- **Hacksaw:** Miami Mayhem (our Hot Miami reference), Mystery Motel and
  Miami Multiplier (neon-tube signs), OmNom, The Respinners, Cubes.
- **Nolimit:** The Rave and DJ Psycho (neon), Nine to Five (90s flat
  cartoon on a Memphis pattern, Windows-95 UI). Their pixel titles (Brick
  Snake 2000, Space Donkey, The Cage) are the less-common pixel option.

### 7. Cel animation: 日式賽璐璐動畫

- **Technique:** clean even line, two-tone hard shadow (base plus one shadow),
  a sparing hard highlight shape. Backgrounds can be painted softer than
  characters.
- **Fits:** cute animals, fantasy, candy, action.
- **Reel:** strong.
- **Rig:** excellent. This is what the medium was made for.
- **Generation:** reliable, but models default to the same pretty face.
  Specify the face (age, jaw, nose, eye shape, one asymmetry).
- **Fonts:** Luckiest Guy or Righteous.
- **Prompt:** `2D cel animation style, clean even line art, two-tone hard cel
  shading, base colour plus one shadow tone, small hard highlight shapes, no
  gradients, palette {hexes}`
- **Variants:** pastel shoujo (fine line, iridescent pastel palette), and
  flat-cel characters over a painted watercolour background (the softness
  stays behind the reels; symbols stay flat).
- **Hacksaw:** the Princess series (Dusk, Sun, Rainbow, Cloud), Aiko and the
  Wind Spirit (the watercolour variant), Fist of Destruction and Fighter Pit
  (fighting-game roster art), Feel the Beat, Vending Machine.
- **Nolimit:** none. Their cartoons use the heavier outline of entry 12.

### 8. Ink wash plus seal red: 水墨＋朱印

- **Technique:** a black ink wash with dry-brush edges, lots of paper white,
  and one seal-red accent, reserved for the mechanic.
- **Fits:** East Asian myth, spirits, martial arts, tea and calligraphy themes.
- **Reel:** a wash has soft gradients by nature, so the `soft` metric runs
  high and that is correct here. Readability comes from strong dry-brush
  silhouettes and white space. Give symbols a solid ink mass or a plate.
- **Rig:** the wash hides the bend. Dry-brush edges on limbs are fine.
- **Generation:** good, though generated calligraphy is gibberish, so no
  characters in the art at all.
- **Fonts:** a brush-feel Latin display face. Test the CJK fallback for
  zh/ja/ko.
- **Prompt:** `sumi ink wash painting, expressive dry brush edges, ink
  gradients on off-white rice paper, large empty paper areas, one seal red
  {hex} accent only on {object}, no other colours`
- **Hacksaw:** Densho only (ink wash plus sakura pink and red). Its brush-kanji
  logo is exactly the lettering a model must not generate.
- **Nolimit:** none (Bushido Ways is an early semi-real render).

### 9. Constructivist / propaganda poster: 構成主義／宣傳海報

- **Technique:** strong diagonals, three colours (red, black, cream), cut-paper
  flat shapes, photomontage-like cut-outs rendered flat.
- **Fits:** finance and trading, industry, revolution-flavoured satire,
  factories.
- **Reel:** strong.
- **Rig:** excellent.
- **Generation:** reliable.
- **Fonts:** Russo One or Oswald.
- **Prompt:** `constructivist poster illustration, bold diagonal composition,
  flat cut paper shapes, three colours only {red} {black} {cream}, no
  gradients, graphic and geometric`
- **Hacksaw:** none. An open lane.
- **Nolimit:** none on the reels. Pearl Harbor's key art and Remember
  Gulag's red borrow the propaganda poster, painted rather than cut.

### 10. Art Nouveau line: 新藝術／塔羅

- **Technique:** a flowing even contour, flat muted fills, decorative borders
  built from organic curves, and a halo or arch behind the subject.
- **Fits:** fantasy, tarot, witches, jewels, botanical, fortune.
- **Reel:** keep the ornament in frames and plates, not inside symbols.
- **Rig:** good.
- **Generation:** reliable for line. Ornament drifts into melted filigree
  (see the tells below), so keep it structural and repeated.
- **Fonts:** Cinzel Decorative or Playfair Display.
- **Prompt:** `Art Nouveau poster illustration, flowing even contour line, flat
  muted fills {hexes}, decorative border of repeating organic curves, no
  gradients, no metallic rendering`
- **Hacksaw:** none. Their fantasy and fortune titles are glossy, painterly
  or anime, so tarot and Art Nouveau are open.
- **Nolimit:** none.

### 11. Gouache / painterly: 不透明水彩／厚塗

- **Technique:** matte opaque paint with visible brush strokes that follow the
  form, a limited palette, and value massing (three to four big value groups).
- **Fits:** fantasy, picture-book animals, nature, folklore.
- **Reel:** fine if the value masses are big.
- **Rig:** strokes stretch a little. It usually passes.
- **Generation:** **this is the style closest to the default render**. Without
  explicit matte, brush-stroke and palette constraints it slides back to
  glossy digital painting. Hold it to the style frame's numbers strictly.
- **Prompt:** `matte gouache painting, visible opaque brush strokes that follow
  the form, limited palette {hexes}, three big value groups, no glossy
  highlights, no airbrush`
- **Hacksaw:** the top of their painterly family: 3 Cursed Chests and
  Stormborn (designed silhouettes under visible strokes), Sand and Ashes and
  Epic Bullets and Bounty (matte, desaturated atmosphere). No gouache
  picture book: that end is open.
- **Nolimit:** none. Their painted titles are caricature or grime
  (entries 16 and 17).

### 12. Western TV cartoon mascot: 美式電視卡通吉祥物 (`cartoon`)

- **Technique:** a thick black ink outline with some pressure variation, flat
  fills with one hard cel shadow, a big head on short legs, white cartoon
  gloves, and an expression carried by brow and mouth shape rather than
  rendering. Backgrounds use the same outline and flat fills, with simple sky
  gradients.
- **Fits:** heists and capers, sport and fans, parodies of myth and history
  (a Zeus, a pharaoh, a viking), holidays, animals with attitude.
- **Reel:** strong. Royals as chunky outlined letters set from a font, or
  themed glyphs in dark silhouette so the coins and highs pop.
- **Rig:** excellent with flat fills. A mascot with a prop and swappable
  hands is traditionally a cut-parts rig (`hacksaw-character-motion`'s
  `le-bandit-art-spec.md`), so decide mesh or parts at the brief.
- **Generation:** reliable, but "cartoon" alone drifts into the glossy casual
  3D look. Put the outline weight (≥ 2.5% of the canvas side) and the
  one-shadow rule in §0 as numbers, and ban 3D shading.
- **Fonts:** Luckiest Guy or Lilita One for titles, a chunky outlined bubble.
- **Prompt:** `2D TV cartoon illustration, thick black ink outline with slight
  line-weight variation, flat colour fills, one hard-edged shadow tone, big
  expressive head, simple shapes, exaggerated expression from brow and mouth
  shape, palette {hexes}, no 3D shading, no gradients on characters`
- **Hacksaw:** the Le series (15 titles on one raccoon and one rig), Donut
  Division, Smoking Dragon, Zeus Ze Zecond. Their broadest-appeal family
  (mean volatility 2.9 of 5). A raccoon-like mascot in a Le-style title
  treatment reads as imitation. The style is open; that mascot is not.
- **Nolimit:** Seamen, Soaked by Seamen, Karen Maneater, Nine to Five,
  Devil's Crossroad, Ding Dong Death, Tombstone and Tombstone: No Mercy
  (wanted-poster cartoon), the Outsourced series, Supersized, Flight Mode. A
  comedy cartoon with uglier faces than Hacksaw's mascots, often with a
  white die-cut sticker border.

### 13. Rubber-hose 1930s cartoon: 1930 年代橡皮管卡通 (`rubberhose`)

- **Technique:** noodle limbs with no elbows or knees and a constant
  thickness, pie-cut eyes, white gloves, big shoes, round bodies filled solid
  black, and a toothy grin. Two branches: black, white and at most two
  greys, with one neon accent reserved for the specials and the logo; or
  full colour in a warm, slightly faded palette. Film grain and scratches are
  applied in code.
- **Fits:** horror played for laughs, occult, bars and vice, street crime,
  vintage mascots, anything with a devil, a ghost or a vampire in it.
- **Reel:** strong, if the value rule is strict. Low pays are grey
  silhouettes, highs get the outline or a second grey, specials get the
  accent (see `hacksaw-style-atlas.md` rule 2).
- **Rig:** the best match for the mesh rig in the catalogue. A hose arm is
  supposed to curve, so a mesh bend reads as intended, not as the
  「手像沒骨頭」 defect, provided the hose keeps its thickness through the
  bend and does not pinch on the inside.
- **Generation:** reliable for the line and the solid fills. Grain,
  scratches and the vignette are code, one file for the whole set.
- **Thumbnail:** the black-and-white branch has the noir entry's
  thumbnail problem. Plan a paper-white tile.
- **Fonts:** Luckiest Guy or Titan One for titles. A condensed sans for
  numbers.
- **Prompt:** `1930s rubber hose cartoon, black and white ink, noodle limbs
  with no elbows and even thickness, pie-cut eyes, white gloves, solid black
  body fills, flat greys only, no gradients, single accent colour {hex} used
  only on {object}`
- **Hacksaw:** Pray for Six, Pray for Three, Hot Ross, Rad Maxx, Rip City,
  SixSixSix, The Count, Booze Bash, Minted Mike (black and white plus neon);
  Red Rascal, Benny the Beer and the Stick'Em family (colour). This is their
  most recognisable signature. Black-and-white rubber-hose with a neon cross
  logo reads as a Hacksaw imitation, so differentiate structurally (the
  colour branch, a different accent owner, props from another era) or
  choose it knowingly.
- **Nolimit:** none.

### 14. Manga ink plus one accent: 日漫黑白網點＋單一點綴色 (`manga`)

- **Technique:** a pressure-varying pen line, screentone dots for mid-tones,
  speed lines, solid black spot fills. Black, white and screentone, plus one
  accent colour that marks the mechanic (Dark Spiral's red thread runs along
  the winning ways).
- **Fits:** horror, modern Japan, street racing, delinquents and gangs,
  martial arts, idols with an edge.
- **Reel:** good with coarse tone (dot pitch ≥ 4% of the canvas side).
  Fine tone becomes grey noise at 70 px.
- **Rig:** screentone on a limb stretches at the joint. Keep tone on the
  body and head, and make the limbs flat black and white.
- **Generation:** line and black fills are reliable. Screentone must be code
  (one pitch and angle for the set), because generated tone mixes dot
  sizes, which is tell 10.
- **Fonts:** Bangers for titles. Test the CJK fallback if the logo leans on
  Japanese.
- **Prompt:** `black and white manga ink illustration, pressure-varying pen
  line, solid black spot fills, flat white areas left for screentone, speed
  lines, no grey gradients, single accent colour {hex} used only on {object}`
- **Hacksaw:** Dark Spiral, Slayers Inc, Nitro Nights. Three titles, all
  high volatility (mean 4.3 of 5).
- **Nolimit:** none.

### 15. Street sticker-bomb / graffiti: 街頭貼紙塗鴉 (`street`)

- **Technique:** symbols as die-cut stickers with a white border, in two to
  four neon spray colours with drips and splatter. The lettering is a marker
  tag or a dripping throw-up. The background is a greyscale line-drawn city
  with no fill colour, so the stickers carry all of the saturation.
- **Fits:** street crews, skate, hip-hop, punk, urban monsters, anything
  Turf War was.
- **Reel:** strong. Low pays are grey outline icons, highs are colour
  stickers, and the free-spin symbol is a tag.
- **Rig:** drips and splatter do not go on a moving limb. On a layered cast,
  the white sticker border runs only along each layer's exposed outline and
  stops at the cut edges, or every joint shows a white seam.
- **Generation:** reliable for stickers and flat neon. Generated tags are
  pseudo-letters: set the words from a font and add the drips as shapes.
- **Fonts:** Permanent Marker for tags, Bungee or Rubik Mono One for titles.
- **Prompt:** `die-cut sticker illustration, thick white sticker border,
  bold black outline, flat neon spray colours {hexes}, paint drips and
  splatter as flat shapes, no gradients, no 3D shading`; background:
  `greyscale line drawing of a city street, ink lines only, no colour
  fills, flat perspective`
- **Hacksaw:** Chaos Crew 1–3, Octo Attack (the cleanest model: grey line
  city, grey outline low pays, colour sticker highs), Break Bones, Born Wild,
  Beam Boys, Eye of the Panda, Outlaws Inc., Twisted Lab.
- **Nolimit:** East Coast vs West Coast (graffiti comic with starburst
  frames), Skate or Die, Crazy Ex-Girlfriend (zine marker scribble), Benji
  Killed in Vegas (graffiti plus neon). Punk Rocker 3 takes the same theme
  to photocopy collage instead (entry 18).

### 16. Grotesque caricature portrait: 怪誕諷刺肖像 (`caricature`)

- **Technique:** a painted portrait over a confident ink drawing, pushed
  toward ugliness: an exaggerated nose, jaw or teeth, sweat, pores, sunburn,
  broken veins. Skin is desaturated toward yellow-green or sunburn red. Each
  high-pay symbol is a head-and-shoulder portrait on its own flat saturated
  colour card (a mugshot, ID photo or wanted poster). The card hue separates
  the pay tiers, so the portrait itself can stay textured.
- **Fits:** prison, crime, mob, hunting and Americana satire, war, mining,
  any comedy of awful people.
- **Reel:** strong, because of the colour cards. Without them it goes to
  mud at 70 px.
- **Rig:** strong. The caricature exaggeration is the same one
  squash-and-stretch uses. Pores and wrinkles on `head` and `body` only;
  limbs get flat skin plus one shadow tone.
- **Generation:** the entry most likely to slide back to the default,
  because models beautify faces (tell 11). The brief states age, weight,
  skin condition, teeth, one deformity and a named expression per face, and
  any face that looks attractive is rejected. It measures like a render
  (Nolimit's cells: colors95 10–100, soft 23–58%), so the gates come from its
  own style frame, never from the flat-style ranges.
- **Fonts:** Anton or Oswald for plates. Special Elite for rap-sheet notes.
- **Prompt:** `grotesque caricature portrait painting over bold ink
  drawing, exaggerated {feature}, {age}-year-old, {skin condition}, crooked
  teeth, sweat and pores, desaturated skin toward {hue}, head and shoulders
  on a flat {hex} card, hard rim of ink, no beauty, no glamour lighting`
- **Hacksaw:** Donut Division (outlined flat caricature cops on portrait
  tiles), Strength of Hercules. Rare for them.
- **Nolimit:** the house style, 43 of 143 titles and the largest family
  since 2021 (43 of their 106 releases): San Quentin 1/2/Manhunt, Folsom Prison, Land of the Free, Home
  of the Brave, Road Rage, Stockholm Syndrome, the Hunters series, Fire in
  the Hole 1–4, Das xBoot, AFK Airport Security (the cleanest model: five
  faces on five card colours). Mugshot cards in a prison theme read as
  theirs, so change the card device (a case file, a trading card, a bus
  pass) or choose it knowingly.

### 17. Grime realism plus one alarm colour: 褪色髒污寫實＋單一警示色 (`grime`)

- **Technique:** near-monochrome painting in sepia, grey, bone and rust,
  under one shared overlay of dirt, scratches and grain. One accent colour
  (blood red, toxic green, furnace amber) is reserved for the specials and
  the wins. Royals are carved, stencilled or scratched into the board's own
  material.
- **Fits:** western, horror, undead, asylums, prison, war. The painted cousin
  of noir.
- **Reel:** the value hierarchy is built in: dim lows, lit highs, accent
  specials. Dark mid-tones go to mud at 70 px, so §0 sets a minimum value gap
  between a symbol and its cell background.
- **Rig:** the textured-limb rule applies (texture on `body` and `head`).
  The grime overlay belongs to the background plate, not to limb layers.
- **Generation:** reliable. Grain and scratches are applied in code with one
  overlay for the whole set (tell 10). Gate the accent with
  `--accent HEX:0.08` and `--max-chroma` on the rest, as for noir.
- **Thumbnail:** light the tile's centre or use the bone end of the palette;
  a dark grime tile fails `dark<32`.
- **Fonts:** Rye or Alfa Slab One (western), Special Elite, Oswald.
- **Prompt:** `desaturated painted illustration, sepia and bone palette,
  heavy grime, scratches and stains, hard directional light from {dir}, one
  accent colour {hex} reserved for {object}, symbols carved or stencilled
  into {material}, no bloom, no glossy highlights`
- **Hacksaw:** Rotten (grunge sepia, a torn-brush logo), Duel at Dawn, Sand
  and Ashes, Epic Bullets and Bounty, all inside their painterly family.
- **Nolimit:** 28 of 143: Deadwood 1/RIP, Tombstone RIP/Slaughter, Mental 1/2
  (amber), The Crypt 1/2 (toxic green), Six Feet Under (purple), Bangkok
  Hilton (royals stencilled into cell stone), Dead Men Walking, Beheaded,
  True Grit Redemption 1/2. A sepia western with blood red reads as theirs.

### 18. Found-object collage: 現成物拼貼 (`collage`)

- **Technique:** the board is built from real props: cardboard and duct
  tape, a gilt frame, a subway carriage, polaroids, chain-link, police tape.
  Portraits are black-and-white photocopies with coarse toner, defaced with
  spray paint and marker in one accent. Each symbol sits on a different
  coloured tile of the same material.
- **Fits:** punk, street, political satire, protest, DIY.
- **Reel:** the tile colour does the separation, and the portrait can stay
  near grey (Nolimit's Punk Rocker 3 portraits: chroma 7–30).
- **Rig:** good, since collage already looks cut. Defacement marks stay on
  `head` and `body`.
- **Generation:** props and textures generate well. Generated spray paint,
  marker and tape look fake, so paint the defacement as its own layer or
  apply it in code.
- **Fonts:** Permanent Marker for scrawl, Anton for plates.
- **Prompt:** `mixed-media collage, black and white photocopy portrait with
  coarse toner, spray paint and marker defacement in {hex}, pasted on {tile
  material}, torn paper edges, duct tape, real object props, flat even
  lighting`
- **Hacksaw:** Minted Mike's black-and-white photo graffiti wall, behind a
  rubber-hose cast.
- **Nolimit:** Punk Rocker 1/2/3, Punk Toilet, Benji Killed in Vegas, Home
  of the Brave (a cardboard-and-tape reel frame), Golden Shower. Seven
  titles. Their board-as-object idea is everywhere, but the full collage
  look is still a thin lane.

### 19. Semi-real 3D render (the current default): 半寫實 3D 渲染

- Offer it only as the contrast option, and state its cost honestly:
  "matches five of our existing games, the highest AI-look risk, the lowest
  lobby distinctiveness". If the user still picks it, the tells checklist
  below matters most, and the palette and area caps must be enforced by
  quantisation, because this look drifts furthest.
- **Hacksaw:** 89 of their 183 titles are some form of it (45 glossy
  casual, 33 painterly, 11 classic). The glossy casual part fell from 34% of
  their early titles to 15% of their recent ones. Their better painterly titles
  hold it off with matte brushwork, muted symbols on dark boards and thin
  theme glyphs for low pays (Cursed Crypt). Their three gold Zeuses show the
  cost: they could swap logos.
- **Nolimit:** 35 of 143, every one from 2016–2021 (Wixx, Starstruck, Tomb of
  Nefertiti, Thor, Poison Eve, Barbarian Fury), then never again. Their
  first four years looked like our five default apps; the house look came
  from leaving this entry, not from rendering it better.

Less common options worth offering when the theme calls for them: pixel art
(the grid must be enforced in code, because generated pixel art mixes pixel
sizes, and a bent pixel sprite stops being pixel art, so a pixel cast swaps
posed frames instead of using the mesh rig; Nolimit's Brick Snake 2000, Space
Donkey and The Cage), claymation or 3D toy (reliable, but it reads close to the default),
blueprint line, and cut paper.

## Why art reads as AI-generated: the tells and the fix for each

Review every delivered asset against this list at 180 px and 70 px, not only
at full size.

| # | tell | prevent (in the prompt / brief) | fix (after delivery) |
|---|---|---|---|
| 1 | Everything is polished gold, brass or chrome with the same top-left sheen | Name a matte medium. Ban `glossy`, `metallic sheen`, `specular`. Give each symbol a material that is not metal where the theme allows | Regenerate. Sheen cannot be removed by post-processing |
| 2 | Detail at one even density everywhere, with no focal point | State a detail budget: "detail only on the focal third, large quiet shapes elsewhere" | Look at the 70 px column. Anything that turns to noise is wasted detail |
| 3 | Airbrushed gradients on every form | Name the shading method: two-tone cel, black spot shadows, hatching, or a halftone layer | Quantise to the palette with `asset-pipeline` at 2× and downscale (see below), then check `soft`/`colors95`. Quantising a render gives a posterised render, not the style, so regenerate if the drawing itself is rendered |
| 4 | Glow, bloom, rim light, sparkles and god rays baked in | Ban them in the negatives. FX light belongs to the runtime win layer | Regenerate. A baked glow also collides with the runtime glow |
| 5 | Palette drift (teal-orange, each image graded differently) | Hex palette plus area caps in §0 | Quantise. `check_style.py --palette … --min-fit` |
| 6 | Generated lettering: wobbly WILD or SCATTER, pseudo-letters, gibberish calligraphy | Never ask for text. If a symbol should carry a word, generate the blank plate | Set the word from a font in code or a type-plate script (Capo's `install_capo_comic_art.py` builds its plates from Cinzel). Deadwood's Wild and Scatter were prompted with their words ("marked WILD", "marked SCATTER"), and the letterforms show it |
| 7 | Ornament that makes no structural sense: melted filigree, crests with nonsense emblems | "Simple constructible shapes; ornament repeats one motif" | If you cannot name what an ornament is, remove or regenerate it |
| 8 | Broken counts and structure: fingers, chain links, key teeth, symmetric objects that are not symmetric | Specify counts ("five keys on one ring") | Inspect at full size. Repaint or regenerate. For the cast, the layered brief's separate hand layers |
| 9 | Light direction and camera angle differ across the set | One light and one view in the style block | Contact sheet. Regenerate the odd one out |
| 10 | Fake medium texture: halftone dots of random size and angle, hatching in every direction, different paper grain per image | Ask for flat fills only | Apply halftone, grain and misregistration in code with one pitch, angle and file for the whole set |
| 11 | The same pretty face | Describe the face: age, weight, jaw, nose, teeth, skin condition, one asymmetry or deformity, a named expression. Nolimit City's caricature casts (entry 16) show how far to push it | Regenerate against the style frame |
| 12 | Cinematic depth of field or bokeh in backgrounds | Ban it. Backgrounds need big, sharp value masses | Regenerate |
| 13 | Two styles in one reel (rendered highs, flat low-pay glyphs) | §0 applies to every symbol, royals included. Draw the low pays in the world's own medium (graffiti tags, carved stone, Greek letters: `hacksaw-style-atlas.md` rule 3; theme props with no letters, or another layer of the world such as an x-ray scan: `nolimit-city-styles.md`, What transfers, rule 3), set from a font and treated in code | `check_style.py` on the whole set: every symbol inside the style frame's range |
| 14 | Keying fringe: a halo of the key colour, or a white or grey fringe on dark art | Choose the key colour by the palette (below) | Check the alpha edge on a contrasting background |

## Things the image model must never make

- **Lettering and numerals.** The game ships in 16 languages, and generated
  letters are the single most recognisable tell.
- **UI icons.** They are geometry (`art-brief-template.md` §6).
- **Print textures** (halftone, grain, misregistration, paper). Generate them
  once in code and apply them identically to every asset.
- **Glow, light and particle FX.** These belong to the runtime.
- **The palette itself.** It comes from §0 and is enforced by quantising.
  **Quantise at 2× the delivery size, then downscale with Lanczos.** At
  delivery size, quantising also removes the anti-aliasing: every edge
  becomes a hard step, and the cast mesh stair-steps it. At 2×, the interior
  stays flat and the edge comes back. Measured on a flat test image:
  `colors95` was 5 either way, distinct colours went from 4 to 444, and
  `check_layered_art.py` accepts the result.

**Pick the keying colour from the palette, not by habit.** The flood-fill
removers take a flat background colour. Crusher Yard uses neutral grey
(`#808080`), Hot Miami's Gemini script uses `#00FF00`, and Capo's comic
installer strips a white or grey checker. A black-and-white or paper-white style
must never be keyed on white or grey, because it eats the art's own white areas
that touch the edge. Key on a saturated colour the palette never uses, and
check the fringe.

## Measuring it

`scripts/check_style.py` reports, for each image, `colors95` (colour bins
covering 95% of pixels), `soft` (share of pixels on a gentle slope, which is
airbrushing), `chroma`, and, when a palette or accent is given, `fit` and each
accent's area. `--sheet` writes a 180 / 70 / 70-greyscale contact sheet.

Workflow:

1. Run it on the approved style frame's symbols and write the numbers into
   §0.
2. Gate every later delivery against them with some headroom, for example
   `--max-colors` at 1.5 times the frame's value, `--max-soft` 5 points above
   the frame's, and `--min-fit` 5 points below.
3. For a black-and-white style, add `--max-chroma 4` with the accent declared
   (`--accent '#B22222:0.08'`) so accent pixels are excluded from chroma and
   capped on area. Shipping games sit inside this: Hacksaw's disciplined
   monochrome titles measure 83–98% achromatic in-game, with the accent at
   1.5–11.5% of the screen and no second hue above 3%
   (`hacksaw-style-atlas.md`, Measured numbers).

Rough ranges from this repo (512 px sources): default render 58–484 colors95
and 29–65% soft; flat fills with outline about 7 colors95 and 7% soft; a
render quantised to six colours gets 6 colors95 but still 20% soft (the
posterised-render trap from tell 3). A wash or gouache style legitimately runs
high on `soft`. Judge it against its own style frame, not against these
ranges.

**Minimum texture sizes** that survive a 70 px portrait cell, as a share of
the source canvas side (independent of the generation resolution):

| element | minimum |
|---|---|
| contour line | 2% |
| gap between hatching lines or gouges | 3.5% |
| halftone dot pitch | 4% |
| smallest detail that must be read (an eye, a keyhole) | 6% |

Below these, the texture becomes grey noise at phone size, and that noise
reads as generated micro-detail.
