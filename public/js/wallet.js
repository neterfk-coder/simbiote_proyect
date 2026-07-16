/* ============================================================
   SIMBIONTE — wallet.js
   Diamantes e inventario. Misma API sin importar el camino:
   · Con sesión (Auth.user) → servidor (/api/wallet, /api/missions/claim,
     /api/shop/purchase, /api/shop/equip), precios y recompensas
     decididos por server.js (el cliente no puede inventarse diamantes).
   · Sin sesión → localStorage, mismas reglas, para que la tienda
     funcione igual de bien sin necesidad de configurar cuentas.
   Los catálogos de abajo son un ESPEJO del las de server.js: solo se
   usan en modo invitado. En modo cuenta manda siempre el servidor.
   ============================================================ */
"use strict";

const Wallet = (() => {
  const STORAGE_KEY = "simbionte_wallet_guest";
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
    wear_crown: "head", wear_collar: "collar", wear_aura_gold: "aura", wear_aura_violet: "aura", wear_trail_sparkle: "trail"
  };

  let state = { diamonds: 0, inventory: [], missionsDone: [] };
  const listeners = [];
  function emit() { listeners.forEach(fn => fn(state)); }

  /* ---------- Modo invitado (localStorage) ---------- */
  function loadLocal() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      state = raw || { diamonds: 0, inventory: [], missionsDone: [] };
    } catch { state = { diamonds: 0, inventory: [], missionsDone: [] }; }
  }
  function saveLocal() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

  function claimMissionLocal(key) {
    const reward = MISSIONS[key];
    if (!reward || state.missionsDone.includes(key)) return null;
    state.missionsDone.push(key);
    state.diamonds += reward;
    saveLocal(); emit();
    return { diamonds: state.diamonds, reward };
  }
  function purchaseLocal(itemId) {
    const price = SHOP_ITEMS[itemId];
    if (!price) return { error: "unknown" };
    if (state.diamonds < price) return { error: "funds" };
    state.diamonds -= price;
    const equippable = itemId.startsWith("art_") || itemId.startsWith("wear_");
    if (equippable) {
      const slot = WEAR_SLOTS[itemId];
      if (slot) for (const it of state.inventory) if (WEAR_SLOTS[it.itemId] === slot) it.equipped = false;
      state.inventory.push({ itemId, equipped: true });
    }
    saveLocal(); emit();
    return { diamonds: state.diamonds, inventory: state.inventory };
  }
  function equipLocal(itemId, equipped) {
    const slot = WEAR_SLOTS[itemId];
    if (slot && equipped) for (const it of state.inventory) if (WEAR_SLOTS[it.itemId] === slot) it.equipped = false;
    const entry = state.inventory.find(it => it.itemId === itemId);
    if (entry) entry.equipped = !!equipped;
    saveLocal(); emit();
    return { inventory: state.inventory };
  }

  /* ---------- Modo cuenta (servidor) ---------- */
  async function api(path, body) {
    const base = window.SIMBIONTE_CONFIG?.SERVER_URL || "";
    const r = await fetch(base + path, {
      method: body ? "POST" : "GET",
      headers: { "content-type": "application/json", authorization: `Bearer ${Auth.token}` },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!r.ok) return { error: (await r.json().catch(() => ({}))).error || "http" };
    return r.json();
  }
  async function loadRemote() {
    const data = await api("/api/wallet");
    if (!data.error) state = { diamonds: data.diamonds || 0, inventory: data.inventory || [], missionsDone: data.missionsDone || [] };
    emit();
  }

  /* ---------- API pública (unificada) ---------- */
  async function refresh() {
    if (Auth.available && Auth.user) { await loadRemote(); }
    else { loadLocal(); emit(); }
  }
  Auth.onChange(() => refresh());
  refresh();

  async function claimMission(key) {
    if (Auth.available && Auth.user) {
      const data = await api("/api/missions/claim", { missionKey: key });
      if (data.error || data.alreadyClaimed) return null;
      state.diamonds = data.diamonds;
      if (!state.missionsDone.includes(key)) state.missionsDone.push(key);
      emit();
      return { diamonds: data.diamonds, reward: data.reward };
    }
    return claimMissionLocal(key);
  }
  async function purchase(itemId) {
    if (Auth.available && Auth.user) {
      const data = await api("/api/shop/purchase", { itemId });
      if (data.error) return { error: data.error === "funds" || data.diamonds !== undefined ? "funds" : data.error };
      state.diamonds = data.diamonds; state.inventory = data.inventory || state.inventory; emit();
      return { diamonds: state.diamonds, inventory: state.inventory };
    }
    return purchaseLocal(itemId);
  }
  async function equip(itemId, equipped) {
    if (Auth.available && Auth.user) {
      const data = await api("/api/shop/equip", { itemId, equipped });
      if (!data.error) { state.inventory = data.inventory || state.inventory; emit(); }
      return { inventory: state.inventory };
    }
    return equipLocal(itemId, equipped);
  }

  function isOwned(itemId) { return state.inventory.some(it => it.itemId === itemId); }
  function isEquipped(itemId) { return state.inventory.some(it => it.itemId === itemId && it.equipped); }
  function equippedItems() { return state.inventory.filter(it => it.equipped).map(it => it.itemId); }

  return {
    MISSIONS, SHOP_ITEMS, WEAR_SLOTS,
    claimMission, purchase, equip, isOwned, isEquipped, equippedItems,
    onChange(fn) { listeners.push(fn); },
    get diamonds() { return state.diamonds; },
    get inventory() { return state.inventory; },
    get missionsDone() { return state.missionsDone; }
  };
})();
