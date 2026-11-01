# ImageGen prompt set / Sumo Monkey / 2026-10-23

Built-in ImageGen used throughout. Full exact requests are preserved in the chat
ImageGen tool history; the final production briefs are recorded here.

## Arena
Wide16:9 original Japanese sumo monkey arena, hand-inked manga/woodblock sports
poster. No cast, text, symbols or UI. Indigo rafters, vermilion ceremonial
banners, lanterns and distant crowd silhouettes; quiet parchment centre for reel
overlay, sandy dohyo and thick straw rope foreground. Charcoal/navy, parchment,
vermilion, antique gold; simple flat shapes and strong ink contours. Avoid3D,
gloss and fake glyphs.

## Symbol atlas
Transparent4columns×2rows. Trophy / silk sumo belts / gunbai fan / straw zori;
monkey WILD seal / torii FS scroll / prize medallion with blank runtime-number
centre / ceremonial straw rope. Equal cells with ample clear margins, thick ink
contours, flat Japanese sports-poster style, readable at70px. No sushi, gradients,
glow or3D. P's centre remains unlettered.

## MG articulated parts
Transparent4×4 isolated-part atlas, one burly mature mischievous monkey sumo
wrestler facing right in guard. Ochre fur, cream skin, black topknot, red mawashi.
Head/torso/pelvis/neck; rear upperarm/forearm/fist/front upperarm; front forearm/
open palm/rear thigh/rear shin+foot; front thigh/front shin+foot/topknot/tassel.
Complete hidden regions, generous rounded joint overlaps, no torso arm ghosts.
Flat clean ink animation art, no text, shadows or3D.

## FG articulated parts
Same atlas/pose/part order/style, distinct lean muscular youthful champion,
dark chocolate fur, fierce eyebrows and grin, tall topknot, indigo mawashi with
gold knot. The character is a different person from MG.

## Final atlas cleanup (both casts)
Keep the exact4×4cells, positions and scale. Smoothly continuous fur at the
outer perimeter of torso and limb shapes. Replace beige decorative oval join
markers with matching fur, preserving the actual face, palms, belly and feet.
No added text; transparent background and source art style unchanged.

Atlas extraction, component selection, joint alignment, cropping, UI generation
and composition are deterministic production processing. Source illustrations
were not replaced with programmatically drawn character placeholders.

# 2026-10-24 scheduled manga revision

User request: make Sumo Monkey closer to Sushi Monkey's Japanese manga style.
Built-in ImageGen image edits used source game art as STYLE references only.
Edit targets were the four original SumoMonkey atlas/background originals.
Reference1: SushiMonkey/static/assets/sprites/sushiBackground/bg_base.png.
Reference2: SushiMonkey/static/assets/sprites/sushiSymbols/h1.png.
Reference3: SushiMonkey/static/assets/sprites/sushiScene/chef_cut_in.png.

Final common style prompt: Japanese manga ink on warm paper, expressive black
contours, charcoal fur, ivory skin, sparse controlled directional hatch marks,
muted salmon orange accent. Keep silhouettes/poses/cell positions/part counts
exactly to preserve animation joints. No blue/gold/brightred, glossy rendering,
airbrushing, gradients or3D. Genuine transparent alpha for the three atlases.

MG: mature sumo monkey, round belly, salmon mawashi. FG: separate young champion,
talltopknot and grin, ivory/charcoal mawashi with salmon knot. Preserve complete
armless torso and rounded limb ends, no anatomicaljoin ovals.

Arena: redraw existing sumo interior with the quiet airy pen-and-ink value plan
of Sushi's actual background: offwhite cloth banners, precise structural lines,
selected halftone shadows, tiny salmon lanterns, quiet ivory center and floor,
straw ringforeground. No sushi shops, figures, text, glyphs orUI.

Symbols: same4×2 atlas subject order; trophy ivory/charcoal, folded belts salmon
andcharcoal, gunbai ivorywithsalmon sun, sandals black/ivory; monkeyWILDstamp,
toriiFSbanner, emptycenter prize medallion, strawring. Simplify goldenfloral
ornament into clean readable mangaforms.70px clarity. Keep onlyWILD/FS lettering.

Character extraction now uses a padded grid and substantial component nearest
each cell's center, preventing adjacent large shapes from contaminating small
neck/hand layers. Spine-motion then regenerates all six clips and seam reports.

Final symbol palette refinement (built-in ImageGen edit): preserve every symbol's
silhouette/layout/text/alpha; deepest ink charcoal#282828, ivory surfaces#EFEADC,
accent dusty terra#B87B60. W stamp's large disk charcoal with a thin salmon rim
and salmon nameplate. No other hue, gold, glossy rendering or geometric changes.
The first manga atlas is retained as symbols_manga_v1.png; symbols.png is final.

W-only final cleanup (built-in ImageGen edit): swap the lower nameplate's two
colors only—ivory#EFEADC background and charcoal#282828 WILD lettering—retaining
its brushstroke silhouette, exact letters, face, disk and thin salmon outerrim.
Sourceoverride w_manga_final.png remains separate for reproducible extraction.
