/* Look & Say: sequence logic adapted from release_repo/index.html. */
window.LookSay = (() => {
  const levels = { Easy: 2000, Normal: 1000, Hard: 500, 'Extra Hard': 150 };
  const settings = { count: 1, rounds: 3, level: 'Normal' };
  let history = [], duration = 1000, running = false, token = 0, timer, host;
  let phase = 'idle', round = 0;
  const shuffle = items => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  function buildHistory(pool, count, rounds) {
    const unique = [...new Map(pool.map(item => [item.ref || item.id, item])).values()];
    if (!unique.length) return [];
    const deck = [];
    while (deck.length < count * rounds) deck.push(...shuffle(unique));
    return Array.from({ length: rounds }, (_, i) => deck.slice(i * count, (i + 1) * count));
  }
  function stop(reset = false) {
    token++;
    clearTimeout(timer);
    running = false;
    if (reset) { history = []; phase = 'idle'; }
    else if (phase === 'live' || phase === 'loading') phase = 'hidden';
  }
  function settingsMarkup() {
    return `<h2>Look &amp; Say の設定</h2><label class="look-setting">表示枚数<select data-look-setting="count">${Array.from({length:6}, (_,i)=>`<option value="${i+1}" ${settings.count===i+1?'selected':''}>${i+1}枚</option>`).join('')}</select></label>
      <label class="look-setting">表示回数<select data-look-setting="rounds">${Array.from({length:10}, (_,i)=>`<option value="${i+1}" ${settings.rounds===i+1?'selected':''}>${i+1}回</option>`).join('')}</select></label>
      <fieldset class="look-levels"><legend>表示時間</legend>${Object.keys(levels).map(level=>`<label><input type="radio" name="look-level" data-look-setting="level" value="${level}" ${settings.level===level?'checked':''}> ${level}</label>`).join('')}</fieldset>
      <p>カードが足りない場合は、全語を使ってから繰り返します。</p>`;
  }
  function markup() {
    return `<div class="look-game"><header class="game-heading"><button class="back-button" data-feature="close" aria-label="戻る"><img src="assets/ui/originals/戻る.svg" alt=""></button><h1>Look &amp; Say</h1><button class="fullscreen-button" data-fullscreen aria-label="全画面表示切り替え">⛶</button></header>
      <div class="look-stage" id="look-stage"></div><footer class="game-controls">${['start','replay','answer'].map(action=>`<button class="game-art-button" data-look-action="${action}" aria-label="${action.toUpperCase()}"><img src="assets/ui/${action}.svg" alt="${action.toUpperCase()}"></button>`).join('')}</footer></div>`;
  }
  function attach(options) { host = options; paint(); }
  function paint() {
    const stage = document.getElementById('look-stage');
    if (!stage || !host) return;
    const row = items => `<div class="look-row" style="--count:${items.length}">${items.map(host.card).join('')}</div>`;
    stage.classList.toggle('show-answer', phase === 'answer');
    if (phase === 'live') stage.innerHTML = row(history[round]);
    else if (phase === 'answer') stage.innerHTML = history.map((items,i)=>`<section class="look-answer-set"><h2>${i+1}回目</h2>${row(items)}</section>`).join('');
    else stage.innerHTML = `<p class="look-message">${phase==='loading'?'準備中…':phase==='hidden'?'何が出たかな？':'STARTを押してください'}</p>`;
    document.querySelectorAll('[data-look-action]').forEach(button => {
      button.disabled = running || (button.dataset.lookAction !== 'start' && !history.length);
    });
    document.querySelectorAll('.unit-sidebar input,.unit-sidebar select,.unit-sidebar [data-word-ref]').forEach(control => { control.disabled = running; });
  }
  async function preload(items) {
    await Promise.all([...new Set(items.map(host.source).filter(Boolean))].map(source => new Promise(resolve => {
      const image = new Image();
      let fallback = false;
      const timeout = setTimeout(resolve, 5000);
      const done = () => { clearTimeout(timeout); resolve(); };
      image.onload = () => { if (image.decode) image.decode().catch(()=>{}).then(done); else done(); };
      image.onerror = () => {
        if (!fallback && source.includes('/assets/cards/')) {
          fallback = true; image.src = 'assets/cards/' + source.split('/assets/cards/')[1];
        } else done();
      };
      image.src = source;
    })));
  }
  async function play() {
    running = true; phase = 'loading'; paint();
    const run = ++token;
    await preload(history.flat());
    if (run !== token) return;
    const next = i => {
      if (run !== token) return;
      if (i >= history.length) { running = false; phase = 'hidden'; paint(); return; }
      round = i; phase = 'live'; paint();
      // Start timing after a frame can paint the new cards.
      requestAnimationFrame(() => {
        if (run !== token) return;
        timer = setTimeout(() => next(i + 1), duration);
      });
    };
    next(0);
  }
  function action(name) {
    if (running || !host) return;
    if (name === 'start') {
      history = [];
      phase = 'idle';
      if (!Object.values(host.display()).some(Boolean)) { host.notify('表示設定を1つ以上選んでください'); paint(); return; }
      history = buildHistory(host.pool(), settings.count, settings.rounds);
      if (!history.length) { host.notify('使用する単語を選んでください'); phase='idle'; paint(); return; }
      duration = levels[settings.level];
      play();
    } else if (name === 'replay' && history.length) play();
    else if (name === 'answer' && history.length) { phase = 'answer'; paint(); }
  }
  function configure(key, value) {
    if (running) return;
    if (key === 'level' && levels[value]) settings.level = value;
    if (key === 'count') settings.count = Math.max(1, Math.min(6, Number(value) || 1));
    if (key === 'rounds') settings.rounds = Math.max(1, Math.min(10, Number(value) || 1));
  }
  return { markup, settingsMarkup, attach, stop, action, configure, buildHistory, isRunning: () => running };
})();
