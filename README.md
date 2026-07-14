# ◉ SIMBIONTE — el ecosistema de arte vivo

> *"No es una obra que se mira. Es una obra que está viva, y tú eres parte de su ADN."*

Proyecto para el hackathon **Hack The Arts** (Devpost). Tema: *"Crea arte que no podría existir sin la tecnología"*.

Cada visitante dona su **voz**, un **gesto** y un **trazo**. Esos tres datos se convierten en el **ADN digital** (20 genes) de una criatura única que vive en un mundo compartido en tiempo real: se reproduce mezclando genes con criaturas de otros visitantes, muta, envejece, muere dejando fósiles, canta con Tone.js, y una **Crónica** (IA opcional) escribe la mitología del mundo mientras ocurre.

---

## ⚡ Ejecutar en 60 segundos

Requisitos: [Node.js 18+](https://nodejs.org).

```bash
npm install
npm start
```

Abre **http://localhost:3000**. Listo: el mundo compartido funciona en tu red local (abre dos pestañas y verás la misma población).

> **¿Sin servidor?** También puedes abrir `public/index.html` directamente o desplegar solo la carpeta `public/` como sitio estático: el proyecto detecta que no hay servidor y activa el **modo santuario** (criaturas ancestrales locales). La demo nunca falla.

---

## 📁 Estructura del proyecto

```
simbionte/
├── server.js              Servidor: Express + Socket.io + Supabase/IA opcionales
├── package.json
├── vercel.json            Despliegue del frontend estático en Vercel
├── .env.example           Copia como .env para activar Supabase / Cronista IA
└── public/
    ├── index.html         Pantallas: intro, ritual, HUD, paneles
    ├── css/style.css      Diseño "bioluminiscencia abisal"
    └── js/
        ├── config.js      ← ÚNICO archivo que necesitas tocar para producción
        ├── i18n.js        Idiomas (español/English): textos y selector ES/EN
        ├── dna.js         Genoma de 20 genes, cruce, mutación, nombres
        ├── audio.js       Voz del visitante (Web Audio) + coro (Tone.js)
        ├── capture.js     Gesto y trazo del ritual
        ├── creature.js    Anatomía y comportamiento procedural (p5.js)
        ├── world.js       Ecosistema: reproducción, fósiles, partículas
        ├── chronicle.js   El Cronista (mitos locales o IA del servidor)
        ├── net.js         Socket.io + modo santuario + Supabase lectura
        ├── auth.js        Cuentas (Supabase Auth) — opcional, cae a invitado
        ├── wallet.js      Diamantes e inventario (cuenta o localStorage)
        ├── courtship.js   Cortejo propuesto por el visitante
        ├── shop.js        La Tienda (comida, regalos, artefactos, ropa)
        ├── leaderboard.js Pantalla de ranking en vivo con gráfica
        ├── certificate.js Certificado de nacimiento PNG descargable
        └── main.js        Orquestador de todo el flujo
```

---

## 🗄️ Conectar Supabase (persistencia — opcional)

Con Supabase, el mundo **sobrevive a los reinicios**: las criaturas y genealogías quedan guardadas y los visitantes reencuentran a sus descendientes días después.

1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta este esquema:

```sql
create table creatures (
  id          text primary key,
  name        text not null,
  genome      jsonb not null,
  parents     jsonb,
  creator     text default 'anónimo',
  created_at  timestamptz default now()
);

-- Lectura pública (el mundo es de todos), escritura solo del servidor
alter table creatures enable row level security;
create policy "lectura publica" on creatures for select using (true);
```

3. En **Project Settings → API**, copia las claves:
   - **Servidor** — crea `.env` (copia de `.env.example`) y completa `SUPABASE_URL` y `SUPABASE_SERVICE_KEY` (la clave *service_role*; nunca la publiques en el frontend).
   - **Frontend (opcional)** — en `public/js/config.js` completa `SUPABASE_URL` y `SUPABASE_ANON_KEY` (la clave *anon public*) si quieres leer el archivo fósil directamente desde el navegador.

4. Reinicia `npm start`. Verás: `Supabase conectado: persistencia activa.`

## 💎 Cuentas, diamantes y tienda (opcional)

Sin nada configurado, la Tienda y las misiones **funcionan igual**: cada navegador guarda sus propios diamantes e inventario en `localStorage` ("modo invitado"). Para que los diamantes persistan entre dispositivos, activa cuentas reales con Supabase Auth:

1. En tu proyecto Supabase, activa **Authentication → Email** (usuario/contraseña; no requiere confirmación por correo para probar en local).
2. En **SQL Editor**, además de la tabla `creatures` de arriba, ejecuta:

```sql
alter table creatures add column if not exists user_id uuid references auth.users(id);

create table wallets (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  diamonds    integer not null default 0,
  updated_at  timestamptz default now()
);
create table inventory (
  id           bigint generated always as identity primary key,
  user_id      uuid references auth.users(id) on delete cascade,
  item_id      text not null,
  equipped     boolean default false,
  acquired_at  timestamptz default now()
);
create table missions_done (
  user_id      uuid references auth.users(id) on delete cascade,
  mission_key  text not null,
  done_at      timestamptz default now(),
  primary key (user_id, mission_key)
);

alter table wallets enable row level security;
alter table inventory enable row level security;
alter table missions_done enable row level security;
create policy "propio wallet" on wallets for select using (auth.uid() = user_id);
create policy "propio inventario" on inventory for select using (auth.uid() = user_id);
create policy "propias misiones" on missions_done for select using (auth.uid() = user_id);
-- Todas las escrituras de diamantes/inventario/misiones pasan por el servidor
-- (server.js usa la service_role key), así que no hacen falta policies de INSERT/UPDATE aquí.
```

3. Con `SUPABASE_URL`/`SUPABASE_SERVICE_KEY` ya en tu `.env` (servidor) y `SUPABASE_URL`/`SUPABASE_ANON_KEY` en `public/js/config.js` (frontend), reinicia `npm start`. El botón de cuenta (💎, arriba a la derecha) pasa a mostrar el formulario de inicio de sesión / registro en vez del aviso de modo invitado.

**Por qué el precio/recompensa vive en el servidor**: `server.js` define `MISSIONS` y `SHOP_ITEMS` como la única fuente de verdad — el navegador solo manda "quiero esta misión" o "quiero este artículo"; el servidor decide cuánto vale. Así nadie puede regalarse diamantes editando el JavaScript del navegador.

## 🤖 Activar el Cronista IA (opcional)

En `.env` añade tu `ANTHROPIC_API_KEY`. La mitología pasará a escribirla Claude a través de `POST /api/chronicle` (el servidor limita cada mito a una frase). Sin clave, el telar local de mitos funciona igual de bien para la demo.

---

## 🚀 Despliegue (Vercel + Render)

El proyecto se publica en dos piezas, ambas gratis:

**1. Servidor del mundo → Render** (Socket.io necesita un proceso persistente; los serverless de Vercel no lo mantienen):
   - [render.com](https://render.com) → *New Web Service* → conecta tu repo de GitHub.
   - Build: `npm install` · Start: `node server.js`.
   - Añade tus variables de entorno (las mismas del `.env`).
   - Copia la URL final, p. ej. `https://simbionte-server.onrender.com`.

**2. Frontend → Vercel**:
   - En `public/js/config.js`, pon esa URL en `SERVER_URL`.
   - [vercel.com](https://vercel.com) → importa el repo (detecta `vercel.json` y sirve `public/` como sitio estático) → Deploy.

> Alternativa simple: despliega TODO solo en Render (sirve frontend y sockets juntos) y usa Vercel únicamente si quieres el dominio bonito para la página.

---

## 🌐 Idioma

El selector **ES / EN** está siempre visible (esquina superior derecha antes de entrar al mundo, dentro del HUD una vez dentro). Cambia al instante todo el texto de la interfaz, la mitología de la Crónica (incluida la generada por el Cronista IA), el certificado descargable y los nombres de género por defecto. La preferencia se guarda en `localStorage` y se detecta automáticamente el idioma del navegador en la primera visita.

## 🎛️ Controles

| Acción | Cómo |
|---|---|
| Crear una criatura | «Dar vida a una criatura» → voz (3 s) → gesto (4 s) → trazo (suelta para terminar) → puedes editar su nombre antes de liberarla |
| Conocer una criatura | Tócala/clic: se abre su ficha con genes y genealogía |
| Alimentarla | Arrastra una partícula de luz flotante hasta ella (crece un poco y vive más) |
| Llamarla | Mantén presionado cerca de ella: nada hacia el cursor más rápido que hacia cualquier otra |
| Proponerle un cortejo | Arrástrala hasta otra criatura: verás la compatibilidad genética antes de confirmar el cruce |
| Escuchar el coro | Botón de sonido del HUD (cada criatura canta su gen de tono) |
| Leer la mitología | Botón de libro → panel «La Crónica» |
| Ver el ranking en vivo | Botón de trofeo → gráfica y tabla de todas las criaturas por longevidad, descendencia o sociabilidad |
| Comprar en la Tienda | Botón de bolsa → comida, regalos, artefactos y vestimentas con tus 💎 |
| Compartir | «Certificado ↓» descarga un PNG 1080×1350 listo para redes |

## 🔒 Privacidad

La voz y la cámara **nunca salen del navegador**. Del ritual solo se conservan números normalizados (tono, energía, brillo, trayectorias). No se guarda audio ni video en ningún lugar.

## 🛠️ Tecnologías y atribuciones (requisito del envío)

[p5.js](https://p5js.org) (render), [Tone.js](https://tonejs.github.io) (sonido generativo), [Socket.io](https://socket.io) (tiempo real), [Express](https://expressjs.com), [Supabase](https://supabase.com) (persistencia opcional), API de [Anthropic](https://www.anthropic.com) (Cronista opcional), Google Fonts (Unbounded, Sora, Cormorant Garamond). Algoritmo genético, anatomía procedural y telar de mitos: **código propio**.

## 📋 Checklist del envío a Devpost

- [ ] Enlace en vivo (Vercel/Render) funcionando
- [ ] Repositorio público con este README
- [ ] Video demo 2–3 min (abre con un nacimiento real, no con slides)
- [ ] Descripción del proyecto: concepto + este stack + atribuciones
- [ ] Publicar el enlace en el Discord del hackathon: cada criatura creada por otro participante hace crecer la obra (y los votos de Favorito del Público)

---

*Hecho con código, ruido y ganas de que el arte respire.* ◉
