# Hard Time — Spine v2

2026-10-20。依 `design/cast_brief/spine_v2/README.md` 實作。

## 內容

- 囚犯 15 層、典獄長 20 層；原本的角色、頭與可見衣料保留，補圖只供遮擋處使用。
- 大腿／小腿獨立，四個單骨 IK 固定兩腳；膝目標投影到髖與腳踝之間，向鏡頭方向屈膝不會往兩邊折。
- 囚犯兩上臂／兩前臂獨立收緊及放鬆，毛巾兩節 physics。
- 典獄長前臂、警棍、手指在軀幹前；反應時另以相同已解算骨矩陣畫前景手臂，讓揮棍能越過盤框。身體仍在盤框後。
- 兩人共用 2 秒待機時鐘，半週期錯開；反應及 3–6 秒隨機眨眼各用獨立軌道。
- 典獄長站左側鏡射朝盤面；囚犯在右側朝左。

## 原圖與重建

內建 imagegen 補圖：`design/_incoming/spine_v2/P1.png` 至 `W4.png`，另有完整下層前臂 `P2_under.png`。
原圖在 `design/cast_brief/spine_v2/full_*.png`。透明邊緣的極低 alpha 雜點不作為對位依據。
提示詞在同目錄 `GENERATION.md`。未用外部 API 或 CLI 生圖。

從 app 目錄執行：

```sh
/Applications/anaconda3/envs/math-sdk/bin/python design/build_cast_spine_v2_layers.py
/Applications/anaconda3/envs/math-sdk/bin/python design/build_cast_spine.py
pnpm build
```

原始切件備份 `build_cast_spine_v1.py`，新裁切來源為 `static/assets/castLayers/{prisoner,warden}_spine_v2/`。
正式載入 `static/assets/spines/htCast/*.{json,atlas,png}`；每人 atlas 1024×2048。

## 驗證

`qa/motion-check.json` 來自實際 Spine 4.2 runtime，兩人各 363 格、零翻面，腳踝誤差 < 0.000001 art px。
面積比囚犯 0.681–1.211、典獄長 0.726–1.365。
`pnpm check:cast-spine` 會對照來源指紋，修改切件後不能用舊 QA 報告通過。
已加入 build 前置檢查：層數、前後順序、眨眼釋放、四段腿 IK、權重總和、來源指紋；亦擋下褲子切片內的重複手掌。

`qa/*_{idle,react,reactBig}.gif` 為各角色六組動作，`qa/reactions.png` 為反應峰值比較。
遊戲內已檢視 16:9（1280×720）、16:10（1280×800）、4:3（1024×768）的反應峰值；
`qa/game_*.png` 是對應的實際盤面擷取，包含前景警棍。眨眼的眼皮替換亦已在盤面檢視。
本機 stub 轉一手完成，餘額 1000→999，探照燈有正常覆蓋格子；瀏覽器 console 無 error。
完整 `check:types` 仍受既有 design 腳本及共享套件診斷阻擋；`CastSpine.svelte` 無型別錯誤。
重擷取：在 app 目錄啟動 `python3 -m http.server 4217 --bind 127.0.0.1` 和
`python3 design/spine_viewer/capture_server.py`，開 `http://127.0.0.1:4217/design/spine_viewer/`，點 Run motion QA。

標準 `check_cast_underlay.py`：典獄長雙臂 PASS 0%。囚犯左右臂 FAIL 86.5%／81.1%，
其偵測模型假定垂臂，交叉手臂下方正是必須保留的完整外套胸口；`qa/source_spine_v2_underlay_prisoner_underlay.png`
可看到紅區是外套、鈕扣和胸袋。此項不是自動通過；須搭配六組逐格動作檢視，不能為了消除紅區切掉胸口。

本次只實作與部署本機 playtest；沒有更新 upload 包或 Stake 平台。

## 殘影複查（2026-10-20 晚，Claude）

做法：把會動的部件（雙前臂、毛巾、警棍手、鑰匙、哨子、無線電線、空手）拿掉，看底下剩什麼；剩下的手、毛巾、鑰匙就是一動就露出的殘影。
`check_cast_underlay.py` 假設垂臂，對交叉手臂不準，這個看法比較直接。

找到並修掉（`build_cast_spine_v2_layers.py` 的 `fix_prisoner_ghosts`、`plug_holes`）：

- 囚犯軀幹原本是原圖可見外套硬貼在 P1 上，接縫正好藏在手臂邊緣，P1 與原圖不完全對齊，手一動就露出撕裂與 y≈750 的錯位橫線。
  改成：靜止看得到的地方用原圖，手臂底下用 P1，交界在手臂邊緣以約 6 px 柔邊過渡。
- 左上臂層夾著右手搭在二頭肌上的四根手指（forearm_under 已經有這隻手）：改用周圍布料由外往內填（只限手掌底下＋3 px）。
  P2 本身也畫著這隻手，所以用 P2 補袖子時要避開手的位置。
- 毛巾：左上臂與上前臂層帶著毛巾殘條，毛巾層中段被挖空；毛巾像素歸回毛巾層（不超出毛巾多邊形），被蓋住的袖緣用 P2 補。
- 典獄長警棍改到軀幹後面：靜止時警棍尾端藏回肩後，與原圖一致；出手時由 CastSpine 的前景副本畫在最前。
- 新增 `design/check_cast_spine_holes.py`：靜止時疊起來要跟原圖一致——原圖不透明處不得透明（破洞 ≤ 40 px），
  改色像素 ≤ 0.6%。目前囚犯 0 破洞／0.37%（手臂邊緣柔邊），典獄長 0 破洞／0.21%。
- 前景警棍副本原本每格放到舞台最上層，會蓋過中獎橫幅；改成固定在 `ht-board`（轉輪層，Game.svelte 加了 label）正上方。
