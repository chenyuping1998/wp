---
name: mesh-cast-rig
description: Animating a full-body character from ONE flat illustration, using a skinned mesh instead of cut-out parts — the pipeline behind Hot Miami's board-side cast. Use this whenever a character needs to move and the art arrives as a single image: a mascot beside the reels, a figure on an intro card, anything that has to breathe or react to a win. Use it especially INSTEAD of cutting the figure into Spine parts, because the seams that approach produces are the reason this pipeline exists. Covers building the rig from the image, painting weights, the motion tables, the measured limits on how far it can move, and the verification without which none of it can be trusted.
---

# One image, one mesh, a character that moves

Hot Miami's cast were flat cut-outs. Making them move was attempted first the
obvious way — slice the figure into Spine parts, rig the parts — and that failed
five separate times over two weeks, every time on the same thing: **visible
seams at every joint**. Parts drawn independently do not line up; parts sliced
from one drawing do line up but then have hard edges where they meet; hiding the
edge means overlapping the parts, and overlapping parts slide against each other
the moment they rotate.

This pipeline does not have that problem, because **there is nothing to seam**.
The character stays ONE image. A triangle mesh is laid over it, each vertex is
weighted to some bones, and bending a joint deforms the mesh continuously. No
cuts, no layers, no registration, no atlas.

What it costs: **the amount of motion is limited, and the limit belongs to the
drawing**. A stretched texture is the failure mode here, the way a visible seam
was the failure mode there. Most of this document is about finding that limit
honestly and staying inside it.

## What you need before starting

**One PNG of the whole character, transparent background, standing.** That is
genuinely it. No layers, no parts, no separate hair, no separate props. A
character holding something is fine — the prop is just more pixels.

Pose it **as it will stand in the game**. The mesh deforms the drawing; it
cannot move an arm to a place the drawing does not have. A figure drawn with its
arms folded will never uncross them.

**Draw the limbs away from the body if you can.** This is the one art note that
changes what the rig can do, and it is worth telling whoever makes the image.
The man in Hot Miami has his arms hanging against his sides — each arm is about
ONE grid cell wide, with no mesh across it to absorb a bend, and he ended up
restricted to about a third of the motion the woman takes. She holds her arm
out. Same pipeline, same code, three times the range, purely because of how the
two were drawn.

## The pipeline

```
character.png
   │
   ├── 1. build the rig            → <name>.rig.json   (grid, bones, weights)
   ├── 2. fix the limbs             design/paint_limb_weights.py
   ├── 3. add appendages            design/add_hair_bone.py
   ├── 4. wire it up                CastFigureMesh.svelte + game/castMotion.ts
   ├── 5. MEASURE THE LIMITS        render one joint at a time and look
   └── 6. gate it                   design/check_cast_motion.mjs
```

Steps 5 and 6 are not optional polish. Every single defect this pipeline has
produced got through steps 1-4 looking completely fine.

## 1. The rig file

```jsonc
{
  "size":       [626, 1100],       // the PNG's dimensions
  "grid":       [16, 40],          // cells across, cells down → 17×41 = 697 verts
  "verts":      [[x, y], ...],     // uniform grid, in PNG pixels
  "tris":       [[a, b, c], ...],  // two per cell, standard
  "weights":    [[w0..wN], ...],   // per vertex, one per bone, must sum to 1
  "bones":      [{ "name", "x", "y", "parent" }, ...],
  "figure_box": [x0, y0, x1, y1],  // the alpha bounding box
  "plant_y":    1034.0             // where the feet meet the ground
}
```

Everything is in the PNG's own pixel coordinates, y DOWN. There is no separate
skeleton space to convert into, which is most of why this is simpler than Spine.

### Where the bones go, and why you do not have to guess

The spine chain is derived, not authored. Verified against both Hot Miami
figures to within a pixel:

- **`root`** sits at the bottom-most opaque pixel — the feet.
- **`head`** sits `0.041 × figure_box height` below the top of the box. Not at
  the very top: a wisp of hair reaches higher than the head does.
- **`hips`, `waist`, `chest`, `neck`** divide root→head into **five equal
  segments**. Both characters came out exactly evenly spaced (153.592px and
  211px per segment) — this is a rule, not a coincidence.
- **every spine bone's `x`** is the horizontal midpoint of the opaque pixels on
  that exact row. That is what makes the chain follow a leaning or contrapposto
  pose without anyone measuring anything.

Arms are the exception: `arm_l`/`arm_r` (children of `chest`) and
`fore_l`/`fore_r` go at the real shoulder and elbow, pulled slightly INSIDE the
silhouette — a joint sitting on the outline tears the limb off the body when it
rotates. These are pose-specific and have to be placed by eye.

The bone names matter: `castMotion.ts` and the gate both key off
`root/hips/waist/chest/neck/head/arm_l/fore_l/arm_r/fore_r/hair`.

### How the weights work

A vertex's position is the weighted average of where each bone would put it —
ordinary linear blend skinning. Weights per vertex must sum to exactly 1. **An
assertion for this belongs in every script that touches weights**; two separate
bugs in this pipeline were caught by exactly that line and nothing else.

## 2. Limb weights: the bug that will happen to you

Twice, a limb was **half attached**, and both times it looked perfect standing
still and only appeared once the motion got big.

- Her raygun was weighted to the TORSO while her forearm was weighted to the
  arm. Every idle cycle, the gun hinged at her wrist.
- His arms straddle two grid columns and only one column was weighted to the
  arm. At any real amplitude the outer half stayed behind and the triangles
  between the halves stretched his hand into a black blade.

`design/paint_limb_weights.py` fixes this by asking each PIXEL which bone
segment it is nearest to, then giving each cell limb weight equal to the
fraction of its own pixels that chose the limb. Three things it has to get right,
all learned the hard way:

- **Extend the forearm's segment by ~0.55 of its length to cover the hand.** The
  first version used 2.2 and ran the segment to his ankles, handing his shins to
  his elbow.
- **Nearest-segment alone gives the legs to the arms.** A man with his arms down
  has hands genuinely closer to his thighs than his spine is. A pixel is only
  claimed if it is also within the limb's own thickness (~13% of figure width)
  OR at least twice as close to the limb as to the spine. The second condition
  is what picks up a HELD PROP: the raygun sits ~200px from her forearm and
  ~450px from her spine.
- **Split the limb between its two bones along the limb's AXIS, not by nearest
  segment.** Nearest-segment is a hard yes/no at the elbow, and a joint with no
  blend zone tears the instant it bends. A smooth ramp centred on the elbow
  reproduces what good hand-made weights look like (0.95/0.05 → 0.71/0.29 →
  0.45/0.55 → 0.18/0.82 → 0/1.0 across five cells).

**Do not run it blind on a figure holding a large prop.** The axis split reads a
sideways-held object as sitting near the elbow and hands half of it to the upper
arm — the raygun hinging all over again. Hot Miami's woman keeps hand-checked
weights for this reason. The tool gets you most of the way; the render decides.

## 3. Appendages are where the life is, and they are free here

Measured off Hacksaw's *Miami Mayhem* cast (the full teardown is in
`docs/handoff/hot_miami.md`, 2026-08-27), four rules, most important first:

| # | rule | their measured values |
| :- | :- | :- |
| 1 | loop lengths must all differ | 3.33 / 5 / 6.67 / 8 / 8s — they realign only every 40s |
| 2 | **the body barely moves; the amplitude goes to what hangs off it** | body 1–3.3°, hair 27.5°, beard 13.9°, smoke 25.9° — **4 to 8×** |
| 3 | each link of a follow-chain ≈ 2× the last, and starts LATER | beard root 6.9° → tip 13.9°, tip lags |
| 4 | hide one irregular jitter per loop | a 0.83s window in an 8s loop, ±0.5° |

Rule 2 is the one that matters most and the one a mesh makes cheap. **Adding a
hair bone needs no new art** — paint weights over the hair pixels of the image
you already have. With cut-out parts the hair would have to be drawn as its own
layer.

`design/add_hair_bone.py` separates hair from face by colour census per cell
(hair is dark and carries no skin) and ramps the weight with distance from the
crown, so roots barely move and tips carry the swing. That ramp gives you rule 3
for free: a vertex that is half hair and half head naturally lags one that is
all hair, so you get follow-through out of ONE bone.

Two guards it needs:

- **Colour is not enough — check position too.** The first run happily claimed a
  cell of the raygun's barrel, which is dark and skin-free, and would have
  welded the gun to her hair.
- **Not every character has an appendage worth rigging.** The man's hair is
  short and sits on his skull; a bone there reads as a wig sliding. He does not
  get one, and saying so is better than adding a bone that does not earn its
  place.

## 4. Motion: tables, tiers, and the follow-chain

`src/game/castMotion.ts` holds every number and **imports nothing** — that is
deliberate, so the gate can load it with bare node. One pixi import and the gate
cannot run at all. `skinnedFigure.ts` does the rendering and reads the tables.

An idle entry is `[amplitude°, lagMs, periodMs, oddScale]`. A reaction entry is
`[amplitude°, lagMs]` per bone, inside a tier that also carries `durationMs`,
`rise` and `stretch`.

**The lag is not decoration.** Hot Miami shipped for weeks with every bone on one
envelope, and the read is a twitch rather than a body: hips first, head 180ms
later, hair 300ms after that.

**`rise` and `stretch` are free amplitude.** They translate and vertically scale
the ROOT, which moves the entire figure rigidly — no joint bends, so no
distortion at any size. Use them to carry travel you cannot afford at a joint.
Miami Mayhem's own note: translation alone "looks like the whole person is
floating"; the stretch is what plants it.

**Tier by how much the win is worth.** Hot Miami's base game pays about one spin
in 3.5, so a full celebration on every line win is noise. Three tiers, split on
the same threshold the winning symbols use for their own big-win faces, so the
symbol and the person beside it can never disagree.

**`MOTION_SCALE` per character.** Not a taste dial — the man takes 0.36 of the
tables because of how his arms are drawn (see below).

## 5. Measuring the limit — the step nobody can skip

**Render the joint. Look at it. Zoom in on the extremity.**

Rotate ONE joint at a time from 0 to 90° and render the mesh. On Hot Miami:

```
shoulder (arm_*)    clean to ~10°, visibly tearing by 15-30
elbow (fore_*)      clean to ~15°, the hand becomes a blade by 30-45
chest / waist       clean to ~20-25°
neck / head         clean past 60°
```

**Then do it again zoomed in, because those numbers were wrong.** Judged on the
whole figure at viewing size, the man's elbow looked clean to 15°. Zoomed to his
hand, his fingers were being drawn to a point from about 7° and only recovered
near 5°. **A limit read off the silhouette is not a limit.** That single mistake
is why his reaction shipped visibly broken and had to be scaled to 0.36.

Two things that make the budget go further than it looks:

- **The limit is each joint's OWN local angle.** Rotation accumulated down a
  chain carries everything below it rigidly, and rigid costs nothing. Spread
  amplitude across hips→waist→chest→neck→head and the figure travels a long way
  with every joint barely bending.
- **Root rise and stretch cost nothing at all**, as above.

Both characters were previewed offline, by porting the exact matrix maths out of
`skinnedFigure.ts` into a script that **parses the shipped tables out of the
source file** rather than keeping a second copy. A preview that can drift from
what ships is a preview that will eventually lie to you.

## 6. The gate

`design/check_cast_motion.mjs`, wired into `pnpm build` and available as
`pnpm check:cast`. It measures, per character, against the per-character limits:

1. no joint driven past where the mesh was measured to tear — **amplitude ×
   `MOTION_SCALE` + the idle that never stops running**
2. a reaction has to be visible at all (the shipped one peaked at 0.41°, under
   3px of travel — invisible, and nothing was checking)
3. the follow-chain: a link may not start before the link it hangs from
4. the tiers escalate — a big win that moves less than a small one lies
5. the appendage carries multiples of the body (rule 2 above)
6. no bone lags past the point the reaction is cleared, or it is cut mid-swing
7. the idle stays small, because it runs forever
8. the envelope starts and ends at rest, and the idle actually produces motion

It caught two ordering mistakes in its own author's work on its first run, and
then caught the man's arms being over-driven after his limits were corrected.
That is the entire argument for having it.

## What has actually gone wrong here, in order of how much time it cost

1. **Judging motion at viewing size instead of zoomed on the extremity.** Cost a
   shipped build with a visibly broken hand.
2. **A limb only half-weighted.** Twice. Invisible at rest, invisible at small
   amplitude, obvious the moment the motion got real.
3. **Every bone sharing one envelope.** Reads as a twitch; no amount of extra
   amplitude fixes it, and adding lag fixes it for free.
4. **A reaction so small it could not be seen**, shipped and unnoticed because
   nothing measured it.
5. **Arm terms with the wrong sign** — the most frequent reaction in the game
   was the character *lowering* her raygun on a win.
6. **A weight pass that zeroed a row.** Caught only by the sum-to-1 assertion.
7. **Colour-only region detection** claiming the gun barrel as hair, and a
   forearm segment extended 2.2× claiming both shins.

Six of the seven were found by rendering a picture and looking at it. One was
found by an assertion. **None were found by reading the rig.**
