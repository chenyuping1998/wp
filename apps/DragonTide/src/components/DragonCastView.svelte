<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { getContextParent } from 'pixi-svelte';
	import { Graphics, type Texture, type Ticker } from 'pixi.js';
	import { getContext } from '../game/context';
	import { createDragonCastScene } from '../game/dragonCastScene';
	import { BOARD_SIZES } from '../game/constants';
	import { medusaAnchors, publishMedusaAnchors } from '../game/medusaAnchors.svelte';
	const props: { mode?: 'mg' | 'fg'; portrait: boolean; figureHeight: number; action: { name: string; token: number } } = $props();
	const context = getContext(), parent = getContextParent();
	let scene = $state.raw<ReturnType<typeof createDragonCastScene>>();
	let ticker: Ticker | undefined, last = 0, disposed = false, media: MediaQueryList | undefined, removeInspection: (() => void) | undefined;
	const tick = () => {
		const now = performance.now();
		if (!last || document.hidden) { last = now; return; }
		const dt = (now - last) / 1000; last = now;
		scene?.update(dt); if (scene) publishMedusaAnchors(scene.getGazeAnchors());
	};
	$effect(() => {
		const kind = props.mode === 'fg' ? 'fg' : 'mg';
		const texture = context.stateApp.loadedAssets?.[kind === 'fg' ? 'dragonPrincessAtlas' : 'dragonKingAtlas'] as Texture | undefined;
		const app = context.stateApp.pixiApplication;
		if (disposed || scene || !texture || !app) return;
		scene = createDragonCastScene(texture, kind); parent.parent.addChild(scene.root); ticker = app.ticker; ticker.add(tick);
		if (media) scene.setReducedMotion(media.matches);
		if (import.meta.env.DEV && new URLSearchParams(location.search).has('castqa')) {
			const current = scene;
			void import('../dev/dragonCastControls').then(({ installDragonCastControls }) => { if (!disposed) removeInspection = installDragonCastControls(current, kind); });
		}
	});

	// Landscape: the figure stands in the strip right of the board, feet on the board's
	// bottom line, its idle ink kept FRAME + GAP clear of the board (cast-never-overlaps-board).
	// Acts may reach further (the king's cast swings the trident tip toward the board and its
	// butt out to his outer side; ink boxes from design/cast_dragon/motion_extents.mjs).
	const FRAME = 32, GAP = 14, FEET_BELOW_BOARD = 6;
	// Portrait has no side strip: the figure stands above the board's right part with
	// everything below the hips tucked behind the frame, so arms and prop still act.
	// The figure may hang 60 past the board's right edge (the portrait screen is ~110 wider
	// than the board each side) so its left sleeve stays clear of the logo.
	const PORTRAIT_SCALE = 0.36, PORTRAIT_CLIP_Y = -34, PORTRAIT_RIGHT_INSET = -60;
	let clip: Graphics | undefined;
	$effect(() => {
		if (!scene) return;
		const rest = scene.rest, height = rest.maxY - rest.minY;
		if (props.portrait) {
			const scale = PORTRAIT_SCALE;
			scene.root.scale.set(scale);
			scene.root.position.set(BOARD_SIZES.width - PORTRAIT_RIGHT_INSET - rest.maxX * scale, PORTRAIT_CLIP_Y + scene.hipDepth * scale);
			if (!clip) { clip = new Graphics().rect(-4000, -4000, 8000, 4000 + PORTRAIT_CLIP_Y).fill(0xffffff); scene.root.parent?.addChild(clip); }
			clip.visible = true; scene.root.mask = clip;
		} else {
			const scale = props.figureHeight / height;
			scene.root.scale.set(scale);
			scene.root.position.set(BOARD_SIZES.width + FRAME + GAP - rest.minX * scale, BOARD_SIZES.height + FEET_BELOW_BOARD);
			scene.root.mask = null; if (clip) clip.visible = false;
		}
	});
	$effect(() => { if (!scene) return; const a = props.action; if (a.name === 'rest') scene.reset(); else scene.play(a.name); });
	onMount(() => {
		media = matchMedia('(prefers-reduced-motion: reduce)');
		const changed = () => scene?.setReducedMotion(media!.matches); const visible = () => { last = 0; };
		changed(); media.addEventListener('change', changed); document.addEventListener('visibilitychange', visible);
		return () => { media?.removeEventListener('change', changed); document.removeEventListener('visibilitychange', visible); };
	});
	onDestroy(() => { disposed = true; clip?.destroy(); removeInspection?.(); ticker?.remove(tick); scene?.destroy(); scene = undefined; medusaAnchors.ready = false; });
</script>
