<script lang="ts" module>
	/** One knock on the housing, in the frame texture's own 0..1 coordinates. */
	export type FrameDent = {
		/** 'column': the top and bottom rails at `at` (u) are pinched inward, or
		 *  pushed out when `out`; 'side': the right rail at `at` (v) is knocked in */
		kind: 'column' | 'side';
		at: number;
		/** px of travel at the peak (screen) */
		depth: number;
		out?: boolean;
		t0: number;
	};
</script>

<script lang="ts">
	/**
	 * THE REEL HOUSING'S EDGE AS A MESH (BoardFrame.svelte owns when).
	 *
	 * The housing used to answer every impact by translating as one rigid piece.
	 * A capsule is a shell: where it is hit, it gives. This lays a grid over
	 * frame_edge.png and moves the vertices instead:
	 *
	 *   a column dent   the top and bottom rails over one reel pinch in where a
	 *                   Scatter or a high symbol lands, and spring back past flat
	 *   a growth bulge  the top rail over a reel that is growing bows OUT, with
	 *                   the shutter straining under it (ReelLid)
	 *   a side knock    the rail beside the mascot takes each fist of the chest beat
	 *   a breath        the whole shell bows outward and back on a big win
	 *
	 * The rails are the only part that moves — the band a dent lives in fades out
	 * a tenth of the way in — so the reel opening's inner edge stays where it is.
	 * The additive flash copy shares the geometry, so it rings in the same shape.
	 */
	import { Container, Mesh, MeshGeometry, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	type Props = {
		textureKey: string;
		x: number;
		y: number;
		width: number;
		height: number;
		dents: FrameDent[];
		/** start time of the current big-win breath, or 0 */
		breathAt: number;
		flash: number;
	};
	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();

	const COLS = 36;
	const ROWS = 36;
	const DENT_MS = 620;
	const BREATH_MS = 1100;
	const BREATH_PX = 7;
	// how far into the texture the rails reach (the band a dent moves)
	const RAIL_U = 0.1;
	const RAIL_V = 0.09;

	const smooth = (t: number) => {
		const k = Math.max(0, Math.min(1, t));
		return k * k * (3 - 2 * k);
	};
	// a knock: in fast, then springs back past flat and settles
	const knock = (ms: number) => {
		if (ms < 0 || ms > DENT_MS) return 0;
		if (ms < 45) return ms / 45;
		const t = ms - 45;
		return Math.exp(-t / 150) * Math.cos(t / 62);
	};

	let geometry: MeshGeometry | null = null;
	let positions: Float32Array | null = null;
	let base: Mesh | null = null;
	let flashMesh: Mesh | null = null;
	let root: Container | null = null;

	const layout = () => {
		if (!positions || !geometry || !root) return;
		const now = performance.now();
		const { width: W, height: H } = props;
		const breath = props.breathAt ? Math.sin(Math.PI * Math.min(1, (now - props.breathAt) / BREATH_MS)) * Math.exp(-((now - props.breathAt) / BREATH_MS) * 1.2) : 0;
		const live = props.dents.map((d) => ({ d, k: knock(now - d.t0) })).filter((x) => x.k !== 0);
		for (let r = 0; r <= ROWS; r++) {
			const v = r / ROWS;
			const top = smooth(1 - v / RAIL_V), bottom = smooth((v - (1 - RAIL_V)) / RAIL_V);
			for (let c = 0; c <= COLS; c++) {
				const u = c / COLS;
				let dx = 0, dy = 0;
				for (const { d, k } of live) {
					if (d.kind === 'column') {
						const g = Math.exp(-(((u - d.at) / 0.07) ** 2));
						const s = d.out ? -1 : 1;
						dy += s * d.depth * k * g * top;
						dy -= s * d.depth * k * g * bottom;
					} else {
						const right = smooth((u - (1 - RAIL_U)) / RAIL_U);
						const g = Math.exp(-(((v - d.at) / 0.16) ** 2));
						dx -= d.depth * k * g * right;
					}
				}
				// the breath: every rail outward from the middle
				if (breath) {
					const left = smooth(1 - u / RAIL_U), right = smooth((u - (1 - RAIL_U)) / RAIL_U);
					dx += BREATH_PX * breath * (right - left);
					dy += BREATH_PX * breath * (bottom - top);
				}
				const i = (r * (COLS + 1) + c) * 2;
				positions[i] = (u - 0.5) * W + dx;
				positions[i + 1] = (v - 0.5) * H + dy;
			}
		}
		geometry.getBuffer('aPosition').update();
		root.position.set(props.x, props.y);
	};

	onMount(() => {
		const texture = (app.stateApp.loadedAssets?.[props.textureKey] as Texture | undefined) ?? null;
		if (!texture) return;
		const count = (COLS + 1) * (ROWS + 1);
		positions = new Float32Array(count * 2);
		const uvs = new Float32Array(count * 2);
		const indices: number[] = [];
		for (let r = 0; r <= ROWS; r++)
			for (let c = 0; c <= COLS; c++) {
				const i = (r * (COLS + 1) + c) * 2;
				uvs[i] = c / COLS;
				uvs[i + 1] = r / ROWS;
				if (r < ROWS && c < COLS) {
					const a = r * (COLS + 1) + c, b = a + 1, d = a + COLS + 1, e = d + 1;
					indices.push(a, b, e, a, e, d);
				}
			}
		geometry = new MeshGeometry({ positions, uvs, indices: new Uint32Array(indices) });
		base = new Mesh({ geometry, texture });
		flashMesh = new Mesh({ geometry, texture });
		flashMesh.blendMode = 'add';
		flashMesh.alpha = 0;
		root = new Container();
		root.addChild(base, flashMesh);
		parent.parent.addChild(root);
		layout();

		const ticker = app.stateApp.pixiApplication?.ticker;
		const tick = () => {
			const now = performance.now();
			const busy =
				props.dents.some((d) => now - d.t0 < DENT_MS) || (props.breathAt && now - props.breathAt < BREATH_MS * 2.5);
			if (busy || dirty) {
				dirty = false;
				layout();
			}
		};
		ticker?.add(tick);
		return () => {
			ticker?.remove(tick);
			root?.removeFromParent();
			root?.destroy({ children: true });
			geometry?.destroy();
		};
	});

	let dirty = false;
	$effect(() => {
		void props.x, props.y, props.width, props.height, props.dents, props.breathAt;
		dirty = true;
	});
	$effect(() => {
		// read the prop first: an effect that bails before reading it would
		// never run again
		const a = props.flash;
		if (flashMesh) flashMesh.alpha = a;
	});
</script>
