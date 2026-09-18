/* Shared browser/Node simulation. No imports or network requests. */
(function (root) {
  'use strict';
  const names = ['NOVA', 'KEPLER', 'LYRA', 'ATLAS', 'SOL'];
  function createGame() {
    const hubs = names.map((name, i) => {
      const angle = -Math.PI / 2 + i * Math.PI * 2 / 5;
      return { name, angle, x: 180 + Math.cos(angle) * 132, y: 230 + Math.sin(angle) * 160 };
    });
    return { hubs, source: 3, target: 0, lives: 3, score: 0, delivered: 0,
      streak: 0, status: 'ready', packet: null, event: null };
  }
  function launch(game, x, y) {
    if (game.status !== 'ready') return false;
    const source = game.hubs[game.source];
    const dx = x - source.x, dy = y - source.y;
    const length = Math.hypot(dx, dy);
    if (!Number.isFinite(length) || length < 8) return false;
    game.packet = { x: source.x, y: source.y, vx: dx / length * 215, vy: dy / length * 215, age: 0 };
    game.status = 'flying';
    game.event = null;
    return true;
  }
  function step(game, dt) {
    if (!['ready', 'flying'].includes(game.status)) return;
    dt = Math.min(Math.max(dt, 0), 0.04);
    for (const hub of game.hubs) {
      hub.angle += dt * 0.045;
      hub.x = 180 + Math.cos(hub.angle) * 132;
      hub.y = 230 + Math.sin(hub.angle) * 160;
    }
    const p = game.packet;
    if (!p) return;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.age += dt;
    const target = game.hubs[game.target];
    if (Math.hypot(p.x - target.x, p.y - target.y) < 25) {
      game.score += 100;
      game.delivered++;
      game.streak++;
      game.source = game.target;
      game.target = (game.source + 2) % game.hubs.length;
      game.packet = null;
      game.status = 'ready';
      game.event = { type: 'delivery', points: 100, x: target.x, y: target.y };
    } else if (p.age > 3.2 || p.x < -15 || p.x > 375 || p.y < -15 || p.y > 495 ||
      game.hubs.some((hub, i) => i !== game.source && i !== game.target && Math.hypot(p.x - hub.x, p.y - hub.y) < 22)) {
      game.lives--;
      game.streak = 0;
      game.packet = null;
      game.status = game.lives ? 'ready' : 'lost';
      game.event = { type: 'miss', x: p.x, y: p.y };
    }
  }
  const api = { createGame, launch, step };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Orbit = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
