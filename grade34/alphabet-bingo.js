(() => {
  'use strict';
  const {letters, card, create} = window.AlphabetBingo;
  const el = id => document.getElementById(id);
  const screens = ['home', 'guide', 'game'];
  const sound = new Audio('assets/ui/bingo/drum-original.mp3');
  const cymbal = new Audio('assets/ui/bingo/finish-original.mp3');
  sound.loop = true;
  const FRAME_MS = 70;
  let mode = 'upper', page = 'home', game = null, timer = null, soundOn = true, finished = false;
  function image(letter, guide = false) {
    const spec = card(letter, mode, guide), img = document.createElement('img');
    img.src = spec.src; img.alt = spec.label; img.draggable = false;
    img.onerror = () => { el('status').textContent = 'カード画像を読み込めません。接続を確認してページを読み直してください。'; };
    return img;
  }
  function tile(letter, animate = false, guide = false) {
    const node = document.createElement('div'); node.className = 'picture-card' + (animate ? ' arrive' : '');
    node.append(image(letter, guide)); return node;
  }
  function stopSound() { for (const audio of [sound, cymbal]) { audio.pause(); audio.currentTime = 0; } }
  function play(audio) {
    if (soundOn) audio.play().catch(() => { el('status').textContent = '音声を再生できませんでした。抽選は続けられます。'; });
  }
  function updateButtons() {
    const state = game?.state();
    el('next').disabled = finished || !state || !state.remaining.length;
    el('next').textContent = state?.drawing ? 'STOP' : 'START';
    el('finish-game').disabled = finished || !state;
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
  el('open-guide').onclick = () => { show('guide'); el('alphabet').replaceChildren(...letters.map(l => tile(l, false, true))); };
  el('open-game').onclick = () => {
    cancelDraw(); game = create(mode); finished = false; show('game');
    el('game').classList.remove('finished');
    el('draw-label').textContent = 'DRAW';
    el('current').hidden = false; el('remaining').hidden = true; el('remaining').replaceChildren();
    el('next').hidden = false; el('finish-game').hidden = false; el('close-game').hidden = true;
    el('drawn').replaceChildren(); el('current').replaceChildren(); el('current').textContent = '?';
    updateButtons();
  };
  el('next').onclick = () => {
    if (!game || finished) return;
    if (game.state().drawing) {
      clearInterval(timer); timer = null; stopSound();
      const picked = game.complete();
      el('current').replaceChildren(image(picked));
      el('current').classList.remove('rolling'); el('current').classList.add('reveal');
      el('drawn').append(tile(picked, true)); updateButtons(); play(cymbal);
      el('status').textContent = game.state().remaining.length ? `${card(picked, mode).label} が出ました` : '26文字すべて出ました。「抽選終了」で確認できます。';
      return;
    }
    if (!game.begin()) return;
    updateButtons(); el('status').textContent = '';
    el('current').classList.remove('reveal'); el('current').classList.add('rolling');
    stopSound();
    play(sound);
    timer = setInterval(() => {
      const state = game.state();
      el('current').replaceChildren(image(state.remaining[Math.floor(Math.random() * state.remaining.length)]));
    }, FRAME_MS);
  };
  el('finish-game').onclick = () => {
    if (!game || finished) return;
    if (!game.state().order.length && !confirm('まだ抽選していません。終了しますか？')) return;
    cancelDraw(); finished = true;
    el('game').classList.add('finished'); el('draw-label').textContent = 'まだ出ていない文字';
    el('current').hidden = true; el('remaining').hidden = false;
    el('remaining').replaceChildren(...game.state().remaining.map(l => tile(l)));
    el('remaining').style.gridTemplateRows = `repeat(${Math.max(1, Math.ceil(game.state().remaining.length / 3))}, minmax(0, 1fr))`;
    if (!game.state().remaining.length) el('remaining').textContent = 'すべて出ました';
    el('next').hidden = true; el('finish-game').hidden = true; el('close-game').hidden = false;
    el('status').textContent = `未抽選 ${game.state().remaining.length}枚 ／ 抽選済み ${game.state().order.length}枚`;
    updateButtons();
  };
  el('close-game').onclick = () => show('home');
  el('back').onclick = async () => {
    if (document.fullscreenElement) { await document.exitFullscreen?.(); return; }
    if (page === 'game' && !confirm('抽選を終了して開始画面へ戻りますか？')) return;
    show('home');
  };
  el('sound').onclick = () => {
    soundOn = !soundOn; if (!soundOn) stopSound();
    else if (game?.state().drawing) play(sound);
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
    if (drawing) el('status').textContent = '抽選を中断しました。STARTで再開してください。';
  });
  window.addEventListener('pagehide', cancelDraw);
  choose('upper'); show('home');
})();
