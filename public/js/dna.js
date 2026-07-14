/* ============================================================
   SIMBIONTE — dna.js
   El corazón conceptual del proyecto: convierte VOZ + GESTO +
   TRAZO en un genoma de 20 genes, y define cruce y mutación.
   Cada gen es un número entre 0 y 1.
   ============================================================ */
"use strict";

const DNA = (() => {

  /* Índices de los 20 genes (para leer el código con claridad) */
  const G = {
    HUE1: 0,        // tono principal
    HUE2: 1,        // tono secundario
    SIZE: 2,        // tamaño del cuerpo
    LOBES: 3,       // nº de lóbulos del cuerpo (3–9)
    SPIKE: 4,       // espinosidad del contorno
    FLOW: 5,        // suavidad / ondulación de la membrana
    GLOW: 6,        // intensidad de bioluminiscencia
    SPEED: 7,       // velocidad de nado
    WOBBLE: 8,      // torpeza / gracia del movimiento
    PULSE: 9,       // ritmo cardiaco visual
    TRAIL: 10,      // longitud de la estela
    EYES: 11,       // nº de ojos (1–3)
    TENTACLES: 12,  // nº de cilios (0–8)
    SOCIAL: 13,     // atracción hacia otras criaturas
    CURIOUS: 14,    // atracción hacia el cursor del visitante
    LIFESPAN: 15,   // esperanza de vida
    PITCH: 16,      // tono de su voz
    TIMBRE: 17,     // timbre (senoidal ↔ metálico)
    RHYTHM: 18,     // cadencia con la que canta
    AURA: 19        // tamaño del halo
  };
  const LENGTH = 20;

  const clamp01 = v => Math.max(0, Math.min(1, v));
  const rnd = () => Math.random();

  /* ---------- Nacimiento: inputs humanos → genoma ----------
     voice  = { pitch, energy, brightness }        (0–1 cada uno)
     gesture= { speed, angularity, extent }        (0–1)
     stroke = { curvature, closure, density, ratio }(0–1)          */
  function fromRitual(voice, gesture, stroke) {
    const g = new Array(LENGTH).fill(0);
    // La VOZ define color, luz y canto
    g[G.HUE1]   = clamp01(voice.pitch * 0.9 + rnd() * 0.1);
    g[G.HUE2]   = clamp01((voice.brightness + rnd() * 0.3) % 1);
    g[G.GLOW]   = clamp01(0.35 + voice.energy * 0.65);
    g[G.PITCH]  = voice.pitch;
    g[G.TIMBRE] = voice.brightness;
    g[G.RHYTHM] = clamp01(voice.energy * 0.7 + 0.15);
    g[G.AURA]   = clamp01(0.3 + voice.energy * 0.6);
    // El GESTO define cómo se mueve y se relaciona
    g[G.SPEED]   = clamp01(0.2 + gesture.speed * 0.8);
    g[G.WOBBLE]  = gesture.angularity;
    g[G.SOCIAL]  = clamp01(0.25 + gesture.extent * 0.7);
    g[G.CURIOUS] = clamp01(0.3 + gesture.speed * 0.5 + rnd() * 0.2);
    g[G.PULSE]   = clamp01(0.25 + gesture.speed * 0.6);
    g[G.TRAIL]   = gesture.extent;
    // El TRAZO define la anatomía
    g[G.SIZE]      = clamp01(0.35 + stroke.ratio * 0.5);
    g[G.LOBES]     = stroke.density;
    g[G.SPIKE]     = clamp01(stroke.angularityLike ?? (1 - stroke.curvature));
    g[G.FLOW]      = stroke.curvature;
    g[G.EYES]      = clamp01(stroke.closure * 0.8 + rnd() * 0.2);
    g[G.TENTACLES] = clamp01(stroke.density * 0.7 + rnd() * 0.3);
    g[G.LIFESPAN]  = clamp01(0.5 + rnd() * 0.5);
    return g;
  }

  function random() {
    return Array.from({ length: LENGTH }, rnd);
  }

  /* ---------- Reproducción ---------- */
  function crossover(a, b) {
    return a.map((gene, i) => (rnd() < 0.5 ? gene : b[i]));
  }

  function mutate(g, rate = 0.12, amount = 0.22) {
    return g.map(v => (rnd() < rate ? clamp01(v + (rnd() * 2 - 1) * amount) : v));
  }

  function offspring(a, b) {
    return mutate(crossover(a, b));
  }

  /* Distancia genética: sirve para decidir la compatibilidad */
  function distance(a, b) {
    let s = 0;
    for (let i = 0; i < LENGTH; i++) s += Math.abs(a[i] - b[i]);
    return s / LENGTH;
  }

  /* ---------- Nombre: el genoma se pronuncia ---------- */
  const CONS = ["v", "th", "k", "m", "z", "sh", "n", "r", "l", "x"];
  const VOW  = ["a", "ae", "i", "o", "u", "ia", "ei", "oa", "y", "au"];
  const TAIL = ["l", "n", "th", "r", "s", "m", "x", "ll", "h", "q"];

  function pick(list, gene) {
    return list[Math.min(list.length - 1, Math.floor(gene * list.length))];
  }

  function nameOf(g) {
    const n = pick(CONS, g[G.HUE1]) + pick(VOW, g[G.PITCH]) +
              pick(CONS, g[G.SPEED]) + pick(VOW, g[G.SIZE]) +
              pick(TAIL, g[G.GLOW]);
    return n.charAt(0).toUpperCase() + n.slice(1);
  }

  /* Epíteto legible del origen (para certificados y crónica) */
  function epithet(g) {
    const voiceKey = g[G.PITCH] > 0.6 ? "epithet.voiceHigh" : g[G.PITCH] < 0.35 ? "epithet.voiceLow" : "epithet.voiceCalm";
    const shapeKey = g[G.SPIKE] > 0.6 ? "epithet.shapeSpiky" : g[G.FLOW] > 0.6 ? "epithet.shapeSpiral" : "epithet.shapeWandering";
    return I18n.t("epithet.join", { voice: I18n.t(voiceKey), shape: I18n.t(shapeKey) });
  }

  return { G, LENGTH, fromRitual, random, crossover, mutate, offspring, distance, nameOf, epithet };
})();
