/* ============================================================
   SIMBIONTE — Configuración del frontend
   Deja todo vacío y el proyecto funciona en "modo santuario"
   (offline, con criaturas ancestrales simuladas).
   ============================================================ */
window.SIMBIONTE_CONFIG = {

  /* URL del servidor Socket.io (mundo compartido en tiempo real).
     · En desarrollo local:  ""  (usa el mismo origen: node server.js)
     · En producción: la URL de tu servidor en Render, p. ej.
       "https://simbionte-server.onrender.com"                      */
  SERVER_URL: "",

  /* Supabase directo desde el navegador (opcional, para leer el
     archivo fósil / genealogías públicas). Usa SOLO la clave "anon".
     Project Settings → API → anon public key                       */
  SUPABASE_URL: "https://uinimvaunpaduoqidhny.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_2KjSUftRdHOAqLxjcPaudQ_24Z7Tdkn",

  /* Nombre con el que firmas a tus criaturas si no escribes uno en
     el ritual (se puede cambiar desde la interfaz). Déjalo vacío
     para que use el nombre por defecto según el idioma activo
     ("viajero" / "traveler").                                      */
  DEFAULT_CREATOR: "",

  /* Población máxima visible del mundo (baja a 16 si tu equipo
     va lento).                                                     */
  MAX_POPULATION: 22
};
