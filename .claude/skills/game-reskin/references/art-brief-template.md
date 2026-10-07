# Art brief template

An art brief for a reskin is not a flat asset list — a flat list produces
"draw me a wolf instead of a flamingo" reskins, where the shape of the game is
still the old one wearing new paint. Structure it around the RULES that produce
correct art, with the asset list falling out of each rule, because the rules
are what a second or third round of generated art actually needs to follow.

Sections that earned their place doing this for Capo Nostra:

## 0. Art direction (the style lock) — every other section inherits this

Filled in AFTER the user picked a style and approved a style frame
(`art-direction.md`'s procedure), BEFORE any other section's prompts are
written. Without it every prompt names only objects and moods, and the image
model fills the gap with its own default look — the one five of this repo's
games already share.

- **Style + why, in two lines** — the chosen catalogue entry, the theme's
  native medium it comes from, and the colour strategy the user chose.
- **Technique rules as numbers**, not adjectives: contour weight (% of canvas
  side, ≥ 2%), interior-line ratio, shading method (two-tone cel / black
  spot-shadows / hatching / halftone layer / wash), value count per form,
  texture minimums (hatch gap ≥ 3.5%, halftone pitch ≥ 4%), detail budget
  ("detail only in the focal third").
- **Palette** — hex list with a role and an **area cap** per colour, and the
  reserved accent (one mechanic owns it; nothing else may use it).
- **Value plan** — who gets saturation and outlines, in order: specials
  (brightest, or the only colour), high pays (full colour), low pays (dark,
  desaturated or outline-only, drawn in the world's own medium: graffiti tags,
  carved stone, theme letters set from a font), background (no outline,
  chroma below the symbols'). This is how Hacksaw's 2D titles carry pay
  hierarchy and board-first readability (`hacksaw-style-atlas.md` rules 2–4);
  §2's measured-luminance rule then checks it. For a textured or painted
  style, a flat colour card behind each high pay can carry the hue instead,
  so the portrait keeps its texture (Nolimit City's mugshot cards:
  `nolimit-city-styles.md`, What transfers, rule 2).
- **The style block** — the English prompt paragraph pasted in front of EVERY
  prompt in this brief and in `design/cast_brief/README.md`, plus the style's
  own negatives and the shared negatives list.
- **What code does, not the model** — lettering (fonts / type plates),
  halftone/grain/misregistration (one pitch, angle and file for the set),
  glow/FX, palette quantisation (at 2×, then downscale, so edges keep their
  anti-aliasing). State which script does each.
- Keep this section's heading as `## 0…`: `archetype/brief.py --style`
  extracts exactly that section into the cast brief.
- **Keying colour** — chosen from outside the palette (never white/grey for a
  paper-white or black-and-white style).
- **Style frame** — path to the approved image(s), and its measured
  `check_style.py` numbers (`colors95`, `soft`, `chroma`, `fit`, accent
  shares) with the gates derived from them. Future rounds are judged against
  these, not against anyone's memory of the look.
- **Fonts** — title / body / numbers, from the style's catalogue entry,
  glyph coverage checked for every shipped language.

## 1. Character

- Pose and cropping against the actual layout math (how much of the side band
  it needs to fill at the reference viewport — measure the source game's own
  proportions if there's a design reference, don't guess a percentage).
- **Explicit arm/torso clearance** if the character will be animated with
  `mesh-cast-rig`: a tight, arms-at-sides pose does not give the mesh weights
  anywhere to draw the line between "arm" and "torso", and at animation scale
  the hands visibly drag into the jacket. State the minimum gap in the brief
  rather than discovering it after rigging.
- **Two characters: §1a MG figure, §1b FG figure.** Two different people, not
  one person relit. For each one: who they are in the theme, the archetype
  picked, the cast brief path (`design/cast_brief/mg/`, `design/cast_brief/fg/`),
  and the per-FG-tier lighting variants if any. Then one line on how the pair
  contrasts (build, gender, age or one colour) and one line confirming both
  share §0, light direction, feet line and head height. Neither may be a
  pay-symbol portrait.

## 2. Symbols

- **Differentiate by shape/material/silhouette, not by hue**, if the theme's
  premise (unlike a rainbow neon theme) puts every symbol in one narrow colour
  family. State this explicitly — "these five are all gold-and-brown, so tell
  them apart by silhouette" — because without it, generated art defaults to
  colour-coding and becomes indistinguishable once the palette is unified.
- A quantifiable visual-weight rule beats an eyeballed one: **low-pay symbols'
  measured luminance/contrast must not exceed high-pay symbols' minimum.**
  Measure visible-pixel coverage and bright-area percentage per symbol at
  delivered resolution; if a low-pay symbol's numbers beat every high-pay
  symbol's, the visual hierarchy is inverted regardless of how it looks
  glanced at. Write the actual measured numbers into the brief once a
  version passes, so future regenerations have a target, not just a rule.
- List which symbols reuse or are pre-scaled from an existing asset, if any
  (saves a redraw), and call out anything that must NOT reuse the source
  game's shape (a symbol whose silhouette IS the source game's mascot, say).

## 3. Frames / win-indicator housing

- Every SIZE variant the mechanic uses (a reskin that adds e.g. multi-cell
  frames needs each size, not just the 1x1 the source game had).
- **Opacity/coverage target stated as a number**, not "make it subtle" — a
  frame delivered as a near-solid plaque will hide the symbol underneath it,
  and "soften this" without a target number tends to either barely move or
  overshoot to nearly nothing. State a floor and ceiling (e.g. "opaque band at
  the edge stays near-solid, the inner ramp drops toward transparent, floor
  around 60-70% peak opacity").

## 4. Board housing / frame art

- Name the object the housing is, from the game's world (a trailer, prison
  bars, a mine-shaft timber, cardboard and duct tape, a coffin in dirt), not
  "an ornate frame". An ornamental gold bezel is the default look's frame
  (`nolimit-city-styles.md`, What transfers, rule 1).

- The housing's own alpha bounding box vs its nominal canvas size, if
  anything downstream measures against it (character placement, board-edge
  math) — note the actual ink fraction so that math isn't done against a
  wrong assumption.

## 5. Transitions / set-piece beats

- Derive the beat from the NEW theme's own imagery, not the source game's.
  State what the beat needs to accomplish mechanically (hide a board swap,
  read as an escalation, whatever the source game's version did) separately
  from what it should look like, so a re-derivation for the new theme can
  satisfy the same mechanical job with different content.
- If the beat needs art with a specific seam requirement (two halves meeting
  edge-to-edge with no baked-in shadow, because the code draws its own seam
  shadow), say so explicitly — a shadow baked into the art doubles up badly
  with a code-drawn one.

## 6. UI chrome (buy-bonus card, modal frames, etc.)

- 9-slice requirements if the frame needs to stretch to arbitrary
  panel sizes — state the border insets the asset needs to support that.
- Explicit statement that shared/inherited UI (any modal that doesn't get its
  own bespoke skin — settings, generic popups) still needs the new theme's
  colour tokens even though no art asset covers it; this is a code-side
  follow-up but belongs in the brief so it isn't forgotten as "not art's job."
- **The persistent Buy Bonus CTA button (the one always sitting in the bet
  bar) is a SEPARATE asset from the Buy Bonus modal's card frames, and it is
  easy to brief one and forget the other.** Capo Nostra's art brief covered
  the modal cards from day one and didn't add the bet-bar button's own plate
  until a user asked for it explicitly, weeks later. State both in one pass:
  the modal card frame (see the 9-slice note above) AND the standalone bet-bar
  button plate (a single non-stretched image, sized to the shared component's
  box — check `ButtonBuyBonus.svelte`/its equivalent for the actual pixel
  size rather than guessing).
- **Before assuming new art for that button will actually render, check
  whether the active UI skin is suppressing the sprite slot.** A shared
  `ButtonBuyBonus`-style component commonly falls back from custom plate art
  to a flat drawn rectangle when its sprite-registry key is undefined for the
  ACTIVE skin — and a game can ship more than one skin (a "platform chrome"
  variant that intentionally clears most of `sprites` to keep a flat, neutral
  bet bar, alongside the game's own fully-themed skin). Grep every skin
  variant's sprite map for the button's key, not just the default one's
  source file, before telling the user "just drop the file in and it'll
  show." See `dead-asset-audit.md`'s note on skin-level overrides for the
  concrete case this came from.
- **Round-button icons (menu / paytable / info / settings / sound / autoplay /
  +/−) must be THIN line icons, and this is the rule most likely to be lost by
  recolouring.** They render at ~30–48px inside a plate's dark recess, so heavy
  strokes, pill-shaped fills that touch, solid glyphs with no holes, and a soft
  glow all collapse into blobs: paytable's rows fused into one slab, menu's
  three bars into a block, settings into a solid flower. It hit Capo Nostra
  (redrawn 2026-09-14) and then Hard Time a day later, because Hard Time's set
  was made by recolouring Capo's icons to steel — from the PRE-redraw copy.
  Brief them with numbers, not "clean icons":
  - stroke ≈ 7–8% of the canvas, every gap at least one stroke wide;
  - holes stay open (settings has a punched hub, info a separate dot);
  - a thin dark edge (~2% each side) for contrast on the dark recess, no glow;
  - all ink within 0.78 of the half-canvas, so the `buttonIconScale` 0.70
    fallback lands every mark at ~0.48–0.53 of the button radius. MEASURE the
    new plate's recess edge (walk a row of `button_plate.png` from the centre
    until luminance jumps) — Capo's ends at 0.64, Hard Time's at 0.74 — and
    keep the ink inside it;
  - autoSpin: override `uiTheme.iconScales.autoSpin = 0.7` — UiButton's own
    0.82 default makes its arrow both oversized and heavier than its neighbours.

  Don't wait for art for these: they are pure geometry. Copy the source
  game's drawer (`CapoNostra/design/generate_capo_ui_icons.py`, ported as
  `HardTime/design/generate_hard_time_ui_icons.py`), point `APP`, the plate
  path and a LEGACY folder at the new game, and sample the icon colour from
  the backed-up old file — never from the shipped folder, or a second run
  samples its own output. It prints each icon's ink radius and writes an
  old-vs-new preview on the real plate at 64px and 36px; look at the 36px row.
  Spin (drawn by `ButtonBetSpinIcon`) and turbo (a vector bolt) are not
  sprites and are not covered by it.
  **On any reskin, before recolouring an inherited asset set, check whether
  the source game has since redrawn it** (look for a `generate_*` script or a
  `_legacy_assets/` copy in the source's `design/`) — recolouring takes the
  geometry you copied at scaffold time, not the source's current geometry.

## 7. Backgrounds (per mode/tier if the source game varies them)

- One per mode/tier the mechanic actually uses; name them by what they need
  to communicate (base vs. each feature tier) rather than assuming the source
  game's tier count.

## 8. Lettering vs. system-font audit

Every piece of ART that shows lettering (plaques, banners, logo, tier-title
images) and every piece of RUNTIME text (paytable, rules, HUD numbers, buy
menu) needs to agree on typeface language. Run this as an explicit audit, not
an assumption:

- List every drawn-lettering asset and the font/style it uses.
- List every runtime text surface and confirm its CSS/Pixi font matches (or
  deliberately doesn't, for numbers — see SKILL.md's fonts note on why
  numbers are the one exception).
- Flag anything still defaulting to a shared-component's built-in font, since
  that's usually the source game's or template's own choice, not the new
  theme's.

## 9. Verification checklist (fill in once art lands)

- [ ] Whole symbol set (royals, Wild, Scatter included) inside the style
      frame's `check_style.py` gates (§0) — one style on the reel, not two
- [ ] AI-tells table (`art-direction.md`) walked at 180 px and 70 px: no baked
      sheen/glow, no generated lettering, no fake halftone/hatching, no
      nonsense ornament, counts correct, one light direction
- [ ] Cast figure, UI chrome, FX colours and thumbnail carry §0 too, not just
      the symbols
- [ ] Three random symbols still identifiable shrunk to reel-cell size
- [ ] Whole symbol set desaturated to greyscale still shows a luminance
      ladder matching pay order
- [ ] Low-pay coverage/bright-area ≤ high-pay's minimum (see §2)
- [ ] No hue from the OLD theme survives anywhere in the shipped set
- [ ] Bet-bar round-button icons composited on the real plate at 36px: every
      paytable row, menu bar and settings hole still separate (§6)
- [ ] Store tile/thumbnail reads as the new theme shrunk to ~200px
- [ ] `pnpm run build` green including any bespoke asset-consistency guards
- [ ] Played through at least once per feature tier with the final art
