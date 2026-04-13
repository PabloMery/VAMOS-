import google.generativeai as genai
from django.conf import settings
import json

# Configuración inicial de la API Key (Asegúrate de tener GEMINI_API_KEY en tu settings.py)
genai.configure(api_key=settings.GEMINI_API_KEY)

def generar_instruccion_sistema(personalidad: str) -> str:
    """
    Define el comportamiento del chatbot basado en la variable seleccionada
    por el usuario en la app de React Native.
    """
    diccionario_personalidades = {
        "juvenil": "Usa un lenguaje relajado, modismos chilenos suaves y emojis. Eres como un amigo recomendando un panorama en la ciudad.",
        "formal": "Sé directo, educado y profesional. Enfócate en la precisión de los datos y horarios sin usar jerga ni emojis.",
        "entusiasta": "Muestra mucha energía, usa exclamaciones y motiva al usuario a salir y conocer los panoramas disponibles."
    }
    
    # Toma la personalidad solicitada, o usa 'juvenil' por defecto si hay un error
    tono_seleccionado = diccionario_personalidades.get(personalidad.lower(), diccionario_personalidades["juvenil"])
    
    # Este es el Grounding (Anclaje). La regla inquebrantable para evitar alucinaciones.
    instruccion_base = f"""
    Eres el asistente virtual oficial de la aplicación VAMOS?.
    Personalidad: {tono_seleccionado}
    
    RESTRICCIÓN CRÍTICA DE DATOS:
    Tu ÚNICA fuente de información es el bloque de texto etiquetado como 'CONTEXTO_POSTGRESQL'.
    - NUNCA inventes eventos ni recomiendes lugares que no estén en ese contexto.
    - Si el usuario pide algo (ej. "concierto de rock") y no está en el contexto, responde amablemente que no hay eventos de ese tipo registrados cerca de su ubicación.
    - Cuando recomiendes un evento, entrega el nombre, la fecha y aconseja visitar el enlace original para más detalles.
    """
    
    return instruccion_base


def consultar_agente_gemini(mensaje_usuario: str, eventos_db: list, personalidad: str) -> str:
    """
    Toma la pregunta del usuario, los eventos filtrados por lat/lon en la BD
    y construye el prompt final para la API de Gemini 1.5 Flash.
    """
    
    # 1. Preparar la instrucción del sistema
    system_instruction = generar_instruccion_sistema(personalidad)
    
    # 2. Instanciar el modelo (Gemini 1.5 Flash es el ideal para respuestas rápidas de chat)
    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=system_instruction
    )
    
    # 3. Convertir los datos de los eventos (que vienen de Django) a un formato legible por la IA
    # Asumimos que eventos_db es una lista de diccionarios con la info del scraper
    contexto_json = json.dumps(eventos_db, ensure_ascii=False, indent=2)
    
    # 4. Ensamblar el Prompt Final
    prompt_final = f"""
    CONTEXTO_POSTGRESQL (Eventos reales cercanos al usuario):
    {contexto_json}
    
    PREGUNTA DEL USUARIO:
    "{mensaje_usuario}"
    
    RESPUESTA DEL ASISTENTE:
    """
    
    # 5. Ejecutar la llamada a la API
    try:
        # Generamos la respuesta
        response = model.generate_content(prompt_final)
        return response.text
    
    except Exception as e:
        # Como QA Lead, este manejo de errores te servirá para que la app no se caiga
        # si se supera la cuota gratuita o hay problemas de red.
        print(f"Error en la API de Gemini: {e}")
        return "Lo siento, tuve un problema procesando la información. ¿Podrías intentar de nuevo en unos segundos?"