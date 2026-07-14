/* ============================================================
   SIMBIONTE — leaderboard.js
   Pantalla propia con la gráfica y el ranking en tiempo real de
   TODAS las criaturas del mundo (no solo la tuya), por métrica:
   longevidad, descendencia o sociabilidad. Sustituye al panelito
   fijo que existía antes en el HUD.
   ============================================================ */
"use strict";

const Leaderboard = (() => {
  const METRICS = {
    longevity: c => c.age,
    offspring: c => c.childCount || 0,
    social: c => c.nearbyCount(World)
  };
  let metric = "longevity";
  let refreshTimer = null;
  let getMyId = () => null; // inyectado desde main.js

  function screen() { return document.getElementById("screen-leaderboard"); }
  function isOpen() { return screen()?.classList.contains("is-active"); }

  function open() {
    screen().classList.add("is-active");
    render();
    if (!refreshTimer) refreshTimer = setInterval(render, 1200);
  }
  function close() {
    screen().classList.remove("is-active");
    clearInterval(refreshTimer);
    refreshTimer = null;
  }

  function ranked() {
    const fn = METRICS[metric];
    return World.creatures
      .filter(c => !c.dead)
      .map(c => ({ c, v: fn(c) }))
      .sort((a, b) => b.v - a.v);
  }

  function drawChart(rows) {
    const canvas = document.getElementById("lb-chart");
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, barH = 30, gap = 12, top = rows.length ? Math.min(8, rows.length) * (barH + gap) : 60;
    canvas.width = w * dpr; canvas.height = top * dpr;
    canvas.style.height = top + "px";
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, top);
    if (!rows.length) return;

    const top8 = rows.slice(0, 8);
    const maxV = Math.max(1, top8[0].v);
    const labelW = 128;
    const myId = getMyId();

    top8.forEach((row, i) => {
      const y = i * (barH + gap);
      const frac = row.v / maxV;
      const barW = Math.max(3, (w - labelW - 46) * frac);
      const mine = row.c.id === myId;

      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.font = "600 12px Sora, sans-serif";
      ctx.fillStyle = mine ? "#ff5d8f" : "rgba(201,200,221,.85)";
      const label = row.c.name.length > 13 ? row.c.name.slice(0, 12) + "…" : row.c.name;
      ctx.fillText(label, 0, y + barH / 2);

      const x0 = labelW;
      const r = barH * 0.32;
      ctx.fillStyle = "rgba(255,255,255,.06)";
      roundRect(ctx, x0, y + barH * 0.22, w - labelW - 46, barH * 0.56, r);
      ctx.fill();

      const lightness = 45 + frac * 25;
      ctx.fillStyle = mine ? "#ff5d8f" : `hsl(172, 88%, ${lightness}%)`;
      roundRect(ctx, x0, y + barH * 0.22, barW, barH * 0.56, r);
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,.92)";
      ctx.textAlign = "right";
      ctx.fillText(formatValue(row.v), w, y + barH / 2);
    });
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, h / 2, Math.max(0, w) / 2);
    ctx.beginPath();
    if (ctx.roundRect) { ctx.roundRect(x, y, Math.max(0, w), h, r); return; }
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function formatValue(v) {
    if (metric === "longevity") return Math.round(v) + "s";
    return String(Math.round(v));
  }

  function drawTable(rows) {
    const tbody = document.getElementById("lb-table-body");
    if (!tbody) return;
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="4" class="lb-empty">${I18n.t("leaderboard.empty")}</td></tr>`;
      return;
    }
    const myId = getMyId();
    tbody.innerHTML = rows.map((row, i) => `
      <tr class="${row.c.id === myId ? "is-mine" : ""}">
        <td>${i + 1}</td>
        <td>${row.c.name}</td>
        <td>${row.c.creator}</td>
        <td>${formatValue(row.v)}</td>
      </tr>`).join("");
  }

  function render() {
    if (!isOpen()) return;
    const rows = ranked();
    drawChart(rows);
    drawTable(rows);
  }

  function setMetric(m) {
    if (!METRICS[m]) return;
    metric = m;
    document.querySelectorAll(".lb-tab").forEach(b => b.classList.toggle("is-active", b.dataset.metric === m));
    render();
  }

  if (typeof I18n !== "undefined") I18n.onChange(render);
  addEventListener("resize", () => { if (isOpen()) render(); });

  return {
    open, close, setMetric,
    init(myIdFn) { getMyId = myIdFn; },
    get isOpen() { return isOpen(); }
  };
})();
