const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('browser UI launches by tap and swipe, updates HUD, loses and restarts', () => {
  const htmlPath = path.join(__dirname, 'index.html');
  assert.ok(fs.existsSync(htmlPath), 'playable browser entry must exist');
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.match(html, /name="viewport"/);
  assert.ok(html.indexOf('src="engine.js"') < html.indexOf('src="main.js"'));
  const listeners = {};
  const gradient = { addColorStop() {} };
  const ctx = new Proxy({}, { get: (_, key) => key === 'createRadialGradient' ? () => gradient : () => {}, set: () => true });
  const elements = Object.fromEntries(['space', 'score', 'lives', 'target', 'message', 'game-over', 'final-score', 'restart'].map(id => [id, {
    textContent: '', hidden: id === 'game-over', style: {},
    getContext: () => ctx,
    getBoundingClientRect: () => ({ left: 10, top: 20, width: 360, height: 480 }),
    addEventListener: (type, fn) => { listeners[id + ':' + type] = fn; },
    setPointerCapture() {}, releasePointerCapture() {}, focus() {}, setAttribute() {}
  }]));
  let frame, game, now = 0;
  const real = require('./engine.js');
  const sandbox = {
    document: { getElementById: id => elements[id], addEventListener() {} },
    window: { devicePixelRatio: 1, addEventListener() {} },
    Orbit: { ...real, createGame() { game = real.createGame(); return game; } },
    requestAnimationFrame(fn) { frame = fn; }, Math, performance: { now: () => now }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'main.js'), 'utf8'), sandbox);
  const tick = (seconds) => { for (let i = 0; i < seconds * 60; i++) { now += 1000 / 60; frame(now); } };
  const pointer = (type, x, y, extra = {}) => listeners['space:' + type]({ pointerId: 1, isPrimary: true, button: 0, clientX: x + 10, clientY: y + 20, preventDefault() {}, ...extra });
  tick(0.1);
  const target = { ...game.hubs[game.target] };
  pointer('pointerdown', target.x, target.y);
  pointer('pointerup', target.x, target.y);
  assert.equal(game.status, 'flying');
  tick(2);
  assert.equal(game.score, 100);
  assert.equal(Number(elements.score.textContent), 100);
  const source = { ...game.hubs[game.source] };
  pointer('pointerdown', source.x, source.y);
  pointer('pointercancel', source.x, source.y);
  pointer('pointerup', source.x, 470);
  assert.equal(game.status, 'ready', 'cancelled gestures must not launch');
  for (let i = 0; i < 3; i++) {
    const s = game.hubs[game.source];
    const dx = s.x - 180, dy = s.y - 230;
    pointer('pointerdown', s.x, s.y);
    pointer('pointerup', s.x + dx * 2, s.y + dy * 2);
    assert.equal(game.status, 'flying');
    tick(4);
  }
  assert.equal(game.status, 'lost');
  assert.equal(elements['game-over'].hidden, false);
  assert.equal(Number(elements['final-score'].textContent), 100);
  listeners['restart:click']();
  assert.equal(game.status, 'ready');
  assert.equal(game.lives, 3);
  assert.equal(game.score, 0);
  assert.equal(elements['game-over'].hidden, true);
});
