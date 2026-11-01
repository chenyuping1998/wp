# Static Shift — ink revision 3: what still reads as generated

2026-10-19, Claude review of the ink pass (user: 「不要有AI感」). Checked against the
14 tells in `wp/.claude/skills/game-reskin/references/art-direction.md` at
full size, 180 px and 70 px.

## Already fixed in code (no redraw needed)

| what | why | how |
|---|---|---|
| MG engineer's sneakers had three side stripes | reads as Adidas — the model's default "sneaker" and an Engine #253 resemblance risk | `design/retouch_brand_details.py` refills the stripes with the shoe's own leather |
| FG host's boots had yellow welt stitching | reads as Dr. Martens | same script: stitch recoloured to the boot's dark leather |
| L5 sneaker had the white round ankle patch | reads as Converse All Star | same script: patch turned to tonal canvas red, its stitched outline kept |
| Scatter landing / entry-reveal burst was a soft additive glow, gold stars and Go Banandit jungle leaves | tell 4 (baked light, sparkles) and an old-game leftover | `FxBurst.svelte` redrawn as a hard comic impact star, ink speed slashes and broken radio arcs; `fxLeaf` removed |
| entry-reveal covers and landing dust used Go Bananas jungle green / soil brown | old-game palette | studio ink `#15191f` / `#22252e` |

The retouch script runs after `integrate_ink_pass.py` and before
`build_store_v2.py`; originals are in `research/staticshift/before-brand-retouch/`.

Code flattening was tested and rejected for the items below: quantising the
symbols at 2× cut colors95 by more than half but soft only 8–10 points,
kept every metal sheen and dulled the red accents (the posterised-render trap,
tell 3). These have to be drawn again.

## Redraw list (priority order)

All items: transparent background (true alpha), same light from upper left,
same three-quarter view as the current set, same §0 palette. Two flat shadow
steps plus solid black spot shadows; **no gradients, no metallic sheen, no
specular highlight, no glow, no bokeh, no lettering**. No paper grain or
scratches in the drawing — the grain is applied once in code to the whole set.
Deliver at 1024 px; `integrate_ink_pass.py` scales to 512.

### 1. W — Relay (Wild)
Now: polished gold with a top-left sheen, a glowing core, and curly pipes on
the base that are not any real part (tells 1, 4, 7).
Ask: a home-built pirate-radio transmitter mast on a squat painted-tin base —
mustard enamel `#e7aa53` with black spot shadows, chipped paint shown as flat
black shapes, three rivets per panel, one coil of cable, a plain round antenna
ball. Lightning stays as flat cartoon bolts in signal green `#b8d080` with an ink
rim. Nothing lit from inside.

### 2. L3 — Microphone
Now: chrome with specular sheen (tell 1).
Ask: 1950s ribbon microphone in flat grey enamel `#8294b6` / `#535e88`, the grille
drawn as 7 horizontal black slots, one black spot shadow down the right side,
a hand-taped cable join. No reflections.

### 3. H2 — The Selector (bob, sunglasses)
Now: a fashion-model face — symmetric, pouting, perfect skin (tell 11).
Ask: a woman in her late 40s, a record-shop selector: heavy black bob with a
grey streak, wide jaw, slightly crooked nose, a chipped front tooth showing in
a dry half-smile, cat-eye glasses pushed down so one eye shows, crow's feet,
one gold hoop. Same crop as now.

### 4. FG host (full figure, cast)
Now: the same generic pretty face as H2, airbrushed skin (tell 11). Keep the
pose, outfit, mic and the planted feet exactly (the mesh rig and reaction
checks depend on them).
Ask: a broadcaster in her 30s with a gap in her front teeth mid-laugh, a scar
through one eyebrow, freckles across a broad nose, uneven bleached locs with
dark roots, round green glasses sitting crooked. Skin in two flat tones plus
black spot shadow, no gradient. Boots: generic black lace-up work boots, plain
black welt (no yellow stitching).

### 5. H3 — The Caller (punk)
Now: the ear is pointed like an elf's (tell 8).
Ask: same character, a normal human ear with three ring piercings.

### 6. MG engineer — shoes only, if the cast is redrawn
The code retouch is clean at game size. If the figure is ever repainted:
plain off-white canvas skate shoes, no side stripes, no shell toe.

### 7. Optional: L5 sneaker
The ankle patch is gone; the toe cap and diamond rubber foxing still lean
Converse. If redrawn: a beaten-up red canvas high-top with a plain rubber toe,
fat laces, one torn eyelet, no round patch, no stripes.

## Check after delivery

```
/Applications/anaconda3/bin/python3 wp/.claude/skills/game-reskin/scripts/check_style.py \
  apps/StaticShift/static/assets/sprites/staticShiftSymbolsInk/*.png --sheet /tmp/ss_sheet.png
```
Target for the redrawn items: soft ≤ 30% (current set 32–44%), and the 70 px
greyscale column still tells W, S and P apart. Then rerun
`design/retouch_brand_details.py` (it is idempotent), `build_store_v2.py`, and
`zsh design/ship.sh` with `SKIP_STUB=1`.

## Implementation status — 2026-10-19

Mandatory redraws implemented and locally staged. Final metrics, rebuild and verification: qa/INK3_QA.md (design/qa in source). Original requirements above retained as review history. Optional L5 redraw remains optional; existing brand retouch retained. Platform unchanged.
