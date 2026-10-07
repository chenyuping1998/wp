<script lang="ts">
	/**
	 * THE FRAME HOLDS ON A HIT — `hitStop`. For a beat (60-90ms, three to five
	 * frames) the picture stops dead, then everything carries on: the old
	 * fighting-game trick for making an impact land. Used on the few hits that
	 * decide something — the third Scatter, a Wild, the big-win figure — and
	 * nowhere else; on every reel stop it would just be a stutter.
	 *
	 * It stops the app's ticker, which is what draws the frame: Spine and
	 * anything else on the ticker genuinely pauses, and what runs on the wall
	 * clock (the meshes, the tweens) jumps on when it resumes — which is the
	 * hold. Never longer than HIT_STOP_MAX, and a hold already running is
	 * extended, never stacked.
	 */
	import { onDestroy } from 'svelte';
	import { getContextApp } from 'pixi-svelte';

	import { getContext } from '../game/context';

	const HIT_STOP_MAX = 120;
	// a hold right after another reads as lag, not as a hit
	const COOLDOWN_MS = 350;

	const app = getContextApp();
	const context = getContext();

	let timer: ReturnType<typeof setTimeout> | undefined;
	let lastEnd = 0;

	const release = () => {
		timer = undefined;
		lastEnd = performance.now();
		app.stateApp.pixiApplication?.ticker.start();
	};

	context.eventEmitter.subscribeOnMount({
		hitStop: ({ ms }) => {
			const ticker = app.stateApp.pixiApplication?.ticker;
			if (!ticker || document.hidden) return;
			if (!timer && performance.now() - lastEnd < COOLDOWN_MS) return;
			clearTimeout(timer);
			ticker.stop();
			timer = setTimeout(release, Math.min(HIT_STOP_MAX, ms));
		},
	});

	onDestroy(() => {
		if (timer) {
			clearTimeout(timer);
			release();
		}
	});
</script>
