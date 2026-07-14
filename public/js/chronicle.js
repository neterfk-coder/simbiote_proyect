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

  /* --- Telar local: plantillas míticas --- */
  const OPEN = ["En la hora quieta,", "Bajo la corriente antigua,", "Cuando el abismo respiró,",
                "En el pliegue del tiempo,", "Mientras el mundo cantaba,", "Al borde de la luz,"];
  const BIRTH = [
    n => `${n.name} abrió los ojos, nacida de ${DNA.epithet(n.genome)}.`,
    n => `una chispa llamada ${n.name} despertó, hecha de ${DNA.epithet(n.genome)}.`,
    n => `el vacío pronunció un nombre nuevo: ${n.name}.`
  ];
  const LOVE = [
    e => `${e.a.name} y ${e.b.name} danzaron hasta volverse tres: así llegó ${e.child.name}.`,
    e => `de la unión de ${e.a.name} con ${e.b.name} brotó ${e.child.name}, heredera de dos cantos.`,
    e => `${e.child.name} nació llevando la luz de ${e.a.name} y la sombra de ${e.b.name}.`
  ];
  const DEATH = [
    c => `${c.name} se apagó despacio, y su silueta quedó grabada en el lecho del mundo.`,
    c => `el canto de ${c.name} cesó; su fósil ahora guía a los recién nacidos.`,
    c => `${c.name} regresó a la corriente. Nada se pierde en SIMBIONTE.`
  ];
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  function localMyth(type, data) {
    const open = pick(OPEN);
    if (type === "birth") return `${open} ${pick(BIRTH)(data)}`;
    if (type === "courtship") return `${open} ${pick(LOVE)(data)}`;
    if (type === "death") return `${open} ${pick(DEATH)(data)}`;
    return null;
  }

  /* --- Intento de crónica con IA (servidor) --- */
  async function aiMyth(type, summary) {
    try {
      const base = window.SIMBIONTE_CONFIG?.SERVER_URL || "";
      const r = await fetch(base + "/api/chronicle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ event: { type, ...summary } })
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
