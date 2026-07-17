/* ============================================================
   SIMBIONTE — creature.js
   Anatomía procedural: cada criatura se dibuja únicamente a
   partir de sus 20 genes. No hay sprites: todo es matemática.
   ============================================================ */
"use strict";

const CREATURE_MAX_HITS = 15;

class Creature {
  constructor(genome, opts = {}) {
    const G = DNA.G;
    this.cosmetics = opts.cosmetics || [];
    // artefactos: pequeño empujón permanente al gen correspondiente
    if (this.cosmetics.includes("art_amulet_social")) genome[G.SOCIAL] = Math.min(1, genome[G.SOCIAL] + 0.12);
    if (this.cosmetics.includes("art_relic_glow")) genome[G.GLOW] = Math.min(1, genome[G.GLOW] + 0.15);

    this.genome = genome;
    this.id = opts.id || ("c" + Math.random().toString(36).slice(2, 10));
    this.name = opts.name || DNA.nameOf(genome, 0.35);
    this.creator = opts.creator || I18n.t("anonymousCreator");
    this.parents = opts.parents || null;
    this.bornAt = opts.bornAt || Date.now();
    this.mine = !!opts.mine;
    this.permanent = !!opts.permanent; // fundador: inmortal, nunca es desalojado del mundo

    const wb = (typeof World !== "undefined" && World.bounds) ? World.bounds : { w: innerWidth, h: innerHeight };
    this.x = opts.x ?? (Math.random() - 0.5) * wb.w;
    this.y = opts.y ?? (Math.random() - 0.5) * wb.h;
    this.vx = 0; this.vy = 0;
    this.seed = Math.random() * 1000;
    this.age = 0;
    this.maxAge = this.permanent ? Infinity : 60 + genome[G.LIFESPAN] * 240;   // 1–5 min de vida
    if (!this.permanent && this.cosmetics.includes("art_shell_lifespan")) this.maxAge *= 1.15;
    this.energy = 1;
    this.mateCooldown = 20;
    this.trail = [];
    this.dead = false;
    this.courting = null;
    this.dragging = false;
    this.feedCount = 0;
    this.childCount = 0;
    this.growthBonus = 1;
    this.feedPulse = 0;
    this.hits = 0;
    this.hitFlash = 0;
    this.reaction = null;
    this.portrait = opts.portrait || null;
    this.portraitImg = null;

    // rasgos derivados (se calculan una vez)
    this.baseR = 16 + genome[G.SIZE] * 30;
    this.r = this.baseR;
    this.lobes = 3 + Math.round(genome[G.LOBES] * 6);
    this.eyes = 1 + Math.round(genome[G.EYES] * 2);
    this.tent = Math.round(genome[G.TENTACLES] * 8);
    this.hue1 = genome[G.HUE1] * 360;
    this.hue2 = genome[G.HUE2] * 360;
  }

  get lifeRatio() { return 1 - this.age / this.maxAge; }

  /* Reacción a un juguete lanzado (bubbles/shower/feather/star) */
  react(type) { this.reaction = { type, elapsed: 0 }; }

  /* Retrato personalizado (foto subida por el creador) */
  setPortrait(dataUrl) { this.portrait = dataUrl; this.portraitImg = null; this._portraitLoading = false; }
  loadPortrait(p) {
    if (this._portraitLoading || !this.portrait) return;
    this._portraitLoading = true;
    p.loadImage(this.portrait, img => { this.portraitImg = img; this._portraitLoading = false; }, () => { this._portraitLoading = false; });
  }

  /* Alimentar: crece un poco (con tope) y extiende su vida (feedCreature) */
  feed() {
    const G = DNA.G;
    this.feedCount++;
    this.feedPulse = 1;
    this.maxAge += 22;
    this.genome[G.LIFESPAN] = Math.min(1, this.genome[G.LIFESPAN] + 0.015);
    this.growthBonus = Math.min(1.55, this.growthBonus + 0.06);
    this.r = this.baseR * this.growthBonus;
  }

  /* Golpear: los fundadores son inmortales y no sufren daño; el resto
     muere al golpe número CREATURE_MAX_HITS (hitCreature) */
  hit() {
    if (this.permanent || this.dead) return { damaged: false, lethal: false };
    this.hits++;
    this.hitFlash = 1;
    if (this.hits >= CREATURE_MAX_HITS) { this.dead = true; return { damaged: true, lethal: true }; }
    return { damaged: true, lethal: false };
  }

  /* ---------- Comportamiento ---------- */
  update(p, world, dt) {
    const G = DNA.G, g = this.genome;
    this.age += dt;
    if (this.age > this.maxAge) { this.dead = true; return; }
    this.mateCooldown = Math.max(0, this.mateCooldown - dt);
    if (this.feedPulse > 0) this.feedPulse = Math.max(0, this.feedPulse - dt * 1.1);
    if (this.hitFlash > 0) this.hitFlash = Math.max(0, this.hitFlash - dt * 2.2);
    const REACTION_DURATION = { bubbles: 1.8, shower: 2.2, feather: 1.4, star: 1.6 };
    if (this.reaction) {
      this.reaction.elapsed += dt;
      if (this.reaction.elapsed > REACTION_DURATION[this.reaction.type]) this.reaction = null;
    }

    if (this.dragging) {
      // la criatura está siendo arrastrada por su creador (proposeCourtship)
      this.trail.push({ x: this.x, y: this.y });
      const maxTrail = 4 + Math.round(g[G.TRAIL] * 26);
      while (this.trail.length > maxTrail) this.trail.shift();
      return;
    }

    // deriva de ruido Perlin (nado orgánico)
    const t = p.millis() * 0.0001 * (0.5 + g[G.SPEED]);
    let ax = (p.noise(this.seed, t) - 0.5) * 2;
    let ay = (p.noise(this.seed + 99, t) - 0.5) * 2;
    let called = false;

    // llamada del creador: pull fuerte y prioritario hacia el cursor (callMyCreature)
    if (this.mine && world.pointer && world.pointer.held) {
      const d = p.dist(this.x, this.y, world.pointer.x, world.pointer.y);
      if (d > 6) {
        ax += (world.pointer.x - this.x) / d * 2.4;
        ay += (world.pointer.y - this.y) / d * 2.4;
        called = true;
      }
    }

    if (!called) {
      // sociabilidad: atracción suave al vecino compatible
      if (this.courting && !this.courting.dead) {
        const d = p.dist(this.x, this.y, this.courting.x, this.courting.y);
        ax += (this.courting.x - this.x) / Math.max(d, 1) * 1.6;
        ay += (this.courting.y - this.y) / Math.max(d, 1) * 1.6;
      } else if (g[G.SOCIAL] > 0.5 && world.creatures.length > 1) {
        const near = world.nearest(this);
        if (near) {
          const d = p.dist(this.x, this.y, near.x, near.y);
          if (d > 120) {
            ax += (near.x - this.x) / d * g[G.SOCIAL] * 0.5;
            ay += (near.y - this.y) / d * g[G.SOCIAL] * 0.5;
          }
        }
      }

      // curiosidad: se acerca al cursor del visitante
      if (world.pointer && g[G.CURIOUS] > 0.45) {
        const d = p.dist(this.x, this.y, world.pointer.x, world.pointer.y);
        if (d < 260 && d > 60) {
          ax += (world.pointer.x - this.x) / d * g[G.CURIOUS] * 0.8;
          ay += (world.pointer.y - this.y) / d * g[G.CURIOUS] * 0.8;
        }
      }

      // reacción a un juguete: cada uno se mueve distinto (throwToy)
      if (this.reaction) {
        const rt = this.reaction.elapsed;
        if (this.reaction.type === "feather") { ax += Math.sin(rt * 40) * 3; ay += Math.cos(rt * 37) * 3; }
        else if (this.reaction.type === "star") { const spin = rt * 9; ax += Math.cos(spin) * 1.6; ay += Math.sin(spin) * 1.6; }
        else if (this.reaction.type === "bubbles") { ay -= 0.7; }
      }
    }

    // corral: dentro de una cerca cerrada y propia, la corriente no alcanza a arrastrarla
    const sheltered = this.mine && world.pointInCorral?.(this.x, this.y);

    // evento del ecosistema: corriente que arrastra a todos hacia el centro del mundo
    if (world.activeEvent?.type === "current" && !sheltered) {
      const cx = 0, cy = 0;
      const d = p.dist(this.x, this.y, cx, cy);
      if (d > 20) { ax += (cx - this.x) / d * 0.9; ay += (cy - this.y) / d * 0.9; }
    }

    const speed = (called ? 1.6 : 1) * (0.35 + g[G.SPEED] * 1.4);
    this.vx = p.lerp(this.vx, ax * speed, 0.05 + g[G.WOBBLE] * 0.05);
    this.vy = p.lerp(this.vy, ay * speed, 0.05 + g[G.WOBBLE] * 0.05);

    // corral: si ya estás adentro, la cerca actúa como pared suave para no salir
    if (sheltered) {
      const nx = this.x + this.vx, ny = this.y + this.vy;
      if (world.pointInCorral(nx, ny)) { this.x = nx; this.y = ny; }
      else { this.vx *= -0.35; this.vy *= -0.35; }
    } else {
      this.x += this.vx; this.y += this.vy;
    }

    // el mundo es un toroide: nada se pierde (coordenadas centradas en 0,0)
    const wb = world.bounds || { w: p.width, h: p.height };
    const hw = wb.w / 2 + 60, hh = wb.h / 2 + 60;
    if (this.x < -hw) this.x = hw; if (this.x > hw) this.x = -hw;
    if (this.y < -hh) this.y = hh; if (this.y > hh) this.y = -hh;

    // estela
    const maxTrail = 4 + Math.round(g[G.TRAIL] * 26);
    this.trail.push({ x: this.x, y: this.y });
    while (this.trail.length > maxTrail) this.trail.shift();
  }

  /* Cuenta de vecinos cercanos ahora mismo (updateLeaderboard: "más social") */
  nearbyCount(world, radius = 140) {
    let n = 0;
    for (const c of world.creatures) {
      if (c === this || c.dead) continue;
      if (Math.hypot(c.x - this.x, c.y - this.y) < radius) n++;
    }
    return n;
  }

  /* ---------- Anatomía ---------- */
  draw(p) {
    const G = DNA.G, g = this.genome;
    const t = p.millis() * 0.001;
    const pulse = 1 + Math.sin(t * (1 + g[G.PULSE] * 5) + this.seed) * 0.08;
    const r = this.r * pulse * (0.6 + 0.4 * Math.min(1, this.age / 6)); // crece al nacer
    const alive = this.lifeRatio;

    if (this.portrait && !this.portraitImg) this.loadPortrait(p);

    p.push();
    p.translate(this.x, this.y);

    // pulso al ser alimentada (feedCreature)
    if (this.feedPulse > 0) {
      p.noFill();
      p.stroke(48, 80, 95, this.feedPulse * 0.7);
      p.strokeWeight(2 + this.feedPulse * 2);
      p.circle(0, 0, r * (2.1 + (1 - this.feedPulse) * 1.4));
    }

    // pulso rojo al recibir un golpe (hitCreature)
    if (this.hitFlash > 0) {
      p.noFill();
      p.stroke(0, 85, 95, this.hitFlash * 0.85);
      p.strokeWeight(2 + this.hitFlash * 3);
      p.circle(0, 0, r * (1.9 + (1 - this.hitFlash) * 1.1));
    }
    // grietas: aparecen a partir de la mitad de los golpes, más marcadas cerca de morir
    if (this.hits > CREATURE_MAX_HITS / 2 && !this.permanent) {
      const dmg = (this.hits - CREATURE_MAX_HITS / 2) / (CREATURE_MAX_HITS / 2);
      p.stroke(0, 0, 6, 0.35 * dmg * alive);
      p.strokeWeight(1.3);
      const cracks = Math.min(5, Math.round(dmg * 5));
      for (let i = 0; i < cracks; i++) {
        const a = (i / cracks) * p.TWO_PI + this.seed;
        const x1 = Math.cos(a) * r * 0.15, y1 = Math.sin(a) * r * 0.15;
        const x2 = Math.cos(a + 0.4) * r * 0.75, y2 = Math.sin(a + 0.4) * r * 0.75;
        p.line(x1, y1, x2, y2);
      }
    }

    // reacción a un juguete (throwToy): burbujas / ducha
    if (this.reaction) {
      const rt = this.reaction.elapsed;
      p.noStroke();
      if (this.reaction.type === "bubbles") {
        for (let i = 0; i < 6; i++) {
          const rise = ((rt * 0.6 + i / 6) % 1);
          const bx = Math.sin(i * 2.1 + t * 2) * r * 0.9;
          const by = -rise * r * 2.6;
          p.fill(190, 40, 100, (1 - rise) * 0.6 * alive);
          p.circle(bx, by, 4 + (i % 3) * 2);
        }
      } else if (this.reaction.type === "shower") {
        for (let i = 0; i < 8; i++) {
          const drop = ((rt * 2.2 + i / 8) % 1);
          const dx = (i / 8 - 0.5) * r * 1.6;
          p.fill(195, 60, 100, (1 - drop) * 0.7 * alive);
          p.circle(dx, -r * 1.6 + drop * r * 2.4, 2.4);
        }
        p.noFill(); p.stroke(195, 40, 100, (1 - rt / 2.2) * 0.5 * alive); p.strokeWeight(2);
        p.circle(0, 0, r * (2 + Math.sin(rt * 10) * 0.06));
      }
    }

    // estela
    p.noFill();
    for (let i = 1; i < this.trail.length; i++) {
      const a = (i / this.trail.length) * 0.35 * g[G.TRAIL] * alive;
      p.stroke(this.hue1, 80, 95, a);
      p.strokeWeight(2);
      const q = this.trail[i - 1], w = this.trail[i];
      p.line(q.x - this.x, q.y - this.y, w.x - this.x, w.y - this.y);
    }
    // vestimenta: estela de chispas
    if (this.cosmetics.includes("wear_trail_sparkle")) {
      p.noStroke();
      for (let i = 0; i < this.trail.length; i += 2) {
        const w = this.trail[i];
        const tw = (Math.sin(t * 6 + i) + 1) / 2;
        p.fill(48, 80, 100, tw * 0.7 * alive);
        p.circle(w.x - this.x, w.y - this.y, 2 + tw * 2);
      }
    }

    // aura bioluminiscente (vestimenta: aura de color propio)
    const auraHue = this.cosmetics.includes("wear_aura_gold") ? 45
      : this.cosmetics.includes("wear_aura_violet") ? 275 : this.hue1;
    const auraR = r * (1.6 + g[G.AURA] * 1.4);
    for (let i = 3; i > 0; i--) {
      p.noStroke();
      p.fill(auraHue, 70, 90, 0.05 * g[G.GLOW] * i * alive);
      p.circle(0, 0, auraR * (i / 1.4));
    }

    // cilios
    p.stroke(this.hue2, 70, 92, 0.5 * alive);
    p.strokeWeight(1.6);
    for (let i = 0; i < this.tent; i++) {
      const a = (i / this.tent) * p.TWO_PI + t * 0.5;
      const wig = Math.sin(t * 3 + i) * 6;
      const x1 = Math.cos(a) * r, y1 = Math.sin(a) * r;
      const x2 = Math.cos(a) * (r + 12 + wig), y2 = Math.sin(a) * (r + 12 + wig);
      p.line(x1, y1, x2, y2);
    }

    // cuerpo: blob polar de lóbulos + espinas + flujo
    const rot = t * (0.2 + g[G.SPEED] * 0.3) + this.seed;
    p.noStroke();
    for (let layer = 0; layer < 2; layer++) {
      const lr = layer === 0 ? 1 : 0.62;
      p.fill(layer === 0 ? this.hue1 : this.hue2, 75, layer === 0 ? 55 : 85,
             (layer === 0 ? 0.85 : 0.9) * alive);
      p.beginShape();
      const steps = 44;
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * p.TWO_PI;
        const lobe = Math.sin(a * this.lobes + rot) * (0.12 + g[G.FLOW] * 0.18);
        const spike = g[G.SPIKE] * 0.25 *
          (p.noise(Math.cos(a) + this.seed, Math.sin(a) + this.seed, t * 0.4) - 0.5) * 2;
        const rr = r * lr * (1 + lobe + spike);
        p.curveVertex(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      p.endShape(p.CLOSE);
    }

    // vestimenta: collar de espinas
    if (this.cosmetics.includes("wear_collar")) {
      p.noFill();
      p.stroke(0, 0, 88, 0.75 * alive);
      p.strokeWeight(2);
      p.circle(0, 0, r * 1.42);
      p.strokeWeight(1.4);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * p.TWO_PI;
        const x1 = Math.cos(a) * r * 0.71, y1 = Math.sin(a) * r * 0.71;
        const x2 = Math.cos(a) * r * 0.85, y2 = Math.sin(a) * r * 0.85;
        p.line(x1, y1, x2, y2);
      }
    }
    // vestimenta: corona de cristal
    if (this.cosmetics.includes("wear_crown")) {
      p.noStroke();
      p.fill(48, 55, 100, 0.9 * alive);
      for (let i = -1; i <= 1; i++) {
        const cx = i * r * 0.32, ch = r * (i === 0 ? 0.5 : 0.34);
        p.triangle(cx - r * 0.14, -r * 0.78, cx + r * 0.14, -r * 0.78, cx, -r * 0.78 - ch);
      }
      p.fill(190, 70, 100, 0.9 * alive);
      p.circle(0, -r * 0.78 - r * 0.5, r * 0.14);
    }

    // nombre (visible siempre, no rota con el movimiento)
    if (alive > 0) {
      p.noStroke();
      p.textAlign(p.CENTER, p.BOTTOM);
      p.textSize(Math.max(10, r * 0.34));
      p.fill(0, 0, 100, 0.5 * alive + 0.1);
      p.text(this.name, 0, -r - 10);
    }

    // retrato personalizado: medallón circular junto al cuerpo
    if (this.portraitImg && alive > 0) {
      const pr = r * 0.5, px = r * 0.86, py = r * 0.7;
      p.push();
      p.translate(px, py);
      p.drawingContext.save();
      p.drawingContext.beginPath();
      p.drawingContext.arc(0, 0, pr, 0, Math.PI * 2);
      p.drawingContext.clip();
      p.imageMode(p.CENTER);
      p.tint(0, 0, 100, alive);
      p.image(this.portraitImg, 0, 0, pr * 2, pr * 2);
      p.noTint();
      p.drawingContext.restore();
      p.noFill();
      p.stroke(45, 60, 100, 0.85 * alive);
      p.strokeWeight(2);
      p.circle(0, 0, pr * 2);
      p.pop();
    }

    // ojos
    p.rotate(Math.atan2(this.vy, this.vx));
    for (let i = 0; i < this.eyes; i++) {
      const off = (i - (this.eyes - 1) / 2) * r * 0.42;
      p.fill(0, 0, 12, 0.95 * alive); p.circle(r * 0.32, off, r * 0.30);
      p.fill(0, 0, 100, 0.95 * alive); p.circle(r * 0.36, off - r * 0.05, r * 0.11);
    }
    p.pop();
  }

  /* Solo los ojos brillan (evento del ecosistema: apagón) */
  drawEyesOnly(p) {
    const alive = this.lifeRatio;
    p.push();
    p.translate(this.x, this.y);
    p.noStroke();
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(Math.max(10, this.r * 0.3));
    p.fill(0, 0, 100, 0.22 * alive);
    p.text(this.name, 0, -this.r - 8);
    p.rotate(Math.atan2(this.vy, this.vx));
    for (let i = 0; i < this.eyes; i++) {
      const off = (i - (this.eyes - 1) / 2) * this.r * 0.42;
      p.fill(this.hue1, 35, 100, 0.95 * alive);
      p.circle(this.r * 0.34, off, this.r * 0.18);
    }
    p.pop();
  }

  /* Fósil: la silueta que la criatura deja al morir */
  drawFossil(p, fadeRatio) {
    const r = this.r;
    p.push();
    p.translate(this.x, this.y);
    p.noFill();
    p.stroke(this.hue1, 30, 75, 0.30 * fadeRatio);
    p.strokeWeight(1.4);
    p.beginShape();
    const steps = 36;
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * p.TWO_PI;
      const rr = r * (1 + Math.sin(a * this.lobes + this.seed) * 0.16);
      p.curveVertex(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    p.endShape(p.CLOSE);
    p.fill(this.hue1, 40, 90, 0.18 * fadeRatio);
    p.noStroke();
    p.circle(0, 0, 5);
    p.pop();
  }
}
