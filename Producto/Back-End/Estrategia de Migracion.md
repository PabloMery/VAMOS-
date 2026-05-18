# Estrategia de Migración y Despliegue en la Nube: Proyecto VAMOS

## 1. Resumen Ejecutivo
Este documento detalla la migración de la infraestructura del proyecto **VAMOS** desde un entorno de desarrollo local hacia una arquitectura robusta en la nube utilizando **Amazon Web Services (AWS)**. El objetivo principal es garantizar la alta disponibilidad de los datos, la automatización de la captura de información y un ciclo de vida de desarrollo moderno mediante **CI/CD**.

---

## 2. Infraestructura Base (AWS VPC)
Para aislar y proteger los recursos, se configuró una **VPC (Virtual Private Cloud)**. Esta red lógica proporciona un entorno seguro donde residen nuestros servicios:

* **Segmentación de Red:** Se definieron subredes para separar el tráfico.
* **Seguridad de Acceso:** El acceso al servidor se realiza exclusivamente mediante autenticación por **Llaves SSH**, eliminando el uso de contraseñas vulnerables.
* **Security Groups (Firewalls Lógicos):** Se configuraron reglas estrictas para permitir solo el tráfico necesario:
  * Puerto `22` (SSH) para administración del servidor.
  * Puerto `8000` para la API REST de Django.
  * Puerto `5050` para la gestión de base de datos vía pgAdmin.

---

## 3. Estrategia de Contenedores: Docker & Orquestación
Se adoptó **Docker** como estándar de empaquetado para garantizar que el software funcione de manera idéntica en cualquier entorno ("Build once, run anywhere").

### Componentes de la Arquitectura
Mediante `docker-compose`, se orquestan los siguientes microservicios de forma simultánea:
1. **Base de Datos:** PostgreSQL con la extensión `pgvector` para soportar búsquedas semánticas basadas en Inteligencia Artificial.
2. **API REST:** Backend desarrollado en Django.
3. **Workers de IA:** Procesos en segundo plano dedicados a la generación de *embeddings* y descubrimiento de eventos.
4. **Gestión:** pgAdmin4 para la administración visual de los datos en producción.

---

## 4. Configuración del Entorno y Seguridad
Se implementó una política de **aislamiento de credenciales** para proteger los datos sensibles (API Keys de Gemini, Google Maps y credenciales de BD):

* **Inyección de Variables:** El archivo `.env` reside físicamente en la instancia de AWS y **nunca** se versiona en el repositorio de código (GitHub). Esto evita filtraciones accidentales de llaves maestras.
* **Ajustes de Código en Producción:** Se modificaron los scripts de Python para forzar la carga manual del entorno mediante `python-dotenv`, asegurando que el proceso de *Scraping* detecte las credenciales incluso cuando se ejecuta de forma aislada y automatizada por el sistema operativo.

---

## 5. Automatización de Datos (Cron Jobs)
Para mantener la plataforma actualizada sin intervención humana, se configuró un motor de tareas programadas nativo de Linux (**Cron**):

* **Programación:** Ejecución diaria automatizada a las **06:00 AM (Hora de Chile)**.
* **Flujo de Trabajo:** 1. El *Scraper* extrae la cartelera municipal directamente de la web.
  2. La **IA (Gemini)** estructura la data no formateada.
  3. El **Sincronizador** inyecta los resultados en PostgreSQL.
* **Resiliencia:** Uso de operadores lógicos (`&&`) para asegurar que el script de inyección en la base de datos solo se ejecute si la captura previa de datos web fue exitosa.
* **Auditoría:** Generación y concatenación automática de un archivo `vamos_cron.log` para monitorear el estado de salud de las capturas diarias y atrapar posibles códigos de error (ej. HTTP 503).

---

## 6. Pipeline de Despliegue Continuo (CI/CD)
Se implementó un flujo de **Despliegue Instantáneo** vinculando el repositorio de GitHub directamente con la instancia de AWS EC2:

### Configuración en GitHub
* **Deploy Keys:** Se generó una llave criptográfica SSH pública en el servidor y se registró en el repositorio para que la instancia tenga permisos de lectura seguros.
* **GitHub Secrets:** Se creó una bóveda encriptada en la configuración del repositorio para almacenar la IP pública del servidor y la llave privada `.pem`.

### Flujo de Despliegue Automático
Cada vez que un desarrollador realiza un comando `git push` hacia la rama `main`, se detona un **GitHub Action** que ejecuta los siguientes pasos sin intervención humana:
1. Se conecta automáticamente al servidor de AWS vía SSH disfrazándose de administrador.
2. Ingresa al directorio del proyecto y ejecuta un `git pull` para descargar los últimos cambios.
3. Actualiza el entorno, asegurando que la versión en vivo (producción) sea siempre la réplica exacta de la última versión estable del código.

---

## 7. Limitaciones y Consideraciones Futuras
* **IP Dinámica:** Actualmente, la IP del servidor cambia si la instancia se apaga o reinicia (comportamiento estándar de los laboratorios de AWS). En un entorno de producción real, se debe asignar una **Elastic IP** estática.
* **Escalabilidad Horizontal:** El sistema opera eficientemente en una instancia `t2.micro` para la fase de prototipo. Ante un alto volumen de usuarios, se sugiere migrar a una arquitectura balanceada (Load Balancers).
* **Certificados de Seguridad:** La conexión actual a la API se realiza por HTTP directo. Para el lanzamiento oficial, se requiere acoplar un dominio y emitir un certificado SSL/TLS (HTTPS) mediante Let's Encrypt o AWS Certificate Manager.