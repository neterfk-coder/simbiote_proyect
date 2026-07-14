/* ============================================================
   SIMBIONTE — main.js
   El director de orquesta: sketch p5 del mundo, flujo del
   ritual (voz → gesto → trazo → ADN → nacimiento), HUD,
   inspector de criaturas, red y toasts.
   ============================================================ */
"use strict";

window.SIMBIONTE_SOUND = false;

const App = (() => {
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  let p5world = null;
  let myCreature = null;
  const ritual = { voice: null, gesture: null, stroke: null };
  let lastFrame = performance.now();

  /* ══════════ 1. El mundo (sketch p5) ══════════ */
  new p5(p => {
    p5world = p;
    p.setup = () => {
      p.createCanvas(innerWidth, innerHeight).parent("world-canvas");
      p.colorMode(p.HSB, 360, 100, 100, 1);
      World.initPlankton(p);
    };
    p.windowResized = () => { p.resizeCanvas(innerWidth, innerHeight); World.initPlankton(p); };
    p.draw = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;
      drawAbyss(p);
      World.setPointer({ x: p.mouseX, y: p.mouseY });
      World.updateAndDraw(p, dt);
    };
    p.mousePressed = e => {
      // p5 dispara mousePressed para cualquier clic en la página, no solo
      // en el lienzo: hay que ignorar los clics sobre botones/paneles del HUD.
      if (e && e.target && e.target.tagName !== "CANVAS") return;
      if (!$("#screen-intro").classList.contains("is-active") &&
          !$("#screen-ritual").classList.contains("is-active")) {
        inspectAt(p.mouseX, p.mouseY);
      }
    };
  });

  function drawAbyss(p) {
    // gradiente vertical abisal + viñeta, dibujado barato
    const c1 = p.color(252, 45, 8), c2 = p.color(230, 55, 4);
    for (let i = 0; i <= 8; i++) {
      p.noStroke();
      p.fill(p.lerpColor(c1, c2, i / 8));
      p.rect(0, (p.height / 8) * i, p.width, p.height / 8 + 2);
    }
    const t = p.millis() * 0.0001;
    p.fill(190, 60, 20, 0.06 + Math.sin(t * 4) * 0.02);
    p.ellipse(p.width * 0.5, p.height * 1.15, p.width * 1.4, p.height * 0.9);
  }

  /* ══════════ 2. Navegación entre pantallas ══════════ */
  function show(id) {
    $$(".screen").forEach(s => s.classList.toggle("is-active", s.id === id));
  }
  function enterWorld() {
    show(null);
    $("#hud-top").classList.remove("hidden");
    $("#lang-switch-floating").classList.add("hidden");
  }

  /* ══════════ 3. El Ritual ══════════ */
  let stepSessions = [];
  function setStep(n) {
    $$(".ritual-step").forEach(el => el.classList.toggle("is-active", +el.dataset.step === n));
    $$(".step-orb").forEach(o => {
      const s = +o.dataset.step;
      o.classList.toggle("is-current", s === Math.min(n, 3));
      o.classList.toggle("is-done", s < n);
    });
    if (n === 2) startGesture();
    if (n === 3) startStroke();
    if (n === 4) weaveDNA();
  }

  function openRitual() {
    ritual.voice = ritual.gesture = ritual.stroke = null;
    $("#voice-status").textContent = I18n.t("ritual.voice.idle");
    $("#btn-record").classList.remove("is-recording");
    show("screen-ritual");
    setStep(1);
  }
  function closeRitual() {
    stepSessions.forEach(s => s.cancel && s.cancel());
    stepSessions = [];
    enterWorld();
  }

  /* --- Paso 1: voz --- */
  async function recordVoice() {
    const orb = $("#btn-record"), status = $("#voice-status");
    orb.classList.add("is-recording");
    status.textContent = I18n.t("ritual.voice.listening");
    try {
      ritual.voice = await AudioRitual.listen(3, level => {
        orb.style.setProperty("--level", 1 + level * 0.7);
      });
      status.textContent = ritual.voice.silent ? I18n.t("ritual.voice.silent") : I18n.t("ritual.voice.recorded");
    } catch {
      status.textContent = I18n.t("ritual.voice.noMic");
      ritual.voice = { pitch: Math.random(), energy: 0.3 + Math.random() * 0.4, brightness: Math.random() };
    }
    orb.classList.remove("is-recording");
    setTimeout(() => setStep(2), 900);
  }

  /* --- Paso 2: gesto (4 s de movimiento libre) --- */
  function startGesture() {
    const canvas = $("#gesture-canvas");
    const timer = $("#gesture-timer");
    let remain = 4;
    timer.textContent = remain;
    const iv = setInterval(() => { remain--; timer.textContent = Math.max(0, remain); if (remain <= 0) clearInterval(iv); }, 1000);
    const s = Capture.session(canvas, "gesture", {
      seconds: 4,
      onDone: features => {
        clearInterval(iv);
        ritual.gesture = features || { speed: .4, angularity: .4, extent: .4, curvature: .4, closure: .3, density: .4, ratio: .4 };
        setStep(3);
      }
    });
    stepSessions.push(s);
  }

  /* --- Paso 3: trazo (termina al soltar) --- */
  function startStroke() {
    const canvas = $("#stroke-canvas");
    const s = Capture.session(canvas, "stroke", {
      onDone: features => {
        ritual.stroke = features || { curvature: .5, closure: .4, density: .5, ratio: .4 };
        setStep(4);
      }
    });
    stepSessions.push(s);
  }

  /* --- Paso 4: fusión de ADN (la firma visual del proyecto) --- */
  function weaveDNA() {
    const canvas = $("#dna-canvas");
    const ctx = canvas.getContext("2d");
    const genome = DNA.fromRitual(ritual.voice, ritual.gesture, ritual.stroke);
    const W = canvas.width, H = canvas.height;
    const t0 = performance.now();
    const captions = [0, 1, 2, 3].map(i => I18n.t("ritual.dna.caption" + i));

    (function frame() {
      const t = (performance.now() - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      $("#dna-caption").textContent = captions[Math.min(3, Math.floor(t / 0.9))];
      // doble hélice de partículas que converge
      const converge = Math.min(1, t / 3.4);
      for (let i = 0; i < 46; i++) {
        const y = (i / 46) * H;
        const phase = i * 0.32 + t * 2.4;
        const spread = (1 - converge) * 90 + 26;
        [0, Math.PI].forEach((off, strand) => {
          const x = W / 2 + Math.sin(phase + off) * spread;
          const hue = strand === 0 ? genome[DNA.G.HUE1] * 360 : genome[DNA.G.HUE2] * 360;
          const depth = (Math.cos(phase + off) + 1) / 2;
          ctx.beginPath();
          ctx.arc(x, y, 2 + depth * 3, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${hue}, 90%, ${55 + depth * 30}%, ${0.4 + depth * 0.6})`;
          ctx.shadowBlur = 12; ctx.shadowColor = `hsla(${hue}, 90%, 60%, .9)`;
          ctx.fill();
        });
        if (i % 6 === 0) {
          const x1 = W / 2 + Math.sin(phase) * ((1 - converge) * 90 + 26);
          const x2 = W / 2 + Math.sin(phase + Math.PI) * ((1 - converge) * 90 + 26);
          ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y);
          ctx.strokeStyle = "rgba(201,200,221,.18)"; ctx.lineWidth = 1; ctx.stroke();
        }
      }
      if (t < 3.8) requestAnimationFrame(frame);
      else birth(genome);
    })();
  }

  /* --- Paso 5: nacimiento --- */
  function birth(genome) {
    myCreature = new Creature(genome, {
      x: innerWidth / 2, y: innerHeight / 2,
      mine: true,
      creator: window.SIMBIONTE_CONFIG?.DEFAULT_CREATOR || I18n.t("defaultCreatorName")
    });
    $("#born-name").textContent = myCreature.name;
    $("#born-epithet").textContent = I18n.t("ritual.birth.epithetPrefix", { epithet: DNA.epithet(genome) });
    setStep(5);
    AudioRitual.birthChord(genome);
  }

  function release() {
    const name = $("#creator-input").value.trim();
    if (name) myCreature.creator = name;
    World.add(myCreature);
    Net.sendBirth(myCreature);
    Chronicle.record("birth", myCreature);
    enterWorld();
    // tarjeta personal
    $("#my-name").textContent = myCreature.name;
    $("#my-epithet").textContent = I18n.t("mycard.epithetPrefix", { epithet: DNA.epithet(myCreature.genome) });
    $("#my-card").classList.remove("hidden");
    toast(I18n.t("toast.releasedIntoWorld", { name: myCreature.name }));
  }

  /* ══════════ 4. Inspector de criaturas ══════════ */
  const GENE_LABELS = {
    "gene.glow": DNA.G.GLOW, "gene.speed": DNA.G.SPEED, "gene.social": DNA.G.SOCIAL,
    "gene.curious": DNA.G.CURIOUS, "gene.pitch": DNA.G.PITCH, "gene.pulse": DNA.G.PULSE,
    "gene.spike": DNA.G.SPIKE, "gene.lifespan": DNA.G.LIFESPAN
  };
  let lastInspected = null;
  function renderInspect(target) {
    $("#inspect-name").textContent = target.name;
    $("#inspect-origin").textContent = target.parents
      ? I18n.t("inspect.childOf", { a: target.parents[0].name, b: target.parents[1].name })
      : I18n.t("inspect.bornOf", { epithet: DNA.epithet(target.genome), creator: target.creator });
    const bars = $("#inspect-genes");
    bars.innerHTML = "";
    for (const [key, idx] of Object.entries(GENE_LABELS)) {
      const row = document.createElement("div");
      row.className = "gene-row";
      row.innerHTML = `<span>${I18n.t(key)}</span><div class="gene-track"><div class="gene-fill" style="width:${Math.round(target.genome[idx] * 100)}%"></div></div>`;
      bars.appendChild(row);
    }
  }
  function inspectAt(x, y) {
    let target = null, best = 60;
    for (const c of World.creatures) {
      const d = Math.hypot(c.x - x, c.y - y);
      if (d < best + c.r) { best = d; target = c; }
    }
    const panel = $("#panel-inspect");
    if (!target) { panel.classList.remove("is-open"); return; }
    lastInspected = target;
    renderInspect(target);
    panel.classList.add("is-open");
    AudioRitual.sing(target.genome);
  }

  /* ══════════ 5. Red ══════════ */
  Net.connect({
    onRoster(list, chron) {
      list.forEach(c => {
        World.add(new Creature(c.genome, { id: c.id, name: c.name || undefined, creator: c.creator, parents: c.parents, bornAt: c.bornAt }),
                   { announce: false, burst: false });
      });
      // Si el mundo llega vacío, lo pueblan ancestros locales (solo visuales)
      if (list.length === 0) {
        for (let i = 0; i < 5; i++) {
          World.add(new Creature(DNA.random(), { creator: I18n.t("ancestorsCreator") }),
                    { announce: false, burst: false });
        }
      }
      chron.forEach(e => Chronicle.receive(e));
    },
    onBirth(c) {
      const nc = World.add(new Creature(c.genome, { id: c.id, name: c.name, creator: c.creator, parents: c.parents }),
                           { announce: false });
      toast(I18n.t("toast.bornElsewhere", { name: nc.name }), "coral");
      AudioRitual.sing(nc.genome);
    },
    onChronicle(e) { Chronicle.receive(e); }
  });

  World.on("birth", c => { if (!c.mine) return; });
  World.on("courtship", e => Chronicle.record("courtship", e));
  World.on("death", c => { if (Math.random() < 0.5) Chronicle.record("death", c); });

  /* ══════════ 6. Toasts ══════════ */
  function toast(msg, tone = "") {
    const box = $("#toasts");
    const el = document.createElement("div");
    el.className = "toast " + tone;
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 500); }, 4200);
  }

  /* ══════════ 7. Eventos de la interfaz ══════════ */
  $("#btn-start").addEventListener("click", async () => { await AudioRitual.wake().catch(() => {}); openRitual(); });
  $("#btn-observe").addEventListener("click", () => { enterWorld(); toast(I18n.t("toast.observing")); });
  $("#ritual-close").addEventListener("click", closeRitual);
  $("#btn-record").addEventListener("click", recordVoice);
  $("#btn-skip-voice").addEventListener("click", () => {
    ritual.voice = { pitch: .5, energy: .3, brightness: .5, silent: true };
    setStep(2);
  });
  $("#btn-release").addEventListener("click", release);
  $("#btn-new").addEventListener("click", openRitual);
  $("#btn-sound").addEventListener("click", async e => {
    const btn = e.currentTarget;
    await AudioRitual.wake().catch(() => {});
    window.SIMBIONTE_SOUND = !window.SIMBIONTE_SOUND;
    btn.setAttribute("aria-pressed", window.SIMBIONTE_SOUND);
    toast(window.SIMBIONTE_SOUND ? I18n.t("toast.soundOn") : I18n.t("toast.soundOff"));
  });
  $("#btn-chronicle").addEventListener("click", () => $("#panel-chronicle").classList.toggle("is-open"));
  $$(".panel-close").forEach(b => b.addEventListener("click", () => $("#" + b.dataset.close).classList.remove("is-open")));
  $("#btn-cert").addEventListener("click", () => myCreature && Certificate.download(myCreature, p5world));
  $("#btn-find").addEventListener("click", () => {
    if (!myCreature || myCreature.dead) { toast(I18n.t("toast.creatureIsFossil"), "coral"); return; }
    World.burstAt(myCreature.x, myCreature.y, myCreature.hue1, 30);
    toast(I18n.t("toast.creatureShines", { name: myCreature.name }));
  });
  addEventListener("keydown", e => { if (e.key === "Escape") $$(".panel").forEach(p => p.classList.remove("is-open")); });

  // primera línea de la Crónica
  Chronicle.render(I18n.t("chronicle.firstLine"), { broadcast: false });

  /* ══════════ 8. Idioma: refrescar texto dinámico visible ══════════ */
  I18n.onChange(() => {
    if (myCreature && !$("#my-card").classList.contains("hidden")) {
      $("#my-epithet").textContent = I18n.t("mycard.epithetPrefix", { epithet: DNA.epithet(myCreature.genome) });
    }
    if (lastInspected && $("#panel-inspect").classList.contains("is-open")) renderInspect(lastInspected);
  });
})();
