<script lang="ts">
	import { Container, Mesh, MeshGeometry, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	type Props = { assetKey: string; width: number; height: number; time: number; amountImpact: number };
	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();
	const COLS = 16;
	const ROWS = 10;
	const count = (COLS + 1) * (ROWS + 1);
	const uvs = new Float32Array(count * 2);
	const indices = new Uint32Array(COLS * ROWS * 6);
	for (let r = 0, i = 0; r <= ROWS; r++) {
		for (let c = 0; c <= COLS; c++, i += 2) {
			uvs[i] = c / COLS;
			uvs[i + 1] = r / ROWS;
		}
	}
	for (let r = 0, k = 0; r < ROWS; r++) {
		for (let c = 0; c < COLS; c++, k += 6) {
			const a = r * (COLS + 1) + c;
			indices.set([a, a + 1, a + COLS + 2, a, a + COLS + 2, a + COLS + 1], k);
		}
	}

	const root = new Container();
	let geometry: MeshGeometry | undefined;
	let positions: Float32Array | undefined;
	const pose = () => {
		if (!geometry || !positions) return;
		const w = props.width, h = props.height;
		const elapsed = Math.max(0, props.time - 0.27);
		const slam = props.time >= 0.27 ? Math.exp(-elapsed * 5.5) * Math.sin(elapsed * 22) : 0;
		const wave = slam + props.amountImpact * 0.32;
		for (let r = 0, i = 0; r <= ROWS; r++) {
			for (let c = 0; c <= COLS; c++, i += 2) {
				const nx = 2 * c / COLS - 1;
				const ny = 2 * r / ROWS - 1;
				// The riveted rim gives; the dark amount well remains flat and readable.
				const rim = Math.max(0, Math.min(1, (Math.max(Math.abs(nx), Math.abs(ny)) - 0.38) / 0.62));
				positions[i] = nx * w / 2 + nx * w * 0.012 * wave * rim;
				positions[i + 1] = ny * h / 2 + ny * h * 0.022 * wave * rim;
			}
		}
		geometry.getBuffer('aPosition').update();
	};
	$effect(() => {
		void [props.width, props.height, props.time, props.amountImpact];
		pose();
	});
	onMount(() => {
		const texture = app.stateApp.loadedAssets?.[props.assetKey] as Texture | undefined;
		if (!texture) {
			console.error(`WinBannerMesh: ${props.assetKey} not loaded`);
			return;
		}
		positions = new Float32Array(count * 2);
		geometry = new MeshGeometry({ positions, uvs, indices });
		pose();
		root.addChild(new Mesh({ geometry, texture }));
		parent.parent.addChild(root);
		return () => {
			root.removeFromParent();
		root.destroy({ children: true });
		geometry?.destroy();
		};
	});
</script>
