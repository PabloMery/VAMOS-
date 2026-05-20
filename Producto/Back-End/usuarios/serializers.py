from rest_framework import serializers
from .models import Grupo, MiembroGrupo, EventoGuardado

class MiembroGrupoSerializer(serializers.ModelSerializer):
    usuario_id = serializers.CharField(source='usuario.id', read_only=True)
    nombre_usuario = serializers.SerializerMethodField()
    grupo_id = serializers.CharField(source='grupo.id', read_only=True)

    class Meta:
        model = MiembroGrupo
        fields = ['id', 'grupo_id', 'usuario_id', 'nombre_usuario', 'estado', 'fecha_union', 'fecha_estado']

    def get_nombre_usuario(self, obj):
        return obj.usuario.get_full_name() or obj.usuario.username

class GrupoSerializer(serializers.ModelSerializer):
    creador_id = serializers.CharField(source='creador.id', read_only=True)

    class Meta:
        model = Grupo
        fields = ['id', 'evento_id', 'creador_id', 'invite_code', 'fecha_creacion']

class GrupoConMiembrosSerializer(serializers.ModelSerializer):
    creador_id = serializers.CharField(source='creador.id', read_only=True)
    miembros = MiembroGrupoSerializer(many=True, read_only=True)

    class Meta:
        model = Grupo
        fields = ['id', 'evento_id', 'creador_id', 'invite_code', 'fecha_creacion', 'miembros']