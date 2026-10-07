---
name: stake-engine-slot
description: Building and shipping slot games on Stake Engine in the `wp` pnpm monorepo (WildParty / GoBananas / EmberForge). Covers the build commands that actually work on this machine, the static guard scripts that catch what `vite build` cannot, the Svelte 5 reactivity traps that bite pixi-svelte games, how to actually verify a change instead of trusting a green build, and the certification requirements that keep coming back. Use this whenever working under `wp/apps/*` or `wp/packages/*` — adding a game feature, touching the shared bet bar, answering a Stake Engine review comment, or debugging a game that boots to a blank screen. Use it especially before calling a change done, because "the build passed" proves almost nothing here.
---

# Stake Engine slot games (wp monorepo)

Three games share this repo: WildParty, GoBananas, EmberForge. They are separate
apps over a common set of packages, so most mistakes here are either "I broke the
other two games" or "the build was green and the game is dead".

## Build and run

**Use the toolchain on E:, not the one in `C:\Program Files\nodejs`.** Node, npm,
pnpm and corepack all live in `E:\stake\tools\node-v22.23.1-win-x64\` (Node
v22.23.1). This is the user's explicit preference, and it applies to the design
scripts as much as to builds.

`pnpm` is not on PATH. Go through corepack, and use an **absolute** `--dir` — a
relative one resolves against `E:\stake`, not `E:\stake\wp`:

```bash
& "E:\stake\tools\node-v22.23.1-win-x64\corepack.cmd" pnpm --dir E:\stake\wp\apps\GoBananas build
```

Two things about reading the result:

- **Do not trust the exit code from PowerShell.** Redirecting a native command's
  stderr wraps each line in an ErrorRecord and reports failure even on success.
  Look for `✔ done` in the output instead.
- The SVG→PNG generators need `E:\stake\tools\gen` passed as their argument —
  that is where `@resvg/resvg-js` and `pngjs` are installed. That is a separate
  thing from the Node install above; both are under `E:\stake\tools`.

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
| `check_social_words.mjs` | restricted words in literal template text, in the social branch of `pick()`/ternaries, in the bet-mode table's `text:` blocks, and in whitespace-bearing string literals inside listed components' `<script>` | a word arriving through a variable — and, by nature, a **wrong replacement** that contains no banned word at all |

They run from the app's `build` script. When you add a game, copy them.

Every one of those rules exists because a submission failed while the guard was
green. Before trusting a clean run, **inject the exact string that failed and
confirm the guard reports it** — three of the four holes above were files the
script already read but structurally could not judge.

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

## A Pixi trap: additive blending inside a mask draws nothing

`blendMode: 'add'` adds to what is already in the framebuffer. Put it inside a
masked container and there is nothing there to add to.

In Pixi v8 a sprite mask is a **filter** — `AlphaMaskEffect extends FilterEffect`
(`rendering/mask/alpha/AlphaMaskPipe.mjs`) — so the masked container is rendered
into an isolated render texture that starts transparent. Additive children blend
against that emptiness, and the result is composited back with ordinary alpha. A
glow meant to light up the artwork underneath arrives as a faint coloured film
laid over it, which over already-bright art is invisible.

This cost a whole upload. The build was green, `check_assets` passed, the
component mounted, every prop was correct, and the effect was simply not there.

**The rule:** additive light must be drawn as a direct sibling of what it is
lighting, with no mask and no filter between them. If the effect has to be
confined to part of an image, bake that confinement into the texture's own alpha
offline rather than masking at runtime.

The same applies to `filters` — anything inside `<Container filters={...}>` is in
an isolated target too. That case is usually fine, because the thing being lit is
normally inside the same container.

**How to tell them apart quickly:** if an additive effect is invisible, check
whether any ancestor has a `mask` or `filters` before touching the effect's own
numbers. Turning the alpha up will not fix it.

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

**Effects that write state they also read.** The old note here said these
"converge as long as the write is idempotent". That is wrong for anything driving
a **timed animation**, and the correction cost two rounds of a bug the user could
see and two rounds of measurement that said it was fixed.

An `$effect` that reads a `$state` its own `requestAnimationFrame` loop writes
re-runs on every tick. The cleanup cancels the in-flight rAF and the body starts a
**fresh ramp with a fresh `performance.now()` baseline** from wherever the value
had reached. The ease never completes on its stated schedule; it decays
asymptotically, covering only `frameMs / DURATION_MS` of what is left each frame.

```ts
// WRONG — a 140ms ease that actually takes about a second
let dimAmount = $state(0);
$effect(() => {
  const target = props.dim ? 1 : 0;
  if (dimAmount === target) return;   // reads dimAmount -> subscribes to it
  const from = dimAmount;             // …and again
  const started = performance.now();
  const tick = (now: number) => {
    dimAmount = from + (target - from) * Math.min(1, (now - started) / DIM_MS);
    if (…) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
});

// RIGHT — depend on the input only
import { untrack } from 'svelte';
const from = untrack(() => dimAmount);
if (from === target) return;
```

Measured on Capo Nostra 2026-09-10: releasing a symbol dim ran
`0.50 → 0.60 → 0.68 → 0.74 → 0.75 → 0.76 → … → 0.93` over ~26 frames instead of
the ~8 the 140ms constant implies. The visible symptom was three tiers removed
from the cause — symbols looked like they *vanished* under a big-win banner,
because a board still fading up from 0.5 sat under a banner that reached full
opacity in 9 frames. Two earlier fixes aimed at the banner's ordering had no
visible effect, because the ramp was slow no matter when it started.

**The tell:** an animation whose measured duration does not match its own
constant, and a recovery curve shaped like exponential decay rather than a line
or an ease. When you see that, look for the effect's dependency list before you
look at anything else.

Still true, and unchanged: watch for a watcher that clears a flag another effect
just set — a one-frame race that looks like flakiness. Prefer deriving from a
machine state transition over hand-maintained booleans.

**Full-screen celebrations must gate the layers underneath, not race them.** The
same bug had a second half: the board's win volley dims every cell not in the
volley, and nothing stopped that dim while a full-screen banner was up. Clearing
the state the dim reads (at the moment the banner opens) is the fix that *looks*
right and is not enough — the release is a fade, and the fade outlasts the
banner's arrival. Give the celebration an explicit flag
(`stateGame.winCelebrationShow`, alongside the existing `featureSplashShow`),
gate the dim on it, and **snap rather than ease when releasing under a
celebration** — there is nothing to smooth when the board is behind a scrim.

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

**Measure the composed value, over frames, per SLOT — not per node.** For "is
something visible on the board" questions, three details decide whether the
number means anything, and getting any of them wrong produces a confident zero:

- **World alpha, not `node.alpha`.** Multiply down the parent chain
  (`let a = n.alpha; let p = n.parent; while (p) { a *= p.alpha; p = p.parent; }`).
  A cell at 0.38 under a container at 0.5 is at 0.19, and neither node alone says so.
- **Enumerate the 20 board cells and ask each one what it has**, rather than
  walking the tree collecting sprites. A probe that averages "every symbol sprite
  found" cannot tell a dimmed cell from a cell whose sprite was never mounted, and
  it silently includes the off-screen reel-strip symbols, which are legitimately
  faded. In this codebase the cells are one container each under
  `stage.children[4].children[0].children[0]` — find the equivalent by dumping the
  tree with labels and child counts before writing the real probe.
- **Sample on `setInterval` and record a series**, then report worst-case and a
  frame count. Instantaneous reads miss windows a few hundred ms wide, which is
  exactly the size of the bugs that show up in a screenshot but not in a test.

The counter-example is worth remembering: a probe that walked the scene for symbol
sprites and reported "every sprite found is at full alpha during the banner" was
*true* and was also useless, because the sprites in question were at 0.5 and the
probe's `min` was being taken over a set that included shadow copies at 0.5 by
design. Cell-by-cell, worst-case, over time — or don't quote a number.

**Screenshots are proof of the symptom, measurement is proof of the fix.** The
browser pane renders at a fixed size regardless of the emulated viewport, and its
`zoom` cannot crop; `drawImage` off a WebGL canvas returns blank when the context
has `preserveDrawingBuffer: false`, which is the default here. So: use screenshots
to confirm you are looking at the right moment (freeze the ticker when the
condition is detected, then screenshot), and use scene-graph sampling for the
number you actually report.

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
- **The info page's legal notice lives in `state-shared/src/legal.ts` as
  `LEGAL_NOTICE`.** It is the same paragraph in every game, so a game renders
  `<p class="wp-foot">{LEGAL_NOTICE}</p>` and never retypes it. The trademark
  line is `TM and © 2026 Engine.` — certification asked for "Stake" out of the
  disclaimer, so `2026 Stake Engine` is wrong. The wording also avoids wagering
  terms throughout ("wins/plays/rounds", not "pays/bets/spins") because the
  paragraph is player-facing in the social build too.

  Older apps still hold their own literal copy. That is deliberate — they are
  shipped, and correcting them is a separate decision — but a new game imports
  the constant.

  This hid for several games because `check_social_words.mjs` was doing two
  things wrong: it exempted the phrase "Stake Engine" as a proper noun, and
  rules 1-3 could not see the text at all once it moved into a `.ts` constant
  (rule 1 walks `.svelte` only; rules 2-3 look for `pick()` and social
  ternaries). Rule 4 now scans plain copy constants. **Every one of those gaps
  was found by injecting the bad string and checking for a non-zero exit** — the
  checker reported a clean pass in all three broken states. A guard that has
  never been seen to fail is not evidence of anything.
- Replay is a GET to `/bet/replay/{game}/{version}/{mode}/{event}`; nothing is
  wagered and `endRound` is skipped, so a round can be replayed repeatedly.
- Book amounts and `payoutMultiplier` are quoted against the **base** stake, not
  the total cost of a bought mode.
- Money is formatted against a fixed locale, never the interface language —
  switching to French must not turn `$1,000.00` into `1 000,00 $US`.
- Amounts in URL parameters are in API units: 1,000,000 = 1 coin. A launcher
  `balance=100000000` seeds 100 coins, not 100 million.

## The optimiser is stochastic, and the noise is bigger than the knob

Measured on Go Boomana: **four runs of one unchanged config** put bonus200's
break-even band anywhere between 14.9% and 29.1%, and "lost more than half the
stake" between 42% and 60%. RTP was 0.9600 in all four. The optimiser nails its
target and then lands the *shape* nearly at random inside a wide band.

- **A single before/after pair proves nothing about a scaling change.** Two
  conclusions were drawn that way during this work and both were noise, including
  one that blamed a tier's structure for what was a bad draw.
- **`scale_factor` has to be big to do anything.** The optimiser injects its own
  corrective factors of `150.0` and `0.0001` (`optimization_program/src/main.rs`),
  so values like 1.2 or 0.8 are rounding error next to them.
- **Select, do not tune.** Run the optimiser N times and keep the best draw —
  every draw is a valid weighting of real books at exactly the right RTP.
  `games/GoBoomana/optimise_best_of.py` does this, **per tier**: each mode is its
  own lookUpTable, and the verification sidecars hash the *books* (which
  optimisation never rewrites), not the weights, so tables from different runs
  mix safely. Scoring the three tiers as one sum instead lets a great bonus300
  drag a mediocre bonus200 along with it.
- **Book supply is what makes a reshape safe.** Raising the bought tiers to 1e5
  sims took bonus100's break-even band from 178 books to 1,708 and its commonest
  book from 1-in-492 to 1-in-1,666. Only then can the band carry 25-40% of the
  weight without the same round coming back visibly often.
- Budget the time: one optimisation pass over three tiers is ~4 minutes on 8
  cores at `num_show`/`num_per_fence` 5000, so a best-of-10 is ~40 minutes.

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

`references/approval-guidelines.md` is the 51-item checklist a reviewer ticks
off on the approval page, transcribed. It is scored **separately from the star
rating that decides publication**, so a game can be published with none of it
checked and the change requests arrive afterwards. Read it before the first
upload, not after.

Wild Party's guidelines review opened **ten** issues over several rounds and is
now live. Plan for a series of round trips, not one fix-everything push: each
resubmission is re-tested and can surface the next problem — two of the ten
existed only because earlier fixes were being exercised.

Four shapes from that round are worth carrying into any game:

- **The tile is three files, not one** — background, foreground and provider
  logo, which Stake composites. A submission missing the logo, or including a
  pre-composited tile, fails the thumbnail line before the art is even discussed.
- **The `oncomplete` race.** `state = 'running'` immediately followed by
  `await waitForResolve((resolve) => (oncomplete = resolve))` freezes the round
  whenever the animation completes between the two statements — the resolver was
  not armed yet, so the completion calls the previous no-op. Arm the resolver
  first, and put a ceiling on every such wait. This has caused two separate dead
  sessions in one game and the same shape was found in three more components.
  See [review-log.md](references/review-log.md#the-oncomplete-race--one-shape-five-places).
- **A guard proves absence, not correctness — and only if it can see its
  target.** The restricted-word check passed on four separate submissions that
  certification then failed: once the file was unscanned, once it was scanned but
  contained none of the shapes the rules match, once the copy lived in a
  component's `<script>` (which the template rule strips), and once the banned
  word was genuinely gone but the replacement was the wrong one. **Inject the
  exact string a reviewer reported, watch the guard fire, then remove it.** A
  clean run means nothing until the check has been shown to fail.
- **Every selectable stake must be one the server named.** Affordability may pick
  a lower rung of the server's ladder, never the balance itself — clamping with
  `Math.min(level, balance)` invents a bet level the RGS never offered. And every
  control that sets a stake has to go through the same clamp; a menu that assigns
  `stateBet.betAmount` directly skips all of it. Reproducing this needs a balance
  sitting *between* two rungs.

Two things about the rating worth knowing while planning, not at submission:

- The threshold **rose from 4.5/9 to 6/9**. A build that is compliant, well laid
  out and correctly themed but has ordinary symbol art and template motion
  scores around 4.7 — enough under the old bar, short under the new one.
- **Reskinning template spines does not answer "poor animations".** Retexturing
  changes the picture and leaves the motion identical. Budget symbol craft and
  motion as their own workstream rather than as part of a visual overhaul.
