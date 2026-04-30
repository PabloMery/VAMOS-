from django.db import models
from django.contrib.auth.models import AbstractUser

class UsuarioVAMOS(AbstractUser):
    fecha_nacimiento = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.username