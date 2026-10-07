---
name: gb-spine-and-art
description: The art and character pipeline for the Go Bananas slot series (GoBananas / GoBananas100 / GoBananasDelta / GoBoomana) — importing a generated symbol pack, cutting a prop off its background, retargeting the Spine gorilla onto a new PSD, and importing background plates. Use this whenever art arrives from a generator or an artist and has to reach the game: a new symbol set, a replacement character PSD, background plates, a thrown prop, or buy-card art. Use it especially before deciding a piece of art "needs regenerating", because most of that judgement is measurable and the usual reasons given are wrong.
---

# Go Bananas: symbols, props and the Spine gorilla

Four generations share one pipeline, copied per app into `apps/<Game>/design/`.
The scripts are small and the traps are not in them — they are in the judgement
calls around them, and almost every one of those calls has been got wrong once
already.

**The rule under everything here: judge art at the size the game draws it.** A
symbol is 140px on the board. A thrown prop is about 26% of canvas height. Source
pixel counts, zoomed screenshots and "it looks soft" are all worse evidence than
rendering the thing at its real size and looking. Nearly every wrong decision in
this pipeline's history came from judging at the wrong scale.

## "Low quality asset" is not about resolution

Stake certification returns games for "low quality asset". It has **nothing to do
with source pixel dimensions**. An earlier version of `import_symbols.py`
asserted it did, and that claim caused repeated demands to regenerate art that
was perfectly usable — a 500px royal that reads cleanly at 140px is fine.

Report a small source as information. Never treat it as a blocker, and never cite
certification as the reason.

## Importing a symbol pack

`design/import_symbols.py <dir> [--apply]`. Dry run first; it writes nothing
without `--apply`.

**Generate the whole set in one pass.** Symbol packs generated one file at a time
come back in mutually inconsistent styles and plate colours, and the fix is a
colour-correction pass that can only ever approximate. Give the generator one
document (`design/SYMBOL_PROMPTS.md`) describing all of them together.

**`FRAME_CROP` is per pack. Re-measure it every time.** It is the share of the
tile the decorative frame occupies, and it has been 0.16, 0.06 and 0.10 across
three packs of the same game. Inheriting it is silent and it eats the subject: at
16% on a thin-framed pack the gorilla lost the top of his hard hat, both pick
heads were cut off, and the dynamite lost the arcing fuse that was the only thing
distinguishing it from the Scatter. Measure by cropping at several fractions and
looking:

```python
for f in (0.00, 0.06, 0.10, 0.14):
    inset = int(round(min(w, h) * f))
    im.crop((inset, inset, w - inset, h - inset))
```

Pick the smallest fraction that clears the frame. Stop one step before anything
touches an edge.

**`TARGET` is a ceiling, not a size.** Art at or under it is left alone; only
oversized art is brought down. Resampling a 902px crop back up to 1024 invents
nothing and costs a pass — it made the cropped high symbols visibly softer than
the royals, which are never cropped.

### Measure the set, do not eyeball it

Mean luminance per tile, against a set that already works:

```python
g = Image.open(p).convert('L'); px = list(g.get_flattened_data())
print(sum(px) / len(px))
```

Delta's working set runs **70–88** for specials and 117–130 for royals. A pack
that came in at 46–67 was diagnosed instantly: dark objects on a near-black
plate. The worst tile (crossed iron pickaxes at 46.2) was dark-on-dark and
effectively invisible on the board.

The fixes that follow from that number, in order of effect: raise the plate
value, give the subject its own hue, put a rim light along its lit contour, and
make the subject fill ~80% of the tile.

### Two things every symbol must have

**A distinct silhouette AND a distinct colour.** Not one or the other. Two
symbols sharing both are a gameplay problem, not an aesthetic one — confusing the
Scatter with a paying symbol changes what the player thinks is happening. This
has come up three times in one game: crystal vs scatter, dynamite vs scatter,
banana cart vs scatter. Check by rendering the whole set at 140px in a row.

**Plate colour belongs in the prompt, not in a correction pass.** `PLATE_FIX`
exists and should stay empty. A distance-weighted colour shift applied afterwards
is an approximation of a number the generator could have been given.

## Cutting a prop out of its background

Two scripts, and which one applies is decided by what the background *is*.

**`design/dechecker.py` — a painted transparency checkerboard.** Generators asked
for "a transparent background" routinely answer with an opaque JPEG of the
checker pattern. This works because the background is *known*: two flat
achromatic tones, measured off the file's own border. Everything else follows
from that.

**`design/cut_from_plate.py` — an opaque painted plate.** Works only when the
subject and the ground separate on a measurable axis. Go Boomana's dark
desaturated slate against bright saturated dynamite separates on two axes at
once, so the bundle cuts perfectly. Delta's green foliage on a green mossy plate
separated on none, and five approaches all failed.

### A subject that lights its own background cannot be cut by colour

This is the one to recognise early, because it looks like a tuning problem and is
not. A lit fuse throws light onto the plate; lit stone stops being dark or grey
and lands exactly where the tan rope already is. Measured on one tile: lit plate
(175,133,85), (248,213,129), (223,186,133); rope (195,167,127), (125,91,63). No
threshold separates those. Four attempts, each measured, each trading the halo
for the rope.

**The fix is upstream.** Ask for the prop as a transparent-background render and
`dechecker.py` handles it in one pass. Adding a sentence to the prompt costs
minutes; grinding thresholds costs an afternoon and does not converge.

### Glow belongs in the composite, not in the cut-out

A halo baked into a cut-out was lit for the background it was generated against
and will be wrong over any other one — and it inflates the bounding box, which
makes the prop awkward to place. Both the gorilla's headlamp beam and the
grenade's smoke trail were deliberately removed for this reason.

### The guards, and why they are there

- **Refuse an implausible opaque share.** A failed cut that ate the outline
  measured as "70.5% removed" — a number that looked like success. Proportion
  alone is never verification.
- **Enclosed pockets.** Background trapped between an arm and the body is never
  reached by a border flood. Remove it only if the component contains *both*
  checker tones — a flat highlight on the subject is one tone, and the artwork's
  own near-white bits sit squarely on the 255 tone.
- **Detached scraps.** A soft edge that fades into the background comes back as
  confetti once the flood eats its middle. Drop islands under ~2% of the largest.

### Tolerances interact

Loosening one constant to fix one image quietly re-opens another. Widening
`TINT_TONE_FRACTION` from 0.45 to 0.80 with a neutrality guard fixed nothing and
broke two things: it ate a fuse arc on one image and brought back a solid block of
checkerboard beside the gorilla's head on another. **Re-run every previously
cut image after touching a shared constant.**

### Verify on three grounds

Magenta (shows anything left behind), the actual dark game background (shows
whether the edge reads), and **at the size the prop is drawn**. A blocky halo
that is obvious at 400px can be genuinely invisible at 200px, and 200px is what
ships.

## Retargeting the Spine gorilla onto a new PSD

`design/extract_monkey_psd.py <psd>` then `design/generate_monkey_spine.mjs <dir
with node_modules/pngjs>`. Preview with `design/preview_monkey_spine.mjs <dir>
[anim]`.

**Layer names lie, and they lie differently every delivery.** Same character,
same artist, and across two PSDs: `torso_1_coat` became `torso_4_coat`,
`head_4_eye` became `head_1_eye`, `right_arm_0_upper_arm` was 0×0 in one file and
a real piece in the next, and `left_arm_1_forearm` was the entire limb in one and
a small cuff in the other.

Three consequences, all already built in — do not undo them:

- **Parts resolve by regex prefix from `layers.json`**, never a hard-coded list.
  A renamed decoration silently vanished from the rig before this.
- **The generator warns** on bones with no artwork and layers claimed by no bone.
  Both are real defects; neither is tolerable silently.
- **`_compare.png`** puts the PSD's own flatten beside the rebuild. Check it
  before anything else — it proves nothing was dropped.

### Never inherit joint coordinates

They were fifteen hand-measured numbers and every one was silently wrong the
moment a new PSD arrived — on one delivery the left knee sat 70px above the calf
and the right knee 90px below it, which would have folded the character
mid-shin.

A limb joint is not a choice. It is where two consecutive pieces meet, so it is
**derived**: the top-centre of the distal piece, pulled `JOINT_INSET` into it. A
limb rotating about the exact top edge of its own art tears off the body, which
is what the inset is for. Only the hip, waist and neck are given explicitly —
they sit inside the torso mass with no piece edge to read.

### When a piece spans a joint

Check the pieces against the joints before trusting the names:

```python
# render each piece with the joint markers drawn on it
d.ellipse((jx-10, jy-10, jx+10, jy+10), outline=colour, width=4)
```

If a piece runs past a joint — a `_2_hand` that is really forearm-and-fist from
elbow to below the wrist — hang it off the **proximal** joint and mark the distal
one `fuse`. A fused joint keeps its place in the chain but its rotation is moved
to the parent, **scaled by the lever-arm ratio**. Unscaled, an animation asking
for 29° produced 54° and threw the fist past the far side of the body.

### The angle budget is a property of the drawing

`MAX_SHOULDER` and friends are not style choices — they are the angle past which
a limb visibly leaves the body, and they are different for every artwork.
Generate with `--sweep` and preview `_sweep_armL` etc: eight frames at 0, 10,
20 … 70 degrees. One command instead of an afternoon.

Two findings worth carrying: **inward swings tolerate far more than outward
ones** (the shoulder pivot is inside the torso, so an inward swing tucks the
sleeve in rather than pulling it off), and **the two arms usually need different
numbers** because the artwork hangs them at different distances from the centre
line.

### Draw order is set by the PSD and cannot be rotated around

If a limb's layers sit below the torso's `z`, that limb is the *back* arm and no
rotation will bring it in front. Chasing that with bigger angles makes the pose
worse and fixes nothing — the fist slides behind the chest either way.

The fix is `FRONT_COPIES`: a second slot at the end of the draw order pointing at
the same atlas region via `path`, empty in the setup pose, switched on by the
animation that needs the limb in front. No new machinery — it is the same
mechanism the thrown prop already uses.

### Read positions out of the animation, never recompute them

Anything outside the skeleton that needs to know where a hand is — the transition
spawning a prop at the release, the comic impacts landing on the fists — must
read it back with forward kinematics from the generated animation. The generator
prints them:

```
release  hand at (-349, 495) at t=0.58
beat     R fist at (60, 437) at t=0.48
         L fist at (-63, 380) at t=0.78
```

A hard-coded release point recomputed from `THROW_SHOULDER` kept printing a stale
number after the elbow was fused, and the transition would have spawned the prop
where the hand used to be. Copy these three numbers into `Mascot.svelte` whenever
the rig or the beat angles change.

### Diagnostics do not ship

`--sweep` animations are off by default. Check `grep -c _sweep
static/assets/spines/*/monkey.json` returns 0 before finishing.

## Background plates

`design/import_backgrounds.py <dir> [--apply]`.

**The plate is stretched to the canvas with no aspect preservation.** Ask for
16:9 at 1920 or wider. A 2.36:1 delivery cropped to 16:9 left 1195px to upscale
and the softness never came back; a 1.79:1 delivery needed a 5px crop.

**Composition constraints, because most of the plate is covered:** the centre
~55% wide by 70% high is the board and its housing, and the mascot stands in the
right margin. Interest belongs in the top band and the left edge; the centre must
be dark and quiet.

**There is no opaque backing behind the reels.** The high symbols, wild, scatter
and the feature symbol render frameless at 0.88, so roughly a quarter of each of
those cells is background showing through. Measure luminance per board row inside
the reels' footprint before applying:

```
row 1        mean   >200 luminance
bg_base      107     9.7%
bg_feature   198    59.7%      <- a white panel behind the top row
```

That feature plate needed a haze pass. Write the constraint into the prompt
instead — a later set came back at 2.6% and needed nothing.

**Do not overlay light onto a plate that has its own.** Animated sun shafts left
over from a jungle theme were still being drawn over mine tunnels, where there is
no sky; a coloured halo behind warm title type on a warm backdrop thickened the
letters instead of lighting them; two warm pools under the title fought the
lantern painted into the plate. Same mistake three times, always added when the
backdrop was empty and never removed when it stopped being empty.
