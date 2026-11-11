<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { getContextParent } from 'pixi-svelte';
	import type { Texture, Ticker } from 'pixi.js';
	import { getContext } from '../game/context';
	import { BACKGROUND_KEYS } from '../game/backgroundMotion';
	import { createBackgroundScene, PROP_KEYS } from '../game/backgroundScene';
	import { boardShake } from '../game/boardShake.svelte';
	const context = getContext();
	const parent = getContextParent();
	let scene = $state.raw<ReturnType<typeof createBackgroundScene>>();
	let reduced = $state(false);
	let ticker: Ticker | undefined;
	let last = 0, accumulated = 0, disposed = false, handledWin = false;
	const tick = () => {
		const now = performance.now();
		if (!last || document.hidden || context.stateLayout.showLoadingScreen) { last = now; accumulated = 0; return; }
		accumulated += now - last; last = now;
		if (accumulated >= 1000 / 60) { scene?.update(accumulated / 1000); accumulated = 0; }
	};
	$effect(() => {
		const loaded = context.stateApp.loadedAssets;
		const application = context.stateApp.pixiApplication;
		const keys = [...BACKGROUND_KEYS, ...PROP_KEYS];
		if (disposed || scene || !application || !keys.every(key => loaded?.[key])) return;
		scene = createBackgroundScene(Object.fromEntries(keys.map(key => [key, loaded![key] as Texture])));
		// addToParent registers onMount and must only be called synchronously
		// during component setup. Assets can arrive after mount, so attach this
		// late-created, app-owned scene directly and dispose it below.
		scene.root.zIndex = -3;
		parent.parent.addChild(scene.root); parent.parent.sortChildren();
		ticker = application.ticker; ticker.add(tick);
	});
	$effect(() => {
		const {width,height}=context.stateLayoutDerived.canvasSizes();
		scene?.setBounds(width,height);
	});
	// the x100 jolt moves the whole stage (boardShake.joltScene); the backdrop stays where it is,
	// so the canvas edge is never uncovered
	$effect(() => {
		const { stageX, stageY } = boardShake;
		context.stateLayoutDerived.canvasSizes();
		if (scene) scene.root.pivot.set(stageX / (scene.root.scale.x || 1), stageY / (scene.root.scale.y || 1));
	});
	$effect(() => scene?.setNight(context.stateGame.gameType === 'freegame'));
	$effect(() => scene?.setReducedMotion(reduced));
	onMount(() => {
		const media = window.matchMedia('(prefers-reduced-motion: reduce)');
		const preference = () => (reduced = media.matches);
		const visibility = () => { last = 0; accumulated = 0; };
		preference(); media.addEventListener('change', preference); document.addEventListener('visibilitychange', visibility);
		return () => { media.removeEventListener('change', preference); document.removeEventListener('visibilitychange', visibility); };
	});
	context.eventEmitter.subscribeOnMount({
		winShow: () => (handledWin = false),
		winUpdate: ({ winLevelData }) => {
			if (handledWin || winLevelData.type !== 'big' || document.hidden || context.stateLayout.showLoadingScreen) return;
			handledWin = true;
			scene?.burstProps();
		},
	});
	onDestroy(() => { disposed = true; ticker?.remove(tick); scene?.destroy(); scene = undefined; });
</script>
