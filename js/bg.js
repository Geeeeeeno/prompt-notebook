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
    const count = Math.floor((w * h) / 10000);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.7 + 0.35,
      base: Math.random() * 0.55 + 0.35,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 1.8 + 0.6,
      bright: Math.random() > 0.88,
    }));
    glows = [
      { x: w * 0.18, y: h * 0.22, r: 260, c: '120,190,255', vx: 0.04, vy: 0.025, a: 0.28 },
      { x: w * 0.78, y: h * 0.32, r: 300, c: '240,150,205', vx: -0.03, vy: 0.02, a: 0.26 },
      { x: w * 0.48, y: h * 0.78, r: 320, c: '170,130,255', vx: 0.025, vy: -0.02, a: 0.24 },
      { x: w * 0.62, y: h * 0.12, r: 180, c: '255,230,170', vx: -0.015, vy: 0.03, a: 0.12 },
    ];
  }

  function spawnMeteor(now) {
    if (now - lastMeteor < 2800 + Math.random() * 4200) return;
    lastMeteor = now;
    meteors.push({
      x: Math.random() * w * 0.85,
      y: Math.random() * h * 0.4,
      len: 100 + Math.random() * 120,
      speed: 7 + Math.random() * 5,
      life: 1,
      angle: Math.PI / 5.5 + Math.random() * 0.25,
      width: 1.6 + Math.random() * 0.8,
    });
  }

  function drawStatic() {
    ctx.clearRect(0, 0, w, h);
    for (const g of glows) {
      const grd = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r);
      grd.addColorStop(0, `rgba(${g.c},${g.a ?? 0.24})`);
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
      if (g.x < -60 || g.x > w + 60) g.vx *= -1;
      if (g.y < -60 || g.y > h + 60) g.vy *= -1;
      const pulse = 0.9 + 0.1 * Math.sin(t * 0.4 + g.x * 0.01);
      const grd = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r);
      grd.addColorStop(0, `rgba(${g.c},${(g.a ?? 0.22) * pulse})`);
      grd.addColorStop(0.55, `rgba(${g.c},${(g.a ?? 0.22) * 0.35})`);
      grd.addColorStop(1, `rgba(${g.c},0)`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const s of stars) {
      const twinkle = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
      const a = s.base * (0.5 + 0.5 * twinkle) * (s.bright ? 1.15 : 1);
      ctx.fillStyle = `rgba(255,255,255,${Math.min(1, a)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * (s.bright ? 1.15 : 1), 0, Math.PI * 2);
      ctx.fill();
      if (s.bright && twinkle > 0.85) {
        ctx.strokeStyle = `rgba(200,230,255,${a * 0.45})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(s.x - s.r * 2.2, s.y);
        ctx.lineTo(s.x + s.r * 2.2, s.y);
        ctx.moveTo(s.x, s.y - s.r * 2.2);
        ctx.lineTo(s.x, s.y + s.r * 2.2);
        ctx.stroke();
      }
    }

    spawnMeteor(now);
    meteors = meteors.filter((m) => m.life > 0);
    for (const m of meteors) {
      m.x += Math.cos(m.angle) * m.speed;
      m.y += Math.sin(m.angle) * m.speed;
      m.life -= 0.016;
      const alpha = Math.max(0, m.life);
      const tx = m.x - Math.cos(m.angle) * m.len;
      const ty = m.y - Math.sin(m.angle) * m.len;
      const grd = ctx.createLinearGradient(tx, ty, m.x, m.y);
      grd.addColorStop(0, `rgba(255,255,255,0)`);
      grd.addColorStop(0.55, `rgba(200,230,255,${alpha * 0.55})`);
      grd.addColorStop(1, `rgba(255,246,220,${alpha})`);
      ctx.strokeStyle = grd;
      ctx.lineWidth = m.width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(m.x, m.y);
      ctx.stroke();
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(m.x, m.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
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
