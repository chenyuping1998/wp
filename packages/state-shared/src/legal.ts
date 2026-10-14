/**
 * The info page's legal notice.
 *
 * This is the SAME wording in every game, which is why it lives here rather
 * than being retyped into each app's ModalGameRules.svelte. A new game should
 * render this constant and never a literal — the text has been corrected once
 * already after certification and the correction had to be applied by hand to
 * each app that had its own copy.
 *
 * Two details are deliberate and must survive any edit:
 *
 *   "wins", "plays", "rounds"  — not "pays", "bets", "spins". The social build
 *   forbids wagering terminology everywhere the player can read, and this
 *   paragraph is player-facing in both builds.
 *
 *   "TM and (c) 2026 Engine"   — NOT "Stake Engine". Certification asked for the
 *   operator's name out of the disclaimer. design/check_social_words.mjs scans
 *   this file and fails the build if "Stake" comes back.
 */
export const LEGAL_NOTICE =
	'Malfunction voids all wins and plays. ' +
	'A consistent internet connection is required. ' +
	'In the event of a disconnection, reload the game to finish any uncompleted rounds. ' +
	'The expected return is calculated over many plays. ' +
	'The game display is not representative of any physical device and is for illustrative purposes only. ' +
	'Winnings are settled according to the amount received from the Remote Game Server ' +
	'and not from events within the web browser. ' +
	'TM and © 2026 Engine.';
