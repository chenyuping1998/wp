import { locales } from 'config-lingui';
import type { MessagesMap } from 'utils-shared/i18n';
import { mergeMessagesMaps } from 'utils-shared/i18n';
import { messagesMap as messagesMapUiPixi } from 'components-ui-pixi';
import { messagesMap as messagesMapUiHtml } from 'components-ui-html';

import en from './en';
import zh from './zh';

// Game-only keys fall back to English; shared catalogues supply localized UI.
const messagesMapGame: MessagesMap = { ...messagesMapUiPixi };
for (const lang of locales) messagesMapGame[lang] = lang === 'zh' ? zh : en;

const messagesMap = mergeMessagesMaps([messagesMapGame, messagesMapUiPixi, messagesMapUiHtml]);

export default messagesMap;
