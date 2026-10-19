/**
 * 背景キャンバス: 漂うグロー + 瞬く星 + 流れ星
 * transform/opacity 相当の描画のみ、DPR 考慮、visibility / reduced-motion 対応
 */

export function initBackground(canvas) {
  if (!canvas) return { destroy() {} };

  const ctx = canvas.getContext('2d', { alpha: true });
  const reduced =
    typeof matchMedia !== 'undefined' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches;

  let dpr = 1;
  let w = 0;
  let h = 0;
  let raf = 0;
  let running = !document.hidden && !reduced;
  let stars = [];
  let glows = [];
  let meteors = [];
  let lastMeteor = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function seed() {
    const count = Math.floor((w * h) / 14000);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.4 + 0.3,
      base: Math.random() * 0.5 + 0.3,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 1.5 + 0.5,
    }));
    glows = [
      { x: w * 0.2, y: h * 0.25, r: 220, c: '120,180,255', vx: 0.03, vy: 0.02 },
      { x: w * 0.75, y: h * 0.35, r: 260, c: '230,140,200', vx: -0.025, vy: 0.018 },
      { x: w * 0.5, y: h * 0.8, r: 280, c: '160,120,255', vx: 0.02, vy: -0.015 },
    ];
  }

  function spawnMeteor(now) {
    if (now - lastMeteor < 4000 + Math.random() * 6000) return;
    lastMeteor = now;
    meteors.push({
      x: Math.random() * w * 0.8,
      y: Math.random() * h * 0.35,
      len: 80 + Math.random() * 100,
      speed: 6 + Math.random() * 4,
      life: 1,
      angle: Math.PI / 5 + Math.random() * 0.2,
    });
  }

  function drawStatic() {
    ctx.clearRect(0, 0, w, h);
    for (const g of glows) {
      const grd = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r);
      grd.addColorStop(0, `rgba(${g.c},0.22)`);
      grd.addColorStop(1, `rgba(${g.c},0)`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const s of stars) {
      ctx.fillStyle = `rgba(255,255,255,${s.base})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  let t0 = performance.now();

  function frame(now) {
    if (!running) return;
    const t = (now - t0) / 1000;
    ctx.clearRect(0, 0, w, h);

    for (const g of glows) {
      g.x += g.vx;
      g.y += g.vy;
      if (g.x < -50 || g.x > w + 50) g.vx *= -1;
      if (g.y < -50 || g.y > h + 50) g.vy *= -1;
      const grd = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r);
      grd.addColorStop(0, `rgba(${g.c},0.2)`);
      grd.addColorStop(1, `rgba(${g.c},0)`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const s of stars) {
      const a = s.base * (0.55 + 0.45 * Math.sin(t * s.speed + s.phase));
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    spawnMeteor(now);
    meteors = meteors.filter((m) => m.life > 0);
    for (const m of meteors) {
      m.x += Math.cos(m.angle) * m.speed;
      m.y += Math.sin(m.angle) * m.speed;
      m.life -= 0.018;
      const alpha = Math.max(0, m.life);
      const tx = m.x - Math.cos(m.angle) * m.len;
      const ty = m.y - Math.sin(m.angle) * m.len;
      const grd = ctx.createLinearGradient(tx, ty, m.x, m.y);
      grd.addColorStop(0, `rgba(255,255,255,0)`);
      grd.addColorStop(1, `rgba(200,230,255,${alpha})`);
      ctx.strokeStyle = grd;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(m.x, m.y);
      ctx.stroke();
    }

    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (reduced) {
      drawStatic();
      return;
    }
    if (running) return;
    running = true;
    t0 = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function onVisibility() {
    if (document.hidden) stop();
    else if (!reduced) {
      running = false;
      start();
    }
  }

  resize();
  if (reduced) drawStatic();
  else {
    running = true;
    raf = requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', onVisibility);

  return {
    destroy() {
      stop();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
