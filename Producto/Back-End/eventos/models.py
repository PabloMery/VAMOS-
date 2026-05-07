from django.db import models
from pgvector.django import VectorField

class Evento(models.Model):
    # Le ponemos default='0' solo para que el validador de Django no se queje
    id_externo = models.CharField(max_length=255, primary_key=True, default='0') 
    nombre_evento = models.CharField(max_length=255)
    
    embedding = VectorField(dimensions=768, null=True, blank=True)

    class Meta:
        db_table = 'eventos'
        managed = False 

    def __str__(self):
        return self.nombre_evento


class FechaEvento(models.Model):
    evento = models.ForeignKey(Evento, on_delete=models.CASCADE, db_column='id_evento')
    fecha = models.DateField()
    estado_dia = models.CharField(max_length=50)

    class Meta:
        db_table = 'fechas_eventos'
        managed = False 

    def __str__(self):
        return f"{self.evento.nombre_evento} - {self.fecha}"