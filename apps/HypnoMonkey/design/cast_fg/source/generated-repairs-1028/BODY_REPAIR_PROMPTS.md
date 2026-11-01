# Body repair prompts — built-in image_gen

All edits requested a transparent 1024×1536 canvas and the original source position. Image edits are followed by recorded source registration/overlap cleanup; they are not a pixel-identical master copy.

## pelvis

Use case: precise-object-edit. Repair only these red circus shorts animation layer. Keep transparent 1024x1536 canvas, exactly same original position and size. Repaint the dark-red rectangular patch at upper right as uninterrupted same red fabric and natural shading/creases matching adjacent shorts. Restore continuous clean gold waistband, upper waist hidden below vest at y640. Shorts must be complete when hand moves away. Remove brown thigh fragments inside leg openings: shorts only. No skin, hands, torso, new props. Smooth clean outer silhouette. Preserve current shape and gold trim.

## neck

Use case: precise-object-edit. Repair only this neck animation layer. Keep transparent 1024x1536 canvas, original location and scale. Remove ALL white collar, gold stripes, peach chin fragments and detached flecks. Draw one continuous natural brown monkey neck, from rounded top at (525,341) down to rounded base (493,423), taper matching the reference neck. Extend under head at top and shirt at bottom 40px. Brown fur/skin only. Smooth clean natural shading, no transverse outlines on overlap caps. No clothes or face. Keep same brown palette.

## tail_1 — accepted second edit

Use case precise-object-edit. Edit image 1 only; image 2 is STYLE reference only. Isolated FIRST TAIL SEGMENT sprite. Transparent 1024x1536. Keep EXACT location in image 1, root (652,795), bottom joint (837,1016). This is crisp 2D cartoon cel-shaded game art with DARK INK outline, NOT realistic fur. Repair ONLY ugly broken block-shaped tail root: tail must be one smooth continuous curved brown tail segment from rounded root centered (635,763) down to (837,1016). Root reaches 45px under shorts. Match the original tail width, smooth arc, angular cel shading and 2px ink along longitudinal edges. Rounded hidden root and bottom overlap with NO transverse dark cut lines. REMOVE gold/clothing triangles. No diffuse shadows, NO glow, NO blur, NO tiny fur hairs, NO detached rectangles. Do not rescale or center the asset. Keep it small in its exact original place in large transparent canvas.

The first realistic/fuzzy tail draft and the initial hairy forearm draft were rejected. The accepted final arm prompts are in `FINAL_ARM_PROMPTS.md`; the first bent full-arm and leg drafts are retained for provenance and marked `notConsumed` in the manifest.
