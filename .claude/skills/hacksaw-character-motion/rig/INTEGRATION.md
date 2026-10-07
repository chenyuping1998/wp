# Putting this into the Hot Miami upload bundle

Read from the shipped `frontend/index.html`, not run. Where something was only
read rather than executed, it says so.

## The finding that decides it: the bundle already ships Spine

The Stake `svelte5-pixijs-slot` template bundles the full **spine-pixi-v8**
runtime, and Hot Miami does not use a byte of it:

| present in the bundle | minified as |
| :-- | :-- |
| JSON skeleton loader (`readSkeletonData`, `JSON.parse`) | `bse` |
| binary skeleton loader | `Gne` |
| attachment loader (`newMeshAttachment`, `newRegionAttachment`, `atlas.findRegion`) | — |
| render pipe registered as `name:"spine"`, with `slotBatches` batching | `K3` |

Nothing loads a skeleton: `spineAtlas`, `skeleton.json`, `spineData` and
`createSpine` are all **0 hits**.

So the natural way in is not to port this toolkit's renderer. It is to **export
a Spine skeleton** and let the runtime that is already there play it.

## And the route I first assumed is closed

I said porting the mesh component would be straightforward. Checking properly,
it is not, and the reason is worth writing down.

The pixi-svelte layer wraps only four view types — `ze` Sprite, `se` Container,
`ot` Text, `Nt` Graphics. Writing a fifth is easy in principle, because the
pattern is trivial:

```js
function se(r,e){ const n=Au(); const s=new Bn;      // Bn = Container
                  Ru({props:t,target:s}); n.addToParent(s); ... }
```

`Au()` is a Svelte context returning `{parent, addToParent}` — nothing exotic.
`MeshGeometry` survives too, as `tg` (aliased from `aB`), because Spine needs it.

**But the Pixi `Mesh` VIEW class has been tree-shaken out.** The only
`renderPipeId` values in the build are `renderGroup`, `sprite`, `batch`,
`graphics`, `text` — no `mesh`. The one `"Mesh"` string left is Spine's own
attachment-type enum. So there is no Mesh to construct; it would have to be
hand-written against Pixi's internals (bounds, pipe id, geometry hooks, batching)
inside a minified bundle, which is a different order of risk from the `hmRig`
patch.

**Route: export Spine.** The rig's data maps one-to-one onto a Spine mesh
attachment — bones, weighted vertices, triangles, UVs are the same four things
Spine stores, and the format is already well understood here from rebuilding
their PSDs out of it.

## Why it is still not worth retrofitting the two shipped characters

Their art does not support what the mesh rig is good at:

| | heights (of 60) where arms are clear of the body |
| :-- | --: |
| Hot Miami guy — hands in pockets | **0** |
| Hot Miami girl — arms at her sides | **2** |
| the newer character | **9** |

With arms against the body, a mesh rig gives those two **body sway and head
only** — less motion than the cut-out rig they have now, where the girl's skirt
and her arm-with-clutch both swing. The one real gain would be the **FG
reaction**, which the cut-out rig cannot do: a one-second gesture at that
amplitude opens seams immediately.

The current rig passes its own gate and is deployed. Swapping it costs a new
runtime path for characters that would move less.

**Use this on the next character instead** — one drawn for it, arms clear of the
body, with something hanging free.

## A defect found while checking this

Verifying whether periods could be aligned turned up something that was already
shipping in the previews:

**The idle does not close at the loop boundary.**

| bone | period | 8000 / period | jump at the wrap |
| :-- | --: | --: | --: |
| `fore_l` | 1800 | 4.444 | **1.55°** |
| `arm_r` | 1500 | 5.333 | **1.48°** |
| `head` | 1750 | 4.571 | 0.91° |

In a **live runtime this does not matter and is actually wanted**: time never
wraps, so the figure never visibly repeats — which is the entire point of giving
each bone its own period.

Two real consequences:

- **The preview GIFs hitch at the wrap.** They are an 8 s window cut out of a
  quasi-periodic motion, not a loop. `preview.py` now warns when the clip will
  not close, and by how much.
- **A Spine export needs a genuinely periodic clip**, because Spine animations
  loop. That forces the periods onto common divisors of the loop — in the
  1.5–3 s band, divisors of 8000 give only 1500, 2000 and 2667, which cannot
  separate nine bones. Either the loop gets longer or the decorrelation gets
  worse. This is presumably why the reference game runs a hand-authored 8 s
  clip rather than layered periods.

## If you do want it in the bundle

1. Write `rig → Spine JSON + atlas`. The atlas is one region covering the whole
   image; the skeleton is bones, one skin, one weighted mesh attachment, and the
   animations baked to keyframes.
2. Pick periods on a common grid so the clip closes, and accept the worse
   correlation — or bake a longer loop.
3. Register the skeleton and atlas as assets, mount a Spine object with the same
   `Au()` / `addToParent` pattern the other components use.

**None of that has been built or run.** Step 3 in particular is read from the
code, not executed — no skeleton has been mounted in that bundle. The first
thing to do would be a minimal proof: export one skeleton, mount it, confirm it
draws, and only then talk about integration.
