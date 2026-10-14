# Pickle Panic v2 animation delivery

Original art generated with the native image tool; source prompts and originals are retained in the adjacent manifests. Technical alpha partition, crop, registration and atlas packing use the saved scripts. No research artwork is shipped.

## Symbol clips (512×512 source layers)

`symbol_layers/pivots.json` lists every semantic cut, original canvas pivot and cropped runtime box. All twelve reconstructions have zero visible-pixel RGBA error at rest. `underpaint_registration.json` lists registered native hidden-surface repairs. The jar label stays on its immobile body. Complete runtime choreography is `src/components/LayeredSymbol.svelte`.

Land 240ms: body compresses on contact, rebounds at 70ms, each follower starts 40–60ms later and reaches exact rest at 240ms. W/S weight is 1.2–1.25, highs 1, lows lighter. No completion callback survives teardown.

Win 1200ms: 0–80ms anticipation sinks 4%, recovery to 160ms. H1 top bun rises 18%, spears follow in 50ms offsets; cheese extends then retracts. H2 pickle rolls sideways with mustard follow-through. H3 rings hop in 50ms offsets and rotate 20°. H4 spears fan ±12.6°. W blinks 80–210ms, wide eyes 210–780ms, grins 380–730ms and bites 730–970ms; goggles lag head 40ms. S clapper swings three cycles at peak 22° with damping, flag trails 50ms and paper lifts/relands. P lid opens 35°, both contents rise on delayed arcs, jar squashes on closure. Lows have separate letter/prop/extrusion pieces and small restrained motion. Every clip draws the exact original static image on its first and final frame. Third Scatter rings the on-board bells together and shows a three-frame DING mark.

## Win objects

Five independent native 1600×900 bases; BIG ticket, SUPER crossed tickets/bell, MEGA jar burst, EPIC exploded pipe/brine, MAX both cast. Source names and paths are in `win_manifest.json` and `big_revision.json`. Flying paper/brine pieces are individual originals in `ui_fx_manifest.json`, named by runtime key in `banner_layers/pivots.json`.

Entrance 420ms from 120% below with backOut(1.6); squash/rebound settles by 640ms. Followers start 70ms later and stagger 40ms, move on arcs, settle with two damped ±4° sways. Idle breath ±1.5%/2s, followers ±3°, burst rotates 12°/s. Old tier shrinks to 85% and fades over 160ms; impact shake 6px/120ms. Exit 360ms upward backIn, followers leave first. Presentation windows keep existing 1.8/3.6/3.6/7/9s.

## Blast doors

1100×1080 left/right bases with overscan, independent wheel, liquid, latch, six 50ms steam frames, 1920×180 hazard lintel and independent center badge. Final meeting edges are registered without baked double shadow. Closing cubicIn 380ms, 8px/90ms impact and 14px rebound. Latch 380–500ms, wheels 500–700ms / 270° backOut; steam 700–1000ms. Scene/cast swap only under full opaque cover (700ms minimum, 1400ms when waiting for the throw). Opening reverses wheels 180°/220ms, waits 80ms, then cubicOut 460ms. Opening remains mounted through initial loading handover.

## Cast

`cast/*_keyframes.json` contains four new authored clips on each existing 24-bone rig, all nine previous clips preserved. MG alternate raised-arm attachments avoid forcing a hanging-arm mesh past its budget. Intro 1.6s then 2s loop until winHide; MG hat rises/settles, FG turns and apron trails. `fs_trigger` 1.2s and `upgrade_slam` .9s. `cast/measured_motion.json` is measured with the actual Spine core at 60Hz, includes clip bounds and both characters' fist coordinates. Shoulder ≤26°, elbow ≤22°. FX/table are clipped to the permitted character strip.

## UI, logo and source policy

Three-/four-state UI sprites are app-private; hover warms its own plate, press lowers 3px. Bet strip inset 80/32/80/32 and ticket 64/120/64/64 use actual nine-slice geometry. Thirteen original icon silhouettes differentiate Spin, Autospin, replay, turbo and ±. Logo has eleven original letter layers, 45ms stagger, backOut(2), landing y-scale .85 and three ±2° PANIC beats, repeated each 6s. Full source canvases remain in the delivery directory; runtime crops only empty alpha to reduce GPU memory.
