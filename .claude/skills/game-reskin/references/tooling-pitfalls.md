# 工具與環境：踩過的坑（Stone 的 Mac）

這些都不是遊戲本身的問題，但每一條都實際吃掉過半小時到半天。動工前掃一遍，遇到症狀回來查。
路徑以 Stone 的 Mac（`/Users/stone/stake-engine`）為準；yuping 的 Windows 環境見 `stake-engine-slot` 的 Build 段。

## 目錄

- [工作樹與 git](#工作樹與-git)
- [建置、預覽、試玩網址](#建置預覽試玩網址)
- [隱藏窗格會降速：量測與截圖一律用獨立 headless Chrome](#隱藏窗格會降速量測與截圖一律用獨立-headless-chrome)
- [記憶體：這台是 8 GB](#記憶體這台是-8-gb)
- [等待長時間工作](#等待長時間工作)
- [排程與無人值守](#排程與無人值守)
- [stakecli](#stakecli)
- [Python 與 Node](#python-與-node)

## 工作樹與 git

| 樹 | 分支 | 裡面的遊戲 |
|---|---|---|
| `wp/` | `capo-turf-hardtime` | Capo Nostra、Turf War、Hard Time、Deadwood Express（Capo 系） |
| `wp-banandit/` | `go-banandit` | Go Banandit、Sushi Monkey、Pickle Panic、Static Shift、Sumo Monkey（Banandit 系） |
| `wp-hypno/` | `hypno-monkey` | Hypno Monkey（Medusa Gaze 系） |
| `wp-dragon/` | `dragon-tide` | Dragon Tide（Hypno 系） |
| `wp-alchemy/` | `alchemy` | Wild Alchemy（Hard Time 系） |

動工前先 `git -C wp worktree list` 確認，表會過期。

- **主 `wp/` 不可 `git checkout`／`git restore`／`git stash`。** 那裡長期有 100 個以上未提交的檔（平行工作的成果）。2026-09-30 一個 `git checkout .claude/launch.json` 把整個檔的未提交修改洗掉，救不回來。要撤銷自己的修改就用精準的編輯改回去。任何 git 寫入前先 `git status --short | wc -l` 看清楚有多髒。
- **stash 是所有 worktree 共用的。** 不用裸的 `git stash`／`pop`；真的要暫存就 `git stash push -u -m "<唯一標籤>"`，用 SHA apply，不要 pop。
- **共用套件的修正不會自己跑到別棵樹。** Deadwood 10-04 的審核修正只在 `wp/packages`，Go Banandit 在 `wp-banandit` 一條都沒有，10-05 才手動移植。送審前：
  ```bash
  diff -rq wp/packages <worktree>/packages -x node_modules -x dist
  ```
  每個不同的檔，先看兩邊 HEAD 是否相同（`git show HEAD:path`）：相同就是 wp 這邊多了新修正，可以整檔帶過去；不同就逐段移植。對照 `stake-engine-slot` `references/review-log.md` 最新一輪逐條確認。**不要整包複製 packages**（各樹有自己的修正）。`scripts/preflight.py` 會報差異數。
- **`wp/` 是公開 repo**（`chenyuping1998/wp`）。只在 Stone 要求時 commit／push。push 任何分支前先列 `git log origin/<分支>..HEAD --stat`，檢查有沒有參考遊戲抄錄衍生的圖檔、截圖或註解（`xinstar-spec` 硬規則 2）；`wp-hypno` 的 `hypno-monkey` 分支就因為這樣一直沒推。`math-sdk/` 的 origin 是官方 repo，永遠不推。
- commit 訊息結尾只放 `Co-Authored-By`，不要自己發明其他 trailer 或網址。
- PSD、`design/_incoming`、`design/_legacy_assets`、zip／tgz 都在 `.gitignore`，只留本機。
- **skill 的正本只有一份**：`wp/.claude/skills/`（game-reskin、stake-engine-slot、mesh-cast-rig）。其他 worktree 裡的 `.claude/skills/` 是各分支當時的舊副本，可能落後幾週（`wp-banandit` 的 game-reskin 曾停在 10-25、少一半內容）。在任何 worktree 工作都讀正本；`python3 wp/.claude/skills/game-reskin/scripts/skills_doctor.py` 會列出哪些副本過期。

## 建置、預覽、試玩網址

- 建置：`pnpm --dir <樹>/apps/<Game> run build`（會先跑該遊戲 `package.json` 裡的整串閘門）。整包打包：`<app>/design/ship.sh`（不加 `--zip` 就不壓 zip）。
- dev server、playtest server 一律登記在**根目錄** `/Users/stone/stake-engine/.claude/launch.json`，用 preview 工具啟動，不要用 Bash 跑 server。`wp/.claude/launch.json` 不是預覽實際讀的那份。
- **playtest（dist/<game>-playtest，stub RGS）一定要帶參數**：
  `http://localhost:<port>/?rgs_url=stub.local&sessionID=playtest&currency=USD&lang=en`
  少了 `rgs_url`，第一下就跳「Sorry, something went wrong — TypeError: Failed to fetch」，看起來像壞掉的 build，其實不是。stub 另支援 `?resume=<mode>&ramt=<stake>`、`?bal=<amount>`、`?forceBook=<id>`、`window.__stub.setBalance(v)`。
- **Hypno 系（Hypno Monkey、Dragon Tide）用內建 mock RGS**：dev 模式開 `?mock=1&sessionID=dev&rgs_url=mock.local`（`import.meta.env.DEV` 才有，不會出貨）。
- 規則彈窗不要用瀏覽器工具的 `scroll_to`：Popup 有一個隱藏的分身，會被捲進畫面，看起來像文字重疊（重新整理就好）。
- stub 的押注階梯只到 100。要看大金額（K／M 縮寫、版面溢出）時，把 dist 的 `stub.js` 階梯暫時換成到 1,000,000 的版本，看完還原。
- 做完就關掉自己開的 server 和背景程序，不要留著「以備不時之需」。

- **`design/stage_frontend.py` 只會新增與更新，不會刪**：build 已經沒有的檔會一直留在 `upload/<Game>/frontend/assets/`。Wild Alchemy 換皮後第一次重新 stage，還帶著 `castLayers/` 和十個 `hardTime*` 資料夾（ship.sh 的舊資料夾檢查擋下）。Wild Alchemy 那份已加「build 沒有就刪」；從別款複製這支腳本時把這段一起帶走，stage 完看 `ls upload/<Game>/frontend/assets`。
- 打包好的 bundle 沒有 dev 掛鉤（`window.__ef` 之類），`replay_cdp.mjs`／`shot_ui_cdp.mjs` 開不了選單。要看 build 出來的東西是不是真的能玩，用只送鍵盤與滑鼠的腳本對 playtest（`new-games/wild-alchemy/qa/built_play_cdp.mjs`：點掉開場卡、按空白鍵轉幾局、記錄例外、HTTP 錯誤與連到的主機）。

## 隱藏窗格會降速：量測與截圖一律用獨立 headless Chrome

Browser 窗格被隱藏時：`requestAnimationFrame` 約 1 fps；約 5 分鐘後連鎖的 `setTimeout` 降到大約一分鐘一次、CSS 動畫停住（遊戲卡在 loading）、截圖與點擊失敗。`document.visibilityState` 仍然回報 `visible`，所以程式自己不知道。**在隱藏窗格量到的任何時間都不能用**，也不能據此判斷載入或效能有問題。

可靠的作法（Static Shift 11-09 起的標準配備）：

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless \
  --remote-debugging-port=9333 --user-data-dir=<scratch>/chrome-qa \
  --window-size=<W>,<H+87> --force-device-scale-factor=2 \
  --disable-background-timer-throttling --disable-renderer-backgrounding \
  --mute-audio "<playtest url>"
```

- 用純 `--headless`：新版 Chrome 的 `--headless=new` 不開除錯埠（Wild Alchemy 11-10）。
- `+87`：視窗外框吃掉的高度；改用 `Emulation.setDeviceMetricsOverride` 指定尺寸就不用加。
- 用約 40 行的 Node CDP 腳本驅動（Node 內建 WebSocket；加一個 keep-alive 的 `setInterval`，不然 Node 會在 await 途中結束）：`Runtime.evaluate`（`awaitPromise`）、`Input.dispatchMouseEvent`、`Emulation.setDeviceMetricsOverride`。
- **`Page.captureScreenshot` 在 WebGL 頁面會卡死。** 改在頁面內用 pixi 取圖再丟給本機小 sink：
  `app.renderer.extract.canvas({target: app.stage, resolution, frame: app.screen}).toDataURL()` → `POST http://127.0.0.1:8799`（python http.server＋CORS）→ 讀 PNG。DOM 疊層（開場卡、彈窗、規則）另外用 innerText 或窗格截圖。
- **不要每次從頭寫。** 兩支現成、無 npm 相依的 CDP 腳本，複製來改遊戲名與就緒條件就能用：
  - `new-games/sea-dragon/qa-1110/timeline_cdp.mjs`（184 行）：開 headless Chrome → 等遊戲就緒 → 點掉 loading → 播一本 dev book → 印出事件匯流排每一拍的秒數，可在指定事件後 N 秒用 pixi 取圖（`--snap-on`／`--snap-at`）。拿來對時間軸。
  - `new-games/wild-alchemy/qa/replay_cdp.mjs`（362 行）＋ `make_sheet.py`、`trace_to_timeline.py`：重播一本 book，`--every N` 每 N 秒取圖、`--probe` 記錄轉輪狀態，排成縮圖總表。拿來看整局表演。說明在同資料夾 `README.md`。
  - 重播進行中不要改該 app 的 `src/`（Vite 重載會清掉頁面狀態）。
- 它吃約 85% CPU：兩次取圖之間 `app.ticker.stop()`；**build 前一定要先 kill**（沒關的話 35 秒的 build 會變 10 分鐘以上）；做完就 kill。
- `javascript_tool` 單次 45 秒逾時：長流程用 `window.__job = (async()=>{…})()` 丟出去再輪詢。
- 自動點「continue」要等提示出現 2–3 秒後，不然 FG 開場卡還沒發完就被跳過。
- pixi v8 沒有 `worldAlpha`，要自己沿 parent 鏈乘；找元件用 `visible` 過濾。

## 記憶體：這台是 8 GB

- **吃記憶體的工作先講再做，而且一次只跑一個**（Stone 10-03：三個 stub 產生器＋平行 build 把 swap 推到 19.7/20 GB，卡了一小時）。吃重的有：`build_playtest_stub_data.py`（整包 books 讀進記憶體，單次到 13 GB）、數學模擬與最佳化、同時 build 多個 app、headless Chrome 批次、角色網格工具（tri_scan、多程序渲染）。
- 開始前 `sysctl vm.swapusage`；swap 已高就先回報，不要硬疊。
- 省記憶體的路：數學沒變就 `SKIP_STUB=1 ./design/ship.sh`；stub 用串流寫法（只留抽樣到的 book id），不要整包載入；渲染工具單程序、貼圖先縮到輸出大小、只保留極值。
- **數學模擬每個 worker 會把整批 books 留在記憶體到最後**（Dragon Tide 11-10：FG 購買 3 worker × 16,666 局，swap 18/18.4 GB，寫完檔後卡在 `write_library_events` 40 分鐘）。FG 重的模式用小批：`create_books(..., batch_size=1250, threads=4)`（50,000 局分 10 批），並設 `config.write_event_list = False`；這樣 50,000 局約 15 分鐘。卡住時先確認 `library/temp_multi_threaded_files/` 每個 worker 的 books／payouts／LUT 行數一致再停，可以接著合併（`output_lookup_and_force_files`），不用重跑；範例 `math-sdk/games/dragon_tide/resume_v2.py`。只重跑最佳化器前要先 `generate_configs`，不然 `math_config.json` 是空的、Rust 會 panic `betmode index not found`。

## 等待長時間工作

- 長腳本用 `run_in_background` 跑，等它自己的完成通知。
- **不要用 `pgrep -f "<腳本名>"` 當等待條件**：迴圈自己的命令列也含那個字串，永遠比對得到。2026-10-03 一個這樣的迴圈在 ship.sh 跑完後又空轉了 12 小時。要輪詢就看結果標記（`grep -q done log`）或啟動時記下的 PID（`kill -0 $PID`）。

## 排程與無人值守

排程或背景 session 一遇到權限詢問就停在那裡，沒有人按就永遠不動（三部曲體檢 10-14、相撲猴 11-09 的排程都死在這）。所以：

- 需要寫檔到新位置、跑未允許的指令、上傳、publish 的工作，不要排成無人值守；在有人的 session 裡做。
- 真的要排程，內容只放已經允許過的唯讀檢查，並在結果裡寫清楚「卡在哪個權限」。
- 上傳、publish、更新審核版本永遠要 Stone 當下明確說好，不能由排程或別的 session 的訊息代答。

## stakecli

- 位置 `~/.local/bin/stakecli`；`STAKE_NO_UPDATE_CHECK=1`。登入只能 Stone 自己做（執行 `stakecli` 貼 sid，存進 keychain）。**不要索取、讀取或傳遞 SID。**
- 離線、免登入：`stakecli compliance upload/<Game>/math`（每模式 RTP、波動、命中率、最大獎機率、2★／3★ 判定，不到 0.1 秒）。`scripts/preflight.py --upload` 會順便檢查 96.00–96.10 與「主遊戲最低、購買遞增」。
- `stakecli mcp` 是**換行分隔的 JSON-RPC**（Content-Length 分幀會被拒）。現成客戶端：`stake-engine-slot/scripts/stakecli_call.py`；整套流程 `new-games/wild-alchemy/qa/upload_publish.py`（validate → compliance → plan → execute → scratch → publish）。
- `execute_upload`／`start_upload` 要同時給 `plan_id` **和** `team`、`game`、`type`、`path`，只給 plan_id 會被拒。
- **遊戲要先在 engine.io dashboard 建好**，stakecli 沒有建立遊戲的功能；slug 不存在就停下來請 Stone 建。
- 和上一版位元組相同的 PNG 平台會在伺服器端沿用，不會重傳，檔案數少是正常的。
- 「上線」＝平台核准。已 publish 但沒核准的版本不算上線。

## Python 與 Node

- 閘門與美術腳本用 `/Applications/anaconda3/bin/python3`（有 Pillow、numpy、OpenCV）；數學用 `/Applications/anaconda3/envs/math-sdk/bin/python`。系統 python 少套件，`No module named PIL` 就是跑錯直譯器。
- 讀不可信的下載檔時 python 加 `-I`；抄錄工具照 `xinstar-spec` 寫的 `python -I -X utf8`。
- Node 24、`pnpm` 在 PATH。spine-motion-kit 要 Node 22.18 以上。
