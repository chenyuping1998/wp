# NEON：獎圖、爆炸與聲音翻新

此版本以霓虹街頭 DJ 為統一主題，重畫七個主要符號，重製低階字牌、金額獎章與空格符號。保留原符號意義、賠付與事件；新圖使用透明輪廓，以共同的安靜盤格承托，分離高階物件、Scatter 金色及低階字牌的視覺層級。

主要符號由內建 image_gen 依既有圖的身份與動作構圖重繪。完整提示集及來源記錄在 [imagegen_prompts.json](source/neon_premium/imagegen_prompts.json)。低階字牌沿用遊戲自有 Titan One 字體，由 SVG 產生立體搪瓷質感；素材位於 `source/neon_premium/symbols/`。

參考 [Pragmatic Play 官方 Sugar Rush](https://www.pragmaticplay.com/en/games/sugar-rush/) 與 [Hacksaw 官方作品目錄](https://www.hacksawgaming.com/games/slots) 作為商業完成度的比較入口。這些不是來源素材；本次採用自己的霓虹物件、美術、DSP 音效與程式特效。設計重點是小尺寸可辨識、重擊後留出讀盤時間、聲音與畫面共用事件時點。

## 演出

爆炸分為聚能、重擊壓縮停頓、三層壓力波、實圖碎片／煙塵、遮罩內交換、逐格揭示與落位。單軸約 1.69 秒，滿盤約 2.15 秒。透明符號的碎片按 alpha 邊界切割，大塊慢、小塊快；正常混合與加亮物件分組，以控制滿盤批次數。見 [EXPLOSION_REFRESH.md](EXPLOSION_REFRESH.md)。

聲音重做 41 個原創效果與 BGM（含新增 3.2 秒人物刷碟），保留 3 個角色音色，共 44 檔。380ms 蓄力使用前後拉碟與 crossfader 切拍，重擊加入 bass drop、短和弦，揭示與落位像 sampler pad；BGM 使用斷拍、swing、稀疏 scratch fill、無縫 loop 及 450ms 跨曲淡化。人物的 125BPM 四組刷碟對應 0.6/1.08/1.56/2.04 秒動作，中斷會立即停聲；獨立 music duck 不會解除爆炸中的 duck。共用 master 提供 headroom 與壓縮，音效版本 query 避免瀏覽器／CDN 播放舊音檔。見 [NEON_AUDIO_V2.md](NEON_AUDIO_V2.md)。

## 安裝與檢查

新版使用獨立 `static/assets/sprites/goBananeonSymbolsV4/`，原 V3 保留。安裝器會同步重烘 glow／sheen、更新投擲道具別名並驗證檔案 hash，避免靜圖與得分動作引用不同素材。

```powershell
node design/build_premium_royals.mjs
python design/install_neon_premium_symbols.py design/source/neon_premium/symbols --apply
python design/install_neon_premium_symbols.py --check
node design/check_blast_presentation.mjs
node design/check_neon_audio_bus.mjs
python design/check_neon_audio.py
node design/check_types.mjs
```

開啟 `http://127.0.0.1:3019/?artReview=1` 可在無交易的預覽中播放單軸、滿盤爆炸、獎圖得分與整段演出。聲音試聽位於 `source/neon_delivery/audio_preview/`；耳機、手機喇叭及中低階 GPU 的實際聽感與幀率，仍需分裝置驗收，不以素材尺寸或程式測試替代美術與聽覺評審。
