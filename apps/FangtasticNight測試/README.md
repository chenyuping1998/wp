# Fangtastic Night 測試

Interactive recreation based on the supplied recordings. In a Stake Engine launch, the front end authenticates through the supplied `sessionID` and `rgs_url`, renders the RGS event book, reports event progress, and ends the round to collect the authoritative balance. Without those launch parameters it runs as a clearly labeled local demo with a virtual balance.

## Run

```powershell
cd E:\stake\wp\apps\FangtasticNight測試
corepack pnpm install --filter fangtastic-night-test
corepack pnpm --filter fangtastic-night-test dev
```

Open `http://127.0.0.1:3018/`. Use Space to spin, the menu for rules and bonus selection, and the yellow lightning button for turbo mode. `corepack pnpm --filter fangtastic-night-test build` creates the SvelteKit static `build/` upload bundle and checks its layout and asset paths. A Stake Engine launch supplies `sessionID`, `rgs_url`, `lang`, and `device` as URL query parameters. The matching math bundle is `E:\stake\math-sdk\games\FangtasticNight測試\publish\`.

## Implemented

- Recording-matched three-arch loading/continue page, responsive 16:9 game stage, continuous looping reel strips with sequential reel stops, win flashes and count display.
- Winning-line presentation based on 5×5 grid coordinates: each paid line lights its symbols, draws the exact route, steps glowing nodes across the paid cells, places payout chips at the ends, plays a timed note, and advances the displayed win amount. Bonus coffins glow before their transition.
- Bet controls, local virtual balance, sound switch, auto and turbo controls, rules and a five-card bonus selection screen. Card sizes, labels, costs, active/locked states and buy confirmation breakdown follow the supplied recording.
- Night Bonus purchase confirmation, bat transition, 10 free spins, sticky bat positions, multiplier badge, and total win celebration.
- Animated layered scenery: two slow cloud banks, three small flapping bats crossing the sky, drifting fog, twinkling stars, and flickering lantern light. The vampire has a brief blink plus separate masked head, cup arm, open arm, and cape motion while idle; the larger gesture is reserved for spins and bonuses.
- Bonus introduction uses three or four staggered SVG coffins with a gold plaque, facial details, drifting motion, radial light and a separate free-spin title reveal.
- Reel stops include short dust puffs. Big, Super, and Epic win screens have separate colors, a ruby chalice, radial beams, falling coins and gems, and a count-up paced to the recorded celebration cue.
- Ante, Crimson Curtain, and Mystery Bonus activation states, with their recorded bet multipliers. Blood Moon can be bought or triggered, using a red scene, four coffin symbols, ten free spins, sticky bats, and a rising line multiplier.
- Ambient audio loops an eight-second excerpt of the first recording. Reel, transition, and celebration cues use short excerpts from the second recording. The normal reel animation is 1.495 seconds against a 1.44-second cue; the 2.00-second bat transition is matched to a 2.04-second cue. Turbo speeds up the reel cue. Background audio ducks during these cues.
- The playfield now remains mounted while reels and paid lines change. Symbol cells, HUD, overlays and modes update in place, so cloud, bird and character animations are not restarted on each win. Reel-strip DOM was cut from 150 to 50 moving tiles, and the two largest animated blur filters were removed.
- The loading card now decodes the main scene and feature images in two concurrent workers, shows actual asset progress, waits for RGS authentication where needed, and fades over the prepared game scene. Its glints remain mounted while progress changes.
- The separate [math project](../../../math-sdk/games/FangtasticNight測試/README.md) contains six Stake-format prototype math modes.

## Reference limits

The second recording shows Crimson Curtain, Mystery Bonus, and Blood Moon sequences, which inform the visual flow here. Some exact internal rules, timing, sound assets, and all certified outcome probabilities are unavailable from screen recordings; the local outcomes, payout values, and activation effects are demo approximations. The payout table, 96.50% RTP and 25,000× label are visual references from the recorded rules page, not claims about this demo's math.

The `base.png`, `bonus.png`, `bat-transition.png`, `modes-reference.png` and `loading-reference.png` stills come from the supplied recordings. The loading still is displayed through a CSS viewport crop so the recorded card artwork and lettering stay intact. The built-in image generation tool produced `courtyard.png`, the isolated `vampire.png` sprite, and clean background plates `base-clean.png`, `bonus-clean.png`, and `blood-clean.png` based on the recorded scenes. Prompts requested preservation of the castle composition while removing the baked-in character, plus a red moon/fire variant for Blood Moon.

The original PNG artwork is preserved in `source-art/`. The upload build serves quality-88 WebP copies from `static/assets/` to reduce network transfer and image decoding during startup and spins.

Reels use a finite target/padding/previous-symbol strip per column, based on the Go Banalchemy reel flow. Each column is painted into one canvas before the spin, then the five canvas layers move once to the target board and bounce into place. There is no looping CSS reel animation or fade-to-result swap.

## Animation comparison (2026-10-05)

Frame checks against the supplied 08:21 recording show that the competitor uses subtle idle blinks and cup/cape movement, slower clouds, small bat silhouettes, reel-stop dust, a continuous reel strip, glowing paid paths, detailed bonus coffins and a richer Super/Epic win overlay. The animation approximations above address those visible gaps. The character parts are masked from one illustration and the bonus coffins are code-drawn, so they are not the provider's original rig or artwork. The updated CSS/DOM passed `npm run build`; a rendered visual check was omitted per the request not to open a browser.

## Stake Engine integration and limits

The `build/` bundle uses the RGS wallet and event lifecycle when launched with Stake Engine parameters. The math books in `math-sdk` provide the matching event names and six mode names. The RGS path never uses local random outcomes or a virtual balance. The local demo path remains for development without a Stake session.

The build layout now follows `wp/apps/GoBanalchemy煉金`: SvelteKit static output with root `index.html`, `_app/`, `assets/`, `fonts/`, `favicon.svg`, and `loader.gif`. The game renderer keeps its DOM scene mounted and patches only changing parts of the game.

Nunito is self-hosted in `static/fonts` under the SIL Open Font License ([Google Fonts source](https://github.com/google/fonts/tree/main/ofl/nunito)), avoiding a third-party font request during launch.

The math is inferred from recordings and has not been independently certified. The art and recorded audio need rights clearance for publication; thumbnails and operator-specific assets are not included. A staging session is needed to check the actual RGS response and end-to-end settlement before real-money release.
