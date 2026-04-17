from abc import ABC
import os
import json
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut

class EstrategiaGeolocalizacionBase(ABC):
    def __init__(self, nombre_comuna, archivo_alias):
        self.nombre_comuna = nombre_comuna
        self.geolocalizador = Nominatim(user_agent="proyecto_vamos_scraper_cl")
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
        if not lugar_texto or lugar_texto.lower() in ['online', 'virtual']:
            return {"latitud": None, "longitud": None}
            
        if lugar_texto in self.alias_locales:
            print(f"   💡 (Estrategia {self.nombre_comuna}) ¡Alias encontrado!: {lugar_texto}")
            return self.alias_locales[lugar_texto]
            
        direccion_busqueda = f"{lugar_texto}, {self.nombre_comuna}, Santiago, Chile"
        
        try:
            ubicacion = self.geolocalizador.geocode(direccion_busqueda, timeout=10)
            if ubicacion:
                return {"latitud": round(ubicacion.latitude, 6), "longitud": round(ubicacion.longitude, 6)}
            return {"latitud": None, "longitud": None}
        except (GeocoderTimedOut, Exception):
            return {"latitud": None, "longitud": None}

class EstrategiaProvidencia(EstrategiaGeolocalizacionBase):
    def __init__(self):
        super().__init__(nombre_comuna="Providencia", archivo_alias="alias_providencia.json")