/* Each answer game supplies its own configuration and repeat policy. */
(() => {
  'use strict';
  const games = {
    'look-say': {
      title: 'Look & Say', description: '見えたカードを、出てきた順番にならべよう',
      defaults: {count: 1, rounds: 3},
      fields: [{key: 'count', label: '1回に表示される枚数', max: 6, unit: '枚'}, {key: 'rounds', label: '表示回数', max: 10, unit: '回'}],
      groups: c => Array.from({length: c.rounds}, (_, i) => ({label: (i + 1) + '回目', size: c.count})),
      allowRepeat: (c, size) => size < c.count * c.rounds
    }
  };
  function create(gameId, refs) {
    const game = games[gameId]; if (!game) throw new Error('Unknown game');
    const allowed = new Set(refs); let config = {...game.defaults}, answers = [], locked = false;
    function reset() { locked = false; answers = Array(game.groups(config).reduce((n, g) => n + g.size, 0)).fill(null); }
    function configure(next) {
      if (locked) return;
      const clean = {};
      for (const f of game.fields) {
        const n = Number(next[f.key]);
        if (!Number.isInteger(n) || n < 1 || n > f.max) throw new Error('Invalid setting');
        clean[f.key] = n;
      }
      if (JSON.stringify(clean) !== JSON.stringify(config)) { config = clean; reset(); }
    }
    reset();
    return {
      game, get config() { return {...config}; }, get answers() { return [...answers]; },
      get locked() { return locked; },
      lock() { if (answers.every(Boolean)) locked = true; return locked; },
      get repeat() { return game.allowRepeat(config, allowed.size); },
      configure, reset,
      add(ref) {
        const slot = answers.indexOf(null);
        if (locked || !allowed.has(ref) || slot < 0 || (!this.repeat && answers.includes(ref))) return false;
        answers[slot] = ref; return true;
      },
      remove(index) { if (!locked && Number.isInteger(index) && index >= 0 && index < answers.length) answers[index] = null; }
    };
  }
  window.StudentGames = {games, create};
})();
