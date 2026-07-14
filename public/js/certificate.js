/* ============================================================
   SIMBIONTE — certificate.js
   Genera el Certificado de Nacimiento de una criatura como
   imagen PNG (1080×1350, formato ideal para redes) usando un
   lienzo p5 fuera de pantalla. Palanca del premio "Favorito
   del Público": cada creador comparte su criatura.
   ============================================================ */
"use strict";

const Certificate = (() => {

  function download(creature, p5instance) {
    const W = 1080, H = 1350;
    const g = p5instance.createGraphics(W, H);
    g.colorMode(g.HSB, 360, 100, 100, 1);
    g.pixelDensity(1);

    // fondo abisal con gradiente radial
    g.noStroke();
    for (let i = 0; i < 60; i++) {
      const k = i / 60;
      g.fill(255, 45, 10 + k * 5, 1);
      g.rect(0, H * k / 1.0, W, H / 60 + 2);
    }
    for (let i = 26; i > 0; i--) {
      g.fill(creature.hue1, 60, 30, 0.03);
      g.circle(W / 2, H * 0.40, i * 34);
    }
    // plancton decorativo
    for (let i = 0; i < 90; i++) {
      g.fill((creature.hue2 + i * 3) % 360, 40, 90, 0.12);
      g.circle(Math.random() * W, Math.random() * H, 1 + Math.random() * 3);
    }

    // retrato de la criatura (anatomía real desde sus genes)
    g.push();
    g.translate(W / 2, H * 0.40);
    const D = DNA.G, gen = creature.genome;
    const R = 150 + gen[D.SIZE] * 90;
    for (let i = 4; i > 0; i--) {
      g.fill(creature.hue1, 70, 90, 0.05 * gen[D.GLOW] * i);
      g.circle(0, 0, R * (1.8 + i * 0.5));
    }
    g.stroke(creature.hue2, 70, 92, 0.6);
    g.strokeWeight(4);
    for (let i = 0; i < creature.tent; i++) {
      const a = (i / Math.max(1, creature.tent)) * Math.PI * 2;
      g.line(Math.cos(a) * R, Math.sin(a) * R, Math.cos(a) * (R + 44), Math.sin(a) * (R + 44));
    }
    g.noStroke();
    [[creature.hue1, 55, 1], [creature.hue2, 85, 0.62]].forEach(([hue, bri, scale]) => {
      g.fill(hue, 75, bri, 0.92);
      g.beginShape();
      for (let i = 0; i <= 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        const lobe = Math.sin(a * creature.lobes + creature.seed) * (0.12 + gen[D.FLOW] * 0.18);
        const rr = R * scale * (1 + lobe);
        g.curveVertex(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      g.endShape(g.CLOSE);
    });
    for (let i = 0; i < creature.eyes; i++) {
      const off = (i - (creature.eyes - 1) / 2) * R * 0.42;
      g.fill(0, 0, 12); g.circle(R * 0.30, off, R * 0.30);
      g.fill(0, 0, 100); g.circle(R * 0.34, off - R * 0.05, R * 0.11);
    }
    g.pop();

    // tipografía del certificado
    g.textAlign(g.CENTER, g.CENTER);
    g.fill(45, 30, 95, 0.9);
    g.textSize(30); g.textStyle(g.NORMAL);
    g.text("C E R T I F I C A D O   D E   N A C I M I E N T O", W / 2, H * 0.70);
    g.fill(0, 0, 100);
    g.textSize(96); g.textStyle(g.BOLD);
    g.text(creature.name, W / 2, H * 0.775);
    g.textStyle(g.ITALIC); g.textSize(34);
    g.fill(creature.hue1, 50, 95, 0.95);
    g.text(`nacida de ${DNA.epithet(creature.genome)}`, W / 2, H * 0.845);
    g.textStyle(g.NORMAL); g.textSize(26);
    g.fill(0, 0, 85, 0.8);
    const fecha = new Date(creature.bornAt).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" });
    g.text(`Creador: ${creature.creator}   ·   ${fecha}`, W / 2, H * 0.905);
    g.textSize(22);
    g.fill(0, 0, 70, 0.7);
    g.text("S I M B I O N T E  —  el ecosistema de arte vivo", W / 2, H * 0.955);

    // marco
    g.noFill();
    g.stroke(creature.hue1, 60, 90, 0.5);
    g.strokeWeight(3);
    g.rect(34, 34, W - 68, H - 68, 26);

    p5instance.saveCanvas(g, `simbionte-${creature.name.toLowerCase()}`, "png");
    setTimeout(() => g.remove(), 500);
  }

  return { download };
})();
