# Sumo Monkey — arena and cast direction

2026-10-23. Sushi Monkey is reskinned as a sumo tournament starring two monkey
rikishi. The feature awards +5 spins on each collection threshold and raises the
visible arena board one row, up to seven rows. Numeric rules are owned by the
math config and frontend rules, rather than baked into decorative art.

## 0. Actual visual direction

2026-10-24 revision: match the actual SushiMonkey Japanese manga illustration,
with Sumo Monkey subject matter. Nearly monochrome black and ivory paper, fine
controlled hatching, expressive manga facial shapes and small muted salmon
accents. The earlier saturated indigo/red/gold tournament poster is superseded.
The arena is light and quiet: fine ink rafters, suggested spectators, lanterns,
and a dohyō, with broad clean paper behind the reels. Background movement stays
subordinate to symbol readability. The frontend applies the same restrained
palette to lanterns, shide, salt and ceremonial flags.

| Role | Colour |
| --- | --- |
| Ink / contour / values | `#282828` |
| Ivory paper / clear text well | `#efeadc` |
| Light paper fold | `#e4e0d4` |
| Sparse muted salmon emphasis | `#b87b60` |

Native chrome uses uneven hand-inked paper edges, tiny dry-brush fragments and
small salmon seals. No indigo lacquer, golden trim, gradients, glow or dense
surface decoration. Low ranks retain manga paper labels; high and special
figures are independent transparent cutouts rather than boxed icons.

High symbols are trophy, folded mawashi belts, gunbai fan and zori sandals. Their
filled silhouettes and detail carry value hierarchy at reel scale. W is a monkey
portrait stamp; S is a torii with FS lettering; P is a blank sumo medallion whose
value is supplied by runtime text. Low ranks remain runtime letters on paper.
The additional rope illustration supplies ceremonial supporting art.

2026-10-24 12:40 boxing redraw supersedes the former independently generated
part atlases. Both figures are drawn as complete coherent illustrations first,
then separated and registered back to the same source canvas. Adult 4.5–5 head
proportions, visibly shaped knees and long thighs/calves, outward bent sumo
stance, and two ivory boxing gloves with salmon cuffs replace the short-legged
push-palm design. MG is the bulky smirking veteran in salmon mawashi; FG is a
leaner toothy young champion in ivory mawashi with a short salmon knot.
The exact request and pose references live at root `角色生圖_相撲猴/`.

MG and FG are separate sumo monkey cast deliveries. They use fourteen articulated
parts each, rounded overlap at joints, and a new Spine 4.3 motion export from
`spine-motion`, not the inherited sushi skeleton. Runtime uses the exported
transforms with the compatible custom cast renderer. Preserve complete body
parts beneath moving joints; inspect raised arms for caps and gaps.

## Asset provenance and reproduction

Original bitmap illustrations were generated with the built-in ImageGen tool in
the 2026-10-23 task and restyled from actual SushiMonkey references on 2026-10-24. Style reference: `../SushiMonkey/static/assets/sprites/sushiBackground/bg_base.png`,
`../SushiMonkey/static/assets/sprites/sushiSymbols/h1.png`, and SushiMonkey’s
actual paper labels/UI. Current prompt briefs request the SushiMonkey black/ivory Japanese manga
linework, controlled hatching and sparse muted salmon accents: an empty tournament arena; a transparent 4×2 symbol atlas;
and separate transparent MG/FG articulated character part atlases. Those cast
atlases are historical only and must not regenerate the current boxing cast.
The current cast comes from full-body ImageGen redraws, registered individual
layer edits and reconstructed concealed joint overlaps; see
`design/sumo_boxing_generated_manifest.json` and `角色生圖_相撲猴/交件/`.
The 2026-10-25 correction is specified by
`角色生圖_相撲猴/重拆_v2/重拆單.md`: preserve the cast identity and stance,
remove ivory thigh/knee patches (feet stay ivory), thicken the upper arms,
and re-split complete connected limbs with painted overlap. No arm/biceps
ghosts belong on the torso; no cheek/chest fragments belong on a glove;
no leg fragments belong on the mawashi. The new source and edit provenance
are in `角色生圖_相撲猴/重拆_v2/交件/`. This correction uses the same
per-cast `motion.params.json` as the existing v2 so comparison isolates art.
A final
W-only ImageGen edit preserves the portrait/geometry while making the nameplate
ivory with charcoal WILD text; `design/sumo_source/w_manga_final.png` is the
explicit reproducible W override in `build_sumo_chrome.py` (480px slot, 16px
margins on the unchanged 512px runtime canvas). The exact
ImageGen request history is in the task tool log. The preserved originals are:

- `design/sumo_source/arena.png`
- `design/sumo_source/symbols.png`
- `design/sumo_source/mg_parts.png`
- `design/sumo_source/fg_parts.png`
- `design/sumo_source/w_manga_final.png`

Post-processing is deterministic. `design/sumo_build_layers.py` is the legacy
atlas extractor and must not be run for the current boxing cast. The
`design/sumo_boxing_*` scripts register the parts and verify their full-canvas
reassembly; `design/sumo_trim_layers.py` prepares the
runtime parts. Crop coordinates and rig metadata remain in
`design/sumo_cast/{mg,fg}/`. `design/build_sumo_chrome.py` slices the eight symbols,
fits them to transparent 512px canvases, builds native plates, recolours retained
numeric glyphs and icons, and constructs medallion particles. It reopens the PNGs
and produces `design/sumo/chrome-contact.png`; the symbol reel-scale view is
`design/sumo/symbols-96.png`. Source images are never overwritten by those steps.

`design/build_sumo_store.py` composites the corrected assembled cast and arena
into 1024×1024 thumbnail and 1920×1080 cover layers under root
`upload/SumoMonkey/`. The thumbnail foreground contains one centered MG hero only; the cover may
contain both cast members. Each has a background without wording and a foreground
on true alpha. Compositions marked PREVIEW-only are for review, not the platform BG
slot. Provider logo and original source layers are retained alongside delivery.

## Verification boundaries

Inspect symbols near 96px, original atlas at full size, store composites at full
size, and foreground alpha separately. Source and generated texture paths are
covered by the asset registry gate. Runtime layout, actor joints during motion,
row growth and full feature replay require browser verification; a successful
asset build alone does not verify them. Native generated UI plates are geometric
and intentionally simpler than the bitmap illustration. Bitmap character art
still requires motion inspection to assess articulation and avoid cut-out seams.

## 2026-10-24 measured style check

Measured using the unchanged `game-reskin/scripts/check_style.py`, palette
`#efeadc,#282828,#4a4846,#b87b60`, salmon exclusion `#b87b60:0.20`, Lab tolerance
14, and gates colors95≤100, soft≤50%, non-accent chroma≤20, palette fit≥55%.
`--min-fit .55` accepts a share. Measurements cover real extracted textures,
without palette quantization of the new ImageGen illustration.

| Asset | colors95 | Soft | Non-accent chroma | Palette fit | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| H1 trophy | 64 | 34.6% | 5.5 | 85.6% | Pass |
| H2 mawashi | 58 | 48.2% | 4.0 | 86.3% | Pass |
| H3 gunbai | 58 | 31.7% | 5.9 | 90.7% | Pass |
| H4 zori | 50 | 38.7% | 5.6 | 83.9% | Pass |
| W monkey | 50 | 25.2% | 5.0 | 89.3% | Pass; accent 6.3% |
| S torii | 51 | 39.0% | 5.3 | 87.3% | Pass |
| P medallion | 51 | 31.7% | 6.7 | 92.2% | Pass |
| Rope | 45 | 37.2% | 6.2 | 85.5% | Pass |
| Arena background | 38 | 31.5% | 8.3 | 76.0% | Pass |

Final ImageGen cleanup preserves geometry and changes ink/paper/accent at the
source. Every measured symbol and background now passes colour count, soft shading,
non-accent chroma, palette-fit and accent-share gates. The targeted final W
source uses an ivory nameplate with charcoal lettering and a thin salmon rim,
reducing its accent share from the earlier iteration’s 22.8% to 6.3%.
Earlier manga atlas is archived as `design/sumo_source/symbols_manga_v1.png`.
No palette quantization was used to force a numerical pass.
Detailed command output: `design/sumo/manga-style-metrics.txt`. Reel-scale and
full texture contact: `design/sumo/manga-style-contact.png`; direct Sushi source
comparison: `design/sumo/sushi-reference-comparison.png`. Padded connected-shape
extraction preserves source silhouette edges crossing atlas cell boundaries.

Store exposure check passes on the regenerated delivery: thumbnail BG mean luma
212.6, p10 145.0, dark pixels below 32 only 0.6%; cover BG mean 190.0, p10 85.0,
dark pixels 3.2%. Both foregrounds have true alpha (thumbnail 76.6% transparent,
cover 79.5%) and were inspected composited at full size. Thumbnail keeps one MG
hero. Metrics: `design/sumo/manga-store-metrics.txt`.

Root-measured corrected cast assemblies pass the same style gates: MG colors95
42, soft 40.7%, non-accent chroma 6.6, fit 78.0%; FG colors95 45, soft 45.1%,
non-accent chroma 8.9, fit 74.2%. Root owns those measurements and motion/seam
verification. Cast contact: `design/sumo/manga-casts-180-70.png`.
