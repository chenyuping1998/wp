<script lang="ts">
	/**
	 * A win line as a ribbon of light through a mesh, laid behind the scarab
	 * walking it (ScarabRunner reports how far it has got).
	 *
	 * It was four stacked Graphics strokes — a dark one, a wide faint one, the
	 * colour and a white hairline — flat-ended and rigid, drawn reel by reel. Now
	 * it is one strip of quads along the path, drawn three times through the same
	 * cross-section (design/generate_mesh_fx.mjs line_ribbon.png): the scorch
	 * under it, the line's own colour, and a white-hot core. And it moves:
	 *
	 *   lay     it follows the scarab continuously, its head drawn to a point
	 *           just behind the beetle
	 *   pulse   beads of light run down it from the start, a swelling of the
	 *           ribbon that travels
	 *   pluck   when the scarab arrives the line is pulled taut and twangs —
	 *           a sideways wobble, largest in the middle, dying in half a second
	 *   shimmer while it holds, a pixel of ripple travelling along it
	 *
	 * Rebuilt every frame from a fixed number of samples, so the geometry never
	 * changes size. Inserted in markup order (addToParent): under the scarabs.
	 */
	import { Container, Mesh, MeshGeometry, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	type Point = { x: number; y: number };
	type Props = {
		points: Point[];
		color: number;
		/** how far the scarab has got, 0..1 — read every frame */
		travel: () => number;
		/** 0.7 when many lines run at once (WinLines' lineScale) */
		scale?: number;
	};

	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();

	const N = 56;
	const HALF_W = 9;
	const HEAD_TAPER = 34;
	const TAIL_TAPER = 10;

	const root = new Container();
	root.label = 'winLineRibbon';
	parent.addToParent(root);

	// the polyline's cumulative lengths
	const lengths = [0];
	for (let i = 1; i < props.points.length; i++) {
		const a = props.points[i - 1], b = props.points[i];
		lengths.push(lengths[i - 1] + Math.hypot(b.x - a.x, b.y - a.y));
	}
	const total = lengths[lengths.length - 1];
	const at = (s: number): Point => {
		let i = 1;
		while (i < lengths.length - 1 && lengths[i] < s) i++;
		const a = props.points[i - 1], b = props.points[i];
		const seg = lengths[i] - lengths[i - 1] || 1;
		const f = Math.max(0, Math.min(1, (s - lengths[i - 1]) / seg));
		return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
	};

	onMount(() => {
		const texture = app.stateApp.loadedAssets?.fxLineRibbon as Texture | undefined;
		if (!texture || total <= 0) {
			if (!texture) console.error('WinLineRibbon: fxLineRibbon not loaded');
			return;
		}
		const uvs = new Float32Array(N * 4);
		const indices = new Uint32Array((N - 1) * 6);
		for (let i = 0; i < N; i++) {
			const u = i / (N - 1);
			uvs.set([u, 0, u, 1], i * 4);
			if (i < N - 1) {
				const a = i * 2;
				indices.set([a, a + 1, a + 2, a + 1, a + 3, a + 2], i * 6);
			}
		}
		// the scorch, the colour, the core: one cross-section at three widths
		const layers = [
			{ width: 1.9, tint: 0x1a1206, alpha: 0.5, add: false },
			{ width: 1, tint: props.color, alpha: 0.95, add: true },
			{ width: 0.42, tint: 0xffffff, alpha: 0.75, add: true },
		].map((spec) => {
			const positions = new Float32Array(N * 4);
			const geometry = new MeshGeometry({ positions, uvs, indices });
			const mesh = new Mesh({ geometry, texture });
			mesh.tint = spec.tint;
			mesh.alpha = spec.alpha;
			if (spec.add) mesh.blendMode = 'add';
			root.addChild(mesh);
			return { ...spec, positions, geometry, mesh };
		});

		const started = performance.now();
		let arrivedAt = -1;
		const centre = new Float32Array(N * 2);
		const normal = new Float32Array(N * 2);
		const halfw = new Float32Array(N);

		const tick = () => {
			const now = performance.now();
			const ms = now - started;
			const travel = Math.max(0, Math.min(1, props.travel()));
			const drawn = total * travel;
			for (const l of layers) l.mesh.visible = drawn > 4;
			if (drawn <= 4) return;
			if (travel >= 1 && arrivedAt < 0) arrivedAt = ms;

			const k = props.scale ?? 1;
			const since = arrivedAt < 0 ? -1 : ms - arrivedAt;
			// the pluck: a fast sideways wobble, biggest mid-line, gone in ~0.5s
			const pluck = since < 0 ? 0 : 6 * Math.exp(-since / 170) * Math.sin((2 * Math.PI * since) / 95);
			// a bead of light every 520ms, running at 0.9 px/ms from the start
			const beadSpacing = 0.9 * 520;
			for (let i = 0; i < N; i++) {
				const s = (drawn * i) / (N - 1);
				const p = at(s);
				centre[i * 2] = p.x;
				centre[i * 2 + 1] = p.y;
				// head drawn to a point, the tail softly rounded
				const head = Math.min(1, (drawn - s) / HEAD_TAPER);
				const tail = Math.min(1, s / TAIL_TAPER);
				let w = HALF_W * k * Math.sqrt(Math.max(0, head)) * (0.6 + 0.4 * tail);
				const bead = (((s - ms * 0.9) % beadSpacing) + beadSpacing) % beadSpacing;
				w *= 1 + 0.45 * Math.exp(-(((Math.min(bead, beadSpacing - bead)) / 16) ** 2));
				halfw[i] = w;
			}
			for (let i = 0; i < N; i++) {
				const a = Math.max(0, i - 1), b = Math.min(N - 1, i + 1);
				const dx = centre[b * 2] - centre[a * 2], dy = centre[b * 2 + 1] - centre[a * 2 + 1];
				const len = Math.hypot(dx, dy) || 1;
				normal[i * 2] = -dy / len;
				normal[i * 2 + 1] = dx / len;
			}
			for (let i = 0; i < N; i++) {
				const s01 = i / (N - 1);
				const shimmer = arrivedAt < 0 ? 0 : 0.9 * Math.sin(s01 * 14 - ms / 110);
				const side = (pluck * Math.sin(Math.PI * s01) + shimmer) * (travel >= 1 ? 1 : 0);
				const cx = centre[i * 2] + normal[i * 2] * side;
				const cy = centre[i * 2 + 1] + normal[i * 2 + 1] * side;
				for (const l of layers) {
					const w = halfw[i] * l.width;
					l.positions[i * 4] = cx + normal[i * 2] * w;
					l.positions[i * 4 + 1] = cy + normal[i * 2 + 1] * w;
					l.positions[i * 4 + 2] = cx - normal[i * 2] * w;
					l.positions[i * 4 + 3] = cy - normal[i * 2 + 1] * w;
				}
			}
			for (const l of layers) l.geometry.getBuffer('aPosition').update();
		};
		tick();
		const ticker = app.stateApp.pixiApplication?.ticker;
		ticker?.add(tick);
		return () => {
			ticker?.remove(tick);
			for (const l of layers) {
				l.mesh.destroy();
				l.geometry.destroy();
			}
		};
	});
</script>
