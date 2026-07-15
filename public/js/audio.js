/* ============================================================
   SIMBIONTE — audio.js
   1) Ritual: escucha 3 s de la voz del visitante (Web Audio) y
      extrae tono, energía y brillo → genes.
   2) Mundo: sintetiza la voz de cada criatura con Tone.js.
   Privacidad: el audio NUNCA sale del navegador; solo se
   conservan tres números.
   ============================================================ */
"use strict";

const AudioRitual = (() => {
  let toneReady = false;
  let synth = null, birthSynth = null;
  let lastSong = 0;

  /* ---------- Escuchar la voz (3 segundos) ----------
     onLevel(v 0..1) alimenta la visualización en vivo.
     Devuelve { pitch, energy, brightness } normalizados.        */
  async function listen(seconds = 3, onLevel = () => {}) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    src.connect(analyser);

    const time = new Float32Array(analyser.fftSize);
    const freq = new Uint8Array(analyser.frequencyBinCount);
    let sumE = 0, sumZ = 0, sumC = 0, frames = 0;

    const t0 = performance.now();
    await new Promise(resolve => {
      (function tick() {
        analyser.getFloatTimeDomainData(time);
        analyser.getByteFrequencyData(freq);
        // energía (RMS)
        let rms = 0;
        for (let i = 0; i < time.length; i++) rms += time[i] * time[i];
        rms = Math.sqrt(rms / time.length);
        // cruces por cero → proxy del tono
        let z = 0;
        for (let i = 1; i < time.length; i++)
          if ((time[i - 1] < 0) !== (time[i] < 0)) z++;
        // centroide espectral → brillo
        let num = 0, den = 0;
        for (let i = 0; i < freq.length; i++) { num += i * freq[i]; den += freq[i]; }
        const centroid = den > 0 ? num / den / freq.length : 0;

        if (rms > 0.01) { sumE += rms; sumZ += z; sumC += centroid; frames++; }
        onLevel(Math.min(1, rms * 8));
        if (performance.now() - t0 < seconds * 1000) requestAnimationFrame(tick);
        else resolve();
      })();
    });

    stream.getTracks().forEach(t => t.stop());
    ctx.close();

    if (frames === 0) return { pitch: 0.5, energy: 0.4, brightness: 0.5, silent: true };
    const clamp01 = v => Math.max(0, Math.min(1, v));
    return {
      pitch:      clamp01((sumZ / frames) / 300),
      energy:     clamp01((sumE / frames) * 6),
      brightness: clamp01((sumC / frames) * 3),
      silent: false
    };
  }

  /* ---------- Tone.js: el coro del ecosistema ---------- */
  async function wake() {
    if (toneReady || typeof Tone === "undefined") return;
    await Tone.start();
    const reverb = new Tone.Reverb({ decay: 6, wet: 0.5 }).toDestination();
    synth = new Tone.PolySynth(Tone.Synth, {
      volume: -16,
      envelope: { attack: 0.4, decay: 0.3, sustain: 0.2, release: 2.5 }
    }).connect(reverb);
    birthSynth = new Tone.PolySynth(Tone.Synth, {
      volume: -10,
      envelope: { attack: 0.02, decay: 0.5, sustain: 0.3, release: 3 }
    }).connect(reverb);
    toneReady = true;
  }

  const SCALE = ["C3", "D3", "F3", "G3", "A3", "C4", "D4", "F4", "G4", "A4", "C5"];
  function noteFor(g) {
    return SCALE[Math.min(SCALE.length - 1, Math.floor(g[DNA.G.PITCH] * SCALE.length))];
  }

  /* Canto ocasional de una criatura (limitado a 1 cada 700 ms) */
  function sing(genome) {
    if (!toneReady || !window.SIMBIONTE_SOUND) return;
    const now = performance.now();
    if (now - lastSong < 700) return;
    lastSong = now;
    synth.set({ oscillator: { type: genome[DNA.G.TIMBRE] > 0.5 ? "triangle" : "sine" } });
    synth.triggerAttackRelease(noteFor(genome), "8n");
  }

  /* Acorde de nacimiento: la primera palabra de la criatura */
  function birthChord(genome) {
    if (!toneReady || !window.SIMBIONTE_SOUND) return;
    const base = noteFor(genome);
    const idx = SCALE.indexOf(base);
    const chord = [base, SCALE[Math.min(SCALE.length - 1, idx + 2)], SCALE[Math.min(SCALE.length - 1, idx + 4)]];
    birthSynth.triggerAttackRelease(chord, "2n");
  }

  /* Fanfarria de celebración (celebrateMilestone) */
  function celebrate() {
    if (!toneReady || !window.SIMBIONTE_SOUND) return;
    ["C4", "E4", "G4", "C5"].forEach((n, i) => setTimeout(() => birthSynth.triggerAttackRelease(n, "8n"), i * 90));
  }

  /* Pequeño sonido al lanzar un juguete (throwToy) */
  const TOY_NOTES = { bubbles: ["C5", "E5"], shower: ["A4", "C5", "E5"], feather: ["G5"], star: ["E5", "G5", "C6"] };
  function playToy(type) {
    if (!toneReady || !window.SIMBIONTE_SOUND) return;
    const notes = TOY_NOTES[type] || ["C5"];
    notes.forEach((n, i) => setTimeout(() => synth.triggerAttackRelease(n, "16n"), i * 60));
  }

  return { listen, wake, sing, birthChord, celebrate, playToy };
})();
