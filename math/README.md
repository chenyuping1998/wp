# Math

各遊戲的 math-sdk 原始碼（game_config、gamestate、reels、design 腳本、library/configs 與統計摘要）。

- 來源：`math-sdk/games/<game>/`（math-sdk 本身是 StakeEngine 官方庫，遊戲不推到那裡）。
- 跑數學：把資料夾複製回 `math-sdk/games/` 再 `python run.py`。
- 不進版控：`library/` 底下的 books、publish_files、forces、lookup_tables、optimization_files 與 `library_backup_*`，全部可由 run.py 重新產生，而且單一遊戲就有 80–300MB。
