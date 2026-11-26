/**
 * Development-only deterministic dining catalog (Baku). Dynamically imported in
 * mock mode only. Everything is derived from seeded PRNGs and fixed anchor
 * dates, never Date.now(), so output is stable across runs.
 * Photos: Unsplash CDN, each id checked for HTTP 200 and visually matched to the
 * dish or venue it is used for.
 */
import type {
  Allergen,
  Aspect,
  Catalog,
  CatalogDish,
  CatalogLanguage,
  Cuisine,
  DirectoryEntry,
  Ingredient,
  RatingSummary,
  Review,
} from '@/services/contracts/restaurant-catalog';
import { mockRestaurants } from './fixtures';

type L3 = [az: string, en: string, ru: string];
const LANG_INDEX: Record<CatalogLanguage, 0 | 1 | 2> = { az: 0, en: 1, ru: 2 };

// ---------------------------------------------------------------- photos ----
const PHOTO = {
  // dishes
  steak: '1529692236671-f1f6cf9683ba', // sliced medium-rare steak
  steakFries: '1600891964092-4316c288032e', // sliced steak with fries
  fire: '1558030137-a56c1b004fa3', // meat over open coals
  mixedGrill: '1615937722923-67f6deaf2cc9', // table of grilled meats
  skewers: '1555939594-58d7cb561ad1', // kebab skewers and sides
  shashlik: '1599487488170-d11ec9c172f0', // skewers on grill
  ribs: '1544025162-d76694265947', // ribs on board
  ribs2: '1529193591184-b1d58069ecdd', // dark glazed ribs
  kofte: '1529042410759-befb1204b468', // meatballs on greens
  chicken: '1432139555190-58524dae6a55', // roast chicken, potatoes, greens
  tandoori: '1626074353765-517a681e40be', // tandoori chicken
  rice: '1512058564366-18510be2db19', // saffron rice with lemon
  paella: '1534080564583-6be75777b70a', // seafood paella
  friedRice: '1603133872878-684f208fb84b', // fried rice
  soupPumpkin: '1476718406336-bb5a9690ee2a', // orange cream soup
  soupTomato: '1547592166-23ac45744acd', // tomato soup bowl
  soupRed: '1534939561126-855b8675edd7', // red stew bowl
  pho: '1555126634-323283e090fa', // noodle soup
  ramen: '1569718212165-3a8278d5f624', // ramen with egg
  dumpl: '1496116218417-1a781b1c416c', // dumplings in bowl
  dumpl2: '1534422298391-e4f8c172dddb', // dumpling bowls
  rolls: '1606491956689-2ea866880c84', // baked bread rolls with dips
  cheese: '1486297678162-eb2a19b0a32d', // cheese wheels
  cheeseBoard: '1452195100486-9cc805987862', // blue cheese board
  mezze: '1476224203421-9ac39bcb3327', // grilled bread and plates
  salad: '1511690743698-d9d85f2fbf38', // pomegranate salad
  saladBowl: '1546069901-ba9599a7e63c', // chicken salad bowl
  veg: '1512621776951-a57141f2eefd', // veggie bowl
  bowl: '1547496502-affa22d38842', // grain bowl
  caesar: '1512852939750-1305098529bf', // caesar salad
  spaghetti: '1481931098730-318b6f776db0', // spaghetti plates
  penne: '1555949258-eb67b1ef0ceb', // creamy penne
  ragu: '1551183053-bf91a1d81141', // tagliatelle with ragu
  shrimpPasta: '1563379926898-05f4575a45d8', // shrimp noodles in pan
  pizza: '1574071318508-1cdbab80d002', // margherita pizza
  pizza2: '1565299624946-b28f40a0ae38', // wood-fired pizza
  pizza3: '1513104890138-7c749659a591', // rustic pizza
  sushi: '1579871494447-9811cf80d66c', // salmon sushi rolls
  sushi2: '1579584425555-c3ce17fd4351', // maki on slate
  ceviche: '1535399831218-d5bd36d1a6b3', // raw fish on white plate
  salmon: '1519708227418-c8fd9a32b7a2', // salmon with greens
  fish: '1467003909585-2f8a72700288', // fish fillet in broth
  seafoodBowl: '1559847844-5315695dadae', // seafood bowl with shrimp
  shrimp: '1559737558-2f5a35f4523b', // grilled shrimp plate
  shrimpPan: '1625943553852-781c6dd46faa', // shrimp skillet
  fishCurry: '1574484284002-952d92456975', // fish in orange sauce
  burger: '1568901346375-23c9450c58cd', // tall burger
  burger2: '1550547660-d9450f859349', // two burgers on board
  burgerFries: '1551782450-a2132b4ba21d', // burger in fries basket
  fries: '1561758033-d89a9ad46330', // fries and burger
  wings: '1626645738196-c2a7c87a8f58', // crispy fried chicken
  curry: '1565557623262-b51c2513a641', // curry with naan
  butterChicken: '1631452180519-c014fe946bc7', // butter chicken
  thali: '1546833999-b9f581a1996d', // thali tray
  samosa: '1601050690597-df0568f70950', // samosas
  padThai: '1589302168068-964664d93dc0', // pad thai
  noodles: '1585032226651-759b368d7246', // sesame noodles
  bibimbap: '1590301157890-4810ed352733', // bibimbap bowls
  croissant: '1530610476181-d83430b64dcd', // tray of croissants
  pancakes: '1567620905732-2d1ec7ab7445', // pancake stack
  eggToast: '1482049016688-2d3e1b311543', // egg and avocado toast
  avoToast: '1513442542250-854d436a73f2', // poached egg plate
  tiramisu: '1571877227200-a0d98ea607e9', // tiramisu
  cake: '1565958011703-44f9829ba187', // raspberry cake slice
  caramel: '1551024506-0bccd828d307', // ice cream with caramel
  parfait: '1563805042-7684c019e1cb', // glass dessert
  coffee: '1509042239860-f550ce710b93', // cappuccinos
  tea: '1544787219-7f47ccb76574', // tea with cookies
  mojito: '1513558161293-cdaf765ed2fd', // lemon mint cooler
  icedTea: '1556679343-c7306c1976bc', // iced tea
  wine: '1510812431401-41d2bd2722f3', // red wine glasses
  // venues
  v1: '1414235077428-338989a2e8c0', // candle-lit table
  v2: '1517248135467-4c7edcad34c4', // modern dining room
  v3: '1555396273-367ea4eb4db5', // industrial dining hall
  v4: '1559339352-11d035aa65de', // sea-view terrace
  v5: '1445116572660-236099ec97a0', // sunny cafe window
  v6: '1521017432531-fbd92d768814', // cafe interior
  v7: '1525610553991-2bede1a236e2', // lively restaurant
  v8: '1537047902294-62a40c20a6ae', // green bistro
  v9: '1552566626-52f8b828add9', // warm wood restaurant
  v10: '1554118811-1e0d58224f24', // bright cafe
  v11: '1578474846511-04ba529f0b88', // dark lounge
  v12: '1590846406792-0adc7f938f1d', // pendant-lit hall
  v13: '1528605248644-14dd04022da1', // busy terrace
} as const;
type Photo = keyof typeof PHOTO;
const img = (key: Photo) =>
  `https://images.unsplash.com/photo-${PHOTO[key]}?auto=format&fit=crop&w=900&q=80`;

// ------------------------------------------------------------ categories ----
type Cat =
  'breakfast' | 'starter' | 'soup' | 'main' | 'grill' | 'dessert' | 'drink';
const CATS: Record<Cat, L3> = {
  breakfast: ['Səhər yeməyi', 'Breakfast', 'Завтраки'],
  starter: ['Qəlyanaltılar', 'Starters', 'Закуски'],
  soup: ['Şorbalar', 'Soups', 'Супы'],
  main: ['Əsas yeməklər', 'Mains', 'Основные блюда'],
  grill: ['Qrill', 'Grill', 'Гриль'],
  dessert: ['Desertlər', 'Desserts', 'Десерты'],
  drink: ['İçkilər', 'Drinks', 'Напитки'],
};
const CAT_ORDER: Cat[] = [
  'breakfast',
  'starter',
  'soup',
  'main',
  'grill',
  'dessert',
  'drink',
];

/** Closing sentence per category so every description is long enough to truncate. */
const NOTES: Record<Cat, L3[]> = {
  breakfast: [
    [
      'Səhər saatlarında hər sifariş təzə hazırlanır.',
      'Each order is prepared fresh through the morning.',
      'Каждый заказ готовится свежим в течение утра.',
    ],
    [
      'Qəhvə və təzə şirə ilə birlikdə gözəl başlanğıcdır.',
      'A lovely start to the day alongside coffee or fresh juice.',
      'Прекрасное начало дня с кофе или свежим соком.',
    ],
  ],
  starter: [
    [
      'Əsas yeməkdən əvvəl və ya masa ilə paylaşmaq üçün uyğundur.',
      'Ideal before the main course or to share across the table.',
      'Подходит перед основным блюдом или для всего стола.',
    ],
    [
      'Sifarişlə hazırlanır və masaya ilk gələn yeməklərdəndir.',
      'Made to order and among the first plates to reach the table.',
      'Готовится под заказ и приходит на стол одним из первых.',
    ],
  ],
  soup: [
    [
      'İsti təqdim olunur və çörəklə birlikdə daha da dadlıdır.',
      'Served piping hot and even better with bread on the side.',
      'Подаётся горячим и ещё вкуснее с хлебом.',
    ],
    [
      'Hər gün səhər təzədən bişirilir.',
      'Cooked from scratch every morning.',
      'Готовится с нуля каждое утро.',
    ],
  ],
  main: [
    [
      'Sifarişlə hazırlanır və tərəvəz qarnirlə təqdim olunur.',
      'Cooked to order and plated with a seasonal garnish.',
      'Готовится под заказ и подаётся с сезонным гарниром.',
    ],
    [
      'Aşpazın təklif etdiyi qarnir və sousla servis olunur.',
      'Served with the chef’s own garnish and sauce.',
      'Подаётся с гарниром и соусом от шефа.',
    ],
  ],
  grill: [
    [
      'Kömürdə hazırlanır və sifarişlə qızardılır.',
      'Cooked over live fire and finished to order.',
      'Готовится на живом огне и доводится до готовности под заказ.',
    ],
    [
      'Közdən götürülən kimi isti təqdim olunur.',
      'Sent to the table straight off the grill.',
      'Подаётся прямо с гриля.',
    ],
  ],
  dessert: [
    [
      'Hər gün təzə hazırlanır və yeməyin sonu üçün idealdır.',
      'Made fresh daily and ideal to finish the meal.',
      'Готовится свежим каждый день и идеально завершает ужин.',
    ],
    [
      'Qəhvə və ya çay ilə birlikdə paylaşmaq olar.',
      'Easy to share, especially with coffee or tea.',
      'Легко разделить, особенно с кофе или чаем.',
    ],
  ],
  drink: [
    [
      'Sifarişlə hazırlanır və yeməklə birlikdə gətirilir.',
      'Prepared to order and brought out alongside the food.',
      'Готовится под заказ и подаётся вместе с едой.',
    ],
    [
      'Yemək ilə dadını tamamlayan sərin və ya isti seçimdir.',
      'A refreshing or warming choice that complements the food.',
      'Освежающий или согревающий напиток, дополняющий блюдо.',
    ],
  ],
};

// ------------------------------------------------------- dish templates ----
interface Tpl {
  id: string;
  cat: Cat;
  photo: Photo;
  price: number; // minor units at price level 2
  grams: number | null;
  min: number;
  spicy: boolean;
  ing: Ingredient[];
  alg: Allergen[];
  name: L3;
  desc: L3;
}
const t = (
  id: string,
  cat: Cat,
  photo: Photo,
  price: number,
  grams: number,
  min: number,
  spicy: boolean,
  ing: Ingredient[],
  alg: Allergen[],
  name: L3,
  desc: L3,
): Tpl => ({ id, cat, photo, price, grams, min, spicy, ing, alg, name, desc });

const SHARED_DESSERTS: Tpl[] = [
  t(
    'tiramisu',
    'dessert',
    'tiramisu',
    1100,
    150,
    5,
    false,
    ['coffee', 'egg', 'chocolate', 'cheese'],
    ['gluten', 'dairy', 'egg'],
    ['Tiramisu', 'Tiramisu', 'Тирамису'],
    [
      'Qəhvəyə batırılmış savoyardi, yüngül maskarpone kremi və acı kakao tozu. Hər qaşıq yumşaq, havalı və balanslı şirin dadla yadda qalır. Yeməyin sonunda ideal seçimdir.',
      'Coffee-soaked ladyfingers layered with a light mascarpone cream and dusted with bitter cocoa. Every spoonful is soft, airy and perfectly balanced. A graceful way to close the meal.',
      'Савоярди, пропитанные кофе, с нежным кремом маскарпоне и горьким какао сверху. Каждая ложка мягкая, воздушная и сбалансированная по сладости. Изящное завершение ужина.',
    ],
  ),
  t(
    'berry_cake',
    'dessert',
    'cake',
    1200,
    160,
    5,
    false,
    ['fruit', 'cheese', 'dough'],
    ['gluten', 'dairy', 'egg'],
    ['Moruqlu çizkeyk', 'Raspberry cheesecake', 'Малиновый чизкейк'],
    [
      'Kremli pendir qatı, kövrək biskvit əsası və təzə moruq sousu. Turşməzə giləmeyvə şirinliyi gözəl yumşaldır. Yumşaq teksturası dilin üstündə əriyir.',
      'A creamy cheese layer on a crumbly biscuit base, finished with fresh raspberry sauce. The tart berries soften the sweetness beautifully. The texture melts softly on the tongue.',
      'Нежный сырный слой на песочной основе с соусом из свежей малины. Кислинка ягод красиво смягчает сладость. Текстура буквально тает во рту.',
    ],
  ),
  t(
    'caramel_ice',
    'dessert',
    'caramel',
    950,
    140,
    4,
    false,
    ['nuts', 'chocolate', 'sauce'],
    ['dairy', 'nuts', 'egg'],
    ['Karamelli dondurma', 'Caramel ice cream', 'Мороженое с карамелью'],
    [
      'Vanilli dondurma üzərinə isti duzlu karamel və qovrulmuş fındıq səpilir. İsti ilə soyuğun kontrastı hər tikədə hiss olunur. Sadə, amma insanı dayandırmayan desert.',
      'Vanilla ice cream poured with warm salted caramel and scattered with roasted hazelnuts. The contrast of hot and cold shows in every bite. Simple, and impossible to stop eating.',
      'Ванильное мороженое с тёплой солёной карамелью и обжаренным фундуком. Контраст горячего и холодного чувствуется в каждой ложке. Просто, но остановиться невозможно.',
    ],
  ),
  t(
    'layer_parfait',
    'dessert',
    'parfait',
    1050,
    180,
    5,
    false,
    ['yogurt', 'chocolate', 'fruit'],
    ['dairy', 'gluten'],
    ['Şokoladlı parfe', 'Chocolate parfait', 'Шоколадный парфе'],
    [
      'Stəkanda qatlanmış şokolad kremi, qaymaq və xırdalanmış peçenye. Üstündə tünd şokolad qırıntıları var. Çox şirin deyil, kofe ilə çox yaxşı gedir.',
      'Chocolate cream, whipped cream and cookie crumble layered in a glass, topped with dark chocolate shavings. It is not overly sweet and pairs well with coffee. Cool, rich and generous.',
      'Слои шоколадного крема, взбитых сливок и печенья в стакане с тёмной стружкой сверху. Не приторный и отлично сочетается с кофе. Прохладный, насыщенный и щедрый.',
    ],
  ),
];
const SHARED_DRINKS: Tpl[] = [
  t(
    'cappuccino',
    'drink',
    'coffee',
    650,
    250,
    3,
    false,
    ['coffee', 'yogurt'],
    ['dairy'],
    ['Kapuçino', 'Cappuccino', 'Капучино'],
    [
      'İki shot espresso, ipək kimi süd köpüyü və incə latte-art. Dadı yumşaq, qəhvə aromatı isə dolğundur. Desertlə yaxşı birləşir.',
      'A double espresso topped with silky steamed milk and delicate latte art. The taste is smooth with a full coffee aroma. A natural partner for dessert.',
      'Двойной эспрессо с шелковистой молочной пеной и аккуратным латте-артом. Вкус мягкий, аромат кофе насыщенный. Естественная пара к десерту.',
    ],
  ),
  t(
    'black_tea',
    'drink',
    'tea',
    450,
    300,
    3,
    false,
    ['citrus'],
    [],
    ['Armudu çay + limon', 'Black tea with lemon', 'Чёрный чай с лимоном'],
    [
      'Təzə dəmlənmiş qara çay, nazik limon dilimi ilə. Ənənəvi armudu stəkanda isti verilir. Yeməkdən sonra ən doğru seçimdir.',
      'Freshly brewed black tea served hot with a thin slice of lemon, traditionally in a pear-shaped glass. Clean, fragrant and warming. The right ending after a rich meal.',
      'Свежезаваренный чёрный чай с тонким ломтиком лимона в традиционном армуду-стакане. Чистый, ароматный и согревающий. Правильный финал после сытной еды.',
    ],
  ),
  t(
    'mint_cooler',
    'drink',
    'mojito',
    750,
    400,
    4,
    false,
    ['citrus', 'herbs'],
    [],
    ['Nanəli limonad', 'Mint lemonade', 'Лимонад с мятой'],
    [
      'Təzə sıxılmış limon, nanə yarpaqları və buz. Turş, şirin və sərinləşdirici balansı yay istisində xüsusilə yaxşıdır. Yağlı yeməklərin yanında ideal gedir.',
      'Fresh-squeezed lemon, crushed mint leaves and plenty of ice. The tart, sweet and cooling balance is especially good in summer heat. It cuts through rich dishes perfectly.',
      'Свежевыжатый лимон, листья мяты и много льда. Баланс кислого, сладкого и прохладного особенно хорош в летнюю жару. Прекрасно освежает после жирных блюд.',
    ],
  ),
  t(
    'iced_tea',
    'drink',
    'icedTea',
    700,
    400,
    3,
    false,
    ['citrus', 'fruit'],
    [],
    ['Şaftalılı buzlu çay', 'Peach iced tea', 'Персиковый холодный чай'],
    [
      'Soyudulmuş qara çay, şaftalı şirəsi və limon dilimi. Yüngül şirinlik və təmiz çay dadı bir yerdədir. Qrill yeməklərlə yaxşı uyğunlaşır.',
      'Chilled black tea with peach and a wedge of lemon. A light sweetness sits alongside a clean tea flavour. Pairs nicely with anything from the grill.',
      'Охлаждённый чёрный чай с персиком и долькой лимона. Лёгкая сладость и чистый вкус чая в одном стакане. Хорошо подходит к блюдам с гриля.',
    ],
  ),
  t(
    'house_red',
    'drink',
    'wine',
    1100,
    150,
    2,
    false,
    ['fruit'],
    [],
    ['Ev qırmızı şərabı', 'House red wine', 'Красное вино дома'],
    [
      'Quru, orta gövdəli qırmızı şərab: qara gilas və yüngül ədviyyat notları. Ət və pendir yeməkləri ilə çox yaxşı uyğundur. Bir stəkan şəklində təqdim olunur.',
      'A dry, medium-bodied red with notes of black cherry and gentle spice. It works very well with meat and cheese dishes. Served by the glass.',
      'Сухое красное вино средней плотности с нотами чёрной вишни и лёгких специй. Отлично подходит к мясу и сырам. Подаётся бокалом.',
    ],
  ),
];

const POOLS: Record<Cuisine, Tpl[]> = {
  azerbaijani: [
    t(
      'dolma',
      'starter',
      'mezze',
      1300,
      260,
      25,
      false,
      ['lamb', 'rice', 'herbs', 'yogurt'],
      ['dairy'],
      ['Yarpaq dolması', 'Grape-leaf dolma', 'Долма в виноградных листьях'],
      [
        'İncə üzüm yarpağına bükülmüş quzu əti, düyü və təzə göyərti. Yavaş-yavaş bişirilir və yanında qatıq verilir. Bayram süfrəsinin ən sevilən yeməyidir.',
        'Tender vine leaves wrapped around minced lamb, rice and fresh herbs, slowly simmered and served with garlic yogurt. A festive-table favourite that tastes like home cooking.',
        'Нежные виноградные листья с рубленой бараниной, рисом и свежей зеленью, томлёные на медленном огне и поданные с чесночным йогуртом. Любимое блюдо праздничного стола.',
      ],
    ),
    t(
      'qutab',
      'starter',
      'mezze',
      900,
      200,
      12,
      false,
      ['dough', 'herbs', 'cheese'],
      ['gluten', 'dairy'],
      ['Göyərtili qutab', 'Herb qutab', 'Кутаб с зеленью'],
      [
        'Nazik xəmirə bükülüb sacda bişirilmiş göyərti və pendir dolması. Qızardıqdan sonra kərə yağı ilə yağlanır. Üzərinə sumaq səpilərək təqdim olunur.',
        'Paper-thin dough folded around herbs and cheese and baked on a convex griddle. It is brushed with butter right after cooking and dusted with sumac. Best eaten hot.',
        'Тонкое тесто с начинкой из зелени и сыра, испечённое на садже и смазанное сливочным маслом. Подаётся с сумахом. Лучше всего есть горячим.',
      ],
    ),
    t(
      'piti',
      'soup',
      'soupRed',
      1250,
      450,
      35,
      false,
      ['lamb', 'vegetables', 'potato', 'spice'],
      [],
      ['Şəki piti', 'Sheki piti', 'Пити по-шекински'],
      [
        'Gil qabda yavaş bişirilmiş quzu əti, noxud, kartof və şafran. Şorba ayrıca, ət isə ayrıca verilir. Dadı dolğun və doyurucudur.',
        'Lamb, chickpeas, potatoes and saffron slow-cooked in a clay pot, served the traditional way with the broth and meat separate. Deeply savoury and genuinely filling.',
        'Баранина, нут, картофель и шафран, томлённые в глиняном горшочке. Бульон и мясо подаются отдельно, как положено. Насыщенный вкус и очень сытно.',
      ],
    ),
    t(
      'dovga',
      'soup',
      'soupPumpkin',
      950,
      400,
      20,
      false,
      ['yogurt', 'herbs', 'rice'],
      ['dairy'],
      ['Dovğa', 'Dovga yogurt soup', 'Довга'],
      [
        'Qatıq əsaslı yaşıl şorba: təzə göyərti, düyü və noxud ilə. İsti və ya soyudulmuş şəkildə içmək olar. Yüngül turşməzə dadı onu fərqləndirir.',
        'A herbal yogurt soup with chickpeas and rice, served warm or chilled. Its light tang and green freshness set it apart. Comforting without being heavy.',
        'Йогуртовый суп с зеленью, нутом и рисом, который подают тёплым или холодным. Лёгкая кислинка и свежесть трав делают его особенным. Уютный и не тяжёлый.',
      ],
    ),
    t(
      'plov',
      'main',
      'rice',
      2800,
      450,
      40,
      false,
      ['rice', 'lamb', 'nuts', 'fruit', 'spice'],
      ['nuts', 'dairy'],
      ['Şah plov', 'Shah plov', 'Шах-плов'],
      [
        'Lavaşa bükülmüş şafranlı düyü, içində quzu əti, qurudulmuş meyvə və şabalıd. Xəmir qabığı qızılı, ətrafı isə qopmayacaq qədər yumşaqdır. Süfrənin əsl şahıdır.',
        'Saffron rice baked in a golden lavash crust, filled with lamb, dried apricots and chestnuts. Crisp outside, fragrant and fluffy inside. The crown of any table.',
        'Шафрановый рис в золотистой лаваш-корочке с бараниной, курагой и каштанами. Снаружи хрустит, внутри ароматный и рассыпчатый. Король любого стола.',
      ],
    ),
    t(
      'lule',
      'main',
      'kofte',
      2300,
      280,
      20,
      false,
      ['lamb', 'herbs', 'tomato', 'bread'],
      ['gluten'],
      ['Lülə kabab', 'Lule kebab', 'Люля-кебаб'],
      [
        'Doğranmış quzu əti, quyruq piyi və ədviyyatla yoğrulub közdə bişirilir. Yanında lavaş, soğan və qovrulmuş pomidor gəlir. Şirəli, tüstülü və çox ətirli.',
        'Hand-minced lamb and tail fat seasoned with spices and flame-grilled on skewers. Served with lavash, raw onion and a charred tomato. Juicy, smoky and richly fragrant.',
        'Рубленая баранина с курдючным салом и специями на углях. Подаётся с лавашем, луком и печёным помидором. Сочный, дымный и ароматный.',
      ],
    ),
    t(
      'shashlik',
      'main',
      'shashlik',
      2900,
      300,
      25,
      false,
      ['lamb', 'vegetables', 'herbs', 'bread'],
      ['gluten'],
      ['Quzu şişi', 'Lamb shashlik', 'Шашлык из баранины'],
      [
        'Marinadlanmış quzu ətinin iri parçaları közdə şiş üstündə qızardılır. Kənarları xırtıldayır, içi isə yumşaq və şirəli qalır. Sumaqlı soğan salatı ilə gəlir.',
        'Large cuts of marinated lamb grilled on skewers over charcoal. The edges crisp while the inside stays tender and juicy. Served with a sumac onion salad.',
        'Крупные куски маринованной баранины на шампурах над углями. Края подрумяниваются, а внутри мясо остаётся нежным и сочным. Подаётся с луковым салатом с сумахом.',
      ],
    ),
    t(
      'saj',
      'main',
      'chicken',
      2600,
      420,
      30,
      false,
      ['chicken', 'potato', 'vegetables', 'herbs'],
      [],
      ['Sac içi', 'Saj ichi', 'Садж-ичи'],
      [
        'Sacda bişirilmiş toyuq, kartof, badımcan və pomidor birlikdə sıx qızardılır. Meyvə-tərəvəz şirələri bir-birinə qarışır. Böyük sacda paylaşmaq üçün idealdır.',
        'Chicken, potatoes, aubergine and tomato seared together on a sizzling saj. The juices blend into a rich, rustic sauce. Best shared at the table.',
        'Курица, картофель, баклажаны и помидоры, обжаренные вместе на саже. Соки смешиваются в насыщенный деревенский соус. Лучше всего делить на двоих.',
      ],
    ),
  ],
  italian: [
    t(
      'antipasto',
      'starter',
      'cheeseBoard',
      1800,
      220,
      10,
      false,
      ['cheese', 'nuts', 'fruit', 'bread'],
      ['dairy', 'nuts', 'gluten'],
      ['Antipasto tabağı', 'Antipasto board', 'Ассорти антипасти'],
      [
        'İtalyan pendirləri, quru meyvələr, qoz-fındıq və təzə çörək bir lövhədə. Hər pendirin öz tamı var: ağır, yumşaq, ətirli. Şərab yanında əla gedir.',
        'A board of Italian cheeses, fruit, nuts and fresh bread. Each cheese has its own character: sharp, creamy, fragrant. A perfect companion to a glass of wine.',
        'Доска с итальянскими сырами, фруктами, орехами и свежим хлебом. У каждого сыра свой характер: острый, сливочный, ароматный. Отличная пара к бокалу вина.',
      ],
    ),
    t(
      'tomato_basil',
      'soup',
      'soupTomato',
      1000,
      350,
      15,
      false,
      ['tomato', 'herbs', 'vegetables'],
      [],
      [
        'Pomidor-reyhan şorbası',
        'Tomato basil soup',
        'Томатный суп с базиликом',
      ],
      [
        'Yetişmiş pomidorlardan hazırlanmış yumşaq krem şorba, üzərində reyhan və zeytun yağı. Dadı təbii şirin və yüngül turşdur. İsti bruşetta ilə yaxşı gedir.',
        'A smooth cream of ripe tomatoes finished with basil and olive oil. The taste is naturally sweet with a gentle acidity. Lovely with warm bruschetta.',
        'Нежный крем-суп из спелых томатов с базиликом и оливковым маслом. Вкус натурально сладкий с мягкой кислинкой. Прекрасно с тёплой брускеттой.',
      ],
    ),
    t(
      'carbonara',
      'main',
      'spaghetti',
      1900,
      320,
      15,
      false,
      ['pasta', 'egg', 'cheese', 'spice'],
      ['gluten', 'egg', 'dairy'],
      ['Karbonara', 'Spaghetti carbonara', 'Спагетти карбонара'],
      [
        'Əl ilə hazırlanmış spagetti, yumurta sarısı, pekorino pendiri və çıtır donuz yanağı. Krem əlavə olunmur, sous təbii ipək kimidir. Təzə üyüdülmüş qara istiotla verilir.',
        'Spaghetti tossed with egg yolk, pecorino and crisp guanciale, never cream. The sauce turns naturally silky. Finished with freshly cracked black pepper.',
        'Спагетти с яичным желтком, пекорино и хрустящей гуанчале, без сливок. Соус получается шелковистым сам по себе. Подаётся со свежемолотым чёрным перцем.',
      ],
    ),
    t(
      'ragu',
      'main',
      'ragu',
      2200,
      340,
      20,
      false,
      ['pasta', 'beef', 'tomato', 'herbs'],
      ['gluten', 'egg', 'dairy'],
      ['Ragu tagliatelle', 'Tagliatelle al ragù', 'Тальятелле с рагу'],
      [
        'Yumurtalı tagliatelle, 4 saat qaynadılmış mal əti raqusu ilə. Sous dolğun, pomidor və şərab notları ilə zəngindir. Üzərinə parmezan sürtülür.',
        'Egg tagliatelle with a beef ragù simmered for four hours. The sauce is deep and rich with tomato and wine notes. Finished with grated parmesan.',
        'Яичные тальятелле с говяжьим рагу, томлённым четыре часа. Соус насыщенный, с нотами томата и вина. Сверху тёртый пармезан.',
      ],
    ),
    t(
      'penne_cream',
      'main',
      'penne',
      1700,
      330,
      15,
      false,
      ['pasta', 'cheese', 'herbs', 'chicken'],
      ['gluten', 'dairy'],
      ['Kremli penne', 'Creamy chicken penne', 'Пенне в сливочном соусе'],
      [
        'Penne makaron, toyuq filesi və yüngül qaymaqlı pendir sousu. Üzərində təzə göyərti və qara istiot. Yumşaq, doyurucu və uşaqlar üçün də uyğun.',
        'Penne with tender chicken in a light cream and cheese sauce, finished with herbs and pepper. Soft, comforting and friendly for younger guests.',
        'Пенне с нежной курицей в лёгком сливочно-сырном соусе, сверху зелень и перец. Мягкое, сытное и подходит даже детям.',
      ],
    ),
    t(
      'margherita',
      'main',
      'pizza',
      1800,
      420,
      15,
      false,
      ['dough', 'tomato', 'cheese', 'herbs'],
      ['gluten', 'dairy'],
      ['Marqarita pitsa', 'Margherita pizza', 'Пицца Маргарита'],
      [
        'Odun sobasında bişirilmiş nazik xəmir, San Marzano pomidoru və mozzarella. Kənarları kabarıq və yüngül yanıqlıdır. Reyhan yarpaqları sonda əlavə olunur.',
        'Thin dough baked in a wood-fired oven with San Marzano tomatoes and mozzarella. The crust puffs and chars lightly at the edges. Fresh basil lands at the very end.',
        'Тонкое тесто, испечённое в дровяной печи, с томатами Сан-Марцано и моцареллой. Края пышные с лёгкой обжаркой. Свежий базилик кладут в самом конце.',
      ],
    ),
    t(
      'diavola',
      'main',
      'pizza2',
      2100,
      440,
      15,
      true,
      ['dough', 'tomato', 'cheese', 'spice'],
      ['gluten', 'dairy'],
      ['Diavola pitsa', 'Diavola pizza', 'Пицца Дьявола'],
      [
        'Acı salami, mozzarella və pomidor sousu, üzərinə qırmızı istiot yağı gəzdirilir. Aydın acılıq var, amma dadı yeyilir. Soyuq içkiylə birlikdə çox yaxşıdır.',
        'Spicy salami, mozzarella and tomato sauce, finished with a drizzle of chilli oil. The heat is clear but never overwhelming. Wonderful with a cold drink.',
        'Острая салями, моцарелла и томатный соус с каплей масла чили. Острота чувствуется, но не забивает вкус. Отлично с холодным напитком.',
      ],
    ),
    t(
      'linguine_shrimp',
      'main',
      'shrimpPasta',
      2800,
      330,
      18,
      false,
      ['pasta', 'shrimp', 'tomato', 'herbs'],
      ['gluten', 'shellfish'],
      ['Krevetli linquine', 'Shrimp linguine', 'Лингвини с креветками'],
      [
        'Linquine, sarımsaq və çiləkli pomidor sousunda sauté edilmiş iri krevetlər. Yüngül şərab turşluğu və təzə cəfəri var. Dənizin dadını masaya gətirir.',
        'Linguine tossed with large prawns sautéed in garlic and cherry tomato. A light touch of white wine and fresh parsley lifts it. Brings the sea to the table.',
        'Лингвини с крупными креветками, обжаренными с чесноком и помидорами черри. Немного белого вина и свежая петрушка. Приносит вкус моря на стол.',
      ],
    ),
  ],
  japanese: [
    t(
      'gyoza',
      'starter',
      'dumpl2',
      1400,
      180,
      12,
      false,
      ['dough', 'vegetables', 'sauce'],
      ['gluten', 'soy', 'sesame'],
      ['Gyoza', 'Pan-fried gyoza', 'Гёдза'],
      [
        'Bir tərəfi qızılı, digər tərəfi buğda xəmiri kimi yumşaq olan dolma. İçi tərəvəz və toyuq qiymədir, yanında soya-sirkə sousu var. Hər tikədə şirə hiss olunur.',
        'Dumplings crisp and golden on one side, soft and steamed on the other, filled with vegetables and minced chicken. Served with a soy and rice vinegar dip. Each bite releases a little broth.',
        'Пельмени, золотистые с одной стороны и мягкие с другой, с начинкой из овощей и курицы. Подаются с соево-уксусным соусом. В каждом кусочке чувствуется бульон.',
      ],
    ),
    t(
      'salmon_carpaccio',
      'starter',
      'ceviche',
      1700,
      120,
      8,
      false,
      ['fish', 'citrus', 'herbs', 'sauce'],
      ['fish', 'soy'],
      ['Qızılbalıq karpaççio', 'Salmon carpaccio', 'Карпаччо из лосося'],
      [
        'Nazik dilimlənmiş təzə qızılbalıq, sitrus ponzu sousu və tərəvəz ilə. Yüngül, təmiz və təravətli dad verir. Əsas yeməkdən əvvəl ideal başlanğıcdır.',
        'Paper-thin slices of fresh salmon dressed in citrus ponzu with crisp vegetables. Light, clean and refreshing. An elegant start before the main course.',
        'Тонкие ломтики свежего лосося с цитрусовым понзу и хрустящими овощами. Лёгкая, чистая и освежающая закуска. Элегантное начало перед основным блюдом.',
      ],
    ),
    t(
      'ramen',
      'soup',
      'ramen',
      2300,
      500,
      15,
      false,
      ['pasta', 'egg', 'vegetables', 'spice'],
      ['gluten', 'egg', 'soy'],
      ['Ramen', 'Chicken shoyu ramen', 'Рамен с курицей'],
      [
        'Toyuq-soya bulyonunda əriştə, yumşaq yumurta və yaşıl soğan. Bulyon saatlarla qaynadılıb, dadı dərin və isti. Soyuq havada xüsusilə yaxşı gedir.',
        'Noodles in a chicken and soy broth with a soft egg and spring onion. The broth is simmered for hours and tastes deep and warming. Especially good on cold days.',
        'Лапша в курино-соевом бульоне с мягким яйцом и зелёным луком. Бульон варится часами, вкус глубокий и согревающий. Особенно хорош в холодную погоду.',
      ],
    ),
    t(
      'salmon_roll',
      'main',
      'sushi',
      2400,
      240,
      15,
      false,
      ['rice', 'fish', 'cheese', 'vegetables'],
      ['fish', 'dairy', 'soy', 'sesame'],
      ['Qızılbalıqlı roll', 'Salmon avocado roll', 'Ролл с лососем'],
      [
        'Qızılbalıq, avokado və krem pendiri nori və düyüdə bükülüb. Səkkiz hissəyə kəsilir, soya sousu və vasabi ilə verilir. Yumşaq və kremsi teksturası var.',
        'Salmon, avocado and cream cheese rolled in nori and rice. Cut into eight pieces and served with soy and wasabi. Soft, creamy and satisfyingly fresh.',
        'Лосось, авокадо и сливочный сыр в нори и рисе. Восемь кусочков с соевым соусом и васаби. Мягкий, сливочный и по-настоящему свежий вкус.',
      ],
    ),
    t(
      'maki_set',
      'main',
      'sushi2',
      3200,
      320,
      20,
      false,
      ['rice', 'fish', 'vegetables', 'sauce'],
      ['fish', 'soy', 'sesame'],
      ['Maki dəsti', 'Maki set', 'Маки-сет'],
      [
        'Tuna, xiyar və qızılbalıq makiləri ənənəvi ardıcıllıqla düzülüb. Düyü hələ də ilıqdır, balıq isə buz kimi təzə. Şef tərəfindən soyuq təqdim olunur.',
        'A selection of tuna, cucumber and salmon maki arranged in the traditional order. The rice is still slightly warm while the fish is cold and fresh. A chef-assembled classic.',
        'Набор маки с тунцом, огурцом и лососем, выложенный в традиционном порядке. Рис ещё слегка тёплый, а рыба холодная и свежая. Классика от шефа.',
      ],
    ),
    t(
      'teriyaki_salmon',
      'main',
      'salmon',
      3000,
      280,
      20,
      false,
      ['fish', 'vegetables', 'sauce', 'rice'],
      ['fish', 'soy', 'sesame'],
      ['Teriyaki qızılbalıq', 'Teriyaki salmon', 'Лосось терияки'],
      [
        'Teriyaki glazurlu qızılbalıq filesi, buxarda tərəvəz və susam ilə. Üstü karamelləşib, içi isə şirəli və yumşaqdır. Düyü ilə sifariş etmək məsləhətdir.',
        'A salmon fillet glazed with teriyaki, served with steamed vegetables and sesame. The surface caramelises while the centre stays juicy and tender. Best with steamed rice.',
        'Филе лосося в глазури терияки с овощами на пару и кунжутом. Поверхность карамелизуется, а внутри остаётся сочным и нежным. Лучше всего с рисом.',
      ],
    ),
  ],
  georgian: [
    t(
      'khachapuri',
      'starter',
      'rolls',
      1600,
      380,
      18,
      false,
      ['dough', 'cheese', 'egg'],
      ['gluten', 'dairy', 'egg'],
      ['Acarula xaçapuri', 'Adjarian khachapuri', 'Хачапури по-аджарски'],
      [
        'Qayıq şəklində bişirilmiş yumşaq çörək, içində əridilmiş pendir və yumurta sarısı. Kərə yağı ilə qarışdırıb kənarları batırmaq lazımdır. Çox doyurucudur, paylaşmaq üçündür.',
        'A boat of soft baked bread filled with melted cheese, a yolk and a knob of butter. Stir it together and tear the crust into the middle. Very filling and meant for sharing.',
        'Лодочка из мягкого хлеба с расплавленным сыром, желтком и кусочком масла. Всё перемешивается и макается корочкой. Очень сытно и рассчитано на компанию.',
      ],
    ),
    t(
      'pkhali',
      'starter',
      'salad',
      1100,
      200,
      10,
      false,
      ['vegetables', 'nuts', 'herbs', 'spice'],
      ['nuts'],
      ['Pxali', 'Pkhali trio', 'Пхали'],
      [
        'Ispanaq, çuğundur və lobyadan hazırlanmış üç növ qoz pastası. Nar dənələri və təzə şüyüd ilə bəzənir. Soyuq verilir, yüngül və ətirlidir.',
        'Three vegetable pastes of spinach, beet and beans blended with walnut. Finished with pomegranate seeds and dill. Served chilled, light and fragrant.',
        'Три вида овощных паст из шпината, свёклы и фасоли с грецким орехом. Украшены зёрнами граната и укропом. Подаётся холодным, лёгкий и ароматный.',
      ],
    ),
    t(
      'kharcho',
      'soup',
      'soupRed',
      1300,
      400,
      30,
      true,
      ['beef', 'rice', 'nuts', 'spice'],
      ['nuts'],
      ['Xarço', 'Beef kharcho', 'Харчо'],
      [
        'Mal ətindən hazırlanmış qalın, acı-turş şorba, qoz və tkemali sousu ilə. Düyü bulyonu qatılaşdırır. Kişniş və sarımsaq dadı dolğunlaşdırır.',
        'A thick, tangy beef soup spiced with walnut and tkemali plum sauce. Rice thickens the broth. Coriander and garlic round the flavour out.',
        'Густой кисло-острый суп из говядины с грецким орехом и соусом ткемали. Рис делает бульон насыщеннее. Кинза и чеснок завершают вкус.',
      ],
    ),
    t(
      'khinkali',
      'main',
      'dumpl',
      1800,
      320,
      25,
      false,
      ['dough', 'beef', 'lamb', 'spice'],
      ['gluten'],
      ['Xinkali', 'Khinkali', 'Хинкали'],
      [
        'Əlbəl büküşlü iri bulyonlu dolma, mal və quzu əti ilə. Əvvəlcə bulyonu içmək, sonra dolmanı yemək lazımdır. Üzərinə bol qara istiot səpilir.',
        'Hand-pleated dumplings filled with beef, lamb and a little broth. Sip the broth first, then eat the dumpling, leaving the knot. Dusted with plenty of black pepper.',
        'Хинкали ручной лепки с говядиной, бараниной и бульоном внутри. Сначала выпивают бульон, потом едят, оставляя хвостик. Щедро посыпаны чёрным перцем.',
      ],
    ),
    t(
      'chakhokhbili',
      'main',
      'chicken',
      2400,
      400,
      35,
      true,
      ['chicken', 'tomato', 'herbs', 'spice'],
      [],
      ['Çaxoxbili', 'Chakhokhbili chicken', 'Чахохбили'],
      [
        'Pomidorda, soğanda və adjika ilə bişmiş toyuq. Sous qalın, ətirli və yüngül acıdır. Təzə reyhan və kişniş sonda əlavə olunur.',
        'Chicken braised with tomato, onion and adjika until the sauce turns thick and fragrant. Gently spicy. Fresh basil and coriander go in at the end.',
        'Курица, тушённая с помидорами, луком и аджикой до густого ароматного соуса. Слегка острая. Свежий базилик и кинза добавляются в конце.',
      ],
    ),
    t(
      'mtsvadi',
      'main',
      'skewers',
      2900,
      320,
      25,
      false,
      ['lamb', 'vegetables', 'herbs', 'spice'],
      [],
      ['Mtsvadi', 'Lamb mtsvadi', 'Мцвади'],
      [
        'Köz üstündə bişirilmiş marinadlı quzu parçaları, qızardılmış soğan və nar sousu ilə. Ətin tüstülü dadı ilə sousun turşluğu üst-üstə düşür. Çörəklə verilir.',
        'Marinated lamb skewers grilled over embers, with caramelised onion and pomegranate sauce. The smoky meat meets the sauce’s tartness. Served with bread.',
        'Маринованные кусочки баранины на углях с карамелизированным луком и гранатовым соусом. Дымность мяса сочетается с кислинкой соуса. Подаётся с хлебом.',
      ],
    ),
  ],
  turkish: [
    t(
      'meze_trio',
      'starter',
      'mezze',
      1500,
      240,
      10,
      false,
      ['yogurt', 'vegetables', 'bread', 'herbs'],
      ['dairy', 'gluten'],
      ['Meze üçlüsü', 'Meze trio', 'Мезе-трио'],
      [
        'Haydari, közlənmiş badımcan və acılı ezme bir tabaqda. İsti pide çörəyi ilə təqdim olunur. Paylaşmaq və söhbətə başlamaq üçündür.',
        'Haydari, smoky aubergine and spicy ezme on one plate, with warm pide bread to scoop. Made for sharing and starting the conversation.',
        'Хайдари, баклажаны на огне и острый эзме на одной тарелке с тёплой пиде. Для компании и неспешного начала ужина.',
      ],
    ),
    t(
      'pide',
      'starter',
      'pizza3',
      1700,
      360,
      18,
      false,
      ['dough', 'cheese', 'herbs', 'egg'],
      ['gluten', 'dairy', 'egg'],
      ['Pendirli pide', 'Cheese pide', 'Пиде с сыром'],
      [
        'Odun sobasında bişmiş qayıq şəkilli xəmir, pendir və göyərti ilə. Üstündə yumurta sarısı əridilir. Kənarları çıtır, ortası yumşaqdır.',
        'A boat-shaped dough baked in a wood oven with cheese and herbs, a yolk set on top. The edges are crisp and the centre soft.',
        'Лодочка из теста с сыром и зеленью, испечённая в дровяной печи, сверху желток. Края хрустят, серединка мягкая.',
      ],
    ),
    t(
      'shish',
      'grill',
      'skewers',
      2300,
      280,
      22,
      false,
      ['chicken', 'vegetables', 'spice', 'bread'],
      ['gluten', 'dairy'],
      ['Toyuq şiş', 'Chicken shish', 'Куриный шиш'],
      [
        'Qatıq və ədviyyatla marinad edilmiş toyuq parçaları közdə bişirilir. Yanında közlənmiş bibər, pomidor və lavaş gəlir. Şirəli və yüngül acıdır.',
        'Chicken pieces marinated in yogurt and spices and grilled over embers. Served with charred peppers, tomato and lavash. Juicy and gently spiced.',
        'Кусочки курицы в йогурте и специях, жареные на углях. Подаётся с печёным перцем, помидором и лавашем. Сочно и слегка остро.',
      ],
    ),
    t(
      'adana',
      'grill',
      'shashlik',
      2700,
      300,
      25,
      true,
      ['lamb', 'spice', 'vegetables', 'bread'],
      ['gluten'],
      ['Adana kababı', 'Adana kebab', 'Адана-кебаб'],
      [
        'Əl ilə doğranmış quzu əti və acı istiot ilə yoğrulmuş uzun kabab. Közdə bişirilir və lavaşda dincəlir. Yanında soğan-sumaq salatı verilir.',
        'Hand-chopped lamb mixed with chilli flakes, shaped on a wide skewer and grilled until just charred. Rested on lavash and served with onion and sumac.',
        'Рубленая вручную баранина с перцем чили на широком шампуре, обжаренная на углях. Подаётся на лаваше с луком и сумахом.',
      ],
    ),
    t(
      'lamb_ribs',
      'grill',
      'ribs2',
      3800,
      400,
      35,
      false,
      ['lamb', 'spice', 'herbs'],
      [],
      ['Quzu qabırğa', 'Lamb ribs', 'Бараньи рёбра'],
      [
        'Yavaş bişirilmiş, sonra közdə qızardılmış quzu qabırğaları. Ət sümükdən asanlıqla ayrılır, üzəri tünd və kövrəkdir. Zeytun yağı və kekik ilə bitirilir.',
        'Lamb ribs slow-cooked, then finished on the grill. The meat slides off the bone with a dark, crackled crust. Finished with olive oil and thyme.',
        'Бараньи рёбра, томлёные и дожаренные на гриле. Мясо легко отходит от кости, корочка тёмная и хрустящая. Подаются с оливковым маслом и тимьяном.',
      ],
    ),
    t(
      'chicken_pilav',
      'main',
      'friedRice',
      1800,
      380,
      20,
      false,
      ['rice', 'chicken', 'herbs', 'nuts'],
      ['nuts', 'dairy'],
      ['Toyuqlu pilav', 'Chicken pilav', 'Плов с курицей'],
      [
        'Kərə yağında bişmiş bozumtul düyü, toyuq dilimləri və qovrulmuş badam. Dənəvər və xoş ətirlidir. Ayran ilə yaxşı gedir.',
        'Buttery rice cooked with shredded chicken and toasted almonds. Every grain stays separate and fragrant. A good match for ayran.',
        'Рассыпчатый рис на сливочном масле с курицей и жареным миндалём. Каждое зёрнышко отдельное и ароматное. Хорошо сочетается с айраном.',
      ],
    ),
  ],
  steakhouse: [
    t(
      'caesar',
      'starter',
      'caesar',
      1500,
      240,
      8,
      false,
      ['vegetables', 'cheese', 'bread', 'chicken'],
      ['gluten', 'dairy', 'egg', 'fish'],
      ['Sezar salatı', 'Chicken Caesar', 'Салат Цезарь'],
      [
        'Xırtıldayan romen salatı, parmezan, qızardılmış suxari və kremli sous. Qrilldə bişmiş toyuq dilimləri ilə tamamlanır. Ət yeməyindən əvvəl yüngül başlanğıcdır.',
        'Crisp romaine with parmesan, croutons and a creamy dressing, topped with grilled chicken. A light opener before the main event.',
        'Хрустящий ромэн с пармезаном, гренками и сливочной заправкой, сверху курица гриль. Лёгкое начало перед главным блюдом.',
      ],
    ),
    t(
      'truffle_fries',
      'starter',
      'fries',
      1100,
      220,
      12,
      false,
      ['potato', 'cheese', 'herbs'],
      ['dairy'],
      ['Trüf kartof fri', 'Truffle fries', 'Картофель фри с трюфелем'],
      [
        'Qızılı, kövrək kartof fri üzərinə parmezan və trüf yağı səpilir. Ətirli, duzlu və tamamilə bağımlılıq yaradır. Əsas yeməklə paylaşmaq üçün idealdır.',
        'Golden, crisp fries finished with parmesan and truffle oil. Fragrant, salty and genuinely addictive. Built for sharing alongside a steak.',
        'Золотистый хрустящий картофель фри с пармезаном и трюфельным маслом. Ароматный, солёный и затягивающий. Отлично делится к стейку.',
      ],
    ),
    t(
      'ribeye',
      'grill',
      'steak',
      7200,
      350,
      25,
      false,
      ['beef', 'herbs', 'spice'],
      ['dairy'],
      ['Ribay steyk', 'Ribeye steak', 'Рибай стейк'],
      [
        'Dərin mərmər quruluşlu mal əti, yüksək hərarətdə qızardılır və kərə yağı ilə nəmləndirilir. Üstündə iri dəniz duzu və qara istiot. Orta-az bişmiş halda ən yaxşıdır.',
        'Deeply marbled beef seared at high heat and basted with butter, finished with flaky salt and cracked pepper. At its best medium-rare, rested for the full juices.',
        'Хорошо мраморная говядина, обжаренная при высокой температуре и политая маслом, с крупной солью и перцем. Лучше всего medium-rare, дав мясу отдохнуть.',
      ],
    ),
    t(
      'striploin',
      'grill',
      'steakFries',
      5900,
      320,
      25,
      false,
      ['beef', 'potato', 'sauce'],
      ['dairy'],
      [
        'Strip steyk + frit',
        'Striploin and frites',
        'Стриплойн с картофелем фри',
      ],
      [
        'Sıx teksturalı, ətli striploin steyk, yanında qızardılmış kartof və bibər sousu. Hər dilim kənarda qabıqlı, ortada çəhrayıdır. Klassik və sabit seçim.',
        'A firm, beefy striploin sliced over golden fries with a peppercorn sauce. Each slice has a seared edge and a pink centre. A classic done reliably.',
        'Плотный насыщенный стриплойн с золотистым картофелем и перечным соусом. Каждый ломтик с корочкой снаружи и розовый внутри. Классика без сюрпризов.',
      ],
    ),
    t(
      'bbq_ribs',
      'grill',
      'ribs',
      4500,
      450,
      40,
      false,
      ['beef', 'sauce', 'spice'],
      ['gluten'],
      ['BBQ qabırğa', 'Smoked BBQ ribs', 'Копчёные рёбра BBQ'],
      [
        'Aşağı hərarətdə saatlarla hazırlanmış duzlu-şirin qabırğa. Ətri sümükdən asanlıqla ayrılır, sousu isə parıltılıdır. Qırmızı kələm salatı ilə təqdim olunur.',
        'Ribs smoked low and slow for hours, glazed in a sweet and smoky sauce. The meat falls from the bone and the glaze shines. Served with a crunchy slaw.',
        'Рёбра, томлёные на дыму часами, в сладко-копчёной глазури. Мясо отходит от кости, соус блестит. Подаются с хрустящим салатом коул-слоу.',
      ],
    ),
    t(
      'lamb_rack',
      'grill',
      'fire',
      6400,
      380,
      30,
      false,
      ['lamb', 'herbs', 'spice'],
      [],
      ['Quzu karesi', 'Charcoal lamb rack', 'Каре ягнёнка на углях'],
      [
        'Kömür közündə bişmiş quzu karesi, rozmarin və sarımsaq ilə. Xaricdə qabıq, ortada yumşaq çəhrayı ət. Odun tüstüsünün ətri hiss olunur.',
        'A lamb rack cooked over charcoal with rosemary and garlic. Crusty outside, tender and pink within. You can taste the wood smoke.',
        'Каре ягнёнка на углях с розмарином и чесноком. Снаружи корочка, внутри нежное розовое мясо. Чувствуется дымок древесины.',
      ],
    ),
  ],
  seafood: [
    t(
      'ceviche',
      'starter',
      'ceviche',
      1900,
      160,
      10,
      false,
      ['fish', 'citrus', 'herbs', 'vegetables'],
      ['fish'],
      ['Sevişe', 'Sea bass ceviche', 'Севиче из сибаса'],
      [
        'Laym şirəsində marinadlanmış təzə dəniz levreyi, qırmızı soğan və kişniş ilə. Dadı təmiz, turş və yüngül acıdır. Soyuq təqdim olunur.',
        'Fresh sea bass cured in lime juice with red onion and coriander. Clean, tangy and a touch spicy. Served ice cold.',
        'Свежий сибас, замаринованный в соке лайма, с красным луком и кинзой. Чистый, кислый вкус с лёгкой остринкой. Подаётся холодным.',
      ],
    ),
    t(
      'grilled_shrimp',
      'starter',
      'shrimp',
      2600,
      200,
      12,
      false,
      ['shrimp', 'herbs', 'citrus'],
      ['shellfish'],
      ['Qrill krevet', 'Grilled prawns', 'Креветки на гриле'],
      [
        'Sarımsaq və limon ilə marinadlanmış iri krevetlər qızardılır. Üzəri yüngül yanıq, içi isə şirəli. Yanında göyərti və limon dilimi verilir.',
        'Large prawns marinated in garlic and lemon and charred on the grill. Lightly blistered outside and juicy within. Served with herbs and a lemon wedge.',
        'Крупные креветки, замаринованные в чесноке и лимоне и обжаренные на гриле. Снаружи слегка подгорели, внутри сочные. Подаются с зеленью и лимоном.',
      ],
    ),
    t(
      'fish_soup',
      'soup',
      'soupRed',
      1500,
      400,
      25,
      false,
      ['fish', 'tomato', 'vegetables', 'herbs'],
      ['fish', 'shellfish'],
      ['Balıq şorbası', 'Fisherman’s soup', 'Рыбацкий суп'],
      [
        'Pomidor əsaslı bulyonda müxtəlif balıq və dəniz məhsulları. Şəffaf, ətirli və yüngül şafranlıdır. Üzərinə təzə cəfəri səpilir.',
        'A tomato broth with mixed fish and shellfish, clear, aromatic and lightly saffroned. Topped with fresh parsley. A soup that tastes of the coast.',
        'Томатный бульон с разной рыбой и морепродуктами, прозрачный и ароматный с намёком шафрана. Сверху свежая петрушка. Суп со вкусом побережья.',
      ],
    ),
    t(
      'salmon_plate',
      'main',
      'salmon',
      3300,
      280,
      20,
      false,
      ['fish', 'vegetables', 'herbs', 'citrus'],
      ['fish'],
      ['Qrill qızılbalıq', 'Grilled salmon', 'Лосось гриль'],
      [
        'Qrilldə bişmiş qızılbalıq filesi, buxarda tərəvəz və limon yağı ilə. İçi yumşaq, üzü isə xırtıldayır. Yüngül və doyurucu seçimdir.',
        'A grilled salmon fillet on steamed greens with lemon butter. Silky inside with a crisp skin. A light yet satisfying choice.',
        'Филе лосося гриль на овощах на пару с лимонным маслом. Внутри нежное, кожица хрустит. Лёгкий, но сытный выбор.',
      ],
    ),
    t(
      'sea_bream',
      'main',
      'fish',
      3600,
      300,
      25,
      false,
      ['fish', 'herbs', 'vegetables', 'citrus'],
      ['fish'],
      ['Çipura', 'Baked sea bream', 'Запечённая дорада'],
      [
        'Bütöv çipura ot və limonla bişirilir, filələri masada ayrılır. Ət ağ, yumşaq və incə dənizli dadlıdır. Zeytun yağı ilə təqdim olunur.',
        'A whole sea bream baked with herbs and lemon and fileted at the table. The flesh is white, tender and delicately briny. Dressed in olive oil.',
        'Целая дорада, запечённая с травами и лимоном и разделанная у стола. Мясо белое, нежное с тонким привкусом моря. Подаётся с оливковым маслом.',
      ],
    ),
    t(
      'garlic_shrimp',
      'main',
      'shrimpPan',
      3100,
      280,
      15,
      true,
      ['shrimp', 'spice', 'herbs', 'sauce'],
      ['shellfish', 'dairy'],
      ['Sarımsaqlı krevet', 'Garlic shrimp skillet', 'Креветки с чесноком'],
      [
        'Isti tavada sarımsaq yağı, acı istiot və kərə yağında qızarmış krevetlər. Sous çörəklə yığılmalıdır. Şirin, duzlu və yüngül acıdır.',
        'Shrimp sizzling in garlic butter and chilli in a hot skillet. Mop up the sauce with bread. Sweet, salty and gently spicy.',
        'Креветки шипят в чесночном масле с чили на горячей сковороде. Соус обязательно собирают хлебом. Сладко, солёно и слегка остро.',
      ],
    ),
    t(
      'seafood_rice',
      'main',
      'paella',
      3400,
      420,
      30,
      false,
      ['rice', 'shrimp', 'fish', 'spice'],
      ['shellfish', 'fish'],
      ['Dəniz məhsulları pilavı', 'Seafood paella', 'Паэлья с морепродуктами'],
      [
        'Şafranlı düyü, krevet, midiya və balıq ilə böyük tavada bişirilir. Dibində xırtıldayan socarrat qabıq qalır. İki nəfərlik porsiyadır.',
        'Saffron rice cooked in a wide pan with prawns, mussels and fish, developing a crisp socarrat crust. Generous enough for two to share.',
        'Рис с шафраном, креветками, мидиями и рыбой на широкой сковороде, с хрустящей корочкой соккарат. Порции хватит на двоих.',
      ],
    ),
  ],
  cafe: [
    t(
      'egg_toast',
      'breakfast',
      'eggToast',
      1300,
      240,
      10,
      false,
      ['bread', 'egg', 'vegetables', 'herbs'],
      ['gluten', 'egg'],
      ['Yumurtalı tost', 'Eggs on toast', 'Яйца на тосте'],
      [
        'Qızardılmış kərəli çörək üzərində yumşaq yumurta və avokado. Üzərinə bibər və göyərti səpilir. Sabah üçün yüngül, amma doyurucudur.',
        'Buttered toast topped with soft eggs and avocado, finished with pepper and herbs. Light yet filling, ideal for a slow morning.',
        'Тост с маслом, мягкие яйца и авокадо, сверху перец и зелень. Лёгкий, но сытный завтрак для неспешного утра.',
      ],
    ),
    t(
      'poached_plate',
      'breakfast',
      'avoToast',
      1600,
      260,
      12,
      false,
      ['egg', 'vegetables', 'bread', 'herbs'],
      ['gluten', 'egg'],
      ['Poşe yumurta', 'Poached egg plate', 'Яйцо пашот'],
      [
        'Çörək, brokoli və pomidor üzərində poşe yumurta. Sarı axıcı, çörək isə çıtırdır. Xırda göyərtilər tamamlayır.',
        'A poached egg on toast with broccoli and tomato, runny yolk and a crisp base. Finished with fresh herbs.',
        'Яйцо пашот на тосте с брокколи и томатом: жидкий желток и хрустящая основа. Завершается свежей зеленью.',
      ],
    ),
    t(
      'pancakes',
      'breakfast',
      'pancakes',
      1400,
      260,
      12,
      false,
      ['dough', 'egg', 'fruit'],
      ['gluten', 'dairy', 'egg'],
      ['Pancake', 'Pancake stack', 'Панкейки'],
      [
        'Üç qat kabarıq pancake, bal və təzə giləmeyvə ilə. Kənarları qızılı, içi yumşaqdır. Şirinlik qəhvə ilə balanslaşır.',
        'A fluffy stack of three pancakes with honey and fresh berries. Golden edges and a soft middle. The sweetness is balanced by a good coffee.',
        'Пышная стопка из трёх панкейков с мёдом и свежими ягодами. Золотистые края и мягкая сердцевина. Сладость уравновешивает хороший кофе.',
      ],
    ),
    t(
      'croissant',
      'breakfast',
      'croissant',
      900,
      120,
      6,
      false,
      ['dough', 'cheese'],
      ['gluten', 'dairy', 'egg'],
      ['Kərə yağlı kruassan', 'Butter croissant', 'Масляный круассан'],
      [
        'Gündəlik bişirilən qat-qat kərə yağlı kruassan. Xaricdən xırtıldayır, içində hava dolu təbəqələr var. Qəhvə ilə mükəmməl uyğunlaşır.',
        'A flaky butter croissant baked fresh each morning. Shatteringly crisp outside with an airy honeycomb inside. A perfect match for coffee.',
        'Слоёный масляный круассан, испечённый утром. Хрустящий снаружи и воздушный внутри. Идеальная пара к кофе.',
      ],
    ),
    t(
      'chicken_bowl',
      'main',
      'saladBowl',
      1800,
      340,
      12,
      false,
      ['chicken', 'vegetables', 'rice', 'sauce'],
      ['sesame', 'soy'],
      ['Toyuqlu boul', 'Chicken grain bowl', 'Боул с курицей'],
      [
        'Qızardılmış toyuq, qırmızı kələm, qaysı və düyü yastığında. Susam sousu ilə tamamlanır. Doyurucu, rəngli və yüngül.',
        'Seared chicken, red cabbage and sweetcorn over rice with a sesame dressing. Filling, colourful and light.',
        'Обжаренная курица, краснокочанная капуста и кукуруза на рисе с кунжутной заправкой. Сытный, яркий и лёгкий боул.',
      ],
    ),
    t(
      'cafe_penne',
      'main',
      'penne',
      1700,
      320,
      15,
      false,
      ['pasta', 'cheese', 'tomato', 'herbs'],
      ['gluten', 'dairy'],
      ['Pesto penne', 'Pesto penne', 'Пенне с песто'],
      [
        'Reyhan pestosu, parmezan və çiləkli pomidor ilə penne. Dadı yaşıl və təravətlidir. Günorta üçün sadə və xoşdur.',
        'Penne in basil pesto with parmesan and cherry tomatoes. Green, fresh and bright. Simple and satisfying for lunch.',
        'Пенне с базиликовым песто, пармезаном и помидорами черри. Свежий, яркий и зелёный вкус. Простой и приятный обед.',
      ],
    ),
  ],
  asian: [
    t(
      'pork_dumplings',
      'starter',
      'dumpl2',
      1300,
      180,
      12,
      false,
      ['dough', 'beef', 'vegetables', 'sauce'],
      ['gluten', 'soy', 'sesame'],
      ['Buxar dolmaları', 'Steamed dumplings', 'Паровые пельмени'],
      [
        'Buxarda bişmiş nazik xəmirli dolma, mal əti və tərəvəz ilə. Çili yağı və qara sirkə sousu ilə təqdim olunur. Hər tikə şirəli və yumşaqdır.',
        'Delicate steamed dumplings filled with beef and vegetables, served with chilli oil and black vinegar. Every bite is juicy and tender.',
        'Нежные паровые пельмени с говядиной и овощами, подаются с маслом чили и тёмным уксусом. Каждый кусочек сочный и мягкий.',
      ],
    ),
    t(
      'pho',
      'soup',
      'pho',
      1800,
      500,
      18,
      false,
      ['pasta', 'beef', 'herbs', 'spice'],
      ['gluten'],
      ['Fo şorbası', 'Beef pho', 'Фо с говядиной'],
      [
        'Ulduz anis, darçın və mal əti ilə uzun bişirilmiş şəffaf bulyon. Düyü əriştəsi və təzə reyhan ilə verilir. Çox ətirli və təmiz dadlıdır.',
        'A clear broth simmered long with star anise, cinnamon and beef, served with rice noodles and fresh basil. Aromatic and clean on the palate.',
        'Прозрачный бульон на звёздчатом анисе, корице и говядине с рисовой лапшой и свежим базиликом. Очень ароматный и чистый на вкус.',
      ],
    ),
    t(
      'pad_thai',
      'main',
      'padThai',
      2100,
      380,
      15,
      true,
      ['pasta', 'shrimp', 'egg', 'nuts'],
      ['gluten', 'shellfish', 'egg', 'nuts', 'soy'],
      ['Pad tay', 'Pad Thai', 'Пад-тай'],
      [
        'Wok-da qızardılmış düyü əriştəsi, krevet, yumurta və qovrulmuş fıstıq. Laym və tamarind sousu dadı canlandırır. Odlu və xoşagələn.',
        'Rice noodles stir-fried in a very hot wok with shrimp, egg and crushed peanuts. Lime and tamarind keep the flavour lively. Smoky and satisfying.',
        'Рисовая лапша, обжаренная в раскалённом воке с креветками, яйцом и арахисом. Лайм и тамаринд оживляют вкус. Дымный и сытный.',
      ],
    ),
    t(
      'bibimbap',
      'main',
      'bibimbap',
      2300,
      450,
      20,
      true,
      ['rice', 'beef', 'vegetables', 'egg'],
      ['egg', 'soy', 'sesame'],
      ['Bibimbap', 'Bibimbap', 'Бибимбап'],
      [
        'Isti daş qabda düyü, mal əti, tərəvəz və qızardılmış yumurta. Gochujang sousu ilə qarışdırıb yeyilir. Dibi xırtıldayan düyü xüsusi tamdır.',
        'Rice in a hot stone bowl topped with beef, vegetables and a fried egg. Stir with gochujang before eating. The crisp rice at the bottom is the prize.',
        'Рис в горячей каменной чаше с говядиной, овощами и жареным яйцом. Перед едой перемешивают с соусом кочуджан. Хрустящий рис на дне — награда.',
      ],
    ),
    t(
      'fried_rice',
      'main',
      'friedRice',
      1700,
      380,
      14,
      false,
      ['rice', 'egg', 'vegetables', 'chicken'],
      ['egg', 'soy'],
      ['Qızardılmış düyü', 'Wok fried rice', 'Жареный рис в воке'],
      [
        'Wok-da yüksək hərarətdə qızardılmış düyü, yumurta, toyuq və tərəvəz. Hər dənə ayrı, tüstü ətri güclüdür. Sadə, amma həmişə yaxşı.',
        'Rice fried hard in a wok with egg, chicken and vegetables. Each grain stays separate with a deep wok aroma. Simple, and always good.',
        'Рис, обжаренный на сильном огне в воке с яйцом, курицей и овощами. Каждое зёрнышко отдельное, с глубоким ароматом вока. Просто и всегда хорошо.',
      ],
    ),
    t(
      'sesame_noodles',
      'main',
      'noodles',
      1600,
      340,
      12,
      false,
      ['pasta', 'vegetables', 'herbs', 'sauce'],
      ['gluten', 'sesame', 'soy', 'nuts'],
      ['Susamlı əriştə', 'Sesame noodles', 'Лапша с кунжутом'],
      [
        'Soyuq-isti əriştə, qovrulmuş susam sousu və xiyar ilə. Ağır olmadan doyurucudur. Üzərinə təzə yaşıl soğan səpilir.',
        'Wheat noodles dressed in a roasted sesame sauce with cucumber and spring onion. Satisfying without being heavy.',
        'Пшеничная лапша в соусе из жареного кунжута с огурцом и зелёным луком. Сытно, но не тяжело.',
      ],
    ),
  ],
  mediterranean: [
    t(
      'veg_plate',
      'starter',
      'veg',
      1500,
      280,
      10,
      false,
      ['vegetables', 'herbs', 'cheese', 'tomato'],
      ['dairy'],
      ['Yunan salatı', 'Greek-style salad', 'Греческий салат'],
      [
        'Pomidor, xiyar, zeytun və ağ pendir iri doğranmışdır. Üzərinə zeytun yağı və qurudulmuş kekik səpilir. Təzə, sərin və yay dadlı.',
        'Chunky tomato, cucumber, olives and feta, dressed in olive oil and dried oregano. Fresh, cool and summery.',
        'Крупно нарезанные помидоры, огурцы, оливки и фета с оливковым маслом и сушёным орегано. Свежо, прохладно и по-летнему.',
      ],
    ),
    t(
      'grain_bowl',
      'starter',
      'bowl',
      1700,
      300,
      10,
      false,
      ['vegetables', 'nuts', 'herbs', 'citrus'],
      ['nuts', 'sesame'],
      ['Taxıl boulu', 'Mediterranean grain bowl', 'Зерновой боул'],
      [
        'Bulqur, xiyar, nohud və zeytun limon-yağ sousunda. Üstündə qoz-fındıq çıtırtısı. Doyurucu və tam yüngül.',
        'Bulgur, cucumber, chickpeas and olives in a lemon and oil dressing, topped with crunchy nuts. Hearty but still light.',
        'Булгур, огурцы, нут и оливки в лимонно-масляной заправке с хрустящими орехами. Сытно, но легко.',
      ],
    ),
    t(
      'pumpkin_soup',
      'soup',
      'soupPumpkin',
      1200,
      350,
      18,
      false,
      ['vegetables', 'yogurt', 'herbs'],
      ['dairy'],
      ['Balqabaq şorbası', 'Roasted pumpkin soup', 'Суп из тыквы'],
      [
        'Közdə bişirilmiş balqabaqdan krem şorba, qatıq və qovrulmuş toxum ilə. Yumşaq, şirin və isitmə effektli. Soyuq günlərin sevimlisi.',
        'A cream of roasted pumpkin finished with yogurt and toasted seeds. Soft, mildly sweet and warming. A cold-weather favourite.',
        'Крем-суп из запечённой тыквы с йогуртом и жареными семечками. Мягкий, слегка сладкий и согревающий. Любимец холодных дней.',
      ],
    ),
    t(
      'lemon_chicken',
      'main',
      'chicken',
      2300,
      380,
      30,
      false,
      ['chicken', 'potato', 'citrus', 'herbs'],
      [],
      ['Limonlu toyuq', 'Lemon herb chicken', 'Курица с лимоном'],
      [
        'Limon, sarımsaq və kekik ilə bişirilmiş toyuq budu, qızardılmış kartof ilə. Dərisi qızılı, ətri isə şirəli. Zeytun yağı hər şeyi birləşdirir.',
        'Chicken thighs roasted with lemon, garlic and thyme alongside crisp potatoes. Golden skin and juicy meat tied together by olive oil.',
        'Куриные бёдра, запечённые с лимоном, чесноком и тимьяном с хрустящим картофелем. Золотистая кожица и сочное мясо, связанные оливковым маслом.',
      ],
    ),
    t(
      'baked_fish',
      'main',
      'fish',
      3100,
      300,
      25,
      false,
      ['fish', 'tomato', 'herbs', 'citrus'],
      ['fish'],
      ['Soslu balıq', 'Tomato baked fish', 'Рыба в томатах'],
      [
        'Ağ balıq filesi pomidor, kapers və zeytunla sobada bişirilir. Sous dəniz və bağ ətirlidir. Çörəklə birlikdə yeyilir.',
        'White fish fillet baked in tomato with capers and olives. The sauce tastes of both sea and garden. Best with bread alongside.',
        'Филе белой рыбы, запечённое с томатами, каперсами и оливками. Соус пахнет и морем, и садом. Лучше всего с хлебом.',
      ],
    ),
    t(
      'shrimp_skillet',
      'main',
      'shrimpPan',
      2900,
      280,
      15,
      false,
      ['shrimp', 'tomato', 'herbs', 'cheese'],
      ['shellfish', 'dairy'],
      ['Saganaki krevet', 'Shrimp saganaki', 'Креветки саганаки'],
      [
        'Pomidor sousunda bişmiş krevetlər, üzərində əridilmiş fəta pendiri. Reyhan və kəkotu ətri hiss olunur. Çörəklə paylaşmaq üçündür.',
        'Shrimp simmered in tomato sauce with melted feta on top, scented with basil and oregano. Made for sharing with bread.',
        'Креветки в томатном соусе с расплавленной фетой сверху, с ароматом базилика и орегано. Для компании и с хлебом.',
      ],
    ),
  ],
  burger: [
    t(
      'fries',
      'starter',
      'fries',
      900,
      220,
      10,
      false,
      ['potato', 'spice'],
      [],
      ['Kartof fri', 'Seasoned fries', 'Картофель фри'],
      [
        'Qalın kəsilmiş, iki dəfə qızardılmış kartof, duzlu ədviyyat ilə. Çıtır, qızılı və qaynar. Hər burgerin ən yaxşı yoldaşıdır.',
        'Thick-cut fries fried twice and tossed in seasoning. Crisp, golden and piping hot. The best companion to any burger.',
        'Толстый картофель, обжаренный дважды, со специями. Хрустящий, золотистый и горячий. Лучший спутник любого бургера.',
      ],
    ),
    t(
      'wings',
      'starter',
      'wings',
      1500,
      280,
      18,
      true,
      ['chicken', 'spice', 'sauce'],
      ['gluten', 'dairy'],
      ['Bufalo qanadlar', 'Buffalo wings', 'Крылья баффало'],
      [
        'Çıtır toyuq qanadları acı bufalo sousunda sürtülür. Yanında kərəviz və pendir sousu verilir. Əl ilə yeyilir.',
        'Crisp chicken wings tossed in hot buffalo sauce, served with celery and a blue cheese dip. Eaten with both hands.',
        'Хрустящие куриные крылья в остром соусе баффало с сельдереем и сырным дипом. Едят руками.',
      ],
    ),
    t(
      'classic_burger',
      'main',
      'burger',
      1800,
      300,
      14,
      false,
      ['beef', 'cheese', 'vegetables', 'bread'],
      ['gluten', 'dairy', 'egg', 'sesame'],
      ['Klassik burger', 'Classic cheeseburger', 'Классический чизбургер'],
      [
        'Mal əti kotleti, çedar, turşu və xüsusi sousla yumşaq susamlı bulkada. Kotlet şirəli, bulka isə isti və yumşaqdır. Hər şey balanslıdır.',
        'A beef patty with cheddar, pickles and special sauce on a soft sesame bun. The patty is juicy and the bun warm and tender. Everything is in balance.',
        'Говяжья котлета с чеддером, огурцами и фирменным соусом на мягкой булочке с кунжутом. Котлета сочная, булка тёплая. Всё в балансе.',
      ],
    ),
    t(
      'double_stack',
      'main',
      'burger2',
      2600,
      420,
      16,
      false,
      ['beef', 'cheese', 'bread', 'sauce'],
      ['gluten', 'dairy', 'egg'],
      ['Ikiqat burger', 'Double stack', 'Дабл-бургер'],
      [
        'İki ət kotleti, ikiqat pendir və karamelləşmiş soğan. Böyük, şirəli və tam doyurucu. Əlləri qoymaq üçün çoxlu salfet lazımdır.',
        'Two beef patties with double cheese and caramelised onion. Big, juicy and fully filling. Keep a few napkins close.',
        'Две говяжьи котлеты с двойным сыром и карамелизированным луком. Большой, сочный и очень сытный. Держите салфетки под рукой.',
      ],
    ),
    t(
      'smokehouse',
      'main',
      'burgerFries',
      2400,
      400,
      16,
      true,
      ['beef', 'sauce', 'cheese', 'bread'],
      ['gluten', 'dairy', 'egg'],
      ['Tüstülü burger', 'Smokehouse burger', 'Смокхаус-бургер'],
      [
        'Tüstülənmiş BBQ sousu, çıtır soğan halqaları və çedar ilə mal kotleti. Dadı tüstülü, şirin və yüngül acıdır. Kartof fri ilə verilir.',
        'A beef patty with smoky BBQ sauce, crispy onion rings and cheddar. Smoky, sweet and a little hot. Served with fries.',
        'Говяжья котлета с копчёным соусом BBQ, хрустящими луковыми кольцами и чеддером. Дымный, сладкий и слегка острый. Подаётся с картофелем фри.',
      ],
    ),
    t(
      'chicken_burger',
      'main',
      'burger2',
      2000,
      340,
      14,
      false,
      ['chicken', 'vegetables', 'sauce', 'bread'],
      ['gluten', 'egg', 'dairy'],
      [
        'Çıtır toyuq burger',
        'Crispy chicken burger',
        'Бургер с хрустящей курицей',
      ],
      [
        'Xırtıldayan qızardılmış toyuq filesi, kələm salatı və yüngül acı mayonezlə. İçi şirəli, üstü kövrək. Bulka isə hələ də isti.',
        'A crisp fried chicken fillet with slaw and a lightly spicy mayo. Juicy inside and crunchy outside. The bun is still warm.',
        'Хрустящее куриное филе с капустным салатом и слегка острым майонезом. Сочное внутри, хрустящее снаружи. Булка ещё тёплая.',
      ],
    ),
  ],
  french: [
    t(
      'cheese_plate',
      'starter',
      'cheeseBoard',
      2200,
      200,
      8,
      false,
      ['cheese', 'nuts', 'fruit', 'bread'],
      ['dairy', 'nuts', 'gluten'],
      ['Pendir lövhəsi', 'Plateau de fromages', 'Сырная тарелка'],
      [
        'Fransız pendirləri, qoz və təzə meyvə ilə. Yumşaq, mavi və sərt pendirlərin yanında qızardılmış çörək var. Şərabla əla.',
        'French cheeses served with walnuts and fresh fruit, soft, blue and hard, with toasted bread. Excellent with wine.',
        'Французские сыры с грецкими орехами и свежими фруктами: мягкие, с плесенью и твёрдые, с поджаренным хлебом. Отлично с вином.',
      ],
    ),
    t(
      'veloute',
      'soup',
      'soupTomato',
      1300,
      330,
      15,
      false,
      ['tomato', 'vegetables', 'herbs'],
      ['dairy'],
      ['Pomidor velutesi', 'Tomato velouté', 'Томатный велюте'],
      [
        'İpək kimi hamar pomidor şorbası, bir az qaymaq və təzə reyhan ilə. Əsl bistro klassikası. Qızardılmış çörək ilə daha yaxşıdır.',
        'A velvety tomato soup with a touch of cream and basil, a true bistro classic. Even better with toasted bread.',
        'Бархатистый томатный суп с каплей сливок и базиликом. Настоящая бистро-классика. Ещё лучше с поджаренным хлебом.',
      ],
    ),
    t(
      'steak_frites',
      'main',
      'steakFries',
      4800,
      320,
      22,
      false,
      ['beef', 'potato', 'sauce', 'herbs'],
      ['dairy'],
      ['Steyk-frit', 'Steak frites', 'Стейк-фри'],
      [
        'Mal əti, qızardılmış kartof və yağlı bernez sousu. Ət çəhrayı, sous ipəkli, kartof isə çıtırdır. Bistro klassikasının ən yaxşısı.',
        'Beef steak with golden frites and a buttery béarnaise. Pink steak, silky sauce, crisp fries. Bistro classics at their best.',
        'Стейк из говядины с золотистым картофелем и маслянистым соусом беарнез. Розовое мясо, шелковистый соус, хрустящий картофель. Бистро-классика в лучшем виде.',
      ],
    ),
    t(
      'roast_chicken',
      'main',
      'chicken',
      3100,
      400,
      30,
      false,
      ['chicken', 'potato', 'herbs', 'vegetables'],
      ['dairy'],
      ['Qovurma toyuq', 'Poulet rôti', 'Жареная курица'],
      [
        'Dərisi qızılı, içi şirəli bütün toyuq budu, kartof və kekik ilə. Kərə yağlı sous altına yığılıb. Sadə, amma ürək isidən.',
        'Roast chicken with crisp golden skin, potatoes and thyme in a buttery pan sauce. Simple and heart-warming.',
        'Жареная курица с золотистой кожицей, картофелем и тимьяном в масляном соусе. Просто и согревает душу.',
      ],
    ),
    t(
      'saumon',
      'main',
      'salmon',
      3600,
      280,
      22,
      false,
      ['fish', 'vegetables', 'herbs', 'citrus'],
      ['fish', 'dairy'],
      ['Qızılbalıq sous ilə', 'Saumon à l’oseille', 'Лосось под соусом'],
      [
        'Tavada bişmiş qızılbalıq, limon-kərə yağı sousu və yaşıl tərəvəz ilə. Dərisi çıtır, içi çəhrayıdır. Yüngül və təmiz.',
        'Pan-seared salmon with a lemon beurre blanc and green vegetables. Crisp skin and a rosy centre. Light and clean.',
        'Лосось, обжаренный на сковороде, с лимонным соусом бёр блан и зелёными овощами. Хрустящая кожица, розовая серединка. Лёгко и чисто.',
      ],
    ),
    t(
      'oeuf',
      'starter',
      'avoToast',
      1500,
      240,
      12,
      false,
      ['egg', 'vegetables', 'bread', 'herbs'],
      ['gluten', 'egg', 'dairy'],
      ['Poşe yumurtalı salat', 'Salade au œuf poché', 'Салат с яйцом пашот'],
      [
        'Acı yaşıl salat, poşe yumurta və qızardılmış çörək. Sarı axıcıdır və sousu salat üzərinə yayılır. Yüngül, amma tam bir yemək.',
        'Peppery greens with a poached egg and toasted bread. The yolk runs and dresses the salad. Light, yet a meal in itself.',
        'Острые зелёные листья с яйцом пашот и тостом. Желток вытекает и заправляет салат. Лёгкое блюдо, но целая трапеза.',
      ],
    ),
  ],
  indian: [
    t(
      'samosa',
      'starter',
      'samosa',
      1000,
      180,
      12,
      true,
      ['dough', 'potato', 'spice', 'herbs'],
      ['gluten'],
      ['Samosa', 'Veg samosa', 'Самоса'],
      [
        'Xırtıldayan üçbucaq xəmirdə ədviyyatlı kartof və noxud. Yanında nanə və tamarind sousu verilir. Qızardılıb isti təqdim olunur.',
        'Crisp triangular pastry filled with spiced potato and peas, served with mint and tamarind chutneys. Fried to order and served hot.',
        'Хрустящие треугольные пирожки с картофелем и горошком со специями, подаются с мятным и тамариндовым чатни. Жарятся при заказе.',
      ],
    ),
    t(
      'butter_chicken',
      'main',
      'butterChicken',
      2400,
      380,
      25,
      false,
      ['chicken', 'tomato', 'yogurt', 'spice'],
      ['dairy', 'nuts'],
      ['Kərə yağlı toyuq', 'Butter chicken', 'Масляная курица'],
      [
        'Tandırda bişmiş toyuq pomidor, kərə yağı və qaymaqlı sousda. Sous yumşaq, kremsi və yüngül şirindir. Nan çörəyi ilə yeyin.',
        'Tandoor-cooked chicken in a rich tomato, butter and cream sauce. Smooth, creamy and mildly sweet. Eat with naan.',
        'Курица из тандыра в насыщенном соусе из томатов, масла и сливок. Мягкий, сливочный и слегка сладкий. Ешьте с наном.',
      ],
    ),
    t(
      'rogan_josh',
      'main',
      'curry',
      2800,
      400,
      35,
      true,
      ['lamb', 'tomato', 'spice', 'yogurt'],
      ['dairy'],
      ['Rogan coş', 'Lamb rogan josh', 'Роган-джош'],
      [
        'Yavaş bişmiş quzu əti zəfəran və Kəşmir istiotu ilə. Sous qırmızı, ətirli və orta acıdır. Nan və düyü ilə doyurucudur.',
        'Lamb slow-cooked with saffron and Kashmiri chilli in a deep red, fragrant gravy. Medium hot, best with naan and rice.',
        'Баранина, томлёная с шафраном и кашмирским перцем в красном ароматном соусе. Средней остроты, лучше с наном и рисом.',
      ],
    ),
    t(
      'veg_thali',
      'main',
      'thali',
      2200,
      480,
      20,
      true,
      ['vegetables', 'rice', 'yogurt', 'bread'],
      ['gluten', 'dairy'],
      ['Tərəvəz taliyi', 'Vegetarian thali', 'Вегетарианский тали'],
      [
        'Üç müxtəlif kərri, dal, düyü, çörək və raita bir məhsulda. Hər kasa fərqli ədviyyat ilə hazırlanır. Dünyanı bir qabda sınamaq üçün.',
        'Three curries, dal, rice, bread and raita on one tray. Each bowl is spiced differently. A little of everything on one plate.',
        'Три карри, дал, рис, хлеб и райта на одном подносе. Каждая пиала со своими специями. Всего понемногу на одной тарелке.',
      ],
    ),
    t(
      'tandoori',
      'grill',
      'tandoori',
      2600,
      320,
      28,
      true,
      ['chicken', 'yogurt', 'spice'],
      ['dairy'],
      ['Tandır toyuğu', 'Tandoori chicken', 'Курица тандури'],
      [
        'Qatıq və ədviyyatda marinadlanıb tandırda bişirilmiş toyuq. Xarici qabıq tüstülü və qırmızı, ət isə nəmli. Limon və soğan ilə verilir.',
        'Chicken marinated in yogurt and spices and roasted in a clay tandoor. Smoky red crust and tender meat. Served with lemon and onions.',
        'Курица, замаринованная в йогурте и специях и приготовленная в тандыре. Дымная красная корочка и нежное мясо. Подаётся с лимоном и луком.',
      ],
    ),
    t(
      'fish_curry',
      'main',
      'fishCurry',
      2900,
      360,
      25,
      true,
      ['fish', 'tomato', 'spice', 'citrus'],
      ['fish'],
      ['Balıq kərrisi', 'Goan fish curry', 'Рыбное карри'],
      [
        'Narıncı, turşməzə sousda yumşaq balıq. Kokos və tamarind dadı hiss olunur. Düyü ilə mükəmməl.',
        'Soft fish in an orange, tangy sauce with a hint of coconut and tamarind. Perfect with rice.',
        'Нежная рыба в оранжевом кисловатом соусе с оттенком кокоса и тамаринда. Идеально с рисом.',
      ],
    ),
  ],
  levantine: [
    t(
      'hummus_mezze',
      'starter',
      'mezze',
      1600,
      300,
      10,
      false,
      ['vegetables', 'bread', 'nuts', 'herbs'],
      ['gluten', 'sesame'],
      ['Humus və meze', 'Hummus mezze platter', 'Хумус и мезе'],
      [
        'Kremli humus, babaganuş və dip isti pita çörəyi ilə. Zeytun yağı və paprika damcıları var. Süfrəyə ilk gələn və tez bitən yemək.',
        'Creamy hummus, baba ghanoush and a bright dip with warm pita. Dressed with olive oil and paprika. The dish that arrives first and disappears first.',
        'Кремовый хумус, баба гануш и яркий дип с тёплой питой, с оливковым маслом и паприкой. Приходит первым и исчезает первым.',
      ],
    ),
    t(
      'fattoush',
      'starter',
      'salad',
      1200,
      240,
      8,
      false,
      ['vegetables', 'bread', 'herbs', 'citrus'],
      ['gluten'],
      ['Fəttuş salatı', 'Fattoush salad', 'Салат фаттуш'],
      [
        'Xırtıldayan pita parçaları, nar şirəsi, xiyar və pomidor ilə. Sumaq və nanə hər tikəni parlaq edir. Yüngül və təravətli.',
        'Crisp pita pieces, cucumber and tomato in a pomegranate and sumac dressing with fresh mint. Light, bright and refreshing.',
        'Хрустящие кусочки питы, огурцы и помидоры в заправке из граната и сумаха с мятой. Лёгко, ярко и свежо.',
      ],
    ),
    t(
      'shish_taouk',
      'grill',
      'skewers',
      2300,
      280,
      22,
      false,
      ['chicken', 'yogurt', 'spice', 'bread'],
      ['dairy', 'gluten'],
      ['Şiş tavuk', 'Shish taouk', 'Шиш-таук'],
      [
        'Sarımsaqlı qatıq marinadında toyuq parçaları közdə bişirilir. Yanında toum sousu və pita. Yumşaq, ətirli və şirəli.',
        'Chicken in garlic yogurt marinade grilled over embers, with toum and pita. Tender, fragrant and juicy.',
        'Курица в чесночно-йогуртовом маринаде на углях с соусом тум и питой. Нежно, ароматно и сочно.',
      ],
    ),
    t(
      'kafta',
      'grill',
      'kofte',
      2400,
      280,
      22,
      false,
      ['lamb', 'herbs', 'spice', 'tomato'],
      ['gluten'],
      ['Kafta', 'Lamb kafta', 'Кафта из баранины'],
      [
        'Cəfəri, soğan və ədviyyatla yoğrulmuş quzu qiyməsi, şiş üstündə qızardılır. Kənarları tünd, içi şirəlidir. Pomidor və pita ilə.',
        'Minced lamb mixed with parsley, onion and spices, grilled on skewers. Dark edges and a juicy centre. Served with tomato and pita.',
        'Бараний фарш с петрушкой, луком и специями, обжаренный на шампурах. Тёмные края и сочная серединка. С помидором и питой.',
      ],
    ),
    t(
      'levant_grill',
      'grill',
      'mixedGrill',
      4200,
      520,
      30,
      false,
      ['lamb', 'chicken', 'beef', 'vegetables'],
      ['gluten'],
      ['Qarışıq qrill', 'Mixed grill platter', 'Ассорти гриль'],
      [
        'Quzu, toyuq və mal əti qrilli, pita və salatla böyük bir qabda. İki-üç nəfərlik süfrə üçün uyğundur. Hər ət ayrı ədviyyatla hazırlanır.',
        'Lamb, chicken and beef grilled and piled onto a platter with pita and salad. Right for two or three at the table. Each meat has its own seasoning.',
        'Баранина, курица и говядина гриль на большом блюде с питой и салатом. Рассчитано на двоих-троих. Каждое мясо со своей приправой.',
      ],
    ),
    t(
      'mansaf',
      'main',
      'rice',
      2900,
      460,
      35,
      false,
      ['rice', 'lamb', 'yogurt', 'nuts'],
      ['dairy', 'nuts'],
      ['Mənsəf', 'Lamb mansaf', 'Мансаф с бараниной'],
      [
        'Qatıq sousunda yavaş bişmiş quzu, zəfəranlı düyü və qovrulmuş şam fıstığı ilə. Qatıq ağır görünür, amma dadı yüngül turşdur. Ənənəvi şənlik yeməyi.',
        'Slow-cooked lamb in a tangy yogurt sauce over saffron rice, scattered with toasted pine nuts. The yogurt tastes lightly sour rather than heavy. A traditional feast dish.',
        'Томлёная баранина в кисловатом йогуртовом соусе на шафрановом рисе с жареными кедровыми орешками. Йогурт даёт лёгкую кислинку. Традиционное праздничное блюдо.',
      ],
    ),
  ],
};

// ---------------------------------------------------------- restaurants ----
const DISTRICTS: Record<string, L3> = {
  oldcity: ['İçərişəhər', 'Old City', 'Ичеришехер'],
  fountain: ['Fəvvarələr meydanı', 'Fountain Square', 'Площадь Фонтанов'],
  port: ['Port Baku', 'Port Baku', 'Порт Баку'],
  white: ['Ağ şəhər', 'White City', 'Белый город'],
  nizami: ['Nizami küçəsi', 'Nizami Street', 'Улица Низами'],
  bayil: ['Bayıl', 'Bayil', 'Баилов'],
  yasamal: ['Yasamal', 'Yasamal', 'Ясамал'],
  narimanov: ['Nərimanov', 'Narimanov', 'Нариманов'],
};
// id order matches mockRestaurants: cuisine, district, priceLevel, cover photo
const META: [Cuisine, string, number, Photo][] = [
  ['azerbaijani', 'oldcity', 3, 'v1'],
  ['azerbaijani', 'fountain', 2, 'v9'],
  ['azerbaijani', 'yasamal', 1, 'v7'],
  ['azerbaijani', 'narimanov', 2, 'rice'],
  ['georgian', 'nizami', 2, 'v8'],
  ['georgian', 'yasamal', 2, 'rolls'],
  ['turkish', 'fountain', 2, 'mixedGrill'],
  ['turkish', 'bayil', 3, 'v4'],
  ['italian', 'oldcity', 3, 'v2'],
  ['italian', 'nizami', 2, 'pizza2'],
  ['italian', 'white', 2, 'ragu'],
  ['japanese', 'port', 4, 'v11'],
  ['japanese', 'white', 3, 'sushi2'],
  ['steakhouse', 'port', 4, 'v12'],
  ['steakhouse', 'bayil', 3, 'steak'],
  ['seafood', 'bayil', 3, 'seafoodBowl'],
  ['seafood', 'port', 4, 'v13'],
  ['cafe', 'fountain', 2, 'v5'],
  ['cafe', 'nizami', 1, 'v6'],
  ['asian', 'white', 2, 'padThai'],
  ['mediterranean', 'oldcity', 3, 'v3'],
  ['burger', 'narimanov', 1, 'burger2'],
  ['french', 'port', 4, 'v10'],
  ['indian', 'yasamal', 2, 'thali'],
  ['levantine', 'nizami', 2, 'mezze'],
];

const ABOUT: Record<Cuisine, L3> = {
  azerbaijani: [
    '{n} Azərbaycan mətbəxinin klassik reseptlərini ev rahatlığı ilə təqdim edir. Yeməklər közdə və sacda hazırlanır.',
    '{n} serves classic Azerbaijani recipes in a warm, home-style setting. Dishes are cooked over coals and on the saj.',
    '{n} подаёт классическую азербайджанскую кухню в уютной домашней атмосфере. Блюда готовят на углях и на садже.',
  ],
  italian: [
    '{n} İtalyan ənənəsini odun sobası və əl ilə hazırlanmış makaronla davam etdirir. Reseptlər sadədir, məhsullar isə təzədir.',
    '{n} carries Italian tradition with a wood oven and hand-made pasta. Simple recipes, fresh ingredients.',
    '{n} продолжает итальянские традиции: дровяная печь и паста ручной работы. Простые рецепты и свежие продукты.',
  ],
  japanese: [
    '{n} yapon mətbəxini dəqiqlik və təzə məhsulla təqdim edir. Menyu suşi, ramen və qrill yeməklərdən ibarətdir.',
    '{n} brings Japanese cooking with precision and fresh produce. The menu spans sushi, ramen and grilled plates.',
    '{n} готовит японскую кухню с точностью и свежими продуктами. В меню суши, рамен и блюда на гриле.',
  ],
  georgian: [
    '{n} Gürcü süfrəsinin cana yaxın dadlarını gətirir. Xaçapuri və xinkali hər gün təzə hazırlanır.',
    '{n} brings the generous flavours of a Georgian supra. Khachapuri and khinkali are made fresh every day.',
    '{n} приносит щедрые вкусы грузинской кухни. Хачапури и хинкали готовят свежими каждый день.',
  ],
  turkish: [
    '{n} kömür közündə hazırlanan Türk kabab və mezelərini təqdim edir. Süfrə paylaşma üçün qurulur.',
    '{n} serves Turkish kebabs and meze cooked over charcoal. The table is built for sharing.',
    '{n} предлагает турецкие кебабы и мезе на углях. Стол рассчитан на компанию.',
  ],
  steakhouse: [
    '{n} yaşlandırılmış mal ətini kömür qrilində hazırlayır. Mühit isə sakit və zərifdir.',
    '{n} cooks aged beef over a charcoal grill in a calm, polished room.',
    '{n} готовит выдержанную говядину на угольном гриле в спокойной изысканной атмосфере.',
  ],
  seafood: [
    '{n} Xəzər və Aralıq dənizi məhsullarını hər gün təzə alır. Menyu fəsillərə görə dəyişir.',
    '{n} sources Caspian and Mediterranean seafood daily. The menu changes with the season.',
    '{n} ежедневно закупает морепродукты Каспия и Средиземноморья. Меню меняется в зависимости от сезона.',
  ],
  cafe: [
    '{n} səhər yeməyi, qəhvə və yüngül günorta yeməkləri üçün sakit məkandır. Hər şey gün ərzində təzə hazırlanır.',
    '{n} is a calm spot for breakfast, coffee and light lunches, with everything made fresh through the day.',
    '{n} — спокойное место для завтраков, кофе и лёгких обедов. Всё готовится свежим в течение дня.',
  ],
  asian: [
    '{n} Asiyanın küçə yeməklərini wok və buxar ilə hazırlayır. Dadlar parlaq, porsiyalar bol.',
    '{n} cooks Asian street food on the wok and the steamer. Bright flavours, generous portions.',
    '{n} готовит азиатскую уличную еду на воке и пару. Яркие вкусы и щедрые порции.',
  ],
  mediterranean: [
    '{n} zeytun yağı, təzə otlar və dəniz ətirli Aralıq dənizi mətbəxini təqdim edir. Terrasda oturmaq xoşdur.',
    '{n} serves Mediterranean cooking built on olive oil, fresh herbs and the sea, with a pleasant terrace.',
    '{n} предлагает средиземноморскую кухню на оливковом масле, свежих травах и морских продуктах, с приятной террасой.',
  ],
  burger: [
    '{n} əl ilə formalaşdırılmış kotletlər və gündəlik bişən bulkalarla burger hazırlayır. Sadə, tez və dadlı.',
    '{n} builds burgers from hand-formed patties and buns baked daily. Simple, quick and tasty.',
    '{n} делает бургеры из котлет ручной формовки и булок, выпекаемых ежедневно. Просто, быстро и вкусно.',
  ],
  french: [
    '{n} Fransız bistro klassiklərini kərə yağı və şərab ilə hazırlayır. Mühit isti və səmimidir.',
    '{n} prepares French bistro classics with butter and wine in a warm, intimate room.',
    '{n} готовит классику французского бистро на сливочном масле и вине в тёплой интимной обстановке.',
  ],
  indian: [
    '{n} tandır və yavaş bişən kərrilərlə Hindistan ədviyyatlarını təqdim edir. Acılıq dərəcəsi sizin seçiminizdir.',
    '{n} serves Indian spice through the tandoor and slow-cooked curries. You choose the heat.',
    '{n} раскрывает индийские специи в тандыре и неспешных карри. Остроту выбираете вы.',
  ],
  levantine: [
    '{n} Şam mətbəxindən mezeləri və közdə bişmiş ətləri təqdim edir. Paylaşılan süfrə ən yaxşı seçimdir.',
    '{n} serves Levantine mezze and flame-grilled meats. A shared table is the best way to order.',
    '{n} предлагает левантийские мезе и мясо на огне. Лучше всего заказывать на общий стол.',
  ],
};

// ------------------------------------------------------------- comments ----
interface Pool {
  aspects: Aspect[][];
  text: L3[];
}
const C5: Pool = {
  aspects: [
    ['taste'],
    ['taste', 'temperature'],
    ['portion', 'value'],
    ['presentation'],
    ['taste', 'presentation'],
    ['temperature'],
    ['value'],
    ['taste', 'portion'],
    ['taste'],
    ['presentation', 'taste'],
  ],
  text: [
    [
      'Əla dad, hər şey çox təzə idi.',
      'Fantastic flavour and everything tasted very fresh.',
      'Потрясающий вкус, всё было очень свежим.',
    ],
    [
      'Qızmar gəldi, dadı da çox dolğun idi. Yenə sifariş edərəm.',
      'It arrived piping hot and the flavour was full. I will order again.',
      'Принесли горячим, вкус насыщенный. Закажу ещё раз.',
    ],
    [
      'Porsiya bol idi və qiymətə dəyər. Hamı doydu.',
      'A generous portion that was well worth the price. Everyone left full.',
      'Порция щедрая и стоит своих денег. Все наелись.',
    ],
    [
      'Təqdimat çox gözəldir, dadı da ona uyğun.',
      'The presentation is gorgeous and the taste lives up to it.',
      'Подача очень красивая, а вкус ей соответствует.',
    ],
    [
      'Həm gözəl görünür, həm də dadlıdır. Dostlarıma da məsləhət gördüm.',
      'It looks beautiful and tastes even better. I have recommended it to friends.',
      'Выглядит красиво и вкуснее, чем выглядит. Рекомендовал друзьям.',
    ],
    [
      'İlıq yox, tam lazım olan temperaturda gəldi. Bu qədər sadə şeylərə diqqət xoşdur.',
      'Served at exactly the right temperature. Little details like that matter.',
      'Подали ровно той температуры, которой нужно. Приятно, когда внимание к мелочам.',
    ],
    [
      'Bu qiymətə belə keyfiyyət tapmaq çətindir.',
      'Quality like this is hard to find at this price.',
      'Такое качество за такую цену найти непросто.',
    ],
    [
      'Bir nəfər üçün bir az böyükdür, amma bitirdim. Dadı əladır.',
      'A big portion for one person, but I finished it. The flavour is excellent.',
      'Порция большая для одного, но я всё съел. Вкус превосходный.',
    ],
    [
      'Bu şəhərdə yediyim ən yaxşılardandır.',
      'One of the best versions of this dish I have had in the city.',
      'Одно из лучших исполнений этого блюда в городе.',
    ],
    [
      'Möhtəşəm! Gözəl təqdim olunub və dadı bir-birini tamamlayır.',
      'Superb. Beautifully plated with flavours that complement each other.',
      'Великолепно! Красивая подача и вкусы, дополняющие друг друга.',
    ],
  ],
};
const C4: Pool = {
  aspects: [
    ['taste'],
    ['portion'],
    ['taste', 'value'],
    ['temperature'],
    ['presentation'],
    ['taste'],
    ['value'],
    ['portion', 'taste'],
    ['temperature', 'taste'],
    ['presentation', 'value'],
  ],
  text: [
    [
      'Dadlı idi, bir az duzu az olsaydı mükəmməl olardı.',
      'Tasty, though slightly less salt would have made it perfect.',
      'Вкусно, но чуть меньше соли — и было бы идеально.',
    ],
    [
      'Porsiya normaldır, amma bir az da çox ola bilərdi.',
      'A fair portion, though a bit more would not hurt.',
      'Порция нормальная, но можно было бы чуть больше.',
    ],
    [
      'Yaxşı dad, qiymət də məqbuldur.',
      'Good flavour and a fair price.',
      'Хороший вкус и приемлемая цена.',
    ],
    [
      'Bir az tez gəlsəydi daha isti olardı, amma dadı yaxşı idi.',
      'Would have been warmer if it arrived a bit sooner, but the taste was good.',
      'Было бы горячее, подай его чуть раньше, но вкус хороший.',
    ],
    [
      'Təqdimatı xoş idi, dadı da yaxşı.',
      'Nicely presented and good to eat.',
      'Приятная подача и хороший вкус.',
    ],
    [
      'Sevdim. Bir az daha ədviyyat əlavə etmək olardı.',
      'I liked it. A little more seasoning would take it further.',
      'Понравилось. Можно было добавить чуть больше специй.',
    ],
    [
      'Qiymətinə görə yaxşı seçimdir.',
      'A good choice for the price.',
      'Хороший выбор за свои деньги.',
    ],
    [
      'Doyurucu və dadlı, amma sous bir az çox idi.',
      'Filling and tasty, though a little heavy on the sauce.',
      'Сытно и вкусно, но соуса немного многовато.',
    ],
    [
      'Əsasən isti gəldi və dadı yaxşı idi. Yenə gələrəm.',
      'It arrived mostly hot and tasted good. I would come back.',
      'Принесли почти горячим, вкус хороший. Приду ещё.',
    ],
    [
      'Gözəl təqdimat, qiymət də ədalətlidir.',
      'Handsome plating and a fair price.',
      'Красивая подача и честная цена.',
    ],
  ],
};
const C3: Pool = {
  aspects: [
    ['taste'],
    ['temperature'],
    ['portion'],
    ['value'],
    ['taste', 'presentation'],
    ['taste'],
    ['temperature', 'taste'],
    ['portion', 'value'],
    ['presentation'],
    ['taste'],
  ],
  text: [
    [
      'Normal idi, amma xüsusi bir şey yox idi.',
      'Fine, but nothing special.',
      'Нормально, но ничего особенного.',
    ],
    [
      'Bir az soyuq gəldi, dadı isə orta idi.',
      'It arrived a little cold and the taste was average.',
      'Принесли чуть остывшим, вкус средний.',
    ],
    [
      'Porsiya kiçik göründü.',
      'The portion felt on the small side.',
      'Порция показалась маленькой.',
    ],
    [
      'Qiymətə görə bir az bahalıdır.',
      'A touch expensive for what it is.',
      'Для такого блюда немного дороговато.',
    ],
    [
      'Gözəl görünürdü, dadı isə gözləntimi tam doğrultmadı.',
      'It looked lovely, but the taste did not fully deliver.',
      'Выглядело красиво, но вкус не совсем оправдал ожидания.',
    ],
    [
      'Bir az yağlı idi, amma yeyilər.',
      'A little oily, but edible.',
      'Немного жирно, но есть можно.',
    ],
    [
      'İlıq gəldi və dad bir az sönük idi.',
      'It came lukewarm and the flavour was a bit flat.',
      'Подали тёплым, вкус немного пресный.',
    ],
    [
      'Doymaq üçün porsiya azdır, qiymət isə orta.',
      'The portion was small for the price.',
      'Порция маленькая для такой цены.',
    ],
    [
      'Təqdimat sadə idi, dad da elə.',
      'Plain presentation and plain flavour.',
      'Простая подача и такой же простой вкус.',
    ],
    [
      'Pis deyil, amma təkrar sifariş etməzdim.',
      'Not bad, but I would not order it again.',
      'Неплохо, но повторно заказывать бы не стал.',
    ],
  ],
};
const C2: Pool = {
  aspects: [
    ['taste'],
    ['temperature'],
    ['portion', 'value'],
    ['taste', 'value'],
    ['presentation'],
    ['temperature', 'taste'],
    ['taste'],
    ['value'],
    ['portion'],
    ['taste', 'temperature'],
  ],
  text: [
    [
      'Dadı gözlədiyim kimi deyildi, çox sönük idi.',
      'The flavour was not what I expected and rather dull.',
      'Вкус оказался не таким, как ожидал, довольно пресный.',
    ],
    [
      'Tamamilə soyumuşdu və bu xoş deyil.',
      'It arrived cold, which was disappointing.',
      'Пришло совсем холодным, и это разочаровало.',
    ],
    [
      'Kiçik porsiya, bu qiymətə çox az.',
      'A small portion at this price is hard to justify.',
      'Маленькая порция, и это тяжело оправдать такой ценой.',
    ],
    [
      'Dadına görə qiymət çox yüksəkdir.',
      'Too expensive for the taste.',
      'Слишком дорого для такого вкуса.',
    ],
    [
      'Təqdimatı səliqəsiz idi.',
      'The presentation looked careless.',
      'Подача выглядела небрежно.',
    ],
    [
      'Soyuq və duzlu idi. Bitirə bilmədim.',
      'Cold and over-salted. I could not finish it.',
      'Холодное и пересоленное. Доесть не смог.',
    ],
    [
      'Bu yeməyi daha yaxşı bişirə bilərdilər.',
      'This dish could have been cooked better.',
      'Это блюдо можно было приготовить лучше.',
    ],
    [
      'Qiymət məni qane etmədi.',
      'The price did not feel justified.',
      'Цена себя не оправдала.',
    ],
    [
      'Porsiya çox kiçik idi.',
      'The portion was far too small.',
      'Порция была слишком маленькой.',
    ],
    [
      'Dad yağlı və ağır idi, soyuq gəldi.',
      'Greasy and heavy, and it came cold.',
      'Жирно и тяжело, да ещё и холодным.',
    ],
  ],
};
const BANDS: Record<number, Pool> = { 5: C5, 4: C4, 3: C3, 2: C2, 1: C2 };

const NAMES = [
  'Aysel',
  'Murad',
  'Leyla',
  'Elvin',
  'Nigar',
  'Rashad',
  'Gunel',
  'Tural',
  'Sabina',
  'Kamran',
  'Anna',
  'Dmitry',
  'Olga',
  'Ivan',
  'Elena',
  'Sergey',
  'John',
  'Emma',
  'Daniel',
  'Sara',
  'Mark',
  'Fidan',
  'Orkhan',
  'Maria',
];
const SURNAME_INITIALS = 'ABCDEGHIKLMNOPRSTUVYZ';

// -------------------------------------------------------------- helpers ----
const ANCHOR_MS = Date.UTC(2026, 10, 10, 12, 0, 0); // 2026-11-10T12:00:00Z
const TREND_MONTHS = [
  '2026-05',
  '2026-06',
  '2026-07',
  '2026-08',
  '2026-09',
  '2026-10',
];
const DAY_MS = 86_400_000;
const MAX_REVIEWS = 40;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = (seed: string) => mulberry32(hash(seed));
const round1 = (n: number) => Math.round(n * 10) / 10;
const int = (r: () => number, lo: number, hi: number) =>
  lo + Math.floor(r() * (hi - lo + 1));
function shuffle<T>(items: T[], r: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
const weighted = (d: number[]) => d.reduce((sum, c, i) => sum + c * (5 - i), 0);
const summary = (
  distribution: number[],
  reviewCount: number,
): RatingSummary => {
  const count = distribution.reduce((a, b) => a + b, 0);
  return {
    average: count ? round1(weighted(distribution) / count) : 0,
    count,
    reviewCount,
    distribution: distribution as RatingSummary['distribution'],
  };
};

/** Distribution for 5..1 stars whose mean is close to `target`. */
function distribute(n: number, target: number, r: () => number): number[] {
  const jitter = [0, 1, 2, 3, 4].map(() => 0.9 + 0.2 * r());
  const probs = (l: number) => {
    const w = jitter.map((j, i) => Math.exp(-l * i) * j);
    const s = w.reduce((x, y) => x + y, 0);
    return w.map((x) => x / s);
  };
  let lo = 0;
  let hi = 4;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    const mean = probs(mid).reduce((x, p, k) => x + p * (5 - k), 0);
    // Larger decay concentrates on 5★, so the mean rises with `mid`.
    if (mean > target) hi = mid;
    else lo = mid;
  }
  const d = probs((lo + hi) / 2).map((p) => Math.round(p * n));
  d[0] = d[0]! + (n - d.reduce((x, y) => x + y, 0));
  return d;
}

/** Largest-remainder split of `total` by `weights`. */
function apportion(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  const exact = weights.map((w) => (w * total) / sum);
  const out = exact.map(Math.floor);
  let left = total - out.reduce((a, b) => a + b, 0);
  exact
    .map((v, i) => [v - Math.floor(v), i] as const)
    .sort((a, b) => b[0] - a[0])
    .forEach(([, i]) => {
      if (left-- > 0) out[i]!++;
    });
  return out;
}

// ------------------------------------------------------------- generator ----
interface Built {
  catalog: Catalog;
  reviews: Record<string, Review[]>;
}
const cache = new Map<string, Built>();

function makeReviews(
  distribution: number[],
  reviewCount: number,
  lang: CatalogLanguage,
  seed: string,
): Review[] {
  const r = rng(`${seed}:reviews`);
  const total = reviewCount;
  const stars = shuffle(
    apportion(total, distribution).flatMap((c, i) =>
      Array<number>(c).fill(5 - i),
    ),
    r,
  );
  const times = stars
    .map(() => ANCHOR_MS - Math.floor(r() * 180 * DAY_MS))
    .sort((a, b) => b - a);
  const li = LANG_INDEX[lang];
  const offset = int(r, 0, 9);
  return stars.map((rating, i) => {
    const pool = BANDS[rating]!;
    const k = (offset + i * 3 + int(r, 0, 2)) % pool.text.length;
    const first = NAMES[int(r, 0, NAMES.length - 1)]!;
    const surname = SURNAME_INITIALS[int(r, 0, SURNAME_INITIALS.length - 1)]!;
    return {
      // Unique across restaurants: shared dishes must not share a liked review.
      id: `${seed.replace(':', '_')}_r${String(i + 1).padStart(2, '0')}`,
      rating,
      createdAt: new Date(times[i]!).toISOString(),
      author: `${first[0]}*** ${surname}.`,
      comment: pool.text[k]![li],
      aspects: pool.aspects[k]!,
    };
  });
}

function pickPairings(dish: Tpl, all: Tpl[], r: () => number): string[] {
  const others = all.filter((d) => d.id !== dish.id);
  const rank: Record<Cat, Cat[]> = {
    breakfast: ['drink', 'dessert'],
    starter: ['main', 'grill', 'drink'],
    soup: ['main', 'grill', 'drink'],
    main: ['drink', 'starter', 'dessert'],
    grill: ['drink', 'starter', 'dessert'],
    dessert: ['drink'],
    drink: ['main', 'grill', 'dessert'],
  };
  const ordered = rank[dish.cat].flatMap((c) =>
    shuffle(
      others.filter((d) => d.cat === c),
      r,
    ),
  );
  const rest = shuffle(
    others.filter((d) => !ordered.includes(d)),
    r,
  );
  return [...ordered, ...rest].slice(0, int(r, 2, 4)).map((d) => d.id);
}

function build(index: number, lang: CatalogLanguage): Built {
  const restaurant = mockRestaurants[index]!;
  const [cuisine, districtKey, priceLevel, coverKey] = META[index]!;
  const li = LANG_INDEX[lang];
  const r = rng(restaurant.id);

  const pool = shuffle(POOLS[cuisine], r).slice(
    0,
    int(
      r,
      Math.min(5, POOLS[cuisine].length),
      Math.min(8, POOLS[cuisine].length),
    ),
  );
  const menu = [
    ...pool,
    ...shuffle(SHARED_DESSERTS, r).slice(0, int(r, 1, 2)),
    ...shuffle(SHARED_DRINKS, r).slice(0, int(r, 2, 3)),
  ];
  const sorted = [...menu].sort(
    (a, b) => CAT_ORDER.indexOf(a.cat) - CAT_ORDER.indexOf(b.cat),
  );

  const reviews: Record<string, Review[]> = {};
  const dishes: CatalogDish[] = sorted.map((tpl) => {
    const dr = rng(`${restaurant.id}:${tpl.id}`);
    const count = int(dr, 18, 420);
    const target = dr() < 0.12 ? 3.4 + dr() * 0.6 : 4.2 + dr() * 0.7;
    const distribution = distribute(count, target, dr);
    // Never advertise more written reviews than the list holds.
    const reviewCount = Math.min(
      MAX_REVIEWS,
      Math.max(6, Math.round(count * (0.15 + dr() * 0.2))),
    );
    const rating = summary(distribution, reviewCount);

    const list = makeReviews(
      distribution,
      reviewCount,
      lang,
      `${restaurant.id}:${tpl.id}`,
    );
    reviews[tpl.id] = list;

    const trend = TREND_MONTHS.map((month, i) => ({
      month,
      average:
        i === TREND_MONTHS.length - 1
          ? rating.average
          : round1(
              Math.min(5, Math.max(1, rating.average + (dr() - 0.5) * 0.6)),
            ),
    }));
    return {
      id: tpl.id,
      categoryId: tpl.cat,
      name: tpl.name[li],
      description: `${tpl.desc[li]} ${NOTES[tpl.cat][hash(tpl.id) % 2]![li]}`,
      imageUrl: img(tpl.photo),
      // No verified menu price exists for these demo restaurants, so none is shown.
      priceMinor: null,
      portionGrams: tpl.grams,
      prepMinutes: tpl.min,
      spicy: tpl.spicy,
      rating,
      trend,
      // Newest review, whatever its score: previews must not cherry-pick praise.
      preview: list[0] ?? null,
      ingredients: tpl.ing,
      allergens: tpl.alg,
      pairingIds: pickPairings(tpl, sorted, dr),
    };
  });

  const total = [0, 0, 0, 0, 0];
  let reviewCount = 0;
  for (const d of dishes) {
    d.rating.distribution.forEach((c, i) => (total[i]! += c));
    reviewCount += d.rating.reviewCount;
  }
  const used = CAT_ORDER.filter((c) => sorted.some((d) => d.cat === c));
  return {
    reviews,
    catalog: {
      restaurantId: restaurant.id,
      cuisine,
      coverUrl: img(coverKey),
      about: ABOUT[cuisine][li].replace('{n}', restaurant.name),
      district: DISTRICTS[districtKey]![li],
      priceLevel,
      rating: summary(total, reviewCount),
      categories: used.map((c) => ({ id: c, name: CATS[c][li] })),
      dishes,
    },
  };
}

function load(restaurantId: string, lang: CatalogLanguage): Built | null {
  const index = mockRestaurants.findIndex((x) => x.id === restaurantId);
  if (index < 0) return null;
  const key = `${restaurantId}:${lang}`;
  let built = cache.get(key);
  if (!built) {
    built = build(index, lang);
    cache.set(key, built);
  }
  return built;
}

// ---------------------------------------------------------------- public ----
export function mockCatalog(
  restaurantId: string,
  lang: CatalogLanguage,
): Catalog | null {
  return load(restaurantId, lang)?.catalog ?? null;
}

export function mockDishReviews(
  restaurantId: string,
  dishId: string,
  lang: CatalogLanguage,
): Review[] | null {
  return load(restaurantId, lang)?.reviews[dishId] ?? null;
}

export function mockDirectory(lang: CatalogLanguage): DirectoryEntry[] {
  return mockRestaurants.map((restaurant) => {
    const c = load(restaurant.id, lang)!.catalog;
    // A signature is food: skip drinks unless the menu has nothing else.
    const food = c.dishes.filter((d) => d.categoryId !== 'drink');
    const best = (food.length ? food : c.dishes).reduce((a, b) =>
      b.rating.average > a.rating.average ||
      (b.rating.average === a.rating.average && b.rating.count > a.rating.count)
        ? b
        : a,
    );
    return {
      restaurantId: c.restaurantId,
      cuisine: c.cuisine,
      coverUrl: c.coverUrl,
      district: c.district,
      priceLevel: c.priceLevel,
      rating: c.rating,
      dishCount: c.dishes.length,
      signature: best.name,
      ingredients: [...new Set(c.dishes.flatMap((d) => d.ingredients))],
    };
  });
}
