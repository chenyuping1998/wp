<script lang="ts">
	/**
	 * ONE PUFF FROM THE BACKPACK'S THRUSTER (Mascot.svelte fires them in the free
	 * spins, as his drift turns). A plume, not a sprite fading: a grid mesh over
	 * the soft glow texture, laid along the jet — it shoots out, widens toward its
	 * far end, flutters as it goes, and thins away over PUFF_MS. Ice, the colour of
	 * what is live (palette.ts); additive, so it reads as gas lit by the hull.
	 *
	 * Wrap it in its own <Container>, as the other mesh components.
	 */
	import { Container, Mesh, MeshGeometry, Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	type Props = {
		x: number;
		y: number;
		/** radians: the way the jet points */
		angle: number;
		/** px: how long the plume reaches */
		length: number;
		/** peak opacity (0.75) and colour (ice) — the airlock's leak is fainter and greyer */
		alpha?: number;
		tint?: number;
		oncomplete?: () => void;
	};
	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();

	const PUFF_MS = 650;
	const COLS = 6, ROWS = 10;

	onMount(() => {
		const tex = (app.stateApp.loadedAssets?.fxGlow as Texture | undefined) ?? Texture.EMPTY;
		const count = (COLS + 1) * (ROWS + 1);
		const positions = new Float32Array(count * 2);
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
		const geometry = new MeshGeometry({ positions, uvs, indices: new Uint32Array(indices) });
		const mesh = new Mesh({ geometry, texture: tex });
		mesh.blendMode = 'add';
		mesh.tint = props.tint ?? 0xd8f4ff;
		const root = new Container();
		root.addChild(mesh);
		root.position.set(props.x, props.y);
		root.rotation = props.angle;
		parent.parent.addChild(root);

		const born = performance.now();
		const ticker = app.stateApp.pixiApplication?.ticker;
		const tick = () => {
			const t = Math.min(1, (performance.now() - born) / PUFF_MS);
			const reach = props.length * (1 - (1 - t) ** 3);
			for (let r = 0; r <= ROWS; r++) {
				const v = r / ROWS;
				// narrow at the nozzle, wide where the gas has spread
				const half = (5 + 30 * v) * (0.45 + 0.55 * t);
				const flutter = Math.sin(v * 6 + t * 11) * 5 * v;
				for (let c = 0; c <= COLS; c++) {
					const u = -1 + (2 * c) / COLS;
					const i = (r * (COLS + 1) + c) * 2;
					// x along the jet, y across it
					positions[i] = v * reach;
					positions[i + 1] = u * half + flutter;
				}
			}
			geometry.getBuffer('aPosition').update();
			mesh.alpha = (props.alpha ?? 0.75) * (1 - t) ** 1.5;
			if (t >= 1) {
				ticker?.remove(tick);
				props.oncomplete?.();
			}
		};
		ticker?.add(tick);
		tick();
		return () => {
			ticker?.remove(tick);
			root.removeFromParent();
			root.destroy({ children: true });
			geometry.destroy();
		};
	});
</script>
