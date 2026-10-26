import { mergeMessagesMaps } from 'utils-shared/i18n';
import { messagesMap as messagesMapUiPixi } from 'components-ui-pixi';
import { messagesMap as messagesMapUiHtml } from 'components-ui-html';

import en from './en';
import zh from './zh';

const messagesMapGame = {
	en,
	zh,
};

// the game adds only en and zh; every other locale comes from the shared maps
const messagesMap = mergeMessagesMaps([
	messagesMapGame as unknown as typeof messagesMapUiPixi,
	messagesMapUiPixi,
	messagesMapUiHtml,
]);

export default messagesMap;
