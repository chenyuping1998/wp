<script lang="ts">
	import { Container, Graphics, Sprite, BlurFilter, Rectangle } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';
	import { getContext } from '../game/context';
	import { notesHeardAt, noteEnergy } from '../game/jazzBand';
	import { secondsSinceBeat, beatsHeard } from '../game/musicClock';

	type Plate = { x: number; y: number; width: number; height: number };
	const props: { parallax: Plate } = $props();
	const context = getContext();
	const app = getContextApp();
	const parent = getContextParent();
	let winAt = -Infinity, strength = 0;
	let heard: number[] = [];
	let tension = false;
	const reset = () => { winAt = -Infinity; heard = []; strength = 0; tension = false; };
	context.eventEmitter.subscribeOnMount({
		backgroundWin: ({ amount }) => {
			if (amount <= 0) return;
			winAt = performance.now();
			strength = Math.min(1, 0.6 + Math.log10(1 + amount / 100) * 0.18);
		},
		soundJazzNotes: ({ notes }) => {
			heard = [...heard.filter((at) => at > performance.now() - 400), ...notesHeardAt(notes)];
		},
		soundReelTensionStart: () => { tension = true; },
		soundReelTensionStop: () => { tension = false; },
		boardWinAnimCancel: reset,
		soundSpinCut: reset,
	});

	onMount(() => {
		const renderer = app.stateApp.pixiApplication?.renderer;
		if (!renderer) return;
		// One baked feather serves the stage, table lamps and floor reflections.
		const source = new Graphics().ellipse(192, 192, 128, 138).fill(0xffffff);
		const blur = new BlurFilter({ strength: 24, quality: 2 });
		source.filters = [blur];
		const texture = renderer.generateTexture({ target: source, frame: new Rectangle(0, 0, 384, 384), resolution: 1 });
		source.destroy(); blur.destroy();
		const root = new Container();
		root.label = 'jazz baked stage light'; root.eventMode = 'none';
		const warm = new Sprite({ texture, anchor: 0.5, tint: 0xffd8a2 });
		const red = new Sprite({ texture, anchor: 0.5, tint: 0xd9342b });
		const floor = new Sprite({ texture, anchor: 0.5, tint: 0xffe5b7 });
		const lampLeft = new Sprite({ texture, anchor: 0.5, tint: 0xffe0ae });
		const lampRight = new Sprite({ texture, anchor: 0.5, tint: 0xffe0ae });
		floor.position.set(640, 783); floor.height = 100;
		lampLeft.position.set(83, 865); lampLeft.width = 160; lampLeft.height = 185;
		lampRight.position.set(1840, 822); lampRight.width = 130; lampRight.height = 150;
		root.addChild(warm, red, floor, lampLeft, lampRight); parent.parent.addChild(root);
		let focus = 0, previous = performance.now();
		const tick = () => {
			const now = performance.now();
			const dt = Math.min(100, now - previous); previous = now;
			focus += ((tension ? 1 : 0) - focus) * (1 - Math.exp(-dt / 240));
			const feature = context.stateGame.gameType === 'freegame';
			const elapsed = (now - winAt) / 1800;
			const pulse = elapsed >= 0 && elapsed <= 1 ? Math.sin(Math.PI * elapsed) ** 2 * strength : 0;
			const beat = heard.length ? noteEnergy(now, heard) : 0;
			// ON THE BAND (2026-11-06): while a win plays or the reels tease, the
			// stage light breathes on the band's 1 and 3 — the light, not the room:
			// nothing in the plate moves for it
			const since = secondsSinceBeat();
			const strong = Math.floor(beatsHeard()) % 2 === 0;
			const kick = since < 0 ? 0 : Math.exp(-since * 9) * (strong ? 1 : 0.45) * Math.max(focus, pulse > 0.02 ? 1 : 0);
			const sweep = Math.sin(now / 6200) * (feature ? 90 : 48) * (1 - focus * 0.7);
			root.position.set(props.parallax.x, props.parallax.y);
			root.scale.set(props.parallax.width / 1920, props.parallax.height / 1080);
			warm.position.set(610 + sweep + focus * 65, 407);
			warm.width = 840 + pulse * 75 - focus * 90; warm.height = 840;
			warm.alpha = (feature ? 0.035 : 0.02) + pulse * 0.11 + beat * 0.045 + focus * 0.025 + kick * 0.03;
			red.position.set(1450 - sweep * 0.7, 420);
			red.width = 640; red.height = 800;
			red.alpha = 0.008 + pulse * 0.035 + beat * 0.015;
			floor.width = 620 + pulse * 90 + beat * 30;
			floor.alpha = 0.025 + pulse * 0.07 + beat * 0.035 + kick * 0.03;
			lampLeft.alpha = 0.065 + 0.018 * Math.sin(now / 2100) + beat * 0.025;
			lampRight.alpha = 0.055 + 0.016 * Math.sin(now / 2600 + 1.4) + pulse * 0.03;
		};
		tick();
		const ticker = app.stateApp.pixiApplication?.ticker;
		ticker?.add(tick);
		return () => { ticker?.remove(tick); root.removeFromParent(); root.destroy({ children: true }); texture.destroy(true); };
	});
</script>
