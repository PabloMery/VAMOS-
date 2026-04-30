# Usamos una versión ligera de Python optimizada para contenedores
FROM python:3.11-slim

# Le decimos a Docker que trabaje dentro de la carpeta /app
WORKDIR /app

# Evita que Python genere archivos basura (.pyc) y muestra los logs en tiempo real
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Copiamos primero la lista de dependencias e instalamos
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos el resto de tu código al contenedor
COPY . .