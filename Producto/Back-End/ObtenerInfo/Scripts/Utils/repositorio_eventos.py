import json
import os

class RepositorioJSON:
    def __init__(self, ruta_archivo):
        self.ruta_archivo = ruta_archivo

    def guardar(self, eventos_nuevos):
        eventos_existentes = []
        
        if os.path.exists(self.ruta_archivo):
            try:
                with open(self.ruta_archivo, 'r', encoding='utf-8') as archivo:
                    eventos_existentes = json.load(archivo)
            except json.JSONDecodeError:
                pass

        # Lógica Upsert
        base_datos = {evento['id_externo']: evento for evento in eventos_existentes}
        for nuevo in eventos_nuevos:
            base_datos[nuevo['id_externo']] = nuevo 
            
        eventos_finales = list(base_datos.values())

        # Asegurar carpeta y guardar
        os.makedirs(os.path.dirname(self.ruta_archivo), exist_ok=True)

        with open(self.ruta_archivo, 'w', encoding='utf-8') as archivo:
            json.dump(eventos_finales, archivo, ensure_ascii=False, indent=2)
            
        return len(eventos_finales)