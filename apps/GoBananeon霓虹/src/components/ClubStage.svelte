<script lang="ts">
	import { Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { onMount } from 'svelte';
	import { getContext } from '../game/context';
	import { clubStageFrame, quietStageCues, type ClubMode, type StageRect } from '../game/backgroundStage';

	type Props = StageRect & { mode: ClubMode; timeMs: number; canvasWidth: number; canvasHeight: number };
	const props: Props = $props();
	const context = getContext();
	let cues = $state(quietStageCues());
	const visible = () => typeof document === 'undefined' || !document.hidden;
	context.eventEmitter.subscribeOnMount({
		soundDjScratch: () => { if (visible()) cues = { ...cues, djAt: props.timeMs, djStopAt: Infinity }; },
		soundDjScratchStop: () => { cues = { ...cues, djStopAt: props.timeMs }; },
		mascotChestBeat: () => { if (visible()) cues = { ...cues, chestAt: props.timeMs }; },
		soundBlastFuse: () => { if (visible()) cues = { ...cues, fuseAt: props.timeMs }; },
		soundBlastDetonate: ({ full, width = full ? 5 : 1 }) => {
			if (visible()) cues = { ...cues, fuseAt: -Infinity, burstAt: props.timeMs, burstStrength: full ? 1 : 0.45 + Math.min(5, width) * 0.07 };
		},
		stickyPrizesNew: () => { if (visible()) cues = { ...cues, coinAt: props.timeMs }; },
	});
	onMount(() => {
		// Do not replay a stale explosion or DJ accent when returning to a tab.
		const resetHidden = () => { if (document.hidden) cues = quietStageCues(); };
		document.addEventListener('visibilitychange', resetHidden);
		return () => document.removeEventListener('visibilitychange', resetHidden);
	});
	const frame = $derived(clubStageFrame(props.mode, props.timeMs, props,
		{ width: props.canvasWidth, height: props.canvasHeight }, cues));

	const drawLight = (g: PixiGraphics) => {
		g.clear();
		for (const beam of frame.beams) {
			// Four feathered cones build a soft edge without a full-screen blur
			// filter or a fresh texture allocation on every frame.
			for (const [width, strength] of [[1, 0.10], [0.74, 0.16], [0.48, 0.24], [0.22, 0.30]]) {
				const spread = beam.spread * width;
				g.poly([beam.source.x - 1, beam.source.y, beam.source.x + 1, beam.source.y,
					beam.end.x + spread, beam.end.y, beam.end.x - spread, beam.end.y])
					.fill({ color: beam.color, alpha: beam.alpha * strength });
			}
			g.circle(beam.source.x, beam.source.y, Math.max(2, beam.spread * 0.055))
				.fill({ color: beam.color, alpha: beam.alpha * 1.6 });
		}
		for (const rail of frame.rails) {
			g.moveTo(rail.a.x, rail.a.y).lineTo(rail.b.x, rail.b.y)
				.stroke({ width: rail.width * 5, color: rail.color, alpha: rail.alpha * 0.15, cap: 'round' });
			g.moveTo(rail.tail.x, rail.tail.y).lineTo(rail.head.x, rail.head.y)
				.stroke({ width: rail.width * 2.4, color: rail.color, alpha: rail.alpha * 0.8, cap: 'round' });
			g.circle(rail.head.x, rail.head.y, rail.width * 1.7)
				.fill({ color: 0xe9fbff, alpha: rail.alpha * 0.85 });
		}
		for (const sign of frame.signs) {
			g.roundRect(sign.x, sign.y, sign.width, sign.height, Math.min(sign.width, sign.height) * 0.12)
				.fill({ color: sign.color, alpha: sign.alpha * 0.20 })
				.stroke({ width: Math.max(1, Math.min(sign.width, sign.height) * 0.12), color: sign.color, alpha: sign.alpha });
		}
		for (const reflection of frame.reflections) {
			g.ellipse(reflection.x, reflection.y, reflection.rx, reflection.ry)
				.fill({ color: reflection.color, alpha: reflection.alpha });
			g.ellipse(reflection.x, reflection.y, reflection.rx * 0.58, reflection.ry * 0.36)
				.fill({ color: 0xd6faff, alpha: reflection.alpha * 0.36 });
		}
		for (const particle of frame.particles) {
			if (particle.near) g.circle(particle.x, particle.y, particle.radius * 3)
				.fill({ color: particle.color, alpha: particle.alpha * 0.13 });
			g.circle(particle.x, particle.y, particle.radius).fill({ color: particle.color, alpha: particle.alpha });
		}
		for (const drop of frame.rain) g.moveTo(drop.x, drop.y).lineTo(drop.x - drop.length * 0.13, drop.y + drop.length)
			.stroke({ width: 1.1, color: 0x9ceeff, alpha: drop.alpha });
	};
	const drawSignDips = (g: PixiGraphics) => {
		g.clear();
		for (const sign of frame.signs) if (sign.dim > 0.001)
			g.roundRect(sign.x, sign.y, sign.width, sign.height, Math.min(sign.width, sign.height) * 0.12)
				.fill({ color: 0x060c25, alpha: sign.dim });
	};
</script>

<!-- Everything belongs below the reels; the painted centre keeps its contrast. -->
<Graphics draw={drawSignDips} eventMode="none" />
<Graphics draw={drawLight} blendMode="add" eventMode="none" />
