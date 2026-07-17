/* ============================================================
   SIMBIONTE — world.js
   El ecosistema: población, cortejo, reproducción genética,
   muerte, fósiles, partículas, plancton y objetos decorativos.
   El mundo es más grande que la pantalla: la cámara (main.js) es
   la que decide qué parte de estas coordenadas se ve.
   ============================================================ */
"use strict";

const World = (() => {
  const creatures = [];
  const fossils = [];
  const particles = [];
  const plankton = [];
  const motes = [];
  const bubbles = [];
  const food = [];
  let pointer = null;
  let listeners = { birth: [], death: [], courtship: [], event: [] };
  let paused = false;
  let corral = null; // corral del visitante: [{x,y}, ...] o null

  /* El mundo lógico es bastante más grande que cualquier pantalla:
     centrado en (0,0), como el resto de las coordenadas de cámara. */
  const WORLD_W = 3200, WORLD_H = 2000;
  const rand = span => (Math.random() - 0.5) * span;

  const MAX_POP = () => (window.SIMBIONTE_CONFIG?.MAX_POPULATION || 22);

  function on(evt, fn) { listeners[evt].push(fn); }
  function emit(evt, data) { listeners[evt].forEach(fn => fn(data)); }

  function add(creature, { announce = true, burst = true } = {}) {
    if (creatures.some(c => c.id === creature.id)) return creature;
    creatures.push(creature);
    while (creatures.length > MAX_POP()) {
      // los fundadores (permanent) y tu propia criatura nunca se descartan
      const pool = creatures.filter(c => !c.mine && !c.permanent);
      if (!pool.length) break;
      const old = pool.reduce((a, b) => (a.age > b.age ? a : b));
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

  /* Criatura viva más cercana a un punto del mundo (throwToy, cortejo por clic) */
  function nearestTo(x, y, maxDist = 90) {
    let best = null, bd = maxDist;
    for (const c of creatures) {
      if (c.dead) continue;
      const d = Math.hypot(c.x - x, c.y - y) - c.r * 0.4;
      if (d < bd) { bd = d; best = c; }
    }
    return best;
  }

  /* ---------- Reproducción ---------- */
  function tryReproduce(p) {
    if (creatures.length >= MAX_POP() || creatures.length < 2) return;
    const boosted = activeEvent?.type === "goldrain";
    for (const a of creatures) {
      if (a.mateCooldown > 0 || a.age < 10) continue;
      for (const b of creatures) {
        if (a === b || b.mateCooldown > 0 || b.age < 10) continue;
        const d = p.dist(a.x, a.y, b.x, b.y);
        if (d > 90) continue;
        const gd = DNA.distance(a.genome, b.genome);
        // compatibilidad: ni clones ni especies opuestas
        if (gd > 0.12 && gd < 0.42 && Math.random() < (boosted ? 0.02 : 0.004)) {
          const child = new Creature(DNA.offspring(a.genome, b.genome), {
            x: (a.x + b.x) / 2, y: (a.y + b.y) / 2,
            parents: [
              { id: a.id, name: a.name, creator: a.creator },
              { id: b.id, name: b.name, creator: b.creator }
            ],
            creator: I18n.t("ecosystemCreator")
          });
          a.mateCooldown = b.mateCooldown = 45;
          a.childCount = (a.childCount || 0) + 1;
          b.childCount = (b.childCount || 0) + 1;
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

  /* ---------- Comida: partículas de luz para alimentar tu criatura ---------- */
  const FOOD_INTERVAL = 5.5, MAX_FOOD = 8;
  let foodTimer = 0;

  function spawnFood() {
    if (food.length >= MAX_FOOD) return;
    food.push({
      id: "f" + Math.random().toString(36).slice(2, 8),
      x: rand(WORLD_W - 200), y: rand(WORLD_H - 200),
      r: 8, hue: 46 + Math.random() * 20, held: false, born: performance.now()
    });
  }
  function foodAt(x, y) {
    let best = null, bd = 30;
    for (const f of food) {
      const d = Math.hypot(f.x - x, f.y - y);
      if (d < bd) { bd = d; best = f; }
    }
    return best;
  }
  function dragFood(f, x, y) { f.x = x; f.y = y; f.held = true; }
  function releaseFood(f, x, y) {
    f.held = false;
    const idx = food.indexOf(f);
    const mine = creatures.find(c => c.mine && !c.dead);
    if (mine) {
      const d = Math.hypot(mine.x - x, mine.y - y);
      if (d < mine.r + 54) {
        if (idx >= 0) food.splice(idx, 1);
        mine.feed();
        burstAt(mine.x, mine.y, f.hue, 16);
        return mine;
      }
    }
    return null;
  }
  function updateFood(p, dt) {
    foodTimer += dt;
    if (foodTimer > FOOD_INTERVAL) { foodTimer = 0; spawnFood(); }
    for (let i = food.length - 1; i >= 0; i--) {
      const f = food[i];
      if (!f.held) {
        f.y -= 7 * dt;
        f.x += Math.sin(performance.now() * 0.0012 + f.born) * 0.25;
        if (f.y < -WORLD_H / 2 - 30) { food.splice(i, 1); continue; }
      }
      p.noStroke();
      for (let k = 3; k > 0; k--) { p.fill(f.hue, 70, 95, 0.10 * k); p.circle(f.x, f.y, f.r * 2 * (k / 1.2 + 0.8)); }
      p.fill(f.hue, 35, 100, 0.92); p.circle(f.x, f.y, f.r);
    }
  }

  /* ---------- Eventos del ecosistema (automáticos, cada ~90 s) ---------- */
  const EVENT_TYPES = ["current", "goldrain", "blackout"];
  const EVENT_DURATIONS = { current: 6, goldrain: 8, blackout: 2 };
  const EVENT_INTERVAL = 90;
  let eventTimer = 0;
  let activeEvent = null;
  const goldParticles = [];

  function updateEvents(p, dt, view) {
    if (activeEvent) {
      activeEvent.elapsed += dt;
      if (activeEvent.type === "goldrain" && Math.random() < 0.6) {
        goldParticles.push({ x: view.x0 + Math.random() * (view.x1 - view.x0), y: view.y0 - 10, vy: 2 + Math.random() * 2, life: 1 });
      }
      if (activeEvent.elapsed > EVENT_DURATIONS[activeEvent.type]) activeEvent = null;
    } else {
      eventTimer += dt;
      if (eventTimer > EVENT_INTERVAL) {
        eventTimer = 0;
        const type = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
        activeEvent = { type, elapsed: 0 };
        emit("event", type);
      }
    }
    for (let i = goldParticles.length - 1; i >= 0; i--) {
      const g = goldParticles[i];
      g.y += g.vy; g.life -= 0.006;
      if (g.life <= 0 || g.y > view.y1 + 10) { goldParticles.splice(i, 1); continue; }
      p.noStroke(); p.fill(46, 70, 96, g.life * 0.8); p.circle(g.x, g.y, 3);
    }
  }

  function initPlankton() {
    plankton.length = 0;
    const n = Math.min(220, Math.floor((WORLD_W * WORLD_H) / 16000));
    for (let i = 0; i < n; i++) {
      plankton.push({ x: rand(WORLD_W), y: rand(WORLD_H),
                      z: 0.3 + Math.random() * 0.7, s: Math.random() * 1000 });
    }
  }

  /* ---------- Motas: orbes bioluminiscentes decorativos (más grandes que el plancton) ---------- */
  function initMotes() {
    motes.length = 0;
    const n = Math.min(70, Math.floor((WORLD_W * WORLD_H) / 95000));
    for (let i = 0; i < n; i++) {
      motes.push({ x: rand(WORLD_W), y: rand(WORLD_H),
                   r: 6 + Math.random() * 15, hue: Math.random() * 360,
                   s: Math.random() * 1000, speed: 0.15 + Math.random() * 0.3 });
    }
  }
  function updateMotes(p, t) {
    p.noStroke();
    for (const m of motes) {
      const bob = Math.sin(t * m.speed + m.s) * 20;
      const drift = Math.cos(t * m.speed * 0.6 + m.s) * 16;
      const glow = 0.55 + Math.sin(t * 0.8 + m.s) * 0.45;
      const x = m.x + drift, y = m.y + bob;
      for (let k = 2; k > 0; k--) {
        p.fill(m.hue, 55, 92, 0.045 * glow * k);
        p.circle(x, y, m.r * (2 + k));
      }
      p.fill(m.hue, 35, 100, 0.3 + glow * 0.25);
      p.circle(x, y, m.r * 0.45);
    }
  }

  /* ---------- Burbujas ascendentes (decorativas) ---------- */
  function spawnBubble(fromBottom) {
    bubbles.push({
      x: rand(WORLD_W),
      y: fromBottom ? WORLD_H / 2 + 30 : rand(WORLD_H),
      r: 2 + Math.random() * 5, wob: Math.random() * 1000
    });
  }
  function initBubbles() {
    bubbles.length = 0;
    const n = Math.min(50, Math.floor((WORLD_W * WORLD_H) / 130000));
    for (let i = 0; i < n; i++) spawnBubble(false);
  }
  function updateBubbles(p, dt, t) {
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      b.y -= (9 + b.r * 3) * dt;
      b.x += Math.sin(t * 4 + b.wob) * 0.3;
      if (b.y < -WORLD_H / 2 - 30) { bubbles.splice(i, 1); spawnBubble(true); continue; }
      p.noFill();
      p.stroke(190, 20, 100, 0.32);
      p.strokeWeight(1);
      p.circle(b.x, b.y, b.r * 2);
      p.noStroke();
      p.fill(190, 15, 100, 0.12);
      p.circle(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.7);
    }
  }

  /* ---------- Corral: postes de madera que el visitante planta
     alrededor de su propia criatura para protegerla y contenerla.
     corral = { points: [{x,y}...], closed: bool } | null            */
  function setCorral(points, closed) { corral = { points, closed: !!closed }; }
  function clearCorral() { corral = null; }
  function pointInCorral(x, y) {
    if (!corral || !corral.closed || corral.points.length < 3) return false;
    const pts = corral.points;
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const a = pts[i], b = pts[j];
      const hit = (a.y > y) !== (b.y > y) &&
        x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x;
      if (hit) inside = !inside;
    }
    return inside;
  }
  function drawCorral(p) {
    if (!corral || corral.points.length < 1) return;
    const pts = corral.points;
    p.push();
    // cerca: bastones de madera unidos por dos travesaños
    const segCount = corral.closed ? pts.length : pts.length - 1;
    for (let i = 0; i < segCount; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      const perp = ang + Math.PI / 2;
      for (const off of [-4, 4]) {
        p.stroke(32, 45, 42, 0.85);
        p.strokeWeight(3);
        p.line(a.x + Math.cos(perp) * off, a.y + Math.sin(perp) * off,
               b.x + Math.cos(perp) * off, b.y + Math.sin(perp) * off);
      }
    }
    for (const post of pts) {
      p.noStroke();
      p.fill(28, 50, 30, 0.9);
      p.circle(post.x, post.y, 10);
      p.fill(32, 40, 48, 0.6);
      p.circle(post.x, post.y - 2, 5);
    }
    p.pop();
  }

  /* ---------- Bucle principal ----------
     view = { x0, y0, x1, y1 }: el rectángulo del mundo que la
     cámara está mostrando ahora mismo (lo calcula main.js). */
  function updateAndDraw(p, dt, view) {
    view = view || { x0: 0, y0: 0, x1: p.width, y1: p.height };

    // plancton (profundidad)
    p.noStroke();
    const t = p.millis() * 0.0002;
    for (const k of plankton) {
      const dx = Math.sin(t * 3 + k.s) * 10 * k.z;
      p.fill(200, 30, 90, 0.10 + 0.10 * k.z);
      p.circle(k.x + dx, k.y + Math.cos(t * 2 + k.s) * 8 * k.z, 1.2 + k.z * 1.6);
    }
    updateMotes(p, p.millis() * 0.001);
    updateBubbles(p, dt, p.millis() * 0.001);

    // fósiles
    const now = performance.now();
    for (const f of fossils) {
      const fade = Math.max(0, 1 - (now - f.at) / 120000); // 2 min visibles
      if (fade > 0) f.creature.drawFossil(p, fade);
    }

    updateEvents(p, dt, view);
    drawCorral(p);

    if (!paused) {
      for (const c of [...creatures]) {
        c.update(p, api, dt);
        if (c.dead) kill(c);
      }
      tryReproduce(p);
    }

    if (activeEvent?.type === "blackout") {
      p.noStroke(); p.fill(230, 40, 2, 0.97);
      p.rect(view.x0, view.y0, view.x1 - view.x0, view.y1 - view.y0);
      for (const c of creatures) c.drawEyesOnly(p);
    } else {
      for (const c of creatures) c.draw(p);
    }

    updateFood(p, dt);

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
    creatures, fossils, food, add, kill, nearest, nearestTo, on,
    updateAndDraw, burstAt, heartsAt,
    initPlankton: () => { initPlankton(); initMotes(); initBubbles(); }, // se conserva el nombre por compatibilidad
    foodAt, dragFood, releaseFood,
    announceCourtship: e => emit("courtship", e),
    setPointer(pt) { pointer = pt; }, get pointer() { return pointer; },
    setPaused(v) { paused = v; }, get paused() { return paused; },
    get activeEvent() { return activeEvent; },
    get bounds() { return { w: WORLD_W, h: WORLD_H }; },
    setCorral, clearCorral, pointInCorral,
    get corral() { return corral; }
  };
  return api;
})();
