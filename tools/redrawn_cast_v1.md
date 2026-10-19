# Four game character redraw, 2026-10-16

Status, 2026-10-17: The redraw was rolled back at the user's request. All
four games now use the MG and FG Spine assets from their
`design/redraw/v1/previous_static/` backups. The redraw source and preview
files remain staged for reference, but are not used by the games. Each active
`monkey.json`, `monkey.png`, and `monkey.atlas` was checked against its backup;
all four game builds completed after the restoration.

Games: MardiMonkey, PochaMonkey, StrikeMonkey, SwingMonkey. Each game's
`design/redraw/v1/` contains new transparent MG and FG full figures,
generated laugh and blink paintings, cutout parts, aligned expression cels,
preview Spine builds, and `previous_static/` backups.

Before the rollback, the production `static/assets/spines/sushiMaster` and
`sushiApprentice` atlases used the new full body painting on a continuous torso
attachment and the new painted head expressions. Original animation timelines
were retained for body movement and expression timing. Old independent limb
attachments were hidden because their cut boundaries did not match the new art
and exposed broken clothing on large gestures.

`assemble_redrawn_faces.py` aligns the generated facial paintings and makes
intermediate cels with optical flow; `build_rigid_redraw.py` repacks the full
body and face cels into a Spine atlas. Run the game-specific
`design/generate_monkey_spine.mjs` with `CAST_SOURCE_DIR` and `CAST_OUTPUT_DIR`
pointing to the staged cutout and preview directory before repacking. The
Python tools need Pillow, NumPy and OpenCV. The full art source is preserved;
do not rerun the older procedural `build_face_acting.py` on this redraw.

Historical redraw QA: MG and FG setup poses rendered for all four games; cheer
frames inspected; all eight redraw Spine files loaded after build. The
existing `check_cast_flow.mjs` reports no mesh area for these region
attachments, so visual pose inspection was the relevant seam check.
