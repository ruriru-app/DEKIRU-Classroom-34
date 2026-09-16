(() => {
  'use strict';
  const {letters, card, create} = window.AlphabetBingo;
  const el = id => document.getElementById(id);
  const screens = ['home', 'guide', 'game', 'finish'];
  const sound = new Audio('assets/ui/bingo/draw.mp3');
  const ROLL_MS = 2800, FRAME_MS = 70;
  let mode = 'upper', page = 'home', game = null, timer = null, soundOn = true;
  function image(letter) {
    const spec = card(letter, mode), img = document.createElement('img');
    img.src = spec.src; img.alt = spec.label; img.draggable = false;
    img.onerror = () => { el('status').textContent = 'カード画像を読み込めません。接続を確認してページを読み直してください。'; };
    return img;
  }
  function tile(letter, animate = false) {
    const node = document.createElement('div'); node.className = 'picture-card' + (animate ? ' arrive' : '');
    node.append(image(letter)); return node;
  }
  function stopSound() { sound.pause(); sound.currentTime = 0; }
  function updateButtons() {
    const state = game?.state();
    el('next').disabled = !state || state.drawing || !state.remaining.length;
    el('finish-game').disabled = !!state?.drawing;
    el('counter').textContent = `${state?.order.length || 0} / 26`;
  }
  function cancelDraw() {
    if (timer !== null) clearInterval(timer);
    timer = null; stopSound();
    const wasDrawing = game?.state().drawing;
    game?.cancel();
    el('current').classList.remove('rolling', 'reveal');
    if (wasDrawing) {
      const order = game.state().order;
      el('current').replaceChildren();
      if (order.length) el('current').append(image(order[order.length - 1]));
      else el('current').textContent = '?';
    }
    updateButtons();
  }
  function show(next) {
    cancelDraw(); page = next;
    screens.forEach(id => { el(id).hidden = id !== page; });
    el('back').hidden = page === 'home';
    el('mode-label').textContent = page === 'home' ? '' : mode === 'upper' ? '大文字' : '小文字';
    el('status').textContent = '';
  }
  function choose(next) {
    mode = next;
    for (const key of ['upper', 'lower']) {
      el('mode-' + key).classList.toggle('on', key === mode);
      el('mode-' + key).setAttribute('aria-pressed', String(key === mode));
    }
    // Cache the 26 supplied cards before the rolling display starts.
    for (const letter of letters) { const img = new Image(); img.src = card(letter, mode).src; }
  }
  el('mode-upper').onclick = () => choose('upper');
  el('mode-lower').onclick = () => choose('lower');
  el('open-guide').onclick = () => { show('guide'); el('alphabet').replaceChildren(...letters.map(l => tile(l))); };
  el('open-game').onclick = () => {
    cancelDraw(); game = create(mode); show('game');
    el('drawn').replaceChildren(); el('current').replaceChildren(); el('current').textContent = '?';
    updateButtons();
  };
  el('next').onclick = () => {
    if (!game || !game.begin()) return;
    const started = performance.now();
    updateButtons(); el('status').textContent = '';
    el('current').classList.remove('reveal'); el('current').classList.add('rolling');
    stopSound();
    if (soundOn) sound.play().catch(() => { el('status').textContent = '音声を再生できませんでした。抽選は続けられます。'; });
    timer = setInterval(() => {
      const state = game.state();
      if (performance.now() - started < ROLL_MS) {
        el('current').replaceChildren(image(state.remaining[Math.floor(Math.random() * state.remaining.length)])); return;
      }
      clearInterval(timer); timer = null;
      const picked = game.complete();
      if (!picked) return;
      el('current').replaceChildren(image(picked));
      el('current').classList.remove('rolling'); el('current').classList.add('reveal');
      el('drawn').append(tile(picked, true)); updateButtons();
      el('status').textContent = game.state().remaining.length ? `${card(picked, mode).label} が出ました` : '26文字すべて出ました。「抽選終了」で順番を確認できます。';
    }, FRAME_MS);
  };
  el('finish-game').onclick = () => {
    if (!game || game.state().drawing) return;
    if (!game.state().order.length && !confirm('まだ抽選していません。終了しますか？')) return;
    show('finish'); el('readout').replaceChildren(...game.state().order.map(l => tile(l)));
    if (!game.state().order.length) el('status').textContent = '抽選したカードはありません。';
  };
  el('close-game').onclick = () => show('home');
  el('back').onclick = async () => {
    if (document.fullscreenElement) { await document.exitFullscreen?.(); return; }
    if (page === 'game' && !confirm('抽選を終了して開始画面へ戻りますか？')) return;
    show('home');
  };
  el('sound').onclick = () => {
    soundOn = !soundOn; if (!soundOn) stopSound();
    el('sound').textContent = soundOn ? '🔊' : '🔇';
    el('sound').setAttribute('aria-pressed', String(soundOn));
    el('sound').setAttribute('aria-label', soundOn ? '効果音をOFFにする' : '効果音をONにする');
  };
  el('fullscreen').onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else throw new Error('Unavailable');
    } catch { el('status').textContent = 'この端末では全画面にできません。画面内いっぱいで表示しています。'; }
  };
  document.addEventListener('fullscreenchange', () => {
    el('fullscreen').setAttribute('aria-pressed', String(!!document.fullscreenElement));
    el('fullscreen').setAttribute('aria-label', document.fullscreenElement ? '全画面を解除' : '全画面表示');
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    const drawing = game?.state().drawing; cancelDraw();
    if (drawing) el('status').textContent = '抽選を中断しました。NEXTで再開してください。';
  });
  window.addEventListener('pagehide', cancelDraw);
  choose('upper'); show('home');
})();
