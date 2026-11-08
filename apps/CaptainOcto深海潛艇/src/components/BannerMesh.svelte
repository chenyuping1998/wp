<script lang="ts">
	/**
	 * The big-win plaque drawn through a mesh (game/meshWin/banner.ts): jelly
	 * after the slam, the title bulging on the hit and with each flare, and a
	 * squash when the count-up lands. Replaces the plaque's two Sprites in
	 * Win.svelte — the plaque and its additive flare copy — which now share one
	 * geometry here, so the flare follows the wobble.
	 *
	 * Centred on its container, like the anchor-0.5 sprite it replaces.
	 * Driven by setInterval, not the frame loop, so it keeps time in a hidden tab.
	 */
	import { Mesh, MeshGeometry, Container, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { buildRig, skin } from '../game/meshWin/meshRig';
	import { bannerSpec, BANNER_CANVAS } from '../game/meshWin/banner';

	type Props = {
		key: string;
		width: number;
		height: number;
		/** Win.svelte's additive flare, 0..1 */
		blink: number;
		/** the count-up has landed on its final amount */
		landed: boolean;
	};
	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();

	// Added through pixi-svelte's own addToParent, which queues the add in THIS
	// component's onMount — so it lands in sibling order: over the glow bed that
	// comes before it in Win.svelte, under the twinkles and the rolling amount
	// that come after. (It also destroys the root on unmount.)
	const root = new Container();
	root.label = 'bannerMesh';
	parent.addToParent(root);

	let landedAt = -1;
	$effect(() => {
		if (props.landed && landedAt < 0) landedAt = Date.now();
		if (!props.landed) landedAt = -1;
	});

	onMount(() => {
		const spec = bannerSpec(props.key);
		const rig = buildRig(spec.rig);
		const positions = new Float32Array(rig.rest);
		let geometry: MeshGeometry | null = null;
		let plate: Mesh | null = null;
		let flare: Mesh | null = null;
		const started = Date.now();

		const update = () => {
			if (!plate) {
				const texture = app.stateApp.loadedAssets?.[props.key] as Texture | undefined;
				if (!texture) return;
				geometry = new MeshGeometry({ positions, uvs: rig.uvs, indices: rig.indices });
				plate = new Mesh({ geometry, texture });
				flare = new Mesh({ geometry, texture });
				flare.blendMode = 'add';
				root.addChild(plate, flare);
			}
			const now = Date.now();
			const pose = spec.drive(rig, {
				t: now - started,
				landT: landedAt < 0 ? -1 : now - landedAt,
				blink: props.blink,
			});
			skin(rig, pose, spec.feetY, positions);
			geometry!.getBuffer('aPosition').update();
			flare!.alpha = props.blink;
			flare!.visible = props.blink > 0;
			const sx = props.width / BANNER_CANVAS[0];
			const sy = props.height / BANNER_CANVAS[1];
			root.scale.set(sx, sy);
			root.position.set(-props.width / 2, -props.height / 2);
		};
		update();
		const id = setInterval(update, 16);

		return () => {
			clearInterval(id);
			// the root (and the meshes in it) are destroyed by addToParent
			geometry?.destroy();
		};
	});
</script>
