<script lang="ts">
	import { onMount } from 'svelte';
	import { Sprite } from 'pixi-svelte';

	// One grenade rolling along one payline, left to right. Deliberately quiet:
	// no blast on arrival — the job is to draw the eye along the line so the
	// player can read which symbols paid, not to put on a show.
	type Point = { x: number; y: number };

	type Props = {
		points: Point[];
		color: number;
		// ms before this runner starts (volley stagger)
		delay?: number;
		// shrinks when many lines run at once so the board stays readable
		scale?: number;
		entryMs?: number;
		travelMs?: number;
		settleMs?: number;
		// fired as the grenade crosses each reel, so symbols light up in its wake
		onreel?: (reelIndex: number) => void;
		oncomplete?: () => void;
	};

	const props: Props = $props();

	const entryMs = $derived(props.entryMs ?? 80);
	const travelMs = $derived(props.travelMs ?? 540);
	const settleMs = $derived(props.settleMs ?? 140);
	const size = $derived(46 * (props.scale ?? 1));

	let t = $state(-1); // ms since this runner's own start; < 0 while delayed
	let lastReel = -1;

	// Emit every reel between the last one reported and `reel`. Back-filling
	// matters on a dropped frame: the grenade can jump two reels in one tick and
	// the skipped reel's symbols would otherwise never light up.
	const reportReelsUpTo = (reel: number) => {
		for (let r = lastReel + 1; r <= reel; r++) props.onreel?.(r);
		if (reel > lastReel) lastReel = reel;
	};

	onMount(() => {
		let raf = 0;
		let start = 0;
		const total = entryMs + travelMs + settleMs;
		const tick = (now: number) => {
			if (!start) start = now + (props.delay ?? 0);
			t = now - start;
			if (t >= entryMs) reportReelsUpTo(reelAt(travelAt(t)));
			if (t >= total) {
				// guarantee the far end reported before handing back
				reportReelsUpTo(props.points.length - 1);
				props.oncomplete?.();
				return;
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	const easeOutCubic = (p: number) => 1 - (1 - Math.min(Math.max(p, 0), 1)) ** 3;

	// cumulative segment lengths, so travel is at constant speed regardless of
	// how steep each hop between reels is
	const segments = $derived.by(() => {
		const lengths = props.points
			.slice(1)
			.map((pt, i) => Math.hypot(pt.x - props.points[i].x, pt.y - props.points[i].y));
		const total = lengths.reduce((sum, l) => sum + l, 0) || 1;
		return { lengths, total };
	});

	// 0 → 1 along the whole path, on a trapezoid velocity profile: the grenade
	// picks up speed after the toss, rolls at pace, then leans into a stop at
	// the last reel. Constant speed with hard ends is what makes this kind of
	// motion read as machine-driven.
	const ACC = 0.18; // fraction of the run spent accelerating
	const DEC = 0.26; // ...and decelerating (longer, so it arrives with weight)
	const AREA = 1 - ACC / 2 - DEC / 2;
	const distanceAt = (p: number) => {
		if (p <= 0) return 0;
		if (p >= 1) return 1;
		if (p < ACC) return p * p / (2 * ACC) / AREA;
		if (p <= 1 - DEC) return (ACC / 2 + (p - ACC)) / AREA;
		const q = p - (1 - DEC);
		return (ACC / 2 + (1 - DEC - ACC) + q - (q * q) / (2 * DEC)) / AREA;
	};
	const travelAt = (ms: number) => {
		if (ms < entryMs) return 0;
		if (ms >= entryMs + travelMs) return 1;
		return distanceAt((ms - entryMs) / travelMs);
	};
	const travel = $derived(t < 0 ? 0 : travelAt(t));

	// which reel the grenade is over at a given travel fraction
	const reelAt = (p: number) => {
		const { lengths, total } = segments;
		let want = total * p;
		let index = 0;
		while (index < lengths.length && want > lengths[index]) {
			want -= lengths[index];
			index++;
		}
		const f = lengths[index] ? want / lengths[index] : 0;
		return Math.min(props.points.length - 1, Math.round(index + f));
	};

	const pose = $derived.by(() => {
		const { lengths, total } = segments;
		let want = total * travel;
		let index = 0;
		while (index < lengths.length && want > lengths[index]) {
			want -= lengths[index];
			index++;
		}
		const a = props.points[Math.min(index, props.points.length - 1)];
		const b = props.points[Math.min(index + 1, props.points.length - 1)];
		const f = lengths[index] ? want / lengths[index] : 0;
		return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
	});

	// entry: drops in from the left of reel 1 and settles onto the start point
	const entryOffset = $derived(t < entryMs ? -(1 - easeOutCubic(Math.max(0, t) / entryMs)) * size * 2.2 : 0);

	// rolling: spin follows distance covered, so it never looks like it is
	// sliding sideways
	const rotation = $derived(travel * segments.total * 0.022);

	// after arriving it fades out and leaves the finished line behind
	const alpha = $derived.by(() => {
		if (t < 0) return 0;
		const arriveAt = entryMs + travelMs;
		if (t < arriveAt) return 1;
		return Math.max(0, 1 - (t - arriveAt) / settleMs);
	});

</script>

{#if t >= 0 && alpha > 0}
	<!-- soft coloured halo so each grenade stays tied to its own line colour -->
	<Sprite
		key="fxGlow"
		anchor={0.5}
		x={pose.x + entryOffset}
		y={pose.y}
		tint={props.color}
		blendMode="add"
		width={size * 1.9}
		height={size * 1.9}
		alpha={alpha * 0.5}
	/>
	<Sprite
		key="gbH2"
		anchor={0.5}
		x={pose.x + entryOffset}
		y={pose.y}
		{rotation}
		width={size}
		height={size}
		{alpha}
	/>
{/if}
