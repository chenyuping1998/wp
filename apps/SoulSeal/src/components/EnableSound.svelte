<script lang="ts">
	import { onMount } from 'svelte';

	import type { LoadedAudio } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { sound, type SoundName } from '../game/sound';

	const context = getContext();

	// NOTHING IS LOADED HERE ANY MORE.
	//
	// This used to load the howler sprite named by assets.ts as `sound`. That
	// sprite was 17MB across five encodings and this game never played a single
	// cue from it: Soul Seal's audio is the synthesized set in assets/audio/
	// terminal, played through standalone Audio elements in Sound.svelte, and the
	// three places that still reached for the sprite were all no-ops on a sound
	// that never started - a loop branch no broadcast could reach, a stop for a
	// sound that was not playing, and a fade with nothing on the other end.
	//
	// Its keys give away where it came from: tumble_win_1..5 and
	// sfx_royals_landing, from the tumble game this one was scaffolded out of.
	//
	// The volume and mute effects below stay. They are what the bar's sound toggle
	// drives, and they are independent of anything being loaded.

	sound.enableEffect();
	sound.volumeEffect();
</script>
