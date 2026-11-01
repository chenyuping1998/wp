# Static Shift - pacing and motion decisions

Updated 2026-10-19, Asia/Taipei. User specifically requested care for rhythm, not only appearance.

## Reference versus authored material

The Claude Stream Time transcript measures one losing spin and idle only. Its shared 2s clock, simultaneous start, roughly90ms stops, brief downward scene impulses, 16s animal loop and 6s sign sweep guide this game. No reference art or sound is copied. Trigger, collection, feature, win ladder and transition timing below are original decisions because that recording did not show them.

## Base reel pulse

The first strip begins linearly, without upward wind-up or blurred ghost copies. All five columns start together. Normal speed1.54px/ms on140px cells =11cells/s. One cell of extra travel per later column produces90.9ms nominal stop spacing. Seven-pixel overshoot settles over46.7ms. Landing animation begins at impact, in the same frame as sound and scene kick.

Actual foreground browser sample, book671: start spread0ms; stop times after press2509/2592/2691/2778/2876ms; intervals83/99/87/98ms (mean91.75ms). Frame quantization accounts for the alternating intervals. Press-to-all-stopped2.876s. Source clock: performance marks inside each actual reel primitive, read by local measure.html while its iframe is visible. No measurements across a hidden pane are used.

Low objects take only18% of the full squash amplitude; portraits42-45%; Packs70-110%; Relay/Scatter120-125%. Landing envelope45ms compression,55ms rebound,65ms settle. Base reel bounce is small; emphasis comes from selected symbols rather than shaking every column.

## Weight and anticipation

Only Relay/Scatter produce a downward world kick; controls stay fixed. Kick height1.07% canvas, decays over100ms. The heavier Relay uses full strength; Scatter70%. Simultaneous special landings merge into one impact. Ordinary props do not kick the scene.

After two Scatters, only undecided reels tease. Each anticipated step adds about650ms, rather than the source engine's multi-second wait per column. The sign, cast and sound reinforce this beat without inventing an outcome.

## Collection

220ms pickup/read beat;340ms curved signal transfer;65ms Pack stagger. Relays enter with bounded overlap (160-420ms gap based on Pack count), so a board with many collectors does not serialize several complete animations. Every arrival updates the correct Relay total and carries its own Pack value. At most one arrival sound per frame prevents cue piles. Collections above x1 receive a360ms multiplier stamp; final hold280ms.

This changes presentation only. Per-collector arithmetic, base-stake units, active multiplier and final result remain book-authoritative.

## Free-game flow

Natural trigger holds650ms; direct entry250ms. One Scatter animation follows; the old3s hold and triple animation replay are removed. Broadcast wipe closes420ms, swaps under full cover, reopens after760ms, completes1180ms. Cast changes only beneath cover.

Free-spin introduction moves title at350ms, slams count at750ms and accepts dismissal from950ms. Regular feature travel1150ms at2.8px/ms; column spacing about100ms. Turbo feature travel700ms at4.6px/ms; columns remain readable at about61ms spacing. Feature rounds accelerate while collection and meter values still get their own beats. Final foreground turbo sample (base1875, FG4): gaps63/50/70/44ms, mean56.75ms. Normal FG sample:98/100/102/99ms, mean99.75ms.

Meter promotion:380ms entrance,1500ms readable hold,320ms exit. Each promotion communicates both +10 spins and the new collection multiplier. No repeated Scatter retrigger sequence: the math has no such feature.

## Win ladder

Count-up durations: ordinary0.45/0.7/0.9/1.2s; Big1.8s; Super2.4s; Mega3.6s; Epic4.8s; Max7s. Big wins add700ms final hold; ordinary results180ms. All count-ups remain skippable. The source6/18/20/26/32s ladder is removed. Celebration explicitly gates board dimming so a busy board remains visible behind the plaque.

## Idle life

Cast and portrait heads share an absolute2s clock (cast head travel about2% of canvas height):400ms drop,600ms hold,800ms lift past rest,200ms recovery. Bodies/feet stay planted; portrait deformation is internal, not whole-card rocking. Props stay still. Pigeon walks, pauses, stands, sniffs and returns on16.2s; its home is partly behind the control bar. Sign sweeps in350ms every6s and changes to the feature color while on air.

## Audio

Original main92bpm / feature112bpm beds. Five stop clicks rise gently in pitch. Relay and Tape Deck landings use separate heavier cues. Transfer arrivals rise by Pack index; multiplier stamping has its own hit. Sound and scene impulses fire on the actual landing state. No copied source soundtrack ships.

## Ink / contact revision — 2026-10-19

The first pass matched stop spacing but did not earn the same impact. This revision keeps reel timing and math untouched and changes the semantic accents:

- Scene landing pulse: two discrete downward shelves (38% at full,32% at one-third, then10%),100ms total. HUD never enters the moving world container. Only semantic heavy events request the pulse.
- Collection pickup is bounded:220ms plus25ms per Pack capped at160ms extra. Existing340ms flights/65ms Pack spacing and bounded Relay overlap remain. There is no long pickup tax for crowded boards.
- Multiplier stamp approaches silently for126ms. On contact, total changes, stamp sound, short ink ticks and scene pulse dispatch together. Strength×2=.8,×3=1.05,×10=1.45; ordinary final collection=.45. Collection contact mark records that dispatch frame.
- Upgrade poster:240ms entry,1350ms read hold,240ms exit (1830ms total, previously2200ms). Contact at72% of entry (~173ms): level sound + downward pulse1.1, or1.65 at the top rung. Audio was previously dispatched before poster entry.
- Big win:145ms approach from1.55 scale,60ms contact hold, then small mechanical settle. Count-up begins205ms after entry. Scene pulse, tier fanfare and short cream flash share contact; intensity rises by tier. Existing1.8/2.4/3.6/4.8/7s count-up ladder remains skippable. Plaque mesh starts its small settle at contact, with less rubbery deformation and no perpetual breathing.
- Ordinary wins have no confetti or world shake. Big/Super/Mega use sparse cream ink slashes and radio arcs. Epic/Max add mint waves and cassette confetti. Removed revolving gold sun, soft glow bed, bokeh and rim sparkles.
- Five contact cues rebuilt as short hardware thumps with transient cracks and controlled peaks. Collection ducks music to48% for260ms; upgrade24–38% for360ms; big entry22% for420ms, then recovers. These are dispatch-synchronous effects; no claim of speaker/DAC sample synchronization is made.
- Character reactions now keep feet planted. Motion gates cover the new localized face turn, and original2s shared idle clock remains.

Runtime contact and stop samples for this revision: see qa/INK_REVISION_QA.md. Art/sound URLs carry content revisions so cached first-pass textures cannot mix with the new build.

Maximum-win follow-up: the capped feature previously used the ordinary TOTAL WIN outro, so the strongest tier never reached the new Win plaque contact. The outro now displays MAX WIN plus config-derived10,000× only at the actual cap, with top-tier radio FX. Its faceplate contact at259ms dispatches the tier cue and downward pulse; counting begins60ms later. Normal feature totals also get their tier cue at contact. This avoids two full maximum-win count-ups in succession.
