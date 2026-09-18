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
      streak: 0, level: 1, pulseReady: false, pulseRemaining: 0,
      status: 'ready', packet: null, event: null };
  }
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  function aim(game, start, end) {
    const dx = end.x - start.x, dy = end.y - start.y;
    const distance = Math.hypot(dx, dy), isDrag = distance >= 8;
    const power = isDrag ? clamp(distance / 160, 0, 1) : 0;
    const source = game.hubs[game.source];
    return { x: isDrag ? source.x + dx : end.x, y: isDrag ? source.y + dy : end.y,
      power, speed: 215 + power * 185, isDrag };
  }
  function launch(game, x, y, power = 0) {
    if (game.status !== 'ready' || ![x, y, power].every(Number.isFinite)) return false;
    const source = game.hubs[game.source];
    const dx = x - source.x, dy = y - source.y;
    const length = Math.hypot(dx, dy);
    if (!Number.isFinite(length) || length < 8) return false;
    const speed = 215 + clamp(power, 0, 1) * 185;
    game.packet = { x: source.x, y: source.y, vx: dx / length * speed, vy: dy / length * speed, age: 0 };
    game.status = 'flying';
    game.event = null;
    return true;
  }
  function combo(game) { return Math.min(1 + Math.floor(Math.max(game.streak - 1, 0) / 2), 4); }
  function activatePulse(game) {
    if (game.status === 'lost' || !game.pulseReady || game.pulseRemaining > 0) return false;
    game.pulseReady = false;
    game.pulseRemaining = 5;
    return true;
  }
  function step(game, dt) {
    if (!['ready', 'flying'].includes(game.status) || !Number.isFinite(dt)) return;
    dt = Math.min(Math.max(dt, 0), 0.04);
    const slowedTime = Math.min(dt, game.pulseRemaining);
    const orbitTime = dt - slowedTime * .7;
    game.pulseRemaining = Math.max(0, game.pulseRemaining - dt);
    for (const hub of game.hubs) {
      hub.angle += orbitTime * (0.045 + (game.level - 1) * 0.018);
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
      game.delivered++;
      game.streak++;
      const previousLevel = game.level;
      game.level = Math.min(1 + Math.floor(game.delivered / 3), 8);
      const pulseEarned = game.delivered % 3 === 0 && !game.pulseReady;
      if (pulseEarned) game.pulseReady = true;
      const points = 100 * combo(game);
      game.score += points;
      game.source = game.target;
      game.target = (game.source + 2) % game.hubs.length;
      game.packet = null;
      game.status = 'ready';
      game.event = { type: 'delivery', points, multiplier: combo(game), streak: game.streak,
        level: game.level, levelUp: game.level > previousLevel, pulseEarned, x: target.x, y: target.y };
    } else if (p.age > 3.2 || p.x < -15 || p.x > 375 || p.y < -15 || p.y > 495 ||
      game.hubs.some((hub, i) => i !== game.source && i !== game.target && Math.hypot(p.x - hub.x, p.y - hub.y) < 22)) {
      game.lives--;
      game.streak = 0;
      game.packet = null;
      game.status = game.lives ? 'ready' : 'lost';
      game.event = { type: 'miss', x: p.x, y: p.y };
    }
  }
  const api = { createGame, aim, combo, activatePulse, launch, step };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Orbit = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
