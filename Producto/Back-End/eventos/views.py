from datetime import date, timedelta
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.db.models import Prefetch

from .models import Evento, FechaEvento
from .serializers import EventoSerializer

class ListaEventosView(generics.ListAPIView):
    serializer_class = EventoSerializer

    def get_queryset(self):
        hoy = date.today()
        filtro_fecha = self.request.query_params.get('fecha', None)

        # 1. Regla de tu amigo: Solo eventos que tengan coordenadas para el mapa
        qs = Evento.objects.exclude(latitud__isnull=True).exclude(longitud__isnull=True)

        fecha_inicio = hoy
        fecha_fin = None

        if filtro_fecha == 'hoy':
            fecha_fin = hoy
        elif filtro_fecha == 'semana':
            fecha_fin = hoy + timedelta(days=7)
        elif filtro_fecha == 'mes':
            fecha_fin = hoy + timedelta(days=30)
        elif filtro_fecha:
            try:
                fecha_exacta = date.fromisoformat(filtro_fecha)
                fecha_inicio = fecha_exacta
                fecha_fin = fecha_exacta
            except ValueError:
                raise ValidationError({'error': 'Formato inválido. Usa YYYY-MM-DD, hoy, semana, o mes.'})

        if fecha_fin:
            qs = qs.filter(fechas__fecha__gte=fecha_inicio, fechas__fecha__lte=fecha_fin).distinct()
        else:
            qs = qs.filter(fechas__fecha__gte=fecha_inicio).distinct()

        return qs.prefetch_related(
            Prefetch('fechas', queryset=FechaEvento.objects.order_by('fecha'))
        )


class DetalleEventoView(generics.RetrieveAPIView):
    queryset = Evento.objects.all().prefetch_related('fechas')
    serializer_class = EventoSerializer
    lookup_field = 'id_externo'