/* ============================================================
   SIMBIONTE — Servidor del ecosistema
   Express (archivos estáticos) + Socket.io (mundo compartido)
   + Supabase opcional (persistencia) + Crónica IA opcional.

   Funciona SIN configurar nada: si no hay .env, el mundo vive
   en memoria y la crónica usa el generador local de mitología.
   ============================================================ */
require('dotenv').config();
const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const app = express();
// El frontend vive en otro dominio (Vercel) que el servidor (Render):
// las rutas /api/* necesitan CORS igual que ya tiene Socket.io.
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: '200kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

/* ---------- Supabase (opcional) ---------- */
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
  const { createClient } = require('@supabase/supabase-js');
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  console.log('[SIMBIONTE] Supabase conectado: persistencia activa.');
} else {
  console.log('[SIMBIONTE] Sin Supabase (.env vacío): el mundo vive en memoria.');
}

/* ---------- Estado del ecosistema ---------- */
const MAX_ROSTER = 48;
let roster = [];      // criaturas vivas conocidas por el servidor
let chronicle = [];   // últimas entradas de la mitología

async function loadFromSupabase() {
  if (!supabase) return;
  const { data, error } = await supabase
    .from('creatures')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(MAX_ROSTER);
  if (!error && data) {
    roster = data.map(r => ({
      id: r.id, name: r.name, genome: r.genome,
      parents: r.parents || null, creator: r.creator || 'anónimo',
      user_id: r.user_id || null,
      bornAt: new Date(r.created_at).getTime()
    })).reverse();
    console.log(`[SIMBIONTE] ${roster.length} criaturas recuperadas de Supabase.`);
  }
}
loadFromSupabase();

async function persistCreature(c) {
  if (!supabase) return;
  await supabase.from('creatures').insert({
    id: c.id, name: c.name, genome: c.genome,
    parents: c.parents, creator: c.creator, user_id: c.user_id || null
  }).then(({ error }) => { if (error) console.error('[Supabase]', error.message); });
}

/* ---------- Socket.io: el mundo compartido ---------- */
io.on('connection', socket => {
  socket.emit('roster', { creatures: roster, chronicle: chronicle.slice(-12) });
  socket.broadcast.emit('presence', { online: io.engine.clientsCount });
  socket.emit('presence', { online: io.engine.clientsCount });

  socket.on('birth', creature => {
    if (!creature || !creature.genome || !Array.isArray(creature.genome)) return;
    creature.bornAt = Date.now();
    roster.push(creature);
    if (roster.length > MAX_ROSTER) roster.shift();
    persistCreature(creature);
    socket.broadcast.emit('birth', creature);
  });

  socket.on('chronicle', entry => {
    if (!entry || typeof entry.text !== 'string') return;
    entry.text = entry.text.slice(0, 400);
    chronicle.push(entry);
    if (chronicle.length > 60) chronicle.shift();
    socket.broadcast.emit('chronicle', entry);
  });

  socket.on('disconnect', () => {
    io.emit('presence', { online: io.engine.clientsCount });
  });
});

/* ---------- API: Cronista IA (opcional) ----------
   Si defines ANTHROPIC_API_KEY en .env, la mitología la
   escribe Claude. Si no, el frontend usa su generador local. */
const CHRONICLER_SYSTEM = {
  es: 'Eres el Cronista de SIMBIONTE, un ecosistema digital vivo. Escribe UNA sola frase mítica y poética en español (máximo 30 palabras) sobre el evento recibido. Tono de leyenda antigua. Sin comillas, sin explicaciones.',
  en: 'You are the Chronicler of SIMBIONTE, a living digital ecosystem. Write ONE single mythic, poetic sentence in English (max 30 words) about the received event. Tone of an ancient legend. No quotes, no explanations.'
};

app.post('/api/chronicle', async (req, res) => {
  const { event, lang } = req.body || {};
  if (!event) return res.status(400).json({ error: 'Falta el evento.' });
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.json({ text: null, source: 'local' });
  }
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 120,
        system: CHRONICLER_SYSTEM[lang === 'en' ? 'en' : 'es'],
        messages: [{ role: 'user', content: JSON.stringify(event) }]
      })
    });
    const data = await r.json();
    const text = data?.content?.find(b => b.type === 'text')?.text?.trim() || null;
    res.json({ text, source: 'claude' });
  } catch (e) {
    res.json({ text: null, source: 'local' });
  }
});

/* ---------- Economía: misiones y tienda (opcional, requiere cuentas) ----------
   El precio/recompensa vive SOLO aquí (nunca en el cliente): el navegador
   manda un id y el servidor decide cuánto vale. Requiere Supabase con Auth
   activado (mismas credenciales que la persistencia de criaturas). Sin
   Supabase configurado, estos endpoints responden 503 y el frontend cae
   automáticamente al wallet de invitado en localStorage (ver wallet.js). */
const MISSIONS = {
  firstBirth: 25, survive: 20, fed5: 15, firstChild: 40, firstCourtship: 10,
  toymaster: 30, founders: 35, explorer: 30, current: 40, blackout: 45, riddles: 50, rune: 60,
  dynasty: 70, riskyCourtship: 45, elder: 55, family: 50, swarm: 35,
  goldrainBirth: 40, eventsWitnessed: 40, riddles2: 65, hoarder: 40, wardrobe: 45
};
const SHOP_ITEMS = {
  food_spark: 8, food_feast: 25,
  gift_hearts: 12, gift_confetti: 15,
  art_amulet_social: 40, art_relic_glow: 40, art_shell_lifespan: 60,
  wear_crown: 50, wear_collar: 35, wear_aura_gold: 30, wear_aura_violet: 30, wear_trail_sparkle: 45
};
const WEAR_SLOTS = {
  wear_crown: 'head', wear_collar: 'collar', wear_aura_gold: 'aura', wear_aura_violet: 'aura', wear_trail_sparkle: 'trail'
};

async function userFromAuth(req) {
  if (!supabase) return null;
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}
async function getOrCreateWallet(userId) {
  const { data } = await supabase.from('wallets').select('*').eq('user_id', userId).maybeSingle();
  if (data) return data;
  const { data: created } = await supabase.from('wallets').insert({ user_id: userId, diamonds: 0 }).select().single();
  return created || { user_id: userId, diamonds: 0 };
}

app.get('/api/wallet', async (req, res) => {
  const user = await userFromAuth(req);
  if (!user) return res.status(supabase ? 401 : 503).json({ error: supabase ? 'No autenticado.' : 'Cuentas no configuradas.' });
  const wallet = await getOrCreateWallet(user.id);
  const { data: inventory } = await supabase.from('inventory').select('item_id, equipped').eq('user_id', user.id);
  const { data: missions } = await supabase.from('missions_done').select('mission_key').eq('user_id', user.id);
  res.json({ diamonds: wallet.diamonds, inventory: inventory || [], missionsDone: (missions || []).map(m => m.mission_key) });
});

app.post('/api/missions/claim', async (req, res) => {
  const user = await userFromAuth(req);
  if (!user) return res.status(supabase ? 401 : 503).json({ error: supabase ? 'No autenticado.' : 'Cuentas no configuradas.' });
  const { missionKey } = req.body || {};
  const reward = MISSIONS[missionKey];
  if (!reward) return res.status(400).json({ error: 'Misión desconocida.' });

  const { error: dupErr } = await supabase.from('missions_done').insert({ user_id: user.id, mission_key: missionKey });
  if (dupErr) { // ya reclamada (violación de la clave primaria user_id+mission_key)
    const wallet = await getOrCreateWallet(user.id);
    return res.json({ diamonds: wallet.diamonds, alreadyClaimed: true });
  }
  const wallet = await getOrCreateWallet(user.id);
  const diamonds = wallet.diamonds + reward;
  await supabase.from('wallets').update({ diamonds, updated_at: new Date().toISOString() }).eq('user_id', user.id);
  res.json({ diamonds, reward });
});

app.post('/api/shop/purchase', async (req, res) => {
  const user = await userFromAuth(req);
  if (!user) return res.status(supabase ? 401 : 503).json({ error: supabase ? 'No autenticado.' : 'Cuentas no configuradas.' });
  const { itemId } = req.body || {};
  const price = SHOP_ITEMS[itemId];
  if (!price) return res.status(400).json({ error: 'Artículo desconocido.' });

  const wallet = await getOrCreateWallet(user.id);
  if (wallet.diamonds < price) return res.status(402).json({ error: 'Diamantes insuficientes.', diamonds: wallet.diamonds });
  const diamonds = wallet.diamonds - price;
  await supabase.from('wallets').update({ diamonds, updated_at: new Date().toISOString() }).eq('user_id', user.id);

  const equippable = itemId.startsWith('art_') || itemId.startsWith('wear_');
  if (equippable) {
    const slot = WEAR_SLOTS[itemId];
    if (slot) { // solo uno por slot: desequipa lo anterior del mismo slot
      const slotIds = Object.keys(WEAR_SLOTS).filter(id => WEAR_SLOTS[id] === slot);
      await supabase.from('inventory').update({ equipped: false }).eq('user_id', user.id).in('item_id', slotIds);
    }
    await supabase.from('inventory').insert({ user_id: user.id, item_id: itemId, equipped: true });
  }
  const { data: inventory } = await supabase.from('inventory').select('item_id, equipped').eq('user_id', user.id);
  res.json({ diamonds, inventory: inventory || [] });
});

app.post('/api/shop/equip', async (req, res) => {
  const user = await userFromAuth(req);
  if (!user) return res.status(supabase ? 401 : 503).json({ error: supabase ? 'No autenticado.' : 'Cuentas no configuradas.' });
  const { itemId, equipped } = req.body || {};
  const slot = WEAR_SLOTS[itemId];
  if (slot && equipped) {
    const slotIds = Object.keys(WEAR_SLOTS).filter(id => WEAR_SLOTS[id] === slot);
    await supabase.from('inventory').update({ equipped: false }).eq('user_id', user.id).in('item_id', slotIds);
  }
  await supabase.from('inventory').update({ equipped: !!equipped }).eq('user_id', user.id).eq('item_id', itemId);
  const { data: inventory } = await supabase.from('inventory').select('item_id, equipped').eq('user_id', user.id);
  res.json({ inventory: inventory || [] });
});

app.get('/api/health', (_req, res) => res.json({ ok: true, alive: roster.length }));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n  ◉ SIMBIONTE respirando en  http://localhost:${PORT}\n`);
});
