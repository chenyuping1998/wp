---
name: character-pipeline
description: >-
  The entry point for making a character that moves in this repo (做人物、做角色、新角色、角色動作、人物動畫、吉祥物骨架) —
  a mascot beside the reels, a fighter, any figure that has to act. Use this whenever the user wants a new character,
  character motion or animation, a Spine rig for a character, or an art brief for one, even if they don't name a tool.
  Its first step is asking whether the character is front-facing or side-facing and letting the user choose, because
  that decides which tool and art template apply: front → wp/tools/mascot-rig (weighted meshes, 8 mascot moves,
  Spine 4.3 for new games, 4.2 for old ones), side → spine-generator's `spine-motion character` (right-facing boxing guard). Use it
  before mesh-cast-rig or gb-spine-and-art when the character is new or can be redrawn in layers.
---

# Making a character: ask the pose, then pick the tool

Plan the motion first and draw second. The pose and proportions of the drawing decide how big the moves can be: on
2026-10-24 the same raised-fist motion read correctly on a template mannequin and as "a glove sitting on the hat" on an
AI-drawn monkey whose pose was never planned, and every automated check passed on both. So moves are planned and
reviewed on a placeholder, and the art brief is written from them, not the other way round.

## Step 1: ask front or side, every time

The two templates are different tools with different art specs, so nothing else (rigging, a brief, a mannequin) starts
before this is settled. Ask with AskUserQuestion, in Chinese:

- question: 這個角色要用正面還是側面姿勢？
- 正面站姿 — mascot-rig：站在盤面旁的吉祥物；揮手、指盤面、丟東西、跳起歡呼、捧腹、攤手、跳舞；手腳尾巴是加權網格，直接輸出 Spine 4.3 給遊戲
- 側面姿勢 — spine-generator：面向右的拳擊架式；出拳、受擊、閃身、跳躍、慶祝；輸出 Spine 4.3 骨架，遊戲用的 atlas 還要另外打包

If the request already says which (「正面的猴子」, 「側面拳擊手」), don't ask again; say in one line which tool you are
using. If you can't tell where the art stands, put a second question in the same call — 美術現在的狀態？ with 還沒有圖
（先用佔位人偶定動作）／有照規格拆好的圖層／只有一張整張圖 — because "one finished image" goes elsewhere (below).

If the answer is neither (three-quarter view, a quadruped, a long robe or cape), say plainly that neither template fits
and a new template would have to be built. Forcing art into the wrong template produces exactly the unreadable poses
this process exists to avoid.

## Front-facing: `wp/tools/mascot-rig`

Read `tools/mascot-rig/README.md` before the first run; it has the delivery format, every check and the reasons behind
the rig. Node is `E:\stake\tools\node-v22.23.1-win-x64` (22.18+); run from `wp`.

1. **No art yet**: `node tools/mascot-rig/mascot.ts mannequin <dir>`, then `build <dir>`, and show the user `預覽.gif`
   and `逐格.png`. Agree the move list on the mannequin. New moves go in `lib/motions.ts`: arm poses as world angles
   through `fkUpper` / `fkFore` (the other side mirrors itself), IK (`toward`) only for a hand that must land on a
   spot. Keep the pelvis at or below standing height and its tilt around 2.5°; leans belong to belly and chest.
2. **Art brief**: `node tools/mascot-rig/mascot.ts brief <file.md>`, generated from `template.json`, so it never drifts
   from what the rigger expects. The proportion rules in it (arm reach over the head, bent elbows and knees) are what
   make the moves possible; check them before the art is commissioned, not after.
3. **Delivery**: `layers/` plus a hand-marked `joints.json` (start from the mannequin's) → `build <dir>` with
   `--reels left|right` (the side the reels are on) and `--scale` for the game size. Output is Spine 4.3 by default
   (new games); `--spine 4.2` only for a game still on spine-pixi-v8 4.2.74.
4. **Review**: read `報告.md` and look at `逐格.png` yourself before calling it done, then send the user the GIF and
   sheet. While the tool was being built, three moves scored 100 everywhere and were still wrong (elbows flapping up on
   point, shrug and dance); only the frames showed it.
5. **Ship**: copy `game/` to `apps/<Game>/static/assets/spines/<name>/` and add the `assets.ts` entry the report prints.
   Animation names and events (`point`, `release`, `takeoff`, `land`) are listed in the report.

## Side-facing: spine-generator `spine-motion character`

- Template: a right-facing boxing guard, 16 fixed layer names, drawn to `docs/生圖交付規格.md` and
  `docs/pose-reference.png` in `E:\stake\spine-generator`.
- The one-line `character` command is only on the remote branch `origin/claude/motion-research-into-character`, not on
  local main. **Never check out another branch in `E:\stake\spine-generator`**: design scripts in Putt, Saucer,
  Ninja, Neon and Treasure Monkey import that checkout. Use a worktree in the scratchpad instead:
  `git -C E:/stake/spine-generator worktree add <scratch>/sg-char origin/claude/motion-research-into-character`, then
  `npm ci` there and `node bin/spine-motion.js character <layers dir>`. Without the branch, main's
  `studio/spine-motion-studio.html` (從圖層建立角色) does the same interactively.
- Output: Spine 4.3 skeleton with 6 presets (idle, idle_weave, punch, hit, jump, celebrate), `報告.md`, `預覽.gif`.
  Moves outside the presets are recipe tracks (`strike`, `poses`, `wave`, `spring`; spine-generator `docs/配方格式.md`)
  compiled with `compileRecipe`; an uppercut, an overhead hammer and a one-fist victory were built this way on the boxer
  mannequin at smoothness 100.
- Into the game: new games use the 4.3 skeleton as is; a 4.2.74 game needs mascot-rig's `lib/export42.ts` `to42`
  (IK-only skeleton; loads on spine-core 4.2.74, checked 2026-10-24). Either way the images are full-canvas region
  attachments, so the atlas still needs cropping and packing with offsets. Build that step when the
  first side character ships, and add it here.
- The checks there cover seams, flips and smoothness, not whether a pose reads. Look at the frames here too.

## Not a new character

- **One finished illustration that won't be redrawn in layers**: `mesh-cast-rig` (one mesh over the whole image;
  smaller moves, limited by the drawing).
- **Go Bananas gorilla retargeted onto a new PSD**: `gb-spine-and-art`.

## For both

- The user wants restrained, professional motion: only the character moves, never the frame or decorations; act, then
  hold still for a long time; no constant sine wobble, which is what reads as AI-made.
- Spine version (user decision 2026-10-24): **new games ship the Spine 4.3 runtime** (`@esotericsoftware/spine-pixi-v8`
  4.3.x in that app only); existing games stay on 4.2.74. Never swap an existing game to 4.3: the 4.3 runtime ignores
  the old IK / physics format, so old characters silently stop moving. Whatever ships gets replayed on its target
  runtime first (mascot-rig does this itself).
- `E:\stake\hacksaw-character-motion` is reference material for timing and ratios only; its motion packs are research
  and never ship.
