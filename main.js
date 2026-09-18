/* Presentation and pointer controls; all game rules remain in engine.js. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('space'), ctx = canvas.getContext('2d');
  const W = 360, H = 480;
  let game = Orbit.createGame(), gesture = null, lastTime = null, lastEvent = null;
  let trail = [], particles = [], flash = 0, shake = 0;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stars = Array.from({ length: 80 }, (_, i) => ({
    x: (i * 137.51 + 17) % W, y: (i * 83.71 + 31) % H, r: i % 4 === 0 ? 1.2 : .6
  }));

  function resize() {
    const box = canvas.parentElement ? canvas.parentElement.getBoundingClientRect() : { width: W, height: H };
    const scale = Math.max(.01, Math.min((box.width - 2) / W, (box.height - 2) / H));
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.style.width = `${W * scale}px`;
    canvas.style.height = `${H * scale}px`;
    canvas.width = Math.round(W * scale * dpr);
    canvas.height = Math.round(H * scale * dpr);
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    draw();
  }
  function point(event) {
    const box = canvas.getBoundingClientRect();
    return { x: (event.clientX - box.left) * W / box.width, y: (event.clientY - box.top) * H / box.height };
  }
  function updateHUD() {
    $('score').textContent = String(game.score);
    $('lives').textContent = `${game.lives} / 3`;
    $('lives').style.color = game.lives === 1 ? '#ff7b8d' : '';
    $('target').textContent = game.hubs[game.target].name;
    $('level').textContent = String(game.level);
    $('level-progress').textContent = game.level === 8 ? 'MAX ORBIT' : `${3 - game.delivered % 3} TO NEXT`;
    $('combo').textContent = `×${Orbit.combo(game)} · ${game.streak} streak`;
    $('combo-fill').style.width = `${Math.min(game.streak / 7, 1) * 100}%`;
    $('combo-fill').parentElement?.setAttribute('aria-valuenow', String(Math.min(game.streak, 7)));
    const active = game.pulseRemaining > 0;
    $('pulse').disabled = game.status === 'lost' || active || !game.pulseReady;
    $('pulse').textContent = active ? `SLOW-MO · ${game.pulseRemaining.toFixed(1)}s` : game.pulseReady ? '✦ ACTIVATE SLOW-MO' : '✦ PULSE CHARGING';
    $('pulse-hint').textContent = active ? (game.pulseReady ? 'Next pulse banked' : 'Hubs slowed · packets at full speed') : game.pulseReady ? 'Tap for 5 seconds of slower hubs' : `Next charge in ${3 - game.delivered % 3} deliveries`;
    $('game-over').hidden = game.status !== 'lost';
    $('final-score').textContent = String(game.score);
  }
  function updatePower() {
    const aim = gesture ? Orbit.aim(game, gesture.start, gesture.end) : null;
    const percent = aim ? Math.round(aim.power * 100) : 0;
    $('power').textContent = aim?.isDrag ? `${percent}% BOOST` : 'TAP / SHORT FLING';
    $('power-fill').style.width = `${percent}%`;
  }
  function clearGesture() { gesture = null; updatePower(); }
  function ring(x, y, radius, color, width = 1) {
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
  }
  function dot(x, y, radius, color) {
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    if (!reducedMotion && shake > 0) ctx.translate(Math.sin(shake * 97) * shake * 4, Math.cos(shake * 113) * shake * 3);
    for (const star of stars) dot(star.x, star.y, star.r, '#9cbade70');
    ctx.beginPath(); ctx.ellipse(180, 230, 132, 160, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#6882ac25'; ctx.lineWidth = 1; ctx.stroke();
    ring(180, 230, 54, '#6882ac12'); ring(180, 230, 91, '#6882ac0d');
    ctx.textAlign = 'center'; ctx.fillStyle = '#91a5c23b'; ctx.font = '9px system-ui';
    ctx.fillText('O R B I T A L   R E L A Y', 180, 232);
    const source = game.hubs[game.source];
    if (gesture && game.status === 'ready') {
      const aim = Orbit.aim(game, gesture.start, gesture.end);
      const dx = aim.x - source.x, dy = aim.y - source.y, distance = Math.hypot(dx, dy);
      if (distance >= 8) {
        const length = Math.min(260, 90 + aim.power * 170);
        const x = source.x + dx / distance * length, y = source.y + dy / distance * length;
        ctx.beginPath(); ctx.moveTo(source.x, source.y); ctx.lineTo(x, y);
        ctx.setLineDash([4, 6]); ctx.strokeStyle = '#79e7e5cc'; ctx.lineWidth = 1 + aim.power * 2;
        ctx.stroke(); ctx.setLineDash([]);
        ring(x, y, 5 + aim.power * 4, '#79e7e5cc');
        ring(source.x, source.y, 28 + aim.power * 10, '#79e7e580');
      }
    }
    if (game.pulseRemaining > 0) {
      ring(180, 230, 110 + Math.sin(game.pulseRemaining * 3) * 8, '#b39aff66', 2);
      ctx.font = 'bold 10px system-ui'; ctx.fillStyle = '#c6b6ff'; ctx.fillText('TIME DILATION', 180, 257);
    }
    for (let i = 0; i < game.hubs.length; i++) {
      const hub = game.hubs[i], isSource = i === game.source, isTarget = i === game.target;
      const color = isSource ? '#77e7e5' : isTarget ? '#ffd582' : '#91a3c0';
      dot(hub.x, hub.y, 21, '#101c30');
      ring(hub.x, hub.y, 21, color, isTarget || isSource ? 2 : 1);
      if (isTarget) ring(hub.x, hub.y, 27, '#ffd58250');
      if (isSource) ring(hub.x, hub.y, 26, '#77e7e529');
      dot(hub.x, hub.y, isSource ? 6 : 3, color);
      ctx.font = 'bold 10px system-ui'; ctx.fillStyle = color;
      ctx.fillText(hub.name, hub.x, hub.y + 40);
      ctx.font = '7px system-ui';
      if (isSource || isTarget) ctx.fillText(isSource ? 'SOURCE' : 'DESTINATION', hub.x, hub.y - 34);
    }
    trail.forEach((p, i) => dot(p.x, p.y, 1 + i / trail.length * 2, `rgba(170,240,255,${i / trail.length * .5})`));
    if (game.packet) {
      ctx.shadowColor = '#8bf6ff'; ctx.shadowBlur = 16;
      dot(game.packet.x, game.packet.y, 5, '#efffff'); ctx.shadowBlur = 0;
    }
    if (flash > 0 && lastEvent) {
      ctx.globalAlpha = flash;
      const success = lastEvent.type === 'delivery';
      const color = success ? '#77e7e5' : '#ff7b8d';
      ring(lastEvent.x, lastEvent.y, 24 + (1 - flash) * (success ? 70 : 36), color, success ? 3 : 2);
      ctx.font = 'bold 22px system-ui'; ctx.fillStyle = color;
      ctx.fillText(success ? `+${lastEvent.points}  ×${lastEvent.multiplier}` : '−1 SHIELD', Math.max(75, Math.min(285, lastEvent.x)), Math.max(40, lastEvent.y - 34 - (1 - flash) * 22));
      ctx.globalAlpha = flash * (reducedMotion ? .025 : .07);
      ctx.fillStyle = color; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  canvas.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || gesture || game.status !== 'ready') return;
    event.preventDefault();
    gesture = { id: event.pointerId, start: point(event), end: point(event) };
    updatePower();
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (gesture && gesture.id === event.pointerId) { gesture.end = point(event); updatePower(); }
  });
  canvas.addEventListener('pointerup', event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const aim = Orbit.aim(game, gesture.start, point(event));
    clearGesture();
    canvas.releasePointerCapture(event.pointerId);
    if (Orbit.launch(game, aim.x, aim.y, aim.power)) {
      trail = [];
      $('message').textContent = `${aim.isDrag ? Math.round(aim.power * 100) + '% boost' : 'Short fling'} → ${game.hubs[game.target].name}. Lead the orbit!`;
    } else if (game.status === 'ready') {
      $('message').textContent = 'Aim a little farther from the source hub, then release.';
    }
  });
  const cancel = event => { if (gesture && gesture.id === event.pointerId) clearGesture(); };
  canvas.addEventListener('pointercancel', cancel);
  canvas.addEventListener('lostpointercapture', cancel);
  $('restart').addEventListener('click', () => {
    game = Orbit.createGame(); clearGesture(); trail = []; particles = []; flash = 0; shake = 0; lastEvent = null; lastTime = null;
    $('message').textContent = 'Fresh shields. Make this shift count.';
    updateHUD(); draw();
  });
  $('pulse').addEventListener('click', () => {
    if (!Orbit.activatePulse(game)) return;
    clearGesture();
    $('message').textContent = 'Slow-mo engaged · 5 seconds. Aim ahead, keep the streak!';
    updateHUD(); draw();
  });
  document.addEventListener('visibilitychange', () => { lastTime = null; clearGesture(); });
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  if (typeof ResizeObserver === 'function' && canvas.parentElement) {
    new ResizeObserver(resize).observe(canvas.parentElement);
  }
  function frame(time) {
    const dt = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, .04);
    lastTime = time;
    Orbit.step(game, dt);
    if (game.packet) {
      trail.push({ x: game.packet.x, y: game.packet.y });
      if (trail.length > 16) trail.shift();
    } else { trail = []; }
    if (game.event && game.event !== lastEvent) {
      lastEvent = game.event; flash = 1;
      const success = lastEvent.type === 'delivery';
      shake = success ? .35 : 1;
      const count = reducedMotion ? 6 : success ? 24 + Orbit.combo(game) * 6 : 18;
      particles = Array.from({length:count}, (_, i) => {
        const angle = i / count * Math.PI * 2, speed = 25 + (i % 5) * 18;
        return {x:Math.max(8, Math.min(W-8, lastEvent.x)), y:Math.max(8, Math.min(H-8, lastEvent.y)),
          vx:Math.cos(angle)*speed, vy:Math.sin(angle)*speed, life:1, size:i%3+1, color:success ? '#77e7e5' : '#ff7b8d'};
      });
      $('message').textContent = game.status === 'lost' ? 'All shields depleted. Restart to fly again.' :
        success ? `+${lastEvent.points} · ×${lastEvent.multiplier} combo!${lastEvent.levelUp ? ' Level ' + game.level + ' · faster orbit!' : ' Next: ' + game.hubs[game.target].name + '.'}${lastEvent.pulseEarned ? ' Pulse ready ↓' : ''}` : 'Packet lost · −1 shield, combo reset. Lead the gold hub.';
      updateHUD();
      if (game.status === 'lost') $('restart').focus();
    }
    flash = Math.max(0, flash - dt * 1.8);
    shake = Math.max(0, shake - dt * 4);
    for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * 1.5; }
    particles = particles.filter(p => p.life > 0);
    updateHUD();
    draw(); requestAnimationFrame(frame);
  }
  updateHUD(); updatePower(); resize(); requestAnimationFrame(frame);
})();
