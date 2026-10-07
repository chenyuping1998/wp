<script lang="ts">
	/**
	 * ONE REEL'S SHUTTER AS A MESH (ReelLid.svelte owns the motion).
	 *
	 * The shutter used to be redrawn as flat rectangles every frame, so all it
	 * could do was slide. Now its full height — two slats, the rails, the brass
	 * sill and the shadow it throws onto the reel — is painted ONCE into a
	 * texture, and a grid mesh shows the bottom `gap` of it: at rest it is the
	 * same picture as before. What the mesh adds is the STRAIN. Before a reel
	 * grows, the reel underneath pushes on the sill, so the shutter bows up in the
	 * middle (the rails at its sides stay put) and trembles, then gives way; in
	 * the free spins it breathes, a pressurised hatch.
	 *
	 *   bulge    px the middle of the sill is pushed UP; it falls off toward the
	 *            rails across the shutter and toward the housing up it — the
	 *            plates nearest the push move most
	 *   tremble  px of sideways shake, riding the same profile
	 *
	 * Wrap it in its own <Container>: the mesh attaches on mount, and without a
	 * slot of its own it would land on top of the overlay drawn after it.
	 */
	import { Container, Graphics, Mesh, MeshGeometry, Rectangle, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { SYMBOL_SIZE } from '../game/constants';

	type Props = {
		cx: number;
		/** px of shutter showing, from the housing (y 0) down to the sill */
		gap: number;
		bulge: number;
		tremble: number;
		/** paints the full-height shutter into `g`, centred on x = SYMBOL_SIZE / 2 */
		paint: (g: Graphics, fullGap: number) => void;
	};
	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();

	const S = SYMBOL_SIZE;
	// the texture: two rows of shutter, plus the shadow under the sill
	const FULL = 2 * S;
	const SHADOW = 12;
	const TH = FULL + SHADOW;
	const COLS = 10;
	const ROWS = 16;
	// the shutter's own width between its rails, as ReelLid draws it
	const W = S - 12;

	let mesh: Mesh | null = null;
	let positions: Float32Array | null = null;
	let uvs: Float32Array | null = null;
	let geometry: MeshGeometry | null = null;
	let clock = 0;

	onMount(() => {
		const renderer = app.stateApp.pixiApplication?.renderer;
		if (!renderer) return;
		const g = new Graphics();
		props.paint(g, FULL);
		const texture: Texture = renderer.generateTexture({ target: g, frame: new Rectangle(0, 0, S, TH), resolution: 2 });
		g.destroy();

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
		const root = new Container();
		root.addChild(mesh);
		parent.parent.addChild(root);
		update();

		return () => {
			root.removeFromParent();
			root.destroy({ children: true });
			texture.destroy(true);
		};
	});

	// the arch across the shutter: 1 in the middle, 0 at its rails
	const arch = (x: number) => {
		const u = (x - S / 2) / (W / 2);
		return Math.abs(u) >= 1 ? 0 : 1 - u * u;
	};

	const update = () => {
		if (!mesh || !positions || !uvs || !geometry) return;
		const gap = props.gap;
		mesh.visible = gap > 0.5;
		if (!mesh.visible) return;
		// the texture row that sits at the housing edge (y 0)
		const t0 = Math.max(0, FULL - gap);
		clock += 1;
		for (let r = 0; r <= ROWS; r++) {
			const t = t0 + ((TH - t0) * r) / ROWS;
			const y = gap - FULL + t;
			// up the shutter: the sill takes the push, the plates at the housing none
			const up = Math.min(1, Math.max(0, y / Math.max(1, gap)));
			const fv = up * up * (3 - 2 * up);
			for (let c = 0; c <= COLS; c++) {
				const tx = (S * c) / COLS;
				const a = arch(tx) * fv;
				const i = (r * (COLS + 1) + c) * 2;
				positions[i] = props.cx - S / 2 + tx + props.tremble * a * Math.sin(clock * 1.9 + r * 0.7);
				positions[i + 1] = Math.max(0, y - props.bulge * a);
				uvs[i] = c / COLS;
				uvs[i + 1] = t / TH;
			}
		}
		geometry.getBuffer('aPosition').update();
		geometry.getBuffer('aUV').update();
	};

	$effect(() => {
		// read every prop the pose depends on, so any change redraws it
		void props.gap, props.bulge, props.tremble, props.cx;
		update();
	});
</script>
