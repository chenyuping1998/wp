// @ts-ignore
import config from 'config-vite';
import { mergeConfig } from 'vite';
/**
 * @param {string} source
 * @param {string | undefined} importer
 */
function resolvePrivateUi(source, importer) {
 if (!importer?.includes('components-ui-pixi/src/')) return;
 const name = source.split('/').pop() ?? '';
 if (['ButtonBet.svelte','UiButton.svelte','UiBarStrip.svelte'].includes(name)) return decodeURIComponent(new URL('./src/components/pickleUi/'+name,import.meta.url).pathname);
}
const privateUi = {name:'pickle-private-ui',enforce:/** @type {'pre'} */('pre'),resolveId:resolvePrivateUi};
/** Stake Engine requires relative base paths in production uploads. */
export default mergeConfig(config(), { base: './',plugins:[privateUi] });
