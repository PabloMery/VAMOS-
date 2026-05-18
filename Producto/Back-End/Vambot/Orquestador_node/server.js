fastify.post('/chat', async (request, reply) => {
  // ==========================================
  // ROL 1: EL GUARDIA DE SEGURIDAD (Validar JWT)
  // ==========================================
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Acceso denegado. Falta el token.' });
  }

  const token = authHeader.split(' ')[1];
  let userId;

  try {
    const decodedToken = jwt.verify(token, process.env.DJANGO_SECRET_KEY);
    userId = decodedToken.user_id; 
  } catch (err) {
    return reply.code(401).send({ error: 'Token inválido o expirado.' });
  }

  const { mensaje } = request.body || {};
  if (!mensaje) {
    return reply.code(400).send({ error: 'El mensaje no puede estar vacío.' });
  }

  // ==========================================
  // ROL 2: EL BIBLIOTECARIO (Guardar en PostgreSQL)
  // ==========================================
  let sesionId;
  try {
    // 1. Buscar si ya hay una sesión de chat reciente para este usuario
    const sesionResult = await db.query(
      `SELECT id FROM sesiones_chat WHERE usuario_id = $1 ORDER BY creado_en DESC LIMIT 1`,
      [userId]
    );

    if (sesionResult.rows.length > 0) {
      sesionId = sesionResult.rows[0].id;
    } else {
      // 2. Si no tiene, le creamos una carpeta (sesión) nueva
      const nuevaSesion = await db.query(
        `INSERT INTO sesiones_chat (usuario_id) VALUES ($1) RETURNING id`,
        [userId]
      );
      sesionId = nuevaSesion.rows[0].id;
    }

    // 3. Guardar la burbuja de texto del Usuario
    await db.query(
      `INSERT INTO mensajes_chat (sesion_id, rol, contenido) VALUES ($1, $2, $3)`,
      [sesionId, 'user', mensaje]
    );
  } catch (dbError) {
    fastify.log.error('Error del Bibliotecario:', dbError);
    return reply.code(500).send({ error: 'Error al guardar el historial en la BD.' });
  }

  // ==========================================
  // ROL 3: EL CARTERO (Enviar a FastAPI / Gemini)
  // ==========================================
  try {
    console.log(`Enviando pregunta a Vambot IA: "${mensaje}"`);
    
    // Llamada HTTP al contenedor de Python (FastAPI)
    const iaResponse = await axios.post(`${process.env.DISCOVERY_SERVICE_URL}/ask`, {
      mensaje: mensaje
    });

    // Tu compañero estructuró la IA, extraemos el texto de su respuesta
    const textoRespuesta = iaResponse.data.respuesta || JSON.stringify(iaResponse.data);

    // 4. Guardar la respuesta de la IA en el historial
    await db.query(
      `INSERT INTO mensajes_chat (sesion_id, rol, contenido) VALUES ($1, $2, $3)`,
      [sesionId, 'assistant', textoRespuesta]
    );

    // 5. Devolver al celular
    return reply.send({
      sesion_id: sesionId,
      respuesta_agente: textoRespuesta
    });

  } catch (error) {
    fastify.log.error('Error de IA:', error.message);
    return reply.code(500).send({ error: 'El cerebro de IA está desconectado o falló.' });
  }
});