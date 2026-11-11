import type { getSocialTerms } from './socialTerms';
import type { RulesLang } from './rulesCommon';

/**
 * Hard Time's own sections of the game rules and pay table, in every locale the UI
 * ships (2026-10-13, P2-C). The shared sections are in game/rulesCommon.ts. Terms
 * follow the intro card (game/i18nText.ts): the Searchlight, Overlapping Beams,
 * feature names (Lockdown, Riot, Breakout) in English. English is built from
 * socialTerms so social play keeps its wording; social play never reads the
 * other languages.
 */

type Terms = ReturnType<typeof getSocialTerms>;

export type SymbolKey = 'H1' | 'H2' | 'H3' | 'H4' | 'H5' | 'L1' | 'L2' | 'L3' | 'L4' | 'W' | 'S' | 'SW';

export type GameText = {
	wild: string;
	lightTitle: string;
	/** HTML */
	light: readonly [string, string];
	beamsTitle: string;
	/** HTML */
	beams: string;
	/** HTML */
	scatter: (freeSpins: number) => string;
	/** Lockdown, Riot, Breakout — HTML */
	tiers: readonly [string, string, string];
	symbols: Record<SymbolKey, string>;
	ptSpecial: string;
	ptFoot: (maxWin: string) => string;
};

const english = (T: Terms): GameText => ({
	wild: `The Wild substitutes for every symbol except the Scatter and the Searchlight, and ${T.pays} as its own symbol on 5 of a kind.`,
	lightTitle: 'Searchlight',
	light: [
		`When a Searchlight lands, it lights its reel <strong>from its own position down to the bottom</strong> — never upward. Every lit position becomes a <strong>Wild</strong> before any wins are evaluated, and carries a multiplier of <strong>1× to 100×</strong>. A Searchlight landing on the top row lights four positions; one landing on the bottom row lights a single position. Scatters in that reel are not replaced. The Searchlight ${T.doesNotPay.toLowerCase()} as a symbol of its own, and more than one can land on the same spin.`,
		`A lit position counts towards a win when it is part of a winning ${T.payline}, and the win is multiplied by its value. Where a ${T.payline} crosses more than one lit position, every multiplier above 1× is <strong>added together</strong> and the total is applied — a 1× position adds nothing.`,
	],
	beamsTitle: 'Overlapping Beams',
	beams: "When a Searchlight lands on a reel that is <strong>already lit</strong>, every position the two beams share has its existing multiplier <strong>doubled</strong>, to a maximum of 100×. Positions the new beam reaches for the first time take the new Searchlight's own value instead.",
	scatter: (n) =>
		`The Scatter appears on all five reels in the base game, and on reels 3 to 5 during free spins. ${T.noPayOnItsOwn}, and does not need to land on a ${T.payline}. The number of Scatters landing together decides which feature opens, and each one awards ${n} free spins. In every feature, <strong>every beam stays lit until the feature ends</strong>, so Searchlights build up across the spins and beams meeting on one reel double where they overlap:`,
	tiers: [
		'The feature opens with the grid dark. Every Searchlight that lands stays lit for the rest of the feature.',
		'The first free spin is guaranteed an extra Searchlight, and Searchlights land more often than in Lockdown.',
		'The first free spin is guaranteed an extra Searchlight, and the feature lands <strong>more Searchlights than any other tier</strong> — so beams meet on the same reel more often, and every overlap doubles.',
	],
	symbols: {
		H1: 'Key Ring',
		H2: 'Handcuffs',
		H3: 'Contraband Tin',
		H4: 'Tin Mug & Spoon',
		H5: 'Tally Patch',
		L1: 'Spade',
		L2: 'Heart',
		L3: 'Diamond',
		L4: 'Club',
		W: 'Prison Cap',
		S: 'Cell Gate — Scatter',
		SW: 'Searchlight',
	},
	ptSpecial: `${T.doesNotPayAlone} — lights its reel from where it lands DOWN to the bottom, turning those positions into Wilds that each carry a multiplier. Scatters in that reel are not replaced.`,
	ptFoot: (maxWin) =>
		`Wild substitutes for all symbols except the Scatter and the Searchlight, and ${T.pays} as its own symbol. Only the highest win is ${T.paid} per line. Max win is capped at ${maxWin}× ${T.baseBet}.`,
});

const TEXT: Record<Exclude<RulesLang, 'en'>, GameText> = {
	de: {
		wild: 'Das Wild ersetzt jedes Symbol außer dem Scatter und dem Suchscheinwerfer und zahlt bei 5 gleichen als eigenes Symbol.',
		lightTitle: 'Der Suchscheinwerfer',
		light: [
			'Landet ein Suchscheinwerfer, beleuchtet er seine Walze <strong>von seiner eigenen Position bis ganz nach unten</strong> – niemals nach oben. Jede beleuchtete Position wird zu einem <strong>Wild</strong>, bevor Gewinne ausgewertet werden, und trägt einen Multiplikator von <strong>1× bis 100×</strong>. Ein Suchscheinwerfer in der obersten Reihe beleuchtet vier Positionen, einer in der untersten Reihe nur eine. Scatter auf dieser Walze werden nicht ersetzt. Der Suchscheinwerfer zahlt nicht als eigenes Symbol, und mehrere können im selben Spin landen.',
			'Eine beleuchtete Position zählt für einen Gewinn, wenn sie Teil einer Gewinnlinie ist, und der Gewinn wird mit ihrem Wert multipliziert. Kreuzt eine Gewinnlinie mehrere beleuchtete Positionen, werden alle Multiplikatoren über 1× <strong>addiert</strong> und die Summe angewendet – eine 1×-Position trägt nichts bei.',
		],
		beamsTitle: 'Überlappende Strahlen',
		beams: 'Landet ein Suchscheinwerfer auf einer Walze, die <strong>bereits beleuchtet</strong> ist, wird der bestehende Multiplikator jeder Position, die sich beide Strahlen teilen, <strong>verdoppelt</strong> – bis höchstens 100×. Positionen, die der neue Strahl zum ersten Mal erreicht, erhalten stattdessen den Wert des neuen Suchscheinwerfers.',
		scatter: (n) =>
			`Der Scatter erscheint im Basisspiel auf allen fünf Walzen und in Freispielen auf den Walzen 3 bis 5. Er zahlt nicht allein und muss nicht auf einer Gewinnlinie landen. Die Zahl der gleichzeitig gelandeten Scatter entscheidet, welches Feature startet, und jedes bringt ${n} Freispiele. In jedem Feature <strong>bleibt jeder Strahl bis zum Ende des Features beleuchtet</strong>, sodass sich Suchscheinwerfer über die Spins ansammeln und Strahlen, die sich auf einer Walze treffen, dort verdoppeln, wo sie überlappen:`,
		tiers: [
			'Das Feature beginnt mit dunklem Raster. Jeder Suchscheinwerfer, der landet, bleibt für den Rest des Features beleuchtet.',
			'Der erste Freispiel-Spin bringt garantiert einen zusätzlichen Suchscheinwerfer, und Suchscheinwerfer landen häufiger als in Lockdown.',
			'Der erste Freispiel-Spin bringt garantiert einen zusätzlichen Suchscheinwerfer, und das Feature bringt <strong>mehr Suchscheinwerfer als jede andere Stufe</strong> – so treffen sich Strahlen häufiger auf derselben Walze, und jede Überlappung verdoppelt.',
		],
		symbols: {
			H1: 'Schlüsselbund',
			H2: 'Handschellen',
			H3: 'Schmuggeldose',
			H4: 'Blechbecher & Löffel',
			H5: 'Strichliste',
			L1: 'Pik',
			L2: 'Herz',
			L3: 'Karo',
			L4: 'Kreuz',
			W: 'Häftlingsmütze',
			S: 'Zellentür – Scatter',
			SW: 'Der Suchscheinwerfer',
		},
		ptSpecial: 'Zahlt nicht allein – beleuchtet seine Walze von der Landeposition NACH UNTEN bis zum Boden und macht diese Positionen zu Wilds mit je einem Multiplikator. Scatter auf dieser Walze werden nicht ersetzt.',
		ptFoot: (mw) =>
			`Das Wild ersetzt alle Symbole außer dem Scatter und dem Suchscheinwerfer und zahlt als eigenes Symbol. Pro Linie wird nur der höchste Gewinn ausgezahlt. Der Maximalgewinn ist auf das ${mw}-Fache des Grundeinsatzes begrenzt.`,
	},
	es: {
		wild: 'El Wild sustituye a todos los símbolos excepto el Scatter y el Reflector, y paga como símbolo propio con 5 iguales.',
		lightTitle: 'El Reflector',
		light: [
			'Cuando cae un Reflector, ilumina su carrete <strong>desde su propia posición hasta abajo</strong>, nunca hacia arriba. Cada posición iluminada se convierte en <strong>Wild</strong> antes de evaluar las ganancias y lleva un multiplicador de <strong>1× a 100×</strong>. Un Reflector en la fila superior ilumina cuatro posiciones; uno en la fila inferior ilumina una sola. Los Scatters de ese carrete no se sustituyen. El Reflector no paga como símbolo propio, y puede caer más de uno en el mismo giro.',
			'Una posición iluminada cuenta para una ganancia cuando forma parte de una línea de pago ganadora, y la ganancia se multiplica por su valor. Cuando una línea de pago cruza varias posiciones iluminadas, todos los multiplicadores superiores a 1× <strong>se suman</strong> y se aplica el total; una posición de 1× no suma nada.',
		],
		beamsTitle: 'Haces superpuestos',
		beams: 'Cuando un Reflector cae en un carrete que <strong>ya está iluminado</strong>, cada posición que comparten los dos haces <strong>duplica</strong> su multiplicador actual, hasta un máximo de 100×. Las posiciones que el nuevo haz alcanza por primera vez toman en su lugar el valor del nuevo Reflector.',
		scatter: (n) =>
			`El Scatter aparece en los cinco carretes en el juego base y en los carretes 3 a 5 durante los giros gratis. No paga por sí solo y no necesita caer en una línea de pago. El número de Scatters que caen a la vez decide qué función se abre, y cada una otorga ${n} giros gratis. En todas las funciones, <strong>cada haz sigue encendido hasta que termina la función</strong>, así que los Reflectores se acumulan giro a giro y los haces que coinciden en un carrete se duplican donde se superponen:`,
		tiers: [
			'La función empieza con la cuadrícula a oscuras. Cada Reflector que cae sigue encendido el resto de la función.',
			'El primer giro gratis tiene garantizado un Reflector extra, y los Reflectores caen con más frecuencia que en Lockdown.',
			'El primer giro gratis tiene garantizado un Reflector extra, y la función trae <strong>más Reflectores que cualquier otro nivel</strong>, así que los haces coinciden más a menudo en el mismo carrete y cada superposición se duplica.',
		],
		symbols: {
			H1: 'Llavero',
			H2: 'Esposas',
			H3: 'Lata de contrabando',
			H4: 'Taza de lata y cuchara',
			H5: 'Parche de conteo',
			L1: 'Pica',
			L2: 'Corazón',
			L3: 'Diamante',
			L4: 'Trébol',
			W: 'Gorra de preso',
			S: 'Puerta de celda — Scatter',
			SW: 'El Reflector',
		},
		ptSpecial: 'No paga por sí solo — ilumina su carrete desde donde cae HACIA ABAJO hasta el fondo y convierte esas posiciones en Wilds que llevan cada uno un multiplicador. Los Scatters de ese carrete no se sustituyen.',
		ptFoot: (mw) =>
			`El Wild sustituye a todos los símbolos excepto el Scatter y el Reflector, y paga como símbolo propio. Solo se paga la ganancia más alta por línea. La ganancia máxima está limitada a ${mw}× la apuesta base.`,
	},
	fr: {
		wild: 'Le Wild remplace tous les symboles sauf le Scatter et le Projecteur, et paie comme symbole à part entière pour 5 identiques.',
		lightTitle: 'Le Projecteur',
		light: [
			'Quand un Projecteur tombe, il éclaire son rouleau <strong>depuis sa propre position jusqu’en bas</strong> — jamais vers le haut. Chaque position éclairée devient un <strong>Wild</strong> avant l’évaluation des gains et porte un multiplicateur de <strong>1× à 100×</strong>. Un Projecteur sur la rangée du haut éclaire quatre positions ; un Projecteur sur la rangée du bas n’en éclaire qu’une. Les Scatters de ce rouleau ne sont pas remplacés. Le Projecteur ne paie pas comme symbole à part entière, et plusieurs peuvent tomber au même tour.',
			'Une position éclairée compte pour un gain lorsqu’elle fait partie d’une ligne de paiement gagnante, et le gain est multiplié par sa valeur. Lorsqu’une ligne de paiement traverse plusieurs positions éclairées, tous les multiplicateurs supérieurs à 1× <strong>s’additionnent</strong> et le total s’applique — une position à 1× n’ajoute rien.',
		],
		beamsTitle: 'Faisceaux croisés',
		beams: 'Quand un Projecteur tombe sur un rouleau <strong>déjà éclairé</strong>, chaque position que partagent les deux faisceaux voit son multiplicateur actuel <strong>doubler</strong>, jusqu’à 100× au maximum. Les positions que le nouveau faisceau atteint pour la première fois prennent à la place la valeur du nouveau Projecteur.',
		scatter: (n) =>
			`Le Scatter apparaît sur les cinq rouleaux dans le jeu de base, et sur les rouleaux 3 à 5 pendant les tours gratuits. Il ne paie pas seul et n’a pas besoin de tomber sur une ligne de paiement. Le nombre de Scatters tombés ensemble détermine la fonction qui s’ouvre, et chacune donne ${n} tours gratuits. Dans chaque fonction, <strong>chaque faisceau reste allumé jusqu’à la fin de la fonction</strong> : les Projecteurs s’accumulent au fil des tours et les faisceaux qui se croisent sur un rouleau doublent là où ils se superposent :`,
		tiers: [
			'La fonction s’ouvre sur une grille sombre. Chaque Projecteur qui tombe reste allumé jusqu’à la fin de la fonction.',
			'Le premier tour gratuit garantit un Projecteur supplémentaire, et les Projecteurs tombent plus souvent que dans Lockdown.',
			'Le premier tour gratuit garantit un Projecteur supplémentaire, et la fonction apporte <strong>plus de Projecteurs que tout autre niveau</strong> — les faisceaux se croisent donc plus souvent sur le même rouleau, et chaque chevauchement double.',
		],
		symbols: {
			H1: 'Trousseau de clés',
			H2: 'Menottes',
			H3: 'Boîte de contrebande',
			H4: 'Gobelet en fer et cuillère',
			H5: 'Écusson de décompte',
			L1: 'Pique',
			L2: 'Cœur',
			L3: 'Carreau',
			L4: 'Trèfle',
			W: 'Casquette de détenu',
			S: 'Porte de cellule — Scatter',
			SW: 'Le Projecteur',
		},
		ptSpecial: 'Ne paie pas seul — éclaire son rouleau depuis l’endroit où il tombe VERS LE BAS jusqu’en bas, et transforme ces positions en Wilds portant chacun un multiplicateur. Les Scatters de ce rouleau ne sont pas remplacés.',
		ptFoot: (mw) =>
			`Le Wild remplace tous les symboles sauf le Scatter et le Projecteur, et paie comme symbole à part entière. Seul le gain le plus élevé est payé par ligne. Le gain maximal est plafonné à ${mw}× la mise de base.`,
	},
	pt: {
		wild: 'O Wild substitui todos os símbolos, exceto o Scatter e o Holofote, e paga como símbolo próprio com 5 iguais.',
		lightTitle: 'O Holofote',
		light: [
			'Quando um Holofote cai, ele ilumina o seu rolo <strong>da própria posição até embaixo</strong> — nunca para cima. Cada posição iluminada vira um <strong>Wild</strong> antes de os ganhos serem avaliados e leva um multiplicador de <strong>1× a 100×</strong>. Um Holofote na fileira de cima ilumina quatro posições; um na fileira de baixo ilumina só uma. Os Scatters desse rolo não são substituídos. O Holofote não paga como símbolo próprio, e mais de um pode cair na mesma rodada.',
			'Uma posição iluminada conta para um ganho quando faz parte de uma linha de pagamento vencedora, e o ganho é multiplicado pelo seu valor. Quando uma linha de pagamento cruza mais de uma posição iluminada, todos os multiplicadores acima de 1× são <strong>somados</strong> e o total é aplicado — uma posição de 1× não acrescenta nada.',
		],
		beamsTitle: 'Feixes sobrepostos',
		beams: 'Quando um Holofote cai em um rolo que <strong>já está iluminado</strong>, cada posição que os dois feixes compartilham tem seu multiplicador atual <strong>dobrado</strong>, até o máximo de 100×. As posições que o novo feixe alcança pela primeira vez recebem o valor do novo Holofote.',
		scatter: (n) =>
			`O Scatter aparece nos cinco rolos no jogo base e nos rolos 3 a 5 durante as rodadas grátis. Ele não paga sozinho e não precisa cair em uma linha de pagamento. O número de Scatters que caem juntos decide qual recurso abre, e cada um concede ${n} rodadas grátis. Em todos os recursos, <strong>cada feixe fica aceso até o fim do recurso</strong>, então os Holofotes se acumulam ao longo das rodadas e os feixes que se encontram em um rolo dobram onde se sobrepõem:`,
		tiers: [
			'O recurso começa com a grade escura. Cada Holofote que cai fica aceso pelo resto do recurso.',
			'A primeira rodada grátis tem garantido um Holofote extra, e os Holofotes caem com mais frequência do que no Lockdown.',
			'A primeira rodada grátis tem garantido um Holofote extra, e o recurso traz <strong>mais Holofotes do que qualquer outro nível</strong> — então os feixes se encontram no mesmo rolo com mais frequência, e cada sobreposição dobra.',
		],
		symbols: {
			H1: 'Molho de chaves',
			H2: 'Algemas',
			H3: 'Lata de contrabando',
			H4: 'Caneca de lata e colher',
			H5: 'Remendo de contagem',
			L1: 'Espadas',
			L2: 'Copas',
			L3: 'Ouros',
			L4: 'Paus',
			W: 'Boné de presidiário',
			S: 'Porta da cela — Scatter',
			SW: 'O Holofote',
		},
		ptSpecial: 'Não paga sozinho — ilumina o seu rolo de onde cai PARA BAIXO até o fundo, transformando essas posições em Wilds que levam cada uma um multiplicador. Os Scatters desse rolo não são substituídos.',
		ptFoot: (mw) =>
			`O Wild substitui todos os símbolos, exceto o Scatter e o Holofote, e paga como símbolo próprio. Só o maior ganho é pago por linha. O ganho máximo é limitado a ${mw}× a aposta base.`,
	},
	pl: {
		wild: 'Wild zastępuje każdy symbol oprócz Scattera i Reflektora, a przy 5 jednakowych płaci jako osobny symbol.',
		lightTitle: 'Reflektor',
		light: [
			'Gdy Reflektor wyląduje, oświetla swój bęben <strong>od własnej pozycji aż do dołu</strong> — nigdy w górę. Każde oświetlone pole staje się symbolem <strong>Wild</strong>, zanim wygrane zostaną ocenione, i ma mnożnik od <strong>1× do 100×</strong>. Reflektor w górnym rzędzie oświetla cztery pola, a w dolnym tylko jedno. Symbole Scatter na tym bębnie nie są zastępowane. Reflektor nie płaci jako osobny symbol, a w jednym obrocie może wylądować więcej niż jeden.',
			'Oświetlone pole liczy się do wygranej, gdy należy do wygrywającej linii, a wygrana jest mnożona przez jego wartość. Gdy linia przechodzi przez kilka oświetlonych pól, wszystkie mnożniki powyżej 1× są <strong>sumowane</strong> i stosowana jest suma — pole 1× nic nie dodaje.',
		],
		beamsTitle: 'Nakładające się wiązki',
		beams: 'Gdy Reflektor wyląduje na bębnie, który jest <strong>już oświetlony</strong>, każde pole wspólne dla obu wiązek ma swój dotychczasowy mnożnik <strong>podwojony</strong>, maksymalnie do 100×. Pola, do których nowa wiązka dociera po raz pierwszy, przyjmują wartość nowego Reflektora.',
		scatter: (n) =>
			`Scatter pojawia się w grze podstawowej na wszystkich pięciu bębnach, a podczas darmowych obrotów na bębnach od 3 do 5. Nie płaci samodzielnie i nie musi wylądować na linii wygrywającej. Liczba symboli Scatter, które wylądują jednocześnie, decyduje o tym, która funkcja się otworzy, a każda przyznaje ${n} darmowych obrotów. W każdej funkcji <strong>każda wiązka świeci aż do końca funkcji</strong>, więc Reflektory gromadzą się z obrotu na obrót, a wiązki spotykające się na jednym bębnie podwajają się tam, gdzie się nakładają:`,
		tiers: [
			'Funkcja zaczyna się przy ciemnej siatce. Każdy Reflektor, który wyląduje, świeci do końca funkcji.',
			'Pierwszy darmowy obrót ma gwarantowany dodatkowy Reflektor, a Reflektory lądują częściej niż w Lockdown.',
			'Pierwszy darmowy obrót ma gwarantowany dodatkowy Reflektor, a funkcja daje <strong>więcej Reflektorów niż jakikolwiek inny poziom</strong> — więc wiązki częściej spotykają się na tym samym bębnie, a każde nałożenie podwaja.',
		],
		symbols: {
			H1: 'Pęk kluczy',
			H2: 'Kajdanki',
			H3: 'Puszka z przemytem',
			H4: 'Blaszany kubek i łyżka',
			H5: 'Naszywka z kreskami',
			L1: 'Pik',
			L2: 'Kier',
			L3: 'Karo',
			L4: 'Trefl',
			W: 'Więzienna czapka',
			S: 'Drzwi celi — Scatter',
			SW: 'Reflektor',
		},
		ptSpecial: 'Nie płaci samodzielnie — oświetla swój bęben od miejsca lądowania W DÓŁ aż do końca, zamieniając te pola w symbole Wild, z których każdy ma mnożnik. Symbole Scatter na tym bębnie nie są zastępowane.',
		ptFoot: (mw) =>
			`Wild zastępuje wszystkie symbole oprócz Scattera i Reflektora i płaci jako osobny symbol. Na każdej linii wypłacana jest tylko najwyższa wygrana. Maksymalna wygrana jest ograniczona do ${mw}× zakładu podstawowego.`,
	},
	ru: {
		wild: 'Wild заменяет любой символ, кроме Scatter и Прожектора, и при 5 одинаковых оплачивается как отдельный символ.',
		lightTitle: 'Прожектор',
		light: [
			'Когда выпадает Прожектор, он освещает свой барабан <strong>от собственной позиции до самого низа</strong> — никогда вверх. Каждая освещённая позиция становится символом <strong>Wild</strong> до подсчёта выигрышей и несёт множитель от <strong>1× до 100×</strong>. Прожектор в верхнем ряду освещает четыре позиции, в нижнем — только одну. Символы Scatter на этом барабане не заменяются. Прожектор не оплачивается как отдельный символ, и за одно вращение их может выпасть несколько.',
			'Освещённая позиция учитывается в выигрыше, если входит в выигрышную линию выплат, и выигрыш умножается на её значение. Если линия выплат проходит через несколько освещённых позиций, все множители больше 1× <strong>складываются</strong> и применяется сумма — позиция с 1× ничего не добавляет.',
		],
		beamsTitle: 'Перекрытие лучей',
		beams: 'Когда Прожектор выпадает на барабан, который <strong>уже освещён</strong>, у каждой позиции, общей для двух лучей, текущий множитель <strong>удваивается</strong>, но не выше 100×. Позиции, до которых новый луч доходит впервые, получают значение нового Прожектора.',
		scatter: (n) =>
			`Scatter выпадает на всех пяти барабанах в основной игре и на барабанах 3–5 во время бесплатных вращений. Он не оплачивается сам по себе и не обязан выпадать на линии выплат. Число одновременно выпавших Scatter определяет, какая функция откроется, и каждая даёт ${n} бесплатных вращений. В каждой функции <strong>каждый луч горит до конца функции</strong>, поэтому Прожекторы накапливаются от вращения к вращению, а лучи, встретившиеся на одном барабане, удваиваются там, где перекрываются:`,
		tiers: [
			'Функция начинается с тёмного поля. Каждый выпавший Прожектор горит до конца функции.',
			'В первом бесплатном вращении гарантирован дополнительный Прожектор, и Прожекторы выпадают чаще, чем в Lockdown.',
			'В первом бесплатном вращении гарантирован дополнительный Прожектор, а функция приносит <strong>больше Прожекторов, чем любой другой уровень</strong>, — поэтому лучи чаще встречаются на одном барабане, и каждое перекрытие удваивается.',
		],
		symbols: {
			H1: 'Связка ключей',
			H2: 'Наручники',
			H3: 'Жестянка с контрабандой',
			H4: 'Жестяная кружка и ложка',
			H5: 'Нашивка с зарубками',
			L1: 'Пики',
			L2: 'Червы',
			L3: 'Бубны',
			L4: 'Трефы',
			W: 'Тюремная кепка',
			S: 'Дверь камеры — Scatter',
			SW: 'Прожектор',
		},
		ptSpecial: 'Не оплачивается сам по себе — освещает свой барабан от места выпадения ВНИЗ до самого конца, превращая эти позиции в Wild, каждый со своим множителем. Символы Scatter на этом барабане не заменяются.',
		ptFoot: (mw) =>
			`Wild заменяет все символы, кроме Scatter и Прожектора, и оплачивается как отдельный символ. На каждой линии выплачивается только наибольший выигрыш. Максимальный выигрыш ограничен ${mw}× базовой ставки.`,
	},
	tr: {
		wild: 'Wild, Scatter ve Arama Işığı dışındaki tüm sembollerin yerine geçer ve 5’li eşleşmede kendi sembolü olarak öder.',
		lightTitle: 'Arama Işığı',
		light: [
			'Bir Arama Işığı geldiğinde makarasını <strong>kendi konumundan en alta kadar</strong> aydınlatır — asla yukarı doğru değil. Aydınlatılan her konum, kazançlar değerlendirilmeden önce <strong>Wild</strong> olur ve <strong>1× ile 100×</strong> arasında bir çarpan taşır. En üst sıraya gelen bir Arama Işığı dört konumu, en alt sıraya gelen ise yalnızca bir konumu aydınlatır. O makaradaki Scatter’lar değiştirilmez. Arama Işığı kendi başına bir sembol olarak ödeme yapmaz ve aynı dönüşte birden fazla gelebilir.',
			'Aydınlatılan bir konum, kazanan bir ödeme çizgisinin parçası olduğunda kazanca dahil olur ve kazanç onun değeriyle çarpılır. Bir ödeme çizgisi birden fazla aydınlatılmış konumdan geçerse 1×’in üzerindeki tüm çarpanlar <strong>toplanır</strong> ve toplam uygulanır — 1×’lik bir konum hiçbir şey eklemez.',
		],
		beamsTitle: 'Üst Üste Işınlar',
		beams: 'Bir Arama Işığı <strong>zaten aydınlatılmış</strong> bir makaraya gelirse, iki ışının paylaştığı her konumun mevcut çarpanı en fazla 100× olacak şekilde <strong>ikiye katlanır</strong>. Yeni ışının ilk kez ulaştığı konumlar ise yeni Arama Işığı’nın kendi değerini alır.',
		scatter: (n) =>
			`Scatter ana oyunda beş makaranın hepsinde, ücretsiz dönüşlerde ise 3–5. makaralarda çıkar. Tek başına ödeme yapmaz ve bir ödeme çizgisine düşmesi gerekmez. Birlikte gelen Scatter sayısı hangi özelliğin açılacağını belirler ve her biri ${n} ücretsiz dönüş verir. Her özellikte <strong>her ışın özellik bitene kadar yanık kalır</strong>; böylece Arama Işıkları dönüşler boyunca birikir ve bir makarada buluşan ışınlar örtüştükleri yerde ikiye katlanır:`,
		tiers: [
			'Özellik karanlık bir ızgarayla başlar. Gelen her Arama Işığı özellik sonuna kadar yanık kalır.',
			'İlk ücretsiz dönüşte ek bir Arama Işığı garantidir ve Arama Işıkları Lockdown’a göre daha sık gelir.',
			'İlk ücretsiz dönüşte ek bir Arama Işığı garantidir ve özellik <strong>diğer tüm seviyelerden daha fazla Arama Işığı</strong> getirir — böylece ışınlar aynı makarada daha sık buluşur ve her örtüşme ikiye katlanır.',
		],
		symbols: {
			H1: 'Anahtarlık',
			H2: 'Kelepçe',
			H3: 'Kaçak Malı Kutusu',
			H4: 'Teneke Kupa ve Kaşık',
			H5: 'Çentik Yaması',
			L1: 'Maça',
			L2: 'Kupa',
			L3: 'Karo',
			L4: 'Sinek',
			W: 'Mahkûm Şapkası',
			S: 'Hücre Kapısı — Scatter',
			SW: 'Arama Işığı',
		},
		ptSpecial: 'Tek başına ödeme yapmaz — makarasını geldiği yerden AŞAĞIYA en alta kadar aydınlatır ve bu konumları her biri bir çarpan taşıyan Wild’lara çevirir. O makaradaki Scatter’lar değiştirilmez.',
		ptFoot: (mw) =>
			`Wild, Scatter ve Arama Işığı dışındaki tüm sembollerin yerine geçer ve kendi sembolü olarak öder. Her çizgide yalnızca en yüksek kazanç ödenir. Maksimum kazanç temel bahsin ${mw} katıyla sınırlıdır.`,
	},
	fi: {
		wild: 'Wild korvaa kaikki symbolit paitsi Scatterin ja valonheittimen, ja se maksaa omana symbolinaan viiden samanlaisen yhdistelmästä.',
		lightTitle: 'Valonheitin',
		light: [
			'Kun valonheitin osuu, se valaisee rullansa <strong>omasta kohdastaan alas asti</strong> — ei koskaan ylöspäin. Jokainen valaistu ruutu muuttuu <strong>Wildiksi</strong> ennen voittojen laskemista, ja siinä on kerroin <strong>1×–100×</strong>. Ylimmälle riville osuva valonheitin valaisee neljä ruutua, alimmalle riville osuva vain yhden. Rullan Scattereita ei korvata. Valonheitin ei maksa omana symbolinaan, ja samalla kierroksella voi osua useampi.',
			'Valaistu ruutu lasketaan mukaan voittoon, kun se kuuluu voittavaan voittolinjaan, ja voitto kerrotaan sen arvolla. Jos voittolinja kulkee useamman valaistun ruudun kautta, kaikki yli 1×:n kertoimet <strong>lasketaan yhteen</strong> ja summaa käytetään — 1×-ruutu ei lisää mitään.',
		],
		beamsTitle: 'Päällekkäiset keilat',
		beams: 'Kun valonheitin osuu rullalle, joka on <strong>jo valaistu</strong>, jokaisen kummankin keilan yhteisen ruudun nykyinen kerroin <strong>tuplaantuu</strong>, enintään 100×:aan. Ruudut, joihin uusi keila ulottuu ensimmäistä kertaa, saavat sen sijaan uuden valonheittimen oman arvon.',
		scatter: (n) =>
			`Scatter ilmestyy peruspelissä kaikille viidelle rullalle ja ilmaiskierroksilla rullille 3–5. Se ei maksa yksinään eikä sen tarvitse osua voittolinjalle. Yhtä aikaa osuvien Scatterien määrä ratkaisee, mikä ominaisuus avautuu, ja kukin antaa ${n} ilmaiskierrosta. Jokaisessa ominaisuudessa <strong>jokainen keila palaa ominaisuuden loppuun asti</strong>, joten valonheittimiä kertyy kierros kierrokselta ja samalla rullalla kohtaavat keilat tuplaantuvat siellä, missä ne menevät päällekkäin:`,
		tiers: [
			'Ominaisuus alkaa pimeällä ruudukolla. Jokainen osuva valonheitin palaa ominaisuuden loppuun asti.',
			'Ensimmäisellä ilmaiskierroksella on taattu ylimääräinen valonheitin, ja valonheittimiä osuu useammin kuin Lockdownissa.',
			'Ensimmäisellä ilmaiskierroksella on taattu ylimääräinen valonheitin, ja ominaisuus tuo <strong>enemmän valonheittimiä kuin mikään muu taso</strong> — joten keilat kohtaavat samalla rullalla useammin, ja jokainen päällekkäisyys tuplaa.',
		],
		symbols: {
			H1: 'Avainnippu',
			H2: 'Käsiraudat',
			H3: 'Salakuljetuspurkki',
			H4: 'Peltimuki ja lusikka',
			H5: 'Laskentaviivat',
			L1: 'Pata',
			L2: 'Hertta',
			L3: 'Ruutu',
			L4: 'Risti',
			W: 'Vanginlakki',
			S: 'Sellin ovi — Scatter',
			SW: 'Valonheitin',
		},
		ptSpecial: 'Ei maksa yksinään — valaisee rullansa osumakohdasta ALAS pohjaan asti ja muuttaa nuo ruudut Wildeiksi, joissa kussakin on kerroin. Rullan Scattereita ei korvata.',
		ptFoot: (mw) =>
			`Wild korvaa kaikki symbolit paitsi Scatterin ja valonheittimen, ja se maksaa omana symbolinaan. Kultakin linjalta maksetaan vain suurin voitto. Maksimivoitto on rajattu ${mw}-kertaiseen peruspanokseen.`,
	},
	id: {
		wild: 'Wild menggantikan semua simbol kecuali Scatter dan Lampu Sorot, dan membayar sebagai simbolnya sendiri untuk 5 yang sama.',
		lightTitle: 'Lampu Sorot',
		light: [
			'Saat Lampu Sorot mendarat, ia menerangi gulungannya <strong>dari posisinya sendiri sampai ke bawah</strong> — tidak pernah ke atas. Setiap posisi yang diterangi menjadi <strong>Wild</strong> sebelum kemenangan dihitung, dan membawa pengganda <strong>1× hingga 100×</strong>. Lampu Sorot yang mendarat di baris atas menerangi empat posisi; yang mendarat di baris bawah hanya satu posisi. Scatter di gulungan itu tidak diganti. Lampu Sorot tidak membayar sebagai simbolnya sendiri, dan lebih dari satu dapat mendarat dalam putaran yang sama.',
			'Posisi yang diterangi dihitung untuk kemenangan saat menjadi bagian dari garis pembayaran yang menang, dan kemenangan dikalikan dengan nilainya. Jika satu garis pembayaran melintasi lebih dari satu posisi yang diterangi, semua pengganda di atas 1× <strong>dijumlahkan</strong> dan totalnya diterapkan — posisi 1× tidak menambah apa pun.',
		],
		beamsTitle: 'Sorotan Bertumpuk',
		beams: 'Saat Lampu Sorot mendarat di gulungan yang <strong>sudah diterangi</strong>, setiap posisi yang dilalui kedua sorotan mendapat pengganda yang ada <strong>dilipatgandakan</strong>, hingga maksimum 100×. Posisi yang baru pertama kali dicapai sorotan baru mengambil nilai Lampu Sorot yang baru.',
		scatter: (n) =>
			`Scatter muncul di kelima gulungan pada permainan dasar, dan di gulungan 3 sampai 5 selama putaran gratis. Scatter tidak membayar sendiri dan tidak perlu mendarat di garis pembayaran. Jumlah Scatter yang mendarat bersamaan menentukan fitur mana yang terbuka, dan masing-masing memberi ${n} putaran gratis. Di setiap fitur, <strong>setiap sorotan tetap menyala sampai fitur berakhir</strong>, sehingga Lampu Sorot terkumpul dari putaran ke putaran dan sorotan yang bertemu di satu gulungan berlipat di bagian yang bertumpuk:`,
		tiers: [
			'Fitur dimulai dengan kisi gelap. Setiap Lampu Sorot yang mendarat tetap menyala sampai fitur berakhir.',
			'Putaran gratis pertama dijamin mendapat satu Lampu Sorot tambahan, dan Lampu Sorot lebih sering mendarat dibanding di Lockdown.',
			'Putaran gratis pertama dijamin mendapat satu Lampu Sorot tambahan, dan fitur ini menghadirkan <strong>Lampu Sorot lebih banyak daripada tingkat lain mana pun</strong> — jadi sorotan lebih sering bertemu di gulungan yang sama, dan setiap tumpukan berlipat ganda.',
		],
		symbols: {
			H1: 'Gantungan Kunci',
			H2: 'Borgol',
			H3: 'Kaleng Selundupan',
			H4: 'Cangkir Kaleng & Sendok',
			H5: 'Tambalan Hitungan',
			L1: 'Sekop',
			L2: 'Hati',
			L3: 'Wajik',
			L4: 'Keriting',
			W: 'Topi Narapidana',
			S: 'Pintu Sel — Scatter',
			SW: 'Lampu Sorot',
		},
		ptSpecial: 'Tidak membayar sendiri — menerangi gulungannya dari tempat mendarat KE BAWAH sampai dasar, mengubah posisi-posisi itu menjadi Wild yang masing-masing membawa pengganda. Scatter di gulungan itu tidak diganti.',
		ptFoot: (mw) =>
			`Wild menggantikan semua simbol kecuali Scatter dan Lampu Sorot, dan membayar sebagai simbolnya sendiri. Hanya kemenangan tertinggi yang dibayar per garis. Kemenangan maksimum dibatasi ${mw}× taruhan dasar.`,
	},
	vi: {
		wild: 'Wild thay thế mọi biểu tượng trừ Scatter và Đèn pha, và trả thưởng như biểu tượng riêng khi có 5 biểu tượng giống nhau.',
		lightTitle: 'Đèn pha',
		light: [
			'Khi một Đèn pha xuất hiện, nó chiếu sáng cuộn của mình <strong>từ vị trí của nó xuống tận đáy</strong> — không bao giờ chiếu lên. Mỗi ô được chiếu sáng trở thành <strong>Wild</strong> trước khi tính thắng và mang hệ số nhân <strong>1× đến 100×</strong>. Đèn pha ở hàng trên cùng chiếu sáng bốn ô; đèn ở hàng dưới cùng chỉ chiếu một ô. Scatter trên cuộn đó không bị thay thế. Đèn pha không trả thưởng như một biểu tượng riêng, và có thể có nhiều đèn trong cùng một lượt quay.',
			'Một ô được chiếu sáng được tính vào khoản thắng khi nó thuộc về một dòng thanh toán thắng, và khoản thắng được nhân với giá trị của nó. Khi một dòng thanh toán đi qua nhiều ô được chiếu sáng, mọi hệ số nhân lớn hơn 1× được <strong>cộng lại</strong> và tổng được áp dụng — ô 1× không cộng thêm gì.',
		],
		beamsTitle: 'Chùm sáng chồng nhau',
		beams: 'Khi một Đèn pha rơi vào cuộn <strong>đã được chiếu sáng</strong>, mỗi ô mà hai chùm sáng cùng đi qua sẽ được <strong>nhân đôi</strong> hệ số nhân hiện có, tối đa 100×. Những ô mà chùm sáng mới chiếu tới lần đầu sẽ nhận giá trị của Đèn pha mới.',
		scatter: (n) =>
			`Scatter xuất hiện trên cả năm cuộn trong trò chơi chính và trên các cuộn 3 đến 5 trong vòng quay miễn phí. Nó không tự trả thưởng và không cần nằm trên dòng thanh toán. Số Scatter cùng xuất hiện quyết định tính năng nào được mở, và mỗi tính năng cho ${n} vòng quay miễn phí. Trong mọi tính năng, <strong>mỗi chùm sáng giữ nguyên đến hết tính năng</strong>, nên Đèn pha tích lũy qua các lượt và những chùm sáng gặp nhau trên một cuộn sẽ nhân đôi ở chỗ chồng lên nhau:`,
		tiers: [
			'Tính năng bắt đầu với lưới tối. Mỗi Đèn pha xuất hiện đều sáng đến hết tính năng.',
			'Lượt quay miễn phí đầu tiên được bảo đảm thêm một Đèn pha, và Đèn pha xuất hiện thường xuyên hơn so với Lockdown.',
			'Lượt quay miễn phí đầu tiên được bảo đảm thêm một Đèn pha, và tính năng mang lại <strong>nhiều Đèn pha hơn bất kỳ cấp nào khác</strong> — nên các chùm sáng gặp nhau trên cùng một cuộn thường xuyên hơn, và mỗi lần chồng nhau đều nhân đôi.',
		],
		symbols: {
			H1: 'Chùm chìa khóa',
			H2: 'Còng tay',
			H3: 'Hộp thiếc lậu',
			H4: 'Cốc thiếc & thìa',
			H5: 'Miếng vá vạch đếm',
			L1: 'Bích',
			L2: 'Cơ',
			L3: 'Rô',
			L4: 'Chuồn',
			W: 'Mũ tù nhân',
			S: 'Cửa phòng giam — Scatter',
			SW: 'Đèn pha',
		},
		ptSpecial: 'Không tự trả thưởng — chiếu sáng cuộn của nó từ chỗ xuất hiện XUỐNG tận đáy, biến các ô đó thành Wild, mỗi ô mang một hệ số nhân. Scatter trên cuộn đó không bị thay thế.',
		ptFoot: (mw) =>
			`Wild thay thế mọi biểu tượng trừ Scatter và Đèn pha, và trả thưởng như biểu tượng riêng. Mỗi dòng chỉ trả khoản thắng cao nhất. Thắng tối đa được giới hạn ở ${mw}× mức cược cơ bản.`,
	},
	ja: {
		wild: 'ワイルドはスキャッターとサーチライト以外のすべてのシンボルの代わりになり、5個揃うと独自のシンボルとして配当します。',
		lightTitle: 'サーチライト',
		light: [
			'サーチライトが出現すると、<strong>自分の位置から一番下まで</strong>そのリールを照らします（上方向には照らしません）。照らされたマスは配当の判定前にすべて<strong>ワイルド</strong>になり、<strong>1×～100×</strong>の倍率が付きます。最上段に出たサーチライトは4マス、最下段に出たものは1マスだけを照らします。そのリールのスキャッターは置き換えられません。サーチライト自体には配当がなく、同じスピンで複数出現することもあります。',
			'照らされたマスが当たりペイラインに含まれると配当に加わり、配当にその倍率が掛かります。1本のペイラインが照らされたマスを複数通過する場合、1×を超える倍率はすべて<strong>合算</strong>され、その合計が適用されます。1×のマスは何も加えません。',
		],
		beamsTitle: 'ビームの重なり',
		beams: 'サーチライトが<strong>すでに照らされている</strong>リールに出現すると、2本のビームが重なるマスの倍率は<strong>2倍</strong>になります（上限100×）。新しいビームが初めて届くマスには、新しいサーチライト自身の倍率が付きます。',
		scatter: (n) =>
			`スキャッターはベースゲームでは5本すべてのリールに、フリースピン中はリール3～5に出現します。スキャッター単独では配当がなく、ペイライン上に止まる必要もありません。同時に出現したスキャッターの数で開始するフィーチャーが決まり、どれもフリースピン${n}回です。どのフィーチャーでも<strong>ビームはフィーチャー終了まで照らし続け</strong>、サーチライトはスピンごとに積み重なり、同じリールで重なったビームはその部分が2倍になります：`,
		tiers: [
			'フィーチャーは暗いグリッドで始まります。出現したサーチライトはフィーチャー終了まで照らし続けます。',
			'最初のフリースピンでサーチライトが1つ追加で確定し、Lockdownよりもサーチライトが出現しやすくなります。',
			'最初のフリースピンでサーチライトが1つ追加で確定し、<strong>どのレベルよりも多くのサーチライト</strong>が出現します。そのため同じリールでビームが重なりやすく、重なるたびに2倍になります。',
		],
		symbols: {
			H1: 'キーリング',
			H2: '手錠',
			H3: '密輸品の缶',
			H4: 'ブリキのマグとスプーン',
			H5: '刻み目の布',
			L1: 'スペード',
			L2: 'ハート',
			L3: 'ダイヤ',
			L4: 'クラブ',
			W: '囚人帽',
			S: '独房の扉 — スキャッター',
			SW: 'サーチライト',
		},
		ptSpecial: '単独では配当なし — 出現した位置から一番下までリールを照らし、照らしたマスをそれぞれ倍率付きのワイルドに変えます。そのリールのスキャッターは置き換えられません。',
		ptFoot: (mw) =>
			`ワイルドはスキャッターとサーチライト以外のすべてのシンボルの代わりになり、独自のシンボルとしても配当します。各ラインでは最も高い当たりのみが支払われます。最大配当はベースベットの${mw}倍が上限です。`,
	},
	ko: {
		wild: '와일드는 스캐터와 탐조등을 제외한 모든 심볼을 대체하며, 5개 일치 시 자체 심볼로 지급됩니다.',
		lightTitle: '탐조등',
		light: [
			'탐조등이 나오면 <strong>자신의 위치에서 맨 아래까지</strong> 해당 릴을 비춥니다. 위쪽으로는 비추지 않습니다. 비춰진 칸은 당첨을 판정하기 전에 모두 <strong>와일드</strong>가 되며 <strong>1×~100×</strong> 배수를 가집니다. 맨 윗줄에 나온 탐조등은 네 칸을, 맨 아랫줄에 나온 탐조등은 한 칸만 비춥니다. 그 릴의 스캐터는 대체되지 않습니다. 탐조등 자체는 지급되지 않으며, 한 스핀에 여러 개가 나올 수 있습니다.',
			'비춰진 칸이 당첨 페이라인에 포함되면 당첨에 적용되어 당첨금에 그 값이 곱해집니다. 페이라인이 비춰진 칸을 여러 개 지나가면 1×를 넘는 배수가 모두 <strong>합산</strong>되어 그 합계가 적용됩니다. 1× 칸은 아무것도 더하지 않습니다.',
		],
		beamsTitle: '겹치는 빔',
		beams: '탐조등이 <strong>이미 비춰진</strong> 릴에 나오면, 두 빔이 겹치는 칸의 기존 배수가 <strong>두 배</strong>가 됩니다(최대 100×). 새 빔이 처음 닿는 칸은 새 탐조등의 값을 가집니다.',
		scatter: (n) =>
			`스캐터는 기본 게임에서는 다섯 릴 모두에, 프리 스핀 중에는 3~5번 릴에 등장합니다. 스캐터 단독으로는 지급되지 않으며 페이라인 위에 있을 필요가 없습니다. 함께 나온 스캐터 수에 따라 열리는 기능이 정해지며, 각 기능은 프리 스핀 ${n}회를 줍니다. 모든 기능에서 <strong>모든 빔은 기능이 끝날 때까지 계속 켜져 있으므로</strong>, 탐조등이 스핀마다 쌓이고 한 릴에서 만난 빔은 겹친 곳이 두 배가 됩니다:`,
		tiers: [
			'기능은 어두운 그리드로 시작합니다. 나온 탐조등은 기능이 끝날 때까지 계속 켜져 있습니다.',
			'첫 프리 스핀에서 탐조등 1개가 추가로 보장되며, Lockdown보다 탐조등이 더 자주 나옵니다.',
			'첫 프리 스핀에서 탐조등 1개가 추가로 보장되며, <strong>어느 단계보다 많은 탐조등</strong>이 나옵니다. 따라서 같은 릴에서 빔이 더 자주 만나고, 겹칠 때마다 두 배가 됩니다.',
		],
		symbols: {
			H1: '열쇠 꾸러미',
			H2: '수갑',
			H3: '밀수품 깡통',
			H4: '양철 머그와 숟가락',
			H5: '눈금 패치',
			L1: '스페이드',
			L2: '하트',
			L3: '다이아몬드',
			L4: '클럽',
			W: '죄수 모자',
			S: '감방 문 — 스캐터',
			SW: '탐조등',
		},
		ptSpecial: '단독으로는 지급 없음 — 나온 자리에서 맨 아래까지 릴을 비추고, 비춘 칸을 각각 배수가 붙은 와일드로 바꿉니다. 그 릴의 스캐터는 대체되지 않습니다.',
		ptFoot: (mw) =>
			`와일드는 스캐터와 탐조등을 제외한 모든 심볼을 대체하며, 자체 심볼로도 지급됩니다. 각 라인에서는 가장 높은 당첨만 지급됩니다. 최대 당첨은 기본 베팅의 ${mw}배로 제한됩니다.`,
	},
	zh: {
		wild: '百搭可替代分散符號與探照燈以外的所有符號，5 個連線時也以自身符號派彩。',
		lightTitle: '探照燈',
		light: [
			'探照燈出現時，會<strong>從自己的位置往下照到最底</strong>——絕不往上照。每個被照亮的格子都會在計算贏分前變成<strong>百搭</strong>，並帶有 <strong>1× 至 100×</strong> 的倍數。落在最上排的探照燈照亮四格；落在最下排的只照亮一格。該輪上的分散符號不會被取代。探照燈本身不派彩，同一手可出現不只一個。',
			'被照亮的格子屬於中獎賠付線時計入這筆贏分，贏分乘以它的倍數。一條賠付線經過多個被照亮的格子時，所有大於 1× 的倍數<strong>相加</strong>後再套用總和——1× 的格子不加任何倍數。',
		],
		beamsTitle: '光束重疊',
		beams: '探照燈落在<strong>已經被照亮</strong>的輪上時，兩道光束共同經過的每一格，現有倍數都會<strong>加倍</strong>，最高 100×。新光束第一次照到的格子則採用新探照燈本身的倍數。',
		scatter: (n) =>
			`分散符號在一般遊戲出現在全部五輪，免費遊戲中出現在第 3 至第 5 輪。分散符號本身不派彩，也不必落在賠付線上。同時出現的分散符號數量決定開啟哪個特色功能，每個都給 ${n} 次免費遊戲。每個特色功能中，<strong>每道光束都會一直亮到特色功能結束</strong>，所以探照燈會一手一手累積，在同一輪相遇的光束在重疊處加倍：`,
		tiers: [
			'特色功能開始時盤面一片黑暗。每個落下的探照燈都會一直亮到特色功能結束。',
			'第一手免費遊戲保證多一個探照燈，探照燈出現得比 Lockdown 更頻繁。',
			'第一手免費遊戲保證多一個探照燈，而且這個特色功能的<strong>探照燈比其他任何等級都多</strong>——所以光束更常在同一輪相遇，每次重疊都會加倍。',
		],
		symbols: {
			H1: '鑰匙串',
			H2: '手銬',
			H3: '違禁品鐵盒',
			H4: '鐵杯與湯匙',
			H5: '刻痕布條',
			L1: '黑桃',
			L2: '紅心',
			L3: '方塊',
			L4: '梅花',
			W: '囚帽',
			S: '牢門 — 分散符號',
			SW: '探照燈',
		},
		ptSpecial: '本身不派彩 — 從落下的位置往下照亮整條輪到最底，把這些格子變成各帶倍數的百搭。該輪上的分散符號不會被取代。',
		ptFoot: (mw) =>
			`百搭可替代分散符號與探照燈以外的所有符號，也以自身符號派彩。每條賠付線只支付最高的一筆贏分。最高贏分上限為基本押注的 ${mw} 倍。`,
	},
	ar: {
		wild: 'يحل رمز Wild محل كل الرموز عدا Scatter والكشّاف، ويدفع كرمز مستقل عند تطابق 5 رموز.',
		lightTitle: 'الكشّاف',
		light: [
			'عندما يظهر الكشّاف، يضيء بكرته <strong>من موضعه حتى الأسفل</strong> — ولا يضيء إلى الأعلى أبدًا. يتحول كل موضع مضاء إلى رمز <strong>Wild</strong> قبل احتساب الأرباح، ويحمل مضاعفًا من <strong>1× إلى 100×</strong>. الكشّاف الذي يظهر في الصف العلوي يضيء أربعة مواضع، والذي يظهر في الصف السفلي يضيء موضعًا واحدًا فقط. لا تُستبدل رموز Scatter على تلك البكرة. لا يدفع الكشّاف كرمز مستقل، ويمكن أن يظهر أكثر من واحد في الدورة نفسها.',
			'يُحتسب الموضع المضاء في الربح عندما يكون جزءًا من خط دفع رابح، ويُضرب الربح في قيمته. وإذا عبر خط الدفع أكثر من موضع مضاء، <strong>تُجمع</strong> كل المضاعفات الأكبر من 1× ويُطبَّق المجموع — والموضع ذو القيمة 1× لا يضيف شيئًا.',
		],
		beamsTitle: 'أشعة متداخلة',
		beams: 'عندما يظهر الكشّاف على بكرة <strong>مضاءة بالفعل</strong>، <strong>يتضاعف</strong> المضاعف الحالي لكل موضع يتشاركه الشعاعان، بحد أقصى 100×. أما المواضع التي يصلها الشعاع الجديد لأول مرة فتأخذ قيمة الكشّاف الجديد.',
		scatter: (n) =>
			`يظهر رمز Scatter على البكرات الخمس كلها في اللعبة الأساسية، وعلى البكرات من 3 إلى 5 أثناء الدورات المجانية. لا يدفع بمفرده، ولا يلزم أن يهبط على خط دفع. يحدد عدد رموز Scatter الهابطة معًا أي ميزة تُفتح، وتمنح كل ميزة ${n} دورات مجانية. في كل ميزة <strong>يبقى كل شعاع مضاءً حتى نهاية الميزة</strong>، فتتراكم الكشّافات عبر الدورات وتتضاعف الأشعة التي تلتقي على بكرة واحدة حيث تتداخل:`,
		tiers: [
			'تبدأ الميزة والشبكة مظلمة. يبقى كل كشّاف يظهر مضاءً حتى نهاية الميزة.',
			'تضمن الدورة المجانية الأولى كشّافًا إضافيًا، وتظهر الكشّافات أكثر مما في Lockdown.',
			'تضمن الدورة المجانية الأولى كشّافًا إضافيًا، وتأتي الميزة <strong>بكشّافات أكثر من أي مستوى آخر</strong> — فتلتقي الأشعة على البكرة نفسها أكثر، ويتضاعف كل تداخل.',
		],
		symbols: {
			H1: 'حلقة المفاتيح',
			H2: 'الأصفاد',
			H3: 'علبة المهربات',
			H4: 'كوب صفيح وملعقة',
			H5: 'رقعة العدّ',
			L1: 'البستوني',
			L2: 'الكبة',
			L3: 'الديناري',
			L4: 'السباتي',
			W: 'قبعة السجين',
			S: 'باب الزنزانة — Scatter',
			SW: 'الكشّاف',
		},
		ptSpecial: 'لا يدفع بمفرده — يضيء بكرته من مكان ظهوره نزولًا إلى الأسفل، فيحوّل تلك المواضع إلى رموز Wild يحمل كل منها مضاعفًا. لا تُستبدل رموز Scatter على تلك البكرة.',
		ptFoot: (mw) =>
			`يحل رمز Wild محل كل الرموز عدا Scatter والكشّاف، ويدفع كرمز مستقل. يُدفع أعلى ربح فقط في كل خط. أقصى ربح محدد بـ ${mw} ضعف الرهان الأساسي.`,
	},
	hi: {
		wild: 'वाइल्ड स्कैटर और सर्चलाइट को छोड़कर हर सिंबल की जगह ले लेता है, और 5 एक जैसे मिलने पर अपने सिंबल के रूप में भुगतान करता है।',
		lightTitle: 'सर्चलाइट',
		light: [
			'जब सर्चलाइट आती है, तो वह अपनी रील को <strong>अपनी जगह से सबसे नीचे तक</strong> रोशन करती है — कभी ऊपर की ओर नहीं। हर रोशन स्थान जीत की गणना से पहले <strong>वाइल्ड</strong> बन जाता है और उस पर <strong>1× से 100×</strong> का गुणक होता है। सबसे ऊपरी पंक्ति पर आई सर्चलाइट चार स्थान रोशन करती है; सबसे निचली पंक्ति पर आई सर्चलाइट केवल एक स्थान। उस रील के स्कैटर नहीं बदले जाते। सर्चलाइट अपने सिंबल के रूप में भुगतान नहीं करती, और एक ही स्पिन में एक से अधिक आ सकती हैं।',
			'जब कोई रोशन स्थान किसी जीतने वाली पेलाइन का हिस्सा होता है, तो वह जीत में गिना जाता है और जीत उसके मान से गुणा होती है। जब कोई पेलाइन एक से अधिक रोशन स्थानों से गुज़रती है, तो 1× से ऊपर के सभी गुणक <strong>जोड़े जाते हैं</strong> और कुल लागू होता है — 1× वाला स्थान कुछ नहीं जोड़ता।',
		],
		beamsTitle: 'ओवरलैपिंग बीम',
		beams: 'जब सर्चलाइट किसी <strong>पहले से रोशन</strong> रील पर आती है, तो दोनों बीम जिन स्थानों को साझा करती हैं, उनका मौजूदा गुणक <strong>दोगुना</strong> हो जाता है, अधिकतम 100× तक। जिन स्थानों तक नई बीम पहली बार पहुँचती है, वे नई सर्चलाइट का अपना मान लेते हैं।',
		scatter: (n) =>
			`स्कैटर बेस गेम में पाँचों रीलों पर और फ्री स्पिन के दौरान रील 3 से 5 पर आता है। यह अपने आप भुगतान नहीं करता और इसका पेलाइन पर आना ज़रूरी नहीं है। एक साथ आने वाले स्कैटर की संख्या तय करती है कि कौन-सा फ़ीचर खुलेगा, और हर एक ${n} फ्री स्पिन देता है। हर फ़ीचर में <strong>हर बीम फ़ीचर खत्म होने तक जलती रहती है</strong>, इसलिए सर्चलाइटें स्पिन-दर-स्पिन जुड़ती जाती हैं और एक रील पर मिलने वाली बीम जहाँ ओवरलैप करती हैं वहाँ दोगुनी हो जाती हैं:`,
		tiers: [
			'फ़ीचर अंधेरे ग्रिड के साथ शुरू होता है। आने वाली हर सर्चलाइट फ़ीचर के अंत तक जलती रहती है।',
			'पहले फ्री स्पिन में एक अतिरिक्त सर्चलाइट की गारंटी है, और सर्चलाइटें Lockdown से अधिक बार आती हैं।',
			'पहले फ्री स्पिन में एक अतिरिक्त सर्चलाइट की गारंटी है, और यह फ़ीचर <strong>किसी भी अन्य स्तर से अधिक सर्चलाइटें</strong> लाता है — इसलिए बीम एक ही रील पर अधिक बार मिलती हैं, और हर ओवरलैप दोगुना होता है।',
		],
		symbols: {
			H1: 'चाबियों का गुच्छा',
			H2: 'हथकड़ी',
			H3: 'तस्करी का डिब्बा',
			H4: 'टिन का मग और चम्मच',
			H5: 'गिनती का पैच',
			L1: 'हुकुम',
			L2: 'पान',
			L3: 'ईंट',
			L4: 'चिड़ी',
			W: 'कैदी की टोपी',
			S: 'कोठरी का दरवाज़ा — स्कैटर',
			SW: 'सर्चलाइट',
		},
		ptSpecial: 'अपने आप भुगतान नहीं करती — जहाँ आती है वहाँ से नीचे तक अपनी रील रोशन करती है और उन स्थानों को वाइल्ड में बदल देती है, जिनमें से हर एक पर गुणक होता है। उस रील के स्कैटर नहीं बदले जाते।',
		ptFoot: (mw) =>
			`वाइल्ड स्कैटर और सर्चलाइट को छोड़कर सभी सिंबल की जगह ले लेता है, और अपने सिंबल के रूप में भुगतान करता है। हर लाइन पर केवल सबसे बड़ी जीत का भुगतान होता है। अधिकतम जीत बेस दांव के ${mw}× तक सीमित है।`,
	},
};

export const gameRulesText = (lang: RulesLang, T: Terms, social: boolean): GameText =>
	lang === 'en' || social ? english(T) : TEXT[lang];
