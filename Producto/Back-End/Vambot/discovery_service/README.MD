# [29/04/26] Agente RAG de Eventos Municipales — MVP V2.0

Asistente conversacional inteligente diseñado para la búsqueda y recomendación de eventos municipales utilizando una arquitectura de **Generación Aumentada por Recuperación (RAG)**. El sistema utiliza inteligencia artificial para entender consultas en lenguaje natural y cruzarlas con una base de datos vectorial.

## 🏗️ Arquitectura del Sistema

El proyecto se divide en microservicios para garantizar la escalabilidad:

1.  **Service A — Orquestador (Node.js/Fastify):** Gestiona las sesiones de usuario y la comunicación con la App Móvil.
2.  **Service B — Discovery Service (Python/FastAPI):** El "cerebro" del sistema. Realiza búsquedas semánticas y genera respuestas utilizando Google Gemini.
3.  **Worker Asíncrono (Python):** Proceso independiente encargado de la vectorización de eventos en segundo plano.
4.  **Base de Datos (PostgreSQL + pgvector):** Almacenamiento relacional y vectorial ejecutado sobre Docker.

## 🚀 Tecnologías Principales

* **IA:** Google Gemini (`gemini-embedding-001` y `gemini-1.5-flash`).
* **Backend:** Python 3.12, FastAPI.
* **Base de Datos:** PostgreSQL con extensión `pgvector`.
* **Contenedores:** Docker & Docker Compose.

## 📋 Requisitos Previos

* Docker Desktop
* Python 3.12
* Una API Key de Google AI Studio

## 🛠️ Instalación y Configuración

### 1. Clonar y Configurar Infraestructura (Docker)
Levanta la base de datos:
```bash
docker-compose up -d
```

### 2. Configuración del Discovery Service (Python)
Navega a la carpeta del servicio y configura el entorno:
```bash
cd discovery_service
python -3.12 -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

Crea el archivo `.env` en `discovery_service/`:
```env
DJANGO_SECRET_KEY=django-insecure-clave-desarrollo-1234567890abcdef

# --- BASE DE DATOS (Red Interna de Docker) ---
# DB_HOST DEBE ser 'db' para que Node, Django y FastAPI la encuentren
DB_HOST=db
DB_PORT=5432
DB_NAME=vamos_eventos
DB_USER=vamos_admin
DB_PASSWORD=vamos_secreto
DB_PASS=vamos_secreto 

# --- NODE.JS ORQUESTADOR (Service A) ---
PORT=3000
HOST=0.0.0.0
DISCOVERY_SERVICE_URL=http://discovery:8001

# --- IA VAMBOT (Discovery Service & Worker) ---
IDIOMA=español
RAG_TOP_N=5
SYNC_FRESHNESS_THRESHOLD_HOURS=24
SESSION_TIMEOUT_MINUTES=20
GEO_FALLBACK_RADIUS_KM=5
DB_POOL_MIN=2
DB_POOL_MAX=10
```

## ⚙️ Ejecución de los Servicios

### A. El Worker de Ingesta (Segundo Plano)
El worker debe estar corriendo constantemente para procesar nuevos eventos que lleguen a la base de datos sin vectorizar:
```bash
# Asegúrate de tener el venv activo
python worker_embeddings.py
```

### B. El Endpoint RAG (Cerebro Semántico)
Para levantar la API que recibe consultas de los usuarios y genera respuestas:
```bash
# En una terminal nueva, con el venv activo
python main.py
```
El servidor se iniciará en `http://localhost:8000`.

### C. Prueba Rápida (Swagger UI)
FastAPI genera una interfaz de pruebas automática. Una vez que `main.py` esté corriendo:
1. Abre tu navegador en: `http://localhost:8000/docs`
2. Ve al endpoint `POST /ask` y haz clic en **"Try it out"**.
3. Envía un JSON de prueba:
```json
   {
     "mensaje": "¿Hay alguna actividad deportiva en Providencia?"
   }
```
4. El sistema devolverá la respuesta redactada por Gemini y la lista de eventos encontrados.

## 🗺️ Roadmap MVP
- [x] Diseño de Arquitectura V2.0.
- [x] Infraestructura de Base de Datos Vectorial.
- [x] Worker de Embeddings Asíncrono.
- [x] Implementación de Endpoint RAG (Discovery Service).
- [x] Manejo de errores granular (BD y Gemini API).
- [x] Guardrails del chatbot (restricciones al LLM).
- [x] Connection pooling en Discovery Service.
- [x] Worker de embeddings actualizado (sin `descripcion`, logging, rate limit inteligente).
- [ ] Orquestador de Sesiones (Node.js).
- [ ] Integración con App Móvil (React Native).