<script lang="ts">
	/**
	 * THE THROWN MINE, SOFT (TransitionAnimation). mine.png drawn through a mesh
	 * so it can do two things a sprite cannot:
	 *
	 *   bulge  the ball SWELLS like it is about to burst — on each of the two red
	 *          ticks, and hard in the instant before the blast — lumpy, not a
	 *          clean scale: the swell runs a little ahead on one side. Only the
	 *          ball inflates; the horns and the shackle ride OUT on its surface at
	 *          their own size, so they do not balloon with it.
	 *   chain  the shackle and its bit of chain on top trail the tumble: swung
	 *          back against the spin in flight, whipping past and settling when
	 *          it lands.
	 *
	 * Drawn into the pixi container it is mounted in, centred on (0, 0), sized
	 * `width` x `height` like the Sprite it replaces.
	 */
	import { Mesh, MeshGeometry, Container, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	type Props = {
		width: number;
		height: number;
		tint: number;
		/** 0 at rest; 0.07 a tick's swell; ~0.22 the moment before it blows */
		bulge: number;
		/** radians the chain is swung back, about the shackle's foot */
		chain: number;
		/** a clock for the lumps, ms */
		time: number;
	};

	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();

	// measured on mine.png (776x837): the ball's centre and radius, and where the
	// shackle leaves the top of the ball
	const W = 776, H = 837;
	const BALL: [number, number] = [388, 470];
	const R = 318;
	const SHACKLE: [number, number] = [430, 160];
	const COLS = 24, ROWS = 26;

	const root = new Container();
	const V = (COLS + 1) * (ROWS + 1);
	const rest = new Float32Array(V * 2);
	const uvs = new Float32Array(V * 2);
	const indices = new Uint32Array(COLS * ROWS * 6);
	for (let r = 0, i = 0; r <= ROWS; r++)
		for (let c = 0; c <= COLS; c++, i++) {
			uvs[i * 2] = c / COLS;
			uvs[i * 2 + 1] = r / ROWS;
			rest[i * 2] = (c / COLS) * W;
			rest[i * 2 + 1] = (r / ROWS) * H;
		}
	for (let r = 0, k = 0; r < ROWS; r++)
		for (let c = 0; c < COLS; c++, k += 6) {
			const a = r * (COLS + 1) + c;
			indices.set([a, a + 1, a + COLS + 2, a, a + COLS + 2, a + COLS + 1], k);
		}
	const positions = new Float32Array(V * 2);
	let geometry: MeshGeometry | undefined;
	let mesh: Mesh | undefined;

	const smooth = (v: number) => {
		const t = Math.max(0, Math.min(1, v));
		return t * t * (3 - 2 * t);
	};

	const pose = () => {
		if (!geometry || !mesh) return;
		const sx = props.width / W, sy = props.height / H;
		for (let i = 0; i < V; i++) {
			let x = rest[i * 2], y = rest[i * 2 + 1];
			// the chain: above the shackle's foot it turns about it, more the higher
			const up = smooth((SHACKLE[1] + 10 - y) / 60);
			if (up > 0 && props.chain !== 0) {
				const dx = x - SHACKLE[0], dy = y - SHACKLE[1];
				const a = props.chain * up;
				const c = Math.cos(a), s = Math.sin(a);
				x = SHACKLE[0] + dx * c - dy * s;
				y = SHACKLE[1] + dx * s + dy * c;
			}
			// the swell: inside the ball, a radial scale; outside it, the surface
			// pushes everything out by the same distance (horns keep their size)
			if (props.bulge !== 0) {
				const dx = x - BALL[0], dy = y - BALL[1];
				const r = Math.hypot(dx, dy);
				if (r > 1e-3) {
					const th = Math.atan2(dy, dx);
					const b = props.bulge * (1 + 0.18 * Math.sin(3 * th + props.time / 90));
					const r2 = r < R ? r * (1 + b) : r + b * R;
					x = BALL[0] + (dx / r) * r2;
					y = BALL[1] + (dy / r) * r2;
				}
			}
			positions[i * 2] = (x - W / 2) * sx;
			positions[i * 2 + 1] = (y - H / 2) * sy;
		}
		geometry.getBuffer('aPosition').update();
		mesh.tint = props.tint;
	};

	$effect(() => {
		void [props.width, props.height, props.tint, props.bulge, props.chain, props.time];
		pose();
	});

	onMount(() => {
		const texture = app.stateApp.loadedAssets?.gbMine as Texture | undefined;
		if (!texture) {
			console.error('MineMesh: gbMine not loaded');
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
