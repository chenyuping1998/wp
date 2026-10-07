# `rig/` — one flat character image in, a seamless idle out

Give it a single PNG of a standing character. It says whether the pose can be
animated at all, builds a skinned mesh, previews the loop, and gates the result
against measurements rather than opinions.

```bash
python rig/reproduce.py                             # prove it works here first

python rig/dekey.py       character.jpg             # only if it has no alpha
python rig/inspect_art.py character.png             # can this pose work?
python rig/build.py       character.png             # rig + gate
python rig/preview.py     character.png             # look at the idle
python rig/props.py       character.png bat.png --pivot 378,552 \
       --length 300 --angle 0 --parent fore_r --z behind
python rig/preview.py     character.png --react 900 # look at the trigger
```

Needs `numpy`, `pillow`, `scipy`. `node` only for `parity.py`.

---

## The one decision everything rests on

**The character is not cut into pieces.**

A figure cut into rigid layers *always* separates at a joint when it rotates.
The pixels on one side move, the ones on the other side do not, and a wedge of
nothing opens between them. That is geometry, not craftsmanship — it is why
hand-cut body parts come apart, and no amount of care removes it. Overlap and
repair only *hide* it, and only up to about 5°.

So a single grid mesh is laid over the whole image and bones deform it. Every
vertex is influenced by three or four bones with a smooth falloff, so where a
cut-out would tear, the mesh shears. **There is no seam because there is no
boundary.**

The reference game does the same, and its own numbers say so: **86% of the
vertices in Hacksaw's `character_main_guy` are bound to more than one bone**, up
to six. Only two attachments in the whole character are rigid, and both are tiny
end pieces — 5 and 6 vertices — at places that never bend.

Rigid layers keep exactly one honest use: a **prop**, something held or hanging
that is not in the character's own art. See below.

---

## What the tools do

| | |
| :-- | :-- |
| `dekey.py` | pull a character off a flat background and give it real alpha |
| `inspect_art.py` | is this **pose** riggable, and what can move |
| `skin.py` | mesh, bones, weights, posing, and a CPU renderer for previews |
| `motion.py` | the idle and reaction models — **the single source of truth** |
| `build.py` | rig + contact sheet + gate, one command |
| `props.py` | attach a held or hanging object |
| `preview.py` | render an animated GIF, with or without the trigger |
| `check.py` | the gate on its own |
| `export_motion.py` | write the JS constants from `motion.py` |
| `parity.py` | prove the JS and Python are the same animation |
| `reproduce.py` | run the whole pipeline on the example and assert the numbers |
| `runtime/skinned.js` | Pixi v8 runtime |
| `INTEGRATION.md` | putting this into an existing Pixi/Stake bundle — and why the Spine route is the only clean one there |
| `PROVENANCE.md` | **read before shipping** — what was measured off the reference game, and the line between craft and property |
| `reference/` | the two write-ups every constant here was measured from |

---

## `dekey.py` — only when you must

Ask for a transparent PNG when you can. A flattened JPEG has already thrown away
the edge and everything here is estimating what used to be there. It does three
things a threshold does not:

- **White inside the figure survives.** The background is found by flooding from
  the border, not by "this pixel is white". A threshold punches holes through
  white shoes and a white t-shirt — on the bundled example, **7807 px** of
  same-coloured pixel are correctly kept.
- **The edge is not a hard cut.** A binary mask leaves stair-steps, and
  stair-steps that the mesh then rotates read as crawling.
- **The white halo is removed.** An anti-aliased edge pixel is
  `c = a·F + (1−a)·bg`. Keeping `c` and adding alpha leaves a pale rim all round
  the figure, very visible on a dark game background. Solving for `F` puts the
  real colour back.

---

## `inspect_art.py` — does the POSE work

A different question from whether the drawing is good, and the signals are
measurable:

| it reports | what it means |
| :-- | :-- |
| no transparency | blocked; run `dekey.py` |
| **3+ runs at N of 60 heights** | daylight between arms and body. High → the arms can get their own bones. Low → they are against the body or in pockets, and moving them means rebuilding the torso behind them. |
| **clear band span** | how much of the figure's height the arms actually separate over. The reference's arm image runs shoulder-to-fingertip, 62% of height. A short band means the bones stop early. |
| **protrusions, classified** | an opening at 13% of the torso width separates whatever is thinner than the trunk; each piece is labelled leg / arm / hair / **HELD OBJECT**. |
| **shear budget** | torso and head width in px, and how far their front and back edges have to slide past each other (~4% and ~4.7%). This is why each of them must be **one** piece painted edge to edge. |
| **joint detail** | at the neck / waist / elbow / knee, how much of the figure's width is crossed by a strong horizontal edge. A belt, collar, hem or stripe on a joint line gets bent into a curve by the mesh and reads as a snapped joint. |
| **headroom** | empty canvas around the figure. The reaction bulges a limb 1.23× across and throws a prop clear; art drawn hard against the canvas edge has nowhere to go. |
| tilt off vertical | over 20°, the auto chain cuts across the figure — place bones by hand |
| distinct colours / soft alpha | under ~200 colours is flat vector with no anti-aliasing; under 1% partial alpha is a hard binary cut. Both stair-step the moment the mesh moves them. |

It correctly calls Hacksaw's guy's **bat** a free appendage, and correctly says
the pocketed-hands character has nothing free.

The thresholds are measured off Hacksaw's Miami Mayhem rig — the numbers and
where each came from are in
`reference/character-reactions.md` §10 (bundled). What that rig demands
of the art, in one line:

> one torso image, two arm images, one head, props separate. 77–90% of mesh
> vertices bind to two or more bones, so the art must **not** arrive pre-cut at
> the joints — the elbow, the waist and the knee bend *inside* the image.

---

## The idle model

Measured off `character_main_guy`'s `full_screen/idle`. Four findings, each of
which cost a wrong build first:

**The cycle is 2 seconds.** Their keys sit ~1 s apart on every bone. A part on a
6 s cycle reads as drifting, not breathing.

**The wave is not a sine.** Rise over 38% of the cycle, fall over 62%. Their
`mask3` runs 0 → +6.75 in 0.77 s then drifts back to −6.63 over 0.93 s.

**One beat in four goes wrong on purpose.** Once per 8 s loop, at 50–74%, a part
swings the other way and holds. `hand_r` peaks at +9.04 every cycle, then at
t = 4.3 goes to −9.77 and sits there 1.2 s.

**Each part needs its own PERIOD, not just its own phase.** On one shared period
with only a lag, parts measure r = 0.94–0.99 against each other — which looks
exactly like the rigid whole-body sway you were escaping. The shipped periods
came out of a search over the 1.5–3 s band. With 5 bones that reaches |r| ≤ 0.21;
with 9 it can only reach 0.52. **The more oscillators you put in one band, the
less room there is to separate them** — that is structural, not tuning.

The chain **accumulates** — the head's world angle is the sum of every bone
below it — so per-bone amplitudes are small: 0.06° at the hips rising to 0.55° at
the head. On the example that gives 0.78% of figure height of head travel, 1.41%
at the hands, and **0.04% at the knees**. The legs staying still is the point: a
torso that visibly leans reads as swaying, not breathing.

---

## The reaction — a one-shot accent for a feature trigger

Measured off their `full_screen/reaction`, which is a completely different
animal:

| | idle | reaction |
| :-- | :-- | :-- |
| duration | 8.00 s | **1.00 s** |
| keys per bone | 10–21 | **3–7** |
| biggest channel | rotation | **translation** |
| `arm_r_2` rotate | 4.37° | 7.67° |
| `body_perspective` translate | 0 | **(+51, +91)** ≈ 13% of height |
| `bat_tip` | — | **−70 units, scaled 3×** |

Shape: **snap in 18%, hold to 63%, ease out**. Their `neck` holds +10.6° from
0.17 to 0.57 without moving. Their `bat` has a **single-frame flick** inside the
hold — +3.2 at t=0.47, −11.4 at t=0.50 — without which the hold reads as a
freeze.

### Why the size cannot come from joints

Measured on the example, the angle a single joint can take before a triangle
collapses or inverts:

| joint | limit |
| :-- | --: |
| shoulder | **5°** |
| chest | 7° |
| elbow | 16° |
| neck | 19° |

A **finer mesh lowers these**, because the distortion concentrates into smaller
triangles. Softer weights barely help. And those are single-joint limits — a
reaction fires them together and the shears add, so the largest usable scale
across the whole table was **0.40**.

Attributing it bone by bone: the spine alone sits at 0.65 / 1.42, comfortably
inside; adding the arms takes it to 0.38 / 1.69, and it is the **left arm**
specifically — its band runs longer and tapers to nothing at the hand, so those
triangles are tiny and shear hard. So the spine gets *more* than the naive scale
and the arms get half.

### So the size comes from the two channels with no ceiling

- **Root translation.** Every vertex moves by the same amount, so *no triangle
  changes shape at all*. The reference puts its biggest number here too. Set to
  4.5% of figure height.
- **The prop.** Rigid, nothing behind it. The bat swings 58°, and its tip sweeps
  **31% of the figure's height** — that is what the eye actually reads.

---

## Squash and stretch

Rotating flat art carries no information about force. Every pixel keeps its
place relative to every other one and the whole thing just tilts, so the eye
reads "that picture is crooked", not "that person is straining". What reads as
force is the image changing shape *internally*.

The reference's peak frame is almost entirely this:

| their bone | at the peak | what it is |
| :-- | :-- | :-- |
| `biceps_r` | **1.52 × 1.56** | upper arm bulging — muscle contracting |
| `arm_r` | 1.00 × **1.23** | upper arm bulging across — length unchanged (corrected 2026-09-24; this row used to say "lengthening") |
| `arm_l_2` | 1.06 × **0.80** | forearm compressed — taking the impact |
| `hand_r` | 1.26 uniform | fist clenched, toward camera |
| `bat_tip` | 2.83 × **3.35** | a speed smear |

against a largest joint rotation, *in the same frame*, of 20°.

So `motion.py` has a `REACTION_SCALE` table of `(along the bone, across it)`
pairs. Three things about it are worth knowing before you tune it:

**The rotation table was cut to 60% to pay for it.** The budget was already
full: at the old numbers the worst triangle grew to 1.48× with no scaling at
all, against the 1.60× cap. Rotation and scale compete for the same budget, and
the reference's own answer to that trade is unambiguous.

**Scale does not inherit down the chain by default.** Letting a stretched upper
arm drag the forearm's whole frame with it inverts triangles at the wrist,
where the band tapers and the triangles are tiny. Measured on the example,
inheritance survives only to a sixth of the shipped amplitude. The reference
picks per bone — it blocks inheritance at every joint of the *right* arm, the
one doing the big stretch (`noScaleOrReflection`, then `noScale`, then `noScale`
again into the fingers), and lets it through on the left. `SCALE_INHERIT` is
that switch; it ships empty.

**There is a hard ceiling here that the reference does not have.** They stretch
an arm to 1.23× [⚠ 2026-09-24: the reference never lengthens it — that 1.23 is ACROSS the bone; this paragraph measured the wrong gesture, see motion.py]; this rig tops out near 1.11×, and giving up *all* joint
rotation only buys another 7%. That is structural, and it is the price of the
decision at the top of this file: their arm is a **separate attachment with its
own vertices**, so scaling it fights nothing. Here there is one continuous grid
over the whole image, so a scale on one bone has to be absorbed by the blended
boundary with its neighbours — and that boundary is exactly where the growth
shows up. One mesh buys "no seams, ever" and pays for it in squash-and-stretch
headroom.

What it actually delivers, measured on the example at the shipped `SCALE_K`:
the driving arm's own extent **along its bone** grows **5.8%** at the peak,
the reaction's worst triangle sits at **1.53×** against the 1.60× cap, and
rotation alone would have been 1.45× — so the channel is spending 0.08 of the
budget for all of that shape change.

### The bulge shakes

A held bulge that sits perfectly still reads as a freeze. Their `biceps_r`
oscillates between **1.40 and 1.52 on a 2-frame period** for the whole hold.
`FLUTTER` ports that, and modulates the *excess over 1* rather than the scale
itself — otherwise a small bulge like the chest's 1.02 would be pushed below
1.0 and a muscle straining under load would read as one flexing and relaxing.

---

## Props

A prop is the one case where a rigid layer is *better* than the mesh:

- **nothing in the art sits behind it** — no hole, no repair, no ceiling
- it is the only way to get **z-order** — a bat behind the hand and in front of
  the body, which one continuous mesh cannot express

Two placement rules that are easy to get wrong:

- **The pivot is where the hand holds it**, not the end of the object. Rotation
  moves a point by `distance × sin(angle)`; the pivot is the one place that
  stays put.
- **Angle 0 hangs down; 180 stands it up.** A hanging object cannot be *rotated*
  to point up — at any lean the far end is still below the hand. It has to be
  flipped, which is what 180 does: knob just below the fist, barrel rising.

The gate exempts a prop from the unison check **against its own parent bone**. A
bat held in a hand is a pendulum on a moving pivot; swinging with the arm is
physics, not the failure the check exists to catch. Every other pair still has to
be independent.

---

## What the gate measures

A continuous mesh cannot tear, so it does not look for holes. That was tried:
scanning every frame for a hole opening inside the silhouette fired 101 px on the
first character, and those pixels were the narrow channel between an arm and a
shirt pinching shut and becoming an enclosed pocket — the drawing behaving
correctly. Two rounds of narrowing could not separate it from a real fault,
because there is no real fault of that kind to find.

What a skinned mesh *can* do wrong is **fold**: push a bone far enough and
triangles collapse to zero area and then invert, creasing the art into a hard
kink that looks like a broken joint. That is exact and cheap:

- **FOLD** — no triangle inverts; none shrinks below 50% of its rest area
- **STRETCH** — none grows past 1.6×, beyond which its pixels smear
- **the reaction, at 8 trigger phases** — the same three, fired on top of
  whatever the idle happens to be doing, and reported next to what rotation
  alone would have cost so you can see what squash and stretch is spending
- **AREA** — opaque pixels stay within 1% of rest
- **feet planted** — under 0.15% of figure height
- **rate** — every moving bone cycles in 1.5–3 s
- **not in unison** — every pair under |r| = 0.60, prop-vs-its-own-bone exempt
- **amplitude** — worst *world* angle under 4°, summed along each bone's **parent
  path**, not over every bone in the file (summing everything counts the spine
  once per limb and reports an angle no bone reaches)

---

## Reproducing it elsewhere

```bash
python rig/reproduce.py
```

Runs the whole pipeline on the bundled example and asserts every measurement
above. If a library resamples differently or a default gets edited, this says so
instead of quietly producing a slightly different animation.

```bash
python rig/export_motion.py   # regenerate the JS constants after any tuning
python rig/parity.py          # prove the JS and Python are the same animation
```

The gate measures the Python model; the game runs the JavaScript one. Keeping a
hand-maintained copy in each language is exactly how they drift, so
`motion.generated.js` is written from `motion.py`, and `parity.py` evaluates both
sides over a whole loop and compares — **2372 values, worst difference 1e-16**.

---

## Using the runtime

`runtime/skinned.js` is a Pixi v8 component. Its own header is the reference;
the whole API is three calls:

```js
import { SkinnedFigure } from './runtime/skinned.js';

const fig = await SkinnedFigure.load('guy.rig.json', 'guy.png', {
  props: { bat: 'guy_prop_bat.png' },
});
stage.addChild(fig.view);
app.ticker.add(() => fig.update(app.ticker.lastTime));

fig.react();          // one-shot accent, on a feature trigger
```

The mesh is uploaded once and only its vertex buffer is rewritten each frame, so
the per-frame cost is one typed-array write plus the draw. Nothing is
re-uploaded and nothing is resampled on the CPU.

It reads its constants from `runtime/motion.generated.js`, which
`export_motion.py` writes out of `motion.py` — regenerate after any tuning, then
run `parity.py`.

**This path has never been run in a browser.** `parity.py` proves the JS
computes the same numbers as the Python the gate measured; it does not prove the
component draws. See `INTEGRATION.md` for what putting it into an existing
bundle actually costs.

---

## Where the numbers came from

Every constant in `motion.py` and every threshold in `inspect_art.py` and
`check.py` was measured off Hacksaw Gaming's *Miami Mayhem* (gameId 1824,
v1.23.2). The two write-ups are bundled so the citations resolve:

| | |
| :-- | :-- |
| `reference/character-reactions.md` | the reaction model, the peak pose, and what the rig demands of the art (§10) |
| `reference/background-idle-technique.md` | the idle model — loop lengths, amplitude distribution, follow-through |

`PROVENANCE.md` says what is and is not derived from that game.

---

## Tuning

```bash
python rig/build.py char.png --cols 20 --rows 52   # finer mesh (lowers limits!)
python rig/build.py char.png --amp 1.6             # more idle movement
python rig/build.py char.png --soft 2.2            # wider weight overlap
python rig/build.py char.png --no-arms             # body sway only
python rig/build.py char.png --no-plant            # let the feet move (do not)
```

Squash and stretch is tuned in `motion.py`, not on the command line: raise
`SCALE_K` for more shape change, edit `REACTION_SCALE` to change which bone
lengthens and which compresses, and put a bone name in `SCALE_INHERIT` if you
want its stretch to carry its children with it. Re-run `check.py` after any of
those — the reaction section is what catches an over-reach — then
`export_motion.py` and `parity.py`.

`character.rig.json` is plain JSON. The `bones` array is editable by hand, which
is the answer for a leaning or seated figure where the auto chain lands wrong.

---

## What is not here

- **Highlight layers.** Their reaction also animates slot alpha to turn on
  `bat_highlight`, `body_lights`, `guy_head_light`, `arm_r2` and `lenses2`.
  Five lit slots are a large part of why a trigger reads as a hit, they cost
  nothing against the fold budget, and — checked in the skeleton — they cost
  **no extra art either**: every one of them points at the same attachment as
  the layer underneath and just sets `"blend": "additive"`. Best next thing to
  add.
- **Squash and stretch on the IDLE.** The channel exists and the reaction uses
  it, but the idle is still pure rotation. A breath is a chest scaling, not a
  chest rotating, and that is probably the next real gain.
- **Big pose changes.** This is an idle-and-accent rig. A limb crossing in front
  of the body needs separate layers and the repair machinery that comes with
  them.
- **The idle does not close at the loop boundary** — worst 1.55 deg. That is
  deliberate: each bone has its own period so the figure never visibly repeats,
  and live, time never wraps. But a GIF does, so previews hitch once per cycle,
  and a Spine export would need periods on a common grid. `preview.py` warns.
  See `INTEGRATION.md`.
- **Nobody has watched the runtime on a real device.** The Python renderer and
  the gate agree, and `parity.py` proves the JS computes the same numbers, but
  the Pixi path has not been run in a browser.
