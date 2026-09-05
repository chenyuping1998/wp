# Art brief template

An art brief for a reskin is not a flat asset list — a flat list produces
"draw me a wolf instead of a flamingo" reskins, where the shape of the game is
still the old one wearing new paint. Structure it around the RULES that produce
correct art, with the asset list falling out of each rule, because the rules
are what a second or third round of generated art actually needs to follow.

Sections that earned their place doing this for Capo Nostra:

## 1. Character

- Pose and cropping against the actual layout math (how much of the side band
  it needs to fill at the reference viewport — measure the source game's own
  proportions if there's a design reference, don't guess a percentage).
- **Explicit arm/torso clearance** if the character will be animated with
  `mesh-cast-rig`: a tight, arms-at-sides pose does not give the mesh weights
  anywhere to draw the line between "arm" and "torso", and at animation scale
  the hands visibly drag into the jacket. State the minimum gap in the brief
  rather than discovering it after rigging.
- One identity, matching the new theme's own logic for how many cast members
  make sense — don't default to the source game's cast count.

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

- [ ] Three random symbols still identifiable shrunk to reel-cell size
- [ ] Whole symbol set desaturated to greyscale still shows a luminance
      ladder matching pay order
- [ ] Low-pay coverage/bright-area ≤ high-pay's minimum (see §2)
- [ ] No hue from the OLD theme survives anywhere in the shipped set
- [ ] Store tile/thumbnail reads as the new theme shrunk to ~200px
- [ ] `pnpm run build` green including any bespoke asset-consistency guards
- [ ] Played through at least once per feature tier with the final art
