<script lang="ts">
	import { onMount } from 'svelte';
	import { Mesh, MeshGeometry, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';

	const props: { x: number; y: number; width: number; height: number; shut: number } = $props();
	const app = getContextApp();
	const parent = getContextParent();
	onMount(() => {
		const texture = app.stateApp.loadedAssets?.smDoor as Texture | undefined;
		if (!texture) return;
		const cols = 24, rows = 24;
		const positions = new Float32Array((cols + 1) * (rows + 1) * 2);
		const uvs = new Float32Array(positions.length);
		const indices: number[] = [];
		for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++) {
			const i = (r * (cols + 1) + c) * 2;
			uvs[i] = c / cols; uvs[i + 1] = r / rows;
		}
		for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
			const i = r * (cols + 1) + c;
			indices.push(i, i + 1, i + cols + 2, i, i + cols + 2, i + cols + 1);
		}
		const geometry = new MeshGeometry({ positions, uvs, indices: new Uint32Array(indices) });
		const mesh = new Mesh({ texture, geometry });
		mesh.label = 'jazz curtain cloth';
		parent.parent.addChild(mesh);
		const start = performance.now();
		const tick = () => {
			const t = (performance.now() - start) / 1000;
			// Full cover is perfectly flat; moving cloth lags further down the drop.
			const energy = Math.sin(Math.PI * props.shut) * 9;
			for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++) {
				const u = c / cols, v = r / rows, i = (r * (cols + 1) + c) * 2;
				const pinned = Math.sin(Math.PI * u) * v * v;
				positions[i] = (u - 0.5) * 1400 + Math.sin(u * 18 - t * 9 + v * 3) * energy * pinned;
				positions[i + 1] = (v - 0.5) * 1080 + Math.sin(u * 13 - t * 7) * energy * pinned * 0.7;
			}
			geometry.getBuffer('aPosition').update();
			mesh.position.set(props.x, props.y);
			mesh.scale.set(props.width / 1400, props.height / 1080);
		};
		tick();
		const ticker = app.stateApp.pixiApplication?.ticker;
		ticker?.add(tick);
		return () => { ticker?.remove(tick); mesh.removeFromParent(); mesh.destroy(); geometry.destroy(); };
	});
</script>
