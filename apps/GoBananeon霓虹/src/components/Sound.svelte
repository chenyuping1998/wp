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
		// one per reel of a live win sweep (WinWays); snap = it is on the grid
		| { type: 'soundWinStep'; index: number; total: number; snap: boolean }
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
	import { chordAt, clearMusicAnchor, kickSteps, MUSIC_GRID, setMusicAnchor, type MusicScene } from '../game/beatClock';

	const context = getContext();
	// Refresh decoded/CDN assets when the delivered sound design changes.
	const AUDIO_REVISION = 'neon-sampled-v3-rhythm2-20261106';

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
		| 'voice_effort'
		| 'seq_tick'
		| 'seq_kick'
		| 'seq_note'
		| 'seq_snare'
		| 'seq_pad';

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
		// The rhythm kit (design/build_neon_audio_v3.py rhythm_kit): single hits the
		// sequencer below places on the BGM's own 16th grid, so the count-up and
		// the tease play IN the track instead of as 120 BPM loops against it.
		seq_tick: 'neon/seq_tick.wav',
		seq_kick: 'neon/seq_kick.wav',
		seq_note: 'neon/seq_note.wav',
		seq_snare: 'neon/seq_snare.wav',
		seq_pad: 'neon/seq_pad.wav',
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
	let musicFilter: BiquadFilterNode | null = null;
	let musicPump: GainNode | null = null;
	const FILTER_OPEN_HZ = 20000;
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
			// THE MUSIC'S OWN STRIP: BGM → DJ low-pass → pump gain → mix. The
			// filter closes while the reels tease and while a Pulse Bomb charges,
			// and snaps open on the release, the way a club DJ builds into a drop.
			// The pump is a short sidechain-style dip under every win hit. Both
			// rest at fully open / unity, so with no event the track is untouched.
			musicFilter = audioCtx.createBiquadFilter();
			musicFilter.type = 'lowpass';
			musicFilter.frequency.value = FILTER_OPEN_HZ;
			musicFilter.Q.value = 0.9;
			musicPump = audioCtx.createGain();
			musicFilter.connect(musicPump).connect(mixBus);
			// the beat anchor is only real once the clock runs (first gesture)
			audioCtx.addEventListener('statechange', () => publishAnchor());
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
		sweepMusicFilter(FILTER_OPEN_HZ, 0.25);
	}

	// ─── DJ filter and pump (audio-clock automation, no timers) ───
	// Exponential moves on a frequency sound even; the ramp starts from the
	// value the filter has NOW so an interrupted build never jumps.
	function sweepMusicFilter(hz: number, seconds: number) {
		const ctx = audioCtx;
		if (!ctx || !musicFilter) return;
		const f = musicFilter.frequency;
		const now = ctx.currentTime;
		f.cancelScheduledValues(now);
		f.setValueAtTime(Math.max(40, f.value), now);
		f.exponentialRampToValueAtTime(Math.max(40, hz), now + Math.max(0.01, seconds));
	}
	/** a sidechain-style dip of the music under a hit: down fast, back slowly */
	// While a big-win count-up runs the music rests at ROLLUP_MUSIC, not unity,
	// so a pump inside it returns to that level instead of jumping back up.
	const ROLLUP_MUSIC = 0.7;
	let tierPumpAt = -Infinity;
	function pumpMusic(depth: number, holdSeconds: number, releaseSeconds: number, rest = rollupActive ? ROLLUP_MUSIC : 1) {
		const ctx = audioCtx;
		if (!ctx || !musicPump) return;
		const g = musicPump.gain;
		const now = ctx.currentTime;
		g.cancelScheduledValues(now);
		g.setValueAtTime(Math.max(0.0001, g.value), now);
		g.linearRampToValueAtTime(depth, now + 0.03);
		g.setValueAtTime(depth, now + 0.03 + holdSeconds);
		g.linearRampToValueAtTime(rest, now + 0.03 + holdSeconds + releaseSeconds);
	}
	/** a held dip (the big-win count-up sits in front of the track) */
	function holdMusicPump(level: number, seconds: number) {
		const ctx = audioCtx;
		if (!ctx || !musicPump) return;
		const g = musicPump.gain;
		const now = ctx.currentTime;
		g.cancelScheduledValues(now);
		g.setValueAtTime(Math.max(0.0001, g.value), now);
		g.linearRampToValueAtTime(level, now + seconds);
	}

	// ─── the beat anchor ───
	// When beat 0 of the running BGM buffer is heard, on the audio clock, and
	// the same instant on performance.now for everything that draws.
	let bgmStartCtx: number | null = null;
	let bgmScene: MusicScene | null = null;
	let anchorTimer: ReturnType<typeof setInterval> | undefined;
	const ctxToPerf = (ctx: AudioContext, t: number) => {
		const ts = typeof ctx.getOutputTimestamp === 'function' ? ctx.getOutputTimestamp() : null;
		if (ts && ts.performanceTime && ts.contextTime !== undefined) return ts.performanceTime + (t - ts.contextTime) * 1000;
		const latency = (ctx as AudioContext & { outputLatency?: number }).outputLatency || ctx.baseLatency || 0;
		return performance.now() + (t - ctx.currentTime + latency) * 1000;
	};
	function publishAnchor() {
		const ctx = audioCtx;
		if (!ctx || bgmStartCtx === null || !bgmScene) return;
		// While the context is still suspended (no gesture yet) its clock is
		// frozen and any mapping is fiction; the interval below fixes it as
		// soon as it runs.
		if (ctx.state !== 'running') return;
		setMusicAnchor(bgmScene, ctxToPerf(ctx, bgmStartCtx));
	}
	function startAnchorWatch() {
		clearInterval(anchorTimer);
		publishAnchor();
		// The audio clock and performance.now drift by a few ms an hour, and a
		// suspended context resumes on its own schedule: re-anchor regularly.
		anchorTimer = setInterval(publishAnchor, 3000);
	}

	// ─── THE RHYTHM SEQUENCER ───
	// The big-win count-up and the reel tease used to be 2-second loops at
	// 120 BPM laid over a 105 / 128 BPM track — they flammed against every kick.
	// Now they are patterns of single hits scheduled on the BGM's own 16th
	// grid (a look-ahead scheduler: a 25ms timer books every hit due in the
	// next 120ms at an exact audio-clock time), and the count-up's notes follow
	// the chord the pads are playing. No music on the Web Audio path (very old
	// browser) → the old loop files still play.
	type SeqPattern = 'rollup' | 'tension' | 'fanfare';
	type SeqRun = {
		firstStep: number;
		nextStep: number;
		gain: GainNode;
		sources: Set<AudioBufferSourceNode>;
		/** fanfare: 1 big .. 5 max */
		tier?: number;
		/** fanfare: the step its coda lands on */
		endStep?: number;
		/** set by a pattern that has finished; the pump releases it */
		done?: boolean;
	};
	type SeqSample = 'seq_tick' | 'seq_kick' | 'seq_note' | 'seq_snare' | 'seq_pad';
	const seqRuns: Partial<Record<SeqPattern, SeqRun>> = {};
	let seqTimer: ReturnType<typeof setInterval> | undefined;
	const SEQ_LOOKAHEAD = 0.12;
	const seqStepSeconds = () => 60 / MUSIC_GRID[bgmScene ?? 'base'].bpm / 4;
	const seqReady = () =>
		!!audioCtx && !!sfxBus && bgmStartCtx !== null && !!bgmNode &&
		!!loopBuffers.seq_tick && !!loopBuffers.seq_kick && !!loopBuffers.seq_note;

	function seqHit(run: SeqRun, name: SeqSample, at: number, gain: number, semitones = 0) {
		const ctx = audioCtx!;
		const src = ctx.createBufferSource();
		const g = ctx.createGain();
		src.buffer = loopBuffers[name]!;
		src.playbackRate.value = 2 ** (semitones / 12);
		g.gain.value = gain;
		src.connect(g).connect(run.gain);
		run.sources.add(src);
		src.onended = () => {
			run.sources.delete(src);
			src.disconnect();
			g.disconnect();
		};
		src.start(at);
	}

	// One 16th step of each pattern. `step` counts from the loop's beat 0, so
	// the bar position (and the chord) is the track's, not the pattern's.
	function seqStep(pattern: SeqPattern, run: SeqRun, step: number, at: number) {
		const inBar = ((step % 16) + 16) % 16;
		const bar = Math.floor(step / 16);
		const kicks = kickSteps(bgmScene ?? 'base');
		if (pattern === 'rollup') {
			// tally ticks on every 16th, accented on the 8ths
			seqHit(run, 'seq_tick', at, inBar % 2 ? 0.055 : 0.1);
			// the kick doubled softly, on the drummer's own pattern
			if (kicks.includes(inBar)) seqHit(run, 'seq_kick', at, 0.2);
			// an arpeggio of the chord under it, one note per 8th, up and back —
			// left out while the fanfare plays its melody over the same chord
			if (inBar % 2 === 0 && !seqRuns.fanfare) {
				const chord = chordAt(bar);
				const order = [0, 1, 2, 3, 2, 1, 2, 3];
				seqHit(run, 'seq_note', at, 0.11, chord[order[inBar / 2]] - 60);
			}
			return;
		}
		if (pattern === 'fanfare') {
			fanfareStep(run, step, inBar, bar, at);
			return;
		}
		// tension: a heartbeat that tightens — quarters, then 8ths, then 16ths —
		// and grows louder bar by bar, under a music track that is closing up.
		const age = Math.max(0, step - run.firstStep);
		const barsIn = Math.floor(age / 16);
		const every = barsIn === 0 ? 4 : barsIn === 1 ? 2 : 1;
		if (inBar % every === 0) {
			const accent = inBar % 4 === 0 ? 1 : 0.62;
			seqHit(run, 'seq_kick', at, Math.min(0.5, 0.26 + 0.07 * barsIn) * accent);
		}
		if (barsIn >= 1 && inBar % 2 === 1) seqHit(run, 'seq_tick', at, 0.05 + 0.02 * Math.min(2, barsIn));
	}

	// ─── THE BIG-WIN FANFARE, PLAYED IN TIME ───
	// The five tier fanfares were rendered phrases on their own clock (8ths at
	// .235s, snares every .23s) laid over a 105 BPM track and, a moment later,
	// over the count-up's grid: three tempos at once at the biggest moment in
	// the game. Now the same eight-note victory motif (the old files' C Eb G Bb
	// C, G, Eb, C an octave up) is PLAYED by the sequencer: on the track's 8ths,
	// transposed onto the chord the pads are holding, from the next 8th after
	// the slam. It develops with the tier the way the rendered ones did (octave
	// doubles, a backbeat that fills in, runs, a coda that lands on a beat) and
	// resolves at the length the old file had. The WAVs remain the fallback.
	const TIER_INDEX: Record<string, number> = { big: 1, superwin: 2, mega: 3, epic: 4, max: 5 };
	// the old files' lengths (TIMING_BASELINE.json): where each tier resolves
	const TIER_SECONDS = [0, 2.45, 3.05, 3.6, 4.2, 4.8];
	// motif as chord degrees: 0..3 = the chord's tones, 4+ = an octave up
	const MOTIF = [0, 1, 2, 3, 4, 2, 5, 4];
	const RUN = [4, 6, 5, 7, 6, 8];
	const toneOf = (chord: readonly number[], degree: number) => chord[degree % 4] + 12 * Math.floor(degree / 4);

	function fanfareStep(run: SeqRun, step: number, inBar: number, bar: number, at: number) {
		// startSeq pumps once before startFanfare has placed the phrase
		if (run.endStep === undefined || run.tier === undefined) return;
		const t = run.tier;
		const age = step - run.firstStep;
		const end = run.endStep;
		const chord = chordAt(bar);
		if (age < 0) return;
		if (step > end + 12) {
			run.done = true;
			return;
		}
		if (step === end) {
			// the coda: the chord, a low root and a kick, all on one beat
			for (const tone of chord) seqHit(run, 'seq_pad', at, 0.15 + 0.03 * t, tone - 60);
			seqHit(run, 'seq_note', at, 0.32, chord[0] - 12 - 60);
			seqHit(run, 'seq_kick', at, 0.42);
			seqHit(run, 'seq_snare', at, 0.18 + 0.03 * t);
			return;
		}
		if (step > end) return;
		// pads on the first step and on every new bar, so a chord change is followed
		if (age === 0 || inBar === 0) for (const tone of chord) seqHit(run, 'seq_pad', at, 0.1 + 0.025 * t, tone - 60);
		const eighth = age % 2 === 0;
		const motifAt = age / 2;
		if (eighth && motifAt < MOTIF.length) {
			// the motif, once, on the 8ths
			const tone = toneOf(chord, MOTIF[motifAt]);
			seqHit(run, 'seq_note', at, 0.5, tone - 60);
			if (t >= 2) seqHit(run, 'seq_note', at, 0.12 + 0.025 * t, tone + 12 - 60);
		} else if (t >= 2 && age >= 16) {
			// development: a climbing run over the chord (8ths; 16ths from mega)
			if (eighth || t >= 3) {
				const tone = toneOf(chord, RUN[Math.floor(age / (t >= 3 ? 1 : 2)) % RUN.length]);
				seqHit(run, 'seq_note', at, (eighth ? 0.2 : 0.12) + 0.02 * t, tone - 60);
			}
		}
		// drums: the kick on 1 (every beat from super), backbeat on 2 and 4,
		// off-beat 8ths from super, a 16th roll into each bar from epic
		const beat = inBar % 4 === 0;
		if (age === 0 || (beat && (t >= 2 || inBar === 0))) seqHit(run, 'seq_kick', at, age === 0 ? 0.45 : 0.3);
		if (inBar === 4 || inBar === 12) seqHit(run, 'seq_snare', at, 0.26 + 0.04 * t);
		else if (t >= 2 && inBar % 4 === 2) seqHit(run, 'seq_snare', at, 0.08 + 0.02 * t);
		if (t >= 4 && inBar >= 13) seqHit(run, 'seq_snare', at, 0.07 + 0.04 * (inBar - 12));
	}

	// A small early-reflection room on the fanfare (the room() the rendered
	// files had: filtered taps at 37 / 79 / 131 ms), built from delays only.
	let seqRoom: GainNode | null = null;
	function roomSend() {
		if (seqRoom || !audioCtx || !sfxBus) return seqRoom;
		const ctx = audioCtx;
		seqRoom = ctx.createGain();
		for (const [delay, cutoff, wet] of [[0.037, 3800, 0.14], [0.079, 2600, 0.09], [0.131, 2100, 0.056]] as const) {
			const d = ctx.createDelay(0.2);
			d.delayTime.value = delay;
			const f = ctx.createBiquadFilter();
			f.type = 'lowpass';
			f.frequency.value = cutoff;
			const g = ctx.createGain();
			g.gain.value = wet;
			seqRoom.connect(d).connect(f).connect(g).connect(sfxBus);
		}
		return seqRoom;
	}

	// THE WIN SWEEP'S NOTES. One per reel as WinWays lights it, climbing
	// through the chord under it (an octave up on the fifth reel), placed on the
	// nearest 32nd so a setTimeout's few ms of jitter never flams against the
	// hats. This replaces the 1.1s win gliss that used to open every win at its
	// own .15s step, which matched neither 105 nor 128 BPM.
	function playWinStep(index: number, total: number, snap: boolean) {
		const ctx = audioCtx;
		const buffer = loopBuffers.seq_note;
		if (!ctx || !buffer || !sfxBus || bgmStartCtx === null) return;
		const dt = seqStepSeconds() / 2;
		const now = ctx.currentTime;
		const at = snap ? Math.max(now, bgmStartCtx + Math.round((now - bgmStartCtx) / dt) * dt) : now;
		const chord = chordAt(Math.floor((at - bgmStartCtx) / (dt * 32)));
		const tone = toneOf(chord, index);
		const last = index === total - 1;
		const voices: [number, number][] = [[tone, 0.36 + 0.05 * index]];
		if (last) voices.push([tone + 12, 0.16], [chord[0] - 12, 0.22]);
		for (const [pitch, gain] of voices) {
			const src = ctx.createBufferSource();
			const g = ctx.createGain();
			src.buffer = buffer;
			src.playbackRate.value = 2 ** ((pitch - 60) / 12);
			g.gain.value = gain;
			src.connect(g).connect(sfxBus);
			const room = roomSend();
			if (room) g.connect(room);
			src.onended = () => { src.disconnect(); g.disconnect(); };
			src.start(at);
		}
	}

	/** true when the fanfare plays on the grid; false = caller plays the WAV */
	function startFanfare(tierName: string) {
		const tier = TIER_INDEX[tierName];
		if (!tier || !loopBuffers.seq_snare || !loopBuffers.seq_pad) return false;
		const dt = seqStepSeconds();
		const placeRun = (run: SeqRun) => {
			// from the next 8th; the coda on a beat, where the old file resolved
			const ctx = audioCtx!;
			const next = Math.ceil((ctx.currentTime + 0.01 - bgmStartCtx!) / dt);
			run.firstStep = Math.ceil(next / 2) * 2;
			run.nextStep = Math.min(run.nextStep, run.firstStep);
			const codaSteps = Math.max(8, Math.ceil(Math.max(0.35, TIER_SECONDS[tier] - 0.85) / dt / 4) * 4);
			run.endStep = run.firstStep + codaSteps;
			run.tier = tier;
			run.done = false;
		};
		const running = seqRuns.fanfare;
		if (running) {
			// a higher tier takes over the phrase from the next 8th
			placeRun(running);
			return true;
		}
		if (!startSeq('fanfare', 0.9)) return false;
		const run = seqRuns.fanfare!;
		const room = roomSend();
		if (room) run.gain.connect(room);
		placeRun(run);
		return true;
	}

	function seqPump() {
		const ctx = audioCtx;
		if (!ctx || bgmStartCtx === null) return;
		const dt = seqStepSeconds();
		const horizon = ctx.currentTime + SEQ_LOOKAHEAD;
		for (const pattern of Object.keys(seqRuns) as SeqPattern[]) {
			const run = seqRuns[pattern]!;
			if (run.done) {
				stopSeq(pattern, 0.8);
				continue;
			}
			while (!run.done && bgmStartCtx + run.nextStep * dt < horizon) {
				const at = bgmStartCtx + run.nextStep * dt;
				if (at >= ctx.currentTime - 0.005) seqStep(pattern, run, run.nextStep, Math.max(at, ctx.currentTime));
				run.nextStep++;
			}
		}
		if (!Object.keys(seqRuns).length) {
			clearInterval(seqTimer);
			seqTimer = undefined;
		}
	}

	/** true when the pattern runs on the grid; false = caller uses the fallback loop */
	function startSeq(pattern: SeqPattern, level: number) {
		if (seqRuns[pattern]) return true;
		if (!seqReady()) return false;
		const ctx = audioCtx!;
		const dt = seqStepSeconds();
		// The first hit is the next 16th that is still ahead of the scheduler.
		const first = Math.ceil((ctx.currentTime + 0.01 - bgmStartCtx!) / dt);
		const gain = ctx.createGain();
		gain.gain.value = level;
		gain.connect(sfxBus!);
		seqRuns[pattern] = { firstStep: first, nextStep: first, gain, sources: new Set() };
		seqPump();
		seqTimer ??= setInterval(seqPump, 25);
		return true;
	}

	function stopSeq(pattern: SeqPattern, fadeSeconds = 0.12) {
		const run = seqRuns[pattern];
		if (!run) return;
		delete seqRuns[pattern];
		const ctx = audioCtx;
		if (!ctx) return;
		const now = ctx.currentTime;
		run.gain.gain.cancelScheduledValues(now);
		run.gain.gain.setValueAtTime(run.gain.gain.value, now);
		run.gain.gain.linearRampToValueAtTime(0, now + fadeSeconds);
		// hits booked ahead of the fade are cancelled, ones already sounding ring out under it
		for (const src of run.sources) {
			try { src.stop(now + fadeSeconds); } catch { /* already stopped */ }
		}
		setTimeout(() => run.gain.disconnect(), (fadeSeconds + 0.5) * 1000);
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
			src.connect(gain).connect(musicFilter!);
			src.onended = () => { src.disconnect(); gain.disconnect(); };
			bgmNode = { src, gain };
			bgmTransitionProgress = 0;
			bgmAudio?.pause();
			bgmAudio = null;
			// Started a hair ahead on the audio clock so its first sample has a
			// known time: that instant is beat 0 for the whole grid.
			const when = ctx.currentTime + 0.03;
			src.start(when);
			// Patterns booked on the old track's grid would now be off it.
			stopSeq('rollup', 0.05);
			stopSeq('tension', 0.05);
			stopSeq('fanfare', 0.05);
			bgmStartCtx = when;
			bgmScene = type;
			startAnchorWatch();
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
		// No audio clock to read here: anchor the grid approximately so the
		// lights still move with the track, if not to the sample.
		clearInterval(anchorTimer);
		bgmStartCtx = null;
		setMusicAnchor(type, performance.now());
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
		clearInterval(anchorTimer);
		stopSeq('rollup', 0.05);
		stopSeq('tension', 0.05);
		stopSeq('fanfare', 0.05);
		bgmStartCtx = null;
		bgmScene = null;
		clearMusicAnchor();
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

	const WIN_HITS = new Set<SoundEffectName>([
		'sfx_winlevel_small', 'sfx_winlevel_nice', 'sfx_winlevel_standard', 'sfx_winlevel_substantial',
		'sfx_scatter_win', 'sfx_scatter_win_v2', 'sfx_multiplier_win',
	]);

	// THE TEASE AS A BUILD. The heartbeat tightens on the grid (sequencer) while
	// the track closes to a muffled low-pass over two bars; when the reel lands
	// the filter snaps open — the drop is the stop.
	let tensionActive = false;
	function startTension() {
		if (tensionActive) return;
		tensionActive = true;
		// the air bed carries the swell; the beat is the sequencer's
		// (quieter when the grid carries the beat: the bed has a breath every 2s)
		const onGrid = startSeq('tension', 1);
		void playCnLoop('reel_tension', onGrid ? 0.4 : 0.62);
		const bar = 4 * 60 / MUSIC_GRID[bgmScene ?? 'base'].bpm;
		sweepMusicFilter(1100, bar * 2);
	}
	function stopTension() {
		tensionActive = false;
		stopSeq('tension', 0.09);
		stopCnLoop('reel_tension');
		stopCnSfx('reel_tension');
		sweepMusicFilter(FILTER_OPEN_HZ, 0.16);
	}

	let rollupActive = false;
	let rollupEndTimer: ReturnType<typeof setTimeout> | undefined;
	function startRollup() {
		if (rollupActive) return;
		clearTimeout(rollupEndTimer);
		stopCnSfx('win_rollup_end');
		rollupActive = true;
		playCnSfx('coin_shimmer', 0.8);
		// The count-up plays IN the track: on its grid, in its chord, with the
		// music stepped back a little so the tally is the front of the mix.
		if (!startSeq('rollup', 0.9)) void playCnLoop('win_rollup_loop', 0.7);
		// A tier slam just scheduled its own dip that settles at this level.
		if (performance.now() - tierPumpAt > 1500) holdMusicPump(ROLLUP_MUSIC, 0.18);
	}
	function finishRollup() {
		if (!rollupActive) return; // count completion + dismissal can both stop it
		rollupActive = false;
		stopSeq('rollup', 0.12);
		stopCnLoop('win_rollup_loop', 0.12);
		stopCnSfx('coin_shimmer');
		holdMusicPump(1, 0.7);
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
			if (name === 'sfx_anticipation') { startTension(); return; }
			const mapped = SPRITE_TO_CN[name];
			// With the grid running the win sweep plays its own notes in time
			// (soundWinStep); the off-tempo opening gliss would only blur them.
			const swept = name === 'sfx_winlevel_small' && seqReady();
			if (!swept) playCnSfx(mapped.name, mapped.volume ?? 1, mapped.rate ?? 1);
			// Every win hit gets a short sidechain dip, so it punches through the
			// groove instead of sitting on top of it.
			if (WIN_HITS.has(name)) pumpMusic(0.68, 0.08, 0.36);
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
			// each tier slams in on a deeper dip than the count-up's held level
			// (the count-up bed starts right after this, so it settles at its level)
			tierPumpAt = performance.now();
			pumpMusic(0.42, 0.22, 0.6, ROLLUP_MUSIC);
			// played in time by the sequencer when the music is on the grid
			if (seqReady() && startFanfare(tier)) return;
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
			// the charge sucks the track's top end away...
			sweepMusicFilter(520, 0.34);
			playCnSfx('fuse_sizzle', 0.75);
		},
		soundBlastDetonate: ({ full, width = full ? 5 : 1 }) => {
			stopCnSfx('fuse_sizzle');
			// ...and the bang gives it back at once: the drop
			sweepMusicFilter(FILTER_OPEN_HZ, 0.06);
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
		soundReelTensionStart: () => startTension(),
		soundWinStep: ({ index, total, snap }) => {
			if (seqReady()) playWinStep(index, total, snap);
		},
		// stopTension stops the Web Audio loop (stopCnLoop) as well as the element
		// fallback, the grid pattern, and opens the filter.
		soundReelTensionStop: () => stopTension(),
		soundStop: ({ name }) => {
			if (name === 'bgm_main' || name === 'bgm_freespin') stopBgm();
			else if (name === 'sfx_bigwin_coinloop') finishRollup();
			else if (name === 'sfx_anticipation') {
				stopTension();
			} else if (name.startsWith('bgm_winlevel_')) {
				stopSeq('fanfare', 0.25);
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
			clearInterval(anchorTimer);
			clearInterval(seqTimer);
			seqTimer = undefined;
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
			musicFilter = null;
			musicPump = null;
			seqRoom = null;
			for (const pattern of Object.keys(seqRuns) as SeqPattern[]) delete seqRuns[pattern];
		};
	});
</script>
