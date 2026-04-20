import os
import time
import psycopg2
from dotenv import load_dotenv
import google.generativeai as genai
from pgvector.psycopg2 import register_vector

# Cargar variables de entorno
load_dotenv()

# Configurar Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
MODEL_EMBEDDING = "models/gemini-embedding-001"
BATCH_SIZE = 20
SLEEP_SECONDS = 60

def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            dbname=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASS")
        )
        register_vector(conn)
        return conn
    except Exception as e:
        print(f"[ERROR CRÍTICO] No se pudo conectar a la BD: {e}")
        return None

def procesar_embeddings():
    conn = get_db_connection()
    if not conn:
        return

    try:
        cursor = conn.cursor()
        
        # 1. Buscar eventos sin vector usando la nueva llave primaria (id_externo)
        cursor.execute("""
            SELECT id_externo, descripcion 
            FROM eventos 
            WHERE embedding IS NULL AND descripcion IS NOT NULL 
            LIMIT %s;
        """, (BATCH_SIZE,))
        
        eventos = cursor.fetchall()
        
        if not eventos:
            print(f"[{time.strftime('%H:%M:%S')}] Sin eventos nuevos. Durmiendo {SLEEP_SECONDS}s...")
            return True

        print(f"[{time.strftime('%H:%M:%S')}] Procesando batch de {len(eventos)} eventos...")
        
        textos = [evento[1] for evento in eventos]
        
        # 2. Llamar a Gemini text-embedding-004
        resultado = genai.embed_content(
            model=MODEL_EMBEDDING,
            content=textos,
            task_type="RETRIEVAL_DOCUMENT"
        )
        
        embeddings = resultado['embedding']

        # 3. Actualizar la base de datos usando id_externo
        for i, evento in enumerate(eventos):
            id_ext = evento[0]
            vector = embeddings[i][:768]
            
            cursor.execute("""
                UPDATE eventos 
                SET embedding = %s 
                WHERE id_externo = %s;
            """, (vector, id_ext))
            
        conn.commit()
        print(f"[ÉXITO] {len(eventos)} eventos vectorizados y guardados.")
        
    except Exception as e:
        conn.rollback()
        print(f"[ERROR] Falló el procesamiento del batch: {e}")
    finally:
        cursor.close()
        conn.close()
        
    return False

if __name__ == "__main__":
    print("Iniciando Worker Asíncrono de Embeddings...")
    print("Presiona Ctrl+C para detener.")
    
    try:
        while True:
            durmiendo = procesar_embeddings()
            if durmiendo:
                time.sleep(SLEEP_SECONDS)
            else:
                time.sleep(1) # Pequeña pausa entre batches pesados
    except KeyboardInterrupt:
        print("\nWorker detenido manualmente.")