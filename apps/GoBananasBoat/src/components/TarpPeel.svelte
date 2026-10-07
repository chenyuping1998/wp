<script lang="ts">
	/**
	 * THE BOARD UNDER A TARP, YANKED OFF (EntryReveal, 2026-10-03). The game
	 * opens on the board covered by one big lashed tarp (gbEntryTarp): the
	 * ropes take the strain and the cloth ripples, then its top-right corner is
	 * yanked — the lift runs across the sheet from that corner as a front, the
	 * cloth behind it peeling up and away to the upper right, rippling as it
	 * goes — the gesture every crate in this game makes, done once to the
	 * whole hold.
	 *
	 * A function of `t` (ms since the reveal began). Centred on (x, y),
	 * `width` x `height`. Returns nothing to draw once it is gone.
	 */
	import { Mesh, MeshGeometry, Container, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	type Props = { x: number; y: number; width: number; height: number; t: number };
	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();

	const STRAIN_MS = 260;
	const PEEL_MS = 760;
	const COLS = 24, ROWS = 20;
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
	let geometry: MeshGeometry | undefined;
	let mesh: Mesh | undefined;

	const smooth = (v: number) => {
		const x = Math.max(0, Math.min(1, v));
		return x * x * (3 - 2 * x);
	};

	const pose = () => {
		if (!geometry || !mesh) return;
		const { x: cx, y: cy, width: w, height: h, t } = props;
		const diag = Math.hypot(w, h);
		// the strain: ripples across the lashed cloth, building to the yank
		const strain = smooth(t / STRAIN_MS) * (t < STRAIN_MS + 120 ? 1 : Math.max(0, 1 - (t - STRAIN_MS - 120) / 200));
		// the peel front, from the top-right corner across the sheet
		const p = Math.max(0, (t - STRAIN_MS) / PEEL_MS);
		const front = p * 1.5;
		// up and to the right, and a little toward the viewer
		const pull = { x: 0.62, y: -0.78 };
		for (let r = 0, i = 0; r <= ROWS; r++)
			for (let c = 0; c <= COLS; c++, i += 2) {
				const u = c / COLS, v = r / ROWS;
				let px = cx + (u - 0.5) * w;
				let py = cy + (v - 0.5) * h;
				// distance from the yanked corner, 0..1
				const d = Math.hypot((1 - u) * w, v * h) / diag;
				py += 3 * strain * Math.sin(u * 19 + t / 26) * Math.sin(v * 7);
				const lift = smooth((front - d) / 0.32);
				if (lift > 0) {
					const go = lift * lift * diag * 1.15;
					// a ripple running along the lifting cloth
					const wave = lift * (1 - lift) * 26 * Math.sin(d * 22 - t / 28);
					px += pull.x * go - pull.y * wave;
					py += pull.y * go + pull.x * wave;
					// it narrows toward the hand pulling it
					px += (cx + w / 2 - px) * 0.25 * lift;
					py += (cy - h / 2 - py) * 0.25 * lift;
				}
				positions[i] = px;
				positions[i + 1] = py;
			}
		geometry.getBuffer('aPosition').update();
		mesh.alpha = 1 - smooth((p - 0.75) / 0.25);
		mesh.visible = mesh.alpha > 0.01;
	};

	$effect(() => {
		void [props.x, props.y, props.width, props.height, props.t];
		pose();
	});

	onMount(() => {
		const texture = app.stateApp.loadedAssets?.gbEntryTarp as Texture | undefined;
		if (!texture) {
			console.error('TarpPeel: gbEntryTarp not loaded');
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
