import { stateUrlDerived } from 'state-shared';

// Player-facing strings drawn as pixi Text (replacing the template's
// per-language PNG art). Covers every locale in config-lingui — the same 16
// the template spritesheets shipped. Rendered with canvas fillText, so RTL
// (ar) and complex scripts (hi) shape correctly via the browser.
// NOTE: only ever render these with <Text> — the gold BitmapText font has no
// CJK/Arabic/Devanagari glyphs (numbers are safe).
const TEXTS = {
	pressToContinue: {
		ar: 'اضغط في أي مكان للمتابعة',
		de: 'ZUM FORTFAHREN BELIEBIG TIPPEN',
		en: 'PRESS ANYWHERE TO CONTINUE',
		es: 'PULSA EN CUALQUIER LUGAR PARA CONTINUAR',
		fr: "APPUYEZ N'IMPORTE OÙ POUR CONTINUER",
		id: 'TEKAN DI MANA SAJA UNTUK MELANJUTKAN',
		ja: '画面をタップして続行',
		ko: '계속하려면 아무 곳이나 누르세요',
		pl: 'NACIŚNIJ W DOWOLNYM MIEJSCU, ABY KONTYNUOWAĆ',
		pt: 'TOQUE EM QUALQUER LUGAR PARA CONTINUAR',
		ru: 'НАЖМИТЕ В ЛЮБОМ МЕСТЕ, ЧТОБЫ ПРОДОЛЖИТЬ',
		tr: 'DEVAM ETMEK İÇİN HERHANGİ BİR YERE DOKUNUN',
		vi: 'NHẤN VÀO BẤT KỲ ĐÂU ĐỂ TIẾP TỤC',
		zh: '點擊任意處繼續',
		fi: 'JATKA PAINAMALLA MITÄ TAHANSA KOHTAA',
		hi: 'जारी रखने के लिए कहीं भी दबाएँ',
	},
	freeSpins: {
		ar: 'دورات مجانية',
		de: 'FREISPIELE',
		en: 'FREE SPINS',
		es: 'GIROS GRATIS',
		fr: 'TOURS GRATUITS',
		id: 'PUTARAN GRATIS',
		ja: 'フリースピン',
		ko: '무료 스핀',
		pl: 'DARMOWE OBROTY',
		pt: 'RODADAS GRÁTIS',
		ru: 'БЕСПЛАТНЫЕ ВРАЩЕНИЯ',
		tr: 'ÜCRETSİZ DÖNÜŞLER',
		vi: 'VÒNG QUAY MIỄN PHÍ',
		zh: '免費遊戲',
		fi: 'ILMAISKIERROKSET',
		hi: 'फ्री स्पिन',
	},
	// Sits under the "FREE SPINS" title and the count, i.e. the panel reads
	// "FREE SPINS / 12 / AWARDED". It used to say "SPINS AWARDED", which
	// repeated the word already in the title — "FREE SPINS 12 SPINS AWARDED".
	spinsAwarded: {
		ar: 'ممنوحة',
		de: 'GEWONNEN',
		en: 'AWARDED',
		es: 'OTORGADOS',
		fr: 'ATTRIBUÉS',
		id: 'DIBERIKAN',
		ja: '獲得',
		ko: '획득',
		pl: 'PRZYZNANE',
		pt: 'CONCEDIDAS',
		ru: 'НАЧИСЛЕНО',
		tr: 'KAZANILDI',
		vi: 'ĐƯỢC TRAO',
		zh: '已獲得',
		fi: 'MYÖNNETTY',
		hi: 'प्रदान किए गए',
	},
	// ── feature intro, shown once loading reaches 100% ──────────────────────
	// Three panels: what opens the feature (centre, the headline), what the
	// feature does to the board, and the cap.
	//
	// Titles are kept to one or two short words on purpose. The same panel has to
	// hold German and Russian, which run 30-40% longer than English, and a title
	// that wraps to three lines stops being a title. Figures live in the body,
	// where wrapping is expected.
	//
	// "SOUL SEAL" and "CONTRACT" are the on-reel symbol names and stay in
	// English in every locale, exactly as they appear on the symbols themselves -
	// translating the name would break the link between the panel and the thing
	// the player sees land.
	introTriggerTitle: {
		ar: 'دورات مجانية',
		de: 'FREISPIELE',
		en: 'FREE SPINS',
		es: 'GIROS GRATIS',
		fr: 'TOURS GRATUITS',
		id: 'PUTARAN GRATIS',
		ja: 'フリースピン',
		ko: '무료 스핀',
		pl: 'DARMOWE OBROTY',
		pt: 'RODADAS GRÁTIS',
		ru: 'БЕСПЛАТНЫЕ ВРАЩЕНИЯ',
		tr: 'ÜCRETSİZ DÖNÜŞLER',
		vi: 'VÒNG QUAY MIỄN PHÍ',
		zh: '免費遊戲',
		fi: 'ILMAISKIERROKSET',
		hi: 'फ्री स्पिन',
	},
	introTriggerBody: {
		ar: 'اجمع 3 رموز SOUL SEAL أو أكثر لتفوز بـ 8 أو 12 أو 15 دورة مجانية.',
		de: 'Lande 3 oder mehr SOUL SEAL Symbole und gewinne 8, 12 oder 15 Freispiele.',
		en: 'Land 3 or more SOUL SEAL symbols to win 8, 12 or 15 free spins.',
		es: 'Consigue 3 o más símbolos SOUL SEAL para ganar 8, 12 o 15 giros gratis.',
		fr: 'Obtenez 3 symboles SOUL SEAL ou plus pour gagner 8, 12 ou 15 tours gratuits.',
		id: 'Dapatkan 3 simbol SOUL SEAL atau lebih untuk memenangkan 8, 12, atau 15 putaran gratis.',
		ja: 'SOUL SEALシンボルを3個以上そろえると、8回・12回・15回のフリースピンを獲得。',
		ko: 'SOUL SEAL 심볼이 3개 이상 나오면 무료 스핀 8회, 12회 또는 15회를 획득합니다.',
		pl: 'Zdobądź 3 lub więcej symboli SOUL SEAL, aby wygrać 8, 12 lub 15 darmowych obrotów.',
		pt: 'Consiga 3 ou mais símbolos SOUL SEAL para ganhar 8, 12 ou 15 rodadas grátis.',
		ru: 'Соберите 3 или более символов SOUL SEAL и получите 8, 12 или 15 бесплатных вращений.',
		tr: '3 veya daha fazla SOUL SEAL sembolü düşürerek 8, 12 ya da 15 ücretsiz dönüş kazanın.',
		vi: 'Có được 3 biểu tượng SOUL SEAL trở lên để thắng 8, 12 hoặc 15 vòng quay miễn phí.',
		zh: '出現 3 個以上 SOUL SEAL 符號，即可贏得 8、12 或 15 次免費遊戲。',
		fi: 'Saat 8, 12 tai 15 ilmaiskierrosta, kun kelaat 3 tai useamman SOUL SEAL -symbolin.',
		hi: '3 या अधिक SOUL SEAL प्रतीक पाकर 8, 12 या 15 फ्री स्पिन जीतें।',
	},
	// The collect panel. It is the game's own mechanic, so it goes FIRST - the
	// panel a player reads left to right before they reach how the feature opens.
	//
	// It was missing for a while, and the layout gave that away: `boxes` divides
	// the area into three whether or not three panels exist, so two panels sat in
	// a three-wide grid with a hole on one side. The copy had to wait for the
	// maths, because it quotes what actually happens - 3 carriers on a line in the
	// base game, a wild sweeping the board in free spins - and that split was
	// still being designed.
	//
	// "SPIRIT" and "WILD" stay in English in every locale, like SOUL SEAL above,
	// because they are the names of things the player can see on the reels.
	introCollectTitle: {
		ar: 'الجمع',
		de: 'EINSAMMELN',
		en: 'COLLECT',
		es: 'RECOGER',
		fr: 'COLLECTE',
		id: 'KUMPULKAN',
		ja: '回収',
		ko: '수집',
		pl: 'ZBIERANIE',
		pt: 'RECOLHER',
		ru: 'СБОР',
		tr: 'TOPLA',
		vi: 'THU THẬP',
		zh: '收取',
		fi: 'KERÄÄ',
		hi: 'संग्रह',
	},
	introCollectBody: {
		ar: '3 رموز SPIRIT على خط واحد تختم اللوحة. في الدورات المجانية، يجمع كل WILD جميع قيم SPIRIT الظاهرة.',
		de: '3 SPIRIT-Symbole auf einer Linie versiegeln das Feld. In Freispielen sammelt jedes WILD alle sichtbaren SPIRIT-Werte ein.',
		en: '3 SPIRIT symbols on a line seal the board. In free spins, every WILD collects all SPIRIT values showing.',
		es: '3 símbolos SPIRIT en una línea sellan el tablero. En los giros gratis, cada WILD recoge todos los valores SPIRIT visibles.',
		fr: '3 symboles SPIRIT sur une ligne scellent la grille. Dans les tours gratuits, chaque WILD collecte toutes les valeurs SPIRIT affichées.',
		id: '3 simbol SPIRIT dalam satu garis menyegel papan. Dalam putaran gratis, setiap WILD mengumpulkan semua nilai SPIRIT yang tampil.',
		ja: 'SPIRITシンボルが3個そろうと盤面を封印。フリースピン中はWILDが盤面のSPIRITの数値をすべて回収します。',
		ko: 'SPIRIT 심볼 3개가 한 라인에 나오면 보드가 봉인됩니다. 무료 스핀에서는 WILD가 화면의 모든 SPIRIT 값을 수집합니다.',
		pl: '3 symbole SPIRIT na linii pieczętują planszę. W darmowych obrotach każdy WILD zbiera wszystkie widoczne wartości SPIRIT.',
		pt: '3 símbolos SPIRIT numa linha selam o tabuleiro. Nas rodadas grátis, cada WILD recolhe todos os valores SPIRIT visíveis.',
		ru: '3 символа SPIRIT на линии запечатывают поле. В бесплатных вращениях каждый WILD собирает все значения SPIRIT на экране.',
		tr: 'Bir hat üzerindeki 3 SPIRIT sembolü tahtayı mühürler. Ücretsiz dönüşlerde her WILD ekrandaki tüm SPIRIT değerlerini toplar.',
		vi: '3 biểu tượng SPIRIT trên một hàng sẽ phong ấn bàn cờ. Trong vòng quay miễn phí, mỗi WILD thu thập mọi giá trị SPIRIT hiển thị.',
		zh: '一條線上出現 3 個 SPIRIT 符號即可封印盤面。免費遊戲中，每個 WILD 會收取盤面上所有 SPIRIT 的數值。',
		fi: '3 SPIRIT-symbolia linjalla sinetöi pelilaudan. Ilmaiskierroksilla jokainen WILD kerää kaikki näkyvät SPIRIT-arvot.',
		hi: 'एक लाइन पर 3 SPIRIT प्रतीक बोर्ड को सील कर देते हैं। फ्री स्पिन में हर WILD स्क्रीन पर दिख रहे सभी SPIRIT मान एकत्र करता है।',
	},
	introMaxWinTitle: {
		ar: 'أقصى ربح',
		de: 'MAX. GEWINN',
		en: 'MAX WIN',
		es: 'GANANCIA MÁXIMA',
		fr: 'GAIN MAX',
		id: 'KEMENANGAN MAKS',
		ja: '最大配当',
		ko: '최대 당첨',
		pl: 'MAKS. WYGRANA',
		pt: 'GANHO MÁXIMO',
		ru: 'МАКС. ВЫИГРЫШ',
		tr: 'MAKS. KAZANÇ',
		vi: 'THẮNG TỐI ĐA',
		zh: '最高獎金',
		fi: 'MAKSIMIVOITTO',
		hi: 'अधिकतम जीत',
	},
	introMaxWinBody: {
		ar: 'اربح حتى 10,000 ضعف رهانك في جولة واحدة.',
		de: 'Gewinne bis zum 10.000-Fachen deines Einsatzes in einer einzigen Runde.',
		en: 'Win up to 10,000× your bet in a single round.',
		es: 'Gana hasta 10.000× tu apuesta en una sola ronda.',
		fr: 'Gagnez jusqu’à 10 000× votre mise en une seule partie.',
		id: 'Menangkan hingga 10.000× taruhan Anda dalam satu ronde.',
		ja: '1ラウンドでベット額の最大10,000倍を獲得。',
		ko: '한 라운드에서 베팅액의 최대 10,000배까지 획득할 수 있습니다.',
		pl: 'Wygraj nawet 10 000× swojego zakładu w jednej rundzie.',
		pt: 'Ganhe até 10.000× a sua aposta numa única rodada.',
		ru: 'Выигрыш до 10 000× вашей ставки за один раунд.',
		tr: 'Tek bir turda bahsinizin 10.000 katına kadar kazanın.',
		vi: 'Thắng tới 10.000× tiền cược của bạn trong một vòng.',
		zh: '單一回合最高可贏得投注額的 10,000 倍。',
		fi: 'Voita jopa 10 000× panoksesi yhdellä kierroksella.',
		hi: 'एक ही राउंड में अपनी शर्त का 10,000× तक जीतें।',
	},
	volatility: {
		ar: 'التقلب',
		de: 'VOLATILITÄT',
		en: 'VOLATILITY',
		es: 'VOLATILIDAD',
		fr: 'VOLATILITÉ',
		id: 'VOLATILITAS',
		ja: 'ボラティリティ',
		ko: '변동성',
		pl: 'ZMIENNOŚĆ',
		pt: 'VOLATILIDADE',
		ru: 'ВОЛАТИЛЬНОСТЬ',
		tr: 'OYNAKLIK',
		vi: 'ĐỘ BIẾN ĐỘNG',
		zh: '波動性',
		fi: 'VOLATILITEETTI',
		hi: 'अस्थिरता',
	},
	totalWin: {
		ar: 'إجمالي الربح',
		de: 'GESAMTGEWINN',
		en: 'TOTAL WIN',
		es: 'GANANCIA TOTAL',
		fr: 'GAIN TOTAL',
		id: 'TOTAL KEMENANGAN',
		ja: '合計勝利金',
		ko: '총 상금',
		pl: 'ŁĄCZNA WYGRANA',
		pt: 'GANHO TOTAL',
		ru: 'ОБЩИЙ ВЫИГРЫШ',
		tr: 'TOPLAM KAZANÇ',
		vi: 'TỔNG THẮNG',
		zh: '總贏分',
		fi: 'KOKONAISVOITTO',
		hi: 'कुल जीत',
	},
} as const;

// Social-play overrides, keyed exactly as TEXTS. Social jurisdictions forbid
// wagering vocabulary in anything the player can read, and the feature intro is
// the FIRST thing they read - certification came back on "Win up to 10,000×
// your bet in a single round", which every locale carried in its own words.
//
// This is the same job socialTerms.ts does for the rules and pay-table panels,
// but it cannot be done the same way: those build a sentence out of parts at
// render time, while these are whole sentences translated 16 ways, and swapping
// one noun inside a Russian or Japanese sentence from the outside does not
// produce grammar. So the sentence is written twice instead.
//
// Only the keys that need it appear here. gameText falls back to TEXTS for
// everything else, so this stays small rather than becoming a second copy of
// the whole table that has to be kept in step.
//
// design/check_social_words.mjs enforces the pairing: an English string in
// TEXTS carrying a restricted word MUST have a clean entry here.
const SOCIAL_TEXTS: Partial<Record<keyof typeof TEXTS, Record<string, string>>> = {
	introMaxWinBody: {
		ar: 'اربح حتى 10,000 ضعف مبلغك في جولة واحدة.',
		de: 'Gewinne bis zum 10.000-Fachen deines Spielbetrags in einer einzigen Runde.',
		en: 'Win up to 10,000× your total amount in a single round.',
		es: 'Gana hasta 10.000× tu importe en una sola ronda.',
		fr: 'Gagnez jusqu’à 10 000× votre montant en une seule partie.',
		id: 'Menangkan hingga 10.000× jumlah Anda dalam satu ronde.',
		ja: '1ラウンドでプレイ金額の最大10,000倍を獲得。',
		ko: '한 라운드에서 플레이 금액의 최대 10,000배까지 획득할 수 있습니다.',
		pl: 'Wygraj nawet 10 000× swojej kwoty w jednej rundzie.',
		pt: 'Ganhe até 10.000× o seu valor numa única rodada.',
		ru: 'Выигрыш до 10 000× вашей суммы за один раунд.',
		tr: 'Tek bir turda tutarınızın 10.000 katına kadar kazanın.',
		vi: 'Thắng tới 10.000× số tiền của bạn trong một vòng.',
		zh: '單一回合最高可贏得遊玩金額的 10,000 倍。',
		fi: 'Voita jopa 10 000× summasi yhdellä kierroksella.',
		hi: 'एक ही राउंड में अपनी राशि का 10,000× तक जीतें।',
	},
};

type TextKey = keyof typeof TEXTS;

export const gameText = (key: TextKey): string => {
	const lang = stateUrlDerived.lang();
	// Social first, and only when a social table exists for this key. Falling
	// through to TEXTS for a missing LOCALE would put the wagering word back on
	// screen for that language alone, so the social table's own English is the
	// fallback once the key is overridden at all.
	if (stateUrlDerived.social()) {
		const socialTable = SOCIAL_TEXTS[key];
		if (socialTable) return socialTable[lang] ?? socialTable.en;
	}
	const table = TEXTS[key] as Record<string, string>;
	return table[lang] ?? table.en;
};
