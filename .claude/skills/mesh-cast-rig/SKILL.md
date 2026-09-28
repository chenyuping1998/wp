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

**Put a number on it in the brief: at least ONE GRID CELL of daylight between
every limb and the body.** A cell is the sheet width over the grid's columns —
32px on a 512-wide sheet at 16x40 (Hot Miami's 626-wide sheet: ~39px). No
vertex can sit in a gap narrower than a cell, so there is nothing between the
limb and whatever it hangs beside to absorb the bend.

The case that keeps getting drawn is **hands hanging beside the thighs**. Hard
Time's prisoner has his 5-10px from the trousers — a third of a cell — and it
caps both his shoulders at 4.5°: every arm swing shears the triangles that hold
a hand AND a trouser edge, and the weights can only choose whether the fingers
or the trouser seam take it (see failure 11 below). Ask for one full cell; never
accept less than **24px between hand and thigh**.

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

**Do not trust an automatic arm finder, and do not trust a rig you did not build
for THIS drawing.** `skin.find_arms` (hacksaw-character-motion) keeps the topmost
run of silhouette that separates from the body; on Capo Nostra that was the
scarf on one side and the cigar smoke on the other. Hard Time's reskin kept
another game's rig byte for byte, and its arm bones sat on the jacket and
trousers. Both looked fine at rest. Capo Nostra and Hard Time now read measured
joint polylines (shoulder, elbow, wrist, fingertip) in
`design/build_cast_guy_rig.py` and claim vertices by distance to them. Whatever
builds the arms, **measure how much of the inked arm vertices the arm bones own
before believing any gate** — failure 9 below.

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

**⚠ Scope, added 2026-09-17: these rules are about FREE appendages — hair,
beard, smoke, mask tips — and mostly about the idle.** They were measured on
cut-out characters, and rules 2 and 3 do not carry over to the ARMS in a
reaction on a mesh. There the port does the opposite on purpose: head 4.02°
against the bracing forearm's 1.08°, 3.7×, because the arms act through shape
rather than angle. Gates that turned rules 2 and 3 into "the arm out-rotates the
body" and "every link lags its parent" were rewritten — §4 and §6.

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

**The source of truth for the motion is hacksaw-character-motion
`rig/motion.py`** (`~/.claude/skills/hacksaw-character-motion/rig/motion.py`):
the Miami Mayhem reference transcribed onto THIS topology — 10 bones, one 16x40
grid — and swept against the fold gate. Capo Nostra and Hard Time copy its
`DEFAULTS`, `REACTION`, `REACTION_LIFT`, `REACTION_SCALE`, `SCALE_K`, `FLUTTER`,
`REACTION_MS`, `SNAP` and `HOLD` verbatim. If a number in this file disagrees
with that one, that one wins. If the raw Spine teardown
(`character-reactions.md`) disagrees with it, it still wins: the teardown's
characters are cut-out parts, and a mesh is not.

`src/game/castMotion.ts` holds every number and **imports nothing** — that is
deliberate, so the gate can load it with bare node. One pixi import and the gate
cannot run at all. `skinnedFigure.ts` does the rendering and reads the tables.
Capo Nostra and Hard Time also moved the posing maths (`composeBoneMatrices`,
`skinVertices`) into `castMotion.ts`, so the gate poses the mesh with the code
that renders it rather than with a copy.

An idle entry is `[amplitude°, lagMs, periodMs, oddScale]`. A reaction entry is
`[amplitude°, lagMs]` per bone, inside a tier that also carries `durationMs`,
`snap`/`hold`, the root moves `rise`/`lean`/`stretch`, and on the current tables
`scale: { k, shape }` and `flutter`.

**Where a reaction's size comes from: a rigid root lift and squash and stretch.
Not joint rotation, and not a perspective push.**

- **Root lift.** `REACTION_LIFT = (0.018, -0.045)`: toward the board by 1.8% of
  the figure box's width and UP by 4.5% of its height (y is down), riding the
  reaction envelope. The tables store it as `lean: 0.018, rise: 0.045`. A
  translation on the root moves every vertex by the same vector, so no triangle
  changes shape — **it is the one channel with no amplitude ceiling.** `stretch`,
  a vertical scale on the root, stays ZERO: the port has none.
- **Squash and stretch.** `REACTION_SCALE` gives each bone an (along the bone,
  across it) pair at the peak. The driving arm lengthens and thickens — upper
  (1.23, 1.10), fore (1.15, 1.05); the ribcage lifts (chest 1.06, 1.02; neck
  1.04, 1.00); the bracing arm compresses along and bulges across. `SCALE_K =
  0.42` is how much of that shape the rig takes, swept against the gate at 8
  trigger phases (the sweep allows 0.46; 0.42 leaves room for a slightly
  different figure). The scale is applied in the bone's own frame about its
  pivot and **does NOT inherit to children**: with inheritance on, the same rig
  held together only to k = 0.06, because stretching an upper arm drags the
  forearm's whole frame and folds the taper at the wrist. `FLUTTER` shakes the
  EXCESS over 1 by ±13% on a 66.7ms period, only between snap and hold — a
  muscle holding a load — so the hold does not read as a freeze.
- **Rotation is small on purpose.** `REACTION`: head 4.02°, neck 2.70, chest
  1.68, arms ≤ 1.56 (fore_r −1.56, fore_l 1.08, arm_r −0.48, arm_l 0.36).
  Rotation and scale spend the same fold budget, and rotation gave way: with the
  rotation table at full size the sweep allowed k = 0.08; cut to 0.6× (these
  numbers) it allows 0.46. Rotation tilts a picture; a limb changing length is
  what reads as force.

The port softens the bracing forearm to (0.96, 1.02) only because its own
figure's forearm runs down against the torso, and says to put the reference's
0.80 back on a figure with daylight under the arm. Capo Nostra and Hard Time
both did; on Hard Time's thin gap it cost five points of fold and still cleared
the floor by twenty.

**The ceiling is the price of the rig.** The reference stretches an arm to
1.23×; one continuous mesh tops out near 1.11×, because a scale on one bone has
to be absorbed by the blended boundary with its neighbours. Giving up all joint
rotation buys about 7% more. Copy the SHAPE exactly and accept the size.

> **⚠ SUPERSEDED 2026-09-17 — "`rise`, `stretch` and `lean` must be ZERO …
> use a perspective push instead … the joints were never the problem."**
> Kept so nobody reverses it a third time.
>
> From 2026-09-10 this file banned all three root moves — itself reversing the
> first version, which had recommended them because they cost nothing to render
> — and told you to get size from the reference's `*_persp` push: a childless
> control bone under the spine, displaced ~10% of the box, weighted 0.39–0.52
> across the torso, added to that bone's FINAL matrix. The evidence was
> `character-reactions.md` §4a: 「這四個角色都沒有任何整體平移。`root` 與
> `*_root_pelvis` 在 reaction 裡一格關鍵幀都沒有。」 It also pointed at the
> reference's joint peaks — hand +20.0°, arm +18.8°, up to +27.1° — as proof
> the joints had room.
>
> **That was the RAW Spine teardown, and it is the wrong reference for a mesh.**
> Those four characters are cut-out parts: each arm is its own attachment and
> turns 20° fighting nothing, so they have size to spare in the joints and no
> need to move the root. A mesh has neither. The tables built on this advice
> (Capo Nostra, 2026-09-10) had no lift and no shape change, so they pushed the
> gesture into the joints as far as the angle gate allowed — fore_l 6.7°, 6.2×
> the port's — and a flat forearm flapping is exactly what the review
> 「人物整個像紙片一樣軟軟的」 described. Carried into Hard Time on a borrowed
> rig, the same tables folded a triangle to 3.6% of its area in the live build;
> on Capo Nostra's corrected rig they fail the mesh gate at 22% / 1.71×.
>
> The verified port lifts the root and has no push. **Do not zero the lift again
> on the teardown's argument.** `push` and `tremor` are still on the tier type,
> because the renderer honours them; no current tier uses either (`flutter`
> replaced `tremor` — the reference shakes a muscle's scale, never its angle).

> **⚠ SUPERSEDED 2026-09-17 — "The lag is not decoration."** This said Hot
> Miami shipped for weeks with every bone on one envelope and read as a twitch,
> so a reaction needed lag travelling out along the chain: hips first, head
> 180ms later, hair 300ms after that.
>
> That is true of a ROTATION-ONLY rig, where a travelling wave was the only thing
> keeping a reaction from being one rigid snap. The port drives every bone from
> ONE envelope, lags all zero, and does not snap — its life comes from channels
> that rig did not have: the arms change shape, the bulge flutters, the root
> lifts. Lag is still allowed; it is no longer required, and a gate that
> demands it fails the reference itself. See §6 rule 3.

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

**A geometric limit is not a limit either.** Capo Nostra and Hard Time measure
in two passes: GEOMETRIC (each joint alone, idle off, until an inked triangle
folds under 50% or grows past 1.6× — reproducible, `measure_joint_limits.mjs` on
Hard Time) and then VISUAL (render at that angle, zoom 2-3× on both hands, step
down until the drawing is clean). The geometric pass only sees AREA, and a hand
sheared into a spike keeps its area: Hard Time's `arm_l` measured 7.5°
geometrically, and at 5° the fingers already came to a point. It shipped at
4.5°. Every one of its nine joints shipped below its geometric number. **Ship
the smaller number and write both down**, because a limit belongs to the drawing
AND the weights and has to be re-measured when either changes.

Two things that make the budget go further than it looks:

- **The limit is each joint's OWN local angle.** Rotation accumulated down a
  chain carries everything below it rigidly, and rigid costs nothing. Spread
  amplitude across hips→waist→chest→neck→head and the figure travels a long way
  with every joint barely bending.
- **A rigid root lift costs nothing against the limit**, and the port uses it
  (§4). *(⚠ Superseded 2026-09-17: this bullet used to say root rise and stretch
  "are still banned" on the teardown's zero whole-figure translation. The lift is
  back; root `stretch` stays zero because the port has none.)*

Both characters were previewed offline, by porting the exact matrix maths out of
`skinnedFigure.ts` into a script that **parses the shipped tables out of the
source file** rather than keeping a second copy. A preview that can drift from
what ships is a preview that will eventually lie to you. Capo Nostra and Hard
Time went one step further: the matrix maths lives in `castMotion.ts` itself, and
the gate and `measure_cast_travel.mjs` import and call it.

## 6. The gate

`design/check_cast_motion.mjs`, wired into `pnpm build` and available as
`pnpm check:cast`. It measures, per character, against the per-character limits.
**Copy it from Capo Nostra or Hard Time**, whose rules are below with those
files' own numbering (Turf War ported them 2026-09-18, per drawing and per rig);
Hot Miami's gate still enforces the older forms marked superseded after the list.

1. no joint driven past where the mesh was measured to tear — **amplitude ×
   `MOTION_SCALE` + the idle's sampled peak**, against limits from BOTH passes
   in §5
2. a reaction has to be visible at all: its loudest bone ≥ 2° AND ≥ 1.25× that
   bone's own idle peak (the shipped one peaked at 0.41°, under 3px of travel —
   invisible, and nothing was checking)
3. a reaction may not be a rigid rotation-only snap: a tier passes with **a lag
   spread OR the shape channel** — a non-identity `scale.shape` with k > 0, a
   `flutter`, and a root `rise`. Where lags exist, a link still may not start
   before the link it hangs from.
4. the tiers escalate, in movement and in duration — a big win that moves less
   than a small one lies
5. the sign convention: positive opens the body (left limbs +, right −),
   **measured on this rig**, and the spine agrees with itself on a direction
6. the arms act through SHAPE: every tier needs **a driving arm that LENGTHENS**
   (≥ 2% along its bone after k) and **a bracing arm on the other side that
   COMPRESSES**

   **6b.** the spine is capped at the transcription's own peaks — chest 1.68,
   neck 2.70, head 4.02 on the trigger, proportionally less on smaller tiers
7. no bone lags past 25% of the beat, or it starts after the body has begun to
   release
8. the idle stays small, because it runs forever: spine amplitudes ≤ 1.5°, and
   no joint's idle peak over 60% of its limit
9. the envelope starts and ends at rest and reaches full amplitude, and the idle
   actually produces motion
10. **the MESH.** Weights sum to 1 and average ≥ 2 bones per vertex. Then the real
    rig is posed with `castMotion.ts` — the idle at 48 steps across its loop,
    every tier at **8 trigger phases** — and every INKED triangle must keep its
    sign, stay ≥ 50% of its rest area (fold) and grow ≤ 1.6× (stretch). A
    failing stretch also reports how much of the budget squash and stretch is
    spending.
11. *(Hard Time)* **the arm bones are ON the arms**: on the inked vertices inside
    each arm region traced off the drawing (`design/cast_guy_arm_regions.json`,
    which the rig builder reads too, so the two cannot disagree), that arm's own
    `arm_*` + `fore_*` must own ≥ 0.5 of the weight.

**Rule 10 alone is not enough, in two ways.** It sees area, so a hand sheared
into a spike passes — catching that is rule 1's job, with the visual limits.
And it PASSED a rig whose arm bones sat on the trousers: Hard Time's borrowed rig
with the current tables clears rule 10 on the prisoner, because a bone that owns
trousers bends the trousers slightly and leaves the arm alone — nothing folds,
and nothing reacts. Rule 11 is what stops it; Hard Time injected both the old
rig and the old tables to prove rules 11 and 1/6/6b fire. Capo Nostra's gate has
no rule 11; its rule-10 failure message tells you to check ownership first.

> **⚠ SUPERSEDED 2026-09-17 — the gate this section used to describe.** It had:
>
> - *rule 3, the follow-chain*: every link lags the one it hangs from, lag
>   required. Replaced by rule 3 above, because the port drives every bone from
>   one envelope and would fail it (§4).
> - *rule 5, the appendage carries multiples of the body* — free end ≥ 2× the
>   chest, from §3's rule 2.
> - *rule 9, the HEAD is body*: head ≤ 0.45× and neck ≤ 0.35× the carrying limb,
>   from `girl_head` 7.19° against `girl_arm_R` 18.77° and the reference's own
>   words, **本體小、附屬物大**. It was added because rule 5 compared the free
>   end to the CHEST, so a head at 0.88× the carrier passed — and one shipped.
>
> Rules 5 and 9 are **inverted on a mesh.** The reference's arms are separate
> attachments turning ~19° against nothing; a mesh arm cannot, so its gesture
> moves into shape and the spine carries the rotation. The port's head is 3.7×
> its forearm on purpose (4.02° vs 1.08°), and tables written to satisfy
> "free end ≥ 2× chest" pushed a forearm to 6.7° — the paper cut-out flapping.
> The principle survives on the channel a mesh can carry: rule 6 puts the
> arms' size in their length, and rule 6b replaces the head ratio with a cap at
> the port's own spine, which still guards 「頭部位移太多」.

It caught two ordering mistakes in its own author's work on its first run, and
then caught the man's arms being over-driven after his limits were corrected.
That is the entire argument for having it.

**One gate cannot hold all of it, and the split is not arbitrary.** Displacement
lives in `design/measure_cast_travel.mjs`, which budgets head travel as a
percentage of figure height. **Angle and travel are not interchangeable** —
cutting the head's angle to the reference ratio moved its measured travel far
less than expected, because the head is the last link of a chain that composes
and swings on the longest lever arm in the figure. On Capo Nostra and Hard Time
it calls `castMotion.ts` rather than reimplementing the skinning, and budgets
the head's OWN swing with the root lift subtracted (Capo 3.4 / 5.2 / 6.9%, Hard
Time 3.0 / 4.5 / 6.0%): a rigid lift moves the feet as far as the head, so it
cannot read as the head lurching, and budgeting total travel failed the
reference itself.

> **⚠ SUPERSEDED 2026-09-17 — "`check_cast_motion.mjs` sees ANGLES only … never
> touches the rig."** True of the gate that sentence described. Both Capo
> Nostra's and Hard Time's gates now pose the mesh (rule 10), and Hard Time's
> reads the rig's weights against the drawing (rule 11). The angle-only gate is
> how Hard Time's live reaction folded to 3.6% with every rule green.

## What has actually gone wrong here, in order of how much time it cost

1. **A measuring probe that named body parts by POSITION.** It took "the 12
   leftmost vertices" as the hand. The mesh is a regular grid over the whole
   image including transparent space, so every one of them was a head or neck
   vertex sitting on the texture edge at x=0 — the probe was comparing the head
   against itself. It produced a confident, stable, completely fictional number
   that was reported to the user, and then a second round of cuts was made to
   satisfy it, halving the spine and nearly flattening the reaction before the
   probe itself was checked. **Name parts by which bone OWNS the vertex
   (dominant weight), never by where it sits, and print the group sizes so the
   selection is auditable.** Cost more than everything below it.
2. **Judging motion at viewing size instead of zoomed on the extremity.** Cost a
   shipped build with a visibly broken hand.
3. **A limb only half-weighted.** Twice. Invisible at rest, invisible at small
   amplitude, obvious the moment the motion got real.
4. **Every bone sharing one envelope.** Reads as a twitch; no amount of extra
   amplitude fixes it, and adding lag fixes it for free. *(⚠ Superseded
   2026-09-17 as a general rule: true of Hot Miami's rotation-only rig. The port
   shares one envelope across every bone and does not twitch, because its arms
   change length and its root lifts — see §4. On a mesh, reach for the shape
   channel before lag.)*
5. **A reaction so small it could not be seen**, shipped and unnoticed because
   nothing measured it.
6. **Arm terms with the wrong sign** — the most frequent reaction in the game
   was the character *lowering* her raygun on a win.
7. **A weight pass that zeroed a row.** Caught only by the sum-to-1 assertion.
8. **Colour-only region detection** claiming the gun barrel as hair, and a
   forearm segment extended 2.2× claiming both shins.

Six of the eight were found by rendering a picture and looking at it. One was
found by an assertion. One was found by printing what the probe had actually
selected. **None were found by reading the rig.**

### Added 2026-09-17, from Capo Nostra and Hard Time

Not re-ranked against the eight above.

9. **Arm bones that were not on the arms.** Invisible at rest, and every gate
   was green. On Capo Nostra, `skin.find_arms` — which keeps the TOPMOST run of
   silhouette that separates from the body — took a shoulder/lapel block and the
   cigar smoke for the arms; the rig ended up with `arm_l` on the scarf and
   `arm_r` on the smoke, the hanging arm owning 0 of its own weight. Rotating
   `arm_l` 0→12° swung the scarf and left the hand where it was: every table ever
   written for him had been moving the torso. On Hard Time, the reskin kept
   another game's rig byte for byte, fitted to a different man — its arm bones
   owned 0.13 / 0.32 of the left sleeve and forearm and 0.00 / 0.13 of the right,
   sitting on the jacket front and trousers — and the live trigger folded a
   triangle to 3.6%. **Before trusting any gate or any limit, measure how much of
   the INKED arm vertices each arm's own bones own** (Hard Time's floor is 0.5;
   the rebuilt rigs sit at 0.56–0.72), and never carry a rig across a redraw or
   a reskin.
10. **Trusting a geometric joint limit.** Rotating a joint until a triangle folds
    measures AREA. Hard Time's `arm_l` came out at 7.5° that way; at 5° the
    fingers were already drawn to a point with every triangle's area intact.
    The old tables swung `fore_l` 6.7° (~8.2 with the idle) past a hand clean
    only to 7 and still cleared the mesh gate. Only the zoomed render caught it
    (§5).
11. **Hands drawn within a third of a grid cell of the thighs.** The prisoner's
    hands hang 5-10px from his trousers on a 32px cell. No vertex fits in that
    gap, so every arm swing shears triangles that hold both a hand and a trouser
    edge, and the weights only choose where it lands: a sharp fade draws the
    fingers to a point, a soft one bends the trouser seam. It capped both
    shoulders at 4.5° — the idle alone takes 2.5° of `arm_l`'s — and the rig
    cannot buy it back: a wider hand radius sheared the trouser edge to 1.9–6.4,
    and a third smoothing pass left the right upper arm owning 0.51 of itself,
    one step from welded to the torso again. It is an art note: **≥ 24px between
    hand and thigh**, one full cell if you can get it.
12. **Mapping the driving arm by NAME.** The port's `arm_r` drives because on its
    own figure `arm_r` is the straight, free arm. Copied name for name onto Capo
    Nostra's Don, `arm_r` is the folded cigar arm: lengthening it along its bone
    sank the elbow, and the bracing compression lifted the hanging hand
    (fingertip up 11.3, out 4.0) — nothing was thrown out. Mirrored so the
    straight hanging arm drives, that fingertip goes OUT 9.5. **Map the driving
    arm by ROLE — the straight free arm — then flip the rotation signs so
    positive still opens the body, re-measure that sign on this rig, and give a
    folded forearm an explicit `axis`** (a leaf's derived axis points along the
    upper arm). When the mesh cannot tell the mappings apart — Hard Time's
    prisoner stands square, 72.2% vs 71.0% fold — render both and let the user
    choose.

13. **A bone that is a PROP on this drawing.** *(Turf War, 2026-09-18.)* On Turf's
    base rig `fore_l` pivots in the fist and carries the whole PLANTED bat, hung off
    root; the forearm itself rides an `arm_l>fore_l` ramp. The transcription's
    `fore_l` numbers are a forearm's. Given to the bat, the idle alone slid its foot
    past where it stays a bat and the stretch drove it into the ground: trigger fold
    0%, 27 inversions. Held still (`castMotion.ts HELD_STILL`), 65%. **Before porting
    a table, ask of every bone what it carries on THIS drawing** — a prop takes the
    reference's prop channel if it is free, and nothing if it stands on the floor.

Items 9–12 came out the same way as the eight. The scarf swinging while the hand
stayed put, the fingers coming to a point inside a "clean" limit, and the two
arm mappings side by side were all renders; the hands-by-thighs cap came from a
sweep over the posed mesh, settled on renders. The one that was about the rig's
weights was proved by MEASURING ownership over inked vertices — **still not by
reading the rig.**

## The same method on reel SYMBOLS (GoBananubis, every winning symbol, 2026-09-25)

A symbol is not a cast figure: an opaque plate with the subject painted on,
drawn ~118px, animating only while it is a winning cell. `apps/GoBananubis`
runs all four high pays this way:

| file | job |
| :- | :- |
| `design/make_symbol_layers.mjs` | cut each `h{n}.png` into plate / subject / soft drop shadow / 24-frame light-sweep atlas |
| `src/game/meshWin/meshRig.ts` | import-free core: parts → grid + weights, pose, skin, keyed tracks, springs |
| `src/game/meshWin/h{1-4}*.ts` | per symbol: the drawing traced as parts, measured limits, the acting |
| `src/components/SymbolMeshWin.svelte` | renderer (plate, shadow, mesh, additive flash, sheen mesh, sparks, dust) |
| `design/check_mesh_wins.mjs` | gate + `--limits` + `--dump`; runs in `pnpm build` (pngjs from `E:/stake/tools/gen`) |
| `design/render_mesh_wins.py` | offline render of exactly what the component draws, plus deformation-only zooms |

What was different from a cast figure, each found by a failing gate, a render
or a probe:

1. **Split the plate first**, and cut the subject from the plate itself so the
   layers recompose it (mean diff < 1). Keep the plate's contact shadow.
   Colour tests per subject; reject the plate's bronze by a hard 38px edge band
   (h3's frame bars joined into an L whose CENTROID was inside), close small
   gaps (h3's dark chest interior, h4's grey collar), and send a large enclosed
   hole back to the plate when it is plate-bright (h4's loop window — filled,
   a disc of stone rode along with the hop). An existing cut-out can be
   missing parts: the old `scarab.png` had no hind legs.
2. **Air follows the nearest part** (soft-min over distance). A root whose
   distance is a small constant pins the air around moving parts — give the
   root real polygons for the strokes it owns and read as FAR (14px) elsewhere.
   Nested parts (pupil in eye) need `priority`, or they split 50/50.
3. **Limits per direction**, drive limbs open-and-back. Touching neighbours
   must move together: tripod gait tore h1's leg gap; separate hops tore the
   banana lying between two bunches — a parent GROUP bone does the main move
   and children add a little each. A wag belongs to the smallest part that
   wags (h3's standing banana), not the bunch it grows from.
4. **Joint blends need length.** A 9px rim fade let a 4.5px hop stretch 1.7x;
   14px holds. A blink collapses toward the LOWER lid (the upper lid travels)
   and the brow presses down with it to share the stretch.
5. **Divide the rigid factor out of the area gate** (pop/squash scale every
   triangle alike), and **detect pops, not speed**: a step > 1px and > 3x its
   neighbours at 1ms sampling. A spring started at +1 (`spring`) instead of 0
   (`flick`) made h4's loop jump 10% in one frame; nothing else saw it. The
   detector was proved by re-injecting that bug.
6. **WebGPU: a mesh ignores its texture's frame.** pixi 8.8.1's
   GpuMeshAdapter never updates `uTextureMatrix`, so an atlas sub-texture draws
   the whole atlas. The sheen uses a second geometry whose UVs are rewritten
   into the current cell. The game defaults to WebGPU
   (`localStorage.pixiPreference` switches it for debugging).
7. **Cascade a line** (60ms a reel) or three copies act as one object. The reel
   must come in as a PROP: the parent container's x reads 0 at mount.
8. **Verify in the replay harness, window visible.** `make_replay_harness.mjs`
   + patch a round in `build-replaytest/replay-mock-data.json` so H1-H4 win,
   serve it (`gobananubis-replay` in `.claude/launch.json`), probe the scene by
   duck-typed meshes. A hidden window stops rAF: the round never plays, and
   pumping the ticker by hand crashed the GPU process. Do not run `pnpm build`
   while the dev server watches `build/` (EBUSY kills it).

9. **PANEL mode, for a subject that cannot be cut off its plate** (letters
   carved into the stone, a head painted on a slate panel). `panelParts(inner)`
   gives a fixed `frame` root and a `panel` bone that fades into it; the
   whole art is the mesh and the plain stone/parchment absorbs the stretch.
   The gate checks the frame never moves and the rigid move stays at rest, and
   judges fold/stretch only inside the spec's `inked` region. Two traps:
   a CHILD part's weight does not fade with the panel — W's crown sat 8px
   under the frame, rode the full lift and folded to 40% until the head got
   its own fade; and a subject that fills its panel cannot LIFT at all (W now
   ducks down and acts with ears/cobra/jaw). The flash and sweep need a mask
   that follows the drawing: a polygon lit a straight-edged patch of
   parchment on S until `inkColor` narrowed it to the coloured pixels.
10. **Review how it READS, not just whether it breaks**
    (`design/review_mesh_wins.mjs`). The first review pass found four things
    the gate could not: (a) every win ended up to 1px (board) off the drawing,
    because springs never reach zero — a visible jump when the static sprite
    takes over; `meshRig.settled` now blends the last 180ms home, and the gate
    fails any win that does not END at rest. (b) holds that read as freezes
    (S dead still for 470ms, the A for 330ms) — give every hang a slow bob.
    (c) the Wild moving least of all (2.9px), because it cannot lift — give a
    subject that cannot move its body a bigger cell knock and flash instead.
    (d) a carving snapping its whole body with each pupil dart — the body
    follows the gaze on its own slower, later curve. Then LOOK at all symbols
    side by side at the same beats: at the hit the letters and the ankh were
    touching the top frame bar, which reads as cramped. Measure the subject's
    top against the bar (every upward move stacks at the hit) and keep a gap.

### On a TEXTURED plate (GoBananasBoat, corrugated steel, 2026-09-25)

Bubis's plate is plain basalt; Boat's is corrugated steel with rust. Every
difference below came from that, found by a render or a residue map:

1. **Cut the letters too.** A panel mesh bends whatever surrounds the subject,
   and ribs are straight lines — any bend shows. Stencilled paint cuts cleanly
   (lum > 150, chroma < 60). Keep panel mode for art painted INTO its window
   (Boat's porthole portrait: `panelDiscParts`, a round frame).
2. **Rebuild the plate per column, from the column's MEDIAN.** The ribs are
   vertical, so a column looks the same all the way down. Seeding from the
   pixels next to the hole striped every column with the subject's glow;
   a plain median still went brown where a net covered most of a column. Median
   only plate-coloured pixels, borrow neighbours' when too few, and blend the
   hole's ends over ~6px.
3. **Find the subject by its INK, not its colour.** Rust, the lantern's wall
   glow and the flags' blue all overlap the subject colours. A hand hull,
   GROWN (never trust it to be outside the ink), and a flood from outside that
   stops at ink AND at walls. Chroma alone leaked through brass in shadow; a
   "looks like the plate" test pulled rib shadows along. What held: chroma > 45
   OR warm (r - b > 8) on grey steel; warmth alone on a TEAL plate; and for the
   net and the flags the body IS that colour (`bodyIsWall`).
4. **Shed only dark scraps that TOUCH the outside** (painted drop shadows).
   Two over-eager versions punched holes: the helmet's porthole glass (small
   cool panes between brass bars) and a mine horn's lit tip.
5. **Blend a swinging part RADIALLY round its pivot**, not by a y threshold.
   A y band is a seam across the whole object: the mine's limit went 4° -> 7°,
   the net's 5° -> 39°, the lantern's 1.5° -> 12°.
6. **Where the presentation is torn down on a timer, the hold must cover the
   act**, or the subject is cut off mid-hop and snaps back. Size it to the
   longest act ON THE BOARD.
7. Strip RGB under zero alpha in the subject layers (4.0 MB -> 1.6 MB) and
   store the blurred shadow at a quarter size.
11. **Beyond the win: the landing and a walk cycle.** `landPose` gives every
    symbol its own 240ms landing (fixed, not turbo-scaled — the reels must
    settle together), gated at three weights like the win. A subject whose top
    reaches into the frame band (W's ears) needs its own `landDepth`: the squash
    pivots on the bottom, so the top moves most. A weight that follows live
    state (the Scatter count) must be read ONCE at mount. `spec.walk` +
    `MeshWalker.svelte` turn a cut subject into a prop that travels: gait phase
    from distance covered (no skating), stride from speed. A component that
    mounts when it first shows gets added ON TOP of siblings declared after it
    — insert at the bottom when it must sit under them (`bottom`).
12. **Inside Spine: rigid plates -> weighted meshes.** A cut-out Spine rig
    whose budget is set by rigid pieces (GoBananubis's Anubis: the collar,
    the kilt, the nemes) can keep its bones and turn just those pieces into
    weighted mesh attachments written by the generator: grid in the piece's
    pixels, hull ring first, each vertex stored per bone in that bone's setup
    space (world minus bone, when setup bones are unrotated). A derived
    follow-through bone (the kilt: torso turn 0.1s late, opposed) needs no
    hand keys. Then re-measure every budget on renders — the preview must draw
    meshes, or it shows the seams they removed — and re-print anything
    positioned from the rig (the throw release, the fists). Prove the runtime
    reads the JSON: load it with spine-core, pose it, and compare the mesh's
    world vertices with the weighted sum.

## Spine physics on hanging pieces (added 2026-09-26, GoBananubis mascot)

- **Give each physics constraint its own `order`.** If they all share order 0, only the first one runs, and nothing errors or warns. Go Bananas Boat's captain had it too (fixed 2026-09-26). Re-measure after fixing: settings tuned while only one constraint ran will be far too loose once all of them do (Boat's right tail went to 32°).
- **Physics can tear a mesh even when every keyed pose looks fine.** The offline preview doesn't simulate physics, so the gate has to step the real spine-core with `Physics.update` at 60fps. It plays each animation on track 0 with the flutter loop on track 1 and checks every inked triangle's area. See `apps/GoBananubis/design/check_anubis_rig.mjs`.
- **Ears and other thin long tips need stiff physics.** At inertia 0.45 / strength 120, the ear tips swung 75px and the ear mesh stretched to 178%. What passes is 0.25/350/0.9 for the ears and 0.12/600/0.95 for the cobra. Let the keyed flutter carry the liveliness, and keep physics as a small follow-through on top.
