from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.conf import settings
from .models import UsuarioVAMOS
from eventos.models import Evento, FechaEvento
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import AsistenciaEvento
from .serializers import AsistenciaEventoSerializer

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
            'es_nuevo':   creado,
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

class ActualizarEstadoAsistenciaView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AsistenciaEventoSerializer(data=request.data)
        
        if serializer.is_valid():
            evento_id = serializer.validated_data['evento_id']
            nuevo_estado = serializer.validated_data['estado']
            
            try:
                # 1. Verificamos que el evento exista
                evento = Evento.objects.using('eventos_db').get(id_externo=evento_id)
                
                # 2. VALIDACIÓN ESTRELLA: ¿Alguna de las fechas de este evento es HOY?
                hoy = timezone.now().date()
                
                es_hoy = FechaEvento.objects.using('eventos_db').filter(
                    evento=evento, 
                    fecha=hoy
                ).exists()

                if not es_hoy:
                    return Response(
                        {"error": "Aún no es el día del evento o el evento ya pasó. Solo puedes cambiar tu estado el mismo día."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # 3. Guardar el estado si pasó la prueba
                asistencia, created = AsistenciaEvento.objects.update_or_create(
                    usuario=request.user,
                    evento_id=evento_id,
                    defaults={'estado': nuevo_estado}
                )

                return Response({
                    "message": "Estado actualizado correctamente",
                    "estado": asistencia.estado
                }, status=status.HTTP_200_OK)

            except Evento.DoesNotExist:
                return Response({"error": "El evento no existe en la base de datos."}, status=status.HTTP_404_NOT_FOUND)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)