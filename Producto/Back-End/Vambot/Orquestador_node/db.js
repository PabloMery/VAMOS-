const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// ==========================================
// FUNCIÓN DE AUTO-MIGRACIÓN (El Bibliotecario)
// ==========================================
const inicializarTablas = async () => {
  try {
    const query = `
      -- 1. Tabla para agrupar las conversaciones
      CREATE TABLE IF NOT EXISTS sesiones_chat (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          usuario_id INTEGER NOT NULL,
          creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- 2. Tabla para guardar cada burbuja de texto
      CREATE TABLE IF NOT EXISTS mensajes_chat (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          sesion_id UUID REFERENCES sesiones_chat(id) ON DELETE CASCADE,
          rol VARCHAR(15) CHECK (rol IN ('user', 'assistant')),
          contenido TEXT NOT NULL,
          creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // Ejecutamos la creación de tablas
    await pool.query(query);
    console.log('✅ Tablas de historial (sesiones y mensajes) listas en PostgreSQL.');
  } catch (error) {
    console.error('❌ Error crítico al crear las tablas de historial:', error);
  }
};

// Evento para confirmar la conexión básica
pool.on('connect', () => {
  console.log('✅ Conectado al Pool de PostgreSQL (vamos_eventos)');
});

// Ejecutamos la función apenas este archivo sea leído por el servidor
inicializarTablas();

module.exports = pool;