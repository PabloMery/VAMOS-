def guardar_avatar_google(backend, user, response, *args, **kwargs):
    """
    Guarda la foto de perfil de Google en nuestro campo avatar_url.
    Solo se ejecuta si el proveedor es Google.
    """
    if backend.name == 'google-oauth2':
        avatar = response.get('picture')
        if avatar and not user.avatar_url:
            user.avatar_url = avatar
            user.save()