# Pickle Panic A–E production prompt set — 2026-10-17

Generation method: built-in imagegen. This is the reproducible, condensed production prompt set; individual calls and revision wording remain in the task history. `generated.json` records selected generation paths; all selected original outputs are retained in `raw/`. `before/` preserves the input artwork. References were only this game's own assets. No competitor art was supplied.

## Shared direction

Original rough American underground sci-fi comic, fat uneven brush-ink outer contours about twice interior stroke, broad asymmetric black spot shadows, flat two-tone colors, sparse purposeful dry-brush corner breaks. No 3D, gradients, glossy highlights, glow, uniform grain, smooth vector outlines, dense small scratches, watermark or baked UI lettering. Foreground palette: pickle/olive greens, cream paper, mustard and tomato red; background: cold lilac, ice blue, gray-purple, dark plum. Actual RGBA transparency for cutouts. Keep original canvas aspect ratio, placement and animation registration.

## A — layered H4

Create one four-part 2x2 sprite sheet: upper left COMPLETE EMPTY red-and-cream checked paper food boat; other three cells each ONE parallel, blunt-cut cucumber spear with cut flesh facing viewer and three large cream seeds. Parts are independent alpha layers that composite into three parallel edible batons lying in a wide food boat. No fan, pointed leaf or radial silhouette. Each part remains inside its own quadrant with clear margins. Flat muted olive flesh #A2AD49, green skin #6A9F35, dark olive #31572C, cream #FFF0CF, red #C84A36, ink #20231D. Apply the existing H3's irregular brush pen linework and large shadow wedges to the initially too-clean sheet, preserving color blocks and four objects. No dense texture or gradients.

`apply_review_1017_ae.mjs` crops connected parts without repainting and registers them into 512². Complete boat underlies every spear; three spear layers retain independent runtime movement.

## B — female chef vest

Edit only the female pickle chef's exposed torso: tomato-red #C84A36 high-neck sleeveless chef vest with thin cream #FFF0CF binding at neck/armholes; loose modest cloth front, simple angular black folds, no anatomical chest curves. Preserve face, grin, headscarf, bare green arms/hands, legs, shoes, pose, scale, waist apron and knot. No sleeves because the existing arms animate separately. Preserve transparent background, original silhouette and registration. Torso-only edit must not invent a head or arms; cut-in edit must preserve its absent moving arm; MAX sign edit preserves the left male and blank sign; cover edit preserves the male and the empty left/top overlay areas.

Applied separately to torso crop, buy card, cut-in body, MAX sign and cover FG. Technical exporter restores original torso alpha, preserves apron region, patches only its existing atlas rectangle, and recomposes the legacy flattened cut-in from its actual three layers. No skeleton or motion data changed.

## C — doors

Edit each door half using the original background as style reference: muted gray-purple #8583B5 with dark-plum #514567 flat shadows, uneven fat brush contours, skewed spot-black wedges, irregular rivets, hand-painted mustard #E9B83E/ink hazard stripes with unequal widths and chipped corners. Preserve panel silhouettes, straight seam edges, porthole layout and original canvas proportions. No wheel, badge, steam or latch baked onto panels.

Create one four-part hardware sheet: six-spoke wheel; horizontal locking bolt; black/olive brine porthole with cream bubbles; cast-iron medallion with large olive pickle relief, dark-plum backing, narrow mustard rim and a ring of eight irregular cream rivets. Keep hardware flat and hand-inked. Medallion fills 22% of the runtime door height and clears the latch. Lintel is a separate thin horizontal irregular mustard/ink hazard strip, with purple steel rim and sparse crooked rivets.

Steam sheet: 3x2 frames, small rising puff → spreading puff → peak spray → split curls → detached wisps → tiny wisps. Flat cream interiors, thick uneven dark ink contours, sparse dry brush breaks; true alpha and no haze outside contours. The selected initial sheet's apparent dark preview background has zero alpha; its transparent pixels were preserved.

## D — window frame

Edit original frame into an enamel serving window: muted dark olive #596044 / dark plum #514567 enamel, narrow mustard trim, narrow cream inner lip, four irregular steel rivets and small bottom ledge. Only one or two enamel chips per edge; no broad bright-yellow casing or dense diagonal cracks. Preserve original outside bounds, corner centers, opening and insets. Export uses the original alpha channel at every pixel. Board backing fills only the opening rather than an opaque square outside the casing.

## E — backgrounds

Edit the same 1920×1080 MG/FG scenes. Add low-contrast panel seams/rivets, small menu poster and optional clock to the rightmost pale blue wall; keep this quiet and bright behind the green cast. No green/yellow props there. Lift FG purple shadows one shade while retaining black ink. Preserve all left-side machinery, brine shapes and composition. Final pass: lighten only new right-wall details until their luminance is within 8% of surrounding ice blue, approximately #AACBD9 on #BBD8E5; preserve original dark wall boundary, overhead pipes and floor junction. Rebuild background motion cutouts/masks against the final exported plates.

## Verification

Run the exporter, background FX builder, `audit_review_1017_ae.py`, cast-underlay check, style meter and production build. Palette measurement includes both the approved production palette documented in `production_art_manifest.json` and the brief's palette. New H4 passes colors95/soft/fit using those existing colors. See `design/qa/review_1017_ae/` for numeric evidence and browser views. The brief's independent three-person 70px recognition survey remains a human check.
