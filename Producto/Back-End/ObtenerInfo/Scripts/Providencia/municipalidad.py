import requests
from bs4 import BeautifulSoup
import time
import sys
import os
import json
from datetime import datetime
import calendar

# Ajuste para que Python encuentre la carpeta 'Utils'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from Utils.geocoding_factory import FabricaGeolocalizacion
from Utils.repositorio_eventos import RepositorioJSON
from Utils.ai_parser import extraer_eventos_estructurados

URL_MUNICIPALIDAD = 'https://providencia.cl/provi/explora/actividades/del-mes/actividades-de-abril-2026'

# Obtenemos la hora actual del servidor/PC
AHORA = datetime.now()
HOY_STR = AHORA.strftime("%Y-%m-%d")

geolocalizador = FabricaGeolocalizacion.obtener_estrategia_automatica(__file__)
RUTA_JSON = FabricaGeolocalizacion.obtener_ruta_json(__file__)
repositorio = RepositorioJSON(RUTA_JSON)

def generar_fechas_evento(tipo, dias_semana, fechas_especificas):
    """Genera las fechas exactas del evento para el mes en curso"""
    año = AHORA.year
    mes = AHORA.month
    ultimo_dia = calendar.monthrange(año, mes)[1]
    
    fechas_generadas = []
    
    # Rango o Único (La IA ya nos dio las fechas exactas)
    if tipo in ["rango", "unico"] and fechas_especificas:
        return fechas_especificas

    # Mensual (Todos los días del mes)
    if tipo == "mensual":
        for dia in range(1, ultimo_dia + 1):
            fechas_generadas.append(datetime(año, mes, dia).strftime("%Y-%m-%d"))
        return fechas_generadas

    # Semanal (Se repite ciertos días, ej: "Martes", "Jueves")
    if tipo == "semanal" and dias_semana:
        mapa_dias = {"Lunes": 0, "Martes": 1, "Miércoles": 2, "Jueves": 3, 
                      "Viernes": 4, "Sábado": 5, "Domingo": 6}
        for dia in range(1, ultimo_dia + 1):
            fecha_obj = datetime(año, mes, dia)
            nombre_dia = list(mapa_dias.keys())[fecha_obj.weekday()]
            if nombre_dia in dias_semana:
                fechas_generadas.append(fecha_obj.strftime("%Y-%m-%d"))
        return fechas_generadas
            
    return fechas_generadas

def leer_historial_json():
    """Lee el JSON actual para recordar eventos pasados o detectar cancelaciones."""
    if os.path.exists(RUTA_JSON):
        with open(RUTA_JSON, 'r', encoding='utf-8') as f:
            try:
                historial = json.load(f)
                return {ev["id_externo"]: ev for ev in historial}
            except:
                return {}
    return {}

def orquestador_scraping():
    print(f"=== INICIANDO VAMOS ENGINE: {geolocalizador.nombre_comuna} ===")
    
    try:
        respuesta = requests.get(URL_MUNICIPALIDAD, headers={'User-Agent': 'Mozilla/5.0'})
        soup = BeautifulSoup(respuesta.text, 'html.parser')
    except Exception as e:
        print(f"❌ Error al conectar: {e}")
        return {"status": "error"}
    
    tabla = soup.find('table')
    if not tabla:
        return {"status": "error", "mensaje": "Tabla no encontrada"}

    filas = tabla.find_all('tr')[1:] 
    
    bd_local = leer_historial_json()
    ids_encontrados_hoy = set()
    
    print(f"-> Extrayendo cartelera municipal...")
    
    lote_eventos_para_ia = []
    
    # 1. Recolección de textos
    for fila in filas:
        columnas = fila.find_all('td')
        if len(columnas) >= 3:
            fecha_hora = columnas[0].get_text(separator=' ', strip=True)
            actividad_raw = columnas[1].get_text(separator=' ', strip=True)
            lugar_texto = columnas[2].get_text(separator=' ', strip=True)
            
            titulo_base = actividad_raw.replace("Más info aquí", "").strip()
            
            url_referencia = "null"
            etiqueta_a = columnas[1].find('a')
            if etiqueta_a and 'href' in etiqueta_a.attrs:
                url_referencia = etiqueta_a['href']
                if url_referencia.startswith('/'):
                    url_referencia = f"https://providencia.cl{url_referencia}"

            # Construimos un texto claro incluyendo la URL para que la IA la tome de aquí
            texto_completo = f"Actividad: {titulo_base} | Cuándo: {fecha_hora} | Dónde: {lugar_texto} | URL_Oficial: {url_referencia}"
            lote_eventos_para_ia.append(texto_completo)
            
    print(f"\n🧠 Enviando un lote de {len(lote_eventos_para_ia)} eventos a la IA en una sola llamada...")
    
    # --- PEAJE ÚNICO DE IA (Gasta 1 RPD) ---
    plantillas_ia = extraer_eventos_estructurados(lote_eventos_para_ia)
    
    print(f"✅ La IA estructuró {len(plantillas_ia)} plantillas de eventos. Geolocalizando e insertando en BD...")
    
    # 2. Procesamiento y Geolocalización
    for p in plantillas_ia:
        fechas_reales = generar_fechas_evento(p.get('tipo_recurrencia'), p.get('dias_semana', []), p.get('fechas_especificas', []))
    
        lugar_limpio = p.get('lugar_texto', '')
        coords = geolocalizador.obtener_coordenadas(lugar_limpio)

        nombre_limpio = p.get('nombre_evento', 'evento').lower()
        slug_nombre = nombre_limpio.replace(' ', '_')[:25]
        slug_lugar = lugar_limpio.lower().replace(' ', '_')[:8]
        hora_str = str(p.get('hora_inicio', '0000')).replace(':', '')
        
        id_unico = f"provi_{slug_nombre}_{slug_lugar}_{hora_str}"
        ids_encontrados_hoy.add(id_unico)

        # Lógica de Fechas (Solo 2 estados iniciales: Listado o Finalizado)
        fechas_con_estado = []
        for f in fechas_reales:
            estado_dia = "Finalizado" if f < HOY_STR else "Listado"
            fechas_con_estado.append({"fecha": f, "estado": estado_dia})

        # Fusión o Creación
        if id_unico in bd_local:
            fechas_existentes = {item['fecha']: item['estado'] for item in bd_local[id_unico]['fechas_evento']}
            for nuevo_dia in fechas_con_estado:
                # Si lo volvimos a ver, se asegura como Listado (sin tocar los ya finalizados)
                if nuevo_dia['fecha'] >= HOY_STR:
                    fechas_existentes[nuevo_dia['fecha']] = "Listado"
            
            bd_local[id_unico]['fechas_evento'] = [{"fecha": k, "estado": v} for k, v in fechas_existentes.items()]
            
            # Actualizamos la disponibilidad por si hoy se llenaron los cupos
            bd_local[id_unico]['cupos_llenos'] = p.get('cupos_llenos', False)
        
        else:
            bd_local[id_unico] = {
                "id_externo": id_unico,
                "nombre_evento": p.get('nombre_evento'),
                "fechas_evento": fechas_con_estado,
                "hora_inicio": p.get('hora_inicio'),
                "hora_fin": p.get('hora_fin'),
                "horario_variable": p.get('horario_variable', False),
                "categoria": p.get('categoria', 'Municipal'),
                "lugar_texto": lugar_limpio,
                "coordenadas": coords,
                "precio": p.get('precio'),
                "requiere_inscripcion": p.get('requiere_inscripcion', False),
                "cupos_llenos": p.get('cupos_llenos', False), # <--- Dimensión independiente
                "url_oficial": p.get('url_oficial'),
                "estado_evento": "Activo", # Se calcula en la limpieza
                "origen_datos": "Municipalidad de Providencia"
            }

    # 3. Lógica de "Limpieza / No Listados" y Estado Contenedor
    for id_viejo, evento_viejo in bd_local.items():
        hay_listados = False
        todas_pasadas = True

        for dia in evento_viejo['fechas_evento']:
            if dia['fecha'] < HOY_STR:
                dia['estado'] = "Finalizado"
            else:
                todas_pasadas = False
                # Si el evento NO fue visto por el scraper hoy, se marca "No Listado"
                if id_viejo not in ids_encontrados_hoy and dia['estado'] == "Listado":
                    dia['estado'] = "No Listado"

                if dia['estado'] == "Listado":
                    hay_listados = True

        # Resolver el estado del contenedor general
        if todas_pasadas:
            evento_viejo['estado_evento'] = "Finalizado"
        elif hay_listados:
            evento_viejo['estado_evento'] = "Activo"
        else:
            evento_viejo['estado_evento'] = "No Listado"

    # 4. Guardar BD Actualizada
    eventos_finales_json = list(bd_local.values())
    print(f"\n-> Guardando en: {RUTA_JSON}")
    
    eventos_finales_json.sort(key=lambda x: x['fechas_evento'][0]['fecha'] if x['fechas_evento'] else "9999-99-99")
    
    total_guardados = repositorio.guardar(eventos_finales_json)
    print(f"✅ ¡Proceso completado! Hay {total_guardados} eventos en total en la base de datos.")
    
    return {"status": "exito", "eventos_totales": total_guardados}

if __name__ == "__main__":
    orquestador_scraping()