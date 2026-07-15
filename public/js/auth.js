/* ============================================================
   SIMBIONTE — auth.js
   Envoltorio delgado sobre Supabase Auth. Si el proyecto tiene
   Supabase configurado, cada visitante recibe automáticamente
   una sesión anónima real (requiere "Anonymous Sign-ins" activo
   en el proyecto): sus diamantes, inventario y criaturas quedan
   registrados en la base de datos desde el primer momento, sin
   pedirle nada. Si más tarde pone email/contraseña ("crear
   cuenta"), esa MISMA cuenta se sube de categoría — no se crea
   una nueva ni se pierde el progreso.
   Si Supabase no está configurado, Auth.available queda en
   false y wallet.js cae al modo invitado en localStorage.
   ============================================================ */
"use strict";

const Auth = (() => {
  let client = null;
  let session = null;
  const listeners = [];

  function emit() { listeners.forEach(fn => fn(session?.user || null)); }

  async function init() {
    const cfg = window.SIMBIONTE_CONFIG || {};
    if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY || typeof window.supabase === "undefined") return;
    client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    client.auth.onAuthStateChange((_event, s) => { session = s; emit(); });

    const { data } = await client.auth.getSession();
    session = data.session;
    if (!session) {
      const { data: anon, error } = await client.auth.signInAnonymously();
      if (!error) session = anon.session;
      // si falla (p. ej. "Anonymous Sign-ins" no está activo en el proyecto),
      // seguimos sin sesión: la cuenta queda disponible solo para signIn/signUp normal.
    }
    emit();
  }
  init();

  async function signUp(email, password, displayName) {
    if (!client) throw new Error("unavailable");
    const meta = { data: { display_name: displayName || email.split("@")[0] } };
    if (session?.user?.is_anonymous) {
      // sube de categoría la cuenta anónima existente: mismo user_id, mismo historial
      const { data, error } = await client.auth.updateUser({ email, password, ...meta });
      if (error) throw error;
      return data.user; // onAuthStateChange actualiza session/emit
    }
    const { data, error } = await client.auth.signUp({ email, password, options: meta });
    if (error) throw error;
    session = data.session;
    emit();
    return data.user;
  }
  async function signIn(email, password) {
    if (!client) throw new Error("unavailable");
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    session = data.session;
    emit();
    return data.user;
  }
  async function signOut() {
    if (!client) return;
    await client.auth.signOut();
    session = null;
    emit();
    // vuelve a quedar como invitado (anónimo) en vez de sin sesión
    const { data, error } = await client.auth.signInAnonymously();
    if (!error) { session = data.session; emit(); }
  }

  function displayName() {
    const u = session?.user;
    if (!u || u.is_anonymous) return null;
    return u.user_metadata?.display_name || u.email?.split("@")[0] || "viajero";
  }

  return {
    signUp, signIn, signOut,
    onChange(fn) { listeners.push(fn); },
    get available() { return !!client; },
    get user() { return session?.user || null; },
    get isAnonymous() { return !!session?.user?.is_anonymous; },
    get token() { return session?.access_token || null; },
    get displayName() { return displayName(); }
  };
})();
