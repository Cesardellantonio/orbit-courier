const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const enginePath = path.join(__dirname, 'engine.js');
const load = () => require(enginePath);

test('gesture aim distinguishes taps and powered directional swipes', () => {
  const api = load(), game = api.createGame(), s = game.hubs[game.source];
  assert.equal(typeof api.aim, 'function');
  const tap = api.aim(game, {x:180,y:90}, {x:181,y:91});
  assert.equal(tap.isDrag, false);
  assert.equal(tap.power, 0);
  assert.equal(tap.x, 181);
  const short = api.aim(game, {x:0,y:0}, {x:0,y:-40});
  const long = api.aim(game, {x:0,y:0}, {x:0,y:-320});
  assert.equal(short.x, s.x);
  assert.equal(short.y, s.y - 40);
  assert.equal(short.power, .25);
  assert.equal(long.power, 1);
  assert.ok(long.speed > short.speed);
  assert.equal(api.launch(game, short.x, short.y, short.power), true);
  assert.equal(Math.hypot(game.packet.vx, game.packet.vy), short.speed);
  assert.equal(api.launch(game, 180, 90), false, 'one packet at a time');
});
test('launch rejects nonfinite inputs and clamps power', () => {
  const api = load(), game = api.createGame();
  assert.equal(api.launch(game, NaN, 1), false);
  assert.equal(api.launch(game, 180, 90, Infinity), false);
  assert.equal(api.launch(game, 180, 90, 50), true);
  assert.ok(Math.abs(Math.hypot(game.packet.vx, game.packet.vy) - 400) < 1e-8);
});
test('misses cost shields, reset the streak and end the shift after three losses', () => {
  const api = load(), game = api.createGame();
  for (let i = 0; i < 3; i++) {
    const source = game.hubs[game.source];
    api.launch(game, source.x, 700);
    advance(game, 5);
    assert.equal(game.lives, 2 - i);
    assert.equal(game.event.type, 'miss');
  }
  assert.equal(game.status, 'lost');
  assert.equal(api.launch(game, 180, 70), false);
});
// Place a packet on its destination to isolate scoring from aiming skill.
const deliver = game => {
  const target = game.hubs[game.target];
  game.packet = {x:target.x,y:target.y,vx:0,vy:0,age:0};
  game.status = 'flying';
  load().step(game, 0);
};
test('combo rewards consecutive deliveries, caps at x4 and resets on a miss', () => {
  const api = load(), game = api.createGame();
  assert.equal(typeof api.combo, 'function');
  for (const points of [100,100,200,200,300,300,400,400,400]) {
    deliver(game);
    assert.equal(game.event.points, points);
    assert.equal(api.combo(game), points / 100);
  }
  assert.equal(game.score, [100,100,200,200,300,300,400,400,400].reduce((a,b) => a+b, 0));
  const source = game.hubs[game.source];
  api.launch(game, source.x, 700);
  advance(game, 5);
  assert.equal(game.streak, 0);
  assert.equal(api.combo(game), 1);
  deliver(game);
  assert.equal(game.event.points, 100);
});
test('levels rise every three deliveries, increase hub speed and cap at eight', () => {
  const api = load(), game = api.createGame();
  assert.equal(game.level, 1);
  const angle = game.hubs[0].angle;
  api.step(game, .04);
  const baseMotion = game.hubs[0].angle - angle;
  deliver(game); deliver(game);
  assert.equal(game.level, 1);
  deliver(game);
  assert.equal(game.level, 2);
  assert.equal(game.event.levelUp, true);
  const fasterAngle = game.hubs[0].angle;
  api.step(game, .04);
  assert.ok(game.hubs[0].angle - fasterAngle > baseMotion);
  for (let i=0; i<30; i++) deliver(game);
  assert.equal(game.level, 8);
  const before = game.hubs[0].angle;
  api.step(game, NaN); api.step(game, Infinity); api.step(game, -.5);
  assert.equal(game.hubs[0].angle, before);
});
test('pulse earned every third delivery slows hubs for five seconds, not packets', () => {
  const api = load(), game = api.createGame();
  assert.equal(game.pulseReady, false);
  assert.equal(api.activatePulse(game), false);
  deliver(game); deliver(game);
  assert.equal(game.pulseReady, false);
  deliver(game);
  assert.equal(game.pulseReady, true);
  assert.equal(game.event.pulseEarned, true);
  assert.equal(api.activatePulse(game), true);
  assert.equal(game.pulseReady, false);
  assert.equal(game.pulseRemaining, 5);
  assert.equal(api.activatePulse(game), false);
  const angle = game.hubs[0].angle;
  api.launch(game, 180, 230);
  const p = {...game.packet};
  api.step(game, .04);
  assert.ok(Math.abs(game.hubs[0].angle - angle - .063 * .3 * .04) < 1e-10);
  assert.ok(Math.abs(game.packet.x - p.x - p.vx * .04) < 1e-10);
  advance(game, 6);
  assert.equal(game.pulseRemaining, 0);
  deliver(game); deliver(game); deliver(game);
  assert.equal(game.pulseReady, true);
  game.status = 'lost';
  assert.equal(api.activatePulse(game), false);
  const fresh = api.createGame();
  assert.equal(fresh.pulseReady, false);
  assert.equal(fresh.pulseRemaining, 0);
});
const advance = (game, seconds) => {
  for (let t = 0; t < seconds; t += 1 / 120) load().step(game, 1 / 120);
};

test('a tap toward the destination launches, travels and scores a delivery', () => {
  const api = load();
  const game = api.createGame();
  const target = game.hubs[game.target];
  assert.equal(typeof api.launch, 'function', 'launch is implemented');
  assert.equal(api.launch(game, target.x, target.y), true);
  assert.equal(game.status, 'flying');
  const start = { ...game.packet };
  api.step(game, 1 / 60);
  assert.notEqual(game.packet.y, start.y);
  advance(game, 3);
  assert.equal(game.delivered, 1);
  assert.equal(game.score, 100);
  assert.equal(game.lives, 3);
  assert.equal(game.event.type, 'delivery');
});

test('a shift starts with five hubs, a distinct destination, three shields and no score', () => {
  assert.ok(fs.existsSync(enginePath), 'game engine must exist');
  const game = load().createGame();
  assert.equal(game.hubs.length, 5);
  assert.notEqual(game.source, game.target);
  assert.equal(game.lives, 3);
  assert.equal(game.score, 0);
  assert.equal(game.status, 'ready');
});
