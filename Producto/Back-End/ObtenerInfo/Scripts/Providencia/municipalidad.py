import requests
from bs4 import BeautifulSoup
import time
import sys
import os

# 1. Ajuste para que Python encuentre la carpeta 'Utils'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 2. Importar nuestros Patrones de Diseño
from Utils.geocoding_factory import FabricaGeolocalizacion
from Utils.repositorio_eventos import RepositorioJSON

URL_MUNICIPALIDAD = 'https://providencia.cl/provi/explora/actividades/del-mes/actividades-de-abril-2026'

# 3. Inicializar herramientas (¡Todo automático!)
geolocalizador = FabricaGeolocalizacion.obtener_estrategia_automatica(__file__)
RUTA_JSON = FabricaGeolocalizacion.obtener_ruta_json(__file__)
repositorio = RepositorioJSON(RUTA_JSON)

def extraer_datos_municipalidad():
    print(f"=== INICIANDO EXTRACCIÓN: {geolocalizador.nombre_comuna} ===")
    headers = {'User-Agent': 'Mozilla/5.0'}
    respuesta = requests.get(URL_MUNICIPALIDAD, headers=headers)
    soup = BeautifulSoup(respuesta.text, 'html.parser')
    
    tabla = soup.find('table')
    if not tabla:
        print("❌ Error: No se encontró la tabla de eventos.")
        return

    filas = tabla.find_all('tr')[1:] 
    eventos_nuevos = []
    
    print(f"-> Procesando tabla y buscando coordenadas...")
    
    for fila in filas:
        columnas = fila.find_all('td')
        if len(columnas) >= 3:
            fecha_hora = columnas[0].get_text(separator=' ', strip=True)
            actividad_raw = columnas[1].get_text(separator=' ', strip=True)
            lugar_texto_original = columnas[2].get_text(separator=' ', strip=True)
            
            titulo = actividad_raw.replace("Más info aquí", "").strip()
            
            url_referencia = None
            etiqueta_a = columnas[1].find('a')
            if etiqueta_a and 'href' in etiqueta_a.attrs:
                url_referencia = etiqueta_a['href']
                if url_referencia.startswith('/'):
                    url_referencia = f"https://providencia.cl{url_referencia}"

            # Separador por punto y coma (Multiplicador de eventos)
            lugares_separados = lugar_texto_original.split(';')
            
            for lugar_individual in lugares_separados:
                lugar_limpio = lugar_individual.strip()
                if not lugar_limpio: continue 
                
                print(f"   📍 Ubicando: {lugar_limpio[:40]}...")
                
                # Usamos nuestra estrategia inteligente
                coordenadas = geolocalizador.obtener_coordenadas(lugar_limpio)
                
                # Si no está en nuestros alias manuales, pausamos para no saturar Nominatim
                if lugar_limpio not in geolocalizador.alias_locales:
                    time.sleep(1.5) 

                titulo_id = titulo.replace(' ', '_').lower()[:10]
                lugar_id = lugar_limpio.replace(' ', '_').lower()[:10]
                id_unico = f"provi_{titulo_id}_{lugar_id}"

                evento = {
                    "id_externo": id_unico,
                    "titulo": titulo,
                    "descripcion": fecha_hora, 
                    "categoria": "municipal",  
                    "estado_logistico": "confirmado",
                    "lugar_texto": lugar_limpio, 
                    "coordenadas": coordenadas,
                    "url_oficial": url_referencia
                }
                eventos_nuevos.append(evento)

    print(f"-> Guardando en: {RUTA_JSON}")
    total_guardados = repositorio.guardar(eventos_nuevos)
    print(f"✅ ¡Proceso completado! Hay {total_guardados} eventos registrados.")

if __name__ == "__main__":
    extraer_datos_municipalidad()