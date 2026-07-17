/* ============================================================
   SIMBIONTE — codex.js
   El códice: cada criatura que lográs atrapar en un encuentro
   (encounterCreature) queda registrada acá para siempre, incluso
   si más tarde muere — es un registro, no una posesión viva.
   Solo datos; la pantalla que lo muestra vive en main.js.
   ============================================================ */
"use strict";

const Codex = (() => {
  const KEY = "simbionte_codex";
  let entries = {};

  function load() {
    try { entries = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { entries = {}; }
  }
  function save() { localStorage.setItem(KEY, JSON.stringify(entries)); }

  function has(id) { return !!entries[id]; }
  function count() { return Object.keys(entries).length; }
  function list() { return Object.values(entries).sort((a, b) => b.at - a.at); }

  /* Rareza: los fundadores son siempre legendarios; el resto se mide
     por cuántos genes de anatomía caen en un extremo (muy alto o muy
     bajo) — una criatura visualmente llamativa es, con justicia, rara. */
  function rarityOf(genome, permanent) {
    if (permanent) return "legendary";
    const G = DNA.G;
    const traits = [G.SIZE, G.GLOW, G.SPEED, G.SPIKE, G.FLOW, G.AURA, G.TENTACLES, G.EYES];
    const extremes = traits.filter(i => genome[i] > 0.85 || genome[i] < 0.15).length;
    if (extremes >= 3) return "epic";
    if (extremes >= 1) return "rare";
    return "common";
  }

  function add(creature) {
    if (entries[creature.id]) return null;
    const entry = {
      id: creature.id, name: creature.name, genome: creature.genome.slice(),
      permanent: !!creature.permanent, creator: creature.creator,
      rarity: rarityOf(creature.genome, creature.permanent), at: Date.now()
    };
    entries[creature.id] = entry;
    save();
    return entry;
  }

  load();
  return { has, add, list, count, rarityOf };
})();
