<script lang="ts">
	/**
	 * A flat picture drawn through a deforming grid (game/meshWin/sheets.ts):
	 * the free-game sign, the board housing, the counter plaque. Every layer is
	 * the same grid — so a housing's backing and its steel ring, or a picture
	 * and its additive flare, bend as one — and `pose` fills the positions each
	 * frame.
	 *
	 * Sized and placed like a Sprite with anchor 0.5, so it drops in where one
	 * was, and inserted into the parent in markup order (addToParent), so it
	 * keeps that sprite's place in the stack.
	 */
	import { Container, Mesh, MeshGeometry, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import type { PlaqueGrid } from '../game/meshWin/plaque';

	type Layer = { key: string; blendMode?: 'add' | 'normal'; alpha?: number; tint?: number };
	type Props = {
		layers: Layer[];
		grid: PlaqueGrid;
		/** the picture's own size, px — the grid's coordinates */
		artWidth: number;
		artHeight: number;
		x?: number;
		y?: number;
		width: number;
		height: number;
		rotation?: number;
		zIndex?: number;
		/** fill `out` with this frame's positions (the grid's rest when idle) */
		pose: (out: Float32Array) => void;
	};

	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();

	const root = new Container();
	const content = new Container();
	root.addChild(content);
	parent.addToParent(root);

	const positions = new Float32Array(props.grid.rest);
	const geometry = new MeshGeometry({ positions, uvs: props.grid.uvs, indices: props.grid.indices });
	const meshes: (Mesh | null)[] = [];

	$effect(() => {
		root.position.set(props.x ?? 0, props.y ?? 0);
		root.rotation = props.rotation ?? 0;
		root.zIndex = props.zIndex ?? 0;
		root.scale.set(props.width / props.artWidth, props.height / props.artHeight);
		content.position.set(-props.artWidth / 2, -props.artHeight / 2);
	});

	onMount(() => {
		const assets = app.stateApp.loadedAssets ?? {};
		for (const layer of props.layers) {
			const texture = assets[layer.key] as Texture | undefined;
			if (!texture) {
				console.error(`SheetMesh: ${layer.key} not loaded`);
				meshes.push(null);
				continue;
			}
			const mesh = new Mesh({ geometry, texture });
			if (layer.blendMode) mesh.blendMode = layer.blendMode;
			content.addChild(mesh);
			meshes.push(mesh);
		}
		const tick = () => {
			props.pose(positions);
			geometry.getBuffer('aPosition').update();
			props.layers.forEach((layer, i) => {
				const mesh = meshes[i];
				if (!mesh) return;
				mesh.alpha = layer.alpha ?? 1;
				mesh.visible = mesh.alpha > 0.001;
				if (layer.tint !== undefined) mesh.tint = layer.tint;
			});
		};
		tick();
		const ticker = app.stateApp.pixiApplication?.ticker;
		ticker?.add(tick);
		return () => {
			ticker?.remove(tick);
			// the root itself is destroyed by addToParent's own cleanup
			for (const mesh of meshes) mesh?.destroy();
			geometry.destroy();
		};
	});
</script>
