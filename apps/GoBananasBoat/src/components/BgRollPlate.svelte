<script lang="ts">
	/**
	 * A background plate drawn through a mesh so it can ROLL with the sea
	 * (game/meshWin/bgPatches.ts holdRoll): the Hold and Spin hold. Same place
	 * and size as the Sprite it replaces (Background's parallax rect), on the
	 * wall clock modulo the roll's loop, so it and its patches agree.
	 */
	import { Mesh, MeshGeometry, Container, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';
	import { holdRoll, HOLD_ROLL_LOOP } from '../game/meshWin/bgPatches';

	type Props = { key: string; x: number; y: number; width: number; height: number };
	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();
	const PLATE: [number, number] = [1920, 1080];
	const COLS = 32, ROWS = 18;
	const V = (COLS + 1) * (ROWS + 1);
	const uvs = new Float32Array(V * 2);
	const indices = new Uint32Array(COLS * ROWS * 6);
	for (let r = 0, i = 0; r <= ROWS; r++) for (let c = 0; c <= COLS; c++, i += 2) uvs.set([c / COLS, r / ROWS], i);
	for (let r = 0, k = 0; r < ROWS; r++)
		for (let c = 0; c < COLS; c++, k += 6) {
			const a = r * (COLS + 1) + c;
			indices.set([a, a + 1, a + COLS + 2, a, a + COLS + 2, a + COLS + 1], k);
		}
	const positions = new Float32Array(V * 2);
	const root = new Container();

	$effect(() => {
		root.position.set(props.x, props.y);
		root.scale.set(props.width / PLATE[0], props.height / PLATE[1]);
	});

	onMount(() => {
		const texture = app.stateApp.loadedAssets?.[props.key] as Texture | undefined;
		if (!texture) {
			console.error(`BgRollPlate: ${props.key} not loaded`);
			return;
		}
		const geometry = new MeshGeometry({ positions, uvs, indices });
		root.addChild(new Mesh({ geometry, texture }));
		parent.parent.addChild(root);
		const tick = () => {
			const t = performance.now() % HOLD_ROLL_LOOP;
			for (let i = 0; i < V; i++) {
				const [x, y] = holdRoll(uvs[i * 2] * PLATE[0], uvs[i * 2 + 1] * PLATE[1], t);
				positions[i * 2] = x;
				positions[i * 2 + 1] = y;
			}
			geometry.getBuffer('aPosition').update();
		};
		const ticker = app.stateApp.pixiApplication?.ticker;
		tick();
		ticker?.add(tick);
		return () => {
			ticker?.remove(tick);
			root.removeFromParent();
			root.destroy({ children: true });
			geometry.destroy();
		};
	});
</script>
