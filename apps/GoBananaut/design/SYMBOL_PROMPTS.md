# GO BANANAUT — symbol prompts

14 symbols + 1 marker + 1 transition prop. Written against Go Bananas Delta's
shipped set, which is the reference for style, value structure and readability —
this is that set retold in space, not a new look.

**Give the generator this whole document at once.** Not one block at a time.
Packs generated a file at a time come back in mutually inconsistent styles and
plate values, and the only fix afterwards is a colour-correction pass that can
never do better than approximate. If the tool will only take one prompt, at
minimum keep L1–L5 in one pass and H1–H4 in one pass.

Hard specs: 1024×1024 square. No text anywhere except the letters on L1–L5.

Acceptance test: shrink the whole set to **100px tall** and lay them in a row on
the dark board colour. Anything you cannot name at 100px gets regenerated. In
game a symbol is 112px and about 100px on screen — the source resolution is not
the test, and a small source is never on its own a reason to regenerate.

---

## What Delta actually does, measured

Mean luminance over opaque pixels, Delta's shipped set:

| symbol | | symbol | |
|---|---|---|---|
| h1 helmet | 70.5 | l1 A | 120.9 |
| h2 pineapple | 85.3 | l2 K | 127.7 |
| h3 crate | 81.3 | l3 Q | 126.5 |
| h4 compass | 87.6 | l4 J | 129.7 |
| w gorilla | 74.9 | l5 10 | 116.5 |
| s flowers | 78.7 | p coin | 101.2 |

**Specials 70–88, royals 116–130.** Hit that band. A previous pack that came in
at 46–67 was diagnosed off this number alone — dark objects on a near-black
plate, the worst tile effectively invisible on the board.

Measure it before deciding anything looks wrong:

```python
from PIL import Image
im = Image.open(path).convert("RGBA")
g, a = im.convert("L"), im.getchannel("A")
px = [v for v, av in zip(g.get_flattened_data(), a.get_flattened_data()) if av > 8]
print(sum(px) / len(px))
```

Opaque pixels ONLY. Averaging transparent background in drags every plateless
symbol toward zero and makes a perfectly readable one look like that 46–67
disaster.

Two observed weak points in Delta worth not repeating: **h1 and w are the two
darkest tiles and the two hardest to read at 100px.** Do not let this game's
equivalents — the boot and the helmet — land at the bottom of the band.

---

## The style, and where it stops

Delta is **hand-painted digital illustration**: visible brushwork, softly blended
form shadows, a dark painterly contour around each subject. It is not a photoreal
render, not a 3D render, not flat vector, not cel shading.

Keep that. Push the SHAPES further — chunkier, more exaggerated, more fun — and
leave the materials alone. Steel is steel; it scratches, dents and gets dirty.

**Push toward:** heavy exaggerated proportions, big simple masses, one or two
oversized hero features per object, few but bold details.

**Never:** faces on inanimate objects, eyes, blush marks, hearts, stars,
sparkles, sticker outlines, pastel candy palettes, everything rounded off
harmless, toy plastic surfaces, mascot styling on hardware.

Think a well-built animated feature's prop design, not a mobile-game icon set.

### The value structure is why Delta reads at 100px

This is the part that is easy to miss and does most of the work. Every Delta
subject contains, inside its own form, **both a near-white specular highlight and
a near-black core shadow**, plus a dark painterly contour around its outer edge.
That internal contrast is what survives being shrunk. Surface detail is not.

Saturation is spent sparingly: one saturated accent per object, everything else
muted. The pineapple's yellow-green, the bananas' yellow, the Scatter's hot pink
— and nothing else in the set competes with them.

---

## The one structural rule

**The low symbols sit on a plate. The high symbols do not.**

> **This is a deliberate departure from Delta.** Delta's highs sit on an opaque
> mottled green ground; only the decorative border was cropped away on import.
> Here the highs are cut out on transparency and float in the dark of the board.
>
> Two reasons. A mottled square ground reads as a tile pasted onto space rather
> than an object in it. And this game's board is a 4-row reel standing in a 6-row
> frame, so a third of it is open void on most spins — objects floating is the
> only coherent read for a board shaped like that.
>
> Do not "fix" this by adding grounds back.

Lows are a pale, completely colourless slab. Highs are a bare subject on
transparent background with no plate, no frame and no backing card of any kind.

The low plates butt up against each other and **are** the grid — they render at
full cell size, so any gap between them opens a visible hole in the wall. The
highs render at 0.88 of a cell and float with air around them.

It also does the reading work for free: **brightness belongs to the lows,
saturation belongs to the highs.** The pale plates are bright but have no hue at
all; the highs are darker but each carries its own saturated colour. They compete
on different axes, so the plates never pull attention off the highs, and plate
versus no-plate tells low from high before you have identified anything.

Because there is no plate behind them, the **dark contour plus the upper-left rim
light is the entire separation** for every high symbol. Without both, the subject
dissolves into the board.

### The hue map

One saturated accent each, and they must not collide:

| | hue |
|---|---|
| H1 astronaut helmet | golden yellow / amber |
| H2 suit thruster | ice-cyan / electric teal |
| H3 magnetic boot | lime / chartreuse |
| H4 life-support pack | royal purple / violet |
| W helmet | brass / gold |
| S distress beacon | signal red-orange with blue-steel hood |
| P token | warm brass |
| X clamp | desaturated gunmetal, deliberately dull |
| L1–L5 | none at all |

Every symbol needs **a distinct silhouette AND a distinct colour** — not one or
the other. Two symbols sharing both is a gameplay problem, not an aesthetic one.

Check the Scatter hardest. In this series a Scatter has been confused with a
paying symbol three separate times (crystal, dynamite, banana cart).

---

## STYLE

```
Hand-painted digital illustration for a video slot symbol. Painterly rendering
with visible brushwork and softly blended form shadows. Not a photoreal render,
not a 3D render, not flat vector art, not cel shading with hard bands.

Single subject, centred, square composition, filling about 90% of the frame with
clear margin on every side and never touching an edge.

Chunky stylised proportions with big simple masses and one or two oversized hero
features, but real materials with real wear — scratched painted steel, scuffed
fabric, dented brass. No faces on objects, no eyes, no sparkles, no sticker
outlines, no toy plastic, no mascot styling.

Value structure: the subject contains both a near-white specular highlight and a
near-black core shadow inside its own form, a dark painterly contour around its
outer edge, and a bright cold rim light along its upper-left contour.

Lighting: cold blue-white key from the upper left, warm bounce filling the lower
right, deep space setting. One saturated accent hue per object, everything else
in that object muted.

No text, no numbers, no logos, no watermarks, no UI, no border, no frame, no
backing plate, no card, no drop shadow cast outside the subject. Isolated subject
on a fully transparent background.
```

---

## L1–L5 — the card royals (THE ONLY ONES WITH A PLATE)

Five images, identical except the letter: **L1 = A, L2 = K, L3 = Q, L4 = J,
L5 = 10**. Generate all five in one pass or you will get five different
typefaces.

This is Delta's strongest device and it is copied structurally — pale cracked
slab, four corner bolts, a deeply carved dark letter with a lit bevel. Only the
material story changes. Target luminance 116–130.

```
The single character "A" carved deeply INTO a pale stone slab. The slab fills the
entire square frame edge to edge with no margin and no background visible around
it, with a thin dark border and one dark countersunk bolt inset at each of the
four corners.

The stone is bone-grey lunar regolith, colour #C6C2B4, entirely colourless — no
rust, no paint, no tint, no hue anywhere. Its face carries a network of hairline
cracks, is powdered with fine dust, and is chipped and knocked about along its
edges. Chunky and heavy.

The character is a deep clean recess: near-black in the bottom of the cut, a
bright lit bevel along its upper-left edge, and soft shadow pooling inside the
recess on the lower right, so it reads unmistakably as carved and not printed.
Heavy industrial sans-serif, very thick even strokes, chunky and oversized,
filling most of the slab.

Cracks, dust, pitting and chips appear ONLY on the slab face and NEVER cross the
character's strokes — the letterform must stay a crisp unbroken silhouette.

The slab is the brightest thing in the entire symbol set.
```

Repeat with `"K"`, `"Q"`, `"J"`, `"10"` in place of `"A"`.

---

## H1–H4 — the high symbols

Four oversized pieces of astronaut equipment, each with its own silhouette and
dominant hue. **No plate on any of them.** On the 0.88-cell game scale, their
painted bounds occupy about 82–88% of the cell. Keep every piece readable at
100px and retain the near-white highlight and deep shadow within the object.

## H1 — golden astronaut helmet (top pay)

```
A single golden astronaut exploration helmet with a large spherical honey-gold
visor, thick dark bronze protective rim, and chunky side fittings. Strong round
silhouette, generous near-white reflection and deep amber-black core shadow.
Painterly 2D game art with simple bold hardware. It fills nearly 90% of its
square transparent canvas, with every part inside the edge. No face, person,
backing plate, frame, text or extra objects.
```

## H2 — cyan suit thruster (glowing)

```
A compact suit-mounted rocket thruster on an upper-right to lower-left diagonal.
The chunky navy metal engine has large icy cyan vents and a broad electric teal
plume extending toward the lower-left corner. The flame has a near-white core
and deep blue edge. Big readable masses, a few bold mechanical details, no
tiny clutter. The complete unit fills nearly 90% of a transparent square,
without a frame, plate, text, sparks or extra objects.
```

## H3 — lime magnetic boot

The gorilla's own kit, a tall L-shaped silhouette that differs from the round
helmet, diagonal thruster and rectangular pack.

```
A single massive magnetic astronaut boot, viewed three-quarter side on. Vivid
lime-green and chartreuse armour, dark forest-green padded ankle, graphite sole
and silver buckles. Oversized thick sole with a few glowing green magnetic pads
is the hero feature. Keep near-white specular highlights and deep near-black
shadows for readability. Painterly 2D game art, nearly filling a square
transparent canvas. No person, plate, frame, text or extra objects.
```

## H4 — violet life-support pack

Worn kit again, but a standing rectangle against H3's lying L.

```
A chunky upright astronaut life-support backpack in royal purple and violet,
with two strong side oxygen canisters, a large luminous central circular dial,
solid top handle, a few bold clasps, and small magenta status lights. Dark indigo
depth and near-white highlights make the pack readable at 100px. Painterly 2D
game art filling nearly 90% of a transparent square. No person, plate, frame,
text, numbers or extra objects.
```

---

## W — wild (astronaut helmet)

Delta's gorilla tile is one of its two darkest and hardest to read. This one must
not be. Keep the brass ring and the visor highlight bright.

```
A gorilla astronaut's helmet floating in space, filling the frame, seen slightly
from below so it reads as heroic. An oversized chunky hard shell in scuffed white
and brass, exaggeratedly round and heavy, with a thick brass neck ring below and
a broad curved gold visor taking up most of the front. A strong near-white
specular sweep across the upper-left of the visor glass, and a bright polished
highlight along the brass ring. Inside the visor, dim and low-contrast, a
gorilla's face lit from within by console light — a real ape face, never a
cartoon character face, and never bright enough to become the subject. The visor
glows faintly; the shell is lit, not glowing. Bright cold rim light along the
upper-left of the shell, dark painterly contour all around. Isolated on a fully
transparent background — no plate, no frame, no backing card.
```

## S — scatter (emergency beacon)

```
A single oversized emergency space distress beacon. A huge spherical
signal-red and coral-orange glass globe sits at centre-right inside a thick
dark gunmetal safety cage. A blue-steel hinged protective hood is raised at
upper-left; one short coiled cable hangs along the left side into a sturdy base.
The globe has a near-white hot core and deep red shadows, distinctly redder
than H1's golden visor. Large simple painterly masses read at 100 pixels.
The complete object fills nearly 90% of a square transparent canvas. No plate,
frame, card, text, beams, sparks or extra objects.
```

---

## P — prize token (hold and spin)

```
A thick chunky circular credit token floating in space, filling the frame, face
on and tipped very slightly so its depth reads. Exaggeratedly deep, like a heavy
coin. A broad brushed brass rim with a rope-knurled edge, and a deeply recessed
blank centre field, entirely empty and smooth with no text, symbol or engraving
of any kind — a number is drawn over it later by the game. Warm brass with a
bright near-white specular sweeping the upper-left rim and near-black shadow in
the recess on the lower right. Isolated on a fully transparent background — no
plate, no frame, no backing card.
```

## X — empty clamp (hold and spin blank)

```
An empty cargo clamp, filling the frame. Big blunt open steel jaws with nothing
held in them and a vacant socket behind, cold and unlit. Desaturated gunmetal,
very low contrast, deliberately dull and uninteresting — this is a miss and must
read instantly as nothing. Keep it simple, flat and boring next to the rest of
the set: no specular highlights, no indicator lamps, no glow, no accent hue.
Isolated on a fully transparent background — no plate, no frame, no backing card.
```

---

## GROW MARKER / GRAVITY CHARGE

One object, three sizes. This is the game's mechanic symbol: it rides on an
ordinary symbol, flies off, and the reel stretches. The mascot throws the
full-size version at every transition, so the silhouette has to survive from full
screen down to a 30px corner badge.

It is a **lit metal object, not a glowing body** — that keeps it out of the
glowing category H1 and H2 own, so it can never be mistaken for them.

The banana curve is the silhouette, which is also the series' one piece of
inherited identity. Asymmetric and curved tumbles far better than something
symmetrical when it is thrown.

### Full size — the thrown prop (1024×1024)

```
A pressurised gas canister shaped like a banana, floating in space, filling the
frame, seen three-quarters on. A fat curved tapering steel vessel with an
exaggerated banana bend and three big raised band hoops around its waist. A
chunky brass valve assembly and one oversized round pressure gauge at the thick
end as the hero feature, bold stencilled hazard chevrons in worn paint across its
belly, a stubby carry lug at the thin end. Scuffed brushed steel with pale yellow
painted panels showing through the wear, a bright near-white specular running
along its upper-left length and near-black shadow beneath. Thick wisps of white
vapour venting from the valve, kept close to the valve and not reaching the frame
edge. It is LIT, not glowing — cold blue-white key from the upper left, dark
painterly contour all around. No text or numbers on the gauge or the body.
Isolated on a fully transparent background.
```

### Corner badge — the marker on a symbol (256×256)

This one sits ON TOP of the other symbols, so it cannot rely on hue to separate
itself — it has to work over amber, cyan, silver-green, violet, brass and hot
orange alike. Separation comes from a dark contour plus a bright core, which
works on all of them.

```
The same banana-shaped pressure canister, reduced to a bold simple badge for use
at 30 pixels. Three-quarter view, one strong silhouette, the banana curve and the
three band hoops exaggerated and every small detail dropped — no gauge, no
chevrons, no vapour. Bright warm steel and pale yellow body with a hard dark
outline contour around the whole shape and a bright hot near-white core along its
upper-left edge, so it stays legible laid over any colour underneath. Very high
contrast, minimal internal detail, no text. Transparent background.
```

### Burst — the transition (1024×1024, 8-frame sheet is fine)

```
A pressurised canister rupturing in vacuum: an expanding ring of pale cyan light
racing outward, thin vapour sheets peeling off it. No fire, no orange, no smoke
plume. The shockwave silhouette is a clean widening ring rather than a ball,
painted boldly and graphically rather than as fine simulation detail. Motes and
debris drift UPWARD out of the ring rather than being flung outward in all
directions. Cold cyan and white only. Transparent background.
```

Note the burst brief: the silhouette is an explosion, the behaviour is a lift.
Everything the wave passes drifts up and out of frame instead of being blown
sideways — the transition should teach the mechanic, not just cover the cut.

Cyan here is deliberate and matches the in-game animation, which is already built
in cyan (`ReelGrow.svelte`). It reads as the same event whether it is a
full-screen transition or a reel stretching.

---

## Handing the pack to the import

`design/import_symbols.py <dir>` — dry run first, it writes nothing without
`--apply`.

**`FRAME_CROP` must be 0 for this pack.** It is the share of the tile a
decorative frame occupies, and it is re-measured per pack because it has been
0.16, 0.06 and 0.10 across three packs of the same game — inheriting it is silent
and it eats the subject. In THIS pack nothing has a decorative frame at all: the
highs and specials are cut out on transparency, and the low slabs are full-bleed
and ARE the tile. Any nonzero value here crops real art.

**`PLATE_FIX` stays empty.** The slab colour is in the prompt (#C6C2B4) precisely
so it never has to be approximated by a distance-weighted shift afterwards.

**`TARGET` is a ceiling, not a size.** Art at or under it is left alone. Do not
resample a smaller crop back up — it invents nothing and visibly softens the
result next to the tiles that were not resampled.

**Expect an opaque checkerboard instead of transparency.** Generators asked for a
transparent background routinely deliver an opaque image of the checker pattern
instead. That is fine and expected — `design/dechecker.py` handles it in one
pass, because the background is two flat achromatic tones it can measure off the
file's own border. It is only a problem if the subject LIGHTS its background,
which is why every glow in this document is told to hug its source instead of
spilling outward.

Verify a cut on three grounds: magenta (shows anything left behind), the actual
dark game background (shows whether the edge reads), and at the size the symbol
is actually drawn.

---

## Composition rule for the marker

A marker badge clamps to the **top-left corner** of a cell. So no symbol may
depend on its top-left corner to be identifiable: keep every identifying feature
— a sole, a gauge, a visor, a storm, a letterform — in the lower two thirds and
toward the centre.

This bites hardest on the plateless highs, where the top-left is also where the
rim light lives. Put the rim light there, but never the thing you identify the
symbol by.
