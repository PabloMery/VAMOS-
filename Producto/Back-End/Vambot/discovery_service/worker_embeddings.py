import os
import time
import logging
import psycopg2
from psycopg2 import OperationalError as PgOperationalError
from dotenv import load_dotenv
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted, ServiceUnavailable, DeadlineExceeded
from pgvector.psycopg2 import register_vector

# ──────────────────────────────────────────────
# 1. Configuración Inicial
# ──────────────────────────────────────────────
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("embedding-worker")

MODEL_EMBEDDING = "models/gemini-embedding-001"
BATCH_SIZE      = 20
SLEEP_SECONDS   = 60

# ──────────────────────────────────────────────
# 2. Conexión a BD (sin pool, worker es single-thread)
# ──────────────────────────────────────────────
def get_db_connection():
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASS"),
        connect_timeout=5,
    )
    register_vector(conn)
    return conn

# ──────────────────────────────────────────────
# 3. Construcción del texto a vectorizar
# ──────────────────────────────────────────────
def construir_texto_embedding(nombre: str, categoria: str, lugar: str) -> str:

    partes = [
        nombre    or "",
        categoria or "",
        lugar     or "",
    ]
    return " | ".join(p for p in partes if p.strip())

# ──────────────────────────────────────────────
# 4. Procesamiento del batch
# ──────────────────────────────────────────────
def procesar_embeddings() -> bool:
    try:
        conn = get_db_connection()
    except PgOperationalError as e:
        logger.error("No se pudo conectar a la BD: %s", e)
        return True  
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id_externo, nombre_evento, categoria, lugar_texto
            FROM eventos
            WHERE embedding IS NULL
              AND nombre_evento IS NOT NULL
            LIMIT %s;
            """
        , (BATCH_SIZE,))
        eventos = cursor.fetchall()
        if not eventos:
            logger.info("Sin eventos nuevos. Durmiendo %ss...", SLEEP_SECONDS)
            return True
        logger.info("Procesando batch de %d eventos...", len(eventos))
        textos = [
            construir_texto_embedding(r[1], r[2], r[3])
            for r in eventos
        ]
        try:
            resultado   = genai.embed_content(
                model=MODEL_EMBEDDING,
                content=textos,
                task_type="RETRIEVAL_DOCUMENT",
            )
            embeddings = resultado["embedding"]

        except ResourceExhausted as e:
            logger.warning("Gemini rate limit. Durmiendo %ss antes de reintentar: %s",
                           SLEEP_SECONDS, e)
            return True  # dormir y reintentar
        except (DeadlineExceeded, ServiceUnavailable) as e:
            logger.error("Gemini no disponible: %s", e)
            return True  # dormir y reintentar

        # — Actualizar BD —
        for i, evento in enumerate(eventos):
            cursor.execute("""
                UPDATE eventos
                SET embedding = %s
                WHERE id_externo = %s;
            """, (embeddings[i][:768], evento[0]))

        conn.commit()
        logger.info("✅ %d eventos vectorizados y guardados.", len(eventos))
        return False  # puede haber más batches, continuar pronto

    except Exception as e:
        conn.rollback()
        logger.error("Error inesperado en el batch: %s", e)
        return True  # dormir y reintentar

    finally:
        cursor.close()
        conn.close()

# ──────────────────────────────────────────────
# 5. Loop Principal
# ──────────────────────────────────────────────
if __name__ == "__main__":
    logger.info("Iniciando Worker de Embeddings. Presiona Ctrl+C para detener.")

    try:
        while True:
            debe_dormir = procesar_embeddings()
            time.sleep(SLEEP_SECONDS if debe_dormir else 1)
    except KeyboardInterrupt:
        logger.info("Worker detenido manualmente.")