# -*- coding: utf-8 -*-
"""
The idle motion model, measured off Hacksaw's `character_main_guy` idle rather
than invented. Four findings, all of which cost me a wrong build first:

**The cycle is 2 seconds.** Their keyframes sit ~1 s apart, so every bone peaks
every 2 s -- spine, arms, hand, mask tips, all of them. A part on a 6 s cycle
does not read as alive, it reads as drifting. That was the actual cause of "it
looks unnatural" on the first build.

**The wave is not a sine.** It rises over 38% of the cycle and falls over the
other 62%. `mask3` runs 0 -> +6.75 in 0.77 s then drifts back to -6.63 over
0.93 s. A symmetric sine reads as a metronome.

**One beat in four goes wrong on purpose.** Once per 8 s loop, at 50-74% of it,
a part swings the other way and holds. `hand_r` peaks at +9.04 every cycle, then
at t = 4.3 goes to -9.77 and sits there for 1.2 s while the spine overshoots.
That single irregularity is most of what separates their idle from a loop.

**Each part needs its own PERIOD, not just its own phase.** With every part on
one period and only a lag, they measured r = 0.94-0.99 against each other -- four
parts on one sine, which looks exactly like the rigid whole-body sway you were
trying to get away from. Separate periods take it to |r| < 0.25.

Amplitudes follow their split too: the body barely moves (their arm bones rotate
+/-1.39 deg) and the appendages carry it (mask tips +/-6.7 deg). What swings is
whatever hangs free.
"""
from __future__ import print_function
import math


def wave(u):
    """rise over 38% of the cycle, fall over 62%, smoothed, in [-1, 1]"""
    u = u - math.floor(u)
    v = u / .38 if u < .38 else 1 - (u - .38) / .62
    return v * v * (3 - 2 * v) * 2 - 1


def odd_beat(q):
    """the once-per-loop excursion the other way, at 50-74% of the loop"""
    return 0.0 if q < .5 or q > .74 else -math.sin(math.pi * (q - .5) / .24)


DEFAULTS = {
    # name        amp   lag    period  odd   -- amp in degrees, times in ms
    # The spine is deliberately quiet. The chain accumulates, so these five add
    # up at the head, and a torso that visibly leans reads as swaying rather
    # than breathing -- which is what "晃太大" was.
    'root':     (0.00,    0,    2000, 0.0),
    'hips':     (0.06,   0,  2450, 0.0),
    'waist':    (0.12, 360,  2800, 0.2),
    'chest':    (0.24, 180,  2150, 0.3),
    'neck':     (0.38, 120,  2650, 0.5),
    'head':     (0.55,  60,  1750, 0.8),
    # Arms hang free, so they carry the motion instead. They are parented to the
    # chest, so they inherit its sway and add their own on top -- which is the
    # follow-through that makes an idle read as a body rather than a picture.
    'arm_l':    (1.60,   0,  2050, 0.4),
    'fore_l':   (1.20, 300,  1800, 0.3),
    'arm_r':    (1.50, 180,  1500, 0.4),
    'fore_r':   (1.10, 360,  1550, 0.3),
}

# The chain ACCUMULATES: the head's world angle is the sum of every bone below
# it, so six bones at 1.8 deg each is 6 deg at the top and the whole figure
# visibly leans. These are sized so the head reaches about 2.6 deg and travels
# ~1.5% of the figure's height, which is the order the reference sits at.
LOOP_MS = 8000          # the long loop that carries the odd beat


def angle(spec, t_ms, loop_ms=LOOP_MS):
    """one bone's angle at a time, in degrees"""
    amp, lag, period, odd = spec
    if not amp:
        return 0.0
    ph = t_ms - lag
    a = amp * wave(ph / float(period))
    a += amp * .25 * math.sin(math.pi * 2 * ph / float(loop_ms))   # slow drift
    if odd:
        a += amp * odd * odd_beat(((ph % loop_ms) + loop_ms) % loop_ms / float(loop_ms))
    return a


def angles(bones, t_ms, table=None, loop_ms=LOOP_MS):
    """angles for a whole chain, in bone order"""
    table = table or DEFAULTS
    out = []
    for b in bones:
        spec = table.get(b['name'], (0.0, 0, 2000, 0.0))
        out.append(angle(spec, t_ms, loop_ms))
    return out


def scale_amplitudes(table, k):
    return {n: (a * k, l, p, o) for n, (a, l, p, o) in table.items()}


# ==========================================================================
# reaction -- the one-shot accent for a feature trigger
# ==========================================================================
"""
Measured off `character_main_guy`'s `full_screen/reaction`, which is a
completely different animal from its idle:

    duration            8.00 s  ->  1.00 s
    keys per bone       10-21   ->  3-7
    biggest channel     rotation -> TRANSLATION

The shape is snap / hold / return: every channel slams to its extreme inside
0.17-0.20 s, most of them sit there until about 0.63, then ease back to zero by
1.00. Their `neck` holds +10.6 deg from 0.17 to 0.57 without moving; `hand_r`
holds -16.5 from 0.27 to 0.67.

Three things carry it, and joint rotation is not one of them:

* **Translation.** `body_perspective` moves (+51, +91) -- on a ~700 unit figure
  that is 13% of its height. A translation on the root distorts nothing, so
  unlike a joint rotation it has no ceiling. This is where the size comes from.
* **The held object.** `bat_tip` flies -70 units AND scales 3x, which is a
  smear. A prop is rigid and has nothing behind it, so it can swing as far as
  you like -- it is the only part of the figure that can.
* **A second, smaller snap inside the hold.** Their `bat` goes +3.2 at t=0.47
  and then -11.4 at t=0.50 -- one frame -- before settling. Without it the hold
  reads as a freeze.

Their arm bones barely move even here (`arm_r_2` 7.7 deg), which matches what a
skinned mesh can actually take. Measured on this rig: shoulder 5 deg, chest 7,
elbow 16, neck 19 before a triangle collapses. Note that a FINER mesh lowers
those numbers, because the distortion concentrates in smaller triangles.
"""

REACTION_MS = 1000
SNAP, HOLD = 0.18, 0.63

# Per bone, degrees at the peak.
#
# These are SMALL, and that is not timidity. Single-joint limits on this mesh
# are shoulder 5, chest 7, elbow 16, neck 19 -- but they were each measured
# alone, and a reaction fires them together, so the shears add. Sweeping a
# scale over the whole table, the largest that keeps every triangle inside the
# fold and stretch bounds is 0.40. Above it the worst triangle collapses to 3%
# of its rest area, which creases the art.
#
# So the SIZE of a reaction cannot come from joint rotation. It comes from the
# two channels that have no ceiling, below.
# Attributing the budget bone by bone: with the arms left out entirely the
# spine sits at 0.65 / 1.42, comfortably inside. Adding the arms takes it to
# 0.38 / 1.69, and it is the LEFT arm specifically -- its detected band runs
# longer and tapers to almost nothing at the hand, so the triangles there are
# tiny and shear hard. So the spine gets MORE than the naive scale allowed and
# the arms get half, which passes at every trigger phase (0.54 / 1.53).
#
# CUT TO 60% WHEN SQUASH AND STRETCH WAS ADDED. The budget was already full --
# at the old numbers the worst triangle grew to 1.48x with no scaling at all,
# against a 1.60x cap. Rotation and scale compete for the same budget, and the
# reference's own answer is unambiguous: their largest joint rotation in the
# peak frame is 20 deg while their arm is at 1.23x and their biceps at 1.52x.
# Rotation tilts a picture; scale is what reads as force. So rotation gave way.
# The frontier was measured, not guessed -- see SCALE_K.
REACTION = {
    'chest':   1.68,
    'neck':    2.70,
    'head':    4.02,
    'arm_r':  -0.48,
    'fore_r': -1.56,
    'arm_l':   0.36,
    'fore_l':  1.08,
}
# Whole-figure shift at the peak, as a fraction of figure width / height.
# A root translation moves every vertex by the same amount, so NO triangle
# changes shape at all -- unlimited by construction. The reference puts its
# largest number here too (+91 units, ~13% of its figure height).
REACTION_LIFT = (0.018, -0.045)
# The prop is rigid and has nothing behind it, so it is the other place size is
# free. 58 deg on a 300 px bat moves the tip about 250 px -- roughly a third of
# the figure's height, and the thing the eye actually reads.
REACTION_PROP = dict(deg=58.0, kick_at=0.50, kick_deg=-20.0, stretch=1.35)


# ==========================================================================
# squash and stretch
# ==========================================================================
"""
Rotating a flat image carries no information about force. Every pixel keeps its
relationship to every other pixel; the whole thing just tilts, and the eye reads
"that picture is crooked", not "that person is straining". What reads as force is
the image changing shape INTERNALLY -- lengthening along a limb, thickening
across it.

Measured at the peak frame of the reference's `full_screen/reaction`:

    biceps_r   1.52 x 1.56     upper arm bulges 52%      -- muscle contracting
    arm_r      1.00 x 1.23     whole right arm +23%      -- being thrown out
    arm_l_2    1.06 x 0.80     forearm compressed 20%    -- taking the impact
    hand_r     1.26 uniform    fist enlarged             -- clenched, toward camera
    bat_tip    2.83 x 3.35     tip 3x                    -- a speed smear

against a largest joint rotation, in the same frame, of 20 deg.

Two of those are volume-preserving in the classical sense (`arm_l_2` compresses
20% along and bulges 6% across) and two are not (`arm_r` only lengthens; the
bat tip only grows). Strict volume preservation is not the point -- a limb is
long and thin and nobody has a reference for its cross-section. What matters is
that the change is ALONG or ACROSS the bone, not uniform, or it just looks like
the limb got bigger.

The reference splits each limb into a segment bone and a muscle bone so it can
lengthen one and bulge the other. This rig has one bone per segment, so the two
are folded into the `(along, across)` pair below.

WHY THE NUMBERS HERE ARE SMALLER THAN THE REFERENCE'S: they were swept against
the gate, exactly the way the rotation table was. See SCALE_K.
"""

# Per bone at the peak, as (along the bone, across it), before SCALE_K.
#
# ⚠ CORRECTED 2026-09-24. This table used to read the reference's Spine scales
# the wrong way round. A Spine bone's scaleX is ALONG the bone (its local x IS
# the bone's direction) and scaleY is ACROSS it, so `arm_r 1.00 x 1.23` means
# the upper arm THICKENS 23% and keeps its length. Measured off the motion
# pack (spineplay/packs/miami_main_guy.motion.json, full_screen/reaction,
# t=0.2): arm_r's world x-axis stays 1.000 and shoulder->elbow stays 231.09
# units, its y-axis goes to 1.229; arm_l_2 goes 1.063 along / 0.799 across.
# The old table had arm_r (1.23 along, 1.10 across) and the bracing forearm
# (0.80 along, 1.06 across) -- a limb stretched along itself while its hand is
# pinned can only bow, and on every figure this was ported to (Capo Nostra,
# Turf War, Hard Time, Deadwood Express) the arms read 「像沒骨頭」. None of the
# four Miami characters with a reaction lengthens an arm by more than 6%.
# `chest` / `neck` had no source in main_guy's reaction and are dropped.
#
# So the gesture is: the driving upper arm bulges (muscle), its forearm is left
# alone, and the bracing forearm thins slightly and lengthens 6% -- shape change
# ACROSS the limb, not along it. Rotation still carries the pose.
REACTION_SCALE = {
    # the driving arm: upper arm bulges across, length unchanged (ref arm_r 1.00 x 1.23)
    'arm_r':  (1.00, 1.23),
    # the bracing forearm: slightly longer, thinner across (ref arm_l_2 1.063 x 0.799)
    'fore_l': (1.06, 0.80),
}

# ⚠ The sweep and the "ceiling" note below were measured with the OLD, swapped
# table (arm lengthening along itself) and are kept as history. Their
# conclusion -- "this rig tops out near 1.11x arm stretch" -- was a limit on a
# gesture the reference never makes. Re-sweep k for the corrected shape on your
# own rig; on Turf War / Hard Time the corrected bulge bends the arm about as
# little as no squash at all (affine residual 1-3 per mille of figure height).
#
# Swept against the gate at 8 trigger phases, the same way the rotation table
# was: rotation scaled from 1.0 down, and for each setting the largest scale
# that still passes FOLD / STRETCH / AREA.
#
#   rotation x   max k    arm_r along   head deg   shrink   grow
#      1.0        0.08       1.018        6.70      0.534   1.575
#      0.8        0.14       1.032        5.36      0.568   1.569
#      0.6        0.46       1.106        4.02      0.522   1.496   <- shipped
#      0.5        0.48       1.110        3.35      0.526   1.479
#      0.2        0.34       1.078        1.34      0.628   1.573
#
# (the jump at 0.6 is the softened bracing arm above; before softening it the
# whole column sat around k = 0.22)
#
# Shipped at 0.42 rather than the 0.46 the sweep allows, so a slightly
# different figure does not land straight on the cap.
#
# THE CEILING IS THE POINT. The reference stretches an arm to 1.23x; this rig
# tops out near 1.11x, and no amount of retuning moves that much -- giving up
# ALL joint rotation only buys another 7%. The reason is structural and it is
# the price of the decision at the top of the README: their arm is a SEPARATE
# attachment with its own vertices, so scaling it fights nothing. Here there is
# one continuous grid over the whole image, so a scale on one bone has to be
# absorbed by the blended boundary with its neighbours, and that boundary is
# where the growth shows up. One mesh buys "no seams, ever" and pays for it in
# squash-and-stretch headroom.
SCALE_K = 0.42

# The bulge does not hold still. The reference's `biceps_r` oscillates between
# 1.40 and 1.52 on a 2-frame period for the whole hold -- a muscle shaking
# under load. Without it the hold reads as a freeze even with the bulge on.
# The flutter modulates the EXCESS over 1, not the scale itself. Their biceps
# swings 1.40 <-> 1.52: a mean bulge of 1.46 wobbling by +/-0.06, which is
# +/-13% OF THE BULGE (0.06 / 0.46). Modulating the scale directly instead
# would push a small bulge like the chest's 1.02 below 1.0, turning a muscle
# shaking under load into one alternately flexing and relaxing.
#   depth: fraction of the bulge that flutters, +/-
#   period_ms: 2 frames at 30 fps
FLUTTER = dict(depth=0.130, period_ms=66.7)

# Whose scale passes down to their children. Empty by default, and the shipped
# amplitudes were swept that way. Turning it on for an arm makes the limb
# genuinely reach further instead of only redistributing its own pixels, but it
# costs an order of magnitude: measured on the example, inheritance holds
# together only to k = 0.06 against the shipped 0.42.
#
#   inherit off, k = 0.42   upper arm's own extent along its bone  +5.8%
#   inherit on,  k = 0.06   arm span +1.9%, almost no shape change
#
# The reference picks per bone rather than globally -- see `skin.bone_matrices`.
SCALE_INHERIT = frozenset()


def reaction_scales(bones, t_ms, react_start=None, k=None):
    """Per-bone (along, across) scale factors. All 1.0 when nothing is firing."""
    n = len(bones)
    if react_start is None:
        return [(1.0, 1.0)] * n
    u = (t_ms - react_start) / float(REACTION_MS)
    e = react_envelope(u)
    if e <= 0:
        return [(1.0, 1.0)] * n
    k = SCALE_K if k is None else k
    # the flutter only runs during the hold -- a muscle shakes while it is
    # holding a load, not while it is still travelling
    f = 0.0
    if SNAP <= u <= HOLD:
        f = FLUTTER['depth'] * math.sin(2 * math.pi * (t_ms - react_start)
                                        / FLUTTER['period_ms'])
    out = []
    for b in bones:
        sa, sc = REACTION_SCALE.get(b['name'], (1.0, 1.0))
        if sa == 1.0 and sc == 1.0:
            out.append((1.0, 1.0))
            continue
        # blend from identity by the envelope and the swept size; the flutter
        # rides on the excess so it can never cross back through 1.0
        out.append((1.0 + (sa - 1.0) * e * k * (1 + f),
                    1.0 + (sc - 1.0) * e * k * (1 + f)))
    return out


def react_envelope(u):
    """0 -> 1 in SNAP, hold to HOLD, ease back to 0 by 1."""
    if u <= 0 or u >= 1:
        return 0.0
    if u < SNAP:
        t = u / SNAP
        return t * t * (3 - 2 * t)
    if u < HOLD:
        return 1.0
    t = 1 - (u - HOLD) / (1 - HOLD)
    return t * t * (3 - 2 * t)


def react_kick(u, at=0.50, width=0.10):
    """the single-frame flick partway through the hold"""
    if u < at or u > at + width:
        return 0.0
    return math.sin(math.pi * (u - at) / width)


def reaction_state(bones, t_ms, react_start=None, figure_box=None, table=None):
    """idle angles, plus the reaction on top; returns (angles, offsets, u)."""
    ang = angles(bones, t_ms, table)
    offs = [(0.0, 0.0)] * len(bones)
    if react_start is None:
        return ang, offs, 0.0
    u = (t_ms - react_start) / float(REACTION_MS)
    e = react_envelope(u)
    if e <= 0:
        return ang, offs, 0.0
    for i, b in enumerate(bones):
        if b['name'] in REACTION:
            ang[i] += REACTION[b['name']] * e
    if figure_box:
        x0, y0, x1, y1 = figure_box
        offs[0] = (REACTION_LIFT[0] * (x1 - x0) * e,
                   REACTION_LIFT[1] * (y1 - y0) * e)
    return ang, offs, u


def prop_reaction(name, spec, t_ms, react_start=None):
    """prop angle and scale, idle plus reaction"""
    a = angle(tuple(spec), t_ms)
    sc = 1.0
    if react_start is not None:
        u = (t_ms - react_start) / float(REACTION_MS)
        e = react_envelope(u)
        if e > 0:
            p = REACTION_PROP
            a += p['deg'] * e + p['kick_deg'] * react_kick(u, p['kick_at'])
            sc = 1.0 + (p['stretch'] - 1.0) * max(0.0, e - abs(u - SNAP) * 3)
    return a, max(0.5, sc)
