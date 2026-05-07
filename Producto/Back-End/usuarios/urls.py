from django.urls import path
from .views import ActualizarEstadoAsistenciaView

urlpatterns = [
    path('mi-asistencia/', ActualizarEstadoAsistenciaView.as_view(), name='mi_asistencia'),
]