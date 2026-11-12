import { mergeMessagesMaps } from 'utils-shared/i18n';
import { messagesMap as messagesMapUiPixi } from 'components-ui-pixi';
import { messagesMap as messagesMapUiHtml } from 'components-ui-html';

import en from './en';
import zh from './zh';

const messagesMapGame = Object.fromEntries(
	Object.keys(messagesMapUiPixi).map((lang) => [lang, lang === 'zh' ? zh : en]),
) as Record<keyof typeof messagesMapUiPixi, typeof en>;

const messagesMap = mergeMessagesMaps([messagesMapGame, messagesMapUiPixi, messagesMapUiHtml]);

export default messagesMap;
