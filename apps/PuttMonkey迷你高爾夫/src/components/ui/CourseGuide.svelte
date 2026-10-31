<script lang="ts">
	import { base } from '$app/paths';
	import assets from '../../game/assets';
	import config from '../../game/config';

	// The front of the rules: a holiday postcard with the game's headline numbers
	// stamped on it, the course map (one chip per section of the rules, tapping
	// one scrolls there), and the three-step quick guide.
	let {
		waysLabel = 'ways',
		rtp,
		maxWin,
		holes = [],
		onjump,
	}: {
		waysLabel?: string;
		rtp?: string;
		maxWin?: string;
		holes?: { id: string; label: string }[];
		onjump?: (id: string) => void;
	} = $props();

	const ways = config.numRows.reduce((n: number, rows: number) => n * rows, 1);
	const stamps = $derived([
		{ big: `${config.numReels}×${config.numRows[0]}`, small: 'reels' },
		{ big: ways.toLocaleString(), small: waysLabel },
		{ big: rtp, small: 'RTP' },
		{ big: maxWin, small: 'max win' },
	]);
	const stops = $derived([
		{ key: 'gbH1', title: 'Line it up', text: `Match 3 or more adjacent reels, starting on reel 1. ${ways.toLocaleString()} ${waysLabel}; any row counts.` },
		{ key: 'gbW', title: 'Sink every Ball', text: 'Every Golfer collects every Ball on the board. More Golfers mean more collections.' },
		{ key: 'gbS', title: 'Flag down Free Spins', text: `3, 4 or 5 Golden Flags award ${Object.values(config.scatterSpins).join(', ')} Free Spins respectively.` },
	] as const);
</script>

<!-- The pay table reuses this panel for the quick guide only; the postcard and
     course map belong to the rules, which pass the numbers and the holes. -->
{#if rtp && maxWin}
<div class="postcard" style:background-image={`url('${base}/assets/sprites/sushiBackground/bg_base.png')`}>
	<div class="postcard-text">
		<span class="greet">Greetings from</span>
		<strong>Putt Monkey</strong>
		<span class="sub">Mini golf, maxi fun</span>
	</div>
	<img class="postcard-golfer" src={assets.gbW.src} alt="" aria-hidden="true" />
	<ul class="stamps">
		{#each stamps as stamp (stamp.small)}
			<li><b>{stamp.big}</b><span>{stamp.small}</span></li>
		{/each}
	</ul>
</div>
{/if}

{#if holes.length}
	<nav class="course-map" aria-label="Course map">
		<span class="map-title">Course map &middot; {holes.length} holes</span>
		<ol>
			{#each holes as h, i (h.id)}
				<li><button type="button" onclick={() => onjump?.(h.id)}><span>{i + 1}</span>{h.label}</button></li>
			{/each}
		</ol>
	</nav>
{/if}

<div class="course-guide" aria-label="Quick course guide">
	<div class="course-heading"><span>QUICK GUIDE</span><strong>Three shots to know</strong></div>
	<ol>
		{#each stops as stop, i}
			<li>
				<div class="course-art"><span>{String(i + 1).padStart(2, '0')}</span><img src={assets[stop.key].src} alt="" /></div>
				<div><h3>{stop.title}</h3><p>{stop.text}</p></div>
			</li>
		{/each}
	</ol>
</div>

<style>
	/* postcard */
	.postcard {
		position: relative;
		overflow: hidden;
		min-height: 10.5rem;
		padding: 0.9rem 1rem 0;
		border: 3px solid #fff6df;
		outline: 2px solid #2f5e36;
		border-radius: 10px;
		background-size: cover;
		background-position: 50% 40%;
		box-shadow: 4px 5px 0 #142b23;
		text-align: left;
	}
	/* a sunny wash so the lettering reads over the scene */
	.postcard::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(100deg, #fff6dfee 0%, #fff6dfaa 45%, #fff6df00 75%);
	}
	.postcard-text { position: relative; display: flex; flex-direction: column; max-width: 64%; }
	.greet {
		font: italic 700 0.85rem Georgia, serif;
		color: #9b3c2c;
	}
	.postcard-text strong {
		font: 400 clamp(1.5rem, 6.5vw, 2.3rem) var(--gb-display-font, sans-serif);
		line-height: 1;
		color: #e5432f;
		letter-spacing: 0.02em;
		text-shadow: 2px 2px 0 #fff6df, 4px 4px 0 #2f5e36;
		transform: rotate(-3deg);
		transform-origin: left center;
		margin: 0.15rem 0 0.3rem;
	}
	.sub {
		font-size: 0.68rem;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #2f5e36;
	}
	.postcard-golfer {
		position: absolute;
		right: -0.4rem;
		top: 0.2rem;
		width: 7.2rem;
		height: 7.2rem;
		transform: rotate(8deg);
		filter: drop-shadow(3px 4px 0 #142b2355);
		animation: golferIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both;
	}
	@keyframes golferIn {
		from { opacity: 0; transform: translateY(1.5rem) rotate(20deg) scale(0.8); }
		to { opacity: 1; transform: rotate(8deg); }
	}
	.stamps {
		position: relative;
		list-style: none;
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.4rem;
		margin: 0.9rem -1rem 0;
		padding: 0.55rem 0.7rem;
		background: #2f5e36;
	}
	.stamps li {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.25rem 0.15rem;
		border: 1.5px dashed #fff6df99;
		border-radius: 4px;
		color: #fff6df;
		text-align: center;
	}
	.stamps b { font: 400 0.95rem var(--gb-display-font, sans-serif); white-space: nowrap; color: #ffd75e; }
	.stamps span { font-size: 0.58rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }

	/* course map */
	.course-map {
		text-align: left;
		padding: 0.7rem 0.8rem;
		border: 2px solid #2f5e36;
		border-radius: 12px;
		background: repeating-linear-gradient(135deg, #3d7344 0 14px, #376b3e 14px 28px);
	}
	.map-title {
		display: block;
		margin-bottom: 0.45rem;
		font-size: 0.62rem;
		font-weight: 800;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: #fff6df;
	}
	.course-map ol { list-style: none; display: flex; flex-wrap: wrap; gap: 0.35rem; margin: 0; padding: 0; }
	.course-map button {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.22rem 0.6rem 0.22rem 0.25rem;
		border: 0;
		border-radius: 999px;
		background: #fff6df;
		color: #1b2a22;
		font-size: 0.74rem;
		font-weight: 700;
		cursor: pointer;
		box-shadow: 0 2px 0 #142b23;
		transition: transform 0.12s, box-shadow 0.12s;
	}
	.course-map button:hover { transform: translateY(-2px); box-shadow: 0 4px 0 #142b23; }
	.course-map button:active { transform: translateY(1px); box-shadow: 0 1px 0 #142b23; }
	.course-map button span {
		display: grid;
		place-items: center;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		background: #e5432f;
		color: #fff6df;
		font: 400 0.66rem var(--gb-display-font, sans-serif);
	}

	/* quick guide */
	.course-guide { text-align: left; color: #243d30; background: #f6efd9; border: 2px solid #243d30; border-radius: 14px; padding: 1rem; box-shadow: 4px 5px 0 #142b23; }
	.course-heading { border-bottom: 2px solid #243d3030; padding-bottom: .8rem; }
	.course-heading span { display: block; font-size: .62rem; letter-spacing: .2em; font-weight: 800; color: #9b3c2c; }
	.course-heading strong { display: block; font-family: var(--gb-display-font, sans-serif); font-size: 1.4rem; margin-top: .2rem; }
	.course-guide ol { list-style: none; padding: 0; margin: 0; }
	.course-guide li { display: grid; grid-template-columns: 78px minmax(0, 1fr); align-items: center; gap: .7rem; padding: .8rem 0; }
	.course-guide li + li { border-top: 1px dashed #243d3050; }
	.course-guide li:last-child { padding-bottom: 0; }
	.course-art { position: relative; }
	.course-art img { display: block; width: 72px; height: 72px; object-fit: contain; }
	.course-art span { position: absolute; left: -3px; top: -2px; background: #284d38; color: #fff3ce; border-radius: 50%; padding: 4px; font: 700 .6rem sans-serif; }
	h3 { margin: 0 0 .25rem; font-size: .95rem; color: #284d38; }
	p { margin: 0; color: #344c3e; font-size: .78rem; line-height: 1.5; }
	@media (max-width: 400px) {
		.course-guide li { grid-template-columns: 58px minmax(0, 1fr); gap: .5rem; }
		.course-art img { width: 56px; height: 62px; }
		.postcard-golfer { width: 5.6rem; height: 5.6rem; }
		.stamps { grid-template-columns: repeat(2, minmax(0, 1fr)); }
	}
	@media (prefers-reduced-motion: reduce) { .postcard-golfer { animation: none; } }
</style>
