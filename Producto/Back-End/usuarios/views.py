from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.conf import settings
from .models import UsuarioVAMOS

def generar_tokens_para_usuario(usuario):
    """Genera el par de tokens JWT para un usuario dado."""
    refresh = RefreshToken.for_user(usuario)
    return {
        'refresh': str(refresh),
        'access':  str(refresh.access_token),
    }

@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth(request):
    """
    Recibe el ID Token de Google desde la app Android,
    lo verifica, y devuelve un JWT propio de VAMOS.
    """
    id_token_google = request.data.get('id_token')

    if not id_token_google:
        return Response(
            {'error': 'Se requiere el id_token de Google.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # — Verificar el token con Google —
        datos_google = id_token.verify_oauth2_token(
            id_token_google,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID_ANDROID
        )

    except ValueError as e:
        return Response(
            {'error': f'Token de Google inválido: {str(e)}'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # — Extraer datos del usuario —
    google_id  = datos_google.get('sub')        # ID único de Google
    email      = datos_google.get('email')
    nombre     = datos_google.get('given_name', '')
    apellido   = datos_google.get('family_name', '')
    avatar_url = datos_google.get('picture')

    if not email:
        return Response(
            {'error': 'No se pudo obtener el email desde Google.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # — Buscar o crear el usuario —
    usuario, creado = UsuarioVAMOS.objects.get_or_create(
        email=email,
        defaults={
            'username':   email.split('@')[0],
            'first_name': nombre,
            'last_name':  apellido,
            'google_id':  google_id,
            'avatar_url': avatar_url,
        }
    )

    # Si el usuario ya existía, actualizamos sus datos de Google
    if not creado:
        usuario.google_id  = google_id
        usuario.avatar_url = avatar_url
        usuario.save()

    # — Devolver JWT —
    tokens = generar_tokens_para_usuario(usuario)
    return Response({
        'access':  tokens['access'],
        'refresh': tokens['refresh'],
        'usuario': {
            'id':         usuario.id,
            'email':      usuario.email,
            'nombre':     usuario.first_name,
            'apellido':   usuario.last_name,
            'avatar_url': usuario.avatar_url,
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def perfil_usuario(request):
    """
    Endpoint protegido de ejemplo.
    Solo accesible con un JWT válido en el header.
    """
    usuario = request.user
    return Response({
        'id':               usuario.id,
        'email':            usuario.email,
        'nombre':           usuario.first_name,
        'apellido':         usuario.last_name,
        'telefono':         usuario.telefono,
        'fecha_nacimiento': usuario.fecha_nacimiento,
        'avatar_url':       usuario.avatar_url,
    })