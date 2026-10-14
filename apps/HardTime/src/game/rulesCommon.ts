import { stateI18nDerived, stateUrlDerived } from 'state-shared';

import type { getSocialTerms } from './socialTerms';

/**
 * The parts of the game rules and pay table that read the same in all three
 * games (how to play, controls, the mode table, retriggers, feature entry, max
 * win, the disclaimer), in every locale the UI ships (2026-10-13, P2-C — the
 * rules were English-only while the bet bar and the intro card followed ?lang=).
 *
 * Same file in CapoNostra, TurfWar and HardTime — change all three together.
 * Each game's own sections live in its game/rulesText.ts.
 *
 * English is built from socialTerms, so social play keeps its vetted wording
 * word for word; social play is English-only (stateUrlDerived.lang() already
 * returns 'en' there). Feature names (Soldier, Lookout, Lockdown…) stay in
 * English in every language, as on the intro cards.
 */

type Terms = ReturnType<typeof getSocialTerms>;

export const RULES_LANGS = [
	'ar',
	'de',
	'es',
	'fr',
	'id',
	'ja',
	'ko',
	'pl',
	'pt',
	'ru',
	'tr',
	'vi',
	'zh',
	'fi',
	'hi',
] as const;
export type RulesLang = (typeof RULES_LANGS)[number] | 'en';

export const rulesLang = (): RulesLang => {
	const lang = stateUrlDerived.lang();
	return (RULES_LANGS as readonly string[]).includes(lang) ? (lang as RulesLang) : 'en';
};

/** The locale's grouping and decimal mark, Latin digits (the bet bar uses them too). */
export const numberIn = (lang: RulesLang, value: number) =>
	new Intl.NumberFormat(`${lang}-u-nu-latn`).format(value);
export const pctIn = (lang: RulesLang, value: number) =>
	new Intl.NumberFormat(`${lang}-u-nu-latn`, {
		style: 'percent',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);

export type RulesVars = {
	/** title case, as the first sentence uses it */
	game: string;
	reels: number;
	rows: number;
	lines: number;
	rtpRange: string;
	rtpLow: string;
	rtpHigh: string;
	/** formatted number, no × */
	maxWin: string;
	/** the Buy Bonus button's name as the controls list prints it */
	buyName: string;
};

export type ControlKey =
	| 'spin'
	| 'stepper'
	| 'amount'
	| 'buy'
	| 'auto'
	| 'turbo'
	| 'menu'
	| 'info'
	| 'settings'
	| 'paytable'
	| 'sound';

export type CommonText = {
	dir?: 'rtl';
	gameRulesCaps: string;
	gameRulesTitle: string;
	factGrid: string;
	factLines: string;
	factMaxWin: string;
	howTitle: string;
	how: (v: RulesVars) => string;
	controlsTitle: string;
	controls: Record<ControlKey, readonly [name: string, text: string]>;
	amountPlate: string;
	buyPlate: string;
	skipNote: string;
	modesTitle: string;
	modesHead: readonly [string, string, string, string];
	baseGame: string;
	everySpin: string;
	buyFor: (cost: number | string) => string;
	maxWinCell: (maxWin: string) => string;
	modesNote: string;
	wildTitle: string;
	scatterTitle: string;
	scatters: (n: number) => string;
	retrigTitle: string;
	retrig: string;
	noLimit: string;
	entryTitle: string;
	entry: (v: RulesVars) => string;
	maxTitle: string;
	max: (v: RulesVars) => string;
	foot: string;
	payTableTitle: string;
	ptNote: (lines: number) => string;
	ptScatter: (freeSpins: number) => string;
	ptLinesTitle: (n: number) => string;
	ptLinesNote: (n: number) => string;
};

const english = (T: Terms, social: boolean): CommonText => ({
	gameRulesCaps: 'GAME RULES',
	gameRulesTitle: 'Game Rules',
	factGrid: 'grid',
	factLines: T.paylines,
	factMaxWin: 'max win',
	howTitle: 'How to play',
	how: (v) =>
		`${v.game} is a ${v.reels}×${v.rows} video slot with ${v.lines} fixed ${T.paylines}. ${T.combinationDirection}. Only the highest win is ${T.paid} per line, and all line wins are added together. The theoretical return to player (RTP) is ${v.rtpRange}, depending on the mode played — every mode's figure is listed in the table below.`,
	controlsTitle: 'Controls',
	controls: {
		spin: [
			'Spin',
			`Starts a round for the current ${T.bet}. The space bar does the same thing. While the reels are turning it becomes Stop, which brings them to rest early.`,
		],
		stepper: [
			'Decrease / increase',
			`Steps the ${T.bet} up or down through the available ${T.betLevels}.`,
		],
		amount: [
			social ? 'Amount' : 'Bet amount',
			`Shows the current ${T.bet}. Tap it to open the ${T.betMenu} and choose any of the available ${T.betLevels} directly.`,
		],
		buy: [
			T.buyBonusName,
			`Opens the feature menu, where any of the three free-spin features can be ${T.bought} outright for the stated multiple of your ${T.bet}. The ${T.cost} is shown before you confirm.`,
		],
		auto: [
			'Auto Spin',
			'Plays a chosen number of rounds automatically. Open it to set the count and any stop conditions; press it again to stop early.',
		],
		turbo: ['Turbo', 'Shortens the spin and win presentations. Lit means turbo is on.'],
		menu: [
			'Menu',
			`Opens the ${T.payTableCaps.toLowerCase()}, these rules, and the sound and settings controls.`,
		],
		info: ['Info', 'Opens these game rules.'],
		settings: [
			'Settings',
			'Opens the volume controls: master volume, music and sound effects, each set separately.',
		],
		paytable: [
			T.payTableCaps,
			`Lists every symbol and what it ${T.pays} for 3, 4 and 5 of a kind, plus the ${T.paylines}.`,
		],
		sound: ['Sound', 'Mutes and unmutes the game. Volume is adjusted under Settings.'],
	},
	amountPlate: social ? 'AMOUNT' : 'BET',
	buyPlate: T.buyBonusName,
	skipNote: 'While a big win is being counted up, tapping anywhere skips to the final amount.',
	modesTitle: 'RTP & Max Win by mode',
	modesHead: ['Mode', 'How to enter', 'RTP', 'Max win'],
	baseGame: 'Base game',
	everySpin: 'Every spin',
	buyFor: (cost) => `${T.entryVerb} for ${cost}× ${T.bet}`,
	maxWinCell: (maxWin) => `${maxWin}× ${T.bet}`,
	modesNote: `Max win is a multiple of the ${T.baseBet}, not of a feature's entry ${T.cost}. When a round reaches the cap it ends immediately and the capped amount is ${T.paid}.`,
	wildTitle: 'Wild',
	scatterTitle: 'Scatter & Free Spins',
	scatters: (n) => `${n} Scatters`,
	retrigTitle: 'Retriggers',
	retrig:
		'Landing further Scatters together during a feature awards extra free spins: 2 Scatters award +2, 3 Scatters award +4, 4 Scatters award +6 and 5 Scatters award +8. This applies in all three features.',
	noLimit:
		'There is no limit to the number of free spins that can be won. A feature ends when its free spins run out or when the maximum win is reached.',
	entryTitle: 'Feature Entry',
	entry: (v) =>
		`Instead of waiting for Scatters, each feature can be ${T.bought} directly with the ${T.buyBonusName} button, for the ${T.cost} shown in the table above. Each mode's RTP is shown there alongside its ${T.cost}; across all modes it ranges from ${v.rtpLow} to ${v.rtpHigh}.`,
	maxTitle: 'Max Win',
	max: (v) =>
		`The maximum ${T.payout} is capped at ${v.maxWin}× the ${T.baseBet} in every mode. Once the cap is reached the round ends immediately and the maximum win is awarded.`,
	foot: `${T.disclaimerOpening} A consistent internet connection is required. In the event of a disconnection, reload the game to finish any uncompleted rounds. The expected return is calculated over many plays. The game display is not representative of any physical device and is for illustrative purposes only. Winnings are settled according to the amount received from the Remote Game Server and not from events within the web browser.`,
	payTableTitle: T.payTableUpper,
	ptNote: (lines) =>
		`${T.paysStart} shown as a multiple of ${T.baseBet}. Line wins ${T.winsDirection} on ${lines} fixed ${T.paylines}.`,
	ptScatter: (freeSpins) => `${T.doesNotPay} — 3, 4 or 5 Scatters award ${freeSpins} Free Spins`,
	ptLinesTitle: (n) => `${n} ${T.paylinesUpper}`,
	ptLinesNote: (n) => `All ${n} lines are always active. Wins ${T.winsDirection} from reel 1.`,
});

/** Labels the bet bar draws in the player's language: the rules name the same plates. */
const plate = (key: string) => stateI18nDerived.translate(key);

const TEXT: Record<Exclude<RulesLang, 'en'>, () => CommonText> = {
	de: () => ({
		gameRulesCaps: 'SPIELREGELN',
		gameRulesTitle: 'Spielregeln',
		factGrid: 'Raster',
		factLines: 'Gewinnlinien',
		factMaxWin: 'Maximalgewinn',
		howTitle: 'So wird gespielt',
		how: (v) =>
			`${v.game} ist ein ${v.reels}×${v.rows}-Video-Slot mit ${v.lines} festen Gewinnlinien. Gewinnkombinationen zahlen von links nach rechts auf benachbarten Walzen, beginnend mit der Walze ganz links. Pro Linie wird nur der höchste Gewinn ausgezahlt, und alle Liniengewinne werden addiert. Die theoretische Auszahlungsquote (RTP) beträgt je nach gespieltem Modus ${v.rtpRange} – die Werte aller Modi stehen in der Tabelle unten.`,
		controlsTitle: 'Bedienung',
		controls: {
			spin: [
				'Drehen',
				'Startet eine Runde mit dem aktuellen Einsatz. Die Leertaste bewirkt dasselbe. Während sich die Walzen drehen, wird daraus „Stopp“, womit sie vorzeitig anhalten.',
			],
			stepper: ['Verringern / Erhöhen', 'Senkt oder erhöht den Einsatz durch die verfügbaren Einsatzstufen.'],
			amount: [
				'Einsatzbetrag',
				'Zeigt den aktuellen Einsatz. Tippen Sie darauf, um das Einsatzmenü zu öffnen und direkt eine der verfügbaren Einsatzstufen zu wählen.',
			],
			buy: [
				'Bonus kaufen',
				'Öffnet das Feature-Menü, in dem jedes der drei Freispiel-Features direkt zum angegebenen Vielfachen Ihres Einsatzes gekauft werden kann. Der Preis wird vor der Bestätigung angezeigt.',
			],
			auto: [
				'Autospin',
				'Spielt eine gewählte Anzahl von Runden automatisch. Öffnen Sie es, um die Anzahl und eventuelle Stoppbedingungen festzulegen; erneut drücken beendet es vorzeitig.',
			],
			turbo: ['Turbo', 'Verkürzt die Dreh- und Gewinnanimationen. Leuchtet die Taste, ist Turbo aktiv.'],
			menu: ['Menü', 'Öffnet die Gewinntabelle, diese Regeln sowie die Ton- und Einstellungsoptionen.'],
			info: ['Info', 'Öffnet diese Spielregeln.'],
			settings: [
				'Einstellungen',
				'Öffnet die Lautstärkeregler: Gesamtlautstärke, Musik und Soundeffekte, jeweils separat einstellbar.',
			],
			paytable: [
				'Gewinntabelle',
				'Listet jedes Symbol und seinen Gewinn für 3, 4 und 5 gleiche Symbole sowie die Gewinnlinien.',
			],
			sound: ['Ton', 'Schaltet den Ton des Spiels ein und aus. Die Lautstärke wird unter „Einstellungen“ geregelt.'],
		},
		amountPlate: plate('BET'),
		buyPlate: plate('BUY BONUS'),
		skipNote:
			'Während ein großer Gewinn hochgezählt wird, springt ein Tippen an eine beliebige Stelle direkt zum Endbetrag.',
		modesTitle: 'RTP und Maximalgewinn je Modus',
		modesHead: ['Modus', 'Zugang', 'RTP', 'Maximalgewinn'],
		baseGame: 'Basisspiel',
		everySpin: 'Jeder Spin',
		buyFor: (cost) => `Kauf für ${cost}× Einsatz`,
		maxWinCell: (maxWin) => `${maxWin}× Einsatz`,
		modesNote:
			'Der Maximalgewinn ist ein Vielfaches des Grundeinsatzes, nicht des Einstiegspreises eines Features. Erreicht eine Runde die Obergrenze, endet sie sofort und der begrenzte Betrag wird ausgezahlt.',
		wildTitle: 'Wild',
		scatterTitle: 'Scatter und Freispiele',
		scatters: (n) => `${n} Scatter`,
		retrigTitle: 'Zusätzliche Freispiele',
		retrig:
			'Landen während eines Features erneut mehrere Scatter gleichzeitig, gibt es zusätzliche Freispiele: 2 Scatter bringen +2, 3 Scatter +4, 4 Scatter +6 und 5 Scatter +8. Das gilt in allen drei Features.',
		noLimit:
			'Die Anzahl der gewinnbaren Freispiele ist unbegrenzt. Ein Feature endet, wenn seine Freispiele aufgebraucht sind oder der Maximalgewinn erreicht ist.',
		entryTitle: 'Feature-Einstieg',
		entry: (v) =>
			`Statt auf Scatter zu warten, kann jedes Feature direkt über die Schaltfläche „${v.buyName}“ gekauft werden – zum Preis aus der Tabelle oben. Dort steht neben dem Preis auch der RTP jedes Modus; über alle Modi liegt er zwischen ${v.rtpLow} und ${v.rtpHigh}.`,
		maxTitle: 'Maximalgewinn',
		max: (v) =>
			`Die maximale Auszahlung ist in jedem Modus auf das ${v.maxWin}-Fache des Grundeinsatzes begrenzt. Sobald die Obergrenze erreicht ist, endet die Runde sofort und der Maximalgewinn wird ausgezahlt.`,
		foot: 'Bei Fehlfunktionen werden alle Auszahlungen und Spiele ungültig. Eine stabile Internetverbindung ist erforderlich. Laden Sie das Spiel nach einem Verbindungsabbruch neu, um nicht abgeschlossene Runden zu beenden. Die erwartete Auszahlung wird über sehr viele Spiele berechnet. Die Spieldarstellung entspricht keinem physischen Gerät und dient nur der Veranschaulichung. Gewinne werden nach dem Betrag abgerechnet, den der Remote Game Server übermittelt, nicht nach Ereignissen im Webbrowser.',
		payTableTitle: plate('PAYTABLE'),
		ptNote: (lines) =>
			`Gewinne als Vielfaches des Grundeinsatzes. Liniengewinne zahlen von links nach rechts auf ${lines} festen Gewinnlinien.`,
		ptScatter: (fs) => `Kein Liniengewinn – 3, 4 oder 5 Scatter bringen ${fs} Freispiele`,
		ptLinesTitle: (n) => `${n} GEWINNLINIEN`,
		ptLinesNote: (n) => `Alle ${n} Linien sind immer aktiv. Gewinne zahlen von links nach rechts ab Walze 1.`,
	}),
	es: () => ({
		gameRulesCaps: 'REGLAS DEL JUEGO',
		gameRulesTitle: 'Reglas del juego',
		factGrid: 'cuadrícula',
		factLines: 'líneas de pago',
		factMaxWin: 'ganancia máx.',
		howTitle: 'Cómo jugar',
		how: (v) =>
			`${v.game} es una tragamonedas de vídeo de ${v.reels}×${v.rows} con ${v.lines} líneas de pago fijas. Las combinaciones ganadoras pagan de izquierda a derecha en carretes adyacentes, empezando por el carrete de la izquierda. Solo se paga la ganancia más alta por línea, y todas las ganancias de línea se suman. El retorno teórico al jugador (RTP) es de ${v.rtpRange} según el modo que se juegue; el valor de cada modo figura en la tabla de abajo.`,
		controlsTitle: 'Controles',
		controls: {
			spin: [
				'Girar',
				'Inicia una ronda con la apuesta actual. La barra espaciadora hace lo mismo. Mientras los carretes giran se convierte en Detener, que los para antes de tiempo.',
			],
			stepper: ['Bajar / subir', 'Baja o sube la apuesta por los niveles de apuesta disponibles.'],
			amount: [
				'Importe de la apuesta',
				'Muestra la apuesta actual. Tócalo para abrir el menú de apuestas y elegir directamente cualquiera de los niveles disponibles.',
			],
			buy: [
				'Comprar bono',
				'Abre el menú de funciones, donde cualquiera de las tres funciones de giros gratis puede comprarse directamente por el múltiplo indicado de tu apuesta. El coste se muestra antes de confirmar.',
			],
			auto: [
				'Giro automático',
				'Juega automáticamente el número de rondas elegido. Ábrelo para fijar la cantidad y las condiciones de parada; púlsalo de nuevo para detenerlo antes.',
			],
			turbo: ['Turbo', 'Acorta las animaciones de giro y de ganancias. Encendido significa que el turbo está activo.'],
			menu: ['Menú', 'Abre la tabla de pagos, estas reglas y los controles de sonido y ajustes.'],
			info: ['Info', 'Abre estas reglas del juego.'],
			settings: [
				'Ajustes',
				'Abre los controles de volumen: volumen general, música y efectos de sonido, cada uno por separado.',
			],
			paytable: [
				'Tabla de pagos',
				'Muestra cada símbolo y lo que paga por 3, 4 y 5 iguales, además de las líneas de pago.',
			],
			sound: ['Sonido', 'Silencia y activa el sonido del juego. El volumen se ajusta en Ajustes.'],
		},
		amountPlate: plate('BET'),
		buyPlate: plate('BUY BONUS'),
		skipNote: 'Mientras se cuenta una gran ganancia, tocar en cualquier lugar salta al importe final.',
		modesTitle: 'RTP y ganancia máxima por modo',
		modesHead: ['Modo', 'Cómo entrar', 'RTP', 'Ganancia máx.'],
		baseGame: 'Juego base',
		everySpin: 'Cada giro',
		buyFor: (cost) => `Compra por ${cost}× la apuesta`,
		maxWinCell: (maxWin) => `${maxWin}× la apuesta`,
		modesNote:
			'La ganancia máxima es un múltiplo de la apuesta base, no del coste de entrada de una función. Cuando una ronda alcanza el límite, termina de inmediato y se paga el importe limitado.',
		wildTitle: 'Wild',
		scatterTitle: 'Scatter y giros gratis',
		scatters: (n) => `${n} Scatters`,
		retrigTitle: 'Reactivaciones',
		retrig:
			'Si caen más Scatters a la vez durante una función, se otorgan giros gratis extra: 2 Scatters dan +2, 3 Scatters +4, 4 Scatters +6 y 5 Scatters +8. Esto se aplica en las tres funciones.',
		noLimit:
			'No hay límite en el número de giros gratis que se pueden ganar. Una función termina cuando se agotan sus giros gratis o cuando se alcanza la ganancia máxima.',
		entryTitle: 'Entrada a las funciones',
		entry: (v) =>
			`En lugar de esperar a los Scatters, cada función puede comprarse directamente con el botón ${v.buyName}, por el coste indicado en la tabla de arriba. Allí también figura el RTP de cada modo junto a su coste; entre todos los modos va de ${v.rtpLow} a ${v.rtpHigh}.`,
		maxTitle: 'Ganancia máxima',
		max: (v) =>
			`El pago máximo está limitado a ${v.maxWin}× la apuesta base en todos los modos. Al alcanzar el límite, la ronda termina de inmediato y se otorga la ganancia máxima.`,
		foot: 'Un mal funcionamiento anula todos los pagos y jugadas. Se requiere una conexión a internet estable. En caso de desconexión, vuelve a cargar el juego para terminar las rondas pendientes. El retorno esperado se calcula sobre muchas jugadas. La pantalla del juego no representa ningún dispositivo físico y es solo ilustrativa. Las ganancias se liquidan según el importe recibido del servidor remoto de juego (Remote Game Server) y no según lo que ocurra en el navegador.',
		payTableTitle: plate('PAYTABLE'),
		ptNote: (lines) =>
			`Pagos expresados como múltiplo de la apuesta base. Las ganancias de línea pagan de izquierda a derecha en ${lines} líneas de pago fijas.`,
		ptScatter: (fs) => `No paga — 3, 4 o 5 Scatters otorgan ${fs} giros gratis`,
		ptLinesTitle: (n) => `${n} LÍNEAS DE PAGO`,
		ptLinesNote: (n) =>
			`Las ${n} líneas están siempre activas. Las ganancias pagan de izquierda a derecha desde el carrete 1.`,
	}),
	fr: () => ({
		gameRulesCaps: 'RÈGLES DU JEU',
		gameRulesTitle: 'Règles du jeu',
		factGrid: 'grille',
		factLines: 'lignes de paiement',
		factMaxWin: 'gain max',
		howTitle: 'Comment jouer',
		how: (v) =>
			`${v.game} est une machine à sous vidéo ${v.reels}×${v.rows} avec ${v.lines} lignes de paiement fixes. Les combinaisons gagnantes paient de gauche à droite sur des rouleaux adjacents, à partir du rouleau le plus à gauche. Seul le gain le plus élevé est payé par ligne, et tous les gains de ligne s’additionnent. Le taux de retour théorique au joueur (RTP) est de ${v.rtpRange} selon le mode joué — la valeur de chaque mode figure dans le tableau ci-dessous.`,
		controlsTitle: 'Commandes',
		controls: {
			spin: [
				'Lancer',
				'Lance une partie avec la mise en cours. La barre d’espace fait de même. Pendant que les rouleaux tournent, le bouton devient Stop et les arrête plus tôt.',
			],
			stepper: ['Diminuer / augmenter', 'Fait passer la mise d’un niveau à l’autre parmi les niveaux disponibles.'],
			amount: [
				'Montant de la mise',
				'Affiche la mise en cours. Touchez-le pour ouvrir le menu des mises et choisir directement l’un des niveaux disponibles.',
			],
			buy: [
				'Acheter bonus',
				'Ouvre le menu des fonctions, où chacune des trois fonctions de tours gratuits peut être achetée directement pour le multiple indiqué de votre mise. Le coût est affiché avant confirmation.',
			],
			auto: [
				'Jeu automatique',
				'Joue automatiquement le nombre de parties choisi. Ouvrez-le pour régler le nombre et les conditions d’arrêt ; appuyez à nouveau pour l’arrêter plus tôt.',
			],
			turbo: ['Turbo', 'Raccourcit les animations de rotation et de gain. Allumé, le turbo est actif.'],
			menu: ['Menu', 'Ouvre la table des gains, ces règles ainsi que les réglages du son et des paramètres.'],
			info: ['Info', 'Ouvre ces règles du jeu.'],
			settings: [
				'Paramètres',
				'Ouvre les réglages du volume : volume général, musique et effets sonores, chacun séparément.',
			],
			paytable: [
				'Table des gains',
				'Liste chaque symbole et ce qu’il paie pour 3, 4 et 5 identiques, ainsi que les lignes de paiement.',
			],
			sound: ['Son', 'Coupe et rétablit le son du jeu. Le volume se règle dans Paramètres.'],
		},
		amountPlate: plate('BET'),
		buyPlate: plate('BUY BONUS'),
		skipNote: 'Pendant le décompte d’un gros gain, toucher n’importe où passe directement au montant final.',
		modesTitle: 'RTP et gain maximal par mode',
		modesHead: ['Mode', 'Accès', 'RTP', 'Gain max'],
		baseGame: 'Jeu de base',
		everySpin: 'Chaque tour',
		buyFor: (cost) => `Achat pour ${cost}× la mise`,
		maxWinCell: (maxWin) => `${maxWin}× la mise`,
		modesNote:
			'Le gain maximal est un multiple de la mise de base, et non du coût d’entrée d’une fonction. Lorsqu’une partie atteint ce plafond, elle se termine immédiatement et le montant plafonné est payé.',
		wildTitle: 'Wild',
		scatterTitle: 'Scatter et tours gratuits',
		scatters: (n) => `${n} Scatters`,
		retrigTitle: 'Relances',
		retrig:
			'Obtenir de nouveaux Scatters ensemble pendant une fonction donne des tours gratuits supplémentaires : 2 Scatters donnent +2, 3 Scatters +4, 4 Scatters +6 et 5 Scatters +8. Cela s’applique aux trois fonctions.',
		noLimit:
			'Le nombre de tours gratuits pouvant être gagnés est illimité. Une fonction se termine quand ses tours gratuits sont épuisés ou quand le gain maximal est atteint.',
		entryTitle: 'Accès aux fonctions',
		entry: (v) =>
			`Au lieu d’attendre les Scatters, chaque fonction peut être achetée directement avec le bouton ${v.buyName}, au coût indiqué dans le tableau ci-dessus. Le RTP de chaque mode y figure à côté de son coût ; tous modes confondus, il va de ${v.rtpLow} à ${v.rtpHigh}.`,
		maxTitle: 'Gain maximal',
		max: (v) =>
			`Le paiement maximal est plafonné à ${v.maxWin}× la mise de base dans tous les modes. Une fois le plafond atteint, la partie se termine immédiatement et le gain maximal est attribué.`,
		foot: 'Tout dysfonctionnement annule tous les paiements et toutes les parties. Une connexion Internet stable est nécessaire. En cas de déconnexion, rechargez le jeu pour terminer les parties inachevées. Le retour attendu est calculé sur un grand nombre de parties. L’affichage du jeu ne représente aucun appareil physique et n’est fourni qu’à titre d’illustration. Les gains sont réglés selon le montant reçu du serveur de jeu distant (Remote Game Server) et non selon les événements du navigateur.',
		payTableTitle: plate('PAYTABLE'),
		ptNote: (lines) =>
			`Gains exprimés en multiple de la mise de base. Les gains de ligne paient de gauche à droite sur ${lines} lignes de paiement fixes.`,
		ptScatter: (fs) => `Ne paie pas — 3, 4 ou 5 Scatters donnent ${fs} tours gratuits`,
		ptLinesTitle: (n) => `${n} LIGNES DE PAIEMENT`,
		ptLinesNote: (n) =>
			`Les ${n} lignes sont toujours actives. Les gains paient de gauche à droite à partir du rouleau 1.`,
	}),
	pt: () => ({
		gameRulesCaps: 'REGRAS DO JOGO',
		gameRulesTitle: 'Regras do jogo',
		factGrid: 'grade',
		factLines: 'linhas de pagamento',
		factMaxWin: 'ganho máx.',
		howTitle: 'Como jogar',
		how: (v) =>
			`${v.game} é um caça-níquel de vídeo ${v.reels}×${v.rows} com ${v.lines} linhas de pagamento fixas. As combinações vencedoras pagam da esquerda para a direita em rolos adjacentes, a partir do rolo mais à esquerda. Só o maior ganho é pago por linha, e todos os ganhos de linha são somados. O retorno teórico ao jogador (RTP) é de ${v.rtpRange}, conforme o modo jogado — o valor de cada modo está na tabela abaixo.`,
		controlsTitle: 'Controles',
		controls: {
			spin: [
				'Girar',
				'Inicia uma rodada com a aposta atual. A barra de espaço faz o mesmo. Enquanto os rolos giram, o botão vira Parar, que os detém antes.',
			],
			stepper: ['Diminuir / aumentar', 'Sobe ou desce a aposta pelos níveis de aposta disponíveis.'],
			amount: [
				'Valor da aposta',
				'Mostra a aposta atual. Toque nele para abrir o menu de apostas e escolher diretamente qualquer um dos níveis disponíveis.',
			],
			buy: [
				'Comprar bônus',
				'Abre o menu de recursos, onde qualquer um dos três recursos de rodadas grátis pode ser comprado diretamente pelo múltiplo indicado da sua aposta. O custo é exibido antes de confirmar.',
			],
			auto: [
				'Giro automático',
				'Joga automaticamente o número de rodadas escolhido. Abra-o para definir a quantidade e as condições de parada; toque de novo para parar antes.',
			],
			turbo: ['Turbo', 'Encurta as animações de giro e de ganho. Aceso significa turbo ativado.'],
			menu: ['Menu', 'Abre a tabela de pagamentos, estas regras e os controles de som e configurações.'],
			info: ['Info', 'Abre estas regras do jogo.'],
			settings: [
				'Configurações',
				'Abre os controles de volume: volume geral, música e efeitos sonoros, cada um ajustado separadamente.',
			],
			paytable: [
				'Tabela de pagamentos',
				'Lista cada símbolo e quanto paga por 3, 4 e 5 iguais, além das linhas de pagamento.',
			],
			sound: ['Som', 'Liga e desliga o som do jogo. O volume é ajustado em Configurações.'],
		},
		amountPlate: plate('BET'),
		buyPlate: plate('BUY BONUS'),
		skipNote: 'Enquanto um grande ganho é contado, tocar em qualquer lugar pula para o valor final.',
		modesTitle: 'RTP e ganho máximo por modo',
		modesHead: ['Modo', 'Como entrar', 'RTP', 'Ganho máx.'],
		baseGame: 'Jogo base',
		everySpin: 'Toda rodada',
		buyFor: (cost) => `Compre por ${cost}× a aposta`,
		maxWinCell: (maxWin) => `${maxWin}× a aposta`,
		modesNote:
			'O ganho máximo é um múltiplo da aposta base, não do custo de entrada de um recurso. Quando uma rodada atinge o limite, ela termina na hora e o valor limitado é pago.',
		wildTitle: 'Wild',
		scatterTitle: 'Scatter e rodadas grátis',
		scatters: (n) => `${n} Scatters`,
		retrigTitle: 'Reativações',
		retrig:
			'Conseguir mais Scatters juntos durante um recurso concede rodadas grátis extras: 2 Scatters dão +2, 3 Scatters +4, 4 Scatters +6 e 5 Scatters +8. Isso vale nos três recursos.',
		noLimit:
			'Não há limite para o número de rodadas grátis que podem ser ganhas. Um recurso termina quando suas rodadas grátis acabam ou quando o ganho máximo é atingido.',
		entryTitle: 'Entrada nos recursos',
		entry: (v) =>
			`Em vez de esperar pelos Scatters, cada recurso pode ser comprado diretamente com o botão ${v.buyName}, pelo custo mostrado na tabela acima. Lá também aparece o RTP de cada modo ao lado do custo; entre todos os modos, ele vai de ${v.rtpLow} a ${v.rtpHigh}.`,
		maxTitle: 'Ganho máximo',
		max: (v) =>
			`O pagamento máximo é limitado a ${v.maxWin}× a aposta base em todos os modos. Ao atingir o limite, a rodada termina na hora e o ganho máximo é concedido.`,
		foot: 'Defeitos anulam todos os pagamentos e jogadas. É necessária uma conexão estável com a internet. Em caso de desconexão, recarregue o jogo para concluir as rodadas pendentes. O retorno esperado é calculado sobre muitas jogadas. A tela do jogo não representa nenhum aparelho físico e é apenas ilustrativa. Os ganhos são liquidados conforme o valor recebido do servidor remoto de jogo (Remote Game Server), e não por eventos no navegador.',
		payTableTitle: plate('PAYTABLE'),
		ptNote: (lines) =>
			`Pagamentos mostrados como múltiplo da aposta base. Os ganhos de linha pagam da esquerda para a direita em ${lines} linhas de pagamento fixas.`,
		ptScatter: (fs) => `Não paga — 3, 4 ou 5 Scatters concedem ${fs} rodadas grátis`,
		ptLinesTitle: (n) => `${n} LINHAS DE PAGAMENTO`,
		ptLinesNote: (n) =>
			`Todas as ${n} linhas estão sempre ativas. Os ganhos pagam da esquerda para a direita a partir do rolo 1.`,
	}),
	pl: () => ({
		gameRulesCaps: 'ZASADY GRY',
		gameRulesTitle: 'Zasady gry',
		factGrid: 'siatka',
		factLines: 'linie wygrywające',
		factMaxWin: 'maks. wygrana',
		howTitle: 'Jak grać',
		how: (v) =>
			`${v.game} to automat wideo ${v.reels}×${v.rows} z ${v.lines} stałymi liniami wygrywającymi. Kombinacje wygrywające płacą od lewej do prawej na sąsiednich bębnach, zaczynając od skrajnego lewego bębna. Na każdej linii wypłacana jest tylko najwyższa wygrana, a wszystkie wygrane z linii są sumowane. Teoretyczny zwrot dla gracza (RTP) wynosi ${v.rtpRange} w zależności od trybu gry — wartości dla każdego trybu podano w tabeli poniżej.`,
		controlsTitle: 'Sterowanie',
		controls: {
			spin: [
				'Zakręć',
				'Rozpoczyna rundę za bieżący zakład. Spacja działa tak samo. Gdy bębny się kręcą, przycisk zmienia się w Stop i zatrzymuje je wcześniej.',
			],
			stepper: ['Zmniejsz / zwiększ', 'Zmienia zakład w górę lub w dół o dostępne poziomy zakładu.'],
			amount: [
				'Kwota zakładu',
				'Pokazuje bieżący zakład. Dotknij, aby otworzyć menu zakładów i wybrać bezpośrednio dowolny z dostępnych poziomów.',
			],
			buy: [
				'Kup bonus',
				'Otwiera menu funkcji, w którym każdą z trzech funkcji darmowych obrotów można kupić od razu za podaną wielokrotność zakładu. Koszt jest pokazywany przed potwierdzeniem.',
			],
			auto: [
				'Autospin',
				'Rozgrywa automatycznie wybraną liczbę rund. Otwórz, aby ustawić liczbę i warunki zatrzymania; naciśnij ponownie, aby przerwać wcześniej.',
			],
			turbo: ['Turbo', 'Skraca animacje obrotów i wygranych. Podświetlenie oznacza włączone turbo.'],
			menu: ['Menu', 'Otwiera tabelę wypłat, te zasady oraz ustawienia dźwięku i gry.'],
			info: ['Info', 'Otwiera te zasady gry.'],
			settings: [
				'Ustawienia',
				'Otwiera regulację głośności: głośność ogólną, muzykę i efekty dźwiękowe, każde osobno.',
			],
			paytable: [
				'Tabela wypłat',
				'Pokazuje każdy symbol i jego wypłatę za 3, 4 i 5 jednakowych, a także linie wygrywające.',
			],
			sound: ['Dźwięk', 'Wycisza i przywraca dźwięk gry. Głośność reguluje się w Ustawieniach.'],
		},
		amountPlate: plate('BET'),
		buyPlate: plate('BUY BONUS'),
		skipNote:
			'Podczas naliczania dużej wygranej dotknięcie dowolnego miejsca przechodzi od razu do kwoty końcowej.',
		modesTitle: 'RTP i maks. wygrana w trybach',
		modesHead: ['Tryb', 'Jak wejść', 'RTP', 'Maks. wygrana'],
		baseGame: 'Gra podstawowa',
		everySpin: 'Każdy obrót',
		buyFor: (cost) => `Kup za ${cost}× zakład`,
		maxWinCell: (maxWin) => `${maxWin}× zakład`,
		modesNote:
			'Maksymalna wygrana to wielokrotność zakładu podstawowego, a nie kosztu wejścia do funkcji. Gdy runda osiągnie limit, kończy się natychmiast i wypłacana jest kwota limitu.',
		wildTitle: 'Wild',
		scatterTitle: 'Scatter i darmowe obroty',
		scatters: (n) => `${n} ${n >= 5 ? 'symboli' : 'symbole'} Scatter`,
		retrigTitle: 'Ponowne aktywacje',
		retrig:
			'Wylądowanie kolejnych symboli Scatter naraz podczas funkcji przyznaje dodatkowe darmowe obroty: 2 symbole Scatter dają +2, 3 symbole +4, 4 symbole +6, a 5 symboli +8. Dotyczy to wszystkich trzech funkcji.',
		noLimit:
			'Liczba darmowych obrotów, które można wygrać, jest nieograniczona. Funkcja kończy się, gdy skończą się jej darmowe obroty lub gdy zostanie osiągnięta maksymalna wygrana.',
		entryTitle: 'Wejście do funkcji',
		entry: (v) =>
			`Zamiast czekać na symbole Scatter, każdą funkcję można kupić bezpośrednio przyciskiem ${v.buyName} za koszt podany w tabeli powyżej. Obok kosztu znajduje się tam też RTP każdego trybu; we wszystkich trybach wynosi od ${v.rtpLow} do ${v.rtpHigh}.`,
		maxTitle: 'Maksymalna wygrana',
		max: (v) =>
			`Maksymalna wypłata jest ograniczona do ${v.maxWin}× zakładu podstawowego w każdym trybie. Po osiągnięciu limitu runda natychmiast się kończy i przyznawana jest maksymalna wygrana.`,
		foot: 'Awaria unieważnia wszystkie wypłaty i gry. Wymagane jest stabilne połączenie z internetem. W razie rozłączenia wczytaj grę ponownie, aby dokończyć nieukończone rundy. Oczekiwany zwrot jest obliczany na podstawie bardzo wielu gier. Obraz gry nie przedstawia żadnego fizycznego urządzenia i ma charakter wyłącznie poglądowy. Wygrane są rozliczane według kwoty otrzymanej z serwera gry (Remote Game Server), a nie według zdarzeń w przeglądarce.',
		payTableTitle: plate('PAYTABLE'),
		ptNote: (lines) =>
			`Wypłaty podane jako wielokrotność zakładu podstawowego. Wygrane z linii płacą od lewej do prawej na ${lines} stałych liniach wygrywających.`,
		ptScatter: (fs) => `Brak wypłaty — 3, 4 lub 5 symboli Scatter daje ${fs} darmowych obrotów`,
		ptLinesTitle: (n) => `${n} LINII WYGRYWAJĄCYCH`,
		ptLinesNote: (n) =>
			`Wszystkich ${n} linii jest zawsze aktywnych. Wygrane płacą od lewej do prawej od bębna 1.`,
	}),
	ru: () => ({
		gameRulesCaps: 'ПРАВИЛА ИГРЫ',
		gameRulesTitle: 'Правила игры',
		factGrid: 'поле',
		factLines: 'линий выплат',
		factMaxWin: 'макс. выигрыш',
		howTitle: 'Как играть',
		how: (v) =>
			`${v.game} — видеослот ${v.reels}×${v.rows} с ${v.lines} фиксированными линиями выплат. Выигрышные комбинации оплачиваются слева направо на соседних барабанах, начиная с крайнего левого. На каждой линии выплачивается только наибольший выигрыш, а все выигрыши по линиям суммируются. Теоретический возврат игроку (RTP) составляет ${v.rtpRange} в зависимости от режима — значения для каждого режима приведены в таблице ниже.`,
		controlsTitle: 'Управление',
		controls: {
			spin: [
				'Вращение',
				'Запускает раунд с текущей ставкой. Пробел делает то же самое. Пока барабаны вращаются, кнопка становится «Стоп» и останавливает их досрочно.',
			],
			stepper: ['Уменьшить / увеличить', 'Меняет ставку вверх или вниз по доступным уровням ставок.'],
			amount: [
				'Размер ставки',
				'Показывает текущую ставку. Нажмите, чтобы открыть меню ставок и сразу выбрать любой из доступных уровней.',
			],
			buy: [
				'Купить бонус',
				'Открывает меню функций, где любую из трёх функций бесплатных вращений можно сразу купить за указанную кратность вашей ставки. Стоимость показывается до подтверждения.',
			],
			auto: [
				'Автовращение',
				'Автоматически играет выбранное число раундов. Откройте, чтобы задать количество и условия остановки; нажмите ещё раз, чтобы остановить досрочно.',
			],
			turbo: ['Турбо', 'Сокращает анимации вращения и выигрышей. Подсветка означает, что турбо включено.'],
			menu: ['Меню', 'Открывает таблицу выплат, эти правила, а также настройки звука и игры.'],
			info: ['Инфо', 'Открывает эти правила игры.'],
			settings: [
				'Настройки',
				'Открывает регулировку громкости: общая громкость, музыка и звуковые эффекты, каждая отдельно.',
			],
			paytable: [
				'Таблица выплат',
				'Показывает каждый символ и его выплату за 3, 4 и 5 одинаковых, а также линии выплат.',
			],
			sound: ['Звук', 'Выключает и включает звук игры. Громкость регулируется в настройках.'],
		},
		amountPlate: plate('BET'),
		buyPlate: plate('BUY BONUS'),
		skipNote: 'Пока подсчитывается крупный выигрыш, нажатие в любом месте сразу показывает итоговую сумму.',
		modesTitle: 'RTP и максимальный выигрыш по режимам',
		modesHead: ['Режим', 'Как попасть', 'RTP', 'Макс. выигрыш'],
		baseGame: 'Основная игра',
		everySpin: 'Каждое вращение',
		buyFor: (cost) => `Покупка за ${cost}× ставки`,
		maxWinCell: (maxWin) => `${maxWin}× ставки`,
		modesNote:
			'Максимальный выигрыш кратен базовой ставке, а не стоимости входа в функцию. Когда раунд достигает лимита, он сразу завершается и выплачивается сумма лимита.',
		wildTitle: 'Wild',
		scatterTitle: 'Scatter и бесплатные вращения',
		scatters: (n) => `${n} Scatter`,
		retrigTitle: 'Повторный запуск',
		retrig:
			'Новые Scatter, выпавшие вместе во время функции, дают дополнительные бесплатные вращения: 2 Scatter — +2, 3 Scatter — +4, 4 Scatter — +6 и 5 Scatter — +8. Это действует во всех трёх функциях.',
		noLimit:
			'Количество бесплатных вращений, которые можно выиграть, не ограничено. Функция завершается, когда заканчиваются её бесплатные вращения или достигнут максимальный выигрыш.',
		entryTitle: 'Вход в функции',
		entry: (v) =>
			`Вместо того чтобы ждать Scatter, любую функцию можно купить сразу кнопкой «${v.buyName}» по стоимости из таблицы выше. Там же рядом со стоимостью указан RTP каждого режима; по всем режимам он составляет от ${v.rtpLow} до ${v.rtpHigh}.`,
		maxTitle: 'Максимальный выигрыш',
		max: (v) =>
			`Максимальная выплата во всех режимах ограничена ${v.maxWin}× базовой ставки. При достижении лимита раунд сразу завершается и выплачивается максимальный выигрыш.`,
		foot: 'Неисправность аннулирует все выплаты и игры. Требуется стабильное интернет-соединение. При разрыве соединения перезагрузите игру, чтобы завершить незаконченные раунды. Ожидаемый возврат рассчитывается на большом количестве игр. Изображение игры не соответствует какому-либо физическому устройству и служит только для иллюстрации. Выигрыши рассчитываются по сумме, полученной от удалённого игрового сервера (Remote Game Server), а не по событиям в браузере.',
		payTableTitle: plate('PAYTABLE'),
		ptNote: (lines) =>
			`Выплаты указаны в кратных базовой ставки. Выигрыши по линиям оплачиваются слева направо на ${lines} фиксированных линиях выплат.`,
		ptScatter: (fs) => `Не оплачивается — 3, 4 или 5 Scatter дают ${fs} бесплатных вращений`,
		ptLinesTitle: (n) => `${n} ЛИНИЙ ВЫПЛАТ`,
		ptLinesNote: (n) =>
			`Все ${n} линий всегда активны. Выигрыши оплачиваются слева направо начиная с 1-го барабана.`,
	}),
	tr: () => ({
		gameRulesCaps: 'OYUN KURALLARI',
		gameRulesTitle: 'Oyun kuralları',
		factGrid: 'ızgara',
		factLines: 'ödeme çizgisi',
		factMaxWin: 'maks. kazanç',
		howTitle: 'Nasıl oynanır',
		how: (v) =>
			`${v.game}, ${v.lines} sabit ödeme çizgisine sahip ${v.reels}×${v.rows} bir video slottur. Kazanan kombinasyonlar, en soldaki makaradan başlayarak bitişik makaralarda soldan sağa öder. Her çizgide yalnızca en yüksek kazanç ödenir ve tüm çizgi kazançları toplanır. Teorik oyuncuya dönüş oranı (RTP), oynanan moda göre ${v.rtpRange} olur — her modun değeri aşağıdaki tabloda yer alır.`,
		controlsTitle: 'Kontroller',
		controls: {
			spin: [
				'Döndür',
				'Mevcut bahisle bir tur başlatır. Boşluk tuşu da aynı işi yapar. Makaralar dönerken Dur düğmesine dönüşür ve onları erken durdurur.',
			],
			stepper: ['Azalt / artır', 'Bahsi mevcut bahis seviyeleri arasında yukarı veya aşağı değiştirir.'],
			amount: [
				'Bahis tutarı',
				'Mevcut bahsi gösterir. Dokunarak bahis menüsünü açın ve mevcut seviyelerden birini doğrudan seçin.',
			],
			buy: [
				'Bonus satın al',
				'Özellik menüsünü açar; üç ücretsiz dönüş özelliğinden herhangi biri, bahsinizin belirtilen katı karşılığında doğrudan satın alınabilir. Onaylamadan önce maliyet gösterilir.',
			],
			auto: [
				'Otomatik döndürme',
				'Seçilen sayıda turu otomatik oynar. Sayıyı ve durdurma koşullarını ayarlamak için açın; erken durdurmak için tekrar basın.',
			],
			turbo: ['Turbo', 'Dönüş ve kazanç animasyonlarını kısaltır. Yanıyorsa turbo açıktır.'],
			menu: ['Menü', 'Ödeme tablosunu, bu kuralları ve ses ile ayar kontrollerini açar.'],
			info: ['Bilgi', 'Bu oyun kurallarını açar.'],
			settings: ['Ayarlar', 'Ses kontrollerini açar: ana ses, müzik ve ses efektleri ayrı ayrı ayarlanır.'],
			paytable: [
				'Ödeme tablosu',
				'Her sembolü ve 3, 4 ve 5’li eşleşmede ne ödediğini, ayrıca ödeme çizgilerini listeler.',
			],
			sound: ['Ses', 'Oyunun sesini kapatır ve açar. Ses düzeyi Ayarlar bölümünden ayarlanır.'],
		},
		amountPlate: plate('BET'),
		buyPlate: plate('BUY BONUS'),
		skipNote: 'Büyük bir kazanç sayılırken herhangi bir yere dokunmak doğrudan son tutara geçer.',
		modesTitle: 'Moda göre RTP ve maks. kazanç',
		modesHead: ['Mod', 'Giriş', 'RTP', 'Maks. kazanç'],
		baseGame: 'Ana oyun',
		everySpin: 'Her dönüş',
		buyFor: (cost) => `${cost}× bahis karşılığı satın al`,
		maxWinCell: (maxWin) => `${maxWin}× bahis`,
		modesNote:
			'Maksimum kazanç, bir özelliğin giriş maliyetinin değil, temel bahsin katıdır. Bir tur bu sınıra ulaştığında hemen sona erer ve sınırlanan tutar ödenir.',
		wildTitle: 'Wild',
		scatterTitle: 'Scatter ve ücretsiz dönüşler',
		scatters: (n) => `${n} Scatter`,
		retrigTitle: 'Yeniden tetikleme',
		retrig:
			'Bir özellik sırasında birlikte yeni Scatter’lar gelirse ek ücretsiz dönüşler verilir: 2 Scatter +2, 3 Scatter +4, 4 Scatter +6 ve 5 Scatter +8 verir. Bu, üç özelliğin hepsinde geçerlidir.',
		noLimit:
			'Kazanılabilecek ücretsiz dönüş sayısında sınır yoktur. Bir özellik, ücretsiz dönüşleri bittiğinde veya maksimum kazanca ulaşıldığında sona erer.',
		entryTitle: 'Özelliğe giriş',
		entry: (v) =>
			`Scatter’ları beklemek yerine her özellik, yukarıdaki tabloda gösterilen maliyet karşılığında ${v.buyName} düğmesiyle doğrudan satın alınabilir. Her modun RTP’si orada maliyetinin yanında gösterilir; tüm modlarda ${v.rtpLow} ile ${v.rtpHigh} arasındadır.`,
		maxTitle: 'Maksimum kazanç',
		max: (v) =>
			`Maksimum ödeme, her modda temel bahsin ${v.maxWin} katıyla sınırlıdır. Sınıra ulaşıldığında tur hemen sona erer ve maksimum kazanç verilir.`,
		foot: 'Arıza durumunda tüm ödemeler ve oyunlar geçersizdir. Kesintisiz bir internet bağlantısı gerekir. Bağlantı kesilirse tamamlanmamış turları bitirmek için oyunu yeniden yükleyin. Beklenen getiri çok sayıda oyun üzerinden hesaplanır. Oyun ekranı herhangi bir fiziksel cihazı temsil etmez ve yalnızca görsel amaçlıdır. Kazançlar, web tarayıcısındaki olaylara göre değil, Uzak Oyun Sunucusu’ndan (Remote Game Server) alınan tutara göre ödenir.',
		payTableTitle: plate('PAYTABLE'),
		ptNote: (lines) =>
			`Ödemeler temel bahsin katı olarak gösterilir. Çizgi kazançları ${lines} sabit ödeme çizgisinde soldan sağa öder.`,
		ptScatter: (fs) => `Ödeme yapmaz — 3, 4 veya 5 Scatter ${fs} ücretsiz dönüş verir`,
		ptLinesTitle: (n) => `${n} ÖDEME ÇİZGİSİ`,
		ptLinesNote: (n) => `${n} çizginin tamamı her zaman etkindir. Kazançlar 1. makaradan başlayarak soldan sağa öder.`,
	}),
	fi: () => ({
		gameRulesCaps: 'PELISÄÄNNÖT',
		gameRulesTitle: 'Pelisäännöt',
		factGrid: 'ruudukko',
		factLines: 'voittolinjaa',
		factMaxWin: 'maksimivoitto',
		howTitle: 'Näin pelaat',
		how: (v) =>
			`${v.game} on ${v.reels}×${v.rows}-videokolikkopeli, jossa on ${v.lines} kiinteää voittolinjaa. Voittoyhdistelmät maksavat vasemmalta oikealle vierekkäisillä rullilla vasemmanpuoleisimmasta rullasta alkaen. Kultakin linjalta maksetaan vain suurin voitto, ja kaikki linjavoitot lasketaan yhteen. Teoreettinen palautusprosentti (RTP) on ${v.rtpRange} pelattavasta tilasta riippuen — kunkin tilan arvo on alla olevassa taulukossa.`,
		controlsTitle: 'Ohjaimet',
		controls: {
			spin: [
				'Pyöritä',
				'Aloittaa kierroksen nykyisellä panoksella. Välilyönti tekee saman. Kun rullat pyörivät, painike muuttuu Pysäytä-painikkeeksi, joka pysäyttää ne aikaisemmin.',
			],
			stepper: ['Pienennä / suurenna', 'Muuttaa panosta ylös tai alas saatavilla olevien panostasojen mukaan.'],
			amount: [
				'Panoksen määrä',
				'Näyttää nykyisen panoksen. Napauta avataksesi panosvalikon ja valitaksesi suoraan minkä tahansa saatavilla olevan tason.',
			],
			buy: [
				'Osta bonus',
				'Avaa ominaisuusvalikon, josta minkä tahansa kolmesta ilmaiskierrosominaisuudesta voi ostaa suoraan ilmoitetulla panoksesi kerrannaisella. Hinta näytetään ennen vahvistusta.',
			],
			auto: [
				'Automaattipyöritys',
				'Pelaa valitun määrän kierroksia automaattisesti. Avaa se asettaaksesi määrän ja mahdolliset pysäytysehdot; paina uudelleen pysäyttääksesi aikaisemmin.',
			],
			turbo: ['Turbo', 'Lyhentää pyöritys- ja voittoanimaatioita. Kun painike palaa, turbo on päällä.'],
			menu: ['Valikko', 'Avaa voittotaulukon, nämä säännöt sekä ääni- ja asetusvalinnat.'],
			info: ['Info', 'Avaa nämä pelisäännöt.'],
			settings: [
				'Asetukset',
				'Avaa äänenvoimakkuuden säätimet: kokonaisäänenvoimakkuus, musiikki ja ääniefektit, kukin erikseen.',
			],
			paytable: [
				'Voittotaulukko',
				'Luettelee jokaisen symbolin ja sen voiton 3, 4 ja 5 samanlaisesta sekä voittolinjat.',
			],
			sound: ['Ääni', 'Mykistää pelin ja palauttaa äänen. Äänenvoimakkuutta säädetään Asetuksissa.'],
		},
		amountPlate: plate('BET'),
		buyPlate: plate('BUY BONUS'),
		skipNote: 'Kun suurta voittoa lasketaan, napautus mihin tahansa siirtyy suoraan loppusummaan.',
		modesTitle: 'RTP ja maksimivoitto tiloittain',
		modesHead: ['Tila', 'Pääsy', 'RTP', 'Maksimivoitto'],
		baseGame: 'Peruspeli',
		everySpin: 'Jokainen kierros',
		buyFor: (cost) => `Osta hintaan ${cost}× panos`,
		maxWinCell: (maxWin) => `${maxWin}× panos`,
		modesNote:
			'Maksimivoitto on peruspanoksen kerrannainen, ei ominaisuuden sisäänpääsyhinnan. Kun kierros saavuttaa rajan, se päättyy heti ja rajan mukainen summa maksetaan.',
		wildTitle: 'Wild',
		scatterTitle: 'Scatter ja ilmaiskierrokset',
		scatters: (n) => `${n} Scatteria`,
		retrigTitle: 'Uudelleenlaukaisut',
		retrig:
			'Kun ominaisuuden aikana osuu samalla kertaa lisää Scattereita, saat lisää ilmaiskierroksia: 2 Scatteria antaa +2, 3 Scatteria +4, 4 Scatteria +6 ja 5 Scatteria +8. Tämä koskee kaikkia kolmea ominaisuutta.',
		noLimit:
			'Voitettavien ilmaiskierrosten määrää ei ole rajoitettu. Ominaisuus päättyy, kun sen ilmaiskierrokset loppuvat tai kun maksimivoitto saavutetaan.',
		entryTitle: 'Ominaisuuksiin pääsy',
		entry: (v) =>
			`Scattereita odottamatta jokaisen ominaisuuden voi ostaa suoraan ${v.buyName}-painikkeella yllä olevan taulukon hintaan. Taulukossa näkyy myös kunkin tilan RTP hinnan vieressä; kaikissa tiloissa se on ${v.rtpLow}–${v.rtpHigh}.`,
		maxTitle: 'Maksimivoitto',
		max: (v) =>
			`Suurin mahdollinen voitonmaksu on kaikissa tiloissa rajattu ${v.maxWin}-kertaiseen peruspanokseen. Kun raja saavutetaan, kierros päättyy heti ja maksimivoitto maksetaan.`,
		foot: 'Toimintahäiriö mitätöi kaikki voitot ja pelit. Vakaa internetyhteys on välttämätön. Jos yhteys katkeaa, lataa peli uudelleen keskeneräisten kierrosten loppuun viemiseksi. Odotettu palautus lasketaan hyvin suuren pelimäärän perusteella. Pelinäkymä ei kuvaa mitään fyysistä laitetta, ja se on vain havainnollistava. Voitot tilitetään etäpelipalvelimelta (Remote Game Server) saadun summan mukaan, ei selaimessa tapahtuvien asioiden perusteella.',
		payTableTitle: plate('PAYTABLE'),
		ptNote: (lines) =>
			`Voitot näytetään peruspanoksen kerrannaisina. Linjavoitot maksavat vasemmalta oikealle ${lines} kiinteällä voittolinjalla.`,
		ptScatter: (fs) => `Ei maksa — 3, 4 tai 5 Scatteria antaa ${fs} ilmaiskierrosta`,
		ptLinesTitle: (n) => `${n} VOITTOLINJAA`,
		ptLinesNote: (n) => `Kaikki ${n} linjaa ovat aina käytössä. Voitot maksavat vasemmalta oikealle rullasta 1 alkaen.`,
	}),
	id: () => ({
		gameRulesCaps: 'ATURAN PERMAINAN',
		gameRulesTitle: 'Aturan permainan',
		factGrid: 'kisi',
		factLines: 'garis pembayaran',
		factMaxWin: 'kemenangan maks.',
		howTitle: 'Cara bermain',
		how: (v) =>
			`${v.game} adalah slot video ${v.reels}×${v.rows} dengan ${v.lines} garis pembayaran tetap. Kombinasi pemenang membayar dari kiri ke kanan pada gulungan yang berdampingan, mulai dari gulungan paling kiri. Hanya kemenangan tertinggi yang dibayar per garis, dan semua kemenangan garis dijumlahkan. Pengembalian teoretis ke pemain (RTP) adalah ${v.rtpRange}, tergantung mode yang dimainkan — angka setiap mode tercantum di tabel di bawah.`,
		controlsTitle: 'Kontrol',
		controls: {
			spin: [
				'Putar',
				'Memulai satu ronde dengan taruhan saat ini. Tombol spasi melakukan hal yang sama. Saat gulungan berputar, tombol ini menjadi Berhenti untuk menghentikannya lebih awal.',
			],
			stepper: ['Kurangi / tambah', 'Menaikkan atau menurunkan taruhan melalui level taruhan yang tersedia.'],
			amount: [
				'Jumlah taruhan',
				'Menampilkan taruhan saat ini. Ketuk untuk membuka menu taruhan dan langsung memilih salah satu level yang tersedia.',
			],
			buy: [
				'Beli bonus',
				'Membuka menu fitur, tempat salah satu dari tiga fitur putaran gratis dapat langsung dibeli seharga kelipatan taruhan Anda yang tertera. Biaya ditampilkan sebelum Anda mengonfirmasi.',
			],
			auto: [
				'Putar otomatis',
				'Memainkan sejumlah ronde pilihan secara otomatis. Buka untuk mengatur jumlah dan kondisi berhenti; tekan lagi untuk berhenti lebih awal.',
			],
			turbo: ['Turbo', 'Mempersingkat animasi putaran dan kemenangan. Menyala berarti turbo aktif.'],
			menu: ['Menu', 'Membuka tabel pembayaran, aturan ini, serta kontrol suara dan pengaturan.'],
			info: ['Info', 'Membuka aturan permainan ini.'],
			settings: [
				'Pengaturan',
				'Membuka kontrol volume: volume utama, musik, dan efek suara, masing-masing diatur terpisah.',
			],
			paytable: [
				'Tabel pembayaran',
				'Menampilkan setiap simbol dan pembayarannya untuk 3, 4, dan 5 yang sama, serta garis pembayaran.',
			],
			sound: ['Suara', 'Mematikan dan menyalakan suara permainan. Volume diatur di Pengaturan.'],
		},
		amountPlate: plate('BET'),
		buyPlate: plate('BUY BONUS'),
		skipNote: 'Saat kemenangan besar sedang dihitung, mengetuk di mana saja langsung menampilkan jumlah akhir.',
		modesTitle: 'RTP & kemenangan maks. per mode',
		modesHead: ['Mode', 'Cara masuk', 'RTP', 'Kemenangan maks.'],
		baseGame: 'Permainan dasar',
		everySpin: 'Setiap putaran',
		buyFor: (cost) => `Beli seharga ${cost}× taruhan`,
		maxWinCell: (maxWin) => `${maxWin}× taruhan`,
		modesNote:
			'Kemenangan maksimum adalah kelipatan taruhan dasar, bukan biaya masuk fitur. Saat sebuah ronde mencapai batas, ronde langsung berakhir dan jumlah batas tersebut dibayarkan.',
		wildTitle: 'Wild',
		scatterTitle: 'Scatter & putaran gratis',
		scatters: (n) => `${n} Scatter`,
		retrigTitle: 'Pemicuan ulang',
		retrig:
			'Mendaratkan Scatter lagi secara bersamaan selama fitur memberikan putaran gratis tambahan: 2 Scatter memberi +2, 3 Scatter +4, 4 Scatter +6, dan 5 Scatter +8. Ini berlaku di ketiga fitur.',
		noLimit:
			'Tidak ada batas jumlah putaran gratis yang dapat dimenangkan. Fitur berakhir saat putaran gratisnya habis atau saat kemenangan maksimum tercapai.',
		entryTitle: 'Masuk fitur',
		entry: (v) =>
			`Daripada menunggu Scatter, setiap fitur dapat dibeli langsung dengan tombol ${v.buyName} seharga biaya di tabel di atas. RTP setiap mode juga tercantum di sana di samping biayanya; di semua mode berkisar dari ${v.rtpLow} hingga ${v.rtpHigh}.`,
		maxTitle: 'Kemenangan maksimum',
		max: (v) =>
			`Pembayaran maksimum dibatasi ${v.maxWin}× taruhan dasar di setiap mode. Setelah batas tercapai, ronde langsung berakhir dan kemenangan maksimum diberikan.`,
		foot: 'Kerusakan membatalkan semua pembayaran dan permainan. Diperlukan koneksi internet yang stabil. Jika koneksi terputus, muat ulang permainan untuk menyelesaikan ronde yang belum selesai. Pengembalian yang diharapkan dihitung dari banyak permainan. Tampilan permainan tidak mewakili perangkat fisik apa pun dan hanya untuk ilustrasi. Kemenangan diselesaikan berdasarkan jumlah yang diterima dari Remote Game Server, bukan dari kejadian di peramban web.',
		payTableTitle: plate('PAYTABLE'),
		ptNote: (lines) =>
			`Pembayaran ditampilkan sebagai kelipatan taruhan dasar. Kemenangan garis membayar dari kiri ke kanan pada ${lines} garis pembayaran tetap.`,
		ptScatter: (fs) => `Tidak membayar — 3, 4, atau 5 Scatter memberi ${fs} putaran gratis`,
		ptLinesTitle: (n) => `${n} GARIS PEMBAYARAN`,
		ptLinesNote: (n) => `Semua ${n} garis selalu aktif. Kemenangan membayar dari kiri ke kanan mulai gulungan 1.`,
	}),
	vi: () => ({
		gameRulesCaps: 'LUẬT CHƠI',
		gameRulesTitle: 'Luật chơi',
		factGrid: 'lưới',
		factLines: 'dòng thanh toán',
		factMaxWin: 'thắng tối đa',
		howTitle: 'Cách chơi',
		how: (v) =>
			`${v.game} là máy slot video ${v.reels}×${v.rows} với ${v.lines} dòng thanh toán cố định. Các tổ hợp thắng trả thưởng từ trái sang phải trên các cuộn liền kề, bắt đầu từ cuộn ngoài cùng bên trái. Mỗi dòng chỉ trả khoản thắng cao nhất, và mọi khoản thắng theo dòng được cộng lại. Tỷ lệ hoàn trả lý thuyết cho người chơi (RTP) là ${v.rtpRange}, tùy chế độ chơi — giá trị của từng chế độ có trong bảng bên dưới.`,
		controlsTitle: 'Điều khiển',
		controls: {
			spin: [
				'Quay',
				'Bắt đầu một lượt với mức cược hiện tại. Phím cách cũng có tác dụng tương tự. Khi các cuộn đang quay, nút này thành Dừng để dừng chúng sớm.',
			],
			stepper: ['Giảm / tăng', 'Tăng hoặc giảm mức cược theo các mức cược có sẵn.'],
			amount: [
				'Số tiền cược',
				'Hiển thị mức cược hiện tại. Chạm vào để mở menu cược và chọn ngay bất kỳ mức nào có sẵn.',
			],
			buy: [
				'Mua thưởng',
				'Mở menu tính năng, nơi có thể mua ngay bất kỳ tính năng vòng quay miễn phí nào trong ba tính năng với bội số mức cược đã nêu. Chi phí được hiển thị trước khi bạn xác nhận.',
			],
			auto: [
				'Quay tự động',
				'Tự động chơi số lượt đã chọn. Mở để đặt số lượt và các điều kiện dừng; nhấn lại để dừng sớm.',
			],
			turbo: ['Turbo', 'Rút ngắn hiệu ứng quay và thắng. Sáng đèn nghĩa là turbo đang bật.'],
			menu: ['Menu', 'Mở bảng trả thưởng, luật chơi này cùng các điều khiển âm thanh và cài đặt.'],
			info: ['Thông tin', 'Mở luật chơi này.'],
			settings: [
				'Cài đặt',
				'Mở điều khiển âm lượng: âm lượng chung, nhạc và hiệu ứng âm thanh, chỉnh riêng từng mục.',
			],
			paytable: [
				'Bảng trả thưởng',
				'Liệt kê từng biểu tượng và mức trả cho 3, 4 và 5 biểu tượng giống nhau, cùng các dòng thanh toán.',
			],
			sound: ['Âm thanh', 'Tắt và bật âm thanh trò chơi. Âm lượng được chỉnh trong Cài đặt.'],
		},
		amountPlate: plate('BET'),
		buyPlate: plate('BUY BONUS'),
		skipNote: 'Khi một khoản thắng lớn đang được đếm, chạm vào bất kỳ đâu sẽ chuyển ngay đến số tiền cuối cùng.',
		modesTitle: 'RTP & thắng tối đa theo chế độ',
		modesHead: ['Chế độ', 'Cách vào', 'RTP', 'Thắng tối đa'],
		baseGame: 'Trò chơi chính',
		everySpin: 'Mọi lượt quay',
		buyFor: (cost) => `Mua với ${cost}× mức cược`,
		maxWinCell: (maxWin) => `${maxWin}× mức cược`,
		modesNote:
			'Thắng tối đa là bội số của mức cược cơ bản, không phải của chi phí vào tính năng. Khi một lượt chạm mức trần, lượt đó kết thúc ngay và số tiền trần được trả.',
		wildTitle: 'Wild',
		scatterTitle: 'Scatter & vòng quay miễn phí',
		scatters: (n) => `${n} Scatter`,
		retrigTitle: 'Kích hoạt lại',
		retrig:
			'Khi có thêm Scatter cùng xuất hiện trong lúc chơi tính năng, bạn nhận thêm vòng quay miễn phí: 2 Scatter được +2, 3 Scatter +4, 4 Scatter +6 và 5 Scatter +8. Áp dụng cho cả ba tính năng.',
		noLimit:
			'Không giới hạn số vòng quay miễn phí có thể thắng. Tính năng kết thúc khi hết vòng quay miễn phí hoặc khi đạt mức thắng tối đa.',
		entryTitle: 'Vào tính năng',
		entry: (v) =>
			`Thay vì chờ Scatter, mỗi tính năng có thể được mua trực tiếp bằng nút ${v.buyName} với chi phí ghi trong bảng phía trên. RTP của từng chế độ cũng có ở đó, cạnh chi phí; trên mọi chế độ, RTP nằm trong khoảng ${v.rtpLow} đến ${v.rtpHigh}.`,
		maxTitle: 'Thắng tối đa',
		max: (v) =>
			`Khoản trả tối đa được giới hạn ở ${v.maxWin}× mức cược cơ bản trong mọi chế độ. Khi chạm mức trần, lượt chơi kết thúc ngay và khoản thắng tối đa được trao.`,
		foot: 'Lỗi trục trặc làm vô hiệu mọi khoản trả và lượt chơi. Cần có kết nối internet ổn định. Nếu mất kết nối, hãy tải lại trò chơi để hoàn tất các lượt chưa xong. Mức hoàn trả kỳ vọng được tính trên rất nhiều lượt chơi. Hình ảnh trò chơi không đại diện cho bất kỳ thiết bị vật lý nào và chỉ mang tính minh họa. Tiền thắng được thanh toán theo số tiền nhận từ máy chủ trò chơi từ xa (Remote Game Server), không theo các sự kiện trong trình duyệt.',
		payTableTitle: plate('PAYTABLE'),
		ptNote: (lines) =>
			`Mức trả hiển thị theo bội số của mức cược cơ bản. Thắng theo dòng trả từ trái sang phải trên ${lines} dòng thanh toán cố định.`,
		ptScatter: (fs) => `Không trả thưởng — 3, 4 hoặc 5 Scatter cho ${fs} vòng quay miễn phí`,
		ptLinesTitle: (n) => `${n} DÒNG THANH TOÁN`,
		ptLinesNote: (n) => `Cả ${n} dòng luôn hoạt động. Thắng trả từ trái sang phải bắt đầu từ cuộn 1.`,
	}),
	ja: () => ({
		gameRulesCaps: 'ゲームルール',
		gameRulesTitle: 'ゲームルール',
		factGrid: 'グリッド',
		factLines: 'ペイライン',
		factMaxWin: '最大配当',
		howTitle: '遊び方',
		how: (v) =>
			`${v.game}は${v.reels}×${v.rows}のビデオスロットで、${v.lines}本の固定ペイラインがあります。当たりの組み合わせは、左端のリールから隣り合うリール上を左から右へ配当されます。各ラインでは最も高い当たりのみが支払われ、すべてのライン配当が合算されます。理論上のプレイヤー還元率（RTP）はプレイするモードにより${v.rtpRange}です。各モードの数値は下の表に記載しています。`,
		controlsTitle: '操作',
		controls: {
			spin: [
				'スピン',
				'現在のベットでラウンドを開始します。スペースキーでも同じ操作ができます。リールの回転中はストップに変わり、リールを早く止められます。',
			],
			stepper: ['減らす / 増やす', '利用可能なベットレベルの中でベットを上げ下げします。'],
			amount: ['ベット額', '現在のベットを表示します。タップするとベットメニューが開き、利用可能なレベルを直接選べます。'],
			buy: [
				'ボーナス購入',
				'フィーチャーメニューを開きます。3種類のフリースピンフィーチャーのいずれも、表示されたベットの倍数ですぐに購入できます。確定前に費用が表示されます。',
			],
			auto: [
				'オートスピン',
				'選んだ回数のラウンドを自動でプレイします。開いて回数と停止条件を設定し、もう一度押すと途中で止まります。',
			],
			turbo: ['ターボ', 'スピンと当たりの演出を短くします。点灯中はターボがオンです。'],
			menu: ['メニュー', '配当表、このルール、サウンドと設定を開きます。'],
			info: ['情報', 'このゲームルールを開きます。'],
			settings: ['設定', '音量設定を開きます。全体音量、音楽、効果音をそれぞれ個別に調整できます。'],
			paytable: ['配当表', '各シンボルの3・4・5個揃いの配当とペイラインを一覧表示します。'],
			sound: ['サウンド', 'ゲームの音のミュートと解除を切り替えます。音量は設定で調整します。'],
		},
		amountPlate: plate('BET'),
		buyPlate: plate('BUY BONUS'),
		skipNote: 'ビッグウィンのカウント中は、どこかをタップすると最終金額までスキップします。',
		modesTitle: 'モード別のRTPと最大配当',
		modesHead: ['モード', '開始方法', 'RTP', '最大配当'],
		baseGame: 'ベースゲーム',
		everySpin: '毎スピン',
		buyFor: (cost) => `ベットの${cost}倍で購入`,
		maxWinCell: (maxWin) => `ベットの${maxWin}倍`,
		modesNote:
			'最大配当はベースベットの倍数であり、フィーチャーの購入費用の倍数ではありません。ラウンドが上限に達すると直ちに終了し、上限額が支払われます。',
		wildTitle: 'ワイルド',
		scatterTitle: 'スキャッターとフリースピン',
		scatters: (n) => `スキャッター${n}個`,
		retrigTitle: 'リトリガー',
		retrig:
			'フィーチャー中にスキャッターが同時に出現すると、フリースピンが追加されます。スキャッター2個で+2、3個で+4、4個で+6、5個で+8。3つのフィーチャーすべてで適用されます。',
		noLimit:
			'獲得できるフリースピンの回数に上限はありません。フィーチャーはフリースピンを使い切るか、最大配当に達すると終了します。',
		entryTitle: 'フィーチャーの購入',
		entry: (v) =>
			`スキャッターを待たずに、各フィーチャーは「${v.buyName}」ボタンから上の表に記載の費用で直接購入できます。各モードのRTPも費用と並べて表に記載しており、全モードで${v.rtpLow}～${v.rtpHigh}です。`,
		maxTitle: '最大配当',
		max: (v) =>
			`最大配当はすべてのモードでベースベットの${v.maxWin}倍が上限です。上限に達するとラウンドは直ちに終了し、最大配当が支払われます。`,
		foot: '誤作動が発生した場合、すべての配当とプレイは無効となります。安定したインターネット接続が必要です。接続が切れた場合は、ゲームを再読み込みして未完了のラウンドを完了してください。期待還元率は多数のプレイを通じて算出されます。ゲーム画面は実在の機器を表すものではなく、説明のためのイメージです。配当はウェブブラウザ上の出来事ではなく、リモートゲームサーバー（Remote Game Server）から受信した金額に基づいて確定します。',
		payTableTitle: plate('PAYTABLE'),
		ptNote: (lines) =>
			`配当はベースベットに対する倍率で表示しています。ライン配当は${lines}本の固定ペイライン上で左から右へ支払われます。`,
		ptScatter: (fs) => `配当なし — スキャッター3・4・5個でフリースピン${fs}回`,
		ptLinesTitle: (n) => `${n}本のペイライン`,
		ptLinesNote: (n) => `${n}本のラインは常に有効です。配当はリール1から左から右へ支払われます。`,
	}),
	ko: () => ({
		gameRulesCaps: '게임 규칙',
		gameRulesTitle: '게임 규칙',
		factGrid: '그리드',
		factLines: '페이라인',
		factMaxWin: '최대 당첨',
		howTitle: '게임 방법',
		how: (v) =>
			`${v.game}은(는) ${v.lines}개의 고정 페이라인이 있는 ${v.reels}×${v.rows} 비디오 슬롯입니다. 당첨 조합은 가장 왼쪽 릴부터 인접한 릴에서 왼쪽에서 오른쪽으로 지급됩니다. 각 라인에서는 가장 높은 당첨만 지급되며, 모든 라인 당첨은 합산됩니다. 이론적 플레이어 환수율(RTP)은 플레이하는 모드에 따라 ${v.rtpRange}이며, 모드별 수치는 아래 표에 나와 있습니다.`,
		controlsTitle: '조작',
		controls: {
			spin: [
				'스핀',
				'현재 베팅으로 라운드를 시작합니다. 스페이스 바도 같은 기능을 합니다. 릴이 도는 동안에는 정지 버튼이 되어 릴을 일찍 멈춥니다.',
			],
			stepper: ['감소 / 증가', '사용 가능한 베팅 단계에 따라 베팅을 올리거나 내립니다.'],
			amount: ['베팅 금액', '현재 베팅을 표시합니다. 탭하면 베팅 메뉴가 열려 사용 가능한 단계를 바로 선택할 수 있습니다.'],
			buy: [
				'보너스 구매',
				'기능 메뉴를 엽니다. 세 가지 프리 스핀 기능 중 어느 것이든 표시된 베팅 배수로 바로 구매할 수 있습니다. 확인 전에 비용이 표시됩니다.',
			],
			auto: [
				'자동 스핀',
				'선택한 횟수만큼 라운드를 자동으로 플레이합니다. 열어서 횟수와 정지 조건을 설정하고, 다시 누르면 일찍 멈춥니다.',
			],
			turbo: ['터보', '스핀과 당첨 연출을 짧게 합니다. 불이 켜져 있으면 터보가 켜진 상태입니다.'],
			menu: ['메뉴', '지급표, 이 규칙, 사운드 및 설정을 엽니다.'],
			info: ['정보', '이 게임 규칙을 엽니다.'],
			settings: ['설정', '볼륨 조절을 엽니다. 전체 볼륨, 음악, 효과음을 각각 따로 설정합니다.'],
			paytable: ['지급표', '각 심볼의 3, 4, 5개 일치 시 지급액과 페이라인을 보여 줍니다.'],
			sound: ['사운드', '게임 소리를 끄고 켭니다. 볼륨은 설정에서 조절합니다.'],
		},
		amountPlate: plate('BET'),
		buyPlate: plate('BUY BONUS'),
		skipNote: '빅 윈 금액이 올라가는 동안 아무 곳이나 탭하면 최종 금액으로 바로 넘어갑니다.',
		modesTitle: '모드별 RTP 및 최대 당첨',
		modesHead: ['모드', '진입 방법', 'RTP', '최대 당첨'],
		baseGame: '기본 게임',
		everySpin: '매 스핀',
		buyFor: (cost) => `베팅의 ${cost}배로 구매`,
		maxWinCell: (maxWin) => `베팅의 ${maxWin}배`,
		modesNote:
			'최대 당첨은 기능 진입 비용이 아닌 기본 베팅의 배수입니다. 라운드가 상한에 도달하면 즉시 종료되고 상한 금액이 지급됩니다.',
		wildTitle: '와일드',
		scatterTitle: '스캐터 및 프리 스핀',
		scatters: (n) => `스캐터 ${n}개`,
		retrigTitle: '리트리거',
		retrig:
			'기능 진행 중 스캐터가 함께 더 나오면 추가 프리 스핀이 주어집니다. 스캐터 2개는 +2, 3개는 +4, 4개는 +6, 5개는 +8입니다. 세 가지 기능 모두에 적용됩니다.',
		noLimit:
			'획득할 수 있는 프리 스핀 수에는 제한이 없습니다. 기능은 프리 스핀을 모두 쓰거나 최대 당첨에 도달하면 종료됩니다.',
		entryTitle: '기능 진입',
		entry: (v) =>
			`스캐터를 기다리는 대신 ${v.buyName} 버튼으로 위 표에 나온 비용에 각 기능을 바로 구매할 수 있습니다. 각 모드의 RTP도 비용 옆에 표시되며, 모든 모드에서 ${v.rtpLow}~${v.rtpHigh}입니다.`,
		maxTitle: '최대 당첨',
		max: (v) =>
			`최대 지급액은 모든 모드에서 기본 베팅의 ${v.maxWin}배로 제한됩니다. 상한에 도달하면 라운드가 즉시 종료되고 최대 당첨이 지급됩니다.`,
		foot: '오작동 시 모든 지급과 플레이는 무효가 됩니다. 안정적인 인터넷 연결이 필요합니다. 연결이 끊기면 게임을 다시 불러와 완료되지 않은 라운드를 마치세요. 기대 환수율은 매우 많은 플레이를 기준으로 계산됩니다. 게임 화면은 실제 기기를 나타내지 않으며 설명을 위한 것입니다. 당첨금은 웹 브라우저 내 이벤트가 아니라 원격 게임 서버(Remote Game Server)에서 받은 금액에 따라 정산됩니다.',
		payTableTitle: plate('PAYTABLE'),
		ptNote: (lines) =>
			`지급액은 기본 베팅의 배수로 표시됩니다. 라인 당첨은 ${lines}개의 고정 페이라인에서 왼쪽에서 오른쪽으로 지급됩니다.`,
		ptScatter: (fs) => `지급 없음 — 스캐터 3, 4, 5개로 프리 스핀 ${fs}회`,
		ptLinesTitle: (n) => `페이라인 ${n}개`,
		ptLinesNote: (n) => `${n}개 라인은 항상 활성화되어 있습니다. 당첨은 1번 릴부터 왼쪽에서 오른쪽으로 지급됩니다.`,
	}),
	zh: () => ({
		gameRulesCaps: '遊戲規則',
		gameRulesTitle: '遊戲規則',
		factGrid: '盤面',
		factLines: '條賠付線',
		factMaxWin: '最高贏分',
		howTitle: '玩法',
		how: (v) =>
			`${v.game} 是 ${v.reels}×${v.rows} 的電子老虎機，共有 ${v.lines} 條固定賠付線。中獎組合從最左邊的輪開始，在相鄰的輪上由左至右計算。每條賠付線只支付最高的一筆贏分，所有賠付線的贏分相加。理論玩家回報率（RTP）依遊玩模式為 ${v.rtpRange}，各模式的數值列於下表。`,
		controlsTitle: '操作說明',
		controls: {
			spin: ['旋轉', '以目前押注開始一手。空白鍵也有相同作用。輪轉動時按鈕會變成「停止」，可提早讓輪停下。'],
			stepper: ['減少／增加', '在可用的押注級距之間調高或調低押注。'],
			amount: ['押注金額', '顯示目前押注。點一下可開啟押注選單，直接選擇任一可用級距。'],
			buy: ['購買獎勵', '開啟特色功能選單，三種免費遊戲功能都可按標示的押注倍數直接購買。確認前會先顯示費用。'],
			auto: ['自動旋轉', '自動進行選定的手數。開啟後可設定手數與停止條件；再按一次可提前停止。'],
			turbo: ['加速', '縮短旋轉與贏分演出。亮起表示加速已開啟。'],
			menu: ['選單', '開啟賠率表、本規則，以及音效與設定。'],
			info: ['資訊', '開啟本遊戲規則。'],
			settings: ['設定', '開啟音量控制：主音量、音樂與音效可分別調整。'],
			paytable: ['賠率表', '列出每個符號 3、4、5 個連線的賠付，以及賠付線。'],
			sound: ['聲音', '開啟或關閉遊戲聲音。音量在「設定」中調整。'],
		},
		amountPlate: plate('BET'),
		buyPlate: plate('BUY BONUS'),
		skipNote: '大獎贏分跳數時，點畫面任一處即可直接顯示最終金額。',
		modesTitle: '各模式 RTP 與最高贏分',
		modesHead: ['模式', '進入方式', 'RTP', '最高贏分'],
		baseGame: '一般遊戲',
		everySpin: '每一手',
		buyFor: (cost) => `以 ${cost} 倍押注購買`,
		maxWinCell: (maxWin) => `押注的 ${maxWin} 倍`,
		modesNote: '最高贏分是基本押注的倍數，而不是特色功能購買費用的倍數。一手達到上限時會立即結束，並支付上限金額。',
		wildTitle: '百搭',
		scatterTitle: '分散符號與免費遊戲',
		scatters: (n) => `${n} 個分散符號`,
		retrigTitle: '再觸發',
		retrig: '特色功能進行中若同時再出現分散符號，可獲得額外免費遊戲：2 個 +2、3 個 +4、4 個 +6、5 個 +8。三種特色功能都適用。',
		noLimit: '可贏得的免費遊戲次數沒有上限。特色功能在免費遊戲用完或達到最高贏分時結束。',
		entryTitle: '購買特色功能',
		entry: (v) =>
			`不必等待分散符號，每個特色功能都可用「${v.buyName}」按鈕，以上表所列費用直接購買。各模式的 RTP 也列在表中費用旁；所有模式介於 ${v.rtpLow} 至 ${v.rtpHigh}。`,
		maxTitle: '最高贏分',
		max: (v) => `各模式的最高派彩上限皆為基本押注的 ${v.maxWin} 倍。達到上限時該手立即結束，並支付最高贏分。`,
		foot: '如遇故障，所有派彩與遊戲一律無效。需要穩定的網路連線。如連線中斷，請重新載入遊戲以完成未結束的回合。預期回報是以大量遊戲次數計算。遊戲畫面不代表任何實體設備，僅供示意。贏分以遠端遊戲伺服器（Remote Game Server）傳回的金額結算，而非依網頁瀏覽器中的事件。',
		payTableTitle: plate('PAYTABLE'),
		ptNote: (lines) => `賠付以基本押注的倍數表示。連線贏分在 ${lines} 條固定賠付線上由左至右計算。`,
		ptScatter: (fs) => `不派彩 — 3、4 或 5 個分散符號獲得 ${fs} 次免費遊戲`,
		ptLinesTitle: (n) => `${n} 條賠付線`,
		ptLinesNote: (n) => `${n} 條賠付線永遠有效。贏分自第 1 輪起由左至右計算。`,
	}),
	ar: () => ({
		dir: 'rtl',
		gameRulesCaps: 'قواعد اللعبة',
		gameRulesTitle: 'قواعد اللعبة',
		factGrid: 'الشبكة',
		factLines: 'خطوط الدفع',
		factMaxWin: 'أقصى ربح',
		howTitle: 'طريقة اللعب',
		how: (v) =>
			`${v.game} هي لعبة سلوت فيديو ${v.reels}×${v.rows} بها ${v.lines} من خطوط الدفع الثابتة. تُدفع التوليفات الرابحة من اليسار إلى اليمين على البكرات المتجاورة بدءًا من البكرة الموجودة في أقصى اليسار. يُدفع أعلى ربح فقط في كل خط، وتُجمع أرباح جميع الخطوط. تبلغ نسبة العائد النظري للاعب (RTP) ‏${v.rtpRange} حسب الوضع الذي تلعبه — وقيمة كل وضع مذكورة في الجدول أدناه.`,
		controlsTitle: 'عناصر التحكم',
		controls: {
			spin: [
				'الدوران',
				'يبدأ جولة بالرهان الحالي. مفتاح المسافة يؤدي الوظيفة نفسها. أثناء دوران البكرات يتحول الزر إلى «إيقاف» لإيقافها مبكرًا.',
			],
			stepper: ['تقليل / زيادة', 'يرفع الرهان أو يخفضه عبر مستويات الرهان المتاحة.'],
			amount: ['قيمة الرهان', 'يعرض الرهان الحالي. اضغط عليه لفتح قائمة الرهان واختيار أي مستوى متاح مباشرة.'],
			buy: [
				'شراء المكافأة',
				'يفتح قائمة الميزات، حيث يمكن شراء أي من ميزات الدورات المجانية الثلاث مباشرة مقابل المضاعف المذكور من رهانك. تظهر التكلفة قبل التأكيد.',
			],
			auto: [
				'الدوران التلقائي',
				'يلعب عددًا مختارًا من الجولات تلقائيًا. افتحه لتحديد العدد وأي شروط للتوقف؛ واضغط عليه مرة أخرى لإيقافه مبكرًا.',
			],
			turbo: ['تيربو', 'يختصر عروض الدوران والأرباح. الإضاءة تعني أن التيربو مفعّل.'],
			menu: ['القائمة', 'تفتح جدول الأرباح وهذه القواعد وعناصر التحكم في الصوت والإعدادات.'],
			info: ['معلومات', 'تفتح قواعد اللعبة هذه.'],
			settings: ['الإعدادات', 'تفتح التحكم في مستوى الصوت: الصوت العام والموسيقى والمؤثرات الصوتية، كلٌّ على حدة.'],
			paytable: ['جدول الأرباح', 'يعرض كل رمز وما يدفعه عند تطابق 3 و4 و5 رموز، إضافة إلى خطوط الدفع.'],
			sound: ['الصوت', 'يكتم صوت اللعبة ويعيده. يُضبط مستوى الصوت من الإعدادات.'],
		},
		amountPlate: plate('BET'),
		buyPlate: plate('BUY BONUS'),
		skipNote: 'أثناء احتساب ربح كبير، يؤدي الضغط في أي مكان إلى الانتقال مباشرة إلى المبلغ النهائي.',
		modesTitle: 'نسبة العائد (RTP) وأقصى ربح حسب الوضع',
		modesHead: ['الوضع', 'طريقة الدخول', 'RTP', 'أقصى ربح'],
		baseGame: 'اللعبة الأساسية',
		everySpin: 'كل دورة',
		buyFor: (cost) => `شراء مقابل ${cost}× الرهان`,
		maxWinCell: (maxWin) => `${maxWin}× الرهان`,
		modesNote:
			'أقصى ربح هو مضاعف للرهان الأساسي، وليس لتكلفة الدخول إلى الميزة. عندما تصل الجولة إلى الحد الأقصى تنتهي فورًا ويُدفع المبلغ المحدد.',
		wildTitle: 'Wild',
		scatterTitle: 'رمز Scatter والدورات المجانية',
		scatters: (n) => `${n} رموز Scatter`,
		retrigTitle: 'إعادة التفعيل',
		retrig:
			'ظهور رموز Scatter إضافية معًا أثناء الميزة يمنح دورات مجانية إضافية: رمزان يمنحان +2، و3 رموز +4، و4 رموز +6، و5 رموز +8. ينطبق ذلك على الميزات الثلاث كلها.',
		noLimit:
			'لا يوجد حد لعدد الدورات المجانية التي يمكن ربحها. تنتهي الميزة عند نفاد دوراتها المجانية أو عند بلوغ أقصى ربح.',
		entryTitle: 'الدخول إلى الميزات',
		entry: (v) =>
			`بدلًا من انتظار رموز Scatter، يمكن شراء كل ميزة مباشرة بزر «${v.buyName}» مقابل التكلفة الموضحة في الجدول أعلاه. تظهر هناك أيضًا نسبة العائد لكل وضع بجانب تكلفته؛ وتتراوح في جميع الأوضاع بين ${v.rtpLow} و${v.rtpHigh}.`,
		maxTitle: 'أقصى ربح',
		max: (v) =>
			`الحد الأقصى للدفع هو ${v.maxWin} ضعف الرهان الأساسي في كل الأوضاع. عند بلوغ الحد تنتهي الجولة فورًا ويُمنح أقصى ربح.`,
		foot: 'أي عطل يُلغي جميع المدفوعات وجولات اللعب. يلزم اتصال مستقر بالإنترنت. في حال انقطاع الاتصال، أعد تحميل اللعبة لإكمال أي جولات غير مكتملة. يُحسب العائد المتوقع على عدد كبير جدًا من الجولات. لا تمثل شاشة اللعبة أي جهاز فعلي وهي لأغراض التوضيح فقط. تُسوّى الأرباح وفق المبلغ المستلم من خادم اللعب البعيد (Remote Game Server) وليس وفق ما يحدث داخل متصفح الويب.',
		payTableTitle: plate('PAYTABLE'),
		ptNote: (lines) =>
			`تُعرض المدفوعات كمضاعف للرهان الأساسي. تُدفع أرباح الخطوط من اليسار إلى اليمين على ${lines} من خطوط الدفع الثابتة.`,
		ptScatter: (fs) => `لا يدفع — 3 أو 4 أو 5 رموز Scatter تمنح ${fs} دورات مجانية`,
		ptLinesTitle: (n) => `${n} خط دفع`,
		ptLinesNote: (n) => `جميع الخطوط الـ${n} نشطة دائمًا. تُدفع الأرباح من اليسار إلى اليمين بدءًا من البكرة 1.`,
	}),
	hi: () => ({
		gameRulesCaps: 'खेल के नियम',
		gameRulesTitle: 'खेल के नियम',
		factGrid: 'ग्रिड',
		factLines: 'पेलाइन',
		factMaxWin: 'अधिकतम जीत',
		howTitle: 'कैसे खेलें',
		how: (v) =>
			`${v.game} एक ${v.reels}×${v.rows} वीडियो स्लॉट है जिसमें ${v.lines} स्थिर पेलाइन हैं। जीतने वाले संयोजन सबसे बाईं रील से शुरू होकर साथ-साथ की रीलों पर बाएँ से दाएँ भुगतान करते हैं। हर लाइन पर केवल सबसे बड़ी जीत का भुगतान होता है, और सभी लाइन जीतें जोड़ी जाती हैं। सैद्धांतिक प्लेयर रिटर्न (RTP) खेले गए मोड के अनुसार ${v.rtpRange} है — हर मोड का आँकड़ा नीचे की तालिका में दिया गया है।`,
		controlsTitle: 'नियंत्रण',
		controls: {
			spin: [
				'स्पिन',
				'मौजूदा दांव के साथ एक राउंड शुरू करता है। स्पेस बार भी यही करता है। रीलें घूमते समय यह स्टॉप बन जाता है, जो उन्हें जल्दी रोक देता है।',
			],
			stepper: ['घटाएँ / बढ़ाएँ', 'उपलब्ध दांव स्तरों के बीच दांव को ऊपर या नीचे करता है।'],
			amount: ['दांव राशि', 'मौजूदा दांव दिखाता है। दांव मेनू खोलने और कोई भी उपलब्ध स्तर सीधे चुनने के लिए इसे टैप करें।'],
			buy: [
				'बोनस खरीदें',
				'फ़ीचर मेनू खोलता है, जहाँ तीनों फ्री स्पिन फ़ीचर में से कोई भी आपके दांव के बताए गए गुणक पर सीधे खरीदा जा सकता है। पुष्टि से पहले लागत दिखाई जाती है।',
			],
			auto: [
				'ऑटो स्पिन',
				'चुनी गई संख्या में राउंड अपने-आप खेलता है। संख्या और रुकने की शर्तें तय करने के लिए इसे खोलें; जल्दी रोकने के लिए फिर से दबाएँ।',
			],
			turbo: ['टर्बो', 'स्पिन और जीत की प्रस्तुतियों को छोटा करता है। जलने का मतलब है टर्बो चालू है।'],
			menu: ['मेनू', 'पेटेबल, ये नियम, और ध्वनि व सेटिंग्स खोलता है।'],
			info: ['जानकारी', 'ये खेल नियम खोलता है।'],
			settings: ['सेटिंग्स', 'वॉल्यूम नियंत्रण खोलता है: मुख्य वॉल्यूम, संगीत और ध्वनि प्रभाव, हर एक अलग से।'],
			paytable: ['पेटेबल', 'हर सिंबल और 3, 4 और 5 एक जैसे मिलने पर उसका भुगतान, साथ ही पेलाइन दिखाता है।'],
			sound: ['ध्वनि', 'खेल की ध्वनि बंद और चालू करता है। वॉल्यूम सेटिंग्स में बदला जाता है।'],
		},
		amountPlate: plate('BET'),
		buyPlate: plate('BUY BONUS'),
		skipNote: 'जब बड़ी जीत गिनी जा रही हो, कहीं भी टैप करने से सीधे अंतिम राशि दिखती है।',
		modesTitle: 'मोड के अनुसार RTP और अधिकतम जीत',
		modesHead: ['मोड', 'प्रवेश का तरीका', 'RTP', 'अधिकतम जीत'],
		baseGame: 'बेस गेम',
		everySpin: 'हर स्पिन',
		buyFor: (cost) => `${cost}× दांव पर खरीदें`,
		maxWinCell: (maxWin) => `${maxWin}× दांव`,
		modesNote:
			'अधिकतम जीत बेस दांव का गुणक है, किसी फ़ीचर की प्रवेश लागत का नहीं। जब कोई राउंड सीमा तक पहुँचता है तो वह तुरंत समाप्त हो जाता है और सीमित राशि का भुगतान होता है।',
		wildTitle: 'वाइल्ड',
		scatterTitle: 'स्कैटर और फ्री स्पिन',
		scatters: (n) => `${n} स्कैटर`,
		retrigTitle: 'रीट्रिगर',
		retrig:
			'फ़ीचर के दौरान एक साथ और स्कैटर आने पर अतिरिक्त फ्री स्पिन मिलते हैं: 2 स्कैटर पर +2, 3 पर +4, 4 पर +6 और 5 पर +8। यह तीनों फ़ीचर में लागू होता है।',
		noLimit:
			'जीते जा सकने वाले फ्री स्पिन की संख्या की कोई सीमा नहीं है। फ़ीचर तब समाप्त होता है जब उसके फ्री स्पिन खत्म हो जाएँ या अधिकतम जीत तक पहुँच जाए।',
		entryTitle: 'फ़ीचर में प्रवेश',
		entry: (v) =>
			`स्कैटर का इंतज़ार करने के बजाय, हर फ़ीचर को ${v.buyName} बटन से ऊपर की तालिका में दी गई लागत पर सीधे खरीदा जा सकता है। हर मोड का RTP भी वहीं उसकी लागत के साथ दिया गया है; सभी मोड में यह ${v.rtpLow} से ${v.rtpHigh} तक है।`,
		maxTitle: 'अधिकतम जीत',
		max: (v) =>
			`अधिकतम भुगतान हर मोड में बेस दांव के ${v.maxWin}× तक सीमित है। सीमा पहुँचते ही राउंड तुरंत समाप्त हो जाता है और अधिकतम जीत दी जाती है।`,
		foot: 'खराबी होने पर सभी भुगतान और खेल रद्द हो जाते हैं। स्थिर इंटरनेट कनेक्शन आवश्यक है। कनेक्शन टूटने पर अधूरे राउंड पूरे करने के लिए खेल को फिर से लोड करें। अपेक्षित रिटर्न बहुत सारे खेलों के आधार पर गणना किया जाता है। खेल का प्रदर्शन किसी भौतिक उपकरण का प्रतिनिधित्व नहीं करता और केवल उदाहरण के लिए है। जीत का निपटान वेब ब्राउज़र की घटनाओं से नहीं, बल्कि रिमोट गेम सर्वर (Remote Game Server) से प्राप्त राशि के अनुसार होता है।',
		payTableTitle: plate('PAYTABLE'),
		ptNote: (lines) =>
			`भुगतान बेस दांव के गुणक के रूप में दिखाए गए हैं। लाइन जीत ${lines} स्थिर पेलाइन पर बाएँ से दाएँ भुगतान करती है।`,
		ptScatter: (fs) => `भुगतान नहीं — 3, 4 या 5 स्कैटर पर ${fs} फ्री स्पिन`,
		ptLinesTitle: (n) => `${n} पेलाइन`,
		ptLinesNote: (n) => `सभी ${n} लाइनें हमेशा सक्रिय रहती हैं। जीत रील 1 से बाएँ से दाएँ भुगतान करती है।`,
	}),
};

export const commonText = (lang: RulesLang, T: Terms, social: boolean): CommonText =>
	lang === 'en' || social ? english(T, social) : TEXT[lang]();
