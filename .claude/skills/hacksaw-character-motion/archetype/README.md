# 換皮選角色 → 美術需求單 → 分層接入遊戲 → 自己的動作表

換皮時用這條流程：挑一個姿勢類型，直接產出美術需求單；收到分層圖後，自動建骨架、驗收、接進遊戲；
動作表從參考量出節奏和比例，寫成遊戲自己的格式。

**跟 `spineplay/motionlib.py`（動作庫）的差別**：動作庫把參考角色的**原始關鍵幀與網格**套在你的圖上，
是逐格一樣的「完美複製」，但動作包**只能研究、不能進產品**（`rig/PROVENANCE.md`）。
這條流程出貨的東西全部是我們自己的：自己的圖、自己的骨架、自己的動作表；
從參考拿的只有**結構、時序、幅度、比例**。

| 步驟 | 指令 | 產出 | 能出貨 |
|---|---|---|---|
| 1. 選姿勢 | `python archetype/brief.py --list` ＋ 給使用者看 `gallery/overview.gif` | — | — |
| 2. 需求單 | `python archetype/brief.py -c N --game 名稱 --out <dir> --feet-y .. --top-y .. --style <美術需求> --style-kind <畫風> [--style-frame 圖 ...] [--variants a,b] [--mirror]` | `README.md`、`pose_guide.png`、`layers.template.json`（＋`style_frame/`） | ✅ |
| 3. 驗收交件 | `python archetype/layered/check_layered_art.py <交件資料夾> [--variants ...]` | `delivery-check.json` | — |
| 4. 建骨架 | `python archetype/layered/build_layered_rig.py <交件資料夾>` | `layers.manifest.json` | ✅ |
| 5. 動作表 | `python archetype/motion_table.py -c N --sides anatomical --out <dir>` | `*.motion-table.{json,ts}` | ✅（量測值） |
| 6. 接遊戲 | 複製 `archetype/layered/layeredFigure.ts`，見下方 | — | ✅ |
| 7. 動作閘門 | `node archetype/layered/check_layered_cast.mjs --manifest .. --motion .. --tiers ..` | 報告 | — |
| （比對用）| `python spineplay/motionlib.py -c N -a full_screen/reaction --image full.png --gif ref.gif` | 原版動作套在新圖上的 GIF | ❌ **只在本機看** |

## 1. 選姿勢

先給使用者看 `gallery/overview.gif`（六隻並排、有編號；色塊演出，沒有原作像素），用 AskUserQuestion 問。
一題最多 4 個選項，所以分兩題：先問「垂手／扛道具／雙臂交叉」哪一類，再問哪一隻。

| # | 姿勢 | 手 | 道具／晃動物 | 反應 |
|---|---|---|---|---|
| 1 | 白西裝老大 | 雙手垂下 | 雪茄叼嘴、煙 | **無**（只有待機） |
| 2 | 扛球棒男 | 一手扛棒、一手垂下 | 球棒、頸鍊、面罩尾 | 1.0s |
| 3 | 扛球棒女 | 一手扛棒、一手垂下 | 球棒、馬尾、耳環 | 1.0s |
| 4 | 比基尼女 | 雙手垂下 | 長髮 | 1.07s |
| 5 | 綠背心壯漢 | 雙臂交叉 | 鬍子 | 0.7s（像抖一下） |
| 6 | 浣熊大盜 | — | — | 零件路線，**不適用**這條流程 |
| 7 | 香蕉猴（Go Bananas） | 雙手垂下、全身站姿 | 投擲道具、袖口／褲管／配件物理 | 九個動作，**自己的骨架可出貨**；不走本流程，見 `../gobananas_monkey/README.md` |

`--mirror`：角色要面向另一邊時用。需求單、支點、動作表會一起翻。

## 2. 需求單

`--feet-y`／`--top-y` 用這款遊戲目前人物的腳底和頭頂（換算到 1024×2048），換狀態時人才不會跳位。
參考角色都是**半身**（畫到大腿），指引圖以「頭頂到骨盆」對齊，骨盆放在身高 48% 處，腿畫成自然站姿。
參考角色的頭身比例偏大，需求單寫明「照自己角色的比例調整」。

需求單只寫**結構**：哪隻手做什麼、拿什麼、什麼會晃、圖層前後順序、關節大概在哪。
指引圖**刻意只有關節點和骨架線**；動作包裡的網格外形不會出現在任何產出裡。

**畫風從遊戲自己的美術需求帶進來**，不是從參考角色來：

| 參數 | 做什麼 |
|---|---|
| `--style <ART_BRIEF.md>` | 有 `## 0` 開頭的章節（`game-reskin` 範本的畫風鎖定）就只貼那一節，否則貼整份。標題自動降級，路徑寫成相對需求單的位置 |
| `--style-kind <key>` | 加上這種畫風**因為分層、因為網格會彎**才需要的規則：外框在切口處停筆、排線／網點只放在不動的 body/head、紙色不進圖層、黑白不用白灰去背… |
| `--style-frame <圖>` | 風格基準圖複製到 `style_frame/`，需求單列出來，每次生圖都附上 |

每一種畫風都會帶四條共同規則：提示詞前面貼 §0、**邊緣要有反鋸齒**（2 倍畫布畫或量化後 Lanczos 縮回）、
圖裡不能有字、光向視角跟符號一致。沒帶 `--style` 時，需求單最上面寫明「還不能交出去」，終端機也會警告。

平塗類畫風（漫畫、黑白、絹印）最容易交出沒有反鋸齒的圖：在交件尺寸直接畫或量化，只剩 3–7 色、邊緣 0% 半透明，
網格一轉就鋸齒。在 2 倍畫布上做再縮回，內部仍是平塗（量出來的色數不變），邊緣的反鋸齒就回來了。

## 3–4. 交件、驗收、建骨架

美術交回：每層一張 1024×2048 PNG（原位）、`full.png`、`layers.json`（照 `layers.template.json` 填實際支點）、PSD。

`check_layered_art.py` 會擋下（附白話原因）：尺寸不對、疊起來跟 `full.png` 不一樣、`body.png` 手臂後面沒補畫、
垂下的手離身體不到 48px、肩部重疊不到 40px、脖子重疊不到 30px、離畫布邊不到 40px、變化圖輪廓不一致、
任一層邊緣沒有反鋸齒（輪廓半透明 < 50%；一層不到 64 色只警告）。
有 `psd-tools` 時也會比對 PSD 每一層（圖層名稱結尾的空字元會忽略，`pytoshop` 寫的 PSD 會帶）。
交件資料夾的 `layers.json` 若已是建好的 manifest（像 Hard Time，遊戲直接載入它），關節改從骨頭原點推回，報告裡 `spec` 會註明。

`build_layered_rig.py` 依**圖層角色**綁權重。身體不會綁到手臂骨頭，手臂也不會拉動衣服；這就是分層的目的：

| 圖層 | 骨頭 |
|---|---|
| `body` | 胸／腰／骨盆／root，由上往下分段 |
| `head` | 領口以下跟軀幹、以上跟頭 |
| `arm_X` | 上臂／前臂，以「到上臂段與前臂段的距離」在手肘混合（垂手、舉手、交叉都適用），手掌全屬前臂 |
| `fingers_X` | 全屬前臂 |
| `prop_*` | 自己一根骨，掛在握它那隻手的前臂下 |
| `dangle_*` | 自己一根骨，掛在頭／胸／骨盆；根部跟父骨、越往末端越跟自己 |

骨頭名稱：`root hips waist chest neck head arm_l fore_l arm_r fore_r` ＋ 每個道具與晃動物各一根（名稱＝圖層名）。
所以遊戲的 `IDLE.dangle_chain` 就會驅動 `dangle_chain.png`。

## 5. 動作表

`motion_table.py` 量的是：各骨頭反應的峰值角度與起動延遲、snap／hold、身體抬升與側移、
手臂形狀變化（**沿骨頭 vs 垂直骨頭**，Spine 的 scaleX＝沿、scaleY＝垂直）、視差骨的推移量、
待機每根骨的幅度與週期、晃動物末端幅度。角度已換成遊戲的 y 向下慣例。

量出來的是**全尺寸的參考動作**，參考角色的手臂是獨立一張圖。在自己的網格上：

- **squash 的 k 從 0.42 開始**，用動作閘門往上找。
- 關節角度若撐破網格，**縮小的是整組**（保持比例），不要只砍其中一根。
- 反應分三級是我們的設計（trigger 1／winBig 0.75／win 0.5），不是量測值。
- 老大沒有反應動畫：遊戲的中獎反應要借其他角色的節奏，或另外設計。

⚠ 2026-09-24 的教訓：手臂「沿骨頭拉長」會讓手臂像沒骨頭。參考角色的手臂**從不**沿骨頭拉長超過 6%；
力道是上臂**變粗**、另一手前臂**變細**。`motion_table.py` 輸出的 shape 是 `[沿, 垂直]`，不要對調。

## 6. 接進遊戲

1. 圖層 PNG 與 `layers.manifest.json` 放到 `static/assets/castLayers/<角色>/`，每層在 `assets.ts` 註冊成 sprite（預載）。
2. `layeredFigure.ts` 複製到 `src/game/`。它 import 遊戲自己的 `castMotion.ts`，
   `composeBoneMatrices` 必須支援第 4 個參數 `chain`（擠壓伸展的第二組矩陣）。Turf War、Hard Time、Capo Nostra 都已支援。
3. 掛載元件參考 Hard Time 的 `src/components/CastFigureMesh.svelte`：fetch manifest → `new LayeredFigure(manifest, textures, TIERS)` →
   `stage.addChild(view)`，ticker 呼叫 `update(performance.now())`；`stateGame.castReaction` 變化時呼叫 `react(kind, now, speed)`。
4. 把動作表放進遊戲：IDLE 加上每個晃動物的列；TIERS 用量測的 trigger 表加上階梯。
5. 跑動作閘門，再在瀏覽器實際看三種反應的峰值。

## 7. 動作閘門

`check_layered_cast.mjs` 用**遊戲自己的** `castMotion` 去擺每一層網格，跑待機 32 秒，以及三級反應 × 1／2／4 倍速 × 8 個待機相位。
會擋下：圖層不共用骨架、權重不等於 1、圖層綁到不該碰的骨頭、翻面、壓到 50% 以下、拉到 1.6 倍以上、離畫布邊不到 40px。
另外回報每隻手臂的彎曲量（仿射殘差 px，含手肘正常彎曲），就是「像沒骨頭」會變大的那個數字。

## 實測（2026-09-25）

- **Hard Time 已交付的四層**：套通用流程重建，面積比 0.871–1.133、翻面 0、留白 45.72px；手工版是 0.862–1.147、0、45.72px。
- **色塊合成的扛球棒男**：8 層、13 根骨（含球棒、手指、兩條晃動物），驗收與閘門都通過。
- **負面測試**：身體破洞、垂手貼身、圖層移位、變化圖輪廓不同，這四種都會被驗收擋下。
  身體綁到手臂骨、動作放大 12 倍，這兩種會被閘門擋下。

## 界線

- 動作包、`materials/`、`--guide` 的輪廓範本：**研究用**，不進產品、不散布。
- 從參考只拿**時序、幅度、比例、結構**（PROVENANCE 的判準：只看過遊戲的人，有沒有可能得出這個結論）。
- 需求單不附任何參考圖；美術不可描、不可取樣、不可拿參考遊戲的圖當底。
- `motionlib --image` 產生的「原版動作套新圖」GIF 只用來比對，不進遊戲、不進交付資料夾。
