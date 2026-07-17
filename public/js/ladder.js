/* ============================================================
   SIMBIONTE — ladder.js
   El Sendero: 20 pasos en escalera. Cada paso mide una habilidad
   del santuario con tres umbrales (1★ / 2★ / 3★); un paso se
   desbloquea cuando el anterior tiene al menos una estrella. Las
   estrellas acumuladas abren cofres misteriosos, cuya recompensa
   la paga el catálogo autoritativo de wallet.js / server.js
   (claves chest1..chest4).
   ============================================================ */
"use strict";

const Ladder = (() => {
  const $ = s => document.querySelector(s);
  const STORAGE_KEY = "simbionte_ladder_stats";

  /* Contadores propios (lo que ningún otro módulo registra ya) */
  const DEFAULT_STATS = { births: 0, courtships: 0, toys: 0, offspring: 0, maxAge: 0, peakDiamonds: 0, dangers: 0, purchases: 0 };
  let S = { ...DEFAULT_STATS };
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (raw) S = { ...DEFAULT_STATS, ...raw };
    } catch { /* se reinicia */ }
  }
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(S)); }

  /* Métricas: cada una devuelve el valor actual (muchas se leen en vivo
     de Missions/Codex/Wallet para no duplicar registros). */
  const METRICS = {
    missionsDone: () => Missions.doneCount(), // filtrado por catálogo: no cuenta cofres, rachas ni giros de ruleta
    births: () => S.births,
    feeds: () => Missions.progress.feedsTotal,
    maxAge: () => Math.floor(S.maxAge),
    courtships: () => S.courtships,
    toys: () => S.toys,
    corners: () => Missions.progress.corners.length,
    foundersSeen: () => Missions.progress.founders.length,
    codex: () => Codex.count(),
    peakDiamonds: () => S.peakDiamonds,
    offspring: () => S.offspring,
    riddles: () => Missions.progress.riddle + Missions.progress.riddle2,
    eventsSeen: () => Missions.progress.eventsSeen.length,
    dangers: () => S.dangers,
    purchases: () => S.purchases,
    wardrobe: () => new Set(Wallet.equippedItems().map(id => Wallet.WEAR_SLOTS[id]).filter(Boolean)).size,
    lineage: () => Missions.lineageDepth(),
    codexFounders: () => Codex.list().filter(e => e.permanent).length,
    priorStars: () => STEPS.slice(0, 19).reduce((sum, st) => sum + starsOf(st), 0)
  };

  const STEPS = [
    { key: "awaken",      icon: "🌅", metric: "missionsDone", t: [1, 3, 5] },
    { key: "creator",     icon: "💫", metric: "births",       t: [1, 2, 4] },
    { key: "guardian",    icon: "🌟", metric: "feeds",        t: [3, 8, 15] },
    { key: "patience",    icon: "⏳", metric: "maxAge",       t: [60, 150, 300] },
    { key: "courter",     icon: "💞", metric: "courtships",   t: [1, 3, 6] },
    { key: "playful",     icon: "🪀", metric: "toys",         t: [4, 10, 20] },
    { key: "corners",     icon: "🧭", metric: "corners",      t: [2, 3, 4] },
    { key: "gazes",       icon: "👁️", metric: "foundersSeen", t: [3, 6, 8] },
    { key: "hunter",      icon: "🎴", metric: "codex",        t: [2, 6, 10] },
    { key: "fortune",     icon: "💎", metric: "peakDiamonds", t: [40, 120, 250] },
    { key: "lineage",     icon: "🧬", metric: "offspring",    t: [1, 3, 5] },
    { key: "enigmas",     icon: "🗝️", metric: "riddles",      t: [1, 3, 6] },
    { key: "presences",   icon: "🌊", metric: "eventsSeen",   t: [1, 2, 3] },
    { key: "temple",      icon: "🌑", metric: "dangers",      t: [1, 2, 3] },
    { key: "merchant",    icon: "🛍️", metric: "purchases",    t: [1, 3, 6] },
    { key: "style",       icon: "🎭", metric: "wardrobe",     t: [1, 2, 4] },
    { key: "generations", icon: "🏛️", metric: "lineage",      t: [1, 2, 3] },
    { key: "legends",     icon: "📜", metric: "codexFounders", t: [2, 5, 8] },
    { key: "constancy",   icon: "🎯", metric: "missionsDone", t: [10, 16, 22] },
    { key: "ascension",   icon: "👑", metric: "priorStars",   t: [30, 42, 54] }
  ];

  const CHESTS = [
    { key: "chest1", need: 10, reward: 30 },
    { key: "chest2", need: 25, reward: 50 },
    { key: "chest3", need: 40, reward: 75 },
    { key: "chest4", need: 55, reward: 100 }
  ];

  function starsOf(step) {
    const v = METRICS[step.metric]();
    return step.t.filter(th => v >= th).length;
  }
  function totalStars() { return STEPS.reduce((sum, st) => sum + starsOf(st), 0); }
  function unlockedUpTo() {
    // el paso i se desbloquea si el anterior tiene al menos 1★
    let i = 0;
    while (i < STEPS.length - 1 && starsOf(STEPS[i]) >= 1) i++;
    return i;
  }

  let hooks = { onChest: () => {} };

  /* ---------- Señales desde el mundo ---------- */
  function notify(kind) {
    if (kind === "birth") S.births++;
    else if (kind === "courtshipProposed") S.courtships++;
    else if (kind === "toy") S.toys++;
    else if (kind === "offspring") S.offspring++;
    else if (kind === "dangerSurvived") S.dangers++;
    else if (kind === "purchase") S.purchases++;
    else return;
    save();
    render();
  }
  function tick(myCreature) {
    if (myCreature && !myCreature.dead && myCreature.age > S.maxAge) {
      S.maxAge = myCreature.age;
      if (Math.floor(S.maxAge) % 10 === 0) save(); // sin castigar el frame-rate
    }
  }

  /* ---------- Cofres ---------- */
  function chestState(chest) {
    if ((Wallet.missionsDone || []).includes(chest.key)) return "opened";
    return totalStars() >= chest.need ? "ready" : "locked";
  }
  async function openChest(chest) {
    if (chestState(chest) !== "ready") return;
    const result = await Wallet.claimMission(chest.key);
    if (result) hooks.onChest(chest, result.reward);
    render();
  }

  /* ---------- Render (vive dentro de la pantalla de misiones) ---------- */
  function render() {
    const view = $("#ladder-view");
    if (!view || view.classList.contains("hidden")) return;

    $("#ladder-stars-label").textContent = I18n.t("ladder.starsTotal", { stars: totalStars(), max: STEPS.length * 3 });

    const chestRow = $("#ladder-chests");
    chestRow.innerHTML = "";
    for (const chest of CHESTS) {
      const state = chestState(chest);
      const el = document.createElement("button");
      el.type = "button";
      el.className = "ladder-chest is-" + state;
      el.innerHTML = `
        <span class="ladder-chest-icon">${state === "opened" ? "🪙" : "🎁"}</span>
        <span class="ladder-chest-label">${state === "opened"
          ? I18n.t("ladder.chestOpened", { amount: chest.reward })
          : state === "ready" ? I18n.t("ladder.chestReady")
          : I18n.t("ladder.chestNeed", { stars: chest.need })}</span>`;
      if (state === "ready") el.addEventListener("click", () => openChest(chest));
      chestRow.appendChild(el);
    }

    const path = $("#ladder-path");
    path.innerHTML = "";
    const maxUnlocked = unlockedUpTo();
    STEPS.forEach((step, i) => {
      const locked = i > maxUnlocked;
      const stars = starsOf(step);
      const v = METRICS[step.metric]();
      const nextTh = step.t.find(th => v < th);
      const el = document.createElement("div");
      el.className = "ladder-step" + (locked ? " is-locked" : "") + (stars === 3 ? " is-perfect" : "") + (i % 2 ? " is-right" : "");
      el.innerHTML = `
        <div class="ladder-node">${locked ? "🔒" : step.icon}</div>
        <div class="ladder-info">
          <p class="ladder-step-name">${locked ? I18n.t("ladder.locked") : I18n.t("ladder.step." + step.key)}</p>
          ${locked ? "" : `<p class="ladder-step-desc">${I18n.t("ladder.desc." + step.key)}</p>
          <p class="ladder-step-progress">${Math.min(v, step.t[2])} / ${nextTh ?? step.t[2]}</p>`}
          <p class="ladder-stars">${"★".repeat(stars)}${"☆".repeat(3 - stars)}</p>
        </div>`;
      path.appendChild(el);
    });
  }

  function init(options) {
    hooks = { ...hooks, ...options };
    load();
    Wallet.onChange(state => {
      if (state.diamonds > S.peakDiamonds) { S.peakDiamonds = state.diamonds; save(); }
      render();
    });
    I18n.onChange(() => render());
  }

  return { init, notify, tick, render, totalStars };
})();
