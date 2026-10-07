<script lang="ts">
	/**
	 * TELLS THE SKELETON'S PHYSICS THAT HE IS FLOATING (2026-10-02).
	 *
	 * In the free spins the float — the lift, the bob, the sway, the roll, the
	 * zero-g flip — moves the CONTAINER the skeleton sits in, so Spine's physics
	 * never saw any of it: the banana, the hose, the pens, the fur, the ear and the
	 * boots' tag hung as if he were standing still while his whole body drifted.
	 * Each frame this measures how far the container moved and turned, brings that
	 * into the skeleton's own frame, and hands it to the physics
	 * (Skeleton.physicsTranslate / physicsRotate): now everything loose trails a
	 * rise, swings past at the top of the bob, and whips round a flip.
	 *
	 * Rendered inside the SpineProvider (for getContextSpine). `FEED` scales the
	 * translation (the bob is slow, and at 1:1 the trail is too faint to read);
	 * the turn is clamped per frame, so the flip's full circle cannot fling the
	 * stiff pieces past what their meshes carry.
	 */
	import { getContextApp, getContextSpine } from 'pixi-svelte';
	import { onMount } from 'svelte';

	type Xf = { x: number; y: number; rotation: number; scale: number } | null;
	type Props = {
		/** the float container's transform, read every frame */
		xf: () => Xf;
		/** the body's middle, in skeleton units (y down) — what the turns turn about */
		pivotY: number;
	};
	const props: Props = $props();
	const app = getContextApp();
	const spine = getContextSpine();

	const FEED = 1.8;
	// 0.4, not 0.6: at 0.6 the flip flung the hose to 49% (check_monkey_rig)
	const TURN_FEED = 0.4;
	// the flip turns ~5° a frame; let through more than 1.5 and it flings the hose
	// past what its mesh carries (check_monkey_rig, tuck +flutter_float)
	const MAX_TURN_DEG = 1.5;

	onMount(() => {
		let last: Xf = null;
		const tick = () => {
			const cur = props.xf();
			if (!cur || !last || !spine?.skeleton) {
				last = cur ? { ...cur } : null;
				return;
			}
			const dx = cur.x - last.x, dy = cur.y - last.y;
			// into the skeleton's frame: undo the container's turn and its scale
			const c = Math.cos(-cur.rotation), s = Math.sin(-cur.rotation);
			const lx = ((dx * c - dy * s) / cur.scale) * FEED;
			const ly = ((dx * s + dy * c) / cur.scale) * FEED;
			if (lx || ly) spine.skeleton.physicsTranslate(lx, ly);
			const turn = Math.max(-MAX_TURN_DEG, Math.min(MAX_TURN_DEG, ((cur.rotation - last.rotation) * 180) / Math.PI)) * TURN_FEED;
			if (turn) spine.skeleton.physicsRotate(0, props.pivotY, turn);
			last = { ...cur };
		};
		const ticker = app.stateApp.pixiApplication?.ticker;
		ticker?.add(tick);
		return () => ticker?.remove(tick);
	});
</script>
