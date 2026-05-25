from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth con Google (viene del celular)
    path('auth/google/',  views.google_auth,          name='google-auth'),

    # Refresh del JWT cuando expira
    path('auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),

    # Perfil del usuario autenticado
    path('perfil/', views.perfil_usuario, name='perfil-usuario'),
    
    #Rutas para Listado de Eventos, Grupos de Usuarios por eventos y Códigos de Invitación
    path('eventos/mis-eventos/', views.MisEventosGuardadosView.as_view(), name='mis_eventos'),
    path('eventos/guardar/', views.GuardarEventoView.as_view(), name='guardar_evento'), # Para "Me interesa"
    
    path('grupos/', views.CreateGroupView.as_view(), name='crear_grupo'),
    path('grupos/unirse/', views.JoinGroupByCodeView.as_view(), name='unirse_grupo'),
    path('grupos/mis-grupos/', views.GetMyGroupsView.as_view(), name='mis_grupos'),
    path('grupos/<int:grupo_id>/', views.GetGroupDetailView.as_view(), name='detalle_grupo'),
    path('grupos/<int:grupo_id>/estado/', views.UpdateMyStatusView.as_view(), name='actualizar_estado'),
    path('grupos/<int:grupo_id>/salir/', views.LeaveGroupView.as_view(), name='salir_grupo'),
]    