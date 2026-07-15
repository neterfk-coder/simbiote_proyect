/* ============================================================
   SIMBIONTE — net.js
   Conexión al mundo compartido (Socket.io). Si no hay servidor,
   activa el "modo santuario": criaturas ancestrales locales,
   para que el mundo nunca esté vacío ni la demo falle.
   También expone el cliente opcional de Supabase (solo lectura
   desde el navegador, con la clave pública "anon").
   ============================================================ */
"use strict";

const Net = (() => {
  let socket = null;
  let online = false;
  let supabase = null;
  const statusEl = () => document.getElementById("net-status");
  const presenceEl = () => document.getElementById("presence");

  let status = { mode: "connecting", online: 0, sanctuary: false };

  function renderStatus() {
    const el = statusEl();
    if (!el) return;
    el.dataset.mode = status.mode;
    el.querySelector("span").textContent =
      status.mode === "online" ? I18n.t("hud.online") :
      status.mode === "connecting" ? I18n.t("hud.connecting") : I18n.t("hud.offline");
    const p = presenceEl();
    if (!p) return;
    p.textContent =
      status.mode === "online" && status.online ? I18n.t("hud.presence", { n: status.online }) :
      status.mode === "offline" && status.sanctuary ? I18n.t("hud.offlineLocal") : "";
  }
  function setStatus(mode, opts = {}) {
    status = { mode, online: opts.online || 0, sanctuary: !!opts.sanctuary };
    renderStatus();
  }
  if (typeof I18n !== "undefined") I18n.onChange(renderStatus);

  /* ---------- Supabase (opcional, navegador) ---------- */
  function initSupabase() {
    const cfg = window.SIMBIONTE_CONFIG || {};
    if (cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase) {
      supabase = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    }
  }
  async function fetchArchive(limit = 20) {
    if (!supabase) return [];
    const { data } = await supabase.from("creatures")
      .select("*").order("created_at", { ascending: false }).limit(limit);
    return data || [];
  }

  /* ---------- Socket.io ---------- */
  function connect({ onRoster, onBirth, onChronicle }) {
    initSupabase();
    if (typeof io === "undefined") { sanctuary(onRoster); return; }
    setStatus("connecting");
    const base = window.SIMBIONTE_CONFIG?.SERVER_URL || undefined;
    try {
      socket = base ? io(base, { timeout: 4000 }) : io({ timeout: 4000 });
    } catch { sanctuary(onRoster); return; }

    const fallback = setTimeout(() => { if (!online) sanctuary(onRoster); }, 4500);

    socket.on("connect", () => {
      online = true; clearTimeout(fallback);
      setStatus("online");
    });
    socket.on("roster", data => onRoster(data.creatures || [], data.chronicle || []));
    socket.on("birth", c => onBirth(c));
    socket.on("chronicle", e => onChronicle(e));
    socket.on("presence", p => setStatus("online", { online: p.online }));
    socket.on("disconnect", () => { online = false; setStatus("offline"); });
    socket.on("connect_error", () => { if (!online) { clearTimeout(fallback); sanctuary(onRoster); } });
  }

  /* Modo santuario: el mundo se puebla con ancestros simulados */
  function sanctuary(onRoster) {
    online = false;
    setStatus("offline", { sanctuary: true });
    const ancients = Array.from({ length: 7 }, () => ({
      id: "ancient-" + Math.random().toString(36).slice(2, 8),
      name: null, genome: DNA.random(), creator: I18n.t("ancestorsCreator")
    }));
    onRoster(ancients, []);
  }

  function sendBirth(creature) {
    if (online && socket) socket.emit("birth", {
      id: creature.id, name: creature.name, genome: creature.genome,
      parents: creature.parents, creator: creature.creator, cosmetics: creature.cosmetics,
      user_id: (typeof Auth !== "undefined" && Auth.user) ? Auth.user.id : null
    });
  }
  function sendChronicle(entry) {
    if (online && socket) socket.emit("chronicle", entry);
  }

  return { connect, sendBirth, sendChronicle, fetchArchive, get online() { return online; } };
})();
