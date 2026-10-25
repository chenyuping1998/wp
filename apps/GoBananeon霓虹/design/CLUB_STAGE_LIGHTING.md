# Neon background stage lighting

`Background.svelte` owns one `BackgroundClock` for the painted plate, its
existing `BgProps` meshes and `ClubStage.svelte`. The clock reads the browser's
monotonic frame timestamp; normal 30, 60 and 144 Hz runs advance equally.
Visibility changes cancel the frame request and reset the delta baseline.
Returning to the tab resumes in place; a long main-thread stall contributes
at most 75 ms. Both transient cues and event listeners are cleared appropriately
when hidden or unmounted. Background animation schedules no interval or cue timer.

The existing artwork stays intact. Sign, curb, shelf and pillar anchors use its
256 × 144 coordinates and receive exactly the same cover/parallax rectangle as
the sprite. The light chases therefore stay pinned to the original painting.
The viewport's side margins supply restrained extra light shafts; this keeps
the stage visibly animated in portrait when the painted side fixtures are
outside the centre crop. Light beams end in the outer thirds of the viewport.

| Scene | Tempo | Direction |
| --- | --- | --- |
| Base street | 105 BPM | Slow lamp sweeps, shop-sign dips, wet-pavement reflection flow, light rain |
| Free-game rooftop | 128 BPM | Faster terrace chases, skyline accents, brighter moving shafts |
| Hold-and-spin vault | 128 BPM | Slower pillar/shelf travel, restrained chrome-floor reflection, coin responses |

Existing events drive short lighting responses without defining new events:

- `soundDjScratch`: blend toward a 125 BPM DJ accent for the 3.2-second gesture.
- `soundDjScratchStop`: release the DJ accent over 220 ms, including interruption.
- `mascotChestBeat`: six local accents at 480 + n × 300 ms.
- `soundBlastFuse`: gradually narrow the shafts while the bomb charges.
- `soundBlastDetonate`: an edge-light response, with strength based on blast width.
- `stickyPrizesNew`: briefly lift the vault's lighting.

There is no full-screen flash. The centre is left quiet for the reels. Four
feathered shafts, at most five rail chases, four signs, 22 reflection strokes,
18 distant/near motes and 24 base-game rain streaks form fixed object budgets.
Graphics reuse their existing Pixi instances and create no new texture/filter.
Scene fade containers unmount inactive stage components after the crossfade.

Validation:

```powershell
& 'E:\stake\tools\node-v22.23.1-win-x64\node.exe' design/check_background_stage.mjs
```

The check uses the shipped lighting code to verify refresh-rate independence,
hidden-tab/stall behavior, DJ release and tempo periods, finite geometry and
bounded opacity/counts across landscape, tablet and two portrait sizes. It also
checks that moving beam footprints remain outside the central reel area.
`Background`, `ClubStage` and `BgProps` compile with zero Svelte warnings.
Use the art-review scene switch to inspect all three scenes in the game.
