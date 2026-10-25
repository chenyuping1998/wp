# The checklist

Work through every item. Numbers in brackets are Engine's guideline IDs. "In this repo" notes at the end point at where each usually lives in the `wp` monorepo and what has failed before.


Numbers in brackets are Engine's guideline IDs; use them in the report so the studio can match review feedback.

### Pre-checks

**[181] Authenticates with the RGS on launch.**
`/wallet/authenticate` is called on load against `rgs_url` with the URL's `sessionID`, returns 200, and the game carries on loading.
Code: confirm the host comes only from `rgs_url` (with `https://` added when missing) and that no dev/staging host is left in. Any hardcoded RGS host is a FAIL here and in #274.

**[274] Fails correctly with an invalid rgs_url.**
With `rgs_url=example.com` the game must show a clear connection or authentication error and must not continue as if connected.
FAIL: the game loads normally, sits on an endless spinner with no message, or reaches an RGS some other way (a fallback or hardcoded host).

**[183] Pressing bet sends a successful play request.**
The bet button sends `/wallet/play` to `rgs_url` with `{ sessionID, amount, mode }` and the game plays out the returned round.

**[275] No Stake Engine loader.**
The old "Powered By Stake engine" loader (an animated logo from earlier templates) must not appear at any point: launch, reload, replay, reconnect. The studio's own loader is fine.
Code: search case-insensitively for `stake engine`, `stake-engine`, `stakeengine`, `powered by stake`, `engine-loader`, `engineLoader`, and for loader images, GIFs or Lottie files carrying that branding. Check replay mode too. Any hit that can show to a player is a FAIL.

### Compliance

**[213] Title is unique and avoids restricted terms.**
The game's title must not contain: Megaways, XWays (or any variation), Enhanced, Boosted (or synonyms), RTP or an RTP percentage, "Gates of…", "…Bonanza", Olympus, Rush, Kraken, Waylanders, or anything implying a tie to another publisher or series. Check the title in the code, the HTML `<title>`, the logo text and the loading screen.

**[217] No offensive or inappropriate content.** NEEDS A HUMAN unless you can view the images.
No hateful, discriminatory, sexual, gory, extremist or illegal content, and **no imagery of minors** (babies, children, teenagers). If you can view image assets, look through the symbols, backgrounds and characters and list anything doubtful.

**[253] Distinct from existing titles.** NEEDS A HUMAN.
Fails if two or more of these closely resemble an existing game or series: title, logo/tile, main character or symbols, theme and art style, core mechanic, overall presentation. Flag anything that resembles a well-known slot.

### Bet levels (RGS)

**[242] Uses every bet parameter from authenticate.**
`minBet`, `maxBet`, `stepBet`, `defaultBetLevel` and `betLevels` must all come from the authenticate response. The game opens on `defaultBetLevel`, steps through `betLevels` only, stops at both ends, and never shows or sends a value outside them.
FAIL: a hardcoded bet list or default, a free-entry field allowing other values, a default that ignores `defaultBetLevel`, or levels that don't change when the response changes. Check every currency path; JPY levels differ from USD.

**[187] An active round restores its bet amount.**
If authenticate returns `round` with `active: true`, the game resumes that round and the selected bet becomes `round.amount`, not `defaultBetLevel`. The stake shown after the resumed round finishes, and the next bet, must still be that amount. With no active round, use `defaultBetLevel`.
Code: find the authenticate handler and follow what happens when `round.active` is true. A game that resumes the round but then resets the bet to the default FAILS.

### Currency

**[219] Supports and displays currencies correctly.**
USD, EUR, CAD, MXN and JPY each load, bet and display with the right symbol or code, decimals and position (see the table). Balance, bet, win and any modal amounts all follow the currency. No clipping or overlap from longer symbols like `CA$` or `MX$`.
Code: find the money formatter. FAIL if it hardcodes `$`, always uses 2 decimals (JPY has 0), or ignores `balance.currency` / the `currency` param.

**[273] Sub-cent payouts display correctly.**
A payout under 0.01 (e.g. 0.1x on a 0.05 bet) must show with enough decimals and not round to 0.00 or up to 0.01. The displayed value must match the RGS amount.
Code: check how the formatter handles values below the currency's normal decimals.

### RGS requests

**[221] Zero-win rounds send no end-round.**
Send `/wallet/end-round` only for a round that is still open, which is any round paying more than 0x. A 0x round is closed by the RGS; sending end-round for it FAILS. A winning round that never sends end-round also FAILS.
Code: find where end-round is called and confirm it is conditional on `payoutMultiplier > 0` (or `round.active`).

**[222] Insufficient balance sends no play request.**
When balance < bet, the game must not send `/wallet/play` and must tell the player (message, disabled button with explanation, etc.). Relying on the RGS's `ERR_IPB` reply is a FAIL: the request must not go out.
Code: find the pre-bet check. Make sure it covers the space bar, autoplay and bonus buys too, and uses the mode's real cost (bet × cost multiplier).

### Front end

**[228] Space bar places a bet.**
Space does exactly what the bet button does when betting is available, and does nothing harmful in menus, modals or mid-animation. Call `preventDefault()` so the page doesn't scroll.
Code: find the keydown handler. FAIL if space isn't bound, or only works after clicking into a canvas first. Check the listener is on `window`/`document`, not a focused element.

**[227] Main frame doesn't scroll.**
No scrollbars and no scrolling at any size: `html, body { margin: 0; overflow: hidden; height: 100%; }` or equivalent, with the canvas and UI sized to the viewport. Check at 1024×576, 400×225, 800×450 and 425×812.

**[104] Autoplay needs a confirmation step.**
Pressing autoplay must open a panel or menu where the player chooses or confirms settings. It must not start auto-betting from one press.

**[31] High-cost modes need confirmation.**
Any mode costing more than 2x the base bet (bonus buys, feature buys, boosted modes) must not place a bet from a single press. Either of these passes:
- a confirmation dialog that states the cost, or
- a press that only switches the mode on for the next bet, with the new cost clearly shown (e.g. "BONUS BOOST $10.00 per spin, Turn off").

FAIL: one press of a buy/activate button places the bet straight away, or the confirmation doesn't show the cost.
Code: go through every mode in `index.json` with `cost > 2` and trace its button to the play call.

**[107] Sound can be turned off.**
A visible sound/music control mutes **all** audio: effects, music and ambient sounds, everywhere, including bonus rounds and big-win screens. Code: confirm every audio source goes through the setting (no sound played directly, bypassing the mute).

### Game rules (info / help screens)

Read the full rules text for these, as the player sees it with `lang=en`.

**[25] RTP and max win are stated.**
The rules state the RTP and the maximum win, **per mode** wherever they differ (e.g. "Base: RTP 96.50%, max win 5,000x · Bonus: RTP 96.48%, max win 5,000x"). If you have the math files, compute both per mode and compare. A mismatch FAILS.

**[24] Every symbol's payout is shown.**
Every paying symbol is listed with its payouts (per count, cluster size, etc.), matching the math. Explain any mode or multiplier differences.

**[26] Win combinations are explained.**
How wins form: paylines and which lines pay, ways, cluster sizes, scatter counts, tumbles/cascades, multipliers, and any special conditions. It must match how the game actually pays.

**[27] Every mode has a description and cost.**
Every mode in `index.json` (other than the base game) appears in the rules with what it does and what it costs (e.g. "Bonus Buy: 100x bet"). A missing mode, or a cost that differs from `index.json`, FAILS.

**[29] Free games and re-triggers are explained.**
If there are free spins or bonus rounds: what triggers them, how many are awarded for each trigger, how re-triggers work, and any difference by symbol count. N/A only if the game has no free games.

**[235] Every control is explained.**
An interaction guide in the rules covers every button the player can press: bet, bet +/−, autoplay, turbo/quick spin, bonus buy, sound, settings, info, fullscreen, menu, and anything game-specific. Compare the list of buttons in the UI code with the guide. Any button left out FAILS.

**[185] General disclaimer is present.**
The rules contain a disclaimer along these lines (wording may differ):

> Malfunction voids all wins and plays. A consistent internet connection is required. In the event of a disconnection, reload the game to finish any uncompleted rounds. The expected return is calculated over many plays. The game display is not representative of any physical device and is for illustrative purposes only. Winnings are settled according to the amount received from the Remote Game Server and not from events within the web browser. TM and © 2026 Engine.

No disclaimer at all FAILS. A disclaimer missing some points is AT RISK: list the missing points and recommend adding them.

**[266] Mystery Mode chances are accurate.**
If the game has a Mystery Mode (or any feature showing chances or odds), every displayed probability must match the math. Compute it from the lookup tables where possible. N/A if there's no such feature in the math, the bets or the rules.

### Responsive

**[193] Laptop 1024×576, [195] Popout S 400×225 / L 800×450, [194] Mobile 425×812.**
At each size the game loads, every control is visible, reachable and not overlapping, text is readable, and a bet can be placed. Mobile works by touch. Screenshot each size if you can run the game; otherwise look for layouts that assume a minimum size or a single aspect ratio. Usually NEEDS A HUMAN for the final look.

**[223] Double-tap zoom is disabled on mobile.**
The viewport meta must stop zooming, e.g.
`<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">`,
and/or the game surface sets `touch-action: none` (or `manipulation`).
**`width=device-width` alone FAILS**: iOS Safari still zooms on double-tap.

### Language

**[239] English is supported.**
With `lang=en`, all player-facing text is English. No translation keys (`ui.bet_button`), `undefined`, `NaN`, `{placeholder}` or missing glyphs. Check the rules and every modal.

**[240] Invalid languages don't break the display.**
With `lang=zz` (or any unsupported code) the game loads and falls back to English, with no keys, blanks or broken layout. Code: find the i18n loader and confirm a fallback to `en` for unknown codes and for keys missing in a partial translation.

### Social mode (Stake.US: `social=true`)

When `social=true` (or `config.jurisdiction.socialCasino` is true), all player-facing text must use social wording. Restricted words are matched as whole words, case-insensitive, anywhere a player can see them: buttons, labels, rules, paytable, modals, confirmations, errors, autoplay menus, mode names, loading screens and the replay.

| Restricted | Use instead | Restricted | Use instead |
| --- | --- | --- | --- |
| at the cost of | for | gamble | play |
| be awarded to player's accounts | appear in player's accounts | money | coins |
| bet / bets / bet/s | play / plays | paid | won |
| betting | play / playing | paid out | win |
| bonus buy | bonus / feature | pay | win |
| bought | instantly triggered | pay out | win / won |
| buy | play | payer | winner |
| buy bonus | get bonus | pays | wins |
| cash | coins | pays out | won |
| cost of | can be played for | place your bets | come and play / join in the game |
| credit | balance | purchase | play |
| currency | token | rebet | respin |
| deposit | get coins | stake | play amount |
| fund | balance | total bet | total play |
| withdraw | redeem | wager | play |
| win feature | play feature | | |

Common misses: "Bet" on the main button, "Bet Amount", "Auto Bet", "Number of Bets", "Total Bet", "Buy" on bonus buttons and confirmations, insufficient-funds errors, and **"Pay table" / "Paytable"** (not allowed: "pay" is restricted; use e.g. "Win table" or "Symbol wins").

**[77] All text uses social wording.** List every restricted word you find in one finding, as the word only (e.g. "BET", "BUY", "PAYTABLE"). Code: diff the social string set against the table; check for strings that skip the social switch (hardcoded labels, text baked into images, mode names shown as-is).

**[78] SC and GC currencies, no "$".** With `currency=XSC` and `currency=XGC` the game loads and bets, amounts read "10.00 SC" / "10.00 GC", and no `$` appears anywhere.

**[225] Mode names use social wording.** Mode names shown in the game, the rules and the replay must avoid restricted words ("BONUS BUY", "BUY FEATURE", "SUPER BET" all fail) and be consistent everywhere. Mode names in `index.json` that the game displays as-is count too.

**[188] The replay has no restricted words.** Open a replay with `social=true&currency=XSC` and check all its text.

### Replay

Check replay handling end to end. Reviewers open replays for several modes, including wins, big wins, max wins, losses and bonus triggers.

**[171] Replay URLs load and play the event.**
With `replay=true` the game calls `GET {rgs_url}/bet/replay/{game}/{version}/{mode}/{event}`, makes **no** wallet calls, loads automatically, shows a Play/Start button, plays the round exactly as it happened, and leaves the result on screen. All betting controls are hidden or disabled, and there's no way into normal play. A fetch failure shows an error message.

**[172] Optional parameters are applied.**
`currency`, `lang` and `amount` are used: e.g. `currency=EUR&lang=fr&amount=5000000` shows €5.00 as the bet. Missing or invalid values don't break it. **A replay showing no bet amount anywhere FAILS.**

**[173] The replay can be watched again.**
After it ends, a Replay / Play Again control restarts the same event.

**[174] Bet cost and multiplier are shown.**
The replay shows the bet and, for a mode costing more than 1x, the multiplier and the real cost (`amount × costMultiplier`), e.g. "BONUS: 1.00 SC · REAL COST: 100.00 SC". **No amount anywhere FAILS.**

**[243] Replays work at popout S (400×225).**
The replay loads, plays and fits at 400×225 with its controls usable.

### Also worth checking

Not numbered guidelines, but causes of failed reviews:

- **Static files only.** The build must not load anything from external hosts (Google Fonts, CDNs, analytics); a strict content policy blocks them and the console fills with errors. Search the build for `http://` and `https://` URLs that aren't the RGS.
- **Wins match the rules.** If you can run the game, play a few wins in each mode and check the displayed win equals `bet × payoutMultiplier` and agrees with the paytable.
- **Console errors** during launch, play and replay.

---

## In this repo: where to look, and what has failed before

Shared code (every app inherits it — a finding here is usually a finding for all):

| Guideline | Where |
| --- | --- |
| 181 / 274 rgs_url, scheme | `packages/rgs-fetcher/src/rgsFetcher.ts` (`rgsEndpoint` adds `https://` only when missing) |
| 183 / 221 play & end-round | `packages/utils-xstate/src/createPrimaryMachines.ts` (end-round only for `singleRoundWin` / `bonusWin`; a winning base round is closed when its presentation ends — 2026-10-04 review, #187) |
| 187 resume stake | same file, `resumeGame`; `packages/components-shared/src/components/Authenticate.svelte` |
| 222 insufficient balance | `requireAffordablePlay` in createPrimaryMachines; `packages/state-shared/src/stateBet.svelte.ts` (`isBetCostAvailable`); app sets `stateConfig.explainInsufficientBalance` in `src/game/uiTheme.ts` |
| 242 bet levels | `packages/state-shared/src/stateConfig.svelte.ts`; `packages/components-ui-pixi/src/components/ButtonIncrease.svelte` / `ButtonDecrease.svelte` |
| 228 space bar | `packages/components-shared/src/components/EnableHotkey.svelte`, `packages/components-ui-pixi/src/components/EnableShortcuts.svelte` |
| 219 / 273 / 78 currency | `packages/utils-shared/amount.ts` |
| 171–174 replay | `packages/rgs-requests/src/rgs-requests.ts` (`bet/replay`), app `src/components/ui/ReplayIntro.svelte` |
| Bet bar / hold-to-repeat | `packages/components-ui-pixi/src/platformUx.svelte.ts` — `createBetRepeat` is deliberately a no-op: the 2026-10-04 review (Deadwood) required one step per click. Turning hold-to-repeat back on is a FAIL risk. |

Per app (`apps/<Game>/`):

- Rules, paytable, buy-mode copy: `src/components/ui/ModalGameRules.svelte`, `ModalPayTable.svelte`, `ModalBuyBonus*.svelte`, `src/game/betModeMeta.ts`, `src/game/i18nText.ts`, `src/i18n/messagesMap/`.
- Static gates that already cover part of this checklist (run them, but a green gate is not a PASS — see the stake-engine-slot skill on their blind spots): `design/check_social_words.mjs` (#77/#225/#188), `design/check_assets.mjs`, `design/check_undefined_refs.mjs`, and where present `design/check_copy_claims.py` (`pnpm check:claims`, rules text vs books).
- HTML entry: `src/app.html` (viewport meta for #223, body CSS for #227).
- Math (#25/#27/#266, max win, mode count): `math-sdk/games/<game_id>/library/publish_files/` (`index.json`, `lookUpTable_*.csv`, `books_*.jsonl.zst`). A math folder may carry a suffix after the id (`games/PuttMonkey迷你高爾夫`): the SDK (`src/config/paths.py` `game_dir`) and the apps (`wp/tools/math_game_dir.mjs`) find it by prefix — no junction (user, 2026-10-23: junctions clutter the folder).

History worth re-checking on every game (details in `../stake-engine-slot/references/review-log.md`, `approval-guidelines.md`, `certification.md`):

- Disclaimer (#185) must be the official wording; 16:9 cover art is required; bought modes must reset to BASE after the round; every mode needs its own description and RTP; Popout S and Mobile S layouts; restricted words in inflected forms ("Buys", "Paid", "Betting"); replay amounts to full precision.
- Rules that claim "same RTP as base" when buy modes differ (茶樓底: buy 95% vs base 94.5%).
- Max win stated in the rules but never reached in the books (茶樓底: no 10,000x book) — AT RISK under #25.
