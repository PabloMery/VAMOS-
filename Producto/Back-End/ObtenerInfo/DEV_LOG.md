# 📝 VAMOS - Bitácora de Desarrollo (Módulo ObtenerInfo)

## 🏗️ Arquitectura Actual
El módulo `ObtenerInfo` funciona como un **Data Pipeline de Ingesta**. Su objetivo no es ser la base de datos final, sino un *Staging Area* que limpia, estructura y normaliza datos desordenados de fuentes web para luego alimentar, mediante una API futura, a la Base de Datos central del proyecto VAMOS.

**Patrones de Diseño Implementados:**
- **Factory Method & Strategy:** Para inyectar dinámicamente configuraciones geográficas (comunas y diccionarios de alias) según el script que se ejecute.
- **Repository:** Para encapsular la lógica de persistencia (Upsert) del archivo JSON.
- **Batch Processing:** Para optimizar las llamadas a la IA (Gemini 2.5 Flash), enviando todos los eventos en un solo bloque para respetar las cuotas gratuitas (RPD).

---

## 🔄 Registro de Cambios (Changelog)

### [2026-04-16] - *Fundamentos y Geolocalización*
- **Añadido:** Integración inicial con Geopy (Nominatim) para coordenadas.
- **Cambio:** Reestructuración de carpetas. El JSON ahora se guarda en la carpeta compartida `/JSON` subiendo un nivel desde `/Scripts`.
- **Arreglo:** Corrección de `sys.path.append` para resolver errores de rutas al importar módulos compartidos desde la raíz.

### [2026-04-17] - *IA y Patrones de Diseño*
- **Añadido:** Pipeline de Inteligencia Artificial usando `google-genai` (Gemini 2.5 Flash). El parser de IA (`ai_parser.py`) ahora deduce horarios, recurrencias y categorías de texto libre.
- **Añadido:** Motor de expansión de fechas (`generar_fechas_evento`). Convierte plantillas recurrentes (ej. "Todo el mes") en objetos individuales por día para la base de datos.
- **Añadido:** Lógica de "Máquina de Estados" para rastrear la vida útil de un evento (`Activo`, `Finalizado`, `Cancelado`).
- **Añadido:** Diccionario manual (`alias_providencia.json`) para parchar intersecciones y esquinas que OpenStreetMap no reconoce.
- **Cambio:** Se pasó de una lógica de "Web Scraping duro" (Regex) a una estructura **Data-Driven** (Extracción -> IA -> Guardado JSON).
- **Seguridad:** Implementación de archivo `.env` para proteger la API Key de Gemini. Transición a claves de Google AI Studio (Capa Gratuita) para evitar sobrecostos en Google Cloud.


### [2026-04-18] - *Estabilización, Correcciones y Google Maps*
- **Añadido:** Migración del proveedor de geolocalización de Geopy (Nominatim) a la API oficial de **Google Maps** (`googlemaps`). Se logró un 100% de precisión en coordenadas para intersecciones y direcciones informales.
- **Seguridad:** Integración de `Maps_API_KEY` en el archivo `.env`. Se configuró para aprovechar la capa gratuita mensual de $200 USD (aprox. 40,000 consultas/mes), garantizando costo cero.
- **Arreglo (Bug Crítico):** Resolución del "Bug del ID Fantasma" (Schema Clash). Se amplió el generador de llaves primarias (`slug_nombre`) a 25 caracteres y se limpiaron palabras genéricas (ej. "Exposición") para evitar que eventos paralelos se sobreescribieran en el diccionario.
- **Cambio:** Purgado total del archivo histórico JSON antiguo para regenerar la base de datos limpia con la nueva estructura de IDs.
---

## 💡 Ideas y Próximos Pasos (Roadmap)
- [ ] **Desarrollo del Sincronizador:** Crear el script/API que leerá este `eventos_providencia.json` y hará los `POST`/`PUT` a la Base de Datos final de Django/PostgreSQL.
- [ ] **Sistema de Alertas (Fallback):** Implementar alertas o logs detallados en caso de que un evento no se suba (ej. porque Nominatim falló y no está en el diccionario de alias).
- [ ] **Resiliencia de Red:** Implementar el patrón de *Reintento Exponencial* (Exponential Backoff) en `ai_parser.py` para asegurar que el script no muera si la API de Gemini tiene una caída momentánea.
- [ ] **Empaquetado y Nube (Lift & Shift):** Crear un `Dockerfile` o configurar el script para AWS Lambda / Google Cloud Functions, permitiendo la ejecución desatendida mediante un Cronjob (ej. 06:00 AM diario).
- [ ] **Manejo de Secretos en Nube:** Migrar las variables del archivo `.env` local a un gestor de secretos (como AWS Secrets Manager o GitHub Secrets) para el entorno de producción.
---

## ❓ Dudas Resueltas (Archivo Histórico)
- **¿Cómo se manejan los eventos pasados?**
  *Resuelto:* Se implementó una lógica temporal que compara el ID del evento de ejecuciones pasadas. Si la fecha ya pasó, su estado cambia a `Finalizado`. Si el evento desaparece de la página web antes de su fecha, cambia a `Cancelado`.
- **¿Cómo se manejan los eventos que duran todo un mes o son recurrentes?**
  *Resuelto:* La IA extrae la regla (ej. `mensual`, `semanal`), y el motor de fechas en Python genera un registro JSON independiente por cada día que el evento esté activo en el mes.
- **¿Cómo se manejan los eventos que no tienen hora de inicio o fin?**
  *Resuelto:* La IA asigna un valor `null` a la hora y activa un flag booleano `"horario_variable": true` para que el Front-End sepa que debe mostrar un mensaje como "Revisar página" en lugar de un reloj.