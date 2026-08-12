---
name: stake-engine-slot
description: Building and shipping slot games on Stake Engine in the `wp` pnpm monorepo (WildParty / GoBananas / EmberForge). Covers the build commands that actually work on this machine, the static guard scripts that catch what `vite build` cannot, the Svelte 5 reactivity traps that bite pixi-svelte games, how to actually verify a change instead of trusting a green build, and the certification requirements that keep coming back. Use this whenever working under `wp/apps/*` or `wp/packages/*` — adding a game feature, touching the shared bet bar, answering a Stake Engine review comment, or debugging a game that boots to a blank screen. Use it especially before calling a change done, because "the build passed" proves almost nothing here.
---

# Stake Engine slot games (wp monorepo)

Three games share this repo: WildParty, GoBananas, EmberForge. They are separate
apps over a common set of packages, so most mistakes here are either "I broke the
other two games" or "the build was green and the game is dead".

## Build and run

`pnpm` is not on PATH on this machine. Go through corepack, and use an **absolute**
`--dir` — a relative one resolves against `E:\stake`, not `E:\stake\wp`:

```bash
& "C:\Program Files\nodejs\corepack.cmd" pnpm --dir E:\stake\wp\apps\GoBananas build
```

Two things about reading the result:

- **Do not trust the exit code from PowerShell.** Redirecting a native command's
  stderr wraps each line in an ErrorRecord and reports failure even on success.
  Look for `✔ done` in the output instead.
- Node lives in `C:\Program Files\nodejs` and is not on a fresh shell's PATH.
  The SVG→PNG generators need `E:\stake\tools\gen` passed as their argument —
  that is where `@resvg/resvg-js` and `pngjs` are installed.

After touching anything in `packages/`, build **every** app, not just the one you
were working on. That is the only cheap check that you did not break a sibling.

## How the packages are consumed

This trips people up because the two shared UI packages behave differently:

| Package | Consumed as | Consequence |
|---|---|---|
| `components-ui-pixi` | **source** | edits take effect on the next build, no rebuild step |
| `pixi-svelte` | **dist** | you must re-run `svelte-package` or your change is invisible |

`pixi-svelte/dist` is committed because `main` points at it and there is no
`prepare` script — removing it would break a fresh clone.

### Every shared change must default to the old behaviour

A change in `packages/` reaches all three games. The pattern that keeps this safe
is a flag that is off unless a game opts in, so a game that knows nothing about
your feature renders exactly as before:

- `uiTheme.*` for anything visual (`betBarLayout`, `icons`, `hoverHighlight`)
- a state flag for anything behavioural (`stateReplay.enabled` starts `false`;
  only a game whose own code sets it gets the new replay bar)

If you find yourself writing an unconditional change in a shared component, stop
and ask which game asked for it.

## The static guards, and what each is blind to

`vite build` does **not** type-check. An undefined identifier is a legal free
variable to the bundler, so it compiles happily and explodes at runtime. Three
scripts in `apps/<Game>/design/` exist to cover specific holes, and each has a
blind spot worth knowing:

| Script | Catches | Blind to |
|---|---|---|
| `check_assets.mjs` | asset paths in `assets.ts` that do not resolve | assets referenced by a computed key |
| `check_undefined_refs.mjs` | template referencing an identifier the script never declares | **identifiers used inside `<script>`** — it explicitly lets through any name that appears anywhere in the script |
| `check_social_words.mjs` | restricted words in literal template text and in the social branch of `pick()` | a restricted word arriving through a variable |

They run from the app's `build` script. When you add a game, copy them.

### Why a missing identifier kills the whole game, not one panel

This is the failure mode to recognise on sight, because the symptom points
somewhere else entirely.

A `ReferenceError` thrown during a component's init aborts Svelte 5's effect
flush. Everything later in the tree never initialises. So one bad line in a modal
that is not even open produces: no canvas, no asset loading, and a loader overlay
frozen on screen because its own `setTimeout` never got registered.

It reads exactly like "asset loading is stuck". It is not.

**Diagnose in this order:**

1. `document.querySelector('canvas')` — is the pixi app mounted at all?
2. WebGL available? (`canvas.getContext('webgl2')`) — rules out the environment
3. Only then look at asset loading

Getting this order wrong costs hours. Ask "did it mount?" before "did it load?".

### The earlier variant: a ReferenceError at module evaluation

Same symptom, one stage earlier and even quieter — not even the provider logo
appears, and the console can look empty until you reload.

`stateGame.svelte.ts` builds its reels at module scope, *above* the
`export const stateGame = $state(…)` they belong to. That is fine as long as
nothing reaches into `stateGame` before the module finishes evaluating. Margin
Call passed `createReelForSpinning` a `getReelLength: () => …stateGame.rows`,
and that function had one call site that ran **while the reel was being
created** — touching `stateGame` inside its temporal dead zone:

```
ReferenceError: Cannot access 'stateGame' before initialization
    at src/game/stateGame.svelte.ts:53
```

Every module that imports the game state dies with it, so nothing renders at
all.

**Two rules that follow:**

- A factory in `packages/` must not call a caller-supplied callback while it is
  constructing. Resolve creation-time values from the arguments it was handed.
- When a game passes a getter that closes over module state, satisfy yourself it
  can only run after evaluation — during a spin, an effect, an event handler.

**`vite build` cannot catch any of this.** `+layout.ts` sets `ssr = false`, so
prerendering emits a shell and never evaluates the game modules. A green build
and three green guards said nothing was wrong while the uploaded game was a
black screen. Boot the page.

## Svelte 5 traps in this codebase

**Proxy identity.** `$state` arrays are deep proxies. An object literal you pushed
and still hold a reference to is the *raw* object — writing to it bypasses the set
trap and signals nothing. Re-fetch from the array before mutating:

```ts
const entry = wilds.find((w) => w.reel === created.reel) ?? created;
entry.phase = 'idle'; // now this actually re-renders
```

Iterating (`for (const e of wilds)`) *does* yield proxies, so writes in a loop are
fine. The danger is specifically a reference captured before or outside the array.

**Anything derived from the URL must be read lazily.** `page.url` is not available
while a module is being evaluated. Use a factory function or getters, called from
component init:

```ts
export const getSocialTerms = () => {
  const social = stateUrlDerived.social();
  const pick = (normal: string, socialText: string) => (social ? socialText : normal);
  return { bet: pick('bet', 'amount'), /* … */ };
};
```

**Effects that write state they also read** converge as long as the write is
idempotent, but watch for a watcher that clears a flag another effect just set —
a one-frame race that looks like flakiness. Prefer deriving from a machine state
transition over hand-maintained booleans.

**Module-scope `$state` in `.svelte.ts`** is the established pattern for shared
state; keep new state files consistent with `stateBet.svelte.ts`.

## Verifying a change

A green build tells you it compiles. It tells you nothing about whether a thing
appears, where it appears, or whether the condition that shows it is ever true.
Three separate versions of a feature shipped broken in one session because "build
passed" was treated as verification.

- **Layout, conditional rendering, "does the button show up"** → probe the running
  dev server. Recipe in `references/verification.md`.
- **Copy, terminology, restricted words** → the static guards plus reading the
  rendered string in both modes.
- **Real gameplay against the RGS** → the user uploads to Stake Engine. Do not
  try to fake a session.

When you cannot verify something, say so plainly and name the gap. A verification
gap stated up front is cheap; one discovered by the reviewer is not.

## Debugging discipline

**Bisect before theorising.** `git stash push -u -- apps packages` → build → test →
`git stash pop` settles "is it my change?" in one round. Reasoning about module
graphs and framework internals is slower and usually wrong.

**A probe must prove it can see its target before its zero means anything.** A
check that reports "no glow anywhere" is worthless if its matcher never could have
matched. Validate the probe against a known-positive case first.

**Correct the record when you were wrong.** These notes and the per-game
`HANDOFF.md` are read later as fact. A wrong root cause left in writing costs more
than the original bug — go back and fix the entry.

## Platform contract

URL parameters the game receives (`stateUrlDerived`):

| Group | Params |
|---|---|
| Play | `sessionID`, `rgs_url`, `lang`, `currency`, `device`, `social`, `demo` |
| Replay | `replay`, `amount`, `game`, `mode`, `version`, `event` |

- `social=true` forces English and forbids betting terminology everywhere the
  player can read.
- Replay is a GET to `/bet/replay/{game}/{version}/{mode}/{event}`; nothing is
  wagered and `endRound` is skipped, so a round can be replayed repeatedly.
- Book amounts and `payoutMultiplier` are quoted against the **base** stake, not
  the total cost of a bought mode.
- Money is formatted against a fixed locale, never the interface language —
  switching to French must not turn `$1,000.00` into `1 000,00 $US`.
- Amounts in URL parameters are in API units: 1,000,000 = 1 coin. A launcher
  `balance=100000000` seeds 100 coins, not 100 million.

## Shipping a new game

Start from `references/review-log.md`. It opens with a pre-submission checklist
built from six rounds of Stake review on Go Bananas — every line on it cost an
upload-and-wait cycle, and almost all of them are cheaper to build in than to
retrofit. The case log underneath explains what each reviewer comment actually
meant, which is rarely what it says.

The two items that generalise beyond the checklist:

- **Whatever the animation shows as covering the board is what the maths must
  have evaluated.** Presentation and maths get written months apart, and a
  disagreement between them reads to a reviewer as a payout bug.
- **Keep the source layers of any artwork you flatten.** Cover art gets sent
  back for composition, and a flattened image cannot give back pixels that were
  cropped away.

`references/certification.md` holds the requirements themselves — restricted
words, replay, money, and the presentation notes that keep coming back.
