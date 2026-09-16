/* Let's Try! 2: language-material panels in S__62382090_0.jpg–S__62382098_0.jpg.
 * Explicit words are Basic. Review categories inherit previously mapped cards only.
 * Missing/Plus-only pictures become text expressions, not new invented pictures.
 */
(() => {
  "use strict";
  const data = window.DEKIRU_DATA;
  const words = (category, list) => ({ category, words: list.split("|") });
  const units = {
    1: {
      categories: ["feelings", "colors", "numbers", "foods", "drinks", "desserts", "fruits_vegetables", "sports", "animals"],
      words: [words("daily_life", "morning|afternoon|night"), words("actions_5", "like"), words("people", "I|you")],
      expressions: "hello|good|goodbye|see you|world|do|not|don't|yes|no",
    },
    2: {
      categories: ["feelings", "body", "colors", "sports"],
      words: [words("weather", "weather|sunny|rainy|cloudy|snowy|hot|cold"), words("actions_5", "walk|run|jump|turn|look|play|like"), words("actions_6", "stop|stand|sit|put"), words("directions", "up|down|left|right"), words("body", "hand|leg"), words("activities", "cards|tag|jump rope"), words("clothes", "shirt|shorts|sweater|pants|boots|cap"), words("people", "I|you")],
      expressions: "how|is|it|let's|today|around|bingo|game|outside|inside|yes|sorry|do|don't|what",
    },
    3: {
      categories: ["foods", "drinks", "desserts", "sports", "activities", "weather"],
      words: [words("days", "Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday"), words("fruits_vegetables", "mushroom|watermelon"), words("foods", "soup|pie|sandwich"), words("actions_5", "like"), words("people", "I|you")],
      expressions: "day|fresh|what|is|it|do|don't|yes|no|how",
    },
    4: {
      categories: ["numbers", "days", "sports", "activities", "weather"],
      words: [words("numbers", "forty|fifty|sixty"), words("meals", "breakfast|lunch|dinner"), words("actions_6", "study"), words("personal_items", "TV|bed|book|bath")],
      expressions: "what|time|is|it|a.m.|p.m.|about|you|wake-up|snack|homework|dream|how",
    },
    5: {
      categories: ["weather", "days", "shapes", "colors", "sports", "animals", "foods", "drinks", "desserts", "numbers"],
      words: [words("actions_5", "have|like"), words("stationery", "glue stick|scissors|pen|stapler|magnet|marker|pencil sharpener|pencil case|pencil|eraser|ruler|crayon"), words("personal_items", "desk|chair|clock|calendar"), words("states", "big|small|long|short"), words("people", "I|you")],
      expressions: "do|not|don't|yes|no|this|is|for|the|a|please|how|many|what",
    },
    6: {
      categories: ["numbers", "personal_items", "stationery"],
      words: [words("town", "bookstore|station|taxi"), words("school", "school"), words("drinks", "juice"), words("personal_items", "telephone"), words("directions", "up|down|left|right"), words("actions_5", "look|have|want")],
      expressions: "what|this|hint|please|how|many|letter|try|again|news|shop|do|don't|yes|no|that|is|right|sorry",
      alphabet: true,
    },
    7: {
      categories: ["fruits_vegetables", "foods", "drinks", "desserts", "numbers"],
      words: [words("fruits_vegetables", "potato|cabbage|corn|cherry"), words("foods", "sausage"), words("actions_5", "want|have|like"), words("people", "I|you")],
      expressions: "vegetable|fruit|what|do|don't|please|how|many|here|are|thank|this|is|it|a|yes|no",
    },
    8: {
      categories: ["days", "sports"],
      words: [words("impressions", "favorite"), words("directions", "go|straight|turn|right|left"), words("actions_6", "stop"), words("actions_5", "like"), words("school", "school|classroom|restroom|science room|music room|arts and crafts room|computer room|cooking room|school nurse's office|school principal's office|teachers' office|entrance|library|gym|playground"), words("subjects", "music"), words("meals", "lunch"), words("people", "I|you")],
      expressions: "place|my|our|why|this|is|the|for|do|don't|yes|no",
    },
    9: {
      categories: ["daily_life", "feelings", "actions_5", "actions_6", "subjects"],
      words: [words("daily_life", "wash my face|go to school|go home|brush my teeth|put away my futon|check my school bag|leave my house|take out the garbage"), words("people", "I|you|boy|girl"), words("actions_5", "have"), words("meals", "breakfast|dinner"), words("town", "house"), words("school", "school"), words("impressions", "wonderful")],
      expressions: "wake up|everything|later|yummy|am|it|is|day|up|my|the|to|homework|a|dream|at|this|favorite|place",
    },
  };
  const translations = {
    up: "上へ", to: "～へ",
    good: "よい", world: "世界", "let's": "～しよう", today: "今日", around: "周りに", bingo: "ビンゴ", game: "ゲーム", outside: "外", inside: "中",
    stand: "立つ", sit: "座る", put: "置く", shorts: "半ズボン", boots: "長靴", day: "日・曜日", fresh: "新鮮な", time: "時間", "a.m.": "午前", "p.m.": "午後", about: "～について・およそ", you: "あなた", "wake-up": "起床", snack: "おやつ", homework: "宿題", dream: "夢", book: "本", bath: "入浴",
    "glue stick": "スティックのり", magnet: "磁石", clock: "時計", calendar: "カレンダー", letter: "文字", try: "試す", again: "もう一度", news: "ニュース", shop: "店", telephone: "電話", vegetable: "野菜", place: "場所", my: "私の", our: "私たちの", why: "なぜ",
    "science room": "理科室", "arts and crafts room": "図工室", "cooking room": "家庭科室", "wash my face": "顔を洗う", "put away my futon": "布団を片付ける", "check my school bag": "通学かばんを確認する", "leave my house": "家を出る", "wake up": "起きる", everything: "すべて", later: "あとで", yummy: "おいしい", at: "～時に", favorite: "お気に入りの",
  };
  const additionalExpressions = [];
  // The source has 1–30 and multiples of ten. Supply 31–59 as text cards
  // so the textbook's 1–60 range is usable without inventing illustrations.
  const numberWords = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  const numberIds = [];
  for (let value = 31; value <= 60; value++) {
    const id = `number_${String(value).padStart(3, "0")}`;
    if (!data.cards.some(card => card.id === id)) {
      const english = ["", "", "", "thirty", "forty", "fifty", "sixty"][Math.floor(value / 10)] + (value % 10 ? `-${numberWords[value % 10]}` : "");
      data.cards.push({ id, english, japanese: String(value), speech: english, image: "", category: "numbers", displayGroup: "lt2-text" });
    }
    numberIds.push(id);
  }
  const missingPictures = [];
  const mappings = [];
  const normalize = text => text.toLowerCase();
  function expression(text, unit, pictureCategory) {
    let record = [...data.expressions, ...additionalExpressions].find(e => e.english === text);
    if (!record) {
      record = { id: `lt2_expr_${additionalExpressions.length + 1}`, cardId: "", english: text, japanese: translations[text] || "", speech: text };
      additionalExpressions.push(record);
    }
    if (pictureCategory) missingPictures.push({ unit, category: pictureCategory, english: text });
    return { cardId: "", expressionId: record.id };
  }
  for (const [unitKey, config] of Object.entries(units)) {
    const unit = Number(unitKey);
    const selected = [];
    if (unit === 4) numberIds.forEach(cardId => selected.push({ cardId, expressionId: "" }));
    for (const group of config.words) for (const text of group.words) {
      const card = data.cards.find(c => c.category === group.category && c.displayGroup !== "plus" && normalize(c.english) === normalize(text));
      selected.push(card ? { cardId: card.id, expressionId: "" } : expression(text, unit, group.category));
    }
    for (const text of config.expressions.split("|")) selected.push(expression(text, unit));
    if (config.alphabet) {
      for (const letter of "abcdefghijklmnopqrstuvwxyz") {
        const record = { id: `lt2_lower_${letter}`, cardId: "", english: letter, japanese: `小文字${letter}`, speech: letter.toUpperCase() };
        additionalExpressions.push(record);
        selected.push({ cardId: "", expressionId: record.id });
      }
      for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
        const record = data.expressions.find(e => e.english === letter && e.japanese === `大文字${letter}`);
        selected.push({ cardId: "", expressionId: record.id });
      }
    }
    const seen = new Set();
    for (const item of selected) {
      const key = item.cardId || item.expressionId;
      if (seen.has(key)) continue;
      seen.add(key);
      mappings.push({ unit, order: seen.size, ...item });
    }
  }
  // Stable IDs: do not renumber the existing lt2_expr_* records.
  const timePhrases = [
    ["wake_up", "Wake-up Time", "起きる時間", "daily_002"],
    ["breakfast", "Breakfast Time", "朝食の時間", "daily_006"],
    ["study", "Study Time", "勉強の時間", "action6_018"],
    ["lunch", "Lunch Time", "昼食の時間", "daily_011"],
    ["snack", "Snack Time", "おやつの時間", "", "snack-flat.png"],
    ["homework", "Homework Time", "宿題の時間", "daily_016"],
    ["dinner", "Dinner Time", "夕食の時間", "daily_017"],
    ["bath", "Bath Time", "お風呂の時間", "daily_021"],
    ["bed", "Bed Time", "寝る時間", "daily_022"],
    ["dream", "Dream Time", "夢を見る時間", "", "dream-flat.png"],
  ];
  let timeOrder = Math.max(...mappings.filter(item => item.unit === 4).map(item => item.order));
  for (const [key, english, japanese, cardId, picture] of timePhrases) {
    const id = `lt2_time_${key}`;
    additionalExpressions.push({ id, english, japanese, speech: english, cardId,
      ...(picture ? { pictureUrl: `../image_output/lets_try/${picture}` } : {}) });
    mappings.push({ unit: 4, order: ++timeOrder, cardId: "", expressionId: id });
  }
  data.expressions.push(...additionalExpressions);
  data.lt2Mappings = mappings;
  data.lt2ReviewCategoriesByUnit = Object.fromEntries(Object.entries(units).map(([unit, config]) => [unit, config.categories]));
  data.lt2MissingPictures = missingPictures;
})();
