from rest_framework import serializers
from datetime import date
from .models import UsuarioVAMOS, EventoGuardado, Grupo, MiembroGrupo


class PerfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = UsuarioVAMOS
        fields = ['id', 'email', 'first_name', 'last_name',
                  'telefono', 'fecha_nacimiento', 'avatar_url',
                  'categorias_preferidas', 'notificaciones_activas']
        read_only_fields = ['id', 'email']

    def validate_fecha_nacimiento(self, value):
        if value is None:
            return value
        hoy = date.today()
        edad = hoy.year - value.year - (
            (hoy.month, hoy.day) < (value.month, value.day)
        )
        if edad < 18:
            raise serializers.ValidationError(
                "Debes tener al menos 18 años para usar VAMOS."
            )
        return value


class EventoGuardadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventoGuardado
        fields = ['id', 'evento_id', 'tipo', 'fecha_guardado']
        read_only_fields = ['id', 'fecha_guardado']


class MiembroGrupoSerializer(serializers.ModelSerializer):
    usuario_id = serializers.CharField(source='usuario.id', read_only=True)
    nombre_usuario = serializers.SerializerMethodField()
    grupo_id = serializers.CharField(source='grupo.id', read_only=True)

    class Meta:
        model = MiembroGrupo
        fields = ['id', 'grupo_id', 'usuario_id', 'nombre_usuario',
                  'estado', 'fecha_union', 'fecha_estado']

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
        fields = ['id', 'evento_id', 'creador_id', 'invite_code',
                  'fecha_creacion', 'miembros']