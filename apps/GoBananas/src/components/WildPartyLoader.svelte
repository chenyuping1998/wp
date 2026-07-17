<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	type Props = {
		// minimum time the loader stays on screen before fading out
		duration?: number;
		oncomplete?: () => void;
	};

	const props: Props = $props();

	let show = $state(true);

	onMount(() => {
		const id = setTimeout(() => {
			show = false;
			props.oncomplete?.();
		}, props.duration ?? 1600);
		return () => clearTimeout(id);
	});
</script>

{#if show}
	<div class="gb-loader" transition:fade={{ duration: 400 }}>
		<div class="gb-loader-inner">
			<div class="gb-emblem" aria-label="Go Bananas emblem">
				<svg class="gb-svg" viewBox="0 0 100 100" role="img">
					<!-- golden banana trio, matching the sign emblem -->
					<g stroke="#6d4a08" stroke-width="3" stroke-linejoin="round">
						<path d="M 18 62 Q 30 36 58 28 Q 64 32 61 40 Q 45 58 24 66 Q 18 68 18 62 Z" fill="#ffd75e" />
						<path d="M 26 72 Q 38 46 66 38 Q 72 42 69 50 Q 53 68 32 76 Q 26 78 26 72 Z" fill="#f2b32e" />
						<path d="M 36 82 Q 48 56 76 48 Q 82 52 79 60 Q 63 78 42 86 Q 36 88 36 82 Z" fill="#e8a625" />
					</g>
				</svg>
			</div>
			<div class="gb-title">
				<div>GO BANANAS</div>
				<div class="gb-subtitle">香蕉突擊隊</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.gb-loader {
		position: absolute;
		inset: 0;
		z-index: 999;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #0d0f05;
	}

	.gb-loader-inner {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.85rem;
		font-family: 'proxima-nova', Arial, sans-serif;
	}

	.gb-emblem {
		width: clamp(120px, 18vw, 210px);
		aspect-ratio: 1 / 1;
		animation: gb-bob 1.6s ease-in-out infinite;
	}

	@keyframes gb-bob {
		0%,
		100% {
			transform: translateY(0) rotate(-3deg);
		}
		50% {
			transform: translateY(-8px) rotate(3deg);
		}
	}

	.gb-svg {
		width: 100%;
		height: 100%;
		display: block;
		filter: drop-shadow(0 0 14px rgba(255, 215, 94, 0.35));
	}

	.gb-title {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
		font-size: clamp(1.8rem, 3.8vw, 3.4rem);
		font-weight: 900;
		letter-spacing: 0.12em;
		color: #ffd75e;
		text-align: center;
		line-height: 1;
		text-shadow:
			0 2px 0 #54330a,
			0 0 18px rgba(255, 215, 94, 0.3);
	}

	.gb-subtitle {
		font-size: 0.42em;
		letter-spacing: 0.5em;
		color: #f5e3c3;
	}
</style>
