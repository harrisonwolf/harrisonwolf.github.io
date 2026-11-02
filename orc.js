'use strict';
// Caption layer for the Orc recordings: what is on screen, which key was pressed, and what comes next.
// Kept separate from the video so wording can change without re-encoding.
const CUES = {
  tour: [
    [0, 3.1, 'F1 · In-progress', 'A live run', 'The cockpit during a real run: GPT-6 Astra coordinates, Claude Sonnet 5.5 has finished, GPT-6.1 Sol is still working.'],
    [3.1, 4.9, '↓ · select agent', 'Pick a Worker', 'Arrow down to the Claude Worker.'],
    [4.9, 10.9, '1 · Assignment', 'Its assignment', 'What this Worker was asked to do, the result expected, and the exact model and settings it ran on.'],
    [10.9, 13.9, '2 · Sandbox', 'Its sandbox', 'Each Worker edits a private copy of the project and proposes changes; it never touches the shared files directly.'],
    [13.9, 16.9, '3 · Results', 'Its results', 'The files it handed back, each with a content fingerprint.'],
    [16.9, 24.9, '4 · Activity', 'Live activity', 'Every tool call and response, retained as it happens.'],
    [24.9, 30.0, 'u · Usage', 'Usage by provider', 'Reported tokens for each model and provider in the run.'],
    [30.0, 33.2, 'F2 · History', 'The run closes', 'History opens the finished run: the declared outcome and every contribution.'],
    [33.2, 37.0, 'm · Models', 'The model picker', 'Families from OpenAI, Anthropic and others, local and hosted.'],
    [37.0, 40.95, 'Enter · Settings', 'Per-model settings', 'Each model gets its own reasoning depth and tools.'],
    [40.95, 45.0, 'w · Workbench  ·  b · Copies', 'After the run: the Workbench', 'Each Worker’s private copy of the project.'],
    [45.0, 49.0, 'p · Changes', 'Proposed changes', 'What each Worker proposed, reviewed and integrated by the operator.'],
    [49.0, 54.0, 'j · Jobs', 'Contained checks', 'Builds and tests ran inside the sandbox. The failed job is the old baseline, before the fix.'],
    [54.0, 58.0, 'e · Sandboxes', 'Sandboxes', 'The persistent sandboxes the Workers used, now stopped.'],
    [58.0, 63, 'f · Files', 'The shared project', 'The integrated files, after review.'],
  ],
  interactive: [
    [0, 6, 'F4 · Conversation', 'Talk it through', 'The project conversation (GPT-6.1 Sol): spitball the task before any run exists.'],
    [6, 12, 'Y · confirm', 'It proposes a run', 'Objective, constraints, models and limits, drafted by the conversation. Nothing starts until you confirm.'],
    [12, 16, 'F1 · In-progress', 'Steered mid-run', 'A message to the coordinator added a Worker: GPT-6.1 Sol now writes the docs beside Claude’s finished code.'],
    [16, 23.87, 'Ctrl-G · Watchdog notes', 'The watchdog reports', 'Its first report, early in the run.'],
    [23.87, 31.9, 'Esc · next view', 'The report updates', 'Version 3, after the run closed: what each Worker delivered, and what is still unverified.'],
    [31.9, 39.87, 'Esc · next view', 'Ask the watchdog', 'A question mid-run, and its answer, attributed to the watchdog’s model and evidence cutoff.'],
    [39.87, 47.9, 'Esc · next view', 'Ask again after close', 'Questions still work once the run has ended.'],
    [47.9, 55.87, 'Esc · next view', 'Run-control policy', 'Which actions an agent may take alone, only with your confirmation, or never.'],
    [55.87, 63.87, 'Esc · next view', 'Trace a file', 'A delivered file traced to the Claude Worker, model, settings and invocation that wrote it.'],
    [63.87, 71, 'Esc · next view', 'And another', 'This one traced to the GPT Worker.'],
    [71, 77, 'b · Continue  ·  Space · select', 'Continue the run', 'Pick exact retained files as seeds for the next run.'],
    [77, 84, 'F1 · In-progress', 'A new run, seeded', 'The continuation runs as a fresh run, starting from those exact files.'],
  ],
};

for (const wrap of document.querySelectorAll('[data-cues]')) {
  const cues = CUES[wrap.dataset.cues], video = wrap.querySelector('video');
  if (!cues || !video) continue;
  // The caption bar sits under the picture, never on it.
  const bar = document.createElement('div'); bar.className = 'cue-bar'; bar.setAttribute('aria-live', 'off');
  bar.innerHTML = '<span class="cue-key">⌨</span><div class="cue-body"><strong class="cue-title">Press play.</strong><span class="cue-text"> Captions here explain each screen and the key that opens it.</span><span class="cue-next"></span></div>';
  wrap.appendChild(bar);
  const key = bar.querySelector('.cue-key'), title = bar.querySelector('.cue-title'), text = bar.querySelector('.cue-text'), next = bar.querySelector('.cue-next');
  // Controls under the player: captions on/off, and fullscreen that keeps the caption bar.
  const row = document.createElement('div'); row.className = 'cue-controls';
  const toggle = document.createElement('button'); toggle.type = 'button'; toggle.textContent = 'Captions: on';
  toggle.addEventListener('click', () => { const off = wrap.classList.toggle('cues-off'); toggle.textContent = off ? 'Captions: off' : 'Captions: on'; syncTrack(); });
  const fs = document.createElement('button'); fs.type = 'button'; fs.textContent = 'Fullscreen ⛶';
  row.append(toggle, fs); wrap.after(row);
  // Fullscreen the whole player (video + bar). Where that isn't supported (iPhone), fall back to native video fullscreen with captions as a text track.
  const track = video.addTextTrack('captions', 'English', 'en');
  for (const [s, e, k, t, x] of cues) track.addCue(new VTTCue(s, e, `[${k}] ${t}: ${x}`));
  const nativeFs = () => document.fullscreenElement === video || video.webkitDisplayingFullscreen;
  const syncTrack = () => { track.mode = nativeFs() && !wrap.classList.contains('cues-off') ? 'showing' : 'hidden'; };
  syncTrack();
  const goFull = () => {
    if (document.fullscreenElement === wrap) return document.exitFullscreen();
    if (wrap.requestFullscreen) wrap.requestFullscreen().catch(() => video.webkitEnterFullscreen && video.webkitEnterFullscreen());
    else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
  };
  fs.addEventListener('click', goFull);
  video.addEventListener('dblclick', e => { e.preventDefault(); goFull(); });
  document.addEventListener('fullscreenchange', () => { fs.textContent = document.fullscreenElement === wrap ? 'Exit fullscreen' : 'Fullscreen ⛶'; syncTrack(); });
  video.addEventListener('webkitbeginfullscreen', syncTrack); video.addEventListener('webkitendfullscreen', syncTrack);
  let current = -2;
  const update = () => {
    const t = video.currentTime, i = cues.findIndex(c => t >= c[0] && t < c[1]);
    if (i !== current && i >= 0) {
      current = i;
      const [, , k, ti, x] = cues[i];
      key.textContent = '⌨ ' + k; title.textContent = ti + '.'; text.textContent = ' ' + x;
      key.classList.remove('pop'); void key.offsetWidth; key.classList.add('pop');
    }
    if (i >= 0) { const n = cues[i + 1]; next.textContent = n && cues[i][1] - t < 1.6 ? 'Next: ' + n[3] + ' →' : ''; }
  };
  video.addEventListener('timeupdate', update); video.addEventListener('seeked', update);
  const tick = () => { update(); if (!video.paused && !video.ended) requestAnimationFrame(tick); };
  video.addEventListener('play', () => requestAnimationFrame(tick));
}

// reveal on scroll
(() => {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  els.forEach(e => io.observe(e));
})();
