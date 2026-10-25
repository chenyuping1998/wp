# Neon character: Iron Jaw idle adaptation

Motion source: `E:/stake/spine-generator/src/presets.ts`, presets
`fighter-idle-weave` and `fighter-idle-bounce`. These encode the local research's
Iron Jaw measurements; no Iron Jaw character textures or original skeletons are used.

The default `idle` uses the weave preset at 0.55 intensity and a 1.99 second cycle.
`iron_idle_bounce` is an alternative at 0.38 intensity. `idle_original` preserves
the previous idle. The art-review page (`?artReview=1`, Vite development only)
can switch among all three and test the existing celebration/throw reactions.

Adaptation maps the preset's upper-body root to `torso`, keeping the hip and feet
stationary. The gorilla has no fist IK controls, so arms use small offset rotations
instead of importing the fighter's fist translations. Existing accessory motion
on the `flutter` track remains active.

Rebuild with Node 22.18+:

```powershell
node design/adapt_iron_idle.mjs
node design/check_neon_spine.mjs
```

The main `generate_monkey_spine.mjs` also calls the adapter when rebuilding the
character. The adapter uses a bone-only 4.3 working rig for the research tool's
coordinate solver; it transplants only compatible bone timelines into the game's
existing skeleton. It does not relabel the shipped skeleton, migrate its art or
constraints, or change the game's runtime.

Verification uses the game's runtime: both new cycles close with no pose seam,
both feet remain fixed, and no sampled mesh triangles invert. The existing type
gate remains at its 19-error baseline and Vite production build succeeds.
Rendered review: `source/monkey_neon/_contact_iron_idle_weave.jpg` and
`source/monkey_neon/_motion_iron_idle_weave.gif`.

## Punch study

`adapt_iron_punch.mjs` also compiles the research tool's `punch` preset. Its
0.270s swing and 0.337s impact events supply the timing; body/head follow the
preset, while the arm uses local shoulder/elbow poses fitted to this standing
gorilla. A temporary guide bone is removed before export: the actual hand is
never translated away from its forearm. Duration is 0.857s, followed by the
selected idle in the game. Preview with **人物：Iron 出拳** in the dev art-review
page; this experiment is not automatically triggered by reel outcomes.

The existing hand artwork is retained, rather than generating a new fist pose.
Imagegen repaired fingers baked into the thigh layer; the original layer remains
alongside `left_leg_0_thigh_clean_master.png` and its normalized 153x214 sprite.
`prepare_iron_punch_art.mjs` reproduces the normalization and packs only this atlas
region. The torso mesh also excludes the small lower-left triangles containing
the same resting-hand remnant, revealing the repaired pants behind the moving arm.

Review: `source/monkey_neon/_contact_iron_punch.jpg` and
`source/monkey_neon/_motion_iron_punch.gif`. These are runtime-evaluated frames,
not a screen recording; the GIF includes a short rest between punches.

### Elbow seam repair

The original rigid forearm and sleeve overlay separated during the raised-arm
pose. The punch now selects separate sleeve/forearm attachments: the sleeve
overlay follows the upper arm, and a weighted fur mesh keeps its top band inside
the cuff while gradually following the forearm. The guard bend is restrained to
48 degrees. These attachments are used only by `iron_punch` and restored at its
end, preserving the original chestbeat/throw rigs. The runtime check now covers
action-only attachments too and samples the punch at 60 fps; previously it only
checked meshes visible in the setup pose.
