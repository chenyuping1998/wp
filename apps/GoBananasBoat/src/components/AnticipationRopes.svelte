<script lang="ts">
	import { Container, Graphics, Mesh, MeshGeometry, Texture } from 'pixi.js';
	import { getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	type Props = { left: number; width: number; height: number; tension: number; pulse: number };
	const props: Props = $props();
	const parent = getContextParent();
	const SEGMENTS = 16;
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
		const { left, width, height, tension, pulse } = props;
		for (let s = 0; s < 2; s++) {
			const side = s === 0 ? 1 : -1;
			const anchor = left + (s === 0 ? 7 : width - 7);
			const p = positions[s];
			for (let r = 0; r <= SEGMENTS; r++) {
				const u = r / SEGMENTS;
				const sag = (13 * (1 - tension) + 2.4 * pulse) * Math.sin(Math.PI * u);
				const x = anchor + side * sag;
				p[r * 4] = x - 2.4;
				p[r * 4 + 1] = u * height;
				p[r * 4 + 2] = x + 2.4;
				p[r * 4 + 3] = u * height;
			}
			geometries[s].getBuffer('aPosition').update();
		}
		pins.clear();
		for (const x of [left + 7, left + width - 7]) {
			for (const y of [0, height]) {
				pins.circle(x, y, 5);
				pins.fill({ color: 0xffdda1 });
			}
		}
	};
	$effect(() => {
		void [props.left, props.width, props.height, props.tension, props.pulse];
		pose();
	});
	onMount(() => {
		for (let s = 0; s < 2; s++) {
			const p = new Float32Array(uvs.length);
			const geometry = new MeshGeometry({ positions: p, uvs, indices });
			positions.push(p);
			geometries.push(geometry);
			const rope = new Mesh({ geometry, texture: Texture.WHITE });
			rope.tint = 0xe0ae56;
			root.addChild(rope);
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
