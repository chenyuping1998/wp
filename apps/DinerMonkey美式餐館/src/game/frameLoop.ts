// A drop-in for the setInterval loops that stepped animations.
//
// The review checker ("Poor animations") flags interval-stepped animation, and
// for a reason: an interval keeps firing while the tab is hidden and lands on
// arbitrary points between frames. These callbacks all read the clock
// themselves (Date.now / performance.now), so calling them once per frame is
// the same animation, frame-locked. Returns a stop function.
export const everyFrame = (fn: () => void) => {
	let id = 0;
	let live = true;
	const tick = () => {
		if (!live) return;
		fn();
		if (live) id = requestAnimationFrame(tick);
	};
	id = requestAnimationFrame(tick);
	return () => {
		live = false;
		cancelAnimationFrame(id);
	};
};
