/* Shared, versioned card-set transport. No game settings or answers in this payload. */
(() => {
  'use strict';
  const data = window.DEKIRU_DATA;
  const cards = new Map(data.cards.map(c => [c.id, c]));
  const catalog = new Map([
    ...data.cards.map(c => ['card:' + c.id, {...c, ref: 'card:' + c.id}]),
    ...data.expressions.map(c => ['expr:' + c.id, {...c, category: 'expressions', ref: 'expr:' + c.id}])
  ]);
  const base = '../';
  function source(item) {
    const linked = cards.get(item.cardId);
    return item.pictureUrl || linked?.pictureUrl || ((item.image || linked?.image) ? base + (item.image || linked.image) : '');
  }
  function validate(value) {
    if (!value || value.v !== 1) throw new Error('この配信URLの形式には対応していません。先生に新しいURLをもらってください。');
    if (!Array.isArray(value.refs) || !value.refs.length || value.refs.length > 2000 ||
        value.refs.some(ref => typeof ref !== 'string' || !catalog.has(ref)))
      throw new Error('カード情報が見つかりません。先生にURLを確認してください。');
    if (!Number.isInteger(value.d) || value.d < 1 || value.d > 7) throw new Error('カードの表示設定が正しくありません。');
    return {v: 1, refs: [...new Set(value.refs)], d: value.d};
  }
  function snapshot(items, display) {
    return validate({v: 1, refs: items.map(i => i.ref), d: (display.image ? 1 : 0) | (display.english ? 2 : 0) | (display.japanese ? 4 : 0)});
  }
  async function transform(bytes, decompress) {
    const stream = new Blob([bytes]).stream().pipeThrough(decompress ? new DecompressionStream('deflate') : new CompressionStream('deflate'));
    const reader = stream.getReader();
    const parts = []; let length = 0;
    for (;;) {
      const {value, done} = await reader.read(); if (done) break;
      length += value.length;
      if (length > 160000) { await reader.cancel(); throw new Error('配信データが大きすぎます。'); }
      parts.push(value);
    }
    const result = new Uint8Array(length); let at = 0;
    parts.forEach(p => { result.set(p, at); at += p.length; });
    return result;
  }
  async function encode(payload) {
    let bytes = new TextEncoder().encode(JSON.stringify(validate(payload))), prefix = 'j.';
    if (typeof CompressionStream !== 'undefined') { bytes = await transform(bytes, false); prefix = 'z.'; }
    return prefix + btoa(Array.from(bytes, b => String.fromCharCode(b)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  async function decode(token) {
    if (typeof token !== 'string' || token.length > 220000 || !/^[jz]\.[A-Za-z0-9_-]+$/.test(token)) throw new Error('配信URLが正しくありません。');
    try {
      let bytes = Uint8Array.from(atob(token.slice(2).replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
      if (token[0] === 'z') {
        if (typeof DecompressionStream === 'undefined') throw new Error('新しいバージョンのブラウザで開いてください。');
        bytes = await transform(bytes, true);
      }
      return validate(JSON.parse(new TextDecoder().decode(bytes)));
    } catch (error) { throw new Error('配信URLを読み込めません。' + error.message); }
  }
  function resolve(payload) {
    const p = validate(payload);
    return {items: p.refs.map(ref => catalog.get(ref)), display: {image: !!(p.d & 1), english: !!(p.d & 2), japanese: !!(p.d & 4)}};
  }
  window.CardSet = {snapshot, encode, decode, resolve, source};
})();
