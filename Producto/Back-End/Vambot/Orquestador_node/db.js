const { Pool } = require('pg');
require('dotenv').config();
console.log("Usuario leído del .env:", process.env.DB_USER);
// Creamos la conexión utilizando las credenciales de tu .env
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Prueba rápida para verificar que el Orquestador "ve" la base de datos
pool.on('connect', () => {
  console.log('✅ Conexión establecida con la Base de Datos PostgreSQL (vamos_eventos)');
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en la conexión de PostgreSQL', err);
});

module.exports = pool;