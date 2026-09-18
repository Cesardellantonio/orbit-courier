/* Presentation and pointer controls; all game rules remain in engine.js. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('space'), ctx = canvas.getContext('2d');
  const W = 360, H = 480;
  let game = Orbit.createGame(), gesture = null, lastTime = null, lastEvent = null;
  let trail = [], flash = 0;
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
    $('game-over').hidden = game.status !== 'lost';
    $('final-score').textContent = String(game.score);
  }
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
    for (const star of stars) dot(star.x, star.y, star.r, '#9cbade70');
    ctx.beginPath(); ctx.ellipse(180, 230, 132, 160, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#6882ac25'; ctx.lineWidth = 1; ctx.stroke();
    ring(180, 230, 54, '#6882ac12'); ring(180, 230, 91, '#6882ac0d');
    ctx.textAlign = 'center'; ctx.fillStyle = '#91a5c23b'; ctx.font = '9px system-ui';
    ctx.fillText('O R B I T A L   R E L A Y', 180, 232);
    const source = game.hubs[game.source];
    if (gesture && game.status === 'ready') {
      ctx.beginPath(); ctx.moveTo(source.x, source.y); ctx.lineTo(gesture.aim.x, gesture.aim.y);
      ctx.setLineDash([4, 6]); ctx.strokeStyle = '#79e7e5aa'; ctx.stroke(); ctx.setLineDash([]);
      ring(gesture.aim.x, gesture.aim.y, 6, '#79e7e5aa');
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
      ring(lastEvent.x, lastEvent.y, 24 + (1 - flash) * 36, lastEvent.type === 'delivery' ? '#77e7e5' : '#ff7b8d', 2);
      ctx.globalAlpha = 1;
    }
  }
  canvas.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || game.status !== 'ready') return;
    event.preventDefault();
    gesture = { id: event.pointerId, aim: point(event) };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (gesture && gesture.id === event.pointerId) gesture.aim = point(event);
  });
  canvas.addEventListener('pointerup', event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const aim = point(event);
    gesture = null;
    canvas.releasePointerCapture(event.pointerId);
    if (Orbit.launch(game, aim.x, aim.y)) {
      trail = [];
      $('message').textContent = `Packet en route to ${game.hubs[game.target].name}…`;
    } else if (game.status === 'ready') {
      $('message').textContent = 'Aim a little farther from the source hub, then release.';
    }
  });
  const cancel = event => { if (gesture && gesture.id === event.pointerId) gesture = null; };
  canvas.addEventListener('pointercancel', cancel);
  canvas.addEventListener('lostpointercapture', cancel);
  $('restart').addEventListener('click', () => {
    game = Orbit.createGame(); gesture = null; trail = []; flash = 0; lastEvent = null; lastTime = null;
    $('message').textContent = 'Fresh shields. Make this shift count.';
    updateHUD(); draw();
  });
  document.addEventListener('visibilitychange', () => { lastTime = null; gesture = null; });
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
      $('message').textContent = game.status === 'lost' ? 'All shields depleted. Restart to fly again.' :
        lastEvent.type === 'delivery' ? '+100 · Delivered! Next destination is marked in gold.' : 'Packet lost · One shield down. Aim ahead of the orbit.';
      updateHUD();
      if (game.status === 'lost') $('restart').focus();
    }
    flash = Math.max(0, flash - dt * 1.8);
    draw(); requestAnimationFrame(frame);
  }
  updateHUD(); resize(); requestAnimationFrame(frame);
})();
