<script lang="ts">
	/**
	 * The swell: in the blast's CHARGE beat, every tile the dynamite is about to
	 * take bulges from its middle and trembles, harder the nearer the bang, and
	 * the dynamite's own cell hardest of all (game/meshWin/swell.ts).
	 *
	 * Each covered tile is redrawn here through a mesh, OVER the board's own
	 * sprite (the tiles are opaque, so the mesh at rest covers it exactly) and
	 * UNDER ReelBlast's darkening and cracks, which is why this is rendered first
	 * inside ReelBlast's board container. At the bang the meshes go: ReelBlast
	 * has opened the void over the column by then, and the shards take over.
	 *
	 * Removal is on a timer, not the frame loop — rAF stops in a hidden tab, and
	 * a swell left behind would sit over the reveal.
	 */
	import { Mesh, MeshGeometry, Container, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onDestroy } from 'svelte';

	import { getContext } from '../game/context';
	import { stateGame } from '../game/stateGame.svelte';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import { getSymbolX, getSymbolInfo } from '../game/utils';
	import { buildRig, skin, CANVAS, type Rig } from '../game/meshWin/meshRig';
	import { SWELLS } from '../game/meshWin';
	import { SWELL_MS } from '../game/meshWin/swell';
	import type { SymbolName } from '../game/types';

	const context = getContext();
	const app = getContextApp();
	const parent = getContextParent();

	const root = new Container();
	root.label = 'blastSwell';
	// first child of ReelBlast's board container: under its darkening and cracks
	parent.parent.addChildAt(root, 0);

	// one rig per symbol: it depends only on the spec
	const rigs = new Map<string, Rig>();
	const rigOf = (name: string) => {
		let rig = rigs.get(name);
		if (!rig) rigs.set(name, (rig = buildRig(SWELLS[name].rig)));
		return rig;
	};

	type Cell = { mesh: Mesh; geometry: MeshGeometry; positions: Float32Array; rig: Rig; name: string };
	let cells: Cell[] = [];
	let started = 0;
	let generation = 0;
	let timer: ReturnType<typeof setTimeout> | undefined;

	const clear = () => {
		clearTimeout(timer);
		app.stateApp.pixiApplication?.ticker.remove(tick);
		for (const c of cells) {
			c.mesh.destroy();
			c.geometry.destroy();
		}
		cells = [];
		root.removeChildren();
	};

	const tick = () => {
		const t = performance.now() - started;
		for (const c of cells) {
			skin(c.rig, SWELLS[c.name].pose(c.rig, t), SWELLS[c.name].feetY, c.positions);
			c.geometry.getBuffer('aPosition').update();
		}
	};

	context.eventEmitter.subscribeOnMount({
		reelBlast: ({ reels }) => {
			clear();
			const mine = ++generation;
			const assets = app.stateApp.loadedAssets ?? {};
			for (const reel of reels) {
				const symbols = stateGame.board[reel]?.reelState.symbols;
				if (!symbols) continue;
				for (let row = 1; row <= BOARD_DIMENSIONS.y; row++) {
					const raw = symbols[row]?.rawSymbol;
					const name = raw?.name as SymbolName | undefined;
					if (!name || !(name in SWELLS)) continue;
					const info = getSymbolInfo({ rawSymbol: raw!, state: 'static' });
					const texture = assets[info.assetKey] as Texture | undefined;
					if (!texture) continue;
					const rig = rigOf(name);
					const positions = new Float32Array(rig.rest);
					const geometry = new MeshGeometry({ positions, uvs: rig.uvs, indices: rig.indices });
					const mesh = new Mesh({ geometry, texture });
					const fit = (SYMBOL_SIZE * info.sizeRatios.height) / CANVAS;
					mesh.scale.set(fit);
					mesh.position.set(getSymbolX(reel) - (CANVAS / 2) * fit, SYMBOL_SIZE * (row - 0.5) - (CANVAS / 2) * fit);
					root.addChild(mesh);
					cells.push({ mesh, geometry, positions, rig, name });
				}
			}
			started = performance.now();
			tick();
			app.stateApp.pixiApplication?.ticker.add(tick);
			// gone at the bang: ReelBlast opens the void over the column then
			timer = setTimeout(() => {
				if (mine === generation) clear();
			}, SWELL_MS);
		},
		reelBlastClear: () => {
			generation += 1;
			clear();
		},
	});

	onDestroy(() => {
		clear();
		root.destroy();
	});
</script>
