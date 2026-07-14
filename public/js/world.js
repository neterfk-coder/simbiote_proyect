/* ============================================================
   SIMBIONTE — world.js
   El ecosistema: población, cortejo, reproducción genética,
   muerte, fósiles, partículas y plancton de fondo.
   ============================================================ */
"use strict";

const World = (() => {
  const creatures = [];
  const fossils = [];
  const particles = [];
  const plankton = [];
  let pointer = null;
  let listeners = { birth: [], death: [], courtship: [] };
  let paused = false;

  const MAX_POP = () => (window.SIMBIONTE_CONFIG?.MAX_POPULATION || 22);

  function on(evt, fn) { listeners[evt].push(fn); }
  function emit(evt, data) { listeners[evt].forEach(fn => fn(data)); }

  function add(creature, { announce = true, burst = true } = {}) {
    if (creatures.some(c => c.id === creature.id)) return creature;
    creatures.push(creature);
    while (creatures.length > MAX_POP()) {
      const pool = creatures.filter(c => !c.mine);
      const old = (pool.length ? pool : creatures).reduce((a, b) => (a.age > b.age ? a : b));
      kill(old, { silent: true });
    }
    if (burst) burstAt(creature.x, creature.y, creature.hue1, 26);
    if (announce) emit("birth", creature);
    return creature;
  }

  function kill(c, { silent = false } = {}) {
    const i = creatures.indexOf(c);
    if (i >= 0) creatures.splice(i, 1);
    c.dead = true;
    fossils.push({ creature: c, at: performance.now() });
    while (fossils.length > 40) fossils.shift();
    if (!silent) emit("death", c);
  }

  function nearest(self) {
    let best = null, bd = Infinity;
    for (const c of creatures) {
      if (c === self) continue;
      const d = (c.x - self.x) ** 2 + (c.y - self.y) ** 2;
      if (d < bd) { bd = d; best = c; }
    }
    return best;
  }

  /* ---------- Reproducción ---------- */
  function tryReproduce(p) {
    if (creatures.length >= MAX_POP() || creatures.length < 2) return;
    for (const a of creatures) {
      if (a.mateCooldown > 0 || a.age < 10) continue;
      for (const b of creatures) {
        if (a === b || b.mateCooldown > 0 || b.age < 10) continue;
        const d = p.dist(a.x, a.y, b.x, b.y);
        if (d > 90) continue;
        const gd = DNA.distance(a.genome, b.genome);
        // compatibilidad: ni clones ni especies opuestas
        if (gd > 0.12 && gd < 0.42 && Math.random() < 0.004) {
          const child = new Creature(DNA.offspring(a.genome, b.genome), {
            x: (a.x + b.x) / 2, y: (a.y + b.y) / 2,
            parents: [
              { id: a.id, name: a.name, creator: a.creator },
              { id: b.id, name: b.name, creator: b.creator }
            ],
            creator: "el ecosistema"
          });
          a.mateCooldown = b.mateCooldown = 45;
          heartsAt(child.x, child.y, (a.hue1 + b.hue1) / 2);
          add(child);
          emit("courtship", { a, b, child });
          return;
        }
      }
    }
  }

  /* ---------- Partículas ---------- */
  function burstAt(x, y, hue, n = 20) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 3.5;
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
                       life: 1, hue, size: 2 + Math.random() * 4 });
    }
  }
  function heartsAt(x, y, hue) {
    for (let i = 0; i < 14; i++) {
      particles.push({ x: x + (Math.random() - 0.5) * 40, y: y + (Math.random() - 0.5) * 40,
                       vx: (Math.random() - 0.5), vy: -0.6 - Math.random(),
                       life: 1, hue, size: 3 + Math.random() * 3, soft: true });
    }
  }

  function initPlankton(p) {
    plankton.length = 0;
    const n = Math.min(90, Math.floor(p.width * p.height / 16000));
    for (let i = 0; i < n; i++) {
      plankton.push({ x: Math.random() * p.width, y: Math.random() * p.height,
                      z: 0.3 + Math.random() * 0.7, s: Math.random() * 1000 });
    }
  }

  /* ---------- Bucle principal ---------- */
  function updateAndDraw(p, dt) {
    // plancton (profundidad)
    p.noStroke();
    const t = p.millis() * 0.0002;
    for (const k of plankton) {
      const dx = Math.sin(t * 3 + k.s) * 10 * k.z;
      p.fill(200, 30, 90, 0.10 + 0.10 * k.z);
      p.circle(k.x + dx, k.y + Math.cos(t * 2 + k.s) * 8 * k.z, 1.2 + k.z * 1.6);
    }

    // fósiles
    const now = performance.now();
    for (const f of fossils) {
      const fade = Math.max(0, 1 - (now - f.at) / 120000); // 2 min visibles
      if (fade > 0) f.creature.drawFossil(p, fade);
    }

    if (!paused) {
      for (const c of [...creatures]) {
        c.update(p, api, dt);
        if (c.dead) kill(c);
      }
      tryReproduce(p);
    }
    for (const c of creatures) c.draw(p);

    // partículas
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.x += q.vx; q.y += q.vy; q.life -= q.soft ? 0.008 : 0.016;
      if (q.life <= 0) { particles.splice(i, 1); continue; }
      p.noStroke();
      p.fill(q.hue, 80, 95, q.life * 0.8);
      p.circle(q.x, q.y, q.size * q.life);
    }
  }

  const api = {
    creatures, fossils, add, kill, nearest, on,
    updateAndDraw, initPlankton, burstAt,
    setPointer(pt) { pointer = pt; }, get pointer() { return pointer; },
    setPaused(v) { paused = v; }, get paused() { return paused; }
  };
  return api;
})();
