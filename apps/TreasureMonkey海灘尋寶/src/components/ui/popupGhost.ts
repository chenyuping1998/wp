/**
 * `Popup` renders its children TWICE.
 *
 * Look at components-shared/src/components/Popup.svelte: it renders
 * `{@render props.children()}` once in a plain `<div>` in normal flow, and again
 * inside `.top-layer`, the fixed full-screen overlay that is the one you see. So
 * every panel in every game in this repo exists twice in the DOM — the first
 * copy laid out under the game canvas, off screen.
 *
 * That copy is invisible but it is REAL: it takes layout space (which is why the
 * document grows taller than the viewport whenever a modal is open), it runs the
 * panel's CSS animations a second time, and — the part that matters — its
 * buttons are focusable and in the tab order. A keyboard user can tab into a BUY
 * button they cannot see and press Enter.
 *
 * This action marks the off-screen copy inert. Attached with `use:` so it runs
 * once per DOM element rather than once per component, which is the only place
 * the two copies can be told apart.
 *
 * It fails SAFE: if Popup's markup ever changes and `.top-layer` is not found,
 * nothing is marked inert and both copies stay interactive — today's behaviour —
 * rather than the panel disappearing.
 */
export const popupGhost = (node: HTMLElement) => {
	// The visible copy lives inside Popup's fixed overlay; the ghost does not.
	if (!node.closest('.top-layer')) {
		node.inert = true;
		node.setAttribute('aria-hidden', 'true');
	}
};
