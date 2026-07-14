/* ============================================================
   SIMBIONTE — chronicle.js
   El Cronista observa el ecosistema y escribe su mitología.
   Intenta usar la IA del servidor (/api/chronicle → Claude);
   si no está configurada, usa el telar local de mitos.
   ============================================================ */
"use strict";

const Chronicle = (() => {
  const feed = document.getElementById("chronicle-feed");
  let entryCount = 0;

  /* --- Telar local: plantillas míticas (traducidas vía I18n) --- */
  const pickN = n => Math.floor(Math.random() * n);

  function localMyth(type, data) {
    const open = I18n.t("myth.open" + pickN(6));
    if (type === "birth") {
      const line = I18n.t("myth.birth" + pickN(3), { name: data.name, epithet: DNA.epithet(data.genome) });
      return `${open} ${line}`;
    }
    if (type === "courtship") {
      const line = I18n.t("myth.love" + pickN(3), { a: data.a.name, b: data.b.name, child: data.child.name });
      return `${open} ${line}`;
    }
    if (type === "death") {
      const line = I18n.t("myth.death" + pickN(3), { name: data.name });
      return `${open} ${line}`;
    }
    return null;
  }

  /* --- Intento de crónica con IA (servidor) --- */
  async function aiMyth(type, summary) {
    try {
      const base = window.SIMBIONTE_CONFIG?.SERVER_URL || "";
      const r = await fetch(base + "/api/chronicle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ event: { type, ...summary }, lang: I18n.lang })
      });
      if (!r.ok) return null;
      const data = await r.json();
      return data.text || null;
    } catch { return null; }
  }

  function render(text, { broadcast = true } = {}) {
    if (!text || !feed) return;
    entryCount++;
    const el = document.createElement("p");
    el.className = "chronicle-entry";
    el.textContent = text;
    feed.prepend(el);
    while (feed.children.length > 24) feed.removeChild(feed.lastChild);
    if (broadcast && typeof Net !== "undefined") Net.sendChronicle({ text, at: Date.now() });
  }

  async function record(type, data) {
    // resumen mínimo y anónimo para la IA
    const summary =
      type === "birth" ? { name: data.name, origin: DNA.epithet(data.genome) } :
      type === "courtship" ? { parents: [data.a.name, data.b.name], child: data.child.name } :
      { name: data.name, age: Math.round(data.age) };

    let text = null;
    if (Math.random() < 0.7) text = await aiMyth(type, summary); // no saturar la API
    if (!text) text = localMyth(type, data);
    render(text);
  }

  function receive(entry) { render(entry.text, { broadcast: false }); }

  return { record, receive, render };
})();
