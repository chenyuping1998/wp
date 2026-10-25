<script lang="ts">
	/**
	 * The props hanging in a background, drawn as a mesh over one small
	 * rectangle of it (game/meshWin/bgProps.ts). Rendered straight after the
	 * background's own sprite, inside the same FadeContainer, with the same
	 * box — so it fades, drifts and blurs with the plate, and at rest it IS the
	 * plate: the rectangle's border is pinned, so there is nothing to see where
	 * the two meet.
	 *
	 * Reads the background's shared monotonic visible-time clock. Its meshes,
	 * painted plate and light anchors stay together across stalls/tab resumes.
	 */
	import { Mesh, MeshGeometry, Container, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount, onDestroy } from 'svelte';

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
		timeMs: number;
	};
	const props: Props = $props();
	const context = getContext();
	const app = getContextApp();
	const parent = getContextParent();

	let blastAt = -1;
	const sceneStart = props.timeMs;
	context.eventEmitter.subscribeOnMount({
		reelBlast: () => {
			if (!document.hidden) blastAt = props.timeMs;
		},
		// hold and spin: every new coin that sticks jolts the vault's shelves
		// (bgProps BG_HS_*); the other scenes never see this event
		stickyPrizesNew: () => {
			if (!document.hidden) blastAt = props.timeMs;
		},
	});

	// added in sibling order, straight after the background's sprite
	// (pixi-svelte's addToParent, which also destroys it on unmount)
	const root = new Container();
	root.label = `bgProps ${props.spec.symbol}`;
	parent.addToParent(root);

	const rig = buildRig(props.spec.rig);
	const positions = new Float32Array(rig.rest);
	let geometry: MeshGeometry | null = null;
	let mesh: Mesh | null = null;
	$effect(() => {
			if (!mesh) {
				const texture = app.stateApp.loadedAssets?.[props.spec.sprite ?? props.spec.key] as Texture | undefined;
				if (!texture) return;
				geometry = new MeshGeometry({ positions, uvs: rig.uvs, indices: rig.indices });
				mesh = new Mesh({ geometry, texture });
				root.addChild(mesh);
			}
			const pose = props.spec.drive(rig, {
				t: props.timeMs - sceneStart,
				level: stateGame.blastLevel,
				quakeT: caveQuake.clock,
				blastT: blastAt < 0 ? -1 : props.timeMs - blastAt,
			});
			skin(rig, pose, props.spec.feetY, positions);
			geometry!.getBuffer('aPosition').update();
			root.position.set(props.x, props.y);
			root.scale.set(props.width / BG_CANVAS[0], props.height / BG_CANVAS[1]);
	});
	onMount(() => {
		const clearHidden = () => { if (document.hidden) blastAt = -1; };
		document.addEventListener('visibilitychange', clearHidden);
		return () => document.removeEventListener('visibilitychange', clearHidden);
	});
	onDestroy(() => geometry?.destroy());
</script>
