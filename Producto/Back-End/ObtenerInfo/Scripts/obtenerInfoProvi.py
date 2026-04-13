import requests
from bs4 import BeautifulSoup
import json

# ==========================================
# CONFIGURACIÓN
# ==========================================
URL_MUNICIPALIDAD = 'https://providencia.cl/provi/explora/actividades/del-mes/actividades-de-abril-2026'

def extraer_y_generar_json_sin_api():
    print("1. Descargando la cartelera de eventos...")
    headers = {'User-Agent': 'Mozilla/5.0'}
    respuesta = requests.get(URL_MUNICIPALIDAD, headers=headers)
    soup = BeautifulSoup(respuesta.text, 'html.parser')
    
    tabla = soup.find('table')
    if not tabla:
        print("❌ No se encontró ninguna tabla en la página.")
        return

    filas = tabla.find_all('tr')[1:] # Saltamos el encabezado
    eventos_finales = []
    
    print(f"2. Procesando {len(filas)} posibles eventos (sin geolocalización)...")
    
    for indice, fila in enumerate(filas):
        columnas = fila.find_all('td')
        
        if len(columnas) >= 3:
            # --- LIMPIEZA DE DATOS ---
            fecha_hora = columnas[0].get_text(separator=' ', strip=True)
            actividad_raw = columnas[1].get_text(separator=' ', strip=True)
            lugar_texto = columnas[2].get_text(separator=' ', strip=True)
            
            # Limpiamos el "Más info aquí" del título
            titulo = actividad_raw.replace("Más info aquí", "").strip()
            
            # Buscamos el enlace
            url_referencia = None
            etiqueta_a = columnas[1].find('a')
            if etiqueta_a and 'href' in etiqueta_a.attrs:
                url_referencia = etiqueta_a['href']
                if url_referencia.startswith('/'):
                    url_referencia = f"https://providencia.cl{url_referencia}"

            # --- ARMADO DEL JSON FINAL (Sin Google Maps) ---
            evento = {
                "id_externo": f"provi_{indice}",
                "titulo": titulo,
                "descripcion": fecha_hora, 
                "categoria": "municipal",  
                "estado_logistico": "confirmado",
                "lugar_texto": lugar_texto,
                # Dejamos la estructura lista, pero vacía por ahora
                "coordenadas": {
                    "latitud": None,
                    "longitud": None
                },
                "url_oficial": url_referencia
            }
            eventos_finales.append(evento)

    # 3. Guardar en archivo JSON
    print("\n3. Guardando resultados en 'eventos_vamos.json'...")
    with open('eventos_vamos.json', 'w', encoding='utf-8') as archivo:
        json.dump(eventos_finales, archivo, ensure_ascii=False, indent=2)
    
    print("✅ ¡Proceso completado con éxito! Revisa tu archivo eventos_vamos.json")

# --- EJECUCIÓN ---
if __name__ == "__main__":
    extraer_y_generar_json_sin_api()