---
name: stake-engine-slot
description: Building and shipping slot games on Stake Engine in the `wp` pnpm monorepo (WildParty / GoBananas / EmberForge). Covers the build commands that actually work on this machine, the static guard scripts that catch what `vite build` cannot, the Svelte 5 reactivity traps that bite pixi-svelte games, how to actually verify a change instead of trusting a green build, and the certification requirements that keep coming back. Use this whenever working under `wp/apps/*` or `wp/packages/*` — adding a game feature, touching the shared bet bar, answering a Stake Engine review comment, or debugging a game that boots to a blank screen. Use it especially before calling a change done, because "the build passed" proves almost nothing here.
---

# Stake Engine slot games (wp monorepo)

Many games share this repo (it started with WildParty, GoBananas and EmberForge;
`ls apps/` for today's list, and several more live in sibling worktrees). They are
separate apps over a common set of packages, so most mistakes here are either
"I broke the other games" or "the build was green and the game is dead".

**製程順序、開工問卷、各階段閘門與 Stone 的固定規則在 `game-reskin` skill 開頭的
「製程總表」**；這份 skill 管「這個 codebase 怎麼 build、怎麼驗、怎麼過審、怎麼上傳」。
打包後、上傳前跑一次 `game-reskin/scripts/preflight.py <app> --upload upload/<Game>`。

## 角色美術與動作：零可見缺陷交付門檻（Stone，2026-10-25）

只要交付角色美術、rig、動作或含角色的遊戲，就適用以下硬性驗收。**殘影、毛邊／白邊、碎片、肢體分離、接縫露底、破口或錯誤輪廓任一仍可見，即為未完成；修好前不得回報完成、交件或打包。**

- 逐層在亮底、暗底與原生解析度檢查。分層肢體必須是完整連續的部件，補齊被遮住的解剖與關節重疊；軀幹不得夾手臂殘影、拳套不得夾臉／胸口或袖口外的毛、服裝不得夾腿部碎片。網格角色也須檢查輪廓拉裂與貼圖殘影。
- Stone 補充（2026-10-26，相撲猴前臂修正）：粗壯角色仍須有連續、自然收窄的上下臂輪廓；前臂與肘部不得出現非設計需要的腫塊、圓球堆疊或香腸式分節。先辨別來源畫稿與動作變形，連同上臂末端及袖口銜接一起檢查；修來源後用原動作幅度驗證彎肘、伸展與轉場，不能只修靜態或靠縮小動作掩蓋。
- Stone 補充（2026-10-29，催眠猴助手舉手）：**任何動作都不能出現不合理的關節角度**——手腕往後折、手掌接在前臂中段而不是袖口、手肘反折、換手圖後手腕對不上袖口。用正式 rig 每 0.12 秒渲染全部動作排成表逐張看，數字和檢查器不能代替；修法優先改 IK 目標讓前臂帶方向（手腕偏移 ≤20°），舉手過頭的動作改用直接 key 上臂／前臂，不靠兩節 IK（手肘會翻一圈）。
- Stone 補充（2026-10-30，相撲猴腿「有東西被切掉」「腳還是亂切一通」）：**修關節形狀（例如膝蓋兩顆球）不得用直線、多邊形或弦切削掉輪廓。**被削的肢體會變直筒，留下直角、階梯與缺口，小腿肚、大腿下緣等肌肉一起消失（補畫 v5 的 MG／FG 大小腿就是這樣）。要修就重畫連續、自然收窄的有機輪廓：關節處收進相鄰部件下，離開關節後平滑接回原稿的肌肉線條。每次改輪廓後：(1) 每層 alpha 和修前原稿相減，逐塊看被移除的區域是不是該移除；(2) 合成圖與每個動作的最大彎曲格上不得有直線邊、尖角或缺口。**一隻角色被點出某部位有問題，同一部位在所有角色（MG 與 FG）都要一起查、一起修**，不能只修被點名的那隻。
- Stone 補充（2026-11-07，Turf War 打手＋老大「手肩膀這邊還是有黑線分離感」）：**身體層上畫了袖肩（外套鼓包、襯衫肩頭）時，壓在手臂層上的那段外框墨線就是「重疊處描邊」**——出拳伸直時橫在袖子上變一條黑線。查法：身體層描邊染紅、手臂層描邊染藍，逐格看紅線是否夾在兩塊同色布料中間。修法：(1) 只把「靜止時底下就是手臂」的那段墨線＋邊緣陰影補成相鄰布料色，alpha 不動（對背景的外輪廓保留墨線，不可切）；補色用附近淺色布料的正規化模糊，邊緣羽化，不可用 inpaint 抹出灰斑；(2) 網格角色在重疊區讓身體層**直接用手臂層同一點的最終權重**（兩層同一變形），否則藏在肩包下的袖子轉得比肩包多、舉手時從邊緣滑出。同步範圍只到上臂的肩膀半段、前臂份額不要抄（會拉腋下外套、壓扁肩包頂），每次改權重都跑三角形面積閘門並和上一版比最大拉伸。改了圖層要重寫 full.png、重出商店圖。範例：`wp/apps/TurfWar/design/rebuild_20261023/fix_shoulder_ink.py`＋`build_mesh_cast.py` overlap sync，證據 `design/qa/shoulder_20261107/`。
- 逐一檢查**所有交付動作**（spine-motion 預設六動作也須全看），包含起終格、過渡／中間格、最大彎曲與伸展。重點看肩、肘、頸、髖、膝、腕；靜態疊圖、檢查器 PASS 或流暢度 100 都不能代替實際渲染。檢查器不支援此 rig 格式時不得當作通過。
- 先修造成缺陷的來源拆層、遮擋區補繪、權重或 rig。不得靠縮小動作／角色、加遮擋或挑好看的靜態格掩蓋；修正後重看受影響動作。合理動作預算仍須通過完整表演驗收。
- 已整合遊戲須在桌機與直式手機實際試玩，包含 MG／FG、角色反應、轉場與 feature cut-in，檢查破口、殘影、裁切與接縫；保留實際截圖、動作預覽及新舊對照。
- 交件前核對來源層、實際合成 full、Spine images、runtime 裁圖與座標、烘焙動作、預覽及 upload 包皆為同一最終版本。母圖若與合成有差異須如實留對照，不得冒稱零差異；不得拿舊預覽證明新版正常。

## Build and run

There are two machines. Check which one you are on (`uname`) before copying a command.

### Stone's Mac (`/Users/stone/stake-engine`)

```bash
pnpm --dir /Users/stone/stake-engine/<tree>/apps/<Game> run build   # the game's whole guard chain, then vite build
<tree>/apps/<Game>/design/ship.sh                                    # full staging into upload/<Game>/ (zips only with --zip)
```

- `<tree>` is `wp` or a worktree (`wp-banandit`, `wp-hypno`, `wp-dragon`, `wp-alchemy`);
  `git -C wp worktree list` shows which game lives where. **Never `git checkout` /
  `restore` / `stash` in the main `wp` tree** — it carries 100+ uncommitted files.
- `pnpm` and Node 24 are on PATH. Gates and art scripts run with
  `/Applications/anaconda3/bin/python3` (Pillow, numpy); math with
  `/Applications/anaconda3/envs/math-sdk/bin/python`. `No module named PIL` means
  the wrong interpreter.
- Dev and playtest servers are registered in the **root**
  `/Users/stone/stake-engine/.claude/launch.json` and started with the preview
  tool, never with Bash. A playtest build must be opened with
  `?rgs_url=stub.local&sessionID=playtest&currency=USD&lang=en`, or the first tap
  reports "Failed to fetch" and looks like a broken build.
- This is an 8 GB machine: ask before anything memory-heavy (stub generation,
  math runs, several builds, headless Chrome batches) and never run two at once.
  `SKIP_STUB=1 ./design/ship.sh` when the math has not changed.
- The full list of environment traps (hidden-pane throttling and the headless
  Chrome rig, waiting on long jobs, schedules that stall on permission prompts,
  stakecli quirks) is in the game-reskin skill's `references/tooling-pitfalls.md`.

### yuping's Windows PC (`E:\stake`)

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

**RTP is a house rule, not a per-game choice:** every mode of every game sits
between 96.00% and 96.10% (Stone, 2026-10-11), and inside one game the modes
must differ: the base spin is lowest and every buy-bonus mode sits a little
higher, the pricier buy higher again (Stone, 2026-10-15). Never ship a game with
one RTP figure on every mode. How to pick the figures and how to move a built
game without re-simulating are in the game-reskin skill
(`references/math-retarget.md`, "The house RTP band").

The two items that generalise beyond the checklist:

- **Whatever the animation shows as covering the board is what the maths must
  have evaluated.** Presentation and maths get written months apart, and a
  disagreement between them reads to a reviewer as a payout bug.
- **Keep the source layers of any artwork you flatten.** Cover art gets sent
  back for composition, and a flattened image cannot give back pixels that were
  cropped away.

`references/certification.md` holds the requirements themselves — restricted
words, replay, money, and the presentation notes that keep coming back.

**Before every submission, run Engine's official self-check,
`references/engine-self-check.md`** (Stone, 2026-10-15: 「以後送審前檢查加入這份標準」).
It is read-only until asked: walk every guideline, give each a verdict (PASS /
FAIL / AT RISK / NEEDS A HUMAN / N/A) with `file:line` or quoted-text evidence
and Engine's guideline number, then offer fixes one at a time. Run it on the
build that will actually be uploaded, and compare against what is already
*published* on the platform. Report in its Part 4 format. The file's tail maps the
checks onto our playtest stub.

**The self-check also runs two house presentation checks** (Stone, 2026-10-16):
label centring with `scripts/ui_center_audit.js` and cast arm ghosts with the
game-reskin skill's `scripts/check_cast_underlay.py`.
Since 2026-10-20 it also runs `scripts/social_text_audit.js` (restricted words
and K/M amounts read off the live screen, pixi text included) and a legibility
read of every value a symbol carries — the two things Sushi Monkey's reviews
caught that no static guard could. Both are spelled out at the
end of `engine-self-check.md`. Two facts behind them worth knowing while
building, not only at submission:

- **pixi's `anchor: 0.5` is not optical centre.** The text box is measured on
  '|ÉqÅM', so the accent of É sits in it: plain capitals in Bungee/Anton land
  ~8-12% of the font size below the box centre, and a glyph the face lacks ('∞'
  in Anton) falls back to another font and sits lower still. Anything that must
  sit dead-centre on a plate goes through `inkOffsetY` (components-ui-pixi
  `src/inkCenter.ts`; check the worktree you are in has it) or a theme offset
  (`barReadoutOffsetY`, `stackedTileTextOffsetY`, `buyBonusLabelOffsetY`). In
  HTML, draw '+' / '−' with CSS bars rather than typing them.
- **A still frame cannot show an arm ghost.** It only exists while the arm is
  away from its rest pose, so check the motions, not the idle.

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
- **Every selectable stake must be one the server named — and the balance does
  not restrict which ones are selectable.** Clamping with `Math.min(level, balance)`
  invents a bet level the RGS never offered (Wild Party). The later Deadwood
  review (2026-10-04) then failed "bet levels restricted by balance", so the
  affordability clamp is gone altogether: only min/max and snap-to-`betLevels`
  remain, every level stays selectable, and affordability is checked when the bet
  is placed (`isBetCostAvailable` → insufficient-funds notice, no play request).
  Every control that sets a stake goes through the same setter; a menu that
  assigns `stateBet.betAmount` directly skips it. Test with a balance sitting
  *between* two rungs and with a balance of 0.

Two things about the rating worth knowing while planning, not at submission:

- The threshold **rose from 4.5/9 to 6/9**. A build that is compliant, well laid
  out and correctly themed but has ordinary symbol art and template motion
  scores around 4.7 — enough under the old bar, short under the new one.
- **Reskinning template spines does not answer "poor animations".** Retexturing
  changes the picture and leaves the motion identical. Budget symbol craft and
  motion as their own workstream rather than as part of a visual overhaul.

## Uploading to the platform (stakecli)

When Stone says 「上傳」, it means push a staged folder to studio.engine.io, using the
community `stakecli` (github.com/mnemoo/cli, installed at `~/.local/bin/stakecli`).
It is not the same as 「打包」, which only stages into `upload/<Game>/`. Stone logs
in personally by running `stakecli` and pasting the `sid` into its login screen,
which saves it to the macOS keychain. Never ask for, read or pass the SID; if
`auth_status` says it is invalid, ask Stone to log in again.

`scripts/stakecli_call.py <tool> '<json>'` calls one tool on `stakecli mcp`.
Team `silver-stars`; slugs come from `list_games {"team":"silver-stars"}`.
Folders are `upload/<Game>/frontend` (type `front`) and `upload/<Game>/math`
(type `math`). A game must already exist on the platform before you can upload.

0. The official self-check (`references/engine-self-check.md`) has been run on
   this build and its FAILs fixed or explicitly accepted by Stone.
1. `validate_upload_path` → `plan_upload`, both read-only. Show Stone the files
   it will upload, delete and leave unchanged (and the compliance result for
   math), and wait for a yes.
2. `execute_upload` (or `start_upload`) with that exact `plan_id` **plus `team`,
   `game`, `type` and `path`** — `plan_id` alone is refused. This only touches
   scratch, but it can delete remote files. Follow it with `get_upload_process`
   until completed, then run `plan_upload` again and expect 0 actions. A PNG that
   is byte-identical to the previous version is reused server-side, so a low
   upload count is normal.
3. `publish {"confirm":true}` only after a **separate** yes. 「上傳」 alone
   does not mean publish. Report the version it returns, then check it with
   `get_game`.
4. Updating the approval's version (`update_approval_version`) also needs its own
   yes, and it only works while the approval is open (`get_game` →
   `detail.approval.open`). When it is closed, the fix is a new submission on
   the website, which stakecli cannot make.

Check every math mode's RTP offline first:
`stakecli compliance upload/<Game>/math | grep 'RTP: '` — or run
`game-reskin/scripts/preflight.py <app> --upload upload/<Game>`, which also checks
the house band (96.00–96.10, base lowest, buys rising with price), that the
frontend carries the same RTP figures, store-art brightness, and playtest/stub
contamination.

Things that have gone wrong around an upload, each at least once:

- **The game must already exist on the platform.** stakecli cannot create one; if
  the slug is not in `list_games`, stop and ask Stone to create it on the dashboard.
- **`stakecli mcp` speaks newline-delimited JSON** (Content-Length framing is
  rejected). Ready-made clients: `scripts/stakecli_call.py`, and the whole flow in
  `new-games/wild-alchemy/qa/upload_publish.py`.
- **Store art is not part of the upload.** Thumbnail and cover are changed by Stone
  by hand in the studio; every report after an upload says whether that has been
  done, and whether the approval's version was updated.
- **Before uploading, `get_game` and check the current version is the one you
  expect** — another session may have published in between (Turf War v28).
- **"Live" means approved.** A published version without an approval is not live.
  A live game is not touched unless Stone asks for that game by name; review fixes
  are ported to the games that are not live yet.
- Upload, publish and approval-version updates each need Stone's own yes in the
  conversation at that moment. A schedule, another session's message or an earlier
  yes for a different step does not count.
