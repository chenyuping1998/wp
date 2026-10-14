<script lang="ts" module>
	import { sound, type MusicName, type SoundEffectName, type SoundName } from '../game/sound';

	// What the mascot can say. One clip per animation — see
	// design/ingest_human_voices.py: licensed human performances, three takes each.
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
		| { type: 'soundLadderUp'; level: number }
		| { type: 'soundCookSlice' }
		| { type: 'soundCookChop' }
		| { type: 'soundStamp' }
		| { type: 'soundMonkeyExpand' }
		// the heist's own moments, which used to borrow multiplier sounds
		| { type: 'soundSackLand' }
		| { type: 'soundCollectGrab' }
		| { type: 'soundCoinIn'; index: number }
		| { type: 'soundCollectStamp' }
		| { type: 'soundShutterDown' }
		// the transition's sliding shop door (design/generate_door_audio.py)
		| { type: 'soundDoorSlide' }
		| { type: 'soundDoorClack' }
		| { type: 'soundDoorOpen' }
		| { type: 'soundDoorWheel' }
		| { type: 'soundDoorSteam' }
		| { type: 'soundUiHover' }
		| { type: 'soundFsOutro' }
		| { type: 'soundMascotVoice'; name: MascotVoice }
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

	const context = getContext();
	const voiceTake:Record<string,number> = {};

	// ─── heist-caper sound set (synthesized — see design/generate_audio_heist.py) ───
	// Spy-jazz combo plus the hardware of a robbery: safe dial, tumblers, sacks,
	// coins, bill counter, register, roller shutter, alarm bell. The first
	// submission shipped the Go Bananas jungle set unchanged and came back "Bad
	// sound design" / "Reused assets" (2026-10-04); none of these files exist in
	// any other game. Every sprite name is mapped below, so the template sprite
	// (sounds.json) is never the thing that sounds.
	type CnSfxName =
		| 'spin_b'
		| 'spin_c'
		| 'sack_land_b'
		| 'sack_land_c'
		| 'collect_grab_b'
		| 'collect_grab_c'
		| 'coin_in_b'
		| 'coin_in_c'
		| 'collect_stamp_b'
		| 'collect_stamp_c'
		| 'dial_tick_b'
		| 'dial_tick_c'
		| 'btn_b'
		| 'btn_c'
		| 'hover_b'
		| 'hover_c'

		| 'door_steam'
		| 'fs_outro'
		| 'hover'
		| 'btn'
		| 'spin'
		| 'reel_stop'
		| 'reel_stop_b'
		| 'reel_stop_c'
		| 'scatter_1'
		| 'scatter_2'
		| 'scatter_3'
		| 'scatter_4'
		| 'scatter_5'
		| 'sack_land'
		| 'bandit_land'
		| 'collect_grab'
		| 'coin_in'
		| 'collect_stamp'
		| 'tumbler_up'
		| 'dial_tick'
		| 'reel_tension'
		| 'alarm_bell'
		| 'alarm_trip'
		| 'sack_throw'
		| 'shutter_down'
		| 'door_slide'
		| 'door_clack'
		| 'door_open'
		| 'shutter_slam'
		| 'safe_open'
		| 'fs_intro'
		| 'win_small'
		| 'win_mid'
		| 'bill_counter'
		| 'cash_register'
		| 'bigwin_slam'
		| 'win_big'
		| 'win_super'
		| 'win_mega'
		| 'win_epic'
		| 'win_max'
		| 'win_cap'
		| 'voice_laugh'
		| 'voice_hup'
		| 'voice_laugh_fg'
		| 'voice_hup_fg'
		| 'voice_laugh_b'
		| 'voice_laugh_c'
		| 'voice_hup_b'
		| 'voice_hup_c'
		| 'voice_laugh_fg_b'
		| 'voice_laugh_fg_c'
		| 'voice_hup_fg_b'
		| 'voice_hup_fg_c';

	const CN_SFX_FILES: Record<CnSfxName, string> = {
		btn: 'pickle/btn.wav',
		door_steam: 'pickle/door_steam.wav',
		fs_outro: 'pickle/fs_outro.wav',
		hover: 'pickle/hover.wav',
		spin: 'pickle/spin.wav',
		reel_stop: 'pickle/reel_stop.wav',
		reel_stop_b: 'pickle/reel_stop_b.wav',
		reel_stop_c: 'pickle/reel_stop_c.wav',
		scatter_1: 'pickle/scatter_1.wav',
		scatter_2: 'pickle/scatter_2.wav',
		scatter_3: 'pickle/scatter_3.wav',
		scatter_4: 'pickle/scatter_4.wav',
		scatter_5: 'pickle/scatter_5.wav',
		sack_land: 'pickle/sack_land.wav',
		bandit_land: 'pickle/bandit_land.wav',
		collect_grab: 'pickle/collect_grab.wav',
		coin_in: 'pickle/coin_in.wav',
		collect_stamp: 'pickle/collect_stamp.wav',
		tumbler_up: 'pickle/tumbler_up.wav',
		dial_tick: 'pickle/dial_tick.wav',
		reel_tension: 'pickle/reel_tension.wav',
		alarm_bell: 'pickle/alarm_bell.wav',
		alarm_trip: 'pickle/alarm_trip.wav',
		sack_throw: 'pickle/sack_throw.wav',
		shutter_down: 'pickle/shutter_down.wav',
		door_slide: 'pickle/door_slide.wav',
		door_clack: 'pickle/door_clack.wav',
		door_open: 'pickle/door_open.wav',
		shutter_slam: 'pickle/shutter_slam.wav',
		safe_open: 'pickle/safe_open.wav',
		fs_intro: 'pickle/fs_intro.m4a',
		win_small: 'pickle/win_small.m4a',
		win_mid: 'pickle/win_mid.m4a',
		bill_counter: 'pickle/bill_counter.wav',
		cash_register: 'pickle/cash_register.wav',
		bigwin_slam: 'pickle/bigwin_slam.wav',
		win_big: 'pickle/win_big.m4a',
		win_super: 'pickle/win_super.m4a',
		win_mega: 'pickle/win_mega.m4a',
		win_epic: 'pickle/win_epic.m4a',
		win_max: 'pickle/win_max.m4a',
		win_cap: 'pickle/win_cap.m4a',
		spin_b: 'pickle/spin_b.wav',
		spin_c: 'pickle/spin_c.wav',
		sack_land_b: 'pickle/sack_land_b.wav',
		sack_land_c: 'pickle/sack_land_c.wav',
		collect_grab_b: 'pickle/collect_grab_b.wav',
		collect_grab_c: 'pickle/collect_grab_c.wav',
		coin_in_b: 'pickle/coin_in_b.wav',
		coin_in_c: 'pickle/coin_in_c.wav',
		collect_stamp_b: 'pickle/collect_stamp_b.wav',
		collect_stamp_c: 'pickle/collect_stamp_c.wav',
		dial_tick_b: 'pickle/dial_tick_b.wav',
		dial_tick_c: 'pickle/dial_tick_c.wav',
		btn_b: 'pickle/btn_b.wav',
		btn_c: 'pickle/btn_c.wav',
		hover_b: 'pickle/hover_b.wav',
		hover_c: 'pickle/hover_c.wav',
		voice_laugh: 'pickle/voice_laugh.wav',
		voice_hup: 'pickle/voice_hup.wav',
		voice_laugh_fg: 'pickle/voice_laugh_fg.wav',
		voice_hup_fg: 'pickle/voice_hup_fg.wav',
		voice_laugh_b: 'pickle/voice_laugh_b.wav',
		voice_laugh_c: 'pickle/voice_laugh_c.wav',
		voice_hup_b: 'pickle/voice_hup_b.wav',
		voice_hup_c: 'pickle/voice_hup_c.wav',
		voice_laugh_fg_b: 'pickle/voice_laugh_fg_b.wav',
		voice_laugh_fg_c: 'pickle/voice_laugh_fg_c.wav',
		voice_hup_fg_b: 'pickle/voice_hup_fg_b.wav',
		voice_hup_fg_c: 'pickle/voice_hup_fg_c.wav',
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
	// Two characters, two voices: the Boss in the base game, the Spicy Chef in
	// free spins (design/generate_pickle_audio_v2.py, laugh() / hup()).
	const MASCOT_VOICE_FILE: Record<'basegame' | 'freegame', Record<MascotVoice, CnSfxName>> = {
		basegame: { roar: 'voice_laugh', effort: 'voice_hup' },
		freegame: { roar: 'voice_laugh_fg', effort: 'voice_hup_fg' },
	};
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
	const SPRITE_TO_CN: Record<
		SoundEffectName,
		{ name: CnSfxName; volume?: number; rate?: number } | null
	> = {
		sfx_btn_general: { name: 'btn', volume: 0.7 },
		sfx_btn_spin: { name: 'spin', volume: 0.9 },
		// three different trays, rotated, and still rising a little reel by reel
		sfx_reel_stop_1: { name: 'reel_stop', rate: 0.96 },
		sfx_reel_stop_2: { name: 'reel_stop_b', rate: 1.0 },
		sfx_reel_stop_3: { name: 'reel_stop_c', rate: 1.04 },
		sfx_reel_stop_4: { name: 'reel_stop', rate: 1.09 },
		sfx_reel_stop_5: { name: 'reel_stop_b', rate: 1.14 },
		sfx_scatter_stop_1: { name: 'scatter_1' },
		sfx_scatter_stop_2: { name: 'scatter_2' },
		sfx_scatter_stop_3: { name: 'scatter_3' },
		sfx_scatter_stop_4: { name: 'scatter_4' },
		sfx_scatter_stop_5: { name: 'scatter_5' },
		// a Cook landing on the reels
		sfx_multiplier_landing: { name: 'bandit_land', volume: 0.8 },
		sfx_wild_explode: { name: 'bandit_land' },
		sfx_winlevel_small: { name: 'win_small' },
		sfx_winlevel_nice: { name: 'win_small' },
		sfx_winlevel_standard: { name: 'win_mid', volume: 0.8 },
		sfx_winlevel_substantial: { name: 'win_mid' },
		sfx_scatter_win: { name: 'win_mid' },
		// the scatter count that sets the alarm off
		sfx_scatter_win_v2: { name: 'alarm_trip' },
		// the transition opening: the sack thrown at the shutter
		sfx_superfreespin: { name: 'sack_throw', volume: 0.8 },
		sfx_youwon_panel: { name: 'cash_register' },
		sfx_winlevel_end: { name: 'win_cap' },
		jng_intro_fs: { name: 'fs_intro' },
		sfx_multiplier_update: { name: 'dial_tick' },
		sfx_anticipation_start: { name: 'dial_tick', volume: 0.5 },
		sfx_symbols_landing: { name: 'reel_stop_c', volume: 0.6 },
		sfx_royals_landing: { name: 'reel_stop_c', volume: 0.5 },
		// template names this game never raises — mapped anyway so nothing can
		// fall through to the sprite
		sfx_multiplier_combine_a: { name: 'dial_tick' },
		sfx_multiplier_combine_b: { name: 'dial_tick' },
		sfx_multiplier_explosion_a: { name: 'collect_stamp' },
		sfx_multiplier_explosion_b: { name: 'collect_stamp' },
		sfx_multiplier_explosion_c: { name: 'collect_stamp' },
		sfx_multiplier_reset: { name: 'dial_tick', volume: 0.5 },
		sfx_multiplier_up: { name: 'tumbler_up' },
		sfx_multiplier_win: { name: 'win_mid' },
		sfx_fs_respins: { name: 'tumbler_up' },
		sfx_scatter_reveal: { name: 'dial_tick' },
		tumble_win_1: { name: 'win_small' },
		tumble_win_2: { name: 'win_small' },
		tumble_win_3: { name: 'win_mid' },
		tumble_win_4: { name: 'win_mid' },
		// handled as loops / not at all, below
		sfx_anticipation: null,
		sfx_bigwin_coinloop: null,
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

	const repeatedFamilies=new Set<string>(['spin','sack_land','collect_grab','coin_in','collect_stamp','dial_tick','btn','hover']);
	const takeCounter:Record<string,number>={};
	function nextTake(name:CnSfxName):CnSfxName {if(!repeatedFamilies.has(name))return name;const i=takeCounter[name]??0;takeCounter[name]=i+1;return (name+['','_b','_c'][i%3]) as CnSfxName;}
	function playCnSfx(name: CnSfxName, volumeScale = 1, rate = 1) {
		const audio = getCnSfx(nextTake(name));
		audio.loop = false;
		audio.volume = Math.min(1, stateSoundDerived.volumeSoundEffect() * volumeScale);
		// Always assign, never skip when rate is 1: getCnSfx caches one element per
		// file, so a rate left over from the previous caller would carry into every
		// later play of the same sample. reel_stop is shared with symbol/royal
		// landings, which would otherwise inherit the fifth reel's pitch.
		audio.playbackRate = rate;
		audio.currentTime = 0;
		audio.play().catch(() => {});
	}

	// Overlapping copies of one clip: the sacks in a collect arrive faster than
	// coin_in finishes, and the single cached element would cut each one off.
	function playCnSfxLayered(name: CnSfxName, volumeScale = 1, rate = 1) {
		const audio = getCnSfx(nextTake(name)).cloneNode(true) as HTMLAudioElement;
		audio.volume = Math.min(1, stateSoundDerived.volumeSoundEffect() * volumeScale);
		audio.playbackRate = rate;
		audio.play().catch(() => {});
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
	const loopNodes: Partial<Record<CnSfxName, { src: AudioBufferSourceNode; gain: GainNode; scale: number }>> = {};
	// the element fallback's own scale, for the same reason
	const loopElementScale: Partial<Record<CnSfxName, number>> = {};

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
			const audio = getCnSfx(nextTake(name));
			audio.loop = true;
			loopElementScale[name] = volumeScale;
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
		loopNodes[name] = { src, gain, scale: volumeScale };
	}

	// A loop's gain was set once, when it started. Muting (or turning effects
	// down) during a big win left coin_shimmer and friends playing at the old
	// level until the plaque closed — Engine guideline 107 wants every sound to
	// follow the setting immediately. Follow it here, without a ramp: a mute
	// should be a mute.
	$effect(() => {
		const vol = stateSoundDerived.volumeSoundEffect();
		const ctx = audioCtx;
		for (const node of Object.values(loopNodes)) {
			if (!node || !ctx) continue;
			node.gain.gain.cancelScheduledValues(ctx.currentTime);
			node.gain.gain.setValueAtTime(Math.min(1, vol * node.scale), ctx.currentTime);
		}
		for (const [name, scale] of Object.entries(loopElementScale)) {
			const audio = cnSfxAudio[name as CnSfxName];
			if (audio?.loop) audio.volume = Math.min(1, vol * (scale ?? 1));
		}
	});

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

	// ─── BGM: layered stems on Web Audio ───
	//
	// Each score is a set of stems of identical length that start on the same
	// AudioContext instant and loop sample-locked (design/generate_pickle_music.py).
	// Every file carries MUSIC_PAD seconds of its own wrap on both sides, and the
	// loop runs [MUSIC_PAD, MUSIC_PAD + loop]; whatever priming the AAC decoder
	// leaves in, the audio either side of the seam is the same music, so there is
	// no gap and no click.
	//
	// The arrangement answers the game instead of looping one mix:
	//   base  bed always; lead (guitar riffs, theremin) while the player is
	//         spinning, easing out after LEAD_IDLE_MS without a spin
	//   free  bed + l2 from the start; l3 joins at the first Cook rung and is at
	//         full strength from the second
	// and the whole score ducks under a big-win fanfare.
	const MUSIC_PAD = 0.5;
	const MUSIC = {
		base: { loop: 60.952381, stems: { bed: 'pickle/bgm_main_bed.m4a', percussion: 'pickle/bgm_main_percussion.m4a', lead: 'pickle/bgm_main_lead.m4a' } },
		freespin: {
			loop: 64,
			stems: { bed: 'pickle/bgm_fs_bed.m4a', l2: 'pickle/bgm_fs_l2.m4a', l3: 'pickle/bgm_fs_l3.m4a' },
		},
	} as const;
	type MusicMode = keyof typeof MUSIC;
	const LEAD_IDLE_MS = 30 * SECOND;
	const STEM_FADE = 1.2;

	let currentBgm: MusicMode | null = null;
	let musicBus: GainNode | null = null; // follows the music volume setting
	let duckGain: GainNode | null = null; // dips under big wins
	let stemNodes: Record<string, { src: AudioBufferSourceNode; gain: GainNode }> = {};
	const stemBuffers: Partial<Record<MusicMode, Record<string, AudioBuffer>>> = {};
	let bgmToken = 0;
	let leadIdleTimer: ReturnType<typeof setTimeout> | null = null;

	const ensureMusicBus = (ctx: AudioContext) => {
		if (!musicBus) {
			musicBus = ctx.createGain();
			duckGain = ctx.createGain();
			musicBus.connect(duckGain).connect(ctx.destination);
		}
		musicBus.gain.setValueAtTime(stateSoundDerived.volumeMusic(), ctx.currentTime);
		return musicBus;
	};

	async function loadStems(ctx: AudioContext, mode: MusicMode) {
		if (stemBuffers[mode]) return stemBuffers[mode]!;
		const entries = Object.entries(MUSIC[mode].stems);
		const decoded = await Promise.all(
			entries.map(async ([key, file]) => {
				const res = await fetch(`${base}/assets/audio/${file}`);
				return [key, await ctx.decodeAudioData(await res.arrayBuffer())] as const;
			}),
		);
		// One score in memory at a time: a minute of decoded stereo is ~23 MB per
		// stem, and phones are the platform that would feel holding both.
		for (const other of Object.keys(stemBuffers) as MusicMode[]) if (other !== mode) delete stemBuffers[other];
		stemBuffers[mode] = Object.fromEntries(decoded);
		return stemBuffers[mode]!;
	}

	// The level each stem should sit at right now.
	const stemTargets = (mode: MusicMode): Record<string, number> => {
		if (mode === 'base') return { bed: 1, percussion: leadActive ? 1 : .45, lead: leadActive ? 1 : 0 };
		const level = context.stateGame.banditMeter?.level ?? 0;
		return { bed: 1, l2: level >= 1 ? 1 : 0.65, l3: level >= 2 ? 1 : level >= 1 ? 0.55 : 0 };
	};

	const applyStemLevels = (fade = STEM_FADE) => {
		const ctx = audioCtx;
		if (!ctx || !currentBgm) return;
		const targets = stemTargets(currentBgm);
		for (const [key, node] of Object.entries(stemNodes)) {
			const to = Math.max(0.0001, targets[key] ?? 0);
			node.gain.gain.cancelScheduledValues(ctx.currentTime);
			node.gain.gain.setValueAtTime(Math.max(0.0001, node.gain.gain.value), ctx.currentTime);
			node.gain.gain.exponentialRampToValueAtTime(to, ctx.currentTime + fade);
		}
	};

	let leadActive = $state(false);
	const markPlaying = () => {
		if (!leadActive) {
			leadActive = true;
			applyStemLevels(2.0);
		}
		if (leadIdleTimer) clearTimeout(leadIdleTimer);
		leadIdleTimer = setTimeout(() => {
			leadActive = false;
			applyStemLevels(4.0);
		}, LEAD_IDLE_MS);
	};

	function stopStems(fade = 0.4) {
		const ctx = audioCtx;
		for (const node of Object.values(stemNodes)) {
			if (!ctx) {
				node.src.stop();
				continue;
			}
			const end = ctx.currentTime + fade;
			node.gain.gain.cancelScheduledValues(ctx.currentTime);
			node.gain.gain.setValueAtTime(Math.max(0.0001, node.gain.gain.value), ctx.currentTime);
			node.gain.gain.exponentialRampToValueAtTime(0.0001, end);
			node.src.stop(end + 0.05);
		}
		stemNodes = {};
	}

	async function playBgm(mode: MusicMode) {
		if (currentBgm === mode && Object.keys(stemNodes).length) return;
		const token = ++bgmToken;
		stopStems(0.6);
		currentBgm = mode;
		const ctx = getAudioCtx();
		if (!ctx) return;
		let buffers: Record<string, AudioBuffer>;
		try {
			buffers = await loadStems(ctx, mode);
		} catch {
			return;
		}
		// a newer call (or a stop) won while the stems were decoding
		if (token !== bgmToken || currentBgm !== mode) return;
		const bus = ensureMusicBus(ctx);
		const targets = stemTargets(mode);
		const at = ctx.currentTime + 0.05;
		const { loop } = MUSIC[mode];
		for (const [key, buffer] of Object.entries(buffers)) {
			const gain = ctx.createGain();
			gain.gain.setValueAtTime(0.0001, at);
			gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, targets[key] ?? 0), at + 0.8);
			const src = ctx.createBufferSource();
			src.buffer = buffer;
			src.loop = true;
			src.loopStart = MUSIC_PAD;
			src.loopEnd = MUSIC_PAD + loop;
			src.connect(gain).connect(bus);
			src.start(at, MUSIC_PAD);
			stemNodes[key] = { src, gain };
		}
	}

	function stopBgm() {
		bgmToken++;
		stopStems(0.4);
		currentBgm = null;
	}

	// Duck the score under a fanfare, then bring it back.
	function duckMusic(seconds: number, depth = 0.3) {
		const ctx = audioCtx;
		if (!ctx || !duckGain) return;
		const g = duckGain.gain;
		g.cancelScheduledValues(ctx.currentTime);
		g.setValueAtTime(Math.max(0.0001, g.value), ctx.currentTime);
		g.exponentialRampToValueAtTime(depth, ctx.currentTime + 0.12);
		g.setValueAtTime(depth, ctx.currentTime + seconds);
		g.exponentialRampToValueAtTime(1, ctx.currentTime + seconds + 1.0);
	}

	// Keep music volume in sync with settings (a mute is a mute: no ramp).
	$effect(() => {
		const vol = stateSoundDerived.volumeMusic();
		if (musicBus && audioCtx) {
			musicBus.gain.cancelScheduledValues(audioCtx.currentTime);
			musicBus.gain.setValueAtTime(vol, audioCtx.currentTime);
		}
	});

	// The free-spin score builds with the Cook meter.
	$effect(() => {
		void context.stateGame.banditMeter?.level;
		if (currentBgm === 'freespin') applyStemLevels(1.6);
	});

	context.eventEmitter.subscribeOnMount({
		// ui
		soundBetMode: async ({ betModeKey }) => {
			void betModeKey;
			playBgm('base');
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
					// 0.7 puts the press at 64% of the reel blast's punch (loudest
					// 50ms window, both at the volume they actually play): the brief
					// was 60-70%. Measured rather than judged by ear, because the
					// first version sounded weak for a reason a volume knob does not
					// fix - almost all of it was 48-138Hz body, 13dB down above
					// 300Hz, which is the part a laptop speaker reproduces. The
					// bolt and door carry it now; see design/generate_audio_heist.py.
					playCnSfx('safe_open', 0.8);
				} else {
					playCnSfx('btn', 0.7);
				}
			});
		},
		soundPressBet: () => {
			playCnSfx('spin', 0.9);
			markPlaying();
		},
		// scatterCounter
		soundScatterCounterIncrease: () => {context.stateGame.scatterCounter++;if(context.stateGame.scatterCounter===3){context.eventEmitter.broadcast({type:'mascotFsTrigger'});context.eventEmitter.broadcast({type:'scatterDing'});}},
		soundScatterCounterClear: () => (context.stateGame.scatterCounter = 0),
		// game
		soundMusic: ({ name }) => {
			if (name === 'bgm_main') {
				playBgm('base');
			} else if (name === 'bgm_freespin') {
				playBgm('freespin');
			} else {
				// win-level music (bgm_winlevel_*) is deliberately not switched to:
				// the fanfares in soundWinTier sit over the running bed instead
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
				playCnSfx('bill_counter', 0.7);
			} else if (name === 'sfx_anticipation') {
				// covered by the reel_tension tremolo loop (soundReelTensionStart)
			}
		},
		soundOnce: ({ name, forcePlay }) => {
			void forcePlay;
			const mapped = SPRITE_TO_CN[name];
			if (mapped) playCnSfx(mapped.name, mapped.volume ?? 1, mapped.rate ?? 1);
			// autoplay never presses the button, but its reels still land
			if (name === 'sfx_reel_stop_1') markPlaying();
		},
		soundFreeGameBell: () => {
			playCnSfx('alarm_bell');
			duckMusic(2.0, 0.45);
		},
		soundBigWinBlast: () => playCnSfx('bigwin_slam'),
		// FIVE TIERS THAT USED TO SOUND IDENTICAL. Big and max both got the bed,
		// one blast and the coin shimmer. Each tier now adds its own fanfare, built
		// to escalate on length, voice count, register and percussion density
		// (design/generate_audio_heist.py). Literal calls per case, not a lookup:
		// design/check_audio.mjs reads cue names out of playCnSfx(...) and a name
		// held in a variable is not checked.
		// Louder on each rung, so the climb is heard as well as seen: 0.5 at the
		// first step up to 0.85 at the top.
		// the shutter hitting the floor and the free-spin count stamped onto the
		// plan: one rubber-stamp slam, reused (the file kept its gen-4 name)
		soundCookSlice: () => playCnSfx('sack_throw', 0.9, 1.25),
		soundCookChop: () => { playCnSfx('shutter_slam', 0.9); playCnSfxLayered('collect_stamp', 0.6, 1.1); },
		soundStamp: () => playCnSfx('shutter_slam', 0.9),
		soundLadderUp: ({ level }) =>
			playCnSfx('tumbler_up', Math.min(0.85, 0.35 + 0.13 * level), 1 + 0.06 * Math.max(0, level - 1)),
		soundSackLand: () => playCnSfx('sack_land', 0.55),
		soundCollectGrab: () => playCnSfx('collect_grab', 0.8),
		// each sack into the bag a little higher than the last, so a long
		// collect climbs instead of repeating
		soundCoinIn: ({ index }) => playCnSfxLayered('coin_in', 0.7, Math.min(1.6, 1 + 0.07 * index)),
		soundCollectStamp: () => playCnSfx('collect_stamp', 0.9),
		soundShutterDown: () => playCnSfx('shutter_down', 0.85),
		soundDoorSlide: () => playCnSfx('door_slide', 0.8),
		soundDoorClack: () => playCnSfx('door_clack', 1),
		soundDoorOpen: () => playCnSfx('door_open', 0.7),
		soundDoorWheel: () => playCnSfx('safe_open', .7),
		soundDoorSteam: () => playCnSfx('door_steam', .7),
		soundUiHover: () => playCnSfx('hover', .5),
		soundFsOutro: () => playCnSfx('fs_outro', .9),
		// Each fanfare is written to its tier's presentation length (big 1.8 s,
		// super/mega 3.6 s, epic 7 s, max 9 s) and the score ducks under it.
		soundWinTier: ({ tier }) => {
			if (tier === 'big') playCnSfx('win_big', 0.8);
			else if (tier === 'superwin') playCnSfx('win_super', 0.8);
			else if (tier === 'mega') playCnSfx('win_mega', 0.82);
			else if (tier === 'epic') playCnSfx('win_epic', 0.85);
			else if (tier === 'max') playCnSfx('win_max', 0.88);
			const length: Record<string, number> = { big: 2.2, superwin: 4.2, mega: 4.2, epic: 7.8, max: 10 };
			duckMusic(length[tier] ?? 2.5);
		},
		soundMonkeyExpand: () => playCnSfx('bandit_land'),
		// Deliberately NOT forced through the turbo gate that silences ordinary
		// one-shots: these are tied to animations that play at their own length
		// whatever the spin speed, so a dropped one is a character opening his
		// mouth in silence.
		soundMascotVoice: ({ name }) => {
			const family=MASCOT_VOICE_FILE[context.stateGame.gameType === 'freegame' ? 'freegame' : 'basegame'][name];
			const i=voiceTake[family]??0;voiceTake[family]=i+1;
			const suffix=['','_b','_c'][i%3];
			playCnSfx(`${family}${suffix}` as CnSfxName,MASCOT_VOICE_GAIN[name]);
		},
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
				stopCnLoop('bill_counter');
				stopCnSfx('bill_counter');
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

		playBgm('base');

		return () => {
			stopBgm();
			if (leadIdleTimer) clearTimeout(leadIdleTimer);
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
			musicBus = null;
			duckGain = null;
		};
	});
</script>
