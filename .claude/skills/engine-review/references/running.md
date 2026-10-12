# Running the game for the review (optional — ask first)

Only with the user's agreement. In this repo the user normally verifies on Stake Engine themselves (see the memory note "不做 Storybook / 瀏覽器驗證"), so default to the static audit and offer this, don't assume it.


Running the game catches what code reading misses. Offer it to the user, and do it if they agree. Two ways, best first:

**A. A real session plus request interception (preferred).** Ask the user to launch the game from their Studio dashboard and give you the game frame's URL, which carries a working `sessionID` and `rgs_url`. Serve the local build and open it with those params in headless Chromium (Playwright). Use `page.route()` to observe, block or rewrite RGS traffic. This needs no fake round data. If the RGS refuses calls from `localhost` (CORS), use the deployed build URL instead, or fall back to B.

**B. A mock RGS.** A small local HTTP server (with CORS headers) that answers the wallet and replay endpoints. Round data must be real books from the game's math files (`books_*.jsonl.zst`) or the front end's own fixtures (Storybook stories, test data). Without real books, only launch and bet-config checks are meaningful.

Interceptions that reproduce what reviewers test:

| To test | Do |
| --- | --- |
| Bet config is dynamic (#242) | Rewrite the authenticate response: `betLevels` cut to a short range (e.g. 1.00–2.00 in 4 steps), `minBet`/`maxBet` to match, `defaultBetLevel` in the middle. The game must open on that default and step only within those levels. |
| Active round (#187) | Bet at a non-default stake until a round wins (`payoutMultiplier > 0`). Abort its `/wallet/end-round` so the round stays open, then reload. The relaunched game must show and bet the open round's `amount`, not `defaultBetLevel`. |
| Zero-win end-round (#221) | Bet until a round pays 0x, then bet once more. No `/wallet/end-round` may be sent between the two. |
| Insufficient balance (#222) | Launch with zero balance (or rewrite `balance.amount` to `0` in authenticate and balance responses). Try to bet. No `/wallet/play` may leave the browser, and the game should say why. |
| Invalid rgs_url (#274) | Launch with `rgs_url=example.com`. The game must show a connection/auth error, and no RGS call may succeed anywhere else. |
| Autoplay / bonus confirmation (#104, #31) | Abort `/wallet/play` at the network, press autoplay once, then a bonus buy once. Neither press alone may send a play request. |

Viewports to use: **laptop 1024×576, popout S 400×225, popout L 800×450, mobile 425×812 (touch, `device=mobile`)**. Take a screenshot at each after one bet and look at it.

Never place more bets than a check needs, and never leave autoplay running.

## Already in this repo (option B without writing a mock)

Most apps carry a fake RGS that answers from REAL published books:

- `apps/<Game>/design/playtest_stub.js` — fake RGS over `window.fetch`, injected
  into a copy of `build/`. Header of the file explains the setup.
- `apps/<Game>/design/build_playtest_stub_data.py <publish_files dir> <out.js>` —
  builds `stub-data.js` from `math-sdk/games/<game_id>/library/publish_files`.
  Run it with `math-sdk/env/Scripts/python.exe` (needs `zstandard`).
- Serve the copy with `python -m http.server` (a `.claude/launch.json` entry at
  `E:/stake/.claude/launch.json`), open with
  `?rgs_url=stub.local&sessionID=playtest&currency=USD&lang=en`. Without those
  params the game shows "Failed to fetch" — that is the harness, not the game.
- Replay: `apps/<Game>/design/make_replay_harness.mjs` builds `build-replaytest/`.
- A hidden browser pane throttles timers to ~1s; screenshots of animations lag.
