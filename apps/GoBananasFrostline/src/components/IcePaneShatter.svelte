<script lang="ts" module>
	/** when the first shard lets go — EntryReveal fires the crack on it */
	export const BREAK_MS = 380;
	/** when the last shard is gone */
	export const SHATTER_END_MS = 1240;
</script>

<script lang="ts">
	/**
	 * THE BOARD FROZEN OVER, SHATTERED (EntryReveal). Go Bananas Boat opens on
	 * its board under a tarp that is yanked off; Frostline opens on its board
	 * under a pane of frosted ice (gbEntryIce), which:
	 *
	 *   STRAINS  shivers in its frame while cracks run out from the middle,
	 *            front by front, to the rim
	 *   BREAKS   at BREAK_MS, from the centre outward: each shard lets go a
	 *            little after the one nearer the middle, is thrown out from the
	 *            centre with a kick upward, spins, and falls under gravity,
	 *            shrinking as it goes
	 *
	 * One mesh, its triangles NOT sharing vertices — every triangle is a shard
	 * that can leave on its own. The shard grid is jittered (seeded, the same
	 * every load), so the cracks run crooked, as cracks do.
	 *
	 * A function of `t` (ms since the reveal began). Centred on (x, y),
	 * `width` x `height`.
	 */
	import { Container, Graphics, Mesh, MeshGeometry, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	type Props = { x: number; y: number; width: number; height: number; t: number };
	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();

	/** how much later the rim lets go than the centre */
	const SPREAD_MS = 140;
	/** the crack front's run from the centre to the rim, before the break */
	const CRACK_FROM = 90;
	const GRAVITY = 2600; // px/s²
	const COLS = 10, ROWS = 6;
	const IMPACT = [0.5, 0.46];

	let seed = 1999;
	const rand = () => {
		seed = (seed * 16807) % 2147483647;
		return (seed - 1) / 2147483646;
	};

	// the jittered lattice the pane breaks along (unit coordinates)
	const lattice: [number, number][][] = [];
	for (let r = 0; r <= ROWS; r++) {
		const row: [number, number][] = [];
		for (let c = 0; c <= COLS; c++) {
			const edgeU = c === 0 || c === COLS, edgeV = r === 0 || r === ROWS;
			row.push([
				(c + (edgeU ? 0 : (rand() - 0.5) * 0.7)) / COLS,
				(r + (edgeV ? 0 : (rand() - 0.5) * 0.7)) / ROWS,
			]);
		}
		lattice.push(row);
	}

	type Shard = {
		uv: [number, number][];
		centre: [number, number];
		/** 0 at the impact, 1 at the farthest corner */
		dist: number;
		/** px/s, before the board's size is known: a unit direction and a speed */
		dir: [number, number];
		speed: number;
		spin: number;
	};
	const shards: Shard[] = [];
	const far = Math.hypot(0.5, 0.54);
	for (let r = 0; r < ROWS; r++)
		for (let c = 0; c < COLS; c++) {
			const a = lattice[r][c], b = lattice[r][c + 1], d = lattice[r + 1][c], e = lattice[r + 1][c + 1];
			const tris = (r + c) % 2 ? [[a, b, e], [a, e, d]] : [[a, b, d], [b, e, d]];
			for (const uv of tris) {
				const centre: [number, number] = [(uv[0][0] + uv[1][0] + uv[2][0]) / 3, (uv[0][1] + uv[1][1] + uv[2][1]) / 3];
				const dx = centre[0] - IMPACT[0], dy = centre[1] - IMPACT[1];
				const len = Math.hypot(dx, dy) || 1;
				shards.push({
					uv: uv as [number, number][],
					centre,
					dist: Math.min(1, len / far),
					dir: [dx / len, dy / len],
					speed: 0.35 + rand() * 0.45,
					spin: (rand() - 0.5) * 9,
				});
			}
		}

	const V = shards.length * 3;
	const uvs = new Float32Array(V * 2);
	const indices = new Uint32Array(V);
	shards.forEach((s, k) => {
		s.uv.forEach(([u, v], j) => uvs.set([u, v], (k * 3 + j) * 2));
		indices.set([k * 3, k * 3 + 1, k * 3 + 2], k * 3);
	});
	const positions = new Float32Array(V * 2);

	const root = new Container();
	const cracks = new Graphics();
	let geometry: MeshGeometry | undefined;
	let mesh: Mesh | undefined;

	const smooth = (v: number) => {
		const x = Math.max(0, Math.min(1, v));
		return x * x * (3 - 2 * x);
	};

	const pose = () => {
		if (!geometry || !mesh) return;
		const { x: cx, y: cy, width: w, height: h, t } = props;
		const left = cx - w / 2, top = cy - h / 2;
		// the strain: a fine shiver building to the break
		const strain = t < BREAK_MS ? smooth(t / BREAK_MS) : 0;
		const shiver = 2.2 * strain * Math.sin(t / 11);
		// the crack front, as a fraction of the way to the rim
		const front = smooth((t - CRACK_FROM) / (BREAK_MS - CRACK_FROM)) * 1.05;
		const reach = Math.hypot(w, h) / 2;

		shards.forEach((s, k) => {
			const release = BREAK_MS + s.dist * SPREAD_MS;
			const tau = Math.max(0, (t - release) / 1000);
			const ox = left + s.centre[0] * w, oy = top + s.centre[1] * h;
			// thrown out from the centre, kicked up a little, then falling
			const v = s.speed * reach * 1.6;
			const px = ox + shiver + s.dir[0] * v * tau;
			const py = oy + (s.dir[1] * v - reach * 0.55) * tau + 0.5 * GRAVITY * tau * tau;
			const ang = s.spin * tau;
			const cos = Math.cos(ang), sin = Math.sin(ang);
			const scale = Math.max(0, 1 - 0.9 * tau);
			s.uv.forEach(([u, vv], j) => {
				const lx = (u - s.centre[0]) * w * scale, ly = (vv - s.centre[1]) * h * scale;
				positions[(k * 3 + j) * 2] = px + lx * cos - ly * sin;
				positions[(k * 3 + j) * 2 + 1] = py + lx * sin + ly * cos;
			});
		});
		geometry.getBuffer('aPosition').update();

		// the cracks: each shard's edges, drawn once the front has passed it.
		// Gone at the break — from then on the gaps between shards are the cracks.
		cracks.clear();
		if (t < BREAK_MS + 30) {
			for (const s of shards) {
				if (s.dist > front) continue;
				const pts = s.uv.map(([u, v]) => [left + shiver + u * w, top + v * h]);
				cracks.poly(pts.flat(), true);
			}
			cracks.stroke({ width: 4, color: 0x0d3a5c, alpha: 0.35 });
			for (const s of shards) {
				if (s.dist > front) continue;
				const pts = s.uv.map(([u, v]) => [left + shiver + u * w, top + v * h]);
				cracks.poly(pts.flat(), true);
			}
			cracks.stroke({ width: 1.6, color: 0xffffff, alpha: 0.9 });
		}

		const life = (t - BREAK_MS) / (SPREAD_MS + 700);
		mesh.alpha = 1 - smooth((life - 0.7) / 0.3);
		root.visible = mesh.alpha > 0.01;
	};

	$effect(() => {
		void [props.x, props.y, props.width, props.height, props.t];
		pose();
	});

	onMount(() => {
		const texture = app.stateApp.loadedAssets?.gbEntryIce as Texture | undefined;
		if (!texture) {
			console.error('IcePaneShatter: gbEntryIce not loaded');
			return;
		}
		geometry = new MeshGeometry({ positions, uvs, indices });
		mesh = new Mesh({ geometry, texture });
		root.addChild(mesh);
		root.addChild(cracks);
		parent.parent.addChild(root);
		pose();
		return () => {
			root.removeFromParent();
			root.destroy({ children: true });
			geometry?.destroy();
		};
	});
</script>
