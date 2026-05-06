from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth con Google (viene del celular)
    path('auth/google/',  views.google_auth,          name='google-auth'),

    # Refresh del JWT cuando expira
    path('auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),

    # Perfil del usuario autenticado
    path('perfil/',       views.perfil_usuario,       name='perfil-usuario'),
]