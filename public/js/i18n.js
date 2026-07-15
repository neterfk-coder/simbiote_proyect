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
      "hud.newCreatureLabel": "Nueva criatura",

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

      "dateLocale": "es",

      "toast.fed": "{name} creció un poco más.",
      "toast.courtshipSuccess": "{a} y {b} tuvieron a {child}.",
      "toast.courtshipFail": "El cortejo entre {a} y {b} no prosperó esta vez.",
      "toast.courtshipCooldown": "Necesita descansar antes de volver a cortejar.",

      "courtship.title": "Proponer cortejo",
      "courtship.closeAria": "Cancelar propuesta",
      "courtship.desc": "¿Proponer un cruce con {name}?",
      "courtship.level.clone": "Genes casi idénticos — riesgo alto",
      "courtship.level.high": "Buena compatibilidad genética",
      "courtship.level.low": "Genes muy distintos — riesgo alto",
      "courtship.confirm": "Proponer",
      "courtship.cancel": "Cancelar",

      "event.current": "Una corriente profunda arrastra a todo el mundo hacia el centro.",
      "event.goldrain": "Una lluvia dorada enciende los cortejos del ecosistema.",
      "event.blackout": "La oscuridad cae; solo los ojos siguen brillando.",

      "celebrate.survive": "{name} ha sobrevivido su primer minuto de vida.",
      "celebrate.firstChild": "{name} tuvo a su primera cría.",
      "celebrate.firstBirth": "¡{name} ha nacido!",
      "celebrate.fed5": "{name} ha comido bien.",
      "celebrate.firstCourtship": "{name} propuso su primer cortejo.",

      "ritual.birth.nameAria": "Nombre de tu criatura",

      "hud.shopAria": "Abrir la tienda", "hud.shopTitle": "Tienda",
      "hud.leaderboardAria": "Abrir el ranking", "hud.leaderboardTitle": "Ranking en vivo",
      "hud.accountAria": "Tu cuenta", "hud.accountTitle": "Tu cuenta",
      "hud.diamondsAria": "Tus diamantes",

      "toast.missionDone": "Misión cumplida: {name} (+{amount} 💎)",
      "mission.firstBirth": "Diste vida a tu primera criatura",
      "mission.survive": "Sobrevivió su primer minuto",
      "mission.fed5": "La alimentaste 5 veces",
      "mission.firstChild": "Tuvo su primera cría",
      "mission.firstCourtship": "Propusiste tu primer cortejo",

      "shop.title": "Tienda",
      "shop.closeAria": "Cerrar tienda",
      "shop.category.food": "Comida",
      "shop.category.gifts": "Regalos",
      "shop.category.artifacts": "Artefactos",
      "shop.category.wear": "Vestimentas",
      "shop.buy": "Comprar",
      "shop.owned": "Adquirido",
      "shop.equip": "Equipar",
      "shop.equipped": "Equipado",
      "shop.unequip": "Quitar",
      "shop.notEnough": "No tienes suficientes diamantes.",
      "shop.needCreature": "Necesitas una criatura viva para usar esto.",
      "shop.purchased": "Compraste {name}.",
      "shop.itemFood1.name": "Chispa de luz", "shop.itemFood1.desc": "Alimenta a tu criatura al instante.",
      "shop.itemFood2.name": "Banquete", "shop.itemFood2.desc": "Alimenta a tu criatura tres veces.",
      "shop.itemGift1.name": "Ramo de corazones", "shop.itemGift1.desc": "Una ráfaga de cariño para tu criatura.",
      "shop.itemGift2.name": "Confeti bioluminiscente", "shop.itemGift2.desc": "Una lluvia de color para celebrar.",
      "shop.itemArt1.name": "Amuleto de Comunión", "shop.itemArt1.desc": "Vuelve a tu criatura más sociable, para siempre.",
      "shop.itemArt2.name": "Reliquia Luminosa", "shop.itemArt2.desc": "Aumenta su brillo bioluminiscente para siempre.",
      "shop.itemArt3.name": "Caparazón Ancestral", "shop.itemArt3.desc": "Extiende su esperanza de vida un 15%.",
      "shop.itemWear1.name": "Corona de Cristal", "shop.itemWear1.desc": "Una corona que brilla sobre su cabeza.",
      "shop.itemWear2.name": "Collar de Espinas", "shop.itemWear2.desc": "Un collar que rodea su cuerpo.",
      "shop.itemWear3.name": "Aura Dorada", "shop.itemWear3.desc": "Tiñe su halo de dorado.",
      "shop.itemWear4.name": "Aura Violeta", "shop.itemWear4.desc": "Tiñe su halo de violeta.",
      "shop.itemWear5.name": "Estela de Chispas", "shop.itemWear5.desc": "Su estela deja chispas al nadar.",

      "account.title": "Tu cuenta",
      "account.closeAria": "Cerrar cuenta",
      "account.guestNote": "Modo invitado: tus diamantes se guardan en este navegador.",
      "account.anonNote": "Ya estás jugando como invitado registrado: tus diamantes y tu criatura se están guardando. Poné un correo y contraseña para poder entrar desde otro dispositivo.",
      "account.email": "Correo",
      "account.password": "Contraseña",
      "account.displayName": "Nombre para mostrar",
      "account.signIn": "Iniciar sesión",
      "account.signUp": "Crear cuenta",
      "account.signOut": "Cerrar sesión",
      "account.toggleToSignUp": "¿No tienes cuenta? Crear una",
      "account.toggleToSignIn": "¿Ya tienes cuenta? Inicia sesión",
      "account.loggedInAs": "Sesión iniciada como {name}",
      "account.error.generic": "No se pudo completar. Intenta de nuevo.",
      "account.unavailable": "Las cuentas no están configuradas en este servidor todavía.",
      "account.signInShort": "Iniciar sesión",
      "account.namePlaceholder": "Tu nombre",
      "account.emailPlaceholder": "tucorreo@ejemplo.com",
      "account.passwordPlaceholder": "Mínimo 6 caracteres",
      "account.orContinue": "o continuá sin cuenta",
      "account.continueGuest": "Seguir como invitado",
      "account.backToWorld": "Volver al mundo",
      "account.loggedInSub": "Tu progreso está a salvo, en cualquier dispositivo.",
      "account.hero.kicker": "Ecosistema de arte vivo",
      "account.hero.title": "Tu criatura te espera en <em>cualquier dispositivo</em>.",
      "account.hero.sub": "Creá una cuenta y tus diamantes, tu inventario y tu criatura viajan con vos. También podés jugar sin registrarte.",
      "account.hero.statAlive": "criaturas vivas",
      "account.hero.statOnline": "presencias",
      "account.hero.statCost": "costo",
      "account.hero.feat1": "Mundo compartido en tiempo real",
      "account.hero.feat2": "Tu progreso, guardado siempre",
      "account.hero.feat3": "Sin anuncios, gratis",

      "leaderboard.screenTitle": "Ranking del ecosistema",
      "leaderboard.closeAria": "Cerrar ranking",
      "leaderboard.by": "Ordenado por",
      "leaderboard.metric.longevity": "Longevidad",
      "leaderboard.metric.offspring": "Descendencia",
      "leaderboard.metric.social": "Sociabilidad",
      "leaderboard.rank": "#",
      "leaderboard.creature": "Criatura",
      "leaderboard.creator": "Creador",
      "leaderboard.value": "Valor",
      "leaderboard.empty": "Aún no hay criaturas en el mundo.",

      "hint.camera": "Arrastra para moverte por el mundo · rueda del mouse para hacer zoom · doble clic para centrar",

      "toys.title": "Juguetes",
      "toy.bubbles": "Burbujas", "toy.shower": "Ducha", "toy.feather": "Pluma", "toy.star": "Chispa",
      "toast.toy.bubbles": "¡A {name} le encantaron las burbujas!",
      "toast.toy.shower": "{name} quedó reluciente después de su ducha.",
      "toast.toy.feather": "¡Le hiciste cosquillas a {name}!",
      "toast.toy.star": "{name} gira feliz de emoción.",
      "toast.toy.miss": "No había ninguna criatura cerca para recibirlo.",

      "mycard.photo": "Foto",
      "portrait.uploadAria": "Subir una foto para tu criatura",
      "portrait.error": "No se pudo cargar esa imagen. Probá con otra."
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
      "hud.newCreatureLabel": "New creature",

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

      "dateLocale": "en",

      "toast.fed": "{name} grew a little more.",
      "toast.courtshipSuccess": "{a} and {b} had {child}.",
      "toast.courtshipFail": "The courtship between {a} and {b} didn't work out this time.",
      "toast.courtshipCooldown": "It needs to rest before courting again.",

      "courtship.title": "Propose courtship",
      "courtship.closeAria": "Cancel proposal",
      "courtship.desc": "Propose a match with {name}?",
      "courtship.level.clone": "Almost identical genes — high risk",
      "courtship.level.high": "Good genetic compatibility",
      "courtship.level.low": "Very different genes — high risk",
      "courtship.confirm": "Propose",
      "courtship.cancel": "Cancel",

      "event.current": "A deep current pulls the whole world toward the center.",
      "event.goldrain": "A golden rain kindles the ecosystem's courtships.",
      "event.blackout": "Darkness falls; only the eyes keep glowing.",

      "celebrate.survive": "{name} has survived its first minute of life.",
      "celebrate.firstChild": "{name} had its first offspring.",
      "celebrate.firstBirth": "{name} was born!",
      "celebrate.fed5": "{name} has eaten well.",
      "celebrate.firstCourtship": "{name} proposed its first courtship.",

      "ritual.birth.nameAria": "Your creature's name",

      "hud.shopAria": "Open the shop", "hud.shopTitle": "Shop",
      "hud.leaderboardAria": "Open the leaderboard", "hud.leaderboardTitle": "Live leaderboard",
      "hud.accountAria": "Your account", "hud.accountTitle": "Your account",
      "hud.diamondsAria": "Your diamonds",

      "toast.missionDone": "Mission complete: {name} (+{amount} 💎)",
      "mission.firstBirth": "You gave life to your first creature",
      "mission.survive": "It survived its first minute",
      "mission.fed5": "You fed it 5 times",
      "mission.firstChild": "It had its first offspring",
      "mission.firstCourtship": "You proposed your first courtship",

      "shop.title": "Shop",
      "shop.closeAria": "Close shop",
      "shop.category.food": "Food",
      "shop.category.gifts": "Gifts",
      "shop.category.artifacts": "Artifacts",
      "shop.category.wear": "Wearables",
      "shop.buy": "Buy",
      "shop.owned": "Owned",
      "shop.equip": "Equip",
      "shop.equipped": "Equipped",
      "shop.unequip": "Unequip",
      "shop.notEnough": "You don't have enough diamonds.",
      "shop.needCreature": "You need a living creature to use this.",
      "shop.purchased": "You bought {name}.",
      "shop.itemFood1.name": "Spark of Light", "shop.itemFood1.desc": "Feeds your creature instantly.",
      "shop.itemFood2.name": "Feast", "shop.itemFood2.desc": "Feeds your creature three times.",
      "shop.itemGift1.name": "Bouquet of Hearts", "shop.itemGift1.desc": "A burst of affection for your creature.",
      "shop.itemGift2.name": "Bioluminescent Confetti", "shop.itemGift2.desc": "A rain of color to celebrate.",
      "shop.itemArt1.name": "Amulet of Communion", "shop.itemArt1.desc": "Makes your creature more sociable, forever.",
      "shop.itemArt2.name": "Luminous Relic", "shop.itemArt2.desc": "Boosts its bioluminescent glow, forever.",
      "shop.itemArt3.name": "Ancestral Shell", "shop.itemArt3.desc": "Extends its lifespan by 15%.",
      "shop.itemWear1.name": "Crystal Crown", "shop.itemWear1.desc": "A crown that glows above its head.",
      "shop.itemWear2.name": "Thorned Collar", "shop.itemWear2.desc": "A collar that wraps around its body.",
      "shop.itemWear3.name": "Golden Aura", "shop.itemWear3.desc": "Tints its halo gold.",
      "shop.itemWear4.name": "Violet Aura", "shop.itemWear4.desc": "Tints its halo violet.",
      "shop.itemWear5.name": "Sparkling Trail", "shop.itemWear5.desc": "Its trail leaves sparks as it swims.",

      "account.title": "Your account",
      "account.closeAria": "Close account",
      "account.guestNote": "Guest mode: your diamonds are saved in this browser.",
      "account.anonNote": "You're already playing as a registered guest: your diamonds and creature are being saved. Add an email and password to sign in from another device.",
      "account.email": "Email",
      "account.password": "Password",
      "account.displayName": "Display name",
      "account.signIn": "Sign in",
      "account.signUp": "Create account",
      "account.signOut": "Sign out",
      "account.toggleToSignUp": "No account? Create one",
      "account.toggleToSignIn": "Already have an account? Sign in",
      "account.loggedInAs": "Signed in as {name}",
      "account.error.generic": "Couldn't complete that. Try again.",
      "account.unavailable": "Accounts aren't configured on this server yet.",
      "account.signInShort": "Sign in",
      "account.namePlaceholder": "Your name",
      "account.emailPlaceholder": "you@example.com",
      "account.passwordPlaceholder": "At least 6 characters",
      "account.orContinue": "or continue without an account",
      "account.continueGuest": "Continue as guest",
      "account.backToWorld": "Back to the world",
      "account.loggedInSub": "Your progress is safe, on any device.",
      "account.hero.kicker": "Living-art ecosystem",
      "account.hero.title": "Your creature is waiting for you on <em>any device</em>.",
      "account.hero.sub": "Create an account and your diamonds, inventory and creature travel with you. You can also play without signing up.",
      "account.hero.statAlive": "creatures alive",
      "account.hero.statOnline": "present now",
      "account.hero.statCost": "cost",
      "account.hero.feat1": "Real-time shared world",
      "account.hero.feat2": "Your progress, always saved",
      "account.hero.feat3": "No ads, completely free",

      "leaderboard.screenTitle": "Ecosystem leaderboard",
      "leaderboard.closeAria": "Close leaderboard",
      "leaderboard.by": "Sorted by",
      "leaderboard.metric.longevity": "Longevity",
      "leaderboard.metric.offspring": "Offspring",
      "leaderboard.metric.social": "Sociability",
      "leaderboard.rank": "#",
      "leaderboard.creature": "Creature",
      "leaderboard.creator": "Creator",
      "leaderboard.value": "Value",
      "leaderboard.empty": "No creatures in the world yet.",

      "hint.camera": "Drag to move around the world · scroll to zoom · double-click to recenter",

      "toys.title": "Toys",
      "toy.bubbles": "Bubbles", "toy.shower": "Shower", "toy.feather": "Feather", "toy.star": "Sparkle",
      "toast.toy.bubbles": "{name} loved the bubbles!",
      "toast.toy.shower": "{name} came out sparkling clean.",
      "toast.toy.feather": "You tickled {name}!",
      "toast.toy.star": "{name} spins with joy.",
      "toast.toy.miss": "There was no creature nearby to receive it.",

      "mycard.photo": "Photo",
      "portrait.uploadAria": "Upload a photo for your creature",
      "portrait.error": "Couldn't load that image. Try another one."
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
