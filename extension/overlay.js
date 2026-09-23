(() => {
  const canvas = document.querySelector('#ink');
  const ctx = canvas.getContext('2d', { desynchronized: true });
  const color = document.querySelector('#color');
  const size = document.querySelector('#size');
  const strokes = [];
  let active = null;
  let pointerId = null;
  let rawSeen = false;
  let eraser = false;
  let presenter = null;
  if (navigator.ink) {
    navigator.ink.requestPresenter({ presentationArea: canvas }).then(p => { presenter = p; }).catch(() => {});
  }

  const setup = stroke => {
    ctx.globalCompositeOperation = stroke.eraser ? 'destination-out' : 'source-over';
    ctx.strokeStyle = ctx.fillStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = ctx.lineJoin = 'round';
  };
  const dot = p => { ctx.beginPath(); ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2); ctx.fill(); };
  const paint = stroke => {
    setup(stroke);
    if (stroke.points.length === 1) dot(stroke.points[0]);
    else {
      ctx.beginPath(); ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (const p of stroke.points.slice(1)) ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  };
  const redraw = () => {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.restore();
    for (const stroke of strokes) paint(stroke);
    if (active) paint(active);
  };
  const resize = () => {
    const dpr = devicePixelRatio || 1;
    canvas.width = Math.round(innerWidth * dpr); canvas.height = Math.round(innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
  };
  const finish = commit => {
    if (!active) return;
    if (commit) strokes.push(active);
    const id = pointerId;
    active = null; pointerId = null; rawSeen = false;
    if (id !== null && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    if (!commit) redraw();
  };
  const append = event => {
    if (!active || event.pointerId !== pointerId) return;
    setup(active);
    const last = active.points[active.points.length - 1];
    ctx.beginPath(); ctx.moveTo(last.x, last.y);
    const samples = event.getCoalescedEvents?.() || [];
    for (const sample of [...samples, event]) {
      const p = { x: sample.clientX, y: sample.clientY };
      const previous = active.points[active.points.length - 1];
      if (p.x === previous.x && p.y === previous.y) continue;
      active.points.push(p); ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    if (presenter && !active.eraser && event.isTrusted) {
      try { presenter.updateInkTrailStartPoint(event, { color: active.color, diameter: active.width }); }
      catch { presenter = null; }
    }
  };
  canvas.addEventListener('pointerdown', event => {
    if (active || event.button !== 0) return;
    event.preventDefault(); canvas.focus({ preventScroll: true });
    pointerId = event.pointerId; rawSeen = false;
    active = { color: color.value, width: eraser ? Number(size.value) * 5 : Number(size.value), eraser, points: [{ x: event.clientX, y: event.clientY }] };
    canvas.setPointerCapture(pointerId); setup(active); dot(active.points[0]);
  });
  canvas.addEventListener('pointerrawupdate', event => {
    if (!active || event.pointerId !== pointerId) return;
    rawSeen = true; append(event);
  });
  canvas.addEventListener('pointermove', event => { if (!rawSeen) append(event); });
  canvas.addEventListener('pointerup', event => {
    if (event.pointerId !== pointerId) return;
    append(event); finish(true);
  });
  canvas.addEventListener('pointercancel', event => { if (event.pointerId === pointerId) finish(false); });
  canvas.addEventListener('lostpointercapture', event => { if (event.pointerId === pointerId) finish(false); });
  window.addEventListener('blur', () => finish(false));
  window.addEventListener('resize', resize);
  window.addEventListener('message', event => {
    if (event.source === parent && event.data?.type === 'hockage-ink-visibility' && !event.data.visible) finish(false);
  });
  const hide = () => { finish(false); parent.postMessage({ type: 'hockage-ink-hide' }, '*'); };
  const undo = () => { finish(false); strokes.pop(); redraw(); };
  document.querySelector('#undo').onclick = undo;
  document.querySelector('#clear').onclick = () => { finish(false); strokes.length = 0; redraw(); };
  document.querySelector('#hide').onclick = hide;
  const setTool = value => {
    finish(false); eraser = value;
    document.querySelector('#pen').setAttribute('aria-pressed', String(!value));
    document.querySelector('#eraser').setAttribute('aria-pressed', String(value));
  };
  document.querySelector('#pen').onclick = () => setTool(false);
  document.querySelector('#eraser').onclick = () => setTool(true);
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); hide(); }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && event.target.tagName !== 'INPUT') { event.preventDefault(); undo(); }
  });
  resize();
})();
