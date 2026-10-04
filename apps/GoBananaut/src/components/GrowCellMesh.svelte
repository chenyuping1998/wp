<script lang="ts">
	import { Container, Graphics, Mesh, MeshGeometry, Rectangle, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { SYMBOL_SIZE } from '../game/constants';

	type Props = { left: number; top: number; phase: number };
	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();
	const S = SYMBOL_SIZE;
	const COLS = 10;
	const ROWS = 8;
	const smooth = (n: number) => {
		const t = Math.max(0, Math.min(1, n));
		return t * t * (3 - 2 * t);
	};

	let root: Container | null = null;
	let mesh: Mesh | null = null;
	let geometry: MeshGeometry | null = null;
	let positions: Float32Array | null = null;

	const update = () => {
		if (!root || !mesh || !geometry || !positions) return;
		const p = Math.max(0, Math.min(1, props.phase));
		const load = smooth(p / 0.24);
		const q = Math.max(0, (p - 0.52) / 0.48);
		const release = p < 0.52 ? 1 : Math.exp(-4.5 * q) * Math.cos(q * Math.PI * 2.4);
		const push = 7 * load * release;
		mesh.alpha = 0.48 * load * (1 - smooth((p - 0.58) / 0.35));
		root.position.set(props.left, props.top);
		for (let row = 0; row <= ROWS; row += 1) {
			const v = row / ROWS;
			for (let col = 0; col <= COLS; col += 1) {
				const u = col / COLS;
				const crown = Math.sin(Math.PI * u) ** 2;
				const i = (row * (COLS + 1) + col) * 2;
				positions[i] = u * S;
				// The lower edge remains on the shutter sill; the top of the new
				// socket bows upward as pressure travels into the empty row.
				positions[i + 1] = v * S - push * crown * (1 - v);
			}
		}
		geometry.getBuffer('aPosition').update();
	};

	onMount(() => {
		const renderer = app.stateApp.pixiApplication?.renderer;
		if (!renderer) return;
		const art = new Graphics();
		art.roundRect(3, 3, S - 6, S - 6, 7).stroke({ width: 2.5, color: 0xa9e8ff, alpha: 0.95 });
		art.rect(9, S - 7, S - 18, 3).fill({ color: 0xd8f4ff, alpha: 0.85 });
		const texture: Texture = renderer.generateTexture({ target: art, frame: new Rectangle(0, 0, S, S), resolution: 2 });
		art.destroy();

		positions = new Float32Array((COLS + 1) * (ROWS + 1) * 2);
		const uvs = new Float32Array(positions.length);
		const indices: number[] = [];
		for (let row = 0; row <= ROWS; row += 1) {
			for (let col = 0; col <= COLS; col += 1) {
				const i = (row * (COLS + 1) + col) * 2;
				uvs[i] = col / COLS;
				uvs[i + 1] = row / ROWS;
				if (row === ROWS || col === COLS) continue;
				const a = row * (COLS + 1) + col, b = a + 1, d = a + COLS + 1, e = d + 1;
				indices.push(a, b, e, a, e, d);
			}
		}
		geometry = new MeshGeometry({ positions, uvs, indices: new Uint32Array(indices) });
		mesh = new Mesh({ geometry, texture });
		root = new Container();
		root.addChild(mesh);
		parent.parent.addChild(root);
		update();
		return () => {
			root?.removeFromParent();
			root?.destroy({ children: true });
			geometry?.destroy();
			texture.destroy(true);
		};
	});

	$effect(() => {
		void props.left, props.top, props.phase;
		update();
	});
</script>
