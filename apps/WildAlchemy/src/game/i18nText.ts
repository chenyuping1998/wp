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
	// Feature panels (SPEC §3.3): CONGRATULATIONS / YOU HAVE WON N FREE SPINS /
	// START on entry; CONGRATULATIONS / YOU HAVE WON <amount> / IN N FREE SPINS /
	// BACK on exit. Both panels run on their own clock and also take a tap.
	congratulations: {
		ar: 'تهانينا', de: 'GLÜCKWUNSCH', en: 'CONGRATULATIONS', es: '¡FELICIDADES!', fr: 'FÉLICITATIONS',
		id: 'SELAMAT', ja: 'おめでとう', ko: '축하합니다', pl: 'GRATULACJE', pt: 'PARABÉNS',
		ru: 'ПОЗДРАВЛЯЕМ', tr: 'TEBRİKLER', vi: 'CHÚC MỪNG', zh: '恭喜', fi: 'ONNITTELUT', hi: 'बधाई हो',
	},
	youHaveWon: {
		ar: 'لقد ربحت', de: 'DU HAST GEWONNEN', en: 'YOU HAVE WON', es: 'HAS GANADO', fr: 'VOUS AVEZ GAGNÉ',
		id: 'ANDA MEMENANGKAN', ja: '獲得', ko: '획득', pl: 'WYGRYWASZ', pt: 'VOCÊ GANHOU',
		ru: 'ВЫ ВЫИГРАЛИ', tr: 'KAZANDINIZ', vi: 'BẠN ĐÃ THẮNG', zh: '您贏得了', fi: 'VOITIT', hi: 'आपने जीता',
	},
	inFreeSpins: {
		ar: 'في {n} لفات مجانية', de: 'IN {n} FREISPIELEN', en: 'IN {n} FREE SPINS', es: 'EN {n} GIROS GRATIS', fr: 'EN {n} TOURS GRATUITS',
		id: 'DALAM {n} PUTARAN GRATIS', ja: 'フリースピン{n}回で', ko: '무료 스핀 {n}회에서', pl: 'W {n} DARMOWYCH SPINACH', pt: 'EM {n} RODADAS GRÁTIS',
		ru: 'ЗА {n} БЕСПЛАТНЫХ ВРАЩЕНИЙ', tr: '{n} ÜCRETSİZ ÇEVİRMEDE', vi: 'TRONG {n} VÒNG QUAY MIỄN PHÍ', zh: '於 {n} 次免費遊戲', fi: '{n} ILMAISKIERROKSELLA', hi: '{n} फ्री स्पिन में',
	},
	start: {
		ar: 'ابدأ', de: 'START', en: 'START', es: 'EMPEZAR', fr: 'DÉMARRER',
		id: 'MULAI', ja: 'スタート', ko: '시작', pl: 'START', pt: 'INICIAR',
		ru: 'СТАРТ', tr: 'BAŞLA', vi: 'BẮT ĐẦU', zh: '開始', fi: 'ALOITA', hi: 'शुरू करें',
	},
	back: {
		ar: 'رجوع', de: 'ZURÜCK', en: 'BACK', es: 'VOLVER', fr: 'RETOUR',
		id: 'KEMBALI', ja: '戻る', ko: '돌아가기', pl: 'WRÓĆ', pt: 'VOLTAR',
		ru: 'НАЗАД', tr: 'GERİ', vi: 'QUAY LẠI', zh: '返回', fi: 'TAKAISIN', hi: 'वापस',
	},
	// Big-win tier titles (Win.svelte), set on the blank title plate at runtime.
	winBig: {
		ar: 'فوز كبير', de: 'GROSSER GEWINN', en: 'BIG WIN', es: 'GRAN GANANCIA', fr: 'GROS GAIN',
		id: 'MENANG BESAR', ja: 'ビッグウィン', ko: '빅 윈', pl: 'DUŻA WYGRANA', pt: 'GRANDE GANHO',
		ru: 'БОЛЬШОЙ ВЫИГРЫШ', tr: 'BÜYÜK KAZANÇ', vi: 'THẮNG LỚN', zh: '大獎', fi: 'ISO VOITTO', hi: 'बड़ी जीत',
	},
	winSuper: {
		ar: 'فوز سوبر', de: 'SUPERGEWINN', en: 'SUPER WIN', es: 'SÚPER GANANCIA', fr: 'SUPER GAIN',
		id: 'MENANG SUPER', ja: 'スーパーウィン', ko: '슈퍼 윈', pl: 'SUPER WYGRANA', pt: 'SUPER GANHO',
		ru: 'СУПЕРВЫИГРЫШ', tr: 'SÜPER KAZANÇ', vi: 'THẮNG SIÊU LỚN', zh: '超級大獎', fi: 'SUPERVOITTO', hi: 'सुपर जीत',
	},
	winMega: {
		ar: 'فوز ضخم', de: 'MEGAGEWINN', en: 'MEGA WIN', es: 'MEGA GANANCIA', fr: 'MÉGA GAIN',
		id: 'MENANG MEGA', ja: 'メガウィン', ko: '메가 윈', pl: 'MEGA WYGRANA', pt: 'MEGA GANHO',
		ru: 'МЕГАВЫИГРЫШ', tr: 'MEGA KAZANÇ', vi: 'THẮNG KHỦNG', zh: '巨獎', fi: 'MEGAVOITTO', hi: 'मेगा जीत',
	},
	winEpic: {
		ar: 'فوز أسطوري', de: 'EPISCHER GEWINN', en: 'EPIC WIN', es: 'GANANCIA ÉPICA', fr: 'GAIN ÉPIQUE',
		id: 'MENANG EPIK', ja: 'エピックウィン', ko: '에픽 윈', pl: 'EPICKA WYGRANA', pt: 'GANHO ÉPICO',
		ru: 'ЭПИЧЕСКИЙ ВЫИГРЫШ', tr: 'EFSANE KAZANÇ', vi: 'THẮNG HUYỀN THOẠI', zh: '史詩大獎', fi: 'EEPPINEN VOITTO', hi: 'महाकाव्य जीत',
	},
	winMax: {
		ar: 'الحد الأقصى للفوز', de: 'MAXIMALGEWINN', en: 'MAX WIN', es: 'GANANCIA MÁXIMA', fr: 'GAIN MAXIMUM',
		id: 'MENANG MAKSIMAL', ja: '最大配当', ko: '최대 당첨', pl: 'MAKSYMALNA WYGRANA', pt: 'GANHO MÁXIMO',
		ru: 'МАКСИМАЛЬНЫЙ ВЫИГРЫШ', tr: 'MAKSİMUM KAZANÇ', vi: 'THẮNG TỐI ĐA', zh: '最高獎金', fi: 'MAKSIMIVOITTO', hi: 'अधिकतम जीत',
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
	// Opening card (IntroFeatures.svelte), 2026-10-10. Social play keeps the
	// card's own English, worded through socialTerms, and never reads these.
	introVolatility: {
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
	introPaylines: {
		ar: '{lines} خط دفع',
		de: '{lines} GEWINNLINIEN',
		en: '{lines} PAYLINES',
		es: '{lines} LÍNEAS DE PAGO',
		fr: '{lines} LIGNES DE PAIEMENT',
		id: '{lines} GARIS PEMBAYARAN',
		ja: '{lines}ペイライン',
		ko: '{lines}개 페이라인',
		pl: '{lines} LINII WYPŁAT',
		pt: '{lines} LINHAS DE PAGAMENTO',
		ru: '{lines} ЛИНИЙ ВЫПЛАТ',
		tr: '{lines} ÖDEME ÇİZGİSİ',
		vi: '{lines} ĐƯỜNG THANH TOÁN',
		zh: '{lines} 條賠付線',
		fi: '{lines} VOITTOLINJAA',
		hi: '{lines} पेलाइन',
	},
	introMaxWin: {
		ar: 'أقصى ربح {max}×',
		de: 'MAX. GEWINN {max}×',
		en: 'MAX WIN {max}×',
		es: 'GANANCIA MÁX. {max}×',
		fr: 'GAIN MAX {max}×',
		id: 'MENANG MAKS {max}×',
		ja: '最大配当 {max}×',
		ko: '최대 당첨 {max}×',
		pl: 'MAKS. WYGRANA {max}×',
		pt: 'GANHO MÁX. {max}×',
		ru: 'МАКС. ВЫИГРЫШ {max}×',
		tr: 'MAKS. KAZANÇ {max}×',
		vi: 'THẮNG TỐI ĐA {max}×',
		zh: '最高贏分 {max}×',
		fi: 'MAKSIMIVOITTO {max}×',
		hi: 'अधिकतम जीत {max}×',
	},
	// The four feature panels on the opening card (2026-11-11, Wild Alchemy).
	// Every number is a {placeholder} filled from game/config + game/featureRules,
	// so the card cannot state a figure the maths does not pay. Panel titles come
	// from rulesText (large symbols, WILD conversion), `freeSpins` above, and the
	// rules page's Buy Bonus control name.
	introLarge: {
		ar: 'تظهر الرموز بحجم 1×1 أو 2×2 وتندمج أثناء الدوران في كتل حتى {max}×{max}. تُحتسب كل خانة ظاهرة على الخطوط الـ{lines}.',
		de: 'Symbole landen als 1×1 oder 2×2 und verschmelzen beim Drehen zu Blöcken bis {max}×{max}. Jedes sichtbare Feld zählt auf den {lines} Linien.',
		en: 'Symbols land as 1×1 or 2×2 and merge while the reels spin into blocks up to {max}×{max}. Every visible cell counts on the {lines} lines.',
		es: 'Los símbolos caen como 1×1 o 2×2 y se fusionan al girar en bloques de hasta {max}×{max}. Cada casilla visible cuenta en las {lines} líneas.',
		fr: "Les symboles tombent en 1×1 ou 2×2 et fusionnent pendant la rotation en blocs jusqu'à {max}×{max}. Chaque case visible compte sur les {lines} lignes.",
		id: 'Simbol muncul sebagai 1×1 atau 2×2 dan bergabung saat berputar menjadi blok hingga {max}×{max}. Setiap sel yang terlihat dihitung pada {lines} garis.',
		ja: 'シンボルは1×1か2×2で現れ、回転中に最大{max}×{max}のブロックに合体します。見えている各マスが{lines}本のラインで数えられます。',
		ko: '심벌은 1×1 또는 2×2로 나타나며 회전 중 최대 {max}×{max} 블록으로 합쳐집니다. 보이는 각 칸이 {lines}개 라인에서 계산됩니다.',
		pl: 'Symbole spadają jako 1×1 lub 2×2 i podczas obrotu łączą się w bloki do {max}×{max}. Każde widoczne pole liczy się na {lines} liniach.',
		pt: 'Os símbolos caem como 1×1 ou 2×2 e fundem-se durante o giro em blocos até {max}×{max}. Cada casa visível conta nas {lines} linhas.',
		ru: 'Символы выпадают размером 1×1 или 2×2 и во время вращения сливаются в блоки до {max}×{max}. Каждая видимая клетка учитывается на {lines} линиях.',
		tr: 'Semboller 1×1 veya 2×2 olarak gelir ve dönerken {max}×{max} boyutuna kadar bloklara birleşir. Görünen her hücre {lines} çizgide sayılır.',
		vi: 'Biểu tượng rơi xuống dạng 1×1 hoặc 2×2 và hợp nhất khi quay thành khối tới {max}×{max}. Mỗi ô nhìn thấy đều được tính trên {lines} đường.',
		zh: '符號以 1×1 或 2×2 落下，轉動中可合併成最大 {max}×{max} 的大格。每個露出的格子都計入 {lines} 條線。',
		fi: 'Symbolit putoavat kokoa 1×1 tai 2×2 ja yhdistyvät pyöriessään enintään {max}×{max}-lohkoiksi. Jokainen näkyvä ruutu lasketaan {lines} linjalla.',
		hi: 'सिंबल 1×1 या 2×2 में आते हैं और घूमते समय {max}×{max} तक के ब्लॉक में जुड़ जाते हैं। हर दिखने वाला खाना {lines} लाइनों पर गिना जाता है।',
	},
	introWild: {
		ar: 'يحاول الخيميائي تحويل كل شخصية إلى WILD، وتنجح كل محاولة أو تفشل بمفردها. قد يحدث ذلك في اللعب الأساسي ويُحاوَل في كل دورة مجانية.',
		de: 'Der Alchemist versucht, jedes Personensymbol in WILD zu verwandeln – jeder Versuch gelingt oder scheitert einzeln. Im Basisspiel möglich, in jedem Freispiel wird es versucht.',
		en: 'The Alchemist tries to turn each person symbol into WILD — each one succeeds or fails on its own. It can happen on any base spin and is tried on every free spin.',
		es: 'El alquimista intenta convertir cada personaje en WILD; cada intento acierta o falla por separado. Puede ocurrir en el juego base y se intenta en cada giro gratis.',
		fr: "L'alchimiste tente de transformer chaque personnage en WILD ; chaque tentative réussit ou échoue séparément. Possible au jeu de base, tentée à chaque tour gratuit.",
		id: 'Alkemis mencoba mengubah setiap tokoh menjadi WILD; setiap percobaan berhasil atau gagal sendiri-sendiri. Bisa terjadi di permainan dasar dan dicoba di setiap putaran gratis.',
		ja: '錬金術師が各人物をWILDに変えようとします。成否は人物ごとに決まります。通常ゲームでも発生し、フリースピンでは毎回試みます。',
		ko: '연금술사가 인물마다 WILD 변환을 시도하며, 성공과 실패는 각각 정해집니다. 기본 게임에서도 일어나며 무료 스핀마다 항상 시도합니다.',
		pl: 'Alchemik próbuje zmienić każdą postać w WILD; każda próba udaje się lub nie osobno. Może się to zdarzyć w grze podstawowej, a w każdym darmowym obrocie jest próbowane.',
		pt: 'O alquimista tenta converter cada personagem em WILD; cada tentativa tem sucesso ou falha por si. Pode acontecer no jogo base e é tentado em cada rodada grátis.',
		ru: 'Алхимик пытается превратить каждого персонажа в WILD; каждая попытка удаётся или нет отдельно. Возможно в основной игре, в каждом бесплатном вращении — обязательно.',
		tr: 'Simyacı her karakteri WILD yapmayı dener; her deneme ayrı ayrı başarılı ya da başarısız olur. Ana oyunda olabilir, her ücretsiz dönüşte mutlaka denenir.',
		vi: 'Nhà giả kim thử biến từng nhân vật thành WILD; mỗi lần thử thành công hoặc thất bại riêng. Có thể xảy ra ở trò chơi cơ bản và luôn được thử ở mỗi lượt miễn phí.',
		zh: '煉金術士會嘗試把每個人物符號轉成 WILD，各自成功或失敗。主遊戲有機會發生，免費遊戲每局必定嘗試。',
		fi: 'Alkemisti yrittää muuttaa jokaisen hahmon WILD-symboliksi; kukin yritys onnistuu tai epäonnistuu erikseen. Mahdollinen peruspelissä, yritetään jokaisella ilmaiskierroksella.',
		hi: 'कीमियागर हर पात्र को WILD बनाने की कोशिश करता है; हर कोशिश अलग से सफल या असफल होती है। बेस गेम में हो सकता है और हर फ्री स्पिन में कोशिश होती है।',
	},
	introFree: {
		ar: 'تمنح {cells} خانات Scatter ظاهرة أو أكثر {fs} دورات مجانية. كل خانة WILD تساوي نقطة واحدة، وكل {pts} نقطة ترفع المضاعف {ladder} وتضيف {plus} دورات.',
		de: 'Ab {cells} sichtbaren Scatter-Feldern gibt es {fs} Freispiele. Jedes WILD-Feld ist 1 Punkt; je {pts} Punkte steigt der Multiplikator {ladder} und es gibt {plus} Freispiele dazu.',
		en: '{cells} or more visible Scatter cells award {fs} free spins. Each WILD cell is 1 point; every {pts} points climb the multiplier {ladder} and add {plus} spins.',
		es: '{cells} o más casillas Scatter visibles otorgan {fs} giros gratis. Cada casilla WILD vale 1 punto; cada {pts} puntos el multiplicador sube {ladder} y se añaden {plus} giros.',
		fr: "{cells} cases Scatter visibles ou plus offrent {fs} tours gratuits. Chaque case WILD vaut 1 point ; tous les {pts} points, le multiplicateur monte {ladder} et {plus} tours s'ajoutent.",
		id: '{cells} sel Scatter terlihat atau lebih memberi {fs} putaran gratis. Setiap sel WILD bernilai 1 poin; setiap {pts} poin pengali naik {ladder} dan menambah {plus} putaran.',
		ja: '見えているScatterが{cells}マス以上でフリースピン{fs}回。WILD1マスにつき1ポイント、{pts}ポイントごとに倍率が{ladder}と上がり、{plus}回追加されます。',
		ko: '보이는 Scatter 칸이 {cells}개 이상이면 무료 스핀 {fs}회. WILD 한 칸당 1점이며 {pts}점마다 배수가 {ladder}로 오르고 {plus}회가 추가됩니다.',
		pl: '{cells} lub więcej widocznych pól Scatter daje {fs} darmowych obrotów. Każde pole WILD to 1 punkt; co {pts} punktów mnożnik rośnie {ladder} i dochodzą {plus} obroty.',
		pt: '{cells} ou mais casas Scatter visíveis dão {fs} rodadas grátis. Cada casa WILD vale 1 ponto; a cada {pts} pontos o multiplicador sobe {ladder} e somam-se {plus} rodadas.',
		ru: '{cells} и более видимых клеток Scatter дают {fs} бесплатных вращений. Каждая клетка WILD — 1 очко; каждые {pts} очков множитель растёт {ladder} и добавляются {plus} вращения.',
		tr: 'Görünen {cells} veya daha fazla Scatter hücresi {fs} ücretsiz dönüş verir. Her WILD hücresi 1 puandır; her {pts} puanda çarpan {ladder} yükselir ve {plus} dönüş eklenir.',
		vi: 'Từ {cells} ô Scatter nhìn thấy trở lên cho {fs} lượt miễn phí. Mỗi ô WILD là 1 điểm; mỗi {pts} điểm hệ số tăng {ladder} và cộng {plus} lượt.',
		zh: '露出 {cells} 格以上 Scatter 獲得 {fs} 局免費遊戲。每格 WILD 得 1 點，每滿 {pts} 點倍數依序升至 {ladder}，並加 {plus} 局。',
		fi: 'Vähintään {cells} näkyvää Scatter-ruutua antaa {fs} ilmaiskierrosta. Jokainen WILD-ruutu on 1 piste; joka {pts} pisteellä kerroin nousee {ladder} ja kierroksia tulee {plus} lisää.',
		hi: '{cells} या अधिक दिखने वाले Scatter खाने {fs} फ्री स्पिन देते हैं। हर WILD खाना 1 अंक है; हर {pts} अंक पर गुणक {ladder} बढ़ता है और {plus} स्पिन जुड़ते हैं।',
	},
	// The Buy panel's title: the bar's own BUY BONUS label in each locale
	// (components-ui-pixi i18n). Kept here because the opening card mounts
	// before Lingui has a locale and cannot ask it.
	introBuyTitle: {
		ar: 'شراء المكافأة', de: 'BONUS KAUFEN', en: 'BUY BONUS', es: 'COMPRAR BONO', fr: 'ACHETER BONUS',
		id: 'BELI BONUS', ja: 'ボーナス購入', ko: '보너스 구매', pl: 'KUP BONUS', pt: 'COMPRAR BÔNUS',
		ru: 'КУПИТЬ БОНУС', tr: 'BONUS SATIN AL', vi: 'MUA THƯỞNG', zh: '購買獎勵', fi: 'OSTA BONUS', hi: 'बोनस खरीदें',
	},
	introBuy: {
		ar: 'FREE GAME مقابل {b1}× من رهانك، أو SUPER FREE GAME مقابل {b2}× ويبدأ عند ×{sm} مع {ss} دورات.',
		de: 'FREE GAME für {b1}× Ihres Einsatzes oder SUPER FREE GAME für {b2}× – Start bei ×{sm} mit {ss} Freispielen.',
		en: 'FREE GAME for {b1}× your bet, or SUPER FREE GAME for {b2}× — it starts at ×{sm} with {ss} spins.',
		es: 'FREE GAME por {b1}× tu apuesta, o SUPER FREE GAME por {b2}×, que empieza en ×{sm} con {ss} giros.',
		fr: 'FREE GAME pour {b1}× votre mise, ou SUPER FREE GAME pour {b2}×, qui démarre à ×{sm} avec {ss} tours.',
		id: 'FREE GAME seharga {b1}× taruhan Anda, atau SUPER FREE GAME seharga {b2}× — dimulai pada ×{sm} dengan {ss} putaran.',
		ja: 'FREE GAMEはベットの{b1}×、SUPER FREE GAMEは{b2}×で、×{sm}・{ss}回から始まります。',
		ko: 'FREE GAME은 베팅의 {b1}×, SUPER FREE GAME은 {b2}×이며 ×{sm}, {ss}회로 시작합니다.',
		pl: 'FREE GAME za {b1}× zakładu albo SUPER FREE GAME za {b2}× — start od ×{sm} z {ss} obrotami.',
		pt: 'FREE GAME por {b1}× a sua aposta, ou SUPER FREE GAME por {b2}×, que começa em ×{sm} com {ss} rodadas.',
		ru: 'FREE GAME за {b1}× ставки или SUPER FREE GAME за {b2}× — старт с ×{sm} и {ss} вращениями.',
		tr: 'FREE GAME bahsinizin {b1}× katına, SUPER FREE GAME ise {b2}× katına — ×{sm} ve {ss} dönüşle başlar.',
		vi: 'FREE GAME với giá {b1}× mức cược, hoặc SUPER FREE GAME với giá {b2}× — bắt đầu ở ×{sm} với {ss} lượt.',
		zh: 'FREE GAME 為押注的 {b1}×，SUPER FREE GAME 為 {b2}×，從 ×{sm}、{ss} 局開始。',
		fi: 'FREE GAME hintaan {b1}× panoksesi tai SUPER FREE GAME hintaan {b2}× – alkaa kertoimesta ×{sm} ja {ss} kierroksella.',
		hi: 'FREE GAME आपके दांव के {b1}× पर, या SUPER FREE GAME {b2}× पर — ×{sm} और {ss} स्पिन से शुरू।',
	},
	introTap: {
		ar: 'انقر للمتابعة',
		de: 'TIPPEN ZUM FORTFAHREN',
		en: 'TAP TO CONTINUE',
		es: 'TOCA PARA CONTINUAR',
		fr: 'TOUCHEZ POUR CONTINUER',
		id: 'KETUK UNTUK LANJUT',
		ja: 'タップして続行',
		ko: '탭하여 계속',
		pl: 'DOTKNIJ, ABY KONTYNUOWAĆ',
		pt: 'TOQUE PARA CONTINUAR',
		ru: 'НАЖМИТЕ, ЧТОБЫ ПРОДОЛЖИТЬ',
		tr: 'DEVAM ETMEK İÇİN DOKUNUN',
		vi: 'CHẠM ĐỂ TIẾP TỤC',
		zh: '點擊繼續',
		fi: 'JATKA NAPAUTTAMALLA',
		hi: 'जारी रखने के लिए टैप करें',
	},
	introLoading: {
		ar: 'جارٍ التحميل…',
		de: 'LÄDT…',
		en: 'LOADING…',
		es: 'CARGANDO…',
		fr: 'CHARGEMENT…',
		id: 'MEMUAT…',
		ja: '読み込み中…',
		ko: '로딩 중…',
		pl: 'ŁADOWANIE…',
		pt: 'CARREGANDO…',
		ru: 'ЗАГРУЗКА…',
		tr: 'YÜKLENİYOR…',
		vi: 'ĐANG TẢI…',
		zh: '載入中…',
		fi: 'LADATAAN…',
		hi: 'लोड हो रहा है…',
	},

	// ── Feature-buy menu (components/ui/ModalBuyBonus.svelte) and its confirm
	// dialog (betModeMeta.ts → shared ModalBuyBonusConfirm), 2026-11-11.
	// Real-money play only: social play is English and keeps socialTerms /
	// betModeMeta's own social wording. Every figure is a {placeholder} filled
	// from game/config + game/featureRules (featureTextVars). FREE GAME and
	// SUPER FREE GAME stay in English in every language, as on the intro card.
	buyMenuTitle: {
		ar: 'اشترِ ميزة', de: 'FEATURE KAUFEN', en: 'BUY A FEATURE', es: 'COMPRA UNA FUNCIÓN', fr: 'ACHETER UNE FONCTION',
		id: 'BELI FITUR', ja: '機能を購入', ko: '기능 구매', pl: 'KUP FUNKCJĘ', pt: 'COMPRAR UM RECURSO',
		ru: 'КУПИТЬ ФУНКЦИЮ', tr: 'ÖZELLİK SATIN AL', vi: 'MUA TÍNH NĂNG', zh: '購買特色遊戲', fi: 'OSTA OMINAISUUS', hi: 'फ़ीचर खरीदें',
	},
	buyMenuLede: {
		ar: 'ادخل مباشرةً إحدى ميزات الدورات المجانية الـ{n} مقابل مضاعف رهانك الظاهر على بطاقتها.',
		de: 'Steigen Sie direkt in eines der {n} Freispiel-Features ein – zum Vielfachen Ihres Einsatzes, das auf seiner Karte steht.',
		en: 'Enter one of the {n} free-spin features directly, for the multiple of your bet shown on its card.',
		es: 'Entra directamente en una de las {n} funciones de giros gratis por el múltiplo de tu apuesta que indica su tarjeta.',
		fr: "Accédez directement à l'une des {n} fonctions de tours gratuits pour le multiple de votre mise indiqué sur sa carte.",
		id: 'Masuk langsung ke salah satu dari {n} fitur putaran gratis dengan kelipatan taruhan yang tertera di kartunya.',
		ja: '{n}種類のフリースピン機能のいずれかに、カードに表示されたベット倍率で直接入れます。',
		ko: '{n}가지 무료 스핀 기능 중 하나에 카드에 표시된 베팅 배수로 바로 들어갑니다.',
		pl: 'Wejdź bezpośrednio do jednej z {n} funkcji darmowych obrotów za wielokrotność zakładu podaną na jej karcie.',
		pt: 'Entre diretamente numa das {n} funcionalidades de rodadas grátis pelo múltiplo da sua aposta indicado no cartão.',
		ru: 'Войдите сразу в одну из {n} функций бесплатных вращений за кратную ставку, указанную на её карточке.',
		tr: '{n} ücretsiz dönüş özelliğinden birine, kartında yazan bahis katıyla doğrudan girin.',
		vi: 'Vào thẳng một trong {n} tính năng lượt quay miễn phí với bội số mức cược ghi trên thẻ.',
		zh: '直接進入 {n} 種免費遊戲之一，費用為卡片上標示的押注倍數。',
		fi: 'Siirry suoraan yhteen {n} ilmaiskierrosominaisuudesta korttiin merkityllä panoksen kerrannaisella.',
		hi: '{n} फ्री स्पिन फ़ीचर में से किसी एक में सीधे प्रवेश करें, उसके कार्ड पर दिखाए गए दांव के गुणक पर।',
	},
	buyButton: {
		ar: 'شراء {cost}×', de: 'KAUFEN {cost}×', en: 'BUY {cost}×', es: 'COMPRAR {cost}×', fr: 'ACHETER {cost}×',
		id: 'BELI {cost}×', ja: '購入 {cost}×', ko: '구매 {cost}×', pl: 'KUP {cost}×', pt: 'COMPRAR {cost}×',
		ru: 'КУПИТЬ {cost}×', tr: 'SATIN AL {cost}×', vi: 'MUA {cost}×', zh: '購買 {cost}×', fi: 'OSTA {cost}×', hi: 'खरीदें {cost}×',
	},
	buyShort: {
		ar: 'الرصيد غير كافٍ لهذه الميزة.', de: 'Guthaben reicht für dieses Feature nicht aus.', en: 'Balance too low for this feature.',
		es: 'Saldo insuficiente para esta función.', fr: 'Solde insuffisant pour cette fonction.', id: 'Saldo tidak cukup untuk fitur ini.',
		ja: '残高が不足しています。', ko: '잔액이 부족합니다.', pl: 'Za niskie saldo na tę funkcję.', pt: 'Saldo insuficiente para este recurso.',
		ru: 'Недостаточно баланса для этой функции.', tr: 'Bu özellik için bakiye yetersiz.', vi: 'Số dư không đủ cho tính năng này.',
		zh: '餘額不足，無法進入此功能。', fi: 'Saldo ei riitä tähän ominaisuuteen.', hi: 'इस फ़ीचर के लिए बैलेंस कम है।',
	},
	buyDialog: {
		ar: 'ادخل {title} مباشرةً مقابل {cost}× رهانك، بنسبة RTP تبلغ {rtp}. {summary} ظهور {cells} خانات أو أكثر من البرج (Scatter) في اللعب الأساسي يفتح الميزة نفسها. أقصى ربح: {max}× رهانك.',
		de: 'Starten Sie {title} direkt für {cost}× Ihres Einsatzes, bei einem RTP von {rtp}. {summary} Ab {cells} sichtbaren Turm-Feldern (Scatter) im Basisspiel startet dasselbe Feature. Maximalgewinn: {max}× Ihres Einsatzes.',
		en: 'Enter the {title} directly for {cost}× your bet, at an RTP of {rtp}. {summary} Landing {cells} or more Tower (Scatter) cells in the base game opens the same feature. Maximum win: {max}× your bet.',
		es: 'Entra en {title} directamente por {cost}× tu apuesta, con un RTP del {rtp}. {summary} Conseguir {cells} o más casillas de Torre (Scatter) en el juego base abre la misma función. Ganancia máxima: {max}× tu apuesta.',
		fr: 'Accédez directement à {title} pour {cost}× votre mise, avec un RTP de {rtp}. {summary} Obtenir {cells} cases Tour (Scatter) ou plus au jeu de base ouvre la même fonction. Gain maximal : {max}× votre mise.',
		id: 'Masuk langsung ke {title} seharga {cost}× taruhan Anda, dengan RTP {rtp}. {summary} Mendapat {cells} sel Menara (Scatter) atau lebih di permainan dasar membuka fitur yang sama. Kemenangan maksimal: {max}× taruhan Anda.',
		ja: '{title}にベットの{cost}×で直接入れます（RTP {rtp}）。{summary}通常ゲームで塔（Scatter）が{cells}マス以上見えると同じ機能が始まります。最大配当はベットの{max}×です。',
		ko: '{title}에 베팅의 {cost}×로 바로 들어갑니다(RTP {rtp}). {summary} 기본 게임에서 탑(Scatter)이 {cells}칸 이상 보이면 같은 기능이 시작됩니다. 최대 당첨: 베팅의 {max}×.',
		pl: 'Wejdź bezpośrednio do {title} za {cost}× zakładu, przy RTP {rtp}. {summary} {cells} lub więcej pól Wieży (Scatter) w grze podstawowej otwiera tę samą funkcję. Maksymalna wygrana: {max}× zakładu.',
		pt: 'Entre diretamente em {title} por {cost}× a sua aposta, com RTP de {rtp}. {summary} Obter {cells} ou mais casas de Torre (Scatter) no jogo base abre a mesma funcionalidade. Ganho máximo: {max}× a sua aposta.',
		ru: 'Войдите в {title} сразу за {cost}× ставки, RTP {rtp}. {summary} {cells} и более клеток Башни (Scatter) в основной игре открывают ту же функцию. Максимальный выигрыш: {max}× ставки.',
		tr: '{title} özelliğine bahsinizin {cost}× katıyla doğrudan girin, RTP {rtp}. {summary} Ana oyunda {cells} veya daha fazla Kule (Scatter) hücresi aynı özelliği açar. Maksimum kazanç: bahsinizin {max}× katı.',
		vi: 'Vào thẳng {title} với giá {cost}× mức cược, RTP {rtp}. {summary} Có từ {cells} ô Tháp (Scatter) trở lên ở trò chơi cơ bản sẽ mở cùng tính năng. Thắng tối đa: {max}× mức cược.',
		zh: '以押注的 {cost}× 直接進入 {title}，RTP 為 {rtp}。{summary}主遊戲露出 {cells} 格以上煉金塔（Scatter）也會開啟同一個功能。最高贏分：押注的 {max}×。',
		fi: 'Siirry suoraan {title} -tilaan hintaan {cost}× panoksesi, RTP {rtp}. {summary} Vähintään {cells} Torni-ruutua (Scatter) peruspelissä avaa saman ominaisuuden. Maksimivoitto: {max}× panoksesi.',
		hi: '{title} में अपने दांव के {cost}× पर सीधे प्रवेश करें, RTP {rtp}। {summary} बेस गेम में {cells} या अधिक मीनार (Scatter) खाने वही फ़ीचर खोलते हैं। अधिकतम जीत: आपके दांव का {max}×।',
	},
	// Leads the buy confirm paragraph: the multiple in the copy below is
	// abstract, this is what leaves the balance (QA 11-11). {amount} is the
	// formatted currency string (two decimals, the currency's own symbol).
	buyTotal: {
		ar: 'التكلفة الإجمالية: {amount}.', de: 'Gesamtkosten: {amount}.', en: 'Total cost: {amount}.', es: 'Coste total: {amount}.',
		fr: 'Coût total : {amount}.', id: 'Total biaya: {amount}.', ja: '合計金額：{amount}。', ko: '총 비용: {amount}.',
		pl: 'Łączny koszt: {amount}.', pt: 'Custo total: {amount}.', ru: 'Общая стоимость: {amount}.', tr: 'Toplam tutar: {amount}.',
		vi: 'Tổng chi phí: {amount}.', zh: '總金額：{amount}。', fi: 'Kokonaishinta: {amount}.', hi: 'कुल लागत: {amount}।',
	},
	buySummaryFree: {
		ar: '{fs} دورات مجانية تبدأ عند ×{m0}. في كل دورة يحاول الخيميائي تحويل كل شخصية إلى WILD؛ كل خانة WILD محوَّلة نقطة، وكل {pts} نقطة ترفع المضاعف ({ladder}) وتضيف {plus} دورات.',
		de: '{fs} Freispiele ab ×{m0}. In jedem Spin versucht der Alchemist, jedes Personensymbol in WILD zu verwandeln; jedes verwandelte WILD-Feld ist ein Punkt, und je {pts} Punkte steigt der Multiplikator ({ladder}) und es gibt {plus} Freispiele dazu.',
		en: '{fs} free spins starting at ×{m0}. Every spin the Alchemist tries to turn each person symbol into WILD; every converted WILD cell is a point, and every {pts} points raise the multiplier ({ladder}) and add {plus} spins.',
		es: '{fs} giros gratis desde ×{m0}. En cada giro el alquimista intenta convertir cada personaje en WILD; cada casilla WILD convertida es un punto, y cada {pts} puntos el multiplicador sube ({ladder}) y se añaden {plus} giros.',
		fr: "{fs} tours gratuits à partir de ×{m0}. À chaque tour, l'alchimiste tente de transformer chaque personnage en WILD ; chaque case WILD transformée vaut un point, et tous les {pts} points le multiplicateur monte ({ladder}) et {plus} tours s'ajoutent.",
		id: '{fs} putaran gratis mulai dari ×{m0}. Setiap putaran Alkemis mencoba mengubah setiap tokoh menjadi WILD; setiap sel WILD hasil konversi bernilai satu poin, dan setiap {pts} poin pengali naik ({ladder}) dan menambah {plus} putaran.',
		ja: '×{m0}でフリースピン{fs}回。毎回、錬金術師が各人物をWILDに変えようとします。変換されたWILD1マスが1ポイントで、{pts}ポイントごとに倍率が上がり（{ladder}）、{plus}回追加されます。',
		ko: '×{m0}에서 무료 스핀 {fs}회. 매 회전 연금술사가 인물마다 WILD 변환을 시도합니다. 변환된 WILD 한 칸이 1점이며, {pts}점마다 배수가 오르고({ladder}) {plus}회가 추가됩니다.',
		pl: '{fs} darmowych obrotów od ×{m0}. W każdym obrocie alchemik próbuje zmienić każdą postać w WILD; każde przemienione pole WILD to punkt, a co {pts} punktów mnożnik rośnie ({ladder}) i dochodzą {plus} obroty.',
		pt: '{fs} rodadas grátis a partir de ×{m0}. Em cada rodada o alquimista tenta converter cada personagem em WILD; cada casa WILD convertida vale um ponto, e a cada {pts} pontos o multiplicador sobe ({ladder}) e somam-se {plus} rodadas.',
		ru: '{fs} бесплатных вращений с ×{m0}. В каждом вращении алхимик пытается превратить каждого персонажа в WILD; каждая превращённая клетка WILD — очко, каждые {pts} очков повышают множитель ({ladder}) и добавляют {plus} вращения.',
		tr: '×{m0} ile başlayan {fs} ücretsiz dönüş. Her dönüşte Simyacı her karakteri WILD yapmayı dener; dönüşen her WILD hücresi bir puandır ve her {pts} puan çarpanı yükseltir ({ladder}) ve {plus} dönüş ekler.',
		vi: '{fs} lượt miễn phí bắt đầu ở ×{m0}. Mỗi lượt, Nhà giả kim thử biến từng nhân vật thành WILD; mỗi ô WILD được chuyển là một điểm, và mỗi {pts} điểm nâng hệ số ({ladder}) và cộng {plus} lượt.',
		zh: '從 ×{m0} 開始，共 {fs} 局免費遊戲。每局煉金術士都會嘗試把人物符號轉成 WILD；每格轉換出的 WILD 得 1 點，每滿 {pts} 點倍數升一階（{ladder}）並加 {plus} 局。',
		fi: '{fs} ilmaiskierrosta alkaen ×{m0}. Joka kierroksella alkemisti yrittää muuttaa jokaisen hahmon WILD-symboliksi; jokainen muunnettu WILD-ruutu on piste, ja joka {pts} pisteellä kerroin nousee ({ladder}) ja kierroksia tulee {plus} lisää.',
		hi: '×{m0} से शुरू होने वाले {fs} फ्री स्पिन। हर स्पिन में कीमियागर हर पात्र को WILD बनाने की कोशिश करता है; हर बदला हुआ WILD खाना एक अंक है, और हर {pts} अंक पर गुणक बढ़ता है ({ladder}) और {plus} स्पिन जुड़ते हैं।',
	},
	buySummarySuper: {
		ar: 'الميزة نفسها مفتوحةً بدرجة أعلى على السلّم: {ss} دورات مجانية تبدأ عند ×{sm} (مع {pts} نقطة مجمَّعة مسبقاً).',
		de: 'Dasselbe Feature, eine Stufe höher gestartet: {ss} Freispiele ab ×{sm} ({pts} Punkte bereits gesammelt).',
		en: 'The same feature, opened one step up the ladder: {ss} free spins starting at ×{sm} ({pts} points already collected).',
		es: 'La misma función, un escalón más arriba: {ss} giros gratis desde ×{sm} ({pts} puntos ya acumulados).',
		fr: 'La même fonction, ouverte un palier plus haut : {ss} tours gratuits à partir de ×{sm} ({pts} points déjà acquis).',
		id: 'Fitur yang sama, dibuka satu tingkat lebih tinggi: {ss} putaran gratis mulai dari ×{sm} ({pts} poin sudah terkumpul).',
		ja: '同じ機能を1段上から開始：×{sm}でフリースピン{ss}回（{pts}ポイント獲得済み）。',
		ko: '같은 기능을 한 단계 위에서 시작합니다: ×{sm}에서 무료 스핀 {ss}회({pts}점 보유).',
		pl: 'Ta sama funkcja, otwarta stopień wyżej: {ss} darmowych obrotów od ×{sm} ({pts} punktów już zebranych).',
		pt: 'A mesma funcionalidade, aberta um degrau acima: {ss} rodadas grátis a partir de ×{sm} ({pts} pontos já acumulados).',
		ru: 'Та же функция, но на ступень выше: {ss} бесплатных вращений с ×{sm} ({pts} очков уже собрано).',
		tr: 'Aynı özellik, bir basamak yukarıdan başlar: ×{sm} ile {ss} ücretsiz dönüş ({pts} puan önceden toplanmış).',
		vi: 'Cùng tính năng, mở cao hơn một bậc: {ss} lượt miễn phí bắt đầu ở ×{sm} (đã có sẵn {pts} điểm).',
		zh: '同一個功能，從高一階開始：×{sm}、{ss} 局免費遊戲（預存 {pts} 點）。',
		fi: 'Sama ominaisuus yhden portaan korkeammalta: {ss} ilmaiskierrosta alkaen ×{sm} ({pts} pistettä valmiina).',
		hi: 'वही फ़ीचर, एक सीढ़ी ऊपर से: ×{sm} से शुरू होने वाले {ss} फ्री स्पिन ({pts} अंक पहले से जमा)।',
	},

	// ── Replay start card (components/ui/ReplayIntro.svelte). Social play keeps
	// the card's own English with Stake.US naming.
	replayBadge: {
		ar: 'إعادة', de: 'WIEDERGABE', en: 'REPLAY', es: 'REPETICIÓN', fr: 'RELECTURE',
		id: 'TAYANGAN ULANG', ja: 'リプレイ', ko: '리플레이', pl: 'POWTÓRKA', pt: 'REPETIÇÃO',
		ru: 'ПОВТОР', tr: 'TEKRAR', vi: 'PHÁT LẠI', zh: '重播', fi: 'UUSINTA', hi: 'रीप्ले',
	},
	replayTitle: {
		ar: 'إعادة جولة رهان', de: 'Einsatz-Wiedergabe', en: 'Bet Replay', es: 'Repetición de apuesta', fr: 'Relecture de la mise',
		id: 'Tayangan Ulang Taruhan', ja: 'ベットのリプレイ', ko: '베팅 리플레이', pl: 'Powtórka zakładu', pt: 'Repetição da aposta',
		ru: 'Повтор ставки', tr: 'Bahis Tekrarı', vi: 'Phát lại lượt cược', zh: '押注重播', fi: 'Panoksen uusinta', hi: 'दांव रीप्ले',
	},
	replayMode: {
		ar: 'الوضع', de: 'Modus', en: 'Mode', es: 'Modo', fr: 'Mode', id: 'Mode', ja: 'モード', ko: '모드',
		pl: 'Tryb', pt: 'Modo', ru: 'Режим', tr: 'Mod', vi: 'Chế độ', zh: '模式', fi: 'Tila', hi: 'मोड',
	},
	replayBaseBet: {
		ar: 'الرهان الأساسي', de: 'Grundeinsatz', en: 'Base Bet', es: 'Apuesta base', fr: 'Mise de base',
		id: 'Taruhan Dasar', ja: '基本ベット', ko: '기본 베팅', pl: 'Zakład podstawowy', pt: 'Aposta base',
		ru: 'Базовая ставка', tr: 'Temel Bahis', vi: 'Cược cơ bản', zh: '基本押注', fi: 'Peruspanos', hi: 'बेस दांव',
	},
	replayCostMult: {
		ar: 'مضاعف التكلفة', de: 'Kostenmultiplikator', en: 'Cost Multiplier', es: 'Multiplicador de coste', fr: 'Multiplicateur de coût',
		id: 'Pengali Biaya', ja: 'コスト倍率', ko: '비용 배수', pl: 'Mnożnik kosztu', pt: 'Multiplicador de custo',
		ru: 'Множитель стоимости', tr: 'Maliyet Çarpanı', vi: 'Hệ số chi phí', zh: '費用倍數', fi: 'Hintakerroin', hi: 'लागत गुणक',
	},
	replayTotalCost: {
		ar: 'إجمالي تكلفة الرهان', de: 'Gesamtkosten', en: 'Total Bet Cost', es: 'Coste total de la apuesta', fr: 'Coût total de la mise',
		id: 'Total Biaya Taruhan', ja: 'ベット総額', ko: '총 베팅 비용', pl: 'Łączny koszt zakładu', pt: 'Custo total da aposta',
		ru: 'Общая стоимость ставки', tr: 'Toplam Bahis Tutarı', vi: 'Tổng chi phí cược', zh: '押注總費用', fi: 'Panoksen kokonaishinta', hi: 'कुल दांव लागत',
	},
	replayPayoutMult: {
		ar: 'مضاعف الدفع', de: 'Auszahlungsmultiplikator', en: 'Payout Multiplier', es: 'Multiplicador de pago', fr: 'Multiplicateur de gain',
		id: 'Pengali Pembayaran', ja: '配当倍率', ko: '지급 배수', pl: 'Mnożnik wypłaty', pt: 'Multiplicador de pagamento',
		ru: 'Множитель выплаты', tr: 'Ödeme Çarpanı', vi: 'Hệ số trả thưởng', zh: '派彩倍數', fi: 'Voittokerroin', hi: 'भुगतान गुणक',
	},
	replayTotalWin: {
		ar: 'إجمالي الربح', de: 'Gesamtgewinn', en: 'Total Win', es: 'Ganancia total', fr: 'Gain total',
		id: 'Total Kemenangan', ja: '合計勝利金', ko: '총 상금', pl: 'Łączna wygrana', pt: 'Ganho total',
		ru: 'Общий выигрыш', tr: 'Toplam Kazanç', vi: 'Tổng thắng', zh: '總贏分', fi: 'Kokonaisvoitto', hi: 'कुल जीत',
	},
	replayStart: {
		ar: 'بدء الإعادة', de: 'Wiedergabe starten', en: 'Start Replay', es: 'Iniciar repetición', fr: 'Lancer la relecture',
		id: 'Mulai Tayangan Ulang', ja: 'リプレイ開始', ko: '리플레이 시작', pl: 'Rozpocznij powtórkę', pt: 'Iniciar repetição',
		ru: 'Начать повтор', tr: 'Tekrarı Başlat', vi: 'Bắt đầu phát lại', zh: '開始重播', fi: 'Aloita uusinta', hi: 'रीप्ले शुरू करें',
	},
	replayFoot: {
		ar: 'هذه إعادة لجولة رهان سابقة. لن يُوضع أي رهان.',
		de: 'Dies ist die Wiedergabe einer früheren Einsatzrunde. Es werden keine Einsätze platziert.',
		en: 'This is a replay of a previous bet round. No bets will be placed.',
		es: 'Esta es la repetición de una ronda de apuesta anterior. No se realizará ninguna apuesta.',
		fr: "Ceci est la relecture d'une manche précédente. Aucune mise ne sera placée.",
		id: 'Ini adalah tayangan ulang ronde taruhan sebelumnya. Tidak ada taruhan yang dipasang.',
		ja: 'これは過去のベットラウンドのリプレイです。ベットは行われません。',
		ko: '이전 베팅 라운드의 리플레이입니다. 베팅은 이루어지지 않습니다.',
		pl: 'To powtórka wcześniejszej rundy. Żadne zakłady nie zostaną postawione.',
		pt: 'Esta é a repetição de uma ronda de aposta anterior. Nenhuma aposta será feita.',
		ru: 'Это повтор предыдущего раунда. Ставки не делаются.',
		tr: 'Bu, önceki bir bahis turunun tekrarıdır. Bahis yapılmayacaktır.',
		vi: 'Đây là phát lại một vòng cược trước. Sẽ không có cược nào được đặt.',
		zh: '這是先前押注回合的重播，不會進行任何押注。',
		fi: 'Tämä on uusinta aiemmasta panoskierroksesta. Panoksia ei aseteta.',
		hi: 'यह पिछले दांव राउंड का रीप्ले है। कोई दांव नहीं लगाया जाएगा।',
	},
	modeBase: {
		ar: 'اللعبة الأساسية', de: 'Basisspiel', en: 'Base Game', es: 'Juego base', fr: 'Jeu de base',
		id: 'Permainan Dasar', ja: '通常ゲーム', ko: '기본 게임', pl: 'Gra podstawowa', pt: 'Jogo base',
		ru: 'Основная игра', tr: 'Ana Oyun', vi: 'Trò chơi cơ bản', zh: '主遊戲', fi: 'Peruspeli', hi: 'बेस गेम',
	},

	// ── Pixi loading screen (components/LoadingScreen.svelte): the line under
	// the logo, the progress label and the cycling tips. No restricted words, so
	// social play (English) reads the en entries as they are.
	loadLines: {
		ar: '{lines} خطاً', de: '{lines} LINIEN', en: '{lines} LINES', es: '{lines} LÍNEAS', fr: '{lines} LIGNES',
		id: '{lines} GARIS', ja: '{lines}ライン', ko: '{lines}라인', pl: '{lines} LINII', pt: '{lines} LINHAS',
		ru: '{lines} ЛИНИЙ', tr: '{lines} ÇİZGİ', vi: '{lines} ĐƯỜNG', zh: '{lines} 線', fi: '{lines} LINJAA', hi: '{lines} लाइनें',
	},
	loadProgress: {
		ar: 'جارٍ التحميل {pct}%', de: 'LÄDT {pct}%', en: 'LOADING {pct}%', es: 'CARGANDO {pct}%', fr: 'CHARGEMENT {pct}%',
		id: 'MEMUAT {pct}%', ja: '読み込み中 {pct}%', ko: '로딩 중 {pct}%', pl: 'ŁADOWANIE {pct}%', pt: 'CARREGANDO {pct}%',
		ru: 'ЗАГРУЗКА {pct}%', tr: 'YÜKLENİYOR %{pct}', vi: 'ĐANG TẢI {pct}%', zh: '載入中 {pct}%', fi: 'LADATAAN {pct}%', hi: 'लोड हो रहा है {pct}%',
	},
	tipGrid: {
		ar: 'شبكة {grid} — {lines} خطاً ثابتاً', de: '{grid}-RASTER – {lines} FESTE LINIEN', en: '{grid} GRID — {lines} FIXED LINES',
		es: 'CUADRÍCULA {grid} — {lines} LÍNEAS FIJAS', fr: 'GRILLE {grid} — {lines} LIGNES FIXES', id: 'KISI {grid} — {lines} GARIS TETAP',
		ja: '{grid}盤面・固定{lines}ライン', ko: '{grid} 화면 — 고정 {lines}라인', pl: 'SIATKA {grid} — {lines} STAŁYCH LINII',
		pt: 'GRELHA {grid} — {lines} LINHAS FIXAS', ru: 'ПОЛЕ {grid} — {lines} ФИКСИРОВАННЫХ ЛИНИЙ', tr: '{grid} IZGARA — {lines} SABİT ÇİZGİ',
		vi: 'LƯỚI {grid} — {lines} ĐƯỜNG CỐ ĐỊNH', zh: '{grid} 盤面，{lines} 條固定線', fi: '{grid}-RUUDUKKO — {lines} KIINTEÄÄ LINJAA', hi: '{grid} ग्रिड — {lines} तय लाइनें',
	},
	tipLarge: {
		ar: 'تُحتسب الرموز الكبيرة بكل خانة ظاهرة منها', de: 'GROSSE SYMBOLE ZÄHLEN MIT JEDEM SICHTBAREN FELD',
		en: 'LARGE SYMBOLS COUNT AS EVERY VISIBLE CELL', es: 'LOS SÍMBOLOS GRANDES CUENTAN CADA CASILLA VISIBLE',
		fr: 'LES GRANDS SYMBOLES COMPTENT CHAQUE CASE VISIBLE', id: 'SIMBOL BESAR DIHITUNG PER SEL YANG TERLIHAT',
		ja: '大型シンボルは見えている全マスで数えます', ko: '대형 심벌은 보이는 칸마다 계산됩니다',
		pl: 'DUŻE SYMBOLE LICZĄ SIĘ KAŻDYM WIDOCZNYM POLEM', pt: 'SÍMBOLOS GRANDES CONTAM CADA CASA VISÍVEL',
		ru: 'КРУПНЫЕ СИМВОЛЫ СЧИТАЮТСЯ ПО КАЖДОЙ ВИДИМОЙ КЛЕТКЕ', tr: 'BÜYÜK SEMBOLLER GÖRÜNEN HER HÜCREYLE SAYILIR',
		vi: 'BIỂU TƯỢNG LỚN ĐƯỢC TÍNH THEO MỖI Ô NHÌN THẤY', zh: '大格符號的每個露出格子都計算',
		fi: 'SUURET SYMBOLIT LASKETAAN JOKAISELLA NÄKYVÄLLÄ RUUDULLA', hi: 'बड़े सिंबल का हर दिखने वाला खाना गिना जाता है',
	},
	tipWild: {
		ar: 'يستطيع الخيميائي تحويل رموز الشخصيات إلى WILD', de: 'DER ALCHEMIST KANN PERSONENSYMBOLE IN WILD VERWANDELN',
		en: 'THE ALCHEMIST CAN TURN PERSON SYMBOLS INTO WILD', es: 'EL ALQUIMISTA PUEDE CONVERTIR PERSONAJES EN WILD',
		fr: "L'ALCHIMISTE PEUT TRANSFORMER LES PERSONNAGES EN WILD", id: 'ALKEMIS DAPAT MENGUBAH SIMBOL TOKOH MENJADI WILD',
		ja: '錬金術師が人物シンボルをWILDに変えることがあります', ko: '연금술사가 인물 심벌을 WILD로 바꿀 수 있습니다',
		pl: 'ALCHEMIK MOŻE ZMIENIĆ POSTACIE W WILD', pt: 'O ALQUIMISTA PODE CONVERTER PERSONAGENS EM WILD',
		ru: 'АЛХИМИК МОЖЕТ ПРЕВРАТИТЬ ПЕРСОНАЖЕЙ В WILD', tr: 'SİMYACI KARAKTER SEMBOLLERİNİ WILD YAPABİLİR',
		vi: 'NHÀ GIẢ KIM CÓ THỂ BIẾN NHÂN VẬT THÀNH WILD', zh: '煉金術士可把人物符號轉成 WILD',
		fi: 'ALKEMISTI VOI MUUTTAA HAHMOT WILD-SYMBOLEIKSI', hi: 'कीमियागर पात्र सिंबल को WILD बना सकता है',
	},
	tipScatter: {
		ar: '{cells} خانات Scatter ظاهرة أو أكثر تمنح {fs} دورات مجانية', de: 'AB {cells} SICHTBAREN SCATTER-FELDERN: {fs} FREISPIELE',
		en: '{cells} OR MORE VISIBLE SCATTER CELLS AWARD {fs} FREE SPINS', es: '{cells} O MÁS CASILLAS SCATTER VISIBLES DAN {fs} GIROS GRATIS',
		fr: '{cells} CASES SCATTER VISIBLES OU PLUS : {fs} TOURS GRATUITS', id: '{cells} SEL SCATTER TERLIHAT ATAU LEBIH MEMBERI {fs} PUTARAN GRATIS',
		ja: 'Scatterが{cells}マス以上見えるとフリースピン{fs}回', ko: 'Scatter가 {cells}칸 이상 보이면 무료 스핀 {fs}회',
		pl: '{cells} LUB WIĘCEJ WIDOCZNYCH PÓL SCATTER DAJE {fs} DARMOWYCH OBROTÓW', pt: '{cells} OU MAIS CASAS SCATTER VISÍVEIS DÃO {fs} RODADAS GRÁTIS',
		ru: '{cells} И БОЛЕЕ ВИДИМЫХ КЛЕТОК SCATTER ДАЮТ {fs} БЕСПЛАТНЫХ ВРАЩЕНИЙ', tr: '{cells} VEYA DAHA FAZLA GÖRÜNÜR SCATTER HÜCRESİ {fs} ÜCRETSİZ DÖNÜŞ VERİR',
		vi: 'TỪ {cells} Ô SCATTER TRỞ LÊN CHO {fs} LƯỢT MIỄN PHÍ', zh: '露出 {cells} 格以上 Scatter 獲得 {fs} 局免費遊戲',
		fi: 'VÄHINTÄÄN {cells} NÄKYVÄÄ SCATTER-RUUTUA ANTAA {fs} ILMAISKIERROSTA', hi: '{cells} या अधिक दिखने वाले Scatter खाने {fs} फ्री स्पिन देते हैं',
	},
	tipPoint: {
		ar: 'كل خانة WILD تجمع نقطة واحدة خلال الدورات المجانية', de: 'JEDES WILD-FELD BRINGT IN FREISPIELEN 1 PUNKT',
		en: 'EACH WILD CELL COLLECTS 1 POINT DURING FREE SPINS', es: 'CADA CASILLA WILD SUMA 1 PUNTO EN LOS GIROS GRATIS',
		fr: 'CHAQUE CASE WILD RAPPORTE 1 POINT PENDANT LES TOURS GRATUITS', id: 'SETIAP SEL WILD MENGUMPULKAN 1 POIN SELAMA PUTARAN GRATIS',
		ja: 'フリースピン中はWILD1マスにつき1ポイント', ko: '무료 스핀 중 WILD 한 칸당 1점',
		pl: 'KAŻDE POLE WILD DAJE 1 PUNKT W DARMOWYCH OBROTACH', pt: 'CADA CASA WILD SOMA 1 PONTO NAS RODADAS GRÁTIS',
		ru: 'КАЖДАЯ КЛЕТКА WILD ДАЁТ 1 ОЧКО В БЕСПЛАТНЫХ ВРАЩЕНИЯХ', tr: 'ÜCRETSİZ DÖNÜŞLERDE HER WILD HÜCRESİ 1 PUAN TOPLAR',
		vi: 'MỖI Ô WILD CỘNG 1 ĐIỂM TRONG LƯỢT MIỄN PHÍ', zh: '免費遊戲中每格 WILD 得 1 點',
		fi: 'JOKAINEN WILD-RUUTU ANTAA 1 PISTEEN ILMAISKIERROKSILLA', hi: 'फ्री स्पिन में हर WILD खाना 1 अंक देता है',
	},
	tipStep: {
		ar: 'كل {pts} نقطة: درجة مضاعف أعلى و{plus} دورات إضافية', de: 'JE {pts} PUNKTE: NÄCHSTE MULTIPLIKATORSTUFE UND {plus} FREISPIELE MEHR',
		en: 'EVERY {pts} POINTS: MULTIPLIER STEP AND {plus} MORE SPINS', es: 'CADA {pts} PUNTOS: SUBE EL MULTIPLICADOR Y {plus} GIROS MÁS',
		fr: 'TOUS LES {pts} POINTS : MULTIPLICATEUR SUPÉRIEUR ET {plus} TOURS DE PLUS', id: 'SETIAP {pts} POIN: PENGALI NAIK DAN {plus} PUTARAN LAGI',
		ja: '{pts}ポイントごとに倍率アップ＋{plus}回', ko: '{pts}점마다 배수 상승 + {plus}회',
		pl: 'CO {pts} PUNKTÓW: WYŻSZY MNOŻNIK I {plus} OBROTY WIĘCEJ', pt: 'A CADA {pts} PONTOS: MULTIPLICADOR SOBE E MAIS {plus} RODADAS',
		ru: 'КАЖДЫЕ {pts} ОЧКОВ: МНОЖИТЕЛЬ ВЫШЕ И ЕЩЁ {plus} ВРАЩЕНИЯ', tr: 'HER {pts} PUANDA: ÇARPAN YÜKSELİR VE {plus} DÖNÜŞ DAHA',
		vi: 'MỖI {pts} ĐIỂM: TĂNG HỆ SỐ VÀ THÊM {plus} LƯỢT', zh: '每 {pts} 點：倍數升一階並加 {plus} 局',
		fi: 'JOKA {pts} PISTEELLÄ: KERROIN NOUSEE JA {plus} KIERROSTA LISÄÄ', hi: 'हर {pts} अंक पर: गुणक बढ़ता है और {plus} स्पिन और',
	},
	// Settings volume toggles (components/ui/ModalSettingsSound.svelte).
	soundOn: {
		ar: 'تشغيل', de: 'AN', en: 'ON', es: 'SÍ', fr: 'OUI', id: 'NYALA', ja: 'オン', ko: '켜짐',
		pl: 'WŁ.', pt: 'LIG.', ru: 'ВКЛ', tr: 'AÇIK', vi: 'BẬT', zh: '開', fi: 'PÄÄLLÄ', hi: 'चालू',
	},
	soundOff: {
		ar: 'إيقاف', de: 'AUS', en: 'OFF', es: 'NO', fr: 'NON', id: 'MATI', ja: 'オフ', ko: '꺼짐',
		pl: 'WYŁ.', pt: 'DESL.', ru: 'ВЫКЛ', tr: 'KAPALI', vi: 'TẮT', zh: '關', fi: 'POIS', hi: 'बंद',
	},
	// The notification panel's (ModalMessage) dismiss button.
	msgOk: {
		ar: 'حسنًا', de: 'OK', en: 'OK', es: 'ACEPTAR', fr: 'OK', id: 'OKE', ja: 'OK', ko: '확인',
		pl: 'OK', pt: 'OK', ru: 'ОК', tr: 'TAMAM', vi: 'ĐỒNG Ý', zh: '確定', fi: 'OK', hi: 'ठीक है',
	},
	// The stake list bar v3 opens beside its BET box (ui/InlineBetMenu.svelte).
	// Social play reads socialTerms-safe English there instead of betBase/betTotal.
	betBase: {
		ar: 'الرهان الأساسي', de: 'GRUNDEINSATZ', en: 'BASE BET', es: 'APUESTA BASE', fr: 'MISE DE BASE',
		id: 'TARUHAN DASAR', ja: '基本ベット', ko: '기본 베팅', pl: 'ZAKŁAD PODSTAWOWY', pt: 'APOSTA BASE',
		ru: 'БАЗОВАЯ СТАВКА', tr: 'TEMEL BAHİS', vi: 'CƯỢC CƠ BẢN', zh: '基本投注', fi: 'PERUSPANOS', hi: 'मूल दांव',
	},
	betTotal: {
		ar: 'الإجمالي لكل دورة', de: 'GESAMT PRO SPIN', en: 'TOTAL PER SPIN', es: 'TOTAL POR GIRO', fr: 'TOTAL PAR TOUR',
		id: 'TOTAL PER PUTARAN', ja: '1スピンあたりの合計', ko: '스핀당 합계', pl: 'ŁĄCZNIE NA OBRÓT', pt: 'TOTAL POR RODADA',
		ru: 'ИТОГО ЗА ВРАЩЕНИЕ', tr: 'DÖNÜŞ BAŞINA TOPLAM', vi: 'TỔNG MỖI LƯỢT QUAY', zh: '每局合計', fi: 'YHTEENSÄ PER KIERROS', hi: 'प्रति स्पिन कुल',
	},
	betScroll: {
		ar: 'مرّر لعرض المزيد', de: 'FÜR MEHR SCROLLEN', en: 'SCROLL FOR MORE', es: 'DESLIZA PARA VER MÁS', fr: 'FAITES DÉFILER POUR PLUS',
		id: 'GULIR UNTUK LAINNYA', ja: 'スクロールで他を表示', ko: '스크롤하여 더 보기', pl: 'PRZEWIŃ, ABY ZOBACZYĆ WIĘCEJ', pt: 'ROLE PARA VER MAIS',
		ru: 'ПРОКРУТИТЕ, ЧТОБЫ УВИДЕТЬ ЕЩЁ', tr: 'DAHA FAZLASI İÇİN KAYDIRIN', vi: 'CUỘN ĐỂ XEM THÊM', zh: '捲動查看更多', fi: 'VIERITÄ NÄHDÄKSESI LISÄÄ', hi: 'और देखने के लिए स्क्रॉल करें',
	},
	betDone: {
		ar: 'تم', de: 'FERTIG', en: 'DONE', es: 'LISTO', fr: 'TERMINÉ', id: 'SELESAI', ja: '完了', ko: '완료',
		pl: 'GOTOWE', pt: 'CONCLUÍDO', ru: 'ГОТОВО', tr: 'TAMAM', vi: 'XONG', zh: '完成', fi: 'VALMIS', hi: 'हो गया',
	},
	// aria-label on the panel's × (screen readers; not drawn)
	close: {
		ar: 'إغلاق', de: 'Schließen', en: 'Close', es: 'Cerrar', fr: 'Fermer', id: 'Tutup', ja: '閉じる', ko: '닫기',
		pl: 'Zamknij', pt: 'Fechar', ru: 'Закрыть', tr: 'Kapat', vi: 'Đóng', zh: '關閉', fi: 'Sulje', hi: 'बंद करें',
	},
	tipLadder: {
		ar: 'المضاعفات: {ladder}', de: 'MULTIPLIKATOREN: {ladder}', en: 'MULTIPLIERS: {ladder}', es: 'MULTIPLICADORES: {ladder}',
		fr: 'MULTIPLICATEURS : {ladder}', id: 'PENGALI: {ladder}', ja: '倍率：{ladder}', ko: '배수: {ladder}',
		pl: 'MNOŻNIKI: {ladder}', pt: 'MULTIPLICADORES: {ladder}', ru: 'МНОЖИТЕЛИ: {ladder}', tr: 'ÇARPANLAR: {ladder}',
		vi: 'HỆ SỐ: {ladder}', zh: '倍數：{ladder}', fi: 'KERTOIMET: {ladder}', hi: 'गुणक: {ladder}',
	},
} as const;

type TextKey = keyof typeof TEXTS;

// `{name}` placeholders are filled from `vars`, so numbers that come from the
// maths config (buy costs, max win, line count) stay out of the translations.
export const gameText = (key: TextKey, vars?: Record<string, string | number>): string => {
	const table = TEXTS[key] as Record<string, string>;
	const text = table[stateUrlDerived.lang()] ?? table.en;
	return vars ? text.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m)) : text;
};

/**
 * Pixi Text draws on a canvas whose base direction is the page's (left to
 * right), so an Arabic line is wrapped in a right-to-left isolate
 * (U+2067…U+2069) to lay out as one right-to-left paragraph.
 */
export const canvasLine = (text: string): string =>
	stateUrlDerived.lang() === 'ar' ? `\u2067${text}\u2069` : text;

/**
 * Letter-spacing makes the canvas draw glyph by glyph: Arabic and Devanagari
 * lose their joins (and Arabic its order — the loading prompt rendered
 * reversed and unjoined), CJK just gaps. Tracked caps stay for Latin/Cyrillic.
 */
export const trackingFor = (spacing: number): number =>
	['ar', 'hi', 'ja', 'ko', 'zh'].includes(stateUrlDerived.lang()) ? 0 : spacing;
