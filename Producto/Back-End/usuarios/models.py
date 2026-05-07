from django.db import models
from django.contrib.auth.models import AbstractUser

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
        # Esto obliga a Django a nombrar la tabla exactamente así en la BD
        db_table = 'usuarios_vamos'

    def __str__(self):
        return f"{self.email} ({self.get_full_name()})"