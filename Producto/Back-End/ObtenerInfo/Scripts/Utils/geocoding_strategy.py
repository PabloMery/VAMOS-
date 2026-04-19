from abc import ABC
import os
import json
import googlemaps # <-- Nueva librería
from dotenv import load_dotenv

# Cargar las variables de entorno
ruta_actual = os.path.dirname(os.path.abspath(__file__)) 
ruta_obtener_info = os.path.dirname(os.path.dirname(ruta_actual)) 
ruta_env = os.path.join(ruta_obtener_info, '.env')
load_dotenv(ruta_env)

class EstrategiaGeolocalizacionBase(ABC):
    def __init__(self, nombre_comuna, archivo_alias):
        self.nombre_comuna = nombre_comuna
        
        # Inicializamos el cliente de Google Maps
        api_key = os.environ.get("GOOGLE_MAPS_API_KEY")
        if not api_key:
            print("⚠️ ¡ALERTA!: No se encontró GOOGLE_MAPS_API_KEY en el .env")
            
        self.gmaps = googlemaps.Client(key=api_key) if api_key else None
        self.alias_locales = self._cargar_alias(archivo_alias)

    def _cargar_alias(self, nombre_archivo):
        # Sube desde Utils -> Scripts -> ObtenerInfo -> Config
        ruta_base = os.path.dirname(os.path.abspath(__file__))
        ruta_archivo = os.path.join(ruta_base, '..', '..', 'Config', nombre_archivo)
        
        if os.path.exists(ruta_archivo):
            with open(ruta_archivo, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}

    def obtener_coordenadas(self, lugar_texto):
        if not lugar_texto or lugar_texto.lower() in ['online', 'virtual', 'nd']:
            return {"latitud": None, "longitud": None}
            
        # 1. Búsqueda rápida y gratuita en tu diccionario manual
        if lugar_texto in self.alias_locales:
            print(f"   💡 (Diccionario Local) Alias encontrado: {lugar_texto[:30]}...")
            return self.alias_locales[lugar_texto]
            
        # 2. Si no está en el diccionario, llamamos a Google Maps
        if not self.gmaps:
            return {"latitud": None, "longitud": None}
            
        direccion_busqueda = f"{lugar_texto}, {self.nombre_comuna}, Santiago, Chile"
        
        try:
            # Hacemos la consulta a la API
            resultado = self.gmaps.geocode(direccion_busqueda)
            
            if resultado:
                # Google Maps devuelve un arreglo, tomamos el primer resultado
                ubicacion = resultado[0]['geometry']['location']
                return {
                    "latitud": round(ubicacion['lat'], 6), 
                    "longitud": round(ubicacion['lng'], 6)
                }
            
            print(f"   ⚠️ Google Maps no encontró: {lugar_texto}")
            return {"latitud": None, "longitud": None}
            
        except Exception as e:
            print(f"   ❌ Error en API de Google Maps: {e}")
            return {"latitud": None, "longitud": None}

# ==========================================
# ESTRATEGIAS CONCRETAS
# ==========================================
class EstrategiaProvidencia(EstrategiaGeolocalizacionBase):
    def __init__(self):
        super().__init__(nombre_comuna="Providencia", archivo_alias="alias_providencia.json")