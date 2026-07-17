/* ============================================================
   SIMBIONTE — wheel.js
   La Ruleta del abismo: un giro gratis por día. El premio lo
   decide wallet.js (y en modo cuenta, el servidor: el navegador
   solo anima el resultado que ya está pagado — no se puede
   "apuntar" al premio grande editando el cliente).
   ============================================================ */
"use strict";

const Wheel = (() => {
  const $ = s => document.querySelector(s);

  /* Debe coincidir en orden con WHEEL_PRIZES del servidor/wallet */
  const SEGMENTS = [
    { amount: 5,   label: "5💎" },
    { amount: 8,   label: "8💎" },
    { amount: 12,  label: "12💎" },
    { amount: 18,  label: "18💎" },
    { amount: 25,  label: "25💎" },
    { amount: 40,  label: "40💎" },
    { amount: 60,  label: "🎁" },
    { amount: 100, label: "👑" }
  ];
  const SEG = 360 / SEGMENTS.length;

  let spinning = false, rotation = 0;
  let hooks = { onPrize: () => {} };

  function buildDisc() {
    const disc = $("#wheel-disc");
    const colors = SEGMENTS.map((s, i) =>
      s.amount >= 100 ? "rgba(236,209,147,.35)"
      : s.amount >= 60 ? "rgba(236,209,147,.18)"
      : i % 2 ? "rgba(62,224,193,.14)" : "rgba(255,255,255,.05)");
    const stops = colors.map((c, i) => `${c} ${i * SEG}deg ${(i + 1) * SEG}deg`).join(", ");
    disc.style.background = `conic-gradient(${stops})`;
    disc.innerHTML = "";
    SEGMENTS.forEach((s, i) => {
      const label = document.createElement("span");
      label.className = "wheel-label";
      label.textContent = s.label;
      label.style.transform = `rotate(${i * SEG + SEG / 2}deg) translateY(-78px) rotate(${-(i * SEG + SEG / 2)}deg)`;
      disc.appendChild(label);
    });
  }

  async function spin() {
    if (spinning) return;
    const btn = $("#btn-wheel-spin");
    const resultEl = $("#wheel-result");
    spinning = true;
    btn.disabled = true;
    resultEl.classList.add("hidden");

    const result = await Wallet.spinWheel();
    if (!result || result.alreadySpun) {
      spinning = false;
      resultEl.textContent = I18n.t("wheel.comeback");
      resultEl.className = "wheel-result wheel-wait";
      resultEl.classList.remove("hidden");
      return;
    }

    const idx = Math.max(0, SEGMENTS.findIndex(s => s.amount === result.amount));
    const jitter = (Math.random() - 0.5) * (SEG * 0.5);
    rotation += 5 * 360 + ((360 - (idx * SEG + SEG / 2) - (rotation % 360) + 720) % 360) + jitter;
    const disc = $("#wheel-disc");
    disc.style.transition = "transform 4.2s cubic-bezier(.15,.68,.1,1)";
    disc.style.transform = `rotate(${rotation}deg)`;

    setTimeout(() => {
      spinning = false;
      resultEl.textContent = I18n.t(result.amount >= 60 ? "wheel.wonChest" : "wheel.won", { amount: result.amount });
      resultEl.className = "wheel-result wheel-win";
      resultEl.classList.remove("hidden");
      hooks.onPrize(result.amount);
    }, 4400);
  }

  function open() {
    $("#panel-wheel").classList.add("is-open");
    $("#btn-wheel-spin").disabled = false;
    $("#wheel-result").classList.add("hidden");
    if (Wallet.wheelSpunToday()) {
      $("#btn-wheel-spin").disabled = true;
      const resultEl = $("#wheel-result");
      resultEl.textContent = I18n.t("wheel.comeback");
      resultEl.className = "wheel-result wheel-wait";
      resultEl.classList.remove("hidden");
    }
  }
  function close() { $("#panel-wheel").classList.remove("is-open"); }

  function init(options) {
    hooks = { ...hooks, ...options };
    buildDisc();
    $("#btn-wheel-spin").addEventListener("click", spin);
    $("#wheel-close").addEventListener("click", close);
    I18n.onChange(() => buildDisc());
  }

  return { init, open, close };
})();
