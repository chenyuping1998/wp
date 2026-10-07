<script lang="ts">
	/**
	 * One moving patch of a background plate (game/meshWin/bgWarp.ts): a
	 * rectangle of the plate redrawn through a grid ON TOP of the plate, placed
	 * and scaled exactly like the plate's own sprite (Background's parallax), so
	 * its pinned border lines up with the plate underneath and there is no seam.
	 *
	 * The UVs point straight into the full plate texture rather than at a
	 * sub-texture: on WebGPU pixi 8.8.1's mesh ignores a texture's frame (see
	 * SymbolMeshWin). It runs on the wall clock, so a tab coming back from the
	 * background picks up where the air was.
	 */
	import { Container, Mesh, MeshGeometry, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { PLATE, buildWarpGrid, poseWarp, type Warp } from '../game/meshWin/bgWarp';

	type Props = {
		warp: Warp;
		/** the plate's asset key */
		plate: string;
		x: number;
		y: number;
		width: number;
		height: number;
	};

	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();

	const root = new Container();
	$effect(() => {
		root.position.set(props.x, props.y);
		root.scale.set(props.width / PLATE.w, props.height / PLATE.h);
	});

	onMount(() => {
		const texture = app.stateApp.loadedAssets?.[props.plate] as Texture | undefined;
		if (!texture) {
			console.error(`BackgroundWarp: ${props.plate} not loaded`);
			return;
		}
		const grid = buildWarpGrid(props.warp);
		const positions = new Float32Array(grid.rest);
		const geometry = new MeshGeometry({ positions, uvs: grid.uvs, indices: grid.indices });
		const mesh = new Mesh({ geometry, texture });
		root.label = `bgWarp ${props.warp.id}`;
		root.addChild(mesh);
		parent.parent.addChild(root);

		const tick = () => {
			poseWarp(props.warp, grid, performance.now() / 1000, positions);
			geometry.getBuffer('aPosition').update();
		};
		tick();
		const ticker = app.stateApp.pixiApplication?.ticker;
		ticker?.add(tick);
		return () => {
			ticker?.remove(tick);
			root.removeFromParent();
			root.destroy({ children: true });
			geometry.destroy();
		};
	});
</script>
