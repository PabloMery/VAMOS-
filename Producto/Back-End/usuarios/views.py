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
from django.http import HttpResponse
from django.db import transaction
from django.shortcuts import get_object_or_404
from .models import Grupo, MiembroGrupo, EventoGuardado
from .serializers import GrupoSerializer, GrupoConMiembrosSerializer, MiembroGrupoSerializer

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
    
# ─── VISTAS DE EVENTOS GUARDADOS (SavedEventsContext) ───

class MisEventosGuardadosView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Separa los eventos guardados según la lógica de listas de tu amigo
        guardados = EventoGuardado.objects.filter(usuario=request.user, tipo='saved').values_list('evento_id', flat=True)
        confirmados = EventoGuardado.objects.filter(usuario=request.user, tipo='confirmed').values_list('evento_id', flat=True)
        
        return Response({
            "saved": list(guardados),
            "confirmed": list(confirmados)
        }, status=status.HTTP_200_OK)

class GuardarEventoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        evento_id = request.data.get('evento_id')
        tipo = request.data.get('tipo', 'saved') # 'saved' (me interesa) o 'confirmed' (vamos)

        if not evento_id:
            return Response({"error": "Falta el evento_id"}, status=status.HTTP_400_BAD_REQUEST)

        # Regla: Si ya está confirmado, no se puede bajar a la lista de guardados (confirmar > guardar)
        evento_existente = EventoGuardado.objects.filter(usuario=request.user, evento_id=evento_id).first()
        if evento_existente and evento_existente.tipo == 'confirmed' and tipo == 'saved':
            return Response({"message": "El evento ya está confirmado, prioridad superior."}, status=status.HTTP_200_OK)

        EventoGuardado.objects.update_or_create(
            usuario=request.user, evento_id=evento_id,
            defaults={'tipo': tipo}
        )
        return Response({"message": "Evento actualizado en listas"}, status=status.HTTP_201_CREATED)


# ─── VISTAS DE GRUPOS LOGÍSTICOS (groupApi.ts) ───

class CreateGroupView(APIView):
    """ Correspondiente a createGroup(eventoId) """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        evento_id = request.data.get('evento_id')
        if not evento_id:
            return Response({"error": "evento_id requerido"}, status=status.HTTP_400_BAD_REQUEST)

        # Regla de la Monogamia Logística: si ya tiene grupo para este evento, se retorna el existente
        miembro_existente = MiembroGrupo.objects.filter(usuario=request.user, grupo__evento_id=evento_id).first()
        if miembro_existente:
            serializer = GrupoConMiembrosSerializer(miembro_existente.grupo)
            return Response(serializer.data, status=status.HTTP_200_OK)

        with transaction.atomic():
            nuevo_grupo = Grupo.objects.create(creador=request.user, evento_id=evento_id)
            MiembroGrupo.objects.create(grupo=nuevo_grupo, usuario=request.user, estado='pendiente')
            
            # Al confirmar asistencia ("Vamos"), se actualiza automáticamente el listado correspondiente
            EventoGuardado.objects.update_or_create(usuario=request.user, evento_id=evento_id, defaults={'tipo': 'confirmed'})

        serializer = GrupoConMiembrosSerializer(nuevo_grupo)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class JoinGroupByCodeView(APIView):
    """ Correspondiente a joinGroupByCode(inviteCode) -> Regla de Fusión """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        invite_code = request.data.get('invite_code')
        if not invite_code:
            return Response({"error": "invite_code requerido"}, status=status.HTTP_400_BAD_REQUEST)

        grupo_destino = get_object_or_404(Grupo, invite_code=invite_code)
        
        with transaction.atomic():
            miembro_previo = MiembroGrupo.objects.filter(usuario=request.user, grupo__evento_id=grupo_destino.evento_id).first()
            
            if miembro_previo:
                grupo_viejo = miembro_previo.grupo
                if grupo_viejo.id == grupo_destino.id:
                    # RNF2: Idempotencia en la fusión
                    pass
                else:
                    # Regla de Fusión en Cascada: arrastrar todos los miembros de la mesa vieja a la nueva
                    MiembroGrupo.objects.filter(grupo=grupo_viejo).update(grupo=grupo_destino)
                    grupo_viejo.delete()
            else:
                MiembroGrupo.objects.create(grupo=grupo_destino, usuario=request.user, estado='pendiente')
                EventoGuardado.objects.update_or_create(usuario=request.user, evento_id=grupo_destino.evento_id, defaults={'tipo': 'confirmed'})

        serializer = GrupoConMiembrosSerializer(grupo_destino)
        return Response(serializer.data, status=status.HTTP_200_OK)

class GetMyGroupsView(APIView):
    """ Correspondiente a getMyGroups() """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        grupos = Grupo.objects.filter(miembros__usuario=request.user).distinct()
        serializer = GrupoSerializer(grupos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class GetGroupDetailView(APIView):
    """ Correspondiente a getGroupDetail(groupId) """
    permission_classes = [IsAuthenticated]

    def get(self, request, grupo_id):
        grupo = get_object_or_404(Grupo, id=grupo_id, miembros__usuario=request.user)
        serializer = GrupoConMiembrosSerializer(grupo)
        return Response(serializer.data, status=status.HTTP_200_OK)

class UpdateMyStatusView(APIView):
    """ Correspondiente a updateMyStatus(groupId, estado) -> Regla del Día Cero """
    permission_classes = [IsAuthenticated]

    def patch(self, request, grupo_id):
        nuevo_estado = request.data.get('estado')
        # Soporta exactamente la máquina de estados de tu amigo incluyendo 'esperando'
        estados_validos = ['pendiente', 'en_camino', 'llegue', 'cancelado', 'esperando']
        if nuevo_estado not in estados_validos:
            return Response({"error": "Estado inválido"}, status=status.HTTP_400_BAD_REQUEST)

        miembro = get_object_or_404(MiembroGrupo, grupo_id=grupo_id, usuario=request.user)
        
        # Validación temporal obligatoria con la base de datos externa de eventos
        try:
            evento = Evento.objects.using('eventos_db').get(id_externo=miembro.grupo.evento_id)
            hoy = timezone.now().date()
            es_hoy = FechaEvento.objects.using('eventos_db').filter(evento=evento, fecha=hoy).exists()

            if not es_hoy:
                return Response(
                    {"error": "Solo puedes modificar tu estado logístico el mismo día del evento."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Evento.DoesNotExist:
            return Response({"error": "El evento asociado no existe."}, status=status.HTTP_404_NOT_FOUND)

        miembro.estado = nuevo_estado
        miembro.save()
        
        serializer = MiembroGrupoSerializer(miembro)
        return Response(serializer.data, status=status.HTTP_200_OK)

class LeaveGroupView(APIView):
    """ Correspondiente a leaveGroup(groupId) -> Regla de Separación de Baja """
    permission_classes = [IsAuthenticated]

    def delete(self, request, grupo_id):
        miembro = get_object_or_404(MiembroGrupo, grupo_id=grupo_id, usuario=request.user)
        grupo = miembro.grupo
        
        with transaction.atomic():
            miembro.delete()
            # Remueve completamente la relación del evento de la lista del usuario
            EventoGuardado.objects.filter(usuario=request.user, evento_id=grupo.evento_id).delete()

            # Si la mesa logística se queda vacía, se destruye el grupo
            if not grupo.miembros.exists():
                grupo.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── ENDPOINT DE PREVISUALIZACIÓN WEB (WhatsApp / Instagram) ───

@api_view(['GET'])
@permission_classes([AllowAny])
def renderizar_tarjeta_whatsapp(request, invite_code):
    grupo = get_object_or_404(Grupo, invite_code=invite_code)
    
    try:
        evento = Evento.objects.using('eventos_db').get(id_externo=grupo.evento_id)
        titulo = f"¡Vamos juntos a {evento.nombre_evento}!"
        imagen_url = evento.imagen_url if evento.imagen_url else "https://tu-dominio.com/logo-default.png"
    except Evento.DoesNotExist:
        titulo = "¡Te han invitado a un evento en VAMOS!"
        imagen_url = "https://tu-dominio.com/logo-default.png"

    html = f"""
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>{titulo}</title>
        <meta property="og:title" content="{titulo}" />
        <meta property="og:description" content="Únete a mi grupo logístico en la app VAMOS para coordinar la asistencia." />
        <meta property="og:image" content="{imagen_url}" />
        <meta property="og:type" content="website" />
        <script>
            window.location.replace("vamosapp://invite/{invite_code}");
        </script>
      </head>
      <body style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h2>{titulo}</h2>
        <p>Redirigiendo a la aplicación VAMOS...</p>
      </body>
    </html>
    """
    return HttpResponse(html)