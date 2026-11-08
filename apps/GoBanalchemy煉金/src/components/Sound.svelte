<script lang="ts" module>
	import { type MusicName, type SoundEffectName, type SoundName } from '../game/sound';
	import { HOLD_AND_SPIN_MODE_KEY } from '../game/constants';

	// What the mascot can say. One clip per animation — see
	// design/generate_voice.mjs, which synthesizes them.
	export type MascotVoice = 'roar' | 'effort';

	export type EmitterEventSound =
		| { type: 'soundMusic'; name: MusicName }
		| { type: 'soundOnce'; name: SoundEffectName; forcePlay?: boolean }
		| { type: 'soundLoop'; name: SoundEffectName }
		| { type: 'soundStop'; name: SoundName }
		| {
				type: 'soundFade';
				name: SoundName;
				from: number;
				to: number;
				duration: number;
		  }
		| { type: 'soundFreeGameBell' }
		| { type: 'soundBigWinBlast' }
		| { type: 'soundWinTier'; tier: string }
		| { type: 'soundFullBoardChain' }
		| { type: 'soundFullBoardStamp' }
		| { type: 'soundCaveQuake' }
		| { type: 'soundLadderUp'; level: number }
		| { type: 'soundDynamiteBlast' }
		| { type: 'soundBlastFuse' }
		| { type: 'soundBlastDetonate'; full: boolean }
		| { type: 'soundBlastShatter' }
		| { type: 'soundBlastSmoke' }
		| { type: 'soundBlastReveal' }
		| { type: 'soundMonkeyExpand' }
		| { type: 'soundMascotVoice'; name: MascotVoice }
		| { type: 'soundChestHoot' }
		| { type: 'soundReelTensionStart' }
		| { type: 'soundReelTensionStop' }
		| { type: 'soundScatterCounterIncrease' }
		| { type: 'soundScatterCounterClear' }
		// the win wake, one per lit reel (WinWays): an ascending note per step
		| { type: 'soundWinStep'; step: number }
		// the winning symbols of one reel coming down from their leap
		| { type: 'soundWinLand'; heavy: boolean; count: number }
		// a small/medium win's amount rolling (Win.svelte): ticks, then the landing
		| { type: 'soundCountUp'; phase: 'start' | 'end' };
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { stateBet, stateSoundDerived } from 'state-shared';
	import { waitForTimeout } from 'utils-shared/wait';
	import { getContext } from '../game/context';
	import musicLoops from '../game/sampledAudioLoops';
	import { setBeatClock } from '../game/beatClock';
	const context = getContext();
	type CnSfxName = SoundEffectName
		| 'gong_feature'
		| 'bigwin_blast'
		| 'reel_tension'
		| 'btn'
		| 'spin'
		| 'pluck_low'
		| 'win_gliss'
		| 'win_gliss_big'
		| 'fs_intro'
		| 'coin_shimmer'
		| 'wild_expand'
		| 'mult_update'
		| 'grenade_blast'
		| 'win_panel'
		| 'win_cap'
		| 'win_big'
		| 'win_super'
		| 'win_mega'
		| 'win_epic'
		| 'win_max'
		| 'win_rollup_loop'
		| 'win_rollup_end'
		| 'monkey_expand'
		| 'voice_roar'
		| 'voice_effort'
		| 'reel_stop_1'
		| 'reel_stop_2'
		| 'reel_stop_3'
		| 'reel_stop_4'
		| 'reel_stop_5'
		| 'scatter_1'
		| 'scatter_2'
		| 'scatter_3'
		| 'scatter_4'
		| 'scatter_5'
		| 'press_blast'
		| 'fuse_sizzle'
		| 'dynamite_blast'
		| 'dynamite_blast_big'
		| 'symbol_shatter'
		| 'smoke_puff'
		| 'symbol_reveal'
		| 'ladder_up'
		| 'cave_quake'
		| 'fullboard_chain'
		| 'fullboard_stamp'
		| 'win_step_1'
		| 'win_step_2'
		| 'win_step_3'
		| 'win_step_4'
		| 'win_step_5'
		| 'win_land'
		| 'win_land_big'
		| 'win_rollup_fg'
		| 'win_count_end'
		| 'reel_tension_fg'
	;
	const CN_SFX_FILES: Record<CnSfxName, string> = {
		gong_feature: 'alchemy/gong_feature.wav',
		bigwin_blast: 'alchemy/bigwin_blast.wav',
		reel_tension: 'alchemy/reel_tension_beat.wav',
		reel_tension_fg: 'alchemy/reel_tension_fg.wav',
		btn: 'alchemy/btn.wav',
		spin: 'alchemy/spin.wav',
		pluck_low: 'alchemy/pluck_low.wav',
		win_gliss: 'alchemy/win_gliss.wav',
		win_gliss_big: 'alchemy/win_gliss_big.wav',
		fs_intro: 'alchemy/fs_intro.wav',
		coin_shimmer: 'alchemy/coin_shimmer.wav',
		wild_expand: 'alchemy/wild_expand.wav',
		mult_update: 'alchemy/mult_update.wav',
		grenade_blast: 'alchemy/grenade_blast.wav',
		win_panel: 'alchemy/win_panel.wav',
		win_cap: 'alchemy/win_cap.wav',
		win_big: 'alchemy/win_big.wav',
		win_super: 'alchemy/win_super.wav',
		win_mega: 'alchemy/win_mega.wav',
		win_epic: 'alchemy/win_epic.wav',
		win_max: 'alchemy/win_max.wav',
		win_rollup_loop: 'alchemy/win_rollup_loop.wav',
		win_rollup_end: 'alchemy/win_rollup_end.wav',
		monkey_expand: 'alchemy/monkey_expand.wav',
		voice_roar: 'alchemy/voice_roar.wav',
		voice_effort: 'alchemy/voice_effort.wav',
		reel_stop_1: 'alchemy/reel_stop_1.wav',
		reel_stop_2: 'alchemy/reel_stop_2.wav',
		reel_stop_3: 'alchemy/reel_stop_3.wav',
		reel_stop_4: 'alchemy/reel_stop_4.wav',
		reel_stop_5: 'alchemy/reel_stop_5.wav',
		scatter_1: 'alchemy/scatter_1.wav',
		scatter_2: 'alchemy/scatter_2.wav',
		scatter_3: 'alchemy/scatter_3.wav',
		scatter_4: 'alchemy/scatter_4.wav',
		scatter_5: 'alchemy/scatter_5.wav',
		press_blast: 'alchemy/press_blast.wav',
		fuse_sizzle: 'alchemy/fuse_sizzle.wav',
		dynamite_blast: 'alchemy/dynamite_blast.wav',
		dynamite_blast_big: 'alchemy/dynamite_blast_big.wav',
		symbol_shatter: 'alchemy/symbol_shatter.wav',
		smoke_puff: 'alchemy/smoke_puff.wav',
		symbol_reveal: 'alchemy/symbol_reveal.wav',
		ladder_up: 'alchemy/ladder_up.wav',
		cave_quake: 'alchemy/cave_quake.wav',
		fullboard_chain: 'alchemy/fullboard_chain.wav',
		fullboard_stamp: 'alchemy/fullboard_stamp.wav',
		win_step_1: 'alchemy/win_step_1.wav',
		win_step_2: 'alchemy/win_step_2.wav',
		win_step_3: 'alchemy/win_step_3.wav',
		win_step_4: 'alchemy/win_step_4.wav',
		win_step_5: 'alchemy/win_step_5.wav',
		win_land: 'alchemy/win_land.wav',
		win_land_big: 'alchemy/win_land_big.wav',
		win_rollup_fg: 'alchemy/win_rollup_fg.wav',
		win_count_end: 'alchemy/win_count_end.wav',
		jng_intro_fs: 'alchemy/fs_intro.wav',
		sfx_anticipation: 'alchemy/reel_tension_beat.wav',
		sfx_anticipation_start: 'alchemy/mult_update.wav',
		sfx_bigwin_coinloop: 'alchemy/win_rollup_loop.wav',
		sfx_btn_general: 'alchemy/btn.wav',
		sfx_btn_spin: 'alchemy/spin.wav',
		sfx_fs_respins: 'alchemy/mult_update.wav',
		sfx_multiplier_landing: 'alchemy/pluck_low.wav',
		sfx_multiplier_up: 'alchemy/ladder_up.wav',
		sfx_multiplier_update: 'alchemy/mult_update.wav',
		sfx_multiplier_reset: 'alchemy/btn.wav',
		sfx_multiplier_win: 'alchemy/win_gliss_big.wav',
		sfx_multiplier_combine_a: 'alchemy/mult_update.wav',
		sfx_multiplier_combine_b: 'alchemy/mult_update.wav',
		sfx_multiplier_explosion_a: 'alchemy/grenade_blast.wav',
		sfx_multiplier_explosion_b: 'alchemy/grenade_blast.wav',
		sfx_multiplier_explosion_c: 'alchemy/grenade_blast.wav',
		sfx_royals_landing: 'alchemy/reel_stop_3.wav',
		sfx_symbols_landing: 'alchemy/reel_stop_3.wav',
		sfx_scatter_reveal: 'alchemy/scatter_1.wav',
		sfx_scatter_win: 'alchemy/win_gliss.wav',
		sfx_scatter_win_v2: 'alchemy/win_gliss_big.wav',
		sfx_superfreespin: 'alchemy/win_gliss_big.wav',
		sfx_wild_explode: 'alchemy/wild_expand.wav',
		sfx_winlevel_end: 'alchemy/win_cap.wav',
		sfx_winlevel_nice: 'alchemy/win_gliss.wav',
		sfx_winlevel_small: 'alchemy/win_gliss.wav',
		sfx_winlevel_standard: 'alchemy/win_gliss.wav',
		sfx_winlevel_substantial: 'alchemy/win_gliss_big.wav',
		sfx_youwon_panel: 'alchemy/win_panel.wav',
		sfx_reel_stop_1: 'alchemy/reel_stop_1.wav',
		sfx_scatter_stop_1: 'alchemy/scatter_1.wav',
		sfx_reel_stop_2: 'alchemy/reel_stop_2.wav',
		sfx_scatter_stop_2: 'alchemy/scatter_2.wav',
		sfx_reel_stop_3: 'alchemy/reel_stop_3.wav',
		sfx_scatter_stop_3: 'alchemy/scatter_3.wav',
		sfx_reel_stop_4: 'alchemy/reel_stop_4.wav',
		sfx_scatter_stop_4: 'alchemy/scatter_4.wav',
		sfx_reel_stop_5: 'alchemy/reel_stop_5.wav',
		sfx_scatter_stop_5: 'alchemy/scatter_5.wav',
		tumble_win_1: 'alchemy/win_gliss.wav',
		tumble_win_2: 'alchemy/win_gliss.wav',
		tumble_win_3: 'alchemy/win_gliss.wav',
		tumble_win_4: 'alchemy/win_gliss_big.wav',
	};
	const BGM_FILES = { base: 'alchemy/bgm_main.mp3', freespin: 'alchemy/bgm_freespin.mp3' };
	type Voice = {
		source: AudioBufferSourceNode;
		gain: GainNode;
		category: 'music' | 'effect';
		level: number;
		name: string;
	};
	let ctx: AudioContext | undefined;
	let master: DynamicsCompressorNode | undefined;
	let disposed = false;
	let musicGeneration = 0;
	let currentMusic: string | undefined;
	let musicVoice: Voice | undefined;
	let duckUntil = 0;
	let duckLevel = .42;
	const voices = new Set<Voice>();
	const loops = new Map<string, Voice>();
	const requests = new Map<string, number>();
	const buffers = new Map<string, Promise<AudioBuffer>>();
	type Fade = { from: number; to: number; start: number; end: number };
	const fades = new Map<string, Fade>();
	const fadeValue = (v: Voice) => {
		const f = fades.get(v.category === 'music' ? 'music' : v.name);
		if (!f) return 1;
		const t = Math.max(
			0,
			Math.min(1, (performance.now() - f.start) / Math.max(1, f.end - f.start)),
		);
		return f.from + (f.to - f.from) * t;
	};
	const preference = (v: Voice) =>
		v.category === 'music'
			? stateSoundDerived.volumeMusic() * (performance.now() < duckUntil ? duckLevel : 0.7)
			: stateSoundDerived.volumeSoundEffect();
	const audioContext = () => {
		if (!ctx) {
			ctx = new AudioContext();
			master = ctx.createDynamicsCompressor();
			master.threshold.value = -4;
			master.knee.value = 4;
			master.ratio.value = 4;
			master.attack.value = 0.003;
			master.release.value = 0.16;
			const output = ctx.createGain();
			output.gain.value = 0.82;
			master.connect(output);
			output.connect(ctx.destination);
		}
		if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
		return ctx;
	};
	// Bus compression and output headroom protect overlapping foreground cues.
	const volume = (v: Voice) => Math.min(1.5, Math.max(0, v.level * preference(v) * fadeValue(v)));
	const load = (file: string) => {
		let pending = buffers.get(file);
		if (!pending) {
			const ac = audioContext();
			pending = fetch(base + '/assets/audio/' + file + '?v=sampled-v3-rhythm-20261106').then(async (response) => {
				if (!response.ok) throw new Error('Audio asset ' + file + ': ' + response.status);
				const decoded = await ac.decodeAudioData(await response.arrayBuffer());
				const meta = file === BGM_FILES.base ? musicLoops.bgm_main : file === BGM_FILES.freespin ? musicLoops.bgm_freespin : undefined;
				if (!meta) return decoded;
				const start = Math.round(meta.trimStartSeconds * decoded.sampleRate);
				const length = Math.round(meta.frames * decoded.sampleRate / meta.sampleRate);
				if (start + length > decoded.length) throw new Error('Incomplete MP3 loop');
				const buffer = ac.createBuffer(decoded.numberOfChannels, length, decoded.sampleRate);
				for (let channel = 0; channel < decoded.numberOfChannels; channel++)
					buffer.copyToChannel(decoded.getChannelData(channel).subarray(start, start + length), channel);
				return buffer;
			});
			buffers.set(file, pending);
			pending.catch(() => buffers.delete(file));
		}
		return pending;
	};
	const stopVoice = (v: Voice, seconds = 0.045) => {
		if (!ctx) return;
		voices.delete(v);
		v.gain.gain.cancelScheduledValues(ctx.currentTime);
		v.gain.gain.setTargetAtTime(0, ctx.currentTime, seconds / 3);
		try {
			v.source.stop(ctx.currentTime + seconds);
		} catch {
			/* already ended */
		}
	};
	const startVoice = (
		name: string,
		buffer: AudioBuffer,
		category: Voice['category'],
		level: number,
		loop = false,
		rate = 1,
		delay = 0,
	) => {
		const ac = audioContext(),
			source = ac.createBufferSource(),
			gain = ac.createGain();
		source.buffer = buffer;
		source.loop = loop;
		source.playbackRate.value = rate;
		source.connect(gain);
		gain.connect(master ?? ac.destination);
		const voice: Voice = { source, gain, category, level, name };
		// a cue put on the bed's grid starts in the future, sample-exact
		const at = ac.currentTime + Math.max(0, delay);
		gain.gain.setValueAtTime(0, at);
		gain.gain.linearRampToValueAtTime(volume(voice), at + (category === 'music' ? 0.45 : loop ? 0.12 : 0.003));
		source.onended = () => {
			voices.delete(voice);
			source.disconnect();
			gain.disconnect();
		};
		voices.add(voice);
		source.start(at);
		return voice;
	};
	const refreshMix = () => {
		if (!ctx || disposed) return;
		for (const v of voices) {
			const f = fades.get(v.category === 'music' ? 'music' : v.name);
			if (f && f.end > performance.now()) {
				v.gain.gain.cancelScheduledValues(ctx.currentTime);
				v.gain.gain.setValueAtTime(volume(v), ctx.currentTime);
				v.gain.gain.linearRampToValueAtTime(
					Math.min(1, v.level * preference(v) * f.to),
					ctx.currentTime + Math.max(0, (f.end - performance.now()) / 1000),
				);
			} else v.gain.gain.setTargetAtTime(volume(v), ctx.currentTime, v.category === 'music' ? .12 : .04);
		}
	};
	const duckMusic = (ms = 900, depth = .42) => {
		const now = performance.now();
		duckLevel = Math.min(now < duckUntil ? duckLevel : 1, depth);
		duckUntil = Math.max(duckUntil, now + ms);
		refreshMix();
	};
	// Seconds from now to the next line of the bed's grid (division per beat),
	// read off the audio clock so a cue started with it is sample-exact on the
	// drums. 0 with no bed. See game/beatClock.ts.
	let bedAnchor = 0;
	let bedBpm = 0;
	const toGrid = (division: number, slack = .03) => {
		if (!ctx || !bedBpm) return 0;
		const period = 60 / bedBpm / division;
		const into = (ctx.currentTime - bedAnchor) % period;
		const left = into < 0 ? -into : period - into;
		return left <= slack || period - left <= slack ? 0 : left;
	};
	async function playCnSfx(name: CnSfxName, level = 1, rate = 1, delay = 0) {
		if (disposed) return;
		const requested = performance.now();
		const generation = requests.get(name) ?? 0;
		audioContext();
		try {
			const buffer = await load(CN_SFX_FILES[name]);
			if (disposed || performance.now() - requested > 350 || generation !== (requests.get(name) ?? 0)) return;
			// Polyphony retains glass tails when several reels stop together.
			const active = [...voices].filter((v) => v.category === 'effect' && !v.source.loop);
			if (active.length >= 18) stopVoice(active[0]);
			startVoice(name, buffer, 'effect', level, false, rate, delay);
		} catch (error) {
			console.warn('Alchemy cue failed:', name, error);
		}
	}
	async function playCnLoop(name: CnSfxName, level = 1, delay = 0) {
		if (disposed || loops.has(name)) return;
		const ticket = (requests.get(name) ?? 0) + 1;
		requests.set(name, ticket);
		try {
			const buffer = await load(CN_SFX_FILES[name]);
			if (disposed || requests.get(name) !== ticket || loops.has(name)) return;
			loops.set(name, startVoice(name, buffer, 'effect', level, true, 1, delay));
		} catch (error) {
			console.warn('Alchemy loop failed:', name, error);
		}
	}
	let lastReelStop = -1e9;
	function stopCnSfx(name: string, seconds = 0.045) {
		requests.set(name, (requests.get(name) ?? 0) + 1);
		for (const v of voices) if (v.name === name) stopVoice(v, seconds);
		loops.delete(name);
		fades.delete(name);
	}
	async function playBgm(type: 'base' | 'freespin') {
		if (disposed || currentMusic === type) return;
		const ticket = ++musicGeneration;
		currentMusic = type;
		try {
			const buffer = await load(BGM_FILES[type]);
			if (disposed || ticket !== musicGeneration) return;
			if (musicVoice) stopVoice(musicVoice, 0.45);
			musicVoice = startVoice('bgm_' + type, buffer, 'music', 1, true);
			// the bed's sample 0 is beat 1 of bar 1, and it loops on the bar
			const live = ctx;
			bedAnchor = live?.currentTime ?? 0;
			bedBpm = (type === 'base' ? musicLoops.bgm_main : musicLoops.bgm_freespin).bpm;
			setBeatClock({ now: () => live?.currentTime ?? 0, anchor: bedAnchor, bpm: bedBpm });
		} catch (error) {
			if (ticket === musicGeneration) currentMusic = undefined;
			console.warn('Alchemy music failed:', error);
		}
	}
	function stopBgm() {
		musicGeneration++;
		currentMusic = undefined;
		if (musicVoice) stopVoice(musicVoice, 0.12);
		musicVoice = undefined;
		bedBpm = 0;
		setBeatClock(null);
	}
	const effects: Partial<Record<SoundEffectName, { name: CnSfxName; level?: number; rate?: number }>> = {
		jng_intro_fs: { name: 'fs_intro', rate: 1 },
		sfx_anticipation: { name: 'reel_tension', rate: 1 },
		sfx_anticipation_start: { name: 'mult_update', rate: 1 },
		sfx_bigwin_coinloop: { name: 'win_rollup_loop', rate: 1 },
		sfx_btn_general: { name: 'btn', rate: 1 },
		sfx_btn_spin: { name: 'spin', rate: 1 },
		sfx_fs_respins: { name: 'mult_update', rate: 1 },
		sfx_multiplier_landing: { name: 'pluck_low', rate: 1 },
		sfx_multiplier_up: { name: 'ladder_up', rate: 1 },
		sfx_multiplier_update: { name: 'mult_update', rate: 1 },
		sfx_multiplier_reset: { name: 'btn', rate: 1 },
		sfx_multiplier_win: { name: 'win_gliss_big', rate: 1 },
		sfx_multiplier_combine_a: { name: 'mult_update', rate: 1 },
		sfx_multiplier_combine_b: { name: 'mult_update', rate: 1 },
		sfx_multiplier_explosion_a: { name: 'grenade_blast', rate: 1 },
		sfx_multiplier_explosion_b: { name: 'grenade_blast', rate: 1 },
		sfx_multiplier_explosion_c: { name: 'grenade_blast', rate: 1 },
		sfx_royals_landing: { name: 'reel_stop_3', rate: 1 },
		sfx_symbols_landing: { name: 'reel_stop_3', rate: 1 },
		sfx_scatter_reveal: { name: 'scatter_1', rate: 1 },
		sfx_scatter_win: { name: 'win_gliss', rate: 1 },
		sfx_scatter_win_v2: { name: 'win_gliss_big', rate: 1 },
		sfx_superfreespin: { name: 'win_gliss_big', rate: 1 },
		sfx_wild_explode: { name: 'wild_expand', rate: 1 },
		sfx_winlevel_end: { name: 'win_cap', rate: 1 },
		sfx_winlevel_nice: { name: 'win_gliss', rate: 1 },
		sfx_winlevel_small: { name: 'win_gliss', rate: 1 },
		sfx_winlevel_standard: { name: 'win_gliss', rate: 1 },
		sfx_winlevel_substantial: { name: 'win_gliss_big', rate: 1 },
		sfx_youwon_panel: { name: 'win_panel', rate: 1 },
		sfx_reel_stop_1: { name: 'reel_stop_1', rate: 1, level: 0.6 },
		sfx_scatter_stop_1: { name: 'scatter_1', rate: 1 },
		sfx_reel_stop_2: { name: 'reel_stop_2', rate: 1, level: 0.6 },
		sfx_scatter_stop_2: { name: 'scatter_2', rate: 1 },
		sfx_reel_stop_3: { name: 'reel_stop_3', rate: 1, level: 0.6 },
		sfx_scatter_stop_3: { name: 'scatter_3', rate: 1 },
		sfx_reel_stop_4: { name: 'reel_stop_4', rate: 1, level: 0.6 },
		sfx_scatter_stop_4: { name: 'scatter_4', rate: 1 },
		sfx_reel_stop_5: { name: 'reel_stop_5', rate: 1, level: 0.6 },
		sfx_scatter_stop_5: { name: 'scatter_5', rate: 1 },
		tumble_win_1: { name: 'win_gliss', rate: 1 },
		tumble_win_2: { name: 'win_gliss', rate: 1 },
		tumble_win_3: { name: 'win_gliss', rate: 1 },
		tumble_win_4: { name: 'win_gliss_big', rate: 1 },
	};

	const onFeature = () =>
		context.stateGame.gameType === 'freegame' || context.stateGame.gameType === 'holdandspin';
	// The tier fanfares run at the base bed's 128 BPM. Over the feature's 154
	// bed they would flam against its drums, so the bed goes further down there.
	const fanfareDuck = () => (onFeature() ? .22 : .38);
	let lastWinLand = -1e9;
	let rollupActive = false;
	let rollupEndTimer: ReturnType<typeof setTimeout> | undefined;
	let monkeyTimer: ReturnType<typeof setTimeout> | undefined;
	function playMonkeyCall() {
		clearTimeout(monkeyTimer);
		stopCnSfx('monkey_expand');
		void playCnSfx('monkey_expand', 0.5);
		// The alchemist performance is already cut to its approved animation.
	}
	// light: a small or medium win's count (soundCountUp) — the same ticks,
	// quieter, no coin shimmer, and a two-note answer instead of the big close
	let rollupLight = false;
	function startRollup(light = false) {
		if (rollupActive || disposed) return;
		clearTimeout(rollupEndTimer);
		stopCnSfx('win_rollup_end');
		stopCnSfx('win_count_end');
		rollupActive = true;
		rollupLight = light;
		if (!light) void playCnSfx('coin_shimmer', 0.65);
		// The ticks are sixteenths of the bed, rendered at each bed's tempo, and
		// start on a sixteenth so they lock to the drums instead of flamming.
		void playCnLoop(onFeature() ? 'win_rollup_fg' : 'win_rollup_loop', light ? 0.42 : 0.65, toGrid(4));
	}
	function finishRollup() {
		if (!rollupActive) return;
		rollupActive = false;
		stopCnSfx('win_rollup_loop', 0.12);
		stopCnSfx('win_rollup_fg', 0.12);
		stopCnSfx('coin_shimmer');
		// the number has landed on this frame: answer it now, not 120ms later
		if (rollupLight) {
			rollupLight = false;
			void playCnSfx('win_count_end', 0.7);
			return;
		}
		rollupEndTimer = setTimeout(() => {
			if (!disposed) void playCnSfx('win_rollup_end', 0.75);
		}, 120);
	}
	// The anticipation bed: eighths of the bed it plays over, starting on a
	// sixteenth, so the tease drives the same pulse the music does.
	function startTension(level: number) {
		const name = onFeature() ? 'reel_tension_fg' : 'reel_tension';
		void playCnLoop(name, level, toGrid(4));
	}
	function stopTension() {
		stopCnSfx('reel_tension');
		stopCnSfx('reel_tension_fg');
	}
	$effect(() => {
		stateSoundDerived.volumeMusic();
		stateSoundDerived.volumeSoundEffect();
		refreshMix();
	});
	context.eventEmitter.subscribeOnMount({
		soundPressGeneral: () => void playCnSfx('btn', .65),
		soundPressBet: () => void playCnSfx('spin', .75),
		soundBetMode: ({ betModeKey }) => void playBgm(betModeKey === HOLD_AND_SPIN_MODE_KEY ? 'freespin' : 'base'),
		soundMusic: ({ name }) => {
			if (name === 'bgm_main') void playBgm('base');
			else if (name === 'bgm_freespin') void playBgm('freespin');
			else {
				duckMusic(1500, fanfareDuck());
				void playCnSfx(
					name === 'bgm_winlevel_max'
						? 'win_max'
						: name === 'bgm_winlevel_epic'
							? 'win_epic'
							: name === 'bgm_winlevel_mega'
								? 'win_mega'
								: name === 'bgm_winlevel_superwin'
									? 'win_super'
									: 'win_big',
					0.8,
					1,
					toGrid(2),
				);
			}
		},
		soundOnce: ({ name }) => {
			if (name === 'sfx_bigwin_coinloop') { startRollup(); return; }
			const m = effects[name];
			let level = m?.level ?? 0.8;
			if (name.startsWith('sfx_reel_stop_')) {
				// TURBO stops all five reels within a few ms: five full-level stops
				// stacked ~7 dB over one (user, 2026-10-16: turbo 停輪音太大聲). Quieter
				// in turbo, and any stop right on the heels of another at half.
				//
				// 2026-11-06 (user: 動畫跟音效節奏要更強): the five stops are the
				// spin's own rhythm and sat ~10 dB under the bed — 0.5 on files
				// mastered at -8 dB, the first of them mostly below 400 Hz. Re-cut
				// into the 400-4000 Hz band (build_sampled_audio.stop_click) and
				// laid out like Bananeon's: each reel a step louder than the last,
				// so the run of five reads as a phrase that arrives somewhere.
				const now = performance.now();
				const reel = Number(name.slice(-1)) || 1;
				level = 0.66 + (reel - 1) * 0.05;
				if (stateBet.isTurbo) level *= 0.5;
				if (now - lastReelStop < 60) level *= 0.5;
				lastReelStop = now;
			}
			void playCnSfx(m?.name ?? name, level, m?.rate ?? 1);
		},
		soundLoop: ({ name }) => {
			const m = effects[name];
			if (name === 'sfx_bigwin_coinloop') startRollup();
			else if (name === 'sfx_anticipation') startTension(m?.level ?? 0.7);
			else void playCnLoop(m?.name ?? name, m?.level ?? 0.7);
		},
		soundStop: ({ name }) => {
			if (name === 'sfx_bigwin_coinloop') finishRollup();
			else if (name === 'sfx_anticipation') stopTension();
			else if (name.startsWith('bgm_')) stopBgm();
			else stopCnSfx(effects[name as SoundEffectName]?.name ?? name);
		},
		soundCountUp: ({ phase }) => (phase === 'start' ? startRollup(true) : finishRollup()),
		soundFade: async ({ name, from, to, duration }) => {
			const resolved = name.startsWith('bgm_')
				? 'music'
				: (effects[name as SoundEffectName]?.name ?? name);
			const now = performance.now();
			// the tension bed has a feature-tempo twin under its own name
			if (resolved === 'reel_tension') fades.set('reel_tension_fg', { from, to, start: now, end: now + duration });
			fades.set(resolved, { from, to, start: now, end: now + duration });
			refreshMix();
			await waitForTimeout(duration);
			if (!disposed) refreshMix();
		},
		soundFreeGameBell: () => {
			duckMusic(1400, .30);
			void playCnSfx('gong_feature');
		},
		soundBigWinBlast: () => {
			duckMusic(1400);
			void playCnSfx('bigwin_blast', 1.05);
		},
		soundWinTier: ({ tier }) => {
			// The blast (soundBigWinBlast) hits on the frame the plaque slams in;
			// the fanfare is music, so it comes in on the bed's next eighth.
			duckMusic(1900, fanfareDuck());
			const on = toGrid(2);
			if (tier === 'big') void playCnSfx('win_big', 1.1, 1, on);
			else if (tier === 'superwin') void playCnSfx('win_super', 1.15, 1, on);
			else if (tier === 'mega') void playCnSfx('win_mega', 1.2, 1, on);
			else if (tier === 'epic') void playCnSfx('win_epic', 1.25, 1, on);
			else if (tier === 'max') void playCnSfx('win_max', 1.3, 1, on);
		},
		// WinWays fires these on its own sixteenth grid, so they play now.
		soundWinStep: ({ step }) => {
			const i = Math.max(1, Math.min(5, Math.round(step)));
			void playCnSfx(`win_step_${i}` as CnSfxName, 0.5 + i * 0.05);
		},
		soundWinLand: ({ heavy, count }) => {
			// several reels can come down inside one frame in turbo: one clink
			const now = performance.now();
			if (now - lastWinLand < 40) return;
			lastWinLand = now;
			void playCnSfx(heavy ? 'win_land_big' : 'win_land', Math.min(0.85, 0.55 + 0.07 * count));
		},
		soundFullBoardChain: () => {
			duckMusic(1300);
			void playCnSfx('fullboard_chain', 0.8);
		},
		soundFullBoardStamp: () => {
			duckMusic(1500);
			void playCnSfx('fullboard_stamp', 0.85);
		},
		soundCaveQuake: () => void playCnSfx('cave_quake', 0.4),
		soundLadderUp: ({ level }) => void playCnSfx('ladder_up', Math.min(0.85, 0.35 + level * 0.1)),
		soundDynamiteBlast: () => void playCnSfx('grenade_blast', 0.7),
		soundBlastFuse: () => { duckMusic(600, .36); void playCnSfx('fuse_sizzle', .72); },
		soundBlastDetonate: ({ full }) => {
			duckMusic(1200, .30);
			void playCnSfx(full ? 'dynamite_blast_big' : 'dynamite_blast', 0.85);
		},
		soundBlastShatter: () => void playCnSfx('symbol_shatter', 0.35),
		soundBlastSmoke: () => void playCnSfx('smoke_puff', 0.55),
		soundBlastReveal: () => void playCnSfx('symbol_reveal', 0.8),
		soundMonkeyExpand: () => playMonkeyCall(),
		soundMascotVoice: ({ name }) =>
			void playCnSfx(name === 'roar' ? 'voice_roar' : 'voice_effort', 0.45),
		soundChestHoot: () => playMonkeyCall(),
		soundReelTensionStart: () => startTension(0.55),
		soundReelTensionStop: () => stopTension(),
		soundScatterCounterIncrease: () => {
			context.stateGame.scatterCounter++;
		},
		soundScatterCounterClear: () => {
			context.stateGame.scatterCounter = 0;
		},
		reelBlastClear: () => {
			for (const name of [
				'fuse_sizzle',
				'dynamite_blast',
				'dynamite_blast_big',
				'smoke_puff',
				'symbol_reveal',
			])
				stopCnSfx(name);
		},
	});
	onMount(() => {
		disposed = false;
		// Bounded predecode avoids late first-play cues and simultaneous fetch spikes.
		const files = [...new Set(Object.values(CN_SFX_FILES))];
		let next = 0;
		const worker = async () => {
			while (!disposed && next < files.length) {
				const file = files[next++];
				try {
					await load(file);
				} catch (error) {
					console.warn(error);
				}
			}
		};
		for (let i = 0; i < 4; i++) void worker();
		void playBgm(stateBet.activeBetModeKey === HOLD_AND_SPIN_MODE_KEY ? 'freespin' : 'base');
		const mixer = setInterval(refreshMix, 100);
		return () => {
			disposed = true;
			bedBpm = 0;
			setBeatClock(null);
			clearTimeout(rollupEndTimer);
			clearTimeout(monkeyTimer);
			rollupActive = false;
			musicGeneration++;
			clearInterval(mixer);
			for (const v of voices)
				try {
					v.source.stop();
				} catch {
					/* already stopped */
				}
			voices.clear();
			loops.clear();
			buffers.clear();
			requests.clear();
			fades.clear();
			void ctx?.close();
			ctx = undefined;
		};
	});
</script>
