import type { Reroute } from '@sveltejs/kit';

// Engine documents replay links as `…/index.html?replay=true&…`. The game is
// one prerendered page at "/" under a relative base, so a path ending in
// "index.html" matched no route and SvelteKit showed its 404 page (found
// 2026-11-09 testing the staged build; every launch so far has used the
// directory URL, which is why it never surfaced). Serve that path as the page.
export const reroute: Reroute = ({ url }) => {
	if (url.pathname.endsWith('/index.html')) return url.pathname.slice(0, -'index.html'.length);
};
