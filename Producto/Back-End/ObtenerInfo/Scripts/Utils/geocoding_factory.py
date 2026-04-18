import os
from .geocoding_strategy import EstrategiaProvidencia

class FabricaGeolocalizacion:
    @staticmethod
    def obtener_estrategia_automatica(ruta_del_script_llamador):
        ruta_absoluta = os.path.abspath(ruta_del_script_llamador)
        carpeta_padre = os.path.basename(os.path.dirname(ruta_absoluta))
        comuna_limpia = carpeta_padre.lower().strip()
        
        if comuna_limpia == "providencia":
            return EstrategiaProvidencia()
        else:
            raise ValueError(f"❌ Comuna no soportada: '{carpeta_padre}'")

    @staticmethod
    def obtener_ruta_json(ruta_del_script_llamador):
        ruta_absoluta = os.path.abspath(ruta_del_script_llamador)
        carpeta_padre = os.path.basename(os.path.dirname(ruta_absoluta))
        comuna_limpia = carpeta_padre.lower().strip()
        
        # Sube desde Scripts/Comuna -> Scripts -> ObtenerInfo -> JSON
        directorio_base = os.path.dirname(os.path.dirname(os.path.dirname(ruta_absoluta)))
        return os.path.join(directorio_base, 'JSON', f'eventos_{comuna_limpia}.json')