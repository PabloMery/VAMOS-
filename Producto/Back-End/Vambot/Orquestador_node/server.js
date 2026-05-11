const fastify = require('fastify')({ logger: true });
require('dotenv').config();

const db = require('./db');

// Endpoint de prueba (Health Check)
fastify.get('/health', async (request, reply) => {
  try {
    // Hacemos un ping rapidísimo a la BD para asegurar que todo conecta
    const dbResult = await db.query('SELECT NOW()');
    return reply.send({ 
        status: 'Servicio A (Orquestador) 100% Operativo 🚀',
        base_de_datos: 'Conectada',
        hora_servidor: dbResult.rows[0].now
    });
  } catch (error) {
    return reply.code(500).send({ 
        status: 'Error crítico', 
        error: error.message 
    });
  }
});

// Función para arrancar el servidor
const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    console.log(`\n🎧 Orquestador escuchando en http://${host}:${port}`);
    console.log(`🔍 Prueba el estado abriendo: http://localhost:${port}/health\n`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();