// if you want to generate a static html file
// for your page.
// Documentation: https://kit.svelte.dev/docs/page-options#prerender
export const prerender = true;

// if you want to Generate a SPA
// you have to set ssr to false.
// This is not the case (so set as true or comment the line)
// Documentation: https://kit.svelte.dev/docs/page-options#ssr
export const ssr = false;

// How to manage the trailing slashes in the URLs
// the URL for about page witll be /about with 'ignore' (default)
// the URL for about page witll be /about/ with 'always'
// https://kit.svelte.dev/docs/page-options#trailingslash
export const trailingSlash = 'ignore';

// Dev-only fake RGS, so a round can be played without Stake Engine. Installed
// from `load` rather than a component so it has patched fetch before
// Authenticate's onMount runs. No-ops unless `import.meta.env.DEV` and ?mock=1
// both hold; a production build drops the module entirely.
export const load = async () => {
	if (import.meta.env.DEV) {
		const { installMockRgs } = await import('../dev/mockRgs');
		await installMockRgs();
	}
	return {};
};
