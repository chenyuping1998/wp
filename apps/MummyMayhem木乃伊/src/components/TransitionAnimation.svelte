<script lang="ts">
	// THE BANDAGE SWEEP (design/MUMMY_RHYTHM_REQUIREMENTS.md §6).
	//
	// Replaces GoBoomana's thrown dynamite. Long strips of mummy bandage sweep
	// across the screen on a slant, staggered, until they cover it completely at
	// the halfway mark; the scene is swapped there (`oncover`) and the strips keep
	// going and pull clear. 1.0s in all, the cover at 0.5s — the same beat the
	// bandage_sweep sound is cut to.
	//
	// Production mummy textures: design/source/mummy_delivery.
	import { onMount } from 'svelte';
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { getContext } from '../game/context';

	type Props = {
		oncomplete: () => void;
		// Fired once the strips fully cover the screen. Swap scenes here.
		oncover?: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	const TOTAL_MS = 1000;
	const COVER_AT = 0.5; // fraction of TOTAL_MS
	const STRIPS = 8;
	const SLANT = -0.35; // radians: strips run from lower left to upper right
	const ENTER_STAGGER = 0.035; // fraction of TOTAL_MS between strips going in
	const EXIT_STAGGER = 0.03;

	const BANDAGE = 0xf2e8d0;
	const BANDAGE_SHADE = 0xd8c9a6;
	const BANDAGE_EDGE = 0x8a7350;

	let t = $state(0);
	let rafId = 0;
	let covered = false;
	let done = false;

	const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
	const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

	onMount(() => {
		context.eventEmitter.broadcast({ type: 'soundWheel', cue: 'bandageSweep' });
		const start = performance.now();
		const loop = (now: number) => {
			t = Math.min(1, (now - start) / TOTAL_MS);
			if (!covered && t >= COVER_AT) {
				covered = true;
				props.oncover?.();
			}
			if (t >= 1) {
				if (!done) {
					done = true;
					props.oncomplete();
				}
				return;
			}
			rafId = requestAnimationFrame(loop);
		};
		rafId = requestAnimationFrame(loop);
		// rAF stops in a hidden tab; the round must not wait on it
		const safety = setTimeout(() => {
			if (!covered) {
				covered = true;
				props.oncover?.();
			}
			if (!done) {
				done = true;
				props.oncomplete();
			}
		}, TOTAL_MS + 600);
		return () => {
			cancelAnimationFrame(rafId);
			clearTimeout(safety);
		};
	});

	// Where strip i sits along its own length: -1 = fully off to the left,
	// 0 = centred (covering), +1 = fully off to the right.
	const stripPos = (i: number) => {
		const enterSpan = COVER_AT - (STRIPS - 1) * ENTER_STAGGER;
		const exitSpan = 1 - COVER_AT - (STRIPS - 1) * EXIT_STAGGER;
		if (t < COVER_AT) {
			const k = clamp01((t - i * ENTER_STAGGER) / enterSpan);
			return -1 + easeInOut(k);
		}
		const k = clamp01((t - COVER_AT - i * EXIT_STAGGER) / exitSpan);
		return easeInOut(k);
	};

	const draw = (g: PixiGraphics) => {
		g.clear();
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const diag = Math.hypot(width, height);
		// strips overlap a little so there is never a seam while covered
		const pitch = (diag * 1.05) / STRIPS;
		const thick = pitch * 1.18;
		const len = diag * 1.6;
		const cos = Math.cos(SLANT);
		const sin = Math.sin(SLANT);
		const rot = (x: number, y: number) => ({ x: x * cos - y * sin, y: x * sin + y * cos });
		for (let i = 0; i < STRIPS; i++) {
			const across = (i - (STRIPS - 1) / 2) * pitch;
			// alternate directions so the weave reads as wrapping, not a curtain
			const dir = i % 2 === 0 ? 1 : -1;
			const along = stripPos(i) * (len * 0.5 + diag * 0.5) * dir;
			const corners = [
				rot(along - len / 2, across - thick / 2),
				rot(along + len / 2, across - thick / 2),
				rot(along + len / 2, across + thick / 2),
				rot(along - len / 2, across + thick / 2),
			];
			g.poly(corners.flatMap((c) => [c.x, c.y]));
			g.fill({ color: i % 3 === 1 ? BANDAGE_SHADE : BANDAGE });
			// two weave lines and a dark edge along the strip
			for (const f of [-0.22, 0.18]) {
				const a = rot(along - len / 2, across + thick * f);
				const b = rot(along + len / 2, across + thick * f);
				g.moveTo(a.x, a.y);
				g.lineTo(b.x, b.y);
			}
			g.stroke({ width: Math.max(1.5, thick * 0.025), color: BANDAGE_SHADE, alpha: 0.9 });
			const e0 = rot(along - len / 2, across + thick / 2);
			const e1 = rot(along + len / 2, across + thick / 2);
			g.moveTo(e0.x, e0.y);
			g.lineTo(e1.x, e1.y);
			g.stroke({ width: Math.max(2, thick * 0.04), color: BANDAGE_EDGE, alpha: 0.55 });
		}
	};
</script>

<Container
	x={context.stateLayoutDerived.canvasSizes().width * 0.5}
	y={context.stateLayoutDerived.canvasSizes().height * 0.5}
	zIndex={1000}
>
	{#each Array.from({length:STRIPS},(_,i)=>i) as i}
  {@const size=context.stateLayoutDerived.canvasSizes()}
  {@const diag=Math.hypot(size.width,size.height)}
  {@const across=(i-(STRIPS-1)/2)*diag*1.05/STRIPS}
  {@const along=stripPos(i)*diag*1.3*(i%2===0?1:-1)}
  <Container rotation={SLANT}>
   <!-- Opaque cloth underlay guarantees full coverage despite frayed alpha edges. -->
   <Graphics draw={(g:PixiGraphics)=>{g.clear();g.rect(along-diag*.8,across-diag*.075,diag*1.6,diag*.15).fill({color:0xf2e8d0});}} />
   <Sprite key="mummyBandage" anchor={.5} x={along} y={across} width={diag*1.6} height={diag*.17} />
  </Container>
 {/each}
</Container>
