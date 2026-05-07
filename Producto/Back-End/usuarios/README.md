# 📋 VAMOS — Módulo de Usuarios & Autenticación

> **Última actualización:** Mayo 2026  
> **Estado:** ✅ Operativo en desarrollo (SQLite) — Pendiente migración a PostgreSQL con Docker

---

## 🏗️ ¿Qué hace este módulo?

Este módulo gestiona toda la identidad del usuario dentro de la app VAMOS. Cubre tres responsabilidades:

1. **Modelo de usuario extendido** — Extiende el sistema de autenticación de Django con campos propios de VAMOS.
2. **Autenticación con Google OAuth 2.0** — Permite que los usuarios inicien sesión con su cuenta Google desde la app Android.
3. **Emisión de JWT** — Una vez autenticado, el backend entrega un token propio para que la app móvil lo use en cada petición.

---

## 📁 Archivos del módulo

```
usuarios/
├── models.py        # Modelo UsuarioVAMOS (extiende AbstractUser)
├── views.py         # Endpoints: google_auth, perfil_usuario
├── urls.py          # Rutas del módulo
├── admin.py         # Configuración del panel de administración
├── pipeline.py      # Pipeline custom para guardar avatar de Google
├── apps.py
└── migrations/
    ├── 0001_initial.py
    └── 0002_usuariovamos_avatar_url_and_more.py
```

---

## 🗃️ Modelo: `UsuarioVAMOS`

Extiende `AbstractUser` de Django agregando los siguientes campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `fecha_nacimiento` | `DateField` | Fecha de nacimiento del usuario |
| `telefono` | `CharField(20)` | Número de teléfono (opcional) |
| `google_id` | `CharField(255)` | ID único entregado por Google al autenticar |
| `avatar_url` | `URLField` | URL de la foto de perfil obtenida desde Google |
| `categorias_preferidas` | `JSONField` | Lista de categorías de interés. Ej: `["Deportiva", "Cultura"]` |
| `notificaciones_activas` | `BooleanField` | Preferencia del usuario para recibir notificaciones push |

> Todos los campos nuevos son opcionales (`null=True`, `blank=True`) excepto `notificaciones_activas` que tiene `default=True`.

---

## 🔐 Flujo de Autenticación con Google (Android)

El flujo es diferente al OAuth web tradicional. En Android, Google Sign-In ocurre en el dispositivo:

```
App Android                 Backend Django               Google
     |                           |                          |
     |-- SDK Google Sign-In ---->|                          |
     |<-------- ID Token --------|                          |
     |                           |                          |
     |-- POST /auth/google/ ---->|                          |
     |   { id_token: "..." }     |                          |
     |                           |--- Verifica token ------>|
     |                           |<-- "Token válido" -------|
     |                           |                          |
     |                           | Busca o crea usuario     |
     |<------ JWT propio --------|                          |
     |                           |                          |
     | (usa JWT en headers)      |                          |
```

---

## 🌐 Endpoints disponibles

| Método | URL | Autenticación | Descripción |
|--------|-----|---------------|-------------|
| `POST` | `/api/usuarios/auth/google/` | Ninguna | Recibe `id_token` de Google, devuelve JWT |
| `POST` | `/api/usuarios/auth/refresh/` | Ninguna | Renueva el `access` token con el `refresh` token |
| `GET` | `/api/usuarios/perfil/` | JWT requerido | Devuelve los datos del usuario autenticado |

### Ejemplo: Login con Google

**Request:**
```json
POST /api/usuarios/auth/google/
{
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5c..."
}
```

**Response exitoso:**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "usuario": {
    "id": 1,
    "email": "usuario@gmail.com",
    "nombre": "Pablo",
    "apellido": "González",
    "avatar_url": "https://lh3.googleusercontent.com/..."
  }
}
```

### Ejemplo: Ver perfil

**Request:**
```http
GET /api/usuarios/perfil/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

**Response:**
```json
{
  "id": 1,
  "email": "usuario@gmail.com",
  "nombre": "Pablo",
  "apellido": "González",
  "telefono": null,
  "fecha_nacimiento": null,
  "avatar_url": "https://lh3.googleusercontent.com/..."
}
```

---

## ⚙️ Configuración requerida en `.env`

```env
# Django
DJANGO_SECRET_KEY=django-insecure-...

# Google OAuth
GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxx
GOOGLE_CLIENT_ID_ANDROID=xxxxxxxx.apps.googleusercontent.com   # Pendiente
```

> ⚠️ `GOOGLE_CLIENT_ID_ANDROID` se obtiene creando una credencial de tipo **Android** en Google Cloud Console. Requiere el SHA-1 del keystore de la app y el `applicationId` del `build.gradle`.

---

## 🔧 Configuración en `core/settings.py`

```python
INSTALLED_APPS = [
    ...
    'rest_framework',
    'social_django',
    'usuarios',
]

AUTHENTICATION_BACKENDS = [
    'social_core.backends.google.GoogleOAuth2',
    'django.contrib.auth.backends.ModelBackend',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS':  True,
}

AUTH_USER_MODEL = 'usuarios.UsuarioVAMOS'
```

---

## 📦 Dependencias

Agregadas a `requirements.txt`:

```
djangorestframework-simplejwt>=5.3
google-auth>=2.29
social-auth-app-django>=5.4
pgvector>=0.3.6
```

---

## 🗺️ Roadmap del módulo

- [x] Modelo `UsuarioVAMOS` con campos extendidos
- [x] Migraciones aplicadas correctamente
- [x] Endpoint de autenticación con Google (`/auth/google/`)
- [x] Emisión y renovación de JWT
- [x] Endpoint de perfil protegido
- [x] Panel de administración configurado
- [ ] Credencial Android en Google Cloud Console
- [ ] Integración con `@react-native-google-signin` en el frontend
- [ ] Endpoint para actualizar preferencias del usuario (`PATCH /perfil/`)
- [ ] Migración a PostgreSQL cuando Docker esté operativo
