<script lang="ts" module>
	import { buildPlaqueGrid, type PlaqueGrid } from '../game/meshWin/plaque';

	// one grid for every plaque — it depends only on the art's size
	let sharedGrid: PlaqueGrid | null = null;
	const gridFor = () => (sharedGrid ??= buildPlaqueGrid());
</script>

<script lang="ts">
	/**
	 * The big-win plaque through a mesh (game/meshWin/plaque.ts): the impact
	 * ripple and crest jolt on the slam, a second ripple when the amount lands,
	 * and a hung-sign sway while it holds. Replaces the plaque Sprite and its
	 * additive blink copy in Win.svelte; the blink is the same mesh again,
	 * additive, sharing the geometry so it deforms with it.
	 *
	 * Built imperatively (pixi-svelte has no Mesh) and hung on the parent
	 * container at mount — which, mounting with its siblings, keeps its place in
	 * the markup's order: over the glow bed, under the twinkles and the amount.
	 */
	import { Container, Mesh, MeshGeometry, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { PLAQUE, posePlaque } from '../game/meshWin/plaque';

	type Props = {
		/** the plaque's sprite key (gbWinBanner*) */
		textureKey: string;
		width: number;
		height: number;
		/** seconds since the presentation's FX clock started */
		t: number;
		/** seconds since the count-up landed, <0 before */
		landAge: number;
		/** the tier's intensity */
		mult: number;
		/** alpha of the additive flare */
		blink: number;
	};

	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();

	const root = new Container();
	let geometry: MeshGeometry | null = null;
	let positions: Float32Array | null = null;
	let flare: Mesh | null = null;

	onMount(() => {
		const texture = app.stateApp.loadedAssets?.[props.textureKey] as Texture | undefined;
		if (!texture) {
			console.error(`PlaqueMesh: ${props.textureKey} not loaded`);
			return;
		}
		const grid = gridFor();
		positions = new Float32Array(grid.rest);
		geometry = new MeshGeometry({ positions, uvs: grid.uvs, indices: grid.indices });
		const plaque = new Mesh({ geometry, texture });
		flare = new Mesh({ geometry, texture });
		flare.blendMode = 'add';
		flare.alpha = 0;
		const content = new Container();
		content.position.set(-PLAQUE.w / 2, -PLAQUE.h / 2);
		content.addChild(plaque, flare);
		root.addChild(content);
		parent.parent.addChild(root);
		return () => {
			root.removeFromParent();
			root.destroy({ children: true });
			geometry?.destroy();
			geometry = positions = flare = null;
		};
	});

	$effect(() => {
		const { t, landAge, mult, blink, width, height } = props;
		if (!geometry || !positions || !flare) return;
		posePlaque(gridFor(), Math.max(0, t), landAge, mult, positions);
		geometry.getBuffer('aPosition').update();
		root.scale.set(width / PLAQUE.w, height / PLAQUE.h);
		flare.alpha = blink;
	});
</script>
