# Boomana → Alchemist v3 prompts

Mode: built-in `image_gen`, transparent background requested for all outputs.
All generation results used by the project are copied into this directory.
The generator supplies bitmap illustration; Node scripts only crop, resample,
pack, composite and bind these painted parts to the inherited skeleton.

## 1. `painted_body_atlas.png`

Edit target: `boom_body_atlas.png`. Costume reference: `../alchemist_mascot_v1.png`.

Use case: precise-object-edit. Production 2D skeletal character texture atlas reskin. Image 1 is the EDIT TARGET, a 1024 x 1161 texture atlas of separated gorilla body parts; image 2 is ONLY the alchemist costume/style reference. Output ONE transparent RGBA atlas with EXACT same canvas aspect, all pieces in the exact same positions, size, orientation, boundary, empty gaps and ordering as Image 1. DO NOT assemble a character, rearrange pieces, add labels, or add background. Repaint the existing clothing to the alchemist costume of Image 2: upper left torso becomes dark teal tailored alchemist coat with brass edging, ivory shirt middle, leather belt, green vial accents; center triangular neck band becomes dark teal/brass standing coat collar, maintaining its existing shape; separate upper-arm sleeves become matching teal with ivory rolled cuffs; lower two thigh pieces and the long thin sleeve-looking piece become dark teal fabric; knee/shin pieces become teal fabric with brown leather guards; two separate boots become rich brown leather with brass lace hooks. Preserve all existing gorilla furry forearms, fists, ears, jaw, banana, hair silhouettes as they are, matching their existing positions precisely. The helmet region at lower right (original x687 y719 width236 height177 relative to Image1) must become the gorilla's furred crown with a pair of brass-rimmed green alchemist goggles ON THE FOREHEAD, with visible alert brown eyes under them, no mining helmet, no lamp, no glow. This head-top part must still meet the separate face below exactly at its existing bottom boundary. Preserve clean fully transparent background. Hand-painted professional slot illustration, coherent matte materials, precise brass edges, directional fur strokes, controlled highlights, not glossy plastic. No extra limbs, no distortions. The exact atlas layout is a hard technical constraint; change only costume surface art and headgear. Transparent background.

Atlas islands were individually fitted back to the original trim rectangles after inspection. Original furry arms/fists and several face accessories are preserved from Boomana rather than taking altered silhouettes from this sheet.

## 2. `head_blink_sheet.png`

Edit target: first assembly of the new atlas; style reference: `../alchemist_mascot_v1.png`.

Use case: precise-object-edit. Create ONE transparent 2-frame skeletal head texture sheet for this reskinned Boomana gorilla, two equal square cells side by side. Both cells contain the SAME full detached gorilla head only: fur crown, forehead brass green-lens goggles, ears, expressive eyes, muzzle, closed mouth, chin and mane. No neck, no collar, no shoulders, NO banana (banana is a separate bone attachment). First cell eyes OPEN and stern. Second cell identical pixel-perfect silhouette, pose, perspective, size, and every detail except eyes FULLY CLOSED for a blink. Each head fully inside its own half with 8% clear padding and equal size/alignment. Use image 1 as the pose/identity reference, but correct its obvious horizontal seam at the nose: one anatomically continuous cohesive head with no seam, abrupt color boundary or duplicate ears. Image2 is color/style reference only; keep the Boomana gorilla identity. The goggles rest on the FOREHEAD, not covering eyes. Professional cohesive hand-painted slot character art, dark brown fur, tan textured face, controlled warm light, no glow, no background or text. Same geometry in the two cells, no shoulder or body pieces.

Only the eyelid regions from the closed state are composited into the open-state head. Outside the eyes, the three runtime textures share the exact same pixels and geometry to prevent blink jitter.

## 3. `coat_flask_sheet.png`

Costume references: initial assembled reskin and `../alchemist_mascot_v1.png`.

Production skeletal character accessory sprite atlas, transparent RGBA. One image with THREE completely separated sprite islands in three equal vertical columns. Left column: left long coat-tail panel only, teal alchemist coat heavy cloth, thin brass/gold stitched edging, a small leather strap detail, trapezoid tapering at the top with a wide flared hem. Right-view of left panel. Middle column: matching right coat-tail panel only, mirrored perspective, coherent folds and edging. Right column: a single round green potion flask in brass fittings hanging from a short brown leather loop. Match the teal alchemist costume in the references exactly. These are detached garment and prop pieces ONLY, no person, no skin, no arms, no legs, no body, no background, no text. Each piece fully visible and centered in its own column with generous clear transparent padding, no touching islands. Coat panels narrow and about 2.2 times taller than wide; flask about 1.5 times taller than wide. Professional painted slot assets, restrained highlights, no magical glow outside glass.
