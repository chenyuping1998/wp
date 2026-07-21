import UI from './src/components/UI.svelte';
import UiGameName from './src/components/UiGameName.svelte';

import messagesMap from './src/i18n/messagesMap';
import { i18nDerived } from './src/i18n/i18nDerived';
import { uiTheme, setUiTheme, type UiTheme } from './src/theme.svelte';

export * from './src/types';

export { messagesMap, i18nDerived, UI, UiGameName, uiTheme, setUiTheme, type UiTheme };
