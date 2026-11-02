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

// Scroll-driven hero.
// The page's scroll position chooses a frame of the sequence (Rising, then the Portfolio Scroll shot).
// The picture never snaps: it eases toward the scroll position every animation frame, blending between
// neighbouring frames, so motion stays continuous however the visitor scrolls. Frames are fetched in
// priority order around the current position and decoded off the main thread before they are needed.
// Reduced-motion visitors get one still.
(() => {
  const rise = document.getElementById('rise');
  const canvas = document.getElementById('rise-canvas');
  if (!rise || !canvas || !canvas.getContext || !window.createImageBitmap) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const N = 2155, PRIMER = 0.08, TAU = 0.14;           // TAU: seconds to close ~63% of the gap to the scroll target
  const ctx = canvas.getContext('2d', {alpha: false});
  const beats = [...rise.querySelectorAll('.rise-beat')];
  const bar = rise.querySelector('.rise-progress span');
  rise.classList.remove('static');

  // Two tiers: small frames give instant coverage everywhere; sharp frames replace them around the position.
  const tiers = [
    {dir: 'zeta-seq2-sm', blobs: new Array(N), bmps: new Array(N), pending: new Set(), fetching: new Set()},
    {dir: 'zeta-seq2-hd', blobs: new Array(N), bmps: new Array(N), pending: new Set(), fetching: new Set()},
  ];
  let useHd = false;
  const url = (t, i) => `media/${t.dir}/g${String(i + 1).padStart(4, '0')}.webp`;

  let target = 0, shown = 0, lastT = 0, running = false;

  // ---- fetching: compressed bytes for every frame, nearest to the visitor first ----
  let active = 0;
  const MAXC = 8;
  function fetchPlan() {
    const k = Math.round(target), list = [];
    const want = (t, i, pri) => { if (i >= 0 && i < N && !t.blobs[i] && !t.fetching.has(i)) list.push([pri, t, i]); };
    for (let d = 0; d < 48; d++) { want(tiers[0], k + d, d); want(tiers[0], k - d, d * 1.5); }
    if (useHd) for (let d = 0; d < 24; d++) { want(tiers[1], k + d, 10 + d); want(tiers[1], k - d, 10 + d * 1.5); }
    for (let i = 0; i < N; i += 1) { want(tiers[0], i, 200 + Math.abs(i - k)); }            // then everything, outward
    if (useHd) for (let i = 0; i < N; i += 1) { want(tiers[1], i, 2000 + Math.abs(i - k)); }
    list.sort((a, b) => a[0] - b[0]);
    return list;
  }
  function pump() {
    if (active >= MAXC) return;
    const list = fetchPlan();
    while (active < MAXC && list.length) {
      const [, t, i] = list.shift(); t.fetching.add(i); active++;
      fetch(url(t, i)).then(r => r.ok ? r.blob() : Promise.reject(r.status)).then(b => { t.blobs[i] = b; }).catch(() => {}).finally(() => { t.fetching.delete(i); active--; decodePlan(); pump(); });
    }
  }

  // ---- decoding: a window of ready bitmaps around the position, biased in the direction of travel ----
  const AHEAD = 36, BEHIND = 12, KEEP = 90;
  let decoding = 0;
  function decodePlan() {
    const dirSign = target >= shown ? 1 : -1, k = Math.round(shown);
    for (const t of (useHd ? tiers : [tiers[0]])) {
      for (let d = -BEHIND; d <= AHEAD; d++) {
        const i = k + d * dirSign; if (i < 0 || i >= N) continue;
        if (t.bmps[i] || t.pending.has(i) || !t.blobs[i] || decoding >= 4) continue;
        t.pending.add(i); decoding++;
        createImageBitmap(t.blobs[i]).then(bmp => { t.bmps[i] = bmp; }).catch(() => {}).finally(() => { t.pending.delete(i); decoding--; needDraw = true; kick(); decodePlan(); });
      }
      // evict far-away bitmaps so memory stays bounded
      for (let i = 0; i < N; i++) if (t.bmps[i] && Math.abs(i - k) > KEEP) { t.bmps[i].close(); t.bmps[i] = null; }
    }
  }

  // ---- drawing ----
  const ready = (i) => (useHd && tiers[1].bmps[i]) || tiers[0].bmps[i] || null;
  const nearestReady = (i) => { for (let d = 0; d < N; d++) { const a = ready(i - d) || ready(i + d); if (a) return a; } return null; };
  function paint(img, a) {
    const cw = canvas.width, ch = canvas.height;
    const s = Math.max(cw / img.width, ch / img.height), w = img.width * s, h = img.height * s;
    ctx.globalAlpha = a; ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }
  let lastKey = '', needDraw = true, alpha = 1;
  function draw() {
    const k = Math.floor(shown), f = shown - k;
    const A = ready(k) || nearestReady(k), B = f > 0.015 && k + 1 < N ? ready(k + 1) : null;
    if (!A) return;
    const key = `${k}:${B ? f.toFixed(3) : 'x'}:${A === tiers[1].bmps[k] ? 'h' : 'l'}:${alpha.toFixed(2)}`;
    if (key === lastKey && !needDraw) return;
    lastKey = key; needDraw = false;
    ctx.globalAlpha = 1; ctx.fillStyle = '#04050a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    paint(A, alpha); if (B) paint(B, alpha * f); ctx.globalAlpha = 1;
  }

  // ---- the easing loop ----
  function step(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000 || 0.016); lastT = now;
    const gap = target - shown;
    if (Math.abs(gap) < 0.002) shown = target;
    else {
      let next = shown + gap * (1 - Math.exp(-dt / TAU));
      // never glide across frames that aren't decoded yet: wait at the edge of what is ready instead of jumping
      const sgn = Math.sign(gap); let lim = Math.floor(shown);
      while (lim + sgn >= 0 && lim + sgn < N && ready(lim + sgn) && Math.abs(lim - shown) < Math.abs(gap) + 1) lim += sgn;
      if (sgn > 0 && next > lim) next = Math.max(shown, lim); if (sgn < 0 && next < lim) next = Math.min(shown, lim);
      shown = next;
    }
    draw(); decodePlan();
    if (Math.abs(target - shown) >= 0.002 || decoding) requestAnimationFrame(step); else running = false;
  }
  function kick() { if (!running) { running = true; lastT = performance.now(); requestAnimationFrame(step); } }

  // ---- layout & scroll ----
  const size = () => {
    const r = Math.min(devicePixelRatio || 1, 2, 1600 / Math.max(1, canvas.clientWidth));
    canvas.width = Math.round(canvas.clientWidth * r); canvas.height = Math.round(canvas.clientHeight * r);
    useHd = Math.max(canvas.width / 960, canvas.height / 410) > 1.2;
    needDraw = true; pump(); decodePlan(); draw();
  };
  const FR = beats;
  let ticking = false;
  function onScroll() {
    ticking = false;
    const r = rise.getBoundingClientRect(), span = r.height - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / span));
    const f = Math.max(0, (p - PRIMER) / (1 - PRIMER));
    target = f * (N - 1);
    alpha = p < PRIMER ? 0.35 + 0.65 * Math.min(1, Math.max(0, (p - 0.06) / (PRIMER - 0.06))) : 1;
    if (bar) bar.style.width = (p * 100).toFixed(1) + '%';
    for (const b of FR) {
      const on = b.dataset.f0 ? (p >= PRIMER && target >= +b.dataset.f0 && target < +b.dataset.f1) : (p >= +b.dataset.from && p < +b.dataset.to);
      b.classList.toggle('on', on);
    }
    needDraw = true; pump(); kick();
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, {passive: true});
  addEventListener('resize', () => { size(); onScroll(); });
  size(); onScroll(); shown = target; kick();
})();


// Reveal sections as they enter the viewport.
(() => {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }, {rootMargin: '0px 0px -8% 0px', threshold: 0.08});
  els.forEach(e => io.observe(e));
})();


// Image viewers: step left/right, no wrap-around.
for (const v of document.querySelectorAll('[data-viewer]')) {
  const track = v.querySelector('.viewer-track'), slides = [...track.children];
  const prev = v.querySelector('.vprev'), next = v.querySelector('.vnext'), count = v.querySelector('.vcount');
  const index = () => Math.round(track.scrollLeft / track.clientWidth);
  const go = i => { i = Math.max(0, Math.min(slides.length - 1, i)); track.scrollTo({left: i * track.clientWidth, behavior: 'smooth'}); };
  const sync = () => { const i = index(); count.textContent = `${i + 1} / ${slides.length}`; prev.disabled = i === 0; next.disabled = i === slides.length - 1; };
  prev.addEventListener('click', () => go(index() - 1)); next.addEventListener('click', () => go(index() + 1));
  track.addEventListener('scroll', () => requestAnimationFrame(sync), {passive: true});
  v.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') { go(index() - 1); e.preventDefault(); } if (e.key === 'ArrowRight') { go(index() + 1); e.preventDefault(); } });
  v.tabIndex = 0; sync();
}
