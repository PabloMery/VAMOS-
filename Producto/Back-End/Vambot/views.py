from django.shortcuts import render
from .ai_services import consultar_agente_gemini
# from .models import Evento

def chat_endpoint(request):
    # 1. Recibir datos de React Native
    mensaje = request.POST.get('mensaje')
    personalidad = request.POST.get('personalidad', 'juvenil')
    lat = request.POST.get('lat')
    lon = request.POST.get('lon')
    
    # 2. Tu compañero de Backend filtra la base de datos (PostGIS)
    # eventos_cercanos = Evento.objects.filter(...) # Lógica geográfica aquí
    
    # Datos simulados para probar tu integración mientras el backend conecta la BD
    eventos_prueba = [
        {"nombre": "Festival de Jazz Comunal", "categoria": "Música", "fecha": "2026-04-15 20:00", "url": "https://muni.cl/jazz"},
        {"nombre": "Teatro al aire libre", "categoria": "Teatro", "fecha": "2026-04-16 19:30", "url": "https://muni.cl/teatro"}
    ]
    
    # 3. Llamas a tu módulo de IA
    respuesta_ia = consultar_agente_gemini(
        mensaje_usuario=mensaje, 
        eventos_db=eventos_prueba, 
        personalidad=personalidad
    )
    
    # 4. Devolver respuesta a la app móvil
    return JsonResponse({"respuesta": respuesta_ia})