<script lang="ts">
	/**
	 * A BACKGROUND PLATE AS A MESH (Background.svelte places it).
	 *
	 * The plates are one painting each, and until now the only thing that moved on
	 * them was the whole plate, drifting. Two things in the paintings are meant to
	 * move, and a grid over the plate lets them move without cutting anything out:
	 *
	 *   THE CABLES   the loops hanging from the hull's ceiling either side of the
	 *                board sway: a small drift aboard, a slow wide one in the free
	 *                spins, where everything is floating. Each field is zero at the
	 *                ceiling and at the wall the loop is fastened to, so the ends
	 *                hold and only the slack moves. The fields sit over the dark
	 *                window between the walls, so nothing rigid is bent with them —
	 *                on the feature plate the teal light curtains there sway along,
	 *                which reads as the glow drifting.
	 *   THE PLANET   (feature plate) its bands creep across its face — a UV drift
	 *                inside the disc, most at the middle and none at the rim, so the
	 *                outline never moves — and slowly back, over ~16s.
	 *
	 * Coordinates are the plate's own pixels (1365x768), measured off the paintings
	 * 2026-09-28. Wrap it in its own <Container>, as the other mesh components.
	 */
	import { ColorMatrixFilter, Container, Mesh, MeshGeometry, Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	type Props = {
		textureKey: string;
		x: number;
		y: number;
		width: number;
		height: number;
		/** seconds, from Background's clock */
		clock: number;
		/** px (plate) of cable sway at the loops' slack */
		sway: number;
		/** slower and wider in zero-g */
		floating: boolean;
		planet?: boolean;
		/** the plate's exposure: `gain` multiplies, `lift` (0..1) raises the
		 *  blacks, so a dark painting opens up without its darks going grey */
		exposure?: { gain: number; lift: number };
	};
	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();

	const PW = 1365, PH = 768;
	const COLS = 64, ROWS = 36;

	const smooth = (t: number) => {
		const k = Math.max(0, Math.min(1, t));
		return k * k * (3 - 2 * k);
	};
	// the slack of each group of loops: [x0, x1, y0 (ceiling), y1, fade]
	const CABLES = [
		{ x0: 245, x1: 475, y0: 118, y1: 330, fade: 38, phase: 0 },
		{ x0: 935, x1: 1045, y0: 118, y1: 215, fade: 26, phase: 1.7 },
	];
	const PLANET = { x: 445, y: -12, r: 122 };

	let positions: Float32Array | null = null;
	let uvs: Float32Array | null = null;
	let geometry: MeshGeometry | null = null;
	let root: Container | null = null;
	let mesh: Mesh | null = null;
	// the loading screen can mount this before its plate has loaded: start on an
	// empty texture and take the plate up when it arrives (as PlateMesh does)
	const plate = () => app.stateApp.loadedAssets?.[props.textureKey] as Texture | undefined;

	const layout = () => {
		if (!positions || !uvs || !geometry || !root) return;
		if (mesh && mesh.texture === Texture.EMPTY) {
			const tex = plate();
			if (tex) mesh.texture = tex;
		}
		const t = props.clock;
		const speed = props.floating ? 0.45 : 1;
		const planetDrift = props.planet ? 3.2 * Math.sin((2 * Math.PI * t) / 16) : 0;
		for (let r = 0; r <= ROWS; r++) {
			const py = (PH * r) / ROWS;
			for (let c = 0; c <= COLS; c++) {
				const px = (PW * c) / COLS;
				let dx = 0, dy = 0;
				for (const cb of CABLES) {
					const w =
						smooth((px - cb.x0) / cb.fade) * smooth((cb.x1 - px) / cb.fade) *
						smooth((py - cb.y0) / (cb.fade * 1.4)) * smooth((cb.y1 - py) / cb.fade);
					if (w <= 0) continue;
					// the loops lower down swing a little later: a wave down the slack
					const a = t * 1.1 * speed + cb.phase - py * 0.006;
					dx += props.sway * w * Math.sin(a);
					dy += 0.35 * props.sway * w * Math.sin(a * 0.7 + 0.9);
				}
				const i = (r * (COLS + 1) + c) * 2;
				positions[i] = (px + dx) / PW;
				positions[i + 1] = (py + dy) / PH;
				let u = px / PW;
				if (planetDrift) {
					const d = Math.hypot(px - PLANET.x, py - PLANET.y) / PLANET.r;
					if (d < 1) u -= (planetDrift * Math.sqrt(1 - d * d) * smooth((1 - d) / 0.25)) / PW;
				}
				uvs[i] = u;
				uvs[i + 1] = py / PH;
			}
		}
		geometry.getBuffer('aPosition').update();
		geometry.getBuffer('aUV').update();
		root.position.set(props.x, props.y);
		root.scale.set(props.width, props.height);
	};

	onMount(() => {
		const texture = plate() ?? Texture.EMPTY;
		const count = (COLS + 1) * (ROWS + 1);
		positions = new Float32Array(count * 2);
		uvs = new Float32Array(count * 2);
		const indices: number[] = [];
		for (let r = 0; r < ROWS; r++)
			for (let c = 0; c < COLS; c++) {
				const a = r * (COLS + 1) + c, b = a + 1, d = a + COLS + 1, e = d + 1;
				indices.push(a, b, e, a, e, d);
			}
		geometry = new MeshGeometry({ positions, uvs, indices: new Uint32Array(indices) });
		mesh = new Mesh({ geometry, texture });
		if (props.exposure) {
			const { gain: g, lift: l } = props.exposure;
			const cm = new ColorMatrixFilter();
			cm.matrix = [g, 0, 0, 0, l, 0, g, 0, 0, l, 0, 0, g, 0, l, 0, 0, 0, 1, 0];
			mesh.filters = [cm];
		}
		root = new Container();
		root.addChild(mesh);
		parent.parent.addChild(root);
		layout();
		return () => {
			root?.removeFromParent();
			root?.destroy({ children: true });
			geometry?.destroy();
		};
	});

	$effect(() => {
		void props.clock, props.x, props.y, props.width, props.height, props.sway, props.floating;
		layout();
	});
</script>
