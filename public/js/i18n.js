/* ============================================================
   SIMBIONTE — i18n.js
   Sistema de idiomas: español / English. Traduce el texto
   estático marcado con data-i18n* y expone I18n.t() para el
   texto dinámico que generan los demás módulos.
   ============================================================ */
"use strict";

const I18n = (() => {
  const STORAGE_KEY = "simbionte_lang";

  const STRINGS = {
    es: {
      "meta.title": "SIMBIONTE — el ecosistema de arte vivo",

      "intro.eyebrow": "Un experimento de arte vivo",
      "intro.tagline": "Este mundo está habitado por criaturas nacidas de personas reales.<br>Ninguna fue diseñada. Todas fueron <em>donadas</em>.",
      "intro.btnStart": "Dar vida a una criatura",
      "intro.btnObserve": "Solo observar el mundo",
      "intro.note": "Necesitarás tu voz, un gesto y un trazo. Nada sale de tu navegador.",

      "ritual.closeAria": "Cancelar el ritual",

      "ritual.voice.title": "Dona tu voz",
      "ritual.voice.hint": "Habla, tararea o susurra durante tres segundos.<br>Tu tono se volverá su color; tu energía, su luz.",
      "ritual.voice.recordAria": "Comenzar a grabar la voz",
      "ritual.voice.idle": "Toca el orbe y habla",
      "ritual.voice.listening": "Escuchando… habla ahora",
      "ritual.voice.silent": "No te escuché, pero el silencio también es un origen.",
      "ritual.voice.recorded": "Tu voz quedó registrada.",
      "ritual.voice.noMic": "Sin micrófono: usaré un eco del azar.",
      "ritual.voice.skip": "Continuar en silencio",

      "ritual.gesture.title": "Dona un gesto",
      "ritual.gesture.hint": "Mueve el puntero (o tu dedo) libremente dentro del marco.<br>Tu forma de moverte será su forma de nadar.",

      "ritual.stroke.title": "Dona un trazo",
      "ritual.stroke.hint": "Dibuja una sola línea, la que quieras.<br>Al soltar, tu trazo se convertirá en su anatomía.",

      "ritual.dna.title": "Tejiendo el ADN…",
      "ritual.dna.idle": "voz · gesto · trazo",
      "ritual.dna.caption0": "tu voz…",
      "ritual.dna.caption1": "tu gesto…",
      "ritual.dna.caption2": "tu trazo…",
      "ritual.dna.caption3": "un ser nuevo",

      "ritual.birth.eyebrow": "Ha nacido",
      "ritual.birth.signLabel": "Fírmala con tu nombre",
      "ritual.birth.signPlaceholder": "viajero",
      "ritual.birth.release": "Liberarla al mundo",
      "ritual.birth.epithetPrefix": "nacida de {epithet}",

      "hud.connecting": "Buscando el mundo…",
      "hud.online": "Mundo compartido",
      "hud.offline": "Modo santuario",
      "hud.offlineLocal": "mundo local",
      "hud.presence": "{n} presencias",
      "hud.soundAria": "Activar sonido",
      "hud.soundTitle": "Sonido del ecosistema",
      "hud.chronicleAria": "Abrir la Crónica",
      "hud.chronicleTitle": "La Crónica del mundo",
      "hud.newCreature": "+ Nueva criatura",

      "mycard.eyebrow": "Tu criatura",
      "mycard.epithetPrefix": "de {epithet}",
      "mycard.find": "Encontrarla",
      "mycard.cert": "Certificado ↓",

      "chronicle.title": "La Crónica",
      "chronicle.sub": "La memoria del ecosistema, escrita mientras ocurre.",
      "chronicle.closeAria": "Cerrar la Crónica",
      "chronicle.firstLine": "Al principio, el mundo estaba en silencio, esperando la primera voz.",

      "inspect.closeAria": "Cerrar ficha",
      "inspect.childOf": "hija de {a} y {b}",
      "inspect.bornOf": "nacida de {epithet} · creador: {creator}",

      "gene.glow": "Luz", "gene.speed": "Velocidad", "gene.social": "Sociabilidad",
      "gene.curious": "Curiosidad", "gene.pitch": "Canto", "gene.pulse": "Pulso",
      "gene.spike": "Espinas", "gene.lifespan": "Longevidad",

      "toast.observing": "Observas en silencio. Toca una criatura para conocerla.",
      "toast.releasedIntoWorld": "{name} ahora vive en el mundo.",
      "toast.bornElsewhere": "{name} acaba de nacer en otro lugar del mundo.",
      "toast.soundOn": "El coro del ecosistema despierta.",
      "toast.soundOff": "El mundo vuelve al silencio.",
      "toast.creatureIsFossil": "Tu criatura ya es un fósil. Su historia sigue en la Crónica.",
      "toast.creatureShines": "{name} brilla para ti.",

      "epithet.voiceHigh": "una voz aguda", "epithet.voiceLow": "una voz grave", "epithet.voiceCalm": "una voz serena",
      "epithet.shapeSpiky": "un trazo afilado", "epithet.shapeSpiral": "un trazo en espiral", "epithet.shapeWandering": "un trazo errante",
      "epithet.join": "{voice} y {shape}",

      "myth.open0": "En la hora quieta,", "myth.open1": "Bajo la corriente antigua,", "myth.open2": "Cuando el abismo respiró,",
      "myth.open3": "En el pliegue del tiempo,", "myth.open4": "Mientras el mundo cantaba,", "myth.open5": "Al borde de la luz,",
      "myth.birth0": "{name} abrió los ojos, nacida de {epithet}.",
      "myth.birth1": "una chispa llamada {name} despertó, hecha de {epithet}.",
      "myth.birth2": "el vacío pronunció un nombre nuevo: {name}.",
      "myth.love0": "{a} y {b} danzaron hasta volverse tres: así llegó {child}.",
      "myth.love1": "de la unión de {a} con {b} brotó {child}, heredera de dos cantos.",
      "myth.love2": "{child} nació llevando la luz de {a} y la sombra de {b}.",
      "myth.death0": "{name} se apagó despacio, y su silueta quedó grabada en el lecho del mundo.",
      "myth.death1": "el canto de {name} cesó; su fósil ahora guía a los recién nacidos.",
      "myth.death2": "{name} regresó a la corriente. Nada se pierde en SIMBIONTE.",

      "certificate.heading": "C E R T I F I C A D O   D E   N A C I M I E N T O",
      "certificate.bornPrefix": "nacida de {epithet}",
      "certificate.creator": "Creador: {creator}   ·   {date}",
      "certificate.footer": "S I M B I O N T E  —  el ecosistema de arte vivo",

      "defaultCreatorName": "viajero",
      "ancestorsCreator": "los ancestros",
      "ecosystemCreator": "el ecosistema",
      "anonymousCreator": "anónimo",

      "dateLocale": "es"
    },
    en: {
      "meta.title": "SIMBIONTE — the living art ecosystem",

      "intro.eyebrow": "A living-art experiment",
      "intro.tagline": "This world is inhabited by creatures born from real people.<br>None were designed. All were <em>donated</em>.",
      "intro.btnStart": "Give life to a creature",
      "intro.btnObserve": "Just observe the world",
      "intro.note": "You'll need your voice, a gesture and a stroke. Nothing leaves your browser.",

      "ritual.closeAria": "Cancel the ritual",

      "ritual.voice.title": "Donate your voice",
      "ritual.voice.hint": "Speak, hum or whisper for three seconds.<br>Your tone becomes its color; your energy, its light.",
      "ritual.voice.recordAria": "Start recording your voice",
      "ritual.voice.idle": "Touch the orb and speak",
      "ritual.voice.listening": "Listening… speak now",
      "ritual.voice.silent": "I didn't hear you, but silence is an origin too.",
      "ritual.voice.recorded": "Your voice has been recorded.",
      "ritual.voice.noMic": "No microphone: I'll use an echo of chance.",
      "ritual.voice.skip": "Continue in silence",

      "ritual.gesture.title": "Donate a gesture",
      "ritual.gesture.hint": "Move the pointer (or your finger) freely inside the frame.<br>The way you move becomes the way it swims.",

      "ritual.stroke.title": "Donate a stroke",
      "ritual.stroke.hint": "Draw a single line, whatever you like.<br>When you release, your stroke becomes its anatomy.",

      "ritual.dna.title": "Weaving the DNA…",
      "ritual.dna.idle": "voice · gesture · stroke",
      "ritual.dna.caption0": "your voice…",
      "ritual.dna.caption1": "your gesture…",
      "ritual.dna.caption2": "your stroke…",
      "ritual.dna.caption3": "a new being",

      "ritual.birth.eyebrow": "Has been born",
      "ritual.birth.signLabel": "Sign it with your name",
      "ritual.birth.signPlaceholder": "traveler",
      "ritual.birth.release": "Release it into the world",
      "ritual.birth.epithetPrefix": "born from {epithet}",

      "hud.connecting": "Searching for the world…",
      "hud.online": "Shared world",
      "hud.offline": "Sanctuary mode",
      "hud.offlineLocal": "local world",
      "hud.presence": "{n} present",
      "hud.soundAria": "Enable sound",
      "hud.soundTitle": "Sound of the ecosystem",
      "hud.chronicleAria": "Open the Chronicle",
      "hud.chronicleTitle": "The Chronicle of the world",
      "hud.newCreature": "+ New creature",

      "mycard.eyebrow": "Your creature",
      "mycard.epithetPrefix": "of {epithet}",
      "mycard.find": "Find it",
      "mycard.cert": "Certificate ↓",

      "chronicle.title": "The Chronicle",
      "chronicle.sub": "The ecosystem's memory, written as it happens.",
      "chronicle.closeAria": "Close the Chronicle",
      "chronicle.firstLine": "At the beginning, the world was silent, waiting for the first voice.",

      "inspect.closeAria": "Close profile",
      "inspect.childOf": "child of {a} and {b}",
      "inspect.bornOf": "born of {epithet} · creator: {creator}",

      "gene.glow": "Glow", "gene.speed": "Speed", "gene.social": "Sociability",
      "gene.curious": "Curiosity", "gene.pitch": "Song", "gene.pulse": "Pulse",
      "gene.spike": "Spikes", "gene.lifespan": "Lifespan",

      "toast.observing": "You observe in silence. Touch a creature to meet it.",
      "toast.releasedIntoWorld": "{name} now lives in the world.",
      "toast.bornElsewhere": "{name} was just born elsewhere in the world.",
      "toast.soundOn": "The ecosystem's choir awakens.",
      "toast.soundOff": "The world returns to silence.",
      "toast.creatureIsFossil": "Your creature is already a fossil. Its story lives on in the Chronicle.",
      "toast.creatureShines": "{name} shines for you.",

      "epithet.voiceHigh": "a high voice", "epithet.voiceLow": "a low voice", "epithet.voiceCalm": "a calm voice",
      "epithet.shapeSpiky": "a jagged stroke", "epithet.shapeSpiral": "a spiral stroke", "epithet.shapeWandering": "a wandering stroke",
      "epithet.join": "{voice} and {shape}",

      "myth.open0": "In the quiet hour,", "myth.open1": "Beneath the ancient current,", "myth.open2": "When the abyss breathed,",
      "myth.open3": "In the fold of time,", "myth.open4": "While the world sang,", "myth.open5": "At the edge of the light,",
      "myth.birth0": "{name} opened its eyes, born of {epithet}.",
      "myth.birth1": "a spark named {name} awoke, made of {epithet}.",
      "myth.birth2": "the void spoke a new name: {name}.",
      "myth.love0": "{a} and {b} danced until they became three: so came {child}.",
      "myth.love1": "from the union of {a} and {b} bloomed {child}, heir to two songs.",
      "myth.love2": "{child} was born carrying the light of {a} and the shadow of {b}.",
      "myth.death0": "{name} faded slowly, its silhouette etched into the bed of the world.",
      "myth.death1": "the song of {name} ceased; its fossil now guides the newly born.",
      "myth.death2": "{name} returned to the current. Nothing is lost in SIMBIONTE.",

      "certificate.heading": "B I R T H   C E R T I F I C A T E",
      "certificate.bornPrefix": "born of {epithet}",
      "certificate.creator": "Creator: {creator}   ·   {date}",
      "certificate.footer": "S I M B I O N T E  —  the living art ecosystem",

      "defaultCreatorName": "traveler",
      "ancestorsCreator": "the ancestors",
      "ecosystemCreator": "the ecosystem",
      "anonymousCreator": "anonymous",

      "dateLocale": "en"
    }
  };

  function detectDefault() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "es" || saved === "en") return saved;
    return navigator.language && navigator.language.toLowerCase().startsWith("en") ? "en" : "es";
  }

  let lang = detectDefault();
  const listeners = [];

  function t(key, vars) {
    let str = (STRINGS[lang] && STRINGS[lang][key]) ?? STRINGS.es[key] ?? key;
    if (vars) for (const k in vars) str = str.split(`{${k}}`).join(vars[k]);
    return str;
  }

  function applyDOM() {
    document.documentElement.lang = lang;
    document.title = t("meta.title");
    document.querySelectorAll("[data-i18n]").forEach(el => { el.innerHTML = t(el.dataset.i18n); });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
    document.querySelectorAll("[data-i18n-aria]").forEach(el => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
    document.querySelectorAll("[data-i18n-title]").forEach(el => { el.title = t(el.dataset.i18nTitle); });
    document.querySelectorAll("[data-lang]").forEach(btn => {
      btn.setAttribute("aria-pressed", btn.dataset.lang === lang ? "true" : "false");
    });
  }

  function setLang(l) {
    if (l !== "es" && l !== "en" || l === lang) return;
    lang = l;
    localStorage.setItem(STORAGE_KEY, l);
    applyDOM();
    listeners.forEach(fn => fn(lang));
  }

  function onChange(fn) { listeners.push(fn); }

  function bindSwitchers() {
    document.querySelectorAll(".lang-switch [data-lang]").forEach(btn => {
      btn.addEventListener("click", () => setLang(btn.dataset.lang));
    });
  }

  applyDOM();
  bindSwitchers();

  return { t, setLang, onChange, applyDOM, get lang() { return lang; } };
})();
