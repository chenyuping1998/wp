import { stateI18nDerived } from 'state-shared';

import { i18nDerived as i18nDerivedUiPixi } from 'components-ui-pixi';
import { i18nDerived as i18nDerivedUiHtml } from 'components-ui-html';

export const i18nDerived = {
	...i18nDerivedUiPixi,
	...i18nDerivedUiHtml,
	home: () => stateI18nDerived.translate('HOME'),
	notTranslated: () => stateI18nDerived.translate('NOT TRANSLATED'),
	congratulations: () => stateI18nDerived.translate('CONGRATULATIONS!'),
	youWon: () => stateI18nDerived.translate('YOU WON'),
	freeSpins: () => stateI18nDerived.translate('FREE SPINS'),
	totalWin: () => stateI18nDerived.translate('TOTAL WIN'),
	pressAnywhereToContinue: () => stateI18nDerived.translate('PRESS ANYWHERE TO CONTINUE'),
};
