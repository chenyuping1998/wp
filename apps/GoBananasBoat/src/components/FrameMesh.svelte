<script lang="ts">
	/**
	 * THE REEL HOUSING RINGS (BoardFrame): the brass edge drawn through a mesh,
	 * so a hard knock — a multiplier slamming down, the mine's blast — makes it
	 * VIBRATE like struck metal instead of only jumping on the spot.
	 *
	 * The mode is the frame's lowest one: the four corners hold, the two sides
	 * bow out while the top and bottom bow in, then the other way, dying away
	 * (`ring`, px at the middle of each side, signed). Centred on (x, y),
	 * `width` x `height` like the Sprite it replaces.
	 */
	import { Mesh, MeshGeometry, Container, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	type Props = {
		key: string;
		x: number;
		y: number;
		width: number;
		height: number;
		/** px the middle of each side moves: + sides out / top and bottom in */
		ring: number;
		blendMode?: 'add' | 'normal';
		alpha?: number;
	};

	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();

	const N = 24;
	const V = (N + 1) * (N + 1);
	const uvs = new Float32Array(V * 2);
	const indices = new Uint32Array(N * N * 6);
	for (let r = 0, i = 0; r <= N; r++)
		for (let c = 0; c <= N; c++, i += 2) uvs.set([c / N, r / N], i);
	for (let r = 0, k = 0; r < N; r++)
		for (let c = 0; c < N; c++, k += 6) {
			const a = r * (N + 1) + c;
			indices.set([a, a + 1, a + N + 2, a, a + N + 2, a + N + 1], k);
		}
	const positions = new Float32Array(V * 2);
	const root = new Container();
	let geometry: MeshGeometry | undefined;
	let mesh: Mesh | undefined;

	const pose = () => {
		if (!geometry || !mesh) return;
		const { x, y, width: w, height: h, ring } = props;
		for (let r = 0, i = 0; r <= N; r++)
			for (let c = 0; c <= N; c++, i += 2) {
				// -1..1 across the frame
				const u = (c / N) * 2 - 1, v = (r / N) * 2 - 1;
				// the sides move along x, most at mid-height; the top and bottom
				// along y, most at mid-width, the opposite way; corners hold
				positions[i] = x + (u * w) / 2 + ring * u * (1 - v * v);
				positions[i + 1] = y + (v * h) / 2 - ring * v * (1 - u * u);
			}
		geometry.getBuffer('aPosition').update();
		mesh.alpha = props.alpha ?? 1;
		mesh.blendMode = props.blendMode ?? 'normal';
	};

	$effect(() => {
		void [props.x, props.y, props.width, props.height, props.ring, props.alpha, props.blendMode];
		pose();
	});

	onMount(() => {
		const texture = app.stateApp.loadedAssets?.[props.key] as Texture | undefined;
		if (!texture) {
			console.error(`FrameMesh: ${props.key} not loaded`);
			return;
		}
		geometry = new MeshGeometry({ positions, uvs, indices });
		mesh = new Mesh({ geometry, texture });
		root.addChild(mesh);
		parent.parent.addChild(root);
		pose();
		return () => {
			root.removeFromParent();
			root.destroy({ children: true });
			geometry?.destroy();
		};
	});
</script>
