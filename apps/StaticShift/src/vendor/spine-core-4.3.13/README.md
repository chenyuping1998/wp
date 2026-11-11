# Spine runtime 4.3.13 (vendored for the Static Shift cast)

- `index.js` = `@esotericsoftware/spine-core@4.3.13` `dist/esm/spine-core.mjs`; `*.d.ts` = its `dist/*.d.ts`; `LICENSE` = the Spine Runtimes License shipped with it.
- Why vendored: the cast rigs come out of spine-motion-kit as Spine 4.3 data; the rest of the game (symbols, pixi-svelte) stays on the shared 4.2.74 runtime. Static Shift has no `node_modules` of its own (it links GoBanandit's), and installing 4.3 there would change the live games' dependency tree. Turf War uses the same 4.3.13 runtime as a normal dependency.
- Used only by `src/game/castSpine43.ts`. Do not edit; replace the whole folder to upgrade.
