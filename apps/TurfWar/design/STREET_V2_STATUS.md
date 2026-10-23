# Turf War v2 implementation — 2026-10-15

Implementation source: `ART_BRIEF.md` v2, which records the style-frame approval.
This supersedes the earlier six-sample-only handoff. No additional style approval
is required for this implementation.

## Implemented

- All 12 symbol slots use street art: four approved style-frame sprites plus
  eight new generated deliveries. Own game references only; built-in imagegen.
- H2 cyan city, H3 acid-green notes, H4 magenta bottle, H5 monochrome lowrider,
  cyan/magenta boombox; L2–L4 grey marker outlines. H4's initial orange delivery
  was corrected; H3's excess variation is reduced in the repeatable processor.
- Base alley, feature warehouse boxing venue, and Kingpin rooftop line drawings.
  No depth-of-field blur, vignette, ambient beams or floating bokeh.
- Program-owned sticker housing, UI plates, menu/card frames, controls, counters,
  signs and win plaques. Live Bungee wordmarks/titles; Permanent Marker Bag
  multipliers; Oswald figures retained for readable balance and stake values.
- Flat numerals and keylines; runtime WILD text. Removed the low-pay embossed
  shadow/rim stack. Low pays redraw their ink; premium symbols lift a paper corner.
- Paper landing slap plus distinct object reactions. Lightning, skull, bottle,
  lowrider, boombox and knuckles retain separate motion shapes.
- Bruiser spray-can conversion front and red paint drips; Kingpin held Wilds
  marked by crossed red tape. Scatter-preservation logic is unchanged.
- Four-strip tape reveal for Bags; four-side Big Score charge and multiplier drop.
- Win plaques stamp into a stack; live amount remains in a separate foreground
  sibling. This explicitly fixes late-mounted plaques covering the amount.
- Sticker-covered shutter drops, locks, then kicks apart. Transition resolver
  is armed before mounting, with a 3-second ceiling.
- Both existing character rigs remain animated and distinct across MG/FG;
  their exact layer alpha and mesh bindings are preserved by the interim recolour.

## Explicit transitional assets

The brief authorises grey sticker conversions until new deliveries arrive.
These remain **transitional**, not final street character art:

- MG/FG character layers: original figures in posterised grey, unchanged alpha.
- Bag artwork: program tape frames; bag/duffel/garbage-bag corner illustrations
  are still awaiting batch 2.
- Shutter and lock: program-owned flat treatment using approved own-game stickers;
  batch 3's illustrated variants may replace them later.
- Background near layers: transparent until each new scene is separated into
  real foreground elements. No false parallax crop or duplicated buildings.
- Thumbnail and cover: a new square background exists in street_batch3, but final
  foreground composites depend on the full-body street characters from batch 4.

These limitations are not a claim of a finished reskin or platform submission.

## Reproduce

From the app directory, with `/Applications/anaconda3/envs/math-sdk/bin/python`:

```sh
python design/build_street_batch.py street_batch1 --check
python design/build_street_batch.py street_batch3 --check
python design/install_street_skin.py
/Users/stone/Library/pnpm/pnpm --dir /Users/stone/stake-engine/wp/apps/TurfWar build
python design/stage_street_playtest.py
```

The workstation's installed pnpm 10.5 works; the Codex fallback pnpm tries to
auto-install the entire workspace and aborts without a TTY. No dependency purge
or repository-wide install was performed.

Originals: `design/_legacy_assets/pre_street_v2/` (once-only backups).
Delivery/install status: `design/street-install-status.json`.
Generation prompts/reference rules: `design/_street/generation-prompts.json`.
Generated originals: `design/_incoming/street_batch1/`, `street_batch3/`.
Processed art: `design/_street/`.
The square brand background is also delivered at the brief's canonical
`design/_incoming/street_brand/` and `design/_street/street_brand/` paths.

## Validation notes

- All first-batch premiums/scatter meet colors95 ≤80 and soft share ≤38%;
  low pays meet colors95 ≤14 and chroma ≤4. Reviewed at 70px and in greyscale.
- The symbol-weight check now composites alpha over the actual #3A3D42 board.
  Its v2 graphic-contrast floor is 3:1, matching the approved grey line palette;
  the previous 5:1 floor was defined on the much darker old #17191C ground.
  Runtime low-pay ratios are 0.80 so the new larger outlines stay subordinate.
- Motion checker remains active with its 0.9 pair-distance threshold. Twelve
  land and win traces pass. No similarity check was disabled to hide duplicates.
- Review-tag checker: 0 FAIL, 24 WARN. The flat-fill plate/title/UI warnings are
  intentional per v2's program graphics; character warnings stay open until the
  layered street deliveries replace the interim grey art.
- Main build runs the complete app guard chain. The inherited missing PUBLIC_*
  build exports and runtime-manifest URL warning remain unrelated to this restyle.
- Live QA additionally found and fixed late-mounted plaques covering the amount,
  dead Pixi Graphics contexts after dynamic mask removal (both ink redraw and
  tape entry now avoid masks), and undersized mobile copy. Phone opening text
  measures 11px without stage shrinking; portrait FG card uses 86% layout width.
- 1280×720 local tests: BASE book 1 expands all four W cells; synthetic 20×
  Big Score, 2×2 Bag and MEGA banner render. The MEGA amount remains visible as
  $500.00 after the complete stack. BASE 11 Lookout retriggers to 12 spins and
  returns with $22.00; BASE 29 Muscle returns with $259.90.
- After the mask fix, 390×844 BASE 50 Kingpin completed and returned to MG with
  $7,083.10 total, matching the fixture. Portrait controls remained visible;
  console errors since that fresh reload: zero. Earlier failed-run logs are
  historical and must not be counted as the fixed run.
- The previously failing desktop BASE 29 Muscle path was repeated after the
  mask fix through all 10 spins, reaching the same $259.90 with no new console
  errors. This is the regression case for the destroyed-context failure.
- The animated coin atlas also uses the flat sticker coin; changing coin.png
  alone did not change the atlas consumed by WinCoins. Its 12 frames keep the
  original JSON coordinates/dimensions. Final atlas was copied into build and
  local QA after generation, followed by asset-reference and export checks.

Local QA URL:
`http://127.0.0.1:4231/turfwar-street-v2/qa.html`

This uses a local fake wallet and published books, never a platform session.
QA toolbar, fixture scripts and error collector are confined to `dist/`.
The earlier iframe-only MutationObserver console error has no matching captured
application exception; keep that browser-harness noise separate in the QA record.

No math, upload staging folder or platform version was changed by this work.
# 2026-10-16 follow-up

The pending cast, Bag corners, foregrounds and branding below have since been
implemented. Current scope and verification: `STREET_REMAINING_STATUS.md`.
The original v2 implementation record follows unchanged.

