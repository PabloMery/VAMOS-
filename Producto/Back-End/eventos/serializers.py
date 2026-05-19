from rest_framework import serializers
from .models import Evento, FechaEvento
from django.utils import timezone

class FechaEventoSerializer(serializers.ModelSerializer):
    class Meta:
        model = FechaEvento
        fields = ['fecha', 'estado_dia']

class EventoSerializer(serializers.ModelSerializer):
    fechas_evento = FechaEventoSerializer(many=True, read_only=True, source='fechas')
    
    coordenadas = serializers.SerializerMethodField()
    precio_numerico = serializers.SerializerMethodField()
    
    fecha_proxima = serializers.SerializerMethodField()

    class Meta:
        model = Evento
        fields = [
            'id_externo', 'nombre_evento', 'fechas_evento', 'fecha_proxima',
            'hora_inicio', 'hora_fin', 'horario_variable', 'categoria', 
            'precio_numerico', 'requiere_inscripcion', 'cupos_llenos', 
            'lugar_texto', 'coordenadas', 'url_oficial', 'estado_general', 
            'origen_datos'
        ]

    def get_coordenadas(self, obj):
        if obj.latitud is not None and obj.longitud is not None:
            return {
                'latitud': obj.latitud,
                'longitud': obj.longitud,
            }
        return None

    def get_precio_numerico(self, obj):
        if obj.precio is None or str(obj.precio).strip() == '':
            return None
        
        texto_precio = str(obj.precio).lower().strip()
        if texto_precio in ('gratis', 'gratuito', 'free', '0'):
            return 0
            
        try:
            return int(float(texto_precio.replace('.', '').replace(',', '.')))
        except (ValueError, AttributeError):
            return None

    def get_fecha_proxima(self, obj):
        todas_las_fechas = list(obj.fechas.all()) 
        if not todas_las_fechas:
            return None
            
        hoy = timezone.now().date()   
        futuras = [f for f in todas_las_fechas if f.fecha >= hoy]
        
        if futuras:
            futuras.sort(key=lambda x: x.fecha)
            return str(futuras[0].fecha)
            
        todas_las_fechas.sort(key=lambda x: x.fecha, reverse=True)
        return str(todas_las_fechas[0].fecha)