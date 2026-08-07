# Verifying a running game

Read this when you need to answer "does this actually appear, and where?" — a
question a green build cannot answer.

## Contents

- [When to bother](#when-to-bother)
- [Starting a dev server](#starting-a-dev-server)
- [Reaching live state from the console](#reaching-live-state-from-the-console)
- [Reading the pixi scene](#reading-the-pixi-scene)
- [Simulating input](#simulating-input)
- [Known environment limits](#known-environment-limits)
- [Replay test harness](#replay-test-harness)

## When to bother

Worth it: conditional rendering ("the button only shows in replay mode"), layout
positions, whether a click path fires, whether a state flag is ever set.

Not worth it: pure copy changes, refactors with no visible surface, anything the
static guards already cover. The user does real gameplay verification by
uploading to Stake Engine — do not duplicate that.

## Starting a dev server

`.claude/launch.json` at the **workspace root the session opened** (which may be
`E:\stake`, not `E:\stake\wp` — check before assuming). Entries need an absolute
`runtimeExecutable` because `pnpm` is not on PATH:

```json
{
  "name": "gobananas-dev",
  "runtimeExecutable": "C:\\Program Files\\nodejs\\corepack.cmd",
  "runtimeArgs": ["pnpm", "--dir", "wp/apps/GoBananas", "dev"],
  "port": 3002
}
```

Prefer the **dev server** over a static preview of `build/`: dev serves modules
individually, which is what makes the state probe below possible.

## Reaching live state from the console

Vite dev serves modules by URL, and importing the same URL gives you the **same
instance** — so you can read and write the game's actual `$state` from the
console. The URL form differs by where the module lives, and getting it wrong
silently hands you a *second copy* whose values never change:

| Module | Import as |
|---|---|
| workspace package | `/@fs/E:/stake/wp/packages/state-shared/index.ts` |
| the app's own files | `/src/game/stateApp.ts` |

Using `/@fs/…` for an app file is the trap — you get a duplicate module, its
`loaded` flag stays `false` forever, and you conclude asset loading is broken when
it is fine.

```js
const s = await import('/@fs/E:/stake/wp/packages/state-shared/index.ts');
const A = await import('/src/game/stateApp.ts');

s.stateReplay.enabled = true;   // flips the real UI
A.stateApp.loaded;              // the real loader state
```

This lets you exercise a conditional branch without arranging the real
conditions — turn the flag on, then check what rendered.

## Reading the pixi scene

`globalThis.__PIXI_APP__` is set by `InitialiseApplication`.

Two things to get right:

**Transforms are stale unless something rendered.** When the browser pane is not
displayed, rAF is paused and every `worldTransform` reads as zero. Force a render
first:

```js
const app = globalThis.__PIXI_APP__;
app.renderer.render(app.stage);        // now getBounds() is meaningful
```

**Stage coordinates are CSS pixels, not the canvas backing store.** With
`renderer.resolution === 1.25`, a 1600×900 canvas is a 1280×720 stage. Use
`app.renderer.screen`, and do **not** scale by `rect.width / canvas.width`.

Walking the tree for what you care about:

```js
const found = [];
const walk = (n) => {
  if (typeof n.text === 'string') found.push({ kind: 'text', v: n.text, b: n.getBounds() });
  const lbl = n.texture?.label;                    // full URL, so match the filename
  if (lbl && /replay\.png/.test(String(lbl))) found.push({ kind: 'sprite', b: n.getBounds() });
  (n.children || []).forEach(walk);
};
walk(app.stage);
```

Texture labels are full URLs — match on the file name, not a bare word, or your
matcher never fires and its zero result means nothing.

## Simulating input

Dispatch real `PointerEvent`s at stage coordinates:

```js
const canvas = document.querySelector('canvas');
const opts = { pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, bubbles: true, cancelable: true };
canvas.dispatchEvent(new PointerEvent('pointerdown', { ...opts, clientX: 569, clientY: 669, buttons: 1 }));
canvas.dispatchEvent(new PointerEvent('pointerup',   { ...opts, clientX: 569, clientY: 669, buttons: 0 }));
```

To see what a press *did*, wrap the emitter rather than watching state — a
synchronous effect often clears the flag before you can read it:

```js
const E = await import('/src/game/eventEmitter.ts');
const seen = [];
const orig = E.eventEmitter.broadcast.bind(E.eventEmitter);
E.eventEmitter.broadcast = (ev) => { seen.push(ev.type); return orig(ev); };
// …click…  seen === ['soundPressGeneral', 'expandingWildsClear', 'resumeBet']
```

Note: real keyboard input cannot be faked this way — synthetic key events do not
exercise the same path as a physical press. Spacebar bindings need a human.

## Known environment limits

When the browser pane is not displayed the tab is `document.hidden`:

- rAF is paused → Svelte transitions freeze mid-flight and elements linger
- texture upload can stall, so a production build may never finish loading

Neither is a bug in the game. Distinguish them from a real fault by checking
whether the canvas exists and whether WebGL is available — if `webgl2` works and
there is still no canvas, the problem is yours.

## Replay test harness

Replay mode can only run against an RGS that serves real historical bets, so
`apps/GoBananas/design/make_replay_harness.mjs` builds a copy of `build/` with a
service worker that answers `/bet/replay/…` from books already in the repo.

A service worker rather than a stub server, because `rgs-fetcher` hardcodes
`https://${rgsUrl}` — a local stub would need a certificate the browser trusts,
while a worker can answer a cross-origin request with a synthetic response and
needs nothing but localhost.

```bash
pnpm --dir apps/GoBananas build && node apps/GoBananas/design/make_replay_harness.mjs
```

It prints ready-made URLs. The output lands in `build-replaytest/` (gitignored) —
the build you upload is never touched. Copy the pattern for other games.
