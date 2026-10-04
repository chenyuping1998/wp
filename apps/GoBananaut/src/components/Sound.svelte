<script lang="ts" module>
	import { sound, type MusicName, type SoundEffectName, type SoundName } from '../game/sound';
	import { HOLD_AND_SPIN_MODE_KEY } from '../game/constants';

	// What the mascot can say. One clip per animation — see
	// design/generate_voice.mjs, which synthesizes them.
	export type MascotVoice = 'roar' | 'effort';

	export type EmitterEventSound =
		| { type: 'soundMusic'; name: MusicName }
		// `rate` and `volume` are per-call overrides on top of whatever SPRITE_TO_CN
		// already says for the cue. They exist for cues played in a RUN — the board
		// growing plays one lock per row, up to ten of them — where the same sample
		// at the same pitch ten times is a hammer rather than a climb. The
		// alternative was five near-identical sprite names standing in for five
		// pitches, which is how sfx_reel_stop_1..5 ended up meaning nothing.
		| { type: 'soundOnce'; name: SoundEffectName; forcePlay?: boolean; rate?: number; volume?: number }
		| { type: 'soundLoop'; name: SoundEffectName }
		| { type: 'soundStop'; name: SoundName }
		| { type: 'soundFade'; name: SoundName; from: number; to: number; duration: number }
		| { type: 'soundFreeGameBell' }
		| { type: 'soundBigWinBlast' }
		| { type: 'soundDynamiteBlast' }
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
	import { stateBet, stateSoundDerived } from 'state-shared';
	import { base } from '$app/paths';

	import { getContext } from '../game/context';

	const context = getContext();

	// ─── space sound set (synthesized — see design/generate_audio_space.mjs) ───
	//
	// The nineteen synthesised cues moved from jungle/ to space/; the three VOICE
	// files did not, because they are recordings of the mascot rather than
	// synthesis and the mascot has not changed. Keeping them in jungle/ is
	// deliberate and not an oversight — moving a file to a folder whose generator
	// does not produce it is how a regeneration quietly deletes it.
	// Standalone HTML5 Audio; the howler sprite (sounds.json) stays as a
	// fallback for anything not mapped here (e.g. win-level bgm stingers).
	type CnSfxName =
		| 'gong_feature'
		| 'bigwin_blast'
		| 'reel_tension'
		| 'reel_stop'
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
		| 'grow_lock'
		| 'grenade_blast'
		| 'monkey_expand'
		| 'voice_roar'
		| 'voice_effort';

	const CN_SFX_FILES: Record<CnSfxName, string> = {
		gong_feature: 'space/gong_feature.wav',
		bigwin_blast: 'space/bigwin_blast.wav',
		reel_tension: 'space/reel_tension.wav',
		reel_stop: 'space/reel_stop.wav',
		btn: 'space/btn.wav',
		spin: 'space/spin.wav',
		scatter_1: 'space/scatter_1.wav',
		scatter_2: 'space/scatter_2.wav',
		scatter_3: 'space/scatter_3.wav',
		scatter_4: 'space/scatter_4.wav',
		scatter_5: 'space/scatter_5.wav',
		pluck_low: 'space/pluck_low.wav',
		win_gliss: 'space/win_gliss.wav',
		win_gliss_big: 'space/win_gliss_big.wav',
		fs_intro: 'space/fs_intro.wav',
		coin_shimmer: 'space/coin_shimmer.wav',
		wild_expand: 'space/wild_expand.wav',
		mult_update: 'space/mult_update.wav',
		grow_lock: 'space/grow_lock.wav',
		grenade_blast: 'space/grenade_blast.wav',
		// player-supplied monkey hoot, mp3 rather than the synthesized wav set
		monkey_expand: 'jungle/monkey_expand.mp3',
		voice_roar: 'jungle/voice_roar.wav',
		voice_effort: 'jungle/voice_effort.wav',
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

	// Sprite sound names re-routed to the Chinese set.
	//
	// `rate` sets playbackRate, which on a short percussive sample reads as pitch.
	// The five reel stops share one file and used to be indistinguishable — worse,
	// only _1 was ever played, so every reel landed on the identical click. They
	// now rise reel by reel, which is what gives a spin its sense of building
	// toward the last reel.
	const SPRITE_TO_CN: Partial<
		Record<SoundEffectName, { name: CnSfxName; volume?: number; rate?: number }>
	> = {
		sfx_btn_general: { name: 'btn', volume: 0.7 },
		sfx_btn_spin: { name: 'spin', volume: 0.9 },
		sfx_reel_stop_1: { name: 'reel_stop', rate: 0.92 },
		sfx_reel_stop_2: { name: 'reel_stop', rate: 1.0 },
		sfx_reel_stop_3: { name: 'reel_stop', rate: 1.09 },
		sfx_reel_stop_4: { name: 'reel_stop', rate: 1.19 },
		sfx_reel_stop_5: { name: 'reel_stop', rate: 1.3 },
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
		jng_intro_fs: { name: 'fs_intro' },
		sfx_wild_explode: { name: 'wild_expand' },
		// THE EXPANSION, IN TWO PARTS. `sfx_multiplier_update` is the release at the
		// top of each step and is deliberately the quietest thing in the mechanic;
		// `sfx_multiplier_up` is the arrival, and is the emphasis. ReelGrow plays
		// the second one at a rising rate, one step per row.
		sfx_multiplier_update: { name: 'mult_update' },
		sfx_multiplier_up: { name: 'grow_lock' },
		sfx_anticipation_start: { name: 'mult_update', volume: 0.5 },
		sfx_symbols_landing: { name: 'reel_stop', volume: 0.6 },
		sfx_royals_landing: { name: 'reel_stop', volume: 0.6 },
	};

	// A CUE HAS TO BE ABLE TO OVERLAP ITSELF.
	//
	// This was one HTMLAudioElement per cue, and every play did `currentTime = 0`.
	// That is not "restart the sound", it is "cut the one already playing" — a cue
	// fired twice inside its own length can never be heard twice, only once with a
	// bite taken out of it.
	//
	// It shows worst on the thing the expansion was built around. `grow_lock` is
	// 700ms and a ten-row run fires it every ~223ms, so nine of the ten were being
	// truncated at a third of their length. The bell that carries the pitch starts
	// 80ms in and rings for 450 — cut at 223 there is barely any note left, which
	// means the rising playbackRate across the run, the entire reason that climb
	// exists, was inaudible. It sounded like ten identical stubs.
	//
	// Same shape on the reel stops: five reels land ~145ms apart and share one
	// element with the symbol and royal landings, so they were clipping each other
	// all the way down the board.
	//
	// Five voices: ONE RESERVED, four in the round-robin. Four one-shot voices
	// because grow_lock at its tightest needs 700/223 ≈ 3.1 of them, and the pool
	// is per cue and built lazily, so the cost is a handful of elements for the
	// few cues that actually stack.
	//
	// Voice 0 is reserved for whatever owns the cue over time — the no-Web-Audio
	// loop fallback, the monkey hoot's fade. Those set `loop = true` or run a
	// timed fade on an element they expect to still be theirs; if the round-robin
	// could land on it, a later one-shot would set loop = false underneath a
	// running loop and silently end it.
	const VOICES = 5;
	const ONESHOT_VOICES = VOICES - 1;
	const cnSfxAudio: Partial<Record<CnSfxName, HTMLAudioElement[]>> = {};
	const cnSfxTurn: Partial<Record<CnSfxName, number>> = {};

	function cnSfxVoices(name: CnSfxName) {
		let pool = cnSfxAudio[name];
		if (!pool) {
			pool = Array.from({ length: VOICES }, () => {
				const audio = new Audio(`${base}/assets/audio/${CN_SFX_FILES[name]}`);
				audio.preload = 'auto';
				return audio;
			});
			cnSfxAudio[name] = pool;
		}
		return pool;
	}

	// The cue's FIRST voice. Anything that owns a sound over time — the loop
	// fallback, the monkey hoot's fade, stopping — works on this one, so those
	// paths keep the single-element behaviour they were written against.
	function getCnSfx(name: CnSfxName) {
		return cnSfxVoices(name)[0]!;
	}

	function playCnSfx(name: CnSfxName, volumeScale = 1, rate = 1) {
		const pool = cnSfxVoices(name);
		const turn = (cnSfxTurn[name] ?? 0) % ONESHOT_VOICES;
		cnSfxTurn[name] = turn + 1;
		const audio = pool[turn + 1]!;
		audio.loop = false;
		audio.volume = Math.min(1, stateSoundDerived.volumeSoundEffect() * volumeScale);
		// Always assign, never skip when rate is 1: a voice is reused, so a rate
		// left over from the previous caller would carry into every later play on
		// that voice. reel_stop is shared with symbol/royal landings, which would
		// otherwise inherit the fifth reel's pitch.
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
	const HOOT_ONSET_S = 0.04;
	const HOOT_CUT_S = 1.62;
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
					audio.volume = Math.min(1, stateSoundDerived.volumeSoundEffect() * 0.9);
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
		const vol = Math.min(1, stateSoundDerived.volumeSoundEffect());
		audio.volume = vol;
		audio.playbackRate = 1;
		audio.currentTime = 0;
		audio.play().catch(() => {});
		// hold at full to ~2s, fade over 600ms, stop by ~2.6s
		const HOLD_MS = 2000;
		const FADE_MS = 600;
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

	// ─── looping sfx: Web Audio, not <audio loop> ───
	//
	// An HTMLAudioElement with loop = true is NOT gapless. The browser tears down
	// and restarts playback at the wrap, and the silence either side of that is
	// plainly audible — on coin_shimmer, a 2.4s clip with a recognisable attack,
	// it lands as the clip visibly stopping and starting again roughly every two
	// seconds. On the hold-and-spin result plaque, which stays up until the player
	// presses, that repeats for as long as they look at it.
	//
	// Guarding against re-triggering (the previous attempt) removed one cause of
	// choppiness — winLevelSoundsPlay fires up to three times in a hold-and-spin round
	// and each call was resetting currentTime — but not this one, because this one
	// happens without anyone asking. An AudioBufferSourceNode with loop = true
	// loops inside the audio thread and has no seam at all.
	//
	// Gain is ramped rather than switched, so the loop also fades in and out
	// instead of appearing and vanishing.
	const LOOP_FADE_IN = 0.12;
	const LOOP_FADE_OUT = 0.25;

	let audioCtx: AudioContext | null = null;
	const loopBuffers: Partial<Record<CnSfxName, AudioBuffer>> = {};
	const loopNodes: Partial<Record<CnSfxName, { src: AudioBufferSourceNode; gain: GainNode }>> = {};

	const getAudioCtx = () => {
		if (typeof window === 'undefined') return null;
		if (!audioCtx) {
			const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
			if (!Ctor) return null;
			audioCtx = new Ctor();
		}
		// The context starts suspended until a gesture; the game always has one by
		// the time anything loops (the loading screen is dismissed by a press).
		if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
		return audioCtx;
	};

	async function playCnLoop(name: CnSfxName, volumeScale = 1) {
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

		let buffer = loopBuffers[name];
		if (!buffer) {
			try {
				const res = await fetch(`${base}/assets/audio/${CN_SFX_FILES[name]}`);
				buffer = await ctx.decodeAudioData(await res.arrayBuffer());
				loopBuffers[name] = buffer;
			} catch {
				return;
			}
		}
		// Awaiting the decode above means a stop() could have arrived in the
		// meantime, and a second play() could have won the race.
		if (loopNodes[name]) return;

		const target = Math.min(1, stateSoundDerived.volumeSoundEffect() * volumeScale);
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(0.0001, ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, target), ctx.currentTime + LOOP_FADE_IN);
		const src = ctx.createBufferSource();
		src.buffer = buffer;
		src.loop = true;
		src.connect(gain).connect(ctx.destination);
		src.start();
		loopNodes[name] = { src, gain };
	}

	function stopCnLoop(name: CnSfxName) {
		const node = loopNodes[name];
		if (!node) return;
		delete loopNodes[name];
		const ctx = audioCtx;
		if (!ctx) {
			node.src.stop();
			return;
		}
		const end = ctx.currentTime + LOOP_FADE_OUT;
		node.gain.gain.cancelScheduledValues(ctx.currentTime);
		node.gain.gain.setValueAtTime(Math.max(0.0001, node.gain.gain.value), ctx.currentTime);
		node.gain.gain.exponentialRampToValueAtTime(0.0001, end);
		node.src.stop(end);
	}

	// ─── THE MASCOT'S VOICE: ON THE BEAT, NOT NEAR IT ───
	//
	// The roar is one clip carrying all six chest-beat grunts, cut to the
	// animation's strikes (0.48s, then every 0.30s — generate_monkey_spine.mjs),
	// and the impact stars are drawn on the same clock. It was played on an
	// HTMLAudioElement, and an element starts when IT is ready: seek to 0, wait for
	// data, then play. The chest beat is the rarest reaction in the game (4+
	// Scatters or a bought round), so its element was almost never buffered — a
	// phone ignores `preload` outright — and the grunts came in a few hundred ms
	// behind the fists. Reported as "搥胸的音效沒有對到撞擊".
	//
	// So the voices are decoded into Web Audio buffers when the game loads and
	// start the moment they are asked for. And if one is asked for before its
	// decode has finished, it starts at the point the animation has reached — the
	// offset since the request — not at its top: a grunt that has to be late is
	// dropped, the rest land on their strikes.
	const voiceBuffers: Partial<Record<CnSfxName, AudioBuffer>> = {};
	const voiceLoads: Partial<Record<CnSfxName, Promise<AudioBuffer | null>>> = {};
	const loadVoice = (name: CnSfxName) =>
		(voiceLoads[name] ??= (async () => {
			const ctx = getAudioCtx();
			if (!ctx) return null;
			try {
				const res = await fetch(`${base}/assets/audio/${CN_SFX_FILES[name]}`);
				const buf = await ctx.decodeAudioData(await res.arrayBuffer());
				voiceBuffers[name] = buf;
				return buf;
			} catch {
				delete voiceLoads[name];
				return null;
			}
		})());

	function playVoice(name: CnSfxName, volumeScale = 1) {
		const ctx = getAudioCtx();
		if (!ctx) return playCnSfx(name, volumeScale); // no Web Audio: the element, late or not
		const asked = performance.now();
		const start = (buf: AudioBuffer) => {
			const offset = (performance.now() - asked) / 1000;
			if (offset >= buf.duration) return;
			const gain = ctx.createGain();
			gain.gain.value = Math.min(1, stateSoundDerived.volumeSoundEffect() * volumeScale);
			const src = ctx.createBufferSource();
			src.buffer = buf;
			src.connect(gain).connect(ctx.destination);
			src.start(0, offset);
		};
		const buf = voiceBuffers[name];
		if (buf) start(buf);
		else loadVoice(name).then((b) => (b ? start(b) : playCnSfx(name, volumeScale)));
	}

	// Every voice, not just the first. A cue that can be playing on four elements
	// has to be stopped on four, or "stop" leaves whatever the pool happened to be
	// playing still running.
	function stopCnSfx(name: CnSfxName) {
		for (const audio of cnSfxAudio[name] ?? []) {
			audio.pause();
			audio.currentTime = 0;
		}
	}

	// ─── BGM ───
	//
	// WEB AUDIO, for the reason set out above the looping SFX: an
	// HTMLAudioElement with `loop = true` is not gapless, and the BGM is the one
	// thing in this game that loops for an entire session. The note about
	// coin_shimmer was written, the fix was built, and then the BGM — a fifty
	// second bed that wraps roughly seventy times an hour — was left on the
	// element path anyway.
	//
	// The element is kept as a fallback for a browser with no AudioContext. A
	// slightly seamed loop beats silence.
	//
	// THE MUSIC IS THE SERIES' JUNGLE BED, not this game's own space set.
	//
	// A space BGM was written for it — 76 BPM, C minor pentatonic, sparse — and
	// then a second pass added reverb and stereo width on the argument that space
	// is carried by room rather than by notes. Both were rejected in play, and the
	// second rejection was the whole track rather than the treatment. The four Go
	// Bananas games ship byte-identical jungle loops (074e57c1c5fc / 71cd46989c03)
	// and this one already had them on disk, so it is pointed back at those.
	//
	// The nineteen synthesised SFX stay on the space set. Only the music moved
	// back — the cues are this game's own and were not what was being objected to.
	//
	// design/generate_audio_space.mjs still writes space/bgm_*.wav. Left alone on
	// purpose: deleting the generator's output is how you lose the ability to go
	// back. They are ~4.2MB of audio the game no longer plays and they still ship,
	// which is worth removing if the decision is settled.
	let bgmAudio: HTMLAudioElement | null = null;
	let currentBgm: 'base' | 'freespin' | null = null;
	const BGM_FILES = {
		base: 'jungle/bgm_main.wav',
		freespin: 'jungle/bgm_freespin.wav',
	} as const;
	type BgmType = keyof typeof BGM_FILES;

	// Long enough to be a transition rather than a cut. The base loop hands over
	// to the free-game loop while the intro card is on screen, and a hard swap
	// there lands as a glitch in the middle of the game's best moment.
	const BGM_FADE = 0.9;

	const bgmBuffers: Partial<Record<BgmType, AudioBuffer>> = {};
	let bgmNode: { src: AudioBufferSourceNode; gain: GainNode } | null = null;
	// Bumped by every play and stop, so a decode that finishes after the player
	// has already moved on cannot start a loop nobody asked for.
	let bgmToken = 0;

	const fadeOutNode = (node: { src: AudioBufferSourceNode; gain: GainNode }, ctx: AudioContext) => {
		const t = ctx.currentTime;
		node.gain.gain.cancelScheduledValues(t);
		node.gain.gain.setValueAtTime(Math.max(0.0001, node.gain.gain.value), t);
		node.gain.gain.exponentialRampToValueAtTime(0.0001, t + BGM_FADE);
		try {
			node.src.stop(t + BGM_FADE + 0.05);
		} catch {
			// already stopped
		}
	};

	async function playBgm(type: BgmType) {
		if (currentBgm === type && (bgmNode || (bgmAudio && !bgmAudio.paused))) return;
		const mine = ++bgmToken;
		currentBgm = type;

		const ctx = getAudioCtx();
		if (!ctx) {
			if (bgmAudio) {
				bgmAudio.pause();
				bgmAudio = null;
			}
			bgmAudio = new Audio(`${base}/assets/audio/${BGM_FILES[type]}`);
			bgmAudio.loop = true;
			bgmAudio.volume = stateSoundDerived.volumeMusic();
			bgmAudio.play().catch(() => {});
			return;
		}

		let buf = bgmBuffers[type];
		if (!buf) {
			try {
				const res = await fetch(`${base}/assets/audio/${BGM_FILES[type]}`);
				buf = await ctx.decodeAudioData(await res.arrayBuffer());
				bgmBuffers[type] = buf;
			} catch {
				return;
			}
		}
		// The decode above is awaited, so the player may have switched loops or
		// stopped entirely while it ran.
		if (mine !== bgmToken) return;

		if (bgmNode) fadeOutNode(bgmNode, ctx);
		const target = Math.max(0.0001, stateSoundDerived.volumeMusic());
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(0.0001, ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(target, ctx.currentTime + BGM_FADE);
		const src = ctx.createBufferSource();
		src.buffer = buf;
		src.loop = true;
		src.connect(gain).connect(ctx.destination);
		src.start();
		bgmNode = { src, gain };
	}

	function stopBgm() {
		bgmToken += 1;
		currentBgm = null;
		if (bgmNode && audioCtx) fadeOutNode(bgmNode, audioCtx);
		bgmNode = null;
		if (bgmAudio) {
			bgmAudio.pause();
			bgmAudio.currentTime = 0;
		}
	}

	// Keep volume in sync with settings, on whichever path is live.
	//
	// setTargetAtTime rather than an assignment: a bare `gain.value =` during the
	// crossfade cancels nothing but fights the ramp, and the two together step the
	// level. This slides to the new value and leaves an in-flight fade alone.
	$effect(() => {
		const vol = stateSoundDerived.volumeMusic();
		if (bgmAudio) bgmAudio.volume = vol;
		if (bgmNode && audioCtx) {
			bgmNode.gain.gain.setTargetAtTime(Math.max(0.0001, vol), audioCtx.currentTime, 0.05);
		}
	});

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
		soundPressGeneral: () => playCnSfx('btn', 0.7),
		soundPressBet: () => playCnSfx('spin', 0.9),
		// scatterCounter
		soundScatterCounterIncrease: () => (context.stateGame.scatterCounter = context.stateGame.scatterCounter + 1), // prettier-ignore
		soundScatterCounterClear: () => (context.stateGame.scatterCounter = 0),
		// game
		soundMusic: ({ name }) => {
			if (name === 'bgm_main') {
				playBgm('base');
			} else if (name === 'bgm_freespin') {
				playBgm('freespin');
			} else {
				// Other music (win levels etc) — stop the bgm, play via sprite.
				// stopBgm(), not a bare pause: on the Web Audio path the element is
				// not what is playing, and pausing it would leave the loop running
				// underneath the win stinger.
				stopBgm();
				sound.players.music.play({ name });
			}
		},
		soundLoop: ({ name }) => {
			if (name === 'sfx_bigwin_coinloop') {
				// Deliberately a ONE-SHOT despite the event name, the same way
				// sfx_anticipation is deliberately a no-op here: this is where a logical
				// sound name is turned into what actually happens, and the caller should
				// not have to know which clips can bear repeating.
				//
				// coin_shimmer is a 2.4s chime with a clear attack. Looping it under a
				// win count-up — on a plaque that stays up until the player presses —
				// rang that chime over and over, which is what came back as "a bell
				// repeating while the score counts". Making the loop gapless (playCnLoop,
				// now Web Audio) fixed the seam but not the repetition, and repetition
				// was the complaint. One pass accents the start of the count-up and then
				// leaves it alone. A continuous bed needs a longer, flatter clip, not
				// this one on repeat.
				playCnSfx('coin_shimmer', 0.8);
			} else if (name === 'sfx_anticipation') {
				// covered by the reel_tension tremolo loop (soundReelTensionStart)
			} else {
				sound.players.loop.play({ name });
			}
		},
		soundOnce: ({ name, forcePlay, rate, volume }) => {
			const mapped = SPRITE_TO_CN[name];
			if (mapped) {
				// The per-call values MULTIPLY the cue's own, rather than replacing
				// them: a caller asking for a pitch should not silently discard a trim
				// that was set because the sample is hot.
				playCnSfx(mapped.name, (mapped.volume ?? 1) * (volume ?? 1), (mapped.rate ?? 1) * (rate ?? 1));
			} else {
				sound.players.once.play({ name, forcePlay });
			}
		},
		soundFreeGameBell: () => playCnSfx('gong_feature'),
		soundBigWinBlast: () => playCnSfx('bigwin_blast'),
		// The EVENT is named for the prop, the CUE is named for the file on disk.
		// space/grenade_blast.wav is not a grenade any more — it is the gravity
		// charge rupturing — but the file name is carried through every generation
		// and renaming a wav would break the audio manifest for no gain.
		soundDynamiteBlast: () => playCnSfx('grenade_blast'),
		soundMonkeyExpand: () => playMonkeyExpand(),
		// Deliberately NOT forced through the turbo gate that silences ordinary
		// one-shots: these are tied to animations that play at their own length
		// whatever the spin speed, so a dropped one is a character opening his
		// mouth in silence.
		soundChestHoot: () => playChestHoot(),
		soundMascotVoice: ({ name }) => playVoice(`voice_${name}` as CnSfxName, MASCOT_VOICE_GAIN[name]),
		soundReelTensionStart: () => playCnLoop('reel_tension', 0.8),
		// stopCnLoop, not stopCnSfx: playCnLoop moved this to Web Audio, and the
		// element-based stopper would leave the buffer source looping forever.
		soundReelTensionStop: () => {
			stopCnLoop('reel_tension');
			stopCnSfx('reel_tension');
		},
		soundStop: ({ name }) => {
			if (name === 'bgm_main' || name === 'bgm_freespin') {
				stopBgm();
			} else if (name === 'sfx_bigwin_coinloop') {
				// both, because the fallback path above may have used the element
				stopCnLoop('coin_shimmer');
				stopCnSfx('coin_shimmer');
			} else if (name === 'sfx_anticipation') {
				stopCnLoop('reel_tension');
				stopCnSfx('reel_tension');
				sound.stop({ name });
			} else {
				sound.stop({ name });
			}
		},
		soundFade: async ({ name, duration, from, to }) => await sound.fade({ name, duration, from, to }), // prettier-ignore
	});

	onMount(() => {
		// Fetch the one-shot sfx up front so the first play is in sync
		// (an Audio element created lazily would stall on its first fetch).
		(Object.keys(CN_SFX_FILES) as CnSfxName[]).forEach(getCnSfx);
		// the mascot's voices go through Web Audio, decoded now (see playVoice)
		loadVoice('voice_roar');
		loadVoice('voice_effort');

		if (stateBet.activeBetModeKey === HOLD_AND_SPIN_MODE_KEY) {
			playBgm('freespin');
		} else {
			playBgm('base');
		}

		return () => {
			if (bgmAudio) {
				bgmAudio.pause();
				bgmAudio.src = '';
				bgmAudio = null;
			}
			for (const name of Object.keys(cnSfxAudio) as CnSfxName[]) {
				for (const audio of cnSfxAudio[name] ?? []) {
					audio.pause();
					audio.src = '';
				}
				delete cnSfxAudio[name];
			}
			// Web Audio loops outlive the DOM unless they are stopped explicitly.
			for (const name of Object.keys(loopNodes) as CnSfxName[]) stopCnLoop(name);
			audioCtx?.close().catch(() => {});
			audioCtx = null;
			for (const name of Object.keys(voiceLoads) as CnSfxName[]) delete voiceLoads[name];
			for (const name of Object.keys(voiceBuffers) as CnSfxName[]) delete voiceBuffers[name];
		};
	});
</script>
