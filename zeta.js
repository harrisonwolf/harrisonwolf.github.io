'use strict';
// Media starts only after the visitor explicitly presses Play. No autoplay or loops.
for (const play of document.querySelectorAll('[data-video]')) {
  play.hidden = false;
  play.addEventListener('click', () => {
    const video = document.getElementById(play.dataset.video);
    const poster = document.getElementById(play.dataset.poster);
    video.hidden = false; poster.hidden = true; play.hidden = true;
    video.focus();
    video.play().catch(() => {
      // Native controls remain available if the browser declines scripted play.
      video.focus();
    });
  });
}

// Scroll-driven hero: the page's scroll position chooses frames from the film Rising, then a sequence rendered for this page from the exact sum at t = 10^9.
// Frames are still images, so nothing plays by itself; reduced-motion visitors get one still.
(() => {
  const rise = document.getElementById('rise');
  const canvas = document.getElementById('rise-canvas');
  if (!rise || !canvas || !canvas.getContext) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const N = 554, PRIMER = 0.11, ctx = canvas.getContext('2d', {alpha: false});
  const lo = new Array(N), hi = new Array(N);
  const beats = [...rise.querySelectorAll('.rise-beat')];
  const bar = rise.querySelector('.rise-progress span');
  rise.classList.remove('static');
  const name = i => `r${String(i + 1).padStart(3, '0')}.webp`;
  let pos = 0, alpha = 1, drawnKey = '', hd = false;
  const ready = k => hi[k]?.ok ? hi[k] : lo[k]?.ok ? lo[k] : null;
  const nearest = k => { for (let d = 0; d < N; d++) { const a = ready(k - d) || ready(k + d); if (a) return a; } return null; };
  function paint(img, a) {
    const cw = canvas.width, ch = canvas.height;
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.globalAlpha = a; ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }
  function draw() {
    const k = Math.floor(pos), t = pos - k;
    const A = ready(k) || nearest(k), B = t > 0.02 && k + 1 < N ? ready(k + 1) : null;
    if (!A) return;
    const key = A.src + (B ? B.src + t.toFixed(2) : '') + alpha.toFixed(2) + canvas.width;
    if (key === drawnKey) return; drawnKey = key;
    ctx.globalAlpha = 1; ctx.fillStyle = '#04050a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingQuality = 'high';
    paint(A, alpha);
    if (B) paint(B, alpha * t); // blend toward the next frame, so motion stays smooth between stills
    ctx.globalAlpha = 1;
  }
  // Loader: a small queue that always fetches what is closest to the visitor first.
  const want = new Map(); let active = 0;
  function request(set, dir, i, pri) { if (i < 0 || i >= N || set[i]) return; const key = dir + i; if (!want.has(key) || want.get(key)[3] > pri) want.set(key, [set, dir, i, pri]); }
  function pump() {
    while (active < 6 && want.size) {
      let best = null; for (const v of want.values()) if (!best || v[3] < best[3]) best = v;
      want.delete(best[1] + best[2]); const [set, dir, i] = best; if (set[i]) continue;
      const img = new Image(); set[i] = img; img.decoding = 'async'; active++;
      img.src = `media/${dir}/${name(i)}`;
      // Decode off the main thread before first use, so scrolling never waits on a decode.
      img.decode().then(() => { img.ok = true; active--; drawnKey = ''; draw(); pump(); }, () => { active--; pump(); });
    }
  }
  function plan() {
    const k = Math.round(pos);
    for (let d = -12; d <= 40; d++) request(lo, 'zeta-frames', k + d, Math.abs(d) * (d < 0 ? 2 : 1));
    for (let i = 0; i < N; i += 16) request(lo, 'zeta-frames', i, 60 + Math.abs(i - k) / 4);
    if (hd) for (let d = -3; d <= 10; d++) request(hi, 'zeta-frames-hd', k + d, 8 + Math.abs(d) * 3);
    pump();
  }
  const size = () => {
    // The frames are 1920 px wide, so a larger backing canvas would only cost time, not add detail.
    const r = Math.min(devicePixelRatio || 1, 2, 1920 / Math.max(1, canvas.clientWidth));
    canvas.width = Math.round(canvas.clientWidth * r); canvas.height = Math.round(canvas.clientHeight * r);
    hd = canvas.width > 1100; drawnKey = ''; plan(); draw();
  };
  const FR = beats.filter(b => b.dataset.f0);
  let ticking = false;
  function update() {
    ticking = false;
    const r = rise.getBoundingClientRect(), span = r.height - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / span));
    const f = Math.max(0, (p - PRIMER) / (1 - PRIMER));
    pos = f * (N - 1);
    alpha = p < PRIMER ? 0.35 + 0.65 * Math.min(1, Math.max(0, (p - 0.082) / (PRIMER - 0.082))) : 1;
    plan(); draw();
    if (bar) bar.style.width = (p * 100).toFixed(1) + '%';
    for (const b of beats) {
      const on = b.dataset.f0 ? (p >= PRIMER && pos >= +b.dataset.f0 && pos < +b.dataset.f1) : (p >= +b.dataset.from && p < +b.dataset.to);
      b.classList.toggle('on', on);
    }
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, {passive: true});
  addEventListener('resize', () => { size(); update(); });
  size(); update();
})();
