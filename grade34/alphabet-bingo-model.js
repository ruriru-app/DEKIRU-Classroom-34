(() => {
  'use strict';
  const letters = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
  function checkMode(mode) {
    if (!['upper', 'lower'].includes(mode)) throw new Error('Unsupported alphabet mode');
  }
  function card(letter, mode, guide = false) {
    checkMode(mode);
    if (!letters.includes(letter)) throw new Error('Unknown letter');
    const label = mode === 'upper' ? letter : letter.toLowerCase();
    const folder = guide && mode === 'lower' ? 'alphabet-guide' : 'alphabet';
    return {label, src: `assets/cards/lets_try/${folder}/${mode}-${label}.png?v=${folder === 'alphabet-guide' ? 3 : 2}`};
  }
  function create(mode = 'upper', random = Math.random) {
    checkMode(mode);
    const remaining = [...letters], order = [];
    let pending = null;
    return {
      begin() {
        if (pending || !remaining.length) return null;
        pending = remaining[Math.min(remaining.length - 1, Math.max(0, Math.floor(random() * remaining.length)))];
        return pending;
      },
      complete() {
        if (!pending) return null;
        const letter = pending;
        remaining.splice(remaining.indexOf(letter), 1);
        order.push(letter); pending = null;
        return letter;
      },
      cancel() { pending = null; },
      state() { return {mode, remaining: [...remaining], order: [...order], drawing: pending !== null}; }
    };
  }
  window.AlphabetBingo = {letters, card, create};
})();
