'use strict';

// ==========================================
// DEPENDENCIAS
// ==========================================
const fastify  = require('fastify')({ logger: true });
const jwt      = require('jsonwebtoken');
const axios    = require('axios');
const path     = require('path');
const db       = require('./db');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// ==========================================
// CONFIGURACIÓN
// ==========================================
const DJANGO_SECRET_KEY       = process.env.DJANGO_SECRET_KEY;
const DISCOVERY_SERVICE_URL   = process.env.DISCOVERY_SERVICE_URL || 'http://discovery:8001';

if (!DJANGO_SECRET_KEY) {
  console.error('❌ DJANGO_SECRET_KEY no está definida en el .env');
  process.exit(1);
}

// ==========================================
// RUTA DE SALUD (healthcheck)
// ==========================================
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', servicio: 'orquestador-node' };
});

// ==========================================
// RUTA PRINCIPAL: POST /chat
// ==========================================
fastify.post('/chat', async (request, reply) => {

  // ──────────────────────────────────────
  // ROL 1: EL GUARDIA DE SEGURIDAD (Validar JWT)
  // ──────────────────────────────────────
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Acceso denegado. Falta el token.' });
  }

  const token = authHeader.split(' ')[1];
  let userId;

  try {
    // El JWT de Django usa HS256 y lleva el campo 'user_id'
    const decodedToken = jwt.verify(token, DJANGO_SECRET_KEY, { algorithms: ['HS256'] });
    userId = decodedToken.user_id;
  } catch (err) {
    fastify.log.warn('Token inválido: %s', err.message);
    return reply.code(401).send({ error: 'Token inválido o expirado.' });
  }

  // Validar cuerpo del mensaje
  const { mensaje } = request.body || {};

  if (!mensaje || typeof mensaje !== 'string' || mensaje.trim().length === 0) {
    return reply.code(400).send({ error: 'El mensaje no puede estar vacío.' });
  }

  if (mensaje.trim().length > 500) {
    return reply.code(400).send({ error: 'El mensaje no puede superar los 500 caracteres.' });
  }

  // ──────────────────────────────────────
  // ROL 2: EL BIBLIOTECARIO (Guardar en PostgreSQL)
  // ──────────────────────────────────────
  let sesionId;

  try {
    // 1. Buscar si ya hay una sesión activa para este usuario
    const sesionResult = await db.query(
      `SELECT id FROM sesiones_chat 
       WHERE usuario_id = $1 
       ORDER BY creado_en DESC 
       LIMIT 1`,
      [userId]
    );

    if (sesionResult.rows.length > 0) {
      sesionId = sesionResult.rows[0].id;
    } else {
      // 2. Si no tiene sesión, crear una nueva
      const nuevaSesion = await db.query(
        `INSERT INTO sesiones_chat (usuario_id) VALUES ($1) RETURNING id`,
        [userId]
      );
      sesionId = nuevaSesion.rows[0].id;
    }

    // 3. Guardar el mensaje del usuario en el historial
    await db.query(
      `INSERT INTO mensajes_chat (sesion_id, rol, contenido) VALUES ($1, $2, $3)`,
      [sesionId, 'user', mensaje.trim()]
    );

  } catch (dbError) {
    fastify.log.error('Error del Bibliotecario (BD): %s', dbError.message);
    return reply.code(500).send({ error: 'Error al guardar el historial en la base de datos.' });
  }

  // ──────────────────────────────────────
  // ROL 3: EL CARTERO (Enviar a FastAPI / Vambot)
  // ──────────────────────────────────────
  try {
    fastify.log.info('Enviando pregunta a Vambot IA: "%s"', mensaje.trim());

    // Llamada HTTP al Discovery Service (FastAPI en Python)
    const iaResponse = await axios.post(
      `${DISCOVERY_SERVICE_URL}/ask`,
      { mensaje: mensaje.trim() },
      { timeout: 20000 } // 20 segundos máximo
    );

    // CORRECCIÓN: el campo correcto es 'respuesta_texto' (no 'respuesta')
    const textoRespuesta = iaResponse.data.respuesta_texto
      ?? JSON.stringify(iaResponse.data);

    const eventosEncontrados = iaResponse.data.eventos_encontrados ?? [];

    // 4. Guardar la respuesta de la IA en el historial
    await db.query(
      `INSERT INTO mensajes_chat (sesion_id, rol, contenido) VALUES ($1, $2, $3)`,
      [sesionId, 'assistant', textoRespuesta]
    );

    // 5. Devolver la respuesta al cliente (app móvil)
    return reply.send({
      sesion_id:          sesionId,
      respuesta_agente:   textoRespuesta,
      eventos_encontrados: eventosEncontrados,
    });

  } catch (error) {
    fastify.log.error('Error al contactar la IA: %s', error.message);

    // Distinguir error de timeout vs error de servicio
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return reply.code(504).send({ error: 'El servicio de IA tardó demasiado en responder. Intenta de nuevo.' });
    }

    if (error.response?.status === 429) {
      return reply.code(429).send({ error: 'Demasiadas solicitudes. Espera unos segundos e intenta de nuevo.' });
    }

    if (error.response?.status === 422) {
      return reply.code(422).send({ error: 'El mensaje contiene contenido no permitido. Por favor reformúlalo.' });
    }

    return reply.code(500).send({ error: 'El servicio de IA no está disponible en este momento.' });
  }
});

// ==========================================
// ARRANQUE DEL SERVIDOR
// ==========================================
const start = async () => {
  try {
    const PORT = parseInt(process.env.PORT || '3000', 10);
    const HOST = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`✅ Orquestador Node.js escuchando en ${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();