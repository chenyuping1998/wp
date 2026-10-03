<script lang="ts" module>
	import { sound, type MusicName, type SoundEffectName, type SoundName } from '../game/sound';

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
		| { type: 'soundGrenadeBlast' }
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

	// Frostline's own ice-and-steel sound set. Monkey calls remain the character's
	// voice. The template sprite stays available for any future unmapped cue.
	type CnSfxName =
		| 'gong_feature'
		| 'bigwin_blast'
		| 'reel_tension'
		| 'reel_stop_1'
		| 'reel_stop_2'
		| 'reel_stop_3'
		| 'reel_stop_4'
		| 'reel_stop_5'
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
		| 'monkey_expand'
		| 'voice_roar'
		| 'voice_effort'
		| 'mult_combine'
		| 'mult_reset'
		| 'mult_win'
		| 'ice_burst'
		| 'riser_short'
		| 'win_end'
		| 'win_standard'
		| 'win_substantial'
		| 'youwon_panel'
		| 'tumble_win'
		| 'frost_creep'
		| 'ice_freeze'
		| 'ice_crack';

	// The original monkey voice stays recognizable; all recurring music and
	// gameplay cues are made for this ice setting.
	const CN_SFX_FILES: Record<CnSfxName, string> = {
		frost_creep: 'frost/frost_creep.wav',
		ice_freeze: 'frost/ice_freeze.wav',
		ice_crack: 'frost/ice_crack.wav',
		gong_feature: 'frost/gong_feature.wav',
		bigwin_blast: 'frost/bigwin_blast.wav',
		reel_tension: 'frost/reel_tension.wav',
		reel_stop_1: 'frost/reel_stop_1.wav',
		reel_stop_2: 'frost/reel_stop_2.wav',
		reel_stop_3: 'frost/reel_stop_3.wav',
		reel_stop_4: 'frost/reel_stop_4.wav',
		reel_stop_5: 'frost/reel_stop_5.wav',
		btn: 'frost/btn.wav',
		spin: 'frost/spin.wav',
		scatter_1: 'frost/scatter_1.wav',
		scatter_2: 'frost/scatter_2.wav',
		scatter_3: 'frost/scatter_3.wav',
		scatter_4: 'frost/scatter_4.wav',
		scatter_5: 'frost/scatter_5.wav',
		pluck_low: 'frost/pluck_low.wav',
		win_gliss: 'frost/win_gliss.wav',
		win_gliss_big: 'frost/win_gliss_big.wav',
		fs_intro: 'frost/fs_intro.wav',
		coin_shimmer: 'frost/coin_shimmer.wav',
		wild_expand: 'frost/wild_expand.wav',
		mult_update: 'frost/mult_update.wav',
		mult_combine: 'frost/mult_combine.wav',
		mult_reset: 'frost/mult_reset.wav',
		mult_win: 'frost/mult_win.wav',
		ice_burst: 'frost/ice_burst.wav',
		riser_short: 'frost/riser_short.wav',
		win_end: 'frost/win_end.wav',
		win_standard: 'frost/win_standard.wav',
		win_substantial: 'frost/win_substantial.wav',
		youwon_panel: 'frost/youwon_panel.wav',
		tumble_win: 'frost/tumble_win.wav',
		grenade_blast: 'frost/grenade_blast.wav',
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
		roar: 0.55,
		effort: 0.8,
	};

	// Route the template's logical events into Frostline's sound palette.
	//
	// `rate` sets playbackRate, which on a short percussive sample reads as pitch.
	//
	// Five ice-and-steel detents share a pitch centre and differ in attack and
	// brightness. The melodic rise belongs only to the scatter landing cues.
	const SPRITE_TO_CN: Partial<
		Record<SoundEffectName, { name: CnSfxName; volume?: number; rate?: number }>
	> = {
		jng_intro_fs: { name: 'fs_intro' },
		sfx_anticipation: { name: 'riser_short', volume: 0.55 },
		sfx_anticipation_start: { name: 'riser_short', volume: 0.55 },
		sfx_bigwin_coinloop: { name: 'coin_shimmer' },
		sfx_btn_general: { name: 'btn', volume: 0.7 },
		sfx_btn_spin: { name: 'spin', volume: 0.9 },
		sfx_fs_respins: { name: 'mult_reset' },
		sfx_multiplier_combine_a: { name: 'mult_combine' },
		sfx_multiplier_combine_b: { name: 'mult_combine', rate: 1.06 },
		sfx_multiplier_explosion_a: { name: 'ice_burst', volume: 0.75 },
		sfx_multiplier_explosion_b: { name: 'ice_burst', volume: 0.9 },
		sfx_multiplier_explosion_c: { name: 'ice_burst' },
		sfx_multiplier_landing: { name: 'pluck_low' },
		sfx_multiplier_reset: { name: 'mult_reset' },
		sfx_multiplier_up: { name: 'mult_update' },
		sfx_multiplier_update: { name: 'mult_update' },
		sfx_multiplier_win: { name: 'mult_win' },
		sfx_reel_stop_1: { name: 'reel_stop_1' },
		sfx_reel_stop_2: { name: 'reel_stop_2' },
		sfx_reel_stop_3: { name: 'reel_stop_3' },
		sfx_reel_stop_4: { name: 'reel_stop_4' },
		sfx_reel_stop_5: { name: 'reel_stop_5' },
		sfx_royals_landing: { name: 'pluck_low', volume: 0.4 },
		sfx_scatter_reveal: { name: 'scatter_1', volume: 0.55 },
		sfx_scatter_stop_1: { name: 'scatter_1' },
		sfx_scatter_stop_2: { name: 'scatter_2' },
		sfx_scatter_stop_3: { name: 'scatter_3' },
		sfx_scatter_stop_4: { name: 'scatter_4' },
		sfx_scatter_stop_5: { name: 'scatter_5' },
		// Freeze takeover. Volumes set here rather than baked into the WAVs so the
		// balance can be changed without regenerating: the creep fires once per
		// cell (four times a takeover) and has to sit under the bed, not on it.
		sfx_frost_creep: { name: 'frost_creep', volume: 0.5 },
		sfx_ice_freeze: { name: 'ice_freeze', volume: 0.65 },
		// full level: this is the loudest single moment of the takeover and it was
		// being held back below the freeze bed it is supposed to break through
		sfx_ice_crack: { name: 'ice_crack', volume: 1 },
		sfx_winlevel_end: { name: 'win_end' },
		sfx_winlevel_nice: { name: 'win_gliss' },
		sfx_winlevel_small: { name: 'win_gliss' },
		sfx_winlevel_standard: { name: 'win_standard' },
		sfx_winlevel_substantial: { name: 'win_substantial' },
		sfx_scatter_win: { name: 'win_gliss' },
		sfx_scatter_win_v2: { name: 'win_gliss_big' },
		sfx_superfreespin: { name: 'win_gliss_big', volume: 0.8 },
		sfx_wild_explode: { name: 'wild_expand' },
		sfx_symbols_landing: { name: 'pluck_low', volume: 0.4 },
		sfx_youwon_panel: { name: 'youwon_panel' },
		tumble_win_1: { name: 'tumble_win', volume: 0.65 },
		tumble_win_2: { name: 'tumble_win', volume: 0.72, rate: 1.04 },
		tumble_win_3: { name: 'tumble_win', volume: 0.8, rate: 1.08 },
		tumble_win_4: { name: 'tumble_win', volume: 0.88, rate: 1.12 },
	};

	const cnSfxAudio: Partial<Record<CnSfxName, HTMLAudioElement>> = {};

	function getCnSfx(name: CnSfxName) {
		let audio = cnSfxAudio[name];
		if (!audio) {
			audio = new Audio(`${base}/assets/audio/${CN_SFX_FILES[name]}`);
			audio.preload = 'auto';
			cnSfxAudio[name] = audio;
		}
		return audio;
	}

	function playCnSfx(name: CnSfxName, volumeScale = 1, rate = 1) {
		const ctx = getAudioCtx();
		const buffer = oneShotBuffers[name];
		if (ctx?.state === 'running' && buffer) {
			// A fresh source for every hit: close reel stops and scatter accents can
			// overlap without restarting one cached HTMLAudioElement.
			const source = ctx.createBufferSource();
			const gain = ctx.createGain();
			source.buffer = buffer;
			source.playbackRate.value = rate;
			gain.gain.value = Math.min(1, stateSoundDerived.volumeSoundEffect() * volumeScale);
			source.connect(gain).connect(ctx.destination);
			source.onended = () => { source.disconnect(); gain.disconnect(); };
			source.start(ctx.currentTime);
			return;
		}
		const audio = getCnSfx(name);
		audio.loop = false;
		audio.volume = Math.min(1, stateSoundDerived.volumeSoundEffect() * volumeScale);
		// Always assign, never skip when rate is 1: the fallback caches one
		// element per cue, so an earlier playback rate must not carry over.
		audio.playbackRate = rate;
		audio.currentTime = 0;
		audio.play().catch(() => {});
	}

	// The monkey hoot the player supplied is ~5s, but it needs to track the wild
	// expansion — which lasts about 1.5s — and then get out of the way. Play it
	// from the top, hold, then fade to silence so it covers the grow and settles
	// as the panel locks, instead of hanging on under the next spin.
	let monkeyFadeTimers: ReturnType<typeof setTimeout>[] = [];
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

	// The player-supplied monkey call rides over the six SC chest strikes. The
	// clip's first hoot begins 40ms in; starting it at 440ms puts that onset on
	// the first 480ms fist. Its next calls span the 300ms cadence, and a short
	// fade after source time 1.64s clears the last strike without another hoot.
	const CHEST_HOOT_DELAY = 0.44;
	const CHEST_HOOT_CUT = 1.64;
	let chestHootSource: AudioBufferSourceNode | null = null;
	let chestHootFallback: HTMLAudioElement | null = null;
	let chestHootTimer: ReturnType<typeof setTimeout> | undefined;
	let chestHootTimeout: ReturnType<typeof setTimeout> | undefined;
	let chestHootWatch: ReturnType<typeof setInterval> | undefined;
	const stopChestHoot = () => {
		clearTimeout(chestHootTimer);
		clearTimeout(chestHootTimeout);
		clearInterval(chestHootWatch);
		chestHootTimer = undefined;
		chestHootTimeout = undefined;
		chestHootWatch = undefined;
		try { chestHootSource?.stop(); } catch { /* source already ended */ }
		chestHootSource = null;
		chestHootFallback?.pause();
		chestHootFallback = null;
	};
	function playChestHoot() {
		stopChestHoot();
		const ctx = getAudioCtx();
		const buffer = oneShotBuffers.monkey_expand;
		if (ctx?.state === 'running' && buffer) {
			const start = ctx.currentTime + CHEST_HOOT_DELAY;
			const source = ctx.createBufferSource();
			const gain = ctx.createGain();
			source.buffer = buffer;
			gain.gain.setValueAtTime(0.0001, start);
			gain.gain.linearRampToValueAtTime(Math.max(0.0001, stateSoundDerived.volumeSoundEffect() * 0.78), start + 0.02);
			gain.gain.setValueAtTime(Math.max(0.0001, stateSoundDerived.volumeSoundEffect() * 0.78), start + CHEST_HOOT_CUT - 0.07);
			gain.gain.linearRampToValueAtTime(0.0001, start + CHEST_HOOT_CUT);
			source.connect(gain).connect(ctx.destination);
			source.onended = () => { if (chestHootSource === source) chestHootSource = null; source.disconnect(); gain.disconnect(); };
			source.start(start, 0, CHEST_HOOT_CUT);
			chestHootSource = source;
			return;
		}
		// First-load fallback, while the MP3 is still decoding.
		chestHootTimer = setTimeout(() => {
			// A separate element keeps the expansion call independent of this cue.
			const audio = getCnSfx('monkey_expand').cloneNode(true) as HTMLAudioElement;
			chestHootFallback = audio;
			audio.loop = false;
			audio.volume = Math.min(1, stateSoundDerived.volumeSoundEffect() * 0.78);
			audio.playbackRate = 1;
			audio.currentTime = 0;
			audio.play().catch(() => stopChestHoot());
			chestHootWatch = setInterval(() => { if (audio.currentTime >= CHEST_HOOT_CUT) stopChestHoot(); }, 10);
			// Stalled media must not leave the watcher alive indefinitely.
			chestHootTimeout = setTimeout(stopChestHoot, 2600);
		}, CHEST_HOOT_DELAY * 1000);
	}

	// ─── looping sfx: Web Audio, not <audio loop> ───
	//
	// An HTMLAudioElement with loop = true is NOT gapless. The browser tears down
	// and restarts playback at the wrap, and the silence either side of that is
	// plainly audible — on coin_shimmer, a 2.4s clip with a recognisable attack,
	// it lands as the clip visibly stopping and starting again roughly every two
	// seconds. On the superspin result plaque, which stays up until the player
	// presses, that repeats for as long as they look at it.
	//
	// Guarding against re-triggering (the previous attempt) removed one cause of
	// choppiness — winLevelSoundsPlay fires up to three times in a superspin round
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
	const oneShotBuffers: Partial<Record<CnSfxName, AudioBuffer>> = {};
	const oneShotLoading: Partial<Record<CnSfxName, Promise<void>>> = {};
	function warmOneShot(name: CnSfxName) {
		if (oneShotBuffers[name] || oneShotLoading[name]) return;
		const ctx = getAudioCtx();
		if (!ctx) return;
		oneShotLoading[name] = (async () => {
			try {
				const response = await fetch(`${base}/assets/audio/${CN_SFX_FILES[name]}`);
				if (!response.ok) return;
				oneShotBuffers[name] = await ctx.decodeAudioData(await response.arrayBuffer());
			} catch { /* HTMLAudio fallback remains available */ }
			finally { delete oneShotLoading[name]; }
		})();
	}

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

	function stopCnSfx(name: CnSfxName) {
		const audio = cnSfxAudio[name];
		if (audio) {
			audio.pause();
			audio.currentTime = 0;
		}
	}

	// ─── BGM: seamless phrase lengths and a short scene crossfade ───
	let bgmAudio: HTMLAudioElement | null = null;
	let bgmPrevious: HTMLAudioElement | null = null;
	let bgmFadeTimer: ReturnType<typeof setInterval> | undefined;
	let bgmFadeProgress = 1;
	let currentBgm: MusicName | null = null;
	const BGM_FILES: Record<MusicName, string> = {
		bgm_main: 'frost/bgm_main.wav',
		bgm_freespin: 'frost/bgm_freespin.wav',
		bgm_winlevel_big: 'frost/bgm_winlevel_big.wav',
		bgm_winlevel_superwin: 'frost/bgm_winlevel_superwin.wav',
		bgm_winlevel_mega: 'frost/bgm_winlevel_mega.wav',
		bgm_winlevel_epic: 'frost/bgm_winlevel_epic.wav',
		bgm_winlevel_max: 'frost/bgm_winlevel_max.wav',
	};
	const bgmCache: Partial<Record<MusicName, HTMLAudioElement>> = {};
	function getBgm(type: MusicName) {
		let audio = bgmCache[type];
		if (!audio) {
			audio = new Audio(`${base}/assets/audio/${BGM_FILES[type]}`);
			audio.loop = true;
			audio.preload = 'auto';
			bgmCache[type] = audio;
		}
		return audio;
	}

	function clearBgmFade() {
		clearInterval(bgmFadeTimer);
		bgmFadeTimer = undefined;
		bgmPrevious?.pause();
		bgmPrevious = null;
	}

	function playBgm(type: MusicName) {
		if (currentBgm === type && bgmAudio && !bgmAudio.paused) return;
		clearBgmFade();
		const previous = bgmAudio;
		const previousName = currentBgm;
		const next = getBgm(type);
		next.currentTime = 0;
		bgmAudio = next;
		currentBgm = type;
		if (!previous || previous.paused) {
			previous?.pause();
			bgmFadeProgress = 1;
			next.volume = stateSoundDerived.volumeMusic();
			next.play().catch(() => {});
			return;
		}
		bgmPrevious = previous;
		bgmFadeProgress = 0;
		next.volume = 0;
		next.play().then(() => {
			if (bgmAudio !== next || bgmPrevious !== previous) return;
			const started = performance.now();
			bgmFadeTimer = setInterval(() => {
				const p = Math.min(1, (performance.now() - started) / 380);
				bgmFadeProgress = p;
				const vol = stateSoundDerived.volumeMusic();
				if (bgmAudio === next) next.volume = vol * p;
				if (bgmPrevious === previous) previous.volume = vol * (1 - p);
				if (p >= 1) clearBgmFade();
			}, 20);
		}).catch(() => {
			if (bgmAudio !== next || bgmPrevious !== previous) return;
			bgmPrevious = null;
			bgmAudio = previous;
			currentBgm = previousName;
			bgmFadeProgress = 1;
			previous.volume = stateSoundDerived.volumeMusic();
		});
	}

	function stopBgm() {
		clearBgmFade();
		if (bgmAudio) {
			bgmAudio.pause();
			bgmAudio.currentTime = 0;
		}
		bgmFadeProgress = 1;
		currentBgm = null;
	}

	// Keep volume in sync with settings
	$effect(() => {
		const vol = stateSoundDerived.volumeMusic();
		if (bgmAudio) bgmAudio.volume = vol * bgmFadeProgress;
		if (bgmPrevious) bgmPrevious.volume = vol * (1 - bgmFadeProgress);
	});

	context.eventEmitter.subscribeOnMount({
		// ui
		soundBetMode: async ({ betModeKey }) => {
			if (betModeKey === 'SUPERSPIN') {
				playCnSfx('win_gliss_big', 0.7);
				await waitForTimeout(SECOND);
				playBgm('bgm_freespin');
			} else {
				playBgm('bgm_main');
			}
		},
		soundPressGeneral: () => playCnSfx('btn', 0.7),
		soundPressBet: () => playCnSfx('spin', 0.9),
		// scatterCounter
		soundScatterCounterIncrease: () => (context.stateGame.scatterCounter = context.stateGame.scatterCounter + 1), // prettier-ignore
		soundScatterCounterClear: () => (context.stateGame.scatterCounter = 0),
		// game
		soundMusic: ({ name }) => playBgm(name),
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
		soundOnce: ({ name, forcePlay }) => {
			const mapped = SPRITE_TO_CN[name];
			if (mapped) {
				playCnSfx(mapped.name, mapped.volume ?? 1, mapped.rate ?? 1);
			} else {
				sound.players.once.play({ name, forcePlay });
			}
		},
		soundFreeGameBell: () => playCnSfx('gong_feature'),
		soundBigWinBlast: () => playCnSfx('bigwin_blast'),
		soundGrenadeBlast: () => playCnSfx('grenade_blast'),
		soundMonkeyExpand: () => playMonkeyExpand(),
		// Deliberately NOT forced through the turbo gate that silences ordinary
		// one-shots: these are tied to animations that play at their own length
		// whatever the spin speed, so a dropped one is a character opening his
		// mouth in silence.
		soundMascotVoice: ({ name }) =>
			playCnSfx(`voice_${name}` as CnSfxName, MASCOT_VOICE_GAIN[name]),
		soundChestHoot: () => playChestHoot(),
		soundReelTensionStart: () => playCnLoop('reel_tension', 0.8),
		// stopCnLoop, not stopCnSfx: playCnLoop moved this to Web Audio, and the
		// element-based stopper would leave the buffer source looping forever.
		soundReelTensionStop: () => {
			stopCnLoop('reel_tension');
			stopCnSfx('reel_tension');
		},
		soundStop: ({ name }) => {
			if (name in BGM_FILES) {
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
		// Autoplay may be blocked when this component mounts before the loading
		// screen is dismissed. The first real gesture retries the selected bed.
		const resumeBgmAfterGesture = () => {
			if (currentBgm && bgmAudio?.paused) bgmAudio.play().catch(() => {});
		};
		window.addEventListener('pointerdown', resumeBgmAfterGesture);
		window.addEventListener('keydown', resumeBgmAfterGesture);
		// Fetch the one-shot sfx up front so the first play is in sync
		// (an Audio element created lazily would stall on its first fetch).
		(Object.keys(CN_SFX_FILES) as CnSfxName[]).forEach(getCnSfx);
		(Object.keys(BGM_FILES) as MusicName[]).forEach(getBgm);
		// Decode short cues ahead of the first spin. Web Audio starts on the event
		// sample and lets multiple hits overlap; the elements remain a fallback.
		(Object.keys(CN_SFX_FILES) as CnSfxName[])
			.filter((name) => !['reel_tension', 'ice_freeze', 'coin_shimmer'].includes(name))
			.forEach(warmOneShot);

		if (stateBet.activeBetModeKey === 'SUPERSPIN') {
			playBgm('bgm_freespin');
		} else {
			playBgm('bgm_main');
		}

		return () => {
			window.removeEventListener('pointerdown', resumeBgmAfterGesture);
			window.removeEventListener('keydown', resumeBgmAfterGesture);
			stopChestHoot();
			monkeyFadeTimers.forEach(clearTimeout);
			monkeyFadeTimers = [];
			clearBgmFade();
			if (bgmAudio) {
				bgmAudio.pause();
				bgmAudio = null;
			}
			for (const name of Object.keys(bgmCache) as MusicName[]) {
				const audio = bgmCache[name];
				if (audio) { audio.pause(); audio.src = ''; delete bgmCache[name]; }
			}
			for (const name of Object.keys(cnSfxAudio) as CnSfxName[]) {
				const audio = cnSfxAudio[name];
				if (audio) {
					audio.pause();
					audio.src = '';
					delete cnSfxAudio[name];
				}
			}
			// Web Audio loops outlive the DOM unless they are stopped explicitly.
			for (const name of Object.keys(loopNodes) as CnSfxName[]) stopCnLoop(name);
			audioCtx?.close().catch(() => {});
			audioCtx = null;
		};
	});
</script>
