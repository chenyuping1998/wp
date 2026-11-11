import type { getSocialTerms } from './socialTerms';
import type { RulesLang } from './rulesCommon';

/**
 * Capo Nostra's own sections of the game rules and pay table, in every locale the
 * UI ships (2026-10-13, P2-C). The shared sections are in game/rulesCommon.ts.
 * Terms follow the intro card (game/i18nText.ts): Vault Frames, the Violin Case,
 * feature names in English. English is built from socialTerms so social play
 * keeps its wording; social play never reads the other languages.
 */

type Terms = ReturnType<typeof getSocialTerms>;

export type SymbolKey = 'H1' | 'H2' | 'H3' | 'H4' | 'H5' | 'L1' | 'L2' | 'L3' | 'L4' | 'W' | 'S' | 'SW';

export type GameText = {
	wild: string;
	caseTitle: string;
	/** HTML */
	case: string;
	framesTitle: string;
	/** HTML */
	frames: readonly [string, string];
	scatter: (freeSpins: number) => string;
	/** Soldier, Capo, The Don — HTML */
	tiers: readonly [string, string, string];
	symbols: Record<SymbolKey, string>;
	ptSpecial: string;
	ptFoot: (maxWin: string) => string;
};

const english = (T: Terms): GameText => ({
	wild: `The Wild substitutes for every symbol except the Scatter and the Violin Case, and ${T.pays} as its own symbol on 5 of a kind.`,
	caseTitle: 'The Violin Case',
	case: `The Violin Case appears on the three middle reels in the base game, and on any reel during free spins. When one lands, its <strong>entire reel is filled with Wilds</strong> before any wins are evaluated. Scatters in that reel are not replaced. The Violin Case ${T.doesNotPay.toLowerCase()} as a symbol of its own, and more than one can land on the same spin.`,
	framesTitle: 'Vault Frames',
	frames: [
		'Vault Frames land on the grid and reveal a multiplier when the reels settle. A Frame covers <strong>1×1, 2×2 or 3×3 positions</strong> and carries a single value however many positions it covers. Possible values are 2× to 10×, 25×, 50× and 100× on a single position, 2× to 10× on a 2×2 Frame, and 2× to 8× on a 3×3 Frame.',
		`A Frame counts towards a win when a symbol it covers is part of a winning ${T.payline}, and the win is multiplied by the Frame's value. A larger Frame counts <strong>once for each of its positions</strong> that the winning ${T.payline} crosses. Where more than one Frame takes part in the same win, their values are <strong>added together</strong> and the total is applied.`,
	],
	scatter: (n) =>
		`The Vault Door Scatter appears on all five reels in the base game, and on reels 3 to 5 during free spins. ${T.noPayOnItsOwn}, and does not need to land on a ${T.payline}. The number of Scatters landing together decides which feature opens, and each one awards ${n} free spins:`,
	tiers: [
		'One Frame is on the grid from the start. All Frames are sticky and stay until the feature ends; between spins each is refilled with a new multiplier.',
		'Three Frames are on the grid from the start. Frame values are sticky, and any Frame that takes part in a win doubles before the next spin. Each Frame doubles at most once per spin.',
		'Three Frames are on the grid from the start and the doubling rule of Capo applies, and in addition <strong>every spin is guaranteed at least one Violin Case</strong> — so at least one full reel of Wilds lands on every spin of the feature.',
	],
	symbols: {
		H1: 'Signet Ring',
		H2: 'City Skyline',
		H3: 'Briefcase',
		H4: 'Whiskey & Cigar',
		H5: 'Black Sedan',
		L1: 'Spade',
		L2: 'Heart',
		L3: 'Diamond',
		L4: 'Club',
		W: 'Wild',
		S: 'Vault Door — Scatter',
		SW: 'The Violin Case',
	},
	ptSpecial: `${T.doesNotPayAlone} — fills its entire reel with Wilds. Scatters in that reel are not replaced.`,
	ptFoot: (maxWin) =>
		`Wild substitutes for all symbols except the Scatter and the Violin Case, and ${T.pays} as its own symbol. Only the highest win is ${T.paid} per line. Max win is capped at ${maxWin}× ${T.baseBet}.`,
});

const TEXT: Record<Exclude<RulesLang, 'en'>, GameText> = {
	de: {
		wild: 'Das Wild ersetzt jedes Symbol außer dem Scatter und dem Geigenkoffer und zahlt bei 5 gleichen als eigenes Symbol.',
		caseTitle: 'Der Geigenkoffer',
		case: 'Der Geigenkoffer erscheint im Basisspiel auf den drei mittleren Walzen und in Freispielen auf jeder Walze. Landet einer, wird seine <strong>ganze Walze mit Wilds gefüllt</strong>, bevor Gewinne ausgewertet werden. Scatter auf dieser Walze werden nicht ersetzt. Der Geigenkoffer zahlt nicht als eigenes Symbol, und mehrere können im selben Spin landen.',
		framesTitle: 'Tresorrahmen',
		frames: [
			'Tresorrahmen landen auf dem Raster und zeigen einen Multiplikator, wenn die Walzen stehen. Ein Rahmen deckt <strong>1×1, 2×2 oder 3×3 Positionen</strong> ab und trägt einen einzigen Wert, egal wie viele Positionen er abdeckt. Mögliche Werte sind 2× bis 10×, 25×, 50× und 100× auf einer einzelnen Position, 2× bis 10× auf einem 2×2-Rahmen und 2× bis 8× auf einem 3×3-Rahmen.',
			'Ein Rahmen zählt für einen Gewinn, wenn ein von ihm abgedecktes Symbol Teil einer Gewinnlinie ist, und der Gewinn wird mit dem Wert des Rahmens multipliziert. Ein größerer Rahmen zählt <strong>einmal für jede seiner Positionen</strong>, die die Gewinnlinie kreuzt. Sind mehrere Rahmen am selben Gewinn beteiligt, werden ihre Werte <strong>addiert</strong> und die Summe angewendet.',
		],
		scatter: (n) =>
			`Der Tresortür-Scatter erscheint im Basisspiel auf allen fünf Walzen und in Freispielen auf den Walzen 3 bis 5. Er zahlt nicht allein und muss nicht auf einer Gewinnlinie landen. Die Zahl der gleichzeitig gelandeten Scatter entscheidet, welches Feature startet, und jedes bringt ${n} Freispiele:`,
		tiers: [
			'Ein Rahmen liegt von Beginn an auf dem Raster. Alle Rahmen sind sticky und bleiben bis zum Ende des Features; zwischen den Spins erhält jeder einen neuen Multiplikator.',
			'Drei Rahmen liegen von Beginn an auf dem Raster. Die Rahmenwerte bleiben erhalten, und jeder Rahmen, der an einem Gewinn beteiligt ist, verdoppelt sich vor dem nächsten Spin. Jeder Rahmen verdoppelt sich höchstens einmal pro Spin.',
			'Drei Rahmen liegen von Beginn an auf dem Raster, die Verdopplungsregel von Capo gilt, und zusätzlich <strong>bringt jeder Spin garantiert mindestens einen Geigenkoffer</strong> – so landet in jedem Spin des Features mindestens eine volle Walze Wilds.',
		],
		symbols: {
			H1: 'Siegelring',
			H2: 'Skyline',
			H3: 'Aktenkoffer',
			H4: 'Whiskey & Zigarre',
			H5: 'Schwarze Limousine',
			L1: 'Pik',
			L2: 'Herz',
			L3: 'Karo',
			L4: 'Kreuz',
			W: 'Wild',
			S: 'Tresortür – Scatter',
			SW: 'Der Geigenkoffer',
		},
		ptSpecial: 'Zahlt nicht allein – füllt seine ganze Walze mit Wilds. Scatter auf dieser Walze werden nicht ersetzt.',
		ptFoot: (mw) =>
			`Das Wild ersetzt alle Symbole außer dem Scatter und dem Geigenkoffer und zahlt als eigenes Symbol. Pro Linie wird nur der höchste Gewinn ausgezahlt. Der Maximalgewinn ist auf das ${mw}-Fache des Grundeinsatzes begrenzt.`,
	},
	es: {
		wild: 'El Wild sustituye a todos los símbolos excepto el Scatter y el estuche de violín, y paga como símbolo propio con 5 iguales.',
		caseTitle: 'El estuche de violín',
		case: 'El estuche de violín aparece en los tres carretes centrales en el juego base y en cualquier carrete durante los giros gratis. Cuando cae uno, <strong>todo su carrete se llena de Wilds</strong> antes de evaluar las ganancias. Los Scatters de ese carrete no se sustituyen. El estuche de violín no paga como símbolo propio, y puede caer más de uno en el mismo giro.',
		framesTitle: 'Marcos de bóveda',
		frames: [
			'Los marcos de bóveda caen en la cuadrícula y revelan un multiplicador cuando los carretes se detienen. Un marco cubre <strong>1×1, 2×2 o 3×3 posiciones</strong> y lleva un único valor, cubra las posiciones que cubra. Los valores posibles son de 2× a 10×, 25×, 50× y 100× en una sola posición, de 2× a 10× en un marco de 2×2 y de 2× a 8× en uno de 3×3.',
			'Un marco cuenta para una ganancia cuando un símbolo que cubre forma parte de una línea de pago ganadora, y la ganancia se multiplica por el valor del marco. Un marco más grande cuenta <strong>una vez por cada una de sus posiciones</strong> que cruza la línea ganadora. Si varios marcos participan en la misma ganancia, sus valores <strong>se suman</strong> y se aplica el total.',
		],
		scatter: (n) =>
			`El Scatter de la puerta de la bóveda aparece en los cinco carretes en el juego base y en los carretes 3 a 5 durante los giros gratis. No paga por sí solo y no necesita caer en una línea de pago. El número de Scatters que caen a la vez decide qué función se abre, y cada una otorga ${n} giros gratis:`,
		tiers: [
			'Un marco está en la cuadrícula desde el principio. Todos los marcos son fijos y se quedan hasta que termina la función; entre giros, cada uno se recarga con un nuevo multiplicador.',
			'Tres marcos están en la cuadrícula desde el principio. Los valores de los marcos se mantienen, y todo marco que participa en una ganancia se duplica antes del siguiente giro. Cada marco se duplica como máximo una vez por giro.',
			'Tres marcos están en la cuadrícula desde el principio y se aplica la regla de duplicación de Capo; además, <strong>cada giro tiene garantizado al menos un estuche de violín</strong>, así que en cada giro de la función cae al menos un carrete completo de Wilds.',
		],
		symbols: {
			H1: 'Anillo de sello',
			H2: 'Horizonte urbano',
			H3: 'Maletín',
			H4: 'Whisky y puro',
			H5: 'Sedán negro',
			L1: 'Pica',
			L2: 'Corazón',
			L3: 'Diamante',
			L4: 'Trébol',
			W: 'Wild',
			S: 'Puerta de la bóveda — Scatter',
			SW: 'El estuche de violín',
		},
		ptSpecial: 'No paga por sí solo — llena todo su carrete de Wilds. Los Scatters de ese carrete no se sustituyen.',
		ptFoot: (mw) =>
			`El Wild sustituye a todos los símbolos excepto el Scatter y el estuche de violín, y paga como símbolo propio. Solo se paga la ganancia más alta por línea. La ganancia máxima está limitada a ${mw}× la apuesta base.`,
	},
	fr: {
		wild: 'Le Wild remplace tous les symboles sauf le Scatter et l’étui à violon, et paie comme symbole à part entière pour 5 identiques.',
		caseTitle: 'L’étui à violon',
		case: 'L’étui à violon apparaît sur les trois rouleaux centraux dans le jeu de base, et sur n’importe quel rouleau pendant les tours gratuits. Quand il tombe, <strong>tout son rouleau se remplit de Wilds</strong> avant l’évaluation des gains. Les Scatters de ce rouleau ne sont pas remplacés. L’étui à violon ne paie pas comme symbole à part entière, et plusieurs peuvent tomber au même tour.',
		framesTitle: 'Cadres du coffre',
		frames: [
			'Les cadres du coffre tombent sur la grille et révèlent un multiplicateur à l’arrêt des rouleaux. Un cadre couvre <strong>1×1, 2×2 ou 3×3 positions</strong> et porte une seule valeur, quel que soit le nombre de positions couvertes. Les valeurs possibles sont de 2× à 10×, 25×, 50× et 100× sur une seule position, de 2× à 10× sur un cadre 2×2 et de 2× à 8× sur un cadre 3×3.',
			'Un cadre compte pour un gain lorsqu’un symbole qu’il couvre fait partie d’une ligne de paiement gagnante, et le gain est multiplié par la valeur du cadre. Un cadre plus grand compte <strong>une fois pour chacune de ses positions</strong> traversées par la ligne gagnante. Lorsque plusieurs cadres participent au même gain, leurs valeurs <strong>s’additionnent</strong> et le total s’applique.',
		],
		scatter: (n) =>
			`Le Scatter porte du coffre apparaît sur les cinq rouleaux dans le jeu de base, et sur les rouleaux 3 à 5 pendant les tours gratuits. Il ne paie pas seul et n’a pas besoin de tomber sur une ligne de paiement. Le nombre de Scatters tombés ensemble détermine la fonction qui s’ouvre, et chacune donne ${n} tours gratuits :`,
		tiers: [
			'Un cadre est sur la grille dès le départ. Tous les cadres sont collants et restent jusqu’à la fin de la fonction ; entre deux tours, chacun reçoit un nouveau multiplicateur.',
			'Trois cadres sont sur la grille dès le départ. Les valeurs des cadres sont conservées, et tout cadre qui participe à un gain double avant le tour suivant. Chaque cadre double au plus une fois par tour.',
			'Trois cadres sont sur la grille dès le départ et la règle de doublement de Capo s’applique ; de plus, <strong>chaque tour garantit au moins un étui à violon</strong> — au moins un rouleau entier de Wilds tombe donc à chaque tour de la fonction.',
		],
		symbols: {
			H1: 'Chevalière',
			H2: 'Skyline',
			H3: 'Mallette',
			H4: 'Whisky et cigare',
			H5: 'Berline noire',
			L1: 'Pique',
			L2: 'Cœur',
			L3: 'Carreau',
			L4: 'Trèfle',
			W: 'Wild',
			S: 'Porte du coffre — Scatter',
			SW: 'L’étui à violon',
		},
		ptSpecial: 'Ne paie pas seul — remplit tout son rouleau de Wilds. Les Scatters de ce rouleau ne sont pas remplacés.',
		ptFoot: (mw) =>
			`Le Wild remplace tous les symboles sauf le Scatter et l’étui à violon, et paie comme symbole à part entière. Seul le gain le plus élevé est payé par ligne. Le gain maximal est plafonné à ${mw}× la mise de base.`,
	},
	pt: {
		wild: 'O Wild substitui todos os símbolos, exceto o Scatter e o estojo de violino, e paga como símbolo próprio com 5 iguais.',
		caseTitle: 'O estojo de violino',
		case: 'O estojo de violino aparece nos três rolos centrais no jogo base e em qualquer rolo durante as rodadas grátis. Quando um cai, <strong>todo o seu rolo é preenchido com Wilds</strong> antes de os ganhos serem avaliados. Os Scatters desse rolo não são substituídos. O estojo de violino não paga como símbolo próprio, e mais de um pode cair na mesma rodada.',
		framesTitle: 'Molduras do cofre',
		frames: [
			'As molduras do cofre caem na grade e revelam um multiplicador quando os rolos param. Uma moldura cobre <strong>1×1, 2×2 ou 3×3 posições</strong> e leva um único valor, não importa quantas posições cubra. Os valores possíveis são de 2× a 10×, 25×, 50× e 100× em uma única posição, de 2× a 10× em uma moldura 2×2 e de 2× a 8× em uma moldura 3×3.',
			'Uma moldura conta para um ganho quando um símbolo que ela cobre faz parte de uma linha de pagamento vencedora, e o ganho é multiplicado pelo valor da moldura. Uma moldura maior conta <strong>uma vez para cada uma de suas posições</strong> que a linha vencedora cruza. Quando mais de uma moldura participa do mesmo ganho, seus valores são <strong>somados</strong> e o total é aplicado.',
		],
		scatter: (n) =>
			`O Scatter da porta do cofre aparece nos cinco rolos no jogo base e nos rolos 3 a 5 durante as rodadas grátis. Ele não paga sozinho e não precisa cair em uma linha de pagamento. O número de Scatters que caem juntos decide qual recurso abre, e cada um concede ${n} rodadas grátis:`,
		tiers: [
			'Uma moldura está na grade desde o início. Todas as molduras são fixas e ficam até o fim do recurso; entre as rodadas, cada uma recebe um novo multiplicador.',
			'Três molduras estão na grade desde o início. Os valores das molduras são mantidos, e toda moldura que participa de um ganho dobra antes da próxima rodada. Cada moldura dobra no máximo uma vez por rodada.',
			'Três molduras estão na grade desde o início e vale a regra de dobrar do Capo; além disso, <strong>toda rodada tem garantido pelo menos um estojo de violino</strong> — então pelo menos um rolo inteiro de Wilds cai em cada rodada do recurso.',
		],
		symbols: {
			H1: 'Anel de sinete',
			H2: 'Horizonte da cidade',
			H3: 'Maleta',
			H4: 'Uísque e charuto',
			H5: 'Sedã preto',
			L1: 'Espadas',
			L2: 'Copas',
			L3: 'Ouros',
			L4: 'Paus',
			W: 'Wild',
			S: 'Porta do cofre — Scatter',
			SW: 'O estojo de violino',
		},
		ptSpecial: 'Não paga sozinho — preenche todo o seu rolo com Wilds. Os Scatters desse rolo não são substituídos.',
		ptFoot: (mw) =>
			`O Wild substitui todos os símbolos, exceto o Scatter e o estojo de violino, e paga como símbolo próprio. Só o maior ganho é pago por linha. O ganho máximo é limitado a ${mw}× a aposta base.`,
	},
	pl: {
		wild: 'Wild zastępuje każdy symbol oprócz Scattera i futerału na skrzypce, a przy 5 jednakowych płaci jako osobny symbol.',
		caseTitle: 'Futerał na skrzypce',
		case: 'Futerał na skrzypce pojawia się w grze podstawowej na trzech środkowych bębnach, a podczas darmowych obrotów na dowolnym bębnie. Gdy wyląduje, <strong>cały jego bęben wypełnia się symbolami Wild</strong>, zanim wygrane zostaną ocenione. Symbole Scatter na tym bębnie nie są zastępowane. Futerał na skrzypce nie płaci jako osobny symbol, a w jednym obrocie może wylądować więcej niż jeden.',
		framesTitle: 'Ramy skarbca',
		frames: [
			'Ramy skarbca lądują na siatce i odsłaniają mnożnik, gdy bębny się zatrzymają. Rama zajmuje <strong>1×1, 2×2 lub 3×3 pola</strong> i ma jedną wartość bez względu na liczbę zajmowanych pól. Możliwe wartości to od 2× do 10×, 25×, 50× i 100× na pojedynczym polu, od 2× do 10× na ramie 2×2 i od 2× do 8× na ramie 3×3.',
			'Rama liczy się do wygranej, gdy zakryty przez nią symbol należy do wygrywającej linii, a wygrana jest mnożona przez wartość ramy. Większa rama liczy się <strong>raz za każde swoje pole</strong>, przez które przechodzi wygrywająca linia. Gdy w tej samej wygranej bierze udział kilka ram, ich wartości są <strong>sumowane</strong> i stosowana jest suma.',
		],
		scatter: (n) =>
			`Scatter drzwi skarbca pojawia się w grze podstawowej na wszystkich pięciu bębnach, a podczas darmowych obrotów na bębnach od 3 do 5. Nie płaci samodzielnie i nie musi wylądować na linii wygrywającej. Liczba symboli Scatter, które wylądują jednocześnie, decyduje o tym, która funkcja się otworzy, a każda przyznaje ${n} darmowych obrotów:`,
		tiers: [
			'Od początku na siatce jest jedna rama. Wszystkie ramy są lepkie i zostają do końca funkcji; między obrotami każda otrzymuje nowy mnożnik.',
			'Od początku na siatce są trzy ramy. Wartości ram zostają zachowane, a każda rama biorąca udział w wygranej podwaja się przed następnym obrotem. Każda rama podwaja się najwyżej raz na obrót.',
			'Od początku na siatce są trzy ramy i obowiązuje zasada podwajania z Capo, a dodatkowo <strong>każdy obrót ma gwarantowany co najmniej jeden futerał na skrzypce</strong> — więc w każdym obrocie funkcji ląduje co najmniej jeden pełny bęben symboli Wild.',
		],
		symbols: {
			H1: 'Sygnet',
			H2: 'Panorama miasta',
			H3: 'Aktówka',
			H4: 'Whisky i cygaro',
			H5: 'Czarny sedan',
			L1: 'Pik',
			L2: 'Kier',
			L3: 'Karo',
			L4: 'Trefl',
			W: 'Wild',
			S: 'Drzwi skarbca — Scatter',
			SW: 'Futerał na skrzypce',
		},
		ptSpecial: 'Nie płaci samodzielnie — wypełnia cały swój bęben symbolami Wild. Symbole Scatter na tym bębnie nie są zastępowane.',
		ptFoot: (mw) =>
			`Wild zastępuje wszystkie symbole oprócz Scattera i futerału na skrzypce i płaci jako osobny symbol. Na każdej linii wypłacana jest tylko najwyższa wygrana. Maksymalna wygrana jest ograniczona do ${mw}× zakładu podstawowego.`,
	},
	ru: {
		wild: 'Wild заменяет любой символ, кроме Scatter и футляра скрипки, и при 5 одинаковых оплачивается как отдельный символ.',
		caseTitle: 'Футляр скрипки',
		case: 'Футляр скрипки выпадает на трёх средних барабанах в основной игре и на любом барабане во время бесплатных вращений. Когда он выпадает, <strong>весь его барабан заполняется символами Wild</strong> до подсчёта выигрышей. Символы Scatter на этом барабане не заменяются. Футляр скрипки не оплачивается как отдельный символ, и за одно вращение их может выпасть несколько.',
		framesTitle: 'Рамки сейфа',
		frames: [
			'Рамки сейфа появляются на поле и открывают множитель, когда барабаны останавливаются. Рамка занимает <strong>1×1, 2×2 или 3×3 позиции</strong> и несёт одно значение, сколько бы позиций она ни занимала. Возможные значения: от 2× до 10×, 25×, 50× и 100× на одной позиции, от 2× до 10× на рамке 2×2 и от 2× до 8× на рамке 3×3.',
			'Рамка учитывается в выигрыше, если закрытый ею символ входит в выигрышную линию выплат, и выигрыш умножается на значение рамки. Большая рамка учитывается <strong>один раз за каждую свою позицию</strong>, через которую проходит выигрышная линия. Если в одном выигрыше участвуют несколько рамок, их значения <strong>складываются</strong> и применяется сумма.',
		],
		scatter: (n) =>
			`Scatter «Дверь сейфа» выпадает на всех пяти барабанах в основной игре и на барабанах 3–5 во время бесплатных вращений. Он не оплачивается сам по себе и не обязан выпадать на линии выплат. Число одновременно выпавших Scatter определяет, какая функция откроется, и каждая даёт ${n} бесплатных вращений:`,
		tiers: [
			'С самого начала на поле одна рамка. Все рамки липкие и остаются до конца функции; между вращениями каждая получает новый множитель.',
			'С самого начала на поле три рамки. Значения рамок сохраняются, и любая рамка, участвующая в выигрыше, удваивается перед следующим вращением. Каждая рамка удваивается не более одного раза за вращение.',
			'С самого начала на поле три рамки, действует правило удвоения из Capo, а кроме того, <strong>в каждом вращении гарантирован хотя бы один футляр скрипки</strong> — поэтому в каждом вращении функции выпадает хотя бы один полный барабан символов Wild.',
		],
		symbols: {
			H1: 'Перстень',
			H2: 'Городские небоскрёбы',
			H3: 'Портфель',
			H4: 'Виски и сигара',
			H5: 'Чёрный седан',
			L1: 'Пики',
			L2: 'Червы',
			L3: 'Бубны',
			L4: 'Трефы',
			W: 'Wild',
			S: 'Дверь сейфа — Scatter',
			SW: 'Футляр скрипки',
		},
		ptSpecial: 'Не оплачивается сам по себе — заполняет весь свой барабан символами Wild. Символы Scatter на этом барабане не заменяются.',
		ptFoot: (mw) =>
			`Wild заменяет все символы, кроме Scatter и футляра скрипки, и оплачивается как отдельный символ. На каждой линии выплачивается только наибольший выигрыш. Максимальный выигрыш ограничен ${mw}× базовой ставки.`,
	},
	tr: {
		wild: 'Wild, Scatter ve Keman Kutusu dışındaki tüm sembollerin yerine geçer ve 5’li eşleşmede kendi sembolü olarak öder.',
		caseTitle: 'Keman Kutusu',
		case: 'Keman Kutusu ana oyunda ortadaki üç makarada, ücretsiz dönüşlerde ise her makarada çıkar. Biri geldiğinde, kazançlar değerlendirilmeden önce <strong>tüm makarası Wild ile dolar</strong>. O makaradaki Scatter’lar değiştirilmez. Keman Kutusu kendi başına bir sembol olarak ödeme yapmaz ve aynı dönüşte birden fazla gelebilir.',
		framesTitle: 'Kasa Çerçeveleri',
		frames: [
			'Kasa Çerçeveleri ızgaraya düşer ve makaralar durduğunda bir çarpan gösterir. Bir çerçeve <strong>1×1, 2×2 veya 3×3 konumu</strong> kaplar ve kaç konumu kaplarsa kaplasın tek bir değer taşır. Olası değerler tek bir konumda 2× ile 10×, 25×, 50× ve 100×; 2×2 çerçevede 2× ile 10×; 3×3 çerçevede 2× ile 8× arasıdır.',
			'Bir çerçeve, kapladığı bir sembol kazanan bir ödeme çizgisinin parçası olduğunda kazanca dahil olur ve kazanç çerçevenin değeriyle çarpılır. Büyük bir çerçeve, kazanan çizginin geçtiği <strong>her konumu için bir kez</strong> sayılır. Aynı kazanca birden fazla çerçeve katılırsa değerleri <strong>toplanır</strong> ve toplam uygulanır.',
		],
		scatter: (n) =>
			`Kasa Kapısı Scatter’ı ana oyunda beş makaranın hepsinde, ücretsiz dönüşlerde ise 3–5. makaralarda çıkar. Tek başına ödeme yapmaz ve bir ödeme çizgisine düşmesi gerekmez. Birlikte gelen Scatter sayısı hangi özelliğin açılacağını belirler ve her biri ${n} ücretsiz dönüş verir:`,
		tiers: [
			'Başlangıçta ızgarada bir çerçeve vardır. Tüm çerçeveler yapışkandır ve özellik bitene kadar kalır; dönüşler arasında her birine yeni bir çarpan gelir.',
			'Başlangıçta ızgarada üç çerçeve vardır. Çerçeve değerleri korunur ve bir kazanca katılan her çerçeve bir sonraki dönüşten önce ikiye katlanır. Her çerçeve dönüş başına en fazla bir kez katlanır.',
			'Başlangıçta ızgarada üç çerçeve vardır ve Capo’nun ikiye katlama kuralı geçerlidir; ayrıca <strong>her dönüşte en az bir Keman Kutusu garantidir</strong> — böylece özelliğin her dönüşünde en az bir tam Wild makarası gelir.',
		],
		symbols: {
			H1: 'Mühür Yüzük',
			H2: 'Şehir Silueti',
			H3: 'Evrak Çantası',
			H4: 'Viski ve Puro',
			H5: 'Siyah Sedan',
			L1: 'Maça',
			L2: 'Kupa',
			L3: 'Karo',
			L4: 'Sinek',
			W: 'Wild',
			S: 'Kasa Kapısı — Scatter',
			SW: 'Keman Kutusu',
		},
		ptSpecial: 'Tek başına ödeme yapmaz — tüm makarasını Wild ile doldurur. O makaradaki Scatter’lar değiştirilmez.',
		ptFoot: (mw) =>
			`Wild, Scatter ve Keman Kutusu dışındaki tüm sembollerin yerine geçer ve kendi sembolü olarak öder. Her çizgide yalnızca en yüksek kazanç ödenir. Maksimum kazanç temel bahsin ${mw} katıyla sınırlıdır.`,
	},
	fi: {
		wild: 'Wild korvaa kaikki symbolit paitsi Scatterin ja viulukotelon, ja se maksaa omana symbolinaan viiden samanlaisen yhdistelmästä.',
		caseTitle: 'Viulukotelo',
		case: 'Viulukotelo ilmestyy peruspelissä kolmelle keskimmäiselle rullalle ja ilmaiskierroksilla mille tahansa rullalle. Kun sellainen osuu, <strong>koko sen rulla täyttyy Wildeillä</strong> ennen voittojen laskemista. Rullan Scattereita ei korvata. Viulukotelo ei maksa omana symbolinaan, ja samalla kierroksella voi osua useampi.',
		framesTitle: 'Holvikehykset',
		frames: [
			'Holvikehykset osuvat ruudukkoon ja paljastavat kertoimen, kun rullat pysähtyvät. Kehys peittää <strong>1×1, 2×2 tai 3×3 ruutua</strong> ja sillä on yksi arvo riippumatta siitä, montako ruutua se peittää. Mahdolliset arvot ovat yksittäisessä ruudussa 2×–10×, 25×, 50× ja 100×, 2×2-kehyksessä 2×–10× ja 3×3-kehyksessä 2×–8×.',
			'Kehys lasketaan mukaan voittoon, kun sen peittämä symboli kuuluu voittavaan voittolinjaan, ja voitto kerrotaan kehyksen arvolla. Suurempi kehys lasketaan <strong>kerran jokaista ruutuaan kohden</strong>, jonka voittava linja ylittää. Jos samaan voittoon osallistuu useampi kehys, niiden arvot <strong>lasketaan yhteen</strong> ja summaa käytetään.',
		],
		scatter: (n) =>
			`Holvin oven Scatter ilmestyy peruspelissä kaikille viidelle rullalle ja ilmaiskierroksilla rullille 3–5. Se ei maksa yksinään eikä sen tarvitse osua voittolinjalle. Yhtä aikaa osuvien Scatterien määrä ratkaisee, mikä ominaisuus avautuu, ja kukin antaa ${n} ilmaiskierrosta:`,
		tiers: [
			'Ruudukossa on alusta alkaen yksi kehys. Kaikki kehykset ovat tahmeita ja pysyvät ominaisuuden loppuun asti; kierrosten välillä kukin saa uuden kertoimen.',
			'Ruudukossa on alusta alkaen kolme kehystä. Kehysten arvot säilyvät, ja jokainen voittoon osallistuva kehys tuplaantuu ennen seuraavaa kierrosta. Kukin kehys tuplaantuu enintään kerran kierroksessa.',
			'Ruudukossa on alusta alkaen kolme kehystä ja Capon tuplaussääntö on voimassa, ja lisäksi <strong>jokaisella kierroksella on taattu vähintään yksi viulukotelo</strong> — joten ominaisuuden jokaisella kierroksella osuu vähintään yksi täysi rulla Wildejä.',
		],
		symbols: {
			H1: 'Sinettisormus',
			H2: 'Kaupungin siluetti',
			H3: 'Salkku',
			H4: 'Viski ja sikari',
			H5: 'Musta sedan',
			L1: 'Pata',
			L2: 'Hertta',
			L3: 'Ruutu',
			L4: 'Risti',
			W: 'Wild',
			S: 'Holvin ovi — Scatter',
			SW: 'Viulukotelo',
		},
		ptSpecial: 'Ei maksa yksinään — täyttää koko rullansa Wildeillä. Rullan Scattereita ei korvata.',
		ptFoot: (mw) =>
			`Wild korvaa kaikki symbolit paitsi Scatterin ja viulukotelon, ja se maksaa omana symbolinaan. Kultakin linjalta maksetaan vain suurin voitto. Maksimivoitto on rajattu ${mw}-kertaiseen peruspanokseen.`,
	},
	id: {
		wild: 'Wild menggantikan semua simbol kecuali Scatter dan Koper Biola, dan membayar sebagai simbolnya sendiri untuk 5 yang sama.',
		caseTitle: 'Koper Biola',
		case: 'Koper Biola muncul di tiga gulungan tengah pada permainan dasar, dan di gulungan mana pun selama putaran gratis. Saat satu mendarat, <strong>seluruh gulungannya terisi Wild</strong> sebelum kemenangan dihitung. Scatter di gulungan itu tidak diganti. Koper Biola tidak membayar sebagai simbolnya sendiri, dan lebih dari satu dapat mendarat dalam putaran yang sama.',
		framesTitle: 'Bingkai Brankas',
		frames: [
			'Bingkai Brankas mendarat di kisi dan menampilkan pengganda saat gulungan berhenti. Satu bingkai menutupi <strong>1×1, 2×2 atau 3×3 posisi</strong> dan membawa satu nilai, berapa pun posisi yang ditutupinya. Nilai yang mungkin adalah 2× hingga 10×, 25×, 50× dan 100× pada satu posisi, 2× hingga 10× pada bingkai 2×2, dan 2× hingga 8× pada bingkai 3×3.',
			'Bingkai dihitung untuk kemenangan saat simbol yang ditutupinya menjadi bagian dari garis pembayaran yang menang, dan kemenangan dikalikan dengan nilai bingkai. Bingkai yang lebih besar dihitung <strong>sekali untuk setiap posisinya</strong> yang dilintasi garis pemenang. Jika lebih dari satu bingkai ikut dalam kemenangan yang sama, nilainya <strong>dijumlahkan</strong> dan totalnya diterapkan.',
		],
		scatter: (n) =>
			`Scatter Pintu Brankas muncul di kelima gulungan pada permainan dasar, dan di gulungan 3 sampai 5 selama putaran gratis. Scatter tidak membayar sendiri dan tidak perlu mendarat di garis pembayaran. Jumlah Scatter yang mendarat bersamaan menentukan fitur mana yang terbuka, dan masing-masing memberi ${n} putaran gratis:`,
		tiers: [
			'Satu bingkai sudah ada di kisi sejak awal. Semua bingkai lengket dan bertahan sampai fitur berakhir; di antara putaran, masing-masing diisi ulang dengan pengganda baru.',
			'Tiga bingkai sudah ada di kisi sejak awal. Nilai bingkai tetap, dan setiap bingkai yang ikut dalam kemenangan menjadi dua kali lipat sebelum putaran berikutnya. Setiap bingkai paling banyak berlipat sekali per putaran.',
			'Tiga bingkai sudah ada di kisi sejak awal dan aturan pelipatan Capo berlaku, ditambah <strong>setiap putaran dijamin mendapat setidaknya satu Koper Biola</strong> — jadi setidaknya satu gulungan penuh Wild mendarat di setiap putaran fitur.',
		],
		symbols: {
			H1: 'Cincin Stempel',
			H2: 'Siluet Kota',
			H3: 'Koper Kerja',
			H4: 'Wiski & Cerutu',
			H5: 'Sedan Hitam',
			L1: 'Sekop',
			L2: 'Hati',
			L3: 'Wajik',
			L4: 'Keriting',
			W: 'Wild',
			S: 'Pintu Brankas — Scatter',
			SW: 'Koper Biola',
		},
		ptSpecial: 'Tidak membayar sendiri — mengisi seluruh gulungannya dengan Wild. Scatter di gulungan itu tidak diganti.',
		ptFoot: (mw) =>
			`Wild menggantikan semua simbol kecuali Scatter dan Koper Biola, dan membayar sebagai simbolnya sendiri. Hanya kemenangan tertinggi yang dibayar per garis. Kemenangan maksimum dibatasi ${mw}× taruhan dasar.`,
	},
	vi: {
		wild: 'Wild thay thế mọi biểu tượng trừ Scatter và Hộp đàn violin, và trả thưởng như biểu tượng riêng khi có 5 biểu tượng giống nhau.',
		caseTitle: 'Hộp đàn violin',
		case: 'Hộp đàn violin xuất hiện ở ba cuộn giữa trong trò chơi chính và ở bất kỳ cuộn nào trong vòng quay miễn phí. Khi một hộp xuất hiện, <strong>toàn bộ cuộn của nó được lấp đầy bằng Wild</strong> trước khi tính thắng. Scatter trên cuộn đó không bị thay thế. Hộp đàn violin không trả thưởng như một biểu tượng riêng, và có thể có nhiều hộp trong cùng một lượt quay.',
		framesTitle: 'Khung két sắt',
		frames: [
			'Khung két sắt xuất hiện trên lưới và hiện một hệ số nhân khi các cuộn dừng lại. Một khung phủ <strong>1×1, 2×2 hoặc 3×3 ô</strong> và mang một giá trị duy nhất dù phủ bao nhiêu ô. Các giá trị có thể là 2× đến 10×, 25×, 50× và 100× trên một ô, 2× đến 10× trên khung 2×2 và 2× đến 8× trên khung 3×3.',
			'Một khung được tính vào khoản thắng khi biểu tượng mà nó phủ thuộc về một dòng thanh toán thắng, và khoản thắng được nhân với giá trị của khung. Khung lớn hơn được tính <strong>một lần cho mỗi ô của nó</strong> mà dòng thắng đi qua. Khi nhiều khung cùng tham gia một khoản thắng, giá trị của chúng được <strong>cộng lại</strong> và tổng được áp dụng.',
		],
		scatter: (n) =>
			`Scatter Cửa két sắt xuất hiện trên cả năm cuộn trong trò chơi chính và trên các cuộn 3 đến 5 trong vòng quay miễn phí. Nó không tự trả thưởng và không cần nằm trên dòng thanh toán. Số Scatter cùng xuất hiện quyết định tính năng nào được mở, và mỗi tính năng cho ${n} vòng quay miễn phí:`,
		tiers: [
			'Một khung có sẵn trên lưới ngay từ đầu. Mọi khung đều cố định và ở lại đến hết tính năng; giữa các lượt quay, mỗi khung được nạp hệ số nhân mới.',
			'Ba khung có sẵn trên lưới ngay từ đầu. Giá trị khung được giữ nguyên, và khung nào tham gia một khoản thắng sẽ nhân đôi trước lượt quay tiếp theo. Mỗi khung nhân đôi tối đa một lần mỗi lượt.',
			'Ba khung có sẵn trên lưới ngay từ đầu và áp dụng quy tắc nhân đôi của Capo, thêm vào đó <strong>mỗi lượt quay được bảo đảm ít nhất một Hộp đàn violin</strong> — nên mỗi lượt của tính năng đều có ít nhất một cuộn Wild đầy đủ.',
		],
		symbols: {
			H1: 'Nhẫn ấn',
			H2: 'Đường chân trời thành phố',
			H3: 'Cặp tài liệu',
			H4: 'Whisky & xì gà',
			H5: 'Xe sedan đen',
			L1: 'Bích',
			L2: 'Cơ',
			L3: 'Rô',
			L4: 'Chuồn',
			W: 'Wild',
			S: 'Cửa két sắt — Scatter',
			SW: 'Hộp đàn violin',
		},
		ptSpecial: 'Không tự trả thưởng — lấp đầy toàn bộ cuộn của nó bằng Wild. Scatter trên cuộn đó không bị thay thế.',
		ptFoot: (mw) =>
			`Wild thay thế mọi biểu tượng trừ Scatter và Hộp đàn violin, và trả thưởng như biểu tượng riêng. Mỗi dòng chỉ trả khoản thắng cao nhất. Thắng tối đa được giới hạn ở ${mw}× mức cược cơ bản.`,
	},
	ja: {
		wild: 'ワイルドはスキャッターとバイオリンケース以外のすべてのシンボルの代わりになり、5個揃うと独自のシンボルとして配当します。',
		caseTitle: 'バイオリンケース',
		case: 'バイオリンケースはベースゲームでは中央の3リールに、フリースピン中はどのリールにも出現します。出現すると、配当の判定前に<strong>そのリール全体がワイルドで埋まります</strong>。そのリールのスキャッターは置き換えられません。バイオリンケース自体には配当がなく、同じスピンで複数出現することもあります。',
		framesTitle: 'ヴォルトフレーム',
		frames: [
			'ヴォルトフレームはグリッドに出現し、リールが止まると倍率が明らかになります。フレームは<strong>1×1・2×2・3×3マス</strong>を覆い、覆うマスの数にかかわらず倍率は1つです。倍率は1マスで2×～10×、25×、50×、100×、2×2フレームで2×～10×、3×3フレームで2×～8×です。',
			'フレームが覆うシンボルが当たりペイラインに含まれると、そのフレームが配当に加わり、配当にフレームの倍率が掛かります。大きいフレームは、当たりラインが通過した<strong>マスごとに1回</strong>カウントされます。同じ当たりに複数のフレームが関わる場合、倍率は<strong>合算</strong>され、その合計が適用されます。',
		],
		scatter: (n) =>
			`金庫の扉のスキャッターはベースゲームでは5本すべてのリールに、フリースピン中はリール3～5に出現します。スキャッター単独では配当がなく、ペイライン上に止まる必要もありません。同時に出現したスキャッターの数で開始するフィーチャーが決まり、どれもフリースピン${n}回です：`,
		tiers: [
			'開始時からフレームが1つあります。すべてのフレームは固定され、フィーチャー終了まで残ります。スピンごとに新しい倍率に入れ替わります。',
			'開始時からフレームが3つあります。フレームの倍率は保持され、当たりに関わったフレームは次のスピン前に2倍になります。各フレームが2倍になるのは1スピンにつき1回までです。',
			'開始時からフレームが3つあり、Capoの倍増ルールが適用されます。さらに<strong>毎スピン、バイオリンケースが少なくとも1つ確定</strong>するため、フィーチャー中の毎スピンで少なくとも1本のリールがワイルドで埋まります。',
		],
		symbols: {
			H1: '印章指輪',
			H2: '摩天楼',
			H3: 'ブリーフケース',
			H4: 'ウイスキーと葉巻',
			H5: '黒いセダン',
			L1: 'スペード',
			L2: 'ハート',
			L3: 'ダイヤ',
			L4: 'クラブ',
			W: 'ワイルド',
			S: '金庫の扉 — スキャッター',
			SW: 'バイオリンケース',
		},
		ptSpecial: '単独では配当なし — そのリール全体をワイルドで埋めます。そのリールのスキャッターは置き換えられません。',
		ptFoot: (mw) =>
			`ワイルドはスキャッターとバイオリンケース以外のすべてのシンボルの代わりになり、独自のシンボルとしても配当します。各ラインでは最も高い当たりのみが支払われます。最大配当はベースベットの${mw}倍が上限です。`,
	},
	ko: {
		wild: '와일드는 스캐터와 바이올린 케이스를 제외한 모든 심볼을 대체하며, 5개 일치 시 자체 심볼로 지급됩니다.',
		caseTitle: '바이올린 케이스',
		case: '바이올린 케이스는 기본 게임에서는 가운데 세 릴에, 프리 스핀 중에는 모든 릴에 등장합니다. 하나가 나오면 당첨을 판정하기 전에 <strong>해당 릴 전체가 와일드로 채워집니다</strong>. 그 릴의 스캐터는 대체되지 않습니다. 바이올린 케이스 자체는 지급되지 않으며, 한 스핀에 여러 개가 나올 수 있습니다.',
		framesTitle: '금고 프레임',
		frames: [
			'금고 프레임은 그리드에 떨어지고 릴이 멈추면 배수를 공개합니다. 프레임은 <strong>1×1, 2×2 또는 3×3칸</strong>을 덮으며, 덮는 칸 수와 관계없이 하나의 값을 가집니다. 가능한 값은 한 칸에서 2×~10×, 25×, 50×, 100×, 2×2 프레임에서 2×~10×, 3×3 프레임에서 2×~8×입니다.',
			'프레임이 덮은 심볼이 당첨 페이라인에 포함되면 프레임이 당첨에 적용되어 당첨금에 프레임 값이 곱해집니다. 큰 프레임은 당첨 라인이 지나가는 <strong>칸마다 한 번씩</strong> 계산됩니다. 같은 당첨에 여러 프레임이 관여하면 값이 <strong>합산</strong>되어 그 합계가 적용됩니다.',
		],
		scatter: (n) =>
			`금고 문 스캐터는 기본 게임에서는 다섯 릴 모두에, 프리 스핀 중에는 3~5번 릴에 등장합니다. 스캐터 단독으로는 지급되지 않으며 페이라인 위에 있을 필요가 없습니다. 함께 나온 스캐터 수에 따라 열리는 기능이 정해지며, 각 기능은 프리 스핀 ${n}회를 줍니다:`,
		tiers: [
			'시작부터 그리드에 프레임 1개가 있습니다. 모든 프레임은 고정되어 기능이 끝날 때까지 남으며, 스핀 사이마다 새 배수로 바뀝니다.',
			'시작부터 그리드에 프레임 3개가 있습니다. 프레임 값은 유지되며, 당첨에 관여한 프레임은 다음 스핀 전에 두 배가 됩니다. 각 프레임은 스핀당 최대 한 번만 두 배가 됩니다.',
			'시작부터 그리드에 프레임 3개가 있고 Capo의 두 배 규칙이 적용되며, 추가로 <strong>매 스핀 바이올린 케이스가 최소 1개 보장</strong>됩니다. 따라서 기능의 매 스핀마다 와일드로 가득 찬 릴이 최소 하나 나옵니다.',
		],
		symbols: {
			H1: '인장 반지',
			H2: '도시 스카이라인',
			H3: '서류 가방',
			H4: '위스키와 시가',
			H5: '검은 세단',
			L1: '스페이드',
			L2: '하트',
			L3: '다이아몬드',
			L4: '클럽',
			W: '와일드',
			S: '금고 문 — 스캐터',
			SW: '바이올린 케이스',
		},
		ptSpecial: '단독으로는 지급 없음 — 해당 릴 전체를 와일드로 채웁니다. 그 릴의 스캐터는 대체되지 않습니다.',
		ptFoot: (mw) =>
			`와일드는 스캐터와 바이올린 케이스를 제외한 모든 심볼을 대체하며, 자체 심볼로도 지급됩니다. 각 라인에서는 가장 높은 당첨만 지급됩니다. 최대 당첨은 기본 베팅의 ${mw}배로 제한됩니다.`,
	},
	zh: {
		wild: '百搭可替代分散符號與小提琴盒以外的所有符號，5 個連線時也以自身符號派彩。',
		caseTitle: '小提琴盒',
		case: '小提琴盒在一般遊戲出現在中間三輪，免費遊戲中可出現在任一輪。出現時，會在計算贏分前<strong>把整條輪填滿百搭</strong>。該輪上的分散符號不會被取代。小提琴盒本身不派彩，同一手可出現不只一個。',
		framesTitle: '金庫框',
		frames: [
			'金庫框落在盤面上，輪停下時揭曉倍數。一個框覆蓋 <strong>1×1、2×2 或 3×3 格</strong>，不論覆蓋幾格都只帶一個倍數。單格可能的倍數為 2× 至 10×、25×、50× 與 100×；2×2 框為 2× 至 10×；3×3 框為 2× 至 8×。',
			'框所覆蓋的符號屬於中獎賠付線時，該框計入這筆贏分，贏分乘以框的倍數。較大的框依中獎賠付線經過的<strong>每一格各計一次</strong>。多個框參與同一筆贏分時，倍數<strong>相加</strong>後再套用總和。',
		],
		scatter: (n) =>
			`金庫門分散符號在一般遊戲出現在全部五輪，免費遊戲中出現在第 3 至第 5 輪。分散符號本身不派彩，也不必落在賠付線上。同時出現的分散符號數量決定開啟哪個特色功能，每個都給 ${n} 次免費遊戲：`,
		tiers: [
			'開場時盤面上就有 1 個框。所有框都會固定，留到特色功能結束；每手之間各自換上新的倍數。',
			'開場時盤面上就有 3 個框。框的倍數會保留，參與贏分的框在下一手前加倍。每個框每手最多加倍一次。',
			'開場時盤面上就有 3 個框，並適用 Capo 的加倍規則；此外<strong>每一手保證至少出現一個小提琴盒</strong>——所以特色功能的每一手至少有一整條百搭輪。',
		],
		symbols: {
			H1: '印章戒指',
			H2: '城市天際線',
			H3: '公事包',
			H4: '威士忌與雪茄',
			H5: '黑色轎車',
			L1: '黑桃',
			L2: '紅心',
			L3: '方塊',
			L4: '梅花',
			W: '百搭',
			S: '金庫門 — 分散符號',
			SW: '小提琴盒',
		},
		ptSpecial: '本身不派彩 — 把整條輪填滿百搭。該輪上的分散符號不會被取代。',
		ptFoot: (mw) =>
			`百搭可替代分散符號與小提琴盒以外的所有符號，也以自身符號派彩。每條賠付線只支付最高的一筆贏分。最高贏分上限為基本押注的 ${mw} 倍。`,
	},
	ar: {
		wild: 'يحل رمز Wild محل كل الرموز عدا Scatter وحقيبة الكمان، ويدفع كرمز مستقل عند تطابق 5 رموز.',
		caseTitle: 'حقيبة الكمان',
		case: 'تظهر حقيبة الكمان على البكرات الثلاث الوسطى في اللعبة الأساسية، وعلى أي بكرة أثناء الدورات المجانية. عند ظهورها <strong>تمتلئ بكرتها بالكامل برموز Wild</strong> قبل احتساب أي أرباح. لا تُستبدل رموز Scatter على تلك البكرة. لا تدفع حقيبة الكمان كرمز مستقل، ويمكن أن تظهر أكثر من واحدة في الدورة نفسها.',
		framesTitle: 'إطارات الخزنة',
		frames: [
			'تهبط إطارات الخزنة على الشبكة وتكشف مضاعفًا عند توقف البكرات. يغطي الإطار <strong>1×1 أو 2×2 أو 3×3 مواضع</strong> ويحمل قيمة واحدة مهما كان عدد المواضع التي يغطيها. القيم الممكنة من 2× إلى 10× و25× و50× و100× على موضع واحد، ومن 2× إلى 10× على إطار 2×2، ومن 2× إلى 8× على إطار 3×3.',
			'يُحتسب الإطار في الربح عندما يكون رمز يغطيه جزءًا من خط دفع رابح، ويُضرب الربح في قيمة الإطار. يُحتسب الإطار الأكبر <strong>مرة لكل موضع من مواضعه</strong> يعبره خط الدفع الرابح. وإذا شارك أكثر من إطار في الربح نفسه <strong>تُجمع</strong> قيمها ويُطبَّق المجموع.',
		],
		scatter: (n) =>
			`يظهر رمز Scatter باب الخزنة على البكرات الخمس كلها في اللعبة الأساسية، وعلى البكرات من 3 إلى 5 أثناء الدورات المجانية. لا يدفع بمفرده، ولا يلزم أن يهبط على خط دفع. يحدد عدد رموز Scatter الهابطة معًا أي ميزة تُفتح، وتمنح كل ميزة ${n} دورات مجانية:`,
		tiers: [
			'يوجد إطار واحد على الشبكة منذ البداية. جميع الإطارات ثابتة وتبقى حتى نهاية الميزة؛ وبين الدورات يُعاد ملء كل منها بمضاعف جديد.',
			'توجد ثلاثة إطارات على الشبكة منذ البداية. تبقى قيم الإطارات، وأي إطار يشارك في ربح تتضاعف قيمته قبل الدورة التالية. يتضاعف كل إطار مرة واحدة على الأكثر في كل دورة.',
			'توجد ثلاثة إطارات على الشبكة منذ البداية وتنطبق قاعدة المضاعفة الخاصة بـ Capo، وإضافة إلى ذلك <strong>تضمن كل دورة حقيبة كمان واحدة على الأقل</strong> — لذا تهبط بكرة كاملة من رموز Wild على الأقل في كل دورة من الميزة.',
		],
		symbols: {
			H1: 'خاتم الختم',
			H2: 'أفق المدينة',
			H3: 'الحقيبة',
			H4: 'ويسكي وسيجار',
			H5: 'سيارة سيدان سوداء',
			L1: 'البستوني',
			L2: 'الكبة',
			L3: 'الديناري',
			L4: 'السباتي',
			W: 'Wild',
			S: 'باب الخزنة — Scatter',
			SW: 'حقيبة الكمان',
		},
		ptSpecial: 'لا يدفع بمفرده — يملأ بكرته بالكامل برموز Wild. لا تُستبدل رموز Scatter على تلك البكرة.',
		ptFoot: (mw) =>
			`يحل رمز Wild محل كل الرموز عدا Scatter وحقيبة الكمان، ويدفع كرمز مستقل. يُدفع أعلى ربح فقط في كل خط. أقصى ربح محدد بـ ${mw} ضعف الرهان الأساسي.`,
	},
	hi: {
		wild: 'वाइल्ड स्कैटर और वायलिन केस को छोड़कर हर सिंबल की जगह ले लेता है, और 5 एक जैसे मिलने पर अपने सिंबल के रूप में भुगतान करता है।',
		caseTitle: 'वायलिन केस',
		case: 'वायलिन केस बेस गेम में बीच की तीन रीलों पर और फ्री स्पिन के दौरान किसी भी रील पर आता है। जब कोई आता है, तो जीत की गणना से पहले <strong>उसकी पूरी रील वाइल्ड से भर जाती है</strong>। उस रील के स्कैटर नहीं बदले जाते। वायलिन केस अपने सिंबल के रूप में भुगतान नहीं करता, और एक ही स्पिन में एक से अधिक आ सकते हैं।',
		framesTitle: 'वॉल्ट फ़्रेम',
		frames: [
			'वॉल्ट फ़्रेम ग्रिड पर आते हैं और रीलें रुकने पर एक गुणक दिखाते हैं। एक फ़्रेम <strong>1×1, 2×2 या 3×3 स्थान</strong> घेरता है और चाहे जितने स्थान घेरे, उसका एक ही मान होता है। संभावित मान एक स्थान पर 2× से 10×, 25×, 50× और 100×, 2×2 फ़्रेम पर 2× से 10×, और 3×3 फ़्रेम पर 2× से 8× हैं।',
			'जब फ़्रेम से ढका कोई सिंबल किसी जीतने वाली पेलाइन का हिस्सा होता है, तो फ़्रेम उस जीत में गिना जाता है और जीत फ़्रेम के मान से गुणा होती है। बड़ा फ़्रेम जीतने वाली लाइन द्वारा पार किए गए <strong>अपने हर स्थान के लिए एक बार</strong> गिना जाता है। जब एक ही जीत में एक से अधिक फ़्रेम शामिल हों, तो उनके मान <strong>जोड़े जाते हैं</strong> और कुल लागू होता है।',
		],
		scatter: (n) =>
			`वॉल्ट डोर स्कैटर बेस गेम में पाँचों रीलों पर और फ्री स्पिन के दौरान रील 3 से 5 पर आता है। यह अपने आप भुगतान नहीं करता और इसका पेलाइन पर आना ज़रूरी नहीं है। एक साथ आने वाले स्कैटर की संख्या तय करती है कि कौन-सा फ़ीचर खुलेगा, और हर एक ${n} फ्री स्पिन देता है:`,
		tiers: [
			'शुरुआत से ग्रिड पर एक फ़्रेम होता है। सभी फ़्रेम चिपके रहते हैं और फ़ीचर खत्म होने तक रहते हैं; हर स्पिन के बीच हर एक में नया गुणक भरा जाता है।',
			'शुरुआत से ग्रिड पर तीन फ़्रेम होते हैं। फ़्रेम के मान बने रहते हैं, और जीत में शामिल हर फ़्रेम अगले स्पिन से पहले दोगुना हो जाता है। हर फ़्रेम एक स्पिन में अधिकतम एक बार दोगुना होता है।',
			'शुरुआत से ग्रिड पर तीन फ़्रेम होते हैं और Capo का दोगुना करने का नियम लागू होता है, और इसके अलावा <strong>हर स्पिन में कम से कम एक वायलिन केस की गारंटी है</strong> — इसलिए फ़ीचर के हर स्पिन पर कम से कम एक पूरी रील वाइल्ड से भरी आती है।',
		],
		symbols: {
			H1: 'मुहर वाली अंगूठी',
			H2: 'शहर का क्षितिज',
			H3: 'ब्रीफ़केस',
			H4: 'व्हिस्की और सिगार',
			H5: 'काली सेडान',
			L1: 'हुकुम',
			L2: 'पान',
			L3: 'ईंट',
			L4: 'चिड़ी',
			W: 'वाइल्ड',
			S: 'वॉल्ट डोर — स्कैटर',
			SW: 'वायलिन केस',
		},
		ptSpecial: 'अपने आप भुगतान नहीं करता — अपनी पूरी रील को वाइल्ड से भर देता है। उस रील के स्कैटर नहीं बदले जाते।',
		ptFoot: (mw) =>
			`वाइल्ड स्कैटर और वायलिन केस को छोड़कर सभी सिंबल की जगह ले लेता है, और अपने सिंबल के रूप में भुगतान करता है। हर लाइन पर केवल सबसे बड़ी जीत का भुगतान होता है। अधिकतम जीत बेस दांव के ${mw}× तक सीमित है।`,
	},
};

export const gameRulesText = (lang: RulesLang, T: Terms, social: boolean): GameText =>
	lang === 'en' || social ? english(T) : TEXT[lang];
