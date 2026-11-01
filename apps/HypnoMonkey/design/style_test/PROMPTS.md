# Built-in image_gen prompts / 2026-10-26

需求來源：`../STYLE_TEST_SCREENPRINT.md`。本批是七件風格打樣，未整合為 production assets。

## Common generation instructions

Use case stylized-concept. Single asset for Hypno Monkey, vintage 1930s circus screenprint poster illustration. Flat spot inks only: red #D2322D blue #24508C mustard #E3A82B fur brown #8C5A3C black #1B1716 cream #F2E6CC; maximum 4 spot colors plus black per image, two flat values per form, thick even 12px outer black outlines, inner details >=6px at 1024px. Bold simplified shapes, smallest shapes >=26px. Top left light as flat shapes. NO text numbers letters logos watermarks. NO gradients 3D realistic fur gloss metallic sheen glow airbrush paper texture grain halftone dots or misregistration; code adds print texture later. Square 1024x1024 solid pure green #00FF00 background, centered 8% margins, except the landscape backdrop.

## Subjects

1. Tall black magician top hat in three-quarter view, clean simple curves, cream light band left of crown, wide circus red hat band, one mustard star pinned to band, fan of mustard and cream sunburst rays behind hat. Center, 80% frame, 8% clean margin. Bold readable silhouette at 70px.
2. A single front-facing blue circus admission ticket stub, scalloped torn left and right edges, large mustard five point star center, thin cream inner border. Object fills 70%, low paying symbol, restrained cream area.
3. A hypnosis disc on a short brown wooden handle, front facing. Bold hypnotic violet #9B3DF5 and cream spiral, only 3 turns. Thick black rim and short mustard rays around disc. Object fills 80%. Violet only on spiral.
4. A front facing golden pocket watch on a short chain, mustard case with simple stepped rim. Blank cream face, no numbers, no hands. Thin violet #9B3DF5 spiral ring just inside rim, short violet rays outside. Center must remain empty and clear to overlay multiplier numbers in code. Object fills 75%.
5. Override square and green background: wide 16:9 1920x1080 full bleed landscape daytime outside a circus big top. Red and cream striped tent, blue pennant flags, bunting strings, a few round balloons, ticket booth LEFT, small crowd flat silhouettes. Bright cream sky with large simple flat clouds. Center kept calm empty for a game board overlay. No borders, text or lettering anywhere. No purple.
6. Head and shoulders cartoon monkey stage hypnotist male. Brown fur face cream muzzle, tall black top hat, round black sunglasses pushed down nose revealing hypnotic violet #9B3DF5 spiral eyes, thin curled black moustache, black tailcoat lapels and red bow tie, confident grin. Three-quarter facing LEFT. Flat shapes not individual hairs. Violet only in eyes. Clean connected anatomy.
7. Head and shoulders cartoon monkey stage assistant female. Brown fur cream muzzle, short bob darker brown, small mustard feather headband, circus red sequin stage costume represented by flat red and a few cream dots. Holds a mustard pocket watch on a short chain beside her face, cheeky wink, three-quarter facing RIGHT. Hand attached to natural continuous arm and wrist, no fragments or disconnected parts. No purple.

## Targeted image_gen edits

Ticket: Edit this ticket symbol. Remove the entire monkey face and BOTH small cream stars. The center must be ONLY one solid mustard yellow five pointed star, all its interior uninterrupted flat yellow. Keep blue rectangular ticket, cream inner border, scalloped sides, thick black outlines, exact composition. Make all ink colors perfectly flat with NO gradients, no texture. Make ticket 70% of canvas width centered, 15% pure green margin both sides. No faces, eyes, animals, lettering or numbers anywhere.

Male portrait: Edit this same monkey portrait with exactly this character identity, expression, attire, sunglasses and palette. Reframe it with the WHOLE top hat visible and at least 8 percent pure green margin ABOVE the complete top hat and beside both ears. Head-and-shoulders crop is allowed at bottom only. Make colors absolutely flat screenprint ink shapes: black #1B1716 cream #F2E6CC brown #8C5A3C red #D2322D, violet #9B3DF5 only in eye spirals. No gradients or shiny metallic sheen anywhere. Maintain thick clean black outline. 3/4 face left. No text.

Actual generated dimensions are preserved rather than claimed to be the requested dimensions. Fixed palette and green-screen key are in `../build_hypno_style_review.py`; generated originals are never overwritten by that script. Print texture has not been applied in this first review, so edge and silhouette problems remain visible.
