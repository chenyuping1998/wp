---
name: game-reskin
description: >-
  The production process (製程) for every Stake Engine slot under wp/apps and its worktrees: reskin, fork or new game, from kick-off to upload. Opens with the 製程總表: what to check before touching anything, the kick-off questionnaire, the gate for each phase, the acceptance matrix and Stone's standing rules. Covers source/theme selection, mechanics and math, art direction, art requests and delivery acceptance, frontend integration, character visual acceptance, QA, thumbnails, packaging and the preflight check. Use for 製程、開新遊戲、新機、換皮、開工、需求單、生圖單、收圖驗收、畫風、美術風格、AI 感、打包前檢查、送審前檢查 and Hacksaw, Nolimit City or Pragmatic Play visual references; includes manga, comic, caricature, grime, collage, cartoon, rubber-hose and street styles.
---

# Reskinning a Stake Engine slot

## 製程總表（先讀這一節）

這份 skill 很長，因為每一段都是一次退件或一次被 Stone 糾正換來的。**動工前先讀完這一節**：它把階段、每階段要先問的事和要過的閘門排成一張表，細節再去下文與 `references/` 查。目標是一次做對，不靠退件補規格。

| 要查什麼 | 在哪 |
|---|---|
| Stone 說過「以後都要」的固定規則（角色、符號、UI、數字、分工、打包、上傳、用語） | `references/house-rules.md` |
| 生圖需求單怎麼寫、收圖當天怎麼驗、拆層補底規則 | `references/art-request-rules.md` |
| 這台 Mac 的環境坑（工作樹、隱藏窗格降速與 headless Chrome、記憶體、排程、stakecli） | `references/tooling-pitfalls.md` |
| 打包前、上傳前的一鍵檢查 | `scripts/preflight.py <app> --upload upload/<Game>` |
| skill 副本有沒有過期、共用段落有沒有走鐘 | `scripts/skills_doctor.py` |

### 動工前（每次接手都做）

1. **讀正本。** 遊戲 skill 的正本在 `/Users/stone/stake-engine/wp/.claude/skills/`。其他 worktree 裡的 `.claude/skills/` 是舊副本，不要照它做。
2. **讀這款的現況**：memory 裡這款的檔、app 的 `HANDOFF.md`、`upload/<Game>/README.md`。確認在哪棵 worktree、平台上是哪一版、**上線了沒**（上線＝核准；已上線的不動，`house-rules.md` H1）。
3. **看工作樹裡有沒有別人的東西**：`git -C <tree> status --short | wc -l`。Codex 或別的 session 可能同時在改同一款；動 `static/`、`upload/` 之前先看時間戳，有比自己新的檔就停下來問。主 `wp` 不 `git checkout`。
4. **工具就緒**：角色要用的模板在哪個分支（`spine-character`「模板在哪」）；來源遊戲的 math 在不在 `math-sdk/games/<source>`；平台上有沒有這款的 slug（`list_games`，沒有就請 Stone 當天建，stakecli 不能建）。
5. 吃記憶體的工作（數學全量、stub 產生、headless 批次、多個 build）先問再跑，一次一個。

### 開工問卷（新遊戲與換皮：一次問完，答完才 scaffold）

用 AskUserQuestion 分批問，每題附推薦；Stone 說「你決定」就照推薦並寫進 SPEC。右欄是沒先問而重做過的事。

| # | 要問定的事 | 沒先問的代價 |
|---|---|---|
| 1 | 來源遊戲、在哪棵 worktree、來源上線了沒 | 催眠猴：來源的 math 不在本機，整套重建 |
| 2 | 題材與名稱（名稱和機制名當下就過禁用字）、平台 slug | Wild Alchemy 打包完等 slug 卡半天 |
| 3 | 盤面：幾列 × 幾行，複述成「B 輪、每輪 A 格」並附格子圖 | 催眠猴「5×6」讀反，數學重建兩次 |
| 4 | 規格差異表；規格與節奏只跟哪一款參考（唯一來源） | 催眠猴節奏換三套參考、發布三次 |
| 5 | 最高贏分、購買檔位與價格、要不要 ante、最高檔的定義（自訂的機制先跑小量模擬再定） | Dragon Tide、Wild Alchemy 都做到一半才定 |
| 6 | 招牌機制的數字：多常出、出現時有派彩的比例、中位倍數；倍數物件每盤上限（中獎手／沒中手）、相加或相乘、是不是佔盤面格子 | Turf 整盤大框頻率改 5 輪；催眠猴倍數球數學改 4 次、定位改 4 次 |
| 7 | 每個數學目標的來源：Stake 規定，還是 Stone 的偏好 | Capo 把偏好當規定守了兩輪 |
| 8 | 參考遊戲裡 Stake 做不到的機制：拿掉後畫面空位放什麼 | Wild Alchemy 的 MG 左側要放什麼，發布時還沒定 |
| 9 | 畫風（評分候選＋ style frame）；WILD 要多顯眼 | Capo 整款重畫；Dragon Tide 第一批全部重生 |
| 10 | 兩隻角色是誰（都成年、MG 與 FG 不同人）、換場還是同場、站哪一側 | Wild Alchemy 角色改設定重畫 |
| 11 | 角色動作表（哪些真的會播、大獎時演不演）、姿勢（哪隻手拿道具、另一隻放哪）、模板、Spine 4.3 直跑或烘焙 | 催眠猴叉腰手修 4 次；Static Shift 中途改 runtime 路線 |
| 12 | 下注列版本 v1–v4（給截圖選）；UI 版面對齊哪一款已過審的姊妹作；盤面在各比例佔多滿 | 催眠猴 v4 整套做完改 v3；兩款被說盤面太小 |
| 13 | 沿用什麼：動作表、音效、字型不沿用來源（有 Reused assets 退件前例；工作室 logo 的 loader 是共用的，要留）；符號與道具不可是寫實槍械 | Go Banandit 5.0/9；Capo 衝鋒槍改小提琴盒 |
| 14 | 背景：MG、FG 各有哪些會動的物件（拆層交件） | Wild Alchemy 需求單中途改 |
| 15 | 做到哪一步：staged、上傳、publish；可不可以無人值守；重工作何時可跑 | Dragon Tide 上傳被擋；多個排程死在權限詢問 |
| 16 | 哪些研究素材與筆記不可進公開 repo | `hypno-monkey` 分支至今不能推 |

### 階段與閘門（沒過不往下做）

| 階段 | 做什麼 | 過關條件 |
|---|---|---|
| 0 開工 | 問卷 → SPEC（差異表、做不到清單、機制數字、動作表） | Stone 對 SPEC 回「對」 |
| 1 Scaffold（step 1） | 複製 app 與 math、改名、開得起來；列**繼承清單** | 清單逐項標「換／留／刪」：動作表、音效、字型、loader、favicon、rig、符號顯示比例常數、色票、文案、`ship.sh`、每一支 `design/check_*`（讀的是誰的資料）。`ship.sh` 與閘門已改成這款的 |
| 2 數學（step 2） | 預檢 → 模擬 → 最佳化 → 驗 | 跑之前：`math-retarget.md`「跑之前的預檢」。跑之後：RTP 在帶內且遞增、每個模式到得了最高贏分、自己的機制對 books 斷言、事件對帳、`stakecli compliance` 0 FAIL |
| 3 畫風與需求單（step 3） | style frame → §0 → 需求單 | Stone 點頭的 style frame；需求單過 `art-request-rules.md` §2–§4；全身定稿圖點頭後才拆層 |
| 4 收圖與角色 | 收圖當天驗收 → 拆層 → rig → 動作 | `art-request-rules.md` §5 的順序走完；零可見缺陷；全部動作逐格看過 |
| 5 前端（step 4、4b、5） | 換皮、表現、音效、UI、多語 | 繼承清單清零；每個符號有待機表演、背景有東西在動；`check_review_tags.py` 0 FAIL。**這一步結束就跑檢查，不是等到送審前** |
| 6 整合驗收（step 6） | 實機逐尺寸逐狀態 | 下面的驗收矩陣；官方 self-check；文案對 books。**第一次 publish 之前就要跑過**（相撲猴發了 11 版才第一次跑，當天被打 5.3） |
| 7 商店圖（step 7、7b） | 縮圖三個檔＋封面兩層 | `check_thumbnail.py` 過；200 px 合成看得出主題；**縮圖 FG 只有一個角色**（封面可以兩隻） |
| 8 打包（step 8） | `ship.sh` → `preflight.py` | preflight 0 FAIL、WARN 逐條說明；README 寫平台狀態 |
| 9 上傳與發布 | stakecli（`stake-engine-slot`） | 每一步都有 Stone 當下的同意；回報版本、商店圖換了沒、審核單開著沒 |
| 10 收尾 | HANDOFF、memory、關掉自己開的 server | 這款學到的通則已寫回 skill |

### 驗收矩陣（step 6 用；套範本、換框、換角色、換下注列之後也要重跑）

- **尺寸**：1440×900、16:10（1280×800）、4:3（1024×768）、直式 390×844 與 425×812、320×568、pop-out S（400×225）與 L（800×450）。
- **狀態**：loading、開場卡、待機 10 秒、轉動、小獎、大獎每一級（強制一局 ≥25× 與一局最高級的真 book）、FG 開場到結束、重觸發、購買選單與確認、自動轉面板、選單、規則頁、pay table、餘額不足、重播。
- **每格看什麼**：角色面向盤面、不壓盤面與框、不被背景吃掉；數字在乾淨底上且每一階讀得到；字在底板裡置中；控制項沒壓到道具或角色；沒有來源遊戲的字、圖、顏色；hover 會亮不反灰；文字（不只數字）不橫跨角色；直式角色不裁在膝蓋。
- **怎麼看**：隱藏的窗格量到的時間不能用；用獨立 headless Chrome（`tooling-pitfalls.md`）。AA 等級的細線以遊戲裡的畫面為準，不以離線預覽為準。

### 修任何一個問題時

每次修正結案前回答這四題（「只修被點名的那一處」在這些遊戲裡重複了十幾次）：

1. 同一個部位在**另一隻角色**（MG／FG）有沒有？
2. 同一個元件在**其他畫面與尺寸**有沒有？
3. **還沒上線的姊妹作**有沒有同一個問題？列出來逐款打勾（已上線的不動）。
4. 修在共用 packages 的話，**每棵 worktree** 都有了嗎？

同一個症狀修兩次還在：先懷疑量測或預覽工具，再懷疑別的層（見文末 Cross-cutting principles）。

### 回報「完成」

- 附證據：實際截圖、動作預覽、新舊對照、量到的數字；寫明在哪個尺寸、哪個狀態看的。
- 沒驗到的直接說沒驗、為什麼、差什麼。build 綠、檢查器 PASS、分數 100 都不是驗收。
- 守門腳本第一次用在這款時，先塞一個已知會錯的字串或檔，確認它真的會響。
- 需要 Stone 決定才能往下的事，當輪附兩版圖問，不要讓 build 紅著過夜。
- Stone 說「以後都要」「記起來」的事，同一輪寫進 `house-rules.md` 或對應段落；只記在 memory 的規則 Codex 看不到。

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

## 角色工具路由（現行預設優先於下文舊流程）

- 新的角色動作、Spine 動畫、圖層套動作，預設使用 `spine-character`／`spine-motion-kit`。先讀 `/Users/stone/tools/spine-generator/skills/spine-character/SKILL.md`；有圖層用 `spine-motion character`，已有 Spine4.3 骨架則用 `init`／`generate`。
- 需求單、姿勢、畫風或交件已由使用者決定時直接沿用，不重走原型選擇或重新索取同一確認。`character` 的自動骨架僅適用其支援的拳擊架式；不得硬套不相容姿勢或自行換姿勢。
- 下文 `archetype/`、#7、自製動作表與單圖網格路線僅用於維護採用該架構的既有遊戲，或使用者明確選用的路線。不要無故重寫可用 rig，也不要讓這些歷史流程蓋過新工具的預設。

A reskin is not a copy with new colours. It is a new game that happens to start
from a proven engine, and every phase below exists because skipping it produced
a real, found bug when Capo Nostra shipped out of Hot Miami — a symbol whose
rig was still a flamingo, a frame overlay that was the old game's pre-softened
art, a paytable naming a briefcase "Flamingo", a menu button sitting on top of
the paytable icon. None of those were exotic; all of them were "the old game's
version of this thing was still there and nobody looked."

Other skills do part of this and should be pulled in rather than
re-derived:

- **`stake-engine-slot`** — the build commands, the static guards, the Svelte 5
  traps, and the certification/pre-submission checklist. Load it for anything
  about *how this codebase builds and gets reviewed*, independent of reskinning.
- **`spine-character`** — default new cast motion workflow: the official
  spine-motion-kit CLI, painted full-canvas layers, Spine4.3, reports and previews.
  Read its capability limits and integration/version checks before building.
- **`hacksaw-character-motion`** (user scope) — art briefs, anatomical layer
  acceptance, existing archetype/mesh rigs and reference-motion research. Its
  historical archetype route is conditional on retaining/selecting that rig;
  research-only motion packs never ship.
- **`mesh-cast-rig`** — the older one-flat-illustration skinned mesh (Hard
  Time's single-image figures); use it only when a game keeps such a figure.
  Its `references/layered-weighted-mesh.md` is the current recipe for a figure
  delivered as a few big painted layers (head / body / arms) — what Turf War
  v6 runs — and should be read before rigging any such cast.
- **`xinstar-spec`** (user scope) — when the spec or rhythm follows one of the
  transcribed reference titles.

This skill is the sequencing and the reskin-specific gotchas on top of them.

## Before starting: confirm, don't assume

The full list of questions is the 開工問卷 in the 製程總表 at the top; ask all of
it before scaffolding. The four below are the ones with the longest history.

Four things must come from the user, not from a guess, because guessing wrong
here means redoing everything downstream of the guess:

1. **Source game.** Which existing `wp/apps/*` app is the base. If unstated,
   ask — do not pick the most recently touched one.
2. **Theme and name.** Offer a short list of name candidates if the user hasn't
   settled on one, but the FINAL name has to clear the restricted-word check
   before anything is built on it — see the note below. A theme rename that
   looks fine ("Cash Frames") can be a banned term ("cash") that only surfaces
   when `check_social_words.mjs` runs at the very end, by which point it is
   threaded through code, comments, and art requirements. Run that check (or
   its equivalent grep against Stake's restricted-word table — see
   `stake-engine-slot`'s `references/certification.md`) against every
   candidate MECHANIC NAME the moment it's chosen, not at final QA.
3. **Spec changes.** What mechanically differs from the source game, and what
   stays identical (payline count, board size, general beat/timing). Get this
   in writing as a short diff table before touching code — it is the spec for
   every phase after it, and it is worth showing back to the user once as
   "here's what I understood, confirm or correct" before scaffolding.
4. **Art style.** Not the source game's style by default, and not "whatever
   the image model draws" — that default (glossy semi-real metal, even
   micro-detail, soft glow) is what five of this repo's games already look
   like. Ask with a scored shortlist and a recommendation, as soon as theme
   and name are settled; the full procedure is step 3 below. It can be asked
   in the same AskUserQuestion round as the name if both are open.

### The user's vocabulary — pin these before acting on a tuning request

The whole glossary (輪／手、小圖／大圖、A×B＝A 列×B 行、高均率、打包／上傳／上線、
換畫風、第三版／第四版 UI…) is `references/house-rules.md` A3. When a request can
be read two ways, say back which file and field you are about to change before
changing it.

Two words in this project mean something narrower than their generic slot sense,
and reading them the generic way cost **five** optimizer re-runs on Turf War
before the intent was nailed down. When the user asks to "lower X to get more
Y", confirm which of these they mean before touching a slice:

- **"odds"** = the **pay-table payout values themselves** — the per-combination
  multipliers in `game_config.py`'s `self.paytable` (the 5×/4×/3× numbers the
  in-game pay-table modal shows). NOT the win hit-rate, NOT an optimizer slice
  hit-rate. "Lower the odds" → cut the `self.paytable` dict values, keeping the
  ladder monotonic (H1 > … > L). `sync_math_config.py` then propagates the new
  table to the frontend's `config.ts` and the pay-table modal automatically;
  the rules-modal prose does not restate symbol pay values, so it needs no edit.
- **"feature"** = the game's **signature mechanics** (for Turf War: the
  expanding wild and the full-board Big Score frame). NOT the free-spin trigger
  rate. "Trade odds for more feature" → cut the pay-table AND make those
  mechanics land more often (reel special-symbol density in `make_reels.py`, the
  full-board-frame chance in `game_config.py`) — leave the `freegame_*` trigger
  hit-rates in `game_optimization.py` alone unless the user explicitly says
  "more free spins".

The optimizer holds each mode's RTP regardless, so cutting the pay-table on its
own just makes an ordinary line win a smaller number on screen and pushes that
return into whatever the "more feature" ask points at — within the `basegame`
slice, not by moving the base/feature split.

## The workflow

### 1. Scaffold

Copy the source app's folder wholesale (`wp/apps/<Source>` →
`wp/apps/<New>`), and the source's math-sdk game folder
(`math-sdk/games/<source>` → `math-sdk/games/<new>`). At this point everything
still IS the old game under a new folder name — that's expected and correct
for step zero. Rename `game_id`/`working_name` in `game_config.py` and the
app's own name strings, but don't start re-theming yet; confirm the app boots
(blank-screen is a real failure mode here) before building on top of it.

**Then write the inheritance list** (`design/INHERITED.md`), before any
re-theming. "The source game's version of this is still here" is the single
most repeated cause of rework and of rejections in this repo (Capo 09-04 "poor
animation": motion files ~89% byte-identical to Hot Miami; Go Banandit 10-04
"Reused assets" + "Bad sound design": 33 sound files identical to three
siblings; Hard Time ran Hot Miami's rig for weeks). One line per item, each
marked 換／留／刪, and step 6 requires every line resolved:

- symbol land/win/idle motion tables (does each motion suit the NEW object? a
  boombox must not inherit a 60° spin), cast rig and cast motion table, sound
  files and sprite (sha against the source and against every sibling), fonts,
  loader, favicon, per-symbol display-scale constants, palette constants,
  transition art, rules/info copy, buy-menu copy, the submission description.
  The studio-logo loader (`WildPartyLoader.svelte`) is ours and STAYS — it is
  the Stake Engine splash that must go; Go Banandit once deleted the studio
  loader as a leftover while the layout still imported it. `grep` for imports
  before deleting any "old game" file;
- **the tooling too**: `design/ship.sh` (paths, game name, win cap, contamination
  word list — Sumo Monkey shipped with Sushi's `ship.sh` for weeks) and every
  `design/check_*` script (which path does it read, whose mechanic does it
  model? `check_rules_match_wins.mjs` defaulted to `upload/HotMiami/math` in
  two reskins and reported the source game's books). A gate that checks the
  source game is worse than no gate: delete or rewrite it, never leave it green;
- interim assets: anything standing in until final art arrives goes in
  `design/INTERIM.md`, and that list must be empty before submission (Turf
  War's transition shutter was a "temporary" placeholder for three weeks and
  17 published versions).

Also check the source math exists locally (`ls math-sdk/games/<source>`) before
planning on it; Hypno Monkey's source math had never been pushed and had to be
rebuilt.

### 2. Math

Do this early, in parallel with the art brief if possible — it does not block
on art, and its own turnaround (the Rust optimizer) is the slowest thing in
the whole pipeline, so starting it late just makes it the critical path later.

- **Before the first long run, do the pre-run checks in
  `references/math-retarget.md` ("跑之前的預檢")**: every paytable value a multiple
  of 0.1×, the theoretical maximum reaches the win cap, buy price × wincap slice
  under the ETL limit, each target tagged with its source (Stake rule or Stone's
  preference), and the signature mechanic's three numbers agreed. Each of those
  cost a full run, or several, when skipped.
- Write the new game's mechanic changes into `game_config.py` and
  `game_executables.py`/`game_events.py` as needed.
- **House RTP band (Stone, 2026-10-11): every mode of every game sits
  between 96.00% and 96.10%**, and **inside one game the modes differ:
  base spin lowest, every buy-bonus mode a little higher, the pricier buy
  higher again** (Stone, 2026-10-15) — e.g. Capo base 96.04 / bonus 96.05 /
  bonus_hits 96.06 / bonus_epic 96.08. One figure on every mode is wrong.
  Leave room under 96.10 for the buys, so don't put base at the top of the
  band. Different games may reuse figures. The source game's RTP does not
  carry over — Capo Nostra was 94.58%, Turf War 93.58%; both now sit in the
  96.0x band. To move a game that is already built
  without re-simulating, use `scripts/reweight_lut.py`
  (`references/math-retarget.md`, "Moving RTP without re-simulating").
- Set per-mode RTP targets and retarget `game_optimization.py`'s slices to
  match — see `references/math-retarget.md` for the exact discipline
  (verify the assertion locally BEFORE launching the real, multi-minute run;
  measure the real distribution after, don't assume a scale_factor did what
  it looks like it should).
- Run `run.py` (background it — this is minutes, not seconds) and confirm
  `verify_optimization_input`'s RTP-sum assertion passed, max win is
  reachable in every mode (payout==wincap rows exist in every mode's LUT),
  and book counts match `num_sim_args`.
- **Assert your own mechanic against the generated books.** Nothing in the
  toolchain does this. `run.py` proves internal consistency and
  `check_math_bundle.py` proves RTP/counts/payout hashes — neither knows what
  your Game Info promises the player. A doubling rule in Hot Miami was broken
  for **three submissions** (1,521 lost doublings in 4,000 books, all of them on
  spins where a second feature also fired) and was found by a reviewer playing
  one hand. If your game says "X happens to Y because of a win", write the
  twenty-line script that walks the books and checks it, and run it on every
  regeneration. See `references/review-findings.md`.
- **Check volatility/tail-probability compliance before considering math
  done, not after a rejection.** Stake's own dashboard checks Tail
  Probability at 5,000x/10,000x per star tier, independent of RTP. A high
  buy-cost mode (500x+) is structurally likely to fail this unless a buy
  mode's win-scaling was tuned with it in mind — see
  `references/math-retarget.md`'s section on this specifically; it is cheap
  to check locally and expensive to discover after upload.

### 3. Art brief

**Choose the art style with the user first — before a single prompt exists.**
Read `references/art-direction.md` and run its procedure; the short version:

1. **Find the theme's native medium** — what that world would have printed,
   painted or carved itself (1930s mob → pulp covers and noir halftone;
   Western → woodcut wanted posters; finance → banknote engraving). A real
   medium has physical rules a model can follow, which is the main defence
   against the default render look. Then check
   `references/hacksaw-style-atlas.md` for what Hacksaw's 183 slots chose for
   that theme and which lanes are still empty
   (`scripts/hacksaw_styles.py list --theme <word>`). For what a style looks
   like beyond the reels (intro splash, FG panels, fonts, measured palette
   per family), `references/hacksaw-style-transcripts.md` has the
   whole-game transcription of 140 titles: `hacksaw_styles.py shots --key
   <key> --kind splash|base_late` shows them from local screenshots and
   `norms --key <key>` gives the family's numbers. For crime, prison,
   horror, western, war, punk and satire themes also check
   `references/nolimit-city-styles.md` (Nolimit City's 143 slots,
   `scripts/nolimit_styles.py list --theme <word>`) and its board rules: a
   frame that is an object from the world, a colour card behind each high,
   low pays in the world's own material, one alarm colour, ugly specific
   faces. Its main finding: their art measures like a render on
   `check_style.py` and still has an identity, because the identity comes
   from those decisions, not from low colour counts. Then run the lobby test
   against Pragmatic Play, `references/pragmatic-play-styles.md`
   (`scripts/pp_styles.py list --theme <word>`): its 653 slots are all
   rendered (semi-real 38%, mascot cartoon 35%, glossy objects 20%), so any
   2D medium separates from PP, and a rendered myth, animal or candy theme
   lands in the most crowded square of the market.
2. **Shortlist three styles plus one contrast** from the catalogue (American
   comic, noir black-and-white plus one reserved accent, woodcut, engraving,
   screenprint/risograph, flat vector, cel, ink wash, constructivist, Art
   Nouveau, gouache, TV-cartoon mascot, rubber-hose 1930s, manga ink, street
   sticker-bomb, grotesque caricature, grime plus one alarm colour,
   found-object collage — and the semi-real 3D default, listed with its honest cost
   rather than silently fallen back to). **Score each** on theme fit,
   readability at a 70 px portrait cell, cast-rig compatibility, lobby
   distinctiveness at 200 px, generation control/post-process cost, and
   review risk. This scoring IS the professional opinion — give it, don't
   just list names.
3. **Ask** — AskUserQuestion, 畫風 (recommended one first, labelled
   「（推薦）」, each option's `preview` the scored card in 繁中, naming two or
   three Hacksaw or Nolimit titles that use the style) and 色彩策略, optionally
   質感. Send one `hacksaw_styles.py sheet --key <key> --kind screen` (or
   `nolimit_styles.py sheet --key <key> --kind screen`) contact sheet
   per option with it, so the user picks from pictures. Titles and sheets are
   for looking only: never in a prompt, never attached to a generation. If
   the user defers, take the recommendation and say so.
4. **Style test** — H1, one low-pay, the Wild, a background crop (and the
   cast head if in scope), composited on the real board and at 200 px, plus
   `scripts/check_style.py --sheet`. The approved result is the **style
   frame**; its measured numbers go into the brief's §0 and gate every later
   delivery.
5. **Propagate §0** — into the cast brief via `archetype/brief.py --style
   <app>/ART_BRIEF.md --style-kind <key> --style-frame <frame>` (without
   `--style` the figure comes back in the default look beside stylised
   symbols, and the generated README says it isn't ready to hand over), the
   icon drawer's line weight, frame/plate art, win-FX colours, fonts,
   transitions and the thumbnail. Keep §0's heading as `## 0…` — that is what
   `--style` extracts.

Write the art requirements doc BEFORE the frontend build reaches anything
that depends on final art, so the user can start generating while frontend
work proceeds on placeholder/inherited art. See
`references/art-brief-template.md` for the section list this needs and why
each one is there (it is not a generic "list of assets" — it encodes rules
like "differentiate symbols by silhouette/material, not hue" that come from a
specific failure).

Two requirements that are easy to state and easy to drop by the last art pass:

- **Two characters, always: one for MG (the base game), one for FG (free
  spins).** This is the user's standing rule (2026-09-28) for every game from
  now on, and it replaces the old "derive the cast count from the theme" advice
  that took Capo Nostra down to one boss in every mode. Capo is being brought
  back to two for that reason.
  - **Two different people**, not one person relit. Capo's `guy_feature.png`
    and `guy_don.png` are the Don with warmer or gold rim light. That is a
    lighting variant of the MG figure, and it does not count as the FG
    character. Lighting variants per FG tier can still sit on top of the FG
    figure.
  - **The swap is the mode change.** MG figure in the base game, FG figure
    from the FG intro until the FG outro closes, then back. Swap under the
    transition, never mid-spin and never on a win, and do not show both at
    once on the board — unless Stone asks for both on screen for that game
    (Hard Time, 2026-10-20: warden left of the board, prisoner right). Then
    they share one scale basis and one ground line, each centred in its own
    side strip with the same gap to the board, on one idle clock.
  - **The pair reads as a pair**: same §0 style, light direction and scale
    (feet on the same line, heads within about 5% of each other), and a
    contrast the player sees at a glance, such as build, gender, age or one
    colour (Hot Miami: a man in MG, a woman in FG). Their roles come from the
    new theme, never copied from the source game.
  - **Neither is a pay-symbol portrait** (standing the H1 art beside a board
    that shows H1 reads as a bug; see Capo's `Cast.svelte` note). The store
    tile still shows one character (`review-findings.md`).
  - **Both follow the selected supported rig workflow**, one brief each, and each
    may take a different archetype. Each figure is rigged and gated on its
    own. They do not share one whole motion table: each has at least one
    signature motion of its own, and neither set may be byte-identical to the
    source game's (Go Banandit 10-04, "Poor animations" ×2: MG and FG ran the
    same nine motions, identical to Boomana's).
  - **Both are adults, face the board, stay off the board and read off the
    background** — `references/house-rules.md` B2, B5, B6, B7. Body build is
    written as numbers in the brief (limb and torso widths against head width;
    `references/art-request-rules.md` §2).
- **Step 0: decide the motions first, then the pose to generate (Stone,
  2026-10-27: 「以後開始製程就要考慮到動作才方便生圖的姿勢」).** For every new
  figure, before writing the brief or generating anything (never generate
  first and think about motion afterwards):
  1. List the motions this figure must perform, MG and FG separately: the
     spine-motion default six (idle, idle_weave, punch, hit, jump, celebrate)
     plus this game's reactions, feature cut-ins, intro cards and any other
     beat that shows the character.
  2. Using the motion → pose table in "第 0 步" of
     `~/tools/spine-generator/docs/生圖交付規格.md`, write each motion's pose
     requirement at the top of the brief. For example: a punch needs a drawn
     fist, never an open palm; celebrate needs long enough arms, with the
     area under the shoulder, the armpit and the chest painted complete; leave
     a gap between the limbs and the body; elbows and knees slightly bent; the
     rear hand tucked by the cheek, elbow not flared; paint one complete
     full-body figure first and split it, never assemble a parts atlas.
  3. Confirm a spine-motion template can do it. Three exist, in different
     checkouts of the tool (`spine-character`, "模板在哪"): the right-facing
     boxing guard, the front 3/4 standing `stand34` (performers: hypnotist,
     host), and `stand34` with robe and staff (Dragon Tide). Quadruped, long
     skirt/cape or turning motions: tell Stone a new template is needed first.
     Do not force a template or swap the pose on your own.
  4. Put the split rules in the brief: paint what is hidden; both sides of a
     joint overlap, with no outline on the overlapping part, and the extra
     paint stays inside the neighbouring part's silhouette; never cut a joint
     flat.
- **A moving character is not optional — and the user chooses its pose.**
  For an existing/explicitly selected archetype rig only, run
  `hacksaw-character-motion` once per figure: show
  `gallery/overview.gif`, ask which archetype (AskUserQuestion, two questions:
  hanging arms / carrying a prop / arms crossed, then which one), then
  `python archetype/brief.py -c N --game <Name> --out design/cast_brief/
  --feet-y .. --top-y .. --style ART_BRIEF.md --style-kind <key>
  [--style-frame <frame>]` and hand the user that brief alongside the main art
  brief. It is a LAYERED brief (body / head / each arm shoulder-to-fingertip /
  fingers over a prop / prop / dangles, every layer a full-canvas PNG), because
  a single image with the arms against the body is what made three games'
  arms read 「像沒骨頭」 (2026-09-23/24): a pinned hand plus an arm that moves
  can only bow. Hands must be free (no pockets, not on the thigh, not on a
  planted prop) and a hanging forearm >= 48 px off the body at 1024 wide.
  Only STRUCTURE comes from the archetype — never trace, sample or attach
  reference art.
- **The Buy Bonus CTA button in the bet bar is its own asset, separate from
  the Buy Bonus modal's card frames** — brief both in the same pass, not just
  the modal (Capo Nostra's brief covered the cards from day one and the
  bet-bar button only got added weeks later, on request). And before telling
  the user new art for it will just show up once dropped in: check every UI
  skin the game defines, not only the default one — a "platform chrome"
  variant can silently clear the sprite slot that points at it, so a
  perfectly good asset renders as a flat rect regardless. See
  `references/art-brief-template.md` §6 and `references/dead-asset-audit.md`
  for the concrete mechanism.

### 4. Frontend: style match

This is where "reskin" earns its name, and where a source game's fingerprints
are easiest to leave in by accident. Match the NEW theme in:

- **Fonts.** A body face and a display/title face, matching the theme's own
  visual language (Capo Nostra: Art Deco stone-cut caps for anything drawn as
  "carved" — titles, tier names, big-win banners — a narrower serif for
  numbers because a display face loses to legibility at bet-bar size). Audit
  drawn-lettering vs runtime-text as one pass: everything the art shows as
  lettering (plaques, tier titles, banners, logo) sets the runtime font
  family; numbers do not follow it if it costs legibility. See
  `references/art-brief-template.md`'s lettering-audit section; the chosen
  style's catalogue entry in `references/art-direction.md` suggests a pairing.
- **Colour.** The shared UI packages default to whatever palette the LAST game
  that touched them shipped with (`components-ui-pixi` in particular carries
  a previous game's hardcoded hex values in several components — bet bar,
  modal chrome, scrollbars). Every one of these needs an explicit override in
  the new game, not an assumption that "it'll pick up the theme somehow." See
  `references/dead-asset-audit.md` for how to find the ones an eyeball pass
  misses (win-line palettes, symbol-land flash colours, splash-panel plate
  colours borrowed wholesale from a different game's own asset).
- **Button icons.** The bet-bar round-button icons have to be thin line icons
  with open gaps, or they blob at 30–48px. This was reported on Capo Nostra and
  then again on Hard Time, whose icons were Capo's old heavy set recoloured.
  Redraw them with the source game's icon drawer instead of recolouring, and
  check the source for a later redraw before copying any asset set. Full rules
  and the script are in `references/art-brief-template.md` §6.
- **Character.** Default: `spine-character` with the spine-motion-kit CLI.
  For a retained/explicit archetype rig, use `hacksaw-character-motion`'s `archetype/layered/`
  (check_layered_art → build_layered_rig → layeredFigure.ts → the game's
  motion table from `archetype/motion_table.py` → check_layered_cast), or via
  `mesh-cast-rig` for a single-image figure. It has to actually move — see
  those skills for the motion-table discipline (appendages carry the motion,
  the body barely moves; a body that sways as far as its limbs reads as a
  person swaying, which reads worse than standing still) — and it has to be
  sized against the ACTUAL side-band width at every breakpoint, including
  portrait, where a board that fills nearly the whole width leaves no band at
  all: below some threshold, don't shrink the figure, don't draw it.
  **It must read off its background.** A limited-palette style prints the cast
  and the backdrop in the same inks, so the figure dissolves (Go Banandit,
  2026-10-01: red/paper stripes on the red sun, green trousers on the green
  yard — user: 人物跟背景顏色有點重疊). Check the figure against BOTH the MG
  and FG backgrounds in the game, and separate it — Go Banandit wraps the
  spine in two `OutlineFilter`s (pixi-filters; ink 2.5px inside, paper 4px
  outside — a screenprint keyline). Darkening or blurring the plate behind
  the figure is the alternative when a keyline is off-style.
- **The background lives — EVERY new game (user rule, 2026-10-20).** A still
  plate with a slow pan is not enough: both the MG and the FG backdrop need
  things in them that move on their own, the way Pickle Panic and Static
  Shift do. Copy those two, they are the reference:
  - Pickle Panic `src/components/BackgroundFx.svelte` + `design/build_bg_fx.py`
    (worktree `wp-banandit/apps/PicklePanic/`). MG: bubbles rise inside the
    two fermentation tanks (clipped by a tank mask cut from the plate), sky
    stars pop a hard four-point glint now and then. FG: the brine gush flows
    (a displacement filter over the gush's own cut-out, with a scrolling
    streak map and a breathing strength so it surges), drops swell on the pipe
    lip, fall, splash and ring the puddle. Each layer can be switched with
    `?bgfx=flow,drip,bubbles,stars|all|none`, so they can be judged one at a time.
  - Static Shift `src/components/StudioLife.svelte`: a pigeon walks the floor
    on a 16.2 s loop (walks in, stands, steps up, walks back, turning to
    face its way), and the studio sign is the mode light (STATIC / 89.4 FM,
    flickers on a 6 s cycle in MG; ON AIR / AFTER HOURS in FG).

  How to do it:
  - **Pick from the plate's own world.** Liquid flows and drips, tanks
    bubble, sky glints, a sign flickers, a small animal crosses. Pick
    2–3 things per mode, and make MG and FG different from each other.
  - **New games: the background is DELIVERED as object layers (Stone,
    2026-11-09: 「背景也要做動態，可以先拆物件」).** One PNG per moving thing on a
    shared 1920×1080 canvas (flames, steam, particles, a swinging object, a far
    moon…), listed in the ART_REQUEST before generation
    (`new-games/wild-alchemy/SPEC.md` §3.1 is the template); the frontend
    animates layer by layer. Cutting patches out of a flat approved plate
    (masks and measured positions in a `bg_fx_meta.json`, as Pickle Panic and
    Hard Time's SceneLife did) is only for a game whose plates already exist.
    Either way all coordinates are in plate pixels; Background.svelte hands in
    the plate's on-screen position and scale, so the effects stay pinned when
    the plate crops. The plate is cover-fitted, never stretched (Deadwood's
    3:2 plate was stretched and deformed in portrait).
  - **House style holds:** flat inks, hard edges, ink outline like the
    plate, no glow, no blur, no floating motes or light shafts unless the
    style already has them.
  - **Keep it where it can be seen.** Nothing may sit behind the board at
    16:9 (Pickle's rotating-beacon trial was dropped because both lamps were
    covered), and nothing busy behind the cast (see "It must read off its
    background" above). Hide an element when the layout leaves it no room
    (StudioLife draws only above 1.3 aspect).
  - **Mostly ambient, with a few events:** steady loops (bubbles, flow) plus
    occasional ones on their own random timers (drips 1–3 s apart, glints a
    few seconds apart), so the scene does not loop visibly.
  - **One rAF clock with dt capped at 100 ms**, never setInterval (the
    review checker flags interval animation, and a tab coming back must not
    flood the scene with backlog drops). Destroy the particles you spawn.
  - Verify in the browser at 16:9, 16:10, 4:3 and portrait, in both modes,
    and check that each moving part is actually visible and on its mark.
- **The symbols live too — EVERY new game (user rule, 2026-10-27).** Turf War
  was scored 5.3 with: "The game could benefit from individual symbol
  animations, as it currently feels too static." It already had a background
  that moved, per-symbol land and win motions and a 1% idle breath; none of
  that counts, because a settled board is what the player looks at most and
  every symbol on it sat still. New games now need BOTH a living background
  (above) AND every symbol animating on its own on a settled board.
  Reference implementation: Turf War `src/game/symbolIdleMotion.ts` (one spec
  per symbol), applied in `SymbolSprite.svelte`'s resting branch, overlays in
  `SymbolArt.svelte` (mode `idle`), gate `design/check_symbol_idle.mjs` in the
  build.
  - **Two layers per symbol:** an AMBIENT loop that is always on and in the
    object's own physics (chain swings from its top, lowrider engine idles,
    bottle fizzes), plus an ACT — its signature move every 3–6 s for 0.5–1.6 s
    (Turf War 10-28: low-pay acts 5–6.5 s apart read as too weak; 3.25–4.16 s
    and about 1.6× the amplitude passed)
    (boombox thumps with speaker rings, lowrider hydraulic hop, cash rolls hop
    and squash, star turns one point, skull chatters, lightning flickers,
    brass knuckles jab with a sparkle, building's windows light up).
  - **Visible, not a breath:** each act ≥ 4% scale, ≥ 3° rotation, ≥ 3% cell
    offset, or a flicker/overlay you can see at reel size. Stay inside the
    cell (scale ≤ 1.12, offset ≤ 0.10). Rotations about the object's real
    pivot (hanging point, wheels, base), not its centre.
  - **Every symbol different** (the "all twelve move the same" rejection
    again otherwise) and **staggered**: act phase from the cell's idle phase,
    each symbol its own cycle, so only a few cells act at once — never a block
    pulse. Every period must divide the shared clock's wrap.
  - Overlays in the house style: ink sparkles, ink-outlined rings and bubbles,
    an additive warm copy of the art for lights — no blur, no glow cloud.
    Dimmed (stepped-back) and teased symbols stay still; spinning/landing
    symbols are owned by blur/land motion.
  - Verify with real frames: the browser pane throttles when hidden, so record
    with headless Chrome (puppeteer-core, deviceScaleFactor 2) over several
    spins, and look at each symbol's act sequence, specials included.
- **Presentation norms: check against the transcription, not memory.**
  `references/hacksaw-style-transcripts.md` gives the shipped numbers for
  every beat outside the reels, read out of 140 Hacksaw games' own files:
  loading bar (about 400×25 under the logo, accent on black), intro splash
  (three panels: mechanic / bonus / max win, logo and volatility pips above,
  one CLICK TO CONTINUE, frame drawn as an object from the world, one display
  face), FG panels (diegetic, painted TOTAL WIN and +N, bitmap digits), scene
  dim to 0.4 over about 0.5 s, reel timing (start stagger 0.025 s, stop
  stagger 0.2 s normal and 0.1 s turbo), the win ladder (10×:1.5 s ·
  20×:1.8 · 50×:3.6 · 100×:3.6 · 250×:7.0), symbol land/win/remove
  0.5/1.0/0.43 s, about 106 sound cues with four music stems per mode, and the
  atlas and skeleton inventory. Its §8 compares CapoNostra's constants with
  those norms; raise a difference with the user before retiming a shipped
  game. `hacksaw_styles.py game <title>` prints any one title, and
  `norms --key <key>` the norms for the chosen style's family. For the
  session flow players arrive with from Pragmatic Play (one self-playing
  intro slide with a volatility badge, a theme-object wipe into FG, the fixed
  CONGRATULATIONS / YOU HAVE WON plate in the world's material, FG scene
  recoloured, base turn about 2.7 s press to idle, FG spin-to-spin about
  3.1 s, 100x buy and 1.25x ante), see `references/pragmatic-play-styles.md`
  Part 2 and `pp_styles.py norms` / `game <title>` / `shots --phase <p>`.
  For a frameless comic board floating in a lived-in room (Break Studios'
  Stream Time on Stake: one shared 2 s idle clock, a seated cast who only
  nods, a rat on a 16 s loop hiding under the HUD, a neon sign that is the
  mode light, all reels starting together and stopping 0.09 s apart, a
  scene-only screen shake on heavy landings), see
  `references/stream-time-transcript.md`; its evidence and the
  video-measuring tools (no ffmpeg needed) are in
  `/Users/stone/stake-engine/research/stream-time/`.
  For a cast that moves like film (Xposed Studios' Iron Jaw on Stake, rated
  3 stars: two boxers flanking the board on one shared 2.00 s idle clock in
  opposite phase, Spine 4.2 with 45-59 bones, 15-19 weighted meshes, leg IK
  pinning the feet and 10-18 physics chains, only 9-13 bones keyed in idle, a 0.8-0.9 s punch fired by that fighter's
  own wild reel with a 0.2 s hold and a 0.2 s crossfade back into the
  running idle phase; reels lift 0.25 s, stop 0.23 s apart with an ease-out
  and a 0.1-cell rebound, 1.55 s lift to last stop), see
  `references/iron-jaw-transcript.md`; evidence and the point-tracking tools
  are in `/Users/stone/stake-engine/research/drive-3star/`.
  **When the spec or rhythm copies a 星城 title** (天使奧丁 6×5 tumble with
  multiplier orbs, 東海龍王 push-board respin with thrown multipliers and a
  wheel, 血月伯爵 6×6 merged giant symbols with character-to-wild and an FG
  points ladder), load the user-level `xinstar-spec` skill first and follow
  its flow: SPEC template, math rules, verbatim timing constants, cast motion
  table, Stake event format and the replay-the-captured-books acceptance. Its
  timings carry over; its extracted art and audio never ship.
- **Transitions and set-pieces.** Don't reuse the source game's transition
  motif just because the code is already wired — pick one that fits the new
  theme's own imagery (Capo Nostra replaced "a car drives past" with vault
  doors closing, because the Scatter IS a vault dial and the top tier's
  backdrop IS a vault room; the beat needed a mechanically equivalent
  replacement, not a re-skinned car). Re-derive the beat from the new theme,
  don't just recolour the old one's asset.
  **A transition that cues a cast action must wait for it.** If the scene
  swap (which also swaps MG↔FG cast) fires before the cue's clip ends, the
  figure is cut off mid-move going in AND coming out (Go Banandit: a 1.2s
  throw, swap at 0.71s). Start the cover on the action's release point,
  fire the swap only after clip length + mix, and run the transition on a
  delta-capped clock (≤100ms/frame, like pixi's ticker) — on wall time, a
  one-second hitch lets the shutter come out already shut while the spine
  sat still.
- **The free-game intro is the biggest set-piece in the game — build it.** A
  scrim with the spin count typed on it is exactly what review calls "missing
  in key moments" (Deadwood, 2026-09-26). Deal real art (the tier's card or
  plate), slam the count onto it with a burst and a sound, stand the FG
  character in front of the scrim, and start the timeline as the transition's
  black lifts, not under it. Details and timings:
  `references/review-findings.md`, "Deadwood Express, second review".
- **Plaques are painted, never generated vector with baked words.** Big-win
  tiers, the outro/retrigger plaque and the spin counter should share one
  painted plate from the art set (Deadwood reused its Buy Bonus plate) with the
  words set at runtime in the theme's fonts. A generated SVG plate is a
  gradient fill by construction, and text inside an SVG image can never use a
  web font — it renders in Georgia/Times on every machine.
- **A visible random draw (wheel, dial, pick) must not look computed.**
  Deadwood Express's multiplier wheel first printed its values in ascending
  order and always stopped dead centre on the result — both read as fake.
  Lay the segments out as a fixed scramble with every big value between small
  ones (split the set into lower/upper halves, shuffle each with a seed derived
  from the set so the same set always draws the same dial, alternate them),
  jitter the stop within the segment, and some of the time (~20%) stop near the
  edge next to a much bigger neighbour for a near miss. All of it is
  presentation: the book still decides the value, so math, books and RTP are
  untouched. See `apps/DeadwoodExpress/src/game/wheelState.svelte.ts`.
- **Hover never greys a control out — EVERY game (user rule, 2026-10-01).**
  The shared `hoverHighlight` lays a translucent WHITE box over the control
  (16% on round buttons, 12% on the Bet readout, the Buy Bonus default too);
  over painted plates that reads as 反灰 / disabled. Every game sets, in its
  `uiTheme.ts`:
  ```ts
  hoverHighlight: true,
  hoverPlateLight: 0x9c5a22,            // a WARM palette colour from ART_BRIEF §0
  buyBonusHoverSprite: 'buyBonusGlyph', // + sprites.buyBonusGlyph = the plate key
  buyBonusHoverSpriteTint: 0x9c5a22,    // warm, never grey — grey added is still 反灰
  ```
  Round buttons then redraw their own plate additive in that tint (the metal
  catches the light, like Deadwood's brass Buy Bonus), and the Bet readout gets
  a lit underline instead of a box. `hoverPlateLight` needs a `sprites.button`
  plate; a game on flat drawn buttons gets a plate first. `buyBonusHoverSprite`
  must be a SLOT name, not a raw asset key (a raw key draws the fallback box).
  Pick the tint from the game's own palette (Deadwood brass 0x74603a, Turf War
  sodium 0x9c5a22) and **verify with a real mouse hover screenshot per control**
  (headless Chrome `page.mouse.move` works; the Browser pane pauses rAF when
  hidden). Also apply it to existing games when you touch them.
  Applied 2026-10-01 to Turf War (0x9c5a22), Capo Nostra (0x74603a), Hard Time
  (0x9a7c4a — its GOLD_DARK was too faint over steel), Deadwood (0xb08d4a, flat
  discs get a lit rim) and Go Banandit (0xd24a2c). ⚠ A checkout whose shared
  theme has no `buttonCornerRadius` (wp-banandit) draws NOTHING for any hover
  roundRect (NaN radius) — its flat-disc branch uses `g.circle`; check the
  screenshot actually changed, not just that the build passed.
- **Buy Bonus hover must actually LIGHT — the "hover layer = the plate
  itself" trap (Sushi Monkey, 2026-10-06).** `buyBonusHoverSprite` draws the
  `buyBonusGlyph` slot over the plate while hovered, and it takes precedence
  over `hoverHighlight` / `hoverPlateLight`. A reskin that swaps in new plate
  art by repointing every Buy Bonus asset key at the one new PNG
  (`gbUiBuyBonus`, `…Stone`, `…StoneLit` all → `buybonus_plate.png`) leaves
  the hover layer as the SAME picture drawn over itself: with a normal blend
  and a paper tint nothing changes, and the button looks dead under the
  cursor. The template's lit layer was its own art (Go Boomana's slab
  cracking open), so it must be rebuilt for every new plate:
  - make a real lit variant — derived from the new plate is fine (Sushi
    Monkey's `design/build_buybonus_hover.py`: paper warmed toward lantern
    light plus a hard accent rim round the silhouette, no soft glow) — and
    point the `…Lit` key at it;
  - set `buyBonusHoverSpriteTint: 0xffffff` when the lit art carries its own
    colour (a paper tint multiplies it back toward the resting plate);
  - grep `assets.ts` for two keys with the same `src` — any hover/lit/on key
    sharing a file with its resting key is this bug (same for
    `button_print_on`-style button states);
  - verify: rest vs hover screenshot of the Buy Bonus must differ visibly at
    game size, on the DEFAULT skin (check `DEFAULT_SKIN` in `uiTheme.ts` —
    the skin that ships is the one whose `sprites` map applies).
- **New panel art = re-measure its text area; lettering lives inside the
  paper (Sushi Monkey, 2026-10-06).** FG intro/outro boards, win plaques and
  modal frames place their text from a TEXT_AREA ratio that was measured on
  the SOURCE game's art (Go Banandit's sign: 920×720 canvas, plank
  100..820 × 130..670, nudged 6% down). Swapping in a new board with a
  different canvas and opening, without re-measuring, put "TOTAL WIN" up on
  the new board's top beam. Whenever a panel image changes:
  - measure the writable paper on the new art in its own source pixels,
    inset past pins, clips, cloth and the rim (composite base + decor and
    overlay a 100 px grid), and derive both the area's size AND its centre
    offset from that rectangle — per board, the intro and the total differ;
  - size drawn lettering by its INK box, not its canvas (a 1600×500 title
    PNG whose ink is 1109×289 is 30% smaller than its canvas), and give each
    element a slot that is a fraction of the area's HEIGHT as well as its
    width — a width-only size (`sizes.width*.9`) grows past the paper as
    soon as the area gets wider than it is tall;
  - verify: screenshot the panel at desktop and portrait; every glyph and
    number must sit on the paper with clear margin, nothing on the frame.
- **Drawn digit sets: every glyph the same canvas, punctuation on the
  baseline (Sushi Monkey, 2026-10-06).** An ink-number component draws each
  glyph PNG at height = fontSize, so a glyph delivered on a 512×512 canvas
  when the rest are W×256 renders at HALF size ("9 / 10" with a tiny 9).
  Nine of 64 glyphs arrived that way. And a '.'/',' drawn mid-height reads
  "$21·50". Before wiring a digit delivery: check every PNG's size against
  the glyph table (Sushi's `design/check_assets.mjs` now fails the build on
  it; `design/normalize_v8_digits.py` fixes size and puts '.' on, ',' just
  under, the baseline of '0'), look at a contact sheet of all glyphs per
  set at one height, and rebuild any font generated FROM those PNGs
  (`build_receipt_font.py` → SushiReceipt.ttf) after fixing them.
- **"Is it centred?" is a measurement, not a look.** A label can be centred in
  its own box and the plate art still look off, because a crest or wing on one
  edge moves the plate's writable area off the texture centre. Measure the
  text's ink (pixels of its fill colour inside its bounds) against the plate's
  inner frame (from the PNG's alpha/colour), then correct with
  `buyBonusLabelOffsetX/Y`; the hover highlight has the same problem and takes
  `buyBonusPlateInset` + `buyBonusPlateInsetOffsetY`. On Deadwood the caption
  turned out to be centred to 1 px — the real defects were a highlight lighting
  the whole square canvas and portrait controls running off-screen
  (`references/review-findings.md` §5b). Check portrait before concluding.

Wire book events and presentation with the same discipline the source game
used (reveal/board-state consistency, sound-per-event, guard scripts) — that
part IS meant to carry over unchanged; it's the proven engine.

### 4b. 前端最常漏掉的項目（每一條都退過件或被 Stone 點過）

step 4 的長段落講「怎麼做」；這張表是做完前端時逐條打勾用的。

- **UI 版面照最近一款已過審的姊妹作，不自製下注列**（`house-rules.md` D1、D2）。Turf War 10-23 被打「Poor bet UI bar」，查出來是自製的 `TurfConsole.svelte`，10-25 換回過審款的共用下注列。下注列版本（v1–v4）每款都問；套範本後照 D3 逐尺寸逐狀態看圖，範本的已知 bug 照 D2 的清單一次修掉。
- **盤面夠大**：換下注列或開新遊戲後，量各比例下盤面佔可用高度幾成，先給 Stone 看對照（催眠猴、Dragon Tide 都被說「盤面有點小」，各放大 17–42%）。改了盤面縮放就 grep 所有讀盤面座標的元件（開場蓋板、轉場、讀數、角色夾限），含開場第一幀截圖。
- **角色面向盤面、身體與表演都不壓盤面與框**（`house-rules.md` B5、B6）。朝向只在遊戲截圖裡看臉判斷。
- **音效是一條獨立的工作**，不是沿用來源：列「每個 book 事件與 UI 動作 → 音效」的表，來源沒有的機制要新做；音檔與 sprite 不可和任何姊妹作位元組相同（`check_capo_win_audio.py` 的 SIBLINGS 檢查複製進新遊戲的 build）；BGM 是真的音樂（Static Shift 兩條 BGM 是 0.65 秒的四音循環，出貨了 7 版才發現）、每個 cue 不是同一個音移調；大獎音效每級更長（用變調做高一級會變短）；音樂用 m4a 不用 WAV。Stone 說「停輪音效」是指停輪瞬間的所有聲音。新音效要給 Stone 試聽檔，沒聽過不算驗收。
- **規則頁和 pay table 也是美術範圍**：主題卡片版型、實際符號圖、主題字型、每個機制配圖。純文字會被標「poor info tab」（Deadwood 09-26）。操作說明用實際的按鈕圖。
- **新增任何玩家看得到的字，16 個語言同時補**；pixi 文字的中日韓要 `breakWords: true`；用最長的語言（德文）截選單、按鈕、規則頁看有沒有溢出；字型查有沒有那些字（缺的符號如 ∞ 直接畫向量，不用位移補）。Static Shift 的 intro、下注列、轉場字只有英文，補了三輪。
- **重寫符號動作不可比原本小**：重寫前後列每個符號的峰值角度、位移、縮放對照（Deadwood 把中獎彈跳 1.45 改成 1.16，Poor animations ×1 變 ×2）。抄姊妹作的動畫數值前先看那個版本的審核結果，被打過 Poor animations 的版本不能當範本。
- **小獎金額的淡入要比它顯示的時間短**（共用 `FadeContainer` 預設 400–500 ms，酸黃瓜、Static Shift 各修一次）。中獎金額怎麼排（扇開成一欄／一次一個數字）照這款的姊妹作，有疑問問 Stone。
- **每一轉都會出現、會蓋住盤面的演出要有秒數上限**並寫成常數（Deadwood 的倍數輪盤每個中獎轉蓋盤面約 10 秒，改了三次）。重觸發彈窗約 2 秒自動繼續，不等點擊。
- **關鍵讀數放在盤框上或第一視線**（累積倍數、TOTAL、剩餘局數），位置先截圖給 Stone 選。值牌、倍數牌不超出自己的格子。
- **大獎等級對照表和數學的 `winLevel` 是同一套**，並用真 book 強制每一級各看一次（Dragon Tide 的大獎面板因為對照表不同從沒出現，發布後才發現）。
- **loading 與開場卡在 4:3、16:10、直式、pop-out S 各看一次**：背景要跟著整個畫面而不是主容器、文字不橫跨角色、開場卡在 400×225 走得過去、logo 不蓋符號與角色的臉。
- **多個框或牌疊在一起時，標籤畫在所有框之上**（Capo 10-14：Vault Frame 標籤被別的框蓋住）；交叉的中獎線每一條都看得到自己的數值。
- **餘額不足**：Bet、空白鍵長按、自動轉、購買卡四條路都要有訊息或反灰；押注階不因餘額被藏起來；按住 ± 不連跳。
- **共用元件的顏色、彈窗、捲軸、字型都是上一款的**：設定、訊息、重播卡這些沒有專屬美術的彈窗也要換成這款的色票與字型（Static Shift 的彈窗還是石板灰＋載不到的字型）。DOM 裡的 CSS 漸層 `check_review_tags.py` 掃不到，要自己看。

### 5. Art integration loop

Once the user starts generating art:

1. Wire what's delivered into the actual asset registry (`assets.ts` or
   equivalent) — not into a duplicate/placeholder path that then has to be
   swapped later.
2. Screenshot the real board/panels and show them back rather than describing
   what should be true. A frame asset can be technically wired and still be
   the wrong file (see the "frame.png was the pre-softening plaque" case in
   `references/dead-asset-audit.md`) — screenshotting catches what reading
   the diff does not.
3. When a delivered asset needs programmatic rework (softening a frame's
   opacity, recolouring a set, building a sheet), that's `asset-pipeline`
   work — measure before/after (opacity %, contrast ratio, coverage), don't
   eyeball it.
4. **Every round, check the delivery against the style frame, not against
   memory.** Run `scripts/check_style.py` with §0's palette, accent caps and
   gates on the whole symbol set (royals included — rendered highs next to
   flat low-pay glyphs is two styles on one reel), then go down the
   AI-tells table in `references/art-direction.md` at 180 px and 70 px:
   baked sheen/glow, detail at one even density, airbrushed gradients, fake
   halftone/hatching, generated lettering, nonsense ornament, broken counts,
   mismatched light. Reject and regenerate what fails; post-processing can
   hold a palette but cannot turn a render into the chosen style
   (quantising a render gives a posterised render).
5. **Every swapped picture means re-measuring everything positioned against
   it** — eight separate fixes across four games came from keeping the old
   art's coordinates. When a panel, frame, plate, symbol set or cast changes:
   the text area of the panel (step 4, "New panel art"), every number placed
   relative to it (item 7), the cast's bounds against the board AND the new
   frame (Static Shift's cast tips poked into the new frame's VU column), each
   symbol's ink-to-cell ratio against the inherited per-symbol display scale
   (Hard Time's lows filled only 25–31% of a cell), hover/lit variants of any
   replaced plate, FX tints and glow colours that were tuned to the old art
   (Capo's restyle left a pink glow on the new black-and-white symbols), and
   every other place the same character appears (intro card, loading screen,
   buy card, cut-in, win plaque, thumbnail, cover).
6. **A character drawn into a feature beat must move — never a static
   picture of the cast** (Stone, 2026-10-16: 「我要 FG 砍圖騰的時候角色也有動態」,
   then 「這種以後也要做」). Pickle Panic's FG chop overlay showed the chef as one
   punch illustration that only slid and tilted as a whole, and the user saw a
   still picture at the game's biggest beat. Applies to every cut-in, intro or
   outro card, upgrade/level-up overlay, win plaque or buy card that shows a
   character. Find them with
   `grep -rnE 'key="[^"]*(CutIn|Cutin|Cast|Chef|Boss|Hero|Mascot)' apps/<Game>/src`
   plus any `<Sprite>` of a character PNG inside an overlay component.
   - **Split the illustration into layers** — body, the acting limb (pivot at
     its joint), and any effect drawn into the picture (shards, sparks, speed
     lines) — on the same canvas so they stack with one anchor. Worked example:
     `apps/PicklePanic/design/build_cutin_layers.py` (wp-banandit): one seam line
     for the limb, effects picked by colour, stray islands handed to the effect
     layer, and the body's underlay kept to the joint only (the cast-ghost rule
     — below the joint it shows as a dark strip the moment the limb moves).
   - **Animate on the beat's own clock**, not a free-running tween: anticipation
     (limb pulls back ~0.14 rad and shrinks ~10%, body leans back), a fast action
     (~110 ms; limb drives forward and grows ~16%, body lunges and squashes),
     the effect layer appears only on the hit frame, then a damped ring-out
     (`amp·e^(-t/160)·sin(t/55)` — sin, so nothing jumps on the hit). Repeat per
     step when the beat repeats (a multi-level upgrade punches once per level).
     Shrink any whole-card swing the overlay already had (0.3 → 0.08 rad) so the
     layers carry the motion. `BanditMeter.svelte`'s `chef` block is the reference.
   - **Verify twice**: render the layers offline with the same formulas into a
     contact sheet/GIF (seams, holes, stray bits show at the anticipation and
     follow-through frames), then record the real beat in the game (an
     `app.ticker.add` callback that extracts frames while the beat's headline is
     visible — timers and rAF are throttled in a hidden pane; pixi v8 has no
     `worldAlpha`, filter on `visible`). A buy that opens with the beat (Pickle's
     Extra Dill starts the meter at 4) reaches it fastest.
7. **A number never sits on top of artwork — it sits on clear paper/plate**
   (Stone, 2026-10-29: 「10000數字這樣會看不清楚，很多款都這樣」). Sumo Monkey's
   intro MAX WIN card drew `10,000×` across the trophy, so the ink digits sank
   into the trophy's ink hatching. Cause, and why it recurs in reskins: the
   sibling's art (Sushi's receipt) had a **blank area painted for the figure**,
   and the reskin replaced the picture but kept the figure's x/y. Applies to
   every drawn or text figure — intro/loading feature cards (MAX WIN, spins,
   multipliers), buy cards, paytable tiles, win plaques, meters, prize badges.
   - **Whenever you swap a picture, re-check every number positioned relative
     to it.** Find them with
     `grep -rnE 'InkNumber|max_win|toLocaleString\(|figure:' apps/<Game>/src/components`
     and, for each, ask what pixels are behind it in the *new* art.
   - **Fix by moving the figure to clear ground**, computed from the art's
     measured alpha bbox (e.g. under the trophy: `artY + artH·(bboxBottom/imgH − 0.5) + size·0.8`),
     in every layout (landscape cards and portrait stacked cards). Do not fix
     it with a heavier stroke, glow or a pale panel behind the digits — a thick
     ink stroke on bold digits clogs the counters into a blob, and a panel
     hides the art.
   - **Verify with a screenshot at 1440×900, 390×844 and 320×568**: the whole
     figure must be on plain ground with a visible margin from the art, and
     readable at the smallest size.
8. Iterate against concrete, stated feedback each round. If a round's
   feedback implies a broader rule ("too colourful/messy" led to a whole
   palette-consistency pass, not just the one screen mentioned), write that
   rule down in the art brief so the next round of generated art doesn't
   need the same correction again.

### 6. Pre-submission QA

**Run this before the FIRST publish, not before the first review**, and walk the
驗收矩陣 in the 製程總表 (sizes × states) rather than a free-form playthrough.
Reviewers have found, on paths nobody had walked: resume of a winning base round,
a balance of 0, a balance between two bet rungs, holding space, holding ±, the
intro card at pop-out S, the logo at pop-out S, a bet ladder up to 750,000, the
social splash card, and JPY decimals. The playtest stub can reach all of them
(`?resume=<mode>&ramt=<stake>`, `?bal=<amount>`, `?forceBook=<id>`, a swapped
ladder); so reach them.

Two passes, and they check different things:

- **`game-qa`** (and/or manual play): does the actual presentation work —
  every book event has a payoff, no state carries over wrong between rounds,
  no silent asset failures, transitions land clean. Play through every
  feature tier at least once, including retrigger and the top tier's guarantee
  mechanic if it has one.
  Hover every bar control and Buy Bonus with a real mouse and screenshot it:
  nothing may grey out, and every one must visibly change — a Buy Bonus that
  looks identical at rest and hovered is the hover-layer-is-the-plate trap
  (step 4, "Buy Bonus hover must actually LIGHT").
  Watch the MG and FG backgrounds for a few seconds each: something in each
  must move on its own, not just pan (step 4, "The background lives").
  Watch a settled board for 10 s: every symbol must perform its own idle act
  (step 4, "The symbols live too"); `check_symbol_idle.mjs` must be in the build.
  Read every figure on the intro/loading cards, buy cards and paytable at
  1440×900 and 390×844: none may sit on top of artwork (step 5, item 7 —
  `10,000×` on the trophy).
- **`stake-compliance`**: the certification-shaped checks — restricted words
  (re-run this even if it was checked at naming time; copy drifts), the
  server-contract checklist, replay mode, RTP disclosure matching the actual
  shipped config.

**Before either of those, work through `references/review-findings.md`.** It is
the six items Stake raised on the submission that finally passed Hot Miami —
**five of them are generic to this codebase and a reskin inherits every one**:
the word "Stake" in the disclaimer, no insufficient-balance message, currencies
that render as words (XOF/XAF/XPF), a store tile with more than one character,
and portrait controls that vanish permanently after the first spin. All five are
one-line-to-one-file fixes in advance and a full round trip to discover.
The same file also covers portrait controls that run off the screen edge
(§5b) and Deadwood Express's 5/10 "poor UI": controls that stay lit after a
touch tap, and a spin halo that flares on press. Test those on a touch
pointer, not just a mouse.

**Run the runtime text audit and read every symbol value** (Sushi Monkey,
2026-10-20 — two review rounds in one day, every static guard green). In the
running game paste `.claude/skills/stake-engine-slot/scripts/social_text_audit.js`
and `__textAudit.scan()` on every screen at `?social=true&currency=GC` (restricted
words, including ones pixi draws from `<script>` literals) and in any mode for K/M
amounts — open the bet menu with the stub ladder swapped to reach 750,000. Then
force a book with the value-carrying symbol (plate/sack/coin) and read each value
tier from a native-resolution canvas grab: Sushi's copper digits on a copper
badge showed nothing at all. While building: whenever you pick a digit set for a
badge, check its glyph colour against the badge fill, and the info/pay table
must list every value the maths prize table can produce and show the symbol as
it lands. Details: stake-engine-slot `engine-self-check.md` house notes and
`review-log.md` → "Sushi Monkey 2026-10-20".

**Measure label centring and cast ghosts** (Stone, 2026-10-16: 「這種以後也要檢查」).
Pickle Panic went to the platform with an '∞' sitting low on its round badge,
four more labels 2-4px off-centre and an FG chef who left a smeared second arm
beside her body whenever she threw. None showed in a 1x screenshot. Run the
two house checks described at the end of stake-engine-slot's
`engine-self-check.md`:

    # in the running game (Browser pane javascript_tool): paste
    # .claude/skills/stake-engine-slot/scripts/ui_center_audit.js, then
    __centerAudit.glyphs(); __centerAudit.html()   # per open modal
    __centerAudit.plate(x0, x1, y0, y1)            # per bar / portrait plate

    python3 .claude/skills/game-reskin/scripts/check_cast_underlay.py \
      apps/<Game>/design/source/mg apps/<Game>/design/source/fg --out /tmp/underlay

**Scope: that script only understands the #7 own-rig cut with hanging arms**
(`layers.json` + `rig.json`). For any other rig (Spine 4.3 templates, crossed
arms, layered mesh) it proves nothing: hide every moving part and look at what
is left on the remaining layers for hand, finger or prop pixels, then watch the
motions. If it FAILs, trim the trunk outside the body line and keep a disc round each shoulder
pivot — `apps/PicklePanic/design/trim_trunk_smear.py fg|mg` is the worked
example, with both ways of finding the body's edge: a hand-measured body line
for arms that hang BESIDE a thin body (the cut copied the arm's own pixels into
the trunk, so colour cannot tell them apart), and, for arms lying ON a round
body, the trunk pixels that still match the original drawing closed into a
silhouette. It patches the atlas rectangle in place, so no repack. After the
trim a cast whose arms overlap its body may still WARN — that is real body
under the arm; look at the motion and move on. Then render the
arm-swing motions frame by frame in the game (stake-engine-slot
`verification.md`, "Measuring instead of eyeballing") — the script measures the
cause; only the motion shows whether it reads.

**Then run the presentation-tag checker** — Deadwood's second rejection was on
exactly these three tags, and every cause it had is mechanical:

    python3 .claude/skills/game-reskin/scripts/check_review_tags.py apps/<Game> \
      --palette <source game's signature hexes, e.g. ff8ede,2b0a2e,ffe6f7>

It reports, per tag: system fonts first in any CSS/pixi/canvas font stack,
words baked into loaded SVGs, gradient-built vector plates, emoji in strings,
array fills (pixi 8 draws only the first stop), source-palette hex/rgba
leftovers, count-ups formatted per frame (the "$48.3293" bug), animations on
`setInterval`, an FG intro with no art or no motion, the compact strip's tiny
stacked stepper and its empty cell, Buy Bonus lit during free spins, and an
opaque pop-up wrap. It skips components nothing imports. FAILs block; WARNs
need a decision. Then play one full feature and look at every key moment —
trigger, intro, wheel/feature beat, big win, retrigger, outro, the transition
back — because the script cannot tell whether a moment feels flat.

On top of all of that, run the reskin-specific one neither `game-qa` nor
`stake-compliance` is built to catch: **is anything still the old game's?** See `references/dead-asset-audit.md` for
the concrete greps (old game's name, old palette hex values, symbol rigs still
depicting the old cast, dead asset folders the new game never references) and
the real examples found doing this for Capo Nostra. Do this pass LAST, after
art integration is done, because earlier passes will have false negatives on
anything not wired in yet.

**Audit every player-facing description against the published BOOKS, not the
spec.** A reskin rewrites the mechanic, and the copy gets written from the spec
— which says what was *intended*. Hard Time's copy passed every guard and still
promised four things the game does not do (listed in §9). Every surface that
describes the game, all read together so they cannot disagree:

- loading-screen tips
- the opening intro / INFO card
- the game-rules modal and the pay table
- the feature splash text (`featureTiers.ts` summary + splash)
- the buy-menu labels and descriptions
- the submission description (§9)

For each sentence ask "which book event proves this?", then write a short
script that walks all four `books_*.jsonl.zst` and measures it. Do not trust
`design/check_rules_match_wins.mjs` for this: it is inherited, defaults to the
SOURCE game's bundle path (`upload/HotMiami/math`), and models that game's
mechanic. On Hard Time it reported 6,579 "mismatches", all from Hot Miami's
books.

Also check at normal and smallest supported sizes, and check whatever the
shared bottom-bar menu can overlap (Capo Nostra's Buy Bonus button sat on top
of the paytable/info icons when the menu opened — a shared-component
interaction, not something either game's own code visibly caused).

**Look at the big-win banner with a busy board behind it.** This is the screen a
reviewer stares at, and it is the one place two independently-correct dimming
layers can multiply into something that looks broken: the win volley dims every
cell that is not paying, the banner lays its own scrim over everything, and a
cell at 0.38 under a 0.5 scrim reads as an empty slot. On Capo Nostra it looked
like symbols were *vanishing* under EPIC WIN while the sticky frames on top of
them stayed perfectly visible (frames are a separate overlay and take no dim) —
which sent two rounds of investigation at the frames before anyone looked at the
board layer. See `stake-engine-slot`'s Svelte-5 traps section for the root cause
and the `untrack` fix, and its debugging section for how to measure it.

Set this up deliberately rather than hoping to catch it: force a top-tier feature
book with several sticky frames, freeze the ticker the moment the banner reaches
full opacity, and check every cell has its symbol. A reskin inherits this whole
mechanism unchanged, so if the source game has the bug, yours does too — Turf War
had it byte-for-byte from Capo Nostra.

### 7. Thumbnail

Platform-composited layers (BG/FG/logo), no burned-in title or provider text
per Stake's own convention — see the source game's thumbnail files as the
reference for what "correct" already looks like, since this part rarely
changes shape between reskins.

Treat those layers literally. **FG contains only the main character or single
theme hero cutout — exactly ONE character, never the MG+FG pair** (Stone,
2026-11-10: Dragon Tide's first thumbnail had the Dragon King and the Dragon
Princess side by side and was sent back — 「規定是只能一隻」). The two-cast rule
is for the game itself and the cover; the square thumbnail shows one. Default
to the MG lead. If the only delivered store art paints the pair touching, do
not cut them apart (that chord-cuts robes, ribbons, limbs): build the thumbnail
FG from that character's approved full-body master instead (Dragon Tide
`design/build_store_art.py`). Do not put the game title, wordmark, provider logo,
decorative typography, scenery, or a full-frame colour field in FG. Provider
art stays in the separate provider-logo file; any platform title treatment
stays outside FG. Export genuine RGBA transparency around the hero — a painted
checkerboard is an opaque RGB image and fails even if it looks transparent in
a preview. Inspect the file mode/alpha channel, not only the thumbnail viewer.

**Do not derive the store BG by simply darkening an in-game night background.**
The tile is reviewed at roughly 200 px, where a scene that looks atmospheric at
1024 px can collapse into a near-black square. Design the thumbnail background
as its own key-art layer with broad, readable value masses. A dark game may use
overcast daylight, practical lights, pale architecture, or another theme-valid
source of exposure; it does not need to reproduce the game's time of day.

Before packaging, measure the final BG — thumbnail AND cover — reduced to
200 px high, using `scripts/check_thumbnail.py --upload upload/<Game>` (or
`<BG> [FG]` for one pair). Unless the platform or user gives a different
target, on an 8-bit Rec.709 luminance scale:

- FAIL: mean luminance under 80, or more than 30% of pixels below 32;
- WARN: mean under 100 (house margin — the platform's threshold is unpublished;
  everything that went through unchanged so far measured 83–224);
- WARN: 10th percentile under 35 — acceptable for deliberate black shapes
  (Capo's Deco skyline: p10 18 at mean 165), but look at it.

**Neither the thumbnail nor the cover may be dark.** The platform does not
reject a dark upload — it rewrites it: Turf War's first cover (mean 18) came
back with "Your background image was too dark, so we automatically lightened it
by 35%", i.e. a washed-out banner nobody chose (2026-10-11).

Also inspect the BG+FG composite at 200×200. The subject, theme cue, and any
platform title safe area must remain distinct without relying on zoom. A numeric pass does not
replace this visual check; it prevents obviously underexposed tiles from
reaching it. Record the measurements in the art status or handoff.


### 7b. Cover art

Separate from the thumbnail: the wide banner on the game's Stake Engine page.
Every game ships one — 1920×1080 as BG + FG layers (like the thumbnail),
top-right and bottom-left kept clear for the page's overlays. The cover may show
both cast; the one-character limit is the thumbnail's (step 7). See `references/packaging.md` §6b.

The thumbnail's brightness rules apply to the cover too, and the cover is where
they were missed: built from a night in-game plate and then "knocked back toward
night" so the cast would pop, Turf War's cover BG measured mean 18 and the
platform auto-lightened it. Separate a dark figure by moving the backdrop
TOWARD light behind it (gamma lift + a pale haze strongest behind the cast),
never toward black; gate the BG in the cover script itself (Turf/Hard Time
`design/build_cover_art.py` → `check_brightness`, mean ≥ 100).

### 8. Package

**打包 means staging into `/Users/stone/stake-engine/upload/<Game>/` and stopping
there. No zips unless Stone asks for zips** (`ship.sh --zip`; 2026-09-20).

See `references/packaging.md` for the exact, repeatable command sequence
(sync math config → frontend build → playtest stub rebuild → stage) and
the sanity greps that must pass before calling a package final (no old game name
string anywhere in the shipped frontend, no localhost/stub references, no
playtest-only files in the upload build). Then run
`scripts/preflight.py <app> --upload upload/<Game> --source-names <source names>`:
it re-checks the things that were missed most often (house RTP band and
ordering, the frontend carrying the math's RTP figures, staged build = current
build, store art present and not dark, hover keys sharing one file, minors
wording in the art requests) and prints the manual gates that are left. Write or update a HANDOFF.md as you
go, not retroactively — it is the only place the exact retarget numbers and
the reasoning behind each scale_factor live, and reconstructing that after
the fact from a diff is much slower than writing two sentences at the time.

**On every restage after the first, do not `rsync --delete` the build over the
staged frontend.** The first pass prunes the source game's leftovers and
compresses the art; the build folder still has both. Replace only `index.html`
and `_app/immutable` — `references/packaging.md` §6 has the commands and the
check that the new bundle references nothing the staging pruned.

### 9. Submission description

When the user asks for "a description for submission" / "送審用的描述" /
"a blurb to introduce this game", produce it in **this exact shape** — it is
what the user wants every time, so don't reinvent the format:

- **Plain text in one copyable fenced block.** No `**bold**`, no `(MG)` /
  `(FG)` / `(BB)` parenthetical tags on the headers — the header word alone.
- **Sectioned, in this order**, each header on its own line with a blank line
  under it: `Base Game` → the standalone signature mechanic if it has one
  (e.g. `The Big Score`) → `Free Spins` → `Buy Bonus` → `RTP & Max Win`.
- **Every number matches the shipped config** — grid size, paylines, each
  multiplier range and cap, spins per tier, scatter counts, retrigger table,
  buy costs, the full RTP spread (base %  → top-mode %, and the spread
  figure), Max Win cap. Pull these from `game_config.py` / the optimizer
  output, not from memory.
- **Every CLAIM is checked against the published books, not just the
  numbers.** The config says what *can* happen; the books say what the player
  actually gets. The description must say the same thing as the in-game copy,
  so run the §6 copy audit first and write this from the corrected copy. Four
  wrong claims Hard Time shipped in-game and in its first description draft
  (2026-09-16), each read straight off the spec or the config:
  1. **"Multipliers on a line add together."** The SDK's
     `multiplier_method="symbol"` skips multipliers of 1, so a ×1 cell adds
     nothing: ×2 + ×1 pays ×2, not ×3. This hit 55–65% of multiplied wins.
     Recompute `meta.multiplier` from the lit/framed cells for every win.
  2. **"Multiplier range 1×–25×"** was the normal ladders' range. The
     `wincap` distribution has its own top-heavy ladder, so 50× and 100×
     really land in max-win rounds. Read ranges off the landing events across
     ALL books, including the capped ones.
  3. **"The tier opens with one Searchlight already lit."** The seed was a
     symbol dropped onto free spin 1, and the frontend ignored `seedLights`.
     Check what the board looks like at feature entry, not what the config
     key is called.
  4. **"The Scatter appears on all five reels."** True for the base strips
     only; the free-game strip had Scatters on reels 3–5, so 4- and 5-Scatter
     retriggers never occurred in 100k books. Check every strip the claim
     covers.
- **Register:** flat and factual, one paragraph per section, present
  tense, no marketing adjectives.
- **Length is a hard limit: ~150–190 words total, always** — whether or not
  the user supplied a reference. The five sections above are the WHOLE
  deliverable: no "Worth noting for review" appendix, no symbol list, no
  social/replay/controls/fonts/turbo notes, no per-mode hit odds, no QA
  claims. Hard Time's first draft (2026-09-15) ran ~900 words with all of
  that and was sent back as "太長，字數像附圖就好". Count words before
  handing it over.

Example (Turf War):

```
Base Game

Turf War is a 5×4 video slot with 14 fixed paylines, built around two core mechanics. Loot Bags land in 1×1, 2×2, or 3×3 sizes carrying a random multiplier (2×–100× on a single position, up to 10× on a 2×2, up to 8× on a 3×3) that applies to every payline crossing them; multiple Bags in one win stack additively. The Bruiser is an expanding Wild that appears on the three middle reels and fills its entire reel with Wilds before wins are evaluated — at most one per spin.

The Big Score

On any spin, in normal play or a feature, the whole grid can become a single 5×–50× Loot Bag.

Free Spins

Three tiers of free spins — Lookout (3 Scatters), Muscle (4 Scatters), and Kingpin (5 Scatters) — each award 10 spins with rising starting Bag counts and stickiness. In Kingpin, every reel a Bruiser fills stays Wild for the rest of the feature. Retriggers add 2/4/6/8 spins for 2/3/4/5 Scatters across all three tiers.

Buy Bonus

Every tier can also be entered directly via Buy Bonus at 100×, 500×, or 1000× the bet.

RTP & Max Win

RTP ranges from 96.01% (base) to 96.05% (Kingpin buy mode), with a spread of 0.04% across all four modes. Max Win is capped at 20,000× total bet in every mode.
```

## Cross-cutting principles

**Measure, don't assume — for math AND for presentation.** A `scale_factor`
change to the optimizer does not affect the resulting distribution linearly or
predictably; the only way to know it worked is to regenerate and recompute the
actual metric. The same discipline applies to visual claims — "the frame looks
softer now" needs a measured opacity percentage, not a screenshot glanced at.

**Measure in an isolated headless Chrome, not in the pane** — the working rig
(flags, the CDP driver, pixi extract instead of `Page.captureScreenshot`, two
ready-made scripts to copy) is in `references/tooling-pitfalls.md`. After about
five minutes hidden the pane throttles timers as well as rAF, so the older
advice below ("front the tab") is only a fallback.

**Distrust timing measured through a hidden/backgrounded browser pane.**
`requestAnimationFrame` freezes while the pane is hidden and catches up in one
jump when it's fronted, which makes any `performance.now()`-based interval
measured across tool calls worthless — it will show either near-zero or
enormous gaps that have nothing to do with the real timing. Front the tab
before timing anything, or measure on a clock that keeps running regardless
(the Web Audio clock, for instance, for anything sound-timing-related), and
say explicitly in any report which one was used.

**A fix that measures clean but the user still sees the bug means the probe is
wrong, not the user.** Twice on one bug the reported evidence was "0 dimmed
frames" and twice the user came back with a screenshot of the symptom. The
measurement was honest and the code change was real; the probe was answering a
narrower question than the one being asked (it sampled the sprites it could find
rather than asking each board cell what it had, and it took a `min` over a set
that legitimately contained half-alpha shadow copies). When this happens, do not
re-fix the same theory harder — go and reproduce the user's exact screenshot
first, then build the probe to distinguish the specific states that screenshot
rules in and out. Ask what the evidence CANNOT tell apart.

**When the same symptom survives two fixes, the second cause is usually in a
different layer than the first.** Here the first cause was event ordering (the
banner opened before the board's state was cleared) and the second was framework
reactivity (the ease that cleared it re-armed its own clock every frame). Fixing
ordering harder could never have worked. If two independent-looking attempts both
fail, stop and enumerate every mechanism that can produce the symptom — for
"something is invisible", that is at minimum: not mounted, `visible = false`,
own alpha, an ancestor's alpha, occluded by a sibling drawn later, masked, or
tinted to the background — and rule them out one at a time with a measurement
that can actually separate them.

**"I ported it to the sibling game" is a claim, and the only proof is a grep of
the SIBLING's own built bundle.** A fix agreed as "do both games" was made in
Capo Nostra and reported as done for both; Turf War still had the entire old
five-rung reel-stop pitch ladder, and the user caught it by ear. Editing app A
creates no pressure of any kind on app B — same repo, same file names, same
comments describing the change, and B is untouched. So for every cross-app
change, finish with a single command that would FAIL if the port were missing:

    grep -rn "<the removed identifier>" apps/A/src apps/B/src   # expect: no hits
    grep -o "<the new mapping>" apps/B/build/index.html         # expect: the new value

Run it against the built output, not just `src` — a stale `build/` is how a
correct source change still ships the old behaviour. And when the port also
needs ASSETS (audio files, art), check the sibling's asset directory too: Turf
War's code was ported while `win_tier_*.wav` existed only under Capo Nostra, so
the reskin would have shipped code referring to sounds it did not have.

**The image model's default is not a style.** A prompt that names a theme and
objects but no medium gets the same glossy semi-real render every time — it is
why Capo Nostra, Turf War, Hard Time, Deadwood Express and Soul Seal's symbol
sets are interchangeable side by side. Every prompt carries §0's technique
block (how ink goes down, how shading is made, how many inks), and the style
is chosen with the user, not inherited from the source game or from the model.

**Read a review tag's tooltip literally — it lists the causes.** "Low quality
assets" was defined as generic/AI art, *standard fonts, emoji icons, gradient
fills*; three of those four are greppable, and all three were present in a game
whose reviewers only ever wrote the tag. Audit against each noun in the
definition before concluding the problem is taste or the AI art.

**Nothing is inherited by default — everything is inherited unless replaced.**
The scaffold step copies the OLD game byte-for-byte. Every subsequent phase's
job is to find and replace what belongs to the old theme; nothing about the
copy self-identifies as "still old" — nothing highlights the leftover
`flamingo.png` reference or the palette hex value nobody re-themed. Treat "did
I actually touch this" as the default assumption to doubt, not the exception.
