<script lang="ts">
	/**
	 * The props hanging in a background, drawn as a mesh over one small
	 * rectangle of it (game/meshWin/bgProps.ts). Rendered straight after the
	 * background's own sprite, inside the same FadeContainer, with the same
	 * box — so it fades, drifts and blurs with the plate, and at rest it IS the
	 * plate: the rectangle's border is pinned, so there is nothing to see where
	 * the two meet.
	 *
	 * Driven by requestAnimationFrame. Hidden tabs skip mesh work, and missing
	 * textures are retried on the next frame without creating another timer.
	 */
	import { Mesh, MeshGeometry, Container, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import { stateGame } from '../game/stateGame.svelte';
	import { caveQuake } from '../game/caveQuake.svelte';
	import { buildRig, skin } from '../game/meshWin/meshRig';
	import { BG_CANVAS, type BgPropSpec } from '../game/meshWin/bgProps';

	type Props = {
		spec: BgPropSpec;
		/** the background sprite's box this frame */
		x: number;
		y: number;
		width: number;
		height: number;
	};
	const props: Props = $props();
	const context = getContext();
	const app = getContextApp();
	const parent = getContextParent();

	let blastAt = -1;
	let coinAt = -1;
	context.eventEmitter.subscribeOnMount({
		reelBlast: () => {
			blastAt = Date.now();
		},
		// hold and spin: new coins stuck on the board (the vault's coin pile)
		stickyPrizesNew: () => {
			coinAt = Date.now();
		},
	});

	// added in sibling order, straight after the background's sprite
	// (pixi-svelte's addToParent, which also destroys it on unmount)
	const root = new Container();
	root.label = `bgProps ${props.spec.symbol}`;
	parent.addToParent(root);

	onMount(() => {
		const rig = buildRig(props.spec.rig);
		const positions = new Float32Array(rig.rest);
		let geometry: MeshGeometry | null = null;
		let mesh: Mesh | null = null;
		const started = Date.now();

		let raf = 0;
		const tick = () => {
			raf = requestAnimationFrame(tick);
			if (document.hidden) return;
			if (!mesh) {
				const texture = app.stateApp.loadedAssets?.[props.spec.sprite ?? props.spec.key] as Texture | undefined;
				if (!texture) return;
				geometry = new MeshGeometry({ positions, uvs: rig.uvs, indices: rig.indices });
				mesh = new Mesh({ geometry, texture });
				root.addChild(mesh);
			}
			const now = Date.now();
			const pose = props.spec.drive(rig, {
				t: now - started,
				level: stateGame.blastLevel,
				quakeT: caveQuake.clock,
				blastT: blastAt < 0 ? -1 : now - blastAt,
				coinT: coinAt < 0 ? -1 : now - coinAt,
			});
			skin(rig, pose, props.spec.feetY, positions);
			geometry!.getBuffer('aPosition').update();
			root.position.set(props.x, props.y);
			root.scale.set(props.width / BG_CANVAS[0], props.height / BG_CANVAS[1]);
		};
		raf = requestAnimationFrame(tick);

		return () => {
			cancelAnimationFrame(raf);
			geometry?.destroy();
		};
	});
</script>
