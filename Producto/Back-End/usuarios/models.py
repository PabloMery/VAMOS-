import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from pgvector.django import VectorField
from django.utils.crypto import get_random_string

class UsuarioVAMOS(AbstractUser):
    # ── Datos personales ──────────────────────
    fecha_nacimiento = models.DateField(null=True, blank=True)
    telefono         = models.CharField(max_length=20, null=True, blank=True)

    # ── Google OAuth ──────────────────────────
    google_id        = models.CharField(max_length=255, null=True, blank=True, unique=True)
    avatar_url       = models.URLField(null=True, blank=True)

    # ── Preferencias VAMOS ────────────────────
    categorias_preferidas = models.JSONField(
        default=list,
        blank=True,
        help_text="Ej: ['Deportiva', 'Cultura', 'Feria']"
    )
    notificaciones_activas = models.BooleanField(
        default=True,
        help_text="El usuario acepta recibir notificaciones push"
    )

    class Meta:
        
        db_table = 'vamos_usuarios'

    def __str__(self):
        return f"{self.email} ({self.get_full_name()})"

class AsistenciaEvento(models.Model):
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    evento_id = models.CharField(max_length=255) 
    estado = models.CharField(max_length=50)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'vamos_asistencia'

#Logica de Listas, Grupos de Usuarios por eventos y Códigos de Invitación        
def generar_invite_code():
    return get_random_string(length=6).upper()

class EventoGuardado(models.Model):
    TIPO_CHOICES = [
        ('saved', 'Me Interesa'),
        ('confirmed', 'Vamos / Confirmado')
    ]
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='eventos_guardados')
    evento_id = models.CharField(max_length=255) # id_externo
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    fecha_guardado = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'vamos_eventos_guardados'
        unique_together = ('usuario', 'evento_id')
        
class Grupo(models.Model):
    evento_id = models.CharField(max_length=255)
    creador = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='grupos_creados')
    invite_code = models.CharField(max_length=20, default=generar_invite_code, unique=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'vamos_grupos'

class MiembroGrupo(models.Model):
    ESTADOS_MIEMBRO = [
        ('pendiente', 'Pendiente'),
        ('en_camino', 'En camino'),
        ('llegue', 'Llegué'),
        ('cancelado', 'Cancelado'),
        ('esperando', 'Esperando fuera')
    ]
    
    grupo = models.ForeignKey(Grupo, on_delete=models.CASCADE, related_name='miembros')
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    estado = models.CharField(max_length=20, choices=ESTADOS_MIEMBRO, default='pendiente')
    fecha_union = models.DateTimeField(auto_now_add=True)
    fecha_estado = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'vamos_miembros_grupo'
        unique_together = ('grupo', 'usuario')