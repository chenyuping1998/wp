import { stateUrlDerived } from 'state-shared';

// The bet bar's status line (components/BarMessage.svelte), in every locale the
// game ships. Kept apart from i18nText.ts so the bar can change without touching
// the strings the rest of the game draws. Short on purpose: the line lives in the
// span between the Win readout and the − stepper.
const BAR_TEXT = {
	placeBet: {
		ar: 'ضع رهانك',
		de: 'SETZE DEINEN EINSATZ',
		en: 'PLACE YOUR BET',
		es: 'HAZ TU APUESTA',
		fr: 'PLACEZ VOTRE MISE',
		id: 'PASANG TARUHAN ANDA',
		ja: 'ベットしてください',
		ko: '베팅하세요',
		pl: 'POSTAW ZAKŁAD',
		pt: 'FAÇA SUA APOSTA',
		ru: 'СДЕЛАЙТЕ СТАВКУ',
		tr: 'BAHSİNİZİ YAPIN',
		vi: 'ĐẶT CƯỢC CỦA BẠN',
		zh: '請下注',
		fi: 'ASETA PANOKSESI',
		hi: 'अपना दांव लगाएँ',
	},
	// social play: "bet" is a restricted word; Stake's table suggests this phrase
	comePlay: {
		ar: 'تعال والعب',
		de: 'KOMM UND SPIEL',
		en: 'COME AND PLAY',
		es: 'VEN A JUGAR',
		fr: 'VENEZ JOUER',
		id: 'AYO BERMAIN',
		ja: 'さあ、遊ぼう',
		ko: '어서 플레이하세요',
		pl: 'CHODŹ ZAGRAĆ',
		pt: 'VENHA JOGAR',
		ru: 'ДАВАЙТЕ ИГРАТЬ',
		tr: 'GEL VE OYNA',
		vi: 'HÃY CÙNG CHƠI',
		zh: '快來玩',
		fi: 'TULE PELAAMAAN',
		hi: 'आइए खेलें',
	},
	goodLuck: {
		ar: 'حظاً سعيداً!',
		de: 'VIEL GLÜCK!',
		en: 'GOOD LUCK!',
		es: '¡BUENA SUERTE!',
		fr: 'BONNE CHANCE !',
		id: 'SEMOGA BERUNTUNG!',
		ja: '幸運を！',
		ko: '행운을 빌어요!',
		pl: 'POWODZENIA!',
		pt: 'BOA SORTE!',
		ru: 'УДАЧИ!',
		tr: 'İYİ ŞANSLAR!',
		vi: 'CHÚC MAY MẮN!',
		zh: '祝好運！',
		fi: 'ONNEA!',
		hi: 'शुभकामनाएँ!',
	},
	// the base game's one rule worth repeating
	medusaTip: {
		ar: 'ميدوسا تضاعف الأرباح',
		de: 'MEDUSA VERVIELFACHT GEWINNE',
		en: 'MEDUSA MULTIPLIES WINS',
		es: 'MEDUSA MULTIPLICA LAS GANANCIAS',
		fr: 'MÉDUSE MULTIPLIE LES GAINS',
		id: 'MEDUSA MELIPATGANDAKAN KEMENANGAN',
		ja: 'メデューサが勝利を倍増',
		ko: '메두사가 당첨금을 배로',
		pl: 'MEDUZA MNOŻY WYGRANE',
		pt: 'MEDUSA MULTIPLICA OS GANHOS',
		ru: 'МЕДУЗА УМНОЖАЕТ ВЫИГРЫШИ',
		tr: 'MEDUSA KAZANÇLARI KATLAR',
		vi: 'MEDUSA NHÂN TIỀN THẮNG',
		zh: '梅杜莎讓贏分加倍',
		fi: 'MEDUSA MONINKERTAISTAA VOITOT',
		hi: 'मेडूसा जीत को गुणा करती है',
	},
	// the free game: the running total
	multipliersAddUp: {
		ar: 'المضاعفات تتراكم',
		de: 'MULTIPLIKATOREN ADDIEREN SICH',
		en: 'MULTIPLIERS ADD UP',
		es: 'LOS MULTIPLICADORES SE SUMAN',
		fr: "LES MULTIPLICATEURS S'ADDITIONNENT",
		id: 'PENGGANDA TERUS BERTAMBAH',
		ja: '倍率がどんどん加算',
		ko: '배수가 계속 쌓여요',
		pl: 'MNOŻNIKI SIĘ SUMUJĄ',
		pt: 'OS MULTIPLICADORES SE SOMAM',
		ru: 'МНОЖИТЕЛИ СКЛАДЫВАЮТСЯ',
		tr: 'ÇARPANLAR TOPLANIR',
		vi: 'HỆ SỐ NHÂN CỘNG DỒN',
		zh: '倍率持續累加',
		fi: 'KERTOIMET KASVAVAT',
		hi: 'गुणक जुड़ते जाते हैं',
	},
} as const;

export type BarTextKey = keyof typeof BAR_TEXT;

export const barText = (key: BarTextKey): string => {
	const table = BAR_TEXT[key] as Record<string, string>;
	return table[stateUrlDerived.lang()] ?? table.en;
};
