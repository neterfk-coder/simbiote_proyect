/* ============================================================
   SIMBIONTE — missions.js
   Las 22 misiones del santuario: las 12 fundacionales (progresión,
   acertijos, peligro, exploración, la runa perdida) más 10 avanzadas
   (dinastía de tres generaciones, cortejo de riesgo, resistencia,
   enjambre social, un segundo tier de acertijos y dominio de la
   economía). El progreso vive en localStorage; la recompensa la
   valida y paga wallet.js (y en modo cuenta, el servidor — el
   cliente nunca decide el monto).
   ============================================================ */
"use strict";

const Missions = (() => {
  const $ = s => document.querySelector(s);
  const STORAGE_KEY = "simbionte_missions_progress";

  /* Catálogo visible (el monto real lo decide wallet.js / server.js).
     tier: 1 fácil · 2 media · 3 difícil · 4 legendaria             */
  const CATALOG = [
    { key: "firstBirth",     icon: "💫", tier: 1, reward: 25 },
    { key: "fed5",           icon: "🌟", tier: 1, reward: 15, target: 5 },
    { key: "survive",        icon: "⏳", tier: 1, reward: 20 },
    { key: "firstCourtship", icon: "💞", tier: 2, reward: 10 },
    { key: "firstChild",     icon: "🧬", tier: 2, reward: 40 },
    { key: "toymaster",      icon: "🪀", tier: 2, reward: 30, target: 4 },
    { key: "founders",       icon: "👁️", tier: 2, reward: 35, target: 8 },
    { key: "explorer",       icon: "🧭", tier: 3, reward: 30, target: 4 },
    { key: "current",        icon: "🌊", tier: 3, reward: 40, tag: "danger" },
    { key: "blackout",       icon: "🌑", tier: 3, reward: 45, tag: "danger" },
    { key: "riddles",        icon: "🗝️", tier: 4, reward: 50, target: 3, tag: "riddle" },
    { key: "rune",           icon: "✴️", tier: 4, reward: 60, tag: "legend" },

    /* --- Las diez difíciles: exigen dedicación, riesgo o suerte trabajada --- */
    { key: "dynasty",        icon: "👑", tier: 4, reward: 70, tag: "legend" },
    { key: "riskyCourtship", icon: "🎲", tier: 3, reward: 45, tag: "danger" },
    { key: "elder",          icon: "🕯️", tier: 3, reward: 55 },
    { key: "family",         icon: "👨‍👩‍👧‍👦", tier: 3, reward: 50, target: 5 },
    { key: "swarm",          icon: "🐠", tier: 3, reward: 35, target: 8 },
    { key: "goldrainBirth",  icon: "🌕", tier: 3, reward: 40, tag: "danger" },
    { key: "eventsWitnessed",icon: "👁️‍🗨️", tier: 3, reward: 40, target: 3 },
    { key: "riddles2",       icon: "🔮", tier: 4, reward: 65, target: 3, tag: "riddle" },
    { key: "hoarder",        icon: "💰", tier: 4, reward: 40, target: 150 },
    { key: "wardrobe",       icon: "🎭", tier: 4, reward: 45, target: 4 },
    { key: "collector",      icon: "🎴", tier: 2, reward: 35, target: 6 }
  ];

  /* ---------- Progreso persistente ---------- */
  const DEFAULT_PROGRESS = { corners: [], founders: [], toys: [], riddle: 0, riddle2: 0, lineage: {}, eventsSeen: [] };
  let progress = { ...DEFAULT_PROGRESS };
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (raw) progress = { ...DEFAULT_PROGRESS, ...raw };
    } catch { /* progreso corrupto: se reinicia */ }
  }
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }

  let hooks = { onComplete: () => {}, getMyCreature: () => null };

  function isDone(key) { return (Wallet.missionsDone || []).includes(key); }
  function doneCount() { return CATALOG.filter(m => isDone(m.key)).length; }

  function complete(key) {
    if (isDone(key)) return;
    hooks.onComplete(key);
    render();
  }

  function addUnique(list, value, key, target) {
    if (list.includes(value)) return;
    list.push(value);
    save();
    if (list.length >= target) complete(key);
    render();
  }

  /* ---------- Señales desde el mundo (main.js) ---------- */
  function notify(kind, value) {
    if (kind === "founderSeen") addUnique(progress.founders, value, "founders", 8);
    else if (kind === "toyUsed") addUnique(progress.toys, value, "toymaster", 4);
    else if (kind === "eventSurvived") complete(value); // "current" | "blackout"
    else if (kind === "runeFound") complete("rune");
    else if (kind === "riskyCourtship") complete("riskyCourtship");
    else if (kind === "goldrainBirth") complete("goldrainBirth");
    else if (kind === "eventSeen") addUnique(progress.eventsSeen, value, "eventsWitnessed", 3);
    else if (kind === "creatureCaught") { if (!isDone("collector") && Codex.count() >= 6) complete("collector"); render(); }
    else if (kind === "mine") registerLineage(value, 0);
    else if (kind === "courtship") onCourtship(value);
  }

  /* ---------- Dinastía: tres generaciones desde cualquiera de tus criaturas ---------- */
  function registerLineage(id, depth) {
    if (progress.lineage[id] !== undefined && progress.lineage[id] <= depth) return;
    progress.lineage[id] = depth;
    save();
    if (depth >= 2) complete("dynasty");
  }
  function onCourtship({ a, b, child }) {
    const da = progress.lineage[a.id], db = progress.lineage[b.id];
    if (da === undefined && db === undefined) return;
    const depth = Math.min(da ?? Infinity, db ?? Infinity) + 1;
    registerLineage(child.id, depth);
  }

  /* ---------- Tick por frame: esquinas del mundo, peligro, resistencia ---------- */
  let liveEvent = null; // evento peligroso en curso con mi criatura viva
  function tick(world, camera, myCreature) {
    // exploración: llegar a las cuatro esquinas del mundo
    if (!isDone("explorer") && Math.abs(camera.x) > 820 && Math.abs(camera.y) > 520) {
      const corner = (camera.x < 0 ? "w" : "e") + (camera.y < 0 ? "n" : "s");
      addUnique(progress.corners, corner, "explorer", 4);
    }
    // peligro: mi criatura debe seguir viva cuando el evento termine
    const evt = world.activeEvent;
    const mineAlive = myCreature && !myCreature.dead;
    if (evt && (evt.type === "current" || evt.type === "blackout")) {
      liveEvent = mineAlive ? evt.type : null;
    } else if (liveEvent) {
      if (mineAlive) notify("eventSurvived", liveEvent);
      liveEvent = null;
    }
    if (!mineAlive) { lastNearby = 0; return; }
    lastNearby = myCreature.nearbyCount(world, 140);
    if (!isDone("elder") && myCreature.age > 180) complete("elder");
    if (!isDone("family") && (myCreature.childCount || 0) >= 5) complete("family");
    if (!isDone("swarm") && lastNearby >= 8) complete("swarm");
  }

  /* ---------- La runa perdida: un lugar secreto por sesión ---------- */
  const runeAngle = Math.random() * Math.PI * 2;
  const runeRadius = 750 + Math.random() * 550;
  const runePos = { x: Math.cos(runeAngle) * runeRadius, y: Math.sin(runeAngle) * runeRadius * 0.62 };
  function tryRuneAt(x, y) {
    if (isDone("rune")) return false;
    if (Math.hypot(runePos.x - x, runePos.y - y) > 52) return false;
    notify("runeFound");
    return true;
  }
  function drawRune(p) {
    if (isDone("rune")) return;
    const t = p.millis() * 0.001;
    const pulse = 0.75 + Math.sin(t * 1.6) * 0.25;
    p.push();
    p.translate(runePos.x, runePos.y);
    p.noStroke();
    for (let k = 3; k > 0; k--) { p.fill(45, 60, 95, 0.05 * pulse * k); p.circle(0, 0, 40 * k * pulse); }
    p.rotate(t * 0.4);
    p.noFill();
    p.stroke(45, 55, 100, 0.5 + pulse * 0.3);
    p.strokeWeight(1.6);
    p.triangle(0, -16, 14, 10, -14, 10);
    p.rotate(Math.PI);
    p.triangle(0, -16, 14, 10, -14, 10);
    p.circle(0, 0, 44);
    p.pop();
  }

  /* ---------- Acertijos: tres, en secuencia ---------- */
  const norm = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/^(el|la|los|las|un|una|the)\s+/, "").trim();
  const RIDDLE_ANSWERS = [
    ["color", "colores"],
    ["fundadores", "founders", "ocho", "eight"],
    ["apagon", "blackout", "oscuridad", "darkness", "noche", "night"]
  ];
  function riddleAttempt(answer) {
    if (progress.riddle >= 3) return { done: true };
    const ok = RIDDLE_ANSWERS[progress.riddle].includes(norm(answer));
    if (!ok) return { ok: false };
    progress.riddle++;
    save();
    if (progress.riddle >= 3) { complete("riddles"); return { ok: true, done: true }; }
    render();
    return { ok: true, next: progress.riddle };
  }

  /* ---------- Segundo tier de acertijos: más difíciles, se desbloquea con el primero ---------- */
  const RIDDLE_ANSWERS_2 = [
    ["genes", "genes"],
    ["diamantes", "diamonds", "diamante", "diamond"],
    ["mundo", "world", "mapa", "map"]
  ];
  function riddle2Attempt(answer) {
    if (progress.riddle2 >= 3) return { done: true };
    const ok = RIDDLE_ANSWERS_2[progress.riddle2].includes(norm(answer));
    if (!ok) return { ok: false };
    progress.riddle2++;
    save();
    if (progress.riddle2 >= 3) { complete("riddles2"); return { ok: true, done: true }; }
    render();
    return { ok: true, next: progress.riddle2 };
  }

  /* ---------- Progreso mostrado por misión ---------- */
  let lastNearby = 0;
  function wardrobeSlotsFilled() {
    return new Set(Wallet.equippedItems().map(id => Wallet.WEAR_SLOTS[id]).filter(Boolean)).size;
  }
  function progressOf(key) {
    const mine = hooks.getMyCreature();
    if (key === "fed5") return Math.min(5, mine?.feedCount || 0);
    if (key === "founders") return progress.founders.length;
    if (key === "toymaster") return progress.toys.length;
    if (key === "explorer") return progress.corners.length;
    if (key === "riddles") return progress.riddle;
    if (key === "riddles2") return progress.riddle2;
    if (key === "family") return Math.min(5, mine?.childCount || 0);
    if (key === "swarm") return Math.min(8, lastNearby);
    if (key === "eventsWitnessed") return progress.eventsSeen.length;
    if (key === "hoarder") return Math.min(150, Wallet.diamonds);
    if (key === "wardrobe") return wardrobeSlotsFilled();
    if (key === "collector") return Math.min(6, Codex.count());
    return 0;
  }

  /* ---------- Pantalla de misiones ---------- */
  let isOpen = false;
  function render() {
    if (!isOpen) return;
    const done = doneCount();
    $("#ms-progress-label").textContent = I18n.t("missions.progress", { done, total: CATALOG.length });
    $("#ms-progress-fill").style.width = (done / CATALOG.length * 100) + "%";

    const grid = $("#ms-grid");
    grid.innerHTML = "";
    for (const m of CATALOG) {
      const finished = isDone(m.key);
      const card = document.createElement("article");
      card.className = "ms-card" + (finished ? " is-done" : "");
      card.dataset.tier = m.tier;

      const cur = progressOf(m.key);
      const showBar = m.target && !finished;
      const riddle2Locked = m.key === "riddles2" && !isDone("riddles");
      card.innerHTML = `
        <div class="ms-card-top">
          <span class="ms-icon">${m.icon}</span>
          <span class="ms-tier" title="${I18n.t("missions.tier" + m.tier)}">${"●".repeat(m.tier)}${"○".repeat(4 - m.tier)}</span>
        </div>
        <h3 class="ms-name">${I18n.t("mission." + m.key)}</h3>
        <p class="ms-desc">${riddle2Locked ? I18n.t("missions.locked") : I18n.t("missionDesc." + m.key)}</p>
        ${m.tag ? `<span class="ms-tag ms-tag-${m.tag}">${I18n.t("missions.tag." + m.tag)}</span>` : ""}
        ${showBar && !riddle2Locked ? `<div class="ms-bar"><div class="ms-bar-fill" style="width:${cur / m.target * 100}%"></div></div>
                     <span class="ms-count">${cur} / ${m.target}</span>` : ""}
        <div class="ms-foot">
          ${finished
            ? `<span class="ms-done-chip">✓ ${I18n.t("missions.done")}</span>`
            : `<span class="ms-reward">💎 ${m.reward}</span>`}
          ${m.key === "riddles" && !finished ? `<button type="button" class="btn btn-primary btn-small ms-solve" data-riddle-tier="1">${I18n.t("missions.solve")}</button>` : ""}
          ${m.key === "riddles2" && !finished && !riddle2Locked ? `<button type="button" class="btn btn-primary btn-small ms-solve" data-riddle-tier="2">${I18n.t("missions.solve")}</button>` : ""}
        </div>`;
      const solveBtn = card.querySelector(".ms-solve");
      if (solveBtn) solveBtn.addEventListener("click", () => openRiddle(+solveBtn.dataset.riddleTier));
      grid.appendChild(card);
    }
  }

  function open() {
    isOpen = true;
    $("#screen-missions").classList.add("is-active");
    render();
  }
  function close() {
    isOpen = false;
    $("#screen-missions").classList.remove("is-active");
    closeRiddle();
  }

  /* ---------- Modal del acertijo (dos niveles: 1 y 2) ---------- */
  let riddleTier = 1;
  function openRiddle(tier) {
    riddleTier = tier || riddleTier;
    const done = riddleTier === 2 ? progress.riddle2 : progress.riddle;
    if (done >= 3) return;
    $("#riddle-step").textContent = I18n.t(riddleTier === 2 ? "riddle.step2" : "riddle.step", { n: done + 1 });
    $("#riddle-text").textContent = I18n.t((riddleTier === 2 ? "riddle.r2_" : "riddle.r") + (done + 1));
    $("#riddle-input").value = "";
    $("#riddle-error").classList.add("hidden");
    $("#panel-riddle").classList.add("is-open");
    setTimeout(() => $("#riddle-input").focus(), 250);
  }
  function closeRiddle() { $("#panel-riddle").classList.remove("is-open"); }
  function submitRiddle() {
    const result = riddleTier === 2 ? riddle2Attempt($("#riddle-input").value) : riddleAttempt($("#riddle-input").value);
    if (result.done) { closeRiddle(); return; }
    if (!result.ok) {
      const err = $("#riddle-error");
      err.textContent = I18n.t("riddle.wrong");
      err.classList.remove("hidden");
      const card = $("#panel-riddle");
      card.classList.remove("shake");
      void card.offsetWidth; // reinicia la animación
      card.classList.add("shake");
      return;
    }
    openRiddle(riddleTier); // acierto: pasa al siguiente
  }

  function init(options) {
    hooks = { ...hooks, ...options };
    load();
    $("#ms-close").addEventListener("click", close);
    $("#riddle-close").addEventListener("click", closeRiddle);
    $("#riddle-form").addEventListener("submit", e => { e.preventDefault(); submitRiddle(); });
    Wallet.onChange(state => {
      if (!isDone("hoarder") && state.diamonds >= 150) complete("hoarder");
      if (!isDone("wardrobe") && wardrobeSlotsFilled() >= 4) complete("wardrobe");
      render();
    });
    I18n.onChange(() => render());
  }

  return { init, open, close, notify, tick, tryRuneAt, drawRune, get isOpen() { return isOpen; }, doneCount };
})();
