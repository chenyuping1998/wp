<script lang="ts">
	import { Container, Mesh, MeshGeometry, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onDestroy } from 'svelte';
	import { makeGrid, poseBackground, poseSymbol } from '../game/gridMotion';

	type Props = {
		assetKey: string;
		kind: 'symbol' | 'background';
		name: string;
		seconds: number;
		x?: number;
		y?: number;
		width: number;
		height: number;
		anchor?: number;
	};
	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();
	const root = new Container();
	parent.addToParent(root);
	let geometry: MeshGeometry | undefined;
	let builtKey = '';
	let grid: ReturnType<typeof makeGrid> | undefined;
	let positions: Float32Array | undefined;

	$effect(() => {
		const assetKey = props.assetKey;
		const texture = app.stateApp.loadedAssets?.[assetKey] as Texture | undefined;
		if (!texture) return;
		if (builtKey !== assetKey) {
			root.removeChildren().forEach((child) => child.destroy());
			geometry?.destroy();
			const cols = props.kind === 'background' ? 40 : 12;
			const rows = props.kind === 'background' ? 24 : 12;
			grid = makeGrid(texture.width, texture.height, cols, rows);
			positions = new Float32Array(grid.rest);
			geometry = new MeshGeometry({ positions, uvs: grid.uvs, indices: grid.indices });
			root.addChild(new Mesh({ geometry, texture }));
			builtKey = assetKey;
		}
		if (!grid || !positions || !geometry) return;
		if (props.kind === 'background') poseBackground(grid, positions, props.seconds, props.name);
		else poseSymbol(grid, positions, props.name, props.seconds);
		geometry.getBuffer('aPosition').update();
		const anchor = props.anchor ?? 0;
		root.position.set((props.x ?? 0) - props.width * anchor, (props.y ?? 0) - props.height * anchor);
		root.scale.set(props.width / texture.width, props.height / texture.height);
	});

	onDestroy(() => {
		root.removeChildren().forEach((child) => child.destroy());
		geometry?.destroy();
	});
</script>
