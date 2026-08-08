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
	respins: {
		ar: 'دورات متبقية',
		de: 'RESPINS',
		en: 'RESPINS',
		es: 'RESPINS',
		fr: 'RESPINS',
		id: 'RESPIN',
		ja: 'リスピン',
		ko: '리스핀',
		pl: 'RESPINY',
		pt: 'RESPINS',
		ru: 'РЕСПИНЫ',
		tr: 'YENİDEN ÇEVİRME',
		vi: 'QUAY LẠI',
		zh: '重轉次數',
		fi: 'UUSINTAKIERROKSET',
		hi: 'रीस्पिन',
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
	// Label on the gauge above the board. It shares its housing with the reading,
	// so it has to stay short: PressureGauge sizes the label at 0.48 of the band
	// height and does not wrap, and the longest of these (Indonesian) is what the
	// spacing was checked against.
	pressure: {
		ar: 'الضغط',
		de: 'DRUCK',
		en: 'PRESSURE',
		es: 'PRESIÓN',
		fr: 'PRESSION',
		id: 'TEKANAN',
		ja: '圧力',
		ko: '압력',
		pl: 'CIŚNIENIE',
		pt: 'PRESSÃO',
		ru: 'ДАВЛЕНИЕ',
		tr: 'BASINÇ',
		vi: 'ÁP SUẤT',
		zh: '壓力',
		fi: 'PAINE',
		hi: 'दबाव',
	},
} as const;

type TextKey = keyof typeof TEXTS;

export const gameText = (key: TextKey): string => {
	const table = TEXTS[key] as Record<string, string>;
	return table[stateUrlDerived.lang()] ?? table.en;
};
