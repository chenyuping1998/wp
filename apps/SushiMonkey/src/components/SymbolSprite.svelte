<script lang="ts">
	import { Container, Sprite, Text } from 'pixi-svelte';
	import { GAME_FONT } from '../game/fonts';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	import { getSymbolInfo } from '../game/utils';
	import { SYMBOL_SIZE } from '../game/constants';

	type Props = {
		x?: number;
		y?: number;
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		// How fast the reel is travelling, 0..1, driving a cheap motion blur
		// (vertical stretch + ghosts). Continuous rather than a boolean so the
		// blur eases off through the bounce instead of snapping away the instant
		// the reel changes state.
		blur?: number;
		// symbol just landed: impact squash before settling to static
		landing?: boolean;
		// 0..1 — how heavily this symbol hits. Scatter and Wild land hardest, the
		// card royals barely at all, so weight reads as importance rather than
		// every tile bouncing identically.
		impact?: number;
		letter?: string;
		oncomplete?: () => void;
	};

	const props: Props = $props();

	const width = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.width);
	const height = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.height);
	const blur = $derived(Math.max(0, Math.min(1, props.blur ?? 0)));

	// landing squash: hammer down, rebound, settle (~240ms). Amplitude scales with
	// `impact`, timings do not — a lighter symbol should look lighter, not slower,
	// and keeping the duration fixed means every reel still settles together.
	const sx = new Tween(1);
	const sy = new Tween(1);
	let squashing = false;
	// Set when this sprite is torn down. The squash is an async chain of Tween
	// promises, and those promises still resolve after the component is gone —
	// so without this the chain reported "landing finished" from a presentation
	// that had already been replaced. See the guard at the end of runSquash.
	let destroyed = false;
	$effect(() => () => {
		destroyed = true;
	});
	const runSquash = async () => {
		if (squashing) return;
		squashing = true;
		// Ceiling is 1.5, not 1: the point of the tier is that Scatter and Wild hit
		// HARDER than a high-pay, and they are passed 1.25 / 1.2. Clamping at 1
		// would have flattened them back to the default and silently undone this.
		const k = Math.max(0, Math.min(1.5, props.impact ?? 1));
		const at = (v: number) => 1 + (v - 1) * k;
		sx.set(at(1.12), { duration: 70, easing: cubicOut });
		await sy.set(at(0.82), { duration: 70, easing: cubicOut });
		sx.set(at(0.97), { duration: 90, easing: cubicOut });
		await sy.set(at(1.06), { duration: 90, easing: cubicOut });
		sx.set(1, { duration: 80, easing: cubicOut });
		await sy.set(1, { duration: 80, easing: cubicOut });
		squashing = false;
		// THE completion that was lighting one reel and then killing it.
		//
		// 'win' renders a Spine, every other state renders this sprite, so a symbol
		// going land → win unmounts this component mid-squash. The chain above kept
		// running to its end and called oncomplete anyway; by then the symbol was in
		// 'win', so Board.boardWithAnimateSymbols took that call as "the win spine
		// finished", moved the symbol straight to postWinStatic, and the spine was
		// destroyed on roughly the frame it started. The symbol stayed dark while
		// the rest of the line lit up.
		//
		// It landed on reel 1 far more often than anywhere else because the grenade
		// reaches reel 1 first — a few frames into the volley, the one moment still
		// inside this 240ms window.
		//
		// ReelSymbol tried to guard this by comparing the current symbolState with a
		// {@const} snapshot, but {@const} is reactive: by the time the stale call
		// arrived, the snapshot had been recomputed to 'win' too and the comparison
		// always passed. Cancelling at the source is not subject to that.
		if (destroyed) return;
		props.oncomplete?.();
	};

	$effect(() => {
		props.symbolInfo;
		if (props.landing) {
			runSquash();
		} else {
			props.oncomplete?.();
		}
	});
</script>

{#if blur > 0.01}
	<!-- ghost trail: same art, offset and faded, sells the motion blur. Offset,
	     opacity and stretch all scale with speed, so the trail shortens and fades
	     as the reel brakes rather than vanishing in one frame. -->
	<Sprite
		x={props.x}
		y={(props.y ?? 0) - height * 0.42 * blur}
		anchor={0.5}
		key={props.symbolInfo.assetKey}
		width={width * 0.96}
		height={height * (1 + 0.18 * blur)}
		alpha={0.22 * blur}
	/>
	<Sprite
		x={props.x}
		y={(props.y ?? 0) + height * 0.42 * blur}
		anchor={0.5}
		key={props.symbolInfo.assetKey}
		width={width * 0.96}
		height={height * (1 + 0.18 * blur)}
		alpha={0.22 * blur}
	/>
{/if}

<Container
	x={props.x ?? 0}
	y={props.y ?? 0}
	scale={{ x: sx.current, y: blur > 0.01 ? 1 + 0.3 * blur : sy.current }}
	alpha={1 - 0.15 * blur}
>
	<Sprite anchor={0.5} key={props.symbolInfo.assetKey} {width} {height} />
	{#if props.letter}
		<Text anchor={0.5} text={props.letter} style={{ fontFamily: GAME_FONT, fontWeight: '400', fontSize: props.letter.length > 1 ? 51 : 62, fill: 0x1e1b1a }} />
	{/if}
</Container>
