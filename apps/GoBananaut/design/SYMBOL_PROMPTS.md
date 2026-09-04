# GO BANANAUT — symbol prompts

14 symbols + 1 marker + 1 transition prop. Paste the STYLE block first, then one
symbol block. Generate L1–L5 together in a single pass.

Hard specs: 1024×1024 square. No text anywhere except the letters on L1–L5.
Subject fills ~80% of the frame with ~8% clear margin, never touching the edge.

Acceptance test: shrink the whole set to **100px tall** and lay them in a row.
Anything you cannot name at 100px gets regenerated. In game a symbol is 112px
and about 100px on screen — the source resolution is not the test.

Two plates, on purpose: **brightness belongs to the low symbols, saturation
belongs to the high symbols.** Lows sit on a pale, completely colourless plate;
highs are darker but each carries its own saturated hue. They compete on
different axes, so the pale plates never steal attention from the highs, and
cell brightness alone tells low from high.

---

## STYLE

```
Video slot machine symbol art, single subject, centred, square composition.
Deep-space setting. Key light from the upper left, cold starlight, with a warm
bounce filling the lower right. Every subject carries a bright rim light along
its top-left contour that separates it from the plate behind it. Rendered
painterly-realistic with clean readable silhouettes, no outlines, no cel shading.
Surface wear and scratches sit ON surfaces and never break a contour. No text,
no logos, no watermarks, no UI, no border frame, no drop shadow outside the
subject. Transparent-friendly dark background.
```

---

## L1–L5 — the card royals

Five images, identical except the letter: **L1 = A, L2 = K, L3 = Q, L4 = J,
L5 = 10**. Generate all five in one pass or you will get five different
typefaces.

```
The single character "A" cut deeply INTO a pale weathered slab of lunar
regolith, like a marker plate bolted to the hull of a station. The slab is
bone-grey stone, colour #C6C2B4, entirely colourless — no rust, no paint, no
tint, no hue anywhere. Its face is finely cracked, powdered with dust and
chipped at the corners. The character is a deep clean recess with a lit bevel
along its upper edge and shadow pooling in the cut, so it reads as carved and
not printed. Dust, pitting and micro-craters appear ONLY on the slab face and
NEVER on the character's strokes — the letterform must stay a crisp unbroken
silhouette. Heavy industrial sans-serif, thick even strokes, filling most of
the slab. Slab is brighter than everything around it.
```

Repeat with `"K"`, `"Q"`, `"J"`, `"10"` in place of `"A"`.

---

## H1 — gas giant (top pay, glowing)

```
A banded gas giant planet hanging in space, seen close enough to fill the frame.
Warm amber and ochre cloud belts with a great swirling storm, softly
self-luminous so the planet is the brightest thing present. A thin bright ring
system cuts across it at a low angle, catching the light. Behind it a dark slate
plate, colour #3E4650, with riveted corners, mostly hidden by the planet. The
planet's glow spills onto the plate around its limb.
```

## H2 — comet (glowing)

```
A comet nucleus wrapped in a glowing coma, filling the frame. Ice-cyan and pale
white, self-luminous, with two streaming tails swept up and back out of frame.
The nucleus is a cratered dirty-ice body with bright jets venting from its
sunward face. Behind it a dark slate plate, colour #3E4650, with riveted
corners, mostly hidden. Cold cyan light spills onto the plate.
```

## H3 — satellite (lit metal, not glowing)

```
A boxy communications satellite seen three-quarters on, filling the frame. Bare
brushed aluminium and silver-green foil panels, a dish antenna angled toward the
viewer, folded solar wings, exposed thruster nozzles. It is LIT, not glowing —
hard cold key light from the upper left, deep shadow on its lower right, and a
bright rim light down its top-left edge lifting it off the plate. Small
silver-green indicator lamps only. Behind it a dark slate plate, colour #3E4650,
with riveted corners.
```

## H4 — deep-space probe (lit metal, not glowing)

```
A compact deep-space probe seen three-quarters on, filling the frame. Dull
titanium body wrapped in violet-tinted thermal blanket, a high-gain dish, a
sensor boom, a nuclear generator fin. It is LIT, not glowing — hard cold key
light from the upper left, deep shadow on its lower right, bright rim light down
its top-left edge. Small violet indicator lamps only. Behind it a dark slate
plate, colour #3E4650, with riveted corners.
```

---

## W — wild (astronaut helmet)

```
A gorilla astronaut's helmet floating in space, filling the frame, seen slightly
from below so it reads as heroic. Scuffed white-and-brass hard shell, heavy
brass neck ring, a broad curved gold visor. Inside the visor, dimly visible, a
gorilla's face lit from within by console light. The visor glows faintly; the
shell is lit, not glowing. Bright rim light along the top-left of the shell.
Behind it a dark slate plate, colour #3E4650, with riveted corners.
```

## S — scatter (emergency beacon)

```
A rotating emergency beacon floating in space, filling the frame. A heavy
industrial lamp housing in scorched steel with a caged hot-orange lens throwing
hard rotating light beams out past the frame edge. The lens is fiercely
self-luminous in hot orange — a hue used by nothing else in the set — with
volumetric beams and lens flare. A stubby mounting foot and coiled cable below.
Behind it a dark slate plate, colour #3E4650, with riveted corners.
```

---

## P — prize token (hold and spin)

```
A thick circular credit token floating in space, filling the frame, face on.
Brushed brass rim with a deeply recessed blank centre field, entirely empty and
smooth with no text, symbol or engraving of any kind — a number is drawn over it
later by the game. Warm brass, softly glowing edge, bright rim light along the
top-left. Behind it a dark slate plate, colour #3E4650, with riveted corners.
```

## X — empty clamp (hold and spin blank)

```
An empty cargo clamp on a station wall, filling the frame. Open steel jaws with
nothing held in them, a vacant socket behind, cold and unlit. Desaturated
gunmetal, very low contrast, deliberately dull and uninteresting — this is a
miss and must read instantly as nothing. No indicator lamps, no glow. Behind it
a dark slate plate, colour #3E4650, with riveted corners.
```

---

## GROW MARKER / GRAVITY CHARGE

One object, three sizes. This is the game's mechanic symbol: it rides on an
ordinary symbol, flies off, and the reel stretches. The mascot throws the
full-size version at every transition, so the silhouette has to survive from
full screen down to a 30px corner badge.

It is a **lit metal object, not a glowing body** — that keeps it out of the
glowing category H1 and H2 own, so it can never be mistaken for them.

The banana curve is the silhouette. Asymmetric and curved also tumbles far
better than something symmetrical when it is thrown.

### Full size — the thrown prop (1024×1024)

```
A pressurised gas canister shaped like a banana, floating in space, filling the
frame, seen three-quarters on. A curved tapering steel vessel with three raised
band hoops around its waist, a brass valve assembly and small round pressure
gauge at the thick end, stencilled hazard chevrons in worn paint, a carry lug at
the thin end. Scuffed brushed steel with pale yellow painted panels showing
through the wear. Wisps of white vapour venting from the valve. It is LIT, not
glowing — hard cold key light from the upper left, deep shadow lower right,
bright rim light down its top-left contour. No text or numbers on the gauge or
the body.
```

### Corner badge — the marker on a symbol (256×256)

```
The same banana-shaped pressure canister, reduced to a bold simple badge for use
at 30 pixels. Three-quarter view, strong single silhouette, the banana curve and
the three band hoops exaggerated and the small details dropped. A soft cyan glow
ring behind it so it separates from any symbol art underneath. High contrast,
minimal internal detail, no text. Transparent background.
```

### Burst — the transition (1024×1024, 8-frame sheet is fine)

```
A pressurised canister rupturing in vacuum: an expanding ring of pale cyan light
racing outward, thin vapour sheets peeling off it, no fire and no orange, no
smoke plume. The shockwave silhouette is a clean widening ring rather than a
ball. Motes and debris drift UPWARD out of the ring rather than being flung
outward in all directions. Cold cyan and white only.
```

Note the burst brief: the silhouette is an explosion, the behaviour is a lift.
Everything the wave passes drifts up and out of frame instead of being blown
sideways — the transition should teach the mechanic, not just cover the cut.

---

## Composition rule for the marker

A marker badge clamps to the **top-left corner** of a cell. So no symbol may
depend on its top-left corner to be identifiable: keep every identifying
feature — a dish, a visor, a storm, a letterform — in the lower two thirds and
toward the centre.
