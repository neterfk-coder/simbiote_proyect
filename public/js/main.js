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
  let draggingFood = null;
  let draggingCreature = false;
  let draggingToy = null;
  const milestones = new Set();
  const PORTRAIT_KEY = "simbionte_portrait"; // retrato local, se aplica a cada criatura nueva (como los cosméticos)

  /* ══════════ 0. Cámara: zoom y desplazamiento libres ══════════ */
  const CAMERA_MIN_ZOOM = 0.5, CAMERA_MAX_ZOOM = 2.4;
  const camera = { x: 0, y: 0, zoom: 1 };
  function screenToWorld(sx, sy) {
    return { x: (sx - innerWidth / 2) / camera.zoom + camera.x, y: (sy - innerHeight / 2) / camera.zoom + camera.y };
  }
  function clampCamera() { camera.zoom = Math.min(CAMERA_MAX_ZOOM, Math.max(CAMERA_MIN_ZOOM, camera.zoom)); }
  function isOnWorldScreen() {
    return !$("#screen-intro").classList.contains("is-active") &&
           !$("#screen-ritual").classList.contains("is-active");
  }
  let panFrom = null;   // { sx, sy, camX, camY } — para distinguir un tap de un arrastre
  let isPanning = false;

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
      p.push();
      p.translate(innerWidth / 2, innerHeight / 2);
      p.scale(camera.zoom);
      p.translate(-camera.x, -camera.y);
      const w = screenToWorld(p.mouseX, p.mouseY);
      World.setPointer({ x: w.x, y: w.y, held: p.mouseIsPressed && !draggingFood && !draggingCreature && !draggingToy });
      World.updateAndDraw(p, dt);
      p.pop();
      if (draggingToy) drawToyCursor(p, draggingToy);
      checkSurvivalMilestone();
    };
    p.mousePressed = e => {
      // p5 dispara mousePressed para cualquier clic en la página, no solo
      // en el lienzo: hay que ignorar los clics sobre botones/paneles del HUD.
      if (e && e.target && e.target.tagName !== "CANVAS") return;
      if (!isOnWorldScreen()) return;
      const w = screenToWorld(p.mouseX, p.mouseY);

      const f = World.foodAt(w.x, w.y);
      if (f) { draggingFood = f; World.dragFood(f, w.x, w.y); return; }

      if (myCreature && !myCreature.dead && Math.hypot(myCreature.x - w.x, myCreature.y - w.y) < myCreature.r + 18) {
        draggingCreature = true;
        myCreature.dragging = true;
        return;
      }
      // ni comida ni mi criatura: puede ser un toque (inspeccionar) o el inicio de un arrastre de cámara
      panFrom = { sx: p.mouseX, sy: p.mouseY, camX: camera.x, camY: camera.y };
      isPanning = false;
    };
    p.mouseDragged = () => {
      if (draggingFood) { const w = screenToWorld(p.mouseX, p.mouseY); World.dragFood(draggingFood, w.x, w.y); return; }
      if (draggingCreature && myCreature) {
        const w = screenToWorld(p.mouseX, p.mouseY);
        myCreature.x = w.x; myCreature.y = w.y;
        return;
      }
      if (panFrom) {
        const dx = p.mouseX - panFrom.sx, dy = p.mouseY - panFrom.sy;
        if (!isPanning && Math.hypot(dx, dy) > 6) isPanning = true;
        if (isPanning) { camera.x = panFrom.camX - dx / camera.zoom; camera.y = panFrom.camY - dy / camera.zoom; }
      }
    };
    p.mouseReleased = () => {
      if (draggingFood) {
        const w = screenToWorld(p.mouseX, p.mouseY);
        const fed = World.releaseFood(draggingFood, w.x, w.y);
        if (fed) {
          toast(I18n.t("toast.fed", { name: fed.name }));
          if (fed.feedCount >= 5) checkMilestone("fed5", fed);
        }
        draggingFood = null;
        return;
      }
      if (draggingCreature && myCreature) {
        myCreature.dragging = false;
        draggingCreature = false;
        const w = screenToWorld(p.mouseX, p.mouseY);
        const t = Courtship.endDrag(myCreature, w.x, w.y);
        if (t) openCourtshipProposal(myCreature, t);
        return;
      }
      if (panFrom) {
        if (!isPanning) { const w = screenToWorld(panFrom.sx, panFrom.sy); inspectAt(w.x, w.y); }
        panFrom = null; isPanning = false;
      }
    };
    p.mouseWheel = e => {
      if (!isOnWorldScreen()) return;
      const before = screenToWorld(p.mouseX, p.mouseY);
      camera.zoom *= e.delta > 0 ? 0.9 : 1.1;
      clampCamera();
      const after = screenToWorld(p.mouseX, p.mouseY);
      camera.x += before.x - after.x;
      camera.y += before.y - after.y;
      return false;
    };
    p.doubleClicked = e => {
      if (e && e.target && e.target.tagName !== "CANVAS") return;
      if (!isOnWorldScreen()) return;
      camera.x = 0; camera.y = 0; camera.zoom = 1;
    };
  });

  function drawToyCursor(p, type) {
    const icons = { bubbles: "🫧", shower: "🚿", feather: "🪶", star: "✨" };
    p.push();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(28);
    p.text(icons[type] || "•", p.mouseX, p.mouseY);
    p.pop();
  }

  /* ══════════ 1b. Juguetes: lanzarlos a cualquier criatura (throwToy) ══════════ */
  function throwToyAt(type, x, y) {
    const target = World.nearestTo(x, y, 90);
    if (!target) { toast(I18n.t("toast.toy.miss"), "coral"); return; }
    target.react(type);
    AudioRitual.playToy(type);
    if (type === "bubbles") World.burstAt(x, y, 190, 22);
    else if (type === "shower") World.burstAt(x, y, 200, 26);
    else if (type === "feather") World.burstAt(x, y, 48, 14);
    else if (type === "star") World.heartsAt(x, y, target.hue1);
    toast(I18n.t("toast.toy." + type, { name: target.name }));
  }

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
  let hasEnteredWorld = false;
  function enterWorld() {
    show(null);
    $("#hud-top").classList.remove("hidden");
    $("#floating-topright").classList.add("hidden");
    $("#toy-tray").classList.remove("hidden");
    if (!hasEnteredWorld) { hasEnteredWorld = true; toast(I18n.t("hint.camera")); }
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
      creator: window.SIMBIONTE_CONFIG?.DEFAULT_CREATOR || I18n.t("defaultCreatorName"),
      cosmetics: Wallet.equippedItems(),
      portrait: localStorage.getItem(PORTRAIT_KEY)
    });
    $("#born-name").value = myCreature.name;
    $("#born-epithet").textContent = I18n.t("ritual.birth.epithetPrefix", { epithet: DNA.epithet(genome) });
    setStep(5);
    AudioRitual.birthChord(genome);
  }

  function release() {
    const chosenName = $("#born-name").value.trim();
    if (chosenName) myCreature.name = chosenName;
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
    checkMilestone("firstBirth", myCreature);
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

  /* ══════════ 4b. Cortejo propuesto (proposeCourtship) ══════════ */
  function openCourtshipProposal(mine, target) {
    const { level } = Courtship.preview(mine, target);
    $("#courtship-desc").textContent = I18n.t("courtship.desc", { name: target.name });
    const fill = $("#courtship-meter-fill");
    fill.style.width = { clone: "22%", high: "88%", low: "30%" }[level];
    fill.dataset.level = level;
    $("#courtship-level").textContent = I18n.t("courtship.level." + level);
    $("#panel-courtship").dataset.targetId = target.id;
    $("#panel-courtship").classList.add("is-open");
  }
  $("#btn-courtship-confirm").addEventListener("click", () => {
    const panel = $("#panel-courtship");
    panel.classList.remove("is-open");
    if (!myCreature) return;
    const targetId = panel.dataset.targetId;
    const target = World.creatures.find(c => c.id === targetId);
    if (!target) return;
    if (myCreature.mateCooldown > 0 || target.mateCooldown > 0) { toast(I18n.t("toast.courtshipCooldown"), "coral"); return; }
    const result = Courtship.attempt(myCreature, target);
    checkMilestone("firstCourtship", myCreature);
    if (result.success) {
      toast(I18n.t("toast.courtshipSuccess", { a: myCreature.name, b: target.name, child: result.child.name }));
    } else {
      toast(I18n.t("toast.courtshipFail", { a: myCreature.name, b: target.name }), "coral");
    }
  });

  /* ══════════ 4c. Hitos, misiones y celebración (celebrateMilestone) ══════════ */
  function celebrate(key, vars) {
    const el = $("#celebration");
    $("#celebration-text").textContent = I18n.t(key, vars);
    el.classList.remove("hidden");
    requestAnimationFrame(() => el.classList.add("show"));
    if (myCreature) {
      World.burstAt(myCreature.x, myCreature.y, myCreature.hue1, 90);
      for (let i = 0; i < 5; i++) World.burstAt(Math.random() * innerWidth, Math.random() * innerHeight, myCreature.hue1, 18);
    }
    AudioRitual.celebrate();
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.classList.add("hidden"), 600);
    }, 2200);
  }
  async function checkMilestone(key, creature) {
    if (milestones.has(key)) return;
    milestones.add(key);
    celebrate("celebrate." + key, { name: creature.name });
    const result = await Wallet.claimMission(key);
    if (result) toast(I18n.t("toast.missionDone", { name: I18n.t("mission." + key), amount: result.reward }), "gold");
  }
  function checkSurvivalMilestone() {
    if (myCreature && !myCreature.dead && myCreature.age > 60) checkMilestone("survive", myCreature);
  }

  /* ══════════ 5. Red ══════════ */
  Net.connect({
    onRoster(list, chron) {
      list.forEach(c => {
        World.add(new Creature(c.genome, { id: c.id, name: c.name || undefined, creator: c.creator, parents: c.parents, bornAt: c.bornAt, cosmetics: c.cosmetics }),
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
      const nc = World.add(new Creature(c.genome, { id: c.id, name: c.name, creator: c.creator, parents: c.parents, cosmetics: c.cosmetics }),
                           { announce: false });
      toast(I18n.t("toast.bornElsewhere", { name: nc.name }), "coral");
      AudioRitual.sing(nc.genome);
    },
    onChronicle(e) { Chronicle.receive(e); }
  });

  World.on("birth", c => { if (!c.mine) return; });
  World.on("courtship", e => {
    Chronicle.record("courtship", e);
    if (e.a === myCreature || e.b === myCreature) checkMilestone("firstChild", myCreature);
  });
  World.on("death", c => { if (Math.random() < 0.5) Chronicle.record("death", c); });
  World.on("event", type => Chronicle.render(I18n.t("event." + type), { broadcast: false }));

  /* ══════════ 5b. Diamantes, tienda y cuenta ══════════ */
  function renderWallet(state) {
    $("#diamond-count").textContent = state.diamonds;
    $("#account-diamonds").textContent = state.diamonds;
    $("#account-diamonds-guest").textContent = state.diamonds;
  }
  Wallet.onChange(renderWallet);
  renderWallet({ diamonds: Wallet.diamonds }); // Wallet ya pudo haber cargado antes de que nos suscribiéramos

  Shop.init({
    onUseItem(itemId) {
      if (!myCreature || myCreature.dead) { toast(I18n.t("shop.needCreature"), "coral"); return; }
      if (itemId === "food_spark") myCreature.feed();
      if (itemId === "food_feast") { myCreature.feed(); myCreature.feed(); myCreature.feed(); }
      if (itemId === "gift_hearts") World.heartsAt(myCreature.x, myCreature.y, myCreature.hue1);
      if (itemId === "gift_confetti") World.burstAt(myCreature.x, myCreature.y, Math.random() * 360, 40);
      if (myCreature.feedCount >= 5) checkMilestone("fed5", myCreature);
    },
    onEquipmentChange() {
      if (myCreature) myCreature.cosmetics = Wallet.equippedItems();
    },
    onToastMsg: toast
  });
  $("#btn-shop").addEventListener("click", () => $("#panel-shop").classList.toggle("is-open"));

  /* --- Cuenta: pantalla completa de login --- */
  let authMode = "signin";
  let accountHeroP5 = null;

  function ensureAccountHeroCanvas() {
    if (accountHeroP5) return;
    const container = $("#account-hero-canvas");
    accountHeroP5 = new p5(p => {
      let critters = [];
      const fakeWorld = { creatures: critters, pointer: null, activeEvent: null, nearest: () => null };
      p.setup = () => {
        const rect = container.getBoundingClientRect();
        p.createCanvas(Math.max(200, rect.width), Math.max(200, rect.height)).parent(container);
        p.colorMode(p.HSB, 360, 100, 100, 1);
        critters = Array.from({ length: 3 }, () => new Creature(DNA.random(), {
          x: Math.random() * p.width, y: Math.random() * p.height, mine: false
        }));
        fakeWorld.creatures = critters;
      };
      p.draw = () => {
        p.clear();
        for (const c of critters) { c.update(p, fakeWorld, 0.016); c.draw(p); }
      };
    });
  }
  function updateAccountStats() {
    $("#account-stat-alive").textContent = World.creatures.filter(c => !c.dead).length;
    $("#account-stat-online").textContent = $("#presence").textContent.match(/\d+/)?.[0] || "1";
  }
  function renderAccountPanel() {
    $$("#screen-account .account-state").forEach(el => el.classList.add("hidden"));
    if (!Auth.available) {
      $("#account-unavailable").classList.remove("hidden");
    } else if (Auth.user && !Auth.isAnonymous) {
      $("#account-in").classList.remove("hidden");
      $("#account-welcome").textContent = I18n.t("account.loggedInAs", { name: Auth.displayName });
    } else {
      $("#account-guest").classList.remove("hidden");
      $("#account-guest-note").textContent = I18n.t(Auth.user ? "account.anonNote" : "account.guestNote");
    }
  }
  function setAuthMode(mode) {
    authMode = mode;
    $$(".account-tab").forEach(b => b.classList.toggle("is-active", b.dataset.mode === mode));
    $("#account-name-field").classList.toggle("hidden", mode !== "signup");
    $("#account-submit").textContent = I18n.t(mode === "signup" ? "account.signUp" : "account.signIn");
    $("#account-error").classList.add("hidden");
  }
  function openAccountScreen() {
    renderAccountPanel();
    updateAccountStats();
    $("#screen-account").classList.add("is-active");
    ensureAccountHeroCanvas();
    accountHeroP5?.loop();
  }
  function closeAccountScreen() {
    $("#screen-account").classList.remove("is-active");
    accountHeroP5?.noLoop();
  }

  $("#btn-account").addEventListener("click", openAccountScreen);
  $("#btn-account-floating").addEventListener("click", openAccountScreen);
  $("#account-back").addEventListener("click", closeAccountScreen);
  $("#account-guest-continue").addEventListener("click", closeAccountScreen);
  $("#account-unavailable-continue").addEventListener("click", closeAccountScreen);
  $$(".account-tab").forEach(b => b.addEventListener("click", () => setAuthMode(b.dataset.mode)));
  $("#account-form").addEventListener("submit", async e => {
    e.preventDefault();
    const email = $("#account-email").value.trim();
    const password = $("#account-password").value;
    const errEl = $("#account-error");
    errEl.classList.add("hidden");
    try {
      if (authMode === "signup") await Auth.signUp(email, password, $("#account-name").value.trim());
      else await Auth.signIn(email, password);
      renderAccountPanel();
    } catch {
      errEl.textContent = I18n.t("account.error.generic");
      errEl.classList.remove("hidden");
    }
  });
  $("#account-signout").addEventListener("click", async () => { await Auth.signOut(); renderAccountPanel(); });
  Auth.onChange(() => { renderAccountPanel(); if (myCreature) myCreature.cosmetics = Wallet.equippedItems(); });
  setAuthMode("signin");

  /* ══════════ 5c. Ranking en vivo ══════════ */
  Leaderboard.init(() => myCreature?.id);
  $("#btn-leaderboard").addEventListener("click", () => Leaderboard.open());
  $("#lb-close").addEventListener("click", () => Leaderboard.close());
  $$(".lb-tab").forEach(b => b.addEventListener("click", () => Leaderboard.setMetric(b.dataset.metric)));

  /* ══════════ 5d. Bandeja de juguetes (throwToy) ══════════
     El arrastre empieza en un botón del DOM y termina sobre el
     lienzo p5: en vez de depender de los callbacks internos de
     p5 (poco fiables cuando el gesto cruza esa frontera), lo
     manejamos con nuestros propios listeners en window. */
  $$(".toy-btn").forEach(btn => {
    btn.addEventListener("pointerdown", e => {
      e.preventDefault();
      draggingToy = btn.dataset.toy;
      const onUp = ev => {
        window.removeEventListener("pointerup", onUp);
        if (!draggingToy) return;
        const w = screenToWorld(ev.clientX, ev.clientY);
        throwToyAt(draggingToy, w.x, w.y);
        draggingToy = null;
      };
      window.addEventListener("pointerup", onUp);
    });
  });

  /* ══════════ 5e. Foto personalizada (retrato) ══════════ */
  $("#btn-photo").addEventListener("click", () => {
    if (!myCreature || myCreature.dead) { toast(I18n.t("shop.needCreature"), "coral"); return; }
    $("#photo-input").click();
  });
  $("#photo-input").addEventListener("change", async e => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file || !myCreature) return;
    try {
      const dataUrl = await cropToCircleSquare(file, 160);
      myCreature.setPortrait(dataUrl);
      localStorage.setItem(PORTRAIT_KEY, dataUrl);
    } catch {
      toast(I18n.t("portrait.error"), "coral");
    }
  });
  function cropToCircleSquare(file, size) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext("2d");
        const side = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

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
    camera.x = myCreature.x; camera.y = myCreature.y;
    World.burstAt(myCreature.x, myCreature.y, myCreature.hue1, 30);
    toast(I18n.t("toast.creatureShines", { name: myCreature.name }));
  });
  addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    $$(".panel").forEach(p => p.classList.remove("is-open"));
    if (Leaderboard.isOpen) Leaderboard.close();
    if ($("#screen-account").classList.contains("is-active")) closeAccountScreen();
  });

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
