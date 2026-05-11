from rest_framework import serializers
from .models import AsistenciaEvento

class AsistenciaEventoSerializer(serializers.ModelSerializer):
    class Meta:
        model = AsistenciaEvento
        fields = ['id', 'evento_id', 'estado', 'fecha_actualizacion']
        read_only_fields = ['id', 'fecha_actualizacion']

    def validate_estado(self, value):
        return value.upper()