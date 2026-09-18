const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup() {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  assert.match(html, /name="viewport"/);
  assert.ok(html.indexOf('src="engine.js"') < html.indexOf('src="main.js"'));
  const listeners = {}, calls = {};
  const ctx = new Proxy({}, { get: (_, key) => (...args) => { (calls[key] ||= []).push(args); }, set: () => true });
  const ids = ['space','score','lives','target','message','game-over','final-score','restart','combo','combo-fill','level','level-progress','power','power-fill','pulse','pulse-hint'];
  const elements = Object.fromEntries(ids.map(id => [id, {
    textContent: '', hidden: id === 'game-over', style: {}, disabled: false,
    getContext: () => ctx,
    getBoundingClientRect: () => ({ left: 10, top: 20, width: 360, height: 480 }),
    addEventListener: (type, fn) => { listeners[id + ':' + type] = fn; },
    setPointerCapture() {}, releasePointerCapture() {}, focus() {}, setAttribute() {}
  }]));
  let frame, game, now = 0;
  const real = require('./engine.js');
  const sandbox = {
    document: { getElementById: id => elements[id], addEventListener(type, fn) { listeners['document:'+type] = fn; } },
    window: { devicePixelRatio: 1, addEventListener() {}, matchMedia: () => ({matches:false}) },
    Orbit: { ...real, createGame() { game = real.createGame(); return game; } },
    requestAnimationFrame(fn) { frame = fn; }, Math, performance: { now: () => now }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'main.js'), 'utf8'), sandbox);
  const tick = seconds => { for (let i = 0; i < seconds * 60; i++) { now += 1000 / 60; frame(now); } };
  const pointer = (type, x, y, extra = {}) => listeners['space:' + type]({ pointerId: 1, isPrimary: true, button: 0, clientX: x + 10, clientY: y + 20, preventDefault() {}, ...extra });
  return {elements, listeners, calls, tick, pointer, get game() { return game; }, deliver() {
    const t = game.hubs[game.target];
    game.packet = {x:t.x,y:t.y,vx:0,vy:0,age:0}; game.status = 'flying'; tick(.02);
  }};
}

test('browser UI launches by tap and swipe, updates HUD, loses and restarts', () => {
  const ui = setup(), {pointer,tick,elements,listeners} = ui;
  tick(.1);
  const target = {...ui.game.hubs[ui.game.target]};
  pointer('pointerdown', target.x, target.y);
  pointer('pointerup', target.x, target.y);
  assert.equal(ui.game.status, 'flying');
  tick(2);
  assert.equal(ui.game.score, 100);
  assert.equal(Number(elements.score.textContent), 100);
  const source = {...ui.game.hubs[ui.game.source]};
  pointer('pointerdown', source.x, source.y);
  pointer('pointercancel', source.x, source.y);
  pointer('pointerup', source.x, 470);
  assert.equal(ui.game.status, 'ready');
  for (let i=0;i<3;i++) {
    const s = ui.game.hubs[ui.game.source];
    pointer('pointerdown', s.x, s.y);
    pointer('pointerup', s.x + (s.x-180)*2, s.y + (s.y-230)*2);
    assert.equal(ui.game.status, 'flying'); tick(4);
  }
  assert.equal(ui.game.status, 'lost');
  assert.equal(elements['game-over'].hidden, false);
  assert.equal(Number(elements['final-score'].textContent), 100);
  listeners['restart:click']();
  assert.equal(ui.game.status, 'ready');
  assert.equal(ui.game.lives, 3);
  assert.equal(ui.game.score, 0);
  assert.equal(elements['game-over'].hidden, true);
});

test('v2 drag shows power and aim preview, releases faster and cancels safely', () => {
  const ui = setup(), {pointer,tick,elements,calls,listeners} = ui;
  pointer('pointerdown', 100, 300);
  pointer('pointermove', 100, 140);
  tick(.02);
  assert.match(elements.power.textContent, /100%/);
  assert.equal(elements['power-fill'].style.width, '100%');
  assert.ok(calls.setLineDash.some(args => args[0].length > 0), 'aim line drawn');
  pointer('pointerup', 100, 140, {pointerId:2,isPrimary:false});
  assert.equal(ui.game.status, 'ready', 'second finger cannot release');
  pointer('pointerup', 100, 140);
  assert.ok(Math.abs(Math.hypot(ui.game.packet.vx,ui.game.packet.vy)-400) < 1e-8);
  assert.equal(ui.game.packet.vx, 0);
  for (const cancel of ['pointercancel','lostpointercapture','visibilitychange']) {
    listeners['restart:click']();
    pointer('pointerdown', 100, 300);
    pointer('pointermove', 100, 140);
    if (cancel === 'visibilitychange') listeners['document:visibilitychange']();
    else pointer(cancel, 100, 140);
    pointer('pointerup', 100, 140);
    assert.equal(ui.game.status, 'ready');
    assert.equal(elements['power-fill'].style.width, '0%');
  }
});

test('v2 combo, level, delivery particles and touch pulse track engine state', () => {
  const ui = setup(), {elements,listeners,tick,calls} = ui;
  assert.equal(elements.level.textContent, '1');
  assert.equal(elements.pulse.disabled, true);
  ui.deliver(); ui.deliver(); ui.deliver();
  assert.equal(elements.level.textContent, '2');
  assert.match(elements.combo.textContent, /2.*3/);
  assert.equal(elements.score.textContent, '400');
  assert.match(elements.message.textContent, /200/);
  assert.match(elements.message.textContent, /Level 2/);
  assert.ok(calls.fillText.some(args => String(args[0]).includes('+200')), 'floating delivery score');
  assert.ok(calls.fillRect.length > 0, 'flash/particles rendered');
  assert.equal(elements.pulse.disabled, false);
  listeners['pulse:click']();
  assert.equal(ui.game.pulseReady, false);
  assert.equal(ui.game.pulseRemaining, 5);
  assert.equal(elements.pulse.disabled, true);
  assert.match(elements.pulse.textContent, /5\.0/);
  tick(6);
  assert.equal(ui.game.pulseRemaining, 0);
  assert.match(elements['pulse-hint'].textContent, /3/);
  listeners['restart:click']();
  assert.equal(elements.level.textContent, '1');
  assert.equal(ui.game.streak, 0);
  assert.equal(ui.game.pulseRemaining, 0);
  assert.equal(elements.pulse.disabled, true);
});
