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
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",

  /* Nombre con el que firmas a tus criaturas (se puede cambiar
     desde la interfaz).                                            */
  DEFAULT_CREATOR: "viajero",

  /* Población máxima visible del mundo (baja a 16 si tu equipo
     va lento).                                                     */
  MAX_POPULATION: 22
};
