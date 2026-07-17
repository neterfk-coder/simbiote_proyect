/* ============================================================
   SIMBIONTE — encounter.js
   encounterCreature(): tocar una criatura que todavía no está en
   tu códice dispara este mini-juego de puntería en vez de solo
   inspeccionarla. Ganás su carta; perdés y podés reintentar en
   unos segundos (la criatura no se pierde, solo hay que esperar).
   ============================================================ */
"use strict";

const Encounter = (() => {
  const $ = s => document.querySelector(s);
  const RETRY_COOLDOWN = 8000;
  const cooldowns = new Map(); // id -> timestamp del próximo intento permitido

  let target = null, raf = null, startTime = 0, speed = 0, zoneStart = 0, zoneEnd = 0, resolved = false;
  let hooks = { onCaught: () => {}, onMissed: () => {} };

  function onCooldown(id) {
    const until = cooldowns.get(id);
    return until && performance.now() < until;
  }

  /* Onda triangular: sube y baja a velocidad constante, más justa
     para el ojo que una senoidal (que se "pega" en los extremos). */
  function markerPos(t) {
    const phase = (t * speed) % 2;
    return phase <= 1 ? phase : 2 - phase;
  }

  function frame() {
    const t = (performance.now() - startTime) / 1000;
    $("#encounter-marker").style.left = (markerPos(t) * 100) + "%";
    raf = requestAnimationFrame(frame);
  }

  function attempt(creature) {
    if (onCooldown(creature.id)) return false;
    target = creature;
    resolved = false;
    const G = DNA.G, g = creature.genome;
    speed = 1.3 + g[G.PULSE] * 2.2;
    const zoneWidthPct = Math.max(0.14, 0.32 - g[G.CURIOUS] * 0.16);
    zoneStart = Math.random() * (1 - zoneWidthPct);
    zoneEnd = zoneStart + zoneWidthPct;

    $("#encounter-name").textContent = creature.name;
    $("#encounter-zone").style.left = (zoneStart * 100) + "%";
    $("#encounter-zone").style.width = ((zoneEnd - zoneStart) * 100) + "%";
    $("#encounter-result").classList.add("hidden");
    $("#encounter-stop-btn").disabled = false;
    $("#panel-encounter").classList.add("is-open");

    startTime = performance.now();
    frame();
    return true;
  }

  function stop() {
    if (resolved || !target) return;
    resolved = true;
    cancelAnimationFrame(raf);
    const t = (performance.now() - startTime) / 1000;
    const pos = markerPos(t);
    const success = pos >= zoneStart && pos <= zoneEnd;
    $("#encounter-stop-btn").disabled = true;

    const resEl = $("#encounter-result");
    resEl.classList.remove("hidden");
    if (success) {
      const entry = Codex.add(target);
      resEl.textContent = I18n.t("encounter.success", { name: target.name });
      resEl.className = "encounter-result encounter-success";
      hooks.onCaught(target, entry);
    } else {
      cooldowns.set(target.id, performance.now() + RETRY_COOLDOWN);
      resEl.textContent = I18n.t("encounter.fail");
      resEl.className = "encounter-result encounter-fail";
      hooks.onMissed(target);
    }
    setTimeout(close, 1400);
  }

  function close() {
    cancelAnimationFrame(raf);
    $("#panel-encounter").classList.remove("is-open");
    target = null;
  }

  function init(options) {
    hooks = { ...hooks, ...options };
    $("#encounter-stop-btn").addEventListener("click", stop);
    $("#encounter-close").addEventListener("click", close);
    document.addEventListener("keydown", e => {
      if (!$("#panel-encounter").classList.contains("is-open")) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); stop(); }
    });
  }

  return { init, attempt, close, onCooldown };
})();
