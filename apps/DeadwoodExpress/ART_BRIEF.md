# Deadwood Express art brief — first pass

## Visual identity

A haunted steam train crossing dead woodland at midnight. Charcoal iron #172022, tarnished brass #B89352, ivory #E6D9B8, spectral teal #78D9CF. Keep important shapes readable on dark backgrounds; avoid uniformly black scenes. Display lettering should evoke engraved railway nameplates, with a simpler highly legible face for amounts.

## One character

One spectral conductor, waistcoat and long coat, holding a ticket punch, with a freely hanging scarf. Full-body transparent PNG, standing in the actual side-band pose. Leave at least a mesh cell of clear space between each arm and torso and at least 24px between hand and thigh on a 512px-wide sheet. Allow >=4% margins. Do not reuse Hot Miami's character rigs: build and measure the rig for this drawing. Hide the character at portrait widths that cannot fit a usable side band.

## Symbols

W: spectral locomotive front. S: punched railway ticket. H1: conductor's pocket watch; H2: ornate brass lantern; H3: iron locomotive bell; H4: railway signal; H5: conductor's cap. Low symbols: simplified engraved A/K/Q/J plaques. Distinguish high symbols by silhouette and material, not recoloring one shape. Low symbols must not exceed the highs' bright-area coverage and contrast. Verify at actual reel size and in greyscale. No Collector and no gold-frame mechanic artwork.

## Multiplier wheel

Use the user's image for the half-circle composition only. Build an aged-brass pressure wheel with radial numbered wedges, a fixed top pointer, a readable selected wedge and a central held-multiplier display. Runtime text supplies numbers so the eligible ladder can change. A losing spin leaves the compact held-value gauge visible. A winning FG spin reveals the larger wheel, resolves the recorded result, then presents multiplied wins. Never imply a client-side random draw or misleading equal probabilities from ornamental wedge sizes.

Standard/premium variants share geometry. Midnight Passage uses brass and subdued teal; Phantom Express uses luminous teal details and stronger steam/pressure accents. Numbers in both variants extend to 200x; premium numbers are all multiples of five.

## Housing, scenes and transitions

Board housing resembles a locomotive cabin window with restrained corner brackets and transparent center. Prepare base woodland-station, standard haunted railway, and premium spectral tunnel backgrounds. The transition is a tunnel blackout with steam sweeping across the board, timed to hide its state change. Remove the source car motif.

## UI assets

Separate assets for the persistent Buy Bonus CTA plate and the two bonus-menu cards. Provide 9-slice insets for stretchable modal borders. Measure the source component's actual dimensions before final export. Thin round-button line icons: strokes 7–8% of canvas, gaps >=one stroke, no glow, all ink within 0.78 of the half-canvas. Check 36px previews. Theme every active UI skin and runtime text surface, including inherited generic modals.

## Thumbnail

Separate 1024x1024 BG, transparent hero-only FG, and provider logo. No title baked into FG. The store BG should have readable broad value masses, potentially foggy daylight rather than the in-game night exposure. At 200px, target mean luminance >=80, tenth percentile >=35, and <=30% of pixels below 32. Inspect the composite as well as the numeric checks.

## Delivery checks

Measure final board ink bounds and side-band space before asset generation. Keep source layers. Review all symbols at reel size, icons at 36px, and the store composite at 200px. Final art has not yet been generated or integrated.
