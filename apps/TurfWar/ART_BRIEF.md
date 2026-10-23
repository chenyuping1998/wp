# Turf War — production art direction v3

2026-10-23 full remake, authorized scheduled work. Supersedes the sticker version;
its complete brief and runtime sources are recoverable in `design/rebuild_20261023/before/`.
Reviewer targets: Poor animations ×3, Low quality assets, Poor bet UI bar;
specifically background and main-character animation.

## 0. Direction and palette

Hand-inked urban graphic novel: broad charcoal silhouettes, warm ivory concrete,
burnt orange jackets and industrial hardware; hard cel shadows and authored
hatching. No glossy CGI, emoji, generic gradient plaques or thick die-cut sticker
rims. Quiet dark reel bed, stronger saturated premium symbols, muted native
stencil low symbols. The scene is a lived-in neighborhood rather than a gray
line-art wallpaper. Painted source and transparent deliverables remain editable.

| Role | Palette |
|---|---|
| Ink / ivory | #121212 / #F7F5F0 |
| Wall light / mid / dark | #D8D6D1 / #9A9CA0 / #55585D |
| Quiet reel bed | #3A3D42 |
| Orange dark / main / highlight | #9C5A22 / #F5893D / #FFC38A |
| Premium accents | #E0338A / #2EC4C6 / #9BD437 |
| Bruiser-only alarm accent | #B22222 |

Flat typography, native stencil glyphs, quiet reel fill and input icons are
intentional code-native graphics. Do not add noise to evade flat-fill warnings.
Painted major illustrations are generated independently via ImageGen.

## 1. Cast and motion

MG: young masked hooded enforcer in orange bomber, wrapped fists, open guard.
FG: different older bald bearded Kingpin, ivory rolled sleeves, black waistcoat,
orange tie, open guard. Never use the old crossed-arm silhouette to constrain
movement. No body proportions stretched to fit a reel-side strip.

Each has four independently painted sources: body/legs, head, near arm, far arm.
Sources: `design/rebuild_20261023/source/{mg,fg}-*.png`; uniform scale/translation
registration only, recorded per actor in `cast/*/registration.json`. No master
slicing. Keep the complete independent images alongside registered layers.

`build_cast.py` makes weighted layer meshes. `design/build_spine_motion_cast.mjs`
uses the new local spine-motion-kit recipe compiler for actual Spine 4.3 timelines.
Official Spine core 4.3 runs the live mesh renderer, isolated from legacy symbol
4.2 assets. Breathing, neck lag and separate shoulder/elbow movement continue
beneath additive win, winBig and trigger reactions. Feet stay planted; reaction
interruptions mix smoothly back to idle. The portrait actor stands behind the
housing, the landscape actor stands on its ground line beside the reels.

Production delivery: `static/assets/castLayers/turf/v3/{base,fg}/` and
`design/rebuild_20261023/spine/`. Preserve recipe, setup, report, import layers,
geometry check and browser-rendered motion preview.

## 2. Symbol identities and readable weights

| ID | Image |
|---|---|
| H1 | Gold crown chain |
| H2 | Teal safehouse building |
| H3 | Three rolled banknote bundles |
| H4 | Crumpled magenta soda bottle |
| H5 | Compact lowrider, three-quarter view |
| W | Brass knuckles, runtime WILD caption |
| S | Teal boombox Scatter |
| SW | Different woman Bruiser in red jacket |
| L1 / L2 / L3 / L4 | Crown / skull / star / bolt stencil |

Keep IDs, pay values, reels and outcomes unchanged. High/special originals are
separate ImageGen sources. Export by alpha crop and uniform fit to 512×512, with
clear margins; lows are explicitly native vector-like stencil geometry, retained
at 1536×1536. Object motion tables follow the same IDs. Remove generic peeling
paper corners; articulate speaker rings, window light, wheel spokes, cap hiss
and impact ink only during each object's visible win beat. Use the restrained
low-symbol scale/contrast to preserve payout hierarchy. Read every multiplier
value on a native game capture, including stacked/full-grid bags.

## 3. Scenes and transitions

Base: sunlit narrow alley, ivory walls, burnt-orange fire escape, dark cast bay.
Feature: industrial courtyard, chain and amber lamp. Kingpin: warm sunset rooftop.
All have quiet space behind the board and separation behind the right-side actor.
Independent street life: walking/pecking pigeon, drain steam, wind-driven pennants;
feature chain swing, lamp interruption and steam. Delta-cap the clocks. Scene FX
must render behind cast/housing, including after resize. Slow pan alone is not
background animation. Retain the shutter transition and its impact beat, cap delta
on a suspended tab, and verify entry/return in the real game.

## 4. Hardware, UI and typography

Painted bevels, ivory chipped metal and orange repair tape unify the reel casing,
feature panels, title plaques, win plates and new wide console. Export corners
without stretching their geometry. Painted wells must be opaque; only exterior
silhouette and actual cutouts are transparent. Keep the actual reel window clear.

App-local TurfConsole keeps all existing shared input/session providers. Desktop:
Balance, Win, grouped stake −/amount/+ then large spin and secondary controls.
Portrait: always-present two-row console, clear metrics and reachable targets.
Panel wrappers have explicit background depth so rebuilding slices on resize
cannot cover the buttons. Stake readout remains clickable. Menu captions use
central social terms. Replay keeps the complete existing SharedUI summary.

Bungee is the title face, Oswald 700 numbers/controls, Saira body copy. Runtime
text is never baked into generated panel images. The actual two-line logo PNG
renders once without another title layered over it. No idle spin halo; mouse
hover warms the plate, touch must clear hover after lifting.

## 5. Store and delivery

Thumbnail: one MG actor, no baked wording/provider mark, bright matching alley BG.
Cover: both final actors plus crown-chain prop; preserve top-right rating and
bottom-left thumbnail overlays. Separate opaque BG / transparent FG. Provider
mark remains separate. `build_brand.py` uses final registered cast; never the old
crossed-arm art. Source backdrops remain unchanged; exported store BG lift is
recorded in that script.

Stage only at `/Users/stone/stake-engine/upload/TurfWar/`. Preserve a recoverable
staging backup, replace compiled code plus explicitly changed exported art,
retain previous pruning/compression, and regenerate file/hash inventory. No
upload, publication or submission was authorized.

## 6. Acceptance evidence

Full build and asset/motion guards, official-runtime geometric sampling and
browser visual playback serve different purposes. Scores do not approve art.
Inspect desktop, 4:3 and 390×844; all feature tiers, retrigger, intro/outro and
return controls; mouse hover/touch state; social text and replay. Log remaining
verification gaps and existing project type errors honestly. Actual evidence and
release notes live in `design/rebuild_20261023/`.
