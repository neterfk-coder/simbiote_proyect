/* ============================================================
   SIMBIONTE — courtship.js
   proposeCourtship(): el visitante arrastra su criatura hacia
   otra que le guste. Se calcula la compatibilidad genética
   (DNA.distance) y se muestra antes de confirmar el cruce.
   ============================================================ */
"use strict";

const Courtship = (() => {
  function nearestTarget(x, y, exclude) {
    let best = null, bd = 70;
    for (const c of World.creatures) {
      if (c === exclude || c.dead) continue;
      const d = Math.hypot(c.x - x, c.y - y) - c.r * 0.4;
      if (d < bd) { bd = d; best = c; }
    }
    return best;
  }

  function compatibility(gd) {
    if (gd <= 0.12) return { level: "clone", prob: 0.15 };
    if (gd < 0.42) return { level: "high", prob: 0.9 };
    return { level: "low", prob: 0.15 };
  }

  /* Al soltar: devuelve la criatura objetivo bajo el punto (o null). */
  function endDrag(mine, x, y) {
    return nearestTarget(x, y, mine);
  }

  function preview(mine, t) {
    const gd = DNA.distance(mine.genome, t.genome);
    return { gd, ...compatibility(gd) };
  }

  /* Ejecuta el intento de cruce (llamado al confirmar la propuesta) */
  function attempt(mine, t) {
    if (!t || t.dead || mine.dead) return { success: false, reason: "gone" };
    if (mine.mateCooldown > 0 || t.mateCooldown > 0) return { success: false, reason: "cooldown" };
    const { prob } = compatibility(DNA.distance(mine.genome, t.genome));
    mine.mateCooldown = t.mateCooldown = prob >= 0.5 ? 45 : 20;
    if (Math.random() >= prob) return { success: false, reason: "luck" };

    const child = new Creature(DNA.offspring(mine.genome, t.genome), {
      x: (mine.x + t.x) / 2, y: (mine.y + t.y) / 2,
      parents: [
        { id: mine.id, name: mine.name, creator: mine.creator },
        { id: t.id, name: t.name, creator: t.creator }
      ],
      creator: I18n.t("ecosystemCreator")
    });
    mine.childCount = (mine.childCount || 0) + 1;
    t.childCount = (t.childCount || 0) + 1;
    World.heartsAt(child.x, child.y, (mine.hue1 + t.hue1) / 2);
    World.add(child);
    World.announceCourtship({ a: mine, b: t, child });
    Net.sendBirth(child);
    return { success: true, child };
  }

  return { endDrag, preview, attempt };
})();
