---
name: game-reskin
description: >-
  Turning an existing Stake Engine slot in this `wp` monorepo into a new,
  uploadable game — new theme, new mechanics, new art, same proven engine. Use
  this whenever a user wants to reskin/fork an existing app under `wp/apps/*`
  into a new one, from the first "what should we call it" through the final
  upload zips. Covers the whole pipeline in order: confirming the source and
  theme, spec changes, scaffolding, math, choosing the art style WITH the user
  (a scored shortlist — American comic, noir black-and-white plus one accent,
  woodcut, engraving, screenprint, ink wash, rubber-hose, manga, street
  sticker-bomb, TV-cartoon mascot, grotesque caricature, grime and more, each
  checked against atlases of what Hacksaw's 183 and Nolimit City's 143
  shipped slots use — asked before any prompt is written), the art brief and its anti-"AI look" rules, frontend build and
  theming, wiring in art the user generates, fine-tuning, pre-submission QA,
  thumbnail, and packaging. Also use it when generated art looks too
  AI-made, when a game's style needs choosing or changing, or on 畫風 / 美術風格
  / 風格 / AI 感 / 太像 AI / 美式漫畫 / 黑白 / 版畫 / 橡皮管 / 日漫 / 塗鴉 /
  貼紙 / 參考 Hacksaw 或 Nolimit 畫風. Built from shipping Capo Nostra out of Hot Miami,
  then extended with the six findings from the Stake review that passed Hot
  Miami — five of which are generic to this codebase and will be raised against
  any reskin unless fixed first, and with Deadwood Express's 5/10 "poor UI"
  review (controls that stay lit after a touch tap, portrait controls off the
  screen edge) and its restaging trap. Every gotcha in here cost real turns the
  first time.
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
- **`hacksaw-character-motion`** (user scope) — the cast character. Its
  `archetype/` flow is the default for a reskin: the user PICKS a pose
  archetype from a numbered gallery, that choice becomes the character's art
  brief directly (layers, cut lines, pose, joint guide), the delivered layers
  are rigged one mesh per layer on a shared skeleton and gated, and the game
  gets its OWN motion table measured from the archetype. Its research-only
  motion packs replay the reference exactly for comparison and never ship.
- **`mesh-cast-rig`** — the older one-flat-illustration skinned mesh. Still
  what Capo Nostra / Turf War run today; use it only when a game keeps a
  single-image figure.

This skill is the sequencing and the reskin-specific gotchas on top of both.

## Before starting: confirm, don't assume

Four things must come from the user, not from a guess, because guessing wrong
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
4. **Art style.** Not the source game's style by default, and not "whatever
   the image model draws" — that default (glossy semi-real metal, even
   micro-detail, soft glow) is what five of this repo's games already look
   like. Ask with a scored shortlist and a recommendation, as soon as theme
   and name are settled; the full procedure is step 3 below. It can be asked
   in the same AskUserQuestion round as the name if both are open.

### The user's vocabulary — pin these before acting on a tuning request

Two words in this project mean something narrower than their generic slot sense,
and reading them the generic way cost **five** optimizer re-runs on Turf War
before the intent was nailed down. When the user asks to "lower X to get more
Y", confirm which of these they mean before touching a slice:

- **"odds"** = the **pay-table payout values themselves** — the per-combination
  multipliers in `game_config.py`'s `self.paytable` (the 5×/4×/3× numbers the
  in-game pay-table modal shows). NOT the win hit-rate, NOT an optimizer slice
  hit-rate. "Lower the odds" → cut the `self.paytable` dict values, keeping the
  ladder monotonic (H1 > … > L). `sync_math_config.py` then propagates the new
  table to the frontend's `config.ts` and the pay-table modal automatically;
  the rules-modal prose does not restate symbol pay values, so it needs no edit.
- **"feature"** = the game's **signature mechanics** (for Turf War: the
  expanding wild and the full-board Big Score frame). NOT the free-spin trigger
  rate. "Trade odds for more feature" → cut the pay-table AND make those
  mechanics land more often (reel special-symbol density in `make_reels.py`, the
  full-board-frame chance in `game_config.py`) — leave the `freegame_*` trigger
  hit-rates in `game_optimization.py` alone unless the user explicitly says
  "more free spins".

The optimizer holds each mode's RTP regardless, so cutting the pay-table on its
own just makes an ordinary line win a smaller number on screen and pushes that
return into whatever the "more feature" ask points at — within the `basegame`
slice, not by moving the base/feature split.

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

**Choose the art style with the user first — before a single prompt exists.**
Read `references/art-direction.md` and run its procedure; the short version:

1. **Find the theme's native medium** — what that world would have printed,
   painted or carved itself (1930s mob → pulp covers and noir halftone;
   Western → woodcut wanted posters; finance → banknote engraving). A real
   medium has physical rules a model can follow, which is the main defence
   against the default render look. Then check
   `references/hacksaw-style-atlas.md` for what Hacksaw's 183 slots chose for
   that theme and which lanes are still empty
   (`scripts/hacksaw_styles.py list --theme <word>`). For crime, prison,
   horror, western, war, punk and satire themes also check
   `references/nolimit-city-styles.md` (Nolimit City's 143 slots,
   `scripts/nolimit_styles.py list --theme <word>`) and its board rules: a
   frame that is an object from the world, a colour card behind each high,
   low pays in the world's own material, one alarm colour, ugly specific
   faces. Its main finding: their art measures like a render on
   `check_style.py` and still has an identity, because the identity comes
   from those decisions, not from low colour counts.
2. **Shortlist three styles plus one contrast** from the catalogue (American
   comic, noir black-and-white plus one reserved accent, woodcut, engraving,
   screenprint/risograph, flat vector, cel, ink wash, constructivist, Art
   Nouveau, gouache, TV-cartoon mascot, rubber-hose 1930s, manga ink, street
   sticker-bomb, grotesque caricature, grime plus one alarm colour,
   found-object collage — and the semi-real 3D default, listed with its honest cost
   rather than silently fallen back to). **Score each** on theme fit,
   readability at a 70 px portrait cell, cast-rig compatibility, lobby
   distinctiveness at 200 px, generation control/post-process cost, and
   review risk. This scoring IS the professional opinion — give it, don't
   just list names.
3. **Ask** — AskUserQuestion, 畫風 (recommended one first, labelled
   「（推薦）」, each option's `preview` the scored card in 繁中, naming two or
   three Hacksaw or Nolimit titles that use the style) and 色彩策略, optionally
   質感. Send one `hacksaw_styles.py sheet --key <key> --kind screen` (or
   `nolimit_styles.py sheet --key <key> --kind screen`) contact sheet
   per option with it, so the user picks from pictures. Titles and sheets are
   for looking only: never in a prompt, never attached to a generation. If
   the user defers, take the recommendation and say so.
4. **Style test** — H1, one low-pay, the Wild, a background crop (and the
   cast head if in scope), composited on the real board and at 200 px, plus
   `scripts/check_style.py --sheet`. The approved result is the **style
   frame**; its measured numbers go into the brief's §0 and gate every later
   delivery.
5. **Propagate §0** — into the cast brief via `archetype/brief.py --style
   <app>/ART_BRIEF.md --style-kind <key> --style-frame <frame>` (without
   `--style` the figure comes back in the default look beside stylised
   symbols, and the generated README says it isn't ready to hand over), the
   icon drawer's line weight, frame/plate art, win-FX colours, fonts,
   transitions and the thumbnail. Keep §0's heading as `## 0…` — that is what
   `--style` extracts.

Write the art requirements doc BEFORE the frontend build reaches anything
that depends on final art, so the user can start generating while frontend
work proceeds on placeholder/inherited art. See
`references/art-brief-template.md` for the section list this needs and why
each one is there (it is not a generic "list of assets" — it encodes rules
like "differentiate symbols by silhouette/material, not hue" that come from a
specific failure).

Two requirements that are easy to state and easy to drop by the last art pass:

- **Two characters, always: one for MG (the base game), one for FG (free
  spins).** This is the user's standing rule (2026-09-28) for every game from
  now on, and it replaces the old "derive the cast count from the theme" advice
  that took Capo Nostra down to one boss in every mode. Capo is being brought
  back to two for that reason.
  - **Two different people**, not one person relit. Capo's `guy_feature.png`
    and `guy_don.png` are the Don with warmer or gold rim light. That is a
    lighting variant of the MG figure, and it does not count as the FG
    character. Lighting variants per FG tier can still sit on top of the FG
    figure.
  - **The swap is the mode change.** MG figure in the base game, FG figure
    from the FG intro until the FG outro closes, then back. Swap under the
    transition, never mid-spin and never on a win, and do not show both at
    once on the board.
  - **The pair reads as a pair**: same §0 style, light direction and scale
    (feet on the same line, heads within about 5% of each other), and a
    contrast the player sees at a glance, such as build, gender, age or one
    colour (Hot Miami: a man in MG, a woman in FG). Their roles come from the
    new theme, never copied from the source game.
  - **Neither is a pay-symbol portrait** (standing the H1 art beside a board
    that shows H1 reads as a bug; see Capo's `Cast.svelte` note). The store
    tile still shows one character (`review-findings.md`).
  - **Both go through the archetype flow below**, one brief each, and each
    may take a different archetype. Each figure is rigged and gated on its
    own; they can share the game's motion table only if both pass its gates.
- **A moving character is not optional — and the user chooses its pose.**
  In this step, run `hacksaw-character-motion`'s archetype flow once for the
  MG figure and once for the FG figure: show
  `gallery/overview.gif`, ask which archetype (AskUserQuestion, two questions:
  hanging arms / carrying a prop / arms crossed, then which one), then
  `python archetype/brief.py -c N --game <Name> --out design/cast_brief/
  --feet-y .. --top-y .. --style ART_BRIEF.md --style-kind <key>
  [--style-frame <frame>]` and hand the user that brief alongside the main art
  brief. It is a LAYERED brief (body / head / each arm shoulder-to-fingertip /
  fingers over a prop / prop / dangles, every layer a full-canvas PNG), because
  a single image with the arms against the body is what made three games'
  arms read 「像沒骨頭」 (2026-09-23/24): a pinned hand plus an arm that moves
  can only bow. Hands must be free (no pockets, not on the thigh, not on a
  planted prop) and a hanging forearm >= 48 px off the body at 1024 wide.
  Only STRUCTURE comes from the archetype — never trace, sample or attach
  reference art.
- **The Buy Bonus CTA button in the bet bar is its own asset, separate from
  the Buy Bonus modal's card frames** — brief both in the same pass, not just
  the modal (Capo Nostra's brief covered the cards from day one and the
  bet-bar button only got added weeks later, on request). And before telling
  the user new art for it will just show up once dropped in: check every UI
  skin the game defines, not only the default one — a "platform chrome"
  variant can silently clear the sprite slot that points at it, so a
  perfectly good asset renders as a flat rect regardless. See
  `references/art-brief-template.md` §6 and `references/dead-asset-audit.md`
  for the concrete mechanism.

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
  `references/art-brief-template.md`'s lettering-audit section; the chosen
  style's catalogue entry in `references/art-direction.md` suggests a pairing.
- **Colour.** The shared UI packages default to whatever palette the LAST game
  that touched them shipped with (`components-ui-pixi` in particular carries
  a previous game's hardcoded hex values in several components — bet bar,
  modal chrome, scrollbars). Every one of these needs an explicit override in
  the new game, not an assumption that "it'll pick up the theme somehow." See
  `references/dead-asset-audit.md` for how to find the ones an eyeball pass
  misses (win-line palettes, symbol-land flash colours, splash-panel plate
  colours borrowed wholesale from a different game's own asset).
- **Button icons.** The bet-bar round-button icons have to be thin line icons
  with open gaps, or they blob at 30–48px. This was reported on Capo Nostra and
  then again on Hard Time, whose icons were Capo's old heavy set recoloured.
  Redraw them with the source game's icon drawer instead of recolouring, and
  check the source for a later redraw before copying any asset set. Full rules
  and the script are in `references/art-brief-template.md` §6.
- **Character.** Built via `hacksaw-character-motion`'s `archetype/layered/`
  (check_layered_art → build_layered_rig → layeredFigure.ts → the game's
  motion table from `archetype/motion_table.py` → check_layered_cast), or via
  `mesh-cast-rig` for a single-image figure. It has to actually move — see
  those skills for the motion-table discipline (appendages carry the motion,
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
- **A visible random draw (wheel, dial, pick) must not look computed.**
  Deadwood Express's multiplier wheel first printed its values in ascending
  order and always stopped dead centre on the result — both read as fake.
  Lay the segments out as a fixed scramble with every big value between small
  ones (split the set into lower/upper halves, shuffle each with a seed derived
  from the set so the same set always draws the same dial, alternate them),
  jitter the stop within the segment, and some of the time (~20%) stop near the
  edge next to a much bigger neighbour for a near miss. All of it is
  presentation: the book still decides the value, so math, books and RTP are
  untouched. See `apps/DeadwoodExpress/src/game/wheelState.svelte.ts`.
- **"Is it centred?" is a measurement, not a look.** A label can be centred in
  its own box and the plate art still look off, because a crest or wing on one
  edge moves the plate's writable area off the texture centre. Measure the
  text's ink (pixels of its fill colour inside its bounds) against the plate's
  inner frame (from the PNG's alpha/colour), then correct with
  `buyBonusLabelOffsetX/Y`; the hover highlight has the same problem and takes
  `buyBonusPlateInset` + `buyBonusPlateInsetOffsetY`. On Deadwood the caption
  turned out to be centred to 1 px — the real defects were a highlight lighting
  the whole square canvas and portrait controls running off-screen
  (`references/review-findings.md` §5b). Check portrait before concluding.

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
4. **Every round, check the delivery against the style frame, not against
   memory.** Run `scripts/check_style.py` with §0's palette, accent caps and
   gates on the whole symbol set (royals included — rendered highs next to
   flat low-pay glyphs is two styles on one reel), then go down the
   AI-tells table in `references/art-direction.md` at 180 px and 70 px:
   baked sheen/glow, detail at one even density, airbrushed gradients, fake
   halftone/hatching, generated lettering, nonsense ornament, broken counts,
   mismatched light. Reject and regenerate what fails; post-processing can
   hold a palette but cannot turn a render into the chosen style
   (quantising a render gives a posterised render).
5. Iterate against concrete, stated feedback each round. If a round's
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
The same file also covers portrait controls that run off the screen edge
(§5b) and Deadwood Express's 5/10 "poor UI": controls that stay lit after a
touch tap, and a spin halo that flares on press. Test those on a touch
pointer, not just a mouse.

On top of all of that, run the reskin-specific one neither `game-qa` nor
`stake-compliance` is built to catch: **is anything still the old game's?** See `references/dead-asset-audit.md` for
the concrete greps (old game's name, old palette hex values, symbol rigs still
depicting the old cast, dead asset folders the new game never references) and
the real examples found doing this for Capo Nostra. Do this pass LAST, after
art integration is done, because earlier passes will have false negatives on
anything not wired in yet.

**Audit every player-facing description against the published BOOKS, not the
spec.** A reskin rewrites the mechanic, and the copy gets written from the spec
— which says what was *intended*. Hard Time's copy passed every guard and still
promised four things the game does not do (listed in §9). Every surface that
describes the game, all read together so they cannot disagree:

- loading-screen tips
- the opening intro / INFO card
- the game-rules modal and the pay table
- the feature splash text (`featureTiers.ts` summary + splash)
- the buy-menu labels and descriptions
- the submission description (§9)

For each sentence ask "which book event proves this?", then write a short
script that walks all four `books_*.jsonl.zst` and measures it. Do not trust
`design/check_rules_match_wins.mjs` for this: it is inherited, defaults to the
SOURCE game's bundle path (`upload/HotMiami/math`), and models that game's
mechanic. On Hard Time it reported 6,579 "mismatches", all from Hot Miami's
books.

Also check at normal and smallest supported sizes, and check whatever the
shared bottom-bar menu can overlap (Capo Nostra's Buy Bonus button sat on top
of the paytable/info icons when the menu opened — a shared-component
interaction, not something either game's own code visibly caused).

**Look at the big-win banner with a busy board behind it.** This is the screen a
reviewer stares at, and it is the one place two independently-correct dimming
layers can multiply into something that looks broken: the win volley dims every
cell that is not paying, the banner lays its own scrim over everything, and a
cell at 0.38 under a 0.5 scrim reads as an empty slot. On Capo Nostra it looked
like symbols were *vanishing* under EPIC WIN while the sticky frames on top of
them stayed perfectly visible (frames are a separate overlay and take no dim) —
which sent two rounds of investigation at the frames before anyone looked at the
board layer. See `stake-engine-slot`'s Svelte-5 traps section for the root cause
and the `untrack` fix, and its debugging section for how to measure it.

Set this up deliberately rather than hoping to catch it: force a top-tier feature
book with several sticky frames, freeze the ticker the moment the banner reaches
full opacity, and check every cell has its symbol. A reskin inherits this whole
mechanism unchanged, so if the source game has the bug, yours does too — Turf War
had it byte-for-byte from Capo Nostra.

### 7. Thumbnail

Platform-composited layers (BG/FG/logo), no burned-in title or provider text
per Stake's own convention — see the source game's thumbnail files as the
reference for what "correct" already looks like, since this part rarely
changes shape between reskins.

Treat those layers literally. **FG contains only the main character or single
theme hero cutout.** Do not put the game title, wordmark, provider logo,
decorative typography, scenery, or a full-frame colour field in FG. Provider
art stays in the separate provider-logo file; any platform title treatment
stays outside FG. Export genuine RGBA transparency around the hero — a painted
checkerboard is an opaque RGB image and fails even if it looks transparent in
a preview. Inspect the file mode/alpha channel, not only the thumbnail viewer.

**Do not derive the store BG by simply darkening an in-game night background.**
The tile is reviewed at roughly 200 px, where a scene that looks atmospheric at
1024 px can collapse into a near-black square. Design the thumbnail background
as its own key-art layer with broad, readable value masses. A dark game may use
overcast daylight, practical lights, pale architecture, or another theme-valid
source of exposure; it does not need to reproduce the game's time of day.

Before packaging, measure the final 1024×1024 BG after reducing it to 200×200
using `scripts/check_thumbnail.py <BG> [FG]`. Unless the platform or user gives
a different target, require all three background gates on an 8-bit Rec.709
luminance scale:

- mean luminance at least 80;
- 10th-percentile luminance at least 35;
- pixels below luminance 32 no more than 30%.

Also inspect the BG+FG composite at 200×200. The subject, theme cue, and any
platform title safe area must remain distinct without relying on zoom. A numeric pass does not
replace this visual check; it prevents obviously underexposed tiles from
reaching it. Record the measurements in the art status or handoff.

### 8. Package

See `references/packaging.md` for the exact, repeatable command sequence
(sync math config → frontend build → playtest stub rebuild → three zips) and
the sanity greps that must pass before calling a zip final (no old game name
string anywhere in the shipped frontend, no localhost/stub references, no
playtest-only files in the upload build). Write or update a HANDOFF.md as you
go, not retroactively — it is the only place the exact retarget numbers and
the reasoning behind each scale_factor live, and reconstructing that after
the fact from a diff is much slower than writing two sentences at the time.

**On every restage after the first, do not `rsync --delete` the build over the
staged frontend.** The first pass prunes the source game's leftovers and
compresses the art; the build folder still has both. Replace only `index.html`
and `_app/immutable` — `references/packaging.md` §6 has the commands and the
check that the new bundle references nothing the staging pruned.

### 9. Submission description

When the user asks for "a description for submission" / "送審用的描述" /
"a blurb to introduce this game", produce it in **this exact shape** — it is
what the user wants every time, so don't reinvent the format:

- **Plain text in one copyable fenced block.** No `**bold**`, no `(MG)` /
  `(FG)` / `(BB)` parenthetical tags on the headers — the header word alone.
- **Sectioned, in this order**, each header on its own line with a blank line
  under it: `Base Game` → the standalone signature mechanic if it has one
  (e.g. `The Big Score`) → `Free Spins` → `Buy Bonus` → `RTP & Max Win`.
- **Every number matches the shipped config** — grid size, paylines, each
  multiplier range and cap, spins per tier, scatter counts, retrigger table,
  buy costs, the full RTP spread (base %  → top-mode %, and the spread
  figure), Max Win cap. Pull these from `game_config.py` / the optimizer
  output, not from memory.
- **Every CLAIM is checked against the published books, not just the
  numbers.** The config says what *can* happen; the books say what the player
  actually gets. The description must say the same thing as the in-game copy,
  so run the §6 copy audit first and write this from the corrected copy. Four
  wrong claims Hard Time shipped in-game and in its first description draft
  (2026-09-16), each read straight off the spec or the config:
  1. **"Multipliers on a line add together."** The SDK's
     `multiplier_method="symbol"` skips multipliers of 1, so a ×1 cell adds
     nothing: ×2 + ×1 pays ×2, not ×3. This hit 55–65% of multiplied wins.
     Recompute `meta.multiplier` from the lit/framed cells for every win.
  2. **"Multiplier range 1×–25×"** was the normal ladders' range. The
     `wincap` distribution has its own top-heavy ladder, so 50× and 100×
     really land in max-win rounds. Read ranges off the landing events across
     ALL books, including the capped ones.
  3. **"The tier opens with one Searchlight already lit."** The seed was a
     symbol dropped onto free spin 1, and the frontend ignored `seedLights`.
     Check what the board looks like at feature entry, not what the config
     key is called.
  4. **"The Scatter appears on all five reels."** True for the base strips
     only; the free-game strip had Scatters on reels 3–5, so 4- and 5-Scatter
     retriggers never occurred in 100k books. Check every strip the claim
     covers.
- **Register:** flat and factual, one paragraph per section, present
  tense, no marketing adjectives.
- **Length is a hard limit: ~150–190 words total, always** — whether or not
  the user supplied a reference. The five sections above are the WHOLE
  deliverable: no "Worth noting for review" appendix, no symbol list, no
  social/replay/controls/fonts/turbo notes, no per-mode hit odds, no QA
  claims. Hard Time's first draft (2026-09-15) ran ~900 words with all of
  that and was sent back as "太長，字數像附圖就好". Count words before
  handing it over.

Example (Turf War):

```
Base Game

Turf War is a 5×4 video slot with 14 fixed paylines, built around two core mechanics. Loot Bags land in 1×1, 2×2, or 3×3 sizes carrying a random multiplier (2×–100× on a single position, up to 10× on a 2×2, up to 8× on a 3×3) that applies to every payline crossing them; multiple Bags in one win stack additively. The Bruiser is an expanding Wild that appears on the three middle reels and fills its entire reel with Wilds before wins are evaluated — at most one per spin.

The Big Score

On any spin, in normal play or a feature, the whole grid can become a single 5×–50× Loot Bag.

Free Spins

Three tiers of free spins — Lookout (3 Scatters), Muscle (4 Scatters), and Kingpin (5 Scatters) — each award 10 spins with rising starting Bag counts and stickiness. In Kingpin, every reel a Bruiser fills stays Wild for the rest of the feature. Retriggers add 2/4/6/8 spins for 2/3/4/5 Scatters across all three tiers.

Buy Bonus

Every tier can also be entered directly via Buy Bonus at 100×, 500×, or 1000× the bet.

RTP & Max Win

RTP ranges from 93.58% (base) to 93.78% (Kingpin buy mode), with a spread of 0.20% across all four modes. Max Win is capped at 20,000× total bet in every mode.
```

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

**A fix that measures clean but the user still sees the bug means the probe is
wrong, not the user.** Twice on one bug the reported evidence was "0 dimmed
frames" and twice the user came back with a screenshot of the symptom. The
measurement was honest and the code change was real; the probe was answering a
narrower question than the one being asked (it sampled the sprites it could find
rather than asking each board cell what it had, and it took a `min` over a set
that legitimately contained half-alpha shadow copies). When this happens, do not
re-fix the same theory harder — go and reproduce the user's exact screenshot
first, then build the probe to distinguish the specific states that screenshot
rules in and out. Ask what the evidence CANNOT tell apart.

**When the same symptom survives two fixes, the second cause is usually in a
different layer than the first.** Here the first cause was event ordering (the
banner opened before the board's state was cleared) and the second was framework
reactivity (the ease that cleared it re-armed its own clock every frame). Fixing
ordering harder could never have worked. If two independent-looking attempts both
fail, stop and enumerate every mechanism that can produce the symptom — for
"something is invisible", that is at minimum: not mounted, `visible = false`,
own alpha, an ancestor's alpha, occluded by a sibling drawn later, masked, or
tinted to the background — and rule them out one at a time with a measurement
that can actually separate them.

**"I ported it to the sibling game" is a claim, and the only proof is a grep of
the SIBLING's own built bundle.** A fix agreed as "do both games" was made in
Capo Nostra and reported as done for both; Turf War still had the entire old
five-rung reel-stop pitch ladder, and the user caught it by ear. Editing app A
creates no pressure of any kind on app B — same repo, same file names, same
comments describing the change, and B is untouched. So for every cross-app
change, finish with a single command that would FAIL if the port were missing:

    grep -rn "<the removed identifier>" apps/A/src apps/B/src   # expect: no hits
    grep -o "<the new mapping>" apps/B/build/index.html         # expect: the new value

Run it against the built output, not just `src` — a stale `build/` is how a
correct source change still ships the old behaviour. And when the port also
needs ASSETS (audio files, art), check the sibling's asset directory too: Turf
War's code was ported while `win_tier_*.wav` existed only under Capo Nostra, so
the reskin would have shipped code referring to sounds it did not have.

**The image model's default is not a style.** A prompt that names a theme and
objects but no medium gets the same glossy semi-real render every time — it is
why Capo Nostra, Turf War, Hard Time, Deadwood Express and Soul Seal's symbol
sets are interchangeable side by side. Every prompt carries §0's technique
block (how ink goes down, how shading is made, how many inks), and the style
is chosen with the user, not inherited from the source game or from the model.

**Nothing is inherited by default — everything is inherited unless replaced.**
The scaffold step copies the OLD game byte-for-byte. Every subsequent phase's
job is to find and replace what belongs to the old theme; nothing about the
copy self-identifies as "still old" — nothing highlights the leftover
`flamingo.png` reference or the palette hex value nobody re-themed. Treat "did
I actually touch this" as the default assumption to doubt, not the exception.
