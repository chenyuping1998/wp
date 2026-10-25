<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { getContextParent } from 'pixi-svelte';
	import type { Texture, Ticker } from 'pixi.js';
	import { getContext } from '../game/context';
	import { BACKGROUND_KEYS } from '../game/backgroundMotion';
	import { createBackgroundScene } from '../game/backgroundScene';
	import {BOARD_SIZES} from '../game/constants';
	import {uiTheme} from 'components-ui-pixi';
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
		if (disposed || scene || !application || !BACKGROUND_KEYS.every(key => loaded?.[key])) return;
		scene = createBackgroundScene(Object.fromEntries(BACKGROUND_KEYS.map(key => [key, loaded![key] as Texture])));
		// addToParent registers onMount and must only be called synchronously
		// during component setup. Assets can arrive after mount, so attach this
		// late-created, app-owned scene directly and dispose it below.
		scene.root.zIndex = -3;
		parent.parent.addChild(scene.root); parent.parent.sortChildren();
		ticker = application.ticker; ticker.add(tick);
	});
	$effect(() => {
		const {width,height}=context.stateLayoutDerived.canvasSizes();const main=context.stateLayoutDerived.mainLayout();const standard=context.stateLayoutDerived.mainLayoutStandard();const board=context.stateGameDerived.boardLayout();
		const medusaHeight=BOARD_SIZES.height*.98*board.scale*main.scale;
		const groundY=(height-standard.height*standard.scale)/2+(standard.height-uiTheme.barHeight)*standard.scale-12;
		scene?.setBounds(width,height,medusaHeight,groundY);
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
			if (scene?.burstStatues()) context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_statues_crack' });
		},
	});
	onDestroy(() => { disposed = true; ticker?.remove(tick); scene?.destroy(); scene = undefined; });
</script>
