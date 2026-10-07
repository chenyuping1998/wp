<script lang="ts">
	/**
	 * A plate drawn through a mesh so it can FLEX: the free-spin counter's brass
	 * plaque (FreeSpinCounter.svelte), hung from a hook above it.
	 *
	 * Two things a rigid sprite cannot do, both small:
	 *   bend   the lower edge lags behind the swing — the plate turns a little
	 *          less at its top than at its bottom while it is moving, which is
	 *          what makes a hung sign read as heavy rather than as a card on a pin
	 *   droop  the plate's two ends flex down past its middle, as when a hung
	 *          sign is caught short by its chain (the FS sign, FreeSpinAnimation):
	 *          a quadratic sag away from the pivot's column, px at the ends
	 *   (the squash is the parent's scale, so the text squashes with it)
	 *
	 * Drawn into the pixi container it is mounted in, at (0, 0), `width` x
	 * `height` — the same box the Sprite it replaces had. UVs cover the whole
	 * texture (on WebGPU pixi 8.8.1's mesh ignores a texture's frame; see
	 * SymbolMeshWin).
	 */
	import { Mesh, MeshGeometry, Container, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	type Props = {
		/** asset key of the plate */
		key: string;
		width: number;
		height: number;
		/** the point it hangs from, in the plate's own box */
		pivotX: number;
		pivotY: number;
		/** extra turn of the lower edge, radians (grows linearly down the plate) */
		bend: number;
		/** px the plate's left and right ends sag below its middle (+ down) */
		droop?: number;
	};

	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();

	const COLS = 10;
	const ROWS = 8;
	const root = new Container();
	let positions: Float32Array | undefined;
	let geometry: MeshGeometry | undefined;

	const uvs = new Float32Array((COLS + 1) * (ROWS + 1) * 2);
	const indices = new Uint32Array(COLS * ROWS * 6);
	for (let r = 0, i = 0; r <= ROWS; r++)
		for (let c = 0; c <= COLS; c++, i += 2) {
			uvs[i] = c / COLS;
			uvs[i + 1] = r / ROWS;
		}
	for (let r = 0, k = 0; r < ROWS; r++)
		for (let c = 0; c < COLS; c++) {
			const a = r * (COLS + 1) + c;
			indices.set([a, a + 1, a + COLS + 2, a, a + COLS + 2, a + COLS + 1], k);
			k += 6;
		}

	const pose = () => {
		if (!positions || !geometry) return;
		const { width: w, height: h, pivotX: px, pivotY: py, bend } = props;
		const droop = props.droop ?? 0;
		for (let r = 0, i = 0; r <= ROWS; r++)
			for (let c = 0; c <= COLS; c++, i += 2) {
				const x = (c / COLS) * w;
				const side = (x - px) / (w / 2);
				const y = (r / ROWS) * h + droop * side * side;
				// the turn grows with depth below the plate's top: the top edge
				// stays where the chains hold it, the bottom swings a beat behind
				const a = bend * (y / h);
				const dx = x - px, dy = y - py;
				positions[i] = px + dx * Math.cos(a) - dy * Math.sin(a);
				positions[i + 1] = py + dx * Math.sin(a) + dy * Math.cos(a);
			}
		geometry.getBuffer('aPosition').update();
	};

	$effect(() => {
		// read every prop so the effect re-runs on any of them
		void [props.width, props.height, props.pivotX, props.pivotY, props.bend, props.droop];
		pose();
	});

	onMount(() => {
		const texture = app.stateApp.loadedAssets?.[props.key] as Texture | undefined;
		if (!texture) {
			console.error(`PlaqueMesh: ${props.key} not loaded`);
			return;
		}
		positions = new Float32Array(uvs.length);
		geometry = new MeshGeometry({ positions, uvs, indices });
		pose();
		root.addChild(new Mesh({ geometry, texture }));
		parent.parent.addChild(root);
		return () => {
			root.removeFromParent();
			root.destroy({ children: true });
			geometry?.destroy();
		};
	});
</script>
