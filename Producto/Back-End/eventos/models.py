from django.db import models
from pgvector.django import VectorField

class Evento(models.Model):
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField()
    
    # Aquí se guardará la magia de Vambot (Gemini usa 768 dimensiones por defecto)
    embedding = VectorField(dimensions=768, null=True, blank=True)

    def __str__(self):
        return self.nombre