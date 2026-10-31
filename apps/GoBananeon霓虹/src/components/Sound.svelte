<script lang="ts" module>
	import type { MusicName, SoundEffectName, SoundName } from '../game/sound';
	import { HOLD_AND_SPIN_MODE_KEY } from '../game/constants';

	// What the mascot can say. One clip per animation — see
	// design/generate_voice.mjs, which synthesizes them.
	export type MascotVoice = 'roar' | 'effort';

	export type EmitterEventSound =
		| { type: 'soundMusic'; name: MusicName }
		| { type: 'soundOnce'; name: SoundEffectName; forcePlay?: boolean }
		| { type: 'soundLoop'; name: SoundEffectName }
		| { type: 'soundStop'; name: SoundName }
		| { type: 'soundFade'; name: SoundName; from: number; to: number; duration: number }
		| { type: 'soundFreeGameBell' }
		| { type: 'soundBigWinBlast' }
		| { type: 'soundWinTier'; tier: string }
		| { type: 'soundFullBoardChain' }
		| { type: 'soundFullBoardStamp' }
		| { type: 'soundCaveQuake' }
		| { type: 'soundLadderUp'; level: number }
		| { type: 'soundDynamiteBlast' }
		| { type: 'soundBlastFuse' }
		| { type: 'soundBlastDetonate'; full: boolean; width?: number }
		| { type: 'soundBlastShatter' }
		| { type: 'soundBlastSmoke' }
		| { type: 'soundBlastReveal' }
		| { type: 'soundBlastColumn'; order: number; total: number }
		| { type: 'soundBlastEnd' }
		| { type: 'soundDjScratch' }
		| { type: 'soundDjScratchStop' }
		| { type: 'soundMonkeyExpand' }
		| { type: 'soundMascotVoice'; name: MascotVoice }
		| { type: 'soundChestHoot' }
		| { type: 'soundReelTensionStart' }
		| { type: 'soundReelTensionStop' }
		| { type: 'soundScatterCounterIncrease' }
		| { type: 'soundScatterCounterClear' };
</script>

<script lang="ts">
	import { onMount } from 'svelte';

	import { waitForTimeout } from 'utils-shared/wait';
	import { SECOND } from 'constants-shared/time';
	import { stateBet, stateModal, stateSoundDerived } from 'state-shared';
	import { base } from '$app/paths';

	import { getContext } from '../game/context';
	import musicLoops from '../game/neonAudioLoops';

	const context = getContext();
	// Refresh decoded/CDN assets when the delivered sound design changes.
	const AUDIO_REVISION = 'neon-sampled-v3-20261031';

	// ─── neon sound set ───
	// Short cues use a small voice pool so fast reels and overlapping hits keep
	// their tails. All logical events are routed locally; no template sprite.
	type CnSfxName =
		| 'gong_feature'
		| 'bigwin_blast'
		| 'reel_tension'
		| 'reel_stop_1'
		| 'reel_stop_2'
		| 'reel_stop_3'
		| 'reel_stop_4'
		| 'reel_stop_5'
		| 'win_rollup_loop'
		| 'win_rollup_end'
		| 'btn'
		| 'spin'
		| 'scatter_1'
		| 'scatter_2'
		| 'scatter_3'
		| 'scatter_4'
		| 'scatter_5'
		| 'pluck_low'
		| 'win_gliss'
		| 'win_gliss_big'
		| 'fs_intro'
		| 'coin_shimmer'
		| 'wild_expand'
		| 'mult_update'
		| 'grenade_blast'
		| 'fuse_sizzle'
		| 'dynamite_blast'
		| 'dynamite_blast_big'
		| 'symbol_shatter'
		| 'smoke_puff'
		| 'press_blast'
		| 'win_big'
		| 'win_super'
		| 'win_mega'
		| 'win_epic'
		| 'win_max'
		| 'win_panel'
		| 'win_cap'
		| 'fullboard_chain'
		| 'fullboard_stamp'
		| 'cave_quake'
		| 'ladder_up'
		| 'symbol_reveal'
		| 'symbol_land'
		| 'dj_scratch'
		| 'monkey_expand'
		| 'voice_roar'
		| 'voice_effort';

	const CN_SFX_FILES: Record<CnSfxName, string> = {
		gong_feature: 'neon/gong_feature.wav',
		bigwin_blast: 'neon/bigwin_blast.wav',
		reel_tension: 'neon/reel_tension.wav',
		reel_stop_1: 'neon/reel_stop_1.wav',
		reel_stop_2: 'neon/reel_stop_2.wav',
		reel_stop_3: 'neon/reel_stop_3.wav',
		reel_stop_4: 'neon/reel_stop_4.wav',
		reel_stop_5: 'neon/reel_stop_5.wav',
		win_rollup_loop: 'neon/win_rollup_loop.wav',
		win_rollup_end: 'neon/win_rollup_end.wav',
		btn: 'neon/btn.wav',
		spin: 'neon/spin.wav',
		scatter_1: 'neon/scatter_1.wav',
		scatter_2: 'neon/scatter_2.wav',
		scatter_3: 'neon/scatter_3.wav',
		scatter_4: 'neon/scatter_4.wav',
		scatter_5: 'neon/scatter_5.wav',
		pluck_low: 'neon/pluck_low.wav',
		win_gliss: 'neon/win_gliss.wav',
		win_gliss_big: 'neon/win_gliss_big.wav',
		fs_intro: 'neon/fs_intro.wav',
		coin_shimmer: 'neon/coin_shimmer.wav',
		wild_expand: 'neon/wild_expand.wav',
		mult_update: 'neon/mult_update.wav',
		grenade_blast: 'neon/grenade_blast.wav',
		// Sample-based energy-core destruction, built by build_neon_audio_v3.py:
		// separate transient/body, glass fragments, air and harmonic reveal.
		fuse_sizzle: 'neon/fuse_sizzle.wav',
		dynamite_blast: 'neon/dynamite_blast.wav',
		dynamite_blast_big: 'neon/dynamite_blast_big.wav',
		symbol_shatter: 'neon/symbol_shatter.wav',
		smoke_puff: 'neon/smoke_puff.wav',
		press_blast: 'neon/press_blast.wav',
		// One fanfare per big-win tier, each larger than the last, laid over the
		// running bed rather than replacing it. See soundWinTier below.
		win_big: 'neon/win_big.wav',
		win_super: 'neon/win_super.wav',
		win_mega: 'neon/win_mega.wav',
		win_epic: 'neon/win_epic.wav',
		win_max: 'neon/win_max.wav',
		win_panel: 'neon/win_panel.wav',
		win_cap: 'neon/win_cap.wav',
		// the full board's own beats, timed to FullBoard.svelte
		fullboard_chain: 'neon/fullboard_chain.wav',
		fullboard_stamp: 'neon/fullboard_stamp.wav',
		// the roof answering the chest beat on a trigger, timed to game/caveQuake
		cave_quake: 'neon/cave_quake.wav',
		// A sampled synth cadence marks each rung of the Overdrive ladder.
		ladder_up: 'neon/ladder_up.wav',
		symbol_reveal: 'neon/symbol_reveal.wav',
		symbol_land: 'neon/symbol_land.wav',
		dj_scratch: 'neon/dj_scratch.wav',
		// player-supplied monkey hoot, mp3 rather than the synthesized wav set
		monkey_expand: 'neon/monkey_expand.mp3',
		voice_roar: 'neon/voice_roar.wav',
		voice_effort: 'neon/voice_effort.wav',
	};

	// He is a character in the scene, not the interface, so he sits UNDER
	// everything the game says with a sound of its own. Per clip, because they
	// were levelled against each other and not against the rest of the set: the
	// chirp plays on most paying spins and has to disappear into the mix, the
	// chest-beat roar is the loudest thing he ever does.
	// Louder than the first pass. These play UNDER a big-win blast, a coin
	// shimmer and the fast free-game bed, and at 0.6 the cheer was mixed low
	// enough to be arguable whether it was there at all — which is not a level,
	// it is an absence with a volume control on it.
	const MASCOT_VOICE_GAIN: Record<MascotVoice, number> = {
		roar: 1,
		effort: 0.8,
	};

	// Independent, sample-based stops play at their recorded pitch and duration.
	const SPRITE_TO_CN: Record<
		Exclude<SoundEffectName, 'sfx_anticipation' | 'sfx_bigwin_coinloop'>,
		{ name: CnSfxName; volume?: number; rate?: number }
	> = {
		sfx_btn_general: { name: 'btn', volume: 0.7 },
		sfx_btn_spin: { name: 'spin', volume: 0.9 },
		sfx_reel_stop_1: { name: 'reel_stop_1', rate: 1, volume: 0.66 },
		sfx_reel_stop_2: { name: 'reel_stop_2', rate: 1, volume: 0.7 },
		sfx_reel_stop_3: { name: 'reel_stop_3', rate: 1, volume: 0.74 },
		sfx_reel_stop_4: { name: 'reel_stop_4', rate: 1, volume: 0.79 },
		sfx_reel_stop_5: { name: 'reel_stop_5', rate: 1, volume: 0.86 },
		sfx_scatter_stop_1: { name: 'scatter_1' },
		sfx_scatter_stop_2: { name: 'scatter_2' },
		sfx_scatter_stop_3: { name: 'scatter_3' },
		sfx_scatter_stop_4: { name: 'scatter_4' },
		sfx_scatter_stop_5: { name: 'scatter_5' },
		sfx_multiplier_landing: { name: 'pluck_low' },
		sfx_winlevel_small: { name: 'win_gliss' },
		sfx_scatter_win: { name: 'win_gliss' },
		sfx_scatter_win_v2: { name: 'win_gliss_big' },
		sfx_superfreespin: { name: 'win_gliss_big', volume: 0.8 },
		// Total-win panel arrival and the final wincap resolution.
		sfx_youwon_panel: { name: 'win_panel' },
		sfx_winlevel_end: { name: 'win_cap' },
		jng_intro_fs: { name: 'fs_intro' },
		sfx_wild_explode: { name: 'wild_expand' },
		sfx_multiplier_update: { name: 'mult_update' },
		sfx_anticipation_start: { name: 'mult_update', volume: 0.5 },
		sfx_symbols_landing: { name: 'reel_stop_3', volume: 0.6 },
		sfx_royals_landing: { name: 'reel_stop_3', volume: 0.6 },
		sfx_fs_respins: { name: 'mult_update' },
		sfx_multiplier_combine_a: { name: 'mult_update' },
		sfx_multiplier_combine_b: { name: 'symbol_reveal' },
		sfx_multiplier_explosion_a: { name: 'grenade_blast' },
		sfx_multiplier_explosion_b: { name: 'dynamite_blast' },
		sfx_multiplier_explosion_c: { name: 'dynamite_blast_big' },
		sfx_multiplier_reset: { name: 'btn' },
		sfx_multiplier_up: { name: 'ladder_up' },
		sfx_multiplier_win: { name: 'win_gliss' },
		sfx_scatter_reveal: { name: 'scatter_1' },
		sfx_winlevel_nice: { name: 'win_gliss' },
		sfx_winlevel_standard: { name: 'win_gliss' },
		sfx_winlevel_substantial: { name: 'win_gliss_big' },
		tumble_win_1: { name: 'win_gliss' },
		tumble_win_2: { name: 'win_gliss' },
		tumble_win_3: { name: 'win_gliss_big' },
		tumble_win_4: { name: 'win_gliss_big' },
	};

	const cnSfxAudio: Partial<Record<CnSfxName, HTMLAudioElement>> = {};
	const cnSfxVoices: Partial<Record<CnSfxName, HTMLAudioElement[]>> = {};
	const voiceStarted = new WeakMap<HTMLAudioElement, number>();
	const elementSources = new WeakMap<HTMLAudioElement, MediaElementAudioSourceNode>();
	const MAX_VOICES = 4;

	function setElementVolume(audio: HTMLAudioElement, scale = 1) {
		const ctx = getAudioCtx();
		if (ctx && sfxBus && typeof ctx.createMediaElementSource === 'function') {
			let source = elementSources.get(audio);
			if (!source) {
				source = ctx.createMediaElementSource(audio);
				source.connect(sfxBus);
				elementSources.set(audio, source);
			}
			// Mascot calls and the first-play HTML fallback share the same mix
			// protection and settings as decoded clips.
			audio.volume = Math.min(1, scale);
		} else {
			audio.volume = Math.min(1, stateSoundDerived.volumeSoundEffect() * scale);
		}
	}

	function getCnSfx(name: CnSfxName) {
		let audio = cnSfxAudio[name];
		if (!audio) {
			audio = new Audio(`${base}/assets/audio/${CN_SFX_FILES[name]}?v=${AUDIO_REVISION}`);
			audio.preload = 'auto';
			cnSfxAudio[name] = audio;
		}
		return audio;
	}

	function playCnSfx(name: CnSfxName, volumeScale = 1, rate = 1) {
		// Decoded buffers start on the audio clock. HTML Audio remains a fallback
		// while a first download is pending or Web Audio is unavailable.
		if (playBufferedCue(name, volumeScale, rate)) return;
		const primary = getCnSfx(name);
		const voices = (cnSfxVoices[name] ??= [primary]);
		let audio = voices.find((voice) => voice.paused || voice.ended);
		if (!audio && voices.length < MAX_VOICES) {
			audio = new Audio(primary.src);
			audio.preload = 'auto';
			voices.push(audio);
		}
		// Only steal a voice when every one is busy. Reel stops, reveal notes and
		// quick win hits can now overlap without cutting off each other's tails.
		if (!audio) {
			audio = voices.reduce((oldest, voice) =>
				(voiceStarted.get(voice) ?? 0) < (voiceStarted.get(oldest) ?? 0) ? voice : oldest,
			);
		}
		audio.loop = false;
		setElementVolume(audio, volumeScale);
		voiceStarted.set(audio, performance.now());
		// Always assign, never skip when rate is 1: getCnSfx caches one element per
		// file, so a rate left over from the previous caller would carry into every
		// later play of the same sample, including pitched blast-column landings.
		audio.playbackRate = rate;
		audio.currentTime = 0;
		audio.play().catch(() => {});
	}

	// The monkey hoot the player supplied is ~5s, but it needs to track the wild
	// expansion — which lasts about 1.5s — and then get out of the way. Play it
	// from the top, hold, then fade to silence so it covers the grow and settles
	// as the panel locks, instead of hanging on under the next spin.
	let monkeyFadeTimers: ReturnType<typeof setTimeout>[] = [];
	// THE HOOT OVER THE CHEST BEAT: GB100's expanding-wild monkey call, laid over
	// the strikes of the Scatter-trigger chest beat so it starts and stops WITH
	// them (ported from GoBananasBoat, 2026-09-28).
	//
	// Measured on the clip (monkey_expand.mp3, 10ms RMS windows), not guessed:
	//   · the first hoot starts 40ms in, so playback starts 40ms BEFORE the first
	//     strike and the first hoot lands on it
	//   · the clip has hoots with short silences between them (-30dB and below
	//     at 0.86, 1.04, 1.21-1.31, 1.40-1.50, 1.60-1.69, 1.80s ...). It is cut
	//     inside the silence right after the hoot that lands on the LAST strike,
	//     so it stops with that strike and nothing is left ringing to click off.
	//     CUT_S below is that point for this rig's strikes: six strikes 300ms apart span 1.5s, so the last lands at 1.54s on the clip, on the hoot at 1.50-1.59; the silence after it is 1.60-1.69, cut at 1.62 (the same as Boat, whose strikes are the same).
	//
	// The cut watches the clip's own position rather than a wall-clock timer, so
	// a slow start to playback cannot move it into the next hoot; a timer backs
	// it up in case the clip never starts at all.
	//
	// The strikes are the mascot rig's (design/generate_monkey_spine.mjs: BEAT_START / BEAT_GAP).
	// Change them and CUT_S has to be measured again.
	const HOOT_FIRST_STRIKE_MS = 480;
	const HOOT_STRIKE_GAP_MS = 300;
	const HOOT_STRIKES = 6;
	const HOOT_ONSET_S = 0;
	const HOOT_CUT_S = 1.78;
	let hootTimers: ReturnType<typeof setTimeout>[] = [];
	let hootWatch: ReturnType<typeof setInterval> | null = null;
	const stopHoot = (audio: HTMLAudioElement) => {
		if (hootWatch !== null) clearInterval(hootWatch);
		hootWatch = null;
		hootTimers.forEach(clearTimeout);
		hootTimers = [];
		audio.pause();
	};
	function playChestHoot() {
		const audio = getCnSfx('monkey_expand');
		stopHoot(audio);
		const beatsMs = (HOOT_STRIKES - 1) * HOOT_STRIKE_GAP_MS;
		hootTimers.push(
			setTimeout(
				() => {
					audio.loop = false;
					setElementVolume(audio, 0.9);
					audio.playbackRate = 1;
					audio.currentTime = 0;
					audio.play().catch(() => {});
					hootWatch = setInterval(() => {
						if (audio.currentTime >= HOOT_CUT_S) stopHoot(audio);
					}, 10);
					hootTimers.push(setTimeout(() => stopHoot(audio), beatsMs + 600));
				},
				Math.max(0, HOOT_FIRST_STRIKE_MS - HOOT_ONSET_S * 1000),
			),
		);
	}

	function playMonkeyExpand() {
		const audio = getCnSfx('monkey_expand');
		monkeyFadeTimers.forEach(clearTimeout);
		monkeyFadeTimers = [];
		audio.loop = false;
		setElementVolume(audio);
		const vol = audio.volume;
		audio.playbackRate = 1;
		audio.currentTime = 0;
		audio.play().catch(() => {});
		// The neon call naturally ends at 1.8s; the fade only cleans its tail.
		const HOLD_MS = 1550;
		const FADE_MS = 250;
		const STEPS = 12;
		for (let s = 1; s <= STEPS; s++) {
			monkeyFadeTimers.push(
				setTimeout(
					() => {
						audio.volume = Math.max(0, vol * (1 - s / STEPS));
						if (s === STEPS) audio.pause();
					},
					HOLD_MS + (FADE_MS / STEPS) * s,
				),
			);
		}
	}

	// Continuous beds run on the audio clock. Coin shimmer remains a one-shot;
	// the rollup bed has its own flat envelope, cancellation and 120ms release.
	const LOOP_FADE_IN = 0.12;
	const LOOP_FADE_OUT = 0.25;

	let audioCtx: AudioContext | null = null;
	let sfxBus: GainNode | null = null;
	let mixBus: GainNode | null = null;
	const loopBuffers: Partial<Record<CnSfxName, AudioBuffer>> = {};
	const bufferLoads: Partial<Record<CnSfxName, Promise<AudioBuffer | null>>> = {};
	const activeCues: Partial<Record<CnSfxName, Set<AudioBufferSourceNode>>> = {};
	const loopNodes: Partial<Record<CnSfxName, { src: AudioBufferSourceNode; gain: GainNode }>> = {};
	const loopGeneration: Partial<Record<CnSfxName, number>> = {};

	const getAudioCtx = () => {
		if (typeof window === 'undefined') return null;
		if (!audioCtx) {
			const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
			if (!Ctor) return null;
			audioCtx = new Ctor();
			mixBus = audioCtx.createGain();
			const safety = audioCtx.createDynamicsCompressor();
			safety.threshold.value = -2;
			safety.knee.value = 1;
			safety.ratio.value = 16;
			safety.attack.value = 0.001;
			safety.release.value = 0.08;
			const master = audioCtx.createGain();
			master.gain.value = 0.93;
			mixBus.connect(safety).connect(master).connect(audioCtx.destination);
			// A shared effects bus catches simultaneous impacts and fanfares. This
			// preserves transient headroom instead of relying on each file alone.
			sfxBus = audioCtx.createGain();
			sfxBus.gain.value = stateSoundDerived.volumeSoundEffect();
			const limiter = audioCtx.createDynamicsCompressor();
			limiter.threshold.value = -6;
			limiter.knee.value = 6;
			limiter.ratio.value = 4;
			limiter.attack.value = 0.002;
			limiter.release.value = 0.11;
			const output = audioCtx.createGain();
			output.gain.value = 0.82;
			sfxBus.connect(limiter).connect(output).connect(mixBus);
		}
		// The context starts suspended until a gesture; the game always has one by
		// the time anything loops (the loading screen is dismissed by a press).
		if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
		return audioCtx;
	};

	async function loadCueBuffer(name: CnSfxName): Promise<AudioBuffer | null> {
		if (loopBuffers[name]) return loopBuffers[name]!;
		if (bufferLoads[name]) return bufferLoads[name]!;
		const ctx = getAudioCtx();
		if (!ctx) return null;
		const pending = (async () => {
			try {
				const res = await fetch(`${base}/assets/audio/${CN_SFX_FILES[name]}?v=${AUDIO_REVISION}`);
				if (!res.ok) return null;
				const buffer = await ctx.decodeAudioData(await res.arrayBuffer());
				loopBuffers[name] = buffer;
				return buffer;
			} catch {
				return null;
			} finally {
				delete bufferLoads[name];
			}
		})();
		bufferLoads[name] = pending;
		return pending;
	}

	function playBufferedCue(name: CnSfxName, volumeScale: number, rate: number) {
		const ctx = getAudioCtx();
		const buffer = loopBuffers[name];
		if (!ctx || !buffer || !sfxBus) {
			void loadCueBuffer(name);
			return false;
		}
		const voices = (activeCues[name] ??= new Set());
		if (voices.size >= MAX_VOICES) {
			const oldest = voices.values().next().value;
			oldest?.stop();
			if (oldest) voices.delete(oldest);
		}
		const src = ctx.createBufferSource();
		const gain = ctx.createGain();
		src.buffer = buffer;
		src.playbackRate.value = rate;
		gain.gain.value = Math.max(0, volumeScale);
		src.connect(gain).connect(sfxBus);
		voices.add(src);
		src.onended = () => {
			voices.delete(src);
			src.disconnect();
			gain.disconnect();
		};
		src.start();
		return true;
	}

	async function playCnLoop(name: CnSfxName, volumeScale = 1) {
		const generation = (loopGeneration[name] ?? 0) + 1;
		loopGeneration[name] = generation;
		const ctx = getAudioCtx();
		// No Web Audio (very old browser): fall back to the element, seam and all —
		// a slightly choppy loop beats silence.
		if (!ctx) {
			const audio = getCnSfx(name);
			audio.loop = true;
			audio.volume = Math.min(1, stateSoundDerived.volumeSoundEffect() * volumeScale);
			if (!audio.paused && !audio.ended) return;
			audio.currentTime = 0;
			audio.play().catch(() => {});
			return;
		}

		if (loopNodes[name]) return; // already running — never restart it

		const buffer = await loadCueBuffer(name);
		if (!buffer || generation !== loopGeneration[name]) return;
		// Awaiting the decode above means a stop() could have arrived in the
		// meantime, and a second play() could have won the race.
		if (loopNodes[name]) return;

		const target = Math.min(1, volumeScale);
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(0.0001, ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, target), ctx.currentTime + LOOP_FADE_IN);
		const src = ctx.createBufferSource();
		src.buffer = buffer;
		src.loop = true;
		src.connect(gain).connect(sfxBus!);
		src.onended = () => { src.disconnect(); gain.disconnect(); };
		src.start();
		loopNodes[name] = { src, gain };
	}

	function stopCnLoop(name: CnSfxName, fadeSeconds = LOOP_FADE_OUT) {
		loopGeneration[name] = (loopGeneration[name] ?? 0) + 1;
		const node = loopNodes[name];
		if (!node) return;
		delete loopNodes[name];
		const ctx = audioCtx;
		if (!ctx) {
			node.src.stop();
			return;
		}
		const end = ctx.currentTime + fadeSeconds;
		node.gain.gain.cancelScheduledValues(ctx.currentTime);
		node.gain.gain.setValueAtTime(Math.max(0.0001, node.gain.gain.value), ctx.currentTime);
		node.gain.gain.exponentialRampToValueAtTime(0.0001, end);
		node.src.stop(end);
	}

	function stopCnSfx(name: CnSfxName) {
		for (const src of activeCues[name] ?? []) src.stop();
		activeCues[name]?.clear();
		for (const audio of cnSfxVoices[name] ?? (cnSfxAudio[name] ? [cnSfxAudio[name]!] : [])) {
			audio.pause();
			audio.currentTime = 0;
		}
	}

	// ─── BGM: decoded, gapless loops with a short musical crossfade ───
	let bgmAudio: HTMLAudioElement | null = null;
	type MusicLoop = { src: AudioBufferSourceNode; gain: GainNode };
	let bgmNode: MusicLoop | null = null;
	let transitionNode: MusicLoop | null = null;
	let bgmGeneration = 0;
	let bgmTransitionProgress = 1;
	const musicBuffers: Partial<Record<'base' | 'freespin', AudioBuffer>> = {};
	const musicLoads: Partial<Record<'base' | 'freespin', Promise<AudioBuffer | null>>> = {};
	let currentBgm: 'base' | 'freespin' | null = null;
	let bgmDuck = 1;
	let djMusicDuck = 1;
	let djDuckTimer: ReturnType<typeof setInterval> | undefined;
	let djFinishTimer: ReturnType<typeof setTimeout> | undefined;
	let bgmFadeTimer: ReturnType<typeof setInterval> | undefined;
	let bgmTransitionTimer: ReturnType<typeof setInterval> | undefined;
	let transitionAudio: HTMLAudioElement | null = null;
	let blastReleaseTimer: ReturnType<typeof setTimeout> | undefined;
	const BGM_FILES = {
		base: 'neon/bgm_main.mp3',
		freespin: 'neon/bgm_freespin.mp3',
	} as const;
	const MUSIC_BUS_GAIN = 0.72;
	const musicLevel = () => Math.min(1, stateSoundDerived.volumeMusic() * bgmDuck * djMusicDuck * MUSIC_BUS_GAIN);

	function fadeDjMusicDuck(to: number, duration = 200) {
		clearInterval(djDuckTimer);
		const from = djMusicDuck;
		const started = performance.now();
		djDuckTimer = setInterval(() => {
			const p = Math.min(1, (performance.now() - started) / duration);
			const eased = p * p * (3 - 2 * p);
			djMusicDuck = from + (to - from) * eased;
			if (bgmAudio) bgmAudio.volume = musicLevel();
			if (bgmNode) bgmNode.gain.gain.value = musicLevel() * bgmTransitionProgress;
			if (p === 1) clearInterval(djDuckTimer);
		}, 20);
	}

	function stopDjScratch() {
		clearTimeout(djFinishTimer);
		stopCnSfx('dj_scratch');
		fadeDjMusicDuck(1, 250);
	}

	async function loadMusicBuffer(type: 'base' | 'freespin'): Promise<AudioBuffer | null> {
		if (musicBuffers[type]) return musicBuffers[type]!;
		if (musicLoads[type]) return musicLoads[type]!;
		const ctx = getAudioCtx();
		if (!ctx) return null;
		const pending = (async () => {
			try {
				const res = await fetch(`${base}/assets/audio/${BGM_FILES[type]}?v=${AUDIO_REVISION}`);
				if (!res.ok) return null;
				const decoded = await ctx.decodeAudioData(await res.arrayBuffer());
				const loop = musicLoops[type === 'base' ? 'bgm_main' : 'bgm_freespin'];
				const start = Math.round(loop.trimStartSeconds * decoded.sampleRate);
				const frames = Math.round(loop.frames * decoded.sampleRate / loop.sampleRate);
				if (start + frames > decoded.length) return null;
				const buffer = ctx.createBuffer(decoded.numberOfChannels, frames, decoded.sampleRate);
				for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
					buffer.copyToChannel(decoded.getChannelData(channel).subarray(start, start + frames), channel);
				}
				musicBuffers[type] = buffer;
				return buffer;
			} catch {
				return null;
			} finally {
				delete musicLoads[type];
			}
		})();
		musicLoads[type] = pending;
		return pending;
	}

	function fadeBgmDuck(to: number, duration: number) {
		clearInterval(bgmFadeTimer);
		const from = bgmDuck;
		const started = performance.now();
		bgmFadeTimer = setInterval(() => {
			const p = Math.min(1, (performance.now() - started) / duration);
			const eased = p * p * (3 - 2 * p);
			bgmDuck = from + (to - from) * eased;
			if (bgmAudio) bgmAudio.volume = musicLevel();
			if (bgmNode) bgmNode.gain.gain.value = musicLevel() * bgmTransitionProgress;
			if (p === 1) clearInterval(bgmFadeTimer);
		}, 25);
	}

	function releaseBlastBgm() {
		clearTimeout(blastReleaseTimer);
		fadeBgmDuck(1, 420);
	}

	async function playBgm(type: 'base' | 'freespin') {
		if (currentBgm === type && (bgmNode || (bgmAudio && !bgmAudio.paused))) return;
		const generation = ++bgmGeneration;
		const ctx = getAudioCtx();
		const buffer = ctx ? await loadMusicBuffer(type) : null;
		if (generation !== bgmGeneration) return;
		if (ctx && buffer) {
			clearInterval(bgmTransitionTimer);
			transitionNode?.src.stop();
			const previous = bgmNode;
			transitionNode = previous;
			const src = ctx.createBufferSource();
			const gain = ctx.createGain();
			src.buffer = buffer;
			src.loop = true;
			gain.gain.value = 0;
			src.connect(gain).connect(mixBus!);
			src.onended = () => { src.disconnect(); gain.disconnect(); };
			bgmNode = { src, gain };
			bgmTransitionProgress = 0;
			bgmAudio?.pause();
			bgmAudio = null;
			src.start();
			const started = performance.now();
			const initial = previous?.gain.gain.value ?? 0;
			bgmTransitionTimer = setInterval(() => {
				const p = Math.min(1, (performance.now() - started) / 450);
				bgmTransitionProgress = p;
				gain.gain.value = musicLevel() * p;
				if (previous) previous.gain.gain.value = initial * (1 - p);
				if (p === 1) {
					clearInterval(bgmTransitionTimer);
					previous?.src.stop();
					if (transitionNode === previous) transitionNode = null;
				}
			}, 25);
			currentBgm = type;
			return;
		}
		// Browsers without Web Audio still receive the same music delivery.
		clearInterval(bgmTransitionTimer);
		const previous = bgmAudio;
		const next = new Audio(`${base}/assets/audio/${BGM_FILES[type]}?v=${AUDIO_REVISION}`);
		next.loop = true;
		next.volume = 0;
		bgmAudio = next;
		next.play().catch(() => {});
		if (transitionAudio && transitionAudio !== previous) transitionAudio.pause();
		transitionAudio = previous;
		const started = performance.now();
		const initial = previous?.volume ?? 0;
		bgmTransitionTimer = setInterval(() => {
			const p = Math.min(1, (performance.now() - started) / 450);
			const target = musicLevel();
			next.volume = target * p;
			if (previous) previous.volume = initial * (1 - p);
			if (p === 1) {
				clearInterval(bgmTransitionTimer);
				previous?.pause();
				if (transitionAudio === previous) transitionAudio = null;
			}
		}, 25);
		currentBgm = type;
	}

	function stopBgm() {
		bgmGeneration++;
		clearInterval(bgmTransitionTimer);
		bgmNode?.src.stop();
		transitionNode?.src.stop();
		bgmNode = null;
		transitionNode = null;
		if (bgmAudio) {
			bgmAudio.pause();
			bgmAudio.currentTime = 0;
		}
		transitionAudio?.pause();
		transitionAudio = null;
		currentBgm = null;
	}

	// Keep volume in sync with settings
	$effect(() => {
		const vol = stateSoundDerived.volumeMusic();
		if (bgmAudio) bgmAudio.volume = musicLevel();
		if (bgmNode) bgmNode.gain.gain.value = musicLevel() * bgmTransitionProgress;
	});
	$effect(() => {
		const vol = stateSoundDerived.volumeSoundEffect();
		if (audioCtx && sfxBus) sfxBus.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.025);
	});

	let rollupActive = false;
	let rollupEndTimer: ReturnType<typeof setTimeout> | undefined;
	function startRollup() {
		if (rollupActive) return;
		clearTimeout(rollupEndTimer);
		stopCnSfx('win_rollup_end');
		rollupActive = true;
		playCnSfx('coin_shimmer', 0.8);
		void playCnLoop('win_rollup_loop', 0.7);
	}
	function finishRollup() {
		if (!rollupActive) return; // count completion + dismissal can both stop it
		rollupActive = false;
		stopCnLoop('win_rollup_loop', 0.12);
		stopCnSfx('coin_shimmer');
		rollupEndTimer = setTimeout(() => {
			stopCnSfx('win_rollup_loop'); // legacy element fallback
			playCnSfx('win_rollup_end', 0.8);
		}, 120);
	}

	context.eventEmitter.subscribeOnMount({
		// ui
		soundBetMode: async ({ betModeKey }) => {
			if (betModeKey === HOLD_AND_SPIN_MODE_KEY) {
				playCnSfx('win_gliss_big', 0.7);
				await waitForTimeout(SECOND);
				playBgm('freespin');
			} else {
				playBgm('base');
			}
		},
		// PRESSING BUY BONUS SETS OFF A SMALL CHARGE; every other button clicks.
		//
		// The shared ButtonBuyBonus raises the same generic soundPressGeneral as
		// every other control, so the press itself carries nothing to tell them
		// apart — and per-game behaviour does not belong in wp/packages, where a
		// key would also affect every other game and has twice gone missing under
		// another session's edits.
		//
		// It is identifiable from here anyway: that button's handler broadcasts
		// this event and THEN opens the buy menu, both synchronously. So the
		// decision is deferred by one microtask — which runs after the whole click
		// handler, still inside the same task and the same user gesture, so audio
		// is not blocked — and by then stateModal says which button it was. Any
		// other press, including Buy Bonus while a bought mode is active (that
		// cancels, and opens nothing), falls through to the normal click.
		soundPressGeneral: () => {
			const before = stateModal.modal?.name;
			queueMicrotask(() => {
				// Two literal calls, not one with a ternary: design/check_audio.mjs
				// reads cue names straight out of playCnSfx(...) and a name hidden
				// inside an expression stops being checked - it counted one cue
				// fewer the moment this was written the short way.
				if (stateModal.modal?.name === 'buyBonus' && before !== 'buyBonus') {
					// A lighter Pulse Bomb hit marks the buy-menu action.
					playCnSfx('press_blast', 0.7);
				} else {
					playCnSfx('btn', 0.7);
				}
			});
		},
		soundPressBet: () => playCnSfx('spin', 0.9),
		// scatterCounter
		soundScatterCounterIncrease: () => (context.stateGame.scatterCounter = context.stateGame.scatterCounter + 1), // prettier-ignore
		soundScatterCounterClear: () => (context.stateGame.scatterCounter = 0),
		// game
		soundMusic: ({ name }) => {
			if (name === 'bgm_main') void playBgm('base');
			else if (name === 'bgm_freespin') void playBgm('freespin');
			else {
				const tiers = {
					bgm_winlevel_big: 'win_big', bgm_winlevel_superwin: 'win_super',
					bgm_winlevel_mega: 'win_mega', bgm_winlevel_epic: 'win_epic', bgm_winlevel_max: 'win_max',
				} as const;
				playCnSfx(tiers[name], 0.82);
			}
		},
		soundLoop: ({ name }) => {
			if (name === 'sfx_bigwin_coinloop') startRollup();
			else if (name === 'sfx_anticipation') {
				// soundReelTensionStart owns the expectation bed and its envelope.
			} else {
				const mapped = SPRITE_TO_CN[name];
				void playCnLoop(mapped.name, mapped.volume ?? 1);
			}
		},
		soundOnce: ({ name }) => {
			if (name === 'sfx_bigwin_coinloop') { startRollup(); return; }
			if (name === 'sfx_anticipation') { void playCnLoop('reel_tension', 0.8); return; }
			const mapped = SPRITE_TO_CN[name];
			playCnSfx(mapped.name, mapped.volume ?? 1, mapped.rate ?? 1);
		},
		soundFreeGameBell: () => playCnSfx('gong_feature'),
		soundBigWinBlast: () => playCnSfx('bigwin_blast'),
		// FIVE TIERS THAT USED TO SOUND IDENTICAL. Big and max both got the bed,
		// one blast and the coin shimmer. Each tier now adds its own fanfare, built
		// to escalate on length, voice count, register and percussion density
		// (design/build_neon_audio_v3.py). Literal calls per case, not a lookup:
		// design/check_audio.mjs reads cue names out of playCnSfx(...) and a name
		// held in a variable is not checked.
		// The full board: the fuses catching on each reel in turn, and the stamp
		// after the blast. Both are timed to FullBoard.svelte's constants.
		soundFullBoardChain: () => {
			fadeBgmDuck(0.62, 180);
			playCnSfx('fullboard_chain', 0.85);
		},
		soundFullBoardStamp: () => {
			fadeBgmDuck(0.55, 100);
			playCnSfx('fullboard_stamp', 0.9);
			clearTimeout(blastReleaseTimer);
			blastReleaseTimer = setTimeout(releaseBlastBgm, 1100);
		},
		// Under the roar and the bell: it is the room, not the event, so it sits
		// back in the mix and is felt more than heard.
		soundCaveQuake: () => playCnSfx('cave_quake', 0.6),
		// Louder on each rung, so the climb is heard as well as seen: 0.5 at the
		// first step up to 0.85 at the top.
		soundLadderUp: ({ level }) => playCnSfx('ladder_up', Math.min(0.85, 0.35 + 0.13 * level)),
		soundWinTier: ({ tier }) => {
			if (tier === 'big') playCnSfx('win_big', 0.8);
			else if (tier === 'superwin') playCnSfx('win_super', 0.8);
			else if (tier === 'mega') playCnSfx('win_mega', 0.82);
			else if (tier === 'epic') playCnSfx('win_epic', 0.85);
			else if (tier === 'max') playCnSfx('win_max', 0.88);
		},
		// Legacy event/file names retain their Pulse Bomb animation bindings.
		soundDynamiteBlast: () => {
			fadeBgmDuck(0.55, 80);
			playCnSfx('grenade_blast');
			clearTimeout(blastReleaseTimer);
			blastReleaseTimer = setTimeout(releaseBlastBgm, 650);
		},
		// The reel blast. Like the mascot's voice these sit outside the turbo gate
		// that drops ordinary one-shots — ReelBlast runs at its full length
		// whatever the spin speed, so a silenced blast would be a smoke cloud with
		// nothing behind it.
		soundBlastFuse: () => {
			clearTimeout(blastReleaseTimer);
			stopCnSfx('fuse_sizzle');
			fadeBgmDuck(0.43, 140);
			playCnSfx('fuse_sizzle', 0.75);
		},
		soundBlastDetonate: ({ full, width = full ? 5 : 1 }) => {
			stopCnSfx('fuse_sizzle');
			// Width adds weight and a lower voice, with a separate full-board shell.
			if (full) playCnSfx('dynamite_blast_big', 0.82);
			else playCnSfx('dynamite_blast', 0.75 + Math.min(3, Math.max(0, width - 1)) * 0.035, 1 - Math.min(3, Math.max(0, width - 1)) * 0.018);
		},
		// Under the bang on purpose: it is the same event heard from closer in, so
		// it must not compete with the blast for the front of the mix.
		//
		// The main impact already carries its own crack. Fragments are small,
		// dry accents, so rapid blasts leave space for the new symbols.
		soundBlastShatter: () => playCnSfx('symbol_shatter', 0.32),
		// The cloud's own sound, small on purpose: the air the explosion pushed,
		// heard under the tail of the bang rather than as a second event.
		soundBlastSmoke: () => playCnSfx('smoke_puff', 0.32),
		soundBlastReveal: () => playCnSfx('symbol_reveal', 0.58),
		// A quiet rising cadence marks completed columns. One note per reel,
		// after its final cell lands, leaves room for the reveal's longer tail.
		soundBlastColumn: ({ order, total }) =>
			playCnSfx('symbol_land', 0.33 + 0.14 * (order / Math.max(1, total - 1)), 0.96 + order * 0.045),
		soundBlastEnd: releaseBlastBgm,
		soundDjScratch: () => {
			clearTimeout(djFinishTimer);
			stopCnSfx('dj_scratch');
			// Keep the groove audible beneath the light record cuts. The gesture
			// is an accent in the music rather than a solo foreground effect.
			fadeDjMusicDuck(0.55, 110);
			playCnSfx('dj_scratch', 0.52);
			djFinishTimer = setTimeout(stopDjScratch, 3200);
		},
		soundDjScratchStop: stopDjScratch,
		soundMonkeyExpand: () => playMonkeyExpand(),
		// Deliberately NOT forced through the turbo gate that silences ordinary
		// one-shots: these are tied to animations that play at their own length
		// whatever the spin speed, so a dropped one is a character opening his
		// mouth in silence.
		soundChestHoot: () => playChestHoot(),
		soundMascotVoice: ({ name }) =>
			playCnSfx(`voice_${name}` as CnSfxName, MASCOT_VOICE_GAIN[name]),
		soundReelTensionStart: () => playCnLoop('reel_tension', 0.8),
		// stopCnLoop, not stopCnSfx: playCnLoop moved this to Web Audio, and the
		// element-based stopper would leave the buffer source looping forever.
		soundReelTensionStop: () => {
			stopCnLoop('reel_tension');
			stopCnSfx('reel_tension');
		},
		soundStop: ({ name }) => {
			if (name === 'bgm_main' || name === 'bgm_freespin') stopBgm();
			else if (name === 'sfx_bigwin_coinloop') finishRollup();
			else if (name === 'sfx_anticipation') {
				stopCnLoop('reel_tension');
				stopCnSfx('reel_tension');
			} else if (name.startsWith('bgm_winlevel_')) {
				for (const cue of ['win_big', 'win_super', 'win_mega', 'win_epic', 'win_max'] as const) stopCnSfx(cue);
			} else {
				const mapped = SPRITE_TO_CN[name as keyof typeof SPRITE_TO_CN];
				if (mapped) { stopCnLoop(mapped.name); stopCnSfx(mapped.name); }
			}
		},
		// The only broadcaster is Anticipations; the local tension loop owns its fade.
		soundFade: () => {},

	});

	onMount(() => {
		// Fetch the one-shot sfx up front so the first play is in sync
		// (an Audio element created lazily would stall on its first fetch).
		(Object.keys(CN_SFX_FILES) as CnSfxName[]).forEach(getCnSfx);
		(Object.keys(CN_SFX_FILES) as CnSfxName[]).forEach((name) => void loadCueBuffer(name));
		void loadMusicBuffer('base');
		void loadMusicBuffer('freespin');
		for (const name of ['reel_stop_1', 'reel_stop_2', 'reel_stop_3', 'reel_stop_4', 'reel_stop_5', 'mult_update'] as const) {
			const primary = getCnSfx(name);
			cnSfxVoices[name] = [primary];
			for (let i = 1; i < MAX_VOICES; i++) {
				const voice = new Audio(primary.src);
				voice.preload = 'auto';
				cnSfxVoices[name]!.push(voice);
			}
		}

		if (stateBet.activeBetModeKey === HOLD_AND_SPIN_MODE_KEY) {
			playBgm('freespin');
		} else {
			playBgm('base');
		}

		return () => {
			rollupActive = false;
			clearTimeout(rollupEndTimer);
			clearInterval(bgmFadeTimer);
			clearInterval(bgmTransitionTimer);
			clearTimeout(blastReleaseTimer);
			clearInterval(djDuckTimer);
			clearTimeout(djFinishTimer);
			monkeyFadeTimers.forEach(clearTimeout);
			hootTimers.forEach(clearTimeout);
			if (hootWatch !== null) clearInterval(hootWatch);
			stopBgm();
			if (bgmAudio) {
				bgmAudio.pause();
				bgmAudio.src = '';
				bgmAudio = null;
			}
			transitionAudio?.pause();
			transitionAudio = null;
			for (const name of Object.keys(cnSfxAudio) as CnSfxName[]) {
				for (const audio of cnSfxVoices[name] ?? (cnSfxAudio[name] ? [cnSfxAudio[name]!] : [])) {
					audio.pause();
					audio.src = '';
				}
				delete cnSfxVoices[name];
				delete cnSfxAudio[name];
			}
			// Web Audio loops outlive the DOM unless they are stopped explicitly.
			// Cancel pending decodes too: a requested loop may not have a node yet.
			for (const name of Object.keys(CN_SFX_FILES) as CnSfxName[]) stopCnLoop(name);
			for (const name of Object.keys(activeCues) as CnSfxName[]) stopCnSfx(name);
			audioCtx?.close().catch(() => {});
			audioCtx = null;
			sfxBus = null;
			mixBus = null;
		};
	});
</script>
