import { stateI18nDerived, stateUrlDerived } from 'state-shared';

import type { getSocialTerms } from './socialTerms';

/**
 * The parts of the game rules and pay table that read the same in all three
 * games (how to play, controls, the mode table, the free-spin length note,
 * feature entry, max win, the disclaimer), in every locale the UI ships (2026-10-13, P2-C — the
 * rules were English-only while the bet bar and the intro card followed ?lang=).
 *
 * Same file in CapoNostra, TurfWar and HardTime — change all three together.
 * Each game's own sections live in its game/rulesText.ts.
 *
 * English is built from socialTerms, so social play keeps its vetted wording
 * word for word; social play is English-only (stateUrlDerived.lang() already
 * returns 'en' there). Feature names (FREE GAME, SUPER FREE GAME) stay in
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

/**
 * The bet bar's controls in the order they sit on it (bar v3, ui/MummyBar.svelte:
 * the buy tile, then along the console the menu bars and the menu panel's rows,
 * BALANCE / WIN, the BET box and its arrows, Spin, Auto Spin over Turbo). Texts
 * may carry {balance} {win} {start} {info} {paytable} {settings} {min} {max},
 * filled by ui/ModalGameRules.svelte with the bar's own labels and round range.
 */
export type ControlKey =
	| 'buy'
	| 'menu'
	| 'info'
	| 'paytable'
	| 'settings'
	| 'sound'
	| 'readout'
	| 'amount'
	| 'stepper'
	| 'spin'
	| 'auto'
	| 'turbo';
export const CONTROL_ORDER: readonly ControlKey[] = [
	'buy',
	'menu',
	'info',
	'paytable',
	'settings',
	'sound',
	'readout',
	'amount',
	'stepper',
	'spin',
	'auto',
	'turbo',
];

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
	noLimit: string;
	entryTitle: string;
	entry: (v: RulesVars) => string;
	maxTitle: string;
	max: (v: RulesVars) => string;
	foot: string;
	payTableTitle: string;
	ptNote: (lines: number) => string;
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
		buy: [
			T.buyBonusName,
			`The parchment tile at the left end of the bar, marked with a flask. Opens the feature menu, where either of the two free-spin features can be ${T.bought} outright for the stated multiple of your ${T.bet}; the ${T.cost} is shown before you confirm, and the ${T.bet} can still be changed at the top of that menu. It is dimmed while a round is playing and hidden during free spins.`,
		],
		menu: [
			'Menu',
			'The three bars at the left of the console. Opens a panel with {info}, {paytable} and {settings}, and two volume sliders. While the panel is open the bars show an X: press it again, press anywhere else or press Esc to close it.',
		],
		info: ['Info', 'Opens these game rules.'],
		settings: [
			'Settings',
			'Opens the volume controls: master volume, music and sound effects, each set separately.',
		],
		paytable: [
			T.payTableCaps,
			`Lists every symbol and what it ${T.pays} for 3, 4, 5 and 6 of a kind, plus the ${T.paylines}.`,
		],
		sound: [
			'Sound and music',
			'The two sliders in the menu panel: the speaker sets the sound effects, the note the music. Drag a slider all the way to the left to silence it; {settings} also has the master volume.',
		],
		readout: [
			'Balance and win',
			"{balance}, beside the menu bars, shows what you have. While a round has a win to show, {win} appears next to it and counts up to the round's total.",
		],
		amount: [
			social ? 'Amount' : 'Bet amount',
			`The box on the console shows the current ${T.bet}; the line along its foot shows where it sits among the ${T.betLevels}. Press it to open the ${T.betMenu} beside it and choose any level directly.`,
		],
		stepper: [
			'Decrease / increase',
			`The two arrows right of that box step the ${T.bet} down or up one level per press.`,
		],
		spin: [
			'Spin',
			`The large round button near the right end of the console. Starts a round for the current ${T.bet}; the space bar does the same. Its arrows turn while the reels are moving — press it again then to bring them to rest early.`,
		],
		auto: [
			'Auto Spin',
			'The upper small button at the right end of the console. Opens a panel to choose how many rounds to play automatically, from {min} up to {max} or unlimited (∞); pick a number, then press {start} or Spin. While it runs, Spin counts down the rounds left. Press Auto Spin or Spin again to stop.',
		],
		turbo: [
			'Turbo',
			'The lower small button at the right end of the console. Press it to turn turbo on (the button turns dark with a gold bolt): shorter spins and win presentations. Press it again to turn it off.',
		],
	},
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
			buy: [
				'Bonus kaufen',
				'Die Pergamentkachel am linken Ende der Leiste mit dem Kolben. Öffnet das Feature-Menü, in dem jedes der beiden Freispiel-Features direkt zum angegebenen Vielfachen Ihres Einsatzes gekauft werden kann; der Preis wird vor der Bestätigung angezeigt, und der Einsatz lässt sich oben im Menü noch ändern. Während einer Runde ist sie abgeblendet, in Freispielen ausgeblendet.',
			],
			menu: [
				'Menü',
				'Die drei Balken links auf der Konsole. Öffnet ein Feld mit {info}, {paytable} und {settings} sowie zwei Lautstärkereglern. Solange es offen ist, zeigen die Balken ein X: erneut drücken, irgendwo anders drücken oder Esc schließt es.',
			],
			info: ['Info', 'Öffnet diese Spielregeln.'],
			settings: [
				'Einstellungen',
				'Öffnet die Lautstärkeregler: Gesamtlautstärke, Musik und Soundeffekte, jeweils separat einstellbar.',
			],
			paytable: [
				'Gewinntabelle',
				'Listet jedes Symbol und seinen Gewinn für 3, 4, 5 und 6 gleiche Symbole sowie die Gewinnlinien.',
			],
			sound: [
				'Ton und Musik',
				'Die zwei Regler im Menüfeld: der Lautsprecher regelt die Soundeffekte, die Note die Musik. Ganz nach links geschoben ist der Ton aus; die Gesamtlautstärke steht unter {settings}.',
			],
			readout: [
				'Guthaben und Gewinn',
				'{balance} neben den Menübalken zeigt Ihr Guthaben. Hat eine Runde einen Gewinn, erscheint daneben {win} und zählt bis zur Gesamtsumme der Runde hoch.',
			],
			amount: [
				'Einsatzbetrag',
				'Das Feld auf der Konsole zeigt den aktuellen Einsatz; die Linie an seinem unteren Rand zeigt, wo er unter den Einsatzstufen liegt. Drücken Sie darauf, um daneben das Einsatzmenü zu öffnen und direkt eine Stufe zu wählen.',
			],
			stepper: [
				'Verringern / Erhöhen',
				'Die zwei Pfeile rechts neben dem Feld senken oder erhöhen den Einsatz um eine Stufe pro Druck.',
			],
			spin: [
				'Drehen',
				'Die große runde Taste nahe dem rechten Ende der Konsole. Startet eine Runde mit dem aktuellen Einsatz; die Leertaste bewirkt dasselbe. Während sich die Walzen drehen, drehen sich ihre Pfeile mit – ein erneuter Druck hält die Walzen dann vorzeitig an.',
			],
			auto: [
				'Autospin',
				'Die obere kleine Taste am rechten Ende der Konsole. Öffnet ein Feld, in dem Sie wählen, wie viele Runden automatisch gespielt werden: von {min} bis {max} oder unbegrenzt (∞); Anzahl wählen, dann {start} oder Drehen drücken. Während des Laufs zählt die Drehen-Taste die restlichen Runden herunter. Autospin oder Drehen erneut drücken beendet ihn.',
			],
			turbo: [
				'Turbo',
				'Die untere kleine Taste am rechten Ende der Konsole. Ein Druck schaltet Turbo ein (die Taste wird dunkel mit goldenem Blitz): kürzere Drehungen und Gewinnanimationen. Ein weiterer Druck schaltet ihn aus.',
			],
		},
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
			buy: [
				'Comprar bono',
				'La ficha de pergamino del extremo izquierdo de la barra, con un matraz. Abre el menú de funciones, donde cualquiera de las dos funciones de giros gratis puede comprarse directamente por el múltiplo indicado de tu apuesta; el coste se muestra antes de confirmar y la apuesta aún puede cambiarse en la parte superior de ese menú. Se atenúa mientras se juega una ronda y se oculta durante los giros gratis.',
			],
			menu: [
				'Menú',
				'Las tres barras a la izquierda de la consola. Abre un panel con {info}, {paytable} y {settings}, y dos controles de volumen. Mientras está abierto, las barras muestran una X: púlsala de nuevo, pulsa en cualquier otro lugar o pulsa Esc para cerrarlo.',
			],
			info: ['Info', 'Abre estas reglas del juego.'],
			settings: [
				'Ajustes',
				'Abre los controles de volumen: volumen general, música y efectos de sonido, cada uno por separado.',
			],
			paytable: [
				'Tabla de pagos',
				'Muestra cada símbolo y lo que paga por 3, 4, 5 y 6 iguales, además de las líneas de pago.',
			],
			sound: [
				'Sonido y música',
				'Los dos controles deslizantes del panel del menú: el altavoz ajusta los efectos de sonido y la nota, la música. Arrastra uno del todo a la izquierda para silenciarlo; el volumen general está en {settings}.',
			],
			readout: [
				'Saldo y ganancia',
				'{balance}, junto a las barras del menú, muestra lo que tienes. Cuando una ronda tiene una ganancia que mostrar, aparece {win} a su lado y cuenta hasta el total de la ronda.',
			],
			amount: [
				'Importe de la apuesta',
				'La casilla de la consola muestra la apuesta actual; la línea de su borde inferior indica dónde está entre los niveles de apuesta. Púlsala para abrir a su lado el menú de apuestas y elegir directamente cualquier nivel.',
			],
			stepper: [
				'Bajar / subir',
				'Las dos flechas a la derecha de esa casilla bajan o suben la apuesta un nivel por pulsación.',
			],
			spin: [
				'Girar',
				'El botón redondo grande cerca del extremo derecho de la consola. Inicia una ronda con la apuesta actual; la barra espaciadora hace lo mismo. Sus flechas giran mientras los carretes se mueven: púlsalo de nuevo entonces para detenerlos antes de tiempo.',
			],
			auto: [
				'Giro automático',
				'El botón pequeño superior del extremo derecho de la consola. Abre un panel para elegir cuántas rondas jugar automáticamente, de {min} a {max} o ilimitadas (∞); elige un número y pulsa {start} o Girar. Mientras dura, Girar cuenta las rondas que quedan. Pulsa Giro automático o Girar de nuevo para detenerlo.',
			],
			turbo: [
				'Turbo',
				'El botón pequeño inferior del extremo derecho de la consola. Púlsalo para activar el turbo (el botón se oscurece con un rayo dorado): giros y presentaciones de ganancias más cortos. Púlsalo de nuevo para desactivarlo.',
			],
		},
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
			buy: [
				'Acheter bonus',
				'La tuile de parchemin à l\'extrémité gauche de la barre, marquée d\'un flacon. Ouvre le menu des fonctions, où l\'une ou l\'autre des deux fonctions de tours gratuits peut être achetée directement pour le multiple indiqué de votre mise ; le coût s\'affiche avant de confirmer, et la mise peut encore être modifiée en haut de ce menu. Elle est atténuée pendant une partie et masquée pendant les tours gratuits.',
			],
			menu: [
				'Menu',
				'Les trois barres à gauche de la console. Ouvre un panneau avec {info}, {paytable} et {settings}, et deux curseurs de volume. Tant qu\'il est ouvert, les barres affichent un X : appuyez de nouveau dessus, appuyez ailleurs ou appuyez sur Échap pour le fermer.',
			],
			info: ['Info', 'Ouvre ces règles du jeu.'],
			settings: [
				'Paramètres',
				'Ouvre les réglages du volume : volume général, musique et effets sonores, chacun séparément.',
			],
			paytable: [
				'Table des gains',
				'Liste chaque symbole et ce qu’il paie pour 3, 4, 5 et 6 identiques, ainsi que les lignes de paiement.',
			],
			sound: [
				'Son et musique',
				'Les deux curseurs du panneau du menu : le haut-parleur règle les effets sonores, la note la musique. Faites glisser un curseur tout à gauche pour le couper ; le volume général se trouve dans {settings}.',
			],
			readout: [
				'Solde et gain',
				'{balance}, à côté des barres du menu, indique ce que vous avez. Quand une partie a un gain à afficher, {win} apparaît à côté et compte jusqu\'au total de la partie.',
			],
			amount: [
				'Montant de la mise',
				'La case de la console affiche la mise actuelle ; la ligne au bas de la case indique sa place parmi les niveaux de mise. Appuyez dessus pour ouvrir à côté le menu des mises et choisir directement un niveau.',
			],
			stepper: [
				'Diminuer / augmenter',
				'Les deux flèches à droite de cette case baissent ou augmentent la mise d\'un niveau par appui.',
			],
			spin: [
				'Lancer',
				'Le grand bouton rond près de l\'extrémité droite de la console. Lance une partie avec la mise actuelle ; la barre d\'espace fait de même. Ses flèches tournent pendant que les rouleaux bougent : appuyez de nouveau à ce moment-là pour les arrêter plus tôt.',
			],
			auto: [
				'Jeu automatique',
				'Le petit bouton du haut à l\'extrémité droite de la console. Ouvre un panneau pour choisir combien de parties jouer automatiquement, de {min} à {max} ou sans limite (∞) ; choisissez un nombre, puis appuyez sur {start} ou sur Lancer. Pendant le jeu automatique, Lancer décompte les parties restantes. Appuyez de nouveau sur Jeu automatique ou sur Lancer pour l\'arrêter.',
			],
			turbo: [
				'Turbo',
				'Le petit bouton du bas à l\'extrémité droite de la console. Un appui active le turbo (le bouton devient sombre avec un éclair doré) : tours et présentations des gains plus courts. Un nouvel appui le désactive.',
			],
		},
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
			buy: [
				'Comprar bônus',
				'O bloco de pergaminho na ponta esquerda da barra, com um frasco. Abre o menu de recursos, onde qualquer um dos dois recursos de rodadas grátis pode ser comprado diretamente pelo múltiplo indicado da sua aposta; o custo aparece antes de confirmar, e a aposta ainda pode ser alterada no topo desse menu. Fica esmaecido durante uma rodada e oculto durante as rodadas grátis.',
			],
			menu: [
				'Menu',
				'As três barras à esquerda do console. Abre um painel com {info}, {paytable} e {settings}, além de dois controles de volume. Enquanto o painel está aberto, as barras mostram um X: toque nele de novo, toque em qualquer outro lugar ou pressione Esc para fechar.',
			],
			info: ['Info', 'Abre estas regras do jogo.'],
			settings: [
				'Configurações',
				'Abre os controles de volume: volume geral, música e efeitos sonoros, cada um ajustado separadamente.',
			],
			paytable: [
				'Tabela de pagamentos',
				'Lista cada símbolo e quanto paga por 3, 4, 5 e 6 iguais, além das linhas de pagamento.',
			],
			sound: [
				'Som e música',
				'Os dois controles deslizantes do painel do menu: o alto-falante ajusta os efeitos sonoros e a nota, a música. Arraste um controle todo para a esquerda para silenciá-lo; o volume geral fica em {settings}.',
			],
			readout: [
				'Saldo e ganho',
				'{balance}, ao lado das barras do menu, mostra o que você tem. Quando uma rodada tem um ganho a mostrar, {win} aparece ao lado e conta até o total da rodada.',
			],
			amount: [
				'Valor da aposta',
				'A caixa no console mostra a aposta atual; a linha na base da caixa mostra onde ela está entre os níveis de aposta. Toque nela para abrir ao lado o menu de apostas e escolher qualquer nível diretamente.',
			],
			stepper: [
				'Diminuir / aumentar',
				'As duas setas à direita dessa caixa diminuem ou aumentam a aposta um nível por toque.',
			],
			spin: [
				'Girar',
				'O botão redondo grande perto da ponta direita do console. Inicia uma rodada com a aposta atual; a barra de espaço faz o mesmo. Suas setas giram enquanto os rolos se movem: toque nele de novo nesse momento para pará-los antes.',
			],
			auto: [
				'Giro automático',
				'O botão pequeno de cima na ponta direita do console. Abre um painel para escolher quantas rodadas jogar automaticamente, de {min} a {max} ou ilimitadas (∞); escolha um número e toque em {start} ou Girar. Durante a execução, Girar mostra a contagem regressiva das rodadas restantes. Toque em Giro automático ou Girar de novo para parar.',
			],
			turbo: [
				'Turbo',
				'O botão pequeno de baixo na ponta direita do console. Toque para ligar o turbo (o botão fica escuro com um raio dourado): giros e apresentações de ganhos mais curtos. Toque de novo para desligar.',
			],
		},
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
			buy: [
				'Kup bonus',
				'Pergaminowy kafelek na lewym końcu paska, z kolbą. Otwiera menu funkcji, w którym każdą z dwóch funkcji darmowych obrotów można kupić bezpośrednio za podaną wielokrotność zakładu; koszt jest widoczny przed potwierdzeniem, a zakład można jeszcze zmienić u góry tego menu. Podczas rundy jest przyciemniony, a w darmowych obrotach ukryty.',
			],
			menu: [
				'Menu',
				'Trzy paski po lewej stronie konsoli. Otwiera panel z {info}, {paytable} i {settings} oraz dwoma suwakami głośności. Gdy panel jest otwarty, paski zmieniają się w X: naciśnij go ponownie, naciśnij w innym miejscu lub naciśnij Esc, aby go zamknąć.',
			],
			info: ['Info', 'Otwiera te zasady gry.'],
			settings: [
				'Ustawienia',
				'Otwiera regulację głośności: głośność ogólną, muzykę i efekty dźwiękowe, każde osobno.',
			],
			paytable: [
				'Tabela wypłat',
				'Pokazuje każdy symbol i jego wypłatę za 3, 4, 5 i 6 jednakowych, a także linie wygrywające.',
			],
			sound: [
				'Dźwięk i muzyka',
				'Dwa suwaki w panelu menu: głośnik ustawia efekty dźwiękowe, nuta muzykę. Przesuń suwak do końca w lewo, aby wyciszyć; głośność ogólna jest w {settings}.',
			],
			readout: [
				'Saldo i wygrana',
				'{balance} obok pasków menu pokazuje, ile masz. Gdy runda ma wygraną, obok pojawia się {win} i odlicza do sumy rundy.',
			],
			amount: [
				'Kwota zakładu',
				'Pole na konsoli pokazuje bieżący zakład; linia u jego dołu pokazuje, gdzie leży wśród poziomów zakładu. Naciśnij je, aby obok otworzyć menu zakładów i wybrać dowolny poziom bezpośrednio.',
			],
			stepper: [
				'Zmniejsz / zwiększ',
				'Dwie strzałki po prawej od tego pola zmniejszają lub zwiększają zakład o jeden poziom na naciśnięcie.',
			],
			spin: [
				'Zakręć',
				'Duży okrągły przycisk przy prawym końcu konsoli. Rozpoczyna rundę za bieżący zakład; spacja działa tak samo. Gdy bębny się kręcą, jego strzałki się obracają — naciśnij go wtedy ponownie, aby zatrzymać je wcześniej.',
			],
			auto: [
				'Autospin',
				'Górny mały przycisk na prawym końcu konsoli. Otwiera panel wyboru liczby rund granych automatycznie: od {min} do {max} lub bez limitu (∞); wybierz liczbę, a potem naciśnij {start} lub Zakręć. W trakcie Zakręć odlicza pozostałe rundy. Naciśnij ponownie Autospin lub Zakręć, aby zakończyć.',
			],
			turbo: [
				'Turbo',
				'Dolny mały przycisk na prawym końcu konsoli. Naciśnięcie włącza turbo (przycisk ciemnieje i ma złotą błyskawicę): krótsze obroty i prezentacje wygranych. Kolejne naciśnięcie je wyłącza.',
			],
		},
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
			buy: [
				'Купить бонус',
				'Пергаментная плитка на левом конце панели, с колбой. Открывает меню функций, где любую из двух функций бесплатных вращений можно купить сразу за указанный множитель ставки; стоимость показывается до подтверждения, а ставку ещё можно изменить вверху этого меню. Во время раунда плитка приглушена, во время бесплатных вращений скрыта.',
			],
			menu: [
				'Меню',
				'Три полоски в левой части консоли. Открывают панель с {info}, {paytable} и {settings}, а также двумя ползунками громкости. Пока панель открыта, полоски превращаются в X: нажмите на него ещё раз, нажмите в любом другом месте или нажмите Esc, чтобы закрыть её.',
			],
			info: ['Инфо', 'Открывает эти правила игры.'],
			settings: [
				'Настройки',
				'Открывает регулировку громкости: общая громкость, музыка и звуковые эффекты, каждая отдельно.',
			],
			paytable: [
				'Таблица выплат',
				'Показывает каждый символ и его выплату за 3, 4, 5 и 6 одинаковых, а также линии выплат.',
			],
			sound: [
				'Звук и музыка',
				'Два ползунка в панели меню: динамик регулирует звуковые эффекты, нота — музыку. Сдвиньте ползунок до упора влево, чтобы выключить звук; общая громкость — в {settings}.',
			],
			readout: [
				'Баланс и выигрыш',
				'{balance} рядом с полосками меню показывает ваши средства. Когда в раунде есть выигрыш, рядом появляется {win} и отсчитывает сумму раунда.',
			],
			amount: [
				'Размер ставки',
				'Поле на консоли показывает текущую ставку; линия у его нижнего края показывает её место среди уровней ставки. Нажмите на него, чтобы рядом открылось меню ставок, и выберите любой уровень напрямую.',
			],
			stepper: [
				'Уменьшить / увеличить',
				'Две стрелки справа от этого поля уменьшают или увеличивают ставку на один уровень за нажатие.',
			],
			spin: [
				'Вращение',
				'Большая круглая кнопка у правого края консоли. Запускает раунд с текущей ставкой; клавиша пробела делает то же самое. Пока барабаны крутятся, её стрелки вращаются — нажмите её ещё раз, чтобы остановить их раньше.',
			],
			auto: [
				'Автовращение',
				'Верхняя маленькая кнопка на правом краю консоли. Открывает панель выбора числа раундов для автоматической игры: от {min} до {max} или без ограничения (∞); выберите число и нажмите {start} или «Вращение». Пока идёт автоигра, кнопка «Вращение» отсчитывает оставшиеся раунды. Нажмите «Автовращение» или «Вращение» ещё раз, чтобы остановить.',
			],
			turbo: [
				'Турбо',
				'Нижняя маленькая кнопка на правом краю консоли. Нажатие включает турбо (кнопка темнеет, на ней золотая молния): вращения и показ выигрышей короче. Повторное нажатие выключает его.',
			],
		},
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
			buy: [
				'Bonus satın al',
				'Çubuğun sol ucundaki, üzerinde bir şişe olan parşömen karo. Özellik menüsünü açar; iki ücretsiz dönüş özelliğinden herhangi biri bahsinizin belirtilen katı karşılığında doğrudan satın alınabilir. Tutar onaylamadan önce gösterilir ve bahis o menünün üstünden hâlâ değiştirilebilir. Tur oynanırken soluklaşır, ücretsiz dönüşlerde gizlenir.',
			],
			menu: [
				'Menü',
				'Konsolun solundaki üç çubuk. {info}, {paytable} ve {settings} ile iki ses kaydırıcısı içeren bir panel açar. Panel açıkken çubuklar X olur: kapatmak için ona yeniden basın, başka bir yere basın ya da Esc tuşuna basın.',
			],
			info: ['Bilgi', 'Bu oyun kurallarını açar.'],
			settings: ['Ayarlar', 'Ses kontrollerini açar: ana ses, müzik ve ses efektleri ayrı ayrı ayarlanır.'],
			paytable: [
				'Ödeme tablosu',
				'Her sembolü ve 3, 4, 5 ve 6’lı eşleşmede ne ödediğini, ayrıca ödeme çizgilerini listeler.',
			],
			sound: [
				'Ses ve müzik',
				'Menü panelindeki iki kaydırıcı: hoparlör ses efektlerini, nota müziği ayarlar. Sesi kapatmak için kaydırıcıyı en sola sürükleyin; ana ses düzeyi {settings} içindedir.',
			],
			readout: [
				'Bakiye ve kazanç',
				'Menü çubuklarının yanındaki {balance} sahip olduğunuzu gösterir. Bir turda gösterilecek kazanç olduğunda yanında {win} belirir ve turun toplamına kadar sayar.',
			],
			amount: [
				'Bahis tutarı',
				'Konsoldaki kutu mevcut bahsi gösterir; alt kenarındaki çizgi, bahis seviyeleri arasında nerede olduğunu gösterir. Yanında bahis menüsünü açıp herhangi bir seviyeyi doğrudan seçmek için ona basın.',
			],
			stepper: [
				'Azalt / artır',
				'Bu kutunun sağındaki iki ok, her basışta bahsi bir seviye azaltır veya artırır.',
			],
			spin: [
				'Döndür',
				'Konsolun sağ ucuna yakın büyük yuvarlak düğme. Mevcut bahisle bir tur başlatır; boşluk tuşu da aynı işi yapar. Makaralar dönerken okları da döner — makaraları erken durdurmak için o sırada yeniden basın.',
			],
			auto: [
				'Otomatik döndürme',
				'Konsolun sağ ucundaki üstteki küçük düğme. Kaç turun otomatik oynanacağını seçmek için bir panel açar: {min} ile {max} arası ya da sınırsız (∞); bir sayı seçip {start} veya Döndür\'e basın. Çalışırken Döndür kalan turları geri sayar. Durdurmak için Otomatik döndürme\'ye veya Döndür\'e yeniden basın.',
			],
			turbo: [
				'Turbo',
				'Konsolun sağ ucundaki alttaki küçük düğme. Basınca turbo açılır (düğme koyulaşır, üzerinde altın bir şimşek olur): dönüşler ve kazanç gösterimleri kısalır. Yeniden basınca kapanır.',
			],
		},
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
			buy: [
				'Osta bonus',
				'Palkin vasemmassa päässä oleva pergamenttilaatta, jossa on pullo. Avaa ominaisuusvalikon, josta kumman tahansa kahdesta ilmaiskierrosominaisuudesta voi ostaa suoraan ilmoitetulla panoksen kerrannaisella; hinta näytetään ennen vahvistusta, ja panosta voi yhä muuttaa valikon yläosassa. Laatta himmenee kierroksen ajaksi ja piiloutuu ilmaiskierroksilla.',
			],
			menu: [
				'Valikko',
				'Konsolin vasemman reunan kolme palkkia. Avaa paneelin, jossa ovat {info}, {paytable} ja {settings} sekä kaksi äänenvoimakkuuden liukusäädintä. Kun paneeli on auki, palkit näkyvät X:nä: sulje paneeli painamalla sitä uudelleen, painamalla muualle tai painamalla Esc.',
			],
			info: ['Info', 'Avaa nämä pelisäännöt.'],
			settings: [
				'Asetukset',
				'Avaa äänenvoimakkuuden säätimet: kokonaisäänenvoimakkuus, musiikki ja ääniefektit, kukin erikseen.',
			],
			paytable: [
				'Voittotaulukko',
				'Luettelee jokaisen symbolin ja sen voiton 3, 4, 5 ja 6 samanlaisesta sekä voittolinjat.',
			],
			sound: [
				'Äänet ja musiikki',
				'Valikkopaneelin kaksi liukusäädintä: kaiutin säätää äänitehosteita, nuotti musiikkia. Vedä säädin kokonaan vasemmalle mykistääksesi sen; kokonaisäänenvoimakkuus on kohdassa {settings}.',
			],
			readout: [
				'Saldo ja voitto',
				'Valikkopalkkien vieressä oleva {balance} näyttää, mitä sinulla on. Kun kierroksella on näytettävä voitto, sen viereen ilmestyy {win}, joka laskee kierroksen kokonaissummaan.',
			],
			amount: [
				'Panoksen määrä',
				'Konsolin ruutu näyttää nykyisen panoksen; sen alareunan viiva näyttää, missä kohtaa panostasoja se on. Paina ruutua avataksesi panosvalikon sen viereen ja valitse mikä tahansa taso suoraan.',
			],
			stepper: [
				'Pienennä / suurenna',
				'Ruudun oikealla puolella olevat kaksi nuolta pienentävät tai suurentavat panosta yhden tason painallusta kohden.',
			],
			spin: [
				'Pyöritä',
				'Suuri pyöreä painike konsolin oikean reunan lähellä. Aloittaa kierroksen nykyisellä panoksella; välilyönti tekee saman. Sen nuolet pyörivät rullien liikkuessa — paina sitä silloin uudelleen pysäyttääksesi ne aikaisemmin.',
			],
			auto: [
				'Automaattipyöritys',
				'Konsolin oikean reunan ylempi pieni painike. Avaa paneelin, josta valitaan automaattisesti pelattavien kierrosten määrä: {min}–{max} tai rajaton (∞); valitse määrä ja paina sitten {start} tai Pyöritä. Ajon aikana Pyöritä laskee jäljellä olevat kierrokset. Pysäytä painamalla Automaattipyöritystä tai Pyöritä uudelleen.',
			],
			turbo: [
				'Turbo',
				'Konsolin oikean reunan alempi pieni painike. Painallus kytkee turbon päälle (painike tummuu ja siihen tulee kultainen salama): lyhyemmät pyöräytykset ja voittoesitykset. Uusi painallus kytkee sen pois.',
			],
		},
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
			buy: [
				'Beli bonus',
				'Ubin perkamen di ujung kiri bilah, bergambar labu kaca. Membuka menu fitur, tempat salah satu dari dua fitur putaran gratis dapat dibeli langsung seharga kelipatan taruhan yang tertera; biayanya ditampilkan sebelum Anda mengonfirmasi, dan taruhan masih bisa diubah di bagian atas menu itu. Ubin ini meredup selama ronde berjalan dan disembunyikan selama putaran gratis.',
			],
			menu: [
				'Menu',
				'Tiga garis di kiri konsol. Membuka panel berisi {info}, {paytable}, dan {settings}, serta dua penggeser volume. Selama panel terbuka, garis-garis itu menjadi X: tekan lagi, tekan di tempat lain, atau tekan Esc untuk menutupnya.',
			],
			info: ['Info', 'Membuka aturan permainan ini.'],
			settings: [
				'Pengaturan',
				'Membuka kontrol volume: volume utama, musik, dan efek suara, masing-masing diatur terpisah.',
			],
			paytable: [
				'Tabel pembayaran',
				'Menampilkan setiap simbol dan pembayarannya untuk 3, 4, 5, dan 6 yang sama, serta garis pembayaran.',
			],
			sound: [
				'Suara dan musik',
				'Dua penggeser di panel menu: pengeras suara mengatur efek suara, not balok mengatur musik. Geser sampai ujung kiri untuk membisukannya; volume utama ada di {settings}.',
			],
			readout: [
				'Saldo dan kemenangan',
				'{balance}, di samping garis menu, menunjukkan yang Anda miliki. Saat ronde memiliki kemenangan, {win} muncul di sebelahnya dan menghitung naik hingga total ronde.',
			],
			amount: [
				'Jumlah taruhan',
				'Kotak di konsol menunjukkan taruhan saat ini; garis di dasarnya menunjukkan posisinya di antara tingkat taruhan. Tekan kotak itu untuk membuka menu taruhan di sampingnya dan memilih tingkat mana pun secara langsung.',
			],
			stepper: [
				'Kurangi / tambah',
				'Dua panah di kanan kotak itu menurunkan atau menaikkan taruhan satu tingkat per tekanan.',
			],
			spin: [
				'Putar',
				'Tombol bundar besar di dekat ujung kanan konsol. Memulai ronde dengan taruhan saat ini; tombol spasi melakukan hal yang sama. Panahnya berputar selama gulungan bergerak — tekan lagi saat itu untuk menghentikannya lebih awal.',
			],
			auto: [
				'Putar otomatis',
				'Tombol kecil atas di ujung kanan konsol. Membuka panel untuk memilih berapa ronde yang dimainkan otomatis, dari {min} hingga {max} atau tanpa batas (∞); pilih jumlahnya, lalu tekan {start} atau Putar. Selama berjalan, Putar menghitung mundur ronde yang tersisa. Tekan Putar otomatis atau Putar lagi untuk berhenti.',
			],
			turbo: [
				'Turbo',
				'Tombol kecil bawah di ujung kanan konsol. Tekan untuk menyalakan turbo (tombol menjadi gelap dengan petir emas): putaran dan tampilan kemenangan lebih singkat. Tekan lagi untuk mematikannya.',
			],
		},
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
			buy: [
				'Mua thưởng',
				'Ô giấy da ở đầu trái thanh điều khiển, có hình bình thủy tinh. Mở menu tính năng, nơi có thể mua ngay một trong hai tính năng vòng quay miễn phí với bội số tiền cược đã ghi; chi phí hiện trước khi bạn xác nhận, và vẫn có thể đổi mức cược ở đầu menu đó. Ô này mờ đi khi đang chơi một ván và ẩn đi trong vòng quay miễn phí.',
			],
			menu: [
				'Menu',
				'Ba vạch ở bên trái bảng điều khiển. Mở một bảng gồm {info}, {paytable} và {settings}, cùng hai thanh trượt âm lượng. Khi bảng đang mở, ba vạch thành dấu X: nhấn lại, nhấn vào chỗ khác hoặc nhấn Esc để đóng.',
			],
			info: ['Thông tin', 'Mở luật chơi này.'],
			settings: [
				'Cài đặt',
				'Mở điều khiển âm lượng: âm lượng chung, nhạc và hiệu ứng âm thanh, chỉnh riêng từng mục.',
			],
			paytable: [
				'Bảng trả thưởng',
				'Liệt kê từng biểu tượng và mức trả cho 3, 4, 5 và 6 biểu tượng giống nhau, cùng các dòng thanh toán.',
			],
			sound: [
				'Âm thanh và nhạc',
				'Hai thanh trượt trong bảng menu: loa chỉnh hiệu ứng âm thanh, nốt nhạc chỉnh nhạc nền. Kéo hết sang trái để tắt; âm lượng tổng nằm trong {settings}.',
			],
			readout: [
				'Số dư và tiền thắng',
				'{balance}, cạnh ba vạch menu, cho biết số tiền bạn có. Khi một ván có tiền thắng, {win} hiện bên cạnh và đếm lên đến tổng của ván.',
			],
			amount: [
				'Số tiền cược',
				'Ô trên bảng điều khiển hiển thị mức cược hiện tại; vạch ở chân ô cho biết vị trí của nó giữa các mức cược. Nhấn vào ô để mở menu cược bên cạnh và chọn trực tiếp bất kỳ mức nào.',
			],
			stepper: [
				'Giảm / tăng',
				'Hai mũi tên bên phải ô đó giảm hoặc tăng mức cược một bậc mỗi lần nhấn.',
			],
			spin: [
				'Quay',
				'Nút tròn lớn gần đầu phải bảng điều khiển. Bắt đầu một ván với mức cược hiện tại; phím cách cũng vậy. Mũi tên của nút xoay khi các cuộn đang chạy — nhấn lại lúc đó để dừng chúng sớm.',
			],
			auto: [
				'Quay tự động',
				'Nút nhỏ phía trên ở đầu phải bảng điều khiển. Mở bảng chọn số ván chơi tự động, từ {min} đến {max} hoặc không giới hạn (∞); chọn số rồi nhấn {start} hoặc Quay. Khi đang chạy, nút Quay đếm ngược số ván còn lại. Nhấn Quay tự động hoặc Quay lần nữa để dừng.',
			],
			turbo: [
				'Turbo',
				'Nút nhỏ phía dưới ở đầu phải bảng điều khiển. Nhấn để bật turbo (nút chuyển tối với tia chớp vàng): vòng quay và phần trình diễn thắng ngắn hơn. Nhấn lần nữa để tắt.',
			],
		},
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
			buy: [
				'ボーナス購入',
				'バーの左端にある、フラスコの描かれた羊皮紙のタイル。フィーチャーメニューを開き、2種類のフリースピン機能のどちらでも、表示されたベット倍率で直接購入できます。確定前に費用が表示され、メニュー上部でベット額を変更することもできます。ラウンド中は薄く表示され、フリースピン中は非表示になります。',
			],
			menu: [
				'メニュー',
				'コンソール左側の3本線。{info}、{paytable}、{settings}と2つの音量スライダーがあるパネルを開きます。パネルが開いている間は3本線が×になります。もう一度押すか、ほかの場所を押すか、Escキーで閉じます。',
			],
			info: ['情報', 'このゲームルールを開きます。'],
			settings: ['設定', '音量設定を開きます。全体音量、音楽、効果音をそれぞれ個別に調整できます。'],
			paytable: ['配当表', '各シンボルの3・4・5・6個揃いの配当とペイラインを一覧表示します。'],
			sound: [
				'サウンドと音楽',
				'メニューパネルの2つのスライダー：スピーカーが効果音、音符が音楽の音量です。左端までドラッグすると消音になります。全体の音量は{settings}にあります。',
			],
			readout: [
				'残高と獲得',
				'メニューの3本線の横の{balance}は所持額を示します。ラウンドに獲得があると、その横に{win}が表示され、ラウンドの合計まで数え上がります。',
			],
			amount: [
				'ベット額',
				'コンソールの枠は現在のベット額を示し、枠の下のラインはベット段階の中での位置を示します。押すと横にベットメニューが開き、どの段階でも直接選べます。',
			],
			stepper: [
				'減らす / 増やす',
				'その枠の右の2つの矢印で、1回押すごとにベット額を1段階上げ下げします。',
			],
			spin: [
				'スピン',
				'コンソール右端近くの大きな丸いボタン。現在のベット額でラウンドを開始します。スペースキーでも同じです。リールが回っている間は矢印が回転し、そのときもう一度押すとリールを早く止めます。',
			],
			auto: [
				'オートスピン',
				'コンソール右端の上の小さなボタン。自動で遊ぶラウンド数を選ぶパネルを開きます：{min}〜{max}、または無制限（∞）。数を選んで{start}かスピンを押します。実行中はスピンボタンが残りラウンド数をカウントダウンします。オートスピンかスピンをもう一度押すと停止します。',
			],
			turbo: [
				'ターボ',
				'コンソール右端の下の小さなボタン。押すとターボがオンになり（ボタンが暗くなり金色の稲妻になります）、スピンと獲得演出が短くなります。もう一度押すとオフになります。',
			],
		},
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
			buy: [
				'보너스 구매',
				'바 왼쪽 끝에 있는 플라스크가 그려진 양피지 타일. 기능 메뉴를 열며, 두 가지 무료 스핀 기능 중 하나를 표시된 베팅 배수로 바로 구매할 수 있습니다. 확인 전에 비용이 표시되며, 메뉴 상단에서 베팅액을 바꿀 수도 있습니다. 라운드 진행 중에는 흐리게, 무료 스핀 중에는 숨겨집니다.',
			],
			menu: [
				'메뉴',
				'콘솔 왼쪽의 세 줄. {info}, {paytable}, {settings}와 볼륨 슬라이더 두 개가 있는 패널을 엽니다. 패널이 열려 있는 동안 세 줄은 X로 바뀝니다. 다시 누르거나, 다른 곳을 누르거나, Esc를 눌러 닫습니다.',
			],
			info: ['정보', '이 게임 규칙을 엽니다.'],
			settings: ['설정', '볼륨 조절을 엽니다. 전체 볼륨, 음악, 효과음을 각각 따로 설정합니다.'],
			paytable: ['지급표', '각 심볼의 3, 4, 5, 6개 일치 시 지급액과 페이라인을 보여 줍니다.'],
			sound: [
				'사운드와 음악',
				'메뉴 패널의 슬라이더 두 개: 스피커는 효과음, 음표는 음악 볼륨입니다. 왼쪽 끝까지 끌면 음소거됩니다. 전체 볼륨은 {settings}에 있습니다.',
			],
			readout: [
				'잔액과 당첨금',
				'메뉴 세 줄 옆의 {balance}는 보유 금액을 보여 줍니다. 라운드에 당첨금이 있으면 옆에 {win}이 나타나 라운드 합계까지 올라갑니다.',
			],
			amount: [
				'베팅 금액',
				'콘솔의 상자는 현재 베팅액을, 아래쪽 선은 베팅 단계 중 위치를 보여 줍니다. 누르면 옆에 베팅 메뉴가 열려 원하는 단계를 바로 고를 수 있습니다.',
			],
			stepper: [
				'감소 / 증가',
				'그 상자 오른쪽의 화살표 두 개로 한 번 누를 때마다 베팅액을 한 단계씩 내리거나 올립니다.',
			],
			spin: [
				'스핀',
				'콘솔 오른쪽 끝 근처의 큰 둥근 버튼. 현재 베팅액으로 라운드를 시작합니다. 스페이스 바도 같습니다. 릴이 도는 동안 화살표가 회전하며, 그때 다시 누르면 릴을 일찍 멈춥니다.',
			],
			auto: [
				'자동 스핀',
				'콘솔 오른쪽 끝의 위쪽 작은 버튼. 자동으로 플레이할 라운드 수를 고르는 패널을 엽니다: {min}~{max} 또는 무제한(∞). 수를 고른 뒤 {start} 또는 스핀을 누르세요. 진행 중에는 스핀 버튼이 남은 라운드를 카운트다운합니다. 자동 스핀이나 스핀을 다시 누르면 멈춥니다.',
			],
			turbo: [
				'터보',
				'콘솔 오른쪽 끝의 아래쪽 작은 버튼. 누르면 터보가 켜집니다(버튼이 어두워지고 금색 번개가 표시됨): 스핀과 당첨 연출이 짧아집니다. 다시 누르면 꺼집니다.',
			],
		},
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
			buy: [
				'購買獎勵',
				'下注列最左端畫著燒瓶的羊皮紙方塊。開啟特色功能選單，兩種免費遊戲功能都可按標示的押注倍數直接購買；確認前會先顯示費用，選單上方也還能調整押注。一手進行中會變淡，免費遊戲期間隱藏。',
			],
			menu: [
				'選單',
				'主控台左側的三條橫線。開啟一個面板，內有{info}、{paytable}、{settings}與兩個音量滑桿。面板開著時三條線會變成 X：再按一次、按其他地方或按 Esc 即可關閉。',
			],
			info: ['資訊', '開啟本遊戲規則。'],
			settings: ['設定', '開啟音量控制：主音量、音樂與音效可分別調整。'],
			paytable: ['賠率表', '列出每個符號 3、4、5、6 個連線的賠付，以及賠付線。'],
			sound: [
				'聲音與音樂',
				'選單面板中的兩個滑桿：喇叭調整音效，音符調整音樂。拖到最左邊即為靜音；總音量在{settings}中。',
			],
			readout: [
				'餘額與贏分',
				'選單橫線旁的{balance}顯示您目前的金額。一手有贏分時，旁邊會出現{win}，並跳數到該手的總贏分。',
			],
			amount: [
				'押注金額',
				'主控台上的方框顯示目前押注；方框底部的線條顯示它在各押注級距中的位置。點一下會在旁邊開啟押注選單，可直接選擇任一級距。',
			],
			stepper: [
				'減少／增加',
				'方框右邊的兩個箭頭，每按一次將押注調低或調高一級。',
			],
			spin: [
				'旋轉',
				'主控台右端附近的大圓鈕。以目前押注開始一手；空白鍵也有相同作用。輪轉動時它的箭頭會跟著轉，此時再按一次可提早讓輪停下。',
			],
			auto: [
				'自動旋轉',
				'主控台右端上方的小圓鈕。開啟面板選擇自動進行的手數：{min} 到 {max} 手，或不限（∞）；選好後按{start}或旋轉鈕。進行中旋轉鈕會倒數剩餘手數。再按一次自動旋轉或旋轉鈕即可停止。',
			],
			turbo: [
				'加速',
				'主控台右端下方的小圓鈕。按一下開啟加速（按鈕變深色並顯示金色閃電）：旋轉與贏分演出變短。再按一次關閉。',
			],
		},
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
		noLimit: '可贏得的免費遊戲次數沒有上限。特色功能在免費遊戲用完或達到最高贏分時結束。',
		entryTitle: '購買特色功能',
		entry: (v) =>
			`不必等待分散符號，每個特色功能都可用「${v.buyName}」按鈕，以上表所列費用直接購買。各模式的 RTP 也列在表中費用旁；所有模式介於 ${v.rtpLow} 至 ${v.rtpHigh}。`,
		maxTitle: '最高贏分',
		max: (v) => `各模式的最高派彩上限皆為基本押注的 ${v.maxWin} 倍。達到上限時該手立即結束，並支付最高贏分。`,
		foot: '如遇故障，所有派彩與遊戲一律無效。需要穩定的網路連線。如連線中斷，請重新載入遊戲以完成未結束的回合。預期回報是以大量遊戲次數計算。遊戲畫面不代表任何實體設備，僅供示意。贏分以遠端遊戲伺服器（Remote Game Server）傳回的金額結算，而非依網頁瀏覽器中的事件。',
		payTableTitle: plate('PAYTABLE'),
		ptNote: (lines) => `賠付以基本押注的倍數表示。連線贏分在 ${lines} 條固定賠付線上由左至右計算。`,
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
			buy: [
				'شراء المكافأة',
				'البلاطة الرَّقّية في الطرف الأيسر من الشريط، وعليها دورق. تفتح قائمة الميزات، حيث يمكن شراء أيٍّ من ميزتَي الدورات المجانية مباشرة بالمضاعف المحدد من رهانك؛ تظهر التكلفة قبل التأكيد، ويمكن تغيير الرهان من أعلى تلك القائمة. تَبهت أثناء الجولة وتُخفى أثناء الدورات المجانية.',
			],
			menu: [
				'القائمة',
				'الخطوط الثلاثة في يسار لوحة التحكم. تفتح لوحة فيها {info} و{paytable} و{settings} ومنزلقان للصوت. أثناء فتح اللوحة تتحول الخطوط إلى X: اضغط عليها مجددًا أو اضغط في أي مكان آخر أو اضغط Esc لإغلاقها.',
			],
			info: ['معلومات', 'تفتح قواعد اللعبة هذه.'],
			settings: ['الإعدادات', 'تفتح التحكم في مستوى الصوت: الصوت العام والموسيقى والمؤثرات الصوتية، كلٌّ على حدة.'],
			paytable: ['جدول الأرباح', 'يعرض كل رمز وما يدفعه عند تطابق 3 و4 و5 و6 رموز، إضافة إلى خطوط الدفع.'],
			sound: [
				'الصوت والموسيقى',
				'المنزلقان في لوحة القائمة: مكبّر الصوت يضبط المؤثرات الصوتية والنوتة تضبط الموسيقى. اسحب المنزلق إلى أقصى اليسار لكتمه؛ مستوى الصوت العام في {settings}.',
			],
			readout: [
				'الرصيد والربح',
				'يعرض {balance} بجوار خطوط القائمة ما لديك. عندما يكون للجولة ربح، يظهر {win} بجانبه ويعدّ تصاعديًا حتى مجموع الجولة.',
			],
			amount: [
				'قيمة الرهان',
				'يعرض المربع على لوحة التحكم الرهان الحالي، ويُظهر الخط أسفله موضعه بين مستويات الرهان. اضغط عليه لتفتح قائمة الرهان بجانبه وتختار أي مستوى مباشرة.',
			],
			stepper: [
				'تقليل / زيادة',
				'يُنقص السهمان على يمين ذلك المربع الرهان أو يزيدانه مستوى واحدًا في كل ضغطة.',
			],
			spin: [
				'الدوران',
				'الزر الدائري الكبير قرب الطرف الأيمن للوحة التحكم. يبدأ جولة بالرهان الحالي، ومفتاح المسافة يفعل الشيء نفسه. تدور أسهمه أثناء حركة البكرات، فاضغط عليه حينها لإيقافها مبكرًا.',
			],
			auto: [
				'الدوران التلقائي',
				'الزر الصغير العلوي في الطرف الأيمن للوحة التحكم. يفتح لوحة لاختيار عدد الجولات التي تُلعب تلقائيًا: من {min} إلى {max} أو بلا حد (∞)؛ اختر عددًا ثم اضغط {start} أو زر الدوران. أثناء التشغيل يعدّ زر الدوران الجولات المتبقية تنازليًا. اضغط الدوران التلقائي أو زر الدوران مجددًا للإيقاف.',
			],
			turbo: [
				'تيربو',
				'الزر الصغير السفلي في الطرف الأيمن للوحة التحكم. اضغطه لتشغيل التيربو (يصبح الزر داكنًا وعليه برق ذهبي): دورات وعروض أرباح أقصر. اضغطه مجددًا لإيقافه.',
			],
		},
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
			buy: [
				'बोनस खरीदें',
				'बार के बाएँ सिरे पर फ्लास्क वाली चर्मपत्र टाइल। फ़ीचर मेनू खोलती है, जहाँ दोनों फ्री स्पिन फ़ीचर में से कोई भी आपके दांव के बताए गए गुणक पर सीधे खरीदा जा सकता है; पुष्टि से पहले कीमत दिखती है, और उस मेनू के ऊपर से दांव अब भी बदला जा सकता है। राउंड चलते समय यह धुंधली रहती है और फ्री स्पिन के दौरान छिपी रहती है।',
			],
			menu: [
				'मेनू',
				'कंसोल के बाईं ओर की तीन लकीरें। {info}, {paytable} और {settings} तथा दो वॉल्यूम स्लाइडर वाला पैनल खोलती हैं। पैनल खुला रहने पर लकीरें X बन जाती हैं: बंद करने के लिए उसे फिर दबाएँ, कहीं और दबाएँ या Esc दबाएँ।',
			],
			info: ['जानकारी', 'ये खेल नियम खोलता है।'],
			settings: ['सेटिंग्स', 'वॉल्यूम नियंत्रण खोलता है: मुख्य वॉल्यूम, संगीत और ध्वनि प्रभाव, हर एक अलग से।'],
			paytable: ['पेटेबल', 'हर सिंबल और 3, 4, 5 और 6 एक जैसे मिलने पर उसका भुगतान, साथ ही पेलाइन दिखाता है।'],
			sound: [
				'ध्वनि और संगीत',
				'मेनू पैनल के दो स्लाइडर: स्पीकर ध्वनि प्रभाव और सुर संगीत की आवाज़ तय करता है। आवाज़ बंद करने के लिए स्लाइडर को पूरा बाईं ओर खींचें; कुल वॉल्यूम {settings} में है।',
			],
			readout: [
				'बैलेंस और जीत',
				'मेनू लकीरों के पास {balance} दिखाता है कि आपके पास कितना है। जब किसी राउंड में जीत हो, तो उसके पास {win} दिखता है और राउंड के कुल तक गिनता है।',
			],
			amount: [
				'दांव राशि',
				'कंसोल पर बना बॉक्स मौजूदा दांव दिखाता है; उसके नीचे की रेखा बताती है कि वह दांव स्तरों में कहाँ है। उसे दबाकर पास में दांव मेनू खोलें और कोई भी स्तर सीधे चुनें।',
			],
			stepper: [
				'घटाएँ / बढ़ाएँ',
				'उस बॉक्स के दाईं ओर के दो तीर हर बार दबाने पर दांव एक स्तर घटाते या बढ़ाते हैं।',
			],
			spin: [
				'स्पिन',
				'कंसोल के दाएँ सिरे के पास बड़ा गोल बटन। मौजूदा दांव पर राउंड शुरू करता है; स्पेस बार भी यही करता है। रील घूमते समय इसके तीर घूमते हैं — तब इसे फिर दबाकर रील जल्दी रोकें।',
			],
			auto: [
				'ऑटो स्पिन',
				'कंसोल के दाएँ सिरे पर ऊपर वाला छोटा बटन। अपने आप खेले जाने वाले राउंड चुनने का पैनल खोलता है: {min} से {max} तक या असीमित (∞); संख्या चुनकर {start} या स्पिन दबाएँ। चलते समय स्पिन बटन बचे राउंड उलटी गिनती में दिखाता है। रोकने के लिए ऑटो स्पिन या स्पिन फिर दबाएँ।',
			],
			turbo: [
				'टर्बो',
				'कंसोल के दाएँ सिरे पर नीचे वाला छोटा बटन। दबाने पर टर्बो चालू होता है (बटन गहरा हो जाता है और उस पर सुनहरी बिजली दिखती है): स्पिन और जीत की प्रस्तुति छोटी होती है। फिर दबाने पर बंद होता है।',
			],
		},
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
		ptLinesTitle: (n) => `${n} पेलाइन`,
		ptLinesNote: (n) => `सभी ${n} लाइनें हमेशा सक्रिय रहती हैं। जीत रील 1 से बाएँ से दाएँ भुगतान करती है।`,
	}),
};

export const commonText = (lang: RulesLang, T: Terms, social: boolean): CommonText =>
	lang === 'en' || social ? english(T, social) : TEXT[lang]();
