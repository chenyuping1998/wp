<script lang="ts">
	import { Container, Graphics, Mesh, MeshGeometry, Texture } from 'pixi.js';
	import { getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';
	import { MULTIPLIER_TIERS, MULTIPLIER_LIT } from '../game/multiplierTiers';

	type Props = { value: number; size: number; elapsed: number };
	const props: Props = $props();
	const parent = getContextParent();
	const COLS = 8, ROWS = 8;
	const uvs = new Float32Array((COLS + 1) * (ROWS + 1) * 2);
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
	const edge = new Graphics();
	let geometry: MeshGeometry | undefined;
	let positions: Float32Array | undefined;
	let face: Mesh | undefined;
	const pose = () => {
		if (!geometry || !positions || !face) return;
		const tier = MULTIPLIER_TIERS[props.value - 1] ?? MULTIPLIER_TIERS[0];
		face.tint = tier.face;
		const seconds = Math.max(0, props.elapsed) / 1000;
		const strength = 0.55 + Math.max(0, Math.min(4, props.value - 1)) * 0.1125;
		const recoil = -Math.exp(-seconds * 6) * Math.cos(seconds * 20) * strength;
		const half = props.size * 0.43;
		for (let r = 0, i = 0; r <= ROWS; r++) {
			for (let c = 0; c <= COLS; c++, i += 2) {
				const nx = 2 * c / COLS - 1, ny = 2 * r / ROWS - 1;
				const rim = Math.max(Math.abs(nx), Math.abs(ny));
				positions[i] = nx * half * (1 + 0.075 * recoil * rim);
				positions[i + 1] = ny * half * (1 - 0.11 * recoil * rim);
			}
		}
		geometry.getBuffer('aPosition').update();
		const x = half * (1 + 0.075 * recoil), y = half * (1 - 0.11 * recoil);
		edge.clear();
		edge.poly([-x, -y, x, -y, x, y, -x, y], true);
		edge.stroke({ width: tier.width, color: tier.rim });
		edge.poly([-x + 8, -y + 8, x - 8, -y + 8, x - 8, y - 8, -x + 8, y - 8], true);
		edge.stroke({ width: 2, color: MULTIPLIER_LIT, alpha: 0.45 });
	};
	$effect(() => {
		void [props.value, props.size, props.elapsed];
		pose();
	});
	onMount(() => {
		positions = new Float32Array(uvs.length);
		geometry = new MeshGeometry({ positions, uvs, indices });
		face = new Mesh({ geometry, texture: Texture.WHITE });
		root.addChild(face, edge);
		pose();
		parent.parent.addChild(root);
		return () => {
			root.removeFromParent();
			root.destroy({ children: true });
			geometry?.destroy();
		};
	});
</script>
