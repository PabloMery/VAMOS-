import psycopg2
import json
import os
from datetime import datetime

# ==========================================
# CONFIGURACIÓN DE RUTAS
# ==========================================
# Sube un nivel desde DataSeeder y entra a ObtenerInfo/JSON
RUTA_ACTUAL = os.path.dirname(os.path.abspath(__file__))
RUTA_JSON = os.path.join(RUTA_ACTUAL, '..', 'ObtenerInfo', 'JSON', 'eventos_providencia.json')

# ==========================================
# CREDENCIALES DE BASE DE DATOS (DOCKER)
# ==========================================
# Nota: En el futuro, esto se moverá a un archivo .env dentro de DataSeeder
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "vamos_bd"
DB_USER = "freddy"
DB_PASS = "superpassword123"

def inicializar_base_de_datos(cursor):
    """Crea la tabla en PostgreSQL si no existe."""
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS eventos (
            id_externo VARCHAR(255) PRIMARY KEY,
            nombre_evento VARCHAR(255),
            fecha_evento DATE,
            hora_inicio TIME,
            hora_fin TIME,
            horario_variable BOOLEAN,
            categoria VARCHAR(100),
            precio VARCHAR(100),
            requiere_inscripcion BOOLEAN,
            lugar_texto TEXT,
            latitud DOUBLE PRECISION,
            longitud DOUBLE PRECISION,
            url_oficial TEXT,
            estado_evento VARCHAR(50),
            origen_datos VARCHAR(100),
            ultima_actualizacion TIMESTAMP
        )
    ''')

def sincronizar_datos():
    print("=== INICIANDO WORKER DE SINCRONIZACIÓN (POSTGRESQL) ===")
    
    # 1. Verificar que el JSON exista
    if not os.path.exists(RUTA_JSON):
        print(f"❌ Error: No se encontró el archivo JSON en la ruta:\n{RUTA_JSON}")
        print("Asegúrate de ejecutar primero el scraper en ObtenerInfo.")
        return

    # 2. Cargar datos del JSON (Staging Area)
    with open(RUTA_JSON, 'r', encoding='utf-8') as f:
        eventos_json = json.load(f)
    
    print(f"-> Se cargaron {len(eventos_json)} eventos desde el Staging Area.")

    # 3. Conectar y Sincronizar con PostgreSQL
    try:
        conexion = psycopg2.connect(
            host=DB_HOST, port=DB_PORT, dbname=DB_NAME, user=DB_USER, password=DB_PASS
        )
        cursor = conexion.cursor()
        
        inicializar_base_de_datos(cursor)
        print("-> Sincronizando con PostgreSQL...")
        
        for ev in eventos_json:
            # Extracción segura de coordenadas
            coords = ev.get('coordenadas', {})
            lat = coords.get('latitud') if coords else None
            lng = coords.get('longitud') if coords else None
            
            # Upsert en PostgreSQL (ON CONFLICT)
            cursor.execute('''
                INSERT INTO eventos (
                    id_externo, nombre_evento, fecha_evento, hora_inicio, hora_fin, 
                    horario_variable, categoria, precio, requiere_inscripcion, 
                    lugar_texto, latitud, longitud, url_oficial, estado_evento, 
                    origen_datos, ultima_actualizacion
                ) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id_externo) DO UPDATE SET
                    estado_evento = EXCLUDED.estado_evento,
                    hora_inicio = EXCLUDED.hora_inicio,
                    hora_fin = EXCLUDED.hora_fin,
                    latitud = EXCLUDED.latitud,
                    longitud = EXCLUDED.longitud,
                    ultima_actualizacion = EXCLUDED.ultima_actualizacion
            ''', (
                ev['id_externo'], ev['nombre_evento'], ev['fecha_evento'], 
                ev['hora_inicio'], ev['hora_fin'], ev['horario_variable'], 
                ev['categoria'], ev['precio'], ev['requiere_inscripcion'], 
                ev['lugar_texto'], lat, lng, ev['url_oficial'], 
                ev['estado_evento'], ev['origen_datos'], datetime.now()
            ))

        # Confirmar los cambios si todo el ciclo for terminó sin errores
        conexion.commit()
        print(f"✅ ¡Éxito! Base de datos PostgreSQL actualizada con {len(eventos_json)} registros.")
        
    except Exception as e:
        # Si ocurre CUALQUIER error, deshacemos todos los cambios a medias
        if 'conexion' in locals():
            conexion.rollback()
        print(f"\n❌ ERROR CRÍTICO: {e}")
        print("-> Rollback ejecutado. La base de datos se mantiene intacta.")
        
    finally:
        # Cerrar conexiones siempre, haya error o no
        if 'cursor' in locals():
            cursor.close()
        if 'conexion' in locals():
            conexion.close()

if __name__ == "__main__":
    sincronizar_datos()