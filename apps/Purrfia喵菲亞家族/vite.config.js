import config from 'config-vite';
import { mergeConfig } from 'vite';
export default mergeConfig(config(), { base: './' });
