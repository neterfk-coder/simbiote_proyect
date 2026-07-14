/* ============================================================
   SIMBIONTE — auth.js
   Envoltorio delgado sobre Supabase Auth (cuentas reales, para
   que los diamantes persistan entre dispositivos). Si el
   proyecto no tiene SUPABASE_URL/ANON_KEY configurados, o falta
   la librería, Auth.available queda en false y todo el resto de
   la app (wallet.js) cae automáticamente al modo invitado.
   ============================================================ */
"use strict";

const Auth = (() => {
  let client = null;
  let session = null;
  const listeners = [];

  function emit() { listeners.forEach(fn => fn(session?.user || null)); }

  function init() {
    const cfg = window.SIMBIONTE_CONFIG || {};
    if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY || typeof window.supabase === "undefined") return;
    client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    client.auth.getSession().then(({ data }) => { session = data.session; emit(); });
    client.auth.onAuthStateChange((_event, s) => { session = s; emit(); });
  }
  init();

  async function signUp(email, password, displayName) {
    if (!client) throw new Error("unavailable");
    const { data, error } = await client.auth.signUp({
      email, password, options: { data: { display_name: displayName || email.split("@")[0] } }
    });
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
  }

  function displayName() {
    const u = session?.user;
    if (!u) return null;
    return u.user_metadata?.display_name || u.email?.split("@")[0] || "viajero";
  }

  return {
    signUp, signIn, signOut,
    onChange(fn) { listeners.push(fn); },
    get available() { return !!client; },
    get user() { return session?.user || null; },
    get token() { return session?.access_token || null; },
    get displayName() { return displayName(); }
  };
})();
