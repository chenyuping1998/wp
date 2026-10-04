<script lang="ts">
	import { Container, Graphics, Mesh, MeshGeometry, Texture } from 'pixi.js';
	import { getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	type Props = { width: number; phase: 'lead' | 'turning' | 'approach' | 'landed'; elapsed: number };
	const props: Props = $props();
	const parent = getContextParent();
	const SEGMENTS = 12;
	const uvs = new Float32Array((SEGMENTS + 1) * 4);
	const indices = new Uint32Array(SEGMENTS * 6);
	for (let r = 0; r <= SEGMENTS; r++) {
		uvs[r * 4] = 0; uvs[r * 4 + 1] = r / SEGMENTS;
		uvs[r * 4 + 2] = 1; uvs[r * 4 + 3] = r / SEGMENTS;
	}
	for (let r = 0, k = 0; r < SEGMENTS; r++, k += 6) {
		const a = r * 2;
		indices.set([a, a + 1, a + 3, a, a + 3, a + 2], k);
	}
	const root = new Container();
	const pins = new Graphics();
	const geometries: MeshGeometry[] = [];
	const positions: Float32Array[] = [];
	const pose = () => {
		if (geometries.length !== 2) return;
		const w = props.width;
		const tension = props.phase === 'approach' ? 1 : props.phase === 'turning' ? 0.35 : 0;
		const t = Math.max(0, props.elapsed);
		const recoil = props.phase === 'landed' ? Math.exp(-t / 230) * Math.sin(t / 58) : 0;
		for (let s = 0; s < 2; s++) {
			const side = s === 0 ? -1 : 1;
			const p = positions[s];
			for (let r = 0; r <= SEGMENTS; r++) {
				const u = r / SEGMENTS;
				const y = (u - 0.5) * w * 1.11;
				const bow = Math.sin(Math.PI * u) * (-3 * tension + 13 * recoil);
				const x = side * (w * 0.56 + bow);
				p[r * 4] = x - 3.2;
				p[r * 4 + 1] = y;
				p[r * 4 + 2] = x + 3.2;
				p[r * 4 + 3] = y;
			}
			geometries[s].getBuffer('aPosition').update();
		}
		pins.clear();
		for (const side of [-1, 1]) {
			for (const top of [-1, 1]) {
				pins.circle(side * w * 0.56, top * w * 0.555, 5);
				pins.fill({ color: 0xf5dfa0 });
				pins.circle(side * w * 0.56, top * w * 0.555, 2);
				pins.fill({ color: 0x4f3218 });
			}
		}
	};
	$effect(() => {
		void [props.width, props.phase, props.elapsed];
		pose();
	});
	onMount(() => {
		for (let s = 0; s < 2; s++) {
			const p = new Float32Array(uvs.length);
			const geometry = new MeshGeometry({ positions: p, uvs, indices });
			positions.push(p);
			geometries.push(geometry);
			const strap = new Mesh({ geometry, texture: Texture.WHITE });
			strap.tint = 0xc89845;
			root.addChild(strap);
		}
		root.addChild(pins);
		pose();
		parent.parent.addChild(root);
		return () => {
			root.removeFromParent();
			root.destroy({ children: true });
			for (const geometry of geometries) geometry.destroy();
		};
	});
</script>
