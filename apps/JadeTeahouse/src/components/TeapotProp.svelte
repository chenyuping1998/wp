<script lang="ts">
	/**
	 * The teapot in the Master's hand for his `pour` (design/pour_motion.mjs).
	 * Rendered INSIDE his SpineProvider. The skeleton has no teapot of its own,
	 * so the H1 symbol art is hung on the `sack` slot (which rides the `prop`
	 * bone) with addSlotObject: it draws in the slot's place in the draw order
	 * and follows the hand, and the clip's `prop` scale/rotate keys pop it in,
	 * tip it and take it away.
	 *
	 * addSlotObject resets the holder's own `visible` every frame, so showing
	 * and hiding goes through the sprite inside it.
	 *
	 * Every frame it reports where the spout's mouth is, in the coordinates of
	 * the spine's parent (SplashMaster's container), for the stream.
	 */
	import { Container, Point, Sprite, type Texture } from 'pixi.js';
	import { getContextApp, getContextSpine } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { TEAPOT } from '../game/splashCast';

	type Props = {
		show: boolean;
		onspout: (point: { x: number; y: number }) => void;
	};
	const props: Props = $props();
	const spine = getContextSpine();
	const app = getContextApp();

	const holder = new Container();
	const pot = new Sprite();
	pot.anchor.set(0.5);
	// bone units are y-up; the holder's frame is the bone's, y-down
	pot.position.set(TEAPOT.x, -TEAPOT.y);
	holder.addChild(pot);
	const spout = new Point(TEAPOT.spout[0], -TEAPOT.spout[1]);
	const scratch = new Point();

	$effect(() => {
		pot.visible = props.show;
	});

	onMount(() => {
		const texture = app.stateApp.loadedAssets?.gbH1 as Texture | undefined;
		if (texture) {
			pot.texture = texture;
			pot.width = TEAPOT.w;
			pot.height = TEAPOT.h;
		}
		spine.addSlotObject('sack', holder);
		const ticker = app.stateApp.pixiApplication?.ticker;
		const report = () => {
			if (!pot.visible || !spine.parent) return;
			holder.toGlobal(spout, scratch);
			const local = spine.parent.toLocal(scratch);
			props.onspout({ x: local.x, y: local.y });
		};
		ticker?.add(report);
		return () => {
			ticker?.remove(report);
			spine.removeSlotObject(holder);
			holder.destroy({ children: true });
		};
	});
</script>
