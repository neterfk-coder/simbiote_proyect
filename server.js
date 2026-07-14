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
    parents: c.parents, creator: c.creator
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
app.post('/api/chronicle', async (req, res) => {
  const { event } = req.body || {};
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
        model: 'claude-sonnet-4-6',
        max_tokens: 120,
        system: 'Eres el Cronista de SIMBIONTE, un ecosistema digital vivo. Escribe UNA sola frase mítica y poética en español (máximo 30 palabras) sobre el evento recibido. Tono de leyenda antigua. Sin comillas, sin explicaciones.',
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

app.get('/api/health', (_req, res) => res.json({ ok: true, alive: roster.length }));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n  ◉ SIMBIONTE respirando en  http://localhost:${PORT}\n`);
});
