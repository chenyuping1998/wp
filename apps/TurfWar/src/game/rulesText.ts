import type { getSocialTerms } from './socialTerms';
import type { RulesLang } from './rulesCommon';

/**
 * Turf War's own sections of the game rules and pay table, in every locale the UI
 * ships (2026-10-13, P2-C). The shared sections are in game/rulesCommon.ts. Terms
 * follow the intro card (game/i18nText.ts): Loot Bags, the Bruiser, the Big Score,
 * feature names (Lookout, Muscle, Kingpin) in English. English is built from
 * socialTerms so social play keeps its wording; social play never reads the
 * other languages.
 */

type Terms = ReturnType<typeof getSocialTerms>;

export type SymbolKey = 'H1' | 'H2' | 'H3' | 'H4' | 'H5' | 'L1' | 'L2' | 'L3' | 'L4' | 'W' | 'S' | 'SW';

export type GameText = {
	wild: string;
	bruiserTitle: string;
	/** HTML */
	bruiser: string;
	bagsTitle: string;
	/** HTML */
	bags: readonly [string, string];
	scoreTitle: string;
	/** HTML */
	score: string;
	scatter: (freeSpins: number) => string;
	/** Lookout, Muscle, Kingpin — HTML */
	tiers: readonly [string, string, string];
	symbols: Record<SymbolKey, string>;
	ptSpecial: string;
	ptFoot: (maxWin: string) => string;
};

const english = (T: Terms): GameText => ({
	wild: `The Wild substitutes for every symbol except the Scatter and the Bruiser, and ${T.pays} as its own symbol on 5 of a kind.`,
	bruiserTitle: 'Bruiser',
	bruiser: `The Bruiser appears on the three middle reels in the base game, and on any reel during free spins. When one lands, its <strong>entire reel is filled with Wilds</strong> before any wins are evaluated. Scatters in that reel are not replaced. The Bruiser ${T.doesNotPay.toLowerCase()} as a symbol of its own, and at most one lands on any spin.`,
	bagsTitle: 'Loot Bags',
	bags: [
		'Loot Bags land on the grid and reveal a multiplier when the reels settle. A Loot Bag covers <strong>1×1, 2×2 or 3×3 positions</strong> and carries a single value however many positions it covers. Possible values are 2× to 10×, 25×, 50× and 100× on a single position, 2× to 10× on a 2×2 Loot Bag, and 2× to 8× on a 3×3 Loot Bag.',
		`A Loot Bag counts towards a win when a symbol it covers is part of a winning ${T.payline}, and the win is multiplied by the Loot Bag's value. A larger Loot Bag counts <strong>once for each of its positions</strong> that the winning ${T.payline} crosses. Where more than one Loot Bag takes part in the same win, their values are <strong>added together</strong> and the total is applied.`,
	],
	scoreTitle: 'The Big Score',
	score: `On any spin — in normal play and inside every feature — the <strong>entire grid can become a single Loot Bag</strong>. It carries one value from <strong>5× to 50×</strong> applied to every position, so a winning ${T.payline} is multiplied by that value once for each of its positions. The Big Score can turn up whether or not the spin has a winning line — when there is no win it simply passes.`,
	scatter: (n) =>
		`The Boombox Scatter appears on all five reels in the base game, and on reels 3 to 5 during free spins. ${T.noPayOnItsOwn}, and does not need to land on a ${T.payline}. The number of Scatters landing together decides which feature opens, and each one awards ${n} free spins:`,
	tiers: [
		'One Loot Bag is on the grid from the start. All Loot Bags are sticky and stay until the feature ends; between spins each is refilled with a new multiplier.',
		'Two Loot Bags are on the grid from the start. Loot Bag values are sticky, and any Loot Bag that takes part in a win doubles before the next spin. Each Loot Bag doubles at most once per spin.',
		'One Loot Bag is on the grid from the start and the doubling rule of Muscle applies. In addition, <strong>every reel a Bruiser fills with Wilds stays Wild for the rest of the feature</strong> — held Wild columns build up spin after spin.',
	],
	symbols: {
		H1: 'Crown Chain',
		H2: 'Fenced Block',
		H3: 'Banknote Roll',
		H4: 'Bottle & Cigarette',
		H5: 'Lowrider',
		L1: 'Crown Tag',
		L2: 'Skull Tag',
		L3: 'Star Tag',
		L4: 'Bolt Tag',
		W: 'Brass Knuckles',
		S: 'Boombox — Scatter',
		SW: 'Bruiser',
	},
	ptSpecial: `${T.doesNotPayAlone} — fills its entire reel with Wilds. Scatters in that reel are not replaced.`,
	ptFoot: (maxWin) =>
		`Wild substitutes for all symbols except the Scatter and the Bruiser, and ${T.pays} as its own symbol. Only the highest win is ${T.paid} per line. Max win is capped at ${maxWin}× ${T.baseBet}.`,
});

const TEXT: Record<Exclude<RulesLang, 'en'>, GameText> = {
	de: {
		wild: 'Das Wild ersetzt jedes Symbol außer dem Scatter und dem Schläger und zahlt bei 5 gleichen als eigenes Symbol.',
		bruiserTitle: 'Der Schläger',
		bruiser: 'Der Schläger erscheint im Basisspiel auf den drei mittleren Walzen und in Freispielen auf jeder Walze. Landet er, wird seine <strong>ganze Walze mit Wilds gefüllt</strong>, bevor Gewinne ausgewertet werden. Scatter auf dieser Walze werden nicht ersetzt. Der Schläger zahlt nicht als eigenes Symbol, und pro Spin landet höchstens einer.',
		bagsTitle: 'Beutesäcke',
		bags: [
			'Beutesäcke landen auf dem Raster und zeigen einen Multiplikator, wenn die Walzen stehen. Ein Beutesack deckt <strong>1×1, 2×2 oder 3×3 Positionen</strong> ab und trägt einen einzigen Wert, egal wie viele Positionen er abdeckt. Mögliche Werte sind 2× bis 10×, 25×, 50× und 100× auf einer einzelnen Position, 2× bis 10× auf einem 2×2-Beutesack und 2× bis 8× auf einem 3×3-Beutesack.',
			'Ein Beutesack zählt für einen Gewinn, wenn ein von ihm abgedecktes Symbol Teil einer Gewinnlinie ist, und der Gewinn wird mit dem Wert des Beutesacks multipliziert. Ein größerer Beutesack zählt <strong>einmal für jede seiner Positionen</strong>, die die Gewinnlinie kreuzt. Sind mehrere Beutesäcke am selben Gewinn beteiligt, werden ihre Werte <strong>addiert</strong> und die Summe angewendet.',
		],
		scoreTitle: 'Der große Coup',
		score: 'In jedem Spin – im normalen Spiel und in jedem Feature – kann <strong>das ganze Raster zu einem einzigen Beutesack werden</strong>. Er trägt einen Wert von <strong>5× bis 50×</strong> für jede Position, sodass eine Gewinnlinie einmal pro Position mit diesem Wert multipliziert wird. Der große Coup kann unabhängig davon erscheinen, ob der Spin eine Gewinnlinie hat – ohne Gewinn zieht er einfach vorbei.',
		scatter: (n) =>
			`Der Boombox-Scatter erscheint im Basisspiel auf allen fünf Walzen und in Freispielen auf den Walzen 3 bis 5. Er zahlt nicht allein und muss nicht auf einer Gewinnlinie landen. Die Zahl der gleichzeitig gelandeten Scatter entscheidet, welches Feature startet, und jedes bringt ${n} Freispiele:`,
		tiers: [
			'Ein Beutesack liegt von Beginn an auf dem Raster. Alle Beutesäcke sind sticky und bleiben bis zum Ende des Features; zwischen den Spins erhält jeder einen neuen Multiplikator.',
			'Zwei Beutesäcke liegen von Beginn an auf dem Raster. Ihre Werte bleiben erhalten, und jeder Beutesack, der an einem Gewinn beteiligt ist, verdoppelt sich vor dem nächsten Spin. Jeder Beutesack verdoppelt sich höchstens einmal pro Spin.',
			'Ein Beutesack liegt von Beginn an auf dem Raster, und die Verdopplungsregel von Muscle gilt. Zusätzlich <strong>bleibt jede Walze, die ein Schläger mit Wilds füllt, für den Rest des Features Wild</strong> – gehaltene Wild-Walzen sammeln sich Spin für Spin an.',
		],
		symbols: {
			H1: 'Kronenkette',
			H2: 'Eingezäunter Block',
			H3: 'Geldscheinrolle',
			H4: 'Flasche & Zigarette',
			H5: 'Lowrider',
			L1: 'Kronen-Tag',
			L2: 'Totenkopf-Tag',
			L3: 'Stern-Tag',
			L4: 'Blitz-Tag',
			W: 'Schlagring',
			S: 'Boombox – Scatter',
			SW: 'Der Schläger',
		},
		ptSpecial: 'Zahlt nicht allein – füllt seine ganze Walze mit Wilds. Scatter auf dieser Walze werden nicht ersetzt.',
		ptFoot: (mw) =>
			`Das Wild ersetzt alle Symbole außer dem Scatter und dem Schläger und zahlt als eigenes Symbol. Pro Linie wird nur der höchste Gewinn ausgezahlt. Der Maximalgewinn ist auf das ${mw}-Fache des Grundeinsatzes begrenzt.`,
	},
	es: {
		wild: 'El Wild sustituye a todos los símbolos excepto el Scatter y el Matón, y paga como símbolo propio con 5 iguales.',
		bruiserTitle: 'El Matón',
		bruiser: 'El Matón aparece en los tres carretes centrales en el juego base y en cualquier carrete durante los giros gratis. Cuando cae, <strong>todo su carrete se llena de Wilds</strong> antes de evaluar las ganancias. Los Scatters de ese carrete no se sustituyen. El Matón no paga como símbolo propio, y cae como máximo uno por giro.',
		bagsTitle: 'Bolsas del botín',
		bags: [
			'Las bolsas del botín caen en la cuadrícula y revelan un multiplicador cuando los carretes se detienen. Una bolsa cubre <strong>1×1, 2×2 o 3×3 posiciones</strong> y lleva un único valor, cubra las posiciones que cubra. Los valores posibles son de 2× a 10×, 25×, 50× y 100× en una sola posición, de 2× a 10× en una bolsa de 2×2 y de 2× a 8× en una de 3×3.',
			'Una bolsa cuenta para una ganancia cuando un símbolo que cubre forma parte de una línea de pago ganadora, y la ganancia se multiplica por el valor de la bolsa. Una bolsa más grande cuenta <strong>una vez por cada una de sus posiciones</strong> que cruza la línea ganadora. Si varias bolsas participan en la misma ganancia, sus valores <strong>se suman</strong> y se aplica el total.',
		],
		scoreTitle: 'El Gran Golpe',
		score: 'En cualquier giro —en el juego normal y dentro de cada función— <strong>toda la cuadrícula puede convertirse en una sola bolsa del botín</strong>. Lleva un valor de <strong>5× a 50×</strong> aplicado a cada posición, así que una línea de pago ganadora se multiplica por ese valor una vez por cada una de sus posiciones. El Gran Golpe puede aparecer tenga o no el giro una línea ganadora; si no hay ganancia, simplemente pasa.',
		scatter: (n) =>
			`El Scatter del radiocasete aparece en los cinco carretes en el juego base y en los carretes 3 a 5 durante los giros gratis. No paga por sí solo y no necesita caer en una línea de pago. El número de Scatters que caen a la vez decide qué función se abre, y cada una otorga ${n} giros gratis:`,
		tiers: [
			'Una bolsa está en la cuadrícula desde el principio. Todas las bolsas son fijas y se quedan hasta que termina la función; entre giros, cada una se recarga con un nuevo multiplicador.',
			'Dos bolsas están en la cuadrícula desde el principio. Los valores de las bolsas se mantienen, y toda bolsa que participa en una ganancia se duplica antes del siguiente giro. Cada bolsa se duplica como máximo una vez por giro.',
			'Una bolsa está en la cuadrícula desde el principio y se aplica la regla de duplicación de Muscle. Además, <strong>cada carrete que el Matón llena de Wilds sigue siendo Wild el resto de la función</strong>: las columnas Wild retenidas se acumulan giro tras giro.',
		],
		symbols: {
			H1: 'Cadena con corona',
			H2: 'Manzana vallada',
			H3: 'Fajo de billetes',
			H4: 'Botella y cigarrillo',
			H5: 'Lowrider',
			L1: 'Grafiti de corona',
			L2: 'Grafiti de calavera',
			L3: 'Grafiti de estrella',
			L4: 'Grafiti de rayo',
			W: 'Puño americano',
			S: 'Radiocasete — Scatter',
			SW: 'El Matón',
		},
		ptSpecial: 'No paga por sí solo — llena todo su carrete de Wilds. Los Scatters de ese carrete no se sustituyen.',
		ptFoot: (mw) =>
			`El Wild sustituye a todos los símbolos excepto el Scatter y el Matón, y paga como símbolo propio. Solo se paga la ganancia más alta por línea. La ganancia máxima está limitada a ${mw}× la apuesta base.`,
	},
	fr: {
		wild: 'Le Wild remplace tous les symboles sauf le Scatter et la Brute, et paie comme symbole à part entière pour 5 identiques.',
		bruiserTitle: 'La Brute',
		bruiser: 'La Brute apparaît sur les trois rouleaux centraux dans le jeu de base, et sur n’importe quel rouleau pendant les tours gratuits. Quand elle tombe, <strong>tout son rouleau se remplit de Wilds</strong> avant l’évaluation des gains. Les Scatters de ce rouleau ne sont pas remplacés. La Brute ne paie pas comme symbole à part entière, et il en tombe au plus une par tour.',
		bagsTitle: 'Sacs de butin',
		bags: [
			'Les sacs de butin tombent sur la grille et révèlent un multiplicateur à l’arrêt des rouleaux. Un sac couvre <strong>1×1, 2×2 ou 3×3 positions</strong> et porte une seule valeur, quel que soit le nombre de positions couvertes. Les valeurs possibles sont de 2× à 10×, 25×, 50× et 100× sur une seule position, de 2× à 10× sur un sac 2×2 et de 2× à 8× sur un sac 3×3.',
			'Un sac compte pour un gain lorsqu’un symbole qu’il couvre fait partie d’une ligne de paiement gagnante, et le gain est multiplié par la valeur du sac. Un sac plus grand compte <strong>une fois pour chacune de ses positions</strong> traversées par la ligne gagnante. Lorsque plusieurs sacs participent au même gain, leurs valeurs <strong>s’additionnent</strong> et le total s’applique.',
		],
		scoreTitle: 'Le Gros Coup',
		score: 'À n’importe quel tour — en jeu normal et dans chaque fonction — <strong>toute la grille peut devenir un seul sac de butin</strong>. Il porte une valeur de <strong>5× à 50×</strong> appliquée à chaque position : une ligne de paiement gagnante est donc multipliée par cette valeur une fois pour chacune de ses positions. Le Gros Coup peut survenir que le tour ait une ligne gagnante ou non ; sans gain, il passe simplement.',
		scatter: (n) =>
			`Le Scatter boombox apparaît sur les cinq rouleaux dans le jeu de base, et sur les rouleaux 3 à 5 pendant les tours gratuits. Il ne paie pas seul et n’a pas besoin de tomber sur une ligne de paiement. Le nombre de Scatters tombés ensemble détermine la fonction qui s’ouvre, et chacune donne ${n} tours gratuits :`,
		tiers: [
			'Un sac est sur la grille dès le départ. Tous les sacs sont collants et restent jusqu’à la fin de la fonction ; entre deux tours, chacun reçoit un nouveau multiplicateur.',
			'Deux sacs sont sur la grille dès le départ. Les valeurs des sacs sont conservées, et tout sac qui participe à un gain double avant le tour suivant. Chaque sac double au plus une fois par tour.',
			'Un sac est sur la grille dès le départ et la règle de doublement de Muscle s’applique. De plus, <strong>chaque rouleau que la Brute remplit de Wilds reste Wild jusqu’à la fin de la fonction</strong> — les colonnes Wild conservées s’accumulent tour après tour.',
		],
		symbols: {
			H1: 'Chaîne à couronne',
			H2: 'Pâté de maisons grillagé',
			H3: 'Liasse de billets',
			H4: 'Bouteille et cigarette',
			H5: 'Lowrider',
			L1: 'Tag couronne',
			L2: 'Tag tête de mort',
			L3: 'Tag étoile',
			L4: 'Tag éclair',
			W: 'Poing américain',
			S: 'Boombox — Scatter',
			SW: 'La Brute',
		},
		ptSpecial: 'Ne paie pas seule — remplit tout son rouleau de Wilds. Les Scatters de ce rouleau ne sont pas remplacés.',
		ptFoot: (mw) =>
			`Le Wild remplace tous les symboles sauf le Scatter et la Brute, et paie comme symbole à part entière. Seul le gain le plus élevé est payé par ligne. Le gain maximal est plafonné à ${mw}× la mise de base.`,
	},
	pt: {
		wild: 'O Wild substitui todos os símbolos, exceto o Scatter e o Brutamontes, e paga como símbolo próprio com 5 iguais.',
		bruiserTitle: 'O Brutamontes',
		bruiser: 'O Brutamontes aparece nos três rolos centrais no jogo base e em qualquer rolo durante as rodadas grátis. Quando cai, <strong>todo o seu rolo é preenchido com Wilds</strong> antes de os ganhos serem avaliados. Os Scatters desse rolo não são substituídos. O Brutamontes não paga como símbolo próprio, e cai no máximo um por rodada.',
		bagsTitle: 'Sacos de saque',
		bags: [
			'Os sacos de saque caem na grade e revelam um multiplicador quando os rolos param. Um saco cobre <strong>1×1, 2×2 ou 3×3 posições</strong> e leva um único valor, não importa quantas posições cubra. Os valores possíveis são de 2× a 10×, 25×, 50× e 100× em uma única posição, de 2× a 10× em um saco 2×2 e de 2× a 8× em um saco 3×3.',
			'Um saco conta para um ganho quando um símbolo que ele cobre faz parte de uma linha de pagamento vencedora, e o ganho é multiplicado pelo valor do saco. Um saco maior conta <strong>uma vez para cada uma de suas posições</strong> que a linha vencedora cruza. Quando mais de um saco participa do mesmo ganho, seus valores são <strong>somados</strong> e o total é aplicado.',
		],
		scoreTitle: 'O Grande Golpe',
		score: 'Em qualquer rodada — no jogo normal e dentro de cada recurso — <strong>a grade inteira pode virar um único saco de saque</strong>. Ele leva um valor de <strong>5× a 50×</strong> aplicado a cada posição, então uma linha de pagamento vencedora é multiplicada por esse valor uma vez para cada uma de suas posições. O Grande Golpe pode aparecer com ou sem linha vencedora na rodada — se não houver ganho, ele simplesmente passa.',
		scatter: (n) =>
			`O Scatter do boombox aparece nos cinco rolos no jogo base e nos rolos 3 a 5 durante as rodadas grátis. Ele não paga sozinho e não precisa cair em uma linha de pagamento. O número de Scatters que caem juntos decide qual recurso abre, e cada um concede ${n} rodadas grátis:`,
		tiers: [
			'Um saco está na grade desde o início. Todos os sacos são fixos e ficam até o fim do recurso; entre as rodadas, cada um recebe um novo multiplicador.',
			'Dois sacos estão na grade desde o início. Os valores dos sacos são mantidos, e todo saco que participa de um ganho dobra antes da próxima rodada. Cada saco dobra no máximo uma vez por rodada.',
			'Um saco está na grade desde o início e vale a regra de dobrar do Muscle. Além disso, <strong>todo rolo que o Brutamontes enche de Wilds continua Wild pelo resto do recurso</strong> — as colunas Wild retidas se acumulam rodada após rodada.',
		],
		symbols: {
			H1: 'Corrente com coroa',
			H2: 'Quarteirão cercado',
			H3: 'Rolo de notas',
			H4: 'Garrafa e cigarro',
			H5: 'Lowrider',
			L1: 'Pichação de coroa',
			L2: 'Pichação de caveira',
			L3: 'Pichação de estrela',
			L4: 'Pichação de raio',
			W: 'Soco-inglês',
			S: 'Boombox — Scatter',
			SW: 'O Brutamontes',
		},
		ptSpecial: 'Não paga sozinho — preenche todo o seu rolo com Wilds. Os Scatters desse rolo não são substituídos.',
		ptFoot: (mw) =>
			`O Wild substitui todos os símbolos, exceto o Scatter e o Brutamontes, e paga como símbolo próprio. Só o maior ganho é pago por linha. O ganho máximo é limitado a ${mw}× a aposta base.`,
	},
	pl: {
		wild: 'Wild zastępuje każdy symbol oprócz Scattera i Osiłka, a przy 5 jednakowych płaci jako osobny symbol.',
		bruiserTitle: 'Osiłek',
		bruiser: 'Osiłek pojawia się w grze podstawowej na trzech środkowych bębnach, a podczas darmowych obrotów na dowolnym bębnie. Gdy wyląduje, <strong>cały jego bęben wypełnia się symbolami Wild</strong>, zanim wygrane zostaną ocenione. Symbole Scatter na tym bębnie nie są zastępowane. Osiłek nie płaci jako osobny symbol, a w jednym obrocie ląduje najwyżej jeden.',
		bagsTitle: 'Worki z łupem',
		bags: [
			'Worki z łupem lądują na siatce i odsłaniają mnożnik, gdy bębny się zatrzymają. Worek zajmuje <strong>1×1, 2×2 lub 3×3 pola</strong> i ma jedną wartość bez względu na liczbę zajmowanych pól. Możliwe wartości to od 2× do 10×, 25×, 50× i 100× na pojedynczym polu, od 2× do 10× na worku 2×2 i od 2× do 8× na worku 3×3.',
			'Worek liczy się do wygranej, gdy zakryty przez niego symbol należy do wygrywającej linii, a wygrana jest mnożona przez wartość worka. Większy worek liczy się <strong>raz za każde swoje pole</strong>, przez które przechodzi wygrywająca linia. Gdy w tej samej wygranej bierze udział kilka worków, ich wartości są <strong>sumowane</strong> i stosowana jest suma.',
		],
		scoreTitle: 'Wielki skok',
		score: 'W dowolnym obrocie — w zwykłej grze i w każdej funkcji — <strong>cała siatka może stać się jednym workiem z łupem</strong>. Ma on jedną wartość od <strong>5× do 50×</strong> dla każdego pola, więc wygrywająca linia jest mnożona przez tę wartość raz za każde swoje pole. Wielki skok może się pojawić niezależnie od tego, czy obrót ma wygrywającą linię — gdy nie ma wygranej, po prostu mija.',
		scatter: (n) =>
			`Scatter boomboks pojawia się w grze podstawowej na wszystkich pięciu bębnach, a podczas darmowych obrotów na bębnach od 3 do 5. Nie płaci samodzielnie i nie musi wylądować na linii wygrywającej. Liczba symboli Scatter, które wylądują jednocześnie, decyduje o tym, która funkcja się otworzy, a każda przyznaje ${n} darmowych obrotów:`,
		tiers: [
			'Od początku na siatce jest jeden worek. Wszystkie worki są lepkie i zostają do końca funkcji; między obrotami każdy otrzymuje nowy mnożnik.',
			'Od początku na siatce są dwa worki. Wartości worków zostają zachowane, a każdy worek biorący udział w wygranej podwaja się przed następnym obrotem. Każdy worek podwaja się najwyżej raz na obrót.',
			'Od początku na siatce jest jeden worek i obowiązuje zasada podwajania z Muscle. Dodatkowo <strong>każdy bęben, który Osiłek wypełni symbolami Wild, pozostaje Wild do końca funkcji</strong> — zatrzymane kolumny Wild przybywają z obrotu na obrót.',
		],
		symbols: {
			H1: 'Łańcuch z koroną',
			H2: 'Ogrodzony kwartał',
			H3: 'Zwitek banknotów',
			H4: 'Butelka i papieros',
			H5: 'Lowrider',
			L1: 'Tag z koroną',
			L2: 'Tag z czaszką',
			L3: 'Tag z gwiazdą',
			L4: 'Tag z błyskawicą',
			W: 'Kastet',
			S: 'Boombox — Scatter',
			SW: 'Osiłek',
		},
		ptSpecial: 'Nie płaci samodzielnie — wypełnia cały swój bęben symbolami Wild. Symbole Scatter na tym bębnie nie są zastępowane.',
		ptFoot: (mw) =>
			`Wild zastępuje wszystkie symbole oprócz Scattera i Osiłka i płaci jako osobny symbol. Na każdej linii wypłacana jest tylko najwyższa wygrana. Maksymalna wygrana jest ograniczona do ${mw}× zakładu podstawowego.`,
	},
	ru: {
		wild: 'Wild заменяет любой символ, кроме Scatter и Громилы, и при 5 одинаковых оплачивается как отдельный символ.',
		bruiserTitle: 'Громила',
		bruiser: 'Громила выпадает на трёх средних барабанах в основной игре и на любом барабане во время бесплатных вращений. Когда он выпадает, <strong>весь его барабан заполняется символами Wild</strong> до подсчёта выигрышей. Символы Scatter на этом барабане не заменяются. Громила не оплачивается как отдельный символ, и за одно вращение выпадает не более одного.',
		bagsTitle: 'Мешки с добычей',
		bags: [
			'Мешки с добычей появляются на поле и открывают множитель, когда барабаны останавливаются. Мешок занимает <strong>1×1, 2×2 или 3×3 позиции</strong> и несёт одно значение, сколько бы позиций он ни занимал. Возможные значения: от 2× до 10×, 25×, 50× и 100× на одной позиции, от 2× до 10× на мешке 2×2 и от 2× до 8× на мешке 3×3.',
			'Мешок учитывается в выигрыше, если закрытый им символ входит в выигрышную линию выплат, и выигрыш умножается на значение мешка. Большой мешок учитывается <strong>один раз за каждую свою позицию</strong>, через которую проходит выигрышная линия. Если в одном выигрыше участвуют несколько мешков, их значения <strong>складываются</strong> и применяется сумма.',
		],
		scoreTitle: 'Крупный куш',
		score: 'В любом вращении — в обычной игре и внутри каждой функции — <strong>всё поле может стать одним мешком с добычей</strong>. Он несёт одно значение от <strong>5× до 50×</strong> для каждой позиции, поэтому выигрышная линия умножается на это значение один раз за каждую свою позицию. Крупный куш может выпасть независимо от того, есть ли во вращении выигрышная линия, — если выигрыша нет, он просто проходит.',
		scatter: (n) =>
			`Scatter «Бумбокс» выпадает на всех пяти барабанах в основной игре и на барабанах 3–5 во время бесплатных вращений. Он не оплачивается сам по себе и не обязан выпадать на линии выплат. Число одновременно выпавших Scatter определяет, какая функция откроется, и каждая даёт ${n} бесплатных вращений:`,
		tiers: [
			'С самого начала на поле один мешок. Все мешки липкие и остаются до конца функции; между вращениями каждый получает новый множитель.',
			'С самого начала на поле два мешка. Значения мешков сохраняются, и любой мешок, участвующий в выигрыше, удваивается перед следующим вращением. Каждый мешок удваивается не более одного раза за вращение.',
			'С самого начала на поле один мешок, и действует правило удвоения из Muscle. Кроме того, <strong>каждый барабан, который Громила заполнил символами Wild, остаётся Wild до конца функции</strong> — удержанные столбцы Wild накапливаются от вращения к вращению.',
		],
		symbols: {
			H1: 'Цепь с короной',
			H2: 'Огороженный квартал',
			H3: 'Пачка банкнот',
			H4: 'Бутылка и сигарета',
			H5: 'Лоурайдер',
			L1: 'Граффити «корона»',
			L2: 'Граффити «череп»',
			L3: 'Граффити «звезда»',
			L4: 'Граффити «молния»',
			W: 'Кастет',
			S: 'Бумбокс — Scatter',
			SW: 'Громила',
		},
		ptSpecial: 'Не оплачивается сам по себе — заполняет весь свой барабан символами Wild. Символы Scatter на этом барабане не заменяются.',
		ptFoot: (mw) =>
			`Wild заменяет все символы, кроме Scatter и Громилы, и оплачивается как отдельный символ. На каждой линии выплачивается только наибольший выигрыш. Максимальный выигрыш ограничен ${mw}× базовой ставки.`,
	},
	tr: {
		wild: 'Wild, Scatter ve Kabadayı dışındaki tüm sembollerin yerine geçer ve 5’li eşleşmede kendi sembolü olarak öder.',
		bruiserTitle: 'Kabadayı',
		bruiser: 'Kabadayı ana oyunda ortadaki üç makarada, ücretsiz dönüşlerde ise her makarada çıkar. Geldiğinde, kazançlar değerlendirilmeden önce <strong>tüm makarası Wild ile dolar</strong>. O makaradaki Scatter’lar değiştirilmez. Kabadayı kendi başına bir sembol olarak ödeme yapmaz ve bir dönüşte en fazla bir tane gelir.',
		bagsTitle: 'Ganimet Çantaları',
		bags: [
			'Ganimet Çantaları ızgaraya düşer ve makaralar durduğunda bir çarpan gösterir. Bir çanta <strong>1×1, 2×2 veya 3×3 konumu</strong> kaplar ve kaç konumu kaplarsa kaplasın tek bir değer taşır. Olası değerler tek bir konumda 2× ile 10×, 25×, 50× ve 100×; 2×2 çantada 2× ile 10×; 3×3 çantada 2× ile 8× arasıdır.',
			'Bir çanta, kapladığı bir sembol kazanan bir ödeme çizgisinin parçası olduğunda kazanca dahil olur ve kazanç çantanın değeriyle çarpılır. Büyük bir çanta, kazanan çizginin geçtiği <strong>her konumu için bir kez</strong> sayılır. Aynı kazanca birden fazla çanta katılırsa değerleri <strong>toplanır</strong> ve toplam uygulanır.',
		],
		scoreTitle: 'Büyük Vurgun',
		score: 'Herhangi bir dönüşte — normal oyunda ve her özelliğin içinde — <strong>tüm ızgara tek bir Ganimet Çantasına dönüşebilir</strong>. Her konuma uygulanan <strong>5× ile 50×</strong> arasında tek bir değer taşır; böylece kazanan bir ödeme çizgisi, her konumu için bir kez bu değerle çarpılır. Büyük Vurgun, dönüşte kazanan çizgi olsun ya da olmasın gelebilir — kazanç yoksa öylece geçer.',
		scatter: (n) =>
			`Müzik Seti Scatter’ı ana oyunda beş makaranın hepsinde, ücretsiz dönüşlerde ise 3–5. makaralarda çıkar. Tek başına ödeme yapmaz ve bir ödeme çizgisine düşmesi gerekmez. Birlikte gelen Scatter sayısı hangi özelliğin açılacağını belirler ve her biri ${n} ücretsiz dönüş verir:`,
		tiers: [
			'Başlangıçta ızgarada bir çanta vardır. Tüm çantalar yapışkandır ve özellik bitene kadar kalır; dönüşler arasında her birine yeni bir çarpan gelir.',
			'Başlangıçta ızgarada iki çanta vardır. Çanta değerleri korunur ve bir kazanca katılan her çanta bir sonraki dönüşten önce ikiye katlanır. Her çanta dönüş başına en fazla bir kez katlanır.',
			'Başlangıçta ızgarada bir çanta vardır ve Muscle’ın ikiye katlama kuralı geçerlidir. Ayrıca <strong>Kabadayı’nın Wild ile doldurduğu her makara özellik sonuna kadar Wild kalır</strong> — tutulan Wild sütunları dönüş dönüş birikir.',
		],
		symbols: {
			H1: 'Taçlı Zincir',
			H2: 'Çitle Çevrili Blok',
			H3: 'Banknot Tomarı',
			H4: 'Şişe ve Sigara',
			H5: 'Lowrider',
			L1: 'Taç Grafiti',
			L2: 'Kafatası Grafiti',
			L3: 'Yıldız Grafiti',
			L4: 'Şimşek Grafiti',
			W: 'Muşta',
			S: 'Müzik Seti — Scatter',
			SW: 'Kabadayı',
		},
		ptSpecial: 'Tek başına ödeme yapmaz — tüm makarasını Wild ile doldurur. O makaradaki Scatter’lar değiştirilmez.',
		ptFoot: (mw) =>
			`Wild, Scatter ve Kabadayı dışındaki tüm sembollerin yerine geçer ve kendi sembolü olarak öder. Her çizgide yalnızca en yüksek kazanç ödenir. Maksimum kazanç temel bahsin ${mw} katıyla sınırlıdır.`,
	},
	fi: {
		wild: 'Wild korvaa kaikki symbolit paitsi Scatterin ja Rähinäpukarin, ja se maksaa omana symbolinaan viiden samanlaisen yhdistelmästä.',
		bruiserTitle: 'Rähinäpukari',
		bruiser: 'Rähinäpukari ilmestyy peruspelissä kolmelle keskimmäiselle rullalle ja ilmaiskierroksilla mille tahansa rullalle. Kun se osuu, <strong>koko sen rulla täyttyy Wildeillä</strong> ennen voittojen laskemista. Rullan Scattereita ei korvata. Rähinäpukari ei maksa omana symbolinaan, ja kierroksella osuu enintään yksi.',
		bagsTitle: 'Saalissäkit',
		bags: [
			'Saalissäkit osuvat ruudukkoon ja paljastavat kertoimen, kun rullat pysähtyvät. Säkki peittää <strong>1×1, 2×2 tai 3×3 ruutua</strong> ja sillä on yksi arvo riippumatta siitä, montako ruutua se peittää. Mahdolliset arvot ovat yksittäisessä ruudussa 2×–10×, 25×, 50× ja 100×, 2×2-säkissä 2×–10× ja 3×3-säkissä 2×–8×.',
			'Säkki lasketaan mukaan voittoon, kun sen peittämä symboli kuuluu voittavaan voittolinjaan, ja voitto kerrotaan säkin arvolla. Suurempi säkki lasketaan <strong>kerran jokaista ruutuaan kohden</strong>, jonka voittava linja ylittää. Jos samaan voittoon osallistuu useampi säkki, niiden arvot <strong>lasketaan yhteen</strong> ja summaa käytetään.',
		],
		scoreTitle: 'Iso keikka',
		score: 'Millä tahansa kierroksella — tavallisessa pelissä ja jokaisessa ominaisuudessa — <strong>koko ruudukosta voi tulla yksi saalissäkki</strong>. Sillä on yksi arvo väliltä <strong>5×–50×</strong> jokaisessa ruudussa, joten voittava voittolinja kerrotaan tällä arvolla kerran jokaista ruutuaan kohden. Iso keikka voi ilmestyä riippumatta siitä, onko kierroksella voittolinjaa — jos voittoa ei ole, se vain menee ohi.',
		scatter: (n) =>
			`Boombox-Scatter ilmestyy peruspelissä kaikille viidelle rullalle ja ilmaiskierroksilla rullille 3–5. Se ei maksa yksinään eikä sen tarvitse osua voittolinjalle. Yhtä aikaa osuvien Scatterien määrä ratkaisee, mikä ominaisuus avautuu, ja kukin antaa ${n} ilmaiskierrosta:`,
		tiers: [
			'Ruudukossa on alusta alkaen yksi säkki. Kaikki säkit ovat tahmeita ja pysyvät ominaisuuden loppuun asti; kierrosten välillä kukin saa uuden kertoimen.',
			'Ruudukossa on alusta alkaen kaksi säkkiä. Säkkien arvot säilyvät, ja jokainen voittoon osallistuva säkki tuplaantuu ennen seuraavaa kierrosta. Kukin säkki tuplaantuu enintään kerran kierroksessa.',
			'Ruudukossa on alusta alkaen yksi säkki, ja Musclen tuplaussääntö on voimassa. Lisäksi <strong>jokainen rulla, jonka Rähinäpukari täyttää Wildeillä, pysyy Wildinä ominaisuuden loppuun asti</strong> — pidetyt Wild-sarakkeet kertyvät kierros kierrokselta.',
		],
		symbols: {
			H1: 'Kruunuketju',
			H2: 'Aidattu kortteli',
			H3: 'Setelirulla',
			H4: 'Pullo ja tupakka',
			H5: 'Lowrider',
			L1: 'Kruunutägi',
			L2: 'Pääkallotägi',
			L3: 'Tähtitägi',
			L4: 'Salamatägi',
			W: 'Nyrkkirauta',
			S: 'Boombox — Scatter',
			SW: 'Rähinäpukari',
		},
		ptSpecial: 'Ei maksa yksinään — täyttää koko rullansa Wildeillä. Rullan Scattereita ei korvata.',
		ptFoot: (mw) =>
			`Wild korvaa kaikki symbolit paitsi Scatterin ja Rähinäpukarin, ja se maksaa omana symbolinaan. Kultakin linjalta maksetaan vain suurin voitto. Maksimivoitto on rajattu ${mw}-kertaiseen peruspanokseen.`,
	},
	id: {
		wild: 'Wild menggantikan semua simbol kecuali Scatter dan Si Preman, dan membayar sebagai simbolnya sendiri untuk 5 yang sama.',
		bruiserTitle: 'Si Preman',
		bruiser: 'Si Preman muncul di tiga gulungan tengah pada permainan dasar, dan di gulungan mana pun selama putaran gratis. Saat mendarat, <strong>seluruh gulungannya terisi Wild</strong> sebelum kemenangan dihitung. Scatter di gulungan itu tidak diganti. Si Preman tidak membayar sebagai simbolnya sendiri, dan paling banyak satu mendarat di setiap putaran.',
		bagsTitle: 'Kantong Jarahan',
		bags: [
			'Kantong Jarahan mendarat di kisi dan menampilkan pengganda saat gulungan berhenti. Satu kantong menutupi <strong>1×1, 2×2 atau 3×3 posisi</strong> dan membawa satu nilai, berapa pun posisi yang ditutupinya. Nilai yang mungkin adalah 2× hingga 10×, 25×, 50× dan 100× pada satu posisi, 2× hingga 10× pada kantong 2×2, dan 2× hingga 8× pada kantong 3×3.',
			'Kantong dihitung untuk kemenangan saat simbol yang ditutupinya menjadi bagian dari garis pembayaran yang menang, dan kemenangan dikalikan dengan nilai kantong. Kantong yang lebih besar dihitung <strong>sekali untuk setiap posisinya</strong> yang dilintasi garis pemenang. Jika lebih dari satu kantong ikut dalam kemenangan yang sama, nilainya <strong>dijumlahkan</strong> dan totalnya diterapkan.',
		],
		scoreTitle: 'Jarahan Besar',
		score: 'Di putaran mana pun — dalam permainan biasa dan di dalam setiap fitur — <strong>seluruh kisi dapat menjadi satu Kantong Jarahan</strong>. Kantong itu membawa satu nilai dari <strong>5× hingga 50×</strong> yang berlaku untuk setiap posisi, sehingga garis pembayaran yang menang dikalikan dengan nilai itu sekali untuk setiap posisinya. Jarahan Besar dapat muncul baik putaran itu punya garis menang maupun tidak — jika tidak ada kemenangan, ia lewat begitu saja.',
		scatter: (n) =>
			`Scatter Boombox muncul di kelima gulungan pada permainan dasar, dan di gulungan 3 sampai 5 selama putaran gratis. Scatter tidak membayar sendiri dan tidak perlu mendarat di garis pembayaran. Jumlah Scatter yang mendarat bersamaan menentukan fitur mana yang terbuka, dan masing-masing memberi ${n} putaran gratis:`,
		tiers: [
			'Satu kantong sudah ada di kisi sejak awal. Semua kantong lengket dan bertahan sampai fitur berakhir; di antara putaran, masing-masing diisi ulang dengan pengganda baru.',
			'Dua kantong sudah ada di kisi sejak awal. Nilai kantong tetap, dan setiap kantong yang ikut dalam kemenangan menjadi dua kali lipat sebelum putaran berikutnya. Setiap kantong paling banyak berlipat sekali per putaran.',
			'Satu kantong sudah ada di kisi sejak awal dan aturan pelipatan Muscle berlaku. Selain itu, <strong>setiap gulungan yang diisi Wild oleh Si Preman tetap Wild sampai fitur berakhir</strong> — kolom Wild yang tertahan bertambah dari putaran ke putaran.',
		],
		symbols: {
			H1: 'Kalung Mahkota',
			H2: 'Blok Berpagar',
			H3: 'Gulungan Uang Kertas',
			H4: 'Botol & Rokok',
			H5: 'Lowrider',
			L1: 'Grafiti Mahkota',
			L2: 'Grafiti Tengkorak',
			L3: 'Grafiti Bintang',
			L4: 'Grafiti Petir',
			W: 'Buku Jari Kuningan',
			S: 'Boombox — Scatter',
			SW: 'Si Preman',
		},
		ptSpecial: 'Tidak membayar sendiri — mengisi seluruh gulungannya dengan Wild. Scatter di gulungan itu tidak diganti.',
		ptFoot: (mw) =>
			`Wild menggantikan semua simbol kecuali Scatter dan Si Preman, dan membayar sebagai simbolnya sendiri. Hanya kemenangan tertinggi yang dibayar per garis. Kemenangan maksimum dibatasi ${mw}× taruhan dasar.`,
	},
	vi: {
		wild: 'Wild thay thế mọi biểu tượng trừ Scatter và Gã đầu gấu, và trả thưởng như biểu tượng riêng khi có 5 biểu tượng giống nhau.',
		bruiserTitle: 'Gã đầu gấu',
		bruiser: 'Gã đầu gấu xuất hiện ở ba cuộn giữa trong trò chơi chính và ở bất kỳ cuộn nào trong vòng quay miễn phí. Khi hắn xuất hiện, <strong>toàn bộ cuộn của hắn được lấp đầy bằng Wild</strong> trước khi tính thắng. Scatter trên cuộn đó không bị thay thế. Gã đầu gấu không trả thưởng như một biểu tượng riêng, và mỗi lượt quay có tối đa một gã.',
		bagsTitle: 'Túi chiến lợi phẩm',
		bags: [
			'Túi chiến lợi phẩm xuất hiện trên lưới và hiện một hệ số nhân khi các cuộn dừng lại. Một túi phủ <strong>1×1, 2×2 hoặc 3×3 ô</strong> và mang một giá trị duy nhất dù phủ bao nhiêu ô. Các giá trị có thể là 2× đến 10×, 25×, 50× và 100× trên một ô, 2× đến 10× trên túi 2×2 và 2× đến 8× trên túi 3×3.',
			'Một túi được tính vào khoản thắng khi biểu tượng mà nó phủ thuộc về một dòng thanh toán thắng, và khoản thắng được nhân với giá trị của túi. Túi lớn hơn được tính <strong>một lần cho mỗi ô của nó</strong> mà dòng thắng đi qua. Khi nhiều túi cùng tham gia một khoản thắng, giá trị của chúng được <strong>cộng lại</strong> và tổng được áp dụng.',
		],
		scoreTitle: 'Phi vụ lớn',
		score: 'Ở bất kỳ lượt quay nào — khi chơi thường và trong mọi tính năng — <strong>toàn bộ lưới có thể trở thành một túi chiến lợi phẩm duy nhất</strong>. Túi mang một giá trị từ <strong>5× đến 50×</strong> áp dụng cho mọi ô, nên một dòng thanh toán thắng được nhân với giá trị đó một lần cho mỗi ô của nó. Phi vụ lớn có thể xuất hiện dù lượt quay có dòng thắng hay không — nếu không có thắng, nó chỉ lướt qua.',
		scatter: (n) =>
			`Scatter Máy cát-xét xuất hiện trên cả năm cuộn trong trò chơi chính và trên các cuộn 3 đến 5 trong vòng quay miễn phí. Nó không tự trả thưởng và không cần nằm trên dòng thanh toán. Số Scatter cùng xuất hiện quyết định tính năng nào được mở, và mỗi tính năng cho ${n} vòng quay miễn phí:`,
		tiers: [
			'Một túi có sẵn trên lưới ngay từ đầu. Mọi túi đều cố định và ở lại đến hết tính năng; giữa các lượt quay, mỗi túi được nạp hệ số nhân mới.',
			'Hai túi có sẵn trên lưới ngay từ đầu. Giá trị túi được giữ nguyên, và túi nào tham gia một khoản thắng sẽ nhân đôi trước lượt quay tiếp theo. Mỗi túi nhân đôi tối đa một lần mỗi lượt.',
			'Một túi có sẵn trên lưới ngay từ đầu và áp dụng quy tắc nhân đôi của Muscle. Thêm vào đó, <strong>mỗi cuộn mà Gã đầu gấu lấp đầy Wild sẽ giữ nguyên Wild đến hết tính năng</strong> — các cột Wild được giữ tích lũy dần qua từng lượt.',
		],
		symbols: {
			H1: 'Dây chuyền vương miện',
			H2: 'Khu phố rào kín',
			H3: 'Cuộn tiền giấy',
			H4: 'Chai & thuốc lá',
			H5: 'Xe lowrider',
			L1: 'Hình vẽ vương miện',
			L2: 'Hình vẽ đầu lâu',
			L3: 'Hình vẽ ngôi sao',
			L4: 'Hình vẽ tia sét',
			W: 'Nắm đấm sắt',
			S: 'Máy cát-xét — Scatter',
			SW: 'Gã đầu gấu',
		},
		ptSpecial: 'Không tự trả thưởng — lấp đầy toàn bộ cuộn của nó bằng Wild. Scatter trên cuộn đó không bị thay thế.',
		ptFoot: (mw) =>
			`Wild thay thế mọi biểu tượng trừ Scatter và Gã đầu gấu, và trả thưởng như biểu tượng riêng. Mỗi dòng chỉ trả khoản thắng cao nhất. Thắng tối đa được giới hạn ở ${mw}× mức cược cơ bản.`,
	},
	ja: {
		wild: 'ワイルドはスキャッターとブルーザー以外のすべてのシンボルの代わりになり、5個揃うと独自のシンボルとして配当します。',
		bruiserTitle: 'ブルーザー',
		bruiser: 'ブルーザーはベースゲームでは中央の3リールに、フリースピン中はどのリールにも出現します。出現すると、配当の判定前に<strong>そのリール全体がワイルドで埋まります</strong>。そのリールのスキャッターは置き換えられません。ブルーザー自体には配当がなく、1スピンに出現するのは1体までです。',
		bagsTitle: 'ルートバッグ',
		bags: [
			'ルートバッグはグリッドに出現し、リールが止まると倍率が明らかになります。バッグは<strong>1×1・2×2・3×3マス</strong>を覆い、覆うマスの数にかかわらず倍率は1つです。倍率は1マスで2×～10×、25×、50×、100×、2×2バッグで2×～10×、3×3バッグで2×～8×です。',
			'バッグが覆うシンボルが当たりペイラインに含まれると、そのバッグが配当に加わり、配当にバッグの倍率が掛かります。大きいバッグは、当たりラインが通過した<strong>マスごとに1回</strong>カウントされます。同じ当たりに複数のバッグが関わる場合、倍率は<strong>合算</strong>され、その合計が適用されます。',
		],
		scoreTitle: 'ビッグスコア',
		score: 'どのスピンでも（通常プレイでも各フィーチャー中でも）、<strong>グリッド全体が1つのルートバッグになる</strong>ことがあります。全マスに<strong>5×～50×</strong>の倍率が1つ適用され、当たりペイラインはそのマスごとにこの倍率で1回ずつ倍増します。ビッグスコアは当たりラインの有無にかかわらず出現し、当たりがない場合はそのまま過ぎ去ります。',
		scatter: (n) =>
			`ラジカセのスキャッターはベースゲームでは5本すべてのリールに、フリースピン中はリール3～5に出現します。スキャッター単独では配当がなく、ペイライン上に止まる必要もありません。同時に出現したスキャッターの数で開始するフィーチャーが決まり、どれもフリースピン${n}回です：`,
		tiers: [
			'開始時からバッグが1つあります。すべてのバッグは固定され、フィーチャー終了まで残ります。スピンごとに新しい倍率に入れ替わります。',
			'開始時からバッグが2つあります。バッグの倍率は保持され、当たりに関わったバッグは次のスピン前に2倍になります。各バッグが2倍になるのは1スピンにつき1回までです。',
			'開始時からバッグが1つあり、Muscleの倍増ルールが適用されます。さらに<strong>ブルーザーがワイルドで埋めたリールは、フィーチャー終了までワイルドのまま残ります</strong>。残ったワイルドのリールはスピンごとに増えていきます。',
		],
		symbols: {
			H1: '王冠チェーン',
			H2: 'フェンスの街区',
			H3: '札束',
			H4: 'ボトルとタバコ',
			H5: 'ローライダー',
			L1: '王冠タグ',
			L2: 'ドクロタグ',
			L3: '星タグ',
			L4: '稲妻タグ',
			W: 'メリケンサック',
			S: 'ラジカセ — スキャッター',
			SW: 'ブルーザー',
		},
		ptSpecial: '単独では配当なし — そのリール全体をワイルドで埋めます。そのリールのスキャッターは置き換えられません。',
		ptFoot: (mw) =>
			`ワイルドはスキャッターとブルーザー以外のすべてのシンボルの代わりになり、独自のシンボルとしても配当します。各ラインでは最も高い当たりのみが支払われます。最大配当はベースベットの${mw}倍が上限です。`,
	},
	ko: {
		wild: '와일드는 스캐터와 브루저를 제외한 모든 심볼을 대체하며, 5개 일치 시 자체 심볼로 지급됩니다.',
		bruiserTitle: '브루저',
		bruiser: '브루저는 기본 게임에서는 가운데 세 릴에, 프리 스핀 중에는 모든 릴에 등장합니다. 나오면 당첨을 판정하기 전에 <strong>해당 릴 전체가 와일드로 채워집니다</strong>. 그 릴의 스캐터는 대체되지 않습니다. 브루저 자체는 지급되지 않으며, 한 스핀에 최대 1개만 나옵니다.',
		bagsTitle: '전리품 가방',
		bags: [
			'전리품 가방은 그리드에 떨어지고 릴이 멈추면 배수를 공개합니다. 가방은 <strong>1×1, 2×2 또는 3×3칸</strong>을 덮으며, 덮는 칸 수와 관계없이 하나의 값을 가집니다. 가능한 값은 한 칸에서 2×~10×, 25×, 50×, 100×, 2×2 가방에서 2×~10×, 3×3 가방에서 2×~8×입니다.',
			'가방이 덮은 심볼이 당첨 페이라인에 포함되면 가방이 당첨에 적용되어 당첨금에 가방 값이 곱해집니다. 큰 가방은 당첨 라인이 지나가는 <strong>칸마다 한 번씩</strong> 계산됩니다. 같은 당첨에 여러 가방이 관여하면 값이 <strong>합산</strong>되어 그 합계가 적용됩니다.',
		],
		scoreTitle: '빅 스코어',
		score: '어느 스핀에서든(일반 게임과 모든 기능 안에서) <strong>그리드 전체가 하나의 전리품 가방이 될 수 있습니다</strong>. 모든 칸에 <strong>5×~50×</strong>의 값 하나가 적용되므로, 당첨 페이라인은 지나가는 칸마다 그 값으로 한 번씩 곱해집니다. 빅 스코어는 당첨 라인 유무와 관계없이 나올 수 있으며, 당첨이 없으면 그냥 지나갑니다.',
		scatter: (n) =>
			`붐박스 스캐터는 기본 게임에서는 다섯 릴 모두에, 프리 스핀 중에는 3~5번 릴에 등장합니다. 스캐터 단독으로는 지급되지 않으며 페이라인 위에 있을 필요가 없습니다. 함께 나온 스캐터 수에 따라 열리는 기능이 정해지며, 각 기능은 프리 스핀 ${n}회를 줍니다:`,
		tiers: [
			'시작부터 그리드에 가방 1개가 있습니다. 모든 가방은 고정되어 기능이 끝날 때까지 남으며, 스핀 사이마다 새 배수로 바뀝니다.',
			'시작부터 그리드에 가방 2개가 있습니다. 가방 값은 유지되며, 당첨에 관여한 가방은 다음 스핀 전에 두 배가 됩니다. 각 가방은 스핀당 최대 한 번만 두 배가 됩니다.',
			'시작부터 그리드에 가방 1개가 있고 Muscle의 두 배 규칙이 적용됩니다. 추가로 <strong>브루저가 와일드로 채운 릴은 기능이 끝날 때까지 와일드로 남습니다</strong>. 남은 와일드 릴은 스핀마다 쌓여 갑니다.',
		],
		symbols: {
			H1: '왕관 체인',
			H2: '울타리 친 구역',
			H3: '지폐 뭉치',
			H4: '술병과 담배',
			H5: '로우라이더',
			L1: '왕관 태그',
			L2: '해골 태그',
			L3: '별 태그',
			L4: '번개 태그',
			W: '너클',
			S: '붐박스 — 스캐터',
			SW: '브루저',
		},
		ptSpecial: '단독으로는 지급 없음 — 해당 릴 전체를 와일드로 채웁니다. 그 릴의 스캐터는 대체되지 않습니다.',
		ptFoot: (mw) =>
			`와일드는 스캐터와 브루저를 제외한 모든 심볼을 대체하며, 자체 심볼로도 지급됩니다. 각 라인에서는 가장 높은 당첨만 지급됩니다. 최대 당첨은 기본 베팅의 ${mw}배로 제한됩니다.`,
	},
	zh: {
		wild: '百搭可替代分散符號與打手以外的所有符號，5 個連線時也以自身符號派彩。',
		bruiserTitle: '打手',
		bruiser: '打手在一般遊戲出現在中間三輪，免費遊戲中可出現在任一輪。出現時，會在計算贏分前<strong>把整條輪填滿百搭</strong>。該輪上的分散符號不會被取代。打手本身不派彩，每一手最多出現一個。',
		bagsTitle: '贓物袋',
		bags: [
			'贓物袋落在盤面上，輪停下時揭曉倍數。一個袋覆蓋 <strong>1×1、2×2 或 3×3 格</strong>，不論覆蓋幾格都只帶一個倍數。單格可能的倍數為 2× 至 10×、25×、50× 與 100×；2×2 袋為 2× 至 10×；3×3 袋為 2× 至 8×。',
			'袋所覆蓋的符號屬於中獎賠付線時，該袋計入這筆贏分，贏分乘以袋的倍數。較大的袋依中獎賠付線經過的<strong>每一格各計一次</strong>。多個袋參與同一筆贏分時，倍數<strong>相加</strong>後再套用總和。',
		],
		scoreTitle: '大撈一筆',
		score: '任何一手——一般遊戲與每個特色功能中——<strong>整個盤面都可能變成一個贓物袋</strong>。它帶有 <strong>5× 至 50×</strong> 的單一倍數並套用到每一格，因此中獎賠付線會依經過的每一格各乘一次這個倍數。不論這手有沒有中獎線都可能出現大撈一筆——沒有贏分時就只是經過。',
		scatter: (n) =>
			`收音機分散符號在一般遊戲出現在全部五輪，免費遊戲中出現在第 3 至第 5 輪。分散符號本身不派彩，也不必落在賠付線上。同時出現的分散符號數量決定開啟哪個特色功能，每個都給 ${n} 次免費遊戲：`,
		tiers: [
			'開場時盤面上就有 1 個袋。所有袋都會固定，留到特色功能結束；每手之間各自換上新的倍數。',
			'開場時盤面上就有 2 個袋。袋的倍數會保留，參與贏分的袋在下一手前加倍。每個袋每手最多加倍一次。',
			'開場時盤面上就有 1 個袋，並適用 Muscle 的加倍規則。此外，<strong>打手填滿百搭的每一條輪，都會保持百搭直到特色功能結束</strong>——保留的百搭輪會一手一手累積。',
		],
		symbols: {
			H1: '皇冠金鍊',
			H2: '圍籬街區',
			H3: '鈔票捲',
			H4: '酒瓶與香菸',
			H5: '低底盤車',
			L1: '皇冠塗鴉',
			L2: '骷髏塗鴉',
			L3: '星星塗鴉',
			L4: '閃電塗鴉',
			W: '指虎',
			S: '收音機 — 分散符號',
			SW: '打手',
		},
		ptSpecial: '本身不派彩 — 把整條輪填滿百搭。該輪上的分散符號不會被取代。',
		ptFoot: (mw) =>
			`百搭可替代分散符號與打手以外的所有符號，也以自身符號派彩。每條賠付線只支付最高的一筆贏分。最高贏分上限為基本押注的 ${mw} 倍。`,
	},
	ar: {
		wild: 'يحل رمز Wild محل كل الرموز عدا Scatter والبلطجي، ويدفع كرمز مستقل عند تطابق 5 رموز.',
		bruiserTitle: 'البلطجي',
		bruiser: 'يظهر البلطجي على البكرات الثلاث الوسطى في اللعبة الأساسية، وعلى أي بكرة أثناء الدورات المجانية. عند ظهوره <strong>تمتلئ بكرته بالكامل برموز Wild</strong> قبل احتساب أي أرباح. لا تُستبدل رموز Scatter على تلك البكرة. لا يدفع البلطجي كرمز مستقل، ولا يظهر أكثر من واحد في أي دورة.',
		bagsTitle: 'أكياس الغنيمة',
		bags: [
			'تهبط أكياس الغنيمة على الشبكة وتكشف مضاعفًا عند توقف البكرات. يغطي الكيس <strong>1×1 أو 2×2 أو 3×3 مواضع</strong> ويحمل قيمة واحدة مهما كان عدد المواضع التي يغطيها. القيم الممكنة من 2× إلى 10× و25× و50× و100× على موضع واحد، ومن 2× إلى 10× على كيس 2×2، ومن 2× إلى 8× على كيس 3×3.',
			'يُحتسب الكيس في الربح عندما يكون رمز يغطيه جزءًا من خط دفع رابح، ويُضرب الربح في قيمة الكيس. يُحتسب الكيس الأكبر <strong>مرة لكل موضع من مواضعه</strong> يعبره خط الدفع الرابح. وإذا شارك أكثر من كيس في الربح نفسه <strong>تُجمع</strong> قيمها ويُطبَّق المجموع.',
		],
		scoreTitle: 'الضربة الكبرى',
		score: 'في أي دورة — في اللعب العادي وداخل كل ميزة — <strong>يمكن أن تتحول الشبكة كلها إلى كيس غنيمة واحد</strong>. يحمل قيمة واحدة من <strong>5× إلى 50×</strong> تُطبَّق على كل موضع، فيُضرب خط الدفع الرابح في هذه القيمة مرة لكل موضع من مواضعه. يمكن أن تظهر الضربة الكبرى سواء كان في الدورة خط رابح أم لا — وعند عدم وجود ربح تمر ببساطة.',
		scatter: (n) =>
			`يظهر رمز Scatter مسجل الصوت على البكرات الخمس كلها في اللعبة الأساسية، وعلى البكرات من 3 إلى 5 أثناء الدورات المجانية. لا يدفع بمفرده، ولا يلزم أن يهبط على خط دفع. يحدد عدد رموز Scatter الهابطة معًا أي ميزة تُفتح، وتمنح كل ميزة ${n} دورات مجانية:`,
		tiers: [
			'يوجد كيس واحد على الشبكة منذ البداية. جميع الأكياس ثابتة وتبقى حتى نهاية الميزة؛ وبين الدورات يُعاد ملء كل منها بمضاعف جديد.',
			'يوجد كيسان على الشبكة منذ البداية. تبقى قيم الأكياس، وأي كيس يشارك في ربح تتضاعف قيمته قبل الدورة التالية. يتضاعف كل كيس مرة واحدة على الأكثر في كل دورة.',
			'يوجد كيس واحد على الشبكة منذ البداية وتنطبق قاعدة المضاعفة الخاصة بـ Muscle. وإضافة إلى ذلك، <strong>تبقى كل بكرة يملؤها البلطجي برموز Wild على حالها حتى نهاية الميزة</strong> — فتتراكم أعمدة Wild المحتجزة دورة بعد دورة.',
		],
		symbols: {
			H1: 'سلسلة التاج',
			H2: 'المربع المسيّج',
			H3: 'لفافة الأوراق النقدية',
			H4: 'زجاجة وسيجارة',
			H5: 'سيارة لورايدر',
			L1: 'وسم التاج',
			L2: 'وسم الجمجمة',
			L3: 'وسم النجمة',
			L4: 'وسم البرق',
			W: 'القبضة الحديدية',
			S: 'مسجل الصوت — Scatter',
			SW: 'البلطجي',
		},
		ptSpecial: 'لا يدفع بمفرده — يملأ بكرته بالكامل برموز Wild. لا تُستبدل رموز Scatter على تلك البكرة.',
		ptFoot: (mw) =>
			`يحل رمز Wild محل كل الرموز عدا Scatter والبلطجي، ويدفع كرمز مستقل. يُدفع أعلى ربح فقط في كل خط. أقصى ربح محدد بـ ${mw} ضعف الرهان الأساسي.`,
	},
	hi: {
		wild: 'वाइल्ड स्कैटर और ब्रूज़र को छोड़कर हर सिंबल की जगह ले लेता है, और 5 एक जैसे मिलने पर अपने सिंबल के रूप में भुगतान करता है।',
		bruiserTitle: 'ब्रूज़र',
		bruiser: 'ब्रूज़र बेस गेम में बीच की तीन रीलों पर और फ्री स्पिन के दौरान किसी भी रील पर आता है। जब वह आता है, तो जीत की गणना से पहले <strong>उसकी पूरी रील वाइल्ड से भर जाती है</strong>। उस रील के स्कैटर नहीं बदले जाते। ब्रूज़र अपने सिंबल के रूप में भुगतान नहीं करता, और किसी भी स्पिन में अधिकतम एक ही आता है।',
		bagsTitle: 'लूट बैग',
		bags: [
			'लूट बैग ग्रिड पर आते हैं और रीलें रुकने पर एक गुणक दिखाते हैं। एक बैग <strong>1×1, 2×2 या 3×3 स्थान</strong> घेरता है और चाहे जितने स्थान घेरे, उसका एक ही मान होता है। संभावित मान एक स्थान पर 2× से 10×, 25×, 50× और 100×, 2×2 बैग पर 2× से 10×, और 3×3 बैग पर 2× से 8× हैं।',
			'जब बैग से ढका कोई सिंबल किसी जीतने वाली पेलाइन का हिस्सा होता है, तो बैग उस जीत में गिना जाता है और जीत बैग के मान से गुणा होती है। बड़ा बैग जीतने वाली लाइन द्वारा पार किए गए <strong>अपने हर स्थान के लिए एक बार</strong> गिना जाता है। जब एक ही जीत में एक से अधिक बैग शामिल हों, तो उनके मान <strong>जोड़े जाते हैं</strong> और कुल लागू होता है।',
		],
		scoreTitle: 'बड़ा हाथ',
		score: 'किसी भी स्पिन पर — सामान्य खेल में और हर फ़ीचर के अंदर — <strong>पूरा ग्रिड एक ही लूट बैग बन सकता है</strong>। इसका <strong>5× से 50×</strong> तक का एक मान हर स्थान पर लागू होता है, इसलिए जीतने वाली पेलाइन अपने हर स्थान के लिए एक बार उस मान से गुणा होती है। बड़ा हाथ स्पिन में जीतने वाली लाइन हो या न हो, आ सकता है — जीत न हो तो वह बस गुज़र जाता है।',
		scatter: (n) =>
			`बूमबॉक्स स्कैटर बेस गेम में पाँचों रीलों पर और फ्री स्पिन के दौरान रील 3 से 5 पर आता है। यह अपने आप भुगतान नहीं करता और इसका पेलाइन पर आना ज़रूरी नहीं है। एक साथ आने वाले स्कैटर की संख्या तय करती है कि कौन-सा फ़ीचर खुलेगा, और हर एक ${n} फ्री स्पिन देता है:`,
		tiers: [
			'शुरुआत से ग्रिड पर एक बैग होता है। सभी बैग चिपके रहते हैं और फ़ीचर खत्म होने तक रहते हैं; हर स्पिन के बीच हर एक में नया गुणक भरा जाता है।',
			'शुरुआत से ग्रिड पर दो बैग होते हैं। बैग के मान बने रहते हैं, और जीत में शामिल हर बैग अगले स्पिन से पहले दोगुना हो जाता है। हर बैग एक स्पिन में अधिकतम एक बार दोगुना होता है।',
			'शुरुआत से ग्रिड पर एक बैग होता है और Muscle का दोगुना करने का नियम लागू होता है। इसके अलावा, <strong>ब्रूज़र जिस भी रील को वाइल्ड से भरता है, वह फ़ीचर के अंत तक वाइल्ड रहती है</strong> — रोके गए वाइल्ड कॉलम हर स्पिन के साथ बढ़ते जाते हैं।',
		],
		symbols: {
			H1: 'मुकुट वाली चेन',
			H2: 'बाड़ से घिरा ब्लॉक',
			H3: 'नोटों का बंडल',
			H4: 'बोतल और सिगरेट',
			H5: 'लोराइडर',
			L1: 'मुकुट टैग',
			L2: 'खोपड़ी टैग',
			L3: 'तारा टैग',
			L4: 'बिजली टैग',
			W: 'पीतल की मुट्ठी',
			S: 'बूमबॉक्स — स्कैटर',
			SW: 'ब्रूज़र',
		},
		ptSpecial: 'अपने आप भुगतान नहीं करता — अपनी पूरी रील को वाइल्ड से भर देता है। उस रील के स्कैटर नहीं बदले जाते।',
		ptFoot: (mw) =>
			`वाइल्ड स्कैटर और ब्रूज़र को छोड़कर सभी सिंबल की जगह ले लेता है, और अपने सिंबल के रूप में भुगतान करता है। हर लाइन पर केवल सबसे बड़ी जीत का भुगतान होता है। अधिकतम जीत बेस दांव के ${mw}× तक सीमित है।`,
	},
};

export const gameRulesText = (lang: RulesLang, T: Terms, social: boolean): GameText =>
	lang === 'en' || social ? english(T) : TEXT[lang];
