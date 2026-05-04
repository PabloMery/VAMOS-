import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Cargar .env
ruta_actual = os.path.dirname(os.path.abspath(__file__)) 
ruta_obtener_info = os.path.dirname(os.path.dirname(ruta_actual)) 
ruta_env = os.path.join(ruta_obtener_info, '.env')

load_dotenv(ruta_env)

mi_clave = os.environ.get("GEMINI_API_KEY")

print(f"🔑 VERIFICACIÓN: Usando la API Key de AI Studio...")

if not mi_clave:
    print("⚠️ ¡ALERTA CRÍTICA!: No se encontró la API Key en el archivo .env.")

client = genai.Client(api_key=mi_clave)

def extraer_eventos_estructurados(lista_textos_brutos):
    # Unimos todos los eventos en un solo gran bloque de texto separándolos claramente
    texto_combinado = "\n\n--- SIGUIENTE EVENTO ---\n\n".join(lista_textos_brutos)
    
    prompt = f"""
    Eres un estructurador de datos experto. A continuación te entregaré una lista completa de eventos municipales de un mes. 
    Tu trabajo es procesarlos TODOS y devolver un ÚNICO arreglo (array) de objetos JSON que contenga todos los eventos encontrados.

    LISTA DE EVENTOS ORIGINALES:
    {texto_combinado}

    REGLAS CRÍTICAS DE SEPARACIÓN (Crea objetos INDEPENDIENTES si ocurre esto):
    1. PROCESA TODOS LOS EVENTOS: No omitas ninguno de la lista proporcionada.
    2. MÚLTIPLES LUGARES/EVENTOS: Si el texto agrupa varios lugares separados por ";" (ej. "Feria A; Feria B"), CREA UN OBJETO SEPARADO para cada uno.
    3. HORARIOS MÚLTIPLES: Si hay varios bloques de horario el mismo día, crea un objeto por cada bloque.
    4. LUGARES DINÁMICOS: Si el lugar cambia según el día, sepáralos en distintos objetos.

    REGLAS DE PROPIEDADES:
    - "nombre_evento": Nombre limpio. Elimina "GRATUITA" o "GRATIS" del título.
    - "categoria": ESTRICTAMENTE "Deportiva", "Cultura" o "Feria".
    - "tipo_recurrencia": "mensual" (todo el mes), "semanal" (días fijos), "rango" (fechas consecutivas), o "unico" (un solo día).
    - "hora_inicio" / "hora_fin": Formato "HH:MM". Si dice "Según actividad" o no hay hora clara, pon null.
    - "horario_variable": true si depende de la actividad/no hay hora fija, false si el horario está claro.
    - "precio": Si hay monto, ponlo. Si dice gratis/liberada, pon "Gratuito". Si varía, pon "Consultar precio en lugar". Si no menciona nada, pon null.
    - "requiere_inscripcion": true si menciona cupos, inscripciones o correos de reserva. false si no.
    - "cupos_llenos": true SOLO SI el texto dice explícitamente "Agotado", "Cupos llenos", "Sin cupos" o similar. false en caso contrario.
    - "url_oficial": Extrae la URL que viene al final de cada bloque de texto original. Si dice 'null', pon null.

    ESTRUCTURA EXACTA DEL JSON ESPERADO (Array de objetos):
    [
      {{
        "nombre_evento": "String",
        "categoria": "Deportiva | Cultura | Feria",
        "lugar_texto": "Dirección específica para esta iteración",
        "hora_inicio": "HH:MM o null",
        "hora_fin": "HH:MM o null",
        "horario_variable": true o false,
        "tipo_recurrencia": "mensual | semanal | rango | unico",
        "dias_semana": ["Lunes", "Martes"], 
        "fechas_especificas": ["2026-04-27"], 
        "precio": "String o null",
        "requiere_inscripcion": true o false,
        "cupos_llenos": true o false,
        "url_oficial": "String o null"
      }}
    ]
    
    Devuelve ÚNICAMENTE un JSON Array válido, sin texto adicional ni bloques de markdown.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )
        
        texto_respuesta = response.text.strip()
        if texto_respuesta.startswith("```json"):
             texto_respuesta = texto_respuesta[7:-3].strip()
        elif texto_respuesta.startswith("```"):
             texto_respuesta = texto_respuesta[3:-3].strip()
             
        datos = json.loads(texto_respuesta)
        return datos if isinstance(datos, list) else [datos]
            
    except Exception as e:
        print(f"❌ Error al procesar lote con IA: {e}")
        return []