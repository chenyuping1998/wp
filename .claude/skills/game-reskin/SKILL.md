---
name: game-reskin
description: Turning an existing Stake Engine slot in this `wp` monorepo into a new, uploadable game — new theme, new mechanics, new art, same proven engine. Use this whenever a user wants to reskin/fork an existing app under `wp/apps/*` into a new one, from the first "what should we call it" through the final upload zips. Covers the whole pipeline in order: confirming the source and theme, spec changes, scaffolding, math, the art brief, frontend build and theming, wiring in art the user generates, fine-tuning, pre-submission QA, thumbnail, and packaging. Built from shipping Capo Nostra out of Hot Miami, then extended with the six findings from the Stake review that passed Hot Miami — five of which are generic to this codebase and will be raised against any reskin unless fixed first. Every gotcha in here cost real turns the first time.
---

# Reskinning a Stake Engine slot

A reskin is not a copy with new colours. It is a new game that happens to start
from a proven engine, and every phase below exists because skipping it produced
a real, found bug when Capo Nostra shipped out of Hot Miami — a symbol whose
rig was still a flamingo, a frame overlay that was the old game's pre-softened
art, a paytable naming a briefcase "Flamingo", a menu button sitting on top of
the paytable icon. None of those were exotic; all of them were "the old game's
version of this thing was still there and nobody looked."

Two other skills do part of this and should be pulled in rather than
re-derived:

- **`stake-engine-slot`** — the build commands, the static guards, the Svelte 5
  traps, and the certification/pre-submission checklist. Load it for anything
  about *how this codebase builds and gets reviewed*, independent of reskinning.
- **`mesh-cast-rig`** — animating a character from one flat illustration with a
  skinned mesh. The "must have a moving character" requirement below is built
  with this, not with cut-out Spine parts.

This skill is the sequencing and the reskin-specific gotchas on top of both.

## Before starting: confirm, don't assume

Three things must come from the user, not from a guess, because guessing wrong
here means redoing everything downstream of the guess:

1. **Source game.** Which existing `wp/apps/*` app is the base. If unstated,
   ask — do not pick the most recently touched one.
2. **Theme and name.** Offer a short list of name candidates if the user hasn't
   settled on one, but the FINAL name has to clear the restricted-word check
   before anything is built on it — see the note below. A theme rename that
   looks fine ("Cash Frames") can be a banned term ("cash") that only surfaces
   when `check_social_words.mjs` runs at the very end, by which point it is
   threaded through code, comments, and art requirements. Run that check (or
   its equivalent grep against Stake's restricted-word table — see
   `stake-engine-slot`'s `references/certification.md`) against every
   candidate MECHANIC NAME the moment it's chosen, not at final QA.
3. **Spec changes.** What mechanically differs from the source game, and what
   stays identical (payline count, board size, general beat/timing). Get this
   in writing as a short diff table before touching code — it is the spec for
   every phase after it, and it is worth showing back to the user once as
   "here's what I understood, confirm or correct" before scaffolding.

## The workflow

### 1. Scaffold

Copy the source app's folder wholesale (`wp/apps/<Source>` →
`wp/apps/<New>`), and the source's math-sdk game folder
(`math-sdk/games/<source>` → `math-sdk/games/<new>`). At this point everything
still IS the old game under a new folder name — that's expected and correct
for step zero. Rename `game_id`/`working_name` in `game_config.py` and the
app's own name strings, but don't start re-theming yet; confirm the app boots
(blank-screen is a real failure mode here) before building on top of it.

### 2. Math

Do this early, in parallel with the art brief if possible — it does not block
on art, and its own turnaround (the Rust optimizer) is the slowest thing in
the whole pipeline, so starting it late just makes it the critical path later.

- Write the new game's mechanic changes into `game_config.py` and
  `game_executables.py`/`game_events.py` as needed.
- Set per-mode RTP targets and retarget `game_optimization.py`'s slices to
  match — see `references/math-retarget.md` for the exact discipline
  (verify the assertion locally BEFORE launching the real, multi-minute run;
  measure the real distribution after, don't assume a scale_factor did what
  it looks like it should).
- Run `run.py` (background it — this is minutes, not seconds) and confirm
  `verify_optimization_input`'s RTP-sum assertion passed, max win is
  reachable in every mode (payout==wincap rows exist in every mode's LUT),
  and book counts match `num_sim_args`.
- **Assert your own mechanic against the generated books.** Nothing in the
  toolchain does this. `run.py` proves internal consistency and
  `check_math_bundle.py` proves RTP/counts/payout hashes — neither knows what
  your Game Info promises the player. A doubling rule in Hot Miami was broken
  for **three submissions** (1,521 lost doublings in 4,000 books, all of them on
  spins where a second feature also fired) and was found by a reviewer playing
  one hand. If your game says "X happens to Y because of a win", write the
  twenty-line script that walks the books and checks it, and run it on every
  regeneration. See `references/review-findings.md`.
- **Check volatility/tail-probability compliance before considering math
  done, not after a rejection.** Stake's own dashboard checks Tail
  Probability at 5,000x/10,000x per star tier, independent of RTP. A high
  buy-cost mode (500x+) is structurally likely to fail this unless a buy
  mode's win-scaling was tuned with it in mind — see
  `references/math-retarget.md`'s section on this specifically; it is cheap
  to check locally and expensive to discover after upload.

### 3. Art brief

Write the art requirements doc BEFORE the frontend build reaches anything
that depends on final art, so the user can start generating while frontend
work proceeds on placeholder/inherited art. See
`references/art-brief-template.md` for the section list this needs and why
each one is there (it is not a generic "list of assets" — it encodes rules
like "differentiate symbols by silhouette/material, not hue" that come from a
specific failure).

Two requirements that are easy to state and easy to drop by the last art pass:

- **One clear identity per role, matching the new theme's own logic** — Capo
  Nostra went from Hot Miami's two-figure cast (a man and a woman marking base
  vs. feature) to one suited boss throughout, because the theme's logic didn't
  support a second figure the way Miami's did. Don't carry over the source
  game's cast COUNT or COMPOSITION by default; derive it from the new theme.
- **A moving character is not optional** — see `mesh-cast-rig`. Decide early
  whether the new art will be drawn with the daylight-under-the-arms margin a
  mesh rig needs (see that skill's own notes on why a tight-armed pose drags
  hands into the torso at scale), and say so in the art brief if the pose
  needs adjusting for it.

### 4. Frontend: style match

This is where "reskin" earns its name, and where a source game's fingerprints
are easiest to leave in by accident. Match the NEW theme in:

- **Fonts.** A body face and a display/title face, matching the theme's own
  visual language (Capo Nostra: Art Deco stone-cut caps for anything drawn as
  "carved" — titles, tier names, big-win banners — a narrower serif for
  numbers because a display face loses to legibility at bet-bar size). Audit
  drawn-lettering vs runtime-text as one pass: everything the art shows as
  lettering (plaques, tier titles, banners, logo) sets the runtime font
  family; numbers do not follow it if it costs legibility. See
  `references/art-brief-template.md`'s lettering-audit section.
- **Colour.** The shared UI packages default to whatever palette the LAST game
  that touched them shipped with (`components-ui-pixi` in particular carries
  a previous game's hardcoded hex values in several components — bet bar,
  modal chrome, scrollbars). Every one of these needs an explicit override in
  the new game, not an assumption that "it'll pick up the theme somehow." See
  `references/dead-asset-audit.md` for how to find the ones an eyeball pass
  misses (win-line palettes, symbol-land flash colours, splash-panel plate
  colours borrowed wholesale from a different game's own asset).
- **Character.** Built via `mesh-cast-rig`. It has to actually move — see
  that skill for the motion-table discipline (appendages carry the motion,
  the body barely moves; a body that sways as far as its limbs reads as a
  person swaying, which reads worse than standing still) — and it has to be
  sized against the ACTUAL side-band width at every breakpoint, including
  portrait, where a board that fills nearly the whole width leaves no band at
  all: below some threshold, don't shrink the figure, don't draw it.
- **Transitions and set-pieces.** Don't reuse the source game's transition
  motif just because the code is already wired — pick one that fits the new
  theme's own imagery (Capo Nostra replaced "a car drives past" with vault
  doors closing, because the Scatter IS a vault dial and the top tier's
  backdrop IS a vault room; the beat needed a mechanically equivalent
  replacement, not a re-skinned car). Re-derive the beat from the new theme,
  don't just recolour the old one's asset.

Wire book events and presentation with the same discipline the source game
used (reveal/board-state consistency, sound-per-event, guard scripts) — that
part IS meant to carry over unchanged; it's the proven engine.

### 5. Art integration loop

Once the user starts generating art:

1. Wire what's delivered into the actual asset registry (`assets.ts` or
   equivalent) — not into a duplicate/placeholder path that then has to be
   swapped later.
2. Screenshot the real board/panels and show them back rather than describing
   what should be true. A frame asset can be technically wired and still be
   the wrong file (see the "frame.png was the pre-softening plaque" case in
   `references/dead-asset-audit.md`) — screenshotting catches what reading
   the diff does not.
3. When a delivered asset needs programmatic rework (softening a frame's
   opacity, recolouring a set, building a sheet), that's `asset-pipeline`
   work — measure before/after (opacity %, contrast ratio, coverage), don't
   eyeball it.
4. Iterate against concrete, stated feedback each round. If a round's
   feedback implies a broader rule ("too colourful/messy" led to a whole
   palette-consistency pass, not just the one screen mentioned), write that
   rule down in the art brief so the next round of generated art doesn't
   need the same correction again.

### 6. Pre-submission QA

Two passes, and they check different things:

- **`game-qa`** (and/or manual play): does the actual presentation work —
  every book event has a payoff, no state carries over wrong between rounds,
  no silent asset failures, transitions land clean. Play through every
  feature tier at least once, including retrigger and the top tier's guarantee
  mechanic if it has one.
- **`stake-compliance`**: the certification-shaped checks — restricted words
  (re-run this even if it was checked at naming time; copy drifts), the
  server-contract checklist, replay mode, RTP disclosure matching the actual
  shipped config.

**Before either of those, work through `references/review-findings.md`.** It is
the six items Stake raised on the submission that finally passed Hot Miami —
**five of them are generic to this codebase and a reskin inherits every one**:
the word "Stake" in the disclaimer, no insufficient-balance message, currencies
that render as words (XOF/XAF/XPF), a store tile with more than one character,
and portrait controls that vanish permanently after the first spin. All five are
one-line-to-one-file fixes in advance and a full round trip to discover.

On top of all of that, run the reskin-specific one neither `game-qa` nor
`stake-compliance` is built to catch: **is anything still the old game's?** See `references/dead-asset-audit.md` for
the concrete greps (old game's name, old palette hex values, symbol rigs still
depicting the old cast, dead asset folders the new game never references) and
the real examples found doing this for Capo Nostra. Do this pass LAST, after
art integration is done, because earlier passes will have false negatives on
anything not wired in yet.

Also check at normal and smallest supported sizes, and check whatever the
shared bottom-bar menu can overlap (Capo Nostra's Buy Bonus button sat on top
of the paytable/info icons when the menu opened — a shared-component
interaction, not something either game's own code visibly caused).

### 7. Thumbnail

Platform-composited layers (BG/FG/logo), no burned-in title or provider text
per Stake's own convention — see the source game's thumbnail files as the
reference for what "correct" already looks like, since this part rarely
changes shape between reskins.

### 8. Package

See `references/packaging.md` for the exact, repeatable command sequence
(sync math config → frontend build → playtest stub rebuild → three zips) and
the sanity greps that must pass before calling a zip final (no old game name
string anywhere in the shipped frontend, no localhost/stub references, no
playtest-only files in the upload build). Write or update a HANDOFF.md as you
go, not retroactively — it is the only place the exact retarget numbers and
the reasoning behind each scale_factor live, and reconstructing that after
the fact from a diff is much slower than writing two sentences at the time.

## Cross-cutting principles

**Measure, don't assume — for math AND for presentation.** A `scale_factor`
change to the optimizer does not affect the resulting distribution linearly or
predictably; the only way to know it worked is to regenerate and recompute the
actual metric. The same discipline applies to visual claims — "the frame looks
softer now" needs a measured opacity percentage, not a screenshot glanced at.

**Distrust timing measured through a hidden/backgrounded browser pane.**
`requestAnimationFrame` freezes while the pane is hidden and catches up in one
jump when it's fronted, which makes any `performance.now()`-based interval
measured across tool calls worthless — it will show either near-zero or
enormous gaps that have nothing to do with the real timing. Front the tab
before timing anything, or measure on a clock that keeps running regardless
(the Web Audio clock, for instance, for anything sound-timing-related), and
say explicitly in any report which one was used.

**Nothing is inherited by default — everything is inherited unless replaced.**
The scaffold step copies the OLD game byte-for-byte. Every subsequent phase's
job is to find and replace what belongs to the old theme; nothing about the
copy self-identifies as "still old" — nothing highlights the leftover
`flamingo.png` reference or the palette hex value nobody re-themed. Treat "did
I actually touch this" as the default assumption to doubt, not the exception.
