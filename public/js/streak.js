/* ============================================================
   SIMBIONTE — streak.js
   Racha diaria: volver cada día consecutivo la hace crecer;
   faltar un día la reinicia. Los hitos (2, 3, 5, 7 y 14 días)
   pagan diamantes a través del mismo canal autoritativo de
   misiones (claves streak2..streak14), una sola vez cada uno.
   ============================================================ */
"use strict";

const Streak = (() => {
  const $ = s => document.querySelector(s);
  const KEY = "simbionte_streak";
  const MILESTONES = [2, 3, 5, 7, 14];

  let state = { last: null, count: 0 };
  function today() { return new Date().toISOString().slice(0, 10); }
  function yesterday() {
    const d = new Date(); d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }
  function load() {
    try { state = JSON.parse(localStorage.getItem(KEY)) || { last: null, count: 0 }; }
    catch { state = { last: null, count: 0 }; }
  }
  function save() { localStorage.setItem(KEY, JSON.stringify(state)); }

  function renderPill() {
    const pill = $("#streak-pill");
    if (state.count < 1) { pill.classList.add("hidden"); return; }
    pill.classList.remove("hidden");
    $("#streak-count").textContent = state.count;
    pill.classList.toggle("is-hot", state.count >= 3);
  }

  function showOverlay(kept) {
    $("#streak-overlay-text").textContent = I18n.t("streak.day", { n: state.count });
    const next = MILESTONES.find(m => m > state.count);
    $("#streak-overlay-sub").textContent = kept
      ? (next ? I18n.t("streak.next", { n: next }) : I18n.t("streak.legend"))
      : I18n.t("streak.started");
    const overlay = $("#streak-overlay");
    overlay.classList.remove("hidden");
    requestAnimationFrame(() => overlay.classList.add("show"));
    setTimeout(() => {
      overlay.classList.remove("show");
      setTimeout(() => overlay.classList.add("hidden"), 600);
    }, 3000);
  }

  async function check(hooks) {
    load();
    if (state.last === today()) { renderPill(); return; } // ya contó hoy
    const kept = state.last === yesterday();
    state.count = kept ? state.count + 1 : 1;
    state.last = today();
    save();
    renderPill();
    showOverlay(kept);
    if (MILESTONES.includes(state.count)) {
      const result = await Wallet.claimMission("streak" + state.count);
      if (result) hooks.onMilestone(state.count, result.reward);
    }
  }

  function init(hooks) {
    check(hooks);
    $("#streak-pill").addEventListener("click", () => showOverlay(true));
  }

  return { init, get count() { load(); return state.count; } };
})();
