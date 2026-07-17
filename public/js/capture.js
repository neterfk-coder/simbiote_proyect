/* ============================================================
   SIMBIONTE — capture.js
   Captura el GESTO (movimiento libre del puntero/dedo) y el
   TRAZO (dibujo) sobre un canvas del ritual, y los convierte
   en rasgos normalizados para el genoma.
   Nota: MediaPipe Hands puede sustituir al puntero más adelante;
   este módulo es el "plan B" robusto descrito en la propuesta.
   ============================================================ */
"use strict";

const Capture = (() => {

  function analyzePath(points) {
    if (points.length < 4) return null;
    let dist = 0, turn = 0;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i];
      dist += Math.hypot(b.x - a.x, b.y - a.y);
      minX = Math.min(minX, b.x); maxX = Math.max(maxX, b.x);
      minY = Math.min(minY, b.y); maxY = Math.max(maxY, b.y);
      if (i > 1) {
        const p = points[i - 2];
        const a1 = Math.atan2(a.y - p.y, a.x - p.x);
        const a2 = Math.atan2(b.y - a.y, b.x - a.x);
        let d = Math.abs(a2 - a1);
        if (d > Math.PI) d = 2 * Math.PI - d;
        turn += d;
      }
    }
    const dt = (points[points.length - 1].t - points[0].t) / 1000 || 1;
    const w = Math.max(1, maxX - minX), h = Math.max(1, maxY - minY);
    const start = points[0], end = points[points.length - 1];
    const gap = Math.hypot(end.x - start.x, end.y - start.y);
    const clamp01 = v => Math.max(0, Math.min(1, v));
    return {
      speed:      clamp01(dist / dt / 900),          // px/s normalizado
      angularity: clamp01(turn / points.length / 0.6),
      extent:     clamp01(Math.max(w, h) / 420),
      curvature:  clamp01(turn / Math.max(1, dist / 40) / 1.2),
      closure:    clamp01(1 - gap / Math.max(w, h)), // ¿la figura se cierra?
      density:    clamp01(points.length / 260),
      ratio:      clamp01((w * h) / (420 * 420)),
      points
    };
  }

  /* Sesión de captura sobre un canvas.
     mode "gesture": registra todo movimiento del puntero.
     mode "stroke" : registra solo mientras se presiona.
     multi: true   → no termina al soltar; se pueden dibujar varios
     trazos y el cierre lo decide quien llama (vía .finish()).      */
  function session(canvas, mode, { seconds = null, multi = false, onDone, onStroke = null }) {
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = () => canvas.getBoundingClientRect();
    canvas.width = rect().width * dpr;
    canvas.height = rect().height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round"; ctx.lineJoin = "round";

    const points = [];
    let drawing = mode === "gesture";
    let finished = false;

    function pos(e) {
      const r = rect();
      const p = e.touches ? e.touches[0] : e;
      return { x: p.clientX - r.left, y: p.clientY - r.top, t: performance.now() };
    }
    function add(e) {
      if (!drawing || finished) return;
      const p = pos(e);
      points.push(p);
      const n = points.length;
      if (n > 1) {
        const q = points[n - 2];
        const hue = (170 + n * 0.6) % 360;
        ctx.strokeStyle = `hsla(${hue}, 90%, 65%, .85)`;
        ctx.lineWidth = 3.2;
        ctx.shadowBlur = 14;
        ctx.shadowColor = `hsla(${hue}, 95%, 60%, .8)`;
        ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      if (e.cancelable) e.preventDefault();
    }
    function down(e) { if (mode === "stroke") drawing = true; add(e); }
    function up() {
      if (mode === "stroke" && drawing && points.length > 8) {
        if (multi) { if (onStroke) onStroke(points.length); }
        else finish();
      }
      if (mode === "stroke") drawing = false;
    }
    function finish() {
      if (finished) return;
      finished = true;
      teardown();
      onDone(analyzePath(points));
    }
    function teardown() {
      canvas.removeEventListener("pointermove", add);
      canvas.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      canvas.removeEventListener("touchmove", add);
      canvas.removeEventListener("touchstart", down);
      window.removeEventListener("touchend", up);
    }

    canvas.addEventListener("pointermove", add);
    canvas.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    canvas.addEventListener("touchmove", add, { passive: false });
    canvas.addEventListener("touchstart", down, { passive: false });
    window.addEventListener("touchend", up);

    if (mode === "gesture" && seconds) setTimeout(finish, seconds * 1000);
    return { cancel: teardown, finish };
  }

  return { session, analyzePath };
})();
