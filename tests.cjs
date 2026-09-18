const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const enginePath = path.join(__dirname, 'engine.js');
const load = () => require(enginePath);
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
