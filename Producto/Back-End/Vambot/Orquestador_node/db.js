'use strict';

const { Pool } = require('pg');
const path     = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// ==========================================
// CONEXIÓN AL POOL
// ==========================================
// Las tablas de historial de chat (sesiones_chat y mensajes_chat)
// viven en vamos_usuarios, NO en vamos_eventos.
// Por eso usamos DB_CHAT_NAME con fallback a 'vamos_usuarios'.
const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT || '5432', 10),
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_CHAT_NAME || 'vamos_usuarios',
});

// ==========================================
// FUNCIÓN DE AUTO-MIGRACIÓN
// ==========================================
const inicializarTablas = async () => {
  const query = `
    -- Tabla para agrupar las conversaciones por usuario
    CREATE TABLE IF NOT EXISTS sesiones_chat (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      usuario_id  INTEGER NOT NULL,
      creado_en   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla para guardar cada mensaje de la conversación
    CREATE TABLE IF NOT EXISTS mensajes_chat (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sesion_id   UUID REFERENCES sesiones_chat(id) ON DELETE CASCADE,
      rol         VARCHAR(15) CHECK (rol IN ('user', 'assistant')),
      contenido   TEXT NOT NULL,
      creado_en   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Índice para acelerar la búsqueda de sesiones por usuario
    CREATE INDEX IF NOT EXISTS idx_sesiones_chat_usuario
      ON sesiones_chat(usuario_id);

    -- Índice para acelerar la búsqueda de mensajes por sesión
    CREATE INDEX IF NOT EXISTS idx_mensajes_chat_sesion
      ON mensajes_chat(sesion_id);
  `;

  try {
    await pool.query(query);
    console.log('✅ Tablas de historial (sesiones_chat y mensajes_chat) listas en vamos_usuarios.');
  } catch (error) {
    console.error('❌ Error crítico al crear las tablas de historial:', error.message);
    // No matamos el proceso — si las tablas ya existen no es un error fatal
  }
};

// ==========================================
// EVENTOS DEL POOL
// ==========================================
pool.on('connect', () => {
  console.log(`✅ Conectado al Pool de PostgreSQL (${process.env.DB_CHAT_NAME || 'vamos_usuarios'})`);
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de PostgreSQL:', err.message);
});

// ==========================================
// INICIALIZAR TABLAS AL ARRANCAR
// ==========================================
inicializarTablas();

module.exports = pool;