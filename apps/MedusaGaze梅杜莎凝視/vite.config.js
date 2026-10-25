// @ts-nocheck -- Node-only build configuration; frontend tsconfig omits Node types.
import config from 'config-vite';
import { mergeConfig } from 'vite';
import { fileURLToPath } from 'node:url';

/** Stake Engine requires relative base paths in production uploads. */
export default mergeConfig(config(), {
	base: './',
	plugins: [{
		name: 'medusa-owned-controls', enforce: 'pre',
		resolveId(source,importer) {
			const from=importer?.replace(/\\/g,'/');
			if(source==='./ButtonBuyBonus.svelte'&&from?.endsWith('/packages/components-ui-pixi/src/components/UIDefault.svelte'))return fileURLToPath(new URL('./src/components/MedusaBuyBonusButton.svelte',import.meta.url));
			if(source==='./ButtonBetSpinIcon.svelte'&&from?.endsWith('/packages/components-ui-pixi/src/components/ButtonBet.svelte'))return fileURLToPath(new URL('./src/components/MedusaSpinGlyph.svelte',import.meta.url));
		},
	}],
});
