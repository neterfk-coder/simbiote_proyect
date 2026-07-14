/* ============================================================
   SIMBIONTE — creature.js
   Anatomía procedural: cada criatura se dibuja únicamente a
   partir de sus 20 genes. No hay sprites: todo es matemática.
   ============================================================ */
"use strict";

class Creature {
  constructor(genome, opts = {}) {
    const G = DNA.G;
    this.genome = genome;
    this.id = opts.id || ("c" + Math.random().toString(36).slice(2, 10));
    this.name = opts.name || DNA.nameOf(genome);
    this.creator = opts.creator || I18n.t("anonymousCreator");
    this.parents = opts.parents || null;
    this.bornAt = opts.bornAt || Date.now();
    this.mine = !!opts.mine;

    this.x = opts.x ?? Math.random() * innerWidth;
    this.y = opts.y ?? Math.random() * innerHeight;
    this.vx = 0; this.vy = 0;
    this.seed = Math.random() * 1000;
    this.age = 0;
    this.maxAge = 60 + genome[G.LIFESPAN] * 240;   // 1–5 min de vida
    this.energy = 1;
    this.mateCooldown = 20;
    this.trail = [];
    this.dead = false;
    this.courting = null;

    // rasgos derivados (se calculan una vez)
    this.r = 16 + genome[G.SIZE] * 30;
    this.lobes = 3 + Math.round(genome[G.LOBES] * 6);
    this.eyes = 1 + Math.round(genome[G.EYES] * 2);
    this.tent = Math.round(genome[G.TENTACLES] * 8);
    this.hue1 = genome[G.HUE1] * 360;
    this.hue2 = genome[G.HUE2] * 360;
  }

  get lifeRatio() { return 1 - this.age / this.maxAge; }

  /* ---------- Comportamiento ---------- */
  update(p, world, dt) {
    const G = DNA.G, g = this.genome;
    this.age += dt;
    if (this.age > this.maxAge) { this.dead = true; return; }
    this.mateCooldown = Math.max(0, this.mateCooldown - dt);

    // deriva de ruido Perlin (nado orgánico)
    const t = p.millis() * 0.0001 * (0.5 + g[G.SPEED]);
    let ax = (p.noise(this.seed, t) - 0.5) * 2;
    let ay = (p.noise(this.seed + 99, t) - 0.5) * 2;

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

    const speed = 0.35 + g[G.SPEED] * 1.4;
    this.vx = p.lerp(this.vx, ax * speed, 0.05 + g[G.WOBBLE] * 0.05);
    this.vy = p.lerp(this.vy, ay * speed, 0.05 + g[G.WOBBLE] * 0.05);
    this.x += this.vx; this.y += this.vy;

    // el mundo es un toroide: nada se pierde
    const m = 60;
    if (this.x < -m) this.x = p.width + m;  if (this.x > p.width + m) this.x = -m;
    if (this.y < -m) this.y = p.height + m; if (this.y > p.height + m) this.y = -m;

    // estela
    const maxTrail = 4 + Math.round(g[G.TRAIL] * 26);
    this.trail.push({ x: this.x, y: this.y });
    while (this.trail.length > maxTrail) this.trail.shift();
  }

  /* ---------- Anatomía ---------- */
  draw(p) {
    const G = DNA.G, g = this.genome;
    const t = p.millis() * 0.001;
    const pulse = 1 + Math.sin(t * (1 + g[G.PULSE] * 5) + this.seed) * 0.08;
    const r = this.r * pulse * (0.6 + 0.4 * Math.min(1, this.age / 6)); // crece al nacer
    const alive = this.lifeRatio;

    p.push();
    p.translate(this.x, this.y);

    // estela
    p.noFill();
    for (let i = 1; i < this.trail.length; i++) {
      const a = (i / this.trail.length) * 0.35 * g[G.TRAIL] * alive;
      p.stroke(this.hue1, 80, 95, a);
      p.strokeWeight(2);
      const q = this.trail[i - 1], w = this.trail[i];
      p.line(q.x - this.x, q.y - this.y, w.x - this.x, w.y - this.y);
    }

    // aura bioluminiscente
    const auraR = r * (1.6 + g[G.AURA] * 1.4);
    for (let i = 3; i > 0; i--) {
      p.noStroke();
      p.fill(this.hue1, 70, 90, 0.05 * g[G.GLOW] * i * alive);
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

    // ojos
    p.rotate(Math.atan2(this.vy, this.vx));
    for (let i = 0; i < this.eyes; i++) {
      const off = (i - (this.eyes - 1) / 2) * r * 0.42;
      p.fill(0, 0, 12, 0.95 * alive); p.circle(r * 0.32, off, r * 0.30);
      p.fill(0, 0, 100, 0.95 * alive); p.circle(r * 0.36, off - r * 0.05, r * 0.11);
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
