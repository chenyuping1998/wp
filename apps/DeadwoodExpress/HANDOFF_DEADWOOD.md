# Deadwood Express handoff

## 2026-09-20 — approved concept and scaffold

The user selected Deadwood Express and confirmed that each winning FG spin draws a nondecreasing multiplier which applies immediately to all line wins on that spin. Both 100x and 250x purchases have a 100x multiplier ceiling; the premium wheel selects multiples of five only. See DESIGN.md for confirmed scope and explicitly provisional decisions.

Scaffold copied from the current local HotMiami app and math-sdk/games/hot_miami. Build output, upload output, dependency directories and generated math libraries were excluded to avoid representing old books/builds as the new game. Source modifications in HotMiami were preserved.

This is not a completed game. The scaffold still contains inherited Hot Miami art, frame logic, copy and build guards. No new RTP, simulation, optimization, browser playtest or upload readiness is claimed. The next implementation must replace those systems before packaging anything.

Canonical new math location: /Users/stone/stake-engine/math-sdk/games/deadwood_express.
New frontend location: /Users/stone/stake-engine/wp/apps/DeadwoodExpress.

Do not execute inherited packaging scripts until their source-game output paths have been redirected and verified. The installed stake-engine-slot skill contains historical Windows toolchain instructions; this workspace runs macOS, so resolve the actual local tools rather than using those Windows paths.
