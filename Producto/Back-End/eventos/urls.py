from django.urls import path
from . import views

urlpatterns = [
    path('', views.ListaEventosView.as_view(), name='lista_eventos'), 
    path('<str:id_externo>/', views.DetalleEventoView.as_view(), name='detalle_evento'),
]