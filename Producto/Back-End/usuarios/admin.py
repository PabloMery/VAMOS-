from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import UsuarioVAMOS

@admin.register(UsuarioVAMOS)
class UsuarioVAMOSAdmin(UserAdmin):
    # Columnas visibles en la lista de usuarios
    list_display = ('email', 'username', 'first_name', 'last_name', 'is_staff', 'notificaciones_activas')
    
    # Agregar los campos nuevos al formulario de edición
    fieldsets = UserAdmin.fieldsets + (
        ('Datos VAMOS', {
            'fields': ('telefono', 'fecha_nacimiento', 'avatar_url', 'google_id', 'categorias_preferidas', 'notificaciones_activas')
        }),
    )