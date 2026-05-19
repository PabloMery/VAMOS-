from django.db import models
from pgvector.django import VectorField

class Evento(models.Model):
    id_externo = models.CharField(max_length=255, primary_key=True)
    nombre_evento = models.CharField(max_length=255, null=True, blank=True)
    hora_inicio = models.TimeField(null=True, blank=True)
    hora_fin = models.TimeField(null=True, blank=True)
    horario_variable = models.BooleanField(null=True, blank=True)
    categoria = models.CharField(max_length=100, null=True, blank=True)
    precio = models.CharField(max_length=100, null=True, blank=True)
    requiere_inscripcion = models.BooleanField(null=True, blank=True)
    cupos_llenos = models.BooleanField(null=True, blank=True)
    lugar_texto = models.TextField(null=True, blank=True)
    latitud = models.FloatField(null=True, blank=True)
    longitud = models.FloatField(null=True, blank=True)
    url_oficial = models.TextField(null=True, blank=True)
    estado_general = models.CharField(max_length=50, null=True, blank=True)
    origen_datos = models.CharField(max_length=100, null=True, blank=True)
    ultima_actualizacion = models.DateTimeField(null=True, blank=True)
    embedding = VectorField(dimensions=768, null=True, blank=True)

    class Meta:
        db_table = 'eventos'
        managed = False 

    def __str__(self):
        return self.nombre_evento


class FechaEvento(models.Model):
    evento = models.ForeignKey(Evento, on_delete=models.CASCADE, db_column='id_evento', related_name='fechas',)
    fecha = models.DateField()
    estado_dia = models.CharField(max_length=50)

    class Meta:
        db_table = 'fechas_eventos'
        managed = False 
        unique_together = (('evento', 'fecha'),)

    def __str__(self):
        return f"{self.evento.nombre_evento} - {self.fecha}"