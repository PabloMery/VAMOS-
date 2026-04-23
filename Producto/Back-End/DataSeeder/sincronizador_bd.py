import psycopg2
import json
import os
from datetime import datetime

# Rutas
RUTA_ACTUAL = os.path.dirname(os.path.abspath(__file__))
RUTA_JSON = os.path.join(RUTA_ACTUAL, '..', 'ObtenerInfo', 'JSON', 'eventos_providencia.json')

# Credenciales DB
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "vamos_bd"
DB_USER = "freddy"
DB_PASS = "superpassword123"

def inicializar_base_de_datos(cursor):
    """Crea las tablas relacionadas en PostgreSQL si no existen."""
    cursor.execute('DROP TABLE IF EXISTS fechas_eventos CASCADE;')
    cursor.execute('DROP TABLE IF EXISTS eventos CASCADE;')
    
    # 1. Tabla Padre (El Evento principal)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS eventos (
            id_externo VARCHAR(255) PRIMARY KEY,
            nombre_evento VARCHAR(255),
            hora_inicio TIME,
            hora_fin TIME,
            horario_variable BOOLEAN,
            categoria VARCHAR(100),
            precio VARCHAR(100),
            requiere_inscripcion BOOLEAN,
            cupos_llenos BOOLEAN,
            lugar_texto TEXT,
            latitud DOUBLE PRECISION,
            longitud DOUBLE PRECISION,
            url_oficial TEXT,
            estado_general VARCHAR(50), -- Activo, Copado, No Listado, etc.
            origen_datos VARCHAR(100),
            ultima_actualizacion TIMESTAMP
        )
    ''')

    # 2. Tabla Hija (Las Fechas individuales)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS fechas_eventos (
            id SERIAL PRIMARY KEY,
            id_evento VARCHAR(255) REFERENCES eventos(id_externo) ON DELETE CASCADE,
            fecha DATE NOT NULL,
            estado_dia VARCHAR(50) NOT NULL,
            UNIQUE(id_evento, fecha)
        )
    ''')

def sincronizar_datos():
    print("=== INICIANDO WORKER DE SINCRONIZACIÓN (POSTGRESQL) ===")
    
    if not os.path.exists(RUTA_JSON):
        print(f"❌ Error: No se encontró el archivo JSON en:\n{RUTA_JSON}")
        return

    with open(RUTA_JSON, 'r', encoding='utf-8') as f:
        eventos_json = json.load(f)
    
    print(f"-> Se cargaron {len(eventos_json)} eventos desde el Staging Area.")

    try:
        conexion = psycopg2.connect(
            host=DB_HOST, port=DB_PORT, dbname=DB_NAME, user=DB_USER, password=DB_PASS
        )
        cursor = conexion.cursor()
        
        inicializar_base_de_datos(cursor)
        print("-> Sincronizando con PostgreSQL...")
        
        for ev in eventos_json:
            coords = ev.get('coordenadas', {})
            lat = coords.get('latitud') if coords else None
            lng = coords.get('longitud') if coords else None
            
            # 1. Insertar el Evento Padre (ON CONFLICT DO UPDATE)
            cursor.execute('''
                INSERT INTO eventos (
                    id_externo, nombre_evento, hora_inicio, hora_fin, 
                    horario_variable, categoria, precio, requiere_inscripcion, cupos_llenos,
                    lugar_texto, latitud, longitud, url_oficial, estado_general, 
                    origen_datos, ultima_actualizacion
                ) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id_externo) DO UPDATE SET
                    estado_general = EXCLUDED.estado_general,
                    hora_inicio = EXCLUDED.hora_inicio,
                    hora_fin = EXCLUDED.hora_fin,
                    cupos_llenos = EXCLUDED.cupos_llenos,
                    latitud = EXCLUDED.latitud,
                    longitud = EXCLUDED.longitud,
                    ultima_actualizacion = EXCLUDED.ultima_actualizacion
            ''', (
                ev['id_externo'], ev['nombre_evento'], ev['hora_inicio'], ev['hora_fin'], 
                ev.get('horario_variable', False), ev.get('categoria', 'Municipal'), ev.get('precio'), ev['requiere_inscripcion'], 
                ev.get('cupos_llenos', False), ev['lugar_texto'], lat, lng, ev['url_oficial'], 
                ev['estado_evento'], ev['origen_datos'], datetime.now()
            ))

            # 2. Insertar las Fechas Hijas
            fechas_lista = ev.get('fechas_evento', [])
            for fecha_obj in fechas_lista:
                cursor.execute('''
                    INSERT INTO fechas_eventos (
                        id_evento, fecha, estado_dia
                    )
                    VALUES (%s, %s, %s)
                    ON CONFLICT (id_evento, fecha) DO UPDATE SET
                        estado_dia = EXCLUDED.estado_dia
                ''', (
                    ev['id_externo'], fecha_obj['fecha'], fecha_obj['estado']
                ))

        conexion.commit()
        print(f"✅ ¡Éxito! Base de datos PostgreSQL actualizada con {len(eventos_json)} registros agrupados.")
        
    except Exception as e:
        if 'conexion' in locals():
            conexion.rollback()
        print(f"\n❌ ERROR CRÍTICO: {e}")
        
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conexion' in locals(): conexion.close()

if __name__ == "__main__":
    sincronizar_datos()